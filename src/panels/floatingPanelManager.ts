import * as vscode from 'vscode';

export interface FloatingPanel {
  id: string;
  title: string;
  icon: string;
  content: string;
  position: PanelPosition;
  size: PanelSize;
  collapsed: boolean;
  pinned: boolean;
  visible: boolean;
}

export interface PanelPosition {
  x: number;
  y: number;
  docked?: 'left' | 'right' | 'top' | 'bottom' | 'float';
}

export interface PanelSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface PanelDockZone {
  id: string;
  position: 'left' | 'right' | 'top' | 'bottom';
  panels: string[];
}

export class FloatingPanelManager {
  private panels: Map<string, FloatingPanel> = new Map();
  private dockZones: Map<string, PanelDockZone> = new Map();
  private context: vscode.ExtensionContext;
  private onPanelChangeEmitter = new vscode.EventEmitter<FloatingPanel>();
  public readonly onPanelChange = this.onPanelChangeEmitter.event;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.initializeDefaultPanels();
    this.initializeDockZones();
    this.loadPanelState();
  }

  private initializeDefaultPanels() {
    // Tool Panel
    this.addPanel({
      id: 'tools',
      title: 'Tools',
      icon: '🛠️',
      content: this.getToolsContent(),
      position: { x: 0, y: 100, docked: 'left' },
      size: { width: 200, height: 400, minWidth: 150, minHeight: 300 },
      collapsed: false,
      pinned: true,
      visible: true,
    });

    // Properties Panel
    this.addPanel({
      id: 'properties',
      title: 'Properties',
      icon: '📋',
      content: this.getPropertiesContent(),
      position: { x: 0, y: 100, docked: 'right' },
      size: { width: 250, height: 300, minWidth: 200, minHeight: 200 },
      collapsed: false,
      pinned: true,
      visible: true,
    });

    // Layers Panel
    this.addPanel({
      id: 'layers',
      title: 'Layers',
      icon: '📚',
      content: this.getLayersContent(),
      position: { x: 0, y: 420, docked: 'right' },
      size: { width: 250, height: 200, minWidth: 200, minHeight: 150 },
      collapsed: false,
      pinned: true,
      visible: true,
    });

    // History Panel
    this.addPanel({
      id: 'history',
      title: 'History',
      icon: '🕐',
      content: this.getHistoryContent(),
      position: { x: 300, y: 100, docked: 'float' },
      size: { width: 200, height: 300, minWidth: 150, minHeight: 200 },
      collapsed: false,
      pinned: false,
      visible: false,
    });

    // Color Picker Panel
    this.addPanel({
      id: 'colorPicker',
      title: 'Color Picker',
      icon: '🎨',
      content: this.getColorPickerContent(),
      position: { x: 520, y: 100, docked: 'float' },
      size: { width: 240, height: 280, minWidth: 200, minHeight: 250 },
      collapsed: false,
      pinned: false,
      visible: false,
    });
  }

  private initializeDockZones() {
    const zones: PanelDockZone[] = [
      { id: 'left-dock', position: 'left', panels: ['tools'] },
      { id: 'right-dock', position: 'right', panels: ['properties', 'layers'] },
      { id: 'top-dock', position: 'top', panels: [] },
      { id: 'bottom-dock', position: 'bottom', panels: [] },
    ];

    zones.forEach(zone => this.dockZones.set(zone.id, zone));
  }

  public addPanel(panel: FloatingPanel) {
    this.panels.set(panel.id, panel);
    this.onPanelChangeEmitter.fire(panel);
    this.savePanelState();
  }

  public removePanel(panelId: string) {
    const panel = this.panels.get(panelId);
    if (panel) {
      this.panels.delete(panelId);
      this.removeFromDockZones(panelId);
      this.savePanelState();
    }
  }

  public updatePanel(panelId: string, updates: Partial<FloatingPanel>) {
    const panel = this.panels.get(panelId);
    if (panel) {
      const updatedPanel = { ...panel, ...updates };
      this.panels.set(panelId, updatedPanel);
      this.onPanelChangeEmitter.fire(updatedPanel);
      this.savePanelState();
    }
  }

  public togglePanel(panelId: string) {
    const panel = this.panels.get(panelId);
    if (panel) {
      this.updatePanel(panelId, { visible: !panel.visible });
    }
  }

  public dockPanel(panelId: string, dockPosition: 'left' | 'right' | 'top' | 'bottom' | 'float') {
    const panel = this.panels.get(panelId);
    if (panel) {
      // Remove from current dock zone
      this.removeFromDockZones(panelId);

      // Update panel position
      const updatedPosition = { ...panel.position, docked: dockPosition };
      this.updatePanel(panelId, { position: updatedPosition });

      // Add to new dock zone if not floating
      if (dockPosition !== 'float') {
        const dockZone = this.dockZones.get(`${dockPosition}-dock`);
        if (dockZone) {
          dockZone.panels.push(panelId);
        }
      }
    }
  }

  public resizePanel(panelId: string, size: Partial<PanelSize>) {
    const panel = this.panels.get(panelId);
    if (panel) {
      const newSize = { ...panel.size, ...size };
      // Enforce min/max constraints
      if (panel.size.minWidth && newSize.width < panel.size.minWidth) {
        newSize.width = panel.size.minWidth;
      }
      if (panel.size.maxWidth && newSize.width > panel.size.maxWidth) {
        newSize.width = panel.size.maxWidth;
      }
      if (panel.size.minHeight && newSize.height < panel.size.minHeight) {
        newSize.height = panel.size.minHeight;
      }
      if (panel.size.maxHeight && newSize.height > panel.size.maxHeight) {
        newSize.height = panel.size.maxHeight;
      }
      this.updatePanel(panelId, { size: newSize });
    }
  }

  public movePanel(panelId: string, position: Partial<PanelPosition>) {
    const panel = this.panels.get(panelId);
    if (panel) {
      const newPosition = { ...panel.position, ...position };
      this.updatePanel(panelId, { position: newPosition });
    }
  }

  public collapsePanel(panelId: string, collapsed: boolean) {
    this.updatePanel(panelId, { collapsed });
  }

  public pinPanel(panelId: string, pinned: boolean) {
    this.updatePanel(panelId, { pinned });
  }

  public getPanels(): FloatingPanel[] {
    return Array.from(this.panels.values());
  }

  public getPanel(panelId: string): FloatingPanel | undefined {
    return this.panels.get(panelId);
  }

  public getDockZones(): PanelDockZone[] {
    return Array.from(this.dockZones.values());
  }

  private removeFromDockZones(panelId: string) {
    this.dockZones.forEach(zone => {
      const index = zone.panels.indexOf(panelId);
      if (index !== -1) {
        zone.panels.splice(index, 1);
      }
    });
  }

  private savePanelState() {
    const state = {
      panels: Array.from(this.panels.entries()),
      dockZones: Array.from(this.dockZones.entries()),
    };
    this.context.globalState.update('floatingPanels', state);
  }

  private loadPanelState() {
    const state = this.context.globalState.get<{
      panels: [string, FloatingPanel][];
      dockZones: [string, PanelDockZone][];
    }>('floatingPanels');

    if (state) {
      this.panels = new Map(state.panels);
      this.dockZones = new Map(state.dockZones);
    }
  }

  // Panel content generators
  private getToolsContent(): string {
    return `
      <div class="tool-grid">
        <button class="tool-button" data-tool="brush">🖌️ Brush</button>
        <button class="tool-button" data-tool="eraser">🧹 Eraser</button>
        <button class="tool-button" data-tool="fill">🪣 Fill</button>
        <button class="tool-button" data-tool="pick">💧 Pick</button>
        <button class="tool-button" data-tool="line">📏 Line</button>
        <button class="tool-button" data-tool="rect">⬛ Rectangle</button>
        <button class="tool-button" data-tool="circle">⭕ Circle</button>
        <button class="tool-button" data-tool="select">✂️ Select</button>
      </div>
    `;
  }

  private getPropertiesContent(): string {
    return `
      <div class="properties-panel">
        <div class="property-group">
          <label>Tile Type</label>
          <select id="tileType">
            <option value="0">Empty (0)</option>
            <option value="1">Dirt (1)</option>
            <option value="4">Solid Rock (4)</option>
          </select>
        </div>
        <div class="property-group">
          <label>Height</label>
          <input type="range" id="height" min="0" max="9" value="5">
          <span id="heightValue">5</span>
        </div>
        <div class="property-group">
          <label>Building</label>
          <select id="building">
            <option value="">None</option>
            <option value="ToolStore">Tool Store</option>
            <option value="TeleportPad">Teleport Pad</option>
          </select>
        </div>
      </div>
    `;
  }

  private getLayersContent(): string {
    return `
      <div class="layers-panel">
        <div class="layer-item active">
          <input type="checkbox" checked>
          <span>🗺️ Tiles</span>
          <button class="layer-visibility">👁️</button>
        </div>
        <div class="layer-item">
          <input type="checkbox" checked>
          <span>📏 Height</span>
          <button class="layer-visibility">👁️</button>
        </div>
        <div class="layer-item">
          <input type="checkbox" checked>
          <span>💎 Resources</span>
          <button class="layer-visibility">👁️</button>
        </div>
        <div class="layer-item">
          <input type="checkbox" checked>
          <span>🏢 Buildings</span>
          <button class="layer-visibility">👁️</button>
        </div>
      </div>
    `;
  }

  private getHistoryContent(): string {
    return `
      <div class="history-panel">
        <div class="history-item">📝 Initial state</div>
        <div class="history-item">🖌️ Paint tile at (5,5)</div>
        <div class="history-item">🪣 Fill area (3,3) to (7,7)</div>
        <div class="history-item active">📏 Set height to 8</div>
      </div>
    `;
  }

  private getColorPickerContent(): string {
    return `
      <div class="color-picker-panel">
        <div class="tile-palette">
          <div class="tile-color" data-tile="0" style="background: #2a2a2a">0</div>
          <div class="tile-color" data-tile="1" style="background: #8b4513">1</div>
          <div class="tile-color" data-tile="2" style="background: #333333">2</div>
          <div class="tile-color" data-tile="3" style="background: #ff0000">3</div>
          <div class="tile-color" data-tile="4" style="background: #666666">4</div>
        </div>
        <div class="selected-tile">
          <h4>Selected Tile: <span id="selectedTileId">1</span></h4>
          <p id="selectedTileDesc">Dirt - Can be drilled</p>
        </div>
      </div>
    `;
  }

  public getWebviewContent(): string {
    return `
      <div class="floating-panels-container">
        ${Array.from(this.panels.values())
          .filter(panel => panel.visible)
          .map(panel => this.renderPanel(panel))
          .join('')}
      </div>
    `;
  }

  private renderPanel(panel: FloatingPanel): string {
    const dockedClass = panel.position.docked !== 'float' ? `docked-${panel.position.docked}` : '';
    const collapsedClass = panel.collapsed ? 'collapsed' : '';

    return `
      <div class="floating-panel ${dockedClass} ${collapsedClass}" 
           id="panel-${panel.id}"
           style="${this.getPanelStyle(panel)}">
        <div class="panel-header" onmousedown="startDrag('${panel.id}', event)">
          <span class="panel-icon">${panel.icon}</span>
          <span class="panel-title">${panel.title}</span>
          <div class="panel-controls">
            <button class="panel-btn" onclick="toggleCollapse('${panel.id}')">${
              panel.collapsed ? '⬆️' : '⬇️'
            }</button>
            <button class="panel-btn" onclick="togglePin('${panel.id}')">${
              panel.pinned ? '📌' : '📍'
            }</button>
            <button class="panel-btn" onclick="closePanel('${panel.id}')">❌</button>
          </div>
        </div>
        <div class="panel-content" style="display: ${panel.collapsed ? 'none' : 'block'}">
          ${panel.content}
        </div>
        <div class="panel-resize-handle" onmousedown="startResize('${panel.id}', event)"></div>
      </div>
    `;
  }

  private getPanelStyle(panel: FloatingPanel): string {
    if (panel.position.docked === 'float') {
      return `
        left: ${panel.position.x}px;
        top: ${panel.position.y}px;
        width: ${panel.size.width}px;
        height: ${panel.size.height}px;
      `;
    }
    return `
      width: ${panel.size.width}px;
      height: ${panel.size.height}px;
    `;
  }
}
