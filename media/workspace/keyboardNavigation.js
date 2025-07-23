/**
 * Keyboard Navigation Manager for Manic Miners Workspace
 * Provides visual indicators and navigation controls for keyboard users
 */

class KeyboardNavigationManager {
  constructor() {
    this.isKeyboardNavigation = false;
    this.currentFocusableIndex = 0;
    this.focusableElements = [];
    this.focusGroups = new Map();
    this.rovingTabIndexGroups = new Map();
    
    this.init();
  }
  
  init() {
    // Detect keyboard vs mouse navigation
    document.addEventListener('mousedown', () => {
      this.isKeyboardNavigation = false;
      document.body.classList.remove('keyboard-navigation');
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ' || 
          e.key.startsWith('Arrow') || e.key === 'Escape') {
        this.isKeyboardNavigation = true;
        document.body.classList.add('keyboard-navigation');
      }
    });
    
    // Handle global keyboard navigation
    document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));
    
    // Update focusable elements when DOM changes
    const observer = new MutationObserver(() => this.updateFocusableElements());
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true,
      attributeFilter: ['tabindex', 'disabled', 'aria-disabled']
    });
    
    // Initial scan
    this.updateFocusableElements();
  }
  
  /**
   * Update the list of focusable elements
   */
  updateFocusableElements() {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([aria-disabled="true"])',
      '[role="tab"]:not([aria-disabled="true"])',
      '[role="menuitem"]:not([aria-disabled="true"])'
    ].join(', ');
    
    this.focusableElements = Array.from(document.querySelectorAll(selector))
      .filter(el => this.isVisible(el));
  }
  
  /**
   * Check if an element is visible
   */
  isVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetParent !== null;
  }
  
  /**
   * Handle global keyboard navigation
   */
  handleGlobalKeydown(e) {
    // Skip links
    if (e.key === 'Tab' && !e.shiftKey && document.activeElement === document.body) {
      const skipLinks = document.querySelector('.skip-links');
      if (skipLinks) {
        skipLinks.style.top = '0';
        skipLinks.querySelector('a').focus();
        e.preventDefault();
      }
    }
    
    // F6 to cycle through panels
    if (e.key === 'F6') {
      this.cycleThroughPanels(e.shiftKey);
      e.preventDefault();
    }
    
    // Escape to close modals or return focus
    if (e.key === 'Escape') {
      this.handleEscape();
    }
  }
  
  /**
   * Initialize roving tabindex for a group
   */
  initRovingTabIndex(groupElement, options = {}) {
    const {
      selector = '[role="option"], [role="tab"], [role="menuitem"], .tool-btn, .tile-item',
      vertical = false,
      wrap = true,
      activateOnFocus = false
    } = options;
    
    const items = Array.from(groupElement.querySelectorAll(selector));
    if (items.length === 0) return;
    
    // Set initial tabindex
    items.forEach((item, index) => {
      item.tabIndex = index === 0 ? 0 : -1;
    });
    
    const groupId = this.generateGroupId();
    this.rovingTabIndexGroups.set(groupId, {
      element: groupElement,
      items,
      currentIndex: 0,
      vertical,
      wrap,
      activateOnFocus
    });
    
    // Add keyboard handler
    groupElement.addEventListener('keydown', (e) => {
      this.handleRovingTabIndex(e, groupId);
    });
    
    // Add focus handler
    groupElement.addEventListener('focusin', (e) => {
      const group = this.rovingTabIndexGroups.get(groupId);
      const index = group.items.indexOf(e.target);
      if (index !== -1) {
        this.setRovingTabIndex(groupId, index);
        if (activateOnFocus) {
          e.target.click();
        }
      }
    });
    
    return groupId;
  }
  
  /**
   * Handle roving tabindex navigation
   */
  handleRovingTabIndex(e, groupId) {
    const group = this.rovingTabIndexGroups.get(groupId);
    if (!group) return;
    
    const { items, currentIndex, vertical, wrap } = group;
    let newIndex = currentIndex;
    
    // Determine navigation direction
    if ((vertical && e.key === 'ArrowUp') || (!vertical && e.key === 'ArrowLeft')) {
      newIndex = currentIndex - 1;
      if (newIndex < 0) newIndex = wrap ? items.length - 1 : 0;
      e.preventDefault();
    } else if ((vertical && e.key === 'ArrowDown') || (!vertical && e.key === 'ArrowRight')) {
      newIndex = currentIndex + 1;
      if (newIndex >= items.length) newIndex = wrap ? 0 : items.length - 1;
      e.preventDefault();
    } else if (e.key === 'Home') {
      newIndex = 0;
      e.preventDefault();
    } else if (e.key === 'End') {
      newIndex = items.length - 1;
      e.preventDefault();
    } else {
      return; // Not a navigation key
    }
    
    // Update tabindex and focus
    this.setRovingTabIndex(groupId, newIndex);
    items[newIndex].focus();
  }
  
  /**
   * Set roving tabindex for a group
   */
  setRovingTabIndex(groupId, newIndex) {
    const group = this.rovingTabIndexGroups.get(groupId);
    if (!group) return;
    
    const { items, currentIndex } = group;
    
    // Update tabindex
    items[currentIndex].tabIndex = -1;
    items[newIndex].tabIndex = 0;
    
    // Update current index
    group.currentIndex = newIndex;
  }
  
  /**
   * Cycle through panels with F6
   */
  cycleThroughPanels(reverse = false) {
    const panels = Array.from(document.querySelectorAll('.workspace-panel:not(.collapsed)'));
    const dockZones = Array.from(document.querySelectorAll('.dock-zone'));
    const focusTargets = [...panels, ...dockZones].filter(el => this.isVisible(el));
    
    if (focusTargets.length === 0) return;
    
    // Find current focus
    let currentIndex = focusTargets.findIndex(target => 
      target.contains(document.activeElement)
    );
    
    if (currentIndex === -1) currentIndex = 0;
    
    // Calculate next index
    let nextIndex = reverse ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0) nextIndex = focusTargets.length - 1;
    if (nextIndex >= focusTargets.length) nextIndex = 0;
    
    // Focus the next panel
    const nextTarget = focusTargets[nextIndex];
    const focusable = nextTarget.querySelector('[tabindex="0"], button, input, select, textarea, a[href]');
    if (focusable) {
      focusable.focus();
    } else {
      nextTarget.tabIndex = -1;
      nextTarget.focus();
    }
  }
  
  /**
   * Handle escape key
   */
  handleEscape() {
    // Check for open modals
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      // Close modal and return focus
      const closeBtn = modal.querySelector('.modal-close, [aria-label*="Close"]');
      if (closeBtn) closeBtn.click();
      return;
    }
    
    // Check for focused panel
    const focusedPanel = document.querySelector('.workspace-panel:focus-within');
    if (focusedPanel) {
      // Move focus to panel header
      const header = focusedPanel.querySelector('.panel-header');
      if (header) {
        header.tabIndex = -1;
        header.focus();
      }
    }
  }
  
  /**
   * Create skip links
   */
  createSkipLinks() {
    const skipLinksHtml = `
      <div class="skip-links" role="navigation" aria-label="Skip links">
        <a href="#workspace-main" class="skip-link">Skip to main content</a>
        <a href="#dock-left" class="skip-link">Skip to left panels</a>
        <a href="#dock-right" class="skip-link">Skip to right panels</a>
        <a href="#workspace-status" class="skip-link">Skip to status bar</a>
      </div>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', skipLinksHtml);
    
    // Handle skip link clicks
    document.querySelectorAll('.skip-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          target.tabIndex = -1;
          target.focus();
          target.scrollIntoView();
        }
      });
    });
  }
  
  /**
   * Add visual focus indicator
   */
  addFocusIndicator(element) {
    element.classList.add('keyboard-focus');
    
    // Create focus ring element
    const focusRing = document.createElement('div');
    focusRing.className = 'focus-indicator-ring';
    focusRing.setAttribute('aria-hidden', 'true');
    
    // Position the focus ring
    const rect = element.getBoundingClientRect();
    focusRing.style.width = `${rect.width + 8}px`;
    focusRing.style.height = `${rect.height + 8}px`;
    focusRing.style.left = `${rect.left - 4}px`;
    focusRing.style.top = `${rect.top - 4}px`;
    
    document.body.appendChild(focusRing);
    
    // Remove on blur
    element.addEventListener('blur', () => {
      element.classList.remove('keyboard-focus');
      focusRing.remove();
    }, { once: true });
  }
  
  /**
   * Generate unique group ID
   */
  generateGroupId() {
    return `roving-group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Initialize panel keyboard navigation
   */
  initPanelNavigation(panel) {
    const header = panel.querySelector('.panel-header');
    const content = panel.querySelector('.panel-content');
    
    // Make panel focusable
    panel.tabIndex = -1;
    
    // Handle panel focus
    panel.addEventListener('focusin', () => {
      panel.classList.add('panel-focused');
    });
    
    panel.addEventListener('focusout', () => {
      // Check if focus is still within panel
      setTimeout(() => {
        if (!panel.contains(document.activeElement)) {
          panel.classList.remove('panel-focused');
        }
      }, 0);
    });
    
    // Keyboard shortcuts within panel
    panel.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'w':
            // Close panel
            const closeBtn = header.querySelector('.close');
            if (closeBtn) closeBtn.click();
            e.preventDefault();
            break;
          case 'm':
            // Minimize/maximize panel
            const minBtn = header.querySelector('.minimize');
            if (minBtn) minBtn.click();
            e.preventDefault();
            break;
        }
      }
    });
  }
  
  /**
   * Clean up roving tabindex group
   */
  destroyRovingTabIndex(groupId) {
    this.rovingTabIndexGroups.delete(groupId);
  }
}

// Initialize keyboard navigation
const keyboardNav = new KeyboardNavigationManager();

// Create skip links
keyboardNav.createSkipLinks();

// Export for use in other modules
window.KeyboardNavigationManager = KeyboardNavigationManager;
window.keyboardNav = keyboardNav;