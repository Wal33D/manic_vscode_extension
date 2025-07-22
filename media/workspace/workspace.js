// @ts-check
(function() {
  const vscode = acquireVsCodeApi();
  
  // State management
  let workspaceState = {
    panels: [],
    layouts: [],
    activePanel: null,
    draggedPanel: null,
    resizingPanel: null,
    splitterDragging: null,
  };
  
  // Initialize workspace
  function initialize() {
    // Set up event handlers
    initializeEventHandlers();
    
    // Send ready message
    vscode.postMessage({ type: 'ready' });
  }
  
  // Event Handlers
  function initializeEventHandlers() {
    // Layout preset buttons
    document.querySelectorAll('.layout-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = btn.getAttribute('data-preset');
        if (preset) {
          applyPresetLayout(preset);
          
          // Update active state
          document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });
    
    // Control buttons
    document.getElementById('saveLayoutBtn')?.addEventListener('click', saveLayout);
    document.getElementById('loadLayoutBtn')?.addEventListener('click', loadLayout);
    document.getElementById('resetLayoutBtn')?.addEventListener('click', resetLayout);
    
    // Quick action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.getAttribute('data-action');
        handleQuickAction(action);
      });
    });
    
    // Dock toggle buttons
    document.querySelectorAll('.dock-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dock = btn.getAttribute('data-dock');
        toggleDock(dock);
      });
    });
    
    // Global mouse events for dragging and resizing
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Window resize
    window.addEventListener('resize', handleWindowResize);
  }
  
  // Layout Management
  function applyPresetLayout(preset) {
    vscode.postMessage({
      type: 'layout',
      command: 'preset',
      preset: preset
    });
  }
  
  function saveLayout() {
    const name = prompt('Enter layout name:');
    if (name) {
      vscode.postMessage({
        type: 'layout',
        command: 'save',
        name: name
      });
    }
  }
  
  function loadLayout() {
    // Show layout selection dialog
    const layouts = workspaceState.layouts;
    if (layouts.length === 0) {
      vscode.postMessage({
        type: 'notification',
        message: 'No saved layouts found'
      });
      return;
    }
    
    // For now, use a simple prompt - in future, create a nice dialog
    const layoutNames = layouts.map(l => l.name).join(', ');
    const name = prompt(`Select layout (${layoutNames}):`);
    if (name) {
      vscode.postMessage({
        type: 'layout',
        command: 'load',
        name: name
      });
    }
  }
  
  function resetLayout() {
    if (confirm('Reset workspace to default layout?')) {
      vscode.postMessage({
        type: 'layout',
        command: 'preset',
        preset: 'default'
      });
    }
  }
  
  // Panel Management
  function createPanel(panelState) {
    const template = document.getElementById('panel-template');
    if (!template) return null;
    
    const panel = template.content.cloneNode(true);
    const panelElement = panel.querySelector('.workspace-panel');
    
    // Set panel attributes
    panelElement.id = `panel-${panelState.id}`;
    panelElement.setAttribute('data-panel-id', panelState.id);
    
    // Set icon and title
    panel.querySelector('.panel-icon').textContent = panelState.icon;
    panel.querySelector('.panel-title').textContent = panelState.title;
    
    // Set up panel controls
    const controls = panel.querySelector('.panel-controls');
    controls.querySelector('.minimize').addEventListener('click', () => {
      togglePanelCollapse(panelState.id);
    });
    controls.querySelector('.maximize').addEventListener('click', () => {
      togglePanelMaximize(panelState.id);
    });
    controls.querySelector('.close').addEventListener('click', () => {
      closePanel(panelState.id);
    });
    
    // Add panel content based on type
    const content = panel.querySelector('.panel-content');
    content.innerHTML = getPanelContent(panelState.id);
    
    // Apply size and position
    if (panelState.position === 'float') {
      panelElement.style.width = `${panelState.size.width}px`;
      panelElement.style.height = `${panelState.size.height}px`;
      panelElement.style.left = `${panelState.floatPosition?.x || 100}px`;
      panelElement.style.top = `${panelState.floatPosition?.y || 100}px`;
    } else {
      panelElement.classList.add('docked');
    }
    
    if (panelState.collapsed) {
      panelElement.classList.add('collapsed');
    }
    
    if (panelState.maximized) {
      panelElement.classList.add('maximized');
    }
    
    return panelElement;
  }
  
  function getPanelContent(panelId) {
    // Return appropriate content based on panel type
    switch (panelId) {
      case 'tools':
        return getToolsPanelContent();
      case 'properties':
        return getPropertiesPanelContent();
      case 'layers':
        return getLayersPanelContent();
      case 'tilePalette':
        return getTilePaletteContent();
      case 'scriptPatterns':
        return getScriptPatternsContent();
      case 'validation':
        return getValidationContent();
      case 'statistics':
        return getStatisticsContent();
      case 'history':
        return getHistoryContent();
      default:
        return '<p>Panel content not implemented</p>';
    }
  }
  
  // Panel Content Generators
  function getToolsPanelContent() {
    return `
      <div class="tools-grid">
        <button class="tool-btn" data-tool="paint" title="Paint Tool">
          <span class="icon">🖌️</span>
          <span>Paint</span>
        </button>
        <button class="tool-btn" data-tool="fill" title="Fill Tool">
          <span class="icon">🪣</span>
          <span>Fill</span>
        </button>
        <button class="tool-btn" data-tool="line" title="Line Tool">
          <span class="icon">📏</span>
          <span>Line</span>
        </button>
        <button class="tool-btn" data-tool="rect" title="Rectangle Tool">
          <span class="icon">⬛</span>
          <span>Rectangle</span>
        </button>
        <button class="tool-btn" data-tool="circle" title="Circle Tool">
          <span class="icon">⭕</span>
          <span>Circle</span>
        </button>
        <button class="tool-btn" data-tool="select" title="Selection Tool">
          <span class="icon">✂️</span>
          <span>Select</span>
        </button>
        <button class="tool-btn" data-tool="picker" title="Picker Tool">
          <span class="icon">💧</span>
          <span>Picker</span>
        </button>
        <button class="tool-btn" data-tool="eraser" title="Eraser Tool">
          <span class="icon">🧹</span>
          <span>Eraser</span>
        </button>
      </div>
    `;
  }
  
  function getPropertiesPanelContent() {
    return `
      <div class="properties-container">
        <div class="property-group">
          <label>Tile Type</label>
          <select id="tileType" class="property-select">
            <option value="0">Empty (0)</option>
            <option value="1">Dirt (1)</option>
            <option value="4">Solid Rock (4)</option>
          </select>
        </div>
        <div class="property-group">
          <label>Height</label>
          <input type="range" id="height" min="0" max="9" value="5" class="property-range">
          <span id="heightValue">5</span>
        </div>
        <div class="property-group">
          <label>Building</label>
          <select id="building" class="property-select">
            <option value="">None</option>
            <option value="ToolStore">Tool Store</option>
            <option value="TeleportPad">Teleport Pad</option>
          </select>
        </div>
      </div>
    `;
  }
  
  function getLayersPanelContent() {
    return `
      <div class="layers-container">
        <div class="layer-item active">
          <input type="checkbox" checked>
          <span class="layer-icon">🗺️</span>
          <span class="layer-name">Tiles</span>
          <button class="layer-visibility">👁️</button>
        </div>
        <div class="layer-item">
          <input type="checkbox" checked>
          <span class="layer-icon">📏</span>
          <span class="layer-name">Height</span>
          <button class="layer-visibility">👁️</button>
        </div>
        <div class="layer-item">
          <input type="checkbox" checked>
          <span class="layer-icon">💎</span>
          <span class="layer-name">Resources</span>
          <button class="layer-visibility">👁️</button>
        </div>
        <div class="layer-item">
          <input type="checkbox" checked>
          <span class="layer-icon">🏢</span>
          <span class="layer-name">Buildings</span>
          <button class="layer-visibility">👁️</button>
        </div>
      </div>
    `;
  }
  
  function getTilePaletteContent() {
    return `
      <div class="tile-palette-container">
        <div class="palette-search">
          <input type="text" placeholder="Search tiles..." class="search-input">
        </div>
        <div class="tile-grid">
          ${generateTileGrid()}
        </div>
      </div>
    `;
  }
  
  function generateTileGrid() {
    let html = '';
    const tileColors = {
      0: '#2a2a2a',
      1: '#8b4513',
      2: '#333333',
      3: '#ff0000',
      4: '#666666',
      5: '#444444',
      6: '#00ff00',
      7: '#0000ff',
      8: '#ffff00',
      9: '#ff00ff'
    };
    
    for (let i = 0; i < 10; i++) {
      html += `
        <div class="tile-item" data-tile-id="${i}" style="background-color: ${tileColors[i] || '#ccc'}">
          <span class="tile-id">${i}</span>
        </div>
      `;
    }
    
    return html;
  }
  
  // Panel Actions
  function togglePanelCollapse(panelId) {
    vscode.postMessage({
      type: 'panel',
      command: 'collapse',
      panelId: panelId,
      collapsed: true // Toggle will be handled by provider
    });
  }
  
  function togglePanelMaximize(panelId) {
    const panel = document.getElementById(`panel-${panelId}`);
    const isMaximized = panel?.classList.contains('maximized');
    
    vscode.postMessage({
      type: 'panel',
      command: 'maximize',
      panelId: panelId,
      maximized: !isMaximized
    });
  }
  
  function closePanel(panelId) {
    vscode.postMessage({
      type: 'panel',
      command: 'close',
      panelId: panelId
    });
  }
  
  // Dock Management
  function toggleDock(dockPosition) {
    const dock = document.getElementById(`dock-${dockPosition}`);
    if (dock) {
      dock.classList.toggle('collapsed');
    }
  }
  
  // Quick Actions
  function handleQuickAction(action) {
    switch (action) {
      case 'openMapEditor':
        vscode.postMessage({
          type: 'tool',
          command: 'executeAction',
          action: 'manicMiners.openMapEditor'
        });
        break;
      case 'showTools':
        vscode.postMessage({
          type: 'panel',
          command: 'toggle',
          panelId: 'tools'
        });
        break;
      case 'showProperties':
        vscode.postMessage({
          type: 'panel',
          command: 'toggle',
          panelId: 'properties'
        });
        break;
    }
  }
  
  // Mouse Handling
  function handleMouseDown(e) {
    // Panel dragging
    if (e.target.closest('.panel-header') && !e.target.closest('.panel-btn')) {
      const panel = e.target.closest('.workspace-panel');
      if (panel && !panel.classList.contains('docked')) {
        startPanelDrag(panel, e);
      }
    }
    
    // Panel resizing
    if (e.target.classList.contains('panel-resize-handle')) {
      const panel = e.target.closest('.workspace-panel');
      if (panel && !panel.classList.contains('docked')) {
        startPanelResize(panel, e);
      }
    }
    
    // Splitter dragging
    if (e.target.classList.contains('splitter')) {
      startSplitterDrag(e.target, e);
    }
  }
  
  function handleMouseMove(e) {
    if (workspaceState.draggedPanel) {
      dragPanel(e);
    } else if (workspaceState.resizingPanel) {
      resizePanel(e);
    } else if (workspaceState.splitterDragging) {
      dragSplitter(e);
    }
  }
  
  function handleMouseUp(e) {
    if (workspaceState.draggedPanel) {
      endPanelDrag();
    } else if (workspaceState.resizingPanel) {
      endPanelResize();
    } else if (workspaceState.splitterDragging) {
      endSplitterDrag();
    }
  }
  
  // Panel Dragging
  function startPanelDrag(panel, e) {
    workspaceState.draggedPanel = {
      element: panel,
      id: panel.getAttribute('data-panel-id'),
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - panel.offsetLeft,
      offsetY: e.clientY - panel.offsetTop
    };
    
    panel.style.zIndex = '1000';
    panel.classList.add('dragging');
  }
  
  function dragPanel(e) {
    const drag = workspaceState.draggedPanel;
    if (!drag) return;
    
    const x = e.clientX - drag.offsetX;
    const y = e.clientY - drag.offsetY;
    
    drag.element.style.left = `${x}px`;
    drag.element.style.top = `${y}px`;
  }
  
  function endPanelDrag() {
    const drag = workspaceState.draggedPanel;
    if (!drag) return;
    
    drag.element.classList.remove('dragging');
    
    // Send new position to backend
    vscode.postMessage({
      type: 'panel',
      command: 'move',
      panelId: drag.id,
      position: {
        x: parseInt(drag.element.style.left),
        y: parseInt(drag.element.style.top)
      }
    });
    
    workspaceState.draggedPanel = null;
  }
  
  // Panel Resizing
  function startPanelResize(panel, e) {
    workspaceState.resizingPanel = {
      element: panel,
      id: panel.getAttribute('data-panel-id'),
      startX: e.clientX,
      startY: e.clientY,
      startWidth: panel.offsetWidth,
      startHeight: panel.offsetHeight
    };
    
    panel.classList.add('resizing');
  }
  
  function resizePanel(e) {
    const resize = workspaceState.resizingPanel;
    if (!resize) return;
    
    const width = Math.max(200, resize.startWidth + e.clientX - resize.startX);
    const height = Math.max(100, resize.startHeight + e.clientY - resize.startY);
    
    resize.element.style.width = `${width}px`;
    resize.element.style.height = `${height}px`;
  }
  
  function endPanelResize() {
    const resize = workspaceState.resizingPanel;
    if (!resize) return;
    
    resize.element.classList.remove('resizing');
    
    // Send new size to backend
    vscode.postMessage({
      type: 'panel',
      command: 'resize',
      panelId: resize.id,
      size: {
        width: parseInt(resize.element.style.width),
        height: parseInt(resize.element.style.height)
      }
    });
    
    workspaceState.resizingPanel = null;
  }
  
  // Handle messages from extension
  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
      case 'updateWorkspace':
        updateWorkspace(message.panels, message.layouts);
        break;
    }
  });
  
  function updateWorkspace(panels, layouts) {
    workspaceState.panels = panels;
    workspaceState.layouts = layouts;
    
    // Clear and rebuild panels
    const dockZones = {
      left: document.querySelector('#dock-left .dock-content'),
      right: document.querySelector('#dock-right .dock-content'),
      top: document.querySelector('#dock-top .dock-content'),
      bottom: document.querySelector('#dock-bottom .dock-content'),
      center: document.getElementById('workspace-content')
    };
    
    // Clear all zones
    Object.values(dockZones).forEach(zone => {
      if (zone) zone.innerHTML = '';
    });
    
    // Add welcome message if no panels
    const visiblePanels = panels.filter(p => p.visible);
    if (visiblePanels.length === 0 && dockZones.center) {
      dockZones.center.innerHTML = document.querySelector('.welcome-message').outerHTML;
    }
    
    // Create and place panels
    visiblePanels.forEach(panelState => {
      const panel = createPanel(panelState);
      if (panel) {
        const zone = dockZones[panelState.position] || dockZones.center;
        if (zone) {
          zone.appendChild(panel);
        }
      }
    });
    
    // Update status bar
    updateStatusBar();
  }
  
  function updateStatusBar() {
    const panelCount = workspaceState.panels.filter(p => p.visible).length;
    const panelCountElement = document.querySelector('#panelCount .value');
    if (panelCountElement) {
      panelCountElement.textContent = `${panelCount} panels`;
    }
  }
  
  // Window resize handling
  function handleWindowResize() {
    // Adjust floating panels if needed
    // This could include boundary checking, responsive adjustments, etc.
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();