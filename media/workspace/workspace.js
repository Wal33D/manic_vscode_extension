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
    
    // Event delegation for dynamic content
    document.addEventListener('click', handleDelegatedClick);
    document.addEventListener('change', handleDelegatedChange);
    document.addEventListener('input', handleDelegatedInput);
  }
  
  // Delegated event handlers for dynamic content
  function handleDelegatedClick(e) {
    const target = e.target;
    
    // Tool buttons
    if (target.closest('.tool-btn')) {
      const btn = target.closest('.tool-btn');
      const tool = btn.getAttribute('data-tool');
      selectTool(tool);
      // Update active state
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
    
    // Tile selection
    if (target.closest('.tile-item')) {
      const tile = target.closest('.tile-item');
      const tileId = tile.getAttribute('data-tile-id');
      selectTile(tileId);
      // Update selected state
      document.querySelectorAll('.tile-item').forEach(t => t.classList.remove('selected'));
      tile.classList.add('selected');
    }
    
    // Layer visibility toggle
    if (target.classList.contains('layer-visibility')) {
      const layer = target.closest('.layer-item');
      const checkbox = layer.querySelector('input[type="checkbox"]');
      checkbox.checked = !checkbox.checked;
      toggleLayer(layer);
    }
    
    // Pattern insert
    if (target.classList.contains('pattern-insert')) {
      const pattern = target.closest('.pattern-item').getAttribute('data-pattern');
      insertPattern(pattern);
    }
    
    // Pattern category
    if (target.classList.contains('category-btn')) {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      target.classList.add('active');
      filterPatterns(target.textContent.toLowerCase());
    }
    
    // Validation actions
    if (target.textContent === 'Run Full Validation') {
      runValidation();
    }
    
    if (target.textContent === 'Auto-fix Issues') {
      autoFixIssues();
    }
    
    // History actions
    if (target.closest('.history-btn')) {
      const action = target.getAttribute('title');
      if (action === 'Undo') {
        vscode.postMessage({ type: 'history', command: 'undo' });
      } else if (action === 'Redo') {
        vscode.postMessage({ type: 'history', command: 'redo' });
      } else if (action === 'Clear') {
        vscode.postMessage({ type: 'history', command: 'clear' });
      }
    }
    
    // History item click
    if (target.closest('.history-item')) {
      const item = target.closest('.history-item');
      restoreHistoryState(item);
    }
  }
  
  function handleDelegatedChange(e) {
    const target = e.target;
    
    // Property changes
    if (target.id === 'tileType') {
      updateProperty('tileType', target.value);
    }
    
    if (target.id === 'building') {
      updateProperty('building', target.value);
    }
    
    // Layer checkbox
    if (target.type === 'checkbox' && target.closest('.layer-item')) {
      const layer = target.closest('.layer-item');
      toggleLayer(layer);
    }
    
    // Validation rules
    if (target.type === 'checkbox' && target.closest('.validation-rule')) {
      updateValidationRules();
    }
  }
  
  function handleDelegatedInput(e) {
    const target = e.target;
    
    // Height slider
    if (target.id === 'height') {
      const value = target.value;
      document.getElementById('heightValue').textContent = value;
      updateProperty('height', value);
    }
    
    // Search inputs
    if (target.classList.contains('search-input')) {
      const container = target.closest('.tile-palette-container, .script-patterns-container');
      if (container) {
        filterContent(container, target.value);
      }
    }
  }
  
  // Helper functions for panel interactions
  function selectTool(tool) {
    vscode.postMessage({
      type: 'tool',
      command: 'selectTool',
      tool: tool
    });
    
    // Update status bar
    updateStatusBarItem('currentTool', tool);
  }
  
  function selectTile(tileId) {
    vscode.postMessage({
      type: 'tool',
      command: 'selectTile',
      tileId: parseInt(tileId)
    });
    
    // Update status bar
    updateStatusBarItem('selectedTile', `Tile ${tileId}`);
  }
  
  function toggleLayer(layerElement) {
    const layerName = layerElement.querySelector('.layer-name').textContent;
    const isVisible = layerElement.querySelector('input[type="checkbox"]').checked;
    
    vscode.postMessage({
      type: 'tool',
      command: 'toggleLayer',
      layer: layerName,
      visible: isVisible
    });
  }
  
  function insertPattern(patternType) {
    vscode.postMessage({
      type: 'tool',
      command: 'insertPattern',
      pattern: patternType
    });
  }
  
  function updateProperty(property, value) {
    vscode.postMessage({
      type: 'tool',
      command: 'updateProperty',
      args: { property, value }
    });
  }
  
  function runValidation() {
    vscode.postMessage({
      type: 'tool',
      command: 'executeAction',
      action: 'manicMiners.runValidation'
    });
  }
  
  function autoFixIssues() {
    vscode.postMessage({
      type: 'tool',
      command: 'executeAction',
      action: 'manicMiners.fixCommonIssues'
    });
  }
  
  function filterPatterns(category) {
    const items = document.querySelectorAll('.pattern-item');
    items.forEach(item => {
      if (category === 'all' || item.getAttribute('data-category') === category) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }
  
  function filterContent(container, searchTerm) {
    const items = container.querySelectorAll('.tile-item, .pattern-item');
    const term = searchTerm.toLowerCase();
    
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      if (text.includes(term)) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  }
  
  function updateStatusBarItem(id, value) {
    const element = document.querySelector(`#${id} .value`);
    if (element) {
      element.textContent = value;
    }
  }
  
  function restoreHistoryState(historyItem) {
    const index = Array.from(historyItem.parentElement.children).indexOf(historyItem);
    vscode.postMessage({
      type: 'history',
      command: 'restore',
      index: index
    });
  }
  
  function updateValidationRules() {
    const rules = {};
    document.querySelectorAll('.validation-rule input[type="checkbox"]').forEach(checkbox => {
      const ruleName = checkbox.nextElementSibling.textContent.trim();
      rules[ruleName] = checkbox.checked;
    });
    
    vscode.postMessage({
      type: 'validation',
      command: 'updateRules',
      rules: rules
    });
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
    
    // If panel is part of a tab group, add appropriate class
    if (panelState.tabGroup) {
      panelElement.classList.add('tabbed-panel');
      panelElement.setAttribute('data-tab-group', panelState.tabGroup);
      if (!panelState.activeTab) {
        panelElement.classList.add('tab-hidden');
      }
    }
    
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
  
  function getScriptPatternsContent() {
    return `
      <div class="script-patterns-container">
        <div class="pattern-search">
          <input type="text" placeholder="Search patterns..." class="search-input">
        </div>
        <div class="pattern-categories">
          <button class="category-btn active">All</button>
          <button class="category-btn">Events</button>
          <button class="category-btn">Logic</button>
          <button class="category-btn">Actions</button>
        </div>
        <div class="pattern-list">
          <div class="pattern-item" data-pattern="timer">
            <span class="pattern-icon">⏱️</span>
            <div class="pattern-details">
              <span class="pattern-name">Timer Pattern</span>
              <span class="pattern-desc">Add timed events to your map</span>
            </div>
            <button class="pattern-insert">Insert</button>
          </div>
          <div class="pattern-item" data-pattern="loop">
            <span class="pattern-icon">🔄</span>
            <div class="pattern-details">
              <span class="pattern-name">Loop Pattern</span>
              <span class="pattern-desc">Create repeating actions</span>
            </div>
            <button class="pattern-insert">Insert</button>
          </div>
          <div class="pattern-item" data-pattern="objective">
            <span class="pattern-icon">🎯</span>
            <div class="pattern-details">
              <span class="pattern-name">Objective Pattern</span>
              <span class="pattern-desc">Define map objectives</span>
            </div>
            <button class="pattern-insert">Insert</button>
          </div>
          <div class="pattern-item" data-pattern="trigger">
            <span class="pattern-icon">⚡</span>
            <div class="pattern-details">
              <span class="pattern-name">Trigger Pattern</span>
              <span class="pattern-desc">Set up event triggers</span>
            </div>
            <button class="pattern-insert">Insert</button>
          </div>
        </div>
      </div>
    `;
  }
  
  function getValidationContent() {
    return `
      <div class="validation-container">
        <div class="validation-header">
          <h3>Map Validation</h3>
          <button class="refresh-btn" title="Refresh">🔄</button>
        </div>
        <div class="validation-summary">
          <div class="validation-stat">
            <span class="stat-icon error">❌</span>
            <span class="stat-count">0</span>
            <span class="stat-label">Errors</span>
          </div>
          <div class="validation-stat">
            <span class="stat-icon warning">⚠️</span>
            <span class="stat-count">2</span>
            <span class="stat-label">Warnings</span>
          </div>
          <div class="validation-stat">
            <span class="stat-icon info">ℹ️</span>
            <span class="stat-count">5</span>
            <span class="stat-label">Info</span>
          </div>
        </div>
        <div class="validation-options">
          <h4>Validation Rules</h4>
          <label class="validation-rule">
            <input type="checkbox" checked>
            <span>Check tile boundaries</span>
          </label>
          <label class="validation-rule">
            <input type="checkbox" checked>
            <span>Validate objectives</span>
          </label>
          <label class="validation-rule">
            <input type="checkbox" checked>
            <span>Verify resources</span>
          </label>
          <label class="validation-rule">
            <input type="checkbox">
            <span>Check script syntax</span>
          </label>
        </div>
        <div class="validation-actions">
          <button class="action-btn primary">Run Full Validation</button>
          <button class="action-btn">Auto-fix Issues</button>
        </div>
      </div>
    `;
  }
  
  function getStatisticsContent() {
    return `
      <div class="statistics-container">
        <h3>Map Statistics</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📐</div>
            <div class="stat-info">
              <span class="stat-value">10x10</span>
              <span class="stat-label">Map Size</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎨</div>
            <div class="stat-info">
              <span class="stat-value">100</span>
              <span class="stat-label">Total Tiles</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💎</div>
            <div class="stat-info">
              <span class="stat-value">15</span>
              <span class="stat-label">Crystals</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏢</div>
            <div class="stat-info">
              <span class="stat-value">3</span>
              <span class="stat-label">Buildings</span>
            </div>
          </div>
        </div>
        <div class="chart-container">
          <h4>Tile Distribution</h4>
          <div class="mini-chart">
            <div class="chart-bar" style="height: 60%; background: #8b4513;" title="Dirt: 60%"></div>
            <div class="chart-bar" style="height: 30%; background: #666;" title="Rock: 30%"></div>
            <div class="chart-bar" style="height: 10%; background: #2a2a2a;" title="Empty: 10%"></div>
          </div>
        </div>
      </div>
    `;
  }
  
  function getHistoryContent() {
    return `
      <div class="history-container">
        <div class="history-header">
          <h3>Edit History</h3>
          <div class="history-controls">
            <button class="history-btn" title="Undo">↶</button>
            <button class="history-btn" title="Redo">↷</button>
            <button class="history-btn" title="Clear">🗑️</button>
          </div>
        </div>
        <div class="history-timeline">
          <div class="history-item current">
            <span class="history-icon">🖌️</span>
            <div class="history-details">
              <span class="history-action">Placed tile at (5,5)</span>
              <span class="history-time">Just now</span>
            </div>
          </div>
          <div class="history-item">
            <span class="history-icon">🏢</span>
            <div class="history-details">
              <span class="history-action">Added Tool Store</span>
              <span class="history-time">2 min ago</span>
            </div>
          </div>
          <div class="history-item">
            <span class="history-icon">📏</span>
            <div class="history-details">
              <span class="history-action">Modified terrain height</span>
              <span class="history-time">5 min ago</span>
            </div>
          </div>
          <div class="history-item">
            <span class="history-icon">🎨</span>
            <div class="history-details">
              <span class="history-action">Fill area with dirt</span>
              <span class="history-time">10 min ago</span>
            </div>
          </div>
          <div class="history-item">
            <span class="history-icon">💎</span>
            <div class="history-details">
              <span class="history-action">Placed crystals</span>
              <span class="history-time">15 min ago</span>
            </div>
          </div>
        </div>
      </div>
    `;
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
    
    // Group panels by tab groups and position
    const tabGroups = new Map();
    const regularPanels = [];
    
    panels.forEach(panelState => {
      if (panelState.tabGroup) {
        const key = `${panelState.position}-${panelState.tabGroup}`;
        if (!tabGroups.has(key)) {
          tabGroups.set(key, {
            position: panelState.position,
            groupName: panelState.tabGroup,
            panels: []
          });
        }
        tabGroups.get(key).panels.push(panelState);
      } else if (panelState.visible) {
        regularPanels.push(panelState);
      }
    });
    
    // Create tab containers for grouped panels
    tabGroups.forEach(group => {
      const tabContainer = createTabContainer(group);
      const zone = dockZones[group.position] || dockZones.center;
      if (zone && tabContainer) {
        zone.appendChild(tabContainer);
      }
    });
    
    // Create and place regular panels
    regularPanels.forEach(panelState => {
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
  
  // Create a container for tabbed panels
  function createTabContainer(group) {
    const container = document.createElement('div');
    container.className = 'tab-container';
    container.setAttribute('data-tab-group', group.groupName);
    
    // Create tab header
    const tabHeader = document.createElement('div');
    tabHeader.className = 'tab-header';
    
    // Create tabs
    group.panels.forEach(panelState => {
      const tab = document.createElement('button');
      tab.className = 'tab-button';
      if (panelState.activeTab) {
        tab.classList.add('active');
      }
      tab.setAttribute('data-panel-id', panelState.id);
      tab.innerHTML = `
        <span class="tab-icon">${panelState.icon}</span>
        <span class="tab-title">${panelState.title}</span>
        <button class="tab-close" data-panel-id="${panelState.id}">×</button>
      `;
      
      // Tab click handler
      tab.addEventListener('click', (e) => {
        if (!e.target.classList.contains('tab-close')) {
          switchTab(panelState.id);
        }
      });
      
      // Tab close handler
      const closeBtn = tab.querySelector('.tab-close');
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closePanel(panelState.id);
      });
      
      tabHeader.appendChild(tab);
    });
    
    // Add tab header to container
    container.appendChild(tabHeader);
    
    // Create panel content area
    const contentArea = document.createElement('div');
    contentArea.className = 'tab-content-area';
    
    // Add all panels in the group
    group.panels.forEach(panelState => {
      const panel = createPanel(panelState);
      if (panel) {
        contentArea.appendChild(panel);
      }
    });
    
    container.appendChild(contentArea);
    
    return container;
  }
  
  // Switch between tabs
  function switchTab(panelId) {
    vscode.postMessage({
      type: 'panel',
      command: 'setActiveTab',
      panelId: panelId
    });
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