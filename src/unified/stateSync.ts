// import * as vscode from 'vscode';
import { eventBus } from './eventBus.js';
import { debounce } from '../utils/debounce.js';

/**
 * State Synchronization Manager
 * Keeps all components in sync using the event bus and shared state
 */
export class StateSync {
  private static instance: StateSync;
  private syncedState: Map<string, SyncedStateEntry> = new Map();
  private stateSubscribers: Map<string, Set<StateSubscriber>> = new Map();
  private pendingUpdates: Map<string, any> = new Map();
  // private updateScheduled: boolean = false;
  private conflictResolvers: Map<string, ConflictResolver> = new Map();
  private stateHistory: StateHistoryEntry[] = [];
  private maxHistorySize: number = 50;

  // Performance optimization
  private readonly batchUpdates: () => void;
  private readonly syncDebounced: Map<string, () => void> = new Map();

  // State versioning for optimistic updates
  private stateVersions: Map<string, number> = new Map();

  private constructor() {
    this.batchUpdates = debounce(() => this.processPendingUpdates(), 16); // 60fps
    this.setupEventListeners();
    this.registerDefaultResolvers();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): StateSync {
    if (!StateSync.instance) {
      StateSync.instance = new StateSync();
    }
    return StateSync.instance;
  }

  /**
   * Register a state key for synchronization
   */
  public registerState<T>(key: string, initialValue: T, options?: StateOptions): void {
    this.syncedState.set(key, {
      value: initialValue,
      version: 0,
      lastUpdated: Date.now(),
      source: 'system',
      locked: false,
      validators: options?.validators || [],
      transforms: options?.transforms || [],
      persistent: options?.persistent || false,
    });

    this.stateVersions.set(key, 0);

    // Create debounced sync function for this key
    this.syncDebounced.set(
      key,
      debounce(() => {
        this.broadcastStateChange(key);
      }, options?.debounceMs || 100)
    );

    // Load from storage if persistent
    if (options?.persistent) {
      this.loadPersistedState(key);
    }
  }

  /**
   * Get state value
   */
  public getState<T>(key: string): T | undefined {
    const entry = this.syncedState.get(key);
    return entry?.value as T;
  }

  /**
   * Set state value
   */
  public setState<T>(
    key: string,
    value: T | ((prev: T) => T),
    source: string = 'unknown'
  ): boolean {
    const entry = this.syncedState.get(key);
    if (!entry) {
      console.warn(`State key '${key}' not registered`);
      return false;
    }

    // Check if state is locked
    if (entry.locked && source !== entry.lockedBy) {
      console.warn(`State '${key}' is locked by ${entry.lockedBy}`);
      return false;
    }

    // Calculate new value
    let newValue: T;
    if (typeof value === 'function') {
      newValue = (value as Function)(entry.value);
    } else {
      newValue = value;
    }

    // Validate new value
    for (const validator of entry.validators) {
      const error = validator(newValue);
      if (error) {
        console.error(`Validation failed for state '${key}': ${error}`);
        return false;
      }
    }

    // Apply transforms
    for (const transform of entry.transforms) {
      newValue = transform(newValue);
    }

    // Check for actual change
    if (this.deepEqual(entry.value, newValue)) {
      return true; // No change needed
    }

    // Add to pending updates
    this.pendingUpdates.set(key, {
      value: newValue,
      source,
      timestamp: Date.now(),
    });

    // Schedule batch update
    this.batchUpdates();

    return true;
  }

  /**
   * Subscribe to state changes
   */
  public subscribe<T>(
    key: string,
    callback: StateCallback<T>,
    options?: SubscribeOptions
  ): Unsubscribe {
    const subscriber: StateSubscriber = {
      callback: callback as StateCallback<any>,
      filter: options?.filter,
      immediate: options?.immediate || false,
      id: Symbol('subscriber'),
    };

    if (!this.stateSubscribers.has(key)) {
      this.stateSubscribers.set(key, new Set());
    }

    this.stateSubscribers.get(key)!.add(subscriber);

    // Call immediately if requested
    if (subscriber.immediate) {
      const currentValue = this.getState<T>(key);
      if (currentValue !== undefined) {
        callback(currentValue, undefined, key);
      }
    }

    // Return unsubscribe function
    return () => {
      const subscribers = this.stateSubscribers.get(key);
      if (subscribers) {
        subscribers.delete(subscriber);
        if (subscribers.size === 0) {
          this.stateSubscribers.delete(key);
        }
      }
    };
  }

  /**
   * Create computed state
   */
  public createComputed<T>(key: string, dependencies: string[], compute: ComputeFunction<T>): void {
    // Initial computation
    const computeAndSet = () => {
      const depValues = dependencies.map(dep => this.getState(dep));
      const result = compute(...depValues);
      this.setState(key, result, 'computed');
    };

    // Subscribe to all dependencies
    for (const dep of dependencies) {
      this.subscribe(dep, () => computeAndSet());
    }

    // Compute initial value
    computeAndSet();
  }

  /**
   * Lock state for exclusive access
   */
  public lockState(key: string, owner: string): boolean {
    const entry = this.syncedState.get(key);
    if (!entry) {
      return false;
    }

    if (entry.locked && entry.lockedBy !== owner) {
      return false;
    }

    entry.locked = true;
    entry.lockedBy = owner;

    // Emit lock event
    eventBus.emit('state:locked', { key, owner });

    return true;
  }

  /**
   * Unlock state
   */
  public unlockState(key: string, owner: string): boolean {
    const entry = this.syncedState.get(key);
    if (!entry) {
      return false;
    }

    if (!entry.locked || entry.lockedBy !== owner) {
      return false;
    }

    entry.locked = false;
    delete entry.lockedBy;

    // Emit unlock event
    eventBus.emit('state:unlocked', { key, owner });

    return true;
  }

  /**
   * Register conflict resolver
   */
  public registerConflictResolver(key: string, resolver: ConflictResolver): void {
    this.conflictResolvers.set(key, resolver);
  }

  /**
   * Create state proxy for easier access
   */
  public createProxy<T extends Record<string, any>>(): T {
    return new Proxy({} as T, {
      get: (_target, prop: string) => {
        return this.getState(prop);
      },
      set: (_target, prop: string, value) => {
        return this.setState(prop, value, 'proxy');
      },
    });
  }

  /**
   * Get state history
   */
  public getHistory(key?: string): StateHistoryEntry[] {
    if (key) {
      return this.stateHistory.filter(entry => entry.key === key);
    }
    return [...this.stateHistory];
  }

  /**
   * Clear state
   */
  public clearState(key?: string): void {
    if (key) {
      this.syncedState.delete(key);
      this.stateSubscribers.delete(key);
      this.pendingUpdates.delete(key);
      this.stateVersions.delete(key);
    } else {
      this.syncedState.clear();
      this.stateSubscribers.clear();
      this.pendingUpdates.clear();
      this.stateVersions.clear();
    }
  }

  /**
   * Export state for debugging
   */
  public exportState(): Record<string, any> {
    const state: Record<string, any> = {};

    for (const [key, entry] of this.syncedState) {
      state[key] = {
        value: entry.value,
        version: entry.version,
        locked: entry.locked,
        lockedBy: entry.lockedBy,
        lastUpdated: entry.lastUpdated,
        source: entry.source,
      };
    }

    return state;
  }

  /**
   * Setup event listeners for cross-component sync
   */
  private setupEventListeners(): void {
    // Map editor events
    eventBus.on('editor:toolChanged', {
      callback: (data: any) => {
        this.setState('currentTool', data.tool, 'editor');
      },
    });

    eventBus.on('editor:selectionChanged', {
      callback: (data: any) => {
        this.setState('selection', data.selection, 'editor');
      },
    });

    eventBus.on('editor:zoomChanged', {
      callback: (data: any) => {
        this.setState('zoomLevel', data.level, 'editor');
        this.setState('viewport', data.viewport, 'editor');
      },
    });

    // Dashboard events
    eventBus.on('dashboard:presetApplied', {
      callback: (data: any) => {
        this.setState('activePreset', data.preset, 'dashboard');
      },
    });

    eventBus.on('dashboard:themeChanged', {
      callback: (data: any) => {
        this.setState('theme', data.theme, 'dashboard');
      },
    });

    // Workspace events
    eventBus.on('workspace:mapLoaded', {
      callback: (data: any) => {
        this.setState('currentMap', data.path, 'workspace');
        this.setState('mapData', data.data, 'workspace');
      },
    });

    eventBus.on('workspace:panelResized', {
      callback: (data: any) => {
        const panels = this.getState<Record<string, number>>('panelSizes') || {};
        panels[data.panel] = data.size;
        this.setState('panelSizes', panels, 'workspace');
      },
    });
  }

  /**
   * Process pending updates in batch
   */
  private processPendingUpdates(): void {
    if (this.pendingUpdates.size === 0) {
      return;
    }

    const updates = new Map(this.pendingUpdates);
    this.pendingUpdates.clear();

    for (const [key, update] of updates) {
      const entry = this.syncedState.get(key);
      if (!entry) {
        continue;
      }

      // Check for conflicts
      if (entry.version > (this.stateVersions.get(key) || 0)) {
        const resolver = this.conflictResolvers.get(key);
        if (resolver) {
          update.value = resolver(entry.value, update.value, {
            localVersion: this.stateVersions.get(key) || 0,
            remoteVersion: entry.version,
            source: update.source,
          });
        }
      }

      // Update state
      const oldValue = entry.value;
      entry.value = update.value;
      entry.version++;
      entry.lastUpdated = update.timestamp;
      entry.source = update.source;

      // Update version
      this.stateVersions.set(key, entry.version);

      // Add to history
      this.addToHistory(key, oldValue, update.value, update.source);

      // Notify subscribers
      this.notifySubscribers(key, update.value, oldValue);

      // Persist if needed
      if (entry.persistent) {
        this.persistState(key, update.value);
      }

      // Trigger debounced broadcast
      this.syncDebounced.get(key)?.();
    }
  }

  /**
   * Broadcast state change to other components
   */
  private broadcastStateChange(key: string): void {
    const entry = this.syncedState.get(key);
    if (!entry) {
      return;
    }

    eventBus.emit('state:changed', {
      key,
      value: entry.value,
      version: entry.version,
      source: entry.source,
    });
  }

  /**
   * Notify subscribers of state change
   */
  private notifySubscribers<T>(key: string, newValue: T, oldValue: T): void {
    const subscribers = this.stateSubscribers.get(key);
    if (!subscribers) {
      return;
    }

    for (const subscriber of subscribers) {
      try {
        // Apply filter if present
        if (subscriber.filter && !subscriber.filter(newValue, oldValue)) {
          continue;
        }

        subscriber.callback(newValue, oldValue, key);
      } catch (error) {
        console.error(`Error in state subscriber for '${key}':`, error);
      }
    }
  }

  /**
   * Add to state history
   */
  private addToHistory(key: string, oldValue: any, newValue: any, source: string): void {
    this.stateHistory.push({
      key,
      oldValue,
      newValue,
      source,
      timestamp: Date.now(),
    });

    // Limit history size
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory = this.stateHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Register default conflict resolvers
   */
  private registerDefaultResolvers(): void {
    // Last write wins (default)
    this.registerConflictResolver('default', (_local, remote) => remote);

    // Merge arrays
    this.registerConflictResolver('arrayMerge', (local: any[], remote: any[]) => {
      return [...new Set([...local, ...remote])];
    });

    // Merge objects
    this.registerConflictResolver('objectMerge', (local: any, remote: any) => {
      return { ...local, ...remote };
    });

    // Keep higher version
    this.registerConflictResolver('version', (local: any, remote: any, context) => {
      return context.localVersion > context.remoteVersion ? local : remote;
    });
  }

  /**
   * Deep equality check
   */
  private deepEqual(a: any, b: any): boolean {
    if (a === b) {
      return true;
    }
    if (a == null || b == null) {
      return false;
    }
    if (typeof a !== typeof b) {
      return false;
    }

    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) {
        return false;
      }

      for (const key of keysA) {
        if (!this.deepEqual(a[key], b[key])) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Persist state to storage
   */
  private async persistState(key: string, value: any): Promise<void> {
    try {
      // This would need to be properly initialized with ExtensionContext
      // For now, we'll skip persistence
      console.log(`Would persist state '${key}':`, value);
    } catch (error) {
      console.error(`Failed to persist state '${key}':`, error);
    }
  }

  /**
   * Load persisted state
   */
  private async loadPersistedState(key: string): Promise<void> {
    try {
      // This would need to be properly initialized with ExtensionContext
      // For now, we'll skip loading
      const stored: string | undefined = undefined;

      if (stored) {
        const value = JSON.parse(stored);
        this.setState(key, value, 'storage');
      }
    } catch (error) {
      console.error(`Failed to load persisted state '${key}':`, error);
    }
  }
}

// Type definitions
interface SyncedStateEntry {
  value: any;
  version: number;
  lastUpdated: number;
  source: string;
  locked: boolean;
  lockedBy?: string;
  validators: Validator[];
  transforms: Transform[];
  persistent: boolean;
}

interface StateOptions {
  validators?: Validator[];
  transforms?: Transform[];
  persistent?: boolean;
  debounceMs?: number;
}

type Validator = (value: any) => string | null;
type Transform = (value: any) => any;

interface StateSubscriber {
  callback: StateCallback<any>;
  filter?: (newValue: any, oldValue: any) => boolean;
  immediate: boolean;
  id: symbol;
}

type StateCallback<T> = (newValue: T, oldValue: T | undefined, key: string) => void;

interface SubscribeOptions {
  filter?: (newValue: any, oldValue: any) => boolean;
  immediate?: boolean;
}

type Unsubscribe = () => void;

type ComputeFunction<T> = (...deps: any[]) => T;

type ConflictResolver = (local: any, remote: any, context: ConflictContext) => any;

interface ConflictContext {
  localVersion: number;
  remoteVersion: number;
  source: string;
}

interface StateHistoryEntry {
  key: string;
  oldValue: any;
  newValue: any;
  source: string;
  timestamp: number;
}

// Export singleton instance
export const stateSync = StateSync.getInstance();

// Common state keys
export const StateKeys = {
  // Editor state
  CURRENT_TOOL: 'currentTool',
  SELECTED_TILE: 'selectedTile',
  BRUSH_SIZE: 'brushSize',
  ZOOM_LEVEL: 'zoomLevel',
  VIEWPORT: 'viewport',
  SELECTION: 'selection',
  LAYERS: 'layers',

  // Map state
  CURRENT_MAP: 'currentMap',
  MAP_DATA: 'mapData',
  MAP_DIRTY: 'mapDirty',
  UNDO_STACK: 'undoStack',
  REDO_STACK: 'redoStack',

  // Workspace state
  PANEL_SIZES: 'panelSizes',
  PANEL_VISIBILITY: 'panelVisibility',
  ACTIVE_PRESET: 'activePreset',
  THEME: 'theme',

  // Dashboard state
  WORKSPACE_STATS: 'workspaceStats',
  RECENT_ACTIONS: 'recentActions',
  NOTIFICATIONS: 'notifications',
  SEARCH_RESULTS: 'searchResults',

  // Performance state
  FPS: 'fps',
  MEMORY_USAGE: 'memoryUsage',
  RENDER_TIME: 'renderTime',
} as const;

// Initialize common states
export function initializeCommonStates(): void {
  const sync = stateSync;

  // Editor states
  sync.registerState(StateKeys.CURRENT_TOOL, 'paint', {
    validators: [value => (typeof value === 'string' ? null : 'Tool must be a string')],
  });

  sync.registerState(StateKeys.SELECTED_TILE, 0, {
    validators: [
      value =>
        typeof value === 'number' && value >= 0 ? null : 'Tile ID must be a non-negative number',
    ],
  });

  sync.registerState(StateKeys.BRUSH_SIZE, 1, {
    validators: [
      value =>
        typeof value === 'number' && value > 0 && value <= 10
          ? null
          : 'Brush size must be between 1 and 10',
    ],
    persistent: true,
  });

  sync.registerState(StateKeys.ZOOM_LEVEL, 1, {
    validators: [
      value =>
        typeof value === 'number' && value >= 0.25 && value <= 4
          ? null
          : 'Zoom level must be between 0.25 and 4',
    ],
    transforms: [
      value => Math.round(value * 100) / 100, // Round to 2 decimal places
    ],
  });

  // Workspace states
  sync.registerState(
    StateKeys.PANEL_SIZES,
    {},
    {
      persistent: true,
    }
  );

  sync.registerState(StateKeys.THEME, 'dark', {
    validators: [
      value => (['light', 'dark', 'highContrast'].includes(value) ? null : 'Invalid theme'),
    ],
    persistent: true,
  });

  // Dashboard states
  sync.registerState(StateKeys.WORKSPACE_STATS, {
    totalMaps: 0,
    totalMiners: 0,
    totalResources: 0,
    activeProcesses: 0,
  });

  sync.registerState(StateKeys.RECENT_ACTIONS, [], {
    transforms: [
      value => (Array.isArray(value) ? value.slice(-50) : []), // Keep last 50 actions
    ],
  });

  // Computed states
  sync.createComputed('canUndo', [StateKeys.UNDO_STACK], stack => {
    return Array.isArray(stack) && stack.length > 0;
  });

  sync.createComputed('canRedo', [StateKeys.REDO_STACK], stack => {
    return Array.isArray(stack) && stack.length > 0;
  });

  sync.createComputed('hasUnsavedChanges', [StateKeys.MAP_DIRTY], dirty => {
    return dirty === true;
  });
}
