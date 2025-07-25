import * as vscode from 'vscode';

export interface PanelState {
  id: string;
  title: string;
  icon: string;
  visible: boolean;
  position: 'left' | 'right' | 'top' | 'bottom' | 'center' | 'float';
  size: {
    width: number | string;
    height: number | string;
  };
  collapsed?: boolean;
  maximized?: boolean;
  tabIndex?: number;
  zIndex?: number;
  tabGroup?: string; // Group panels into tabs
  activeTab?: boolean; // Is this the active tab in its group
}

export interface WorkspaceLayout {
  name?: string;
  panels: PanelState[];
  timestamp?: number;
}

export class PanelManager {
  private panels: Map<string, PanelState> = new Map();
  private _onPanelChange = new vscode.EventEmitter<PanelState>();
  public readonly onPanelChange = this._onPanelChange.event;

  constructor(private context: vscode.ExtensionContext) {
    this.initializeDefaultPanels();
    this.loadPanelStates();
  }

  private initializeDefaultPanels() {
    const defaultPanels: PanelState[] = [
      {
        id: 'tools',
        title: 'Tools',
        icon: '🛠️',
        visible: false,
        position: 'left',
        size: { width: 200, height: 400 },
        tabGroup: 'leftTools',
        activeTab: true,
      },
      {
        id: 'scriptPatterns',
        title: 'Script Patterns',
        icon: '📝',
        visible: false,
        position: 'left',
        size: { width: 250, height: 400 },
        tabGroup: 'leftTools',
        activeTab: false,
      },
      {
        id: 'history',
        title: 'History',
        icon: '🕐',
        visible: false,
        position: 'left',
        size: { width: 200, height: 300 },
        tabGroup: 'leftTools',
        activeTab: false,
      },
      {
        id: 'properties',
        title: 'Properties',
        icon: '📋',
        visible: false,
        position: 'right',
        size: { width: 250, height: 300 },
        tabGroup: 'rightInspector',
        activeTab: true,
      },
      {
        id: 'layers',
        title: 'Layers',
        icon: '📚',
        visible: false,
        position: 'right',
        size: { width: 250, height: 200 },
        tabGroup: 'rightInspector',
        activeTab: false,
      },
      {
        id: 'tilePalette',
        title: 'Tile Palette',
        icon: '🎨',
        visible: false,
        position: 'right',
        size: { width: 240, height: 320 },
        tabGroup: 'rightInspector',
        activeTab: false,
      },
      {
        id: 'statistics',
        title: 'Statistics',
        icon: '📊',
        visible: false,
        position: 'right',
        size: { width: 300, height: 400 },
        tabGroup: 'rightInspector',
        activeTab: false,
      },
      {
        id: 'validation',
        title: 'Validation',
        icon: '✅',
        visible: false,
        position: 'bottom',
        size: { width: '100%', height: 200 },
      },
      {
        id: 'heatmap',
        title: 'Heat Map',
        icon: '🔥',
        visible: false,
        position: 'center',
        size: { width: '100%', height: '100%' },
      },
    ];

    defaultPanels.forEach(panel => {
      this.panels.set(panel.id, panel);
    });
  }

  private loadPanelStates() {
    const savedStates = this.context.globalState.get<PanelState[]>('workspacePanelStates');
    if (savedStates) {
      savedStates.forEach(state => {
        if (this.panels.has(state.id)) {
          this.panels.set(state.id, { ...this.panels.get(state.id)!, ...state });
        }
      });
    }
  }

  private savePanelStates() {
    const states = Array.from(this.panels.values());
    this.context.globalState.update('workspacePanelStates', states);
  }

  public getPanelStates(): PanelState[] {
    return Array.from(this.panels.values());
  }

  public getPanel(id: string): PanelState | undefined {
    return this.panels.get(id);
  }

  public togglePanel(id: string) {
    const panel = this.panels.get(id);
    if (panel) {
      panel.visible = !panel.visible;
      this._onPanelChange.fire(panel);
      this.savePanelStates();
    }
  }

  public showPanel(id: string) {
    const panel = this.panels.get(id);
    if (panel && !panel.visible) {
      panel.visible = true;
      // If panel is part of a tab group, ensure it's the active tab
      if (panel.tabGroup) {
        this.setActiveTab(id);
      } else {
        this._onPanelChange.fire(panel);
        this.savePanelStates();
      }
    }
  }

  public closePanel(id: string) {
    const panel = this.panels.get(id);
    if (panel && panel.visible) {
      panel.visible = false;
      this._onPanelChange.fire(panel);
      this.savePanelStates();
    }
  }

  public dockPanel(id: string, position: PanelState['position']) {
    const panel = this.panels.get(id);
    if (panel) {
      panel.position = position;
      this._onPanelChange.fire(panel);
      this.savePanelStates();
    }
  }

  public resizePanel(id: string, size: Partial<PanelState['size']>) {
    const panel = this.panels.get(id);
    if (panel) {
      panel.size = { ...panel.size, ...size };
      this._onPanelChange.fire(panel);
      this.savePanelStates();
    }
  }

  public movePanel(id: string, position: { x?: number; y?: number }) {
    const panel = this.panels.get(id);
    if (panel && panel.position === 'float') {
      // Store float position in panel metadata
      const panelWithFloat = panel as PanelState & { floatPosition?: { x?: number; y?: number } };
      panelWithFloat.floatPosition = position;
      this._onPanelChange.fire(panel);
      this.savePanelStates();
    }
  }

  public collapsePanel(id: string, collapsed: boolean) {
    const panel = this.panels.get(id);
    if (panel) {
      panel.collapsed = collapsed;
      this._onPanelChange.fire(panel);
      this.savePanelStates();
    }
  }

  public maximizePanel(id: string, maximized: boolean) {
    const panel = this.panels.get(id);
    if (panel) {
      panel.maximized = maximized;
      // If maximizing, minimize other panels in the same position
      if (maximized) {
        this.panels.forEach(p => {
          if (p.id !== id && p.position === panel.position) {
            p.collapsed = true;
          }
        });
      }
      this._onPanelChange.fire(panel);
      this.savePanelStates();
    }
  }

  public focusPanel(id: string) {
    const panel = this.panels.get(id);
    if (panel) {
      // Update z-index for floating panels
      if (panel.position === 'float') {
        const maxZ = Math.max(
          ...Array.from(this.panels.values())
            .filter(p => p.position === 'float')
            .map(p => p.zIndex || 0)
        );
        panel.zIndex = maxZ + 1;
      }
      this._onPanelChange.fire(panel);
      this.savePanelStates();
    }
  }

  public applyLayout(layout: WorkspaceLayout) {
    // First, hide all panels
    this.panels.forEach(panel => {
      panel.visible = false;
    });

    // Apply the layout
    layout.panels.forEach(layoutPanel => {
      const panel = this.panels.get(layoutPanel.id);
      if (panel) {
        Object.assign(panel, layoutPanel);
      }
    });

    this._onPanelChange.fire({} as PanelState); // Trigger full update
    this.savePanelStates();
  }

  public getVisiblePanels(): PanelState[] {
    return Array.from(this.panels.values()).filter(p => p.visible);
  }

  public getPanelsByPosition(position: PanelState['position']): PanelState[] {
    return Array.from(this.panels.values()).filter(p => p.visible && p.position === position);
  }

  public setActiveTab(panelId: string) {
    const panel = this.panels.get(panelId);
    if (panel && panel.tabGroup) {
      // Deactivate other tabs in the same group
      this.panels.forEach(p => {
        if (p.tabGroup === panel.tabGroup && p.id !== panelId) {
          p.activeTab = false;
        }
      });
      // Activate this tab
      panel.activeTab = true;
      panel.visible = true;
      this._onPanelChange.fire(panel);
      this.savePanelStates();
    }
  }

  public getTabGroups(): Map<string, PanelState[]> {
    const groups = new Map<string, PanelState[]>();
    this.panels.forEach(panel => {
      if (panel.tabGroup) {
        const group = groups.get(panel.tabGroup) || [];
        group.push(panel);
        groups.set(panel.tabGroup, group);
      }
    });
    return groups;
  }

  public createTabGroup(panelIds: string[], groupName: string) {
    let firstPanel = true;
    panelIds.forEach(id => {
      const panel = this.panels.get(id);
      if (panel) {
        panel.tabGroup = groupName;
        panel.activeTab = firstPanel;
        panel.visible = firstPanel;
        firstPanel = false;
      }
    });
    this._onPanelChange.fire({} as PanelState);
    this.savePanelStates();
  }

  public dispose() {
    this._onPanelChange.dispose();
  }
}
