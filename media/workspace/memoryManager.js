/**
 * Memory Manager for optimizing memory usage in the workspace
 * Implements cleanup routines and memory monitoring
 */
class MemoryManager {
  constructor() {
    this.resources = new Map();
    this.cleanupScheduled = false;
    this.memoryThreshold = 50 * 1024 * 1024; // 50MB
    this.lastCleanup = Date.now();
    this.cleanupInterval = 30000; // 30 seconds
    this.weakRefs = new WeakMap();
    this.observerRegistry = new Map();
    
    this.initializeMemoryManager();
  }

  /**
   * Initialize memory management
   */
  initializeMemoryManager() {
    // Monitor memory usage
    this.startMemoryMonitoring();
    
    // Set up automatic cleanup
    this.setupAutomaticCleanup();
    
    // Handle visibility changes
    this.handleVisibilityChange();
    
    // Listen for low memory warnings
    if ('memory' in performance) {
      this.monitorMemoryPressure();
    }
  }

  /**
   * Register a resource for memory management
   */
  registerResource(id, resource, options = {}) {
    const resourceInfo = {
      resource,
      type: options.type || 'generic',
      size: options.size || this.estimateSize(resource),
      lastAccessed: Date.now(),
      persistent: options.persistent || false,
      priority: options.priority || 'normal',
      cleanup: options.cleanup || null
    };
    
    this.resources.set(id, resourceInfo);
    
    // Store weak reference if appropriate
    if (resource && typeof resource === 'object' && !options.persistent) {
      this.weakRefs.set(resource, id);
    }
    
    // Check if cleanup is needed
    this.checkMemoryPressure();
  }

  /**
   * Unregister a resource
   */
  unregisterResource(id) {
    const resourceInfo = this.resources.get(id);
    if (resourceInfo) {
      // Run custom cleanup if provided
      if (resourceInfo.cleanup && typeof resourceInfo.cleanup === 'function') {
        try {
          resourceInfo.cleanup(resourceInfo.resource);
        } catch (error) {
          console.error('Error during resource cleanup:', error);
        }
      }
      
      // Remove from registry
      this.resources.delete(id);
    }
  }

  /**
   * Get a resource and update access time
   */
  getResource(id) {
    const resourceInfo = this.resources.get(id);
    if (resourceInfo) {
      resourceInfo.lastAccessed = Date.now();
      return resourceInfo.resource;
    }
    return null;
  }

  /**
   * Estimate memory size of a resource
   */
  estimateSize(obj) {
    if (!obj) return 0;
    
    let size = 0;
    const visited = new WeakSet();
    
    const calculate = (obj) => {
      if (!obj || visited.has(obj)) return;
      visited.add(obj);
      
      if (obj instanceof ArrayBuffer) {
        size += obj.byteLength;
      } else if (obj instanceof ImageData) {
        size += obj.data.byteLength;
      } else if (obj instanceof HTMLCanvasElement) {
        size += obj.width * obj.height * 4; // Approximate RGBA
      } else if (Array.isArray(obj)) {
        size += obj.length * 8; // Approximate array overhead
        obj.forEach(item => calculate(item));
      } else if (typeof obj === 'object') {
        size += Object.keys(obj).length * 16; // Approximate object overhead
        Object.values(obj).forEach(value => calculate(value));
      } else if (typeof obj === 'string') {
        size += obj.length * 2; // UTF-16
      } else {
        size += 8; // Numbers, booleans, etc.
      }
    };
    
    calculate(obj);
    return size;
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    if (!performance.memory) return;
    
    // Monitor memory usage periodically
    setInterval(() => {
      const memoryInfo = this.getMemoryInfo();
      
      // Log if in debug mode
      if (window.location.search.includes('debug=true')) {
        console.log('Memory usage:', memoryInfo);
      }
      
      // Check for high memory usage
      if (memoryInfo.usedJSHeapSize > this.memoryThreshold) {
        this.onHighMemoryUsage(memoryInfo);
      }
    }, 5000);
  }

  /**
   * Get current memory information
   */
  getMemoryInfo() {
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        usage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      };
    }
    
    // Fallback estimation based on tracked resources
    const totalSize = Array.from(this.resources.values())
      .reduce((sum, info) => sum + info.size, 0);
    
    return {
      estimatedSize: totalSize,
      resourceCount: this.resources.size
    };
  }

  /**
   * Handle high memory usage
   */
  onHighMemoryUsage(memoryInfo) {
    console.warn('High memory usage detected:', memoryInfo);
    
    // Announce to accessibility manager
    if (window.accessibilityManager) {
      window.accessibilityManager.announce('High memory usage detected, cleaning up resources');
    }
    
    // Trigger aggressive cleanup
    this.performCleanup('aggressive');
  }

  /**
   * Set up automatic cleanup
   */
  setupAutomaticCleanup() {
    // Regular cleanup interval
    setInterval(() => {
      const now = Date.now();
      if (now - this.lastCleanup > this.cleanupInterval) {
        this.performCleanup('routine');
      }
    }, 10000);
  }

  /**
   * Perform memory cleanup
   */
  performCleanup(level = 'normal') {
    if (this.cleanupScheduled) return;
    
    this.cleanupScheduled = true;
    this.lastCleanup = Date.now();
    
    requestIdleCallback(() => {
      try {
        const cleaned = this.executeCleanup(level);
        
        // Report cleanup results
        if (cleaned > 0) {
          console.log(`Memory cleanup completed: ${cleaned} resources freed`);
          
          // Announce to accessibility
          if (window.accessibilityManager) {
            window.accessibilityManager.announce(`Freed ${cleaned} resources`);
          }
        }
      } finally {
        this.cleanupScheduled = false;
      }
    }, { timeout: 2000 });
  }

  /**
   * Execute cleanup based on level
   */
  executeCleanup(level) {
    const now = Date.now();
    let cleaned = 0;
    
    // Define cleanup thresholds
    const thresholds = {
      routine: 300000,     // 5 minutes
      normal: 120000,      // 2 minutes
      aggressive: 30000    // 30 seconds
    };
    
    const threshold = thresholds[level] || thresholds.normal;
    const resourcesToClean = [];
    
    // Identify resources to clean
    for (const [id, info] of this.resources) {
      // Skip persistent resources unless aggressive cleanup
      if (info.persistent && level !== 'aggressive') continue;
      
      // Check if resource is stale
      if (now - info.lastAccessed > threshold) {
        // Lower priority resources cleaned first
        const priority = info.priority === 'high' ? 3 : info.priority === 'normal' ? 2 : 1;
        resourcesToClean.push({ id, info, priority });
      }
    }
    
    // Sort by priority (lower priority cleaned first)
    resourcesToClean.sort((a, b) => a.priority - b.priority);
    
    // Clean resources
    for (const { id, info } of resourcesToClean) {
      // Run cleanup
      this.unregisterResource(id);
      cleaned++;
      
      // Stop if we've freed enough memory (except for aggressive)
      if (level !== 'aggressive' && cleaned >= 10) break;
    }
    
    // Additional cleanup operations
    this.cleanupDOMReferences();
    this.cleanupObservers();
    this.cleanupEventListeners();
    
    // Force garbage collection if available
    if (window.gc && level === 'aggressive') {
      window.gc();
    }
    
    return cleaned;
  }

  /**
   * Clean up detached DOM references
   */
  cleanupDOMReferences() {
    // Clean up detached nodes
    const allNodes = document.querySelectorAll('*');
    let detachedCount = 0;
    
    allNodes.forEach(node => {
      if (!document.body.contains(node) && node.parentNode) {
        node.remove();
        detachedCount++;
      }
    });
    
    if (detachedCount > 0) {
      console.log(`Cleaned up ${detachedCount} detached DOM nodes`);
    }
  }

  /**
   * Clean up observers
   */
  cleanupObservers() {
    // Clean up intersection observers
    for (const [id, observer] of this.observerRegistry) {
      if (observer.type === 'intersection') {
        const elements = document.querySelectorAll(observer.selector);
        if (elements.length === 0) {
          observer.instance.disconnect();
          this.observerRegistry.delete(id);
        }
      }
    }
  }

  /**
   * Clean up event listeners
   */
  cleanupEventListeners() {
    // This is a placeholder - in production, you'd track event listeners
    // and remove ones attached to removed elements
  }

  /**
   * Register an observer for cleanup tracking
   */
  registerObserver(id, observer, selector, type = 'intersection') {
    this.observerRegistry.set(id, {
      instance: observer,
      selector,
      type
    });
  }

  /**
   * Handle visibility change
   */
  handleVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Perform cleanup when tab is hidden
        this.performCleanup('normal');
      }
    });
  }

  /**
   * Monitor memory pressure API
   */
  monitorMemoryPressure() {
    if ('memory' in performance && 'addEventListener' in performance.memory) {
      performance.memory.addEventListener('pressure', (event) => {
        console.log('Memory pressure event:', event);
        
        // Perform cleanup based on pressure level
        switch (event.level) {
          case 'critical':
            this.performCleanup('aggressive');
            break;
          case 'warning':
            this.performCleanup('normal');
            break;
        }
      });
    }
  }

  /**
   * Create a managed canvas
   */
  createManagedCanvas(id, width, height, options = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    // Register for memory management
    this.registerResource(id, canvas, {
      type: 'canvas',
      size: width * height * 4,
      priority: options.priority || 'normal',
      cleanup: (canvas) => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        canvas.width = 0;
        canvas.height = 0;
      },
      ...options
    });
    
    return canvas;
  }

  /**
   * Create a managed image
   */
  createManagedImage(id, src, options = {}) {
    const img = new Image();
    
    // Register for memory management
    this.registerResource(id, img, {
      type: 'image',
      priority: options.priority || 'normal',
      cleanup: (img) => {
        img.src = '';
        img.onload = null;
        img.onerror = null;
      },
      ...options
    });
    
    img.src = src;
    return img;
  }

  /**
   * Get memory statistics
   */
  getStatistics() {
    const stats = {
      totalResources: this.resources.size,
      resourcesByType: {},
      totalSize: 0,
      oldestResource: null,
      largestResource: null
    };
    
    let oldestTime = Infinity;
    let largestSize = 0;
    
    for (const [id, info] of this.resources) {
      // Count by type
      stats.resourcesByType[info.type] = (stats.resourcesByType[info.type] || 0) + 1;
      
      // Total size
      stats.totalSize += info.size;
      
      // Find oldest
      if (info.lastAccessed < oldestTime) {
        oldestTime = info.lastAccessed;
        stats.oldestResource = { id, age: Date.now() - info.lastAccessed };
      }
      
      // Find largest
      if (info.size > largestSize) {
        largestSize = info.size;
        stats.largestResource = { id, size: info.size };
      }
    }
    
    return stats;
  }

  /**
   * Destroy memory manager
   */
  destroy() {
    // Clean up all resources
    for (const id of this.resources.keys()) {
      this.unregisterResource(id);
    }
    
    // Clear registries
    this.resources.clear();
    this.observerRegistry.clear();
    this.weakRefs = new WeakMap();
  }
}

// Create global instance
window.memoryManager = new MemoryManager();

// Export for use in other modules
window.MemoryManager = MemoryManager;