import * as vscode from 'vscode';
import { DatFileParser } from '../parser/datFileParser';
import { getColorMap } from './colorMap';

export class MapPreviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'manicMiners.mapPreview';

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
        case 'tileClick':
          this._handleTileClick(data.row, data.col, data.tileId);
          break;
        case 'tilesSelected':
          this._handleTilesSelected(data.tiles);
          break;
        case 'ready':
          this.updatePreview();
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
      const tilesSection = parser.getSection('tiles');

      if (!tilesSection) {
        this._view.webview.postMessage({ type: 'noTiles' });
        return;
      }

      // Parse tiles into 2D array
      const tileRows = tilesSection.content
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) =>
          line
            .split(',')
            .filter((tile: string) => tile.trim().length > 0)
            .map((tile: string) => parseInt(tile.trim()))
        );

      // Get map dimensions from info section
      const infoSection = parser.getSection('info');
      let rowcount = tileRows.length;
      let colcount = tileRows[0]?.length || 0;

      if (infoSection) {
        const rowMatch = infoSection.content.match(/rowcount:\s*(\d+)/);
        const colMatch = infoSection.content.match(/colcount:\s*(\d+)/);
        if (rowMatch) {
          rowcount = parseInt(rowMatch[1]);
        }
        if (colMatch) {
          colcount = parseInt(colMatch[1]);
        }
      }

      // Send tile data to webview
      this._view.webview.postMessage({
        type: 'updateTiles',
        tiles: tileRows,
        rowcount,
        colcount,
        colorMap: getColorMap(),
      });
    } catch (error) {
      console.error('Error updating map preview:', error);
      this._view.webview.postMessage({
        type: 'error',
        message: 'Failed to parse map data',
      });
    }
  }

  private _handleTileClick(row: number, col: number, _tileId: number) {
    // Navigate to the tile in the editor
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

  private _handleTilesSelected(tiles: Array<{ row: number; col: number }>) {
    if (!this._currentDocument || tiles.length === 0) {
      return;
    }

    vscode.commands.executeCommand('setContext', 'manicMiners.hasMapSelection', true);
    vscode.window.showInformationMessage(
      `Selected ${tiles.length} tiles. Hold Shift and drag to select tiles.`
    );
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'mapPreview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'mapPreview.css')
    );

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri}" rel="stylesheet">
        <title>Map Preview</title>
      </head>
      <body>
        <div class="map-preview-container">
          <div class="controls">
            <div class="zoom-controls">
              <button id="zoomIn" title="Zoom In">+</button>
              <button id="zoomOut" title="Zoom Out">-</button>
              <button id="zoomReset" title="Reset Zoom">Reset</button>
              <span class="zoom-level">100%</span>
            </div>
            <div class="toggle-controls">
              <label><input type="checkbox" id="toggleGrid" checked> Grid</label>
              <label><input type="checkbox" id="toggleIds" checked> IDs</label>
            </div>
          </div>
          <div class="map-container">
            <canvas id="mapCanvas"></canvas>
            <div class="tile-info"></div>
          </div>
          <div class="status-bar">
            <span id="dimensions"></span>
            <span id="hover-info"></span>
          </div>
        </div>
        <script src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}
