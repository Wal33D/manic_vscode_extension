// @ts-check
(function() {
  const vscode = acquireVsCodeApi();
  
  // Editor state
  let editorState = {
    currentTool: 'paint',
    currentTile: 1,
    brushSize: 1,
    gridVisible: true,
    coordinatesVisible: true,
    zoom: 1,
    mapData: null,
    selection: null,
    layers: [],
    activeLayer: 'main',
    panelStates: new Map(),
    history: [],
    historyIndex: -1,
    mousePosition: { x: 0, y: 0 },
    isDrawing: false,
    previewTiles: []
  };
  
  // Initialize editor
  function initialize() {
    initializeEventHandlers();
    initializeCanvas();
    updateStatusBar();
    
    // Send ready message
    vscode.postMessage({ type: 'ready' });
  }
  
  // Event Handlers
  function initializeEventHandlers() {
    // Toolbar buttons
    document.querySelectorAll('.toolbar-btn').forEach(btn => {
      btn.addEventListener('click', handleToolbarClick);
    });
    
    // Tool selection
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', handleToolSelect);
    });
    
    // Panel controls
    document.querySelectorAll('.panel-close').forEach(btn => {
      btn.addEventListener('click', handlePanelClose);
    });
    
    // Canvas events
    const canvas = document.getElementById('mapCanvas');
    if (canvas) {
      canvas.addEventListener('mousedown', handleCanvasMouseDown);
      canvas.addEventListener('mousemove', handleCanvasMouseMove);
      canvas.addEventListener('mouseup', handleCanvasMouseUp);
      canvas.addEventListener('mouseleave', handleCanvasMouseLeave);
      canvas.addEventListener('wheel', handleCanvasWheel);
      canvas.addEventListener('contextmenu', e => e.preventDefault());
    }
    
    // Window resize
    window.addEventListener('resize', handleResize);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
  }
  
  // Toolbar handlers
  function handleToolbarClick(e) {
    const btn = e.currentTarget;
    const action = btn.getAttribute('data-action');
    const toggle = btn.getAttribute('data-toggle');
    const panel = btn.getAttribute('data-panel');
    
    if (action) {
      executeAction(action);
    } else if (toggle) {
      toggleFeature(toggle, btn);
    } else if (panel) {
      togglePanel(panel, btn);
    }
  }
  
  function executeAction(action) {
    switch (action) {
      case 'new':
        vscode.postMessage({ type: 'action', command: 'new' });
        break;
      case 'save':
        vscode.postMessage({ type: 'action', command: 'save' });
        break;
      case 'export':
        vscode.postMessage({ type: 'action', command: 'export' });
        break;
      case 'undo':
        undo();
        break;
      case 'redo':
        redo();
        break;
      case 'cut':
        cut();
        break;
      case 'copy':
        copy();
        break;
      case 'paste':
        paste();
        break;
      case 'zoom-in':
        zoom(1.25);
        break;
      case 'zoom-out':
        zoom(0.8);
        break;
    }
  }
  
  function toggleFeature(feature, btn) {
    btn.classList.toggle('active');
    const isActive = btn.classList.contains('active');
    
    switch (feature) {
      case 'grid':
        editorState.gridVisible = isActive;
        redrawGrid();
        break;
      case 'coordinates':
        editorState.coordinatesVisible = isActive;
        redrawCanvas();
        break;
    }
  }
  
  function togglePanel(panelId, btn) {
    btn.classList.toggle('active');
    const panel = document.getElementById(`${panelId}-panel`);
    if (panel) {
      panel.classList.toggle('hidden');
      vscode.postMessage({
        type: 'panel',
        command: 'togglePanel',
        panelId: panelId
      });
    }
  }
  
  // Tool selection
  function handleToolSelect(e) {
    const btn = e.currentTarget;
    const tool = btn.getAttribute('data-tool');
    
    // Update UI
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Update state
    editorState.currentTool = tool;
    
    // Update property inspector
    updatePropertyInspector(tool);
    
    // Update status bar
    updateStatusBar();
  }
  
  // Property Inspector
  function updatePropertyInspector(tool) {
    vscode.postMessage({
      type: 'tool',
      command: 'selectTool',
      tool: tool
    });
  }
  
  function renderPropertyInspector(properties) {
    const container = document.getElementById('property-content');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.entries(properties).forEach(([key, prop]) => {
      const group = document.createElement('div');
      group.className = 'property-group';
      
      const label = document.createElement('label');
      label.textContent = formatPropertyName(key);
      group.appendChild(label);
      
      let input;
      switch (prop.type) {
        case 'range':
          input = createRangeInput(key, prop);
          break;
        case 'select':
          input = createSelectInput(key, prop);
          break;
        case 'checkbox':
          input = createCheckboxInput(key, prop);
          break;
        default:
          input = createTextInput(key, prop);
      }
      
      group.appendChild(input);
      container.appendChild(group);
    });
  }
  
  function createRangeInput(key, prop) {
    const container = document.createElement('div');
    container.className = 'range-container';
    
    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'property-range';
    input.min = prop.min;
    input.max = prop.max;
    input.value = prop.value;
    input.id = `prop-${key}`;
    
    const value = document.createElement('span');
    value.className = 'range-value';
    value.textContent = prop.value;
    
    input.addEventListener('input', (e) => {
      value.textContent = e.target.value;
      updateProperty(key, e.target.value);
    });
    
    container.appendChild(input);
    container.appendChild(value);
    return container;
  }
  
  function createSelectInput(key, prop) {
    const select = document.createElement('select');
    select.className = 'property-select';
    select.id = `prop-${key}`;
    
    prop.options.forEach(option => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      if (option.value === prop.value) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
    
    select.addEventListener('change', (e) => {
      updateProperty(key, e.target.value);
    });
    
    return select;
  }
  
  function createCheckboxInput(key, prop) {
    const container = document.createElement('div');
    container.className = 'property-checkbox';
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = `prop-${key}`;
    input.checked = prop.value;
    
    const label = document.createElement('label');
    label.htmlFor = `prop-${key}`;
    label.textContent = formatPropertyName(key);
    
    input.addEventListener('change', (e) => {
      updateProperty(key, e.target.checked);
    });
    
    container.appendChild(input);
    container.appendChild(label);
    return container;
  }
  
  function createTextInput(key, prop) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'property-input';
    input.id = `prop-${key}`;
    input.value = prop.value || '';
    
    input.addEventListener('change', (e) => {
      updateProperty(key, e.target.value);
    });
    
    return input;
  }
  
  function updateProperty(property, value) {
    vscode.postMessage({
      type: 'property',
      property: property,
      value: value
    });
    
    // Update local state
    switch (property) {
      case 'brushSize':
        editorState.brushSize = parseInt(value);
        break;
      case 'tileId':
        editorState.currentTile = parseInt(value);
        updateStatusBar();
        break;
    }
  }
  
  // Canvas handling
  function initializeCanvas() {
    const container = document.getElementById('editor-canvas-container');
    if (!container) return;
    
    // Set up canvases
    const canvases = ['mapCanvas', 'gridCanvas', 'selectionCanvas', 'previewCanvas'];
    canvases.forEach(id => {
      const canvas = document.getElementById(id);
      if (canvas) {
        canvas.width = 800;
        canvas.height = 600;
      }
    });
    
    redrawCanvas();
  }
  
  function handleCanvasMouseDown(e) {
    const coords = getCanvasCoordinates(e);
    editorState.isDrawing = true;
    
    switch (editorState.currentTool) {
      case 'paint':
        paintTile(coords.x, coords.y);
        break;
      case 'fill':
        fillArea(coords.x, coords.y);
        break;
      case 'select':
        startSelection(coords.x, coords.y);
        break;
      case 'picker':
        pickTile(coords.x, coords.y);
        break;
    }
  }
  
  function handleCanvasMouseMove(e) {
    const coords = getCanvasCoordinates(e);
    editorState.mousePosition = coords;
    
    // Update cursor position in status bar
    updateCursorPosition(coords);
    
    // Show preview
    if (!editorState.isDrawing) {
      showPreview(coords.x, coords.y);
    } else {
      // Continue drawing
      if (editorState.currentTool === 'paint') {
        paintTile(coords.x, coords.y);
      }
    }
  }
  
  function handleCanvasMouseUp(e) {
    editorState.isDrawing = false;
    commitChanges();
  }
  
  function handleCanvasMouseLeave(e) {
    editorState.isDrawing = false;
    clearPreview();
  }
  
  function handleCanvasWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoom(delta);
  }
  
  function getCanvasCoordinates(e) {
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (32 * editorState.zoom));
    const y = Math.floor((e.clientY - rect.top) / (32 * editorState.zoom));
    return { x, y };
  }
  
  // Drawing functions
  function paintTile(x, y) {
    if (!editorState.mapData) return;
    
    const size = editorState.brushSize;
    const halfSize = Math.floor(size / 2);
    
    for (let dy = -halfSize; dy <= halfSize; dy++) {
      for (let dx = -halfSize; dx <= halfSize; dx++) {
        const tx = x + dx;
        const ty = y + dy;
        
        if (tx >= 0 && tx < editorState.mapData.width && 
            ty >= 0 && ty < editorState.mapData.height) {
          editorState.mapData.tiles[ty][tx] = editorState.currentTile;
        }
      }
    }
    
    redrawCanvas();
  }
  
  function fillArea(x, y) {
    if (!editorState.mapData) return;
    
    const targetTile = editorState.mapData.tiles[y][x];
    const replaceTile = editorState.currentTile;
    
    if (targetTile === replaceTile) return;
    
    const filled = new Set();
    const queue = [[x, y]];
    
    while (queue.length > 0) {
      const [cx, cy] = queue.shift();
      const key = `${cx},${cy}`;
      
      if (filled.has(key)) continue;
      if (cx < 0 || cx >= editorState.mapData.width || 
          cy < 0 || cy >= editorState.mapData.height) continue;
      if (editorState.mapData.tiles[cy][cx] !== targetTile) continue;
      
      editorState.mapData.tiles[cy][cx] = replaceTile;
      filled.add(key);
      
      queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    
    redrawCanvas();
  }
  
  function pickTile(x, y) {
    if (!editorState.mapData) return;
    
    editorState.currentTile = editorState.mapData.tiles[y][x];
    updateStatusBar();
    
    // Switch to paint tool
    editorState.currentTool = 'paint';
    document.querySelector('.tool-btn[data-tool="paint"]')?.classList.add('active');
    document.querySelector('.tool-btn[data-tool="picker"]')?.classList.remove('active');
  }
  
  // Canvas rendering
  function redrawCanvas() {
    const canvas = document.getElementById('mapCanvas');
    if (!canvas || !editorState.mapData) return;
    
    const ctx = canvas.getContext('2d');
    const tileSize = 32 * editorState.zoom;
    
    canvas.width = editorState.mapData.width * tileSize;
    canvas.height = editorState.mapData.height * tileSize;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw tiles
    for (let y = 0; y < editorState.mapData.height; y++) {
      for (let x = 0; x < editorState.mapData.width; x++) {
        const tile = editorState.mapData.tiles[y][x];
        if (tile > 0) {
          ctx.fillStyle = getTileColor(tile);
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }
    
    // Redraw grid if visible
    if (editorState.gridVisible) {
      redrawGrid();
    }
  }
  
  function redrawGrid() {
    const canvas = document.getElementById('gridCanvas');
    if (!canvas || !editorState.mapData) return;
    
    const ctx = canvas.getContext('2d');
    const tileSize = 32 * editorState.zoom;
    
    canvas.width = editorState.mapData.width * tileSize;
    canvas.height = editorState.mapData.height * tileSize;
    
    if (!editorState.gridVisible) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Draw grid lines
    for (let x = 0; x <= editorState.mapData.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * tileSize, 0);
      ctx.lineTo(x * tileSize, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= editorState.mapData.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * tileSize);
      ctx.lineTo(canvas.width, y * tileSize);
      ctx.stroke();
    }
  }
  
  function showPreview(x, y) {
    const canvas = document.getElementById('previewCanvas');
    if (!canvas || !editorState.mapData) return;
    
    const ctx = canvas.getContext('2d');
    const tileSize = 32 * editorState.zoom;
    
    canvas.width = editorState.mapData.width * tileSize;
    canvas.height = editorState.mapData.height * tileSize;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (editorState.currentTool === 'paint') {
      ctx.fillStyle = getTileColor(editorState.currentTile) + '80';
      const size = editorState.brushSize;
      const halfSize = Math.floor(size / 2);
      
      for (let dy = -halfSize; dy <= halfSize; dy++) {
        for (let dx = -halfSize; dx <= halfSize; dx++) {
          const tx = x + dx;
          const ty = y + dy;
          
          if (tx >= 0 && tx < editorState.mapData.width && 
              ty >= 0 && ty < editorState.mapData.height) {
            ctx.fillRect(tx * tileSize, ty * tileSize, tileSize, tileSize);
          }
        }
      }
    }
  }
  
  function clearPreview() {
    const canvas = document.getElementById('previewCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  
  // History management
  function commitChanges() {
    // Add to history
    editorState.history = editorState.history.slice(0, editorState.historyIndex + 1);
    editorState.history.push(JSON.parse(JSON.stringify(editorState.mapData)));
    editorState.historyIndex++;
    
    // Send changes to extension
    vscode.postMessage({
      type: 'mapUpdate',
      data: editorState.mapData
    });
  }
  
  function undo() {
    if (editorState.historyIndex > 0) {
      editorState.historyIndex--;
      editorState.mapData = JSON.parse(JSON.stringify(editorState.history[editorState.historyIndex]));
      redrawCanvas();
      
      vscode.postMessage({
        type: 'mapUpdate',
        data: editorState.mapData
      });
    }
  }
  
  function redo() {
    if (editorState.historyIndex < editorState.history.length - 1) {
      editorState.historyIndex++;
      editorState.mapData = JSON.parse(JSON.stringify(editorState.history[editorState.historyIndex]));
      redrawCanvas();
      
      vscode.postMessage({
        type: 'mapUpdate',
        data: editorState.mapData
      });
    }
  }
  
  // Zoom handling
  function zoom(factor) {
    editorState.zoom = Math.max(0.25, Math.min(4, editorState.zoom * factor));
    redrawCanvas();
    updateStatusBar();
  }
  
  // Status bar updates
  function updateStatusBar() {
    document.getElementById('current-tool').textContent = `Tool: ${formatToolName(editorState.currentTool)}`;
    document.getElementById('current-tile').textContent = `Tile: ${editorState.currentTile}`;
    document.getElementById('zoom-level').textContent = `Zoom: ${Math.round(editorState.zoom * 100)}%`;
    
    if (editorState.mapData) {
      document.getElementById('map-size').textContent = `Size: ${editorState.mapData.width}x${editorState.mapData.height}`;
    }
  }
  
  function updateCursorPosition(coords) {
    document.getElementById('cursor-position').textContent = `${coords.x}, ${coords.y}`;
  }
  
  // Keyboard shortcuts
  function handleKeyDown(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
        case 'y':
          e.preventDefault();
          redo();
          break;
        case 's':
          e.preventDefault();
          executeAction('save');
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoom(1.25);
          break;
        case '-':
          e.preventDefault();
          zoom(0.8);
          break;
      }
    }
  }
  
  // Handle messages from extension
  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
      case 'updateMap':
        editorState.mapData = message.data;
        editorState.history = [JSON.parse(JSON.stringify(message.data))];
        editorState.historyIndex = 0;
        redrawCanvas();
        updateStatusBar();
        break;
      case 'updatePropertyInspector':
        renderPropertyInspector(message.properties);
        break;
      case 'updatePanels':
        updatePanelStates(message.panels);
        break;
      case 'updateTool':
        editorState[message.property] = message.value;
        break;
    }
  });
  
  function updatePanelStates(panels) {
    panels.forEach(panel => {
      const element = document.getElementById(`${panel.id}-panel`);
      if (element) {
        element.classList.toggle('hidden', !panel.visible);
      }
      
      const btn = document.querySelector(`[data-panel="${panel.id}"]`);
      if (btn) {
        btn.classList.toggle('active', panel.visible);
      }
    });
  }
  
  // Utility functions
  function formatPropertyName(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }
  
  function formatToolName(tool) {
    return tool.charAt(0).toUpperCase() + tool.slice(1);
  }
  
  function getTileColor(tileId) {
    const colors = {
      0: '#2a2a2a',
      1: '#8b4513',
      2: '#333333',
      3: '#ff0000',
      4: '#666666',
      5: '#444444',
      6: '#00ff00',
      7: '#0000ff',
      8: '#ffff00',
      9: '#ff00ff',
      // Add more colors as needed
    };
    return colors[tileId] || `hsl(${tileId * 37}, 70%, 50%)`;
  }
  
  function handleResize() {
    // Recalculate canvas dimensions if needed
    if (editorState.mapData) {
      redrawCanvas();
    }
  }
  
  function handlePanelClose(e) {
    const panel = e.target.closest('.editor-panel');
    const panelId = panel.id.replace('-panel', '');
    togglePanel(panelId, document.querySelector(`[data-panel="${panelId}"]`));
  }
  
  // Selection tool functions
  function startSelection(x, y) {
    editorState.selection = {
      startX: x,
      startY: y,
      endX: x,
      endY: y
    };
  }
  
  function cut() {
    if (editorState.selection) {
      copy();
      // Clear selected area
      // ... implementation
    }
  }
  
  function copy() {
    if (editorState.selection) {
      // Copy selected area
      // ... implementation
    }
  }
  
  function paste() {
    // Paste clipboard content
    // ... implementation
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();