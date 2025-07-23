// Documentation Viewer JavaScript

(function() {
  const vscode = acquireVsCodeApi();
  
  // State
  let currentPath = null;
  let searchTimeout = null;
  let tocObserver = null;
  
  // Elements
  const backBtn = document.getElementById('backBtn');
  const forwardBtn = document.getElementById('forwardBtn');
  const homeBtn = document.getElementById('homeBtn');
  const searchInput = document.getElementById('searchInput');
  const favoriteBtn = document.getElementById('favoriteBtn');
  const exportBtn = document.getElementById('exportBtn');
  const breadcrumbs = document.getElementById('breadcrumbs');
  const docContent = document.getElementById('docContent');
  const searchResults = document.getElementById('searchResults');
  const resultsList = document.getElementById('resultsList');
  const tableOfContents = document.getElementById('tableOfContents');
  const favoritesList = document.getElementById('favoritesList');
  const recentList = document.getElementById('recentList');
  
  // Initialize
  function initialize() {
    setupEventListeners();
    setupMessageHandler();
    
    // Notify extension we're ready
    vscode.postMessage({ type: 'ready' });
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Navigation
    backBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'back' });
    });
    
    forwardBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'forward' });
    });
    
    homeBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'ready' });
    });
    
    // Search
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      
      if (query.length > 2) {
        searchTimeout = setTimeout(() => {
          vscode.postMessage({ type: 'search', query });
        }, 300);
      } else {
        hideSearchResults();
      }
    });
    
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        hideSearchResults();
      }
    });
    
    // Actions
    favoriteBtn.addEventListener('click', () => {
      if (currentPath) {
        vscode.postMessage({ type: 'toggleFavorite', path: currentPath });
      }
    });
    
    exportBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'exportPDF' });
    });
    
    // Content interactions
    docContent.addEventListener('click', (e) => {
      const target = e.target;
      
      // Internal doc links
      if (target.dataset.doc) {
        e.preventDefault();
        vscode.postMessage({ type: 'navigate', path: target.dataset.doc });
      }
      
      // Copy button
      if (target.classList.contains('copy-button')) {
        const code = target.dataset.code;
        vscode.postMessage({ type: 'copyCode', code });
        
        // Visual feedback
        const originalText = target.textContent;
        target.textContent = 'Copied!';
        setTimeout(() => {
          target.textContent = originalText;
        }, 1000);
      }
      
      // Run button
      if (target.classList.contains('run-button')) {
        const code = target.dataset.code;
        vscode.postMessage({ type: 'runExample', code });
      }
      
      // Collapsible headers
      if (target.classList.contains('collapsible')) {
        toggleCollapsible(target);
      }
    });
    
    // Search results
    searchResults.addEventListener('click', (e) => {
      const result = e.target.closest('.search-result');
      if (result) {
        const path = result.dataset.path;
        vscode.postMessage({ type: 'navigate', path });
        hideSearchResults();
      }
    });
  }
  
  // Setup message handler
  function setupMessageHandler() {
    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.type) {
        case 'showDoc':
          showDocument(message);
          break;
          
        case 'showHome':
          showHome(message);
          break;
          
        case 'searchResults':
          showSearchResults(message);
          break;
          
        case 'updateBreadcrumbs':
          updateBreadcrumbs(message.breadcrumbs);
          break;
          
        case 'favoriteToggled':
          updateFavoriteButton(message.isFavorite);
          break;
      }
    });
  }
  
  // Show document
  function showDocument(data) {
    currentPath = data.path;
    
    // Update content
    docContent.innerHTML = data.content;
    docContent.scrollTop = 0;
    
    // Update navigation
    backBtn.disabled = !data.canGoBack;
    forwardBtn.disabled = !data.canGoForward;
    
    // Update favorite button
    updateFavoriteButton(data.isFavorite);
    
    // Hide search results
    hideSearchResults();
    
    // Build table of contents
    buildTableOfContents();
    
    // Setup intersection observer for TOC
    setupTOCObserver();
    
    // Highlight code blocks
    highlightCode();
  }
  
  // Show home
  function showHome(data) {
    currentPath = null;
    
    // Build home content
    let html = `
      <div class="home-page">
        <h1>Documentation</h1>
        <p>Welcome to the Manic Miners documentation viewer.</p>
    `;
    
    if (data.favorites && data.favorites.length > 0) {
      html += `
        <section>
          <h2>Favorites</h2>
          <div class="doc-links">
      `;
      
      data.favorites.forEach(path => {
        const name = path.split('/').pop().replace('.md', '');
        html += `<a href="#" data-doc="${path}">${name}</a>`;
      });
      
      html += `
          </div>
        </section>
      `;
    }
    
    if (data.recent && data.recent.length > 0) {
      html += `
        <section>
          <h2>Recent</h2>
          <div class="doc-links">
      `;
      
      data.recent.forEach(path => {
        const name = path.split('/').pop().replace('.md', '');
        html += `<a href="#" data-doc="${path}">${name}</a>`;
      });
      
      html += `
          </div>
        </section>
      `;
    }
    
    html += `
        <section>
          <h2>Quick Links</h2>
          <div class="doc-links">
            <a href="#" data-doc="components/index.md">Components</a>
            <a href="#" data-doc="api/index.md">API Reference</a>
            <a href="#" data-doc="examples/getting-started.md">Getting Started</a>
            <a href="#" data-doc="examples/advanced.md">Advanced Usage</a>
          </div>
        </section>
      </div>
    `;
    
    docContent.innerHTML = html;
    docContent.scrollTop = 0;
    
    // Clear breadcrumbs
    breadcrumbs.innerHTML = '';
    
    // Update navigation
    backBtn.disabled = true;
    forwardBtn.disabled = true;
    
    // Hide search results
    hideSearchResults();
    
    // Clear TOC
    tableOfContents.innerHTML = '';
  }
  
  // Show search results
  function showSearchResults(data) {
    if (data.results.length === 0) {
      resultsList.innerHTML = '<p>No results found.</p>';
    } else {
      let html = '';
      
      data.results.forEach(result => {
        html += `
          <div class="search-result" data-path="${result.path}">
            <span class="score">${result.score} matches</span>
            <h3>${result.title}</h3>
            <p>${result.preview}</p>
          </div>
        `;
      });
      
      resultsList.innerHTML = html;
    }
    
    // Show results
    searchResults.style.display = 'block';
    docContent.style.display = 'none';
  }
  
  // Hide search results
  function hideSearchResults() {
    searchResults.style.display = 'none';
    docContent.style.display = 'block';
  }
  
  // Update breadcrumbs
  function updateBreadcrumbs(items) {
    const parts = items.map((item, index) => {
      if (index === items.length - 1) {
        return `<span>${item.label}</span>`;
      }
      return `<a href="#" data-doc="${item.path}">${item.label}</a>`;
    });
    
    breadcrumbs.innerHTML = parts.join(' / ');
  }
  
  // Update favorite button
  function updateFavoriteButton(isFavorite) {
    const icon = favoriteBtn.querySelector('.codicon');
    if (isFavorite) {
      icon.classList.remove('codicon-star-empty');
      icon.classList.add('codicon-star-full');
      favoriteBtn.title = 'Remove from favorites';
    } else {
      icon.classList.remove('codicon-star-full');
      icon.classList.add('codicon-star-empty');
      favoriteBtn.title = 'Add to favorites';
    }
  }
  
  // Build table of contents
  function buildTableOfContents() {
    const headings = docContent.querySelectorAll('h1, h2, h3, h4');
    
    if (headings.length === 0) {
      tableOfContents.innerHTML = '<p>No headings found.</p>';
      return;
    }
    
    const toc = document.createElement('ul');
    const stack = [toc];
    let lastLevel = 0;
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName[1]);
      const id = heading.id || heading.textContent.toLowerCase().replace(/[^\w]+/g, '-');
      
      // Ensure heading has ID
      if (!heading.id) {
        heading.id = id;
      }
      
      // Adjust stack
      while (level > lastLevel + 1) {
        const ul = document.createElement('ul');
        const li = document.createElement('li');
        li.appendChild(ul);
        stack[stack.length - 1].appendChild(li);
        stack.push(ul);
        lastLevel++;
      }
      
      while (level < lastLevel + 1) {
        stack.pop();
        lastLevel--;
      }
      
      // Create TOC entry
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${id}`;
      a.textContent = heading.textContent.replace(/^#\s*/, '');
      a.addEventListener('click', (e) => {
        e.preventDefault();
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      
      li.appendChild(a);
      stack[stack.length - 1].appendChild(li);
      
      lastLevel = level;
    });
    
    tableOfContents.innerHTML = '';
    tableOfContents.appendChild(toc);
  }
  
  // Setup TOC intersection observer
  function setupTOCObserver() {
    // Clear previous observer
    if (tocObserver) {
      tocObserver.disconnect();
    }
    
    const headings = docContent.querySelectorAll('h1, h2, h3, h4');
    const links = tableOfContents.querySelectorAll('a');
    
    // Create observer
    tocObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.id;
        const link = tableOfContents.querySelector(`a[href="#${id}"]`);
        
        if (entry.isIntersecting) {
          // Remove active from all links
          links.forEach(l => l.classList.remove('active'));
          
          // Add active to current link
          if (link) {
            link.classList.add('active');
          }
        }
      });
    }, {
      rootMargin: '-10% 0px -70% 0px'
    });
    
    // Observe all headings
    headings.forEach(heading => {
      tocObserver.observe(heading);
    });
  }
  
  // Toggle collapsible section
  function toggleCollapsible(header) {
    const content = header.nextElementSibling;
    
    if (header.classList.contains('collapsed')) {
      header.classList.remove('collapsed');
      content.classList.remove('collapsed');
      content.style.maxHeight = content.scrollHeight + 'px';
    } else {
      header.classList.add('collapsed');
      content.classList.add('collapsed');
      content.style.maxHeight = '0';
    }
  }
  
  // Highlight code blocks
  function highlightCode() {
    // Code highlighting is handled by the marked renderer
    // This is a placeholder for any additional highlighting needs
  }
  
  // Initialize on load
  initialize();
})();