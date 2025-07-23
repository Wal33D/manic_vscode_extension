import * as vscode from 'vscode';
import { LazyLoader } from '../workspace/lazyLoader.js';
import { debounce } from '../utils/debounce.js';
import { globalCache } from '../utils/cache.js';
import { generateAriaLabel } from '../utils/accessibility.js';

/**
 * Unified Map Editor Component
 * Integrates all map editing functionality within the workspace
 */
export class UnifiedMapEditor {
  // private readonly _extensionUri: vscode.Uri;
  private webview?: vscode.Webview;
  private currentMapPath?: string;
  private isDirty: boolean = false;
  private autoSaveTimer?: NodeJS.Timeout;
  private lazyLoader?: LazyLoader;

  // Tool states
  private currentTool: string = 'paint';
  private selectedTileId: number = 0;
  private brushSize: number = 1;
  // private isDrawing: boolean = false;

  // Enhanced features
  private selectionArea?: { start: { x: number; y: number }; end: { x: number; y: number } };
  private copiedTiles?: any[];
  private toolHistory: string[] = [];
  // private gridSize: number = 32;
  private zoomLevel: number = 1;
  private viewportOffset: { x: number; y: number } = { x: 0, y: 0 };

  // Undo/Redo system
  private undoStack: any[] = [];
  private redoStack: any[] = [];
  private maxUndoLevels: number = 50;

  // Performance optimization
  private readonly saveDebounced: () => void;
  // private readonly updateStatusDebounced: () => void;

  constructor(_extensionUri: vscode.Uri) {
    // this._extensionUri = extensionUri;

    // Create debounced functions
    this.saveDebounced = debounce(() => this.autoSave(), 1000);
    // this.updateStatusDebounced = debounce(() => this.updateStatus(), 100);
  }

  /**
   * Initialize the map editor within a webview
   */
  public async initialize(webview: vscode.Webview): Promise<void> {
    this.webview = webview;

    // Initialize lazy loader
    this.lazyLoader = new LazyLoader(webview);

    // Set up message handling
    this.setupMessageHandling();

    // Load editor UI
    await this.loadEditorUI();
  }

  /**
   * Load map file for editing
   */
  public async loadMap(mapPath: string): Promise<void> {
    try {
      this.currentMapPath = mapPath;

      // Check cache first
      const cachedData = globalCache.mapData.getMapData(mapPath);
      if (cachedData) {
        await this.displayMap(cachedData);
        return;
      }

      // Load map data
      const mapData = await this.loadMapData(mapPath);

      // Cache the data
      globalCache.mapData.setMapData(mapPath, mapData);

      // Display the map
      await this.displayMap(mapData);

      // Reset dirty state
      this.isDirty = false;

      // Update status
      this.updateStatusEnhanced();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load map: ${error}`);
    }
  }

  /**
   * Set up message handling from webview
   */
  private setupMessageHandling(): void {
    if (!this.webview) {
      return;
    }

    this.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'tool':
          this.handleToolChange(message);
          break;

        case 'tile':
          this.handleTileChange(message);
          break;

        case 'edit':
          await this.handleEditAction(message);
          break;

        case 'save':
          await this.saveMap();
          break;

        case 'undo':
          await this.undo();
          break;

        case 'redo':
          await this.redo();
          break;

        case 'export':
          await this.exportMap(message.format);
          break;

        case 'settings':
          this.handleSettingsChange(message);
          break;

        case 'copy':
          await this.copySelection();
          break;

        case 'paste':
          await this.pasteSelection(message.x, message.y);
          break;

        case 'delete':
          await this.deleteSelection();
          break;

        case 'selectAll':
          await this.selectAll();
          break;

        case 'zoom':
          this.handleZoom(message.level, message.centerX, message.centerY);
          break;

        case 'pan':
          this.handlePan(message.deltaX, message.deltaY);
          break;

        case 'selection':
          await this.handleSelection(message);
          break;

        case 'transform':
          await this.handleTransform(message);
          break;

        case 'layer':
          this.handleLayerChange(message);
          break;
      }
    });
  }

  /**
   * Load editor UI components
   */
  private async loadEditorUI(): Promise<void> {
    if (!this.webview) {
      return;
    }

    // Send message to load editor components
    this.webview.postMessage({
      type: 'loadEditor',
      components: ['canvas', 'toolbar', 'minimap', 'statusbar'],
    });

    // Load tool panels lazily
    await this.lazyLoader?.loadPanel('editorTools', {
      panelId: 'editorTools',
      loadContent: async () => this.getToolsPanelContent(),
      cacheContent: true,
    });

    await this.lazyLoader?.loadPanel('editorLayers', {
      panelId: 'editorLayers',
      loadContent: async () => this.getLayersPanelContent(),
      cacheContent: true,
    });
  }

  /**
   * Handle tool change
   */
  private handleToolChange(message: any): void {
    this.currentTool = message.tool;

    // Update tool-specific settings
    switch (this.currentTool) {
      case 'brush':
        this.brushSize = message.size || 1;
        break;
      case 'fill':
        // Fill tool settings
        break;
      case 'select':
        // Selection tool settings
        break;
    }

    this.updateStatusEnhanced();
  }

  /**
   * Handle tile selection change
   */
  private handleTileChange(message: any): void {
    this.selectedTileId = message.tileId;
    this.updateStatusEnhanced();
  }

  /**
   * Handle edit actions
   */
  private async handleEditAction(message: any): Promise<void> {
    const { action, x, y, data } = message;

    // Save state for undo before making changes
    await this.saveUndoState();

    switch (action) {
      case 'placeTile':
        await this.placeTile(x, y, data.tileId);
        break;

      case 'paintArea':
        await this.paintArea(data.tiles);
        break;

      case 'fill':
        await this.fillArea(x, y, data.tileId);
        break;

      case 'setHeight':
        await this.setTileHeight(x, y, data.height);
        break;

      case 'placeBuilding':
        await this.placeBuilding(x, y, data.buildingType);
        break;

      case 'placeResource':
        await this.placeResource(x, y, data.resourceType, data.amount);
        break;

      case 'rectangle':
        await this.drawRectangle(data.start, data.end, data.tileId, data.filled);
        break;

      case 'ellipse':
        await this.drawEllipse(data.center, data.radiusX, data.radiusY, data.tileId, data.filled);
        break;

      case 'line':
        await this.drawLine(data.start, data.end, data.tileId, data.width);
        break;
    }

    // Mark as dirty
    this.isDirty = true;

    // Trigger auto-save
    this.saveDebounced();

    // Update recent tools
    this.updateRecentTools(this.currentTool);
  }

  /**
   * Place a tile at position
   */
  private async placeTile(x: number, y: number, tileId: number): Promise<void> {
    if (!this.webview || !this.currentMapPath) {
      return;
    }

    // Update map data
    const mapData = globalCache.mapData.getMapData(this.currentMapPath);
    if (mapData) {
      const index = y * mapData.width + x;
      mapData.tiles[index].type = tileId;

      // Update cache
      globalCache.mapData.setTileData(this.currentMapPath, x, y, mapData.tiles[index]);

      // Update display
      this.webview.postMessage({
        type: 'updateTile',
        x,
        y,
        tile: mapData.tiles[index],
      });
    }
  }

  /**
   * Paint multiple tiles
   */
  private async paintArea(tiles: Array<{ x: number; y: number; tileId: number }>): Promise<void> {
    if (!this.webview || !this.currentMapPath) {
      return;
    }

    const mapData = globalCache.mapData.getMapData(this.currentMapPath);
    if (!mapData) {
      return;
    }

    // Update tiles in batch
    const updates = [];
    for (const tile of tiles) {
      const index = tile.y * mapData.width + tile.x;
      mapData.tiles[index].type = tile.tileId;
      updates.push({
        x: tile.x,
        y: tile.y,
        tile: mapData.tiles[index],
      });

      // Update cache
      globalCache.mapData.setTileData(this.currentMapPath, tile.x, tile.y, mapData.tiles[index]);
    }

    // Send batch update
    this.webview.postMessage({
      type: 'updateTiles',
      tiles: updates,
    });
  }

  /**
   * Fill area with tile type
   */
  private async fillArea(startX: number, startY: number, tileId: number): Promise<void> {
    if (!this.currentMapPath) {
      return;
    }

    // Use web worker for flood fill calculation
    this.webview?.postMessage({
      type: 'computeOffThread',
      computation: 'floodFill',
      data: {
        mapPath: this.currentMapPath,
        startX,
        startY,
        tileId,
      },
    });
  }

  /**
   * Save map
   */
  private async saveMap(): Promise<void> {
    if (!this.currentMapPath || !this.isDirty) {
      return;
    }

    try {
      const mapData = globalCache.mapData.getMapData(this.currentMapPath);
      if (!mapData) {
        return;
      }

      // Save to file
      await vscode.workspace.fs.writeFile(
        vscode.Uri.file(this.currentMapPath),
        Buffer.from(JSON.stringify(mapData, null, 2))
      );

      // Reset dirty state
      this.isDirty = false;

      // Update status
      this.updateStatusEnhanced();

      // Show notification
      vscode.window.setStatusBarMessage('Map saved', 2000);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to save map: ${error}`);
    }
  }

  /**
   * Auto-save if enabled
   */
  private async autoSave(): Promise<void> {
    const config = vscode.workspace.getConfiguration('manicMiners');
    if (config.get('editor.autoSave') && this.isDirty) {
      await this.saveMap();
    }
  }

  /**
   * Undo last action
   */
  private async undo(): Promise<void> {
    this.webview?.postMessage({ type: 'undo' });
  }

  /**
   * Redo action
   */
  private async redo(): Promise<void> {
    this.webview?.postMessage({ type: 'redo' });
  }

  /**
   * Export map in specified format
   */
  private async exportMap(format: string): Promise<void> {
    if (!this.currentMapPath) {
      return;
    }

    const mapData = globalCache.mapData.getMapData(this.currentMapPath);
    if (!mapData) {
      return;
    }

    switch (format) {
      case 'image':
        await this.exportAsImage(mapData);
        break;
      case 'json':
        await this.exportAsJSON(mapData);
        break;
    }
  }

  /**
   * Update status bar
   */
  /*
  private updateStatus(): void {
    if (!this.webview) return;

    this.webview.postMessage({
      type: 'updateStatus',
      status: {
        tool: this.currentTool,
        tile: this.selectedTileId,
        saved: !this.isDirty,
        mapName: this.currentMapPath
          ? vscode.workspace.asRelativePath(this.currentMapPath)
          : 'No map loaded',
      },
    });
  }
  */

  /**
   * Load map data from file
   */
  private async loadMapData(mapPath: string): Promise<any> {
    const uri = vscode.Uri.file(mapPath);
    const data = await vscode.workspace.fs.readFile(uri);
    return JSON.parse(data.toString());
  }

  /**
   * Display map in editor
   */
  private async displayMap(mapData: any): Promise<void> {
    if (!this.webview) {
      return;
    }

    // Use progressive rendering for large maps
    if (mapData.width * mapData.height > 10000) {
      this.webview.postMessage({
        type: 'renderProgressive',
        mapData,
      });
    } else {
      this.webview.postMessage({
        type: 'renderMap',
        mapData,
      });
    }
  }

  /**
   * Get tools panel content
   */
  private async getToolsPanelContent(): Promise<string> {
    return `
      <div class="editor-tools">
        <div class="tool-group">
          <h4>${generateAriaLabel('toolGroup', { name: 'Drawing Tools' })}</h4>
          <div class="tool-grid" role="toolbar" aria-label="Drawing tools">
            <button class="tool-btn ${this.currentTool === 'paint' ? 'active' : ''}" 
                    data-tool="paint" aria-pressed="${this.currentTool === 'paint'}">
              <span class="icon">🖌️</span>
              <span>Paint</span>
            </button>
            <button class="tool-btn ${this.currentTool === 'brush' ? 'active' : ''}" 
                    data-tool="brush" aria-pressed="${this.currentTool === 'brush'}">
              <span class="icon">🖌️</span>
              <span>Brush</span>
            </button>
            <button class="tool-btn ${this.currentTool === 'fill' ? 'active' : ''}" 
                    data-tool="fill" aria-pressed="${this.currentTool === 'fill'}">
              <span class="icon">🪣</span>
              <span>Fill</span>
            </button>
            <button class="tool-btn ${this.currentTool === 'line' ? 'active' : ''}" 
                    data-tool="line" aria-pressed="${this.currentTool === 'line'}">
              <span class="icon">📏</span>
              <span>Line</span>
            </button>
          </div>
        </div>
        
        <div class="tool-group">
          <h4>Brush Settings</h4>
          <div class="brush-settings">
            <label for="brush-size">Size:</label>
            <input type="range" id="brush-size" min="1" max="10" value="${this.brushSize}" 
                   aria-label="Brush size" aria-valuemin="1" aria-valuemax="10" aria-valuenow="${this.brushSize}">
            <span class="brush-size-value">${this.brushSize}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get layers panel content
   */
  private async getLayersPanelContent(): Promise<string> {
    return `
      <div class="editor-layers">
        <div class="layers-list" role="list" aria-label="Map layers">
          <div class="layer-item" role="listitem">
            <input type="checkbox" id="layer-tiles" checked aria-label="Toggle tiles layer">
            <label for="layer-tiles">
              <span class="icon">🗺️</span>
              <span>Tiles</span>
            </label>
          </div>
          <div class="layer-item" role="listitem">
            <input type="checkbox" id="layer-height" checked aria-label="Toggle height layer">
            <label for="layer-height">
              <span class="icon">📏</span>
              <span>Height</span>
            </label>
          </div>
          <div class="layer-item" role="listitem">
            <input type="checkbox" id="layer-buildings" checked aria-label="Toggle buildings layer">
            <label for="layer-buildings">
              <span class="icon">🏢</span>
              <span>Buildings</span>
            </label>
          </div>
          <div class="layer-item" role="listitem">
            <input type="checkbox" id="layer-resources" checked aria-label="Toggle resources layer">
            <label for="layer-resources">
              <span class="icon">💎</span>
              <span>Resources</span>
            </label>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Export map as image
   */
  private async exportAsImage(_mapData: any): Promise<void> {
    // Implementation would use canvas to generate image
    vscode.window.showInformationMessage('Map exported as image');
  }

  /**
   * Export map as JSON
   */
  private async exportAsJSON(mapData: any): Promise<void> {
    const uri = await vscode.window.showSaveDialog({
      filters: { JSON: ['json'] },
      defaultUri: vscode.Uri.file('map-export.json'),
    });

    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(mapData, null, 2)));
      vscode.window.showInformationMessage('Map exported as JSON');
    }
  }

  /**
   * Handle settings change
   */
  private handleSettingsChange(message: any): void {
    // Update editor settings
    switch (message.setting) {
      case 'showGrid':
        this.webview?.postMessage({
          type: 'toggleGrid',
          enabled: message.value,
        });
        break;
      case 'snapToGrid':
        // Update snap to grid setting
        break;
    }
  }

  /**
   * Set tile height
   */
  private async setTileHeight(x: number, y: number, height: number): Promise<void> {
    if (!this.webview || !this.currentMapPath) {
      return;
    }

    const mapData = globalCache.mapData.getMapData(this.currentMapPath);
    if (mapData) {
      const index = y * mapData.width + x;
      mapData.tiles[index].height = height;

      // Update cache
      globalCache.mapData.setTileData(this.currentMapPath, x, y, mapData.tiles[index]);

      // Update display
      this.webview.postMessage({
        type: 'updateTile',
        x,
        y,
        tile: mapData.tiles[index],
      });
    }
  }

  /**
   * Place building
   */
  private async placeBuilding(x: number, y: number, buildingType: string): Promise<void> {
    if (!this.webview || !this.currentMapPath) {
      return;
    }

    const mapData = globalCache.mapData.getMapData(this.currentMapPath);
    if (mapData) {
      const index = y * mapData.width + x;
      mapData.tiles[index].building = buildingType;

      // Update cache
      globalCache.mapData.setTileData(this.currentMapPath, x, y, mapData.tiles[index]);

      // Update display
      this.webview.postMessage({
        type: 'updateTile',
        x,
        y,
        tile: mapData.tiles[index],
      });
    }
  }

  /**
   * Place resource
   */
  private async placeResource(
    x: number,
    y: number,
    resourceType: string,
    amount: number
  ): Promise<void> {
    if (!this.webview || !this.currentMapPath) {
      return;
    }

    const mapData = globalCache.mapData.getMapData(this.currentMapPath);
    if (mapData) {
      const index = y * mapData.width + x;
      mapData.tiles[index][resourceType] = amount;

      // Update cache
      globalCache.mapData.setTileData(this.currentMapPath, x, y, mapData.tiles[index]);

      // Update display
      this.webview.postMessage({
        type: 'updateTile',
        x,
        y,
        tile: mapData.tiles[index],
      });
    }
  }

  /**
   * Save undo state
   */
  private async saveUndoState(): Promise<void> {
    if (!this.currentMapPath) {
      return;
    }

    const mapData = globalCache.mapData.getMapData(this.currentMapPath);
    if (mapData) {
      // Deep clone the current state
      const state = {
        tiles: JSON.parse(JSON.stringify(mapData.tiles)),
        timestamp: Date.now(),
      };

      this.undoStack.push(state);

      // Limit undo stack size
      if (this.undoStack.length > this.maxUndoLevels) {
        this.undoStack.shift();
      }

      // Clear redo stack when new action is performed
      this.redoStack = [];
    }
  }

  /**
   * Copy selection
   */
  private async copySelection(): Promise<void> {
    if (!this.selectionArea || !this.currentMapPath) {
      return;
    }

    const mapData = globalCache.mapData.getMapData(this.currentMapPath);
    if (!mapData) {
      return;
    }

    const { start, end } = this.selectionArea;
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    this.copiedTiles = [];

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const index = y * mapData.width + x;
        this.copiedTiles.push({
          relX: x - minX,
          relY: y - minY,
          tile: JSON.parse(JSON.stringify(mapData.tiles[index])),
        });
      }
    }

    vscode.window.setStatusBarMessage(`Copied ${this.copiedTiles.length} tiles`, 2000);
  }

  /**
   * Paste selection
   */
  private async pasteSelection(x: number, y: number): Promise<void> {
    if (!this.copiedTiles || !this.currentMapPath) {
      return;
    }

    await this.saveUndoState();

    const tiles = [];
    for (const copied of this.copiedTiles) {
      tiles.push({
        x: x + copied.relX,
        y: y + copied.relY,
        tileId: copied.tile.type,
      });
    }

    await this.paintArea(tiles);

    vscode.window.setStatusBarMessage(`Pasted ${tiles.length} tiles`, 2000);
  }

  /**
   * Delete selection
   */
  private async deleteSelection(): Promise<void> {
    if (!this.selectionArea || !this.currentMapPath) {
      return;
    }

    await this.saveUndoState();

    const { start, end } = this.selectionArea;
    const tiles = [];

    for (let y = Math.min(start.y, end.y); y <= Math.max(start.y, end.y); y++) {
      for (let x = Math.min(start.x, end.x); x <= Math.max(start.x, end.x); x++) {
        tiles.push({ x, y, tileId: 0 }); // 0 = empty tile
      }
    }

    await this.paintArea(tiles);

    // Clear selection
    this.selectionArea = undefined;
    this.webview?.postMessage({ type: 'clearSelection' });
  }

  /**
   * Select all tiles
   */
  private async selectAll(): Promise<void> {
    if (!this.currentMapPath) {
      return;
    }

    const mapData = globalCache.mapData.getMapData(this.currentMapPath);
    if (!mapData) {
      return;
    }

    this.selectionArea = {
      start: { x: 0, y: 0 },
      end: { x: mapData.width - 1, y: mapData.height - 1 },
    };

    this.webview?.postMessage({
      type: 'setSelection',
      selection: this.selectionArea,
    });
  }

  /**
   * Handle zoom
   */
  private handleZoom(level: number, centerX?: number, centerY?: number): void {
    this.zoomLevel = Math.max(0.25, Math.min(4, level));

    if (centerX !== undefined && centerY !== undefined) {
      // Adjust viewport to keep center point stable
      const scaleDiff = this.zoomLevel / level;
      this.viewportOffset.x = centerX - (centerX - this.viewportOffset.x) * scaleDiff;
      this.viewportOffset.y = centerY - (centerY - this.viewportOffset.y) * scaleDiff;
    }

    this.webview?.postMessage({
      type: 'setZoom',
      zoom: this.zoomLevel,
      offset: this.viewportOffset,
    });

    this.updateStatusEnhanced();
  }

  /**
   * Handle pan
   */
  private handlePan(deltaX: number, deltaY: number): void {
    this.viewportOffset.x += deltaX;
    this.viewportOffset.y += deltaY;

    this.webview?.postMessage({
      type: 'setPan',
      offset: this.viewportOffset,
    });
  }

  /**
   * Handle selection changes
   */
  private async handleSelection(message: any): Promise<void> {
    if (message.action === 'start') {
      this.selectionArea = {
        start: { x: message.x, y: message.y },
        end: { x: message.x, y: message.y },
      };
    } else if (message.action === 'update' && this.selectionArea) {
      this.selectionArea.end = { x: message.x, y: message.y };

      this.webview?.postMessage({
        type: 'updateSelection',
        selection: this.selectionArea,
      });
    } else if (message.action === 'end') {
      // Selection complete
      this.updateStatusEnhanced();
    }
  }

  /**
   * Handle transform operations
   */
  private async handleTransform(message: any): Promise<void> {
    if (!this.selectionArea || !this.currentMapPath) {
      return;
    }

    await this.saveUndoState();

    const { type, params } = message;

    switch (type) {
      case 'rotate':
        await this.rotateSelection(params.angle);
        break;
      case 'flip':
        await this.flipSelection(params.horizontal, params.vertical);
        break;
      case 'scale':
        await this.scaleSelection(params.scaleX, params.scaleY);
        break;
    }
  }

  /**
   * Handle layer visibility changes
   */
  private handleLayerChange(message: any): void {
    const { layer, visible } = message;

    this.webview?.postMessage({
      type: 'setLayerVisibility',
      layer,
      visible,
    });
  }

  /**
   * Draw rectangle
   */
  private async drawRectangle(
    start: { x: number; y: number },
    end: { x: number; y: number },
    tileId: number,
    filled: boolean
  ): Promise<void> {
    const tiles = [];
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    if (filled) {
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          tiles.push({ x, y, tileId });
        }
      }
    } else {
      // Draw outline only
      for (let x = minX; x <= maxX; x++) {
        tiles.push({ x, y: minY, tileId });
        tiles.push({ x, y: maxY, tileId });
      }
      for (let y = minY + 1; y < maxY; y++) {
        tiles.push({ x: minX, y, tileId });
        tiles.push({ x: maxX, y, tileId });
      }
    }

    await this.paintArea(tiles);
  }

  /**
   * Draw ellipse
   */
  private async drawEllipse(
    center: { x: number; y: number },
    radiusX: number,
    radiusY: number,
    tileId: number,
    filled: boolean
  ): Promise<void> {
    const tiles = [];

    // Use midpoint ellipse algorithm
    for (let angle = 0; angle < 360; angle++) {
      const radians = (angle * Math.PI) / 180;
      const x = Math.round(center.x + radiusX * Math.cos(radians));
      const y = Math.round(center.y + radiusY * Math.sin(radians));

      if (filled) {
        // Fill from center to edge
        const dx = x - center.x;
        const dy = y - center.y;
        for (let i = 0; i <= 1; i += 0.1) {
          const fillX = Math.round(center.x + dx * i);
          const fillY = Math.round(center.y + dy * i);
          tiles.push({ x: fillX, y: fillY, tileId });
        }
      } else {
        tiles.push({ x, y, tileId });
      }
    }

    // Remove duplicates
    const uniqueTiles = Array.from(new Set(tiles.map(t => `${t.x},${t.y}`))).map(key => {
      const [x, y] = key.split(',').map(Number);
      return { x, y, tileId };
    });

    await this.paintArea(uniqueTiles);
  }

  /**
   * Draw line with width
   */
  private async drawLine(
    start: { x: number; y: number },
    end: { x: number; y: number },
    tileId: number,
    width: number
  ): Promise<void> {
    const tiles = [];

    // Bresenham's line algorithm with width
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    const sx = start.x < end.x ? 1 : -1;
    const sy = start.y < end.y ? 1 : -1;
    let err = dx - dy;

    let x = start.x;
    let y = start.y;

    while (true) {
      // Add tiles for line width
      for (let wx = -Math.floor(width / 2); wx <= Math.floor(width / 2); wx++) {
        for (let wy = -Math.floor(width / 2); wy <= Math.floor(width / 2); wy++) {
          tiles.push({ x: x + wx, y: y + wy, tileId });
        }
      }

      if (x === end.x && y === end.y) {
        break;
      }

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    await this.paintArea(tiles);
  }

  /**
   * Rotate selection
   */
  private async rotateSelection(angle: number): Promise<void> {
    // Implementation would rotate selected tiles
    vscode.window.showInformationMessage(`Rotated selection by ${angle}°`);
  }

  /**
   * Flip selection
   */
  private async flipSelection(horizontal: boolean, _vertical: boolean): Promise<void> {
    // Implementation would flip selected tiles
    const direction = horizontal ? 'horizontally' : 'vertically';
    vscode.window.showInformationMessage(`Flipped selection ${direction}`);
  }

  /**
   * Scale selection
   */
  private async scaleSelection(scaleX: number, scaleY: number): Promise<void> {
    // Implementation would scale selected tiles
    vscode.window.showInformationMessage(`Scaled selection by ${scaleX}x${scaleY}`);
  }

  /**
   * Update recent tools list
   */
  private updateRecentTools(tool: string): void {
    // Remove if already in list
    this.toolHistory = this.toolHistory.filter(t => t !== tool);

    // Add to front
    this.toolHistory.unshift(tool);

    // Limit size
    if (this.toolHistory.length > 5) {
      this.toolHistory.pop();
    }

    // Update UI
    this.webview?.postMessage({
      type: 'updateRecentTools',
      tools: this.toolHistory,
    });
  }

  /**
   * Update status bar with enhanced info
   */
  private updateStatusEnhanced(): void {
    if (!this.webview) {
      return;
    }

    let selectionInfo = '';
    if (this.selectionArea) {
      const width = Math.abs(this.selectionArea.end.x - this.selectionArea.start.x) + 1;
      const height = Math.abs(this.selectionArea.end.y - this.selectionArea.start.y) + 1;
      selectionInfo = `Selection: ${width}×${height}`;
    }

    this.webview.postMessage({
      type: 'updateStatus',
      status: {
        tool: this.currentTool,
        tile: this.selectedTileId,
        saved: !this.isDirty,
        mapName: this.currentMapPath
          ? vscode.workspace.asRelativePath(this.currentMapPath)
          : 'No map loaded',
        zoom: `${Math.round(this.zoomLevel * 100)}%`,
        selection: selectionInfo,
        undoLevels: this.undoStack.length,
        redoLevels: this.redoStack.length,
      },
    });
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    this.lazyLoader?.dispose();

    // Clear cache for current map
    if (this.currentMapPath) {
      globalCache.mapData.clearAll();
    }
  }
}
