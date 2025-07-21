import * as vscode from 'vscode';
import { renderOptimizer } from '../performance/renderOptimizer';

/**
 * Register performance optimization commands
 */
export function registerPerformanceCommands(context: vscode.ExtensionContext) {
  // Toggle performance mode
  const togglePerfMode = vscode.commands.registerCommand(
    'manicMiners.togglePerformanceMode',
    async () => {
      const modes = ['auto', 'high', 'medium', 'low'];
      const selected = await vscode.window.showQuickPick(modes, {
        placeHolder: 'Select performance mode',
        title: 'Map Rendering Performance Mode',
      });

      if (selected) {
        await vscode.workspace
          .getConfiguration('manicMiners')
          .update('performanceMode', selected, true);
        vscode.window.showInformationMessage(`Performance mode set to: ${selected}`);
      }
    }
  );

  // Show performance stats
  const showPerfStats = vscode.commands.registerCommand('manicMiners.showPerformanceStats', () => {
    const stats = renderOptimizer.getStats();
    const panel = vscode.window.createWebviewPanel(
      'performanceStats',
      'Rendering Performance Stats',
      vscode.ViewColumn.Beside,
      {}
    );

    panel.webview.html = getPerformanceStatsHtml(stats);

    // Update stats every second
    const interval = setInterval(() => {
      if (panel.visible) {
        panel.webview.html = getPerformanceStatsHtml(renderOptimizer.getStats());
      }
    }, 1000);

    panel.onDidDispose(() => {
      clearInterval(interval);
    });
  });

  // Optimize current map
  const optimizeMap = vscode.commands.registerCommand(
    'manicMiners.optimizeCurrentMap',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !editor.document.fileName.endsWith('.dat')) {
        vscode.window.showErrorMessage('Please open a .dat file to optimize');
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Optimizing map rendering...',
          cancellable: false,
        },
        async progress => {
          progress.report({ increment: 0 });

          // Analyze map size
          const content = editor.document.getText();
          const rowMatch = content.match(/rowcount:\s*(\d+)/i);
          const colMatch = content.match(/colcount:\s*(\d+)/i);

          if (!rowMatch || !colMatch) {
            vscode.window.showErrorMessage('Could not determine map size');
            return;
          }

          const rows = parseInt(rowMatch[1]);
          const cols = parseInt(colMatch[1]);
          const totalTiles = rows * cols;

          progress.report({ increment: 30, message: 'Analyzing map...' });

          // Determine optimal settings
          const recommendations: string[] = [];

          if (totalTiles > 10000) {
            recommendations.push('• Enable tile culling for viewport optimization');
            recommendations.push('• Use LOD (Level of Detail) for zoom levels');
            recommendations.push('• Consider chunking for very large maps');
          }

          if (rows > 100 || cols > 100) {
            recommendations.push('• Enable frustum culling for 3D view');
            recommendations.push('• Use distance-based LOD for terrain');
          }

          if (totalTiles > 5000) {
            recommendations.push('• Enable render throttling');
            recommendations.push('• Use tile caching for repeated renders');
          }

          progress.report({ increment: 60, message: 'Applying optimizations...' });

          // Update settings
          const config = vscode.workspace.getConfiguration('manicMiners');
          if (totalTiles > 5000) {
            await config.update('enableTileCulling', true, true);
            await config.update('enableLOD', true, true);
            await config.update('enableRenderThrottling', true, true);
          }

          progress.report({ increment: 100 });

          // Show recommendations
          const message = `Map size: ${rows}×${cols} (${totalTiles.toLocaleString()} tiles)\n\nOptimization recommendations:\n${recommendations.join(
            '\n'
          )}`;

          vscode.window.showInformationMessage(message, 'OK', 'View Settings').then(selection => {
            if (selection === 'View Settings') {
              vscode.commands.executeCommand('workbench.action.openSettings', 'manicMiners');
            }
          });
        }
      );
    }
  );

  context.subscriptions.push(togglePerfMode, showPerfStats, optimizeMap);
}

interface PerformanceStats {
  totalTiles: number;
  renderedTiles: number;
  culledTiles: number;
  frameTime: number;
  fps: number;
  memoryUsage?: number;
}

function getPerformanceStatsHtml(stats: PerformanceStats): string {
  const efficiency =
    stats.totalTiles > 0 ? ((stats.renderedTiles / stats.totalTiles) * 100).toFixed(1) : '0';

  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Performance Stats</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
          background: #1e1e1e;
          color: #cccccc;
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-top: 20px;
        }
        .stat-card {
          background: #2d2d2d;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #3e3e3e;
        }
        .stat-value {
          font-size: 36px;
          font-weight: bold;
          color: #4ec9b0;
          margin: 10px 0;
        }
        .stat-label {
          font-size: 14px;
          color: #858585;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .efficiency-bar {
          height: 20px;
          background: #3e3e3e;
          border-radius: 10px;
          overflow: hidden;
          margin-top: 10px;
        }
        .efficiency-fill {
          height: 100%;
          background: linear-gradient(90deg, #4ec9b0, #47a594);
          width: ${efficiency}%;
          transition: width 0.3s ease;
        }
        h1 {
          color: #cccccc;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .good { color: #4ec9b0; }
        .warning { color: #dcdcaa; }
        .bad { color: #f44747; }
      </style>
    </head>
    <body>
      <h1>Rendering Performance Statistics</h1>
      
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">FPS</div>
          <div class="stat-value ${
            stats.fps >= 30 ? 'good' : stats.fps >= 20 ? 'warning' : 'bad'
          }">${stats.fps}</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-label">Frame Time</div>
          <div class="stat-value ${
            stats.frameTime <= 16.7 ? 'good' : stats.frameTime <= 33.3 ? 'warning' : 'bad'
          }">${stats.frameTime.toFixed(1)}ms</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-label">Rendered Tiles</div>
          <div class="stat-value">${stats.renderedTiles.toLocaleString()}</div>
          <div style="font-size: 14px; color: #858585;">
            of ${stats.totalTiles.toLocaleString()} total
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-label">Culled Tiles</div>
          <div class="stat-value">${stats.culledTiles.toLocaleString()}</div>
          <div style="font-size: 14px; color: #858585;">
            ${
              stats.totalTiles > 0 ? ((stats.culledTiles / stats.totalTiles) * 100).toFixed(1) : '0'
            }% culled
          </div>
        </div>
      </div>
      
      <div class="stat-card" style="margin-top: 20px;">
        <div class="stat-label">Rendering Efficiency</div>
        <div class="efficiency-bar">
          <div class="efficiency-fill"></div>
        </div>
        <div style="margin-top: 10px; font-size: 18px;">
          ${efficiency}% of tiles visible
        </div>
      </div>
      
      ${
        stats.memoryUsage
          ? `
      <div class="stat-card" style="margin-top: 20px;">
        <div class="stat-label">Memory Usage</div>
        <div class="stat-value">${(stats.memoryUsage / 1024 / 1024).toFixed(1)} MB</div>
      </div>
      `
          : ''
      }
      
      <script>
        // Auto-refresh
        setTimeout(() => {
          location.reload();
        }, 1000);
      </script>
    </body>
    </html>`;
}
