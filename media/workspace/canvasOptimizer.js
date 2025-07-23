// @ts-check
/**
 * Canvas Performance Optimizer
 * Uses requestAnimationFrame for smooth 60fps rendering
 */

class CanvasOptimizer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = {
      targetFPS: options.targetFPS || 60,
      autoScale: options.autoScale !== false,
      offscreenBuffer: options.offscreenBuffer !== false,
      ...options
    };
    
    this.frameTime = 1000 / this.options.targetFPS;
    this.lastFrameTime = 0;
    this.animationId = null;
    this.isRunning = false;
    
    // Render queue
    this.renderQueue = [];
    this.immediateQueue = [];
    
    // Dirty regions tracking
    this.dirtyRegions = [];
    this.fullRedraw = true;
    
    // Performance monitoring
    this.frameCount = 0;
    this.fpsHistory = [];
    this.lastFPSUpdate = 0;
    
    // Offscreen buffer for double buffering
    if (this.options.offscreenBuffer) {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
      this.syncOffscreenSize();
    }
    
    // Device pixel ratio handling
    this.dpr = window.devicePixelRatio || 1;
    if (this.options.autoScale) {
      this.setupHighDPICanvas();
    }
    
    // Bind methods
    this.render = this.render.bind(this);
    this.handleResize = this.handleResize.bind(this);
    
    // Setup resize observer
    this.setupResizeObserver();
  }

  /**
   * Setup canvas for high DPI displays
   */
  setupHighDPICanvas() {
    const rect = this.canvas.getBoundingClientRect();
    
    // Set actual size in memory
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    
    // Scale back down using CSS
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    // Scale drawing context to match device pixel ratio
    this.ctx.scale(this.dpr, this.dpr);
    
    if (this.offscreenCanvas) {
      this.syncOffscreenSize();
    }
  }

  /**
   * Sync offscreen canvas size
   */
  syncOffscreenSize() {
    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;
    
    if (this.options.autoScale) {
      this.offscreenCtx.scale(this.dpr, this.dpr);
    }
  }

  /**
   * Setup resize observer
   */
  setupResizeObserver() {
    this.resizeObserver = new ResizeObserver(entries => {
      // Debounce resize handling
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 100);
    });
    
    this.resizeObserver.observe(this.canvas);
  }

  /**
   * Handle canvas resize
   */
  handleResize() {
    if (this.options.autoScale) {
      this.setupHighDPICanvas();
    }
    
    this.markFullRedraw();
    this.queueRender(() => {
      // Notify listeners about resize
      this.canvas.dispatchEvent(new CustomEvent('optimizedResize', {
        detail: {
          width: this.canvas.width,
          height: this.canvas.height,
          dpr: this.dpr
        }
      }));
    });
  }

  /**
   * Start the render loop
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.animationId = requestAnimationFrame(this.render);
  }

  /**
   * Stop the render loop
   */
  stop() {
    this.isRunning = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Main render loop
   */
  render(timestamp) {
    if (!this.isRunning) return;
    
    // Calculate delta time
    const deltaTime = timestamp - this.lastFrameTime;
    
    // Skip frame if we're running too fast
    if (deltaTime < this.frameTime - 1) {
      this.animationId = requestAnimationFrame(this.render);
      return;
    }
    
    // Update FPS counter
    this.updateFPS(timestamp);
    
    // Process immediate queue first
    while (this.immediateQueue.length > 0) {
      const task = this.immediateQueue.shift();
      task(this.getContext(), deltaTime);
    }
    
    // Process render queue
    if (this.renderQueue.length > 0 || this.dirtyRegions.length > 0) {
      this.performRender(deltaTime);
    }
    
    this.lastFrameTime = timestamp;
    this.animationId = requestAnimationFrame(this.render);
  }

  /**
   * Perform actual rendering
   */
  performRender(deltaTime) {
    const ctx = this.getContext();
    
    // Save context state
    ctx.save();
    
    // Clear dirty regions or full canvas
    if (this.fullRedraw) {
      ctx.clearRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
    } else {
      this.clearDirtyRegions(ctx);
    }
    
    // Execute render tasks
    while (this.renderQueue.length > 0) {
      const task = this.renderQueue.shift();
      
      // Setup clipping for dirty region optimization
      if (!this.fullRedraw && this.dirtyRegions.length > 0) {
        ctx.save();
        this.clipToDirtyRegions(ctx);
      }
      
      task(ctx, deltaTime);
      
      if (!this.fullRedraw && this.dirtyRegions.length > 0) {
        ctx.restore();
      }
    }
    
    // Restore context state
    ctx.restore();
    
    // Swap buffers if using double buffering
    if (this.options.offscreenBuffer) {
      this.swapBuffers();
    }
    
    // Clear dirty regions
    this.dirtyRegions = [];
    this.fullRedraw = false;
  }

  /**
   * Get the appropriate context (offscreen or main)
   */
  getContext() {
    return this.options.offscreenBuffer ? this.offscreenCtx : this.ctx;
  }

  /**
   * Swap offscreen buffer to main canvas
   */
  swapBuffers() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
  }

  /**
   * Queue a render task
   */
  queueRender(renderFn, immediate = false) {
    if (immediate) {
      this.immediateQueue.push(renderFn);
    } else {
      this.renderQueue.push(renderFn);
    }
    
    // Start render loop if not running
    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * Mark a region as dirty (needs redraw)
   */
  markDirty(x, y, width, height) {
    // Adjust for DPR
    const scaledRegion = {
      x: x * this.dpr,
      y: y * this.dpr,
      width: width * this.dpr,
      height: height * this.dpr
    };
    
    // Merge with existing regions if possible
    const merged = this.tryMergeRegion(scaledRegion);
    
    if (!merged) {
      this.dirtyRegions.push(scaledRegion);
    }
    
    // If too many regions, just do full redraw
    if (this.dirtyRegions.length > 10) {
      this.markFullRedraw();
    }
  }

  /**
   * Mark entire canvas for redraw
   */
  markFullRedraw() {
    this.fullRedraw = true;
    this.dirtyRegions = [];
  }

  /**
   * Try to merge a dirty region with existing ones
   */
  tryMergeRegion(newRegion) {
    for (let i = 0; i < this.dirtyRegions.length; i++) {
      const region = this.dirtyRegions[i];
      
      // Check if regions overlap or are adjacent
      if (this.regionsOverlap(region, newRegion)) {
        // Merge regions
        this.dirtyRegions[i] = this.mergeRegions(region, newRegion);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if two regions overlap
   */
  regionsOverlap(a, b) {
    return !(a.x + a.width < b.x || 
             b.x + b.width < a.x || 
             a.y + a.height < b.y || 
             b.y + b.height < a.y);
  }

  /**
   * Merge two regions into one
   */
  mergeRegions(a, b) {
    const minX = Math.min(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxX = Math.max(a.x + a.width, b.x + b.width);
    const maxY = Math.max(a.y + a.height, b.y + b.height);
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Clear dirty regions
   */
  clearDirtyRegions(ctx) {
    this.dirtyRegions.forEach(region => {
      ctx.clearRect(
        region.x / this.dpr,
        region.y / this.dpr,
        region.width / this.dpr,
        region.height / this.dpr
      );
    });
  }

  /**
   * Clip context to dirty regions
   */
  clipToDirtyRegions(ctx) {
    ctx.beginPath();
    
    this.dirtyRegions.forEach(region => {
      ctx.rect(
        region.x / this.dpr,
        region.y / this.dpr,
        region.width / this.dpr,
        region.height / this.dpr
      );
    });
    
    ctx.clip();
  }

  /**
   * Update FPS counter
   */
  updateFPS(timestamp) {
    this.frameCount++;
    
    if (timestamp - this.lastFPSUpdate > 1000) {
      const fps = Math.round(this.frameCount * 1000 / (timestamp - this.lastFPSUpdate));
      this.fpsHistory.push(fps);
      
      // Keep only last 10 FPS readings
      if (this.fpsHistory.length > 10) {
        this.fpsHistory.shift();
      }
      
      // Dispatch FPS event
      this.canvas.dispatchEvent(new CustomEvent('fpsUpdate', {
        detail: {
          current: fps,
          average: this.getAverageFPS(),
          history: [...this.fpsHistory]
        }
      }));
      
      this.frameCount = 0;
      this.lastFPSUpdate = timestamp;
    }
  }

  /**
   * Get average FPS
   */
  getAverageFPS() {
    if (this.fpsHistory.length === 0) return 0;
    
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.fpsHistory.length);
  }

  /**
   * Create an optimized animation
   */
  animate(duration, updateFn, completeFn) {
    const startTime = performance.now();
    
    const animationFrame = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      this.queueRender((ctx) => {
        updateFn(ctx, progress, elapsed);
      });
      
      if (progress < 1) {
        requestAnimationFrame(animationFrame);
      } else if (completeFn) {
        completeFn();
      }
    };
    
    animationFrame();
  }

  /**
   * Batch multiple operations
   */
  batch(operations) {
    this.queueRender((ctx) => {
      ctx.save();
      operations.forEach(op => op(ctx));
      ctx.restore();
    });
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    this.stop();
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    clearTimeout(this.resizeTimeout);
    
    this.renderQueue = [];
    this.immediateQueue = [];
    this.dirtyRegions = [];
  }
}

// Export for use
window.CanvasOptimizer = CanvasOptimizer;