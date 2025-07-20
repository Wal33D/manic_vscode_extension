import * as vscode from 'vscode';
import {
  MapValidator,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationInfo,
} from './mapValidator';
import { DatFileParser } from '../parser/datFileParser';

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

  // Show quick pick for fix options
  const fixOptions: vscode.QuickPickItem[] = [];
  const fixMap = new Map<string, () => Promise<void>>();

  // Group errors by type
  const tileErrors = results.errors.filter(e => e.message.includes('tile'));
  const missingToolStore = results.errors.some(e => e.message.includes('Tool Store'));
  const missingGround = results.errors.some(e => e.message.includes('buildable ground'));
  const resourceErrors = results.errors.filter(
    e => e.message.includes('objective') && e.message.includes('exceed')
  );
  const negativeErrors = results.errors.filter(e => e.message.includes('negative'));
  const dimensionErrors = results.errors.filter(
    e =>
      e.message.includes('expected') &&
      (e.message.includes('rows') || e.message.includes('columns'))
  );

  if (tileErrors.length > 0) {
    const option = {
      label: '$(symbol-misc) Fix Invalid Tiles',
      description: `Replace ${tileErrors.length} invalid tile(s) with ground tiles`,
      detail: 'Replaces unknown or invalid tile IDs with tile ID 1 (ground)',
    };
    fixOptions.push(option);
    fixMap.set(option.label, async () => await fixInvalidTiles(editor, tileErrors));
  }

  if (missingToolStore) {
    const option = {
      label: '$(home) Add Tool Store',
      description: 'Add a Tool Store to the buildings section',
      detail: 'Tool Store is required for most levels to function properly',
    };
    fixOptions.push(option);
    fixMap.set(option.label, async () => await addToolStore(editor));
  }

  if (missingGround) {
    const option = {
      label: '$(symbol-namespace) Add Ground Tiles',
      description: 'Replace center area with buildable ground',
      detail: 'Adds a 5x5 area of ground tiles in the map center',
    };
    fixOptions.push(option);
    fixMap.set(option.label, async () => await addGroundTiles(editor));
  }

  if (resourceErrors.length > 0) {
    const option = {
      label: '$(target) Adjust Objectives',
      description: `Fix ${resourceErrors.length} objective(s) to match available resources`,
      detail: "Reduces resource requirements to match what's available in the map",
    };
    fixOptions.push(option);
    fixMap.set(option.label, async () => await adjustObjectives(editor, resourceErrors));
  }

  if (negativeErrors.length > 0) {
    const option = {
      label: '$(dashboard) Fix Negative Values',
      description: `Replace ${negativeErrors.length} negative value(s) with 0`,
      detail: 'Negative values are not allowed in most fields',
    };
    fixOptions.push(option);
    fixMap.set(option.label, async () => await fixNegativeValues(editor, negativeErrors));
  }

  if (dimensionErrors.length > 0) {
    const option = {
      label: '$(table) Fix Grid Dimensions',
      description: `Adjust ${dimensionErrors.length} row(s) to match expected dimensions`,
      detail: 'Adds or removes tiles to match rowcount/colcount',
    };
    fixOptions.push(option);
    fixMap.set(option.label, async () => await fixGridDimensions(editor, dimensionErrors));
  }

  if (fixOptions.length > 0) {
    fixOptions.push({
      label: '$(check-all) Fix All Issues',
      description: 'Apply all available fixes',
      detail: 'Automatically fixes all issues that have available solutions',
    });

    const selected = await vscode.window.showQuickPick(fixOptions, {
      placeHolder: 'Select issues to fix',
      canPickMany: false,
    });

    if (selected) {
      if (selected.label === '$(check-all) Fix All Issues') {
        // Run all fixes
        let totalFixes = 0;
        for (const [label, fix] of fixMap.entries()) {
          if (label !== '$(check-all) Fix All Issues') {
            await fix();
            totalFixes++;
          }
        }
        vscode.window.showInformationMessage(`Applied ${totalFixes} fix categories`);
      } else {
        // Run selected fix
        const fix = fixMap.get(selected.label);
        if (fix) {
          await fix();
        }
      }
    }
  } else {
    vscode.window.showInformationMessage('No automatic fixes available for current issues.');
  }
}

// Helper functions for specific fixes
async function fixInvalidTiles(editor: vscode.TextEditor, errors: any[]): Promise<void> {
  const edit = new vscode.WorkspaceEdit();
  const fixes: string[] = [];

  for (const error of errors) {
    if (error.line !== undefined && error.column !== undefined) {
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

        fixes.push(`[${error.line}, ${error.column}]`);
      }
    }
  }

  if (fixes.length > 0) {
    await vscode.workspace.applyEdit(edit);
    vscode.window.showInformationMessage(`Fixed ${fixes.length} invalid tile(s)`);
  }
}

async function addToolStore(editor: vscode.TextEditor): Promise<void> {
  const edit = new vscode.WorkspaceEdit();
  const text = editor.document.getText();
  const buildingsMatch = text.match(/buildings\s*\{([^}]*)\}/s);

  const toolStoreEntry = `  type: BuildingToolStore_C
  ID: ToolStore01
  essential: true
  coordinates{
    Translation: X=2250.0 Y=2250.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
  }
  Level: 0
  Teleport: 1
  HP: MAX
`;

  if (buildingsMatch) {
    // Add to existing buildings section
    const buildingsStart = text.indexOf(buildingsMatch[0]);
    const insertPos = buildingsStart + buildingsMatch[0].indexOf('{') + 1;
    const position = editor.document.positionAt(insertPos);
    edit.insert(editor.document.uri, position, '\n' + toolStoreEntry);
  } else {
    // Create new buildings section after info
    const infoEnd = text.indexOf('}', text.indexOf('info{'));
    if (infoEnd !== -1) {
      const position = editor.document.positionAt(infoEnd + 1);
      const buildingsSection = `\n\nbuildings{\n${toolStoreEntry}}`;
      edit.insert(editor.document.uri, position, buildingsSection);
    }
  }

  await vscode.workspace.applyEdit(edit);
  vscode.window.showInformationMessage('Added Tool Store to buildings');
}

async function addGroundTiles(editor: vscode.TextEditor): Promise<void> {
  const edit = new vscode.WorkspaceEdit();
  const parser = new DatFileParser(editor.document.getText());
  const info = parser.getSection('info');

  if (info && info.content) {
    const rowMatch = info.content.match(/rowcount:\s*(\d+)/);
    const colMatch = info.content.match(/colcount:\s*(\d+)/);

    if (rowMatch && colMatch) {
      const numRows = parseInt(rowMatch[1]);
      const numCols = parseInt(colMatch[1]);
      const centerRow = Math.floor(numRows / 2);
      const centerCol = Math.floor(numCols / 2);

      const lines = editor.document.getText().split('\n');
      const tilesStart = lines.findIndex(line => line.trim() === 'tiles{');

      if (tilesStart !== -1) {
        // Replace 5x5 area in center with ground tiles
        for (let r = -2; r <= 2; r++) {
          const row = centerRow + r;
          if (row >= 0 && row < numRows) {
            const actualLine = tilesStart + 1 + row;
            const lineText = lines[actualLine];
            const tiles = lineText.split(',');

            for (let c = -2; c <= 2; c++) {
              const col = centerCol + c;
              if (col >= 0 && col < numCols) {
                tiles[col] = '1';
              }
            }

            const newLine = tiles.join(',');
            edit.replace(
              editor.document.uri,
              new vscode.Range(actualLine, 0, actualLine, lineText.length),
              newLine
            );
          }
        }
      }
    }
  }

  await vscode.workspace.applyEdit(edit);
  vscode.window.showInformationMessage('Added ground tiles to map center');
}

async function adjustObjectives(editor: vscode.TextEditor, errors: any[]): Promise<void> {
  const edit = new vscode.WorkspaceEdit();
  let fixCount = 0;

  for (const error of errors) {
    const match = error.message.match(/\((\d+)\).*\((\d+)\)/);
    if (match && error.line !== undefined) {
      const required = parseInt(match[1]);
      const available = parseInt(match[2]);

      const lines = editor.document.getText().split('\n');
      const objectivesStart = lines.findIndex(line => line.trim() === 'objectives{');

      if (objectivesStart !== -1) {
        const actualLine = objectivesStart + 1 + error.line;
        const lineText = lines[actualLine];
        const newLine = lineText.replace(required.toString(), available.toString());

        edit.replace(
          editor.document.uri,
          new vscode.Range(actualLine, 0, actualLine, lineText.length),
          newLine
        );
        fixCount++;
      }
    }
  }

  if (fixCount > 0) {
    await vscode.workspace.applyEdit(edit);
    vscode.window.showInformationMessage(`Adjusted ${fixCount} objective(s)`);
  }
}

async function fixNegativeValues(editor: vscode.TextEditor, errors: any[]): Promise<void> {
  const edit = new vscode.WorkspaceEdit();
  let fixCount = 0;

  for (const error of errors) {
    if (error.line !== undefined && error.section) {
      const lines = editor.document.getText().split('\n');
      const sectionStart = lines.findIndex(line => line.trim() === `${error.section}{`);

      if (sectionStart !== -1) {
        const actualLine = sectionStart + 1 + error.line;
        const lineText = lines[actualLine];
        const newLine = lineText.replace(/-\d+(\.\d+)?/g, '0');

        if (newLine !== lineText) {
          edit.replace(
            editor.document.uri,
            new vscode.Range(actualLine, 0, actualLine, lineText.length),
            newLine
          );
          fixCount++;
        }
      }
    }
  }

  if (fixCount > 0) {
    await vscode.workspace.applyEdit(edit);
    vscode.window.showInformationMessage(`Fixed ${fixCount} negative value(s)`);
  }
}

async function fixGridDimensions(editor: vscode.TextEditor, errors: any[]): Promise<void> {
  const edit = new vscode.WorkspaceEdit();
  let fixCount = 0;

  for (const error of errors) {
    const match = error.message.match(/expected (\d+)/);
    if (match && error.section && error.line !== undefined) {
      const expected = parseInt(match[1]);
      const lines = editor.document.getText().split('\n');
      const sectionStart = lines.findIndex(line => line.trim() === `${error.section}{`);

      if (sectionStart !== -1) {
        const actualLine = sectionStart + 1 + error.line;
        const lineText = lines[actualLine];
        const values = lineText.split(',');

        if (values.length !== expected) {
          // Adjust to match expected count
          if (values.length < expected) {
            while (values.length < expected) {
              values.push(error.section === 'tiles' ? '1' : '0');
            }
          } else {
            values.length = expected;
          }

          const newLine = values.join(',');
          edit.replace(
            editor.document.uri,
            new vscode.Range(actualLine, 0, actualLine, lineText.length),
            newLine
          );
          fixCount++;
        }
      }
    }
  }

  if (fixCount > 0) {
    await vscode.workspace.applyEdit(edit);
    vscode.window.showInformationMessage(`Fixed ${fixCount} dimension issue(s)`);
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
