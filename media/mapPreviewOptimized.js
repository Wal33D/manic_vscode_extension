/**
 * Optimized map preview with advanced rendering techniques
 * Implements tile culling, LOD, and performance monitoring
 */

(function() {
  const vscode = acquireVsCodeApi();
  
  let canvas = null;
  let ctx = null;
  let offscreenCanvas = null;
  let offscreenCtx = null;
  let tileData = [];
  let colorMap = {};
  let scale = 10;
  let zoomLevel = 1;
  let hoveredTile = null;
  let showGrid = true;
  let showTileIds = true;
  let selectedTiles = [];
  let isSelecting = false;
  let selectionStart = null;
  
  // Performance optimization
  let renderStats = {
    fps: 0,
    frameTime: 0,
    renderedTiles: 0,
    culledTiles: 0,
    lastFrameTime: 0,
    frameCount: 0,
    fpsUpdateTime: 0
  };
  
  let tileCache = new Map();
  let renderThrottled = null;
  let qualityMode = 'auto'; // 'auto', 'high', 'medium', 'low'
  
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 4;
  const ZOOM_STEP = 0.25;

  document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('mapCanvas');
    ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false
    });
    
    // Create offscreen canvas for double buffering
    offscreenCanvas = document.createElement('canvas');
    offscreenCtx = offscreenCanvas.getContext('2d', {
      alpha: false,
      desynchronized: true
    });
    
    setupEventListeners();
    setupKeyboardShortcuts();
    setupPerformanceMonitor();
    
    // Create throttled render function
    renderThrottled = throttleRender(renderMap, 16);
    
    vscode.postMessage({ type: 'ready' });
  });

  function setupPerformanceMonitor() {
    // Add performance stats display
    const perfDiv = document.createElement('div');
    perfDiv.id = 'performance-stats';
    perfDiv.style.cssText = 'position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: #fff; padding: 5px; font-size: 11px; display: none;';
    document.querySelector('.map-preview-container').appendChild(perfDiv);
    
    // Toggle performance display with 'P' key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') {
        perfDiv.style.display = perfDiv.style.display === 'none' ? 'block' : 'none';
      }
    });
    
    // Update performance stats every frame
    setInterval(updatePerformanceDisplay, 100);
  }

  function updatePerformanceDisplay() {
    const perfDiv = document.getElementById('performance-stats');
    if (perfDiv && perfDiv.style.display !== 'none') {
      const totalTiles = tileData.length * (tileData[0]?.length || 0);
      const efficiency = totalTiles > 0 ? 
        ((renderStats.renderedTiles / totalTiles) * 100).toFixed(1) : 0;
      
      perfDiv.innerHTML = `
        FPS: ${renderStats.fps}<br>
        Frame: ${renderStats.frameTime.toFixed(1)}ms<br>
        Rendered: ${renderStats.renderedTiles}/${totalTiles}<br>
        Culled: ${renderStats.culledTiles}<br>
        Efficiency: ${efficiency}%<br>
        Quality: ${qualityMode}
      `;
    }
  }

  function throttleRender(fn, delay) {
    let timeoutId = null;
    let lastRun = 0;
    
    return function(...args) {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun;
      
      if (timeSinceLastRun >= delay) {
        fn.apply(this, args);
        lastRun = now;
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          fn.apply(this, args);
          lastRun = Date.now();
        }, delay - timeSinceLastRun);
      }
    };
  }

  function getLODSettings(zoom) {
    if (zoom < 0.5) {
      return {
        showGrid: false,
        showTileIds: false,
        tileSkip: 4,
        useCache: true,
        simplifiedColors: true
      };
    } else if (zoom < 1) {
      return {
        showGrid: showGrid && zoom >= 0.75,
        showTileIds: false,
        tileSkip: 2,
        useCache: true,
        simplifiedColors: false
      };
    } else if (zoom < 2) {
      return {
        showGrid: showGrid,
        showTileIds: false,
        tileSkip: 1,
        useCache: true,
        simplifiedColors: false
      };
    } else {
      return {
        showGrid: showGrid,
        showTileIds: showTileIds && zoom >= 1.5,
        tileSkip: 1,
        useCache: false,
        simplifiedColors: false
      };
    }
  }

  function calculateViewportBounds(tileSize) {
    const container = canvas.parentElement;
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    const viewWidth = container.clientWidth;
    const viewHeight = container.clientHeight;
    
    // Add margin for smooth scrolling
    const margin = 2;
    const startCol = Math.max(0, Math.floor(scrollLeft / tileSize) - margin);
    const endCol = Math.min(tileData[0]?.length || 0, Math.ceil((scrollLeft + viewWidth) / tileSize) + margin);
    const startRow = Math.max(0, Math.floor(scrollTop / tileSize) - margin);
    const endRow = Math.min(tileData.length, Math.ceil((scrollTop + viewHeight) / tileSize) + margin);
    
    return { startRow, endRow, startCol, endCol };
  }

  function adaptQualityToPerformance() {
    if (qualityMode === 'auto') {
      const targetFPS = 30;
      if (renderStats.fps < targetFPS * 0.5 && renderStats.frameCount > 10) {
        // Very poor performance - switch to low quality
        qualityMode = 'low';
        scale = Math.max(5, scale * 0.75);
      } else if (renderStats.fps < targetFPS * 0.8 && renderStats.frameCount > 10) {
        // Poor performance - reduce quality
        if (qualityMode === 'high') {
          qualityMode = 'medium';
        }
      } else if (renderStats.fps > targetFPS * 1.5 && renderStats.frameCount > 30) {
        // Good performance - can increase quality
        if (qualityMode === 'low') {
          qualityMode = 'medium';
          scale = 10;
        } else if (qualityMode === 'medium') {
          qualityMode = 'high';
        }
      }
    }
  }

  function renderMap() {
    if (!tileData || tileData.length === 0) {
      return;
    }
    
    const startTime = performance.now();
    const tileSize = scale * zoomLevel;
    const fullWidth = tileData[0].length * tileSize;
    const fullHeight = tileData.length * tileSize;
    
    // Resize canvases if needed
    if (canvas.width !== fullWidth || canvas.height !== fullHeight) {
      canvas.width = fullWidth;
      canvas.height = fullHeight;
      offscreenCanvas.width = fullWidth;
      offscreenCanvas.height = fullHeight;
      tileCache.clear(); // Clear cache on resize
    }
    
    // Get LOD settings
    const lod = getLODSettings(zoomLevel);
    
    // Calculate viewport bounds for culling
    const shouldCull = tileData.length > 50 || tileData[0].length > 50;
    const bounds = shouldCull ? calculateViewportBounds(tileSize) : {
      startRow: 0,
      endRow: tileData.length,
      startCol: 0,
      endCol: tileData[0].length
    };
    
    // Clear visible area
    offscreenCtx.fillStyle = '#1e1e1e';
    if (shouldCull) {
      offscreenCtx.fillRect(
        bounds.startCol * tileSize,
        bounds.startRow * tileSize,
        (bounds.endCol - bounds.startCol) * tileSize,
        (bounds.endRow - bounds.startRow) * tileSize
      );
    } else {
      offscreenCtx.fillRect(0, 0, fullWidth, fullHeight);
    }
    
    // Render tiles with LOD
    let renderedCount = 0;
    const tileSkip = lod.tileSkip;
    
    for (let row = bounds.startRow; row < bounds.endRow; row += tileSkip) {
      for (let col = bounds.startCol; col < bounds.endCol; col += tileSkip) {
        const tileId = tileData[row][col];
        const cacheKey = `${tileId}-${tileSize}-${lod.showGrid}-${lod.showTileIds}`;
        
        // Try to use cached tile
        if (lod.useCache && tileCache.has(cacheKey) && tileSkip === 1) {
          const cachedImage = tileCache.get(cacheKey);
          offscreenCtx.drawImage(cachedImage, col * tileSize, row * tileSize);
        } else {
          // Draw tile
          const color = colorMap[tileId] || { r: 128, g: 128, b: 128 };
          const alpha = color.a !== undefined ? color.a : 1;
          
          if (lod.simplifiedColors) {
            // Use simplified colors for very low zoom
            offscreenCtx.fillStyle = `rgb(${Math.round(color.r/32)*32}, ${Math.round(color.g/32)*32}, ${Math.round(color.b/32)*32})`;
          } else {
            offscreenCtx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
          }
          
          const drawSize = tileSize * tileSkip;
          offscreenCtx.fillRect(col * tileSize, row * tileSize, drawSize, drawSize);
          
          // Draw grid if enabled
          if (lod.showGrid && tileSize >= 8) {
            offscreenCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            offscreenCtx.lineWidth = 1;
            offscreenCtx.strokeRect(col * tileSize, row * tileSize, drawSize, drawSize);
          }
          
          // Draw tile ID if enabled
          if (lod.showTileIds && tileSize >= 20) {
            offscreenCtx.fillStyle = getContrastColor(color);
            offscreenCtx.font = `${Math.floor(tileSize / 3)}px monospace`;
            offscreenCtx.textAlign = 'center';
            offscreenCtx.textBaseline = 'middle';
            offscreenCtx.fillText(
              tileId.toString(),
              col * tileSize + tileSize / 2,
              row * tileSize + tileSize / 2
            );
          }
          
          // Cache the tile if it's a single tile
          if (lod.useCache && tileSkip === 1 && tileSize >= 10 && tileCache.size < 1000) {
            const tileCanvas = document.createElement('canvas');
            tileCanvas.width = tileSize;
            tileCanvas.height = tileSize;
            const tileCtx = tileCanvas.getContext('2d');
            tileCtx.drawImage(
              offscreenCanvas,
              col * tileSize, row * tileSize, tileSize, tileSize,
              0, 0, tileSize, tileSize
            );
            tileCache.set(cacheKey, tileCanvas);
          }
        }
        
        renderedCount++;
      }
    }
    
    // Draw selection overlay
    if (selectedTiles.length > 0) {
      drawSelection(offscreenCtx, tileSize);
    }
    
    // Draw hover highlight
    if (hoveredTile) {
      offscreenCtx.strokeStyle = '#ffffff';
      offscreenCtx.lineWidth = 2;
      offscreenCtx.strokeRect(
        hoveredTile.col * tileSize,
        hoveredTile.row * tileSize,
        tileSize,
        tileSize
      );
    }
    
    // Copy to main canvas
    ctx.drawImage(offscreenCanvas, 0, 0);
    
    // Update performance stats
    const endTime = performance.now();
    const frameTime = endTime - startTime;
    updateRenderStats(renderedCount, tileData.length * tileData[0].length, frameTime);
    
    // Adapt quality based on performance
    adaptQualityToPerformance();
  }

  function drawSelection(context, tileSize) {
    context.fillStyle = 'rgba(100, 150, 255, 0.3)';
    context.strokeStyle = 'rgba(100, 150, 255, 0.8)';
    context.lineWidth = 2;
    
    selectedTiles.forEach(tile => {
      context.fillRect(tile.col * tileSize, tile.row * tileSize, tileSize, tileSize);
    });
    
    if (selectedTiles.length > 1) {
      const minRow = Math.min(...selectedTiles.map(t => t.row));
      const maxRow = Math.max(...selectedTiles.map(t => t.row));
      const minCol = Math.min(...selectedTiles.map(t => t.col));
      const maxCol = Math.max(...selectedTiles.map(t => t.col));
      
      context.strokeRect(
        minCol * tileSize,
        minRow * tileSize,
        (maxCol - minCol + 1) * tileSize,
        (maxRow - minRow + 1) * tileSize
      );
    }
  }

  function updateRenderStats(rendered, total, frameTime) {
    renderStats.renderedTiles = rendered;
    renderStats.culledTiles = total - rendered;
    renderStats.frameTime = frameTime;
    
    // Update FPS
    renderStats.frameCount++;
    const now = performance.now();
    const elapsed = now - renderStats.fpsUpdateTime;
    
    if (elapsed >= 1000) {
      renderStats.fps = Math.round((renderStats.frameCount * 1000) / elapsed);
      renderStats.frameCount = 0;
      renderStats.fpsUpdateTime = now;
    }
  }

  function getContrastColor(bgColor) {
    const luminance = (0.299 * bgColor.r + 0.587 * bgColor.g + 0.114 * bgColor.b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  // Copy the remaining event handlers and helper functions from mapPreview.js
  // with the renderMap calls replaced with renderThrottled
  
  function setupEventListeners() {
    // Zoom controls
    document.getElementById('zoomIn').addEventListener('click', () => {
      if (zoomLevel < MAX_ZOOM) {
        zoomLevel += ZOOM_STEP;
        updateZoomDisplay();
        renderThrottled();
      }
    });
    
    document.getElementById('zoomOut').addEventListener('click', () => {
      if (zoomLevel > MIN_ZOOM) {
        zoomLevel -= ZOOM_STEP;
        updateZoomDisplay();
        renderThrottled();
      }
    });
    
    document.getElementById('zoomReset').addEventListener('click', () => {
      zoomLevel = 1;
      updateZoomDisplay();
      renderThrottled();
    });
    
    // Toggle controls
    document.getElementById('toggleGrid').addEventListener('change', (e) => {
      showGrid = e.target.checked;
      renderThrottled();
    });
    
    document.getElementById('toggleIds').addEventListener('change', (e) => {
      showTileIds = e.target.checked;
      renderThrottled();
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
      renderThrottled();
    });
    
    // Scroll optimization
    let scrollTimeout;
    canvas.parentElement.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        renderThrottled();
      }, 16);
    });
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
        renderThrottled();
      }
      
      canvas.style.cursor = e.shiftKey ? 'crosshair' : 'pointer';
    } else {
      hoveredTile = null;
      updateHoverInfo(null);
      canvas.style.cursor = 'default';
    }
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
      renderThrottled();
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
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          if (zoomLevel < MAX_ZOOM) {
            zoomLevel += ZOOM_STEP;
            updateZoomDisplay();
            renderThrottled();
          }
        } else if (e.key === '-') {
          e.preventDefault();
          if (zoomLevel > MIN_ZOOM) {
            zoomLevel -= ZOOM_STEP;
            updateZoomDisplay();
            renderThrottled();
          }
        } else if (e.key === '0') {
          e.preventDefault();
          zoomLevel = 1;
          updateZoomDisplay();
          renderThrottled();
        }
      }
      
      if (e.key === 'g' || e.key === 'G') {
        const gridCheckbox = document.getElementById('toggleGrid');
        gridCheckbox.checked = !gridCheckbox.checked;
        showGrid = gridCheckbox.checked;
        renderThrottled();
      } else if (e.key === 'i' || e.key === 'I') {
        const idsCheckbox = document.getElementById('toggleIds');
        idsCheckbox.checked = !idsCheckbox.checked;
        showTileIds = idsCheckbox.checked;
        renderThrottled();
      }
      
      if (e.key === 'Escape' && selectedTiles.length > 0) {
        selectedTiles = [];
        renderThrottled();
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
    };
    
    if (tileId >= 76 && tileId <= 103) {
      const baseId = tileId - 50;
      const baseName = tileNames[baseId] || `Unknown (${baseId})`;
      return `Reinforced ${baseName}`;
    }
    
    return tileNames[tileId] || 'Unknown';
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
        renderThrottled();
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