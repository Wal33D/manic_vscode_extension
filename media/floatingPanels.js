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
  
  // Initialize dropdown functionality after DOM is ready
  function initializeDropdowns() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.toolbar-dropdown')) {
        closeAllDropdowns();
      }
    });
    
    // Handle toolbar dropdown clicks
    document.querySelectorAll('.toolbar-dropdown').forEach(dropdown => {
      const button = dropdown.querySelector('.toolbar-button');
      const menu = dropdown.querySelector('.dropdown-menu');
      
      if (button && menu) {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleDropdown(menu);
        });
      }
    });
    
    // Handle dropdown menu item clicks
    document.querySelectorAll('.dropdown-menu button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns();
      });
    });
  }
  
  function toggleDropdown(menu) {
    if (menu.classList.contains('show')) {
      menu.classList.remove('show');
      activeDropdown = null;
    } else {
      closeAllDropdowns();
      menu.classList.add('show');
      activeDropdown = menu;
    }
  }
  
  function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      menu.classList.remove('show');
    });
    activeDropdown = null;
  }
  
  // Tool selection from dropdown
  window.selectTool = function(tool) {
    // Send tool selection message
    vscode.postMessage({
      command: 'toolSelected',
      tool: tool
    });
    
    // Update UI to show selected tool
    document.querySelectorAll('.tool-button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Optionally show the tools panel
    showPanel('tools');
  };
  
  // Layer toggle from dropdown
  window.toggleLayer = function(layer) {
    vscode.postMessage({
      command: 'layerToggled',
      layer: layer
    });
    
    // Optionally show the layers panel
    showPanel('layers');
  };
  
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
  window.startDrag = function(panelId, event) {
    const panelElement = document.getElementById(`panel-${panelId}`);
    const panel = window.panelsData.get(panelId);
    
    if (!panelElement || !panel || panel.pinned) return;
    
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
  };

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
          const position = zone.classList.contains('dock-left') ? 'left' :
                         zone.classList.contains('dock-right') ? 'right' :
                         zone.classList.contains('dock-top') ? 'top' : 'bottom';
          
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
  window.startResize = function(panelId, event) {
    const panelElement = document.getElementById(`panel-${panelId}`);
    if (!panelElement) return;
    
    event.stopPropagation();
    
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
  };

  // Dock zone handlers
  window.allowDrop = function(event) {
    event.preventDefault();
  };

  window.dropPanel = function(event, position) {
    event.preventDefault();
    if (draggedPanel) {
      vscode.postMessage({
        command: 'dockPanel',
        panelId: draggedPanel.id,
        position: position
      });
    }
  };

  // Layout management
  window.resetLayout = function() {
    if (confirm('Reset all panels to default layout?')) {
      vscode.postMessage({
        command: 'resetLayout'
      });
    }
  };

  window.saveLayout = function() {
    const layoutName = prompt('Enter layout name:');
    if (layoutName) {
      vscode.postMessage({
        command: 'saveLayout',
        name: layoutName
      });
    }
  };

  window.loadLayout = function() {
    vscode.postMessage({
      command: 'loadLayout'
    });
  };

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
      const layerName = layerItem.querySelector('span').textContent;
      
      vscode.postMessage({
        command: 'layerToggled',
        layer: layerName
      });
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
  }

  function renderPanels(panelsData) {
    return panelsData
      .filter(panel => panel.visible)
      .map(panel => {
        const dockedClass = panel.position.docked !== 'float' ? `docked-${panel.position.docked}` : '';
        const collapsedClass = panel.collapsed ? 'collapsed' : '';
        
        return `
          <div class="floating-panel ${dockedClass} ${collapsedClass}" 
               id="panel-${panel.id}"
               style="${getPanelStyle(panel)}">
            <div class="panel-header" onmousedown="startDrag('${panel.id}', event)">
              <span class="panel-icon">${panel.icon}</span>
              <span class="panel-title">${panel.title}</span>
              <div class="panel-controls">
                <button class="panel-btn" onclick="toggleCollapse('${panel.id}')">${
                  panel.collapsed ? '⬆️' : '⬇️'
                }</button>
                <button class="panel-btn" onclick="togglePin('${panel.id}')">${
                  panel.pinned ? '📌' : '📍'
                }</button>
                <button class="panel-btn" onclick="closePanel('${panel.id}')">❌</button>
              </div>
            </div>
            <div class="panel-content" style="display: ${panel.collapsed ? 'none' : 'block'}">
              ${panel.content}
            </div>
            <div class="panel-resize-handle" onmousedown="startResize('${panel.id}', event)"></div>
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
        const panelId = focusedPanel.id.replace('panel-', '');
        closePanel(panelId);
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
    document.addEventListener('DOMContentLoaded', initializeDropdowns);
  } else {
    initializeDropdowns();
  }
  console.log('Floating panels initialized');
})();