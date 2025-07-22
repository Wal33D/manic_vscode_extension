import * as vscode from 'vscode';
import * as path from 'path';
import { MapStatisticsAnalyzer } from '../statistics/mapStatistics';
import { DatFileParser } from '../parser/datFileParser';

interface DashboardStats {
  totalMaps: number;
  recentMaps: string[];
  currentMapStats?: {
    name: string;
    dimensions: { width: number; height: number };
    tileCount: number;
    resourceCount: number;
    difficultyScore: string;
    lastModified: string;
  };
  extensionStats: {
    mapsCreated: number;
    timeSaved: number;
    quickActionsUsed: number;
    objectivesBuilt: number;
  };
}

export class DashboardProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'manicMiners.dashboard';

  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;
  private currentMapUri?: vscode.Uri;
  private stats: DashboardStats;

  constructor(private readonly context: vscode.ExtensionContext) {
    this._extensionUri = context.extensionUri;
    this.stats = this.loadStats();

    // Watch for active editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && editor.document.languageId === 'manicminers') {
        this.updateCurrentMap(editor.document.uri);
      }
    });
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
    webviewView.webview.onDidReceiveMessage(async message => {
      switch (message.command) {
        case 'runCommand':
          await vscode.commands.executeCommand(message.commandId, message.args);
          break;
        case 'openMap': {
          const uri = vscode.Uri.file(message.path);
          await vscode.commands.executeCommand('vscode.open', uri);
          break;
        }
        case 'refreshStats':
          this.updateStats();
          break;
        case 'openInMapEditor':
          if (this.currentMapUri) {
            await vscode.commands.executeCommand(
              'manicMiners.openInTabbedEditor',
              this.currentMapUri
            );
          }
          break;
        case 'analyzeCurrentMap':
          if (this.currentMapUri) {
            await vscode.commands.executeCommand('manicMiners.showHeatMap');
          }
          break;
      }
    });

    // Update stats when view becomes visible
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.updateStats();
      }
    });

    // Initial update
    this.updateStats();
  }

  private async updateCurrentMap(uri: vscode.Uri) {
    this.currentMapUri = uri;

    try {
      const document = await vscode.workspace.openTextDocument(uri);
      const content = document.getText();
      const parser = new DatFileParser(content);
      const datFile = parser.parse();

      const analyzer = new MapStatisticsAnalyzer(datFile);
      const stats = analyzer.analyzeMap();

      this.stats.currentMapStats = {
        name: path.basename(uri.fsPath),
        dimensions: stats.dimensions,
        tileCount: stats.dimensions.width * stats.dimensions.height,
        resourceCount: this.countResources(stats),
        difficultyScore: stats.difficulty.overall,
        lastModified: new Date().toLocaleString(),
      };

      this.updateRecentMaps(uri.fsPath);
      this.saveStats();
      this.updateStats();
    } catch (error) {
      // Error analyzing current map
    }
  }

  private countResources(stats: {
    resourceDistribution: Map<string, { tileCount: number }>;
  }): number {
    let count = 0;
    stats.resourceDistribution.forEach(dist => {
      count += dist.tileCount;
    });
    return count;
  }

  private updateRecentMaps(path: string) {
    if (!this.stats.recentMaps.includes(path)) {
      this.stats.recentMaps.unshift(path);
      if (this.stats.recentMaps.length > 5) {
        this.stats.recentMaps.pop();
      }
    }
  }

  private updateStats() {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'updateDashboard',
        stats: this.stats,
      });
    }
  }

  private loadStats(): DashboardStats {
    const stats = this.context.globalState.get<DashboardStats>('dashboardStats');
    return (
      stats || {
        totalMaps: 0,
        recentMaps: [],
        extensionStats: {
          mapsCreated: 0,
          timeSaved: 0,
          quickActionsUsed: 0,
          objectivesBuilt: 0,
        },
      }
    );
  }

  private saveStats() {
    this.context.globalState.update('dashboardStats', this.stats);
  }

  public incrementStat(stat: keyof DashboardStats['extensionStats'], amount: number = 1) {
    this.stats.extensionStats[stat] += amount;
    this.saveStats();
    this.updateStats();
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'dashboard.css')
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'dashboard.js')
    );

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${styleUri}" rel="stylesheet">
      <title>Manic Miners Dashboard</title>
    </head>
    <body>
      <div class="dashboard-container">
        <!-- Current Map Overview -->
        <div class="current-map-section" id="currentMapSection">
          <h2>📊 Current Map</h2>
          <div class="current-map-info" id="currentMapInfo">
            <p class="no-map">No map currently open</p>
          </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="quick-actions-section">
          <h2>⚡ Quick Actions</h2>
          <div class="quick-actions-grid">
            <button class="action-button" data-command="manicMiners.newMap">
              <span class="icon">📄</span>
              <span>New Map</span>
            </button>
            <button class="action-button" data-command="manicMiners.openInTabbedEditor" id="editMapBtn" disabled>
              <span class="icon">✏️</span>
              <span>Edit Map</span>
            </button>
            <button class="action-button" data-command="manicMiners.validateMap">
              <span class="icon">✅</span>
              <span>Validate</span>
            </button>
            <button class="action-button" data-command="manicMiners.showHeatMap" id="analyzeBtn" disabled>
              <span class="icon">🔥</span>
              <span>Analyze</span>
            </button>
            <button class="action-button" data-command="manicMiners.showObjectiveBuilder">
              <span class="icon">🎯</span>
              <span>Objectives</span>
            </button>
            <button class="action-button" data-command="manicMiners.showQuickActions">
              <span class="icon">🔧</span>
              <span>More Tools</span>
            </button>
          </div>
        </div>
        
        <!-- Statistics Overview -->
        <div class="stats-overview">
          <h2>📈 Extension Statistics</h2>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value" id="mapsCreated">0</div>
              <div class="stat-label">Maps Created</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" id="timeSaved">0h</div>
              <div class="stat-label">Time Saved</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" id="quickActions">0</div>
              <div class="stat-label">Quick Actions</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" id="objectives">0</div>
              <div class="stat-label">Objectives Built</div>
            </div>
          </div>
        </div>
        
        <!-- Recent Maps -->
        <div class="recent-maps-section">
          <h2>📂 Recent Maps</h2>
          <div class="recent-maps-list" id="recentMapsList">
            <p class="no-recent">No recent maps</p>
          </div>
        </div>
        
        <!-- Map Analysis Results -->
        <div class="analysis-section" id="analysisSection" style="display: none;">
          <h2>🔍 Map Analysis</h2>
          <div class="analysis-content" id="analysisContent">
          </div>
        </div>
        
        <!-- Help & Resources -->
        <div class="help-section">
          <h2>❓ Help & Resources</h2>
          <div class="help-links">
            <a href="#" data-command="manicMiners.showWelcome">Welcome Page</a>
            <a href="#" data-command="workbench.action.openGlobalKeybindings">Keyboard Shortcuts</a>
            <a href="#" data-command="workbench.action.openSettings" data-args="manicMiners">Settings</a>
          </div>
        </div>
      </div>
      
      <script src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new DashboardProvider(context);

    const disposable = vscode.window.registerWebviewViewProvider(
      DashboardProvider.viewType,
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    );

    // Export provider for other extensions to use
    (context as { dashboardProvider?: DashboardProvider }).dashboardProvider = provider;

    return disposable;
  }
}
