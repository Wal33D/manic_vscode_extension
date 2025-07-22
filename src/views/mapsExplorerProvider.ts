import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class MapsExplorerProvider implements vscode.TreeDataProvider<MapItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<MapItem | undefined | null | void> =
    new vscode.EventEmitter<MapItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<MapItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor(
    private workspaceRoot: string | undefined,
    private context: vscode.ExtensionContext
  ) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: MapItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: MapItem): Thenable<MapItem[]> {
    if (!element) {
      // Root level items
      return Promise.resolve([
        new MapItem(
          'Recent Maps',
          '',
          vscode.TreeItemCollapsibleState.Expanded,
          'folder',
          'recent'
        ),
        new MapItem(
          'Templates',
          '',
          vscode.TreeItemCollapsibleState.Collapsed,
          'folder',
          'templates'
        ),
        new MapItem(
          'Sample Maps',
          '',
          vscode.TreeItemCollapsibleState.Collapsed,
          'folder',
          'samples'
        ),
        new MapItem(
          'Current Workspace',
          '',
          vscode.TreeItemCollapsibleState.Collapsed,
          'folder',
          'workspace'
        ),
      ]);
    } else {
      switch (element.contextValue) {
        case 'recent':
          return this.getRecentMaps();
        case 'templates':
          return this.getTemplates();
        case 'samples':
          return this.getSampleMaps();
        case 'workspace':
          return this.getWorkspaceMaps();
        default:
          return Promise.resolve([]);
      }
    }
  }

  private async getRecentMaps(): Promise<MapItem[]> {
    const recentMaps = this.context.globalState.get<string[]>('recentMaps', []);
    return recentMaps.slice(0, 10).map(mapPath => {
      const name = path.basename(mapPath);
      return new MapItem(name, mapPath, vscode.TreeItemCollapsibleState.None, 'map', 'map-file', {
        command: 'manicMiners.openMap',
        title: 'Open Map',
        arguments: [mapPath],
      });
    });
  }

  private async getTemplates(): Promise<MapItem[]> {
    // Get built-in templates
    const templates = [
      new MapItem(
        'Tutorial Map',
        'tutorial',
        vscode.TreeItemCollapsibleState.None,
        'template',
        'template'
      ),
      new MapItem(
        'Small Arena',
        'small-arena',
        vscode.TreeItemCollapsibleState.None,
        'template',
        'template'
      ),
      new MapItem(
        'Large Cavern',
        'large-cavern',
        vscode.TreeItemCollapsibleState.None,
        'template',
        'template'
      ),
      new MapItem(
        'Resource Challenge',
        'resource-challenge',
        vscode.TreeItemCollapsibleState.None,
        'template',
        'template'
      ),
      new MapItem(
        'Maze Layout',
        'maze',
        vscode.TreeItemCollapsibleState.None,
        'template',
        'template'
      ),
    ];

    // Add custom templates
    const customTemplates = this.context.workspaceState.get<{ name: string; id: string }[]>(
      'customTemplates',
      []
    );
    customTemplates.forEach(template => {
      templates.push(
        new MapItem(
          template.name,
          template.id,
          vscode.TreeItemCollapsibleState.None,
          'template',
          'custom-template'
        )
      );
    });

    return templates;
  }

  private async getSampleMaps(): Promise<MapItem[]> {
    const samplePath = path.join(this.context.extensionPath, 'sample');
    if (!fs.existsSync(samplePath)) {
      return [];
    }

    const files = fs
      .readdirSync(samplePath)
      .filter(file => file.endsWith('.dat'))
      .map(file => {
        const filePath = path.join(samplePath, file);
        return new MapItem(
          file,
          filePath,
          vscode.TreeItemCollapsibleState.None,
          'map',
          'sample-map',
          {
            command: 'manicMiners.openMap',
            title: 'Open Sample',
            arguments: [filePath],
          }
        );
      });

    return files;
  }

  private async getWorkspaceMaps(): Promise<MapItem[]> {
    if (!this.workspaceRoot) {
      return [];
    }

    const pattern = new vscode.RelativePattern(this.workspaceRoot, '**/*.dat');
    const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 50);

    return files.map(uri => {
      const name = path.relative(this.workspaceRoot!, uri.fsPath);
      return new MapItem(
        name,
        uri.fsPath,
        vscode.TreeItemCollapsibleState.None,
        'map',
        'workspace-map',
        {
          command: 'manicMiners.openMap',
          title: 'Open Map',
          arguments: [uri.fsPath],
        }
      );
    });
  }

  async addRecentMap(mapPath: string): Promise<void> {
    const recentMaps = this.context.globalState.get<string[]>('recentMaps', []);

    // Remove if already exists
    const index = recentMaps.indexOf(mapPath);
    if (index > -1) {
      recentMaps.splice(index, 1);
    }

    // Add to beginning
    recentMaps.unshift(mapPath);

    // Keep only last 20
    if (recentMaps.length > 20) {
      recentMaps.pop();
    }

    await this.context.globalState.update('recentMaps', recentMaps);
    this.refresh();
  }
}

class MapItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly path: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemType: 'folder' | 'map' | 'template',
    public override readonly contextValue: string,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    this.tooltip = this.path || this.label;

    // Set icon based on type
    switch (itemType) {
      case 'folder':
        this.iconPath = new vscode.ThemeIcon('folder');
        break;
      case 'map':
        this.iconPath = new vscode.ThemeIcon('file');
        this.resourceUri = vscode.Uri.file(path);
        break;
      case 'template':
        this.iconPath = new vscode.ThemeIcon('file-code');
        break;
    }
  }
}
