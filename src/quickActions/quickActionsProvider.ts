import * as vscode from 'vscode';
import { DatFileParser } from '../parser/datFileParser';
import { CustomTileSetsManager } from './customTileSets';

export class QuickActionsProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.Refactor,
  ];

  constructor(private readonly tileSetsManager: CustomTileSetsManager) {}

  getTileSetsManager(): CustomTileSetsManager {
    return this.tileSetsManager;
  }

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    _context: vscode.CodeActionContext,
    _token: vscode.CancellationToken
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    // Only provide actions for tiles section
    const parser = new DatFileParser(document.getText());
    const tilesSection = parser.getSection('tiles');
    if (!tilesSection) {
      return actions;
    }

    // Check if we're in the tiles section
    const startLine = document
      .getText()
      .split('\n')
      .findIndex(line => line.trim() === 'tiles{');
    const endLine = document
      .getText()
      .split('\n')
      .findIndex((line, index) => index > startLine && line.trim() === '}');

    if (range.start.line <= startLine || range.start.line >= endLine) {
      return actions;
    }

    // Get the selected text
    const selectedText = document.getText(range);
    const tileMatch = selectedText.match(/\b(\d+)\b/);

    if (tileMatch) {
      const tileId = parseInt(tileMatch[1], 10);

      // Convert to Reinforced action
      if (tileId > 0 && tileId <= 50) {
        const reinforcedAction = new vscode.CodeAction(
          `Convert to Reinforced (${tileId} → ${tileId + 50})`,
          vscode.CodeActionKind.QuickFix
        );
        reinforcedAction.edit = new vscode.WorkspaceEdit();
        reinforcedAction.edit.replace(
          document.uri,
          new vscode.Range(
            range.start.line,
            range.start.character + tileMatch.index!,
            range.start.line,
            range.start.character + tileMatch.index! + tileMatch[0].length
          ),
          String(tileId + 50)
        );
        actions.push(reinforcedAction);
      }

      // Convert from Reinforced action
      if (tileId > 50 && tileId <= 100) {
        const normalAction = new vscode.CodeAction(
          `Convert to Normal (${tileId} → ${tileId - 50})`,
          vscode.CodeActionKind.QuickFix
        );
        normalAction.edit = new vscode.WorkspaceEdit();
        normalAction.edit.replace(
          document.uri,
          new vscode.Range(
            range.start.line,
            range.start.character + tileMatch.index!,
            range.start.line,
            range.start.character + tileMatch.index! + tileMatch[0].length
          ),
          String(tileId - 50)
        );
        actions.push(normalAction);
      }

      // Replace with common tiles
      const commonTiles = [
        { id: 1, name: 'Ground' },
        { id: 6, name: 'Lava' },
        { id: 11, name: 'Water' },
        { id: 26, name: 'Crystal Seam' },
        { id: 34, name: 'Ore Seam' },
        { id: 42, name: 'Recharge Seam' },
        { id: 40, name: 'Solid Rock' },
      ];

      for (const tile of commonTiles) {
        if (tile.id !== tileId) {
          const replaceAction = new vscode.CodeAction(
            `Replace with ${tile.name} (${tile.id})`,
            vscode.CodeActionKind.Refactor
          );
          replaceAction.edit = new vscode.WorkspaceEdit();
          replaceAction.edit.replace(
            document.uri,
            new vscode.Range(
              range.start.line,
              range.start.character + tileMatch.index!,
              range.start.line,
              range.start.character + tileMatch.index! + tileMatch[0].length
            ),
            String(tile.id)
          );
          actions.push(replaceAction);
        }
      }
    }

    // Fill area action (when multiple tiles selected)
    if (range.start.line !== range.end.line || range.start.character !== range.end.character) {
      const fillAction = new vscode.CodeAction(
        'Fill Area with Ground (1)',
        vscode.CodeActionKind.Refactor
      );
      fillAction.command = {
        command: 'manicMiners.fillArea',
        title: 'Fill Area',
        arguments: [document.uri, range, 1],
      };
      actions.push(fillAction);
    }

    // Replace all instances action
    if (tileMatch) {
      const tileId = parseInt(tileMatch[1], 10);
      const replaceAllAction = new vscode.CodeAction(
        `Replace All ${tileId} with...`,
        vscode.CodeActionKind.Refactor
      );
      replaceAllAction.command = {
        command: 'manicMiners.replaceAll',
        title: 'Replace All',
        arguments: [document.uri, tileId],
      };
      actions.push(replaceAllAction);
    }

    // Custom tile set action
    const customTileSetAction = new vscode.CodeAction(
      'Replace with Custom Tile Set...',
      vscode.CodeActionKind.Refactor
    );
    customTileSetAction.command = {
      command: 'manicMiners.replaceWithTileSet',
      title: 'Replace with Tile Set',
      arguments: [document.uri, range],
    };
    actions.push(customTileSetAction);

    return actions;
  }
}

export function registerQuickActionsCommands(
  context: vscode.ExtensionContext,
  tileSetsManager: CustomTileSetsManager
): void {
  // Fill area command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'manicMiners.fillArea',
      async (uri: vscode.Uri, range: vscode.Range, tileId: number) => {
        const document = await vscode.workspace.openTextDocument(uri);
        const edit = new vscode.WorkspaceEdit();

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
            }
          }

          const newLine = newTiles.join(',');
          if (newLine !== lineText) {
            edit.replace(uri, new vscode.Range(line, 0, line, lineText.length), newLine);
          }
        }

        await vscode.workspace.applyEdit(edit);
      }
    )
  );

  // Replace all command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'manicMiners.replaceAll',
      async (uri: vscode.Uri, fromTileId: number) => {
        const toTileId = await vscode.window.showInputBox({
          prompt: `Replace all instances of tile ${fromTileId} with:`,
          placeHolder: 'Enter tile ID (1-115)',
          validateInput: value => {
            const id = parseInt(value, 10);
            if (isNaN(id) || id < 1 || id > 115) {
              return 'Please enter a valid tile ID (1-115)';
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
            edit.replace(uri, new vscode.Range(line, 0, line, lineText.length), newTiles.join(','));
          }
        }

        await vscode.workspace.applyEdit(edit);
        vscode.window.showInformationMessage(
          `Replaced ${replacementCount} instances of tile ${fromTileId} with tile ${newTileId}`
        );
      }
    )
  );

  // Replace with custom tile set command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'manicMiners.replaceWithTileSet',
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
        edit.replace(
          uri,
          new vscode.Range(
            range.start.line,
            range.start.character + tileMatch.index!,
            range.start.line,
            range.start.character + tileMatch.index! + tileMatch[0].length
          ),
          String(selected.id)
        );

        await vscode.workspace.applyEdit(edit);
      }
    )
  );

  // Create tile set from selection command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'manicMiners.createTileSetFromSelection',
      async (tiles: number[]) => {
        await tileSetsManager.createTileSetFromSelection(tiles);
      }
    )
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
