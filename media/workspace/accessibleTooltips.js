/**
 * Accessible Tooltips Manager for Manic Miners Workspace
 * Provides keyboard-accessible tooltips with proper ARIA support
 */

class AccessibleTooltipManager {
  constructor() {
    this.tooltips = new Map();
    this.activeTooltip = null;
    this.tooltipIdCounter = 0;
    this.showDelay = 500;
    this.hideDelay = 200;
    this.focusShowDelay = 0; // Show immediately on focus
    
    this.init();
  }
  
  init() {
    // Global event listeners
    document.addEventListener('mouseenter', this.handleMouseEnter.bind(this), true);
    document.addEventListener('mouseleave', this.handleMouseLeave.bind(this), true);
    document.addEventListener('focusin', this.handleFocusIn.bind(this), true);
    document.addEventListener('focusout', this.handleFocusOut.bind(this), true);
    document.addEventListener('keydown', this.handleKeyDown.bind(this), true);
    
    // Initialize existing tooltips
    this.initializeExistingTooltips();
  }
  
  /**
   * Initialize tooltips for existing elements
   */
  initializeExistingTooltips() {
    // Find all elements with data-tooltip attribute
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
      this.registerTooltip(element);
    });
    
    // Find all elements with title attribute and convert to accessible tooltips
    const titleElements = document.querySelectorAll('[title]');
    titleElements.forEach(element => {
      const title = element.getAttribute('title');
      element.removeAttribute('title');
      element.setAttribute('data-tooltip', title);
      this.registerTooltip(element);
    });
  }
  
  /**
   * Register a tooltip for an element
   */
  registerTooltip(element, options = {}) {
    const tooltipId = `tooltip-${++this.tooltipIdCounter}`;
    const tooltipText = element.getAttribute('data-tooltip') || options.content || '';
    
    if (!tooltipText) return;
    
    const tooltip = {
      id: tooltipId,
      element,
      content: tooltipText,
      position: options.position || 'top',
      interactive: options.interactive || false,
      showTimer: null,
      hideTimer: null,
      tooltipElement: null
    };
    
    // Set ARIA attributes
    element.setAttribute('aria-describedby', tooltipId);
    
    // Store tooltip data
    this.tooltips.set(element, tooltip);
    
    return tooltip;
  }
  
  /**
   * Show tooltip
   */
  showTooltip(tooltip, immediate = false) {
    // Cancel any hide timer
    if (tooltip.hideTimer) {
      clearTimeout(tooltip.hideTimer);
      tooltip.hideTimer = null;
    }
    
    // If already showing, don't recreate
    if (tooltip.tooltipElement && tooltip.tooltipElement.classList.contains('visible')) {
      return;
    }
    
    const showFn = () => {
      // Hide any active tooltip first
      if (this.activeTooltip && this.activeTooltip !== tooltip) {
        this.hideTooltip(this.activeTooltip, true);
      }
      
      // Create tooltip element if not exists
      if (!tooltip.tooltipElement) {
        tooltip.tooltipElement = this.createTooltipElement(tooltip);
      }
      
      // Position and show
      this.positionTooltip(tooltip);
      tooltip.tooltipElement.classList.add('visible');
      
      // Update active tooltip
      this.activeTooltip = tooltip;
      
      // Announce to screen reader if focused
      if (document.activeElement === tooltip.element) {
        if (window.accessibilityManager) {
          window.accessibilityManager.announce(tooltip.content, 'polite');
        }
      }
    };
    
    if (immediate) {
      showFn();
    } else {
      tooltip.showTimer = setTimeout(showFn, this.showDelay);
    }
  }
  
  /**
   * Hide tooltip
   */
  hideTooltip(tooltip, immediate = false) {
    // Cancel any show timer
    if (tooltip.showTimer) {
      clearTimeout(tooltip.showTimer);
      tooltip.showTimer = null;
    }
    
    const hideFn = () => {
      if (tooltip.tooltipElement) {
        tooltip.tooltipElement.classList.remove('visible');
        
        // Remove after transition
        setTimeout(() => {
          if (tooltip.tooltipElement && !tooltip.tooltipElement.classList.contains('visible')) {
            tooltip.tooltipElement.remove();
            tooltip.tooltipElement = null;
          }
        }, 300);
      }
      
      if (this.activeTooltip === tooltip) {
        this.activeTooltip = null;
      }
    };
    
    if (immediate) {
      hideFn();
    } else {
      tooltip.hideTimer = setTimeout(hideFn, this.hideDelay);
    }
  }
  
  /**
   * Create tooltip element
   */
  createTooltipElement(tooltip) {
    const tooltipEl = document.createElement('div');
    tooltipEl.id = tooltip.id;
    tooltipEl.className = 'accessible-tooltip';
    tooltipEl.setAttribute('role', 'tooltip');
    tooltipEl.setAttribute('aria-hidden', 'true');
    tooltipEl.textContent = tooltip.content;
    
    // Add position class
    tooltipEl.classList.add(`tooltip-${tooltip.position}`);
    
    // Add to body
    document.body.appendChild(tooltipEl);
    
    // Make interactive if needed
    if (tooltip.interactive) {
      tooltipEl.style.pointerEvents = 'auto';
      
      tooltipEl.addEventListener('mouseenter', () => {
        if (tooltip.hideTimer) {
          clearTimeout(tooltip.hideTimer);
          tooltip.hideTimer = null;
        }
      });
      
      tooltipEl.addEventListener('mouseleave', () => {
        this.hideTooltip(tooltip);
      });
    }
    
    return tooltipEl;
  }
  
  /**
   * Position tooltip relative to element
   */
  positionTooltip(tooltip) {
    if (!tooltip.tooltipElement) return;
    
    const element = tooltip.element;
    const tooltipEl = tooltip.tooltipElement;
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    
    // Calculate positions
    let top = 0;
    let left = 0;
    
    switch (tooltip.position) {
      case 'top':
        top = rect.top - tooltipRect.height - 8;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
        
      case 'bottom':
        top = rect.bottom + 8;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
        
      case 'left':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.left - tooltipRect.width - 8;
        break;
        
      case 'right':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.right + 8;
        break;
    }
    
    // Adjust for viewport boundaries
    const padding = 10;
    
    // Horizontal adjustment
    if (left < padding) {
      left = padding;
      tooltipEl.classList.add('adjusted-left');
    } else if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding;
      tooltipEl.classList.add('adjusted-right');
    }
    
    // Vertical adjustment
    if (top < padding) {
      // Flip to bottom
      if (tooltip.position === 'top') {
        top = rect.bottom + 8;
        tooltipEl.classList.remove('tooltip-top');
        tooltipEl.classList.add('tooltip-bottom');
      } else {
        top = padding;
      }
    } else if (top + tooltipRect.height > window.innerHeight - padding) {
      // Flip to top
      if (tooltip.position === 'bottom') {
        top = rect.top - tooltipRect.height - 8;
        tooltipEl.classList.remove('tooltip-bottom');
        tooltipEl.classList.add('tooltip-top');
      } else {
        top = window.innerHeight - tooltipRect.height - padding;
      }
    }
    
    // Apply position
    tooltipEl.style.top = `${top}px`;
    tooltipEl.style.left = `${left}px`;
  }
  
  /**
   * Handle mouse enter
   */
  handleMouseEnter(e) {
    const element = e.target;
    const tooltip = this.tooltips.get(element);
    
    if (tooltip) {
      this.showTooltip(tooltip);
    }
  }
  
  /**
   * Handle mouse leave
   */
  handleMouseLeave(e) {
    const element = e.target;
    const tooltip = this.tooltips.get(element);
    
    if (tooltip && !tooltip.interactive) {
      this.hideTooltip(tooltip);
    }
  }
  
  /**
   * Handle focus in
   */
  handleFocusIn(e) {
    const element = e.target;
    const tooltip = this.tooltips.get(element);
    
    if (tooltip) {
      // Show immediately on focus
      this.showTooltip(tooltip, true);
    }
  }
  
  /**
   * Handle focus out
   */
  handleFocusOut(e) {
    const element = e.target;
    const tooltip = this.tooltips.get(element);
    
    if (tooltip) {
      this.hideTooltip(tooltip, true);
    }
  }
  
  /**
   * Handle key down
   */
  handleKeyDown(e) {
    // Escape key hides all tooltips
    if (e.key === 'Escape' && this.activeTooltip) {
      this.hideTooltip(this.activeTooltip, true);
      e.preventDefault();
    }
  }
  
  /**
   * Update tooltip content
   */
  updateTooltipContent(element, newContent) {
    const tooltip = this.tooltips.get(element);
    if (tooltip) {
      tooltip.content = newContent;
      element.setAttribute('data-tooltip', newContent);
      
      // Update live tooltip if visible
      if (tooltip.tooltipElement && tooltip.tooltipElement.classList.contains('visible')) {
        tooltip.tooltipElement.textContent = newContent;
        this.positionTooltip(tooltip);
      }
    }
  }
  
  /**
   * Remove tooltip
   */
  removeTooltip(element) {
    const tooltip = this.tooltips.get(element);
    if (tooltip) {
      if (tooltip.tooltipElement) {
        this.hideTooltip(tooltip, true);
      }
      
      element.removeAttribute('aria-describedby');
      this.tooltips.delete(element);
    }
  }
  
  /**
   * Observe DOM changes
   */
  observeDOM() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        // Check added nodes
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            if (node.hasAttribute('data-tooltip') || node.hasAttribute('title')) {
              this.initializeExistingTooltips();
            }
            
            // Check children
            const tooltipElements = node.querySelectorAll('[data-tooltip], [title]');
            if (tooltipElements.length > 0) {
              this.initializeExistingTooltips();
            }
          }
        });
        
        // Check removed nodes
        mutation.removedNodes.forEach(node => {
          if (node.nodeType === 1 && this.tooltips.has(node)) {
            this.removeTooltip(node);
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributeFilter: ['data-tooltip', 'title']
    });
  }
  
  /**
   * Clean up
   */
  destroy() {
    // Hide all tooltips
    this.tooltips.forEach(tooltip => {
      if (tooltip.tooltipElement) {
        tooltip.tooltipElement.remove();
      }
    });
    
    this.tooltips.clear();
    this.activeTooltip = null;
  }
}

// Initialize tooltip manager
const accessibleTooltipManager = new AccessibleTooltipManager();

// Observe DOM changes
accessibleTooltipManager.observeDOM();

// Export for use in other modules
window.AccessibleTooltipManager = AccessibleTooltipManager;
window.accessibleTooltipManager = accessibleTooltipManager;