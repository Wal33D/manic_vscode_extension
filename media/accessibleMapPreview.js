(function() {
  const vscode = acquireVsCodeApi();
  
  let canvas;
  let ctx;
  let tiles = [];
  let rowcount = 0;
  let colcount = 0;
  let colorMap = {};
  let scale = 1;
  let showGrid = true;
  let showIds = true;
  let enhancedContrast = false;
  let focusedTile = null;
  let selectedTiles = [];
  let isSelecting = false;
  let selectionStart = null;

  // Accessibility state
  const accessibilityOptions = window.accessibilityOptions || {};
  let announceQueue = [];
  let announceTimeout = null;

  // Initialize
  window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('mapCanvas');
    ctx = canvas.getContext('2d');
    
    setupControls();
    setupAccessibilityControls();
    setupKeyboardNavigation();
    
    // Notify extension we're ready
    vscode.postMessage({ type: 'ready' });
  });

  // Setup regular controls
  function setupControls() {
    document.getElementById('zoomIn').addEventListener('click', () => {
      scale = Math.min(scale * 1.2, 5);
      updateZoomLevel();
      render();
    });

    document.getElementById('zoomOut').addEventListener('click', () => {
      scale = Math.max(scale / 1.2, 0.2);
      updateZoomLevel();
      render();
    });

    document.getElementById('zoomReset').addEventListener('click', () => {
      scale = 1;
      updateZoomLevel();
      render();
    });

    document.getElementById('toggleGrid').addEventListener('change', (e) => {
      showGrid = e.target.checked;
      render();
      announce(`Grid ${showGrid ? 'enabled' : 'disabled'}`);
    });

    document.getElementById('toggleIds').addEventListener('change', (e) => {
      showIds = e.target.checked;
      render();
      announce(`Tile IDs ${showIds ? 'shown' : 'hidden'}`);
    });

    document.getElementById('toggleContrast').addEventListener('change', (e) => {
      enhancedContrast = e.target.checked;
      canvas.classList.toggle('enhanced-contrast', enhancedContrast);
      render();
      announce(`Enhanced contrast ${enhancedContrast ? 'enabled' : 'disabled'}`);
    });

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasHover);
    canvas.addEventListener('mousedown', handleSelectionStart);
    canvas.addEventListener('mousemove', handleSelectionDrag);
    canvas.addEventListener('mouseup', handleSelectionEnd);
  }

  // Setup accessibility controls
  function setupAccessibilityControls() {
    document.getElementById('toggleHighContrast').addEventListener('click', () => {
      document.body.classList.toggle('high-contrast');
      vscode.postMessage({ 
        type: 'updateAccessibility', 
        option: 'highContrast',
        value: document.body.classList.contains('high-contrast')
      });
      announce('High contrast mode toggled');
    });

    document.getElementById('toggleScreenReader').addEventListener('click', () => {
      const enabled = !accessibilityOptions.screenReaderMode;
      accessibilityOptions.screenReaderMode = enabled;
      vscode.postMessage({ 
        type: 'updateAccessibility', 
        option: 'screenReaderMode',
        value: enabled
      });
      announce(`Screen reader mode ${enabled ? 'enabled' : 'disabled'}`);
    });

    document.getElementById('increaseFontSize').addEventListener('click', () => {
      changeFontSize(1);
    });

    document.getElementById('decreaseFontSize').addEventListener('click', () => {
      changeFontSize(-1);
    });

    // Apply initial accessibility settings
    if (accessibilityOptions.highContrast) {
      document.body.classList.add('high-contrast');
    }
    if (accessibilityOptions.fontSize !== 'normal') {
      document.body.classList.add(`font-${accessibilityOptions.fontSize}`);
    }
    if (accessibilityOptions.reducedMotion) {
      document.body.classList.add('reduced-motion');
    }
    if (accessibilityOptions.keyboardNavigation) {
      document.body.classList.add('keyboard-nav');
    }
  }

  // Setup keyboard navigation
  function setupKeyboardNavigation() {
    canvas.addEventListener('keydown', (e) => {
      if (!tiles || tiles.length === 0) return;

      switch(e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'Home':
        case 'End':
        case 'PageUp':
        case 'PageDown':
          e.preventDefault();
          vscode.postMessage({ type: 'keyboardNavigation', key: e.key });
          break;
        
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedTile) {
            handleTileClick(focusedTile.row, focusedTile.col);
          }
          break;
        
        case 'h':
        case 'H':
          e.preventDefault();
          toggleKeyboardHelp();
          break;
        
        case 'g':
        case 'G':
          e.preventDefault();
          document.getElementById('toggleGrid').click();
          break;
        
        case 'i':
        case 'I':
          e.preventDefault();
          document.getElementById('toggleIds').click();
          break;
        
        case '+':
        case '=':
          e.preventDefault();
          document.getElementById('zoomIn').click();
          break;
        
        case '-':
        case '_':
          e.preventDefault();
          document.getElementById('zoomOut').click();
          break;
        
        case '0':
          e.preventDefault();
          document.getElementById('zoomReset').click();
          break;
        
        case 'Escape':
          e.preventDefault();
          clearSelection();
          focusedTile = null;
          render();
          announce('Selection cleared');
          break;
      }
    });

    // Help dialog
    const helpDialog = document.getElementById('keyboardHelp');
    const closeHelpButton = document.getElementById('closeHelp');
    
    closeHelpButton.addEventListener('click', () => {
      helpDialog.hidden = true;
      canvas.focus();
    });

    helpDialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        helpDialog.hidden = true;
        canvas.focus();
      }
    });
  }

  // Toggle keyboard help
  function toggleKeyboardHelp() {
    const helpDialog = document.getElementById('keyboardHelp');
    helpDialog.hidden = !helpDialog.hidden;
    
    if (!helpDialog.hidden) {
      document.getElementById('closeHelp').focus();
      announce('Keyboard shortcuts help opened. Press Escape to close.');
    } else {
      canvas.focus();
    }
  }

  // Change font size
  function changeFontSize(direction) {
    const sizes = ['normal', 'large', 'extra-large'];
    let currentIndex = sizes.indexOf(accessibilityOptions.fontSize || 'normal');
    currentIndex = Math.max(0, Math.min(sizes.length - 1, currentIndex + direction));
    
    // Remove old size class
    sizes.forEach(size => document.body.classList.remove(`font-${size}`));
    
    // Add new size class
    const newSize = sizes[currentIndex];
    if (newSize !== 'normal') {
      document.body.classList.add(`font-${newSize}`);
    }
    
    accessibilityOptions.fontSize = newSize;
    vscode.postMessage({ 
      type: 'updateAccessibility', 
      option: 'fontSize',
      value: newSize
    });
    
    announce(`Font size: ${newSize.replace('-', ' ')}`);
  }

  // Handle messages from extension
  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
      case 'updateTiles':
        tiles = message.tiles;
        rowcount = message.rowcount;
        colcount = message.colcount;
        colorMap = message.colorMap;
        render();
        updateMapDescription();
        break;
      
      case 'setFocus':
        focusedTile = { row: message.row, col: message.col };
        render();
        scrollToTile(focusedTile.row, focusedTile.col);
        break;
      
      case 'noTiles':
        clearCanvas();
        announce('No tiles section found in the document');
        break;
      
      case 'error':
        announce(`Error: ${message.message}`, 'assertive');
        break;
    }
  });

  // Render the map
  function render() {
    if (!tiles || tiles.length === 0) {
      clearCanvas();
      return;
    }

    const tileSize = 32 * scale;
    canvas.width = colcount * tileSize;
    canvas.height = rowcount * tileSize;

    // Clear canvas
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-color');
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw tiles
    for (let row = 0; row < tiles.length && row < rowcount; row++) {
      for (let col = 0; col < tiles[row].length && col < colcount; col++) {
        const tileId = tiles[row][col];
        const x = col * tileSize;
        const y = row * tileSize;

        // Draw tile
        const color = colorMap[tileId] || '#808080';
        ctx.fillStyle = color;
        ctx.fillRect(x, y, tileSize, tileSize);

        // Draw selection
        if (isSelected(row, col)) {
          ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--accent-color');
          ctx.lineWidth = 3;
          ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
        }

        // Draw focus
        if (focusedTile && focusedTile.row === row && focusedTile.col === col) {
          ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--accent-color');
          ctx.lineWidth = 4;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
          ctx.setLineDash([]);
        }

        // Draw grid
        if (showGrid) {
          ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--border-color');
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.3;
          ctx.strokeRect(x, y, tileSize, tileSize);
          ctx.globalAlpha = 1;
        }

        // Draw tile ID
        if (showIds && tileSize > 20) {
          ctx.fillStyle = getContrastColor(color);
          ctx.font = `${Math.max(10, tileSize / 3)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tileId.toString(), x + tileSize / 2, y + tileSize / 2);
        }
      }
    }

    updateDimensions();
  }

  // Clear canvas
  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('dimensions').textContent = 'No map loaded';
  }

  // Update zoom level display
  function updateZoomLevel() {
    document.querySelector('.zoom-level').textContent = `${Math.round(scale * 100)}%`;
    announce(`Zoom level: ${Math.round(scale * 100)}%`);
  }

  // Update dimensions display
  function updateDimensions() {
    const text = `${rowcount} × ${colcount} tiles`;
    document.getElementById('dimensions').textContent = text;
  }

  // Update map description for screen readers
  function updateMapDescription() {
    if (!accessibilityOptions.screenReaderMode) return;

    const totalTiles = rowcount * colcount;
    const tileTypes = {};
    
    tiles.forEach(row => {
      row.forEach(tileId => {
        tileTypes[tileId] = (tileTypes[tileId] || 0) + 1;
      });
    });

    const description = `Map with ${rowcount} rows and ${colcount} columns, containing ${totalTiles} total tiles. ` +
      `${Object.keys(tileTypes).length} different tile types are used.`;
    
    document.getElementById('mapDescription').textContent = description;
  }

  // Handle tile click
  function handleTileClick(row, col) {
    if (row >= 0 && row < tiles.length && col >= 0 && col < tiles[row].length) {
      const tileId = tiles[row][col];
      vscode.postMessage({ 
        type: 'tileClick', 
        row, 
        col, 
        tileId 
      });
      
      announce(`Selected tile at row ${row + 1}, column ${col + 1}, ID: ${tileId}`);
    }
  }

  // Handle canvas click
  function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const tileSize = 32 * scale;
    
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);
    
    handleTileClick(row, col);
  }

  // Handle canvas hover
  function handleCanvasHover(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const tileSize = 32 * scale;
    
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);
    
    if (row >= 0 && row < tiles.length && col >= 0 && col < tiles[row].length) {
      const tileId = tiles[row][col];
      const hoverText = `Row: ${row + 1}, Col: ${col + 1}, ID: ${tileId}`;
      document.getElementById('hover-info').textContent = hoverText;
      
      // Update current tile info for screen reader
      if (accessibilityOptions.screenReaderMode) {
        document.getElementById('currentTileInfo').textContent = hoverText;
      }
    }
  }

  // Selection handling
  function handleSelectionStart(e) {
    if (e.shiftKey) {
      isSelecting = true;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const tileSize = 32 * scale;
      
      selectionStart = {
        row: Math.floor(y / tileSize),
        col: Math.floor(x / tileSize)
      };
      
      selectedTiles = [];
    }
  }

  function handleSelectionDrag(e) {
    if (!isSelecting || !selectionStart) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const tileSize = 32 * scale;
    
    const currentRow = Math.floor(y / tileSize);
    const currentCol = Math.floor(x / tileSize);
    
    // Calculate selection rectangle
    const minRow = Math.min(selectionStart.row, currentRow);
    const maxRow = Math.max(selectionStart.row, currentRow);
    const minCol = Math.min(selectionStart.col, currentCol);
    const maxCol = Math.max(selectionStart.col, currentCol);
    
    selectedTiles = [];
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (r >= 0 && r < tiles.length && c >= 0 && c < tiles[r].length) {
          selectedTiles.push({ row: r, col: c });
        }
      }
    }
    
    render();
  }

  function handleSelectionEnd(e) {
    if (isSelecting && selectedTiles.length > 0) {
      vscode.postMessage({ 
        type: 'tilesSelected', 
        tiles: selectedTiles 
      });
      
      announce(`Selected ${selectedTiles.length} tiles`);
    }
    
    isSelecting = false;
    selectionStart = null;
  }

  function isSelected(row, col) {
    return selectedTiles.some(t => t.row === row && t.col === col);
  }

  function clearSelection() {
    selectedTiles = [];
    isSelecting = false;
    selectionStart = null;
  }

  // Scroll to focused tile
  function scrollToTile(row, col) {
    const tileSize = 32 * scale;
    const x = col * tileSize;
    const y = row * tileSize;
    
    // Ensure tile is visible
    const container = canvas.parentElement;
    const rect = canvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    if (rect.left + x < containerRect.left || rect.left + x + tileSize > containerRect.right) {
      container.scrollLeft = x - container.clientWidth / 2 + tileSize / 2;
    }
    
    if (rect.top + y < containerRect.top || rect.top + y + tileSize > containerRect.bottom) {
      container.scrollTop = y - container.clientHeight / 2 + tileSize / 2;
    }
  }

  // Utility functions
  function getContrastColor(hexColor) {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  // Screen reader announcements
  function announce(message, priority = 'polite') {
    if (!accessibilityOptions.screenReaderMode) return;
    
    // Queue announcements
    announceQueue.push({ message, priority });
    
    if (!announceTimeout) {
      announceTimeout = setTimeout(processAnnouncements, 100);
    }
  }

  function processAnnouncements() {
    if (announceQueue.length === 0) {
      announceTimeout = null;
      return;
    }
    
    // Get highest priority announcement
    const urgent = announceQueue.find(a => a.priority === 'assertive');
    const announcement = urgent || announceQueue[0];
    
    // Send to extension for status bar
    vscode.postMessage({ 
      type: 'announceToScreenReader', 
      message: announcement.message,
      priority: announcement.priority
    });
    
    // Clear processed announcements
    if (urgent) {
      announceQueue = announceQueue.filter(a => a.priority !== 'assertive');
    } else {
      announceQueue.shift();
    }
    
    // Process remaining
    if (announceQueue.length > 0) {
      announceTimeout = setTimeout(processAnnouncements, 500);
    } else {
      announceTimeout = null;
    }
  }
})();