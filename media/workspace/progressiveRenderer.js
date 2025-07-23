/**
 * Progressive Renderer for large maps
 * Renders maps in chunks to maintain 60fps performance
 */
class ProgressiveRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = {
      chunkSize: 16,
      chunksPerFrame: 4,
      tileSize: 32,
      priorityRadius: 10,
      ...options
    };
    
    this.chunks = [];
    this.renderedChunks = new Set();
    this.renderQueue = [];
    this.isRendering = false;
    this.animationFrame = null;
    this.viewport = { x: 0, y: 0, width: 0, height: 0 };
    this.lastRenderTime = 0;
    this.performanceMonitor = {
      frameTime: 0,
      chunksRendered: 0,
      fps: 60
    };
    
    this.initializeRenderer();
  }

  /**
   * Initialize the renderer
   */
  initializeRenderer() {
    // Set up canvas
    this.setupCanvas();
    
    // Handle viewport changes
    this.handleViewportChange = this.handleViewportChange.bind(this);
    this.renderFrame = this.renderFrame.bind(this);
    
    // Monitor performance
    if (window.performanceManager) {
      window.performanceManager.registerMonitor('progressiveRenderer', this.performanceMonitor);
    }
  }

  /**
   * Setup canvas properties
   */
  setupCanvas() {
    // Enable hardware acceleration
    this.ctx.imageSmoothingEnabled = false;
    this.canvas.style.imageRendering = 'pixelated';
    
    // Set canvas size
    this.updateCanvasSize();
  }

  /**
   * Update canvas size
   */
  updateCanvasSize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    this.ctx.scale(dpr, dpr);
    
    this.viewport.width = rect.width;
    this.viewport.height = rect.height;
  }

  /**
   * Load map data and prepare chunks
   */
  async loadMap(mapData) {
    // Show loading state
    this.showLoadingState();
    
    try {
      // Generate chunks using web worker
      if (window.workerManager) {
        this.chunks = await window.workerManager.generateTileChunks(mapData, this.options.chunkSize);
      } else {
        // Fallback to main thread
        this.chunks = this.generateChunksSync(mapData);
      }
      
      // Reset render state
      this.renderedChunks.clear();
      this.renderQueue = [];
      
      // Start rendering
      this.startRendering();
      
      // Announce to screen reader
      if (window.accessibilityManager) {
        window.accessibilityManager.announce(`Map loaded with ${this.chunks.length} chunks`);
      }
      
    } catch (error) {
      console.error('Failed to load map:', error);
      this.showErrorState();
    }
  }

  /**
   * Generate chunks synchronously (fallback)
   */
  generateChunksSync(mapData) {
    const { width, height, tiles } = mapData;
    const chunks = [];
    const chunkSize = this.options.chunkSize;
    
    for (let cy = 0; cy < height; cy += chunkSize) {
      for (let cx = 0; cx < width; cx += chunkSize) {
        const chunk = {
          id: `${cx}_${cy}`,
          x: cx,
          y: cy,
          width: Math.min(chunkSize, width - cx),
          height: Math.min(chunkSize, height - cy),
          tiles: [],
          priority: 0
        };
        
        for (let y = 0; y < chunk.height; y++) {
          for (let x = 0; x < chunk.width; x++) {
            const globalX = cx + x;
            const globalY = cy + y;
            chunk.tiles.push(tiles[globalY * width + globalX]);
          }
        }
        
        chunks.push(chunk);
      }
    }
    
    return chunks;
  }

  /**
   * Start progressive rendering
   */
  startRendering() {
    if (this.isRendering) return;
    
    this.isRendering = true;
    this.lastRenderTime = performance.now();
    
    // Update render queue based on viewport
    this.updateRenderQueue();
    
    // Start render loop
    this.renderFrame();
  }

  /**
   * Stop rendering
   */
  stopRendering() {
    this.isRendering = false;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Render frame
   */
  renderFrame(timestamp) {
    if (!this.isRendering) return;
    
    const frameStart = performance.now();
    const deltaTime = timestamp - this.lastRenderTime;
    this.lastRenderTime = timestamp;
    
    // Calculate FPS
    this.performanceMonitor.fps = Math.round(1000 / deltaTime);
    
    // Render chunks for this frame
    let chunksRendered = 0;
    const maxChunks = this.options.chunksPerFrame;
    const maxFrameTime = 16; // Target 60fps
    
    while (this.renderQueue.length > 0 && chunksRendered < maxChunks) {
      const elapsedTime = performance.now() - frameStart;
      if (elapsedTime > maxFrameTime * 0.8) break; // Leave some headroom
      
      const chunk = this.renderQueue.shift();
      if (chunk && !this.renderedChunks.has(chunk.id)) {
        this.renderChunk(chunk);
        this.renderedChunks.add(chunk.id);
        chunksRendered++;
      }
    }
    
    // Update performance metrics
    this.performanceMonitor.frameTime = performance.now() - frameStart;
    this.performanceMonitor.chunksRendered = chunksRendered;
    
    // Continue rendering if there are more chunks
    if (this.renderQueue.length > 0 || !this.allChunksRendered()) {
      this.animationFrame = requestAnimationFrame(this.renderFrame);
    } else {
      this.onRenderComplete();
    }
  }

  /**
   * Render a single chunk
   */
  renderChunk(chunk) {
    const tileSize = this.options.tileSize;
    const startX = chunk.x * tileSize;
    const startY = chunk.y * tileSize;
    
    // Create offscreen canvas for chunk
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = chunk.width * tileSize;
    offscreenCanvas.height = chunk.height * tileSize;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    
    // Render tiles to offscreen canvas
    for (let y = 0; y < chunk.height; y++) {
      for (let x = 0; x < chunk.width; x++) {
        const tile = chunk.tiles[y * chunk.width + x];
        this.renderTile(offscreenCtx, x * tileSize, y * tileSize, tile);
      }
    }
    
    // Draw chunk to main canvas
    this.ctx.drawImage(offscreenCanvas, startX, startY);
  }

  /**
   * Render a single tile
   */
  renderTile(ctx, x, y, tile) {
    const size = this.options.tileSize;
    
    // Base color based on tile type
    const colors = {
      0: '#333333', // Empty
      1: '#8B4513', // Dirt
      2: '#696969', // Rock
      3: '#228B22', // Grass
      4: '#4682B4', // Water
      5: '#FFD700'  // Crystal
    };
    
    ctx.fillStyle = colors[tile.type] || '#000000';
    ctx.fillRect(x, y, size, size);
    
    // Draw height overlay
    if (tile.height > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${tile.height * 0.1})`;
      ctx.fillRect(x, y, size, size);
    }
    
    // Draw grid
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.strokeRect(x, y, size, size);
  }

  /**
   * Update render queue based on viewport
   */
  updateRenderQueue() {
    // Clear current queue
    this.renderQueue = [];
    
    // Calculate visible chunks
    const tileSize = this.options.tileSize;
    const chunkSize = this.options.chunkSize;
    const chunkPixelSize = chunkSize * tileSize;
    
    const startChunkX = Math.floor(this.viewport.x / chunkPixelSize);
    const startChunkY = Math.floor(this.viewport.y / chunkPixelSize);
    const endChunkX = Math.ceil((this.viewport.x + this.viewport.width) / chunkPixelSize);
    const endChunkY = Math.ceil((this.viewport.y + this.viewport.height) / chunkPixelSize);
    
    // Prioritize chunks based on distance from center
    const centerX = this.viewport.x + this.viewport.width / 2;
    const centerY = this.viewport.y + this.viewport.height / 2;
    
    for (const chunk of this.chunks) {
      const chunkCenterX = (chunk.x + chunk.width / 2) * tileSize;
      const chunkCenterY = (chunk.y + chunk.height / 2) * tileSize;
      
      // Check if chunk is visible
      if (chunk.x >= startChunkX * chunkSize && 
          chunk.x < endChunkX * chunkSize &&
          chunk.y >= startChunkY * chunkSize && 
          chunk.y < endChunkY * chunkSize) {
        
        // Calculate priority based on distance from viewport center
        const distance = Math.sqrt(
          Math.pow(chunkCenterX - centerX, 2) + 
          Math.pow(chunkCenterY - centerY, 2)
        );
        
        chunk.priority = 1 / (1 + distance);
        this.renderQueue.push(chunk);
      }
    }
    
    // Sort by priority (closest to center first)
    this.renderQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Handle viewport change
   */
  handleViewportChange(viewport) {
    this.viewport = { ...viewport };
    
    // Update render queue
    this.updateRenderQueue();
    
    // Re-render visible chunks that haven't been rendered
    const visibleUnrendered = this.renderQueue.filter(
      chunk => !this.renderedChunks.has(chunk.id)
    );
    
    if (visibleUnrendered.length > 0 && !this.isRendering) {
      this.startRendering();
    }
  }

  /**
   * Check if all chunks are rendered
   */
  allChunksRendered() {
    return this.renderedChunks.size === this.chunks.length;
  }

  /**
   * Called when rendering is complete
   */
  onRenderComplete() {
    this.isRendering = false;
    
    // Announce completion
    if (window.accessibilityManager) {
      window.accessibilityManager.announce('Map rendering complete');
    }
    
    // Emit event
    this.canvas.dispatchEvent(new CustomEvent('renderComplete', {
      detail: {
        chunksRendered: this.renderedChunks.size,
        totalChunks: this.chunks.length
      }
    }));
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    this.ctx.fillStyle = 'var(--vscode-editor-background)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = 'var(--vscode-foreground)';
    this.ctx.font = '16px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Loading map...', this.canvas.width / 2, this.canvas.height / 2);
  }

  /**
   * Show error state
   */
  showErrorState() {
    this.ctx.fillStyle = 'var(--vscode-editor-background)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = 'var(--vscode-errorForeground)';
    this.ctx.font = '16px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Failed to load map', this.canvas.width / 2, this.canvas.height / 2);
  }

  /**
   * Clear canvas
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.renderedChunks.clear();
    this.renderQueue = [];
  }

  /**
   * Destroy renderer
   */
  destroy() {
    this.stopRendering();
    this.clear();
    
    if (window.performanceManager) {
      window.performanceManager.unregisterMonitor('progressiveRenderer');
    }
  }
}

// Export for use in other modules
window.ProgressiveRenderer = ProgressiveRenderer;