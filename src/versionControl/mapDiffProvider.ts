import * as vscode from 'vscode';
import { MapDiff, MapVersion } from './mapVersionControl';

export class MapDiffProvider {
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private getMapVersion: (hash: string) => MapVersion | undefined,
    private getMapDiff: (from: string, to: string) => MapDiff | null
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }

  public showDiff(fromHash: string, toHash: string) {
    if (!this._view) {
      return;
    }

    const diff = this.getMapDiff(fromHash, toHash);
    const fromVersion = this.getMapVersion(fromHash);
    const toVersion = this.getMapVersion(toHash);

    if (diff && fromVersion && toVersion) {
      this._view.webview.postMessage({
        type: 'showDiff',
        diff,
        fromVersion: {
          hash: fromVersion.hash,
          date: fromVersion.date.toISOString(),
          message: fromVersion.message,
          author: fromVersion.author,
        },
        toVersion: {
          hash: toVersion.hash,
          date: toVersion.date.toISOString(),
          message: toVersion.message,
          author: toVersion.author,
        },
      });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'mapDiff.css')
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleUri}" rel="stylesheet">
    <title>Map Version Diff</title>
</head>
<body>
    <div id="diff-container">
        <div class="diff-header">
            <h2>Map Version Comparison</h2>
            <div class="version-info">
                <div class="from-version">
                    <h3>From</h3>
                    <div class="version-details"></div>
                </div>
                <div class="to-version">
                    <h3>To</h3>
                    <div class="version-details"></div>
                </div>
            </div>
        </div>
        <div class="diff-statistics">
            <h3>Changes Summary</h3>
            <div class="stats"></div>
        </div>
        <div class="diff-content">
            <h3>Detailed Changes</h3>
            <div class="changes-list"></div>
        </div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'showDiff':
                    displayDiff(message.diff, message.fromVersion, message.toVersion);
                    break;
            }
        });

        function displayDiff(diff, fromVersion, toVersion) {
            // Display version info
            document.querySelector('.from-version .version-details').innerHTML = \`
                <p><strong>Hash:</strong> \${fromVersion.hash}</p>
                <p><strong>Date:</strong> \${new Date(fromVersion.date).toLocaleString()}</p>
                <p><strong>Message:</strong> \${fromVersion.message}</p>
                \${fromVersion.author ? \`<p><strong>Author:</strong> \${fromVersion.author}</p>\` : ''}
            \`;

            document.querySelector('.to-version .version-details').innerHTML = \`
                <p><strong>Hash:</strong> \${toVersion.hash}</p>
                <p><strong>Date:</strong> \${new Date(toVersion.date).toLocaleString()}</p>
                <p><strong>Message:</strong> \${toVersion.message}</p>
                \${toVersion.author ? \`<p><strong>Author:</strong> \${toVersion.author}</p>\` : ''}
            \`;

            // Display statistics
            document.querySelector('.stats').innerHTML = \`
                <div class="stat-item">
                    <span class="stat-label">Total Changes:</span>
                    <span class="stat-value">\${diff.statistics.totalChanges}</span>
                </div>
                <div class="stat-item added">
                    <span class="stat-label">Tiles Added:</span>
                    <span class="stat-value">\${diff.statistics.tilesAdded}</span>
                </div>
                <div class="stat-item removed">
                    <span class="stat-label">Tiles Removed:</span>
                    <span class="stat-value">\${diff.statistics.tilesRemoved}</span>
                </div>
                <div class="stat-item modified">
                    <span class="stat-label">Tiles Modified:</span>
                    <span class="stat-value">\${diff.statistics.tilesModified}</span>
                </div>
            \`;

            // Display detailed changes
            let changesHtml = '';
            
            if (diff.added.length > 0) {
                changesHtml += '<div class="change-group added"><h4>Added Tiles</h4><ul>';
                diff.added.forEach(change => {
                    changesHtml += \`<li>Position (\${change.row}, \${change.col}): Tile \${change.tile}</li>\`;
                });
                changesHtml += '</ul></div>';
            }

            if (diff.removed.length > 0) {
                changesHtml += '<div class="change-group removed"><h4>Removed Tiles</h4><ul>';
                diff.removed.forEach(change => {
                    changesHtml += \`<li>Position (\${change.row}, \${change.col}): Tile \${change.tile}</li>\`;
                });
                changesHtml += '</ul></div>';
            }

            if (diff.modified.length > 0) {
                changesHtml += '<div class="change-group modified"><h4>Modified Tiles</h4><ul>';
                diff.modified.forEach(change => {
                    changesHtml += \`<li>Position (\${change.row}, \${change.col}): \${change.oldTile} → \${change.newTile}</li>\`;
                });
                changesHtml += '</ul></div>';
            }

            document.querySelector('.changes-list').innerHTML = changesHtml;
        }
    </script>
</body>
</html>`;
  }
}
