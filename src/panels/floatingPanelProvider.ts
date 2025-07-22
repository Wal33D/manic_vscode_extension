import * as vscode from 'vscode';
import { FloatingPanelManager } from './floatingPanelManager';

export class FloatingPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'manicMiners.floatingPanels';
  private _view?: vscode.WebviewView;
  private panelManager: FloatingPanelManager;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
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
        <div class="dock-zone dock-left" ondrop="dropPanel(event, 'left')" ondragover="allowDrop(event)">
          <div class="dock-indicator">⬅️ Dock Left</div>
        </div>
        <div class="dock-zone dock-right" ondrop="dropPanel(event, 'right')" ondragover="allowDrop(event)">
          <div class="dock-indicator">➡️ Dock Right</div>
        </div>
        <div class="dock-zone dock-top" ondrop="dropPanel(event, 'top')" ondragover="allowDrop(event)">
          <div class="dock-indicator">⬆️ Dock Top</div>
        </div>
        <div class="dock-zone dock-bottom" ondrop="dropPanel(event, 'bottom')" ondragover="allowDrop(event)">
          <div class="dock-indicator">⬇️ Dock Bottom</div>
        </div>

        <!-- Main workspace -->
        <div class="workspace-content">
          <div class="toolbar">
            <div class="toolbar-dropdown" onmouseenter="showDropdown('tools')" onmouseleave="hideDropdown('tools')">
              <button class="toolbar-button" title="Tools">🛠️ Tools</button>
              <div class="dropdown-menu" id="dropdown-tools" style="display: none;">
                <button onclick="selectTool('brush')">🖌️ Brush</button>
                <button onclick="selectTool('eraser')">🧹 Eraser</button>
                <button onclick="selectTool('fill')">🪣 Fill</button>
                <button onclick="selectTool('pick')">💧 Pick</button>
                <button onclick="selectTool('line')">📏 Line</button>
                <button onclick="selectTool('rect')">⬛ Rectangle</button>
                <button onclick="selectTool('circle')">⭕ Circle</button>
                <button onclick="selectTool('select')">✂️ Select</button>
              </div>
            </div>
            <div class="toolbar-dropdown" onmouseenter="showDropdown('layers')" onmouseleave="hideDropdown('layers')">
              <button class="toolbar-button" title="Layers">📚 Layers</button>
              <div class="dropdown-menu" id="dropdown-layers" style="display: none;">
                <button onclick="toggleLayer('tiles')">🗺️ Tiles</button>
                <button onclick="toggleLayer('height')">📏 Height</button>
                <button onclick="toggleLayer('resources')">💎 Resources</button>
                <button onclick="toggleLayer('buildings')">🏢 Buildings</button>
                <button onclick="toggleLayer('vehicles')">🚗 Vehicles</button>
              </div>
            </div>
            <button onclick="showPanel('properties')" title="Properties">📋 Properties</button>
            <button onclick="showPanel('history')" title="History">🕐 History</button>
            <button onclick="showPanel('colorPicker')" title="Color Picker">🎨 Color Picker</button>
            <span class="separator"></span>
            <button onclick="resetLayout()" title="Reset Layout">🔄</button>
            <button onclick="saveLayout()" title="Save Layout">💾</button>
            <button onclick="loadLayout()" title="Load Layout">📁</button>
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
}
