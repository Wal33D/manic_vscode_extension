/**
 * Heatmap renderer for visualizing map statistics
 */

import { MapStatistics } from './mapStatistics';

export interface HeatmapOptions {
  type: 'resource' | 'difficulty' | 'accessibility';
  showGrid: boolean;
  showValues: boolean;
  opacity: number;
}

/**
 * Renders heatmaps as HTML for webview display
 */
export class HeatmapRenderer {
  private stats: MapStatistics;
  private tileSize = 20;

  constructor(stats: MapStatistics) {
    this.stats = stats;
  }

  /**
   * Generate HTML for heatmap visualization
   */
  public renderHeatmap(options: HeatmapOptions): string {
    const width = this.stats.dimensions.width;
    const height = this.stats.dimensions.height;

    const canvasWidth = width * this.tileSize;
    const canvasHeight = height * this.tileSize;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 20px;
            background: #1e1e1e;
            color: #d4d4d4;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }
          
          .controls {
            display: flex;
            gap: 15px;
            align-items: center;
            background: #2d2d30;
            padding: 15px;
            border-radius: 8px;
          }
          
          .control-group {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          label {
            font-size: 14px;
          }
          
          select, input[type="range"], input[type="checkbox"] {
            background: #3c3c3c;
            border: 1px solid #555;
            color: #d4d4d4;
            padding: 4px 8px;
            border-radius: 4px;
          }
          
          canvas {
            border: 2px solid #464647;
            border-radius: 4px;
            image-rendering: pixelated;
          }
          
          .legend {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #2d2d30;
            padding: 10px 15px;
            border-radius: 8px;
          }
          
          .legend-gradient {
            width: 200px;
            height: 20px;
            border-radius: 4px;
          }
          
          .legend-labels {
            display: flex;
            justify-content: space-between;
            width: 200px;
            font-size: 12px;
          }
          
          .stats-panel {
            background: #2d2d30;
            padding: 15px;
            border-radius: 8px;
            max-width: 600px;
            width: 100%;
          }
          
          .stat-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #464647;
          }
          
          .stat-row:last-child {
            border-bottom: none;
          }
          
          .stat-label {
            font-weight: 500;
          }
          
          .stat-value {
            color: #9cdcfe;
          }
          
          h2 {
            margin: 0 0 15px 0;
            font-size: 18px;
            color: #ffffff;
          }
          
          .tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
            display: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Map Statistics Heatmap</h1>
          
          <div class="controls">
            <div class="control-group">
              <label>Type:</label>
              <select id="heatmapType" onchange="updateHeatmap()">
                <option value="resource" ${options.type === 'resource' ? 'selected' : ''}>Resource Density</option>
                <option value="difficulty" ${options.type === 'difficulty' ? 'selected' : ''}>Difficulty</option>
                <option value="accessibility" ${options.type === 'accessibility' ? 'selected' : ''}>Accessibility</option>
              </select>
            </div>
            
            <div class="control-group">
              <label>
                <input type="checkbox" id="showGrid" ${options.showGrid ? 'checked' : ''} onchange="updateHeatmap()">
                Show Grid
              </label>
            </div>
            
            <div class="control-group">
              <label>
                <input type="checkbox" id="showValues" ${options.showValues ? 'checked' : ''} onchange="updateHeatmap()">
                Show Values
              </label>
            </div>
            
            <div class="control-group">
              <label>Opacity:</label>
              <input type="range" id="opacity" min="0" max="100" value="${options.opacity * 100}" onchange="updateHeatmap()">
            </div>
          </div>
          
          <canvas id="heatmapCanvas" width="${canvasWidth}" height="${canvasHeight}"></canvas>
          
          <div class="legend">
            <span>Low</span>
            <div class="legend-gradient" id="legendGradient"></div>
            <span>High</span>
          </div>
          
          <div class="stats-panel">
            <h2>Statistics</h2>
            <div id="statsContent"></div>
          </div>
        </div>
        
        <div class="tooltip" id="tooltip"></div>
        
        <script>
          const stats = ${JSON.stringify(this.stats)};
          const tileSize = ${this.tileSize};
          let currentOptions = ${JSON.stringify(options)};
          
          function getColorForValue(value, type) {
            const normalized = value / 100;
            
            if (type === 'resource') {
              // Green gradient for resources
              const r = Math.floor(255 * (1 - normalized));
              const g = 255;
              const b = Math.floor(255 * (1 - normalized));
              return \`rgb(\${r}, \${g}, \${b})\`;
            } else if (type === 'difficulty') {
              // Red gradient for difficulty
              const r = 255;
              const g = Math.floor(255 * (1 - normalized));
              const b = Math.floor(255 * (1 - normalized));
              return \`rgb(\${r}, \${g}, \${b})\`;
            } else {
              // Blue gradient for accessibility
              const r = Math.floor(255 * (1 - normalized));
              const g = Math.floor(255 * (1 - normalized));
              const b = 255;
              return \`rgb(\${r}, \${g}, \${b})\`;
            }
          }
          
          function drawHeatmap() {
            const canvas = document.getElementById('heatmapCanvas');
            const ctx = canvas.getContext('2d');
            const heatmap = stats.heatmaps[currentOptions.type];
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw heatmap
            for (let y = 0; y < stats.dimensions.height; y++) {
              for (let x = 0; x < stats.dimensions.width; x++) {
                const value = heatmap[y][x];
                
                if (value > 0) {
                  ctx.fillStyle = getColorForValue(value, currentOptions.type);
                  ctx.globalAlpha = currentOptions.opacity;
                  ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                }
              }
            }
            
            ctx.globalAlpha = 1;
            
            // Draw grid
            if (currentOptions.showGrid) {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
              ctx.lineWidth = 0.5;
              
              for (let x = 0; x <= stats.dimensions.width; x++) {
                ctx.beginPath();
                ctx.moveTo(x * tileSize, 0);
                ctx.lineTo(x * tileSize, canvas.height);
                ctx.stroke();
              }
              
              for (let y = 0; y <= stats.dimensions.height; y++) {
                ctx.beginPath();
                ctx.moveTo(0, y * tileSize);
                ctx.lineTo(canvas.width, y * tileSize);
                ctx.stroke();
              }
            }
            
            // Draw values
            if (currentOptions.showValues && tileSize >= 20) {
              ctx.font = '10px monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              for (let y = 0; y < stats.dimensions.height; y++) {
                for (let x = 0; x < stats.dimensions.width; x++) {
                  const value = heatmap[y][x];
                  if (value > 0) {
                    ctx.fillStyle = value > 50 ? 'black' : 'white';
                    ctx.fillText(value.toString(), x * tileSize + tileSize / 2, y * tileSize + tileSize / 2);
                  }
                }
              }
            }
          }
          
          function updateHeatmap() {
            currentOptions.type = document.getElementById('heatmapType').value;
            currentOptions.showGrid = document.getElementById('showGrid').checked;
            currentOptions.showValues = document.getElementById('showValues').checked;
            currentOptions.opacity = document.getElementById('opacity').value / 100;
            
            drawHeatmap();
            updateLegend();
            updateStats();
          }
          
          function updateLegend() {
            const gradient = document.getElementById('legendGradient');
            const type = currentOptions.type;
            
            if (type === 'resource') {
              gradient.style.background = 'linear-gradient(to right, #00ff00, #ffff00)';
            } else if (type === 'difficulty') {
              gradient.style.background = 'linear-gradient(to right, #ffff00, #ff0000)';
            } else {
              gradient.style.background = 'linear-gradient(to right, #0000ff, #00ffff)';
            }
          }
          
          function updateStats() {
            const content = document.getElementById('statsContent');
            const type = currentOptions.type;
            let html = '';
            
            if (type === 'resource') {
              html = '<div class="stat-row"><span class="stat-label">Total Resources:</span><span class="stat-value">' +
                (Array.from(stats.resourceDistribution.values()).reduce((sum, d) => sum + d.totalYield, 0)) + '</span></div>';
              
              for (const [resType, dist] of Object.entries(stats.resourceDistribution)) {
                html += '<div class="stat-row"><span class="stat-label">' + resType + ':</span><span class="stat-value">' +
                  dist.totalYield + ' (' + dist.clusters.length + ' clusters)</span></div>';
              }
            } else if (type === 'difficulty') {
              html = '<div class="stat-row"><span class="stat-label">Overall Difficulty:</span><span class="stat-value">' +
                stats.difficulty.overall.toUpperCase() + '</span></div>';
              
              for (const [factor, score] of Object.entries(stats.difficulty.factors)) {
                html += '<div class="stat-row"><span class="stat-label">' + factor + ':</span><span class="stat-value">' +
                  score.toFixed(0) + '/100</span></div>';
              }
            } else {
              html = '<div class="stat-row"><span class="stat-label">Accessibility Score:</span><span class="stat-value">' +
                stats.accessibility.overallScore.toFixed(0) + '/100</span></div>';
              html += '<div class="stat-row"><span class="stat-label">Reachable Area:</span><span class="stat-value">' +
                stats.accessibility.reachableArea.toFixed(1) + '%</span></div>';
              html += '<div class="stat-row"><span class="stat-label">Isolated Regions:</span><span class="stat-value">' +
                stats.accessibility.isolatedRegions.length + '</span></div>';
              html += '<div class="stat-row"><span class="stat-label">Chokepoints:</span><span class="stat-value">' +
                stats.accessibility.chokepointCount + '</span></div>';
            }
            
            content.innerHTML = html;
          }
          
          // Canvas hover tooltip
          const canvas = document.getElementById('heatmapCanvas');
          const tooltip = document.getElementById('tooltip');
          
          canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / tileSize);
            const y = Math.floor((e.clientY - rect.top) / tileSize);
            
            if (x >= 0 && x < stats.dimensions.width && y >= 0 && y < stats.dimensions.height) {
              const value = stats.heatmaps[currentOptions.type][y][x];
              
              tooltip.style.display = 'block';
              tooltip.style.left = e.pageX + 10 + 'px';
              tooltip.style.top = e.pageY + 10 + 'px';
              tooltip.innerHTML = \`Position: (\${x}, \${y})<br>Value: \${value}\`;
            }
          });
          
          canvas.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
          });
          
          // Initial render
          drawHeatmap();
          updateLegend();
          updateStats();
          
          // Handle VSCode theme changes
          window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'updateTheme') {
              // Update colors if needed
            }
          });
        </script>
      </body>
      </html>
    `;
  }
}
