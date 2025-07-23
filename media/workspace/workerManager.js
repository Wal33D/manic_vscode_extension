/**
 * WorkerManager - Handles WebWorker communication for heavy computations
 */
class WorkerManager {
  constructor() {
    this.worker = null;
    this.pendingRequests = new Map();
    this.requestId = 0;
    this.workerReady = false;
    
    this.initializeWorker();
  }

  /**
   * Initialize the worker
   */
  initializeWorker() {
    try {
      // Get the worker script URL from the current document
      const workerUrl = new URL('./mapWorker.js', window.location.href).href;
      this.worker = new Worker(workerUrl);
      
      // Handle messages from worker
      this.worker.addEventListener('message', (event) => {
        const { id, type, result, error } = event.data;
        
        if (type === 'ready') {
          this.workerReady = true;
          this.onWorkerReady();
          return;
        }
        
        if (id && this.pendingRequests.has(id)) {
          const { resolve, reject } = this.pendingRequests.get(id);
          this.pendingRequests.delete(id);
          
          if (type === 'error') {
            reject(new Error(error));
          } else {
            resolve(result);
          }
        }
      });
      
      // Handle worker errors
      this.worker.addEventListener('error', (error) => {
        console.error('Worker error:', error);
        this.handleWorkerError(error);
      });
      
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      this.workerReady = false;
    }
  }

  /**
   * Called when worker is ready
   */
  onWorkerReady() {
    // Announce to accessibility manager
    if (window.accessibilityManager) {
      window.accessibilityManager.announce('Background processing ready');
    }
  }

  /**
   * Handle worker errors
   */
  handleWorkerError(error) {
    // Reject all pending requests
    for (const [id, { reject }] of this.pendingRequests) {
      reject(error);
    }
    this.pendingRequests.clear();
    
    // Try to restart worker
    setTimeout(() => {
      this.initializeWorker();
    }, 1000);
  }

  /**
   * Send computation request to worker
   */
  async compute(type, data) {
    if (!this.workerReady) {
      throw new Error('Worker not ready');
    }
    
    const id = ++this.requestId;
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      this.worker.postMessage({
        id,
        type,
        data
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Worker computation timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Calculate map statistics
   */
  async calculateStatistics(mapData) {
    return this.compute('calculateStatistics', { mapData });
  }

  /**
   * Generate heat map
   */
  async generateHeatMap(mapData, options) {
    return this.compute('generateHeatMap', { mapData, options });
  }

  /**
   * Validate map
   */
  async validateMap(mapData) {
    return this.compute('validateMap', { mapData });
  }

  /**
   * Find path
   */
  async findPath(mapData, start, end, options) {
    return this.compute('findPath', { mapData, start, end, options });
  }

  /**
   * Generate tile chunks for progressive rendering
   */
  async generateTileChunks(mapData, chunkSize = 16) {
    return this.compute('generateTileChunks', { mapData, chunkSize });
  }

  /**
   * Terminate worker
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.workerReady = false;
    }
    
    // Reject all pending requests
    for (const [id, { reject }] of this.pendingRequests) {
      reject(new Error('Worker terminated'));
    }
    this.pendingRequests.clear();
  }
}

// Create global instance
window.workerManager = new WorkerManager();

// Integration with workspace
(function() {
  // Override heavy computation functions to use worker
  const originalGetStatistics = window.getStatisticsPanelContent;
  if (originalGetStatistics) {
    window.getStatisticsPanelContent = async function() {
      // Show loading state
      const container = document.createElement('div');
      container.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>Calculating statistics...</p></div>';
      
      try {
        // Get current map data
        const mapData = await window.getCurrentMapData();
        if (mapData) {
          const stats = await window.workerManager.calculateStatistics(mapData);
          
          // Generate statistics HTML
          return `
            <div class="statistics-container">
              <div class="stat-group">
                <h4>Map Overview</h4>
                <div class="stat-item">
                  <span class="stat-label">Total Tiles:</span>
                  <span class="stat-value">${stats.totalTiles}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Pathable Area:</span>
                  <span class="stat-value">${Math.round(stats.pathableArea / stats.totalTiles * 100)}%</span>
                </div>
              </div>
              
              <div class="stat-group">
                <h4>Resources</h4>
                <div class="stat-item">
                  <span class="stat-label">Crystals:</span>
                  <span class="stat-value">${stats.crystals}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Ore:</span>
                  <span class="stat-value">${stats.ore}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Energy Crystals:</span>
                  <span class="stat-value">${stats.energyCrystals}</span>
                </div>
              </div>
              
              <div class="stat-group">
                <h4>Height Distribution</h4>
                <div class="height-chart">
                  ${stats.heightDistribution.map((count, height) => `
                    <div class="height-bar" style="height: ${count / Math.max(...stats.heightDistribution) * 100}%"
                         title="Height ${height}: ${count} tiles">
                      <span class="height-label">${height}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          `;
        }
      } catch (error) {
        console.error('Failed to calculate statistics:', error);
        return '<div class="error-message">Failed to calculate statistics</div>';
      }
      
      // Fallback to original
      return originalGetStatistics();
    };
  }
})();

// Handle messages from extension
window.addEventListener('message', async (event) => {
  const message = event.data;
  
  if (message.type === 'computeOffThread') {
    try {
      let result;
      
      switch (message.computation) {
        case 'statistics':
          result = await window.workerManager.calculateStatistics(message.data);
          break;
        case 'heatmap':
          result = await window.workerManager.generateHeatMap(message.data, message.options);
          break;
        case 'validate':
          result = await window.workerManager.validateMap(message.data);
          break;
        case 'pathfind':
          result = await window.workerManager.findPath(message.data, message.start, message.end, message.options);
          break;
        case 'chunks':
          result = await window.workerManager.generateTileChunks(message.data, message.chunkSize);
          break;
      }
      
      // Send result back
      vscode.postMessage({
        type: 'computeResult',
        id: message.id,
        result
      });
      
    } catch (error) {
      vscode.postMessage({
        type: 'computeError',
        id: message.id,
        error: error.message
      });
    }
  }
});