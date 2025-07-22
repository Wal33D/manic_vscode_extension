// @ts-check
(function() {
  let draggedPanel = null;
  let dragOffset = { x: 0, y: 0 };
  let resizingPanel = null;
  let resizeStart = { x: 0, y: 0, width: 0, height: 0 };

  // Initialize panels data
  window.panelsData = new Map();
  panels.forEach(panel => {
    window.panelsData.set(panel.id, panel);
  });

  // Panel visibility management
  let activeDropdown = null;
  
  // Initialize all event handlers using delegation
  function initializeEventHandlers() {
    // Main document click handler for all interactions
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('mousedown', handleMouseDown);
  }
  
  function handleDocumentClick(e) {
    const target = e.target;
    
    // Handle toolbar action buttons
    const actionBtn = target.closest('.toolbar-action-btn');
    if (actionBtn) {
      const action = actionBtn.getAttribute('data-action');
      
      if (action === 'togglePanel') {
        const panelId = actionBtn.getAttribute('data-panel');
        togglePanelVisibility(panelId);
        // Update button state
        const panel = window.panelsData.get(panelId);
        if (panel) {
          actionBtn.classList.toggle('active', panel.visible);
        }
      } else if (action === 'showAllPanels') {
        showAllPanels();
      } else if (action === 'hideAllPanels') {
        hideAllPanels();
      } else if (action === 'resetLayout') {
        resetLayout();
      } else if (action === 'saveLayout') {
        saveLayout();
      } else if (action === 'loadLayout') {
        loadLayout();
      }
    }
    
    // Handle panel control buttons
    const panelBtn = target.closest('.panel-btn');
    if (panelBtn) {
      const action = panelBtn.getAttribute('data-action');
      const panel = panelBtn.closest('.floating-panel');
      if (panel) {
        const panelId = panel.getAttribute('data-panel-id');
        if (action === 'collapse') {
          toggleCollapse(panelId);
        } else if (action === 'pin') {
          togglePin(panelId);
        } else if (action === 'close') {
          closePanel(panelId);
        }
      }
    }
    
    // Handle tool selection from within panels
    const toolBtn = target.closest('.tool-button');
    if (toolBtn) {
      const tool = toolBtn.getAttribute('data-tool');
      selectTool(tool);
    }
    
    // Handle layer item clicks
    const layerItem = target.closest('.layer-item');
    if (layerItem && !target.closest('.layer-visibility')) {
      const checkbox = layerItem.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        const layerSpan = layerItem.querySelector('span');
        if (layerSpan) {
          const layerText = layerSpan.textContent;
          const layerName = layerText.replace(/[^\w\s]/gi, '').trim().toLowerCase();
          toggleLayer(layerName);
        }
      }
    }
  }
  
  function handleMouseDown(e) {
    const target = e.target;
    
    // Handle panel dragging
    if (target.closest('.panel-header') && !target.matches('.panel-btn')) {
      const panel = target.closest('.floating-panel');
      if (panel) {
        const panelId = panel.getAttribute('data-panel-id');
        startDrag(panelId, e);
      }
    }
    
    // Handle panel resizing
    if (target.matches('.panel-resize-handle')) {
      const panel = target.closest('.floating-panel');
      if (panel) {
        const panelId = panel.getAttribute('data-panel-id');
        startResize(panelId, e);
      }
    }
  }
  
  // Toggle panel visibility
  function togglePanelVisibility(panelId) {
    vscode.postMessage({
      command: 'togglePanel',
      panelId: panelId
    });
  }
  
  // Show all panels
  function showAllPanels() {
    ['tools', 'layers', 'properties', 'history', 'colorPicker'].forEach(panelId => {
      showPanel(panelId);
    });
  }
  
  // Hide all panels
  function hideAllPanels() {
    ['tools', 'layers', 'properties', 'history', 'colorPicker'].forEach(panelId => {
      closePanel(panelId);
    });
  }
  
  // Tool selection
  function selectTool(tool) {
    // Send tool selection message
    vscode.postMessage({
      command: 'toolSelected',
      tool: tool
    });
    
    // Update UI to show selected tool
    document.querySelectorAll('.tool-button').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tool') === tool);
    });
  }
  
  // Layer toggle
  function toggleLayer(layer) {
    vscode.postMessage({
      command: 'layerToggled',
      layer: layer
    });
  }
  
  // Update toolbar toggle buttons state
  function updateToolbarState() {
    document.querySelectorAll('.panel-toggle').forEach(btn => {
      const panelId = btn.getAttribute('data-panel');
      const panel = window.panelsData.get(panelId);
      if (panel) {
        btn.classList.toggle('active', panel.visible);
      }
    });
  }
  
  // Keep window functions for backward compatibility
  window.selectTool = selectTool;
  window.toggleLayer = toggleLayer;
  
  window.showPanel = function(panelId) {
    vscode.postMessage({
      command: 'togglePanel',
      panelId: panelId
    });
  };

  window.closePanel = function(panelId) {
    vscode.postMessage({
      command: 'closePanel',
      panelId: panelId
    });
  };

  window.toggleCollapse = function(panelId) {
    const panel = window.panelsData.get(panelId);
    if (panel) {
      vscode.postMessage({
        command: 'collapsePanel',
        panelId: panelId,
        collapsed: !panel.collapsed
      });
    }
  };

  window.togglePin = function(panelId) {
    const panel = window.panelsData.get(panelId);
    if (panel) {
      vscode.postMessage({
        command: 'pinPanel',
        panelId: panelId,
        pinned: !panel.pinned
      });
    }
  };

  // Drag and drop functionality
  function startDrag(panelId, event) {
    const panelElement = document.querySelector(`[data-panel-id="${panelId}"]`);
    const panel = window.panelsData.get(panelId);
    
    if (!panelElement || !panel || panel.pinned) return;
    
    event.preventDefault();
    
    draggedPanel = {
      id: panelId,
      element: panelElement
    };
    
    const rect = panelElement.getBoundingClientRect();
    dragOffset.x = event.clientX - rect.left;
    dragOffset.y = event.clientY - rect.top;
    
    panelElement.classList.add('dragging');
    
    // Show dock zones
    document.querySelectorAll('.dock-zone').forEach(zone => {
      zone.style.opacity = '0.3';
      zone.style.pointerEvents = 'auto';
    });
  }

  // Mouse move handler for dragging
  document.addEventListener('mousemove', (event) => {
    if (draggedPanel) {
      const x = event.clientX - dragOffset.x;
      const y = event.clientY - dragOffset.y;
      
      draggedPanel.element.style.left = `${x}px`;
      draggedPanel.element.style.top = `${y}px`;
      
      // Check if over dock zone
      const dockZones = document.querySelectorAll('.dock-zone');
      dockZones.forEach(zone => {
        const rect = zone.getBoundingClientRect();
        if (event.clientX >= rect.left && event.clientX <= rect.right &&
            event.clientY >= rect.top && event.clientY <= rect.bottom) {
          zone.classList.add('drag-over');
        } else {
          zone.classList.remove('drag-over');
        }
      });
    }
    
    if (resizingPanel) {
      const deltaX = event.clientX - resizeStart.x;
      const deltaY = event.clientY - resizeStart.y;
      
      const newWidth = Math.max(150, resizeStart.width + deltaX);
      const newHeight = Math.max(100, resizeStart.height + deltaY);
      
      resizingPanel.element.style.width = `${newWidth}px`;
      resizingPanel.element.style.height = `${newHeight}px`;
    }
  });

  // Mouse up handler
  document.addEventListener('mouseup', (event) => {
    if (draggedPanel) {
      draggedPanel.element.classList.remove('dragging');
      
      // Check if dropped on dock zone
      let docked = false;
      const dockZones = document.querySelectorAll('.dock-zone');
      dockZones.forEach(zone => {
        const rect = zone.getBoundingClientRect();
        if (event.clientX >= rect.left && event.clientX <= rect.right &&
            event.clientY >= rect.top && event.clientY <= rect.bottom) {
          const position = zone.getAttribute('data-position');
          
          vscode.postMessage({
            command: 'dockPanel',
            panelId: draggedPanel.id,
            position: position
          });
          docked = true;
        }
        zone.classList.remove('drag-over');
      });
      
      // Hide dock zones
      dockZones.forEach(zone => {
        zone.style.opacity = '0';
        zone.style.pointerEvents = 'none';
      });
      
      // If not docked, update position
      if (!docked) {
        const rect = draggedPanel.element.getBoundingClientRect();
        vscode.postMessage({
          command: 'movePanel',
          panelId: draggedPanel.id,
          x: rect.left,
          y: rect.top
        });
      }
      
      draggedPanel = null;
    }
    
    if (resizingPanel) {
      const rect = resizingPanel.element.getBoundingClientRect();
      vscode.postMessage({
        command: 'resizePanel',
        panelId: resizingPanel.id,
        width: rect.width,
        height: rect.height
      });
      resizingPanel = null;
    }
  });

  // Resize functionality
  function startResize(panelId, event) {
    const panelElement = document.querySelector(`[data-panel-id="${panelId}"]`);
    if (!panelElement) return;
    
    event.stopPropagation();
    event.preventDefault();
    
    const rect = panelElement.getBoundingClientRect();
    resizingPanel = {
      id: panelId,
      element: panelElement
    };
    resizeStart = {
      x: event.clientX,
      y: event.clientY,
      width: rect.width,
      height: rect.height
    };
  }

  // Setup drag and drop for dock zones
  document.addEventListener('dragover', (e) => {
    if (draggedPanel && e.target.closest('.dock-zone')) {
      e.preventDefault();
    }
  });
  
  document.addEventListener('drop', (e) => {
    if (draggedPanel && e.target.closest('.dock-zone')) {
      e.preventDefault();
      const zone = e.target.closest('.dock-zone');
      const position = zone.getAttribute('data-position');
      vscode.postMessage({
        command: 'dockPanel',
        panelId: draggedPanel.id,
        position: position
      });
    }
  });

  // Layout management
  function resetLayout() {
    if (confirm('Reset all panels to default layout?')) {
      vscode.postMessage({
        command: 'resetLayout'
      });
    }
  }

  function saveLayout() {
    const layoutName = prompt('Enter layout name:');
    if (layoutName) {
      vscode.postMessage({
        command: 'saveLayout',
        name: layoutName
      });
    }
  }

  function loadLayout() {
    vscode.postMessage({
      command: 'loadLayout'
    });
  }
  
  // Export to window for backward compatibility
  window.resetLayout = resetLayout;
  window.saveLayout = saveLayout;
  window.loadLayout = loadLayout;

  // Tool selection
  document.addEventListener('click', (event) => {
    const toolButton = event.target.closest('.tool-button');
    if (toolButton) {
      const tool = toolButton.dataset.tool;
      
      // Update UI
      document.querySelectorAll('.tool-button').forEach(btn => {
        btn.classList.remove('active');
      });
      toolButton.classList.add('active');
      
      // Send message
      vscode.postMessage({
        command: 'toolSelected',
        tool: tool
      });
    }
    
    // Layer visibility toggle
    const layerVisibility = event.target.closest('.layer-visibility');
    if (layerVisibility) {
      const layerItem = layerVisibility.closest('.layer-item');
      const layerSpan = layerItem.querySelector('span');
      if (layerSpan) {
        // Extract layer name without emoji
        const layerText = layerSpan.textContent;
        const layerName = layerText.replace(/[^\w\s]/gi, '').trim().toLowerCase();
        
        vscode.postMessage({
          command: 'layerToggled',
          layer: layerName
        });
      }
    }
    
    // Tile color selection
    const tileColor = event.target.closest('.tile-color');
    if (tileColor) {
      const tileId = tileColor.dataset.tile;
      
      // Update UI
      document.querySelectorAll('.tile-color').forEach(tile => {
        tile.classList.remove('selected');
      });
      tileColor.classList.add('selected');
      
      // Update selected tile info
      document.getElementById('selectedTileId').textContent = tileId;
      
      vscode.postMessage({
        command: 'propertyChanged',
        property: 'tileType',
        value: tileId
      });
    }
  });

  // Property changes
  document.addEventListener('change', (event) => {
    const target = event.target;
    
    if (target.id === 'tileType' || target.id === 'building') {
      vscode.postMessage({
        command: 'propertyChanged',
        property: target.id,
        value: target.value
      });
    }
  });

  document.addEventListener('input', (event) => {
    const target = event.target;
    
    if (target.id === 'height') {
      const value = target.value;
      document.getElementById('heightValue').textContent = value;
      
      vscode.postMessage({
        command: 'propertyChanged',
        property: 'height',
        value: parseInt(value)
      });
    }
  });

  // Handle messages from extension
  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
      case 'updatePanels':
        updatePanelsUI(message.panels, message.dockZones);
        break;
      case 'updateProperty':
        updatePropertyUI(message.property, message.value);
        break;
      case 'setActiveTool':
        setActiveToolUI(message.tool);
        break;
    }
  });

  function updatePanelsUI(panelsData, dockZones) {
    // Update internal data
    window.panelsData.clear();
    panelsData.forEach(panel => {
      window.panelsData.set(panel.id, panel);
    });
    
    // Re-render workspace
    const workspace = document.getElementById('workspace');
    if (workspace) {
      workspace.innerHTML = renderPanels(panelsData);
    }
    
    // Update toolbar button states
    updateToolbarState();
  }

  function renderPanels(panelsData) {
    return panelsData
      .filter(panel => panel.visible)
      .map(panel => {
        const dockedClass = panel.position.docked !== 'float' ? `docked-${panel.position.docked}` : '';
        const collapsedClass = panel.collapsed ? 'collapsed' : '';
        
        return `
          <div class="floating-panel ${dockedClass} ${collapsedClass}" 
               data-panel-id="${panel.id}"
               style="${getPanelStyle(panel)}">
            <div class="panel-header">
              <span class="panel-icon">${panel.icon}</span>
              <span class="panel-title">${panel.title}</span>
              <div class="panel-controls">
                <button class="panel-btn" data-action="collapse" title="${panel.collapsed ? 'Expand' : 'Collapse'}">
                  <span class="panel-btn-icon">${panel.collapsed ? '▼' : '▲'}</span>
                </button>
                <button class="panel-btn" data-action="pin" title="${panel.pinned ? 'Unpin' : 'Pin'}">
                  <span class="panel-btn-icon">${panel.pinned ? '📌' : '📍'}</span>
                </button>
                <button class="panel-btn" data-action="close" title="Close">
                  <span class="panel-btn-icon">×</span>
                </button>
              </div>
            </div>
            <div class="panel-content" style="display: ${panel.collapsed ? 'none' : 'block'}">
              ${panel.content}
            </div>
            <div class="panel-resize-handle"></div>
          </div>
        `;
      })
      .join('');
  }

  function getPanelStyle(panel) {
    if (panel.position.docked === 'float') {
      return `
        left: ${panel.position.x}px;
        top: ${panel.position.y}px;
        width: ${panel.size.width}px;
        height: ${panel.size.height}px;
      `;
    }
    return `
      width: ${panel.size.width}px;
      height: ${panel.size.height}px;
    `;
  }

  function updatePropertyUI(property, value) {
    const element = document.getElementById(property);
    if (element) {
      element.value = value;
      
      // Update related UI
      if (property === 'height') {
        document.getElementById('heightValue').textContent = value;
      }
    }
  }

  function setActiveToolUI(tool) {
    document.querySelectorAll('.tool-button').forEach(btn => {
      if (btn.dataset.tool === tool) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Keyboard shortcuts for panels
  document.addEventListener('keydown', (event) => {
    // Tab to cycle through panels
    if (event.key === 'Tab' && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      cyclePanel(event.shiftKey ? -1 : 1);
    }
    
    // Escape to close focused panel
    if (event.key === 'Escape') {
      const focusedPanel = document.querySelector('.floating-panel:focus-within');
      if (focusedPanel) {
        const panelId = focusedPanel.getAttribute('data-panel-id');
        if (panelId) {
          closePanel(panelId);
        }
      }
    }
  });

  function cyclePanel(direction) {
    const visiblePanels = Array.from(document.querySelectorAll('.floating-panel'));
    if (visiblePanels.length === 0) return;
    
    const currentFocused = document.querySelector('.floating-panel:focus-within');
    let currentIndex = currentFocused ? visiblePanels.indexOf(currentFocused) : -1;
    
    currentIndex = (currentIndex + direction + visiblePanels.length) % visiblePanels.length;
    visiblePanels[currentIndex].focus();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeEventHandlers();
      updateToolbarState();
      // Initial render of panels if workspace exists
      const workspace = document.getElementById('workspace');
      if (workspace && panels.length > 0) {
        workspace.innerHTML = renderPanels(panels);
      }
      console.log('Panels initialized:', Array.from(window.panelsData.values()));
    });
  } else {
    initializeEventHandlers();
    updateToolbarState();
    // Initial render of panels if workspace exists
    const workspace = document.getElementById('workspace');
    if (workspace && panels.length > 0) {
      workspace.innerHTML = renderPanels(panels);
    }
    console.log('Panels initialized:', Array.from(window.panelsData.values()));
  }
  console.log('Floating panels script loaded');
})();