/**
 * Shared Components for webview contexts
 * This file contains components that can be used across all webviews
 */

/**
 * Create a button with consistent styling and behavior
 */
function createButton(options = {}) {
  const {
    text = '',
    icon = '',
    onClick = () => {},
    className = '',
    tooltip = '',
    ariaLabel = '',
    variant = 'default', // default, primary, secondary, danger
    size = 'medium', // small, medium, large
    disabled = false
  } = options;

  const button = document.createElement('button');
  button.className = `shared-button shared-button--${variant} shared-button--${size} ${className}`;
  
  if (icon) {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'shared-button__icon';
    iconSpan.textContent = icon;
    iconSpan.setAttribute('aria-hidden', 'true');
    button.appendChild(iconSpan);
  }
  
  if (text) {
    const textSpan = document.createElement('span');
    textSpan.className = 'shared-button__text';
    textSpan.textContent = text;
    button.appendChild(textSpan);
  }
  
  if (tooltip) {
    button.setAttribute('data-tooltip', tooltip);
    button.title = tooltip;
  }
  
  if (ariaLabel) {
    button.setAttribute('aria-label', ariaLabel);
  } else if (tooltip) {
    button.setAttribute('aria-label', tooltip);
  } else if (text) {
    button.setAttribute('aria-label', text);
  }
  
  if (disabled) {
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
  }
  
  button.addEventListener('click', (e) => {
    if (!disabled) {
      onClick(e);
    }
  });
  
  // Add keyboard support
  button.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) {
        onClick(e);
      }
    }
  });
  
  return button;
}

/**
 * Create a panel with header and content
 */
function createPanel(options = {}) {
  const {
    id = '',
    title = '',
    icon = '',
    content = '',
    className = '',
    collapsible = true,
    closable = true,
    maximizable = true,
    onClose = () => {},
    onToggle = () => {},
    onMaximize = () => {}
  } = options;

  const panel = document.createElement('div');
  panel.className = `shared-panel ${className}`;
  if (id) panel.id = id;
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', title);

  // Header
  const header = document.createElement('div');
  header.className = 'shared-panel__header';
  header.setAttribute('role', 'heading');
  header.setAttribute('aria-level', '2');

  if (icon) {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'shared-panel__icon';
    iconSpan.textContent = icon;
    iconSpan.setAttribute('aria-hidden', 'true');
    header.appendChild(iconSpan);
  }

  const titleSpan = document.createElement('span');
  titleSpan.className = 'shared-panel__title';
  titleSpan.textContent = title;
  header.appendChild(titleSpan);

  // Controls
  const controls = document.createElement('div');
  controls.className = 'shared-panel__controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Panel controls');

  if (collapsible) {
    const collapseBtn = createButton({
      icon: '—',
      tooltip: 'Minimize panel',
      className: 'panel-control minimize',
      onClick: () => {
        panel.classList.toggle('collapsed');
        onToggle(panel.classList.contains('collapsed'));
      }
    });
    controls.appendChild(collapseBtn);
  }

  if (maximizable) {
    const maximizeBtn = createButton({
      icon: '□',
      tooltip: 'Maximize panel',
      className: 'panel-control maximize',
      onClick: () => {
        panel.classList.toggle('maximized');
        onMaximize(panel.classList.contains('maximized'));
      }
    });
    controls.appendChild(maximizeBtn);
  }

  if (closable) {
    const closeBtn = createButton({
      icon: '×',
      tooltip: 'Close panel',
      className: 'panel-control close',
      onClick: () => {
        panel.classList.add('closing');
        setTimeout(() => {
          panel.remove();
          onClose();
        }, 300);
      }
    });
    controls.appendChild(closeBtn);
  }

  header.appendChild(controls);
  panel.appendChild(header);

  // Content
  const contentDiv = document.createElement('div');
  contentDiv.className = 'shared-panel__content';
  if (typeof content === 'string') {
    contentDiv.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    contentDiv.appendChild(content);
  }
  panel.appendChild(contentDiv);

  return panel;
}

/**
 * Create a loading spinner
 */
function createLoadingSpinner(options = {}) {
  const {
    size = 'medium',
    text = 'Loading...',
    className = ''
  } = options;

  const container = document.createElement('div');
  container.className = `shared-loading shared-loading--${size} ${className}`;
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');

  const spinner = document.createElement('div');
  spinner.className = 'shared-loading__spinner';
  spinner.setAttribute('aria-hidden', 'true');

  const text_element = document.createElement('span');
  text_element.className = 'shared-loading__text';
  text_element.textContent = text;

  container.appendChild(spinner);
  container.appendChild(text_element);

  return container;
}

/**
 * Create a progress bar
 */
function createProgressBar(options = {}) {
  const {
    value = 0,
    max = 100,
    text = '',
    showPercentage = true,
    className = ''
  } = options;

  const container = document.createElement('div');
  container.className = `shared-progress ${className}`;
  container.setAttribute('role', 'progressbar');
  container.setAttribute('aria-valuenow', value);
  container.setAttribute('aria-valuemin', '0');
  container.setAttribute('aria-valuemax', max);

  const bar = document.createElement('div');
  bar.className = 'shared-progress__bar';
  bar.style.width = `${(value / max) * 100}%`;

  if (showPercentage) {
    const percentage = document.createElement('span');
    percentage.className = 'shared-progress__percentage';
    percentage.textContent = `${Math.round((value / max) * 100)}%`;
    bar.appendChild(percentage);
  }

  container.appendChild(bar);

  if (text) {
    const label = document.createElement('div');
    label.className = 'shared-progress__label';
    label.textContent = text;
    container.appendChild(label);
  }

  return container;
}

/**
 * Create tabs component
 */
function createTabs(options = {}) {
  const {
    tabs = [],
    activeTab = 0,
    className = '',
    onTabChange = () => {}
  } = options;

  const container = document.createElement('div');
  container.className = `shared-tabs ${className}`;

  const tabList = document.createElement('div');
  tabList.className = 'shared-tabs__list';
  tabList.setAttribute('role', 'tablist');

  const panels = document.createElement('div');
  panels.className = 'shared-tabs__panels';

  tabs.forEach((tab, index) => {
    // Create tab button
    const tabButton = createButton({
      text: tab.label,
      icon: tab.icon,
      className: `shared-tabs__tab ${index === activeTab ? 'active' : ''}`,
      onClick: () => {
        // Update active states
        tabList.querySelectorAll('.shared-tabs__tab').forEach((t, i) => {
          t.classList.toggle('active', i === index);
          t.setAttribute('aria-selected', i === index);
        });
        panels.querySelectorAll('.shared-tabs__panel').forEach((p, i) => {
          p.classList.toggle('active', i === index);
          p.setAttribute('aria-hidden', i !== index);
        });
        onTabChange(index, tab);
      }
    });
    tabButton.setAttribute('role', 'tab');
    tabButton.setAttribute('aria-selected', index === activeTab);
    tabButton.setAttribute('aria-controls', `tabpanel-${index}`);
    tabButton.id = `tab-${index}`;
    tabList.appendChild(tabButton);

    // Create panel
    const panel = document.createElement('div');
    panel.className = `shared-tabs__panel ${index === activeTab ? 'active' : ''}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${index}`);
    panel.setAttribute('aria-hidden', index !== activeTab);
    panel.id = `tabpanel-${index}`;
    
    if (typeof tab.content === 'string') {
      panel.innerHTML = tab.content;
    } else if (tab.content instanceof HTMLElement) {
      panel.appendChild(tab.content);
    }
    
    panels.appendChild(panel);
  });

  container.appendChild(tabList);
  container.appendChild(panels);

  return container;
}

/**
 * Create a search input
 */
function createSearchInput(options = {}) {
  const {
    placeholder = 'Search...',
    value = '',
    onSearch = () => {},
    onClear = () => {},
    debounceTime = 300,
    className = ''
  } = options;

  const container = document.createElement('div');
  container.className = `shared-search ${className}`;

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'shared-search__input';
  input.placeholder = placeholder;
  input.value = value;
  input.setAttribute('aria-label', placeholder);

  const clearButton = createButton({
    icon: '×',
    tooltip: 'Clear search',
    className: 'shared-search__clear',
    onClick: () => {
      input.value = '';
      input.focus();
      onClear();
    }
  });
  clearButton.style.display = value ? 'block' : 'none';

  let debounceTimer;
  input.addEventListener('input', (e) => {
    clearButton.style.display = e.target.value ? 'block' : 'none';
    
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onSearch(e.target.value);
    }, debounceTime);
  });

  container.appendChild(input);
  container.appendChild(clearButton);

  return container;
}

/**
 * Create a tooltip
 */
function createTooltip(targetElement, text, options = {}) {
  const {
    position = 'top',
    delay = 500,
    className = ''
  } = options;

  const tooltip = document.createElement('div');
  tooltip.className = `shared-tooltip shared-tooltip--${position} ${className}`;
  tooltip.textContent = text;
  tooltip.setAttribute('role', 'tooltip');
  tooltip.style.display = 'none';
  document.body.appendChild(tooltip);

  let showTimer;
  let hideTimer;

  const show = () => {
    clearTimeout(hideTimer);
    showTimer = setTimeout(() => {
      const rect = targetElement.getBoundingClientRect();
      
      switch (position) {
        case 'top':
          tooltip.style.left = `${rect.left + rect.width / 2}px`;
          tooltip.style.top = `${rect.top - 5}px`;
          break;
        case 'bottom':
          tooltip.style.left = `${rect.left + rect.width / 2}px`;
          tooltip.style.top = `${rect.bottom + 5}px`;
          break;
        case 'left':
          tooltip.style.left = `${rect.left - 5}px`;
          tooltip.style.top = `${rect.top + rect.height / 2}px`;
          break;
        case 'right':
          tooltip.style.left = `${rect.right + 5}px`;
          tooltip.style.top = `${rect.top + rect.height / 2}px`;
          break;
      }
      
      tooltip.style.display = 'block';
      tooltip.classList.add('visible');
    }, delay);
  };

  const hide = () => {
    clearTimeout(showTimer);
    hideTimer = setTimeout(() => {
      tooltip.classList.remove('visible');
      setTimeout(() => {
        tooltip.style.display = 'none';
      }, 200);
    }, 100);
  };

  targetElement.addEventListener('mouseenter', show);
  targetElement.addEventListener('mouseleave', hide);
  targetElement.addEventListener('focus', show);
  targetElement.addEventListener('blur', hide);

  return {
    destroy: () => {
      targetElement.removeEventListener('mouseenter', show);
      targetElement.removeEventListener('mouseleave', hide);
      targetElement.removeEventListener('focus', show);
      targetElement.removeEventListener('blur', hide);
      tooltip.remove();
    }
  };
}

// Export for use in webviews
window.SharedComponents = {
  createButton,
  createPanel,
  createLoadingSpinner,
  createProgressBar,
  createTabs,
  createSearchInput,
  createTooltip
};