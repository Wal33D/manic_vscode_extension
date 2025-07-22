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
  
  // Auto-tile state
  let autoTileEnabled = false;
  
  // Validation state
  let validationResult = null;
  let validationHighlights = [];
  
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
      const messageType = autoTileEnabled && supportsAutoTiling(currentTileId) ? 'autoTile' : 'paint';
      vscode.postMessage({
        type: messageType,
        tiles: tilesToFill,
        description: `${autoTileEnabled ? 'Auto-tile fill' : 'Fill region'} with tile ${currentTileId}`
      });
      drawMap();
      hideProgress();
      showStatus(`${autoTileEnabled ? 'Auto-filled' : 'Filled'} ${tilesToFill.length} tiles`);
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
      const messageType = autoTileEnabled && supportsAutoTiling(currentTileId) ? 'autoTile' : 'paint';
      vscode.postMessage({
        type: messageType,
        tiles: tilesToPaint,
        description: `${autoTileEnabled ? 'Auto-tile line' : 'Draw line'} with tile ${currentTileId}`
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
      const messageType = autoTileEnabled && supportsAutoTiling(currentTileId) ? 'autoTile' : 'paint';
      vscode.postMessage({
        type: messageType,
        tiles: tilesToPaint,
        description: `${autoTileEnabled ? 'Auto-tile rectangle' : 'Draw rectangle'} with tile ${currentTileId}`
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
      const messageType = autoTileEnabled && supportsAutoTiling(currentTileId) ? 'autoTile' : 'paint';
      vscode.postMessage({
        type: messageType,
        tiles: tilePaintHistory,
        description: `${autoTileEnabled ? 'Auto-tile' : 'Paint'} with tile ${currentTileId}`
      });
      showStatus(`${autoTileEnabled ? 'Auto-tiled' : 'Painted'} ${tilePaintHistory.length} tiles`);
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
    
    // Update auto-tile button state
    const autoTileBtn = document.getElementById('autoTileBtn');
    const isSupported = supportsAutoTiling(tileId);
    autoTileBtn.disabled = !isSupported;
    if (!isSupported && autoTileEnabled) {
      autoTileEnabled = false;
      autoTileBtn.classList.remove('active');
    }
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
  
  // Auto-tile toggle
  document.getElementById('autoTileBtn').addEventListener('click', () => {
    if (!supportsAutoTiling(currentTileId)) {
      showStatus('Current tile does not support auto-tiling', 'error');
      return;
    }
    
    autoTileEnabled = !autoTileEnabled;
    const btn = document.getElementById('autoTileBtn');
    btn.classList.toggle('active', autoTileEnabled);
    showStatus(autoTileEnabled ? 'Auto-tiling enabled' : 'Auto-tiling disabled');
  });
  
  // Validate button
  document.getElementById('validateBtn').addEventListener('click', () => {
    runValidation();
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
        case 'a':
          document.getElementById('autoTileBtn').click();
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
  
  // Check if a tile supports auto-tiling
  function supportsAutoTiling(tileId) {
    // Wall/Rock tiles
    if (tileId >= 30 && tileId <= 44) return true;
    // Water tiles
    if (tileId >= 11 && tileId <= 16) return true;
    // Lava tiles
    if (tileId >= 6 && tileId <= 10) return true;
    // Crystal tiles
    if (tileId >= 42 && tileId <= 45) return true;
    // Ore tiles
    if (tileId >= 46 && tileId <= 49) return true;
    
    return false;
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
      case 'autoTileSupport':
        // Handle auto-tile support check response if needed
        break;
      case 'validationResult':
        handleValidationResult(message.result);
        break;
    }
  });
  
  // Validation functions
  function runValidation() {
    const btn = document.getElementById('validateBtn');
    btn.classList.add('validating');
    btn.textContent = '⏳ Validating...';
    btn.disabled = true;
    
    showStatus('Running map validation...');
    
    vscode.postMessage({
      type: 'validateMap'
    });
  }
  
  function handleValidationResult(result) {
    const btn = document.getElementById('validateBtn');
    btn.classList.remove('validating');
    btn.textContent = '✓ Validate';
    btn.disabled = false;
    
    validationResult = result;
    showValidationPanel();
  }
  
  function showValidationPanel() {
    // Remove existing panel if any
    const existingPanel = document.querySelector('.validation-panel');
    if (existingPanel) {
      existingPanel.remove();
    }
    
    // Create validation panel
    const panel = document.createElement('div');
    panel.className = 'validation-panel active';
    
    // Group issues by category
    const issuesByCategory = {};
    for (const issue of validationResult.issues) {
      if (!issuesByCategory[issue.category]) {
        issuesByCategory[issue.category] = [];
      }
      issuesByCategory[issue.category].push(issue);
    }
    
    panel.innerHTML = `
      <div class="validation-header">
        <h3>Map Validation Results</h3>
        <button class="validation-close">×</button>
      </div>
      <div class="validation-content">
        <div class="validation-stats">
          <div class="validation-stat">
            <span class="validation-stat-label">Total Tiles:</span>
            <span class="validation-stat-value">${validationResult.statistics.totalTiles}</span>
          </div>
          <div class="validation-stat">
            <span class="validation-stat-label">Walkable Area:</span>
            <span class="validation-stat-value">${Math.round(validationResult.statistics.walkableArea / validationResult.statistics.totalTiles * 100)}%</span>
          </div>
          <div class="validation-stat">
            <span class="validation-stat-label">Resources:</span>
            <span class="validation-stat-value">
              ${validationResult.statistics.resourceCount.crystals} 💎
              ${validationResult.statistics.resourceCount.ore} ⛏️
            </span>
          </div>
        </div>
        
        <div class="validation-issues">
          ${Object.keys(issuesByCategory).map(category => `
            <div class="validation-category">
              <div class="validation-category-header">
                <span class="validation-category-toggle">▼</span>
                <span>${formatCategoryName(category)}</span>
                <span>(${issuesByCategory[category].length})</span>
              </div>
              <div class="validation-issues-list">
                ${issuesByCategory[category].map((issue, index) => `
                  <div class="validation-issue ${issue.type}" data-category="${category}" data-index="${index}">
                    <div class="validation-issue-icon">
                      ${issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️'}
                    </div>
                    <div class="validation-issue-content">
                      <div class="validation-issue-message">${issue.message}</div>
                      ${issue.position ? `
                        <div class="validation-issue-location">
                          Location: [${issue.position.row}, ${issue.position.col}]
                        </div>
                      ` : ''}
                      ${getFixButton(issue)}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        
        ${validationResult.suggestions.length > 0 ? `
          <div class="validation-suggestions">
            <h4>Suggestions</h4>
            ${validationResult.suggestions.map(suggestion => `
              <div class="validation-suggestion">
                <div class="validation-suggestion-message">${suggestion.message}</div>
                <span class="validation-suggestion-priority ${suggestion.priority}">${suggestion.priority}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Add event listeners
    panel.querySelector('.validation-close').addEventListener('click', () => {
      panel.classList.remove('active');
      setTimeout(() => panel.remove(), 300);
      clearValidationHighlights();
    });
    
    // Category toggle
    panel.querySelectorAll('.validation-category-header').forEach(header => {
      header.addEventListener('click', () => {
        const category = header.parentElement;
        category.classList.toggle('collapsed');
      });
    });
    
    // Issue click handlers
    panel.querySelectorAll('.validation-issue').forEach(issue => {
      issue.addEventListener('click', () => {
        const category = issue.dataset.category;
        const index = parseInt(issue.dataset.index);
        const issueData = issuesByCategory[category][index];
        
        if (issueData.position) {
          highlightIssue(issueData);
          centerOnPosition(issueData.position.row, issueData.position.col);
        } else if (issueData.area) {
          highlightArea(issueData.area, issueData.type);
        }
      });
    });
    
    // Fix button handlers
    panel.querySelectorAll('.validation-issue-fix').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fix = btn.dataset.fix;
        const category = btn.closest('.validation-issue').dataset.category;
        const index = parseInt(btn.closest('.validation-issue').dataset.index);
        const issue = issuesByCategory[category][index];
        
        vscode.postMessage({
          type: 'fixValidationIssue',
          issue: issue,
          fix: fix
        });
        
        showStatus(`Applying fix: ${fix}`);
      });
    });
  }
  
  function formatCategoryName(category) {
    return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
  }
  
  function getFixButton(issue) {
    if (issue.message.includes('No Tool Store')) {
      return '<button class="validation-issue-fix" data-fix="addSpawnPoint">Add Spawn Point</button>';
    }
    if (issue.message.includes('isolated area')) {
      return '<button class="validation-issue-fix" data-fix="connectArea">Connect Area</button>';
    }
    return '';
  }
  
  function highlightIssue(issue) {
    clearValidationHighlights();
    
    if (issue.position) {
      const highlight = document.createElement('div');
      highlight.className = `validation-highlight ${issue.type}`;
      highlight.style.left = issue.position.col * TILE_SIZE + 'px';
      highlight.style.top = issue.position.row * TILE_SIZE + 'px';
      highlight.style.width = TILE_SIZE + 'px';
      highlight.style.height = TILE_SIZE + 'px';
      
      document.getElementById('mapViewport').appendChild(highlight);
      validationHighlights.push(highlight);
    }
  }
  
  function highlightArea(area, type) {
    clearValidationHighlights();
    
    for (const pos of area) {
      const highlight = document.createElement('div');
      highlight.className = `validation-highlight ${type}`;
      highlight.style.left = pos.col * TILE_SIZE + 'px';
      highlight.style.top = pos.row * TILE_SIZE + 'px';
      highlight.style.width = TILE_SIZE + 'px';
      highlight.style.height = TILE_SIZE + 'px';
      
      document.getElementById('mapViewport').appendChild(highlight);
      validationHighlights.push(highlight);
    }
  }
  
  function clearValidationHighlights() {
    validationHighlights.forEach(h => h.remove());
    validationHighlights = [];
  }
  
  function centerOnPosition(row, col) {
    const mapContainer = document.getElementById('mapContainer');
    const containerRect = mapContainer.getBoundingClientRect();
    
    const targetX = col * TILE_SIZE * zoomLevel;
    const targetY = row * TILE_SIZE * zoomLevel;
    
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    
    panX = centerX - targetX;
    panY = centerY - targetY;
    
    const mapViewport = document.getElementById('mapViewport');
    mapViewport.style.transform = `scale(${zoomLevel}) translate(${panX/zoomLevel}px, ${panY/zoomLevel}px)`;
    
    updateMinimapViewport();
  }
  
  // Template Gallery functionality
  let selectedTemplate = null;
  let templates = [];
  
  // Template button
  document.getElementById('templateBtn').addEventListener('click', () => {
    showTemplateGallery();
  });
  
  // Close template gallery
  document.getElementById('templateClose').addEventListener('click', () => {
    hideTemplateGallery();
  });
  
  // Template category selection
  document.querySelectorAll('.template-category').forEach(cat => {
    cat.addEventListener('click', (e) => {
      const category = e.currentTarget.dataset.category;
      filterTemplates(category);
      
      // Update active state
      document.querySelectorAll('.template-category').forEach(c => c.classList.remove('active'));
      e.currentTarget.classList.add('active');
    });
  });
  
  // Template details close
  document.getElementById('templateDetailsClose').addEventListener('click', () => {
    hideTemplateDetails();
  });
  
  // Use template button
  document.getElementById('templateUseBtn').addEventListener('click', () => {
    if (selectedTemplate) {
      useTemplate(selectedTemplate);
    }
  });
  
  // Customize template button
  document.getElementById('templateCustomizeBtn').addEventListener('click', () => {
    if (selectedTemplate) {
      useTemplate(selectedTemplate);
      hideTemplateGallery();
      showStatus('Template loaded. You can now customize it.');
    }
  });
  
  // Save as template
  document.getElementById('saveTemplateConfirm').addEventListener('click', () => {
    saveAsTemplate();
  });
  
  document.getElementById('saveTemplateCancel').addEventListener('click', () => {
    hideSaveTemplateDialog();
  });
  
  // Template gallery functions
  function showTemplateGallery() {
    document.getElementById('templateGallery').classList.add('active');
    loadTemplates();
  }
  
  function hideTemplateGallery() {
    document.getElementById('templateGallery').classList.remove('active');
    hideTemplateDetails();
  }
  
  function loadTemplates() {
    // Request templates from extension
    vscode.postMessage({
      type: 'getTemplates'
    });
  }
  
  function displayTemplates(templateList) {
    templates = templateList;
    const grid = document.getElementById('templateGrid');
    grid.innerHTML = '';
    
    if (templates.length === 0) {
      grid.innerHTML = `
        <div class="template-empty">
          <div class="template-empty-icon">📋</div>
          <div class="template-empty-text">No templates available</div>
        </div>
      `;
      return;
    }
    
    templates.forEach(template => {
      const card = createTemplateCard(template);
      grid.appendChild(card);
    });
  }
  
  function createTemplateCard(template) {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.dataset.templateId = template.id;
    
    // Create preview
    const preview = document.createElement('div');
    preview.className = 'template-preview';
    
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = template.size.cols * 8;
    previewCanvas.height = template.size.rows * 8;
    renderTemplatePreview(previewCanvas, template);
    preview.appendChild(previewCanvas);
    
    // Add difficulty badge
    const difficulty = document.createElement('div');
    difficulty.className = `template-difficulty ${template.difficulty}`;
    difficulty.textContent = template.difficulty;
    preview.appendChild(difficulty);
    
    card.appendChild(preview);
    
    // Add info
    const info = document.createElement('div');
    info.className = 'template-info';
    
    const name = document.createElement('div');
    name.className = 'template-name';
    name.textContent = template.name;
    info.appendChild(name);
    
    const description = document.createElement('div');
    description.className = 'template-description';
    description.textContent = template.description;
    info.appendChild(description);
    
    const meta = document.createElement('div');
    meta.className = 'template-meta';
    
    const size = document.createElement('div');
    size.className = 'template-size';
    size.innerHTML = `📐 ${template.size.rows}×${template.size.cols}`;
    meta.appendChild(size);
    
    if (template.objectives && template.objectives.length > 0) {
      const objectives = document.createElement('div');
      objectives.className = 'template-objectives';
      objectives.innerHTML = `🎯 ${template.objectives.length} objectives`;
      meta.appendChild(objectives);
    }
    
    info.appendChild(meta);
    card.appendChild(info);
    
    // Click handler
    card.addEventListener('click', () => {
      selectTemplate(template);
    });
    
    return card;
  }
  
  function renderTemplatePreview(canvas, template) {
    const ctx = canvas.getContext('2d');
    const scale = Math.min(canvas.width / template.size.cols, canvas.height / template.size.rows);
    
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Render tiles
    for (let r = 0; r < template.tiles.length; r++) {
      for (let c = 0; c < template.tiles[r].length; c++) {
        const tileId = template.tiles[r][c];
        const color = tileColors[tileId] || '#666666';
        
        ctx.fillStyle = color;
        ctx.fillRect(c * scale, r * scale, scale, scale);
      }
    }
  }
  
  function filterTemplates(category) {
    const filteredTemplates = category === 'all' 
      ? templates 
      : templates.filter(t => t.category === category);
    
    displayTemplates(filteredTemplates);
  }
  
  function selectTemplate(template) {
    selectedTemplate = template;
    
    // Update selected state
    document.querySelectorAll('.template-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.templateId === template.id);
    });
    
    showTemplateDetails(template);
  }
  
  function showTemplateDetails(template) {
    const details = document.getElementById('templateDetails');
    details.classList.add('active');
    
    // Update title
    document.getElementById('templateDetailsTitle').textContent = template.name;
    
    // Update description
    document.getElementById('templateDetailsDescription').textContent = template.description;
    
    // Update objectives
    const objectivesList = document.getElementById('templateDetailsObjectives');
    objectivesList.innerHTML = '';
    if (template.objectives) {
      template.objectives.forEach(obj => {
        const li = document.createElement('li');
        li.textContent = obj;
        objectivesList.appendChild(li);
      });
    }
    
    // Update properties
    const properties = document.getElementById('templateDetailsProperties');
    properties.innerHTML = `
      <div>Size: ${template.size.rows} × ${template.size.cols}</div>
      <div>Difficulty: ${template.difficulty}</div>
      <div>Category: ${template.category}</div>
      ${template.info?.biome ? `<div>Biome: ${template.info.biome}</div>` : ''}
      ${template.info?.creator ? `<div>Creator: ${template.info.creator}</div>` : ''}
    `;
    
    // Render large preview
    const previewCanvas = document.getElementById('templatePreviewCanvas');
    previewCanvas.width = 360;
    previewCanvas.height = 360;
    renderTemplatePreview(previewCanvas, template);
  }
  
  function hideTemplateDetails() {
    document.getElementById('templateDetails').classList.remove('active');
  }
  
  function useTemplate(template) {
    vscode.postMessage({
      type: 'useTemplate',
      template: template
    });
  }
  
  function showSaveTemplateDialog() {
    document.getElementById('saveTemplateDialog').style.display = 'flex';
    document.getElementById('templateName').value = '';
    document.getElementById('templateDescription').value = '';
    document.getElementById('templateObjectives').value = '';
  }
  
  function hideSaveTemplateDialog() {
    document.getElementById('saveTemplateDialog').style.display = 'none';
  }
  
  function saveAsTemplate() {
    const name = document.getElementById('templateName').value.trim();
    const description = document.getElementById('templateDescription').value.trim();
    const objectivesText = document.getElementById('templateObjectives').value.trim();
    
    if (!name) {
      showStatus('Please enter a template name', 'error');
      return;
    }
    
    const objectives = objectivesText ? objectivesText.split('\n').filter(o => o.trim()) : [];
    
    vscode.postMessage({
      type: 'saveAsTemplate',
      name: name,
      description: description,
      objectives: objectives,
      tiles: tiles
    });
    
    hideSaveTemplateDialog();
  }
  
  // Add keyboard shortcut for templates
  window.addEventListener('keydown', (e) => {
    if (e.key === 't' || e.key === 'T') {
      if (!e.ctrlKey && !e.metaKey && !e.altKey && 
          e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        showTemplateGallery();
      }
    }
    
    // Ctrl+Shift+S to save as template
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's') {
      e.preventDefault();
      showSaveTemplateDialog();
    }
  });
  
  // Handle template messages
  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
      case 'templates':
        displayTemplates(message.templates);
        break;
      case 'templateSaved':
        showStatus('Template saved successfully');
        loadTemplates(); // Reload templates
        break;
      case 'templateLoaded':
        hideTemplateGallery();
        tiles = message.tiles;
        render();
        showStatus('Template loaded successfully');
        break;
      case 'selectionResult':
        handleAdvancedSelection(message.selection);
        break;
      case 'selectionModified':
        handleModifiedSelection(message.selection);
        break;
    }
  });
  
  // Advanced selection state
  let lassoPath = [];
  let polygonVertices = [];
  let isDrawingLasso = false;
  let isDrawingPolygon = false;
  let advancedSelection = null;
  
  // Handle advanced selection result
  function handleAdvancedSelection(selectionData) {
    advancedSelection = selectionData;
    selection = {
      startRow: selectionData.bounds.minRow,
      startCol: selectionData.bounds.minCol,
      endRow: selectionData.bounds.maxRow,
      endCol: selectionData.bounds.maxCol,
      points: selectionData.points
    };
    
    // Enable selection tools
    document.getElementById('copyBtn').disabled = false;
    document.getElementById('deleteBtn').disabled = false;
    document.getElementById('moveBtn').disabled = false;
    document.getElementById('selectionOptions').style.display = 'flex';
    
    render();
    showStatus(`Selected ${selectionData.points.length} tiles`);
  }
  
  // Handle modified selection
  function handleModifiedSelection(selectionData) {
    handleAdvancedSelection(selectionData);
  }
  
  // Advanced selection tool handlers
  function startMagicWand(row, col) {
    vscode.postMessage({
      type: 'advancedSelect',
      mode: 'magic_wand',
      params: {
        row: row,
        col: col,
        tolerance: 0
      }
    });
  }
  
  function startLasso() {
    isDrawingLasso = true;
    lassoPath = [];
    canvas.style.cursor = 'crosshair';
  }
  
  function addLassoPoint(row, col) {
    lassoPath.push({ row, col });
    drawLassoPath();
  }
  
  function completeLasso() {
    if (lassoPath.length >= 3) {
      vscode.postMessage({
        type: 'advancedSelect',
        mode: 'lasso',
        params: { path: lassoPath }
      });
    }
    isDrawingLasso = false;
    lassoPath = [];
    canvas.style.cursor = 'default';
  }
  
  function drawLassoPath() {
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    if (lassoPath.length > 0) {
      overlayCtx.strokeStyle = '#4ec9b0';
      overlayCtx.lineWidth = 2;
      overlayCtx.setLineDash([5, 5]);
      overlayCtx.beginPath();
      overlayCtx.moveTo(lassoPath[0].col * TILE_SIZE + TILE_SIZE/2, lassoPath[0].row * TILE_SIZE + TILE_SIZE/2);
      
      for (let i = 1; i < lassoPath.length; i++) {
        overlayCtx.lineTo(lassoPath[i].col * TILE_SIZE + TILE_SIZE/2, lassoPath[i].row * TILE_SIZE + TILE_SIZE/2);
      }
      
      overlayCtx.stroke();
      overlayCtx.setLineDash([]);
    }
  }
  
  function startEllipse() {
    // Similar to rectangle selection
    currentTool = 'ellipse_select';
  }
  
  function drawEllipseSelection(startRow, startCol, endRow, endCol) {
    const centerRow = (startRow + endRow) / 2;
    const centerCol = (startCol + endCol) / 2;
    const radiusRows = Math.abs(endRow - startRow) / 2;
    const radiusCols = Math.abs(endCol - startCol) / 2;
    
    vscode.postMessage({
      type: 'advancedSelect',
      mode: 'ellipse',
      params: {
        centerRow: centerRow,
        centerCol: centerCol,
        radiusRows: radiusRows,
        radiusCols: radiusCols
      }
    });
  }
  
  function startPolygon() {
    isDrawingPolygon = true;
    polygonVertices = [];
    canvas.style.cursor = 'crosshair';
  }
  
  function addPolygonVertex(row, col) {
    polygonVertices.push({ row, col });
    drawPolygonPath();
  }
  
  function completePolygon() {
    if (polygonVertices.length >= 3) {
      vscode.postMessage({
        type: 'advancedSelect',
        mode: 'polygon',
        params: { vertices: polygonVertices }
      });
    }
    isDrawingPolygon = false;
    polygonVertices = [];
    canvas.style.cursor = 'default';
  }
  
  function drawPolygonPath() {
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    if (polygonVertices.length > 0) {
      overlayCtx.strokeStyle = '#4ec9b0';
      overlayCtx.lineWidth = 2;
      overlayCtx.beginPath();
      overlayCtx.moveTo(polygonVertices[0].col * TILE_SIZE + TILE_SIZE/2, polygonVertices[0].row * TILE_SIZE + TILE_SIZE/2);
      
      for (let i = 1; i < polygonVertices.length; i++) {
        overlayCtx.lineTo(polygonVertices[i].col * TILE_SIZE + TILE_SIZE/2, polygonVertices[i].row * TILE_SIZE + TILE_SIZE/2);
      }
      
      // Close path preview
      overlayCtx.setLineDash([5, 5]);
      overlayCtx.lineTo(polygonVertices[0].col * TILE_SIZE + TILE_SIZE/2, polygonVertices[0].row * TILE_SIZE + TILE_SIZE/2);
      overlayCtx.stroke();
      overlayCtx.setLineDash([]);
      
      // Draw vertices
      overlayCtx.fillStyle = '#4ec9b0';
      polygonVertices.forEach(v => {
        overlayCtx.fillRect(v.col * TILE_SIZE + TILE_SIZE/2 - 2, v.row * TILE_SIZE + TILE_SIZE/2 - 2, 4, 4);
      });
    }
  }
  
  // Selection modification functions
  function expandSelection() {
    if (selection) {
      vscode.postMessage({
        type: 'modifySelection',
        operation: 'expand',
        selection: advancedSelection || {
          points: getSelectionPoints(),
          bounds: {
            minRow: Math.min(selection.startRow, selection.endRow),
            maxRow: Math.max(selection.startRow, selection.endRow),
            minCol: Math.min(selection.startCol, selection.endCol),
            maxCol: Math.max(selection.startCol, selection.endCol)
          }
        }
      });
    }
  }
  
  function contractSelection() {
    if (selection) {
      vscode.postMessage({
        type: 'modifySelection',
        operation: 'contract',
        selection: advancedSelection || {
          points: getSelectionPoints(),
          bounds: {
            minRow: Math.min(selection.startRow, selection.endRow),
            maxRow: Math.max(selection.startRow, selection.endRow),
            minCol: Math.min(selection.startCol, selection.endCol),
            maxCol: Math.max(selection.startCol, selection.endCol)
          }
        }
      });
    }
  }
  
  function invertSelection() {
    if (selection) {
      vscode.postMessage({
        type: 'modifySelection',
        operation: 'invert',
        selection: advancedSelection || {
          points: getSelectionPoints(),
          bounds: {
            minRow: Math.min(selection.startRow, selection.endRow),
            maxRow: Math.max(selection.startRow, selection.endRow),
            minCol: Math.min(selection.startCol, selection.endCol),
            maxCol: Math.max(selection.startCol, selection.endCol)
          }
        }
      });
    }
  }
  
  function selectAll() {
    const points = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        points.push({ row: r, col: c });
      }
    }
    
    handleAdvancedSelection({
      points: points,
      bounds: {
        minRow: 0,
        maxRow: rows - 1,
        minCol: 0,
        maxCol: cols - 1
      }
    });
  }
  
  function selectByTileType() {
    const tileType = getTileAt(Math.floor(rows/2), Math.floor(cols/2)); // Use center tile as example
    const input = prompt(`Select all tiles of type (current: ${tileType}):`);
    
    if (input && !isNaN(parseInt(input))) {
      vscode.postMessage({
        type: 'modifySelection',
        operation: 'selectByType',
        selection: { tileType: parseInt(input) }
      });
    }
  }
  
  function getSelectionPoints() {
    const points = [];
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);
    
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        points.push({ row: r, col: c });
      }
    }
    
    return points;
  }
  
  // Update mouse handlers for advanced selection tools
  const originalMouseDown = canvas.onmousedown;
  canvas.onmousedown = function(e) {
    const pos = getCanvasPosition(e);
    
    if (currentTool === 'magic_wand') {
      startMagicWand(pos.row, pos.col);
    } else if (currentTool === 'lasso') {
      if (!isDrawingLasso) {
        startLasso();
      }
      addLassoPoint(pos.row, pos.col);
    } else if (currentTool === 'polygon') {
      if (!isDrawingPolygon) {
        startPolygon();
      }
      addPolygonVertex(pos.row, pos.col);
    } else if (currentTool === 'ellipse') {
      startPos = pos;
      isDrawing = true;
    } else {
      originalMouseDown.call(this, e);
    }
  };
  
  const originalMouseMove = canvas.onmousemove;
  canvas.onmousemove = function(e) {
    const pos = getCanvasPosition(e);
    
    if (isDrawingLasso) {
      addLassoPoint(pos.row, pos.col);
    } else if (currentTool === 'ellipse' && isDrawing && startPos) {
      // Draw ellipse preview
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      overlayCtx.strokeStyle = '#4ec9b0';
      overlayCtx.lineWidth = 2;
      
      const centerX = ((startPos.col + pos.col) / 2) * TILE_SIZE + TILE_SIZE/2;
      const centerY = ((startPos.row + pos.row) / 2) * TILE_SIZE + TILE_SIZE/2;
      const radiusX = Math.abs(pos.col - startPos.col) * TILE_SIZE / 2;
      const radiusY = Math.abs(pos.row - startPos.row) * TILE_SIZE / 2;
      
      overlayCtx.beginPath();
      overlayCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      overlayCtx.stroke();
    } else {
      originalMouseMove.call(this, e);
    }
  };
  
  const originalMouseUp = canvas.onmouseup;
  canvas.onmouseup = function(e) {
    const pos = getCanvasPosition(e);
    
    if (currentTool === 'ellipse' && isDrawing && startPos) {
      drawEllipseSelection(startPos.row, startPos.col, pos.row, pos.col);
      isDrawing = false;
      startPos = null;
    } else {
      originalMouseUp.call(this, e);
    }
  };
  
  // Add double-click handler for completing shapes
  canvas.ondblclick = function(e) {
    if (isDrawingLasso) {
      completeLasso();
    } else if (isDrawingPolygon) {
      completePolygon();
    }
  };
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'w' || e.key === 'W') {
      selectTool('magic_wand');
    } else if (e.key === 'o' || e.key === 'O') {
      selectTool('lasso');
    } else if (e.key === 'e' || e.key === 'E') {
      selectTool('ellipse');
    } else if (e.key === 'g' || e.key === 'G') {
      selectTool('polygon');
    } else if (e.ctrlKey && e.key === 'a') {
      e.preventDefault();
      selectAll();
    } else if (e.key === 'Escape') {
      if (isDrawingLasso) {
        completeLasso();
      } else if (isDrawingPolygon) {
        completePolygon();
      }
    }
  });
  
  // Add button event listeners
  document.getElementById('expandSelectionBtn').addEventListener('click', expandSelection);
  document.getElementById('contractSelectionBtn').addEventListener('click', contractSelection);
  document.getElementById('invertSelectionBtn').addEventListener('click', invertSelection);
  document.getElementById('selectAllBtn').addEventListener('click', selectAll);
  document.getElementById('selectByTypeBtn').addEventListener('click', selectByTileType);
  
  // Update selectTool function to handle advanced tools
  const originalSelectTool = window.selectTool;
  window.selectTool = function(tool) {
    // Show/hide selection options based on tool
    const selectionTools = ['select', 'magic_wand', 'lasso', 'ellipse', 'polygon'];
    document.getElementById('selectionOptions').style.display = 
      selectionTools.includes(tool) && selection ? 'flex' : 'none';
    
    // Reset drawing states
    if (isDrawingLasso) completeLasso();
    if (isDrawingPolygon) completePolygon();
    
    originalSelectTool(tool);
  };
  
  // Update drawSelection to handle advanced selections
  const originalDrawSelection = window.drawSelection;
  window.drawSelection = function() {
    if (advancedSelection && advancedSelection.points) {
      // Draw advanced selection with individual points
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#4ec9b0';
      
      advancedSelection.points.forEach(point => {
        ctx.fillRect(
          point.col * TILE_SIZE,
          point.row * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE
        );
      });
      
      ctx.restore();
      
      // Draw selection outline
      ctx.strokeStyle = '#4ec9b0';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      // Simple bounding box for now
      const bounds = advancedSelection.bounds;
      ctx.strokeRect(
        bounds.minCol * TILE_SIZE,
        bounds.minRow * TILE_SIZE,
        (bounds.maxCol - bounds.minCol + 1) * TILE_SIZE,
        (bounds.maxRow - bounds.minRow + 1) * TILE_SIZE
      );
      
      ctx.setLineDash([]);
    } else if (originalDrawSelection) {
      originalDrawSelection();
    }
  };
})();