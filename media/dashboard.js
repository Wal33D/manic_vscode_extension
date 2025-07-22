// @ts-check
(function() {
  const vscode = acquireVsCodeApi();
  
  // Get elements
  const currentMapInfo = document.getElementById('currentMapInfo');
  const editMapBtn = document.getElementById('editMapBtn');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const recentMapsList = document.getElementById('recentMapsList');
  const analysisSection = document.getElementById('analysisSection');
  const analysisContent = document.getElementById('analysisContent');
  
  // Stats elements
  const mapsCreatedEl = document.getElementById('mapsCreated');
  const timeSavedEl = document.getElementById('timeSaved');
  const quickActionsEl = document.getElementById('quickActions');
  const objectivesEl = document.getElementById('objectives');
  
  // Handle action buttons
  document.querySelectorAll('.action-button').forEach(button => {
    button.addEventListener('click', () => {
      const command = button.getAttribute('data-command');
      const argsStr = button.getAttribute('data-args');
      const args = argsStr ? JSON.parse(argsStr) : undefined;
      
      if (command) {
        vscode.postMessage({
          command: 'runCommand',
          commandId: command,
          args: args
        });
      }
    });
  });
  
  // Handle help links
  document.querySelectorAll('.help-links a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const command = link.getAttribute('data-command');
      const argsStr = link.getAttribute('data-args');
      const args = argsStr ? [argsStr] : undefined;
      
      if (command) {
        vscode.postMessage({
          command: 'runCommand',
          commandId: command,
          args: args
        });
      }
    });
  });
  
  // Message handler
  window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.type) {
      case 'updateDashboard':
        updateDashboard(message.stats);
        break;
    }
  });
  
  function updateDashboard(stats) {
    // Update current map
    if (stats.currentMapStats) {
      const map = stats.currentMapStats;
      currentMapInfo.innerHTML = `
        <div class="map-details">
          <div class="map-name">${escapeHtml(map.name)}</div>
          <div class="map-stats">
            <div class="map-stat">
              <span class="map-stat-label">Dimensions</span>
              <span class="map-stat-value">${map.dimensions.width}×${map.dimensions.height}</span>
            </div>
            <div class="map-stat">
              <span class="map-stat-label">Total Tiles</span>
              <span class="map-stat-value">${map.tileCount.toLocaleString()}</span>
            </div>
            <div class="map-stat">
              <span class="map-stat-label">Resources</span>
              <span class="map-stat-value">${map.resourceCount}</span>
            </div>
            <div class="map-stat">
              <span class="map-stat-label">Difficulty</span>
              <span class="map-stat-value">
                <span class="difficulty-badge difficulty-${map.difficultyScore}">${map.difficultyScore}</span>
              </span>
            </div>
          </div>
          <div class="map-stat">
            <span class="map-stat-label">Last Modified</span>
            <span class="map-stat-value">${map.lastModified}</span>
          </div>
        </div>
      `;
      
      // Enable buttons
      editMapBtn.disabled = false;
      analyzeBtn.disabled = false;
    } else {
      currentMapInfo.innerHTML = '<p class="no-map">No map currently open</p>';
      editMapBtn.disabled = true;
      analyzeBtn.disabled = true;
    }
    
    // Update extension stats
    mapsCreatedEl.textContent = stats.extensionStats.mapsCreated.toString();
    timeSavedEl.textContent = formatTime(stats.extensionStats.timeSaved);
    quickActionsEl.textContent = stats.extensionStats.quickActionsUsed.toString();
    objectivesEl.textContent = stats.extensionStats.objectivesBuilt.toString();
    
    // Update recent maps
    if (stats.recentMaps.length > 0) {
      recentMapsList.innerHTML = stats.recentMaps.map(path => {
        const name = path.split(/[\\/]/).pop() || path;
        return `
          <div class="recent-map-item" onclick="openMap('${escapeHtml(path)}')">
            <span class="recent-map-name">📄 ${escapeHtml(name)}</span>
          </div>
        `;
      }).join('');
    } else {
      recentMapsList.innerHTML = '<p class="no-recent">No recent maps</p>';
    }
  }
  
  // Global functions
  window.openMap = function(path) {
    vscode.postMessage({
      command: 'openMap',
      path: path
    });
  };
  
  window.openInMapEditor = function() {
    vscode.postMessage({
      command: 'openInMapEditor'
    });
  };
  
  window.analyzeCurrentMap = function() {
    vscode.postMessage({
      command: 'analyzeCurrentMap'
    });
  };
  
  // Utility functions
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  function formatTime(minutes) {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  
  // Refresh stats periodically
  setInterval(() => {
    vscode.postMessage({ command: 'refreshStats' });
  }, 30000); // Every 30 seconds
})();