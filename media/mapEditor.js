// Map Editor JavaScript
(function() {
  'use strict';

  // State
  let currentTool = 'paint';
  let currentTileId = 1;
  let brushSize = 1;
  let isDrawing = false;
  let startPos = null;
  let lastPos = null;
  let tilePaintHistory = [];
  let drawScheduled = false;
  
  // UI Elements
  const progressOverlay = document.getElementById('progressOverlay');
  const progressText = document.getElementById('progressText');
  const statusMessage = document.getElementById('statusMessage');
  
  // Canvas setup
  const canvas = document.getElementById('mapCanvas');
  const ctx = canvas.getContext('2d');
  const overlayCanvas = document.getElementById('overlayCanvas');
  const overlayCtx = overlayCanvas.getContext('2d');
  
  const TILE_SIZE = 20;
  
  // Initialize canvas
  function initCanvas() {
    // Warn about large maps
    if (rows > 200 || cols > 200) {
      vscode.postMessage({
        type: 'error',
        message: `Large map detected (${rows}x${cols}). Performance may be impacted.`
      });
    }
    
    const width = cols * TILE_SIZE;
    const height = rows * TILE_SIZE;
    
    canvas.width = width;
    canvas.height = height;
    overlayCanvas.width = width;
    overlayCanvas.height = height;
    
    // Use requestAnimationFrame for initial render
    requestAnimationFrame(() => drawMap());
  }
  
  // Draw the entire map with batching for performance
  function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Use image data for better performance on large maps
    if (rows * cols > 10000) {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const tileId = tiles[row][col];
          const color = tileColors[tileId] || getDefaultTileColor(tileId);
          const rgb = parseColor(color);
          
          const x = col * TILE_SIZE;
          const y = row * TILE_SIZE;
          
          for (let dy = 0; dy < TILE_SIZE; dy++) {
            for (let dx = 0; dx < TILE_SIZE; dx++) {
              const idx = ((y + dy) * canvas.width + (x + dx)) * 4;
              data[idx] = rgb.r;
              data[idx + 1] = rgb.g;
              data[idx + 2] = rgb.b;
              data[idx + 3] = 255;
            }
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    } else {
      // Normal rendering for smaller maps
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const tileId = tiles[row][col];
          drawTile(col * TILE_SIZE, row * TILE_SIZE, tileId);
        }
      }
    }
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * TILE_SIZE, 0);
      ctx.lineTo(x * TILE_SIZE, rows * TILE_SIZE);
      ctx.stroke();
    }
    
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * TILE_SIZE);
      ctx.lineTo(cols * TILE_SIZE, y * TILE_SIZE);
      ctx.stroke();
    }
  }
  
  // Draw a single tile
  function drawTile(x, y, tileId) {
    const color = tileColors[tileId] || getDefaultTileColor(tileId);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  }
  
  // Get default color for unknown tiles
  function getDefaultTileColor(tileId) {
    // Generate a color based on tile ID
    const hue = (tileId * 137.5) % 360;
    return `hsl(${hue}, 50%, 50%)`;
  }
  
  // Parse color string to RGB
  function parseColor(color) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    }
    // Fallback for HSL or other formats
    const div = document.createElement('div');
    div.style.color = color;
    document.body.appendChild(div);
    const rgb = window.getComputedStyle(div).color;
    document.body.removeChild(div);
    const rgbMatch = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) };
    }
    return { r: 128, g: 128, b: 128 }; // Default gray
  }
  
  // Get tile position from mouse coordinates with validation
  function getTilePos(x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
      return { row: -1, col: -1 };
    }
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;
    
    const col = Math.floor(canvasX / TILE_SIZE);
    const row = Math.floor(canvasY / TILE_SIZE);
    
    // Ensure valid bounds
    const validRow = Math.max(0, Math.min(rows - 1, row));
    const validCol = Math.max(0, Math.min(cols - 1, col));
    
    return { row: validRow, col: validCol };
  }
  
  // Paint tiles with validation
  function paintTiles(row, col) {
    // Validate coordinates
    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      return;
    }
    const tilesToPaint = [];
    const halfSize = Math.floor(brushSize / 2);
    
    for (let dr = -halfSize; dr <= halfSize; dr++) {
      for (let dc = -halfSize; dc <= halfSize; dc++) {
        const r = row + dr;
        const c = col + dc;
        
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          if (brushSize === 1 || (dr * dr + dc * dc <= halfSize * halfSize)) {
            // Validate tile exists
            if (tiles[r] && tiles[r][c] !== undefined && tiles[r][c] !== currentTileId) {
              tilesToPaint.push({ row: r, col: c, tileId: currentTileId });
              tiles[r][c] = currentTileId;
            }
          }
        }
      }
    }
    
    if (tilesToPaint.length > 0) {
      // Batch update canvas
      if (!drawScheduled) {
        drawScheduled = true;
        requestAnimationFrame(() => {
          tilesToPaint.forEach(tile => {
            drawTile(tile.col * TILE_SIZE, tile.row * TILE_SIZE, tile.tileId);
          });
          drawScheduled = false;
        });
      }
      
      // Add to history for this stroke
      tilePaintHistory.push(...tilesToPaint);
    }
  }
  
  // Fill region with safety limits
  function fillRegion(startRow, startCol) {
    // Validate starting position
    if (startRow < 0 || startRow >= rows || startCol < 0 || startCol >= cols) {
      return;
    }
    
    if (!tiles[startRow] || tiles[startRow][startCol] === undefined) {
      return;
    }
    
    const targetTileId = tiles[startRow][startCol];
    if (targetTileId === currentTileId) return;
    
    // Limit fill size to prevent performance issues
    const MAX_FILL_SIZE = 10000;
    
    const tilesToFill = [];
    const visited = new Set();
    const queue = [[startRow, startCol]];
    let fillCount = 0;
    
    while (queue.length > 0) {
      const [row, col] = queue.shift();
      const key = `${row},${col}`;
      
      if (visited.has(key) || row < 0 || row >= rows || col < 0 || col >= cols) {
        continue;
      }
      
      visited.add(key);
      
      if (tiles[row] && tiles[row][col] === targetTileId) {
        fillCount++;
        if (fillCount > MAX_FILL_SIZE) {
          vscode.postMessage({
            type: 'error',
            message: 'Fill area too large. Please use a smaller region.'
          });
          // Restore original tiles
          tilesToFill.forEach(tile => {
            if (tiles[tile.row]) {
              tiles[tile.row][tile.col] = targetTileId;
            }
          });
          return;
        }
        tilesToFill.push({ row, col, tileId: currentTileId });
        tiles[row][col] = currentTileId;
        
        // Add neighbors
        queue.push([row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]);
      }
    }
    
    // Send update
    if (tilesToFill.length > 0) {
      showProgress('Applying fill...');
      vscode.postMessage({
        type: 'paint',
        tiles: tilesToFill,
        description: `Fill region with tile ${currentTileId}`
      });
      drawMap();
      hideProgress();
      showStatus(`Filled ${tilesToFill.length} tiles`);
    }
  }
  
  // Draw line
  function drawLine(startRow, startCol, endRow, endCol) {
    const tilesToPaint = [];
    
    const dx = Math.abs(endCol - startCol);
    const dy = Math.abs(endRow - startRow);
    const sx = startCol < endCol ? 1 : -1;
    const sy = startRow < endRow ? 1 : -1;
    let err = dx - dy;
    
    let row = startRow;
    let col = startCol;
    
    while (true) {
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        if (tiles[row][col] !== currentTileId) {
          tilesToPaint.push({ row, col, tileId: currentTileId });
          tiles[row][col] = currentTileId;
        }
      }
      
      if (row === endRow && col === endCol) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        col += sx;
      }
      if (e2 < dx) {
        err += dx;
        row += sy;
      }
    }
    
    // Send update
    if (tilesToPaint.length > 0) {
      vscode.postMessage({
        type: 'paint',
        tiles: tilesToPaint,
        description: `Draw line with tile ${currentTileId}`
      });
      drawMap();
      showStatus(`Drew line with ${tilesToPaint.length} tiles`);
    }
  }
  
  // Draw rectangle
  function drawRectangle(startRow, startCol, endRow, endCol, filled = true) {
    const tilesToPaint = [];
    
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          if (filled || row === minRow || row === maxRow || col === minCol || col === maxCol) {
            if (tiles[row][col] !== currentTileId) {
              tilesToPaint.push({ row, col, tileId: currentTileId });
              tiles[row][col] = currentTileId;
            }
          }
        }
      }
    }
    
    // Send update
    if (tilesToPaint.length > 0) {
      vscode.postMessage({
        type: 'paint',
        tiles: tilesToPaint,
        description: `Draw rectangle with tile ${currentTileId}`
      });
      drawMap();
      showStatus(`Drew rectangle with ${tilesToPaint.length} tiles`);
    }
  }
  
  // Show preview overlay
  function showPreview(row, col) {
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    
    if (currentTool === 'paint') {
      // Show brush preview
      const halfSize = Math.floor(brushSize / 2);
      overlayCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      
      for (let dr = -halfSize; dr <= halfSize; dr++) {
        for (let dc = -halfSize; dc <= halfSize; dc++) {
          const r = row + dr;
          const c = col + dc;
          
          if (r >= 0 && r < rows && c >= 0 && c < cols) {
            if (brushSize === 1 || (dr * dr + dc * dc <= halfSize * halfSize)) {
              overlayCtx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
          }
        }
      }
    } else if (currentTool === 'picker') {
      // Show picker preview
      overlayCtx.strokeStyle = '#4ec9b0';
      overlayCtx.lineWidth = 2;
      overlayCtx.strokeRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    } else if ((currentTool === 'line' || currentTool === 'rectangle') && startPos) {
      // Show line or rectangle preview
      overlayCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      
      if (currentTool === 'line') {
        // Simple line preview
        const dx = Math.abs(col - startPos.col);
        const dy = Math.abs(row - startPos.row);
        const sx = startPos.col < col ? 1 : -1;
        const sy = startPos.row < row ? 1 : -1;
        let err = dx - dy;
        
        let r = startPos.row;
        let c = startPos.col;
        
        while (true) {
          if (r >= 0 && r < rows && c >= 0 && c < cols) {
            overlayCtx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
          
          if (r === row && c === col) break;
          
          const e2 = 2 * err;
          if (e2 > -dy) {
            err -= dy;
            c += sx;
          }
          if (e2 < dx) {
            err += dx;
            r += sy;
          }
        }
      } else {
        // Rectangle preview
        const minRow = Math.min(startPos.row, row);
        const maxRow = Math.max(startPos.row, row);
        const minCol = Math.min(startPos.col, col);
        const maxCol = Math.max(startPos.col, col);
        
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
              overlayCtx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
          }
        }
      }
    }
  }
  
  // Canvas mouse events
  canvas.addEventListener('mousedown', (e) => {
    const pos = getTilePos(e.clientX, e.clientY);
    
    if (currentTool === 'paint') {
      isDrawing = true;
      tilePaintHistory = [];
      paintTiles(pos.row, pos.col);
    } else if (currentTool === 'fill') {
      fillRegion(pos.row, pos.col);
    } else if (currentTool === 'picker') {
      // Validate position before picking
      if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols && 
          tiles[pos.row] && tiles[pos.row][pos.col] !== undefined) {
        const tileId = tiles[pos.row][pos.col];
        selectTile(tileId);
        // Switch back to paint tool
        selectTool('paint');
      }
    } else if (currentTool === 'line' || currentTool === 'rectangle') {
      startPos = pos;
      isDrawing = true;
    }
    
    lastPos = pos;
  });
  
  canvas.addEventListener('mousemove', (e) => {
    const pos = getTilePos(e.clientX, e.clientY);
    
    // Update coordinates display
    document.getElementById('coords').textContent = `Row: ${pos.row}, Col: ${pos.col}`;
    
    if (isDrawing) {
      if (currentTool === 'paint') {
        // Paint continuously
        if (!lastPos || lastPos.row !== pos.row || lastPos.col !== pos.col) {
          paintTiles(pos.row, pos.col);
          lastPos = pos;
        }
      }
    }
    
    // Show preview
    showPreview(pos.row, pos.col);
  });
  
  canvas.addEventListener('mouseup', (e) => {
    if (!isDrawing) return;
    
    const pos = getTilePos(e.clientX, e.clientY);
    
    if (currentTool === 'paint' && tilePaintHistory.length > 0) {
      // Send paint history
      vscode.postMessage({
        type: 'paint',
        tiles: tilePaintHistory,
        description: `Paint with tile ${currentTileId}`
      });
      showStatus(`Painted ${tilePaintHistory.length} tiles`);
      tilePaintHistory = [];
    } else if (currentTool === 'line' && startPos) {
      drawLine(startPos.row, startPos.col, pos.row, pos.col);
    } else if (currentTool === 'rectangle' && startPos) {
      drawRectangle(startPos.row, startPos.col, pos.row, pos.col);
    }
    
    isDrawing = false;
    startPos = null;
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  });
  
  canvas.addEventListener('mouseleave', () => {
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    document.getElementById('coords').textContent = 'Row: -, Col: -';
  });
  
  // Tool selection
  function selectTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
  }
  
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectTool(btn.dataset.tool);
    });
  });
  
  // Brush size
  const brushSizeSlider = document.getElementById('brushSize');
  const brushSizeDisplay = document.getElementById('brushSizeDisplay');
  
  brushSizeSlider.addEventListener('input', () => {
    brushSize = parseInt(brushSizeSlider.value);
    brushSizeDisplay.textContent = brushSize;
  });
  
  // Tile selection
  function selectTile(tileId) {
    currentTileId = tileId;
    
    // Update UI
    document.querySelectorAll('.palette-tile').forEach(tile => {
      tile.classList.toggle('selected', parseInt(tile.dataset.tileId) === tileId);
    });
    
    const color = tileColors[tileId] || getDefaultTileColor(tileId);
    document.getElementById('selectedTile').style.backgroundColor = color;
    document.getElementById('selectedTileId').textContent = `${tileId} - ${getTileName(tileId)}`;
  }
  
  document.querySelectorAll('.palette-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      selectTile(parseInt(tile.dataset.tileId));
    });
  });
  
  // Custom tile
  document.getElementById('addCustomTile').addEventListener('click', () => {
    const input = document.getElementById('customTileId');
    const tileId = parseInt(input.value);
    
    // Validate tile ID more strictly
    if (Number.isInteger(tileId) && tileId >= 1 && tileId <= 115) {
      // Add to palette if not already there
      const existing = document.querySelector(`.palette-tile[data-tile-id="${tileId}"]`);
      if (!existing) {
        const tileList = document.getElementById('tileList');
        const div = document.createElement('div');
        div.className = 'palette-tile';
        div.dataset.tileId = tileId;
        div.style.backgroundColor = tileColors[tileId] || getDefaultTileColor(tileId);
        div.title = getTileName(tileId);
        div.innerHTML = `<span class="tile-id">${tileId}</span>`;
        div.addEventListener('click', () => selectTile(tileId));
        tileList.appendChild(div);
      }
      
      selectTile(tileId);
      input.value = '';
    }
  });
  
  // Undo/Redo
  document.getElementById('undoBtn').addEventListener('click', () => {
    vscode.postMessage({ type: 'undo' });
    showStatus('Undo applied');
  });
  
  document.getElementById('redoBtn').addEventListener('click', () => {
    vscode.postMessage({ type: 'redo' });
    showStatus('Redo applied');
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') {
        e.preventDefault();
        vscode.postMessage({ type: 'undo' });
      } else if (e.key === 'y' || (e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        vscode.postMessage({ type: 'redo' });
      }
    } else {
      switch(e.key.toLowerCase()) {
        case 'p':
          selectTool('paint');
          break;
        case 'f':
          selectTool('fill');
          break;
        case 'l':
          selectTool('line');
          break;
        case 'r':
          selectTool('rectangle');
          break;
        case 'k':
          selectTool('picker');
          break;
        case '[':
          if (brushSize > 1) {
            brushSizeSlider.value = brushSize - 1;
            brushSizeSlider.dispatchEvent(new Event('input'));
          }
          break;
        case ']':
          if (brushSize < 10) {
            brushSizeSlider.value = brushSize + 1;
            brushSizeSlider.dispatchEvent(new Event('input'));
          }
          break;
      }
    }
  });
  
  // Get tile name
  function getTileName(tileId) {
    const tileNames = {
      1: 'Ground',
      6: 'Lava',
      11: 'Water',
      26: 'Dirt',
      30: 'Loose Rock',
      34: 'Hard Rock',
      38: 'Solid Rock',
      40: 'Solid Rock',
      42: 'Crystal Seam',
      46: 'Ore Seam',
      50: 'Recharge Seam',
    };
    
    if (tileId >= 51 && tileId <= 100) {
      const baseId = tileId - 50;
      const baseName = tileNames[baseId] || `Tile ${baseId}`;
      return `Reinforced ${baseName}`;
    }
    
    return tileNames[tileId] || `Tile ${tileId}`;
  }
  
  // Show status message
  function showStatus(message, type = 'success', duration = 3000) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type} active`;
    
    setTimeout(() => {
      statusMessage.classList.remove('active');
    }, duration);
  }
  
  // Show progress
  function showProgress(message) {
    progressText.textContent = message;
    progressOverlay.classList.add('active');
  }
  
  // Hide progress
  function hideProgress() {
    progressOverlay.classList.remove('active');
  }
  
  // Validate initial data
  if (!Array.isArray(tiles) || tiles.length === 0) {
    document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Invalid map data</div>';
    return;
  }
  
  if (typeof rows !== 'number' || typeof cols !== 'number' || rows <= 0 || cols <= 0) {
    document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Invalid map dimensions</div>';
    return;
  }
  
  // Initialize
  initCanvas();
  
  // Handle messages from extension
  window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.type) {
      case 'tileInfo':
        // Could show tile info in a tooltip
        break;
      case 'success':
        showStatus(message.message || 'Operation completed successfully');
        break;
      case 'error':
        showStatus(message.message || 'An error occurred', 'error', 5000);
        break;
    }
  });
})();