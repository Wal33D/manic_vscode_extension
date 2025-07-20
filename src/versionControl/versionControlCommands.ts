import * as vscode from 'vscode';
import { MapVersionControl, MapVersion } from './mapVersionControl';
import { MapDiffProvider } from './mapDiffProvider';

export function registerVersionControlCommands(
  context: vscode.ExtensionContext,
  versionControl: MapVersionControl,
  diffProvider: MapDiffProvider
): void {
  // Create version command
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.createVersion', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'manicminers') {
        vscode.window.showErrorMessage('Please open a Manic Miners DAT file');
        return;
      }

      const message = await vscode.window.showInputBox({
        prompt: 'Enter a message for this version',
        placeHolder: 'e.g., Added new resource area',
        validateInput: value => {
          if (!value || value.trim().length === 0) {
            return 'Message cannot be empty';
          }
          return null;
        },
      });

      if (!message) {
        return;
      }

      try {
        const hash = await versionControl.createVersion(editor.document, message);
        vscode.window.showInformationMessage(`Version created: ${hash}`);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to create version: ${error}`);
      }
    })
  );

  // Show version history command
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.showVersionHistory', async () => {
      const versions = versionControl.getVersions();

      if (versions.length === 0) {
        vscode.window.showInformationMessage('No version history found');
        return;
      }

      const items = versions.map(v => ({
        label: v.message,
        description: `${v.hash.substring(0, 8)} - ${v.date.toLocaleString()}`,
        detail: v.author ? `Author: ${v.author}` : undefined,
        version: v,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a version to view or restore',
        title: 'Map Version History',
      });

      if (selected) {
        const action = await vscode.window.showQuickPick(
          [
            { label: '$(eye) View Changes', value: 'view' },
            { label: '$(history) Restore This Version', value: 'restore' },
            { label: '$(diff) Compare with Current', value: 'compare' },
          ],
          {
            placeHolder: 'What would you like to do with this version?',
          }
        );

        if (action) {
          switch (action.value) {
            case 'restore':
              await restoreVersion(selected.version.hash);
              break;
            case 'compare':
              await compareWithCurrent(selected.version.hash);
              break;
            case 'view':
              await viewVersion(selected.version);
              break;
          }
        }
      }
    })
  );

  // Compare versions command
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.compareVersions', async () => {
      const versions = versionControl.getVersions();

      if (versions.length < 2) {
        vscode.window.showInformationMessage('Need at least 2 versions to compare');
        return;
      }

      const items = versions.map(v => ({
        label: v.message,
        description: `${v.hash.substring(0, 8)} - ${v.date.toLocaleString()}`,
        version: v,
      }));

      const fromVersion = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select the FROM version',
        title: 'Compare Map Versions - Step 1/2',
      });

      if (!fromVersion) {
        return;
      }

      const toVersion = await vscode.window.showQuickPick(
        items.filter(i => i.version.hash !== fromVersion.version.hash),
        {
          placeHolder: 'Select the TO version',
          title: 'Compare Map Versions - Step 2/2',
        }
      );

      if (!toVersion) {
        return;
      }

      // Show diff in panel
      diffProvider.showDiff(fromVersion.version.hash, toVersion.version.hash);
      vscode.commands.executeCommand('manicMiners.mapDiff.focus');
    })
  );

  // Restore version function
  async function restoreVersion(hash: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'manicminers') {
      vscode.window.showErrorMessage('Please open a Manic Miners DAT file');
      return;
    }

    const confirm = await vscode.window.showWarningMessage(
      'Are you sure you want to restore this version? Current changes will be lost.',
      'Yes, Restore',
      'Cancel'
    );

    if (confirm === 'Yes, Restore') {
      const success = await versionControl.restoreVersion(editor.document, hash);
      if (success) {
        vscode.window.showInformationMessage('Version restored successfully');
      } else {
        vscode.window.showErrorMessage('Failed to restore version');
      }
    }
  }

  // Compare with current function
  async function compareWithCurrent(hash: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'manicminers') {
      vscode.window.showErrorMessage('Please open a Manic Miners DAT file');
      return;
    }

    // Create a temporary version for current state
    const currentHash = await versionControl.createVersion(editor.document, 'Current (unsaved)');

    diffProvider.showDiff(hash, currentHash);
    vscode.commands.executeCommand('manicMiners.mapDiff.focus');
  }

  // View version details
  async function viewVersion(version: MapVersion) {
    const panel = vscode.window.createWebviewPanel(
      'mapVersionDetails',
      `Version: ${version.message}`,
      vscode.ViewColumn.Two,
      {}
    );

    const diff = versionControl.getDiff(versionControl.getCurrentVersion() || '', version.hash);

    panel.webview.html = `
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
        .version-info {
            margin-bottom: 20px;
            padding: 15px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
        }
        .map-preview {
            margin-top: 20px;
        }
        table {
            border-collapse: collapse;
        }
        td {
            width: 20px;
            height: 20px;
            text-align: center;
            border: 1px solid var(--vscode-panel-border);
            font-size: 10px;
        }
    </style>
</head>
<body>
    <h1>Version Details</h1>
    <div class="version-info">
        <p><strong>Message:</strong> ${version.message}</p>
        <p><strong>Hash:</strong> ${version.hash}</p>
        <p><strong>Date:</strong> ${version.date.toLocaleString()}</p>
        ${version.author ? `<p><strong>Author:</strong> ${version.author}</p>` : ''}
    </div>
    
    ${
      diff
        ? `
    <div class="changes-summary">
        <h2>Changes from Current</h2>
        <p>Added: ${diff.statistics.tilesAdded} tiles</p>
        <p>Removed: ${diff.statistics.tilesRemoved} tiles</p>
        <p>Modified: ${diff.statistics.tilesModified} tiles</p>
    </div>
    `
        : ''
    }

    <div class="map-preview">
        <h2>Map Preview</h2>
        ${version.tiles ? generateMapPreview(version.tiles) : '<p>No tile data available</p>'}
    </div>
</body>
</html>`;
  }
}

function generateMapPreview(tiles: number[][]): string {
  let html = '<table>';

  // Show first 20x20 tiles
  const maxRows = Math.min(tiles.length, 20);
  const maxCols = Math.min(tiles[0]?.length || 0, 20);

  for (let row = 0; row < maxRows; row++) {
    html += '<tr>';
    for (let col = 0; col < maxCols; col++) {
      const tile = tiles[row]?.[col] || 0;
      const color = getTileColor(tile);
      html += `<td style="background-color: ${color}">${tile}</td>`;
    }
    html += '</tr>';
  }

  html += '</table>';

  if (tiles.length > 20 || (tiles[0]?.length || 0) > 20) {
    html += '<p><em>Showing first 20x20 tiles</em></p>';
  }

  return html;
}

function getTileColor(tile: number): string {
  // Basic color mapping for common tiles
  if (tile === 0) {
    return '#000000';
  } // Empty
  if (tile === 1) {
    return '#8B4513';
  } // Ground
  if (tile >= 26 && tile <= 41) {
    return '#696969';
  } // Walls
  if (tile >= 42 && tile <= 45) {
    return '#9370DB';
  } // Crystal
  if (tile >= 46 && tile <= 49) {
    return '#FFD700';
  } // Ore
  if (tile === 6) {
    return '#FF4500';
  } // Lava
  if (tile === 11) {
    return '#4169E1';
  } // Water
  return '#808080'; // Default gray
}
