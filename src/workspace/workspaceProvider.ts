import * as vscode from 'vscode';
import { PanelManager, PanelState } from './panelManager';
import { LayoutManager } from './layoutManager';

/**
 * The WorkspaceProvider creates a unified workspace interface that replaces
 * the floating panels concept with a more integrated approach that works
 * within VS Code's webview constraints.
 */
export class WorkspaceProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'manicMiners.workspace';

  private _view?: vscode.WebviewView;
  private panelManager: PanelManager;
  private layoutManager: LayoutManager;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this.panelManager = new PanelManager(context);
    this.layoutManager = new LayoutManager(context);
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'media'),
        vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace'),
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'panel':
          await this.handlePanelMessage(message);
          break;
        case 'layout':
          await this.handleLayoutMessage(message);
          break;
        case 'tool':
          await this.handleToolMessage(message);
          break;
        case 'ready':
          await this.initializeWorkspace();
          break;
      }
    });

    // Listen for panel state changes
    this.panelManager.onPanelChange(() => {
      this.updateWebview();
    });

    // Listen for theme changes
    vscode.window.onDidChangeActiveColorTheme(() => {
      this.updateWebview();
    });
  }

  private async handlePanelMessage(message: {
    command: string;
    panelId?: string;
    position?: string | { x?: number; y?: number };
    size?: { width: number | string; height: number | string };
    collapsed?: boolean;
  }) {
    switch (message.command) {
      case 'toggle':
        if (message.panelId) {
          this.panelManager.togglePanel(message.panelId);
        }
        break;
      case 'dock':
        if (message.panelId && typeof message.position === 'string') {
          this.panelManager.dockPanel(message.panelId, message.position as PanelState['position']);
        }
        break;
      case 'resize':
        if (message.panelId && message.size) {
          this.panelManager.resizePanel(message.panelId, message.size);
        }
        break;
      case 'move':
        if (message.panelId && typeof message.position === 'object') {
          this.panelManager.movePanel(message.panelId, message.position);
        }
        break;
      case 'collapse':
        if (message.panelId && message.collapsed !== undefined) {
          this.panelManager.collapsePanel(message.panelId, message.collapsed);
        }
        break;
      case 'close':
        if (message.panelId) {
          this.panelManager.closePanel(message.panelId);
        }
        break;
      case 'focus':
        if (message.panelId) {
          this.panelManager.focusPanel(message.panelId);
        }
        break;
      case 'setActiveTab':
        if (message.panelId) {
          this.panelManager.setActiveTab(message.panelId);
        }
        break;
    }
  }

  private async handleLayoutMessage(message: { command: string; name?: string; preset?: string }) {
    switch (message.command) {
      case 'save':
        if (message.name) {
          await this.layoutManager.saveLayout(message.name, this.panelManager.getPanelStates());
          vscode.window.showInformationMessage(`Layout '${message.name}' saved`);
        }
        break;
      case 'load': {
        if (message.name) {
          const layout = await this.layoutManager.loadLayout(message.name);
          if (layout) {
            this.panelManager.applyLayout(layout);
            vscode.window.showInformationMessage(`Layout '${message.name}' loaded`);
          }
        }
        break;
      }
      case 'delete':
        if (message.name) {
          await this.layoutManager.deleteLayout(message.name);
        }
        break;
      case 'preset':
        if (message.preset) {
          this.applyPresetLayout(message.preset);
        }
        break;
    }
  }

  private async handleToolMessage(message: {
    command: string;
    tileId?: number;
    tool?: string;
    action?: string;
    args?: unknown;
  }) {
    // Forward tool messages to appropriate commands
    switch (message.command) {
      case 'selectTile':
        if (message.tileId !== undefined) {
          vscode.commands.executeCommand('manicMiners.selectTile', message.tileId);
        }
        break;
      case 'selectTool':
        if (message.tool) {
          vscode.commands.executeCommand('manicMiners.selectTool', message.tool);
        }
        break;
      case 'executeAction':
        if (message.action) {
          vscode.commands.executeCommand(message.action, message.args);
        }
        break;
    }
  }

  private async initializeWorkspace() {
    // Load default or last used layout
    const lastLayout = await this.layoutManager.getLastUsedLayout();
    if (lastLayout) {
      this.panelManager.applyLayout(lastLayout);
    } else {
      this.applyPresetLayout('default');
    }

    this.updateWebview();
  }

  private hideAllPanels() {
    const panels = this.panelManager.getPanelStates();
    panels.forEach(panel => {
      if (panel.visible) {
        this.panelManager.closePanel(panel.id);
      }
    });
  }

  private applyPresetLayout(preset: string) {
    switch (preset) {
      case 'mapping':
        // Hide all panels first
        this.hideAllPanels();
        // Show mapping panels
        this.panelManager.showPanel('tools');
        this.panelManager.showPanel('layers');
        this.panelManager.showPanel('properties');
        this.panelManager.showPanel('tilePalette');
        break;
      case 'scripting':
        // Hide all panels first
        this.hideAllPanels();
        // Show scripting panels
        this.panelManager.showPanel('scriptPatterns');
        this.panelManager.showPanel('validation');
        this.panelManager.showPanel('history');
        break;
      case 'analysis':
        // Hide all panels first
        this.hideAllPanels();
        // Show analysis panels
        this.panelManager.showPanel('statistics');
        this.panelManager.showPanel('heatmap');
        this.panelManager.showPanel('validation');
        break;
      default:
        // Default layout
        this.hideAllPanels();
        this.panelManager.showPanel('tools');
        this.panelManager.showPanel('properties');
    }
  }

  private updateWebview() {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'updateWorkspace',
        panels: this.panelManager.getPanelStates(),
        layouts: this.layoutManager.getSavedLayouts(),
      });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'workspace.css')
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'workspace.js')
    );
    const componentsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'components.js')
    );

    const nonce = this.getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
      <link href="${styleUri}" rel="stylesheet">
      <title>Manic Miners Workspace</title>
    </head>
    <body>
      <div id="workspace-container">
        <!-- Workspace Header -->
        <div id="workspace-header">
          <div class="workspace-title">
            <span class="icon">🎮</span>
            <h1>Manic Miners Workspace</h1>
          </div>
          <div class="workspace-controls">
            <div class="layout-selector">
              <button class="layout-btn" data-tooltip="Mapping Mode" data-preset="mapping">
                <span class="icon">🗺️</span>
              </button>
              <button class="layout-btn" data-tooltip="Scripting Mode" data-preset="scripting">
                <span class="icon">📝</span>
              </button>
              <button class="layout-btn" data-tooltip="Analysis Mode" data-preset="analysis">
                <span class="icon">📊</span>
              </button>
              <div class="separator"></div>
              <button class="control-btn" id="saveLayoutBtn" data-tooltip="Save Layout">
                <span class="icon">💾</span>
              </button>
              <button class="control-btn" id="loadLayoutBtn" data-tooltip="Load Layout">
                <span class="icon">📁</span>
              </button>
              <button class="control-btn" id="resetLayoutBtn" data-tooltip="Reset Layout">
                <span class="icon">🔄</span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Main Workspace Area -->
        <div id="workspace-main">
          <!-- Left Dock Zone -->
          <div id="dock-left" class="dock-zone vertical">
            <div class="dock-header">
              <button class="dock-toggle" data-dock="left">◀</button>
            </div>
            <div class="dock-content"></div>
          </div>
          
          <!-- Center Area -->
          <div id="workspace-center">
            <!-- Top Dock Zone -->
            <div id="dock-top" class="dock-zone horizontal">
              <div class="dock-content"></div>
            </div>
            
            <!-- Central Content -->
            <div id="workspace-content">
              <div class="welcome-message">
                <h2>Welcome to Manic Miners Workspace</h2>
                <p>Select a layout preset above or customize your workspace by opening panels.</p>
                <div class="quick-actions">
                  <button class="action-btn" data-action="openMapEditor">
                    <span class="icon">✏️</span>
                    <span>Open Map Editor</span>
                  </button>
                  <button class="action-btn" data-action="showTools">
                    <span class="icon">🛠️</span>
                    <span>Show Tools</span>
                  </button>
                  <button class="action-btn" data-action="showProperties">
                    <span class="icon">📋</span>
                    <span>Show Properties</span>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Bottom Dock Zone -->
            <div id="dock-bottom" class="dock-zone horizontal">
              <div class="dock-content"></div>
            </div>
          </div>
          
          <!-- Right Dock Zone -->
          <div id="dock-right" class="dock-zone vertical">
            <div class="dock-header">
              <button class="dock-toggle" data-dock="right">▶</button>
            </div>
            <div class="dock-content"></div>
          </div>
        </div>
        
        <!-- Status Bar -->
        <div id="workspace-status">
          <div class="status-section">
            <span class="status-item" id="currentTool">
              <span class="icon">🖌️</span>
              <span class="label">Tool:</span>
              <span class="value">None</span>
            </span>
            <span class="status-item" id="selectedTile">
              <span class="icon">🎨</span>
              <span class="label">Tile:</span>
              <span class="value">None</span>
            </span>
          </div>
          <div class="status-section">
            <span class="status-item" id="panelCount">
              <span class="icon">📊</span>
              <span class="value">0 panels</span>
            </span>
          </div>
        </div>
      </div>
      
      <!-- Panel Template -->
      <template id="panel-template">
        <div class="workspace-panel">
          <div class="panel-header">
            <span class="panel-icon"></span>
            <span class="panel-title"></span>
            <div class="panel-controls">
              <button class="panel-btn minimize" data-tooltip="Minimize">_</button>
              <button class="panel-btn maximize" data-tooltip="Maximize">□</button>
              <button class="panel-btn close" data-tooltip="Close">×</button>
            </div>
          </div>
          <div class="panel-tabs"></div>
          <div class="panel-content"></div>
          <div class="panel-resize-handle"></div>
        </div>
      </template>
      
      <script nonce="${nonce}" src="${componentsUri}"></script>
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  private getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  public dispose() {
    // Clean up resources
  }
}
