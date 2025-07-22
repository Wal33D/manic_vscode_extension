import * as vscode from 'vscode';
import { WorkspaceLayout, PanelState } from './panelManager';

export interface SavedLayout extends WorkspaceLayout {
  name: string;
  timestamp: number;
  description?: string;
}

export class LayoutManager {
  private static readonly LAYOUTS_KEY = 'workspaceLayouts';
  private static readonly LAST_LAYOUT_KEY = 'lastUsedLayout';

  constructor(private context: vscode.ExtensionContext) {}

  public async saveLayout(name: string, panels: PanelState[]): Promise<void> {
    const layouts = this.getSavedLayouts();

    // Remove existing layout with same name
    const filteredLayouts = layouts.filter(l => l.name !== name);

    // Add new layout
    const newLayout: SavedLayout = {
      name,
      panels: panels.filter(p => p.visible), // Only save visible panels
      timestamp: Date.now(),
    };

    filteredLayouts.push(newLayout);

    // Save to global state
    await this.context.globalState.update(LayoutManager.LAYOUTS_KEY, filteredLayouts);
    await this.context.globalState.update(LayoutManager.LAST_LAYOUT_KEY, newLayout);
  }

  public async loadLayout(name: string): Promise<WorkspaceLayout | undefined> {
    const layouts = this.getSavedLayouts();
    const layout = layouts.find(l => l.name === name);

    if (layout) {
      // Update last used
      await this.context.globalState.update(LayoutManager.LAST_LAYOUT_KEY, layout);
    }

    return layout;
  }

  public async deleteLayout(name: string): Promise<void> {
    const layouts = this.getSavedLayouts();
    const filteredLayouts = layouts.filter(l => l.name !== name);
    await this.context.globalState.update(LayoutManager.LAYOUTS_KEY, filteredLayouts);
  }

  public getSavedLayouts(): SavedLayout[] {
    return this.context.globalState.get<SavedLayout[]>(LayoutManager.LAYOUTS_KEY) || [];
  }

  public async getLastUsedLayout(): Promise<WorkspaceLayout | undefined> {
    return this.context.globalState.get<SavedLayout>(LayoutManager.LAST_LAYOUT_KEY);
  }

  public async exportLayouts(): Promise<string> {
    const layouts = this.getSavedLayouts();
    return JSON.stringify(layouts, null, 2);
  }

  public async importLayouts(json: string): Promise<void> {
    try {
      const layouts = JSON.parse(json) as SavedLayout[];
      if (Array.isArray(layouts)) {
        await this.context.globalState.update(LayoutManager.LAYOUTS_KEY, layouts);
        vscode.window.showInformationMessage(`Imported ${layouts.length} layouts`);
      } else {
        throw new Error('Invalid layout format');
      }
    } catch (error) {
      vscode.window.showErrorMessage('Failed to import layouts: ' + error);
    }
  }

  public getDefaultLayouts(): SavedLayout[] {
    return [
      {
        name: 'Mapping',
        description: 'Optimal layout for map editing',
        panels: [
          {
            id: 'tools',
            title: 'Tools',
            icon: '🛠️',
            visible: true,
            position: 'left',
            size: { width: 200, height: 400 },
          },
          {
            id: 'layers',
            title: 'Layers',
            icon: '📚',
            visible: true,
            position: 'right',
            size: { width: 250, height: 300 },
          },
          {
            id: 'properties',
            title: 'Properties',
            icon: '📋',
            visible: true,
            position: 'right',
            size: { width: 250, height: 200 },
          },
          {
            id: 'tilePalette',
            title: 'Tile Palette',
            icon: '🎨',
            visible: true,
            position: 'bottom',
            size: { width: '100%', height: 150 },
          },
        ],
        timestamp: Date.now(),
      },
      {
        name: 'Scripting',
        description: 'Focus on script development',
        panels: [
          {
            id: 'scriptPatterns',
            title: 'Script Patterns',
            icon: '📝',
            visible: true,
            position: 'left',
            size: { width: 250, height: 400 },
          },
          {
            id: 'validation',
            title: 'Validation',
            icon: '✅',
            visible: true,
            position: 'bottom',
            size: { width: '100%', height: 200 },
          },
          {
            id: 'history',
            title: 'History',
            icon: '🕐',
            visible: true,
            position: 'right',
            size: { width: 200, height: 300 },
          },
        ],
        timestamp: Date.now(),
      },
      {
        name: 'Analysis',
        description: 'Map analysis and optimization',
        panels: [
          {
            id: 'statistics',
            title: 'Statistics',
            icon: '📊',
            visible: true,
            position: 'right',
            size: { width: 300, height: 400 },
          },
          {
            id: 'heatmap',
            title: 'Heat Map',
            icon: '🔥',
            visible: true,
            position: 'center',
            size: { width: '100%', height: '100%' },
          },
          {
            id: 'validation',
            title: 'Validation',
            icon: '✅',
            visible: true,
            position: 'bottom',
            size: { width: '100%', height: 150 },
          },
        ],
        timestamp: Date.now(),
      },
      {
        name: 'Minimal',
        description: 'Clean workspace with minimal panels',
        panels: [
          {
            id: 'tools',
            title: 'Tools',
            icon: '🛠️',
            visible: true,
            position: 'left',
            size: { width: 60, height: 400 },
            collapsed: true,
          },
        ],
        timestamp: Date.now(),
      },
    ];
  }
}
