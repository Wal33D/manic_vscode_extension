import * as vscode from 'vscode';

/**
 * Event Bus for component communication
 * Implements a centralized event system with type safety and performance optimizations
 */
export class EventBus {
  private static instance: EventBus;
  private events: Map<string, Set<EventHandler>> = new Map();
  private eventHistory: EventHistoryEntry[] = [];
  private maxHistorySize: number = 100;
  private wildcardHandlers: Set<WildcardHandler> = new Set();
  private middlewares: Middleware[] = [];
  private eventQueue: QueuedEvent[] = [];
  private isProcessingQueue: boolean = false;
  private debugMode: boolean = false;

  // Performance tracking
  private eventMetrics: Map<string, EventMetrics> = new Map();

  private constructor() {
    // Initialize debug mode from configuration
    const config = vscode.workspace.getConfiguration('manicMiners');
    this.debugMode = config.get('debug.eventBus', false);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event
   */
  public on<T = any>(
    event: string,
    handler: EventHandler<T>,
    options?: SubscriptionOptions
  ): Unsubscribe {
    // Validate event name
    if (!event || typeof event !== 'string') {
      throw new Error('Event name must be a non-empty string');
    }

    // Create handler wrapper with options
    const wrappedHandler: EventHandler<T> = {
      callback: handler.callback || (handler as any),
      context: handler.context || options?.context,
      once: handler.once || options?.once || false,
      priority: handler.priority || options?.priority || 0,
      filter: handler.filter || options?.filter,
      id: Symbol('handler'),
    };

    // Add to event handlers
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    const handlers = this.events.get(event)!;
    handlers.add(wrappedHandler);

    // Sort handlers by priority
    this.sortHandlersByPriority(event);

    // Log subscription if debug mode
    if (this.debugMode) {
      console.log(`[EventBus] Subscribed to '${event}'`);
    }

    // Return unsubscribe function
    return () => {
      handlers.delete(wrappedHandler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    };
  }

  /**
   * Subscribe to an event once
   */
  public once<T = any>(
    event: string,
    handler: ((data: T) => void) | EventHandler<T>,
    context?: any
  ): Unsubscribe {
    const wrappedHandler: EventHandler<T> =
      typeof handler === 'function'
        ? { callback: handler, once: true, context }
        : { ...handler, once: true, context: context || handler.context };
    return this.on(event, wrappedHandler);
  }

  /**
   * Emit an event
   */
  public emit<T = any>(event: string, data?: T, options?: EmitOptions): void {
    // Run through middlewares
    let shouldContinue = true;
    let modifiedData = data;

    for (const middleware of this.middlewares) {
      const result = middleware({ event, data: modifiedData, timestamp: Date.now() });
      if (result === false) {
        shouldContinue = false;
        break;
      }
      if (result !== undefined && result !== true) {
        modifiedData = result.data;
      }
    }

    if (!shouldContinue) {
      if (this.debugMode) {
        console.log(`[EventBus] Event '${event}' blocked by middleware`);
      }
      return;
    }

    // Add to queue if specified
    if (options?.queue) {
      this.enqueueEvent(event, modifiedData, options);
      return;
    }

    // Emit immediately
    this.emitNow(event, modifiedData, options);
  }

  /**
   * Emit event immediately
   */
  private emitNow<T = any>(event: string, data?: T, options?: EmitOptions): void {
    const startTime = performance.now();

    // Add to history
    this.addToHistory(event, data);

    // Get handlers for this event
    const handlers = this.events.get(event);
    const allHandlers: EventHandler[] = [];

    // Add specific event handlers
    if (handlers) {
      allHandlers.push(...Array.from(handlers));
    }

    // Add wildcard handlers
    for (const wildcardHandler of this.wildcardHandlers) {
      if (this.matchesPattern(event, wildcardHandler.pattern)) {
        allHandlers.push(wildcardHandler);
      }
    }

    // Sort all handlers by priority
    allHandlers.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Execute handlers
    let handlerCount = 0;
    const errors: Error[] = [];

    for (const handler of allHandlers) {
      try {
        // Apply filter if present
        if (handler.filter && !handler.filter(data)) {
          continue;
        }

        // Call handler
        if (handler.context) {
          handler.callback.call(handler.context, data, event);
        } else {
          handler.callback(data, event);
        }

        handlerCount++;

        // Remove if once
        if (handler.once) {
          if (handlers) {
            handlers.delete(handler);
          } else {
            this.wildcardHandlers.delete(handler as WildcardHandler);
          }
        }

        // Stop propagation if requested
        if (options?.stopPropagation) {
          break;
        }
      } catch (error) {
        errors.push(error as Error);
        if (this.debugMode) {
          console.error(`[EventBus] Error in handler for '${event}':`, error);
        }
      }
    }

    // Update metrics
    this.updateMetrics(event, performance.now() - startTime, handlerCount, errors.length);

    // Log if debug mode
    if (this.debugMode) {
      console.log(
        `[EventBus] Emitted '${event}' to ${handlerCount} handlers in ${performance.now() - startTime}ms`
      );
    }
  }

  /**
   * Subscribe to all events matching a pattern
   */
  public onPattern(
    pattern: string | RegExp,
    handler: EventHandler,
    options?: SubscriptionOptions
  ): Unsubscribe {
    const wildcardHandler: WildcardHandler = {
      pattern,
      callback: handler.callback || (handler as any),
      context: handler.context || options?.context,
      once: handler.once || options?.once || false,
      priority: handler.priority || options?.priority || 0,
      filter: handler.filter || options?.filter,
      id: Symbol('wildcard'),
    };

    this.wildcardHandlers.add(wildcardHandler);

    return () => {
      this.wildcardHandlers.delete(wildcardHandler);
    };
  }

  /**
   * Remove all listeners for an event
   */
  public off(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
      this.wildcardHandlers.clear();
    }
  }

  /**
   * Add middleware
   */
  public use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Wait for an event
   */
  public async waitFor<T = any>(
    event: string,
    timeout?: number,
    filter?: (data: T) => boolean
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined;

      const unsubscribe = this.once(event, (data: T) => {
        if (filter && !filter(data)) {
          // Re-subscribe if filter doesn't match
          unsubscribe();
          this.waitFor(event, timeout, filter).then(resolve).catch(reject);
          return;
        }

        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        resolve(data);
      });

      if (timeout) {
        timeoutId = setTimeout(() => {
          unsubscribe();
          reject(new Error(`Timeout waiting for event '${event}'`));
        }, timeout);
      }
    });
  }

  /**
   * Create a typed event emitter
   */
  public createTypedEmitter<T extends Record<string, any>>(): TypedEventEmitter<T> {
    return {
      on: <K extends keyof T>(
        event: K,
        handler: (data: T[K]) => void,
        options?: SubscriptionOptions
      ) => {
        const wrappedHandler: EventHandler<T[K]> = { callback: handler };
        return this.on(event as string, wrappedHandler, options);
      },
      once: <K extends keyof T>(event: K, handler: (data: T[K]) => void) => {
        return this.once(event as string, handler);
      },
      emit: <K extends keyof T>(event: K, data: T[K], options?: EmitOptions) => {
        this.emit(event as string, data, options);
      },
      off: (event?: keyof T) => {
        this.off(event as string);
      },
    };
  }

  /**
   * Get event history
   */
  public getHistory(event?: string, limit?: number): EventHistoryEntry[] {
    let history = this.eventHistory;

    if (event) {
      history = history.filter(entry => entry.event === event);
    }

    if (limit) {
      history = history.slice(-limit);
    }

    return history;
  }

  /**
   * Get event metrics
   */
  public getMetrics(event?: string): Record<string, EventMetrics> {
    if (event) {
      const metrics = this.eventMetrics.get(event);
      return metrics ? { [event]: metrics } : {};
    }

    return Object.fromEntries(this.eventMetrics);
  }

  /**
   * Clear metrics
   */
  public clearMetrics(event?: string): void {
    if (event) {
      this.eventMetrics.delete(event);
    } else {
      this.eventMetrics.clear();
    }
  }

  /**
   * Enable/disable debug mode
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Enqueue event for batch processing
   */
  private enqueueEvent<T = any>(event: string, data?: T, options?: EmitOptions): void {
    this.eventQueue.push({
      event,
      data,
      options,
      timestamp: Date.now(),
    });

    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Process queued events
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    // Process in batches
    const batchSize = 10;

    while (this.eventQueue.length > 0) {
      const batch = this.eventQueue.splice(0, batchSize);

      // Process batch
      await Promise.resolve(); // Allow other operations

      for (const queuedEvent of batch) {
        this.emitNow(queuedEvent.event, queuedEvent.data, queuedEvent.options);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Sort handlers by priority
   */
  private sortHandlersByPriority(event: string): void {
    const handlers = this.events.get(event);
    if (!handlers) {
      return;
    }

    const sorted = Array.from(handlers).sort((a, b) => (b.priority || 0) - (a.priority || 0));
    this.events.set(event, new Set(sorted));
  }

  /**
   * Check if event matches pattern
   */
  private matchesPattern(event: string, pattern: string | RegExp): boolean {
    if (pattern instanceof RegExp) {
      return pattern.test(event);
    }

    // Simple wildcard matching
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return regex.test(event);
  }

  /**
   * Add event to history
   */
  private addToHistory<T = any>(event: string, data?: T): void {
    this.eventHistory.push({
      event,
      data,
      timestamp: Date.now(),
    });

    // Limit history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Update event metrics
   */
  private updateMetrics(
    event: string,
    duration: number,
    handlerCount: number,
    errorCount: number
  ): void {
    let metrics = this.eventMetrics.get(event);

    if (!metrics) {
      metrics = {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        handlerCount: 0,
        errorCount: 0,
        lastEmitted: 0,
      };
      this.eventMetrics.set(event, metrics);
    }

    metrics.count++;
    metrics.totalDuration += duration;
    metrics.averageDuration = metrics.totalDuration / metrics.count;
    metrics.minDuration = Math.min(metrics.minDuration, duration);
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
    metrics.handlerCount = handlerCount;
    metrics.errorCount += errorCount;
    metrics.lastEmitted = Date.now();
  }

  /**
   * Create a scoped event bus
   */
  public createScope(prefix: string): ScopedEventBus {
    return {
      on: <T = any>(event: string, handler: EventHandler<T>, options?: SubscriptionOptions) => {
        return this.on(`${prefix}:${event}`, handler, options);
      },
      once: <T = any>(event: string, handler: (data: T) => void) => {
        return this.once(`${prefix}:${event}`, handler);
      },
      emit: <T = any>(event: string, data?: T, options?: EmitOptions) => {
        this.emit(`${prefix}:${event}`, data, options);
      },
      off: (event?: string) => {
        if (event) {
          this.off(`${prefix}:${event}`);
        } else {
          // Remove all events with this prefix
          for (const [eventName] of this.events) {
            if (eventName.startsWith(`${prefix}:`)) {
              this.events.delete(eventName);
            }
          }
        }
      },
    };
  }
}

// Type definitions
export interface EventHandler<T = any> {
  callback: (data: T, event?: string) => void;
  context?: any;
  once?: boolean;
  priority?: number;
  filter?: (data: T) => boolean;
  id?: symbol;
}

interface WildcardHandler extends EventHandler {
  pattern: string | RegExp;
}

export interface SubscriptionOptions {
  once?: boolean;
  context?: any;
  priority?: number;
  filter?: (data: any) => boolean;
}

export interface EmitOptions {
  queue?: boolean;
  stopPropagation?: boolean;
}

export type Middleware = (event: MiddlewareEvent) => boolean | void | { data: any };

interface MiddlewareEvent {
  event: string;
  data: any;
  timestamp: number;
}

interface EventHistoryEntry {
  event: string;
  data: any;
  timestamp: number;
}

interface QueuedEvent {
  event: string;
  data: any;
  options?: EmitOptions;
  timestamp: number;
}

interface EventMetrics {
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  handlerCount: number;
  errorCount: number;
  lastEmitted: number;
}

export type Unsubscribe = () => void;

export interface TypedEventEmitter<T extends Record<string, any>> {
  on<K extends keyof T>(
    event: K,
    handler: (data: T[K]) => void,
    options?: SubscriptionOptions
  ): Unsubscribe;
  once<K extends keyof T>(event: K, handler: (data: T[K]) => void): Unsubscribe;
  emit<K extends keyof T>(event: K, data: T[K], options?: EmitOptions): void;
  off(event?: keyof T): void;
}

export interface ScopedEventBus {
  on<T = any>(event: string, handler: EventHandler<T>, options?: SubscriptionOptions): Unsubscribe;
  once<T = any>(event: string, handler: (data: T) => void): Unsubscribe;
  emit<T = any>(event: string, data?: T, options?: EmitOptions): void;
  off(event?: string): void;
}

// Export singleton instance
export const eventBus = EventBus.getInstance();

// Common event types for type safety
export interface WorkspaceEvents {
  'workspace:mapLoaded': { path: string; data: any };
  'workspace:mapSaved': { path: string };
  'workspace:toolChanged': { tool: string; previousTool: string };
  'workspace:selectionChanged': { selection: any };
  'workspace:zoomChanged': { level: number; viewport: any };
  'workspace:themeChanged': { theme: string };
  'workspace:panelResized': { panel: string; size: number };
  'workspace:presetApplied': { preset: string };
}

export interface EditorEvents {
  'editor:tileChanged': { x: number; y: number; tile: any };
  'editor:undoPerformed': { action: any };
  'editor:redoPerformed': { action: any };
  'editor:brushChanged': { size: number; shape: string };
  'editor:layerToggled': { layer: string; visible: boolean };
}

export interface DashboardEvents {
  'dashboard:actionExecuted': { action: string; result: any };
  'dashboard:searchPerformed': { query: string; results: any[] };
  'dashboard:widgetToggled': { widget: string; visible: boolean };
  'dashboard:notificationAdded': { notification: any };
  'dashboard:statsUpdated': { stats: any };
}

// Create typed event emitters for different domains
export const workspaceEvents = eventBus.createTypedEmitter<WorkspaceEvents>();
export const editorEvents = eventBus.createTypedEmitter<EditorEvents>();
export const dashboardEvents = eventBus.createTypedEmitter<DashboardEvents>();
