// @ts-check
/**
 * Virtual Scrolling Implementation for Performance
 * Efficiently renders only visible items in long lists
 */

class VirtualScroller {
  constructor(config) {
    this.container = config.container;
    this.itemHeight = config.itemHeight || 50;
    this.items = config.items || [];
    this.renderItem = config.renderItem;
    this.buffer = config.buffer || 5; // Extra items to render outside viewport
    
    this.scrollTop = 0;
    this.containerHeight = 0;
    this.visibleStart = 0;
    this.visibleEnd = 0;
    
    this.scrollElement = null;
    this.contentElement = null;
    this.initialized = false;
    
    this.init();
  }

  init() {
    if (!this.container || this.initialized) return;
    
    // Create scroll container structure
    this.container.innerHTML = `
      <div class="virtual-scroll-container">
        <div class="virtual-scroll-spacer"></div>
        <div class="virtual-scroll-content"></div>
      </div>
    `;
    
    this.scrollElement = this.container.querySelector('.virtual-scroll-container');
    this.contentElement = this.container.querySelector('.virtual-scroll-content');
    const spacer = this.container.querySelector('.virtual-scroll-spacer');
    
    // Set up styles
    this.scrollElement.style.cssText = `
      height: 100%;
      overflow-y: auto;
      position: relative;
    `;
    
    spacer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 1px;
      height: ${this.items.length * this.itemHeight}px;
      pointer-events: none;
    `;
    
    this.contentElement.style.cssText = `
      position: relative;
      top: 0;
      left: 0;
      right: 0;
    `;
    
    // Set up event listeners
    this.scrollElement.addEventListener('scroll', this.handleScroll.bind(this));
    
    // Set up resize observer
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(this.scrollElement);
    
    this.initialized = true;
    this.render();
  }

  handleScroll() {
    this.scrollTop = this.scrollElement.scrollTop;
    this.render();
  }

  handleResize() {
    this.containerHeight = this.scrollElement.clientHeight;
    this.render();
  }

  render() {
    if (!this.initialized) return;
    
    // Calculate visible range
    const visibleStart = Math.floor(this.scrollTop / this.itemHeight);
    const visibleEnd = Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight);
    
    // Add buffer
    this.visibleStart = Math.max(0, visibleStart - this.buffer);
    this.visibleEnd = Math.min(this.items.length, visibleEnd + this.buffer);
    
    // Clear content
    this.contentElement.innerHTML = '';
    
    // Render visible items
    for (let i = this.visibleStart; i < this.visibleEnd; i++) {
      const item = this.items[i];
      const element = this.renderItem(item, i);
      
      if (typeof element === 'string') {
        const div = document.createElement('div');
        div.innerHTML = element;
        element = div.firstElementChild;
      }
      
      // Position item
      element.style.position = 'absolute';
      element.style.top = `${i * this.itemHeight}px`;
      element.style.left = '0';
      element.style.right = '0';
      element.style.height = `${this.itemHeight}px`;
      
      this.contentElement.appendChild(element);
    }
  }

  updateItems(items) {
    this.items = items;
    
    // Update spacer height
    const spacer = this.container.querySelector('.virtual-scroll-spacer');
    if (spacer) {
      spacer.style.height = `${this.items.length * this.itemHeight}px`;
    }
    
    this.render();
  }

  scrollToItem(index) {
    if (index < 0 || index >= this.items.length) return;
    
    const scrollTop = index * this.itemHeight;
    this.scrollElement.scrollTop = scrollTop;
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    if (this.scrollElement) {
      this.scrollElement.removeEventListener('scroll', this.handleScroll);
    }
    
    this.container.innerHTML = '';
    this.initialized = false;
  }
}

/**
 * Virtual Scroller Factory for different panel types
 */
class VirtualScrollerFactory {
  static createTilePaletteScroller(container, tiles) {
    // For tile palette, we use a grid layout
    const tilesPerRow = 5;
    const tileSize = 50;
    const rowHeight = tileSize + 10; // Include spacing
    
    // Group tiles into rows
    const rows = [];
    for (let i = 0; i < tiles.length; i += tilesPerRow) {
      rows.push(tiles.slice(i, i + tilesPerRow));
    }
    
    return new VirtualScroller({
      container,
      itemHeight: rowHeight,
      items: rows,
      buffer: 3,
      renderItem: (row, rowIndex) => {
        const rowElement = document.createElement('div');
        rowElement.className = 'tile-row';
        rowElement.style.cssText = `
          display: flex;
          gap: 10px;
          padding: 5px;
        `;
        
        row.forEach((tile, colIndex) => {
          const tileIndex = rowIndex * tilesPerRow + colIndex;
          const tileBtn = document.createElement('button');
          tileBtn.className = 'tile-btn';
          tileBtn.dataset.tileId = tile.id;
          tileBtn.title = `Tile ${tile.id}`;
          tileBtn.style.cssText = `
            width: ${tileSize}px;
            height: ${tileSize}px;
            background: ${tile.color};
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            color: white;
            text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
          `;
          tileBtn.textContent = tile.id;
          
          // Add click handler
          tileBtn.addEventListener('click', () => {
            vscode.postMessage({
              type: 'tool',
              command: 'selectTile',
              tileId: tile.id
            });
          });
          
          rowElement.appendChild(tileBtn);
        });
        
        return rowElement;
      }
    });
  }

  static createFileListScroller(container, files) {
    return new VirtualScroller({
      container,
      itemHeight: 32,
      items: files,
      buffer: 10,
      renderItem: (file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
          <span class="file-icon">${getFileIcon(file.type)}</span>
          <span class="file-name">${file.name}</span>
          <span class="file-size">${formatFileSize(file.size)}</span>
        `;
        
        item.addEventListener('click', () => {
          vscode.postMessage({
            type: 'command',
            command: 'openMap',
            args: file.path
          });
        });
        
        return item;
      }
    });
  }

  static createLayerListScroller(container, layers) {
    return new VirtualScroller({
      container,
      itemHeight: 40,
      items: layers,
      buffer: 5,
      renderItem: (layer, index) => {
        const item = document.createElement('div');
        item.className = `layer-item ${layer.visible ? 'visible' : 'hidden'}`;
        item.dataset.layerId = layer.id;
        item.innerHTML = `
          <button class="layer-visibility" title="Toggle visibility">
            ${layer.visible ? '👁️' : '👁️‍🗨️'}
          </button>
          <span class="layer-name">${layer.name}</span>
          <span class="layer-opacity">${layer.opacity}%</span>
        `;
        
        // Add event handlers
        const visBtn = item.querySelector('.layer-visibility');
        visBtn.addEventListener('click', () => {
          vscode.postMessage({
            type: 'panel',
            command: 'toggleLayerVisibility',
            layerId: layer.id
          });
        });
        
        return item;
      }
    });
  }
}

// Helper functions
function getFileIcon(type) {
  const icons = {
    'map': '🗺️',
    'script': '📝',
    'folder': '📁',
    'unknown': '📄'
  };
  return icons[type] || icons.unknown;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Export for use in workspace
window.VirtualScroller = VirtualScroller;
window.VirtualScrollerFactory = VirtualScrollerFactory;