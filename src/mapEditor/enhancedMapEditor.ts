import * as vscode from 'vscode';
import { PanelManager } from '../workspace/panelManager';

/**
 * Enhanced Map Editor that integrates with the workspace system
 * Provides integrated tool panels, property inspector, and toolbar
 */
export class EnhancedMapEditorProvider implements vscode.CustomTextEditorProvider {
  private static readonly enhancedViewType = 'manicMiners.enhancedMapEditor';
  private workspaceIntegration: boolean = true;
  private panelManager?: PanelManager;

  constructor(private readonly context: vscode.ExtensionContext) {}

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new EnhancedMapEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      EnhancedMapEditorProvider.enhancedViewType,
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false,
      }
    );
    return providerRegistration;
  }

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'media'),
        vscode.Uri.joinPath(this.context.extensionUri, 'media', 'workspace'),
        vscode.Uri.joinPath(this.context.extensionUri, 'media', 'mapEditor'),
      ],
    };

    // Set up panel manager if workspace integration is enabled
    if (this.workspaceIntegration) {
      this.panelManager = new PanelManager(this.context);
    }

    // Initialize enhanced editor
    webviewPanel.webview.html = this.getEnhancedHtml(webviewPanel.webview, document);

    // Handle messages
    webviewPanel.webview.onDidReceiveMessage(
      async message => {
        switch (message.type) {
          case 'panel':
            await this.handlePanelMessage(message, webviewPanel);
            break;
          case 'tool':
            await this.handleToolMessage(message, webviewPanel, document);
            break;
          case 'property':
            await this.handlePropertyMessage(message, webviewPanel, document);
            break;
          case 'mapUpdate':
            await this.updateDocument(message, webviewPanel, document);
            break;
          case 'ready':
            this.sendMapData(webviewPanel.webview, document);
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );

    // Update when document changes
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        this.updateEnhancedWebview(webviewPanel.webview, document);
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });
  }

  private async handlePanelMessage(message: any, webviewPanel: vscode.WebviewPanel) {
    if (!this.panelManager) {
      return;
    }

    switch (message.command) {
      case 'togglePanel':
        this.panelManager.togglePanel(message.panelId);
        this.updatePanelStates(webviewPanel.webview);
        break;
      case 'dockPanel':
        this.panelManager.dockPanel(message.panelId, message.position);
        this.updatePanelStates(webviewPanel.webview);
        break;
    }
  }

  private async handleToolMessage(
    message: any,
    webviewPanel: vscode.WebviewPanel,
    _document: vscode.TextDocument
  ) {
    // Handle tool selection with property inspector updates
    switch (message.command) {
      case 'selectTool':
        this.updatePropertyInspector(webviewPanel.webview, message.tool);
        break;
    }
  }

  private async handlePropertyMessage(
    message: any,
    webviewPanel: vscode.WebviewPanel,
    _document: vscode.TextDocument
  ) {
    // Handle property changes
    switch (message.property) {
      case 'tileId':
      case 'brushSize':
      case 'autoTile':
        // Update tool settings
        webviewPanel.webview.postMessage({
          type: 'updateTool',
          property: message.property,
          value: message.value,
        });
        break;
    }
  }

  private updatePropertyInspector(webview: vscode.Webview, tool: string) {
    webview.postMessage({
      type: 'updatePropertyInspector',
      tool: tool,
      properties: this.getToolProperties(tool),
    });
  }

  private getToolProperties(tool: string): any {
    const baseProperties = {
      brushSize: { type: 'range', min: 1, max: 10, value: 1 },
      opacity: { type: 'range', min: 0, max: 100, value: 100 },
    };

    switch (tool) {
      case 'paint':
        return {
          ...baseProperties,
          tileId: { type: 'select', options: this.getTileOptions() },
          autoTile: { type: 'checkbox', value: true },
        };
      case 'fill':
        return {
          tileId: { type: 'select', options: this.getTileOptions() },
          tolerance: { type: 'range', min: 0, max: 255, value: 0 },
        };
      case 'select':
        return {
          mode: { type: 'select', options: ['rectangle', 'lasso', 'magic_wand'] },
          addToSelection: { type: 'checkbox', value: false },
        };
      default:
        return baseProperties;
    }
  }

  private getTileOptions(): Array<{ value: number; label: string }> {
    // Generate tile options dynamically
    return Array.from({ length: 50 }, (_, i) => ({
      value: i,
      label: `Tile ${i}`,
    }));
  }

  private updatePanelStates(webview: vscode.Webview) {
    if (!this.panelManager) {
      return;
    }

    webview.postMessage({
      type: 'updatePanels',
      panels: this.panelManager.getPanelStates(),
    });
  }

  private getEnhancedHtml(webview: vscode.Webview, _document: vscode.TextDocument): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'mapEditor', 'enhancedMapEditor.css')
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'mapEditor', 'enhancedMapEditor.js')
    );
    const workspaceStyleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'workspace', 'workspace.css')
    );

    const nonce = this.getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:;">
      <link href="${workspaceStyleUri}" rel="stylesheet">
      <link href="${styleUri}" rel="stylesheet">
      <title>Enhanced Map Editor</title>
    </head>
    <body>
      <div id="enhanced-map-editor">
        <!-- Toolbar Ribbon -->
        <div id="toolbar-ribbon">
          <div class="toolbar-section">
            <h3>File</h3>
            <button class="toolbar-btn" data-action="new">
              <span class="icon">📄</span>
              <span>New</span>
            </button>
            <button class="toolbar-btn" data-action="save">
              <span class="icon">💾</span>
              <span>Save</span>
            </button>
            <button class="toolbar-btn" data-action="export">
              <span class="icon">📤</span>
              <span>Export</span>
            </button>
          </div>
          
          <div class="toolbar-section">
            <h3>Edit</h3>
            <button class="toolbar-btn" data-action="undo">
              <span class="icon">↶</span>
              <span>Undo</span>
            </button>
            <button class="toolbar-btn" data-action="redo">
              <span class="icon">↷</span>
              <span>Redo</span>
            </button>
            <div class="toolbar-separator"></div>
            <button class="toolbar-btn" data-action="cut">
              <span class="icon">✂️</span>
              <span>Cut</span>
            </button>
            <button class="toolbar-btn" data-action="copy">
              <span class="icon">📋</span>
              <span>Copy</span>
            </button>
            <button class="toolbar-btn" data-action="paste">
              <span class="icon">📌</span>
              <span>Paste</span>
            </button>
          </div>
          
          <div class="toolbar-section">
            <h3>View</h3>
            <button class="toolbar-btn toggle" data-toggle="grid">
              <span class="icon">⊞</span>
              <span>Grid</span>
            </button>
            <button class="toolbar-btn toggle" data-toggle="coordinates">
              <span class="icon">📍</span>
              <span>Coords</span>
            </button>
            <button class="toolbar-btn" data-action="zoom-in">
              <span class="icon">🔍</span>
              <span>Zoom In</span>
            </button>
            <button class="toolbar-btn" data-action="zoom-out">
              <span class="icon">🔎</span>
              <span>Zoom Out</span>
            </button>
          </div>
          
          <div class="toolbar-section">
            <h3>Panels</h3>
            <button class="toolbar-btn toggle" data-panel="tools">
              <span class="icon">🛠️</span>
              <span>Tools</span>
            </button>
            <button class="toolbar-btn toggle" data-panel="layers">
              <span class="icon">📚</span>
              <span>Layers</span>
            </button>
            <button class="toolbar-btn toggle" data-panel="properties">
              <span class="icon">📋</span>
              <span>Properties</span>
            </button>
          </div>
        </div>
        
        <!-- Main Editor Area -->
        <div id="editor-workspace">
          <!-- Left Panel Area -->
          <div id="left-panels" class="panel-dock">
            <!-- Tools Panel -->
            <div id="tools-panel" class="editor-panel">
              <div class="panel-header">
                <span class="panel-icon">🛠️</span>
                <span class="panel-title">Tools</span>
                <button class="panel-close">×</button>
              </div>
              <div class="panel-content">
                <div class="tools-grid">
                  <button class="tool-btn active" data-tool="paint" title="Paint">
                    <span class="icon">🖌️</span>
                  </button>
                  <button class="tool-btn" data-tool="fill" title="Fill">
                    <span class="icon">🪣</span>
                  </button>
                  <button class="tool-btn" data-tool="line" title="Line">
                    <span class="icon">📏</span>
                  </button>
                  <button class="tool-btn" data-tool="rectangle" title="Rectangle">
                    <span class="icon">⬛</span>
                  </button>
                  <button class="tool-btn" data-tool="ellipse" title="Ellipse">
                    <span class="icon">⭕</span>
                  </button>
                  <button class="tool-btn" data-tool="select" title="Select">
                    <span class="icon">✂️</span>
                  </button>
                  <button class="tool-btn" data-tool="picker" title="Picker">
                    <span class="icon">💧</span>
                  </button>
                  <button class="tool-btn" data-tool="eraser" title="Eraser">
                    <span class="icon">🧹</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Center Canvas Area -->
          <div id="editor-canvas-container">
            <canvas id="mapCanvas"></canvas>
            <canvas id="gridCanvas"></canvas>
            <canvas id="selectionCanvas"></canvas>
            <canvas id="previewCanvas"></canvas>
          </div>
          
          <!-- Right Panel Area -->
          <div id="right-panels" class="panel-dock">
            <!-- Property Inspector -->
            <div id="property-inspector" class="editor-panel">
              <div class="panel-header">
                <span class="panel-icon">📋</span>
                <span class="panel-title">Properties</span>
                <button class="panel-close">×</button>
              </div>
              <div class="panel-content">
                <div id="property-content">
                  <!-- Dynamic property content -->
                </div>
              </div>
            </div>
            
            <!-- Layers Panel -->
            <div id="layers-panel" class="editor-panel">
              <div class="panel-header">
                <span class="panel-icon">📚</span>
                <span class="panel-title">Layers</span>
                <button class="panel-close">×</button>
              </div>
              <div class="panel-content">
                <div id="layers-list">
                  <!-- Dynamic layers content -->
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Status Bar -->
        <div id="editor-status-bar">
          <div class="status-section">
            <span class="status-item">
              <span class="icon">🖱️</span>
              <span id="cursor-position">0, 0</span>
            </span>
            <span class="status-item">
              <span class="icon">🎨</span>
              <span id="current-tile">Tile: None</span>
            </span>
            <span class="status-item">
              <span class="icon">🛠️</span>
              <span id="current-tool">Tool: Paint</span>
            </span>
          </div>
          <div class="status-section">
            <span class="status-item">
              <span class="icon">📐</span>
              <span id="map-size">Size: 0x0</span>
            </span>
            <span class="status-item">
              <span class="icon">🔍</span>
              <span id="zoom-level">Zoom: 100%</span>
            </span>
          </div>
        </div>
      </div>
      
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  private updateEnhancedWebview(webview: vscode.Webview, document: vscode.TextDocument) {
    // Parse document and update webview
    this.sendMapData(webview, document);

    // Update integrated panels
    if (this.panelManager) {
      this.updatePanelStates(webview);
    }
  }

  private sendMapData(webview: vscode.Webview, document: vscode.TextDocument) {
    try {
      const text = document.getText();
      const mapData = this.parseMapData(text);
      webview.postMessage({
        type: 'updateMap',
        data: mapData,
      });
    } catch (error) {
      console.error('Error parsing map data:', error);
    }
  }

  private parseMapData(text: string): any {
    // Basic map data parsing
    const tilesMatch = text.match(/tiles\s*{([^}]+)}/s);
    const heightMatch = text.match(/height\s*{([^}]+)}/s);

    if (!tilesMatch) {
      throw new Error('No tiles section found');
    }

    const tileRows = tilesMatch[1]
      .trim()
      .split('\n')
      .filter(row => row.trim());
    const tiles = tileRows.map(row => row.trim().split(/\s+/).map(Number));

    const height = heightMatch
      ? heightMatch[1]
          .trim()
          .split('\n')
          .filter(row => row.trim())
          .map(row => row.trim().split(/\s+/).map(Number))
      : [];

    return {
      width: tiles[0]?.length || 0,
      height: tiles.length,
      tiles,
      heightMap: height,
    };
  }

  private async updateDocument(
    message: any,
    _webviewPanel: vscode.WebviewPanel,
    document: vscode.TextDocument
  ) {
    const edit = new vscode.WorkspaceEdit();
    const text = document.getText();
    const mapData = message.data;

    // Update tiles section
    const tilesMatch = text.match(/tiles\s*{[^}]+}/s);
    if (tilesMatch) {
      const newTiles = mapData.tiles.map((row: number[]) => row.join(' ')).join('\n');
      const newTilesSection = `tiles{\n${newTiles}\n}`;
      const start = document.positionAt(text.indexOf(tilesMatch[0]));
      const end = document.positionAt(text.indexOf(tilesMatch[0]) + tilesMatch[0].length);
      edit.replace(document.uri, new vscode.Range(start, end), newTilesSection);
    }

    await vscode.workspace.applyEdit(edit);
  }

  private getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
