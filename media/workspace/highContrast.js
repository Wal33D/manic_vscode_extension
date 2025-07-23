/**
 * High Contrast Theme Support for Manic Miners Workspace
 * Enhances visibility and accessibility in high contrast modes
 */

class HighContrastManager {
  constructor() {
    this.isHighContrast = false;
    this.customProperties = new Map();
    this.init();
  }
  
  init() {
    // Listen for theme change messages from extension
    this.setupMessageListener();
    
    // Apply initial high contrast styles if needed
    this.checkInitialTheme();
    
    // Setup media query listener for system high contrast
    this.setupMediaQueryListener();
  }
  
  /**
   * Setup message listener for theme changes
   */
  setupMessageListener() {
    // Listen for messages from VS Code extension
    const messageHandler = (event) => {
      const message = event.data;
      if (message.type === 'accessibility') {
        switch (message.command) {
          case 'enableHighContrast':
            this.enableHighContrast();
            break;
          case 'disableHighContrast':
            this.disableHighContrast();
            break;
        }
      }
    };
    
    // Store reference for cleanup
    this.messageHandler = messageHandler;
    window.addEventListener('message', messageHandler);
  }
  
  /**
   * Check initial theme state
   */
  checkInitialTheme() {
    // Check if high contrast class is already present
    if (document.body.classList.contains('high-contrast')) {
      this.isHighContrast = true;
      this.applyHighContrastEnhancements();
    }
  }
  
  /**
   * Setup media query listener for system high contrast
   */
  setupMediaQueryListener() {
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    
    // Initial check
    if (highContrastQuery.matches) {
      this.enableHighContrast();
    }
    
    // Listen for changes
    highContrastQuery.addEventListener('change', (e) => {
      if (e.matches) {
        this.enableHighContrast();
      } else {
        this.disableHighContrast();
      }
    });
  }
  
  /**
   * Enable high contrast mode
   */
  enableHighContrast() {
    if (this.isHighContrast) return;
    
    this.isHighContrast = true;
    document.body.classList.add('high-contrast');
    
    // Apply enhanced styles
    this.applyHighContrastEnhancements();
    
    // Announce to screen reader
    if (window.accessibilityManager) {
      window.accessibilityManager.announce('High contrast mode enabled');
    }
  }
  
  /**
   * Disable high contrast mode
   */
  disableHighContrast() {
    if (!this.isHighContrast) return;
    
    this.isHighContrast = false;
    document.body.classList.remove('high-contrast');
    
    // Remove enhanced styles
    this.removeHighContrastEnhancements();
    
    // Announce to screen reader
    if (window.accessibilityManager) {
      window.accessibilityManager.announce('High contrast mode disabled');
    }
  }
  
  /**
   * Apply high contrast enhancements
   */
  applyHighContrastEnhancements() {
    // Store original values
    this.storeOriginalStyles();
    
    // Enhance borders
    this.enhanceBorders();
    
    // Enhance focus indicators
    this.enhanceFocusIndicators();
    
    // Enhance text contrast
    this.enhanceTextContrast();
    
    // Add visual separators
    this.addVisualSeparators();
    
    // Enhance interactive elements
    this.enhanceInteractiveElements();
  }
  
  /**
   * Remove high contrast enhancements
   */
  removeHighContrastEnhancements() {
    // Restore original styles
    this.restoreOriginalStyles();
    
    // Remove added elements
    this.removeVisualSeparators();
  }
  
  /**
   * Store original style values
   */
  storeOriginalStyles() {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    // Store border styles
    this.customProperties.set('--panel-border', computedStyle.getPropertyValue('--panel-border'));
    this.customProperties.set('--focus-border', computedStyle.getPropertyValue('--focus-border'));
    
    // Store text colors
    this.customProperties.set('--text-primary', computedStyle.getPropertyValue('--text-primary'));
    this.customProperties.set('--text-secondary', computedStyle.getPropertyValue('--text-secondary'));
  }
  
  /**
   * Restore original style values
   */
  restoreOriginalStyles() {
    const root = document.documentElement;
    
    this.customProperties.forEach((value, property) => {
      if (value) {
        root.style.setProperty(property, value);
      } else {
        root.style.removeProperty(property);
      }
    });
    
    this.customProperties.clear();
  }
  
  /**
   * Enhance borders for better visibility
   */
  enhanceBorders() {
    const root = document.documentElement;
    
    // Enhance panel borders
    root.style.setProperty('--panel-border-width', '2px');
    root.style.setProperty('--panel-border-style', 'solid');
    
    // Add borders to all panels
    document.querySelectorAll('.workspace-panel').forEach(panel => {
      panel.style.borderWidth = '2px';
      panel.style.borderStyle = 'solid';
    });
    
    // Add borders to interactive elements
    document.querySelectorAll('button, input, select, textarea').forEach(element => {
      if (!element.style.border || element.style.border === 'none') {
        element.style.border = '1px solid currentColor';
      }
    });
  }
  
  /**
   * Enhance focus indicators
   */
  enhanceFocusIndicators() {
    const root = document.documentElement;
    
    // Increase focus border width
    root.style.setProperty('--focus-border-width', '3px');
    root.style.setProperty('--focus-offset', '2px');
    
    // Add high contrast focus styles
    const style = document.createElement('style');
    style.id = 'high-contrast-focus';
    style.textContent = `
      .high-contrast *:focus {
        outline: 3px solid currentColor !important;
        outline-offset: 2px !important;
      }
      
      .high-contrast button:focus,
      .high-contrast input:focus,
      .high-contrast select:focus,
      .high-contrast textarea:focus,
      .high-contrast [role="button"]:focus,
      .high-contrast [tabindex]:focus {
        outline: 3px solid currentColor !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.2) !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Enhance text contrast
   */
  enhanceTextContrast() {
    // Add text shadows for better readability
    const style = document.createElement('style');
    style.id = 'high-contrast-text';
    style.textContent = `
      .high-contrast .panel-title,
      .high-contrast h1,
      .high-contrast h2,
      .high-contrast h3,
      .high-contrast h4,
      .high-contrast h5,
      .high-contrast h6 {
        text-shadow: 0 0 1px currentColor;
      }
      
      .high-contrast .status-item,
      .high-contrast .validation-message,
      .high-contrast .history-action {
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Add visual separators
   */
  addVisualSeparators() {
    // Add separators between dock zones
    const dockZones = document.querySelectorAll('.dock-zone');
    dockZones.forEach((zone, index) => {
      if (index > 0) {
        const separator = document.createElement('div');
        separator.className = 'high-contrast-separator';
        separator.setAttribute('role', 'separator');
        separator.style.cssText = `
          position: absolute;
          background: currentColor;
          opacity: 0.5;
        `;
        
        // Position based on dock orientation
        if (zone.classList.contains('vertical')) {
          separator.style.width = '2px';
          separator.style.height = '100%';
          separator.style.left = '-1px';
          separator.style.top = '0';
        } else {
          separator.style.width = '100%';
          separator.style.height = '2px';
          separator.style.left = '0';
          separator.style.top = '-1px';
        }
        
        zone.appendChild(separator);
      }
    });
    
    // Add separators between panel sections
    document.querySelectorAll('.panel-header').forEach(header => {
      header.style.borderBottom = '2px solid currentColor';
    });
  }
  
  /**
   * Remove visual separators
   */
  removeVisualSeparators() {
    document.querySelectorAll('.high-contrast-separator').forEach(separator => {
      separator.remove();
    });
    
    // Remove added styles
    ['high-contrast-focus', 'high-contrast-text'].forEach(id => {
      const style = document.getElementById(id);
      if (style) style.remove();
    });
  }
  
  /**
   * Enhance interactive elements
   */
  enhanceInteractiveElements() {
    // Add visual indicators to active elements
    document.querySelectorAll('.tool-btn.active, .layer-item.active, .tab-button.active').forEach(element => {
      element.style.outline = '2px solid currentColor';
      element.style.outlineOffset = '-2px';
    });
    
    // Enhance disabled elements
    document.querySelectorAll('[disabled], [aria-disabled="true"]').forEach(element => {
      element.style.opacity = '0.5';
      element.style.textDecoration = 'line-through';
    });
    
    // Add patterns to different tile types for better distinction
    const tileItems = document.querySelectorAll('.tile-item');
    tileItems.forEach((tile, index) => {
      const pattern = this.createTilePattern(index);
      if (pattern) {
        tile.style.backgroundImage = pattern;
      }
    });
  }
  
  /**
   * Create tile pattern for high contrast
   */
  createTilePattern(tileId) {
    const patterns = {
      0: 'repeating-linear-gradient(45deg, transparent, transparent 5px, currentColor 5px, currentColor 6px)',
      1: 'repeating-linear-gradient(-45deg, transparent, transparent 5px, currentColor 5px, currentColor 6px)',
      2: 'repeating-linear-gradient(0deg, transparent, transparent 5px, currentColor 5px, currentColor 6px)',
      3: 'radial-gradient(circle at center, currentColor 2px, transparent 2px)',
      4: 'repeating-linear-gradient(90deg, transparent, transparent 5px, currentColor 5px, currentColor 6px)',
    };
    
    return patterns[tileId % 5];
  }
  
  /**
   * Clean up
   */
  destroy() {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
    }
    
    this.disableHighContrast();
  }
}

// Initialize high contrast manager
const highContrastManager = new HighContrastManager();

// Export for use in other modules
window.HighContrastManager = HighContrastManager;
window.highContrastManager = highContrastManager;