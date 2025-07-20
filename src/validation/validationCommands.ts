import * as vscode from 'vscode';
import {
  MapValidator,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationInfo,
} from './mapValidator';

export function registerValidationCommands(context: vscode.ExtensionContext): void {
  // Run full validation command
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.runValidation', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'manicminers') {
        vscode.window.showErrorMessage('Please open a Manic Miners DAT file');
        return;
      }

      await runFullValidation(editor.document);
    })
  );

  // Fix common issues command
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.fixCommonIssues', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'manicminers') {
        vscode.window.showErrorMessage('Please open a Manic Miners DAT file');
        return;
      }

      await fixCommonIssues(editor);
    })
  );

  // Show validation report command
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.showValidationReport', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'manicminers') {
        vscode.window.showErrorMessage('Please open a Manic Miners DAT file');
        return;
      }

      await showValidationReport(editor.document, context);
    })
  );
}

async function runFullValidation(document: vscode.TextDocument): Promise<void> {
  const validator = new MapValidator(document);

  // Show progress
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Running map validation...',
      cancellable: false,
    },
    async progress => {
      progress.report({ increment: 0, message: 'Validating structure...' });

      const results = await validator.validate();

      progress.report({ increment: 100, message: 'Complete!' });

      // Show results
      if (results.isValid && results.warnings.length === 0) {
        vscode.window.showInformationMessage('✅ Map validation passed! No issues found.');
      } else if (results.isValid) {
        const action = await vscode.window.showWarningMessage(
          `⚠️ Map has ${results.warnings.length} warning(s) but is playable.`,
          'Show Details',
          'Ignore'
        );

        if (action === 'Show Details') {
          await vscode.commands.executeCommand('manicMiners.showValidationReport');
        }
      } else {
        const action = await vscode.window.showErrorMessage(
          `❌ Map has ${results.errors.length} error(s) and may not be playable.`,
          'Show Details',
          'Fix Issues'
        );

        if (action === 'Show Details') {
          await vscode.commands.executeCommand('manicMiners.showValidationReport');
        } else if (action === 'Fix Issues') {
          await vscode.commands.executeCommand('manicMiners.fixCommonIssues');
        }
      }
    }
  );
}

async function fixCommonIssues(editor: vscode.TextEditor): Promise<void> {
  const validator = new MapValidator(editor.document);
  const results = await validator.validate();

  const fixes: string[] = [];
  const edit = new vscode.WorkspaceEdit();

  // Fix invalid tile IDs
  for (const error of results.errors) {
    if (
      error.message.includes('Invalid tile ID') &&
      error.line !== undefined &&
      error.column !== undefined
    ) {
      // Replace with ground tile (1)
      const lines = editor.document.getText().split('\n');
      const tilesStartIndex = lines.findIndex(line => line.trim() === 'tiles{');

      if (tilesStartIndex !== -1) {
        const actualLine = tilesStartIndex + 1 + error.line;
        const lineText = lines[actualLine];
        const tiles = lineText.split(',');

        tiles[error.column] = '1';
        const newLine = tiles.join(',');

        edit.replace(
          editor.document.uri,
          new vscode.Range(actualLine, 0, actualLine, lineText.length),
          newLine
        );

        fixes.push(`Fixed invalid tile at [${error.line}, ${error.column}]`);
      }
    }
  }

  if (fixes.length > 0) {
    await vscode.workspace.applyEdit(edit);
    vscode.window.showInformationMessage(`Fixed ${fixes.length} issue(s): ${fixes.join(', ')}`);
  } else {
    vscode.window.showInformationMessage('No automatic fixes available for current issues.');
  }
}

async function showValidationReport(
  document: vscode.TextDocument,
  context: vscode.ExtensionContext
): Promise<void> {
  const validator = new MapValidator(document);
  const results = await validator.validate();

  // Create webview panel
  const panel = vscode.window.createWebviewPanel(
    'validationReport',
    'Map Validation Report',
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  // Generate HTML report
  const html = generateValidationReportHtml(results, panel.webview, context);
  panel.webview.html = html;
}

function generateValidationReportHtml(
  results: ValidationResult,
  webview: vscode.Webview,
  context: vscode.ExtensionContext
): string {
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'media', 'validationReport.css')
  );

  const errorsHtml = results.errors
    .map(
      (e: ValidationError) => `
    <div class="issue error">
      <span class="icon">❌</span>
      <span class="message">${e.message}</span>
      ${e.line !== undefined ? `<span class="location">[${e.line}, ${e.column}]</span>` : ''}
    </div>
  `
    )
    .join('');

  const warningsHtml = results.warnings
    .map(
      (w: ValidationWarning) => `
    <div class="issue warning">
      <span class="icon">⚠️</span>
      <span class="message">${w.message}</span>
      ${w.line !== undefined ? `<span class="location">[${w.line}, ${w.column}]</span>` : ''}
    </div>
  `
    )
    .join('');

  const infoHtml = results.info
    .map(
      (i: ValidationInfo) => `
    <div class="issue info">
      <span class="icon">ℹ️</span>
      <span class="message">${i.message}</span>
    </div>
  `
    )
    .join('');

  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${styleUri}" rel="stylesheet">
      <title>Map Validation Report</title>
      <style>
        body {
          font-family: var(--vscode-font-family);
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
          padding: 20px;
          line-height: 1.6;
        }
        h1, h2 {
          color: var(--vscode-foreground);
        }
        .summary {
          background-color: var(--vscode-editor-inactiveSelectionBackground);
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .section {
          margin-bottom: 30px;
        }
        .issue {
          display: flex;
          align-items: center;
          padding: 8px;
          margin: 5px 0;
          border-radius: 3px;
        }
        .issue.error {
          background-color: rgba(255, 0, 0, 0.1);
          border-left: 3px solid #ff0000;
        }
        .issue.warning {
          background-color: rgba(255, 165, 0, 0.1);
          border-left: 3px solid #ffa500;
        }
        .issue.info {
          background-color: rgba(0, 123, 255, 0.1);
          border-left: 3px solid #007bff;
        }
        .icon {
          margin-right: 10px;
          font-size: 18px;
        }
        .message {
          flex: 1;
        }
        .location {
          color: var(--vscode-descriptionForeground);
          font-size: 0.9em;
          margin-left: 10px;
        }
        .status {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .status.valid {
          color: #4caf50;
        }
        .status.invalid {
          color: #f44336;
        }
      </style>
    </head>
    <body>
      <h1>Map Validation Report</h1>
      
      <div class="summary">
        <div class="status ${results.isValid ? 'valid' : 'invalid'}">
          ${results.isValid ? '✅ Map is Valid' : '❌ Map has Errors'}
        </div>
        <div>
          <strong>Errors:</strong> ${results.errors.length} |
          <strong>Warnings:</strong> ${results.warnings.length} |
          <strong>Info:</strong> ${results.info.length}
        </div>
      </div>

      ${
        results.errors.length > 0
          ? `
        <div class="section">
          <h2>Errors (${results.errors.length})</h2>
          ${errorsHtml}
        </div>
      `
          : ''
      }

      ${
        results.warnings.length > 0
          ? `
        <div class="section">
          <h2>Warnings (${results.warnings.length})</h2>
          ${warningsHtml}
        </div>
      `
          : ''
      }

      ${
        results.info.length > 0
          ? `
        <div class="section">
          <h2>Information (${results.info.length})</h2>
          ${infoHtml}
        </div>
      `
          : ''
      }

      ${
        results.isValid && results.errors.length === 0 && results.warnings.length === 0
          ? `
        <div class="section">
          <p>🎉 Congratulations! Your map passed all validation checks.</p>
        </div>
      `
          : ''
      }
    </body>
    </html>`;
}
