(function() {
  const vscode = acquireVsCodeApi();
  
  let canvas;
  let ctx;
  let legendCanvas;
  let legendCtx;
  let currentHeatMapData = null;
  let currentMode = 'traffic';
  let currentColorScheme = 'traffic';
  let showGrid = true;
  let showHotspots = true;
  let showLegend = true;
  let opacity = 0.7;
  let tileSize = 32;

  // Color schemes
  const COLOR_SCHEMES = {
    traffic: {
      name: 'Traffic',
      colors: [
        '#0000FF', // Blue (low traffic)
        '#00FFFF', // Cyan
        '#00FF00', // Green
        '#FFFF00', // Yellow
        '#FFA500', // Orange
        '#FF0000', // Red (high traffic)
      ],
      nullColor: '#333333',
    },
    accessibility: {
      name: 'Accessibility',
      colors: [
        '#00FF00', // Green (close/accessible)
        '#7FFF00', // Chartreuse
        '#FFFF00', // Yellow
        '#FFA500', // Orange
        '#FF4500', // Orange Red
        '#FF0000', // Red (far/less accessible)
      ],
      nullColor: '#000000', // Black for unreachable
    },
    chokepoint: {
      name: 'Chokepoint',
      colors: [
        '#FFFFFF', // White (no chokepoint)
        '#FFFF99', // Light Yellow
        '#FFCC66', // Light Orange
        '#FF9933', // Orange
        '#FF6600', // Dark Orange
        '#FF0000', // Red (severe chokepoint)
      ],
      nullColor: '#333333',
    },
    temperature: {
      name: 'Temperature',
      colors: [
        '#0033FF', // Deep Blue
        '#0099FF', // Blue
        '#00FFFF', // Cyan
        '#99FF00', // Green-Yellow
        '#FFFF00', // Yellow
        '#FF9900', // Orange
        '#FF3300', // Red
        '#CC0000', // Dark Red
      ],
      nullColor: '#333333',
    },
  };

  // Initialize
  window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('heatMapCanvas');
    ctx = canvas.getContext('2d');
    
    legendCanvas = document.createElement('canvas');
    legendCanvas.width = 100;
    legendCanvas.height = 300;
    legendCtx = legendCanvas.getContext('2d');
    document.getElementById('legendCanvas').appendChild(legendCanvas);
    
    setupControls();
    setupCanvas();
    
    // Notify extension we're ready
    vscode.postMessage({ type: 'ready' });
  });

  // Setup controls
  function setupControls() {
    // Mode selector
    document.getElementById('modeSelect').addEventListener('change', (e) => {
      currentMode = e.target.value;
      vscode.postMessage({ type: 'changeMode', mode: currentMode });
      updateInfo();
    });

    // Color scheme selector
    document.getElementById('colorSchemeSelect').addEventListener('change', (e) => {
      currentColorScheme = e.target.value;
      vscode.postMessage({ type: 'changeColorScheme', colorScheme: currentColorScheme });
      render();
    });

    // Opacity slider
    const opacitySlider = document.getElementById('opacitySlider');
    const opacityValue = document.getElementById('opacityValue');
    opacitySlider.addEventListener('input', (e) => {
      opacity = e.target.value / 100;
      opacityValue.textContent = `${e.target.value}%`;
      render();
    });

    // Toggle controls
    document.getElementById('toggleGrid').addEventListener('change', (e) => {
      showGrid = e.target.checked;
      render();
    });

    document.getElementById('toggleHotspots').addEventListener('change', (e) => {
      showHotspots = e.target.checked;
      render();
    });

    document.getElementById('toggleLegend').addEventListener('change', (e) => {
      showLegend = e.target.checked;
      legendCanvas.style.display = showLegend ? 'block' : 'none';
    });

    // Action buttons
    document.getElementById('exportBtn').addEventListener('click', () => {
      exportHeatMap();
    });

    document.getElementById('statsBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'showStatistics' });
    });

    document.getElementById('refreshBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'changeMode', mode: currentMode });
    });

    // Canvas hover
    canvas.addEventListener('mousemove', handleCanvasHover);
    canvas.addEventListener('click', handleCanvasClick);
  }

  // Setup canvas
  function setupCanvas() {
    // Set initial size
    resizeCanvas();
    
    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
  }

  // Resize canvas
  function resizeCanvas() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    
    // Leave space for padding
    const maxWidth = rect.width - 20;
    const maxHeight = window.innerHeight - 200;
    
    if (currentHeatMapData) {
      const rows = currentHeatMapData.grid.length;
      const cols = currentHeatMapData.grid[0].length;
      
      // Calculate tile size to fit
      tileSize = Math.min(
        32,
        Math.floor(maxWidth / cols),
        Math.floor(maxHeight / rows)
      );
      
      canvas.width = cols * tileSize;
      canvas.height = rows * tileSize;
    }
  }

  // Handle messages from extension
  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
      case 'updateHeatMap':
        currentHeatMapData = message.heatMapData;
        currentMode = message.mode;
        resizeCanvas();
        render();
        updateInfo();
        updateHotspotsList();
        break;
      
      case 'updateColorScheme':
        currentColorScheme = message.colorScheme;
        render();
        break;
      
      case 'exportToFile':
        // Canvas will be exported by the extension
        break;
      
      case 'error':
        updateStatus(`Error: ${message.message}`, 'error');
        break;
    }
  });

  // Render heat map
  function render() {
    if (!currentHeatMapData) return;

    const scheme = COLOR_SCHEMES[currentColorScheme];
    const { grid, maxValue, minValue } = currentHeatMapData;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw heat map
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const value = grid[row][col];
        const x = col * tileSize;
        const y = row * tileSize;

        // Get color for value
        let color;
        if (value < 0) {
          color = scheme.nullColor;
        } else if (maxValue === minValue) {
          color = scheme.colors[0];
        } else {
          const normalized = (value - minValue) / (maxValue - minValue);
          color = getColorForValue(normalized, scheme.colors);
        }

        // Draw tile
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.fillRect(x, y, tileSize, tileSize);
        ctx.globalAlpha = 1.0;

        // Draw grid if enabled
        if (showGrid) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, tileSize, tileSize);
        }
      }
    }

    // Draw hotspot indicators
    if (showHotspots && currentHeatMapData.hotspots) {
      ctx.globalAlpha = 1.0;
      currentHeatMapData.hotspots.forEach((hotspot, index) => {
        if (index < 5) { // Show top 5
          const x = hotspot.col * tileSize + tileSize / 2;
          const y = hotspot.row * tileSize + tileSize / 2;
          
          // Draw circle indicator
          ctx.beginPath();
          ctx.arc(x, y, tileSize / 3, 0, 2 * Math.PI);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw rank
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${tileSize / 3}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((index + 1).toString(), x, y);
        }
      });
    }

    // Update legend
    if (showLegend) {
      renderLegend();
    }
  }

  // Render legend
  function renderLegend() {
    if (!currentHeatMapData) return;

    const scheme = COLOR_SCHEMES[currentColorScheme];
    const { minValue, maxValue } = currentHeatMapData;
    const width = legendCanvas.width;
    const height = legendCanvas.height;
    const barHeight = height - 60;

    // Clear canvas
    legendCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    legendCtx.fillRect(0, 0, width, height);

    // Draw gradient bar
    const gradient = legendCtx.createLinearGradient(20, 20, 20, 20 + barHeight);
    
    // Add color stops
    scheme.colors.forEach((color, index) => {
      const stop = index / (scheme.colors.length - 1);
      gradient.addColorStop(1 - stop, color); // Invert for top-to-bottom
    });

    legendCtx.fillStyle = gradient;
    legendCtx.fillRect(20, 20, 30, barHeight);

    // Draw border
    legendCtx.strokeStyle = '#FFFFFF';
    legendCtx.lineWidth = 1;
    legendCtx.strokeRect(20, 20, 30, barHeight);

    // Draw labels
    legendCtx.fillStyle = '#FFFFFF';
    legendCtx.font = '11px Arial';
    legendCtx.textAlign = 'left';

    // Max value
    legendCtx.fillText(maxValue.toFixed(0), 55, 25);
    
    // Mid value
    const midValue = (maxValue + minValue) / 2;
    legendCtx.fillText(midValue.toFixed(0), 55, 20 + barHeight / 2);
    
    // Min value
    legendCtx.fillText(minValue.toFixed(0), 55, 20 + barHeight - 5);

    // Draw title
    legendCtx.font = 'bold 12px Arial';
    legendCtx.textAlign = 'center';
    legendCtx.fillText(scheme.name, width / 2, height - 10);
  }

  // Get interpolated color
  function getColorForValue(normalized, colors) {
    // Clamp value
    normalized = Math.max(0, Math.min(1, normalized));

    // Find color segment
    const segments = colors.length - 1;
    const segment = normalized * segments;
    const segmentIndex = Math.floor(segment);
    const segmentFraction = segment - segmentIndex;

    if (segmentIndex >= segments) {
      return colors[colors.length - 1];
    }

    // Interpolate between colors
    const color1 = colors[segmentIndex];
    const color2 = colors[segmentIndex + 1];

    return interpolateColor(color1, color2, segmentFraction);
  }

  // Interpolate between two hex colors
  function interpolateColor(color1, color2, fraction) {
    // Parse hex colors
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    // Interpolate
    const r = Math.round(r1 + (r2 - r1) * fraction);
    const g = Math.round(g1 + (g2 - g1) * fraction);
    const b = Math.round(b1 + (b2 - b1) * fraction);

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Handle canvas hover
  function handleCanvasHover(e) {
    if (!currentHeatMapData) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);
    
    if (row >= 0 && row < currentHeatMapData.grid.length && 
        col >= 0 && col < currentHeatMapData.grid[row].length) {
      const value = currentHeatMapData.grid[row][col];
      const hoverText = `Row: ${row}, Col: ${col}, Value: ${value.toFixed(2)}`;
      document.getElementById('hover-info').textContent = hoverText;
    }
  }

  // Handle canvas click
  function handleCanvasClick(e) {
    if (!currentHeatMapData) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);
    
    if (row >= 0 && row < currentHeatMapData.grid.length && 
        col >= 0 && col < currentHeatMapData.grid[row].length) {
      // Navigate to tile in editor
      vscode.postMessage({ 
        type: 'navigateToHotspot', 
        row: row, 
        col: col 
      });
    }
  }

  // Update info panel
  function updateInfo() {
    const infoContent = document.getElementById('infoContent');
    
    const modeDescriptions = {
      traffic: 'Shows the most frequently traversed paths between key points on the map.',
      accessibility: 'Displays how easily each tile can be reached from starting positions.',
      chokepoint: 'Highlights narrow passages and bottlenecks that restrict movement.'
    };

    infoContent.innerHTML = `
      <p><strong>Mode:</strong> ${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}</p>
      <p>${modeDescriptions[currentMode]}</p>
      ${currentHeatMapData ? `
        <p><strong>Range:</strong> ${currentHeatMapData.minValue.toFixed(2)} - ${currentHeatMapData.maxValue.toFixed(2)}</p>
      ` : ''}
    `;
  }

  // Update hotspots list
  function updateHotspotsList() {
    if (!currentHeatMapData || !currentHeatMapData.hotspots) return;

    const list = document.querySelector('#hotspotsList ul');
    list.innerHTML = '';

    currentHeatMapData.hotspots.slice(0, 5).forEach((hotspot, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="rank">${index + 1}</span>
        <span class="coords">Row ${hotspot.row}, Col ${hotspot.col}</span>
        <span class="value">${hotspot.value.toFixed(2)}</span>
      `;
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => {
        vscode.postMessage({ 
          type: 'navigateToHotspot', 
          row: hotspot.row, 
          col: hotspot.col 
        });
      });
      list.appendChild(li);
    });
  }

  // Export heat map
  function exportHeatMap() {
    if (!currentHeatMapData) {
      updateStatus('No heat map to export', 'error');
      return;
    }

    // Create a temporary canvas with both map and legend
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    
    exportCanvas.width = canvas.width + (showLegend ? legendCanvas.width + 20 : 0);
    exportCanvas.height = Math.max(canvas.height, legendCanvas.height);

    // White background
    exportCtx.fillStyle = '#FFFFFF';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Draw heat map
    exportCtx.drawImage(canvas, 0, 0);

    // Draw legend if shown
    if (showLegend) {
      exportCtx.drawImage(legendCanvas, canvas.width + 20, 0);
    }

    // Convert to blob and download
    exportCanvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `heatmap-${currentMode}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      updateStatus('Heat map exported successfully', 'success');
    }, 'image/png');
  }

  // Update status
  function updateStatus(message, type = 'info') {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = type;
    
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        status.textContent = 'Ready';
        status.className = '';
      }, 3000);
    }
  }
})();