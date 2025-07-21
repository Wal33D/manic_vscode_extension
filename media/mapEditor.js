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
  
  // Canvas setup
  const canvas = document.getElementById('mapCanvas');
  const ctx = canvas.getContext('2d');
  const overlayCanvas = document.getElementById('overlayCanvas');
  const overlayCtx = overlayCanvas.getContext('2d');
  
  const TILE_SIZE = 20;
  
  // Initialize canvas
  function initCanvas() {
    const width = cols * TILE_SIZE;
    const height = rows * TILE_SIZE;
    
    canvas.width = width;
    canvas.height = height;
    overlayCanvas.width = width;
    overlayCanvas.height = height;
    
    drawMap();
  }
  
  // Draw the entire map
  function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tileId = tiles[row][col];
        drawTile(col * TILE_SIZE, row * TILE_SIZE, tileId);
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
  
  // Get tile position from mouse coordinates
  function getTilePos(x, y) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;
    
    const col = Math.floor(canvasX / TILE_SIZE);
    const row = Math.floor(canvasY / TILE_SIZE);
    
    return { row, col };
  }
  
  // Paint tiles
  function paintTiles(row, col) {
    const tilesToPaint = [];
    const halfSize = Math.floor(brushSize / 2);
    
    for (let dr = -halfSize; dr <= halfSize; dr++) {
      for (let dc = -halfSize; dc <= halfSize; dc++) {
        const r = row + dr;
        const c = col + dc;
        
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          if (brushSize === 1 || (dr * dr + dc * dc <= halfSize * halfSize)) {
            if (tiles[r][c] !== currentTileId) {
              tilesToPaint.push({ row: r, col: c, tileId: currentTileId });
              tiles[r][c] = currentTileId;
            }
          }
        }
      }
    }
    
    if (tilesToPaint.length > 0) {
      // Update canvas
      tilesToPaint.forEach(tile => {
        drawTile(tile.col * TILE_SIZE, tile.row * TILE_SIZE, tile.tileId);
      });
      
      // Add to history for this stroke
      tilePaintHistory.push(...tilesToPaint);
    }
  }
  
  // Fill region
  function fillRegion(startRow, startCol) {
    const targetTileId = tiles[startRow][startCol];
    if (targetTileId === currentTileId) return;
    
    const tilesToFill = [];
    const visited = new Set();
    const queue = [[startRow, startCol]];
    
    while (queue.length > 0) {
      const [row, col] = queue.shift();
      const key = `${row},${col}`;
      
      if (visited.has(key) || row < 0 || row >= rows || col < 0 || col >= cols) {
        continue;
      }
      
      visited.add(key);
      
      if (tiles[row][col] === targetTileId) {
        tilesToFill.push({ row, col, tileId: currentTileId });
        tiles[row][col] = currentTileId;
        
        // Add neighbors
        queue.push([row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]);
      }
    }
    
    // Send update
    if (tilesToFill.length > 0) {
      vscode.postMessage({
        type: 'paint',
        tiles: tilesToFill,
        description: `Fill region with tile ${currentTileId}`
      });
      drawMap();
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
      const tileId = tiles[pos.row][pos.col];
      selectTile(tileId);
      // Switch back to paint tool
      selectTool('paint');
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
    
    if (!isNaN(tileId) && tileId >= 1 && tileId <= 115) {
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
  });
  
  document.getElementById('redoBtn').addEventListener('click', () => {
    vscode.postMessage({ type: 'redo' });
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
  
  // Initialize
  initCanvas();
  
  // Handle messages from extension
  window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.type) {
      case 'tileInfo':
        // Could show tile info in a tooltip
        break;
    }
  });
})();