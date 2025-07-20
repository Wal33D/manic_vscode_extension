(function() {
  const vscode = acquireVsCodeApi();
  
  let canvas = null;
  let ctx = null;
  let tileData = [];
  let colorMap = {};
  let scale = 10; // pixels per tile
  let zoomLevel = 1;
  let hoveredTile = null;
  let showGrid = true;
  let showTileIds = true;
  let selectedTiles = [];
  let isSelecting = false;
  let selectionStart = null;
  
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 4;
  const ZOOM_STEP = 0.25;

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('mapCanvas');
    ctx = canvas.getContext('2d');
    
    setupEventListeners();
    setupKeyboardShortcuts();
    vscode.postMessage({ type: 'ready' });
  });

  function setupEventListeners() {
    // Zoom controls
    document.getElementById('zoomIn').addEventListener('click', () => {
      if (zoomLevel < MAX_ZOOM) {
        zoomLevel += ZOOM_STEP;
        updateZoomDisplay();
        renderMap();
      }
    });
    
    document.getElementById('zoomOut').addEventListener('click', () => {
      if (zoomLevel > MIN_ZOOM) {
        zoomLevel -= ZOOM_STEP;
        updateZoomDisplay();
        renderMap();
      }
    });
    
    document.getElementById('zoomReset').addEventListener('click', () => {
      zoomLevel = 1;
      updateZoomDisplay();
      renderMap();
    });
    
    // Toggle controls
    document.getElementById('toggleGrid').addEventListener('change', (e) => {
      showGrid = e.target.checked;
      renderMap();
    });
    
    document.getElementById('toggleIds').addEventListener('change', (e) => {
      showTileIds = e.target.checked;
      renderMap();
    });
    
    // Canvas interactions
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mouseleave', () => {
      hoveredTile = null;
      updateHoverInfo(null);
      if (isSelecting) {
        isSelecting = false;
        selectionStart = null;
      }
    });
    
    // Mouse wheel zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0 && zoomLevel < MAX_ZOOM) {
        zoomLevel = Math.min(zoomLevel + ZOOM_STEP, MAX_ZOOM);
      } else if (e.deltaY > 0 && zoomLevel > MIN_ZOOM) {
        zoomLevel = Math.max(zoomLevel - ZOOM_STEP, MIN_ZOOM);
      }
      updateZoomDisplay();
      renderMap();
    });
    
    // Re-render on scroll for viewport culling optimization
    let scrollTimeout;
    canvas.parentElement.addEventListener('scroll', () => {
      if (tileData.length > 50 || (tileData[0] && tileData[0].length > 50)) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          renderMap();
        }, 50);
      }
    });
  }

  function handleMouseDown(e) {
    if (e.shiftKey) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const tileSize = scale * zoomLevel;
      const col = Math.floor(x / tileSize);
      const row = Math.floor(y / tileSize);
      
      if (row >= 0 && row < tileData.length && col >= 0 && col < tileData[0].length) {
        isSelecting = true;
        selectionStart = { row, col };
        selectedTiles = [];
      }
    }
  }

  function handleMouseUp(e) {
    if (isSelecting && selectionStart) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const tileSize = scale * zoomLevel;
      const col = Math.floor(x / tileSize);
      const row = Math.floor(y / tileSize);
      
      if (row >= 0 && row < tileData.length && col >= 0 && col < tileData[0].length) {
        // Calculate selection rectangle
        const minRow = Math.min(selectionStart.row, row);
        const maxRow = Math.max(selectionStart.row, row);
        const minCol = Math.min(selectionStart.col, col);
        const maxCol = Math.max(selectionStart.col, col);
        
        selectedTiles = [];
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            selectedTiles.push({ row: r, col: c });
          }
        }
        
        vscode.postMessage({
          type: 'tilesSelected',
          tiles: selectedTiles
        });
      }
      
      isSelecting = false;
      selectionStart = null;
      renderMap();
    }
  }

  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const tileSize = scale * zoomLevel;
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);
    
    if (row >= 0 && row < tileData.length && col >= 0 && col < tileData[0].length) {
      hoveredTile = { row, col, tileId: tileData[row][col] };
      updateHoverInfo(hoveredTile);
      
      if (isSelecting && selectionStart) {
        // Update selection preview
        const minRow = Math.min(selectionStart.row, row);
        const maxRow = Math.max(selectionStart.row, row);
        const minCol = Math.min(selectionStart.col, col);
        const maxCol = Math.max(selectionStart.col, col);
        
        selectedTiles = [];
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            selectedTiles.push({ row: r, col: c });
          }
        }
        renderMap();
      }
      
      canvas.style.cursor = e.shiftKey ? 'crosshair' : 'pointer';
    } else {
      hoveredTile = null;
      updateHoverInfo(null);
      canvas.style.cursor = 'default';
    }
  }

  function handleClick(e) {
    if (hoveredTile && !e.shiftKey) {
      vscode.postMessage({
        type: 'tileClick',
        row: hoveredTile.row,
        col: hoveredTile.col,
        tileId: hoveredTile.tileId
      });
    }
  }

  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Zoom shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          if (zoomLevel < MAX_ZOOM) {
            zoomLevel += ZOOM_STEP;
            updateZoomDisplay();
            renderMap();
          }
        } else if (e.key === '-') {
          e.preventDefault();
          if (zoomLevel > MIN_ZOOM) {
            zoomLevel -= ZOOM_STEP;
            updateZoomDisplay();
            renderMap();
          }
        } else if (e.key === '0') {
          e.preventDefault();
          zoomLevel = 1;
          updateZoomDisplay();
          renderMap();
        }
      }
      
      // Toggle shortcuts
      if (e.key === 'g' || e.key === 'G') {
        const gridCheckbox = document.getElementById('toggleGrid');
        gridCheckbox.checked = !gridCheckbox.checked;
        showGrid = gridCheckbox.checked;
        renderMap();
      } else if (e.key === 'i' || e.key === 'I') {
        const idsCheckbox = document.getElementById('toggleIds');
        idsCheckbox.checked = !idsCheckbox.checked;
        showTileIds = idsCheckbox.checked;
        renderMap();
      }
      
      // Clear selection with Escape
      if (e.key === 'Escape' && selectedTiles.length > 0) {
        selectedTiles = [];
        renderMap();
        updateHoverInfo(hoveredTile);
      }
    });
  }

  function updateHoverInfo(tile) {
    const hoverInfo = document.getElementById('hover-info');
    let text = '';
    
    if (tile) {
      const tileName = getTileName(tile.tileId);
      text = `[${tile.row}, ${tile.col}] - Tile ${tile.tileId}: ${tileName}`;
    }
    
    if (selectedTiles.length > 0) {
      const selectionInfo = ` | Selected: ${selectedTiles.length} tiles`;
      text += selectionInfo;
    }
    
    hoverInfo.textContent = text;
  }

  function updateZoomDisplay() {
    document.querySelector('.zoom-level').textContent = `${Math.round(zoomLevel * 100)}%`;
  }

  function getTileName(tileId) {
    const tileNames = {
      1: 'Ground',
      6: 'Lava',
      11: 'Water',
      26: 'Dirt',
      30: 'Loose Rock',
      34: 'Hard Rock',
      38: 'Solid Rock',
      42: 'Crystal Seam',
      46: 'Ore Seam',
      50: 'Recharge Seam',
      // Add more as needed
    };
    
    // Check for reinforced tiles
    if (tileId >= 76 && tileId <= 103) {
      const baseId = tileId - 50;
      const baseName = tileNames[baseId] || `Unknown (${baseId})`;
      return `Reinforced ${baseName}`;
    }
    
    return tileNames[tileId] || 'Unknown';
  }

  function renderMap() {
    if (!tileData || tileData.length === 0) {
      return;
    }
    
    const tileSize = scale * zoomLevel;
    const width = tileData[0].length * tileSize;
    const height = tileData.length * tileSize;
    
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, width, height);
    
    // Calculate visible bounds for performance optimization
    const container = canvas.parentElement;
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    const viewWidth = container.clientWidth;
    const viewHeight = container.clientHeight;
    
    const startCol = Math.max(0, Math.floor(scrollLeft / tileSize) - 1);
    const endCol = Math.min(tileData[0].length, Math.ceil((scrollLeft + viewWidth) / tileSize) + 1);
    const startRow = Math.max(0, Math.floor(scrollTop / tileSize) - 1);
    const endRow = Math.min(tileData.length, Math.ceil((scrollTop + viewHeight) / tileSize) + 1);
    
    // Only render visible tiles for large maps
    const shouldOptimize = tileData.length > 50 || tileData[0].length > 50;
    const renderStartRow = shouldOptimize ? startRow : 0;
    const renderEndRow = shouldOptimize ? endRow : tileData.length;
    const renderStartCol = shouldOptimize ? startCol : 0;
    const renderEndCol = shouldOptimize ? endCol : tileData[0].length;
    
    // Draw tiles
    for (let row = renderStartRow; row < renderEndRow; row++) {
      for (let col = renderStartCol; col < renderEndCol; col++) {
        const tileId = tileData[row][col];
        const color = colorMap[tileId] || { r: 128, g: 128, b: 128 };
        const alpha = color.a !== undefined ? color.a : 1;
        
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
        
        // Draw grid lines for better visibility
        if (showGrid && zoomLevel >= 0.5) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1;
          ctx.strokeRect(col * tileSize, row * tileSize, tileSize, tileSize);
        }
        
        // Draw tile ID if enabled and zoomed in enough
        if (showTileIds && zoomLevel >= 1.5 && tileSize >= 15) {
          ctx.fillStyle = getContrastColor(color);
          ctx.font = `${Math.floor(tileSize / 3)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tileId.toString(), col * tileSize + tileSize / 2, row * tileSize + tileSize / 2);
        }
      }
    }
    
    // Draw selection
    if (selectedTiles.length > 0) {
      ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.8)';
      ctx.lineWidth = 2;
      
      selectedTiles.forEach(tile => {
        ctx.fillRect(tile.col * tileSize, tile.row * tileSize, tileSize, tileSize);
      });
      
      // Draw selection border
      if (selectedTiles.length > 1) {
        const minRow = Math.min(...selectedTiles.map(t => t.row));
        const maxRow = Math.max(...selectedTiles.map(t => t.row));
        const minCol = Math.min(...selectedTiles.map(t => t.col));
        const maxCol = Math.max(...selectedTiles.map(t => t.col));
        
        ctx.strokeRect(
          minCol * tileSize,
          minRow * tileSize,
          (maxCol - minCol + 1) * tileSize,
          (maxRow - minRow + 1) * tileSize
        );
      }
    }
    
    // Highlight hovered tile
    if (hoveredTile) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        hoveredTile.col * tileSize,
        hoveredTile.row * tileSize,
        tileSize,
        tileSize
      );
    }
  }

  function getContrastColor(bgColor) {
    // Calculate relative luminance
    const luminance = (0.299 * bgColor.r + 0.587 * bgColor.g + 0.114 * bgColor.b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  // Handle messages from the extension
  window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.type) {
      case 'updateTiles':
        tileData = message.tiles;
        colorMap = message.colorMap;
        document.getElementById('dimensions').textContent = 
          `Map: ${message.rowcount}×${message.colcount}`;
        renderMap();
        break;
        
      case 'noTiles':
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#666666';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No tiles section found', canvas.width / 2, canvas.height / 2);
        break;
        
      case 'error':
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff6666';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(message.message, canvas.width / 2, canvas.height / 2);
        break;
    }
  });
})();