import * as vscode from 'vscode';
import { MapValidator } from './mapValidator';

export class MapDiagnosticProvider {
  private static readonly diagnosticCollection =
    vscode.languages.createDiagnosticCollection('manicMiners');
  private static debounceTimer: NodeJS.Timeout | undefined;

  public static register(context: vscode.ExtensionContext): void {
    // Register for active editor changes
    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && editor.document.languageId === 'manicminers') {
          this.validateDocument(editor.document);
        }
      })
    );

    // Register for document changes
    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId === 'manicminers') {
          this.validateDocumentDebounced(event.document);
        }
      })
    );

    // Register for document close
    context.subscriptions.push(
      vscode.workspace.onDidCloseTextDocument(document => {
        this.diagnosticCollection.delete(document.uri);
      })
    );

    // Validate current document if applicable
    if (vscode.window.activeTextEditor?.document.languageId === 'manicminers') {
      this.validateDocument(vscode.window.activeTextEditor.document);
    }

    context.subscriptions.push(this.diagnosticCollection);
  }

  private static validateDocumentDebounced(document: vscode.TextDocument): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.validateDocument(document);
    }, 500);
  }

  private static async validateDocument(document: vscode.TextDocument): Promise<void> {
    const validator = new MapValidator(document);
    const results = await validator.validate();

    const diagnostics: vscode.Diagnostic[] = [];

    // Convert errors to diagnostics
    for (const error of results.errors) {
      const diagnostic = this.createDiagnostic(document, error);
      if (diagnostic) {
        diagnostics.push(diagnostic);
      }
    }

    // Convert warnings to diagnostics
    for (const warning of results.warnings) {
      const diagnostic = this.createDiagnostic(document, warning);
      if (diagnostic) {
        diagnostics.push(diagnostic);
      }
    }

    // Set diagnostics
    this.diagnosticCollection.set(document.uri, diagnostics);

    // Show info messages in status bar
    if (results.info.length > 0) {
      const infoMessage = results.info.map(i => i.message).join(' | ');
      vscode.window.setStatusBarMessage(infoMessage, 5000);
    }
  }

  private static createDiagnostic(
    document: vscode.TextDocument,
    issue: { message: string; line?: number; column?: number; severity: vscode.DiagnosticSeverity }
  ): vscode.Diagnostic | undefined {
    let range: vscode.Range;

    if (issue.line !== undefined && issue.column !== undefined) {
      // Find the actual line in the tiles section
      const lines = document.getText().split('\n');
      const tilesStartIndex = lines.findIndex(line => line.trim() === 'tiles{');

      if (tilesStartIndex !== -1) {
        const actualLine = tilesStartIndex + 1 + issue.line;

        if (actualLine < lines.length) {
          const lineText = lines[actualLine];
          const tiles = lineText.split(',');

          // Calculate character position for the column
          let charPos = 0;
          for (let i = 0; i < issue.column && i < tiles.length; i++) {
            charPos += tiles[i].length + 1; // +1 for comma
          }

          const start = new vscode.Position(actualLine, charPos);
          const end = new vscode.Position(actualLine, charPos + (tiles[issue.column]?.length || 1));
          range = new vscode.Range(start, end);
        } else {
          return undefined;
        }
      } else {
        return undefined;
      }
    } else {
      // Default to first line if no specific location
      range = new vscode.Range(0, 0, 0, 0);
    }

    const diagnostic = new vscode.Diagnostic(range, issue.message, issue.severity);
    diagnostic.source = 'Manic Miners Validator';

    // Add code actions hints
    if (issue.message.includes('Invalid tile ID')) {
      diagnostic.code = 'invalid-tile-id';
    } else if (issue.message.includes('unreachable')) {
      diagnostic.code = 'unreachable-resource';
    } else if (issue.message.includes('reinforced walls')) {
      diagnostic.code = 'blocked-resource';
    }

    return diagnostic;
  }
}
