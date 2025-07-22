// @ts-check
(function() {
  const vscode = acquireVsCodeApi();
  let searchVisible = false;

  // Global functions
  window.searchShortcuts = function() {
    const searchContainer = document.getElementById('searchContainer');
    const searchInput = document.getElementById('searchInput');
    
    searchVisible = !searchVisible;
    searchContainer.style.display = searchVisible ? 'block' : 'none';
    
    if (searchVisible) {
      searchInput.focus();
    } else {
      searchInput.value = '';
      filterShortcuts();
    }
  };

  window.filterShortcuts = function() {
    const searchInput = document.getElementById('searchInput');
    const filter = searchInput.value.toLowerCase();
    const shortcutItems = document.querySelectorAll('.shortcut-item');
    const categories = document.querySelectorAll('.category-section');
    
    if (!filter) {
      // Show all items and categories
      shortcutItems.forEach(item => item.classList.remove('hidden'));
      categories.forEach(cat => cat.style.display = 'block');
      return;
    }
    
    // Hide all categories initially
    categories.forEach(cat => cat.style.display = 'none');
    
    // Filter shortcuts
    shortcutItems.forEach(item => {
      const description = item.querySelector('.shortcut-description').textContent.toLowerCase();
      const command = item.querySelector('.shortcut-command').textContent.toLowerCase();
      const key = item.querySelector('kbd').textContent.toLowerCase();
      
      const matches = description.includes(filter) || 
                     command.includes(filter) || 
                     key.includes(filter);
      
      if (matches) {
        item.classList.remove('hidden');
        // Show parent category
        const parentCategory = item.closest('.category-section');
        if (parentCategory) {
          parentCategory.style.display = 'block';
        }
      } else {
        item.classList.add('hidden');
      }
    });
    
    // Hide categories that have no visible shortcuts
    categories.forEach(cat => {
      const visibleItems = cat.querySelectorAll('.shortcut-item:not(.hidden)');
      if (visibleItems.length === 0) {
        cat.style.display = 'none';
      }
    });
  };

  window.executeCommand = function(command) {
    vscode.postMessage({
      command: 'executeCommand',
      command: command
    });
  };

  window.showInKeybindings = function(command) {
    vscode.postMessage({
      command: 'showInKeybindings',
      command: command
    });
  };

  window.exportShortcuts = function() {
    vscode.postMessage({
      command: 'export'
    });
  };

  window.importShortcuts = function() {
    vscode.postMessage({
      command: 'import'
    });
  };

  window.resetAllShortcuts = function() {
    const confirmed = confirm('Are you sure you want to reset all keyboard shortcuts to their defaults?');
    if (confirmed) {
      vscode.postMessage({
        command: 'resetAll'
      });
    }
  };

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Escape to close search
    if (e.key === 'Escape' && searchVisible) {
      searchShortcuts();
    }
    
    // Ctrl+F or Cmd+F to open search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      if (!searchVisible) {
        searchShortcuts();
      }
    }
  });

  // Add hover effects with delay
  let hoverTimeout;
  document.querySelectorAll('.shortcut-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        item.classList.add('hover-delayed');
      }, 100);
    });
    
    item.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimeout);
      item.classList.remove('hover-delayed');
    });
  });

  // Copy shortcut to clipboard on click
  document.querySelectorAll('kbd').forEach(kbd => {
    kbd.style.cursor = 'pointer';
    kbd.title = 'Click to copy';
    
    kbd.addEventListener('click', () => {
      const text = kbd.textContent;
      navigator.clipboard.writeText(text).then(() => {
        // Show feedback
        const originalText = kbd.textContent;
        kbd.textContent = '✓ Copied!';
        kbd.style.background = 'var(--vscode-terminal-ansiGreen)';
        kbd.style.color = 'white';
        
        setTimeout(() => {
          kbd.textContent = originalText;
          kbd.style.background = '';
          kbd.style.color = '';
        }, 1000);
      });
    });
  });

  // Platform detection
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  if (isMac) {
    document.body.classList.add('platform-mac');
  } else {
    document.body.classList.add('platform-windows');
  }

  // Smooth scroll to category
  function scrollToCategory(categoryName) {
    const categories = document.querySelectorAll('.category-title');
    for (const cat of categories) {
      if (cat.textContent.includes(categoryName)) {
        cat.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
    }
  }

  // Add category quick navigation
  const categoryNav = document.createElement('div');
  categoryNav.className = 'category-nav';
  categoryNav.innerHTML = `
    <button onclick="scrollToCategory('Navigation')">Navigation</button>
    <button onclick="scrollToCategory('Editing')">Editing</button>
    <button onclick="scrollToCategory('Validation')">Validation</button>
    <button onclick="scrollToCategory('AI Features')">AI</button>
  `;

  // Insert after header if needed
  // const header = document.querySelector('header');
  // header.parentNode.insertBefore(categoryNav, header.nextSibling);

  // Track usage (for analytics)
  document.querySelectorAll('.shortcut-item').forEach(item => {
    item.addEventListener('click', () => {
      const command = item.dataset.command;
      console.log('Shortcut clicked:', command);
    });
  });

  // Initialize
  console.log('Keyboard shortcuts panel initialized');
})();