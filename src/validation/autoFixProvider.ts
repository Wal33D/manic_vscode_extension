import * as vscode from 'vscode';
import { MapValidator, ValidationError } from './mapValidator';
import { DatFileParser } from '../parser/datFileParser';
import { getEnhancedTileInfo } from '../data/enhancedTileDefinitions';
import { getTileInfo } from '../data/tileDefinitions';
import { getExtendedTileInfo } from '../data/extendedTileDefinitions';

export class AutoFixProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  public async provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    _context: vscode.CodeActionContext,
    _token: vscode.CancellationToken
  ): Promise<vscode.CodeAction[]> {
    const actions: vscode.CodeAction[] = [];

    // Get validation errors for the current line
    const validator = new MapValidator(document);
    const results = await validator.validate();

    // Filter errors that are on or near the current line
    const relevantErrors = results.errors.filter(error => {
      if (error.line === undefined) {
        return false;
      }

      // For now, just check if the error is near the current line
      // This is a simplified check - in a real implementation we'd need
      // to map section-relative lines to document lines
      return true; // Return all errors for now
    });

    // Create code actions for each error
    for (const error of relevantErrors) {
      const fixes = this.getFixesForError(document, error);
      actions.push(...fixes);
    }

    // Add context-aware quick fixes
    const contextFixes = this.getContextualFixes(document, range);
    actions.push(...contextFixes);

    return actions;
  }

  private getFixesForError(
    document: vscode.TextDocument,
    error: ValidationError
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    // Invalid tile ID fixes
    if (error.message.includes('Invalid tile ID') || error.message.includes('Unknown tile ID')) {
      actions.push(this.createReplaceTileAction(document, error, 1, 'Replace with ground tile'));
      actions.push(this.createReplaceTileAction(document, error, 38, 'Replace with solid rock'));
      actions.push(this.createReplaceTileAction(document, error, 26, 'Replace with dirt wall'));
      actions.push(this.createRemoveTileAction(document, error));
    }

    // Missing Tool Store fix
    if (error.message.includes('Level must have at least one Tool Store')) {
      actions.push(this.createAddToolStoreAction(document));
    }

    // Missing buildable ground fix
    if (error.message.includes('Level must have at least one buildable ground tile')) {
      actions.push(this.createAddGroundTilesAction(document));
    }

    // Resource objective exceeds available resources
    if (error.message.includes('objective') && error.message.includes('exceed')) {
      actions.push(this.createAdjustObjectiveAction(document, error));
    }

    // Invalid coordinates
    if (error.message.includes('invalid coordinates')) {
      actions.push(this.createFixCoordinatesAction(document, error));
    }

    // Negative values
    if (error.message.includes('cannot be negative') || error.message.includes('Negative')) {
      actions.push(this.createFixNegativeValueAction(document, error));
    }

    // Grid dimension mismatch
    if (error.message.includes('rows, expected') || error.message.includes('columns, expected')) {
      actions.push(this.createFixGridDimensionsAction(document, error));
    }

    return actions;
  }

  private getContextualFixes(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    const line = document.lineAt(range.start.line);
    const text = line.text;

    // Tile ID on current line
    const tileMatch = text.match(/\b(\d+)\b/g);
    if (tileMatch) {
      for (const match of tileMatch) {
        const tileId = parseInt(match);
        const tileInfo =
          getEnhancedTileInfo(tileId) || getTileInfo(tileId) || getExtendedTileInfo(tileId);

        if (!tileInfo) {
          // Unknown tile - offer replacements
          const startPos = text.indexOf(match);
          const endPos = startPos + match.length;
          const tileRange = new vscode.Range(range.start.line, startPos, range.start.line, endPos);

          actions.push(
            this.createQuickReplaceTileAction(document, tileRange, 1, 'Replace with ground (1)')
          );
          actions.push(
            this.createQuickReplaceTileAction(
              document,
              tileRange,
              26,
              'Replace with dirt wall (26)'
            )
          );
          actions.push(
            this.createQuickReplaceTileAction(
              document,
              tileRange,
              42,
              'Replace with crystal seam (42)'
            )
          );
        } else if (tileInfo.category === 'wall' && tileId >= 26 && tileId <= 41) {
          // Offer to convert to reinforced version
          const reinforcedId = tileId + 50;
          const startPos = text.indexOf(match);
          const endPos = startPos + match.length;
          const tileRange = new vscode.Range(range.start.line, startPos, range.start.line, endPos);

          actions.push(
            this.createQuickReplaceTileAction(
              document,
              tileRange,
              reinforcedId,
              `Convert to reinforced (${reinforcedId})`
            )
          );
        }
      }
    }

    // Missing semicolon in info section
    if (text.includes(':') && !text.includes(':') && !text.includes('{') && !text.includes('}')) {
      const parser = new DatFileParser(document.getText());
      const section = parser.getSectionAtPosition(range.start.line);
      if (section?.name === 'info') {
        actions.push(this.createAddSemicolonAction(document, range.start.line));
      }
    }

    return actions;
  }

  private createReplaceTileAction(
    document: vscode.TextDocument,
    error: ValidationError,
    replacementId: number,
    title: string
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
    action.edit = new vscode.WorkspaceEdit();

    if (error.line !== undefined && error.column !== undefined && error.section) {
      const sectionStart = this.getSectionStartLine(document, error.section);
      const actualLine = sectionStart + error.line + 1;
      const lineText = document.lineAt(actualLine).text;
      const tiles = lineText.split(',');

      tiles[error.column] = replacementId.toString();
      const newLine = tiles.join(',');

      action.edit.replace(
        document.uri,
        new vscode.Range(actualLine, 0, actualLine, lineText.length),
        newLine
      );
    }

    action.diagnostics = [];
    action.isPreferred = replacementId === 1; // Prefer ground tile
    return action;
  }

  private createQuickReplaceTileAction(
    document: vscode.TextDocument,
    range: vscode.Range,
    replacementId: number,
    title: string
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
    action.edit = new vscode.WorkspaceEdit();
    action.edit.replace(document.uri, range, replacementId.toString());
    return action;
  }

  private createRemoveTileAction(
    document: vscode.TextDocument,
    error: ValidationError
  ): vscode.CodeAction {
    const action = new vscode.CodeAction('Remove invalid tile', vscode.CodeActionKind.QuickFix);
    action.edit = new vscode.WorkspaceEdit();

    if (error.line !== undefined && error.column !== undefined && error.section) {
      const sectionStart = this.getSectionStartLine(document, error.section);
      const actualLine = sectionStart + error.line + 1;
      const lineText = document.lineAt(actualLine).text;
      const tiles = lineText.split(',');

      tiles.splice(error.column, 1);
      const newLine = tiles.join(',');

      action.edit.replace(
        document.uri,
        new vscode.Range(actualLine, 0, actualLine, lineText.length),
        newLine
      );
    }

    return action;
  }

  private createAddToolStoreAction(document: vscode.TextDocument): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Add Tool Store to buildings',
      vscode.CodeActionKind.QuickFix
    );
    action.edit = new vscode.WorkspaceEdit();

    // Find or create buildings section
    const text = document.getText();
    const buildingsMatch = text.match(/buildings\s*\{([^}]*)\}/s);

    if (buildingsMatch) {
      // Add to existing buildings section
      const buildingsStart = text.indexOf(buildingsMatch[0]);
      const insertPos = buildingsStart + buildingsMatch[0].indexOf('{') + 1;
      const position = document.positionAt(insertPos);

      const toolStoreEntry = `
  type: BuildingToolStore_C
  ID: ToolStore01
  essential: true
  coordinates{
    Translation: X=2250.0 Y=2250.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
  }
  Level: 0
  Teleport: 1
  HP: MAX
`;

      action.edit.insert(document.uri, position, toolStoreEntry);
    } else {
      // Create new buildings section
      const infoEnd = text.indexOf('}', text.indexOf('info{'));
      if (infoEnd !== -1) {
        const position = document.positionAt(infoEnd + 1);

        const buildingsSection = `

buildings{
  type: BuildingToolStore_C
  ID: ToolStore01
  essential: true
  coordinates{
    Translation: X=2250.0 Y=2250.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
  }
  Level: 0
  Teleport: 1
  HP: MAX
}`;

        action.edit.insert(document.uri, position, buildingsSection);
      }
    }

    action.isPreferred = true;
    return action;
  }

  private createAddGroundTilesAction(document: vscode.TextDocument): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Replace center tiles with ground',
      vscode.CodeActionKind.QuickFix
    );
    action.edit = new vscode.WorkspaceEdit();

    const parser = new DatFileParser(document.getText());
    const tilesSection = parser.getSection('tiles');

    if (tilesSection) {
      const lines = document.getText().split('\n');
      const tilesStart = lines.findIndex(line => line.trim() === 'tiles{');

      if (tilesStart !== -1) {
        // Find center area and replace with ground tiles
        const tilesEndIndex = lines.findIndex(
          (line, idx) => idx > tilesStart && line.trim() === '}'
        );
        const tilesLines = lines.slice(tilesStart + 1, tilesEndIndex);

        const numRows = tilesLines.length;
        const centerRow = Math.floor(numRows / 2);
        const startRow = Math.max(0, centerRow - 2);
        const endRow = Math.min(numRows - 1, centerRow + 2);

        for (let row = startRow; row <= endRow; row++) {
          const actualLine = tilesStart + 1 + row;
          const lineText = lines[actualLine];
          const tiles = lineText.split(',');

          const numCols = tiles.length;
          const centerCol = Math.floor(numCols / 2);
          const startCol = Math.max(0, centerCol - 2);
          const endCol = Math.min(numCols - 1, centerCol + 2);

          for (let col = startCol; col <= endCol; col++) {
            tiles[col] = '1'; // Ground tile
          }

          const newLine = tiles.join(',');
          action.edit.replace(
            document.uri,
            new vscode.Range(actualLine, 0, actualLine, lineText.length),
            newLine
          );
        }
      }
    }

    return action;
  }

  private createAdjustObjectiveAction(
    document: vscode.TextDocument,
    error: ValidationError
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Adjust objective to match available resources',
      vscode.CodeActionKind.QuickFix
    );
    action.edit = new vscode.WorkspaceEdit();

    // Extract numbers from error message
    const match = error.message.match(/\((\d+)\).*\((\d+)\)/);
    if (match) {
      const required = parseInt(match[1]);
      const available = parseInt(match[2]);

      // Find the objective line
      const objectivesStart = this.getSectionStartLine(document, 'objectives');
      if (objectivesStart !== -1 && error.line !== undefined) {
        const actualLine = objectivesStart + error.line + 1;
        const lineText = document.lineAt(actualLine).text;

        // Replace the number
        const newLine = lineText.replace(required.toString(), available.toString());

        action.edit.replace(
          document.uri,
          new vscode.Range(actualLine, 0, actualLine, lineText.length),
          newLine
        );
      }
    }

    return action;
  }

  private createFixCoordinatesAction(
    document: vscode.TextDocument,
    error: ValidationError
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Fix coordinates to be within map bounds',
      vscode.CodeActionKind.QuickFix
    );
    action.edit = new vscode.WorkspaceEdit();

    // Get map dimensions from info section
    const parser = new DatFileParser(document.getText());
    const infoSection = parser.getSection('info');
    if (infoSection && infoSection.content) {
      const rowMatch = infoSection.content.match(/rowcount:\s*(\d+)/);
      const colMatch = infoSection.content.match(/colcount:\s*(\d+)/);

      if (rowMatch && colMatch) {
        const maxRow = parseInt(rowMatch[1]) - 1;
        const maxCol = parseInt(colMatch[1]) - 1;

        if (error.line !== undefined && error.section) {
          const sectionStart = this.getSectionStartLine(document, error.section);
          const actualLine = sectionStart + error.line + 1;
          const lineText = document.lineAt(actualLine).text;

          // Fix coordinates in the line
          let newLine = lineText;
          const coordMatch = lineText.match(/(\d+),(\d+)/g);
          if (coordMatch) {
            for (const coord of coordMatch) {
              const [x, y] = coord.split(',').map(n => parseInt(n));
              const newX = Math.min(Math.max(0, x), maxCol);
              const newY = Math.min(Math.max(0, y), maxRow);
              newLine = newLine.replace(coord, `${newX},${newY}`);
            }
          }

          action.edit.replace(
            document.uri,
            new vscode.Range(actualLine, 0, actualLine, lineText.length),
            newLine
          );
        }
      }
    }

    return action;
  }

  private createFixNegativeValueAction(
    document: vscode.TextDocument,
    error: ValidationError
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Replace negative value with 0',
      vscode.CodeActionKind.QuickFix
    );
    action.edit = new vscode.WorkspaceEdit();

    if (error.line !== undefined && error.section) {
      const sectionStart = this.getSectionStartLine(document, error.section);
      const actualLine = sectionStart + error.line + 1;
      const lineText = document.lineAt(actualLine).text;

      // Replace negative numbers with 0
      const newLine = lineText.replace(/-\d+(\.\d+)?/g, '0');

      action.edit.replace(
        document.uri,
        new vscode.Range(actualLine, 0, actualLine, lineText.length),
        newLine
      );
    }

    return action;
  }

  private createFixGridDimensionsAction(
    document: vscode.TextDocument,
    error: ValidationError
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Add/remove tiles to match dimensions',
      vscode.CodeActionKind.QuickFix
    );
    action.edit = new vscode.WorkspaceEdit();

    // Extract expected dimensions from error
    const match = error.message.match(/expected (\d+)/);
    if (match && error.section && error.line !== undefined) {
      const expected = parseInt(match[1]);
      const sectionStart = this.getSectionStartLine(document, error.section);
      const actualLine = sectionStart + error.line + 1;
      const lineText = document.lineAt(actualLine).text;
      const tiles = lineText.split(',');

      if (tiles.length < expected) {
        // Add tiles
        while (tiles.length < expected) {
          tiles.push('1'); // Add ground tiles
        }
      } else if (tiles.length > expected) {
        // Remove tiles
        tiles.length = expected;
      }

      const newLine = tiles.join(',');
      action.edit.replace(
        document.uri,
        new vscode.Range(actualLine, 0, actualLine, lineText.length),
        newLine
      );
    }

    return action;
  }

  private createAddSemicolonAction(document: vscode.TextDocument, line: number): vscode.CodeAction {
    const action = new vscode.CodeAction('Add missing semicolon', vscode.CodeActionKind.QuickFix);
    action.edit = new vscode.WorkspaceEdit();

    const lineText = document.lineAt(line).text;
    const trimmed = lineText.trimEnd();
    if (!trimmed.endsWith(';')) {
      action.edit.replace(
        document.uri,
        new vscode.Range(line, 0, line, lineText.length),
        trimmed + ';'
      );
    }

    return action;
  }

  private getSectionStartLine(document: vscode.TextDocument, sectionName: string): number {
    const lines = document.getText().split('\n');
    return lines.findIndex(line => line.trim() === `${sectionName}{`);
  }
}
