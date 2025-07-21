import * as vscode from 'vscode';
import { DatFileParser } from '../parser/datFileParser';
import { EditHistory, MapEdit, EditChange } from '../undoRedo/editHistory';
import { getTileColor } from '../mapPreview/colorMap';
import { getTileName } from '../data/tileDefinitions';

export interface PaintTool {
  type: 'paint' | 'fill' | 'line' | 'rectangle' | 'picker';
  size: number;
  tileId: number;
}

// Maximum map dimensions to prevent performance issues
const MAX_MAP_DIMENSION = 500;
const MAX_TILE_ID = 115;
const MIN_TILE_ID = 1;

export class MapEditorProvider implements vscode.CustomTextEditorProvider {
  private static readonly viewType = 'manicMiners.mapEditor';
  private editHistory = new EditHistory(100);

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new MapEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      MapEditorProvider.viewType,
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

  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
    };

    // Initial update
    this.updateWebview(webviewPanel.webview, document);

    // Update when document changes
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        this.updateWebview(webviewPanel.webview, document);
      }
    });

    // Handle messages from webview
    webviewPanel.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'paint':
          await this.handlePaint(document, message.tiles, message.description);
          break;
        case 'undo':
          await this.handleUndo(document);
          break;
        case 'redo':
          await this.handleRedo(document);
          break;
        case 'getTileInfo':
          webviewPanel.webview.postMessage({
            type: 'tileInfo',
            row: message.row,
            col: message.col,
            tileId: message.tileId,
            tileName: getTileName(message.tileId),
          });
          break;
        case 'error':
          vscode.window.showErrorMessage(message.message || 'An error occurred in the map editor');
          break;
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });
  }

  private async handlePaint(
    document: vscode.TextDocument,
    tiles: { row: number; col: number; tileId: number }[],
    description: string
  ): Promise<void> {
    try {
      // Validate tiles input
      if (!Array.isArray(tiles) || tiles.length === 0) {
        vscode.window.showErrorMessage('Invalid tiles data received');
        return;
      }

      // Validate each tile
      for (const tile of tiles) {
        if (
          typeof tile.row !== 'number' ||
          typeof tile.col !== 'number' ||
          typeof tile.tileId !== 'number'
        ) {
          vscode.window.showErrorMessage('Invalid tile data format');
          return;
        }
        if (tile.tileId < MIN_TILE_ID || tile.tileId > MAX_TILE_ID) {
          vscode.window.showErrorMessage(
            `Invalid tile ID: ${tile.tileId}. Must be between ${MIN_TILE_ID} and ${MAX_TILE_ID}`
          );
          return;
        }
      }
      const parser = new DatFileParser(document.getText());
      const tilesSection = parser.getSection('tiles');
      if (!tilesSection) {
        vscode.window.showErrorMessage('No tiles section found in document');
        return;
      }

      const lines = document.getText().split('\n');
      const tilesStartLine = lines.findIndex(line => line.trim() === 'tiles{');
      const tilesEndLine = lines.findIndex(
        (line, index) => index > tilesStartLine && line.trim() === '}'
      );

      if (tilesStartLine === -1 || tilesEndLine === -1) {
        return;
      }

      const edit = new vscode.WorkspaceEdit();
      const changes: EditChange[] = [];

      // Parse current tiles
      const tileLines = lines.slice(tilesStartLine + 1, tilesEndLine);
      const tileGrid: number[][] = tileLines
        .filter(line => line.trim().length > 0)
        .map(line => line.split(',').map(t => parseInt(t.trim(), 10)));

      // Group tiles by row for efficient editing
      const tilesByRow = new Map<number, { col: number; tileId: number }[]>();
      for (const tile of tiles) {
        if (!tilesByRow.has(tile.row)) {
          tilesByRow.set(tile.row, []);
        }
        tilesByRow.get(tile.row)!.push({ col: tile.col, tileId: tile.tileId });
      }

      // Apply changes with bounds checking
      for (const [row, rowTiles] of tilesByRow) {
        if (row < 0 || row >= tileGrid.length) {
          continue; // Skip invalid rows
        }
        const lineIndex = tilesStartLine + 1 + row;
        const oldLine = lines[lineIndex];
        const tiles = [...tileGrid[row]];

        // Track old values for undo
        for (const { col, tileId } of rowTiles) {
          if (col < 0 || col >= tiles.length) {
            continue; // Skip invalid columns
          }
          const oldTileId = tiles[col];
          tiles[col] = tileId;

          // Find character position in line
          const tileStrings = oldLine.split(',');
          let charPos = 0;
          for (let i = 0; i < col; i++) {
            charPos += tileStrings[i].length + 1; // +1 for comma
          }

          changes.push({
            range: new vscode.Range(
              lineIndex,
              charPos,
              lineIndex,
              charPos + tileStrings[col].trim().length
            ),
            oldText: String(oldTileId),
            newText: String(tileId),
          });
        }

        const newLine = tiles.join(',');
        edit.replace(
          document.uri,
          new vscode.Range(lineIndex, 0, lineIndex, oldLine.length),
          newLine
        );
      }

      // Record edit for undo history
      const mapEdit: MapEdit = {
        id: Date.now().toString(),
        timestamp: new Date(),
        description,
        documentUri: document.uri,
        changes,
      };

      const success = await vscode.workspace.applyEdit(edit);
      if (success) {
        this.editHistory.addEdit(mapEdit);
      } else {
        vscode.window.showErrorMessage('Failed to apply changes to the document');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error painting tiles: ${errorMessage}`);
    }
  }

  private async handleUndo(document: vscode.TextDocument): Promise<void> {
    try {
      const edit = this.editHistory.undo();
      if (!edit) {
        return;
      }

      const workspaceEdit = new vscode.WorkspaceEdit();
      for (const change of edit.changes) {
        workspaceEdit.replace(document.uri, change.range, change.oldText);
      }

      const success = await vscode.workspace.applyEdit(workspaceEdit);
      if (!success) {
        vscode.window.showErrorMessage('Failed to undo changes');
        // Re-add the edit to history since undo failed
        this.editHistory.addEdit(edit);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error during undo: ${errorMessage}`);
    }
  }

  private async handleRedo(document: vscode.TextDocument): Promise<void> {
    try {
      const edit = this.editHistory.redo();
      if (!edit) {
        return;
      }

      const workspaceEdit = new vscode.WorkspaceEdit();
      for (const change of edit.changes) {
        workspaceEdit.replace(document.uri, change.range, change.newText);
      }

      const success = await vscode.workspace.applyEdit(workspaceEdit);
      if (!success) {
        vscode.window.showErrorMessage('Failed to redo changes');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error during redo: ${errorMessage}`);
    }
  }

  private updateWebview(webview: vscode.Webview, document: vscode.TextDocument): void {
    try {
      const parser = new DatFileParser(document.getText());
      const datFile = parser.parse();

      if (!datFile || !datFile.tiles) {
        webview.html = this.getErrorHtml('Unable to parse map file: Missing tiles section');
        return;
      }

      // Validate map dimensions
      if (datFile.info.rowcount > MAX_MAP_DIMENSION || datFile.info.colcount > MAX_MAP_DIMENSION) {
        webview.html = this.getErrorHtml(
          `Map too large: ${datFile.info.rowcount}x${datFile.info.colcount}. Maximum supported size is ${MAX_MAP_DIMENSION}x${MAX_MAP_DIMENSION}`
        );
        return;
      }

      // Validate tile data
      if (datFile.tiles.length !== datFile.info.rowcount) {
        webview.html = this.getErrorHtml(
          `Map data mismatch: Expected ${datFile.info.rowcount} rows but found ${datFile.tiles.length}`
        );
        return;
      }

      webview.html = this.getHtmlContent(webview, datFile.tiles, datFile.info);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      webview.html = this.getErrorHtml(errorMessage);
    }
  }

  private getHtmlContent(
    webview: vscode.Webview,
    tiles: number[][],
    info: { rowcount: number; colcount: number }
  ): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'mapEditor.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'mapEditor.css')
    );

    // Get tile colors for palette
    const tileColors: { [key: number]: string } = {};
    const commonTiles = [1, 6, 11, 26, 30, 34, 38, 40, 42, 46, 50];
    for (const tileId of commonTiles) {
      const color = getTileColor(tileId);
      tileColors[tileId] = `rgb(${color.r}, ${color.g}, ${color.b})`;
    }

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Map Editor</title>
      <link href="${styleUri}" rel="stylesheet">
    </head>
    <body>
      <div id="container">
        <div id="toolbar">
          <h2>Map Editor</h2>
          <div class="tool-group">
            <label>Tool:</label>
            <button class="tool-btn active" data-tool="paint" title="Paint (P)">🖌️ Paint</button>
            <button class="tool-btn" data-tool="fill" title="Fill (F)">🪣 Fill</button>
            <button class="tool-btn" data-tool="line" title="Line (L)">📏 Line</button>
            <button class="tool-btn" data-tool="rectangle" title="Rectangle (R)">⬜ Rectangle</button>
            <button class="tool-btn" data-tool="picker" title="Picker (K)">💉 Picker</button>
          </div>
          
          <div class="tool-group">
            <label>Brush Size:</label>
            <input type="range" id="brushSize" min="1" max="10" value="1">
            <span id="brushSizeDisplay">1</span>
          </div>
          
          <div class="tool-group">
            <label>Selected Tile:</label>
            <div id="selectedTile" class="tile-preview" style="background-color: ${tileColors[1]}"></div>
            <span id="selectedTileId">1 - Ground</span>
          </div>
          
          <div class="tool-group">
            <button id="undoBtn" title="Undo (Ctrl+Z)">↶ Undo</button>
            <button id="redoBtn" title="Redo (Ctrl+Y)">↷ Redo</button>
          </div>
          
          <div class="coordinates">
            <span id="coords">Row: -, Col: -</span>
          </div>
        </div>
        
        <div id="mainContent">
          <div id="palette">
            <h3>Tile Palette</h3>
            <div id="tileList">
              ${commonTiles
                .map(
                  tileId => `
                <div class="palette-tile ${tileId === 1 ? 'selected' : ''}" 
                     data-tile-id="${tileId}"
                     style="background-color: ${tileColors[tileId]}"
                     title="${getTileName(tileId)}">
                  <span class="tile-id">${tileId}</span>
                </div>
              `
                )
                .join('')}
            </div>
            <input type="number" id="customTileId" min="1" max="115" placeholder="Custom ID">
            <button id="addCustomTile">Add Custom</button>
          </div>
          
          <div id="mapContainer">
            <canvas id="mapCanvas"></canvas>
            <canvas id="overlayCanvas"></canvas>
          </div>
        </div>
      </div>
      
      <div class="progress-overlay" id="progressOverlay">
        <div class="progress-content">
          <div class="progress-spinner"></div>
          <div id="progressText">Processing...</div>
        </div>
      </div>
      
      <div class="status-message" id="statusMessage"></div>
      
      <script>
        const vscode = acquireVsCodeApi();
        const tiles = ${JSON.stringify(tiles)};
        const rows = ${info.rowcount};
        const cols = ${info.colcount};
        const tileColors = ${JSON.stringify(tileColors)};
      </script>
      <script src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  private getErrorHtml(message: string): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Map Editor - Error</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          background: #1e1e1e;
          color: #cccccc;
        }
        .error {
          background: #2d2d2d;
          border: 1px solid #f44747;
          border-radius: 8px;
          padding: 20px;
          max-width: 500px;
        }
        h2 { color: #f44747; margin-top: 0; }
      </style>
    </head>
    <body>
      <div class="error">
        <h2>Error Loading Map</h2>
        <p>${message}</p>
      </div>
    </body>
    </html>`;
  }
}
