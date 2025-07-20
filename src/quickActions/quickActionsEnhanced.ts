import * as vscode from 'vscode';
import { DatFileParser } from '../parser/datFileParser';
import { CustomTileSetsManager } from './customTileSets';
import { UndoRedoProvider } from '../undoRedo/undoRedoProvider';
import { EditChange } from '../undoRedo/editHistory';

export function registerEnhancedQuickActionsCommands(
  context: vscode.ExtensionContext,
  tileSetsManager: CustomTileSetsManager,
  undoRedoProvider: UndoRedoProvider
): void {
  // Enhanced fill area command with undo support
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'manicMiners.fillAreaEnhanced',
      async (uri: vscode.Uri, range: vscode.Range, tileId: number) => {
        const document = await vscode.workspace.openTextDocument(uri);
        const edit = new vscode.WorkspaceEdit();
        const changes: EditChange[] = [];

        // Parse the tiles section
        const parser = new DatFileParser(document.getText());
        const tilesSection = parser.getSection('tiles');
        if (!tilesSection) {
          return;
        }

        // Get line offsets for tiles section
        const lines = document.getText().split('\n');
        const tilesStartLine = lines.findIndex(line => line.trim() === 'tiles{');
        if (tilesStartLine === -1) {
          return;
        }

        let tilesModified = 0;

        // Process each line in the range
        for (let line = range.start.line; line <= range.end.line; line++) {
          const lineText = document.lineAt(line).text;
          const tiles = lineText.split(',').map(t => t.trim());

          // Determine which tiles to replace
          let startCol = 0;
          let endCol = tiles.length;

          if (line === range.start.line || line === range.end.line) {
            // For first and last lines, calculate column indices
            let charCount = 0;
            for (let i = 0; i < tiles.length; i++) {
              if (line === range.start.line && charCount < range.start.character) {
                startCol = i;
              }
              if (line === range.end.line && charCount <= range.end.character) {
                endCol = i + 1;
              }
              charCount += tiles[i].length + 1; // +1 for comma
            }
          }

          // Build the new line
          const newTiles = [...tiles];
          for (let i = startCol; i < endCol && i < tiles.length; i++) {
            if (tiles[i] && tiles[i] !== '' && !isNaN(parseInt(tiles[i], 10))) {
              newTiles[i] = String(tileId);
              tilesModified++;
            }
          }

          const newLine = newTiles.join(',');
          if (newLine !== lineText) {
            const lineRange = new vscode.Range(line, 0, line, lineText.length);
            edit.replace(uri, lineRange, newLine);

            // Record change for undo
            changes.push({
              range: lineRange,
              oldText: lineText,
              newText: newLine,
            });
          }
        }

        if (changes.length > 0) {
          const success = await vscode.workspace.applyEdit(edit);
          if (success) {
            // Record in undo history
            undoRedoProvider.recordEdit(
              uri,
              `Fill area with tile ${tileId} (${tilesModified} tiles)`,
              changes
            );

            vscode.window.showInformationMessage(
              `Filled ${tilesModified} tiles with tile ID ${tileId}`
            );
          }
        }
      }
    )
  );

  // Enhanced replace all command with undo support
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'manicMiners.replaceAllEnhanced',
      async (uri: vscode.Uri, fromTileId: number) => {
        const toTileId = await vscode.window.showInputBox({
          prompt: `Replace all instances of tile ${fromTileId} with:`,
          placeHolder: 'Enter tile ID (1-299)',
          validateInput: value => {
            const id = parseInt(value, 10);
            if (isNaN(id) || id < 1 || id > 299) {
              return 'Please enter a valid tile ID (1-299)';
            }
            return null;
          },
        });

        if (!toTileId) {
          return;
        }

        const newTileId = parseInt(toTileId, 10);
        const document = await vscode.workspace.openTextDocument(uri);
        const edit = new vscode.WorkspaceEdit();
        const changes: EditChange[] = [];

        // Parse the tiles section
        const parser = new DatFileParser(document.getText());
        const tilesSection = parser.getSection('tiles');
        if (!tilesSection) {
          return;
        }

        // Get line offsets for tiles section
        const lines = document.getText().split('\n');
        const tilesStartLine = lines.findIndex(line => line.trim() === 'tiles{');
        const tilesEndLine = lines.findIndex(
          (line, index) => index > tilesStartLine && line.trim() === '}'
        );

        if (tilesStartLine === -1 || tilesEndLine === -1) {
          return;
        }

        let replacementCount = 0;

        // Process each line in the tiles section
        for (let line = tilesStartLine + 1; line < tilesEndLine; line++) {
          const lineText = document.lineAt(line).text;
          const tiles = lineText.split(',');
          let modified = false;

          const newTiles = tiles.map(tile => {
            const trimmed = tile.trim();
            if (trimmed === String(fromTileId)) {
              modified = true;
              replacementCount++;
              return tile.replace(trimmed, String(newTileId));
            }
            return tile;
          });

          if (modified) {
            const newLine = newTiles.join(',');
            const lineRange = new vscode.Range(line, 0, line, lineText.length);
            edit.replace(uri, lineRange, newLine);

            // Record change for undo
            changes.push({
              range: lineRange,
              oldText: lineText,
              newText: newLine,
            });
          }
        }

        if (changes.length > 0) {
          const success = await vscode.workspace.applyEdit(edit);
          if (success) {
            // Record in undo history
            undoRedoProvider.recordEdit(
              uri,
              `Replace all tile ${fromTileId} with ${newTileId} (${replacementCount} instances)`,
              changes
            );

            vscode.window.showInformationMessage(
              `Replaced ${replacementCount} instances of tile ${fromTileId} with tile ${newTileId}`
            );
          }
        } else {
          vscode.window.showInformationMessage(`No instances of tile ${fromTileId} found`);
        }
      }
    )
  );

  // Enhanced replace with tile set command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'manicMiners.replaceWithTileSetEnhanced',
      async (uri: vscode.Uri, range: vscode.Range) => {
        const tileSet = await tileSetsManager.showTileSetPicker();
        if (!tileSet || tileSet.tiles.length === 0) {
          return;
        }

        const document = await vscode.workspace.openTextDocument(uri);
        const selectedText = document.getText(range);
        const tileMatch = selectedText.match(/\b(\d+)\b/);

        if (!tileMatch) {
          vscode.window.showErrorMessage('No tile ID found at cursor position');
          return;
        }

        const currentTileId = parseInt(tileMatch[1], 10);

        // Show picker for which tile from the set to use
        const items = tileSet.tiles.map(id => ({
          label: `Tile ${id}`,
          description: getTileName(id),
          id,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: `Replace tile ${currentTileId} with:`,
        });

        if (!selected) {
          return;
        }

        const edit = new vscode.WorkspaceEdit();
        const replaceRange = new vscode.Range(
          range.start.line,
          range.start.character + tileMatch.index!,
          range.start.line,
          range.start.character + tileMatch.index! + tileMatch[0].length
        );

        const oldText = document.getText(replaceRange);
        const newText = String(selected.id);

        edit.replace(uri, replaceRange, newText);

        const success = await vscode.workspace.applyEdit(edit);
        if (success) {
          // Record in undo history
          undoRedoProvider.recordEdit(
            uri,
            `Replace tile ${currentTileId} with ${selected.id} from ${tileSet.name}`,
            [
              {
                range: replaceRange,
                oldText,
                newText,
              },
            ]
          );
        }
      }
    )
  );

  // Undo command
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.undo', async () => {
      await undoRedoProvider.undoWithPreview();
    })
  );

  // Redo command
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.redo', async () => {
      await undoRedoProvider.redoWithPreview();
    })
  );

  // Show history command
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.showUndoRedoHistory', async () => {
      await undoRedoProvider.showHistoryPanel();
    })
  );

  // Clear history command
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.clearEditHistory', async () => {
      const result = await vscode.window.showWarningMessage(
        'Clear all edit history for the current file?',
        { modal: true },
        'Clear',
        'Cancel'
      );

      if (result === 'Clear') {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          undoRedoProvider.clearHistory(editor.document.uri);
          vscode.window.showInformationMessage('Edit history cleared');
        }
      }
    })
  );
}

function getTileName(tileId: number): string {
  const tileNames: { [key: number]: string } = {
    1: 'Ground',
    6: 'Lava',
    11: 'Water',
    26: 'Dirt',
    30: 'Loose Rock',
    34: 'Hard Rock',
    38: 'Solid Rock',
    40: 'Solid Rock',
    42: 'Crystal Seam',
    46: 'Ore Seam',
    50: 'Recharge Seam',
  };

  if (tileId >= 51 && tileId <= 100) {
    const baseId = tileId - 50;
    const baseName = tileNames[baseId] || `Tile ${baseId}`;
    return `Reinforced ${baseName}`;
  }

  return tileNames[tileId] || `Tile ${tileId}`;
}
