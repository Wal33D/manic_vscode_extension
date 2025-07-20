import * as vscode from 'vscode';
import { MapEdit } from './editHistory';
import { DatFileParser } from '../parser/datFileParser';
import { getTileInfo } from '../data/tileDefinitions';
import { getEnhancedTileInfo } from '../data/enhancedTileDefinitions';
import { getExtendedTileInfo } from '../data/extendedTileDefinitions';

export class UndoRedoPreviewProvider {
  private static readonly viewType = 'manicMiners.undoRedoPreview';

  public static async showPreview(
    context: vscode.ExtensionContext,
    edit: MapEdit,
    action: 'undo' | 'redo'
  ): Promise<boolean> {
    const document = await vscode.workspace.openTextDocument(edit.documentUri);
    const parser = new DatFileParser(document.getText());
    const info = parser.getSection('info');

    if (!info) {
      return false;
    }

    // Extract map dimensions
    const rowMatch = info.content?.match(/rowcount:\s*(\d+)/);
    const colMatch = info.content?.match(/colcount:\s*(\d+)/);

    if (!rowMatch || !colMatch) {
      return false;
    }

    const rows = parseInt(rowMatch[1]);
    const cols = parseInt(colMatch[1]);

    // Create preview panel
    const panel = vscode.window.createWebviewPanel(
      this.viewType,
      `${action === 'undo' ? 'Undo' : 'Redo'} Preview: ${edit.description}`,
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: false,
      }
    );

    // Generate preview HTML
    const html = this.generatePreviewHtml(
      context,
      panel.webview,
      edit,
      action,
      rows,
      cols,
      document
    );

    panel.webview.html = html;

    // Wait for user response
    return new Promise<boolean>(resolve => {
      let resolved = false;

      // Handle messages from webview
      panel.webview.onDidReceiveMessage(
        message => {
          if (message.command === 'proceed') {
            resolved = true;
            panel.dispose();
            resolve(true);
          } else if (message.command === 'cancel') {
            resolved = true;
            panel.dispose();
            resolve(false);
          }
        },
        undefined,
        []
      );

      // Handle panel disposal
      panel.onDidDispose(() => {
        if (!resolved) {
          resolve(false);
        }
      });
    });
  }

  private static generatePreviewHtml(
    _context: vscode.ExtensionContext,
    _webview: vscode.Webview,
    edit: MapEdit,
    action: 'undo' | 'redo',
    rows: number,
    cols: number,
    document: vscode.TextDocument
  ): string {
    // Calculate affected tiles
    const affectedTiles = new Map<string, { before: number; after: number }>();

    // Get current tiles
    const lines = document.getText().split('\n');
    const tilesStartLine = lines.findIndex(line => line.trim() === 'tiles{');

    for (const change of edit.changes) {
      const lineNum = change.range.start.line;
      const relativeRow = lineNum - tilesStartLine - 1;

      if (relativeRow >= 0 && relativeRow < rows) {
        const oldTiles = change.oldText.split(',').map(t => parseInt(t.trim()));
        const newTiles = change.newText.split(',').map(t => parseInt(t.trim()));

        for (let col = 0; col < Math.min(oldTiles.length, newTiles.length, cols); col++) {
          if (oldTiles[col] !== newTiles[col]) {
            const key = `${relativeRow},${col}`;
            affectedTiles.set(key, {
              before: action === 'undo' ? newTiles[col] : oldTiles[col],
              after: action === 'undo' ? oldTiles[col] : newTiles[col],
            });
          }
        }
      }
    }

    // Generate tile grid visualization
    const tileSize = Math.min(600 / cols, 600 / rows, 20);
    const gridHtml = this.generateTileGrid(rows, cols, affectedTiles, tileSize);

    // Generate changes summary
    const changesHtml = this.generateChangesSummary(affectedTiles);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
          }
          h2 {
            margin-top: 0;
          }
          .preview-container {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
          }
          .tile-grid {
            border: 1px solid var(--vscode-panel-border);
            display: inline-block;
          }
          .tile {
            display: inline-block;
            border: 1px solid var(--vscode-panel-border);
            text-align: center;
            font-size: 10px;
            cursor: pointer;
            position: relative;
          }
          .tile.affected {
            border: 2px solid var(--vscode-editorWarning-foreground);
          }
          .tile.affected::after {
            content: attr(data-change);
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--vscode-editor-background);
            padding: 2px 4px;
            border: 1px solid var(--vscode-panel-border);
            font-size: 9px;
            white-space: nowrap;
            display: none;
          }
          .tile.affected:hover::after {
            display: block;
          }
          .changes-summary {
            flex: 1;
            max-height: 600px;
            overflow-y: auto;
          }
          .change-item {
            padding: 5px;
            margin: 5px 0;
            border-radius: 3px;
            background: var(--vscode-editor-inactiveSelectionBackground);
          }
          .buttons {
            margin-top: 20px;
            text-align: center;
          }
          button {
            padding: 8px 16px;
            margin: 0 5px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
          }
          .proceed {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
          }
          .proceed:hover {
            background: var(--vscode-button-hoverBackground);
          }
          .cancel {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
          }
          .cancel:hover {
            background: var(--vscode-button-secondaryHoverBackground);
          }
          .legend {
            margin-top: 10px;
            font-size: 12px;
          }
          .legend-item {
            display: inline-block;
            margin-right: 15px;
          }
          .legend-color {
            display: inline-block;
            width: 20px;
            height: 10px;
            margin-right: 5px;
            vertical-align: middle;
          }
        </style>
      </head>
      <body>
        <h2>${action === 'undo' ? 'Undo' : 'Redo'}: ${edit.description}</h2>
        
        <div class="preview-container">
          <div>
            <h3>Affected Tiles</h3>
            ${gridHtml}
            <div class="legend">
              <div class="legend-item">
                <span class="legend-color" style="background: var(--vscode-editorWarning-foreground);"></span>
                <span>Tiles to be changed</span>
              </div>
            </div>
          </div>
          
          <div class="changes-summary">
            <h3>Changes Summary (${affectedTiles.size} tiles)</h3>
            ${changesHtml}
          </div>
        </div>
        
        <div class="buttons">
          <button class="proceed" onclick="proceed()">
            ${action === 'undo' ? 'Undo' : 'Redo'} Changes
          </button>
          <button class="cancel" onclick="cancel()">Cancel</button>
        </div>
        
        <script>
          const vscode = acquireVsCodeApi();
          
          function proceed() {
            vscode.postMessage({ command: 'proceed' });
          }
          
          function cancel() {
            vscode.postMessage({ command: 'cancel' });
          }
        </script>
      </body>
      </html>
    `;
  }

  private static generateTileGrid(
    rows: number,
    cols: number,
    affectedTiles: Map<string, { before: number; after: number }>,
    tileSize: number
  ): string {
    let html = '<div class="tile-grid">';

    for (let row = 0; row < rows; row++) {
      html += '<div>';
      for (let col = 0; col < cols; col++) {
        const key = `${row},${col}`;
        const change = affectedTiles.get(key);
        const isAffected = change !== undefined;

        html += `<div class="tile ${isAffected ? 'affected' : ''}" 
          style="width: ${tileSize}px; height: ${tileSize}px; line-height: ${tileSize}px;"
          ${isAffected ? `data-change="${change.before} → ${change.after}"` : ''}>
          ${isAffected ? '•' : ''}
        </div>`;
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  private static generateChangesSummary(
    affectedTiles: Map<string, { before: number; after: number }>
  ): string {
    // Group changes by tile type transition
    const transitions = new Map<string, number>();

    for (const change of affectedTiles.values()) {
      const key = `${change.before} → ${change.after}`;
      transitions.set(key, (transitions.get(key) || 0) + 1);
    }

    let html = '';
    for (const [transition, count] of transitions) {
      const [beforeId, afterId] = transition.split(' → ').map(id => parseInt(id));
      const beforeInfo =
        getTileInfo(beforeId) || getEnhancedTileInfo(beforeId) || getExtendedTileInfo(beforeId);
      const afterInfo =
        getTileInfo(afterId) || getEnhancedTileInfo(afterId) || getExtendedTileInfo(afterId);

      const beforeName = beforeInfo?.name || `Tile ${beforeId}`;
      const afterName = afterInfo?.name || `Tile ${afterId}`;

      html += `
        <div class="change-item">
          <strong>${beforeName} (${beforeId})</strong> → <strong>${afterName} (${afterId})</strong>
          <span style="float: right;">${count} tile${count > 1 ? 's' : ''}</span>
        </div>
      `;
    }

    return html;
  }
}
