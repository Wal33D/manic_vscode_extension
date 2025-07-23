/**
 * Focus Trap Manager for Manic Miners Workspace
 * Manages keyboard focus within modals and dialogs
 */

class FocusTrapManager {
  constructor() {
    this.activeTraps = new Map();
    this.previousFocus = null;
    this.trapIdCounter = 0;
  }
  
  /**
   * Create a focus trap for an element
   */
  createFocusTrap(element, options = {}) {
    const {
      initialFocus = null,
      fallbackFocus = null,
      escapeDeactivates = true,
      clickOutsideDeactivates = true,
      returnFocusOnDeactivate = true,
      onActivate = null,
      onDeactivate = null,
      onPostDeactivate = null
    } = options;
    
    const trapId = `focus-trap-${++this.trapIdCounter}`;
    
    const trap = {
      id: trapId,
      element,
      options,
      active: false,
      focusableElements: [],
      firstFocusableElement: null,
      lastFocusableElement: null,
      keydownHandler: null,
      clickHandler: null
    };
    
    // Store the trap
    this.activeTraps.set(trapId, trap);
    
    return {
      activate: () => this.activateTrap(trapId),
      deactivate: () => this.deactivateTrap(trapId),
      pause: () => this.pauseTrap(trapId),
      unpause: () => this.unpauseTrap(trapId),
      updateFocusableElements: () => this.updateFocusableElements(trapId)
    };
  }
  
  /**
   * Activate a focus trap
   */
  activateTrap(trapId) {
    const trap = this.activeTraps.get(trapId);
    if (!trap || trap.active) return;
    
    // Store current focus
    this.previousFocus = document.activeElement;
    
    // Mark as active
    trap.active = true;
    trap.element.classList.add('focus-trap-active');
    document.body.classList.add('has-focus-trap');
    
    // Find focusable elements
    this.updateFocusableElements(trapId);
    
    // Set initial focus
    if (trap.options.initialFocus) {
      const initialElement = typeof trap.options.initialFocus === 'string' 
        ? trap.element.querySelector(trap.options.initialFocus)
        : trap.options.initialFocus;
      
      if (initialElement) {
        initialElement.focus();
      }
    } else if (trap.firstFocusableElement) {
      trap.firstFocusableElement.focus();
    } else if (trap.options.fallbackFocus) {
      trap.options.fallbackFocus.focus();
    }
    
    // Setup event handlers
    trap.keydownHandler = (e) => this.handleKeydown(e, trapId);
    trap.element.addEventListener('keydown', trap.keydownHandler);
    
    if (trap.options.clickOutsideDeactivates) {
      trap.clickHandler = (e) => this.handleClickOutside(e, trapId);
      setTimeout(() => {
        document.addEventListener('click', trap.clickHandler);
      }, 0);
    }
    
    // Call activation callback
    if (trap.options.onActivate) {
      trap.options.onActivate();
    }
    
    // Announce to screen reader
    if (window.accessibilityManager) {
      window.accessibilityManager.announce('Dialog opened, press Escape to close');
    }
  }
  
  /**
   * Deactivate a focus trap
   */
  deactivateTrap(trapId) {
    const trap = this.activeTraps.get(trapId);
    if (!trap || !trap.active) return;
    
    // Mark as inactive
    trap.active = false;
    trap.element.classList.remove('focus-trap-active');
    document.body.classList.remove('has-focus-trap');
    
    // Remove event handlers
    if (trap.keydownHandler) {
      trap.element.removeEventListener('keydown', trap.keydownHandler);
    }
    
    if (trap.clickHandler) {
      document.removeEventListener('click', trap.clickHandler);
    }
    
    // Call deactivation callback
    if (trap.options.onDeactivate) {
      trap.options.onDeactivate();
    }
    
    // Return focus
    if (trap.options.returnFocusOnDeactivate && this.previousFocus) {
      this.previousFocus.focus();
    }
    
    // Call post-deactivation callback
    if (trap.options.onPostDeactivate) {
      trap.options.onPostDeactivate();
    }
    
    // Announce to screen reader
    if (window.accessibilityManager) {
      window.accessibilityManager.announce('Dialog closed');
    }
    
    // Clean up
    this.previousFocus = null;
  }
  
  /**
   * Pause a focus trap
   */
  pauseTrap(trapId) {
    const trap = this.activeTraps.get(trapId);
    if (!trap || !trap.active) return;
    
    trap.paused = true;
    trap.element.classList.add('focus-trap-paused');
  }
  
  /**
   * Unpause a focus trap
   */
  unpauseTrap(trapId) {
    const trap = this.activeTraps.get(trapId);
    if (!trap || !trap.active) return;
    
    trap.paused = false;
    trap.element.classList.remove('focus-trap-paused');
  }
  
  /**
   * Update focusable elements within trap
   */
  updateFocusableElements(trapId) {
    const trap = this.activeTraps.get(trapId);
    if (!trap) return;
    
    const focusableSelectors = [
      'a[href]:not([disabled])',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      '[contenteditable]:not([disabled])'
    ].join(', ');
    
    trap.focusableElements = Array.from(trap.element.querySelectorAll(focusableSelectors))
      .filter(el => this.isVisible(el) && this.isInteractive(el));
    
    trap.firstFocusableElement = trap.focusableElements[0] || null;
    trap.lastFocusableElement = trap.focusableElements[trap.focusableElements.length - 1] || null;
  }
  
  /**
   * Check if element is visible
   */
  isVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetParent !== null;
  }
  
  /**
   * Check if element is interactive
   */
  isInteractive(element) {
    return !element.hasAttribute('inert') && 
           element.getAttribute('aria-hidden') !== 'true';
  }
  
  /**
   * Handle keydown events within trap
   */
  handleKeydown(e, trapId) {
    const trap = this.activeTraps.get(trapId);
    if (!trap || !trap.active || trap.paused) return;
    
    // Handle Escape key
    if (e.key === 'Escape' && trap.options.escapeDeactivates) {
      e.preventDefault();
      this.deactivateTrap(trapId);
      return;
    }
    
    // Handle Tab key
    if (e.key === 'Tab') {
      if (trap.focusableElements.length === 0) {
        e.preventDefault();
        return;
      }
      
      const activeElement = document.activeElement;
      const activeIndex = trap.focusableElements.indexOf(activeElement);
      
      if (e.shiftKey) {
        // Shift+Tab (backwards)
        if (activeIndex <= 0) {
          e.preventDefault();
          trap.lastFocusableElement.focus();
        }
      } else {
        // Tab (forwards)
        if (activeIndex === trap.focusableElements.length - 1 || activeIndex === -1) {
          e.preventDefault();
          trap.firstFocusableElement.focus();
        }
      }
    }
  }
  
  /**
   * Handle clicks outside the trap
   */
  handleClickOutside(e, trapId) {
    const trap = this.activeTraps.get(trapId);
    if (!trap || !trap.active || trap.paused) return;
    
    if (!trap.element.contains(e.target)) {
      this.deactivateTrap(trapId);
    }
  }
  
  /**
   * Create modal dialog with focus trap
   */
  createModal(content, options = {}) {
    const {
      title = 'Dialog',
      className = '',
      closeButton = true,
      overlay = true,
      ...trapOptions
    } = options;
    
    // Create modal structure
    const modalHtml = `
      <div class="modal-overlay" role="presentation">
        <div class="modal-dialog ${className}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div class="modal-header">
            <h2 id="modal-title" class="modal-title">${title}</h2>
            ${closeButton ? '<button class="modal-close" aria-label="Close dialog">&times;</button>' : ''}
          </div>
          <div class="modal-body">
            ${content}
          </div>
        </div>
      </div>
    `;
    
    // Add to DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    const modalOverlay = modalContainer.firstElementChild;
    const modalDialog = modalOverlay.querySelector('.modal-dialog');
    
    document.body.appendChild(modalOverlay);
    
    // Create focus trap
    const focusTrap = this.createFocusTrap(modalDialog, {
      ...trapOptions,
      initialFocus: '.modal-body input, .modal-body button',
      fallbackFocus: '.modal-close',
      onPostDeactivate: () => {
        modalOverlay.remove();
      }
    });
    
    // Setup close button
    if (closeButton) {
      const closeBtn = modalDialog.querySelector('.modal-close');
      closeBtn.addEventListener('click', () => {
        focusTrap.deactivate();
      });
    }
    
    // Setup overlay click
    if (overlay && trapOptions.clickOutsideDeactivates !== false) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          focusTrap.deactivate();
        }
      });
    }
    
    // Activate trap
    focusTrap.activate();
    
    return {
      element: modalDialog,
      focusTrap,
      close: () => focusTrap.deactivate()
    };
  }
  
  /**
   * Create confirmation dialog
   */
  createConfirmDialog(message, options = {}) {
    const {
      title = 'Confirm',
      confirmText = 'OK',
      cancelText = 'Cancel',
      onConfirm = null,
      onCancel = null,
      ...modalOptions
    } = options;
    
    const content = `
      <p class="confirm-message">${message}</p>
      <div class="confirm-actions">
        <button class="btn btn-primary confirm-ok">${confirmText}</button>
        <button class="btn btn-secondary confirm-cancel">${cancelText}</button>
      </div>
    `;
    
    const modal = this.createModal(content, {
      title,
      className: 'modal-confirm',
      ...modalOptions
    });
    
    // Setup button handlers
    const confirmBtn = modal.element.querySelector('.confirm-ok');
    const cancelBtn = modal.element.querySelector('.confirm-cancel');
    
    confirmBtn.addEventListener('click', () => {
      modal.close();
      if (onConfirm) onConfirm();
    });
    
    cancelBtn.addEventListener('click', () => {
      modal.close();
      if (onCancel) onCancel();
    });
    
    return modal;
  }
  
  /**
   * Clean up all focus traps
   */
  destroy() {
    this.activeTraps.forEach((trap, trapId) => {
      if (trap.active) {
        this.deactivateTrap(trapId);
      }
    });
    
    this.activeTraps.clear();
  }
}

// Initialize focus trap manager
const focusTrapManager = new FocusTrapManager();

// Export for use in other modules
window.FocusTrapManager = FocusTrapManager;
window.focusTrapManager = focusTrapManager;