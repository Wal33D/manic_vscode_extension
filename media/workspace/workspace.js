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
    splitViews: new Map(), // Track split view configurations
    activeSplitView: null,
  };
  
  // Performance optimizations
  let performanceManager = null;
  let virtualScrollers = new Map();
  let canvasOptimizers = new Map();
  
  // Initialize workspace
  function initialize() {
    // Wait for performance manager to load
    waitForPerformanceManager(() => {
      // Set up event handlers with performance optimizations
      initializeEventHandlers();
      
      // Initialize performance monitoring
      initializePerformanceOptimizations();
      
      // Send ready message
      vscode.postMessage({ type: 'ready' });
    });
  }
  
  // Wait for performance manager to be available
  function waitForPerformanceManager(callback) {
    if (window.performanceManager) {
      performanceManager = window.performanceManager;
      callback();
    } else {
      setTimeout(() => waitForPerformanceManager(callback), 50);
    }
  }
  
  // Initialize performance optimizations
  function initializePerformanceOptimizations() {
    // Set up debounced resize handling
    performanceManager.debouncedResize.observe(
      document.getElementById('workspace-container'),
      handleWorkspaceResize
    );
    
    // Set up lazy loading for panels
    setupLazyLoadingObservers();
    
    // Monitor performance
    if (window.location.search.includes('debug=true')) {
      setInterval(() => {
        const metrics = performanceManager.getMetrics();
        console.log('Performance metrics:', metrics);
      }, 5000);
    }
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
    
    // Split view controls
    document.getElementById('splitHorizontalBtn')?.addEventListener('click', () => splitView('horizontal'));
    document.getElementById('splitVerticalBtn')?.addEventListener('click', () => splitView('vertical'));
    document.getElementById('unsplitBtn')?.addEventListener('click', unsplitView);
    
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
    showSaveLayoutDialog();
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
    
    // Show layout selection dialog with focus trap
    showLayoutSelectionDialog(layouts);
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
    
    // Add animation class based on position
    if (panelState.position === 'float') {
      panelElement.classList.add('panel-float');
    } else if (panelState.position === 'left') {
      panelElement.classList.add('panel-left');
    } else if (panelState.position === 'right') {
      panelElement.classList.add('panel-right');
    } else if (panelState.position === 'top') {
      panelElement.classList.add('panel-top');
    } else if (panelState.position === 'bottom') {
      panelElement.classList.add('panel-bottom');
    }
    
    // Add performance optimization classes
    panelElement.classList.add('will-animate', 'hardware-accelerated');
    
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
    const titleElement = panel.querySelector('.panel-title');
    titleElement.textContent = panelState.title;
    titleElement.id = `panel-title-${panelState.id}`;
    
    // Update panel aria-label
    panelElement.setAttribute('aria-label', `${panelState.title} panel`);
    panelElement.setAttribute('aria-labelledby', `panel-title-${panelState.id}`);
    
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
    
    // Show loading state initially
    showShimmerEffect(content, 4);
    
    // Load actual content after a short delay (simulating async load)
    setTimeout(() => {
      const panelContent = getPanelContent(panelState.id);
      hideLoadingState(content, panelContent);
      
      // Initialize any lazy loading for the panel
      setupPanelLazyLoading(panelState.id, content);
    }, 300);
    
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
      <div class="tools-grid" role="toolbar" aria-label="Drawing tools">
        <button class="tool-btn" data-tool="paint" title="Paint Tool"
                aria-label="Paint tool" aria-pressed="false" role="button">
          <span class="icon" aria-hidden="true">🖌️</span>
          <span>Paint</span>
        </button>
        <button class="tool-btn" data-tool="fill" title="Fill Tool"
                aria-label="Fill tool" aria-pressed="false" role="button">
          <span class="icon" aria-hidden="true">🪣</span>
          <span>Fill</span>
        </button>
        <button class="tool-btn" data-tool="line" title="Line Tool"
                aria-label="Line drawing tool" aria-pressed="false" role="button">
          <span class="icon" aria-hidden="true">📏</span>
          <span>Line</span>
        </button>
        <button class="tool-btn" data-tool="rect" title="Rectangle Tool"
                aria-label="Rectangle drawing tool" aria-pressed="false" role="button">
          <span class="icon" aria-hidden="true">⬛</span>
          <span>Rectangle</span>
        </button>
        <button class="tool-btn" data-tool="circle" title="Circle Tool"
                aria-label="Circle drawing tool" aria-pressed="false" role="button">
          <span class="icon" aria-hidden="true">⭕</span>
          <span>Circle</span>
        </button>
        <button class="tool-btn" data-tool="select" title="Selection Tool"
                aria-label="Selection tool" aria-pressed="false" role="button">
          <span class="icon" aria-hidden="true">✂️</span>
          <span>Select</span>
        </button>
        <button class="tool-btn" data-tool="picker" title="Picker Tool"
                aria-label="Color picker tool" aria-pressed="false" role="button">
          <span class="icon" aria-hidden="true">💧</span>
          <span>Picker</span>
        </button>
        <button class="tool-btn" data-tool="eraser" title="Eraser Tool"
                aria-label="Eraser tool" aria-pressed="false" role="button">
          <span class="icon" aria-hidden="true">🧹</span>
          <span>Eraser</span>
        </button>
      </div>
    `;
  }
  
  function getPropertiesPanelContent() {
    return `
      <div class="properties-container" role="form" aria-label="Tile properties">
        <div class="property-group" role="group">
          <label for="tileType" id="tileTypeLabel">Tile Type</label>
          <select id="tileType" class="property-select" 
                  aria-labelledby="tileTypeLabel" aria-describedby="tileTypeDesc">
            <option value="0">Empty (0)</option>
            <option value="1">Dirt (1)</option>
            <option value="4">Solid Rock (4)</option>
          </select>
          <span id="tileTypeDesc" class="sr-only">Select the type of tile to place</span>
        </div>
        <div class="property-group" role="group">
          <label for="height" id="heightLabel">Height</label>
          <input type="range" id="height" min="0" max="9" value="5" 
                 class="property-range" aria-labelledby="heightLabel"
                 aria-valuemin="0" aria-valuemax="9" aria-valuenow="5"
                 aria-describedby="heightDesc">
          <span id="heightValue" aria-live="polite" aria-atomic="true">5</span>
          <span id="heightDesc" class="sr-only">Adjust the tile height from 0 to 9</span>
        </div>
        <div class="property-group" role="group">
          <label for="building" id="buildingLabel">Building</label>
          <select id="building" class="property-select"
                  aria-labelledby="buildingLabel" aria-describedby="buildingDesc">
            <option value="">None</option>
            <option value="ToolStore">Tool Store</option>
            <option value="TeleportPad">Teleport Pad</option>
          </select>
          <span id="buildingDesc" class="sr-only">Select a building to place on this tile</span>
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
    const panel = document.getElementById(`panel-${panelId}`);
    if (panel) {
      // Add minimizing animation class
      panel.classList.add('minimizing');
      
      // Remove animation class after animation completes
      setTimeout(() => {
        panel.classList.remove('minimizing');
      }, 300);
    }
    
    vscode.postMessage({
      type: 'panel',
      command: 'collapse',
      panelId: panelId,
      collapsed: true // Toggle will be handled by provider
    });
    
    // Show notification
    const panelName = panel?.querySelector('.panel-title')?.textContent || 'Panel';
    showNotification(`${panelName} minimized`, 'info', 2000);
  }
  
  function togglePanelMaximize(panelId) {
    const panel = document.getElementById(`panel-${panelId}`);
    const isMaximized = panel?.classList.contains('maximized');
    
    if (panel) {
      // Add maximizing animation class
      if (!isMaximized) {
        panel.classList.add('maximizing');
        setTimeout(() => {
          panel.classList.remove('maximizing');
        }, 300);
      } else {
        // Add minimize animation when restoring
        panel.classList.add('minimizing');
        setTimeout(() => {
          panel.classList.remove('minimizing');
        }, 300);
      }
    }
    
    vscode.postMessage({
      type: 'panel',
      command: 'maximize',
      panelId: panelId,
      maximized: !isMaximized
    });
  }
  
  function closePanel(panelId) {
    const panel = document.getElementById(`panel-${panelId}`);
    if (panel) {
      // Add closing animation
      panel.style.animation = 'fadeOut 0.3s ease-out forwards';
      
      // Wait for animation to complete before closing
      setTimeout(() => {
        vscode.postMessage({
          type: 'panel',
          command: 'close',
          panelId: panelId
        });
      }, 300);
    } else {
      // If panel not found, close immediately
      vscode.postMessage({
        type: 'panel',
        command: 'close',
        panelId: panelId
      });
    }
  }
  
  // Dock Management
  function toggleDock(dockPosition) {
    const dock = document.getElementById(`dock-${dockPosition}`);
    if (dock) {
      dock.classList.toggle('collapsed');
    }
  }
  
  // Loading States
  function showLoadingState(container, message = 'Loading...') {
    const loadingHtml = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-message">${message}</p>
      </div>
    `;
    container.innerHTML = loadingHtml;
  }
  
  function showShimmerEffect(container, lines = 3) {
    const shimmerHtml = Array(lines).fill(0).map((_, i) => `
      <div class="loading-shimmer" style="width: ${80 + Math.random() * 20}%; margin-bottom: 8px; height: 20px; border-radius: 4px;"></div>
    `).join('');
    container.innerHTML = `<div class="shimmer-container">${shimmerHtml}</div>`;
  }
  
  function hideLoadingState(container, content) {
    // Add fade-in animation when content loads
    container.style.opacity = '0';
    container.innerHTML = content;
    
    // Trigger reflow
    void container.offsetHeight;
    
    // Fade in
    container.style.transition = 'opacity 0.3s ease-in';
    container.style.opacity = '1';
    
    // Clean up transition
    setTimeout(() => {
      container.style.transition = '';
    }, 300);
  }
  
  function setupPanelLazyLoading(panelId, container) {
    // Set up lazy loading for specific panels
    if (panelId === 'tilePalette' || panelId === 'mapsExplorer') {
      // Use virtual scrolling for these panels
      if (window.VirtualScroll) {
        const listContainer = container.querySelector('.tile-list, .maps-list');
        if (listContainer) {
          const virtualScroller = new window.VirtualScroll(listContainer, {
            itemHeight: 60,
            buffer: 5
          });
          virtualScrollers.set(panelId, virtualScroller);
        }
      }
    }
    
    // Set up intersection observer for lazy loading images
    if ('IntersectionObserver' in window) {
      const images = container.querySelectorAll('img[data-src]');
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });
      
      images.forEach(img => imageObserver.observe(img));
    }
  }
  
  // Notifications
  function showNotification(message, type = 'info', duration = 3000) {
    // Create notification container if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'notification-container';
      document.body.appendChild(container);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-icon">${getNotificationIcon(type)}</div>
      <div class="notification-content">
        <p class="notification-message">${message}</p>
      </div>
      <button class="notification-close">×</button>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Set up close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      dismissNotification(notification);
    });
    
    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        dismissNotification(notification);
      }, duration);
    }
    
    return notification;
  }
  
  function dismissNotification(notification) {
    notification.classList.add('notification-exit');
    setTimeout(() => {
      notification.remove();
      
      // Remove container if empty
      const container = document.getElementById('notification-container');
      if (container && container.children.length === 0) {
        container.remove();
      }
    }, 300);
  }
  
  function getNotificationIcon(type) {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '⚠️';
      case 'warning': return '⚡';
      case 'info': return 'ℹ️';
      default: return '💬';
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
      const splitId = e.target.getAttribute('data-split-id');
      if (splitId) {
        startSplitViewDrag(e.target, e, splitId);
      } else {
        startDockSplitterDrag(e.target, e);
      }
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
    
    // Create drag ghost
    const ghost = createDragGhost(panel);
    workspaceState.draggedPanel.ghost = ghost;
    
    // Change cursor
    document.body.style.cursor = 'grabbing';
    
    // Add drop zones
    addDropZones(panel);
  }
  
  function dragPanel(e) {
    const drag = workspaceState.draggedPanel;
    if (!drag) return;
    
    const x = e.clientX - drag.offsetX;
    const y = e.clientY - drag.offsetY;
    
    drag.element.style.left = `${x}px`;
    drag.element.style.top = `${y}px`;
    
    // Update ghost position if it exists
    if (drag.ghost) {
      drag.ghost.style.left = `${x}px`;
      drag.ghost.style.top = `${y}px`;
    }
    
    // Check for drop zone hover
    updateDropZoneHover(e.clientX, e.clientY);
  }
  
  function endPanelDrag() {
    const drag = workspaceState.draggedPanel;
    if (!drag) return;
    
    drag.element.classList.remove('dragging');
    
    // Remove ghost
    if (drag.ghost) {
      drag.ghost.remove();
    }
    
    // Reset cursor
    document.body.style.cursor = '';
    
    // Check for drop on zone
    const dropZone = getActiveDropZone();
    if (dropZone) {
      handleDropOnZone(drag.id, dropZone);
    } else {
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
    }
    
    // Remove drop zones
    removeDropZones();
    
    workspaceState.draggedPanel = null;
  }
  
  // Drag and Drop Helper Functions
  function createDragGhost(panel) {
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.style.position = 'absolute';
    ghost.style.width = panel.offsetWidth + 'px';
    ghost.style.height = panel.offsetHeight + 'px';
    ghost.style.left = panel.offsetLeft + 'px';
    ghost.style.top = panel.offsetTop + 'px';
    ghost.style.backgroundColor = 'var(--vscode-editor-selectionBackground)';
    ghost.style.opacity = '0.3';
    ghost.style.border = '2px dashed var(--vscode-focusBorder)';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '999';
    ghost.style.borderRadius = '4px';
    document.body.appendChild(ghost);
    return ghost;
  }
  
  function addDropZones(excludePanel) {
    // Add drop zones to docks
    const docks = ['left', 'right', 'top', 'bottom'];
    docks.forEach(position => {
      const dock = document.getElementById(`dock-${position}`);
      if (dock) {
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.setAttribute('data-position', position);
        dropZone.style.position = 'absolute';
        dropZone.style.inset = '0';
        dropZone.style.zIndex = '998';
        dock.appendChild(dropZone);
      }
    });
    
    // Add center drop zone
    const centerZone = document.createElement('div');
    centerZone.className = 'drop-zone drop-zone-center';
    centerZone.setAttribute('data-position', 'center');
    centerZone.style.position = 'absolute';
    centerZone.style.left = '250px';
    centerZone.style.right = '250px';
    centerZone.style.top = '100px';
    centerZone.style.bottom = '100px';
    centerZone.style.zIndex = '997';
    document.getElementById('workspace-container').appendChild(centerZone);
  }
  
  function removeDropZones() {
    document.querySelectorAll('.drop-zone').forEach(zone => zone.remove());
  }
  
  function updateDropZoneHover(x, y) {
    // Remove previous hover states
    document.querySelectorAll('.drop-zone.drag-over').forEach(zone => {
      zone.classList.remove('drag-over');
    });
    
    // Find drop zone under cursor
    const element = document.elementFromPoint(x, y);
    const dropZone = element?.closest('.drop-zone');
    if (dropZone) {
      dropZone.classList.add('drag-over');
    }
  }
  
  function getActiveDropZone() {
    return document.querySelector('.drop-zone.drag-over');
  }
  
  function handleDropOnZone(panelId, dropZone) {
    const position = dropZone.getAttribute('data-position');
    
    // Send dock command to backend
    vscode.postMessage({
      type: 'panel',
      command: 'dock',
      panelId: panelId,
      position: position
    });
    
    // Show notification
    showNotification(`Panel docked to ${position}`, 'success', 2000);
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
    
    // Disable transitions during resize for smooth feedback
    panel.style.transition = 'none';
    panel.classList.add('resizing');
    
    // Add resize ghost overlay
    const ghost = document.createElement('div');
    ghost.className = 'resize-ghost';
    ghost.style.position = 'absolute';
    ghost.style.border = '2px dashed var(--vscode-focusBorder)';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    updateResizeGhost(ghost, panel);
    document.body.appendChild(ghost);
    workspaceState.resizingPanel.ghost = ghost;
  }
  
  function updateResizeGhost(ghost, panel) {
    const rect = panel.getBoundingClientRect();
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
  }
  
  function resizePanel(e) {
    const resize = workspaceState.resizingPanel;
    if (!resize) return;
    
    const width = Math.max(200, resize.startWidth + e.clientX - resize.startX);
    const height = Math.max(100, resize.startHeight + e.clientY - resize.startY);
    
    // Update ghost overlay
    if (resize.ghost) {
      resize.ghost.style.width = `${width}px`;
      resize.ghost.style.height = `${height}px`;
    }
    
    // Update panel size
    resize.element.style.width = `${width}px`;
    resize.element.style.height = `${height}px`;
  }
  
  function endPanelResize() {
    const resize = workspaceState.resizingPanel;
    if (!resize) return;
    
    // Remove ghost overlay
    if (resize.ghost) {
      resize.ghost.remove();
    }
    
    // Re-enable transitions with smooth animation
    resize.element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    resize.element.classList.remove('resizing');
    
    // Add a subtle bounce effect
    resize.element.style.transform = 'scale(1.02)';
    setTimeout(() => {
      resize.element.style.transform = 'scale(1)';
    }, 150);
    
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
  
  // Splitter dragging functions
  function startDockSplitterDrag(splitter, e) {
    workspaceState.splitterDragging = {
      element: splitter,
      startX: e.clientX,
      startY: e.clientY,
      type: 'dock'
    };
    
    splitter.classList.add('dragging');
  }
  
  function startSplitViewDrag(splitter, e, splitId) {
    const splitConfig = workspaceState.splitViews.get(splitId);
    if (!splitConfig) return;
    
    workspaceState.splitterDragging = {
      element: splitter,
      startX: e.clientX,
      startY: e.clientY,
      splitId: splitId,
      initialRatio: splitConfig.ratio,
      direction: splitConfig.direction,
      type: 'split'
    };
    
    splitter.classList.add('dragging');
  }
  
  function dragSplitter(e) {
    const drag = workspaceState.splitterDragging;
    if (!drag) return;
    
    if (drag.type === 'split') {
      const container = document.getElementById(drag.splitId);
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      let newRatio;
      
      if (drag.direction === 'horizontal') {
        const deltaY = e.clientY - drag.startY;
        const heightPercent = deltaY / rect.height;
        newRatio = Math.max(0.1, Math.min(0.9, drag.initialRatio + heightPercent));
      } else {
        const deltaX = e.clientX - drag.startX;
        const widthPercent = deltaX / rect.width;
        newRatio = Math.max(0.1, Math.min(0.9, drag.initialRatio + widthPercent));
      }
      
      // Update split view ratio
      const splitConfig = workspaceState.splitViews.get(drag.splitId);
      if (splitConfig) {
        splitConfig.ratio = newRatio;
        recalculateSplitViews();
      }
    }
  }
  
  function endSplitterDrag() {
    if (workspaceState.splitterDragging) {
      workspaceState.splitterDragging.element.classList.remove('dragging');
      workspaceState.splitterDragging = null;
    }
  }
  
  // Handle messages from extension
  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
      case 'updateWorkspace':
        updateWorkspace(message.panels, message.layouts);
        break;
      case 'updatePanelContent':
        if (window.updatePanelContent) {
          updatePanelContent(message.panelId, message.content, message.isPlaceholder);
        }
        break;
      case 'setupLazyLoad':
        setupPanelLazyLoading(message.panelId, message.placeholder);
        break;
      case 'dataResponse':
        if (window.handleDataResponse) {
          handleDataResponse(message);
        }
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
    // Recalculate split view dimensions
    if (workspaceState.activeSplitView) {
      recalculateSplitViews();
    }
  }
  
  // Split View Functions
  function splitView(direction) {
    const centerArea = document.getElementById('workspace-center');
    if (!centerArea) return;
    
    // Create split container
    const splitContainer = document.createElement('div');
    splitContainer.className = `split-container split-${direction}`;
    splitContainer.id = `split-${Date.now()}`;
    
    // Create two panes
    const pane1 = document.createElement('div');
    pane1.className = 'split-pane';
    pane1.id = `${splitContainer.id}-pane1`;
    
    const splitter = document.createElement('div');
    splitter.className = `splitter ${direction}`;
    splitter.setAttribute('data-split-id', splitContainer.id);
    
    const pane2 = document.createElement('div');
    pane2.className = 'split-pane';
    pane2.id = `${splitContainer.id}-pane2`;
    
    // Move current content to first pane
    const currentContent = centerArea.querySelector('#workspace-content');
    if (currentContent) {
      pane1.appendChild(currentContent);
    }
    
    // Create new content area for second pane
    const newContent = document.createElement('div');
    newContent.className = 'workspace-content-split';
    newContent.innerHTML = `
      <div class="split-welcome">
        <h3>Split View</h3>
        <p>Drag panels here or select a view:</p>
        <div class="split-view-options">
          <button class="split-option-btn" data-view="mapPreview">Map Preview</button>
          <button class="split-option-btn" data-view="heatMap">Heat Map</button>
          <button class="split-option-btn" data-view="statistics">Statistics</button>
          <button class="split-option-btn" data-view="script">Script Editor</button>
        </div>
      </div>
    `;
    pane2.appendChild(newContent);
    
    // Assemble split container
    splitContainer.appendChild(pane1);
    splitContainer.appendChild(splitter);
    splitContainer.appendChild(pane2);
    
    // Replace center content
    centerArea.innerHTML = '';
    centerArea.appendChild(splitContainer);
    
    // Track split view
    workspaceState.splitViews.set(splitContainer.id, {
      direction,
      pane1: pane1.id,
      pane2: pane2.id,
      ratio: 0.5
    });
    workspaceState.activeSplitView = splitContainer.id;
    
    // Initialize split view interactions
    initializeSplitViewInteractions(splitContainer);
    
    // Update workspace
    vscode.postMessage({
      type: 'workspace',
      command: 'splitView',
      direction: direction
    });
  }
  
  function unsplitView() {
    const centerArea = document.getElementById('workspace-center');
    if (!centerArea || !workspaceState.activeSplitView) return;
    
    const splitContainer = document.getElementById(workspaceState.activeSplitView);
    if (!splitContainer) return;
    
    // Get the first pane content
    const pane1 = splitContainer.querySelector('.split-pane');
    const content = pane1?.querySelector('#workspace-content, .workspace-content-split');
    
    if (content) {
      content.id = 'workspace-content';
      centerArea.innerHTML = '';
      centerArea.appendChild(content);
    }
    
    // Clean up split view state
    workspaceState.splitViews.delete(workspaceState.activeSplitView);
    workspaceState.activeSplitView = null;
    
    // Update workspace
    vscode.postMessage({
      type: 'workspace',
      command: 'unsplitView'
    });
  }
  
  function initializeSplitViewInteractions(container) {
    // Handle split option buttons
    container.querySelectorAll('.split-option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = btn.getAttribute('data-view');
        const pane = btn.closest('.split-pane');
        loadViewInPane(view, pane);
      });
    });
  }
  
  function loadViewInPane(viewType, pane) {
    let content = '';
    switch (viewType) {
      case 'mapPreview':
        content = '<div class="embedded-view" data-view="mapPreview"><h3>Map Preview</h3><canvas id="split-map-preview"></canvas></div>';
        break;
      case 'heatMap':
        content = '<div class="embedded-view" data-view="heatMap"><h3>Heat Map Analysis</h3><canvas id="split-heat-map"></canvas></div>';
        break;
      case 'statistics':
        content = getStatisticsContent();
        break;
      case 'script':
        content = '<div class="embedded-view" data-view="script"><h3>Script Editor</h3><textarea class="script-editor" placeholder="Enter script code..."></textarea></div>';
        break;
    }
    
    pane.innerHTML = `<div class="workspace-content-split">${content}</div>`;
    
    // Initialize view-specific functionality
    if (viewType === 'mapPreview' || viewType === 'heatMap') {
      initializeCanvasView(pane, viewType);
    }
  }
  
  function initializeCanvasView(pane, viewType) {
    const canvas = pane.querySelector('canvas');
    if (!canvas) return;
    
    // Request render from extension
    vscode.postMessage({
      type: 'workspace',
      command: 'renderView',
      viewType: viewType,
      targetId: canvas.id
    });
  }
  
  function recalculateSplitViews() {
    workspaceState.splitViews.forEach((config, id) => {
      const container = document.getElementById(id);
      if (container) {
        const panes = container.querySelectorAll('.split-pane');
        if (panes.length === 2) {
          if (config.direction === 'horizontal') {
            panes[0].style.height = `${config.ratio * 100}%`;
            panes[1].style.height = `${(1 - config.ratio) * 100}%`;
          } else {
            panes[0].style.width = `${config.ratio * 100}%`;
            panes[1].style.width = `${(1 - config.ratio) * 100}%`;
          }
        }
      }
    });
  }
  
  // Dialog Functions with Focus Trap
  function showLayoutSelectionDialog(layouts) {
    if (!window.focusTrapManager) return;
    
    const layoutItems = layouts.map(layout => `
      <div class="layout-item" data-layout="${layout.name}">
        <h4>${layout.name}</h4>
        <p>Created: ${new Date(layout.timestamp).toLocaleString()}</p>
        <div class="layout-actions">
          <button class="btn btn-primary" data-action="load" data-layout="${layout.name}">Load</button>
          <button class="btn btn-danger" data-action="delete" data-layout="${layout.name}">Delete</button>
        </div>
      </div>
    `).join('');
    
    const content = `
      <div class="layout-list">
        ${layoutItems || '<p>No saved layouts found</p>'}
      </div>
    `;
    
    const modal = window.focusTrapManager.createModal(content, {
      title: 'Select Layout',
      className: 'modal-layouts',
      escapeDeactivates: true,
      clickOutsideDeactivates: true
    });
    
    // Handle button clicks
    modal.element.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-action]');
      if (button) {
        const action = button.dataset.action;
        const layoutName = button.dataset.layout;
        
        if (action === 'load') {
          vscode.postMessage({
            type: 'layout',
            command: 'load',
            name: layoutName
          });
          modal.close();
        } else if (action === 'delete') {
          if (confirm(`Delete layout "${layoutName}"?`)) {
            vscode.postMessage({
              type: 'layout',
              command: 'delete',
              name: layoutName
            });
            // Update dialog content
            const layoutItem = button.closest('.layout-item');
            if (layoutItem) {
              layoutItem.remove();
            }
          }
        }
      }
    });
  }
  
  window.showLayoutSelectionDialog = showLayoutSelectionDialog;
  
  function showSaveLayoutDialog() {
    if (!window.focusTrapManager) {
      // Fallback to prompt
      const name = prompt('Enter layout name:');
      if (name) {
        vscode.postMessage({
          type: 'layout',
          command: 'save',
          name: name
        });
      }
      return;
    }
    
    const content = `
      <form class="save-layout-form">
        <div class="form-group">
          <label for="layout-name">Layout Name:</label>
          <input type="text" id="layout-name" class="form-control" placeholder="Enter layout name" required>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Save</button>
          <button type="button" class="btn btn-secondary cancel-btn">Cancel</button>
        </div>
      </form>
    `;
    
    const modal = window.focusTrapManager.createModal(content, {
      title: 'Save Layout',
      className: 'modal-save-layout',
      initialFocus: '#layout-name',
      escapeDeactivates: true,
      clickOutsideDeactivates: true
    });
    
    const form = modal.element.querySelector('.save-layout-form');
    const cancelBtn = modal.element.querySelector('.cancel-btn');
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('#layout-name');
      const name = input.value.trim();
      
      if (name) {
        vscode.postMessage({
          type: 'layout',
          command: 'save',
          name: name
        });
        modal.close();
      }
    });
    
    cancelBtn.addEventListener('click', () => {
      modal.close();
    });
  }
  
  window.showSaveLayoutDialog = showSaveLayoutDialog;
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();