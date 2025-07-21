/**
 * Performance optimization utilities for map rendering
 * Implements tile culling, LOD (Level of Detail), and rendering optimizations
 */

export interface ViewportBounds {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  viewWidth: number;
  viewHeight: number;
}

export interface LODLevel {
  minZoom: number;
  maxZoom: number;
  tileSkip: number; // Render every nth tile
  simplifyGeometry: boolean;
  showDetails: boolean;
  showGrid: boolean;
  showTileIds: boolean;
  textureQuality: 'low' | 'medium' | 'high';
}

export interface RenderStats {
  totalTiles: number;
  renderedTiles: number;
  culledTiles: number;
  frameTime: number;
  fps: number;
  memoryUsage?: number;
}

export class RenderOptimizer {
  private frameStats: RenderStats = {
    totalTiles: 0,
    renderedTiles: 0,
    culledTiles: 0,
    frameTime: 0,
    fps: 60,
  };

  private lastFrameTime = 0;
  private frameCount = 0;
  private fpsUpdateTime = 0;

  // LOD levels for different zoom ranges
  private lodLevels: LODLevel[] = [
    {
      minZoom: 0,
      maxZoom: 0.5,
      tileSkip: 4,
      simplifyGeometry: true,
      showDetails: false,
      showGrid: false,
      showTileIds: false,
      textureQuality: 'low',
    },
    {
      minZoom: 0.5,
      maxZoom: 1,
      tileSkip: 2,
      simplifyGeometry: true,
      showDetails: false,
      showGrid: true,
      showTileIds: false,
      textureQuality: 'medium',
    },
    {
      minZoom: 1,
      maxZoom: 2,
      tileSkip: 1,
      simplifyGeometry: false,
      showDetails: true,
      showGrid: true,
      showTileIds: false,
      textureQuality: 'high',
    },
    {
      minZoom: 2,
      maxZoom: Infinity,
      tileSkip: 1,
      simplifyGeometry: false,
      showDetails: true,
      showGrid: true,
      showTileIds: true,
      textureQuality: 'high',
    },
  ];

  /**
   * Calculate visible viewport bounds for tile culling
   */
  calculateViewportBounds(
    scrollLeft: number,
    scrollTop: number,
    viewWidth: number,
    viewHeight: number,
    tileSize: number,
    totalRows: number,
    totalCols: number,
    margin = 2 // Extra tiles to render outside viewport
  ): ViewportBounds {
    const startCol = Math.max(0, Math.floor(scrollLeft / tileSize) - margin);
    const endCol = Math.min(totalCols, Math.ceil((scrollLeft + viewWidth) / tileSize) + margin);
    const startRow = Math.max(0, Math.floor(scrollTop / tileSize) - margin);
    const endRow = Math.min(totalRows, Math.ceil((scrollTop + viewHeight) / tileSize) + margin);

    return {
      startRow,
      endRow,
      startCol,
      endCol,
      viewWidth,
      viewHeight,
    };
  }

  /**
   * Get appropriate LOD level for current zoom
   */
  getLODLevel(zoomLevel: number): LODLevel {
    return (
      this.lodLevels.find(level => zoomLevel >= level.minZoom && zoomLevel < level.maxZoom) ||
      this.lodLevels[this.lodLevels.length - 1]
    );
  }

  /**
   * Check if optimization should be enabled based on map size
   */
  shouldOptimize(rows: number, cols: number): boolean {
    const totalTiles = rows * cols;
    // Enable optimization for maps larger than 50x50 or 2500 tiles
    return rows > 50 || cols > 50 || totalTiles > 2500;
  }

  /**
   * Calculate optimal tile size based on zoom and viewport
   */
  calculateOptimalTileSize(
    baseSize: number,
    zoomLevel: number,
    _viewportSize: { width: number; height: number },
    mapSize: { rows: number; cols: number }
  ): number {
    const tileSize = baseSize * zoomLevel;

    // Ensure reasonable tile size for performance
    if (tileSize < 2) {
      return 2;
    }
    if (tileSize > 100) {
      return 100;
    }

    // Adjust for very large maps
    const totalTiles = mapSize.rows * mapSize.cols;
    if (totalTiles > 10000 && tileSize > 20) {
      return Math.max(10, tileSize * 0.5);
    }

    return tileSize;
  }

  /**
   * Update performance statistics
   */
  updateStats(renderedTiles: number, totalTiles: number): void {
    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    this.frameStats.renderedTiles = renderedTiles;
    this.frameStats.totalTiles = totalTiles;
    this.frameStats.culledTiles = totalTiles - renderedTiles;
    this.frameStats.frameTime = frameTime;

    // Update FPS every second
    this.frameCount++;
    if (currentTime - this.fpsUpdateTime > 1000) {
      this.frameStats.fps = Math.round(
        (this.frameCount * 1000) / (currentTime - this.fpsUpdateTime)
      );
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }

    // Estimate memory usage if available
    if ('memory' in performance) {
      this.frameStats.memoryUsage = (performance as unknown as any).memory.usedJSHeapSize;
    }
  }

  /**
   * Get current performance statistics
   */
  getStats(): RenderStats {
    return { ...this.frameStats };
  }

  /**
   * Create optimized render batches for better performance
   */
  createRenderBatches<T>(items: T[][], bounds: ViewportBounds, batchSize = 100): T[][][] {
    const batches: T[][][] = [];
    let currentBatch: T[][] = [];
    let tileCount = 0;

    for (let row = bounds.startRow; row < bounds.endRow; row++) {
      const rowData: T[] = [];
      for (let col = bounds.startCol; col < bounds.endCol; col++) {
        if (items[row] && items[row][col] !== undefined) {
          rowData.push(items[row][col]);
          tileCount++;
        }
      }

      if (rowData.length > 0) {
        currentBatch.push(rowData);
      }

      // Create new batch when size limit reached
      if (tileCount >= batchSize) {
        batches.push(currentBatch);
        currentBatch = [];
        tileCount = 0;
      }
    }

    // Add remaining tiles
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  }

  /**
   * Throttle render function for better performance
   */
  throttleRender(
    renderFn: () => void,
    delay = 16 // ~60fps
  ): () => void {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastRun = 0;

    return () => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun;

      if (timeSinceLastRun >= delay) {
        renderFn();
        lastRun = now;
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          renderFn();
          lastRun = Date.now();
        }, delay - timeSinceLastRun);
      }
    };
  }

  /**
   * Calculate distance-based LOD for 3D terrain
   */
  calculate3DLODLevel(distance: number): number {
    if (distance < 50) {
      return 3; // High detail
    }
    if (distance < 100) {
      return 2; // Medium detail
    }
    if (distance < 200) {
      return 1; // Low detail
    }
    return 0; // Very low detail
  }

  /**
   * Optimize geometry for 3D terrain based on LOD
   */
  optimizeTerrainGeometry(
    rows: number,
    cols: number,
    lodLevel: number
  ): { segments: { x: number; y: number }; skip: number } {
    switch (lodLevel) {
      case 3: // High detail
        return { segments: { x: cols - 1, y: rows - 1 }, skip: 1 };
      case 2: // Medium detail
        return {
          segments: { x: Math.floor(cols / 2), y: Math.floor(rows / 2) },
          skip: 2,
        };
      case 1: // Low detail
        return {
          segments: { x: Math.floor(cols / 4), y: Math.floor(rows / 4) },
          skip: 4,
        };
      default: // Very low detail
        return {
          segments: { x: Math.floor(cols / 8), y: Math.floor(rows / 8) },
          skip: 8,
        };
    }
  }

  /**
   * Check if tile is within frustum for 3D culling
   * Note: This is a placeholder - actual implementation requires THREE.js types
   */
  isTileInFrustum(
    tilePosition: { x: number; y: number; z: number },
    _frustum: unknown, // THREE.Frustum
    _tileSize: number
  ): boolean {
    // This is a simplified check - in actual use with THREE.js:
    // Create bounding sphere for tile and check intersection
    // For now, return a simple distance-based check
    const distance = Math.sqrt(
      tilePosition.x * tilePosition.x +
        tilePosition.y * tilePosition.y +
        tilePosition.z * tilePosition.z
    );

    // Approximate frustum check based on distance
    return distance < 200; // Adjust based on camera settings
  }

  /**
   * Adaptive quality based on performance
   */
  adaptQualityToPerformance(): {
    reduceQuality: boolean;
    skipFrames: number;
    reducedTileSize: boolean;
  } {
    const stats = this.getStats();
    const targetFPS = 30;

    if (stats.fps < targetFPS * 0.5) {
      // Very poor performance
      return {
        reduceQuality: true,
        skipFrames: 2,
        reducedTileSize: true,
      };
    } else if (stats.fps < targetFPS * 0.8) {
      // Poor performance
      return {
        reduceQuality: true,
        skipFrames: 1,
        reducedTileSize: false,
      };
    }

    // Good performance
    return {
      reduceQuality: false,
      skipFrames: 0,
      reducedTileSize: false,
    };
  }
}

// Singleton instance
export const renderOptimizer = new RenderOptimizer();
