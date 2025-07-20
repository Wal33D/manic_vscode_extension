import * as vscode from 'vscode';
import { PathfindingAnalyzer, HeatMapData } from './pathfindingAnalyzer';
import { HeatMapRenderer } from './heatMapRenderer';

export class HeatMapProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'manicMiners.heatMap';

  private _view?: vscode.WebviewView;
  private _currentDocument?: vscode.TextDocument;
  private analyzer: PathfindingAnalyzer;
  private currentHeatMap?: HeatMapData;
  private currentMode: 'traffic' | 'accessibility' | 'chokepoint' = 'traffic';

  constructor(private readonly _extensionUri: vscode.Uri) {
    this.analyzer = new PathfindingAnalyzer();
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Listen for messages from the webview
    webviewView.webview.onDidReceiveMessage(data => {
      switch (data.type) {
        case 'ready':
          this.updateHeatMap();
          break;
        case 'changeMode':
          this.currentMode = data.mode;
          this.updateHeatMap();
          break;
        case 'changeColorScheme':
          this._view?.webview.postMessage({
            type: 'updateColorScheme',
            colorScheme: data.colorScheme,
          });
          break;
        case 'exportImage':
          this.exportHeatMap();
          break;
        case 'showStatistics':
          this.showStatistics();
          break;
        case 'navigateToHotspot':
          this.navigateToPosition(data.row, data.col);
          break;
      }
    });

    // Update heat map when visible
    if (webviewView.visible) {
      this.updateHeatMap();
    }
  }

  public updateDocument(document: vscode.TextDocument) {
    this._currentDocument = document;
    if (this.analyzer.initialize(document)) {
      this.updateHeatMap();
    }
  }

  private updateHeatMap() {
    if (!this._view || !this._currentDocument) {
      return;
    }

    try {
      // Generate heat map based on current mode
      switch (this.currentMode) {
        case 'traffic':
          this.currentHeatMap = this.analyzer.generateTrafficHeatMap();
          break;
        case 'accessibility': {
          // Use corners as starting points for accessibility
          const gridRows = this.analyzer.generateTrafficHeatMap().grid.length;
          const gridCols = gridRows > 0 ? this.analyzer.generateTrafficHeatMap().grid[0].length : 0;
          const startPoints = [
            { row: 0, col: 0 },
            { row: 0, col: Math.min(10, gridCols - 1) },
            { row: Math.min(10, gridRows - 1), col: 0 },
            { row: Math.min(10, gridRows - 1), col: Math.min(10, gridCols - 1) },
          ].filter(p => p.row >= 0 && p.col >= 0);
          this.currentHeatMap = this.analyzer.generateAccessibilityHeatMap(startPoints);
          break;
        }
        case 'chokepoint':
          this.currentHeatMap = this.analyzer.generateChokepointHeatMap();
          break;
      }

      // Send heat map data to webview
      this._view.webview.postMessage({
        type: 'updateHeatMap',
        heatMapData: this.currentHeatMap,
        mode: this.currentMode,
      });
    } catch (error) {
      console.error('Error generating heat map:', error);
      this._view.webview.postMessage({
        type: 'error',
        message: 'Failed to generate heat map',
      });
    }
  }

  private async exportHeatMap() {
    if (!this.currentHeatMap) {
      vscode.window.showErrorMessage('No heat map to export');
      return;
    }

    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(`heatmap-${this.currentMode}-${Date.now()}.png`),
      filters: {
        Images: ['png'],
      },
    });

    if (uri) {
      this._view?.webview.postMessage({
        type: 'exportToFile',
        path: uri.fsPath,
      });
    }
  }

  private showStatistics() {
    if (!this.currentHeatMap) {
      vscode.window.showErrorMessage('No heat map data available');
      return;
    }

    const stats = HeatMapRenderer.generateStatistics(this.currentHeatMap);

    // Create output channel
    const channel = vscode.window.createOutputChannel('Heat Map Statistics');
    channel.clear();
    channel.append(stats);
    channel.show();
  }

  private navigateToPosition(row: number, col: number) {
    if (!this._currentDocument) {
      return;
    }

    const text = this._currentDocument.getText();
    const lines = text.split('\n');

    // Find the tiles section
    let tilesLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === 'tiles{') {
        tilesLineIndex = i + 1 + row; // +1 for section header, +row for target row
        break;
      }
    }

    if (tilesLineIndex !== -1 && tilesLineIndex < lines.length) {
      // Calculate character position in the row
      const targetLine = lines[tilesLineIndex];
      const tiles = targetLine.split(',');
      let charPos = 0;

      for (let i = 0; i < col && i < tiles.length; i++) {
        charPos += tiles[i].length + 1; // +1 for comma
      }

      // Set cursor position
      const position = new vscode.Position(tilesLineIndex, charPos);
      const editor = vscode.window.activeTextEditor;

      if (editor && editor.document === this._currentDocument) {
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position));
      }
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'heatMap.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'heatMap.css')
    );

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri}" rel="stylesheet">
        <title>Heat Map Analysis</title>
      </head>
      <body>
        <div class="heatmap-container">
          <div class="controls">
            <div class="mode-selector">
              <label>Mode:</label>
              <select id="modeSelect">
                <option value="traffic" selected>Traffic Analysis</option>
                <option value="accessibility">Accessibility</option>
                <option value="chokepoint">Chokepoints</option>
              </select>
            </div>
            
            <div class="color-scheme-selector">
              <label>Colors:</label>
              <select id="colorSchemeSelect">
                <option value="traffic" selected>Traffic</option>
                <option value="accessibility">Accessibility</option>
                <option value="chokepoint">Chokepoint</option>
                <option value="temperature">Temperature</option>
              </select>
            </div>

            <div class="opacity-control">
              <label>Opacity:</label>
              <input type="range" id="opacitySlider" min="0" max="100" value="70">
              <span id="opacityValue">70%</span>
            </div>

            <div class="toggle-controls">
              <label><input type="checkbox" id="toggleGrid" checked> Grid</label>
              <label><input type="checkbox" id="toggleHotspots" checked> Hotspots</label>
              <label><input type="checkbox" id="toggleLegend" checked> Legend</label>
            </div>

            <div class="action-buttons">
              <button id="exportBtn" title="Export as PNG">
                <span class="codicon codicon-export"></span> Export
              </button>
              <button id="statsBtn" title="Show Statistics">
                <span class="codicon codicon-graph"></span> Stats
              </button>
              <button id="refreshBtn" title="Refresh Heat Map">
                <span class="codicon codicon-refresh"></span> Refresh
              </button>
            </div>
          </div>

          <div class="visualization-area">
            <div class="map-wrapper">
              <canvas id="heatMapCanvas"></canvas>
              <div id="legendCanvas" class="legend"></div>
            </div>
            
            <div class="info-panel">
              <h3>Heat Map Info</h3>
              <div id="infoContent">
                <p>Loading heat map data...</p>
              </div>
              
              <div class="hotspots-list" id="hotspotsList">
                <h4>Top Hotspots</h4>
                <ul></ul>
              </div>
            </div>
          </div>

          <div class="status-bar">
            <span id="status">Ready</span>
            <span id="hover-info"></span>
          </div>
        </div>
        <script src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}
