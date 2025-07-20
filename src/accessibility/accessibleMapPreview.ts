import * as vscode from 'vscode';
import { AccessibilityManager } from './accessibilityManager';
import { DatFileParser } from '../parser/datFileParser';
import { getColorMap } from '../mapPreview/colorMap';
import { getTileInfo } from '../data/tileDefinitions';
import { getEnhancedTileInfo } from '../data/enhancedTileDefinitions';
import { getExtendedTileInfo } from '../data/extendedTileDefinitions';

export class AccessibleMapPreviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'manicMiners.mapPreview';

  private _view?: vscode.WebviewView;
  private _currentDocument?: vscode.TextDocument;
  private accessibilityManager: AccessibilityManager;
  private focusedTile: { row: number; col: number } | null = null;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this.accessibilityManager = AccessibilityManager.getInstance(context);
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
        case 'tileClick':
          this._handleTileClick(data.row, data.col, data.tileId);
          break;
        case 'tilesSelected':
          this._handleTilesSelected(data.tiles);
          break;
        case 'ready':
          this.updatePreview();
          break;
        case 'keyboardNavigation':
          this.handleKeyboardNavigation(data.key);
          break;
        case 'announceToScreenReader':
          this.accessibilityManager.announce(data.message, data.priority);
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

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'accessibleMapPreview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'accessibleMapPreview.css')
    );

    const accessibilityOptions = this.accessibilityManager.getOptions();
    const htmlAttrs = this.accessibilityManager.generateHtmlAttributes();
    const colorScheme = this.accessibilityManager.getColorScheme();

    return `<!DOCTYPE html>
      <html lang="en" ${htmlAttrs}>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri}" rel="stylesheet">
        <title>Accessible Map Preview</title>
        <style>
          :root {
            --bg-color: ${colorScheme.background};
            --fg-color: ${colorScheme.foreground};
            --border-color: ${colorScheme.border};
            --accent-color: ${colorScheme.accent};
            --error-color: ${colorScheme.error};
            --warning-color: ${colorScheme.warning};
            --success-color: ${colorScheme.success};
            --info-color: ${colorScheme.info};
          }
        </style>
      </head>
      <body>
        <div class="map-preview-container" role="main">
          <div class="accessibility-toolbar" role="toolbar" aria-label="Accessibility Options">
            <button id="toggleHighContrast" aria-label="Toggle High Contrast">
              <span aria-hidden="true">🎨</span> High Contrast
            </button>
            <button id="toggleScreenReader" aria-label="Toggle Screen Reader Mode">
              <span aria-hidden="true">🔊</span> Screen Reader
            </button>
            <button id="increaseFontSize" aria-label="Increase Font Size">
              <span aria-hidden="true">A+</span> Larger Text
            </button>
            <button id="decreaseFontSize" aria-label="Decrease Font Size">
              <span aria-hidden="true">A-</span> Smaller Text
            </button>
          </div>

          <div class="controls" role="toolbar" aria-label="Map Controls">
            <div class="zoom-controls" role="group" aria-label="Zoom Controls">
              <button id="zoomIn" title="Zoom In" aria-label="Zoom In">+</button>
              <button id="zoomOut" title="Zoom Out" aria-label="Zoom Out">-</button>
              <button id="zoomReset" title="Reset Zoom" aria-label="Reset Zoom">Reset</button>
              <span class="zoom-level" aria-live="polite" aria-atomic="true">100%</span>
            </div>
            <div class="toggle-controls" role="group" aria-label="Display Options">
              <label><input type="checkbox" id="toggleGrid" checked aria-label="Toggle Grid"> Grid</label>
              <label><input type="checkbox" id="toggleIds" checked aria-label="Toggle Tile IDs"> IDs</label>
              <label><input type="checkbox" id="toggleContrast" aria-label="Toggle Enhanced Contrast"> Enhanced Contrast</label>
            </div>
          </div>

          <div class="map-container" role="application" aria-label="Interactive Map Grid">
            <canvas id="mapCanvas" tabindex="0" aria-label="Map Canvas - Use arrow keys to navigate"></canvas>
            <div class="tile-info" role="status" aria-live="polite" aria-atomic="true"></div>
            
            <!-- Screen reader only content -->
            <div class="sr-only" aria-live="polite" aria-atomic="true">
              <h2>Map Information</h2>
              <div id="mapDescription"></div>
              <div id="currentTileInfo"></div>
            </div>
          </div>

          <div class="status-bar" role="status" aria-live="polite">
            <span id="dimensions" aria-label="Map dimensions"></span>
            <span id="hover-info" aria-label="Current tile information"></span>
            <span id="keyboard-help" aria-label="Press H for keyboard shortcuts"></span>
          </div>

          <!-- Keyboard shortcuts help -->
          <div id="keyboardHelp" class="keyboard-help" role="dialog" aria-labelledby="helpTitle" hidden>
            <h2 id="helpTitle">Keyboard Shortcuts</h2>
            <dl>
              <dt>Arrow Keys</dt>
              <dd>Navigate through tiles</dd>
              <dt>Enter/Space</dt>
              <dd>Select current tile</dd>
              <dt>Tab</dt>
              <dd>Move to next control</dd>
              <dt>H</dt>
              <dd>Toggle this help</dd>
              <dt>G</dt>
              <dd>Toggle grid</dd>
              <dt>I</dt>
              <dd>Toggle tile IDs</dd>
              <dt>+/-</dt>
              <dd>Zoom in/out</dd>
              <dt>0</dt>
              <dd>Reset zoom</dd>
              <dt>Escape</dt>
              <dd>Exit selection mode</dd>
            </dl>
            <button id="closeHelp" aria-label="Close help">Close</button>
          </div>
        </div>
        <script>
          window.accessibilityOptions = ${JSON.stringify(accessibilityOptions)};
        </script>
        <script src="${scriptUri}"></script>
      </body>
      </html>`;
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

      // Add screen reader announcements for map updates
      if (this.accessibilityManager.isScreenReaderEnabled()) {
        const totalTiles = tileRows.reduce((sum, row) => sum + row.length, 0);
        this.accessibilityManager.announce(
          `Map updated: ${tileRows.length} rows, ${tileRows[0]?.length || 0} columns, ${totalTiles} total tiles`
        );
      }
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

  private handleKeyboardNavigation(key: string): void {
    if (!this._view || !this._currentDocument) {
      return;
    }

    const parser = new DatFileParser(this._currentDocument.getText());
    const tilesSection = parser.getSection('tiles');

    if (!tilesSection) {
      return;
    }

    const tileRows = this.parseTiles(tilesSection.content);
    const maxRow = tileRows.length - 1;
    const maxCol = Math.max(...tileRows.map(row => row.length - 1));

    if (!this.focusedTile) {
      this.focusedTile = { row: 0, col: 0 };
    }

    let { row, col } = this.focusedTile;
    let moved = false;

    switch (key) {
      case 'ArrowUp':
        if (row > 0) {
          row--;
          moved = true;
        }
        break;
      case 'ArrowDown':
        if (row < maxRow) {
          row++;
          moved = true;
        }
        break;
      case 'ArrowLeft':
        if (col > 0) {
          col--;
          moved = true;
        }
        break;
      case 'ArrowRight':
        if (col < maxCol) {
          col++;
          moved = true;
        }
        break;
      case 'Home':
        col = 0;
        moved = true;
        break;
      case 'End':
        col = maxCol;
        moved = true;
        break;
      case 'PageUp':
        row = Math.max(0, row - 5);
        moved = true;
        break;
      case 'PageDown':
        row = Math.min(maxRow, row + 5);
        moved = true;
        break;
    }

    if (moved) {
      this.focusedTile = { row, col };

      // Update focus in webview
      this._view.webview.postMessage({
        type: 'setFocus',
        row,
        col,
      });

      // Announce tile info
      if (row < tileRows.length && col < tileRows[row].length) {
        const tileId = tileRows[row][col];
        const tileInfo = this.getTileInfo(tileId);
        const tileName = tileInfo?.name || `Unknown tile ${tileId}`;

        this.accessibilityManager.announce(
          `Row ${row + 1}, Column ${col + 1}: ${tileName} (ID: ${tileId})`
        );
      }
    }
  }

  private parseTiles(content: string): number[][] {
    return content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line =>
        line
          .split(',')
          .filter(tile => tile.trim().length > 0)
          .map(tile => parseInt(tile.trim()))
      );
  }

  private getTileInfo(tileId: number) {
    return getTileInfo(tileId) || getEnhancedTileInfo(tileId) || getExtendedTileInfo(tileId);
  }
}
