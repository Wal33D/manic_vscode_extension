import * as vscode from 'vscode';
import { FloatingPanelManager, FloatingPanel } from './floatingPanelManager';

export class FloatingPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'manicMiners.floatingPanels';
  private _view?: vscode.WebviewView;
  private panelManager: FloatingPanelManager;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private context: vscode.ExtensionContext
  ) {
    this.panelManager = new FloatingPanelManager(context);
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(message => {
      switch (message.command) {
        case 'togglePanel':
          this.panelManager.togglePanel(message.panelId);
          this.updateWebview();
          break;
        case 'dockPanel':
          this.panelManager.dockPanel(message.panelId, message.position);
          this.updateWebview();
          break;
        case 'movePanel':
          this.panelManager.movePanel(message.panelId, {
            x: message.x,
            y: message.y,
          });
          break;
        case 'resizePanel':
          this.panelManager.resizePanel(message.panelId, {
            width: message.width,
            height: message.height,
          });
          break;
        case 'collapsePanel':
          this.panelManager.collapsePanel(message.panelId, message.collapsed);
          this.updateWebview();
          break;
        case 'pinPanel':
          this.panelManager.pinPanel(message.panelId, message.pinned);
          this.updateWebview();
          break;
        case 'closePanel':
          this.panelManager.updatePanel(message.panelId, { visible: false });
          this.updateWebview();
          break;
        case 'toolSelected':
          vscode.commands.executeCommand('manicMiners.selectTool', message.tool);
          break;
        case 'propertyChanged':
          vscode.commands.executeCommand('manicMiners.updateProperty', {
            property: message.property,
            value: message.value,
          });
          break;
        case 'layerToggled':
          vscode.commands.executeCommand('manicMiners.toggleLayer', message.layer);
          break;
        case 'resetLayout':
          this.resetLayout();
          break;
        case 'saveLayout':
          this.saveLayout(message.name);
          break;
        case 'loadLayout':
          this.loadLayout();
          break;
      }
    });

    // Listen for panel changes
    this.panelManager.onPanelChange(() => {
      this.updateWebview();
    });
  }

  private updateWebview() {
    if (this._view) {
      this._view.webview.postMessage({
        command: 'updatePanels',
        panels: this.panelManager.getPanels(),
        dockZones: this.panelManager.getDockZones(),
      });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'floatingPanels.css')
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'floatingPanels.js')
    );

    const panels = this.panelManager.getPanels();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${styleUri}" rel="stylesheet">
      <title>Floating Panels</title>
    </head>
    <body>
      <div class="workspace-container">
        <!-- Dock zones -->
        <div class="dock-zone dock-left" data-position="left">
          <div class="dock-indicator">⬅️ Dock Left</div>
        </div>
        <div class="dock-zone dock-right" data-position="right">
          <div class="dock-indicator">➡️ Dock Right</div>
        </div>
        <div class="dock-zone dock-top" data-position="top">
          <div class="dock-indicator">⬆️ Dock Top</div>
        </div>
        <div class="dock-zone dock-bottom" data-position="bottom">
          <div class="dock-indicator">⬇️ Dock Bottom</div>
        </div>

        <!-- Main workspace -->
        <div class="workspace-content">
          <div class="toolbar">
            <div class="toolbar-dropdown">
              <button class="toolbar-button" title="Tools">🛠️ Tools</button>
              <div class="dropdown-menu" id="dropdown-tools">
                <button data-action="selectTool" data-value="brush">🖌️ Brush</button>
                <button data-action="selectTool" data-value="eraser">🧹 Eraser</button>
                <button data-action="selectTool" data-value="fill">🪣 Fill</button>
                <button data-action="selectTool" data-value="pick">💧 Pick</button>
                <button data-action="selectTool" data-value="line">📏 Line</button>
                <button data-action="selectTool" data-value="rect">⬛ Rectangle</button>
                <button data-action="selectTool" data-value="circle">⭕ Circle</button>
                <button data-action="selectTool" data-value="select">✂️ Select</button>
              </div>
            </div>
            <div class="toolbar-dropdown">
              <button class="toolbar-button" title="Layers">📚 Layers</button>
              <div class="dropdown-menu" id="dropdown-layers">
                <button data-action="toggleLayer" data-value="tiles">🗺️ Tiles</button>
                <button data-action="toggleLayer" data-value="height">📏 Height</button>
                <button data-action="toggleLayer" data-value="resources">💎 Resources</button>
                <button data-action="toggleLayer" data-value="buildings">🏢 Buildings</button>
                <button data-action="toggleLayer" data-value="vehicles">🚗 Vehicles</button>
              </div>
            </div>
            <button class="toolbar-action-btn" data-action="showPanel" data-panel="properties" title="Properties">
              <span class="btn-icon">📋</span>
              <span class="btn-text">Properties</span>
            </button>
            <button class="toolbar-action-btn" data-action="showPanel" data-panel="history" title="History">
              <span class="btn-icon">🕐</span>
              <span class="btn-text">History</span>
            </button>
            <button class="toolbar-action-btn" data-action="showPanel" data-panel="colorPicker" title="Color Picker">
              <span class="btn-icon">🎨</span>
              <span class="btn-text">Color Picker</span>
            </button>
            <span class="separator"></span>
            <button class="toolbar-action-btn" data-action="resetLayout" title="Reset Layout">
              <span class="btn-icon">🔄</span>
            </button>
            <button class="toolbar-action-btn" data-action="saveLayout" title="Save Layout">
              <span class="btn-icon">💾</span>
            </button>
            <button class="toolbar-action-btn" data-action="loadLayout" title="Load Layout">
              <span class="btn-icon">📁</span>
            </button>
          </div>

          <!-- Floating panels container -->
          <div class="floating-panels-workspace" id="workspace">
            ${this.panelManager.getWebviewContent()}
          </div>
        </div>
      </div>

      <script>
        const vscode = acquireVsCodeApi();
        const panels = ${JSON.stringify(panels)};
      </script>
      <script src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  // Public methods for external control
  public showPanel(panelId: string) {
    this.panelManager.updatePanel(panelId, { visible: true });
    this.updateWebview();
  }

  public hidePanel(panelId: string) {
    this.panelManager.updatePanel(panelId, { visible: false });
    this.updateWebview();
  }

  public resetLayout() {
    // Reset all panels to default positions
    const panels = this.panelManager.getPanels();
    panels.forEach(panel => {
      // Reset to default positions based on panel ID
      switch (panel.id) {
        case 'tools':
          this.panelManager.dockPanel(panel.id, 'left');
          break;
        case 'properties':
        case 'layers':
          this.panelManager.dockPanel(panel.id, 'right');
          break;
        default:
          this.panelManager.dockPanel(panel.id, 'float');
          break;
      }
    });
    this.updateWebview();
  }

  private saveLayout(name: string) {
    interface SavedLayout {
      name: string;
      panels: FloatingPanel[];
      timestamp: number;
    }

    const currentLayout: SavedLayout = {
      name,
      panels: this.panelManager.getPanels(),
      timestamp: Date.now(),
    };

    const savedLayouts = this.context.globalState.get<SavedLayout[]>('savedLayouts', []);
    savedLayouts.push(currentLayout);
    this.context.globalState.update('savedLayouts', savedLayouts);

    vscode.window.showInformationMessage(`Layout '${name}' saved successfully`);
  }

  private loadLayout() {
    interface SavedLayout {
      name: string;
      panels: FloatingPanel[];
      timestamp: number;
    }

    const savedLayouts = this.context.globalState.get<SavedLayout[]>('savedLayouts', []);

    if (savedLayouts.length === 0) {
      vscode.window.showInformationMessage('No saved layouts found');
      return;
    }

    const items = savedLayouts.map(layout => ({
      label: layout.name,
      description: new Date(layout.timestamp).toLocaleString(),
      layout,
    }));

    vscode.window
      .showQuickPick(items, {
        placeHolder: 'Select a layout to load',
      })
      .then(selected => {
        if (selected) {
          // Apply the saved layout
          selected.layout.panels.forEach(panel => {
            this.panelManager.updatePanel(panel.id, panel);
          });
          this.updateWebview();
          vscode.window.showInformationMessage(`Layout '${selected.label}' loaded`);
        }
      });
  }
}
