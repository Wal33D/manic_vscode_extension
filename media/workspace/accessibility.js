// @ts-check
/**
 * Accessibility features for the workspace
 * Handles ARIA labels, screen reader announcements, and keyboard navigation
 */

class AccessibilityManager {
  constructor() {
    this.liveRegion = null;
    this.focusTraps = new Map();
    this.keyboardNavContexts = new Map();
    this.tooltips = new Map();
    
    this.initialize();
  }

  /**
   * Initialize accessibility features
   */
  initialize() {
    // Create live region for announcements
    this.createLiveRegion();
    
    // Add skip navigation links
    this.addSkipLinks();
    
    // Initialize ARIA labels
    this.initializeAriaLabels();
    
    // Set up keyboard navigation
    this.setupKeyboardNavigation();
    
    // Handle high contrast mode
    this.handleHighContrast();
    
    // Set up focus indicators
    this.setupFocusIndicators();
  }

  /**
   * Create ARIA live region for announcements
   */
  createLiveRegion() {
    // Remove existing live region if any
    const existing = document.getElementById('aria-live-region');
    if (existing) {
      existing.remove();
    }
    
    // Create live region container
    this.liveRegion = document.createElement('div');
    this.liveRegion.id = 'aria-live-region';
    this.liveRegion.className = 'sr-only';
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    
    // Create assertive region for important announcements
    const assertiveRegion = document.createElement('div');
    assertiveRegion.id = 'aria-live-assertive';
    assertiveRegion.className = 'sr-only';
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    
    document.body.appendChild(this.liveRegion);
    document.body.appendChild(assertiveRegion);
  }

  /**
   * Announce message to screen readers
   */
  announce(message, priority = 'polite') {
    const region = priority === 'assertive' 
      ? document.getElementById('aria-live-assertive')
      : this.liveRegion;
    
    if (region) {
      // Clear previous announcement
      region.textContent = '';
      
      // Use setTimeout to ensure screen readers pick up the change
      setTimeout(() => {
        region.textContent = message;
      }, 100);
      
      // Clear after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }

  /**
   * Add skip navigation links
   */
  addSkipLinks() {
    const skipNav = document.createElement('nav');
    skipNav.id = 'skip-navigation';
    skipNav.className = 'skip-links';
    skipNav.setAttribute('aria-label', 'Skip navigation');
    
    const skipLinks = [
      { href: '#workspace-content', text: 'Skip to main content' },
      { href: '#panel-tools', text: 'Skip to tools' },
      { href: '#panel-properties', text: 'Skip to properties' },
      { href: '#workspace-status', text: 'Skip to status bar' }
    ];
    
    skipLinks.forEach(link => {
      const a = document.createElement('a');
      a.href = link.href;
      a.className = 'skip-link';
      a.textContent = link.text;
      
      // Handle click to focus target
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.href);
        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
      
      skipNav.appendChild(a);
    });
    
    // Insert at beginning of body
    document.body.insertBefore(skipNav, document.body.firstChild);
  }

  /**
   * Initialize ARIA labels for all interactive elements
   */
  initializeAriaLabels() {
    // Panels
    this.setAriaLabel('#panel-tools', 'Tools panel');
    this.setAriaLabel('#panel-properties', 'Properties panel');
    this.setAriaLabel('#panel-layers', 'Layers panel');
    this.setAriaLabel('#panel-tilePalette', 'Tile palette panel');
    this.setAriaLabel('#panel-validation', 'Validation panel');
    this.setAriaLabel('#panel-statistics', 'Statistics panel');
    this.setAriaLabel('#panel-history', 'History panel');
    
    // Panel controls
    document.querySelectorAll('.minimize').forEach(btn => {
      btn.setAttribute('aria-label', 'Minimize panel');
    });
    
    document.querySelectorAll('.maximize').forEach(btn => {
      btn.setAttribute('aria-label', 'Maximize panel');
    });
    
    document.querySelectorAll('.close').forEach(btn => {
      btn.setAttribute('aria-label', 'Close panel');
    });
    
    // Layout controls
    this.setAriaLabel('[data-preset="mapping"]', 'Mapping layout preset');
    this.setAriaLabel('[data-preset="scripting"]', 'Scripting layout preset');
    this.setAriaLabel('[data-preset="analysis"]', 'Analysis layout preset');
    this.setAriaLabel('#saveLayoutBtn', 'Save current layout');
    this.setAriaLabel('#loadLayoutBtn', 'Load saved layout');
    this.setAriaLabel('#resetLayoutBtn', 'Reset to default layout');
    
    // Split view controls
    this.setAriaLabel('#splitHorizontalBtn', 'Split view horizontally');
    this.setAriaLabel('#splitVerticalBtn', 'Split view vertically');
    this.setAriaLabel('#unsplitBtn', 'Remove split view');
    
    // Tools
    this.setAriaLabel('[data-tool="paint"]', 'Paint tool');
    this.setAriaLabel('[data-tool="fill"]', 'Fill tool');
    this.setAriaLabel('[data-tool="line"]', 'Line tool');
    this.setAriaLabel('[data-tool="rect"]', 'Rectangle tool');
    this.setAriaLabel('[data-tool="circle"]', 'Circle tool');
    this.setAriaLabel('[data-tool="select"]', 'Selection tool');
    this.setAriaLabel('[data-tool="picker"]', 'Color picker tool');
    this.setAriaLabel('[data-tool="eraser"]', 'Eraser tool');
    
    // Properties
    this.setAriaLabel('#tileType', 'Select tile type');
    this.setAriaLabel('#height', 'Adjust height level');
    this.setAriaLabel('#building', 'Select building type');
    
    // Search inputs
    document.querySelectorAll('.search-input').forEach(input => {
      const placeholder = input.getAttribute('placeholder');
      input.setAttribute('aria-label', placeholder || 'Search');
    });
    
    // Main regions
    this.setAriaLabel('#workspace-header', 'Workspace header', 'banner');
    this.setAriaLabel('#workspace-main', 'Main workspace area', 'main');
    this.setAriaLabel('#workspace-status', 'Status bar', 'status');
    
    // Dock zones
    this.setAriaLabel('#dock-left', 'Left panel dock');
    this.setAriaLabel('#dock-right', 'Right panel dock');
    this.setAriaLabel('#dock-top', 'Top panel dock');
    this.setAriaLabel('#dock-bottom', 'Bottom panel dock');
  }

  /**
   * Set ARIA label and optionally role
   */
  setAriaLabel(selector, label, role = null) {
    const element = document.querySelector(selector);
    if (element) {
      element.setAttribute('aria-label', label);
      if (role) {
        element.setAttribute('role', role);
      }
    }
  }

  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Skip links activation
      if (e.altKey && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        const skipLinks = document.querySelectorAll('.skip-link');
        const index = parseInt(e.key) - 1;
        if (skipLinks[index]) {
          skipLinks[index].click();
        }
      }
      
      // Panel navigation
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key) {
          case 'ArrowLeft':
            this.focusPanel('left');
            break;
          case 'ArrowRight':
            this.focusPanel('right');
            break;
          case 'ArrowUp':
            this.focusPanel('top');
            break;
          case 'ArrowDown':
            this.focusPanel('bottom');
            break;
        }
      }
    });
    
    // Tab navigation within panels
    this.setupPanelTabNavigation();
    
    // Roving tabindex for tool palette
    this.setupRovingTabIndex('.tools-grid', '.tool-btn');
    
    // Roving tabindex for tile palette
    this.setupRovingTabIndex('.tile-grid', '.tile-item');
  }

  /**
   * Setup roving tabindex pattern
   */
  setupRovingTabIndex(containerSelector, itemSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    const items = container.querySelectorAll(itemSelector);
    let currentIndex = 0;
    
    // Set initial tabindex
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });
    
    // Handle keyboard navigation
    container.addEventListener('keydown', (e) => {
      let handled = false;
      
      switch (e.key) {
        case 'ArrowRight':
          currentIndex = (currentIndex + 1) % items.length;
          handled = true;
          break;
        case 'ArrowLeft':
          currentIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
          handled = true;
          break;
        case 'ArrowDown':
          // Calculate items per row
          const itemsPerRow = Math.floor(container.offsetWidth / items[0].offsetWidth);
          currentIndex = Math.min(currentIndex + itemsPerRow, items.length - 1);
          handled = true;
          break;
        case 'ArrowUp':
          const itemsPerRowUp = Math.floor(container.offsetWidth / items[0].offsetWidth);
          currentIndex = Math.max(currentIndex - itemsPerRowUp, 0);
          handled = true;
          break;
        case 'Home':
          currentIndex = 0;
          handled = true;
          break;
        case 'End':
          currentIndex = items.length - 1;
          handled = true;
          break;
      }
      
      if (handled) {
        e.preventDefault();
        
        // Update tabindex
        items.forEach((item, index) => {
          item.setAttribute('tabindex', index === currentIndex ? '0' : '-1');
        });
        
        // Focus new item
        items[currentIndex].focus();
      }
    });
  }

  /**
   * Setup panel tab navigation
   */
  setupPanelTabNavigation() {
    document.querySelectorAll('.workspace-panel').forEach(panel => {
      const focusableElements = panel.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;
      
      let currentIndex = 0;
      
      panel.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          // Let default tab behavior work within panel
          return;
        }
        
        // F6 to move between panels
        if (e.key === 'F6') {
          e.preventDefault();
          this.focusNextPanel(panel);
        }
      });
    });
  }

  /**
   * Focus a panel in specific dock
   */
  focusPanel(position) {
    const dock = document.querySelector(`#dock-${position} .workspace-panel`);
    if (dock) {
      const firstFocusable = dock.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
        this.announce(`Focused ${position} panel`);
      }
    }
  }

  /**
   * Focus next panel
   */
  focusNextPanel(currentPanel) {
    const allPanels = Array.from(document.querySelectorAll('.workspace-panel:not(.collapsed)'));
    const currentIndex = allPanels.indexOf(currentPanel);
    const nextIndex = (currentIndex + 1) % allPanels.length;
    
    const nextPanel = allPanels[nextIndex];
    if (nextPanel) {
      const firstFocusable = nextPanel.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
        const panelTitle = nextPanel.querySelector('.panel-title')?.textContent || 'Panel';
        this.announce(`Focused ${panelTitle}`);
      }
    }
  }

  /**
   * Handle high contrast mode
   */
  handleHighContrast() {
    // Check if high contrast mode is active
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const applyHighContrast = (matches) => {
      if (matches) {
        document.body.classList.add('high-contrast');
        this.enhanceContrastElements();
      } else {
        document.body.classList.remove('high-contrast');
      }
    };
    
    // Initial check
    applyHighContrast(mediaQuery.matches);
    
    // Listen for changes
    mediaQuery.addEventListener('change', (e) => applyHighContrast(e.matches));
  }

  /**
   * Enhance elements for high contrast
   */
  enhanceContrastElements() {
    // Add borders to interactive elements
    document.querySelectorAll('button, input, select, textarea').forEach(element => {
      if (!element.style.border) {
        element.style.outline = '2px solid currentColor';
        element.style.outlineOffset = '2px';
      }
    });
    
    // Ensure focus indicators are visible
    const style = document.createElement('style');
    style.textContent = `
      .high-contrast *:focus {
        outline: 3px solid currentColor !important;
        outline-offset: 2px !important;
      }
      
      .high-contrast .panel-header {
        border-bottom: 2px solid currentColor;
      }
      
      .high-contrast .workspace-panel {
        border: 2px solid currentColor;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup enhanced focus indicators
   */
  setupFocusIndicators() {
    // Add focus-visible polyfill behavior
    document.addEventListener('keydown', () => {
      document.body.classList.add('keyboard-navigation');
    });
    
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
    
    // Announce focus changes for important elements
    document.addEventListener('focusin', (e) => {
      const target = e.target;
      
      // Announce tool selection
      if (target.matches('.tool-btn')) {
        const toolName = target.querySelector('span:last-child')?.textContent || 'tool';
        this.announce(`${toolName} selected`);
      }
      
      // Announce tile selection
      if (target.matches('.tile-item')) {
        const tileId = target.getAttribute('data-tile-id');
        this.announce(`Tile ${tileId} selected`);
      }
      
      // Announce panel focus
      if (target.matches('.workspace-panel')) {
        const panelTitle = target.querySelector('.panel-title')?.textContent || 'Panel';
        this.announce(`${panelTitle} focused`);
      }
    });
  }

  /**
   * Create focus trap for modal
   */
  createFocusTrap(modalSelector) {
    const modal = document.querySelector(modalSelector);
    if (!modal) return;
    
    const focusableElements = modal.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    const trapFocus = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };
    
    // Store trap function
    this.focusTraps.set(modalSelector, trapFocus);
    
    // Add event listener
    modal.addEventListener('keydown', trapFocus);
    
    // Focus first element
    firstFocusable.focus();
    
    // Announce modal
    const modalTitle = modal.querySelector('h2, h3, .modal-title')?.textContent || 'Dialog';
    this.announce(`${modalTitle} opened`, 'assertive');
  }

  /**
   * Remove focus trap
   */
  removeFocusTrap(modalSelector) {
    const modal = document.querySelector(modalSelector);
    const trapFocus = this.focusTraps.get(modalSelector);
    
    if (modal && trapFocus) {
      modal.removeEventListener('keydown', trapFocus);
      this.focusTraps.delete(modalSelector);
      this.announce('Dialog closed');
    }
  }

  /**
   * Create accessible tooltip
   */
  createTooltip(elementSelector, config) {
    const element = document.querySelector(elementSelector);
    if (!element) return;
    
    const tooltipId = `tooltip-${Date.now()}`;
    const tooltip = document.createElement('div');
    tooltip.id = tooltipId;
    tooltip.className = 'accessible-tooltip';
    tooltip.setAttribute('role', config.role || 'tooltip');
    tooltip.textContent = config.content;
    tooltip.style.display = 'none';
    
    // Position styles
    Object.assign(tooltip.style, {
      position: 'absolute',
      zIndex: '10000',
      padding: '4px 8px',
      backgroundColor: 'var(--vscode-tooltip-background)',
      color: 'var(--vscode-tooltip-foreground)',
      border: '1px solid var(--vscode-tooltip-border)',
      borderRadius: '3px',
      fontSize: '12px',
      pointerEvents: 'none'
    });
    
    document.body.appendChild(tooltip);
    
    // Set ARIA attributes
    element.setAttribute('aria-describedby', tooltipId);
    
    let showTimeout;
    let hideTimeout;
    
    const showTooltip = () => {
      clearTimeout(hideTimeout);
      showTimeout = setTimeout(() => {
        tooltip.style.display = 'block';
        positionTooltip(element, tooltip, config.position || 'top');
      }, config.showDelay || 500);
    };
    
    const hideTooltip = () => {
      clearTimeout(showTimeout);
      hideTimeout = setTimeout(() => {
        tooltip.style.display = 'none';
      }, config.hideDelay || 0);
    };
    
    // Mouse events
    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
    
    // Keyboard events (if configured)
    if (config.showOnFocus !== false) {
      element.addEventListener('focus', showTooltip);
      element.addEventListener('blur', hideTooltip);
    }
    
    // Store tooltip reference
    this.tooltips.set(elementSelector, tooltip);
  }
}

/**
 * Position tooltip relative to element
 */
function positionTooltip(element, tooltip, position) {
  const rect = element.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  
  let top, left;
  
  switch (position) {
    case 'top':
      top = rect.top - tooltipRect.height - 5;
      left = rect.left + (rect.width - tooltipRect.width) / 2;
      break;
    case 'bottom':
      top = rect.bottom + 5;
      left = rect.left + (rect.width - tooltipRect.width) / 2;
      break;
    case 'left':
      top = rect.top + (rect.height - tooltipRect.height) / 2;
      left = rect.left - tooltipRect.width - 5;
      break;
    case 'right':
      top = rect.top + (rect.height - tooltipRect.height) / 2;
      left = rect.right + 5;
      break;
  }
  
  // Ensure tooltip stays within viewport
  top = Math.max(5, Math.min(top, window.innerHeight - tooltipRect.height - 5));
  left = Math.max(5, Math.min(left, window.innerWidth - tooltipRect.width - 5));
  
  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
}

// Initialize accessibility manager
window.accessibilityManager = new AccessibilityManager();

// Handle messages from extension
window.addEventListener('message', event => {
  const message = event.data;
  if (message.type === 'accessibility') {
    const manager = window.accessibilityManager;
    
    switch (message.command) {
      case 'announce':
        manager.announce(message.message, message.priority);
        break;
      case 'createTooltip':
        manager.createTooltip(message.elementSelector, message.config);
        break;
      case 'activateFocusTrap':
        manager.createFocusTrap(message.modalSelector);
        break;
      case 'deactivateFocusTrap':
        manager.removeFocusTrap(message.modalSelector);
        break;
      case 'initKeyboardNav':
        // Initialize keyboard navigation for container
        manager.setupRovingTabIndex(message.containerSelector, message.focusableSelectors.join(','));
        break;
    }
  }
});