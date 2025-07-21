// Enhanced Map Editor JavaScript
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
  
  // Selection state
  let selection = null;
  let copiedTiles = null;
  let isSelecting = false;
  let selectionStart = null;
  
  // Zoom and pan state
  let zoomLevel = 1;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let lastPanX = 0;
  let lastPanY = 0;
  
  // Grid state
  let showGrid = true;
  
  // Pattern state
  let selectedPattern = null;
  
  // Mirror state
  let mirrorMode = 'off';
  
  // Layer state
  let currentLayer = mapLayers.find(l => l.id === currentLayerId) || mapLayers[0];
  
  // UI Elements
  const progressOverlay = document.getElementById('progressOverlay');
  const progressText = document.getElementById('progressText');
  const statusMessage = document.getElementById('statusMessage');
  
  // Canvas setup
  const canvas = document.getElementById('mapCanvas');
  const ctx = canvas.getContext('2d');
  const overlayCanvas = document.getElementById('overlayCanvas');
  const overlayCtx = overlayCanvas.getContext('2d');
  
  // Minimap setup
  const minimap = document.getElementById('minimap');
  const minimapCtx = minimap.getContext('2d');
  const minimapContainer = document.getElementById('minimapContainer');
  const minimapViewport = document.getElementById('minimapViewport');
  
  const BASE_TILE_SIZE = 20;
  const TILE_SIZE = BASE_TILE_SIZE;
  
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
    
    initMinimap();
    
    // Use requestAnimationFrame for initial render
    requestAnimationFrame(() => {
      drawMap();
      drawMinimap();
    });
  }
  
  // Initialize minimap
  function initMinimap() {
    const minimapSize = 150;
    const aspectRatio = rows / cols;
    
    if (aspectRatio > 1) {
      minimap.height = minimapSize;
      minimap.width = minimapSize / aspectRatio;
    } else {
      minimap.width = minimapSize;
      minimap.height = minimapSize * aspectRatio;
    }
    
    minimapContainer.style.width = minimap.width + 'px';
    minimapContainer.style.height = minimap.height + 'px';
    
    updateMinimapViewport();
  }
  
  // Draw minimap
  function drawMinimap() {
    if (!minimap || !minimapCtx) return;
    
    minimapCtx.clearRect(0, 0, minimap.width, minimap.height);
    
    const scaleX = minimap.width / cols;
    const scaleY = minimap.height / rows;
    
    // Draw tiles
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tileId = getTileAt(row, col);
        const color = tileColors[tileId] || getDefaultTileColor(tileId);
        
        minimapCtx.fillStyle = color;
        minimapCtx.fillRect(
          col * scaleX,
          row * scaleY,
          scaleX,
          scaleY
        );
      }
    }
    
    updateMinimapViewport();
  }
  
  // Update minimap viewport indicator
  function updateMinimapViewport() {
    if (!minimapViewport || !minimap) return;
    
    const mapContainer = document.getElementById('mapContainer');
    const containerRect = mapContainer.getBoundingClientRect();
    
    const visibleWidth = containerRect.width / zoomLevel;
    const visibleHeight = containerRect.height / zoomLevel;
    
    const scaleX = minimap.width / (cols * BASE_TILE_SIZE);
    const scaleY = minimap.height / (rows * BASE_TILE_SIZE);
    
    const viewportWidth = visibleWidth * scaleX;
    const viewportHeight = visibleHeight * scaleY;
    const viewportX = (-panX / zoomLevel) * scaleX;
    const viewportY = (-panY / zoomLevel) * scaleY;
    
    minimapViewport.style.width = viewportWidth + 'px';
    minimapViewport.style.height = viewportHeight + 'px';
    minimapViewport.style.left = viewportX + 'px';
    minimapViewport.style.top = viewportY + 'px';
  }
  
  // Get tile from current layer
  function getTileAt(row, col) {
    if (!currentLayer || !currentLayer.tiles[row]) return 1;
    return currentLayer.tiles[row][col] || 1;
  }
  
  // Set tile on current layer
  function setTileAt(row, col, tileId) {
    if (!currentLayer || !currentLayer.tiles[row]) return;
    currentLayer.tiles[row][col] = tileId;
  }
  
  // Draw the entire map with layers
  function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw each visible layer
    for (const layer of mapLayers) {
      if (!layer.visible) continue;
      
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      
      if (layer.blendMode && layer.blendMode !== 'normal') {
        ctx.globalCompositeOperation = layer.blendMode;
      }
      
      // Draw layer tiles
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const tileId = layer.tiles[row][col];
          if (tileId !== 0) { // 0 = transparent
            drawTile(col * TILE_SIZE, row * TILE_SIZE, tileId);
          }
        }
      }
      
      ctx.restore();
    }
    
    // Draw grid if enabled
    if (showGrid) {
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
    
    // Update minimap
    drawMinimap();
  }
  
  // Draw a single tile
  function drawTile(x, y, tileId) {
    const color = tileColors[tileId] || getDefaultTileColor(tileId);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  }
  
  // Get default color for unknown tiles
  function getDefaultTileColor(tileId) {
    const hue = (tileId * 137.5) % 360;
    return `hsl(${hue}, 50%, 50%)`;
  }
  
  // Helper to parse color string
  function parseColor(color) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    }
    const div = document.createElement('div');
    div.style.color = color;
    document.body.appendChild(div);
    const rgb = window.getComputedStyle(div).color;
    document.body.removeChild(div);
    const rgbMatch = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) };
    }
    return { r: 128, g: 128, b: 128 };
  }
  
  // Helper to get mirrored positions
  function getMirroredPositions(row, col) {
    const positions = [{ row, col }];
    
    if (mirrorMode === 'horizontal' || mirrorMode === 'both') {
      const mirrorCol = cols - 1 - col;
      positions.push({ row, col: mirrorCol });
    }
    
    if (mirrorMode === 'vertical' || mirrorMode === 'both') {
      const mirrorRow = rows - 1 - row;
      positions.push({ row: mirrorRow, col });
    }
    
    if (mirrorMode === 'both') {
      const mirrorRow = rows - 1 - row;
      const mirrorCol = cols - 1 - col;
      positions.push({ row: mirrorRow, col: mirrorCol });
    }
    
    // Remove duplicates
    const unique = [];
    const seen = new Set();
    for (const pos of positions) {
      const key = `${pos.row},${pos.col}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(pos);
      }
    }
    
    return unique;
  }
  
  // Get tile position from mouse coordinates
  function getTilePos(x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
      return { row: -1, col: -1 };
    }
    
    const rect = canvas.getBoundingClientRect();
    const mapViewport = document.getElementById('mapViewport');
    const transform = window.getComputedStyle(mapViewport).transform;
    
    let offsetX = 0, offsetY = 0;
    if (transform !== 'none') {
      const matrix = new DOMMatrix(transform);
      offsetX = matrix.m41;
      offsetY = matrix.m42;
    }
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const canvasX = ((x - rect.left) * scaleX - offsetX) / zoomLevel;
    const canvasY = ((y - rect.top) * scaleY - offsetY) / zoomLevel;
    
    const col = Math.floor(canvasX / TILE_SIZE);
    const row = Math.floor(canvasY / TILE_SIZE);
    
    const validRow = Math.max(0, Math.min(rows - 1, row));
    const validCol = Math.max(0, Math.min(cols - 1, col));
    
    return { row: validRow, col: validCol };
  }
  
  // Paint tiles with mirroring
  function paintTiles(row, col) {
    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      return;
    }
    
    if (currentLayer.locked) {
      showStatus('Layer is locked', 'error');
      return;
    }
    
    const centerPositions = getMirroredPositions(row, col);
    const tilesToPaint = [];
    const halfSize = Math.floor(brushSize / 2);
    
    for (const center of centerPositions) {
      for (let dr = -halfSize; dr <= halfSize; dr++) {
        for (let dc = -halfSize; dc <= halfSize; dc++) {
          const r = center.row + dr;
          const c = center.col + dc;
          
          if (r >= 0 && r < rows && c >= 0 && c < cols) {
            if (brushSize === 1 || (dr * dr + dc * dc <= halfSize * halfSize)) {
              if (getTileAt(r, c) !== currentTileId) {
                tilesToPaint.push({ row: r, col: c, tileId: currentTileId });
                setTileAt(r, c, currentTileId);
              }
            }
          }
        }
      }
    }
    
    if (tilesToPaint.length > 0) {
      if (!drawScheduled) {
        drawScheduled = true;
        requestAnimationFrame(() => {
          tilesToPaint.forEach(tile => {
            drawTile(tile.col * TILE_SIZE, tile.row * TILE_SIZE, tile.tileId);
          });
          drawScheduled = false;
        });
      }
      
      tilePaintHistory.push(...tilesToPaint);
    }
  }
  
  // Fill region
  function fillRegion(startRow, startCol) {
    if (startRow < 0 || startRow >= rows || startCol < 0 || startCol >= cols) {
      return;
    }
    
    if (currentLayer.locked) {
      showStatus('Layer is locked', 'error');
      return;
    }
    
    const targetTileId = getTileAt(startRow, startCol);
    if (targetTileId === currentTileId) {
      return;
    }
    
    showProgress('Filling region...');
    
    const tilesToFill = [];
    const visited = new Set();
    const queue = [[startRow, startCol]];
    const maxFillSize = 10000;
    
    while (queue.length > 0 && tilesToFill.length < maxFillSize) {
      const [row, col] = queue.shift();
      const key = `${row},${col}`;
      
      if (visited.has(key) || row < 0 || row >= rows || col < 0 || col >= cols) {
        continue;
      }
      
      visited.add(key);
      
      if (getTileAt(row, col) === targetTileId) {
        tilesToFill.push({ row, col, tileId: currentTileId });
        setTileAt(row, col, currentTileId);
        
        queue.push([row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]);
      }
    }
    
    if (tilesToFill.length >= maxFillSize) {
      vscode.postMessage({
        type: 'error',
        message: 'Fill area too large. Maximum 10,000 tiles.'
      });
    }
    
    if (tilesToFill.length > 0) {
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
        tilesToPaint.push({ row, col, tileId: currentTileId });
        setTileAt(row, col, currentTileId);
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
  function drawRectangle(startRow, startCol, endRow, endCol) {
    const tilesToPaint = [];
    
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          tilesToPaint.push({ row, col, tileId: currentTileId });
          setTileAt(row, col, currentTileId);
        }
      }
    }
    
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
  
  // Draw selection
  function drawSelection() {
    if (!selection) return;
    
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    overlayCtx.strokeStyle = '#4ec9b0';
    overlayCtx.lineWidth = 2;
    overlayCtx.fillStyle = 'rgba(78, 201, 176, 0.2)';
    
    const x = Math.min(selection.startCol, selection.endCol) * TILE_SIZE;
    const y = Math.min(selection.startRow, selection.endRow) * TILE_SIZE;
    const width = (Math.abs(selection.endCol - selection.startCol) + 1) * TILE_SIZE;
    const height = (Math.abs(selection.endRow - selection.startRow) + 1) * TILE_SIZE;
    
    overlayCtx.fillRect(x, y, width, height);
    overlayCtx.strokeRect(x, y, width, height);
  }
  
  // Show preview overlay
  function showPreview(row, col) {
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    
    if (currentTool === 'paint') {
      const halfSize = Math.floor(brushSize / 2);
      overlayCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      
      const centerPositions = getMirroredPositions(row, col);
      
      for (const center of centerPositions) {
        for (let dr = -halfSize; dr <= halfSize; dr++) {
          for (let dc = -halfSize; dc <= halfSize; dc++) {
            const r = center.row + dr;
            const c = center.col + dc;
            
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
              if (brushSize === 1 || (dr * dr + dc * dc <= halfSize * halfSize)) {
                overlayCtx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
              }
            }
          }
        }
      }
    } else if (currentTool === 'picker') {
      overlayCtx.strokeStyle = '#4ec9b0';
      overlayCtx.lineWidth = 2;
      overlayCtx.strokeRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    } else if (currentTool === 'stamp' && selectedPattern) {
      overlayCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      overlayCtx.strokeStyle = '#4ec9b0';
      overlayCtx.lineWidth = 2;
      
      for (let r = 0; r < selectedPattern.height; r++) {
        for (let c = 0; c < selectedPattern.width; c++) {
          const targetRow = row + r;
          const targetCol = col + c;
          if (targetRow >= 0 && targetRow < rows && targetCol >= 0 && targetCol < cols) {
            const tileId = selectedPattern.tiles[r][c];
            const color = tileColors[tileId] || getDefaultTileColor(tileId);
            const rgb = parseColor(color);
            overlayCtx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;
            overlayCtx.fillRect(targetCol * TILE_SIZE, targetRow * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        }
      }
      
      overlayCtx.strokeRect(
        col * TILE_SIZE, 
        row * TILE_SIZE, 
        selectedPattern.width * TILE_SIZE, 
        selectedPattern.height * TILE_SIZE
      );
    } else if ((currentTool === 'line' || currentTool === 'rectangle') && startPos) {
      overlayCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      
      if (currentTool === 'line') {
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
      } else if (currentTool === 'rectangle') {
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
    } else if (currentTool === 'select') {
      if (selection) {
        drawSelection();
      }
    }
  }
  
  // Progress indicator
  function showProgress(text) {
    progressText.textContent = text || 'Processing...';
    progressOverlay.classList.add('active');
  }
  
  function hideProgress() {
    progressOverlay.classList.remove('active');
  }
  
  // Status message
  function showStatus(message, type = 'success', duration = 3000) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type} active`;
    
    setTimeout(() => {
      statusMessage.classList.remove('active');
    }, duration);
  }
  
  // Update copy/paste button states
  function updateCopyPasteButtons() {
    const copyBtn = document.getElementById('copyBtn');
    const pasteBtn = document.getElementById('pasteBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const moveBtn = document.getElementById('moveBtn');
    const savePatternBtn = document.getElementById('savePatternBtn');
    
    copyBtn.disabled = !selection;
    deleteBtn.disabled = !selection;
    moveBtn.disabled = !selection;
    pasteBtn.disabled = !copiedTiles;
    savePatternBtn.disabled = !selection;
  }
  
  // Canvas mouse events
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      // Middle mouse or shift+left for panning
      isPanning = true;
      lastPanX = e.clientX;
      lastPanY = e.clientY;
      e.preventDefault();
      return;
    }
    
    const pos = getTilePos(e.clientX, e.clientY);
    
    if (currentTool === 'paint') {
      isDrawing = true;
      tilePaintHistory = [];
      paintTiles(pos.row, pos.col);
    } else if (currentTool === 'fill') {
      fillRegion(pos.row, pos.col);
    } else if (currentTool === 'picker') {
      if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols) {
        const tileId = getTileAt(pos.row, pos.col);
        selectTile(tileId);
        selectTool('paint');
      }
    } else if (currentTool === 'stamp' && selectedPattern) {
      const tilesToStamp = [];
      for (let r = 0; r < selectedPattern.height; r++) {
        for (let c = 0; c < selectedPattern.width; c++) {
          const targetRow = pos.row + r;
          const targetCol = pos.col + c;
          if (targetRow >= 0 && targetRow < rows && targetCol >= 0 && targetCol < cols) {
            tilesToStamp.push({
              row: targetRow,
              col: targetCol,
              tileId: selectedPattern.tiles[r][c]
            });
          }
        }
      }
      
      vscode.postMessage({
        type: 'stampPattern',
        pattern: selectedPattern,
        row: pos.row,
        col: pos.col,
        description: `Stamp pattern "${selectedPattern.name}"`
      });
      
      showStatus(`Stamped pattern "${selectedPattern.name}"`);
    } else if (currentTool === 'line' || currentTool === 'rectangle') {
      startPos = pos;
      isDrawing = true;
    } else if (currentTool === 'select') {
      isSelecting = true;
      selectionStart = pos;
      selection = {
        startRow: pos.row,
        startCol: pos.col,
        endRow: pos.row,
        endCol: pos.col,
        tiles: []
      };
    }
    
    lastPos = pos;
  });
  
  canvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
      const dx = e.clientX - lastPanX;
      const dy = e.clientY - lastPanY;
      
      panX += dx;
      panY += dy;
      
      const mapViewport = document.getElementById('mapViewport');
      mapViewport.style.transform = `scale(${zoomLevel}) translate(${panX/zoomLevel}px, ${panY/zoomLevel}px)`;
      
      lastPanX = e.clientX;
      lastPanY = e.clientY;
      
      updateMinimapViewport();
      return;
    }
    
    const pos = getTilePos(e.clientX, e.clientY);
    
    document.getElementById('coords').textContent = `Row: ${pos.row}, Col: ${pos.col}`;
    
    if (isDrawing) {
      if (currentTool === 'paint') {
        if (!lastPos || lastPos.row !== pos.row || lastPos.col !== pos.col) {
          paintTiles(pos.row, pos.col);
          lastPos = pos;
        }
      } else if (currentTool === 'select' && selectionStart) {
        selection = {
          startRow: selectionStart.row,
          startCol: selectionStart.col,
          endRow: pos.row,
          endCol: pos.col,
          tiles: []
        };
        drawSelection();
      }
    }
    
    showPreview(pos.row, pos.col);
  });
  
  canvas.addEventListener('mouseup', (e) => {
    if (isPanning) {
      isPanning = false;
      return;
    }
    
    if (!isDrawing && !isSelecting) return;
    
    const pos = getTilePos(e.clientX, e.clientY);
    
    if (currentTool === 'paint' && tilePaintHistory.length > 0) {
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
    } else if (currentTool === 'select' && selection) {
      // Normalize selection
      const minRow = Math.min(selection.startRow, selection.endRow);
      const maxRow = Math.max(selection.startRow, selection.endRow);
      const minCol = Math.min(selection.startCol, selection.endCol);
      const maxCol = Math.max(selection.startCol, selection.endCol);
      
      selection.startRow = minRow;
      selection.endRow = maxRow;
      selection.startCol = minCol;
      selection.endCol = maxCol;
      
      // Extract tiles
      selection.tiles = [];
      for (let r = minRow; r <= maxRow; r++) {
        const row = [];
        for (let c = minCol; c <= maxCol; c++) {
          row.push(getTileAt(r, c));
        }
        selection.tiles.push(row);
      }
      
      updateCopyPasteButtons();
      showStatus(`Selected ${(maxRow - minRow + 1)}x${(maxCol - minCol + 1)} region`);
    }
    
    isDrawing = false;
    isSelecting = false;
    startPos = null;
    selectionStart = null;
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  });
  
  canvas.addEventListener('mouseleave', () => {
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    document.getElementById('coords').textContent = 'Row: -, Col: -';
  });
  
  // Prevent context menu on canvas
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
  
  // Map container wheel for zoom
  const mapContainer = document.getElementById('mapContainer');
  mapContainer.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.25, Math.min(3, zoomLevel * delta));
      
      if (newZoom !== zoomLevel) {
        // Adjust pan to zoom around mouse position
        const rect = mapContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const scale = newZoom / zoomLevel;
        panX = mouseX - scale * (mouseX - panX);
        panY = mouseY - scale * (mouseY - panY);
        
        zoomLevel = newZoom;
        updateZoom();
      }
    }
  });
  
  // Tool selection
  function selectTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
    
    if (tool !== 'select') {
      selection = null;
      updateCopyPasteButtons();
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    }
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
    
    if (Number.isInteger(tileId) && tileId >= 1 && tileId <= 115) {
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
  
  // Copy/Paste/Delete/Move
  document.getElementById('copyBtn').addEventListener('click', () => {
    if (selection) {
      copiedTiles = JSON.parse(JSON.stringify(selection));
      vscode.postMessage({
        type: 'copy',
        selection: selection
      });
      showStatus('Selection copied');
    }
  });
  
  document.getElementById('pasteBtn').addEventListener('click', () => {
    if (copiedTiles && currentTool === 'select') {
      selectTool('paint');
      showStatus('Click where you want to paste');
      canvas.style.cursor = 'crosshair';
      canvas.addEventListener('click', pasteHandler);
    }
  });
  
  document.getElementById('deleteBtn').addEventListener('click', () => {
    if (selection) {
      vscode.postMessage({
        type: 'delete',
        selection: selection,
        description: `Delete ${(selection.endRow - selection.startRow + 1)}x${(selection.endCol - selection.startCol + 1)} region`
      });
      
      selection = null;
      updateCopyPasteButtons();
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      showStatus('Selection deleted');
    }
  });
  
  document.getElementById('moveBtn').addEventListener('click', () => {
    if (selection) {
      showStatus('Click where you want to move the selection');
      canvas.style.cursor = 'move';
      canvas.addEventListener('click', moveHandler);
    }
  });
  
  function moveHandler(e) {
    const pos = getTilePos(e.clientX, e.clientY);
    
    if (selection && selection.tiles) {
      vscode.postMessage({
        type: 'move',
        selection: selection,
        targetRow: pos.row,
        targetCol: pos.col,
        description: `Move ${selection.tiles.length}x${selection.tiles[0].length} region`
      });
      
      // Update local tiles
      for (let r = selection.startRow; r <= selection.endRow; r++) {
        for (let c = selection.startCol; c <= selection.endCol; c++) {
          if (r >= 0 && r < rows && c >= 0 && c < cols) {
            setTileAt(r, c, 1); // Ground tile
          }
        }
      }
      
      for (let r = 0; r < selection.tiles.length; r++) {
        for (let c = 0; c < selection.tiles[r].length; c++) {
          const targetRow = pos.row + r;
          const targetCol = pos.col + c;
          if (targetRow >= 0 && targetRow < rows && targetCol >= 0 && targetCol < cols) {
            setTileAt(targetRow, targetCol, selection.tiles[r][c]);
          }
        }
      }
      
      drawMap();
      
      selection = null;
      updateCopyPasteButtons();
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    }
    
    canvas.style.cursor = 'default';
    canvas.removeEventListener('click', moveHandler);
  }
  
  function pasteHandler(e) {
    const pos = getTilePos(e.clientX, e.clientY);
    
    if (copiedTiles && copiedTiles.tiles) {
      const tilesToPaste = [];
      
      for (let r = 0; r < copiedTiles.tiles.length; r++) {
        for (let c = 0; c < copiedTiles.tiles[r].length; c++) {
          const targetRow = pos.row + r;
          const targetCol = pos.col + c;
          
          if (targetRow >= 0 && targetRow < rows && targetCol >= 0 && targetCol < cols) {
            tilesToPaste.push({
              row: targetRow,
              col: targetCol,
              tileId: copiedTiles.tiles[r][c]
            });
          }
        }
      }
      
      vscode.postMessage({
        type: 'paste',
        tiles: tilesToPaste,
        row: pos.row,
        col: pos.col,
        description: `Paste ${copiedTiles.tiles.length}x${copiedTiles.tiles[0].length} region`
      });
      
      // Update local tiles
      tilesToPaste.forEach(tile => {
        setTileAt(tile.row, tile.col, tile.tileId);
      });
      drawMap();
    }
    
    canvas.style.cursor = 'default';
    canvas.removeEventListener('click', pasteHandler);
  }
  
  // Zoom controls
  function updateZoom() {
    const mapViewport = document.getElementById('mapViewport');
    mapViewport.style.transform = `scale(${zoomLevel}) translate(${panX/zoomLevel}px, ${panY/zoomLevel}px)`;
    document.getElementById('zoomLevel').textContent = Math.round(zoomLevel * 100) + '%';
    updateMinimapViewport();
  }
  
  document.getElementById('zoomInBtn').addEventListener('click', () => {
    if (zoomLevel < 3) {
      zoomLevel = Math.min(3, zoomLevel * 1.2);
      updateZoom();
    }
  });
  
  document.getElementById('zoomOutBtn').addEventListener('click', () => {
    if (zoomLevel > 0.25) {
      zoomLevel = Math.max(0.25, zoomLevel / 1.2);
      updateZoom();
    }
  });
  
  document.getElementById('zoomResetBtn').addEventListener('click', () => {
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    updateZoom();
  });
  
  // Grid toggle
  document.getElementById('gridToggleBtn').addEventListener('click', () => {
    showGrid = !showGrid;
    const btn = document.getElementById('gridToggleBtn');
    btn.classList.toggle('active', showGrid);
    drawMap();
    showStatus(showGrid ? 'Grid enabled' : 'Grid disabled');
  });
  
  // Export functionality
  document.getElementById('exportBtn').addEventListener('click', () => {
    const dialog = document.createElement('div');
    dialog.className = 'export-dialog';
    dialog.innerHTML = `
      <div class="export-content">
        <h3>Export Map</h3>
        <label>
          <input type="radio" name="format" value="png" checked> PNG
        </label>
        <label>
          <input type="radio" name="format" value="jpeg"> JPEG
        </label>
        <label>
          <input type="checkbox" id="includeGrid" ${showGrid ? 'checked' : ''}> Include Grid
        </label>
        <div class="export-buttons">
          <button id="exportConfirm">Export</button>
          <button id="exportCancel">Cancel</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    document.getElementById('exportConfirm').onclick = () => {
      const format = dialog.querySelector('input[name="format"]:checked').value;
      const includeGrid = dialog.querySelector('#includeGrid').checked;
      
      vscode.postMessage({
        type: 'export',
        format: format,
        includeGrid: includeGrid
      });
      
      document.body.removeChild(dialog);
    };
    
    document.getElementById('exportCancel').onclick = () => {
      document.body.removeChild(dialog);
    };
  });
  
  function exportMap(path, format, includeGrid) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw map
    tempCtx.drawImage(canvas, 0, 0);
    
    // Draw grid if requested
    if (includeGrid) {
      tempCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      tempCtx.lineWidth = 1;
      
      for (let x = 0; x <= cols; x++) {
        tempCtx.beginPath();
        tempCtx.moveTo(x * TILE_SIZE, 0);
        tempCtx.lineTo(x * TILE_SIZE, rows * TILE_SIZE);
        tempCtx.stroke();
      }
      
      for (let y = 0; y <= rows; y++) {
        tempCtx.beginPath();
        tempCtx.moveTo(0, y * TILE_SIZE);
        tempCtx.lineTo(cols * TILE_SIZE, y * TILE_SIZE);
        tempCtx.stroke();
      }
    }
    
    // Convert to image
    const quality = format === 'jpeg' ? 0.9 : undefined;
    const imageData = tempCanvas.toDataURL(`image/${format}`, quality);
    
    vscode.postMessage({
      type: 'saveExport',
      imageData: imageData,
      path: path
    });
  }
  
  // Mirror mode
  function updateMirrorButtons() {
    document.querySelectorAll('.mirror-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mirror === mirrorMode);
    });
    showStatus(`Mirror mode: ${mirrorMode}`);
  }
  
  document.querySelectorAll('.mirror-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      mirrorMode = btn.dataset.mirror;
      updateMirrorButtons();
    });
  });
  
  // Minimap navigation
  minimap.addEventListener('click', (e) => {
    const rect = minimap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const scaleX = (cols * BASE_TILE_SIZE) / minimap.width;
    const scaleY = (rows * BASE_TILE_SIZE) / minimap.height;
    
    const mapX = x * scaleX;
    const mapY = y * scaleY;
    
    const containerRect = mapContainer.getBoundingClientRect();
    
    panX = -(mapX * zoomLevel - containerRect.width / 2);
    panY = -(mapY * zoomLevel - containerRect.height / 2);
    
    const mapViewport = document.getElementById('mapViewport');
    mapViewport.style.transform = `scale(${zoomLevel}) translate(${panX/zoomLevel}px, ${panY/zoomLevel}px)`;
    
    updateMinimapViewport();
  });
  
  // Minimap drag
  let isDraggingMinimap = false;
  
  minimapViewport.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingMinimap = true;
    minimapViewport.style.cursor = 'grabbing';
  });
  
  window.addEventListener('mousemove', (e) => {
    if (isDraggingMinimap) {
      const rect = minimap.getBoundingClientRect();
      const x = Math.max(0, Math.min(minimap.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(minimap.height, e.clientY - rect.top));
      
      const scaleX = (cols * BASE_TILE_SIZE) / minimap.width;
      const scaleY = (rows * BASE_TILE_SIZE) / minimap.height;
      
      const mapX = x * scaleX;
      const mapY = y * scaleY;
      
      const containerRect = mapContainer.getBoundingClientRect();
      
      panX = -(mapX * zoomLevel - containerRect.width / 2);
      panY = -(mapY * zoomLevel - containerRect.height / 2);
      
      const mapViewport = document.getElementById('mapViewport');
      mapViewport.style.transform = `scale(${zoomLevel}) translate(${panX/zoomLevel}px, ${panY/zoomLevel}px)`;
      
      updateMinimapViewport();
    }
  });
  
  window.addEventListener('mouseup', () => {
    if (isDraggingMinimap) {
      isDraggingMinimap = false;
      minimapViewport.style.cursor = 'grab';
    }
  });
  
  // Pattern functionality
  function updatePatternsList() {
    const patternsList = document.getElementById('patternsList');
    patternsList.innerHTML = '';
    
    savedPatterns.forEach(pattern => {
      const patternDiv = document.createElement('div');
      patternDiv.className = 'pattern-item';
      patternDiv.dataset.patternId = pattern.id;
      
      const preview = document.createElement('div');
      preview.className = 'pattern-preview';
      preview.style.width = `${pattern.width * 16}px`;
      
      for (let r = 0; r < pattern.height; r++) {
        for (let c = 0; c < pattern.width; c++) {
          const tileDiv = document.createElement('div');
          tileDiv.className = 'pattern-tile';
          const tileId = pattern.tiles[r][c];
          const color = tileColors[tileId] || getDefaultTileColor(tileId);
          tileDiv.style.backgroundColor = color;
          preview.appendChild(tileDiv);
        }
      }
      
      const name = document.createElement('div');
      name.className = 'pattern-name';
      name.textContent = pattern.name;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'pattern-delete';
      deleteBtn.textContent = '×';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        vscode.postMessage({
          type: 'deletePattern',
          patternId: pattern.id
        });
      };
      
      patternDiv.appendChild(preview);
      patternDiv.appendChild(name);
      patternDiv.appendChild(deleteBtn);
      
      patternDiv.onclick = () => {
        document.querySelectorAll('.pattern-item').forEach(item => {
          item.classList.remove('selected');
        });
        
        patternDiv.classList.add('selected');
        selectedPattern = pattern;
        
        selectTool('stamp');
      };
      
      patternsList.appendChild(patternDiv);
    });
  }
  
  document.getElementById('savePatternBtn').addEventListener('click', () => {
    if (!selection) {
      showStatus('Please select a region first', 'error');
      return;
    }
    
    const dialog = document.createElement('div');
    dialog.className = 'pattern-dialog';
    dialog.innerHTML = `
      <div class="pattern-dialog-content">
        <h3>Save Pattern</h3>
        <input type="text" id="patternNameInput" placeholder="Enter pattern name" autofocus>
        <div class="pattern-dialog-buttons">
          <button id="savePatternConfirm">Save</button>
          <button id="savePatternCancel">Cancel</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    const input = document.getElementById('patternNameInput');
    const saveBtn = document.getElementById('savePatternConfirm');
    const cancelBtn = document.getElementById('savePatternCancel');
    
    const save = () => {
      const name = input.value.trim();
      if (!name) {
        showStatus('Please enter a pattern name', 'error');
        return;
      }
      
      const pattern = {
        id: Date.now().toString(),
        name: name,
        tiles: selection.tiles,
        width: selection.tiles[0].length,
        height: selection.tiles.length
      };
      
      vscode.postMessage({
        type: 'savePattern',
        pattern: pattern
      });
      
      document.body.removeChild(dialog);
    };
    
    saveBtn.onclick = save;
    cancelBtn.onclick = () => document.body.removeChild(dialog);
    input.onkeypress = (e) => {
      if (e.key === 'Enter') save();
      if (e.key === 'Escape') document.body.removeChild(dialog);
    };
    
    input.focus();
  });
  
  // Layer functionality
  function updateLayersList() {
    const layersList = document.getElementById('layersList');
    layersList.innerHTML = '';
    
    mapLayers.slice().reverse().forEach(layer => {
      const layerDiv = document.createElement('div');
      layerDiv.className = 'layer-item';
      if (layer.id === currentLayerId) {
        layerDiv.classList.add('active');
      }
      
      const header = document.createElement('div');
      header.className = 'layer-header';
      
      const visBtn = document.createElement('button');
      visBtn.className = 'layer-visibility';
      visBtn.textContent = layer.visible ? '👁️' : '👁️‍🗨️';
      visBtn.style.opacity = layer.visible ? '1' : '0.5';
      visBtn.onclick = (e) => {
        e.stopPropagation();
        layer.visible = !layer.visible;
        visBtn.textContent = layer.visible ? '👁️' : '👁️‍🗨️';
        visBtn.style.opacity = layer.visible ? '1' : '0.5';
        drawMap();
        
        vscode.postMessage({
          type: 'updateLayer',
          layer: layer
        });
      };
      
      const name = document.createElement('div');
      name.className = 'layer-name';
      name.textContent = layer.name;
      if (layer.locked) {
        name.textContent += ' 🔒';
      }
      
      header.appendChild(visBtn);
      header.appendChild(name);
      
      const controls = document.createElement('div');
      controls.className = 'layer-controls';
      
      const opacity = document.createElement('input');
      opacity.type = 'range';
      opacity.className = 'layer-opacity';
      opacity.min = '0';
      opacity.max = '1';
      opacity.step = '0.1';
      opacity.value = layer.opacity;
      opacity.onclick = (e) => e.stopPropagation();
      opacity.oninput = () => {
        layer.opacity = parseFloat(opacity.value);
        drawMap();
        
        vscode.postMessage({
          type: 'updateLayer',
          layer: layer
        });
      };
      
      controls.appendChild(opacity);
      
      if (layer.id !== 'base') {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'layer-delete';
        deleteBtn.textContent = '🗑️';
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          vscode.postMessage({
            type: 'deleteLayer',
            layerId: layer.id
          });
        };
        layerDiv.appendChild(deleteBtn);
      }
      
      layerDiv.appendChild(header);
      layerDiv.appendChild(controls);
      
      layerDiv.onclick = () => {
        currentLayerId = layer.id;
        currentLayer = layer;
        updateLayersList();
      };
      
      layersList.appendChild(layerDiv);
    });
  }
  
  document.getElementById('addLayerBtn').addEventListener('click', () => {
    const dialog = document.createElement('div');
    dialog.className = 'layer-dialog';
    dialog.innerHTML = `
      <div class="layer-dialog-content">
        <h3>New Layer</h3>
        <input type="text" id="layerNameInput" placeholder="Enter layer name" autofocus>
        <div class="layer-dialog-buttons">
          <button id="createLayerConfirm">Create</button>
          <button id="createLayerCancel">Cancel</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    const input = document.getElementById('layerNameInput');
    const createBtn = document.getElementById('createLayerConfirm');
    const cancelBtn = document.getElementById('createLayerCancel');
    
    const create = () => {
      const name = input.value.trim() || `Layer ${mapLayers.length + 1}`;
      
      vscode.postMessage({
        type: 'createLayer',
        name: name
      });
      
      document.body.removeChild(dialog);
    };
    
    createBtn.onclick = create;
    cancelBtn.onclick = () => document.body.removeChild(dialog);
    input.onkeypress = (e) => {
      if (e.key === 'Enter') create();
      if (e.key === 'Escape') document.body.removeChild(dialog);
    };
    
    input.focus();
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch(e.key.toLowerCase()) {
        case 'z':
          e.preventDefault();
          vscode.postMessage({ type: 'undo' });
          break;
        case 'y':
          e.preventDefault();
          vscode.postMessage({ type: 'redo' });
          break;
        case 'c':
          if (selection) {
            e.preventDefault();
            document.getElementById('copyBtn').click();
          }
          break;
        case 'v':
          if (copiedTiles) {
            e.preventDefault();
            document.getElementById('pasteBtn').click();
          }
          break;
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
        case 's':
          selectTool('select');
          break;
        case 't':
          selectTool('stamp');
          break;
        case 'm':
          if (selection) {
            document.getElementById('moveBtn').click();
          }
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
        case '+':
        case '=':
          document.getElementById('zoomInBtn').click();
          break;
        case '-':
          document.getElementById('zoomOutBtn').click();
          break;
        case '0':
          document.getElementById('zoomResetBtn').click();
          break;
        case 'g':
          document.getElementById('gridToggleBtn').click();
          break;
        case 'e':
          document.getElementById('exportBtn').click();
          break;
        case 'h':
          if (mirrorMode === 'horizontal') {
            mirrorMode = 'off';
          } else if (mirrorMode === 'vertical') {
            mirrorMode = 'both';
          } else if (mirrorMode === 'both') {
            mirrorMode = 'vertical';
          } else {
            mirrorMode = 'horizontal';
          }
          updateMirrorButtons();
          break;
        case 'v':
          if (!e.ctrlKey && !e.metaKey) {
            if (mirrorMode === 'vertical') {
              mirrorMode = 'off';
            } else if (mirrorMode === 'horizontal') {
              mirrorMode = 'both';
            } else if (mirrorMode === 'both') {
              mirrorMode = 'horizontal';
            } else {
              mirrorMode = 'vertical';
            }
            updateMirrorButtons();
          }
          break;
        case 'b':
          mirrorMode = mirrorMode === 'both' ? 'off' : 'both';
          updateMirrorButtons();
          break;
        case 'Delete':
          if (selection) {
            document.getElementById('deleteBtn').click();
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
      50: 'Recharge Seam'
    };
    
    return tileNames[tileId] || `Tile ${tileId}`;
  }
  
  // Validate dimensions
  if (typeof rows !== 'number' || typeof cols !== 'number' || rows <= 0 || cols <= 0) {
    document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Invalid map dimensions</div>';
    return;
  }
  
  // Initialize
  initCanvas();
  updatePatternsList();
  updateLayersList();
  updateCopyPasteButtons();
  
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
      case 'copyComplete':
        updateCopyPasteButtons();
        break;
      case 'requestExport':
        exportMap(message.path, message.format, message.includeGrid);
        break;
      case 'patternsUpdated':
        savedPatterns = message.patterns;
        updatePatternsList();
        break;
      case 'layersUpdated':
        mapLayers = message.layers;
        currentLayer = mapLayers.find(l => l.id === currentLayerId) || mapLayers[0];
        updateLayersList();
        drawMap();
        break;
    }
  });
})();