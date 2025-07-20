import * as vscode from 'vscode';
import { TileSuggestionEngine } from './tileSuggestionEngine';
import { DatFileParser } from '../parser/datFileParser';
import { getTileInfo } from '../data/tileDefinitions';
import { getEnhancedTileInfo } from '../data/enhancedTileDefinitions';
import { getExtendedTileInfo } from '../data/extendedTileDefinitions';
import { TileSuggestion } from './types';

export class SmartSuggestionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [vscode.CodeActionKind.RefactorRewrite];

  private suggestionEngine: TileSuggestionEngine;

  constructor() {
    this.suggestionEngine = new TileSuggestionEngine();
  }

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    _context: vscode.CodeActionContext,
    _token: vscode.CancellationToken
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    // Only provide suggestions in tiles section
    const parser = new DatFileParser(document.getText());
    const tilesSection = parser.getSection('tiles');
    if (!tilesSection) {
      return actions;
    }

    // Check if we're in the tiles section
    const lines = document.getText().split('\n');
    const tilesStartLine = lines.findIndex(line => line.trim() === 'tiles{');
    const tilesEndLine = lines.findIndex(
      (line, index) => index > tilesStartLine && line.trim() === '}'
    );

    if (range.start.line <= tilesStartLine || range.start.line >= tilesEndLine) {
      return actions;
    }

    // Parse tiles grid
    const tiles = this.parseTilesGrid(tilesSection.content);
    if (!tiles || tiles.length === 0) {
      return actions;
    }

    // Get current position in grid
    const gridPosition = this.getGridPosition(document, range, tilesStartLine);
    if (!gridPosition) {
      return actions;
    }

    // Get smart suggestions
    const suggestions = this.suggestionEngine.getSuggestions(
      tiles,
      gridPosition.row,
      gridPosition.col
    );

    // Create code actions for each suggestion
    for (const suggestion of suggestions) {
      const action = this.createSuggestionAction(document, range, suggestion, gridPosition);
      if (action) {
        actions.push(action);
      }
    }

    // Add "Get Smart Suggestions" action if no inline suggestions
    if (actions.length === 0) {
      const smartSuggestAction = new vscode.CodeAction(
        'Get Smart Tile Suggestions',
        vscode.CodeActionKind.RefactorRewrite
      );
      smartSuggestAction.command = {
        command: 'manicMiners.showSmartSuggestions',
        title: 'Show Smart Suggestions',
        arguments: [document.uri, range, gridPosition],
      };
      actions.push(smartSuggestAction);
    }

    return actions;
  }

  /**
   * Parse tiles content into 2D array
   */
  private parseTilesGrid(content: string): number[][] {
    const lines = content.trim().split('\n');
    const tiles: number[][] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        const row = trimmed
          .split(',')
          .map(t => t.trim())
          .filter(t => t)
          .map(t => parseInt(t, 10))
          .filter(n => !isNaN(n));

        if (row.length > 0) {
          tiles.push(row);
        }
      }
    }

    return tiles;
  }

  /**
   * Get grid position from document position
   */
  private getGridPosition(
    document: vscode.TextDocument,
    range: vscode.Range,
    tilesStartLine: number
  ): { row: number; col: number } | null {
    const line = range.start.line;
    const row = line - tilesStartLine - 1;

    if (row < 0) {
      return null;
    }

    // Find column by parsing the line
    const lineText = document.lineAt(line).text;
    const beforeCursor = lineText.substring(0, range.start.character);
    const commasBefore = (beforeCursor.match(/,/g) || []).length;

    return { row, col: commasBefore };
  }

  /**
   * Create a code action for a tile suggestion
   */
  private createSuggestionAction(
    document: vscode.TextDocument,
    range: vscode.Range,
    suggestion: TileSuggestion,
    gridPosition: { row: number; col: number }
  ): vscode.CodeAction | null {
    const tileInfo = this.getTileInfo(suggestion.tileId);
    const tileName = tileInfo?.name || `Tile ${suggestion.tileId}`;

    const action = new vscode.CodeAction(
      `${tileName} - ${suggestion.reason} (${Math.round(suggestion.confidence * 100)}%)`,
      vscode.CodeActionKind.RefactorRewrite
    );

    // Find the exact position of the tile value
    const lineText = document.lineAt(range.start.line).text;
    const tiles = lineText.split(',');

    if (gridPosition.col >= tiles.length) {
      return null;
    }

    // Calculate the character position of this tile
    let charPos = 0;
    for (let i = 0; i < gridPosition.col; i++) {
      charPos += tiles[i].length + 1; // +1 for comma
    }

    const tileStart = charPos;
    const tileEnd = charPos + tiles[gridPosition.col].trim().length;

    action.edit = new vscode.WorkspaceEdit();
    action.edit.replace(
      document.uri,
      new vscode.Range(range.start.line, tileStart, range.start.line, tileEnd),
      suggestion.tileId.toString()
    );

    // Add icon based on confidence
    if (suggestion.confidence >= 0.8) {
      action.title = '⭐ ' + action.title;
    } else if (suggestion.confidence >= 0.6) {
      action.title = '✨ ' + action.title;
    }

    return action;
  }

  /**
   * Get tile information
   */
  private getTileInfo(tileId: number) {
    return getTileInfo(tileId) || getEnhancedTileInfo(tileId) || getExtendedTileInfo(tileId);
  }
}

/**
 * Register smart suggestion commands
 */
export function registerSmartSuggestionCommands(context: vscode.ExtensionContext): void {
  // Show smart suggestions command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'manicMiners.showSmartSuggestions',
      async (uri: vscode.Uri, range: vscode.Range, gridPosition: { row: number; col: number }) => {
        const document = await vscode.workspace.openTextDocument(uri);
        const parser = new DatFileParser(document.getText());
        const tilesSection = parser.getSection('tiles');

        if (!tilesSection) {
          vscode.window.showErrorMessage('No tiles section found');
          return;
        }

        const engine = new TileSuggestionEngine();
        const tiles = parseTilesGrid(tilesSection.content);
        const suggestions = engine.getSuggestions(tiles, gridPosition.row, gridPosition.col, 10);

        if (suggestions.length === 0) {
          vscode.window.showInformationMessage('No smart suggestions available for this position');
          return;
        }

        // Create quick pick items
        const items: vscode.QuickPickItem[] = suggestions.map(s => {
          const tileInfo =
            getTileInfo(s.tileId) || getEnhancedTileInfo(s.tileId) || getExtendedTileInfo(s.tileId);
          const tileName = tileInfo?.name || `Tile ${s.tileId}`;

          return {
            label: `${tileName} (${s.tileId})`,
            description: s.reason,
            detail: `Confidence: ${Math.round(s.confidence * 100)}%`,
          };
        });

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select a tile suggestion',
          title: 'Smart Tile Suggestions',
        });

        if (selected) {
          // Extract tile ID from label
          const match = selected.label.match(/\((\d+)\)$/);
          if (match) {
            const tileId = parseInt(match[1], 10);
            await applyTileSuggestion(document, range, gridPosition, tileId);
          }
        }
      }
    )
  );

  // Analyze tile patterns command
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.analyzeTilePatterns', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'manicminers') {
        vscode.window.showErrorMessage('Please open a Manic Miners DAT file');
        return;
      }

      const parser = new DatFileParser(editor.document.getText());
      const tilesSection = parser.getSection('tiles');

      if (!tilesSection) {
        vscode.window.showErrorMessage('No tiles section found');
        return;
      }

      const tiles = parseTilesGrid(tilesSection.content);
      const analysis = analyzeTilePatterns(tiles);

      // Show analysis results
      const panel = vscode.window.createWebviewPanel(
        'tilePatternAnalysis',
        'Tile Pattern Analysis',
        vscode.ViewColumn.Two,
        {}
      );

      panel.webview.html = generateAnalysisHtml(analysis);
    })
  );
}

/**
 * Parse tiles content into 2D array (helper function)
 */
function parseTilesGrid(content: string): number[][] {
  const lines = content.trim().split('\n');
  const tiles: number[][] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      const row = trimmed
        .split(',')
        .map(t => t.trim())
        .filter(t => t)
        .map(t => parseInt(t, 10))
        .filter(n => !isNaN(n));

      if (row.length > 0) {
        tiles.push(row);
      }
    }
  }

  return tiles;
}

/**
 * Apply a tile suggestion
 */
async function applyTileSuggestion(
  document: vscode.TextDocument,
  range: vscode.Range,
  gridPosition: { row: number; col: number },
  tileId: number
): Promise<void> {
  const edit = new vscode.WorkspaceEdit();
  const lineText = document.lineAt(range.start.line).text;
  const tiles = lineText.split(',');

  if (gridPosition.col >= tiles.length) {
    return;
  }

  // Calculate the character position of this tile
  let charPos = 0;
  for (let i = 0; i < gridPosition.col; i++) {
    charPos += tiles[i].length + 1; // +1 for comma
  }

  const tileStart = charPos;
  const tileEnd = charPos + tiles[gridPosition.col].trim().length;

  edit.replace(
    document.uri,
    new vscode.Range(range.start.line, tileStart, range.start.line, tileEnd),
    tileId.toString()
  );

  await vscode.workspace.applyEdit(edit);
}

/**
 * Analyze tile patterns in the map
 */
interface TilePatternAnalysis {
  totalTiles: number;
  tileFrequency: Map<number, number>;
  patterns: TilePattern[];
  clusters: TileCluster[];
}

interface TilePattern {
  name: string;
  locations: { row: number; col: number }[];
  confidence: number;
}

interface TileCluster {
  type: string;
  tiles: { row: number; col: number }[];
  size: number;
}

function analyzeTilePatterns(tiles: number[][]): TilePatternAnalysis {
  const analysis: TilePatternAnalysis = {
    totalTiles: 0,
    tileFrequency: new Map<number, number>(),
    patterns: [] as TilePattern[],
    clusters: [] as TileCluster[],
  };

  // Count tile frequencies
  for (const row of tiles) {
    for (const tile of row) {
      analysis.totalTiles++;
      analysis.tileFrequency.set(tile, (analysis.tileFrequency.get(tile) || 0) + 1);
    }
  }

  // Find patterns (simplified)
  // TODO: Implement more sophisticated pattern detection

  return analysis;
}

/**
 * Generate HTML for pattern analysis
 */
function generateAnalysisHtml(analysis: TilePatternAnalysis): string {
  const sortedTiles = Array.from(analysis.tileFrequency.entries()).sort(
    (a: [number, number], b: [number, number]) => b[1] - a[1]
  );

  let tilesHtml = '';
  for (const [tileId, count] of sortedTiles.slice(0, 10)) {
    const percentage = ((count / analysis.totalTiles) * 100).toFixed(1);
    const tileInfo =
      getTileInfo(tileId) || getEnhancedTileInfo(tileId) || getExtendedTileInfo(tileId);
    const tileName = tileInfo?.name || `Tile ${tileId}`;

    tilesHtml += `
      <tr>
        <td>${tileName}</td>
        <td>${tileId}</td>
        <td>${count}</td>
        <td>${percentage}%</td>
      </tr>
    `;
  }

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
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid var(--vscode-panel-border);
        }
        th {
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <h1>Tile Pattern Analysis</h1>
      <p>Total tiles: ${analysis.totalTiles}</p>
      
      <h2>Most Common Tiles</h2>
      <table>
        <thead>
          <tr>
            <th>Tile Name</th>
            <th>ID</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${tilesHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;
}
