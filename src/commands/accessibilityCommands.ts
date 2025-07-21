import * as vscode from 'vscode';
import { MapAccessibilityValidator } from '../validation/mapAccessibilityValidator';
import { DatFileParser } from '../parser/datFileParser';

/**
 * Register accessibility validation commands
 */
export function registerAccessibilityCommands(context: vscode.ExtensionContext) {
  // Validate map accessibility
  const validateAccessibility = vscode.commands.registerCommand(
    'manicMiners.validateAccessibility',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !editor.document.fileName.endsWith('.dat')) {
        vscode.window.showErrorMessage('Please open a .dat file to validate');
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Validating map accessibility...',
          cancellable: false,
        },
        async progress => {
          try {
            progress.report({ increment: 0, message: 'Parsing map file...' });

            const parser = new DatFileParser(editor.document.getText());
            const datFile = parser.parse();

            progress.report({ increment: 30, message: 'Checking reachability...' });

            const validator = new MapAccessibilityValidator();
            const result = validator.validate(datFile);

            progress.report({ increment: 70, message: 'Analyzing results...' });

            // Show results
            if (result.isValid) {
              vscode.window.showInformationMessage(
                `✅ Map accessibility validation passed! ${result.warnings.length} warning(s) found.`
              );
            } else {
              vscode.window.showErrorMessage(
                `❌ Map accessibility validation failed! ${result.errors.length} error(s) found.`
              );
            }

            // Show detailed report
            if (result.errors.length > 0 || result.warnings.length > 0) {
              showAccessibilityReport(result, editor.document.uri);
            }

            progress.report({ increment: 100 });
          } catch (error) {
            vscode.window.showErrorMessage(
              `Failed to validate accessibility: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      );
    }
  );

  // Show accessibility heatmap
  const showAccessibilityHeatmap = vscode.commands.registerCommand(
    'manicMiners.showAccessibilityHeatmap',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !editor.document.fileName.endsWith('.dat')) {
        vscode.window.showErrorMessage('Please open a .dat file');
        return;
      }

      try {
        const parser = new DatFileParser(editor.document.getText());
        const datFile = parser.parse();

        const validator = new MapAccessibilityValidator();
        const result = validator.validate(datFile);

        if (result.reachabilityMap) {
          showHeatmapVisualization(
            result.reachabilityMap,
            datFile.info.rowcount,
            datFile.info.colcount
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to generate heatmap: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  );

  // Check specific objective reachability
  const checkObjectiveReachability = vscode.commands.registerCommand(
    'manicMiners.checkObjectiveReachability',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !editor.document.fileName.endsWith('.dat')) {
        vscode.window.showErrorMessage('Please open a .dat file');
        return;
      }

      try {
        const parser = new DatFileParser(editor.document.getText());
        const datFile = parser.parse();

        // Get cursor position
        const position = editor.selection.active;
        const line = position.line;

        // Find which section we're in
        const section = parser.getSectionAtPosition(line);
        if (section?.name === 'objectives') {
          // Analyze the specific objective at cursor
          const validator = new MapAccessibilityValidator();
          const result = validator.validate(datFile);

          if (result.analysis) {
            vscode.window.showInformationMessage(
              `Map has ${result.analysis.totalAccessibleTiles} accessible tiles out of ${result.analysis.totalGroundTiles} (${result.analysis.accessibilityPercentage}%)`
            );
          }
        } else {
          vscode.window.showInformationMessage(
            'Place cursor on an objective to check its reachability'
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to check reachability: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  );

  context.subscriptions.push(
    validateAccessibility,
    showAccessibilityHeatmap,
    checkObjectiveReachability
  );
}

/**
 * Show detailed accessibility report
 */
function showAccessibilityReport(result: any, uri: vscode.Uri) {
  const panel = vscode.window.createWebviewPanel(
    'accessibilityReport',
    'Map Accessibility Report',
    vscode.ViewColumn.Beside,
    { enableScripts: true }
  );

  panel.webview.html = getAccessibilityReportHtml(result, uri.fsPath);
}

/**
 * Show heatmap visualization
 */
function showHeatmapVisualization(reachabilityMap: number[][], rows: number, cols: number) {
  const panel = vscode.window.createWebviewPanel(
    'accessibilityHeatmap',
    'Accessibility Heatmap',
    vscode.ViewColumn.Beside,
    { enableScripts: true }
  );

  panel.webview.html = getHeatmapHtml(reachabilityMap, rows, cols);
}

/**
 * Generate HTML for accessibility report
 */
function getAccessibilityReportHtml(result: any, filePath: string): string {
  const errors = result.errors || [];
  const warnings = result.warnings || [];
  const analysis = result.analysis || {};

  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Accessibility Report</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
          background: #1e1e1e;
          color: #cccccc;
        }
        h1, h2 { color: #4ec9b0; }
        .summary {
          background: #2d2d2d;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid #3e3e3e;
        }
        .stat {
          display: inline-block;
          margin-right: 30px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #4ec9b0;
        }
        .errors, .warnings {
          margin-bottom: 30px;
        }
        .error-item, .warning-item {
          background: #2d2d2d;
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 8px;
          border-left: 4px solid;
        }
        .error-item {
          border-color: #f44747;
        }
        .warning-item {
          border-color: #dcdcaa;
        }
        .location {
          color: #858585;
          font-size: 12px;
        }
        .section-header {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }
        .count-badge {
          background: #3e3e3e;
          padding: 4px 12px;
          border-radius: 12px;
          margin-left: 10px;
          font-size: 14px;
        }
        .path-info {
          background: #2d2d2d;
          border-radius: 4px;
          padding: 12px;
          margin: 8px 0;
          font-family: monospace;
        }
      </style>
    </head>
    <body>
      <h1>Map Accessibility Report</h1>
      <p style="color: #858585;">File: ${filePath}</p>
      
      <div class="summary">
        <h2>Summary</h2>
        <div class="stat">
          <div class="stat-value">${analysis.accessibilityPercentage || 0}%</div>
          <div>Accessible</div>
        </div>
        <div class="stat">
          <div class="stat-value">${analysis.totalAccessibleTiles || 0}</div>
          <div>Reachable Tiles</div>
        </div>
        <div class="stat">
          <div class="stat-value">${analysis.isolatedAreas || 0}</div>
          <div>Isolated Areas</div>
        </div>
      </div>
      
      ${
        errors.length > 0
          ? `
      <div class="errors">
        <div class="section-header">
          <h2>Errors</h2>
          <span class="count-badge">${errors.length}</span>
        </div>
        ${errors
          .map(
            (error: any) => `
          <div class="error-item">
            <div>${error.message}</div>
            ${error.line > 0 ? `<div class="location">Line ${error.line}, Column ${error.column}</div>` : ''}
          </div>
        `
          )
          .join('')}
      </div>
      `
          : ''
      }
      
      ${
        warnings.length > 0
          ? `
      <div class="warnings">
        <div class="section-header">
          <h2>Warnings</h2>
          <span class="count-badge">${warnings.length}</span>
        </div>
        ${warnings
          .map(
            (warning: any) => `
          <div class="warning-item">
            <div>${warning.message}</div>
            ${warning.line > 0 ? `<div class="location">Line ${warning.line}, Column ${warning.column}</div>` : ''}
          </div>
        `
          )
          .join('')}
      </div>
      `
          : ''
      }
      
      ${
        analysis.criticalPaths && analysis.criticalPaths.length > 0
          ? `
      <div class="critical-paths">
        <h2>Critical Paths</h2>
        ${analysis.criticalPaths
          .map(
            (path: any) => `
          <div class="path-info">
            <strong>${path.from}</strong> → <strong>${path.to}</strong>
            <div style="color: #858585;">Path length: ${path.path ? path.path.length : 0} tiles</div>
          </div>
        `
          )
          .join('')}
      </div>
      `
          : ''
      }
    </body>
    </html>`;
}

/**
 * Generate HTML for heatmap visualization
 */
function getHeatmapHtml(reachabilityMap: number[][], rows: number, cols: number): string {
  const tileSize = Math.min(800 / cols, 600 / rows, 20);

  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Accessibility Heatmap</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
          background: #1e1e1e;
          color: #cccccc;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        h1 { color: #4ec9b0; }
        #canvas {
          border: 1px solid #3e3e3e;
          margin: 20px 0;
        }
        .legend {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: 20px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .color-box {
          width: 20px;
          height: 20px;
          border: 1px solid #3e3e3e;
        }
      </style>
    </head>
    <body>
      <h1>Map Accessibility Heatmap</h1>
      <canvas id="canvas" width="${cols * tileSize}" height="${rows * tileSize}"></canvas>
      
      <div class="legend">
        <div class="legend-item">
          <div class="color-box" style="background: #4ec9b0;"></div>
          <span>Tool Store</span>
        </div>
        <div class="legend-item">
          <div class="color-box" style="background: #40a040;"></div>
          <span>Easily Accessible</span>
        </div>
        <div class="legend-item">
          <div class="color-box" style="background: #a0a040;"></div>
          <span>Moderately Accessible</span>
        </div>
        <div class="legend-item">
          <div class="color-box" style="background: #a04040;"></div>
          <span>Far from Tool Store</span>
        </div>
        <div class="legend-item">
          <div class="color-box" style="background: #333333;"></div>
          <span>Unreachable</span>
        </div>
      </div>
      
      <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const reachabilityMap = ${JSON.stringify(reachabilityMap)};
        const rows = ${rows};
        const cols = ${cols};
        const tileSize = ${tileSize};
        
        // Find max distance for color scaling
        let maxDistance = 0;
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            if (reachabilityMap[row][col] > maxDistance) {
              maxDistance = reachabilityMap[row][col];
            }
          }
        }
        
        // Draw heatmap
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const distance = reachabilityMap[row][col];
            
            if (distance === -1) {
              // Unreachable
              ctx.fillStyle = '#333333';
            } else if (distance === 0) {
              // Tool Store location
              ctx.fillStyle = '#4ec9b0';
            } else {
              // Color based on distance
              const ratio = distance / maxDistance;
              if (ratio < 0.3) {
                // Green (close)
                const g = Math.floor(160 + (255 - 160) * (1 - ratio / 0.3));
                ctx.fillStyle = 'rgb(64, ' + g + ', 64)';
              } else if (ratio < 0.7) {
                // Yellow (medium)
                const r = Math.floor(64 + (160 - 64) * ((ratio - 0.3) / 0.4));
                ctx.fillStyle = 'rgb(' + r + ', 160, 64)';
              } else {
                // Red (far)
                const g = Math.floor(160 - (160 - 64) * ((ratio - 0.7) / 0.3));
                ctx.fillStyle = 'rgb(160, ' + g + ', 64)';
              }
            }
            
            ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
            
            // Draw grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.strokeRect(col * tileSize, row * tileSize, tileSize, tileSize);
          }
        }
      </script>
    </body>
    </html>`;
}
