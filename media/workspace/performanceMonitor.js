/**
 * Performance Monitor for tracking and optimizing workspace performance
 * Provides hooks for monitoring various performance metrics
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.thresholds = new Map();
    this.hooks = new Map();
    this.isMonitoring = false;
    this.reportInterval = 5000; // 5 seconds
    this.metricsHistory = [];
    this.maxHistorySize = 100;
    
    this.initializeMonitor();
  }

  /**
   * Initialize performance monitoring
   */
  initializeMonitor() {
    // Set up performance observer
    this.setupPerformanceObserver();
    
    // Set up default thresholds
    this.setupDefaultThresholds();
    
    // Start monitoring
    this.startMonitoring();
    
    // Set up reporting
    this.setupReporting();
    
    // Monitor specific metrics
    this.monitorFrameRate();
    this.monitorMemory();
    this.monitorDOM();
    this.monitorNetwork();
  }

  /**
   * Setup performance observer
   */
  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Monitor long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('longTask', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            });
            
            // Trigger hook if threshold exceeded
            if (entry.duration > this.getThreshold('longTask')) {
              this.triggerHook('longTask', entry);
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longTask', longTaskObserver);
      } catch (e) {
        console.log('Long task monitoring not supported');
      }
      
      // Monitor paint timing
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('paint', {
              name: entry.name,
              startTime: entry.startTime
            });
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('paint', paintObserver);
      } catch (e) {
        console.log('Paint timing monitoring not supported');
      }
      
      // Monitor layout shifts
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          let totalShift = 0;
          for (const entry of list.getEntries()) {
            totalShift += entry.value;
          }
          
          this.recordMetric('layoutShift', {
            value: totalShift,
            timestamp: performance.now()
          });
          
          if (totalShift > this.getThreshold('layoutShift')) {
            this.triggerHook('layoutShift', { value: totalShift });
          }
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('layoutShift', layoutShiftObserver);
      } catch (e) {
        console.log('Layout shift monitoring not supported');
      }
    }
  }

  /**
   * Setup default thresholds
   */
  setupDefaultThresholds() {
    this.thresholds.set('fps', 30); // Below 30 FPS
    this.thresholds.set('longTask', 50); // Tasks over 50ms
    this.thresholds.set('memoryUsage', 100 * 1024 * 1024); // 100MB
    this.thresholds.set('domNodes', 1500); // Over 1500 DOM nodes
    this.thresholds.set('layoutShift', 0.1); // CLS over 0.1
    this.thresholds.set('renderTime', 16); // Over 16ms (60fps)
    this.thresholds.set('scriptTime', 8); // Over 8ms for scripts
  }

  /**
   * Register a performance hook
   */
  registerHook(name, callback, options = {}) {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, new Set());
    }
    
    const hook = {
      callback,
      threshold: options.threshold,
      debounce: options.debounce || 0,
      lastTriggered: 0
    };
    
    this.hooks.get(name).add(hook);
    
    // Return unregister function
    return () => {
      const hooks = this.hooks.get(name);
      if (hooks) {
        hooks.delete(hook);
      }
    };
  }

  /**
   * Trigger hooks for a metric
   */
  triggerHook(name, data) {
    const hooks = this.hooks.get(name);
    if (!hooks) return;
    
    const now = Date.now();
    
    for (const hook of hooks) {
      // Check debounce
      if (hook.debounce > 0 && now - hook.lastTriggered < hook.debounce) {
        continue;
      }
      
      // Check threshold if specified
      if (hook.threshold !== undefined) {
        const value = typeof data === 'object' ? data.value || data.duration : data;
        if (value < hook.threshold) {
          continue;
        }
      }
      
      hook.lastTriggered = now;
      
      // Call hook
      try {
        hook.callback(data, this.getMetrics());
      } catch (error) {
        console.error('Error in performance hook:', error);
      }
    }
  }

  /**
   * Start monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Announce to accessibility
    if (window.accessibilityManager) {
      window.accessibilityManager.announce('Performance monitoring started');
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
    
    // Disconnect observers
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
  }

  /**
   * Monitor frame rate
   */
  monitorFrameRate() {
    let lastTime = performance.now();
    let frames = 0;
    let fps = 60;
    
    const measureFPS = () => {
      if (!this.isMonitoring) return;
      
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
        
        this.recordMetric('fps', fps);
        
        // Trigger hook if below threshold
        if (fps < this.getThreshold('fps')) {
          this.triggerHook('lowFPS', { fps, timestamp: currentTime });
        }
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  /**
   * Monitor memory usage
   */
  monitorMemory() {
    if (!performance.memory) return;
    
    setInterval(() => {
      if (!this.isMonitoring) return;
      
      const memory = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        usage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      };
      
      this.recordMetric('memory', memory);
      
      // Trigger hook if above threshold
      if (memory.used > this.getThreshold('memoryUsage')) {
        this.triggerHook('highMemory', memory);
      }
    }, 2000);
  }

  /**
   * Monitor DOM size
   */
  monitorDOM() {
    setInterval(() => {
      if (!this.isMonitoring) return;
      
      const nodeCount = document.getElementsByTagName('*').length;
      
      this.recordMetric('domNodes', nodeCount);
      
      // Trigger hook if above threshold
      if (nodeCount > this.getThreshold('domNodes')) {
        this.triggerHook('largeDom', { nodeCount, timestamp: performance.now() });
      }
    }, 5000);
  }

  /**
   * Monitor network activity
   */
  monitorNetwork() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('resource', {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize || 0,
            type: entry.initiatorType
          });
          
          // Trigger hook for slow resources
          if (entry.duration > 1000) {
            this.triggerHook('slowResource', entry);
          }
        }
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    } catch (e) {
      console.log('Resource timing monitoring not supported');
    }
  }

  /**
   * Record a metric
   */
  recordMetric(name, value) {
    const metric = {
      name,
      value,
      timestamp: performance.now()
    };
    
    // Store in metrics map
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metricArray = this.metrics.get(name);
    metricArray.push(metric);
    
    // Limit array size
    if (metricArray.length > 100) {
      metricArray.shift();
    }
    
    // Add to history
    this.addToHistory(metric);
  }

  /**
   * Add metric to history
   */
  addToHistory(metric) {
    this.metricsHistory.push(metric);
    
    // Limit history size
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const result = {};
    
    for (const [name, values] of this.metrics) {
      if (values.length > 0) {
        const latest = values[values.length - 1];
        result[name] = latest.value;
      }
    }
    
    return result;
  }

  /**
   * Get metric statistics
   */
  getMetricStats(name, duration = 60000) {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;
    
    const now = performance.now();
    const filtered = values.filter(m => now - m.timestamp < duration);
    
    if (filtered.length === 0) return null;
    
    const numbers = filtered.map(m => typeof m.value === 'number' ? m.value : m.value.value || 0);
    
    return {
      min: Math.min(...numbers),
      max: Math.max(...numbers),
      avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
      count: numbers.length,
      latest: numbers[numbers.length - 1]
    };
  }

  /**
   * Get threshold for metric
   */
  getThreshold(name) {
    return this.thresholds.get(name) || Infinity;
  }

  /**
   * Set threshold for metric
   */
  setThreshold(name, value) {
    this.thresholds.set(name, value);
  }

  /**
   * Setup reporting
   */
  setupReporting() {
    setInterval(() => {
      if (!this.isMonitoring) return;
      
      const report = this.generateReport();
      
      // Log report in debug mode
      if (window.location.search.includes('debug=true')) {
        console.log('Performance Report:', report);
      }
      
      // Trigger report hook
      this.triggerHook('report', report);
    }, this.reportInterval);
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const report = {
      timestamp: Date.now(),
      metrics: {},
      warnings: []
    };
    
    // Collect metric stats
    for (const [name] of this.metrics) {
      const stats = this.getMetricStats(name, this.reportInterval);
      if (stats) {
        report.metrics[name] = stats;
        
        // Check thresholds
        const threshold = this.getThreshold(name);
        if (stats.avg > threshold || stats.max > threshold) {
          report.warnings.push({
            metric: name,
            threshold,
            avg: stats.avg,
            max: stats.max
          });
        }
      }
    }
    
    return report;
  }

  /**
   * Mark performance timing
   */
  mark(name) {
    performance.mark(name);
  }

  /**
   * Measure between marks
   */
  measure(name, startMark, endMark) {
    try {
      performance.measure(name, startMark, endMark);
      
      const entries = performance.getEntriesByName(name, 'measure');
      if (entries.length > 0) {
        const duration = entries[entries.length - 1].duration;
        this.recordMetric('measure', {
          name,
          duration
        });
        
        return duration;
      }
    } catch (error) {
      console.error('Failed to measure:', error);
    }
    
    return 0;
  }

  /**
   * Create a performance timer
   */
  createTimer(name) {
    const startTime = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - startTime;
        this.recordMetric('timer', {
          name,
          duration
        });
        
        return duration;
      }
    };
  }

  /**
   * Profile a function
   */
  profile(fn, name) {
    return (...args) => {
      const timer = this.createTimer(name);
      
      try {
        const result = fn(...args);
        
        // Handle promises
        if (result && typeof result.then === 'function') {
          return result.finally(() => {
            timer.end();
          });
        }
        
        timer.end();
        return result;
      } catch (error) {
        timer.end();
        throw error;
      }
    };
  }

  /**
   * Export metrics data
   */
  exportMetrics() {
    const data = {
      timestamp: Date.now(),
      metrics: {},
      history: this.metricsHistory,
      thresholds: Object.fromEntries(this.thresholds)
    };
    
    // Convert metrics to plain objects
    for (const [name, values] of this.metrics) {
      data.metrics[name] = values;
    }
    
    return data;
  }

  /**
   * Clear metrics
   */
  clearMetrics() {
    this.metrics.clear();
    this.metricsHistory = [];
  }

  /**
   * Destroy monitor
   */
  destroy() {
    this.stopMonitoring();
    this.clearMetrics();
    this.hooks.clear();
  }
}

// Create global instance
window.performanceMonitor = new PerformanceMonitor();

// Integration with workspace
(function() {
  // Register default hooks
  const monitor = window.performanceMonitor;
  
  // Low FPS warning
  monitor.registerHook('lowFPS', (data) => {
    console.warn(`Low FPS detected: ${data.fps}`);
    
    // Show notification
    if (window.showNotification) {
      window.showNotification({
        message: `Performance warning: Low frame rate (${data.fps} FPS)`,
        type: 'warning'
      });
    }
  }, { threshold: 30, debounce: 5000 });
  
  // High memory warning
  monitor.registerHook('highMemory', (data) => {
    const usedMB = Math.round(data.used / 1024 / 1024);
    console.warn(`High memory usage: ${usedMB}MB`);
    
    // Trigger cleanup
    if (window.memoryManager) {
      window.memoryManager.performCleanup('normal');
    }
  }, { threshold: 100 * 1024 * 1024, debounce: 10000 });
  
  // Large DOM warning
  monitor.registerHook('largeDom', (data) => {
    console.warn(`Large DOM detected: ${data.nodeCount} nodes`);
  }, { threshold: 1500, debounce: 10000 });
  
  // Profile common operations
  if (window.updatePanelContent) {
    window.updatePanelContent = monitor.profile(window.updatePanelContent, 'updatePanelContent');
  }
  
  if (window.renderMap) {
    window.renderMap = monitor.profile(window.renderMap, 'renderMap');
  }
})();

// Export for use in other modules
window.PerformanceMonitor = PerformanceMonitor;