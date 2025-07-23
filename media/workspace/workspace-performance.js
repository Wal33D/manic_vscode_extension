// @ts-check
/**
 * Performance optimization functions for workspace
 * This file contains all performance-related functions that extend workspace.js
 */

// Performance optimization functions
function setupLazyLoadingObservers() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const panel = entry.target;
        const panelId = panel.getAttribute('data-panel-id');
        
        if (panelId && !panel.hasAttribute('data-loaded')) {
          // Request panel content
          vscode.postMessage({
            type: 'loadPanel',
            panelId: panelId
          });
          
          panel.setAttribute('data-loaded', 'true');
        }
      }
    });
  }, {
    rootMargin: '50px' // Load content 50px before becoming visible
  });
  
  // Observe all panels
  document.querySelectorAll('.panel-content[data-lazy="true"]').forEach(panel => {
    observer.observe(panel);
  });
}

function handleWorkspaceResize() {
  // Batch DOM operations for better performance
  if (performanceManager) {
    performanceManager.batchDOMOperations([
      { type: 'read', fn: () => {
        // Read all panel dimensions
        const panels = performanceManager.querySelectorAll('.workspace-panel');
        return panels.map(panel => ({
          id: panel.id,
          rect: panel.getBoundingClientRect()
        }));
      }},
      { type: 'write', fn: (panelData) => {
        // Update panels based on read data
        panelData[0].forEach(data => {
          const panel = document.getElementById(data.id);
          if (panel) {
            updatePanelSize(panel);
          }
        });
      }}
    ]);
  }
}

function updatePanelContent(panelId, content, isPlaceholder) {
  const panel = document.querySelector(`#panel-${panelId} .panel-content`);
  if (panel) {
    // Use performance manager to cache the element
    if (performanceManager && !isPlaceholder) {
      performanceManager.invalidateCache(`#panel-${panelId}`);
    }
    
    panel.innerHTML = content;
    
    // Initialize virtual scrolling for appropriate panels
    if (!isPlaceholder && window.VirtualScrollerFactory) {
      initializePanelVirtualScrolling(panelId, panel);
    }
    
    // Initialize canvas optimization if needed
    if (!isPlaceholder && panel.querySelector('canvas')) {
      initializePanelCanvas(panelId, panel);
    }
    
    // Initialize keyboard navigation for panel
    if (!isPlaceholder && window.keyboardNav) {
      initializePanelKeyboardNavigation(panelId, panel);
    }
  }
}

function initializePanelVirtualScrolling(panelId, panel) {
  // Clean up existing virtual scroller
  const existingScroller = virtualScrollers.get(panelId);
  if (existingScroller) {
    existingScroller.destroy();
  }
  
  // Initialize based on panel type
  let scroller = null;
  const scrollContainer = panel.querySelector('.virtual-scroll-target');
  
  if (scrollContainer) {
    switch (panelId) {
      case 'tilePalette': {
        // Get tile data from panel
        const tiles = Array.from({ length: 100 }, (_, i) => ({
          id: i,
          color: `hsl(${i * 37}, 70%, 50%)`
        }));
        scroller = VirtualScrollerFactory.createTilePaletteScroller(scrollContainer, tiles);
        break;
      }
      case 'layers': {
        // Get layer data
        const layers = [
          { id: 'main', name: 'Main Layer', visible: true, opacity: 100 },
          { id: 'bg', name: 'Background', visible: true, opacity: 75 },
          { id: 'objects', name: 'Objects', visible: false, opacity: 100 }
        ];
        scroller = VirtualScrollerFactory.createLayerListScroller(scrollContainer, layers);
        break;
      }
    }
    
    if (scroller) {
      virtualScrollers.set(panelId, scroller);
    }
  }
}

function initializePanelCanvas(panelId, panel) {
  const canvas = panel.querySelector('canvas');
  if (!canvas || !window.CanvasOptimizer) return;
  
  // Clean up existing optimizer
  const existingOptimizer = canvasOptimizers.get(panelId);
  if (existingOptimizer) {
    existingOptimizer.destroy();
  }
  
  // Create new optimizer
  const optimizer = new CanvasOptimizer(canvas, {
    targetFPS: 60,
    autoScale: true,
    offscreenBuffer: true
  });
  
  canvasOptimizers.set(panelId, optimizer);
  
  // Start render loop
  optimizer.start();
  
  // Listen for FPS updates
  canvas.addEventListener('fpsUpdate', (e) => {
    const { current, average } = e.detail;
    if (average < 30) {
      console.warn(`Low FPS in ${panelId}: ${average}fps`);
    }
  });
}

function handleDataResponse(message) {
  // Handle cached data responses
  switch (message.requestType) {
    case 'mapData':
      // Update UI with map data
      updateMapDisplay(message.data);
      break;
    case 'tileData':
      // Update tile display
      updateTileDisplay(message.data);
      break;
  }
}

function updateMapDisplay(mapData) {
  // Update statistics panel if visible
  const statsPanel = document.querySelector('#panel-statistics .statistics-content');
  if (statsPanel) {
    const sizeValue = statsPanel.querySelector('.stat-value');
    if (sizeValue) {
      sizeValue.textContent = `${mapData.dimensions.width}x${mapData.dimensions.height}`;
    }
  }
}

function updateTileDisplay(tileData) {
  // Update tile information in properties panel
  const propsPanel = document.querySelector('#panel-properties');
  if (propsPanel) {
    // Update tile type display
    const tileTypeSelect = propsPanel.querySelector('select');
    if (tileTypeSelect) {
      tileTypeSelect.value = tileData.type;
    }
  }
}

function updatePanelSize(panel) {
  // Placeholder for panel size update logic
  // This would normally adjust panel dimensions based on container size
  const rect = panel.getBoundingClientRect();
  
  // Example: Ensure minimum sizes
  if (rect.width < 200) {
    panel.style.width = '200px';
  }
  if (rect.height < 100) {
    panel.style.height = '100px';
  }
}

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  // Clean up virtual scrollers
  if (typeof virtualScrollers !== 'undefined') {
    virtualScrollers.forEach(scroller => scroller.destroy());
    virtualScrollers.clear();
  }
  
  // Clean up canvas optimizers
  if (typeof canvasOptimizers !== 'undefined') {
    canvasOptimizers.forEach(optimizer => optimizer.destroy());
    canvasOptimizers.clear();
  }
  
  // Clean up performance manager
  if (typeof performanceManager !== 'undefined' && performanceManager) {
    performanceManager.clearCaches();
  }
});

function initializePanelKeyboardNavigation(panelId, panel) {
  const panelContainer = panel.closest('.workspace-panel');
  
  // Initialize panel navigation
  if (panelContainer && window.keyboardNav) {
    window.keyboardNav.initPanelNavigation(panelContainer);
  }
  
  // Panel-specific keyboard navigation
  switch (panelId) {
    case 'tools':
      const toolsGrid = panel.querySelector('.tools-grid');
      if (toolsGrid) {
        window.keyboardNav.initRovingTabIndex(toolsGrid, {
          selector: '.tool-btn',
          vertical: false,
          wrap: true,
          activateOnFocus: false
        });
      }
      break;
      
    case 'layers':
      const layersContainer = panel.querySelector('.layers-container');
      if (layersContainer) {
        window.keyboardNav.initRovingTabIndex(layersContainer, {
          selector: '.layer-item',
          vertical: true,
          wrap: false,
          activateOnFocus: false
        });
      }
      break;
      
    case 'tilePalette':
      const tileGrid = panel.querySelector('.tile-grid');
      if (tileGrid) {
        window.keyboardNav.initRovingTabIndex(tileGrid, {
          selector: '.tile-item',
          vertical: false,
          wrap: true,
          activateOnFocus: false
        });
      }
      break;
      
    case 'scriptPatterns':
      const patternList = panel.querySelector('.pattern-list');
      if (patternList) {
        window.keyboardNav.initRovingTabIndex(patternList, {
          selector: '.pattern-item',
          vertical: true,
          wrap: false,
          activateOnFocus: false
        });
      }
      break;
      
    case 'history':
      const historyTimeline = panel.querySelector('.history-timeline');
      if (historyTimeline) {
        window.keyboardNav.initRovingTabIndex(historyTimeline, {
          selector: '.history-item',
          vertical: true,
          wrap: false,
          activateOnFocus: true
        });
      }
      break;
  }
  
  // Add directional hints where appropriate
  const rovingContainers = panel.querySelectorAll('[role="toolbar"], [role="tablist"], .tool-grid, .tile-grid');
  rovingContainers.forEach(container => {
    if (container.children.length > 4) {
      // Add arrow hints for navigation
      const hints = `
        <span class="arrow-navigation-hint hint-left" aria-hidden="true">←</span>
        <span class="arrow-navigation-hint hint-right" aria-hidden="true">→</span>
      `;
      container.insertAdjacentHTML('beforeend', hints);
    }
  });
}

// Export functions to global scope for workspace.js
window.setupLazyLoadingObservers = setupLazyLoadingObservers;
window.handleWorkspaceResize = handleWorkspaceResize;
window.updatePanelContent = updatePanelContent;
window.handleDataResponse = handleDataResponse;
window.initializePanelVirtualScrolling = initializePanelVirtualScrolling;
window.initializePanelCanvas = initializePanelCanvas;
window.updateMapDisplay = updateMapDisplay;
window.updateTileDisplay = updateTileDisplay;
window.initializePanelKeyboardNavigation = initializePanelKeyboardNavigation;