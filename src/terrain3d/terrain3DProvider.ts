import * as vscode from 'vscode';
import { DatFileParser } from '../parser/datFileParser';
import { getColorMap } from '../mapPreview/colorMap';

export class Terrain3DProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'manicMiners.terrain3D';

  private _view?: vscode.WebviewView;
  private _currentDocument?: vscode.TextDocument;

  constructor(private readonly _extensionUri: vscode.Uri) {}

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
          this.updatePreview();
          break;
        case 'tileClick':
          this._handleTileClick(data.x, data.z, data.tileId);
          break;
      }
    });

    // Update preview when visible
    if (webviewView.visible) {
      this.updatePreview();
    }
  }

  public updateDocument(document: vscode.TextDocument) {
    this._currentDocument = document;
    this.updatePreview();
  }

  private updatePreview() {
    if (!this._view || !this._currentDocument) {
      return;
    }

    try {
      const parser = new DatFileParser(this._currentDocument.getText());
      const datFile = parser.parse();

      if (datFile.tiles && datFile.height && datFile.info) {
        const terrainData = {
          tiles: datFile.tiles,
          height: datFile.height,
          rows: datFile.info.rowcount,
          cols: datFile.info.colcount,
          colorMap: getColorMap(),
          biome: datFile.info.biome || 'rock',
          resources: datFile.resources,
        };

        this._view.webview.postMessage({
          type: 'updateTerrain',
          data: terrainData,
        });
      }
    } catch (error) {
      // Handle parse errors gracefully
      this._view.webview.postMessage({
        type: 'error',
        message: 'Failed to parse DAT file',
      });
    }
  }

  private _handleTileClick(x: number, z: number, tileId: number) {
    // Navigate to the tile in the editor
    if (this._currentDocument) {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document === this._currentDocument) {
        // Find the position of this tile in the tiles section
        const text = this._currentDocument.getText();
        const tilesMatch = text.match(/tiles\s*{[\s\S]*?}/);
        if (tilesMatch) {
          vscode.window.showInformationMessage(
            `Tile at (${x}, ${z}): ID ${tileId}`
          );
        }
      }
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'terrain3D.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'terrain3D.css')
    );
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'unsafe-inline' https://unpkg.com;">
        <link href="${styleUri}" rel="stylesheet">
        <title>3D Terrain Preview</title>
      </head>
      <body>
        <div class="terrain-container">
          <div class="controls">
            <div class="view-controls">
              <button id="viewTop" title="Top View">Top</button>
              <button id="viewIso" title="Isometric View">Iso</button>
              <button id="viewSide" title="Side View">Side</button>
              <button id="resetView" title="Reset View">Reset</button>
            </div>
            <div class="display-controls">
              <label><input type="checkbox" id="toggleWireframe"> Wireframe</label>
              <label><input type="checkbox" id="toggleGrid" checked> Grid</label>
              <label><input type="checkbox" id="toggleHeightColors" checked> Height Colors</label>
              <label><input type="checkbox" id="toggleResources"> Resources</label>
            </div>
            <div class="height-controls">
              <label>Height Scale: <input type="range" id="heightScale" min="0.1" max="3" step="0.1" value="1"></label>
              <span id="heightScaleValue">1.0x</span>
            </div>
          </div>
          <canvas id="terrain3D"></canvas>
          <div class="info-panel">
            <div id="tileInfo">Hover over terrain for tile info</div>
          </div>
        </div>
        <script src="https://unpkg.com/three@0.158.0/build/three.min.js"></script>
        <script src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}