import * as vscode from 'vscode';

export interface LazyLoadConfig {
  panelId: string;
  loadContent: () => Promise<string>;
  loadOnVisible?: boolean;
  cacheContent?: boolean;
  placeholder?: string;
}

export class LazyLoader {
  private loadedPanels = new Map<string, string>();
  private loadingPanels = new Map<string, Promise<string>>();
  private observers = new Map<string, any>(); // IntersectionObserver not available in VS Code context

  constructor(private webview: vscode.Webview) {}

  /**
   * Register a panel for lazy loading
   */
  public registerPanel(config: LazyLoadConfig): void {
    if (config.loadOnVisible) {
      this.setupVisibilityObserver(config);
    }
  }

  /**
   * Load panel content on demand
   */
  public async loadPanel(panelId: string, config: LazyLoadConfig): Promise<void> {
    // Check if already loaded and cached
    if (config.cacheContent && this.loadedPanels.has(panelId)) {
      this.sendPanelContent(panelId, this.loadedPanels.get(panelId)!);
      return;
    }

    // Check if already loading
    if (this.loadingPanels.has(panelId)) {
      const content = await this.loadingPanels.get(panelId)!;
      this.sendPanelContent(panelId, content);
      return;
    }

    // Show placeholder while loading
    if (config.placeholder) {
      this.sendPanelContent(panelId, config.placeholder, true);
    }

    // Start loading
    const loadPromise = this.loadPanelContent(config);
    this.loadingPanels.set(panelId, loadPromise);

    try {
      const content = await loadPromise;

      // Cache if requested
      if (config.cacheContent) {
        this.loadedPanels.set(panelId, content);
      }

      // Send content to webview
      this.sendPanelContent(panelId, content);
    } catch (error) {
      console.error(`Failed to load panel ${panelId}:`, error);
      this.sendPanelContent(panelId, this.getErrorContent(error));
    } finally {
      this.loadingPanels.delete(panelId);
    }
  }

  /**
   * Setup intersection observer for visibility-based loading
   */
  private setupVisibilityObserver(config: LazyLoadConfig): void {
    // Send message to webview to setup observer
    this.webview.postMessage({
      type: 'setupLazyLoad',
      panelId: config.panelId,
      placeholder: config.placeholder || this.getLoadingPlaceholder(),
    });
  }

  /**
   * Load panel content
   */
  private async loadPanelContent(config: LazyLoadConfig): Promise<string> {
    // Simulate network delay for demo
    await this.delay(100);

    return config.loadContent();
  }

  /**
   * Send panel content to webview
   */
  private sendPanelContent(panelId: string, content: string, isPlaceholder = false): void {
    this.webview.postMessage({
      type: 'updatePanelContent',
      panelId,
      content,
      isPlaceholder,
    });
  }

  /**
   * Get loading placeholder
   */
  private getLoadingPlaceholder(): string {
    return `
      <div class="panel-loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading...</div>
      </div>
    `;
  }

  /**
   * Get error content
   */
  private getErrorContent(error: any): string {
    return `
      <div class="panel-error">
        <div class="error-icon">⚠️</div>
        <div class="error-message">Failed to load panel content</div>
        <div class="error-details">${error?.message || 'Unknown error'}</div>
      </div>
    `;
  }

  /**
   * Clear cached content for a panel
   */
  public clearCache(panelId?: string): void {
    if (panelId) {
      this.loadedPanels.delete(panelId);
    } else {
      this.loadedPanels.clear();
    }
  }

  /**
   * Preload panels in the background
   */
  public async preloadPanels(configs: LazyLoadConfig[]): Promise<void> {
    // Preload panels with lower priority
    const preloadPromises = configs.map(config =>
      this.loadPanel(config.panelId, config).catch(error =>
        console.warn(`Failed to preload panel ${config.panelId}:`, error)
      )
    );

    // Don't wait for all to complete, just fire and forget
    Promise.all(preloadPromises);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.loadedPanels.clear();
    this.loadingPanels.clear();
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

/**
 * Panel content generators for lazy loading
 */
export class PanelContentGenerators {
  static async getToolsPanelContent(): Promise<string> {
    return `
      <div class="tools-grid">
        <button class="tool-btn active" data-tool="paint" title="Paint (P)">
          <span class="icon">🖌️</span>
          <span class="label">Paint</span>
        </button>
        <button class="tool-btn" data-tool="fill" title="Fill (F)">
          <span class="icon">🪣</span>
          <span class="label">Fill</span>
        </button>
        <button class="tool-btn" data-tool="line" title="Line (L)">
          <span class="icon">📏</span>
          <span class="label">Line</span>
        </button>
        <button class="tool-btn" data-tool="rectangle" title="Rectangle (R)">
          <span class="icon">⬛</span>
          <span class="label">Rect</span>
        </button>
        <button class="tool-btn" data-tool="ellipse" title="Ellipse">
          <span class="icon">⭕</span>
          <span class="label">Ellipse</span>
        </button>
        <button class="tool-btn" data-tool="select" title="Select (S)">
          <span class="icon">✂️</span>
          <span class="label">Select</span>
        </button>
        <button class="tool-btn" data-tool="picker" title="Picker (I)">
          <span class="icon">💧</span>
          <span class="label">Picker</span>
        </button>
        <button class="tool-btn" data-tool="eraser" title="Eraser (E)">
          <span class="icon">🧹</span>
          <span class="label">Eraser</span>
        </button>
      </div>
    `;
  }

  static async getLayersPanelContent(): Promise<string> {
    // Simulate loading layers data
    const layers = [
      { id: 'main', name: 'Main Layer', visible: true, opacity: 100 },
      { id: 'background', name: 'Background', visible: true, opacity: 75 },
      { id: 'objects', name: 'Objects', visible: false, opacity: 100 },
    ];

    return `
      <div class="layers-list">
        ${layers
          .map(
            layer => `
          <div class="layer-item ${layer.visible ? 'visible' : 'hidden'}" data-layer-id="${layer.id}">
            <button class="layer-visibility" title="Toggle visibility">
              ${layer.visible ? '👁️' : '👁️‍🗨️'}
            </button>
            <span class="layer-name">${layer.name}</span>
            <span class="layer-opacity">${layer.opacity}%</span>
          </div>
        `
          )
          .join('')}
      </div>
      <div class="layers-controls">
        <button class="btn btn-sm" title="Add layer">➕ Add</button>
        <button class="btn btn-sm" title="Delete layer">🗑️ Delete</button>
        <button class="btn btn-sm" title="Merge down">⬇️ Merge</button>
      </div>
    `;
  }

  static async getPropertiesPanelContent(): Promise<string> {
    return `
      <div class="properties-content">
        <div class="property-group">
          <label>Brush Size</label>
          <div class="property-control">
            <input type="range" min="1" max="10" value="1" id="brushSize">
            <span class="value-display">1</span>
          </div>
        </div>
        <div class="property-group">
          <label>Opacity</label>
          <div class="property-control">
            <input type="range" min="0" max="100" value="100" id="opacity">
            <span class="value-display">100%</span>
          </div>
        </div>
        <div class="property-group">
          <label>Tile Type</label>
          <select class="property-select">
            <option value="0">Empty</option>
            <option value="1">Dirt</option>
            <option value="2">Rock</option>
            <option value="3">Lava</option>
            <option value="4">Wall</option>
          </select>
        </div>
        <div class="property-group">
          <label>Auto-Tile</label>
          <input type="checkbox" checked>
        </div>
      </div>
    `;
  }

  static async getTilePalettePanelContent(): Promise<string> {
    // Generate tile grid
    const tiles = Array.from({ length: 50 }, (_, i) => i);

    return `
      <div class="tile-palette-grid">
        ${tiles
          .map(
            tile => `
          <button class="tile-btn ${tile === 0 ? 'active' : ''}" 
                  data-tile-id="${tile}" 
                  title="Tile ${tile}"
                  style="background: ${getTileColor(tile)}">
            ${tile}
          </button>
        `
          )
          .join('')}
      </div>
    `;
  }

  static async getStatisticsPanelContent(): Promise<string> {
    return `
      <div class="statistics-content">
        <div class="stat-group">
          <h3>Map Statistics</h3>
          <div class="stat-item">
            <span class="stat-label">Dimensions:</span>
            <span class="stat-value">50x50</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Tiles:</span>
            <span class="stat-value">2,500</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Resources:</span>
            <span class="stat-value">125</span>
          </div>
        </div>
        <div class="stat-group">
          <h3>Performance</h3>
          <div class="stat-item">
            <span class="stat-label">Render Time:</span>
            <span class="stat-value">16ms</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Memory Usage:</span>
            <span class="stat-value">24MB</span>
          </div>
        </div>
      </div>
    `;
  }
}

// Helper function for tile colors
function getTileColor(tileId: number): string {
  const colors: Record<number, string> = {
    0: '#2a2a2a',
    1: '#8b4513',
    2: '#333333',
    3: '#ff0000',
    4: '#666666',
    5: '#444444',
  };
  return colors[tileId] || `hsl(${tileId * 37}, 70%, 50%)`;
}
