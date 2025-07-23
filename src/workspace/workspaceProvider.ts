import * as vscode from 'vscode';
import { PanelManager, PanelState } from './panelManager';
import { LayoutManager } from './layoutManager';
import { LazyLoader, LazyLoadConfig, PanelContentGenerators } from './lazyLoader.js';
import { debounce } from '../utils/debounce.js';
import { globalCache } from '../utils/cache.js';
import { createLiveRegion, AriaLiveRegion, isHighContrastTheme } from '../utils/accessibility.js';

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
  private lazyLoader?: LazyLoader;
  private updateWebviewDebounced: () => void;
  private liveRegion?: AriaLiveRegion;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this.panelManager = new PanelManager(context);
    this.layoutManager = new LayoutManager(context);

    // Create debounced update function
    this.updateWebviewDebounced = debounce(() => {
      this.updateWebview();
    }, 100);
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

    // Initialize lazy loader
    this.lazyLoader = new LazyLoader(webviewView.webview);
    this.setupLazyLoading();

    // Initialize accessibility features
    this.liveRegion = createLiveRegion(webviewView.webview);
    this.setupAccessibility(webviewView.webview);

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
        case 'loadPanel':
          await this.handleLazyLoad(message.panelId);
          break;
        case 'requestData':
          await this.handleDataRequest(message);
          break;
      }
    });

    // Listen for panel state changes with debouncing
    this.panelManager.onPanelChange(() => {
      this.updateWebviewDebounced();
    });

    // Listen for theme changes with debouncing
    vscode.window.onDidChangeActiveColorTheme(() => {
      this.updateWebviewDebounced();
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
          const panel = this.panelManager.getPanel(message.panelId);
          if (panel) {
            this.liveRegion?.announce(
              `${panel.title} panel ${panel.visible ? 'opened' : 'closed'}`
            );
          }
        }
        break;
      case 'dock':
        if (message.panelId && typeof message.position === 'string') {
          this.panelManager.dockPanel(message.panelId, message.position as PanelState['position']);
          const panel = this.panelManager.getPanel(message.panelId);
          if (panel) {
            this.liveRegion?.announce(`${panel.title} panel docked to ${message.position}`);
          }
        }
        break;
      case 'resize':
        if (message.panelId && message.size) {
          this.panelManager.resizePanel(message.panelId, message.size);
          const panel = this.panelManager.getPanel(message.panelId);
          if (panel) {
            this.liveRegion?.announce(`${panel.title} panel resized`);
          }
        }
        break;
      case 'move':
        if (message.panelId && typeof message.position === 'object') {
          this.panelManager.movePanel(message.panelId, message.position);
          const panel = this.panelManager.getPanel(message.panelId);
          if (panel) {
            this.liveRegion?.announce(`${panel.title} panel moved`);
          }
        }
        break;
      case 'collapse':
        if (message.panelId && message.collapsed !== undefined) {
          this.panelManager.collapsePanel(message.panelId, message.collapsed);
          const panel = this.panelManager.getPanel(message.panelId);
          if (panel) {
            this.liveRegion?.announce(
              `${panel.title} panel ${message.collapsed ? 'minimized' : 'restored'}`
            );
          }
        }
        break;
      case 'close':
        if (message.panelId) {
          const panel = this.panelManager.getPanel(message.panelId);
          this.panelManager.closePanel(message.panelId);
          if (panel) {
            this.liveRegion?.announce(`${panel.title} panel closed`);
          }
        }
        break;
      case 'focus':
        if (message.panelId) {
          this.panelManager.focusPanel(message.panelId);
          const panel = this.panelManager.getPanel(message.panelId);
          if (panel) {
            this.liveRegion?.announce(`${panel.title} panel focused`);
          }
        }
        break;
      case 'setActiveTab':
        if (message.panelId) {
          this.panelManager.setActiveTab(message.panelId);
          const panel = this.panelManager.getPanel(message.panelId);
          if (panel) {
            this.liveRegion?.announce(`${panel.title} tab activated`);
          }
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
          this.liveRegion?.announce(`Layout ${message.name} saved`);
        }
        break;
      case 'load': {
        if (message.name) {
          const layout = await this.layoutManager.loadLayout(message.name);
          if (layout) {
            this.panelManager.applyLayout(layout);
            vscode.window.showInformationMessage(`Layout '${message.name}' loaded`);
            this.liveRegion?.announce(`Layout ${message.name} loaded`);
          }
        }
        break;
      }
      case 'delete':
        if (message.name) {
          await this.layoutManager.deleteLayout(message.name);
          this.liveRegion?.announce(`Layout ${message.name} deleted`);
        }
        break;
      case 'preset':
        if (message.preset) {
          this.applyPresetLayout(message.preset);
          this.liveRegion?.announce(`${message.preset} mode layout applied`);
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
          this.liveRegion?.announce(`${message.tool} tool selected`);
        }
        break;
      case 'executeAction':
        if (message.action) {
          vscode.commands.executeCommand(message.action, message.args);
        }
        break;
    }
  }

  // Keyboard shortcut command handlers
  public focusPanel(panelId: string) {
    this.panelManager.focusPanel(panelId);
    this.updateWebview();
  }

  public selectTool(tool: string) {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'selectTool',
        tool: tool,
      });
    }
  }

  public executeWorkspaceCommand(command: string, _args?: any) {
    switch (command) {
      case 'closePanel':
        this.closeActivePanel();
        break;
      case 'closeAllPanels':
        this.hideAllPanels();
        break;
      case 'minimizePanel':
        this.minimizeActivePanel();
        break;
      case 'maximizePanel':
        this.maximizeActivePanel();
        break;
      case 'splitHorizontal':
        this.splitView('horizontal');
        break;
      case 'splitVertical':
        this.splitView('vertical');
        break;
      case 'unsplit':
        this.unsplitView();
        break;
      case 'nextTab':
        this.navigateTab('next');
        break;
      case 'previousTab':
        this.navigateTab('previous');
        break;
      case 'zoomIn':
      case 'zoomOut':
      case 'zoomReset':
      case 'zoomFit':
        this.handleZoom(command);
        break;
      case 'toggleFocusMode':
        this.toggleFocusMode();
        break;
    }
  }

  private closeActivePanel() {
    const panels = this.panelManager.getPanelStates();
    const activePanel = panels.find(p => p.activeTab);
    if (activePanel) {
      this.panelManager.closePanel(activePanel.id);
      this.updateWebview();
    }
  }

  private minimizeActivePanel() {
    const panels = this.panelManager.getPanelStates();
    const activePanel = panels.find(p => p.activeTab);
    if (activePanel) {
      this.panelManager.collapsePanel(activePanel.id, true);
      this.updateWebview();
    }
  }

  private maximizeActivePanel() {
    const panels = this.panelManager.getPanelStates();
    const activePanel = panels.find(p => p.activeTab);
    if (activePanel) {
      this.panelManager.collapsePanel(activePanel.id, false);
      this.updateWebview();
    }
  }

  private splitView(direction: 'horizontal' | 'vertical') {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'splitView',
        direction: direction,
      });
      this.liveRegion?.announce(`View split ${direction}ly`);
    }
  }

  private unsplitView() {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'unsplitView',
      });
      this.liveRegion?.announce('Split view removed');
    }
  }

  private navigateTab(direction: 'next' | 'previous') {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'navigateTab',
        direction: direction,
      });
    }
  }

  private handleZoom(command: string) {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'zoom',
        command: command,
      });

      const zoomAnnouncement =
        {
          zoomIn: 'Zoomed in',
          zoomOut: 'Zoomed out',
          zoomReset: 'Zoom reset to 100%',
          zoomFit: 'Zoomed to fit',
        }[command] || 'Zoom changed';

      this.liveRegion?.announce(zoomAnnouncement);
    }
  }

  private toggleFocusMode() {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'toggleFocusMode',
      });
      this.liveRegion?.announce('Focus mode toggled');
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

  public applyPresetLayout(preset: string) {
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
    const animationsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'animations.css')
    );
    const accessibilityUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'accessibility.css')
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
      <link href="${animationsUri}" rel="stylesheet">
      <link href="${accessibilityUri}" rel="stylesheet">
      <title>Manic Miners Workspace</title>
    </head>
    <body>
      <div id="workspace-container" role="application" aria-label="Manic Miners Workspace">
        <!-- Workspace Header -->
        <header id="workspace-header" role="banner" aria-label="Workspace Header">
          <div class="workspace-title">
            <span class="icon" aria-hidden="true">🎮</span>
            <h1>Manic Miners Workspace</h1>
          </div>
          <nav class="workspace-controls" role="navigation" aria-label="Workspace Controls">
            <div class="layout-selector" role="group" aria-label="Layout Presets">
              <button class="layout-btn" data-tooltip="Mapping Mode" data-preset="mapping" 
                      aria-label="Switch to Mapping Mode layout" role="button">
                <span class="icon" aria-hidden="true">🗺️</span>
              </button>
              <button class="layout-btn" data-tooltip="Scripting Mode" data-preset="scripting"
                      aria-label="Switch to Scripting Mode layout" role="button">
                <span class="icon" aria-hidden="true">📝</span>
              </button>
              <button class="layout-btn" data-tooltip="Analysis Mode" data-preset="analysis"
                      aria-label="Switch to Analysis Mode layout" role="button">
                <span class="icon" aria-hidden="true">📊</span>
              </button>
              <div class="separator" role="separator" aria-orientation="vertical"></div>
              <button class="control-btn" id="saveLayoutBtn" data-tooltip="Save Layout"
                      aria-label="Save current layout" role="button">
                <span class="icon" aria-hidden="true">💾</span>
              </button>
              <button class="control-btn" id="loadLayoutBtn" data-tooltip="Load Layout"
                      aria-label="Load saved layout" role="button">
                <span class="icon" aria-hidden="true">📁</span>
              </button>
              <button class="control-btn" id="resetLayoutBtn" data-tooltip="Reset Layout"
                      aria-label="Reset to default layout" role="button">
                <span class="icon" aria-hidden="true">🔄</span>
              </button>
              <div class="separator" role="separator" aria-orientation="vertical"></div>
              <button class="control-btn" id="splitHorizontalBtn" data-tooltip="Split Horizontal"
                      aria-label="Split view horizontally" role="button">
                <span class="icon" aria-hidden="true">⬌</span>
              </button>
              <button class="control-btn" id="splitVerticalBtn" data-tooltip="Split Vertical"
                      aria-label="Split view vertically" role="button">
                <span class="icon" aria-hidden="true">⬍</span>
              </button>
              <button class="control-btn" id="unsplitBtn" data-tooltip="Unsplit"
                      aria-label="Remove split view" role="button">
                <span class="icon" aria-hidden="true">⬜</span>
              </button>
            </div>
          </nav>
        </header>
        
        <!-- Main Workspace Area -->
        <div id="workspace-main" role="main" aria-label="Main Workspace">
          <!-- Left Dock Zone -->
          <aside id="dock-left" class="dock-zone vertical" role="complementary" 
                 aria-label="Left dock zone">
            <div class="dock-header">
              <button class="dock-toggle" data-dock="left" 
                      aria-label="Toggle left dock" aria-expanded="true">◀</button>
            </div>
            <div class="dock-content" role="region" aria-label="Left dock panels"></div>
          </aside>
          
          <!-- Center Area -->
          <div id="workspace-center" role="region" aria-label="Center workspace area">
            <!-- Top Dock Zone -->
            <div id="dock-top" class="dock-zone horizontal" role="complementary"
                 aria-label="Top dock zone">
              <div class="dock-content" role="region" aria-label="Top dock panels"></div>
            </div>
            
            <!-- Central Content -->
            <div id="workspace-content" role="region" aria-label="Main content area">
              <div class="welcome-message">
                <h2>Welcome to Manic Miners Workspace</h2>
                <p>Select a layout preset above or customize your workspace by opening panels.</p>
                <div class="quick-actions" role="group" aria-label="Quick actions">
                  <button class="action-btn" data-action="openMapEditor"
                          aria-label="Open Map Editor" role="button">
                    <span class="icon" aria-hidden="true">✏️</span>
                    <span>Open Map Editor</span>
                  </button>
                  <button class="action-btn" data-action="showTools"
                          aria-label="Show Tools panel" role="button">
                    <span class="icon" aria-hidden="true">🛠️</span>
                    <span>Show Tools</span>
                  </button>
                  <button class="action-btn" data-action="showProperties"
                          aria-label="Show Properties panel" role="button">
                    <span class="icon" aria-hidden="true">📋</span>
                    <span>Show Properties</span>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Bottom Dock Zone -->
            <div id="dock-bottom" class="dock-zone horizontal" role="complementary"
                 aria-label="Bottom dock zone">
              <div class="dock-content" role="region" aria-label="Bottom dock panels"></div>
            </div>
          </div>
          
          <!-- Right Dock Zone -->
          <aside id="dock-right" class="dock-zone vertical" role="complementary"
                 aria-label="Right dock zone">
            <div class="dock-header">
              <button class="dock-toggle" data-dock="right"
                      aria-label="Toggle right dock" aria-expanded="true">▶</button>
            </div>
            <div class="dock-content" role="region" aria-label="Right dock panels"></div>
          </aside>
        </div>
        
        <!-- Status Bar -->
        <footer id="workspace-status" role="status" aria-label="Status bar" aria-live="polite">
          <div class="status-section">
            <span class="status-item" id="currentTool" aria-label="Current tool">
              <span class="icon" aria-hidden="true">🖌️</span>
              <span class="label">Tool:</span>
              <span class="value" aria-live="polite">None</span>
            </span>
            <span class="status-item" id="selectedTile" aria-label="Selected tile">
              <span class="icon" aria-hidden="true">🎨</span>
              <span class="label">Tile:</span>
              <span class="value" aria-live="polite">None</span>
            </span>
          </div>
          <div class="status-section">
            <span class="status-item" id="panelCount" aria-label="Open panels count">
              <span class="icon" aria-hidden="true">📊</span>
              <span class="value" aria-live="polite">0 panels</span>
            </span>
          </div>
        </footer>
      </div>
      
      <!-- Panel Template -->
      <template id="panel-template">
        <div class="workspace-panel" role="region" aria-labelledby="panel-title">
          <div class="panel-header" role="heading" aria-level="2">
            <span class="panel-icon" aria-hidden="true"></span>
            <span class="panel-title" id="panel-title"></span>
            <div class="panel-controls" role="group" aria-label="Panel controls">
              <button class="panel-btn minimize" data-tooltip="Minimize" 
                      aria-label="Minimize panel" role="button">_</button>
              <button class="panel-btn maximize" data-tooltip="Maximize"
                      aria-label="Maximize panel" role="button">□</button>
              <button class="panel-btn close" data-tooltip="Close"
                      aria-label="Close panel" role="button">×</button>
            </div>
          </div>
          <div class="panel-tabs" role="tablist" aria-label="Panel tabs"></div>
          <div class="panel-content" role="tabpanel"></div>
          <div class="panel-resize-handle" role="separator" 
               aria-label="Resize panel" aria-orientation="horizontal"></div>
        </div>
      </template>
      
      <script nonce="${nonce}" src="${componentsUri}"></script>
      <script nonce="${nonce}" src="${scriptUri}"></script>
      <script nonce="${nonce}">
        // Load performance scripts
        const scripts = [
          '${webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'performanceManager.js'))}',
          '${webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'virtualScroll.js'))}',
          '${webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'canvasOptimizer.js'))}',
          '${webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'workspace-performance.js'))}'
        ];
        
        scripts.forEach(src => {
          const script = document.createElement('script');
          script.src = src;
          script.nonce = '${nonce}';
          document.head.appendChild(script);
        });
        
        // Load accessibility script
        const accessibilityScript = document.createElement('script');
        accessibilityScript.src = '${webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'accessibility.js'))}';
        accessibilityScript.nonce = '${nonce}';
        document.head.appendChild(accessibilityScript);
        
        // Load keyboard navigation script
        const keyboardNavScript = document.createElement('script');
        keyboardNavScript.src = '${webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'keyboardNavigation.js'))}';
        keyboardNavScript.nonce = '${nonce}';
        document.head.appendChild(keyboardNavScript);
        
        // Load high contrast script
        const highContrastScript = document.createElement('script');
        highContrastScript.src = '${webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'highContrast.js'))}';
        highContrastScript.nonce = '${nonce}';
        document.head.appendChild(highContrastScript);
        
        // Load focus trap script
        const focusTrapScript = document.createElement('script');
        focusTrapScript.src = '${webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'focusTrap.js'))}';
        focusTrapScript.nonce = '${nonce}';
        document.head.appendChild(focusTrapScript);
        
        // Load accessible tooltips script
        const tooltipsScript = document.createElement('script');
        tooltipsScript.src = '${webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'accessibleTooltips.js'))}';
        tooltipsScript.nonce = '${nonce}';
        document.head.appendChild(tooltipsScript);
        
        // Load worker manager
        const workerScript = document.createElement('script');
        workerScript.src = '${webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'workerManager.js'))}';
        workerScript.nonce = '${nonce}';
        document.head.appendChild(workerScript);
        
        // Load progressive renderer
        const rendererScript = document.createElement('script');
        rendererScript.src = '${webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'progressiveRenderer.js'))}';
        rendererScript.nonce = '${nonce}';
        document.head.appendChild(rendererScript);
        
        // Load memory manager
        const memoryScript = document.createElement('script');
        memoryScript.src = '${webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'memoryManager.js'))}';
        memoryScript.nonce = '${nonce}';
        document.head.appendChild(memoryScript);
        
        // Load state manager
        const stateScript = document.createElement('script');
        stateScript.src = '${webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'stateManager.js'))}';
        stateScript.nonce = '${nonce}';
        document.head.appendChild(stateScript);
        
        // Load performance monitor
        const perfMonitorScript = document.createElement('script');
        perfMonitorScript.src = '${webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'performanceMonitor.js'))}';
        perfMonitorScript.nonce = '${nonce}';
        document.head.appendChild(perfMonitorScript);
      </script>
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
    this.lazyLoader?.dispose();
    globalCache.mapData.clearAll();
  }

  /**
   * Setup accessibility features
   */
  private setupAccessibility(webview: vscode.Webview): void {
    // Check for high contrast theme
    if (isHighContrastTheme()) {
      webview.postMessage({
        type: 'accessibility',
        command: 'enableHighContrast',
      });
    }

    // Listen for theme changes
    vscode.window.onDidChangeActiveColorTheme(() => {
      webview.postMessage({
        type: 'accessibility',
        command: isHighContrastTheme() ? 'enableHighContrast' : 'disableHighContrast',
      });
    });
  }

  /**
   * Setup lazy loading for panels
   */
  private setupLazyLoading(): void {
    if (!this.lazyLoader) {
      return;
    }

    // Register panel loaders
    const panelConfigs: LazyLoadConfig[] = [
      {
        panelId: 'tools',
        loadContent: () => PanelContentGenerators.getToolsPanelContent(),
        loadOnVisible: true,
        cacheContent: true,
      },
      {
        panelId: 'layers',
        loadContent: () => PanelContentGenerators.getLayersPanelContent(),
        loadOnVisible: true,
        cacheContent: true,
      },
      {
        panelId: 'properties',
        loadContent: () => PanelContentGenerators.getPropertiesPanelContent(),
        loadOnVisible: true,
        cacheContent: true,
      },
      {
        panelId: 'tilePalette',
        loadContent: () => PanelContentGenerators.getTilePalettePanelContent(),
        loadOnVisible: true,
        cacheContent: false, // Don't cache as it's large
      },
      {
        panelId: 'statistics',
        loadContent: () => PanelContentGenerators.getStatisticsPanelContent(),
        loadOnVisible: true,
        cacheContent: false, // Dynamic content
      },
    ];

    panelConfigs.forEach(config => {
      this.lazyLoader!.registerPanel(config);
    });
  }

  /**
   * Handle lazy load request
   */
  private async handleLazyLoad(panelId: string): Promise<void> {
    if (!this.lazyLoader) {
      return;
    }

    const config: LazyLoadConfig = {
      panelId,
      loadContent: async () => {
        switch (panelId) {
          case 'tools':
            return PanelContentGenerators.getToolsPanelContent();
          case 'layers':
            return PanelContentGenerators.getLayersPanelContent();
          case 'properties':
            return PanelContentGenerators.getPropertiesPanelContent();
          case 'tilePalette':
            return PanelContentGenerators.getTilePalettePanelContent();
          case 'statistics':
            return PanelContentGenerators.getStatisticsPanelContent();
          default:
            return '<div>Panel not found</div>';
        }
      },
      cacheContent: panelId !== 'statistics' && panelId !== 'tilePalette',
    };

    await this.lazyLoader.loadPanel(panelId, config);
  }

  /**
   * Handle data requests with caching
   */
  private async handleDataRequest(message: {
    type: string;
    requestType: string;
    mapId?: string;
    params?: any;
  }): Promise<void> {
    if (!this._view) {
      return;
    }

    switch (message.requestType) {
      case 'mapData': {
        if (!message.mapId) {
          return;
        }

        // Check cache first
        const cached = globalCache.mapData.getMapData(message.mapId);
        if (cached) {
          this._view.webview.postMessage({
            type: 'dataResponse',
            requestType: 'mapData',
            data: cached,
          });
          return;
        }

        // Load and cache
        const data = await this.loadMapData(message.mapId);
        globalCache.mapData.setMapData(message.mapId, data);

        this._view.webview.postMessage({
          type: 'dataResponse',
          requestType: 'mapData',
          data,
        });
        break;
      }

      case 'tileData': {
        if (!message.mapId || !message.params) {
          return;
        }

        const { x, y } = message.params;
        const cached = globalCache.mapData.getTileData(message.mapId, x, y);

        if (cached) {
          this._view.webview.postMessage({
            type: 'dataResponse',
            requestType: 'tileData',
            data: cached,
          });
          return;
        }

        // Load and cache
        const data = await this.loadTileData(message.mapId, x, y);
        globalCache.mapData.setTileData(message.mapId, x, y, data);

        this._view.webview.postMessage({
          type: 'dataResponse',
          requestType: 'tileData',
          data,
        });
        break;
      }
    }
  }

  /**
   * Load map data (placeholder - implement actual loading)
   */
  private async loadMapData(mapId: string): Promise<any> {
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      id: mapId,
      name: 'Sample Map',
      dimensions: { width: 50, height: 50 },
      tileCount: 2500,
    };
  }

  /**
   * Load tile data (placeholder - implement actual loading)
   */
  private async loadTileData(_mapId: string, x: number, y: number): Promise<any> {
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 50));

    return {
      x,
      y,
      type: Math.floor(Math.random() * 5),
      height: Math.floor(Math.random() * 10),
    };
  }
}
