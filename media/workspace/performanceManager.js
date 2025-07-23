// @ts-check
/**
 * Performance Manager for Workspace
 * Integrates debouncing, caching, and optimization strategies
 */

class PerformanceManager {
  constructor() {
    // Debounced functions
    this.debouncedResize = this.createDebouncedResize();
    this.debouncedScroll = this.createDebouncedScroll();
    this.debouncedPanelUpdate = this.createDebouncedPanelUpdate();
    
    // Cache for DOM queries
    this.elementCache = new Map();
    this.selectorCache = new Map();
    
    // Performance metrics
    this.metrics = {
      renderCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      lastRenderTime: 0
    };
    
    // Frame budget tracking
    this.frameTime = 16.67; // Target 60fps
    this.tasks = [];
    
    // Initialize performance monitoring
    this.initializeMonitoring();
  }

  /**
   * Create debounced resize handler
   */
  createDebouncedResize() {
    let resizeObserver = null;
    const resizeCallbacks = new Set();
    
    // Debounced resize handler
    const handleResize = this.debounce(() => {
      const start = performance.now();
      
      // Batch all resize callbacks
      resizeCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Resize callback error:', error);
        }
      });
      
      const duration = performance.now() - start;
      if (duration > this.frameTime) {
        console.warn(`Resize handling took ${duration.toFixed(2)}ms`);
      }
    }, 150);
    
    return {
      observe: (element, callback) => {
        resizeCallbacks.add(callback);
        
        if (!resizeObserver) {
          resizeObserver = new ResizeObserver(handleResize);
        }
        
        resizeObserver.observe(element);
      },
      
      unobserve: (element, callback) => {
        resizeCallbacks.delete(callback);
        
        if (resizeObserver && resizeCallbacks.size === 0) {
          resizeObserver.unobserve(element);
        }
      }
    };
  }

  /**
   * Create debounced scroll handler
   */
  createDebouncedScroll() {
    const scrollCallbacks = new Map();
    
    return {
      add: (element, callback, options = {}) => {
        const { delay = 50, leading = true, trailing = true } = options;
        
        const debouncedCallback = this.debounce(callback, delay, {
          leading,
          trailing,
          maxWait: 100
        });
        
        scrollCallbacks.set(callback, debouncedCallback);
        element.addEventListener('scroll', debouncedCallback, { passive: true });
      },
      
      remove: (element, callback) => {
        const debouncedCallback = scrollCallbacks.get(callback);
        if (debouncedCallback) {
          element.removeEventListener('scroll', debouncedCallback);
          scrollCallbacks.delete(callback);
        }
      }
    };
  }

  /**
   * Create debounced panel update handler
   */
  createDebouncedPanelUpdate() {
    const updateQueue = new Map();
    
    const processUpdates = this.debounce(() => {
      const updates = Array.from(updateQueue.entries());
      updateQueue.clear();
      
      // Batch DOM updates
      requestAnimationFrame(() => {
        updates.forEach(([panelId, updateFn]) => {
          try {
            updateFn();
          } catch (error) {
            console.error(`Panel update error for ${panelId}:`, error);
          }
        });
      });
    }, 16);
    
    return {
      queue: (panelId, updateFn) => {
        updateQueue.set(panelId, updateFn);
        processUpdates();
      },
      
      flush: () => {
        processUpdates.flush();
      }
    };
  }

  /**
   * Debounce utility function
   */
  debounce(func, wait, options = {}) {
    let timeout;
    let lastCallTime;
    let lastInvokeTime = 0;
    let lastArgs;
    let lastThis;
    let maxTimeout;
    let result;
    
    const {
      leading = false,
      trailing = true,
      maxWait
    } = options;
    
    const invokeFunc = (time) => {
      const args = lastArgs;
      const thisArg = lastThis;
      
      lastArgs = lastThis = null;
      lastInvokeTime = time;
      result = func.apply(thisArg, args);
      return result;
    };
    
    const leadingEdge = (time) => {
      lastInvokeTime = time;
      timeout = setTimeout(timerExpired, wait);
      return leading ? invokeFunc(time) : result;
    };
    
    const timerExpired = () => {
      const time = Date.now();
      
      if (shouldInvoke(time)) {
        return trailingEdge(time);
      }
      
      timeout = setTimeout(timerExpired, remainingWait(time));
    };
    
    const trailingEdge = (time) => {
      timeout = null;
      
      if (trailing && lastArgs) {
        return invokeFunc(time);
      }
      
      lastArgs = lastThis = null;
      return result;
    };
    
    const shouldInvoke = (time) => {
      const timeSinceLastCall = time - lastCallTime;
      const timeSinceLastInvoke = time - lastInvokeTime;
      
      return lastCallTime === undefined ||
        timeSinceLastCall >= wait ||
        timeSinceLastCall < 0 ||
        (maxWait && timeSinceLastInvoke >= maxWait);
    };
    
    const remainingWait = (time) => {
      const timeSinceLastCall = time - lastCallTime;
      const timeSinceLastInvoke = time - lastInvokeTime;
      const timeWaiting = wait - timeSinceLastCall;
      
      return maxWait
        ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
        : timeWaiting;
    };
    
    const debounced = function(...args) {
      const time = Date.now();
      const isInvoking = shouldInvoke(time);
      
      lastArgs = args;
      lastThis = this;
      lastCallTime = time;
      
      if (isInvoking) {
        if (!timeout) {
          return leadingEdge(lastCallTime);
        }
        
        if (maxWait) {
          timeout = setTimeout(timerExpired, wait);
          maxTimeout = setTimeout(trailingEdge, maxWait);
          return invokeFunc(lastCallTime);
        }
      }
      
      if (!timeout) {
        timeout = setTimeout(timerExpired, wait);
      }
      
      return result;
    };
    
    debounced.cancel = () => {
      if (timeout) clearTimeout(timeout);
      if (maxTimeout) clearTimeout(maxTimeout);
      lastInvokeTime = 0;
      lastArgs = lastCallTime = lastThis = timeout = maxTimeout = null;
    };
    
    debounced.flush = () => {
      return timeout ? trailingEdge(Date.now()) : result;
    };
    
    return debounced;
  }

  /**
   * Cache DOM element queries
   */
  querySelector(selector, parent = document) {
    const cacheKey = `${parent.id || 'document'}-${selector}`;
    
    if (this.elementCache.has(cacheKey)) {
      this.metrics.cacheHits++;
      return this.elementCache.get(cacheKey);
    }
    
    this.metrics.cacheMisses++;
    const element = parent.querySelector(selector);
    
    if (element) {
      this.elementCache.set(cacheKey, element);
    }
    
    return element;
  }

  /**
   * Cache multiple element queries
   */
  querySelectorAll(selector, parent = document) {
    const cacheKey = `${parent.id || 'document'}-all-${selector}`;
    
    if (this.selectorCache.has(cacheKey)) {
      this.metrics.cacheHits++;
      return this.selectorCache.get(cacheKey);
    }
    
    this.metrics.cacheMisses++;
    const elements = Array.from(parent.querySelectorAll(selector));
    
    this.selectorCache.set(cacheKey, elements);
    return elements;
  }

  /**
   * Invalidate cache for an element
   */
  invalidateCache(elementOrSelector) {
    if (typeof elementOrSelector === 'string') {
      // Invalidate all entries containing this selector
      for (const key of this.elementCache.keys()) {
        if (key.includes(elementOrSelector)) {
          this.elementCache.delete(key);
        }
      }
      for (const key of this.selectorCache.keys()) {
        if (key.includes(elementOrSelector)) {
          this.selectorCache.delete(key);
        }
      }
    } else {
      // Invalidate entries for specific element
      const id = elementOrSelector.id;
      if (id) {
        for (const key of this.elementCache.keys()) {
          if (key.startsWith(id)) {
            this.elementCache.delete(key);
          }
        }
        for (const key of this.selectorCache.keys()) {
          if (key.startsWith(id)) {
            this.selectorCache.delete(key);
          }
        }
      }
    }
  }

  /**
   * Schedule task for idle callback
   */
  scheduleIdleTask(task, options = {}) {
    const { priority = 'low', timeout = 1000 } = options;
    
    if ('requestIdleCallback' in window) {
      const handle = requestIdleCallback(deadline => {
        if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
          task();
        }
      }, { timeout });
      
      return () => cancelIdleCallback(handle);
    } else {
      // Fallback for browsers without requestIdleCallback
      const timeoutId = setTimeout(task, priority === 'high' ? 0 : 100);
      return () => clearTimeout(timeoutId);
    }
  }

  /**
   * Batch DOM reads and writes
   */
  batchDOMOperations(operations) {
    const reads = [];
    const writes = [];
    
    // Separate read and write operations
    operations.forEach(op => {
      if (op.type === 'read') {
        reads.push(op.fn);
      } else {
        writes.push(op.fn);
      }
    });
    
    // Execute all reads first
    const readResults = reads.map(fn => fn());
    
    // Then execute all writes in next frame
    requestAnimationFrame(() => {
      writes.forEach(fn => fn(readResults));
    });
  }

  /**
   * Initialize performance monitoring
   */
  initializeMonitoring() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
            }
          }
        });
        
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long task monitoring not supported
      }
    }
    
    // Monitor render performance
    let lastFrameTime = performance.now();
    const checkFrameRate = () => {
      const now = performance.now();
      const delta = now - lastFrameTime;
      
      if (delta > this.frameTime * 2) {
        console.warn(`Frame took ${delta.toFixed(2)}ms (target: ${this.frameTime}ms)`);
      }
      
      lastFrameTime = now;
      requestAnimationFrame(checkFrameRate);
    };
    
    // Start monitoring after a delay
    setTimeout(checkFrameRate, 1000);
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.elementCache.size + this.selectorCache.size,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0
    };
  }

  /**
   * Clear all caches
   */
  clearCaches() {
    this.elementCache.clear();
    this.selectorCache.clear();
    this.metrics.cacheHits = 0;
    this.metrics.cacheMisses = 0;
  }
}

// Create global instance
window.performanceManager = new PerformanceManager();