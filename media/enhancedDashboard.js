// @ts-check
(function() {
  const vscode = acquireVsCodeApi();
  
  // State management
  let dashboardState = {
    currentProject: '',
    activePreset: 'mapping',
    projectOverview: null,
    recentCommands: [],
    contextualSuggestions: [],
    workflowProgress: null,
    pinnedTools: [],
    presets: []
  };

  // Initialize dashboard
  function initialize() {
    setupEventListeners();
    vscode.postMessage({ type: 'refreshOverview' });
  }

  // Event Listeners
  function setupEventListeners() {
    // Global click handler
    document.addEventListener('click', handleClick);
    
    // Preset selection
    document.addEventListener('click', (e) => {
      const presetCard = e.target.closest('.preset-card');
      if (presetCard) {
        const presetId = presetCard.getAttribute('data-preset-id');
        applyPreset(presetId);
      }
    });
    
    // Workflow cards
    document.addEventListener('click', (e) => {
      const workflowCard = e.target.closest('.workflow-card');
      if (workflowCard) {
        const workflowId = workflowCard.getAttribute('data-workflow');
        startWorkflow(workflowId);
      }
    });
    
    // Command items
    document.addEventListener('click', (e) => {
      const commandItem = e.target.closest('.command-item');
      if (commandItem) {
        const commandId = commandItem.getAttribute('data-command');
        executeCommand(commandId);
      }
    });
    
    // Tool buttons
    document.addEventListener('click', (e) => {
      const toolButton = e.target.closest('.tool-button');
      if (toolButton) {
        const toolId = toolButton.getAttribute('data-tool');
        if (e.shiftKey) {
          togglePinTool(toolId);
        } else {
          executeCommand(toolId);
        }
      }
    });
    
    // Suggestion cards
    document.addEventListener('click', (e) => {
      const suggestionCard = e.target.closest('.suggestion-card');
      if (suggestionCard) {
        const command = suggestionCard.getAttribute('data-command');
        executeCommand(command);
      }
    });
    
    // Activity items
    document.addEventListener('click', (e) => {
      const activityItem = e.target.closest('.activity-item');
      if (activityItem) {
        const mapPath = activityItem.getAttribute('data-map-path');
        if (mapPath) {
          openMap(mapPath);
        }
      }
    });
  }

  function handleClick(e) {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    
    const actionType = action.getAttribute('data-action');
    switch (actionType) {
      case 'refresh':
        vscode.postMessage({ type: 'refreshOverview' });
        break;
      case 'settings':
        executeCommand('workbench.action.openSettings', 'manicMiners');
        break;
      case 'createPreset':
        vscode.postMessage({ type: 'createCustomPreset' });
        break;
    }
  }

  // Actions
  function applyPreset(presetId) {
    vscode.postMessage({
      type: 'applyPreset',
      presetId: presetId
    });
    
    // Update UI immediately
    document.querySelectorAll('.preset-card').forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-preset-id') === presetId);
    });
  }

  function startWorkflow(workflowId) {
    vscode.postMessage({
      type: 'startWorkflow',
      workflowId: workflowId
    });
  }

  function executeCommand(commandId, args) {
    vscode.postMessage({
      type: 'executeCommand',
      commandId: commandId,
      args: args
    });
  }

  function togglePinTool(toolId) {
    vscode.postMessage({
      type: 'pinTool',
      toolId: toolId
    });
  }

  function openMap(mapPath) {
    vscode.postMessage({
      type: 'openMap',
      path: mapPath
    });
  }

  // Render functions
  function renderPresets(presets, activePreset) {
    const container = document.getElementById('presetGrid');
    if (!container) return;
    
    container.innerHTML = presets.map(preset => `
      <div class="preset-card ${preset.id === activePreset ? 'active' : ''}" 
           data-preset-id="${preset.id}"
           tabindex="0">
        <span class="preset-icon">${preset.icon}</span>
        <div class="preset-name">${preset.name}</div>
        <div class="preset-description">${preset.description}</div>
      </div>
    `).join('');
  }

  function renderProjectOverview(overview) {
    if (!overview) return;
    
    // Update stats
    updateElement('totalMaps', overview.totalMaps);
    updateElement('validMaps', overview.projectHealth.validMaps);
    updateElement('warningMaps', overview.projectHealth.warningMaps);
    updateElement('errorMaps', overview.projectHealth.errorMaps);
    
    // Render categories
    const categoriesContainer = document.getElementById('mapCategories');
    if (categoriesContainer && overview.mapsByCategory) {
      const categories = Array.from(overview.mapsByCategory || []);
      categoriesContainer.innerHTML = categories.map(([category, count]) => `
        <span class="category-tag">
          <span class="category-name">${category}</span>
          <span class="category-count">${count}</span>
        </span>
      `).join('');
    }
  }

  function renderPinnedTools(pinnedTools) {
    const container = document.getElementById('pinnedTools');
    if (!container) return;
    
    const allTools = [
      { id: 'manicMiners.newFile', label: 'New Map', icon: '📄' },
      { id: 'manicMiners.openMapEditor', label: 'Map Editor', icon: '✏️' },
      { id: 'manicMiners.runValidation', label: 'Validate', icon: '✅' },
      { id: 'manicMiners.showHeatMap', label: 'Heat Map', icon: '🔥' },
      { id: 'manicMiners.openObjectiveBuilder', label: 'Objectives', icon: '🎯' },
      { id: 'manicMiners.insertScriptPattern', label: 'Scripts', icon: '📝' },
      { id: 'manicMiners.showQuickActions', label: 'Actions', icon: '⚡' },
      { id: 'manicMiners.export', label: 'Export', icon: '📤' }
    ];
    
    container.innerHTML = allTools
      .filter(tool => pinnedTools.includes(tool.id))
      .map(tool => `
        <button class="tool-button" data-tool="${tool.id}" title="Shift+Click to unpin">
          <span class="tool-icon">${tool.icon}</span>
          <span class="tool-label">${tool.label}</span>
          <span class="pin-indicator">📌</span>
        </button>
      `).join('');
  }

  function renderRecentCommands(commands) {
    const container = document.getElementById('recentCommands');
    if (!container) return;
    
    const commandList = commands.length > 0 
      ? `<div class="command-list">
          ${commands.map(cmd => `
            <div class="command-item" data-command="${cmd.id}">
              <span class="command-icon">${cmd.icon}</span>
              <div class="command-info">
                <div class="command-label">${cmd.label}</div>
                <div class="command-time">${formatTime(cmd.lastUsed)}</div>
              </div>
            </div>
          `).join('')}
        </div>`
      : '<div class="empty-state">No recent commands</div>';
    
    container.innerHTML = `<h3>Recent Commands</h3>${commandList}`;
  }

  function renderSuggestions(suggestions) {
    const container = document.getElementById('suggestionList');
    if (!container) return;
    
    if (suggestions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💡</div>
          <div class="empty-state-text">No suggestions available</div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = suggestions.map(suggestion => `
      <div class="suggestion-card" data-command="${suggestion.command}">
        <div class="suggestion-title">${suggestion.title}</div>
        <div class="suggestion-desc">${suggestion.description}</div>
      </div>
    `).join('');
  }

  function renderWorkflowProgress(workflow) {
    const section = document.getElementById('workflowSection');
    const container = document.getElementById('workflowContent');
    
    if (!section || !container) return;
    
    if (!workflow || !workflow.currentWorkflow) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    
    const progress = (workflow.steps.filter(s => s.completed).length / workflow.steps.length) * 100;
    
    container.innerHTML = `
      <div class="workflow-header">
        <div class="workflow-title">${formatWorkflowName(workflow.currentWorkflow)}</div>
        <div class="workflow-progress-bar" style="width: ${progress}%"></div>
      </div>
      <div class="workflow-steps">
        ${workflow.steps.map((step, index) => `
          <div class="workflow-step ${step.completed ? 'completed' : ''} ${index === workflow.currentStep ? 'active' : ''}">
            <div class="step-indicator ${step.completed ? 'completed' : ''} ${index === workflow.currentStep ? 'active' : ''}">
              ${step.completed ? '✓' : index + 1}
            </div>
            <div class="step-info">
              <div class="step-title">${step.title}</div>
              ${step.optional ? '<div class="step-optional">(Optional)</div>' : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderActivityTimeline(activity) {
    const container = document.getElementById('activityTimeline');
    if (!container) return;
    
    if (!activity || activity.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <div class="empty-state-text">No recent activity</div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = activity.map(item => `
      <div class="activity-item" data-map-path="${item.mapPath}">
        <span class="activity-type-icon">${getActivityIcon(item.type)}</span>
        <div class="activity-content">
          <div class="activity-title">${item.mapName}</div>
          ${item.details ? `<div class="activity-details">${item.details}</div>` : ''}
        </div>
        <div class="activity-time">${formatTime(item.timestamp)}</div>
      </div>
    `).join('');
  }

  // Utility functions
  function updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = content;
    }
  }

  function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  }

  function formatWorkflowName(workflowId) {
    const names = {
      'new-map': 'Create New Map',
      'optimize-map': 'Optimize Map',
      'test-map': 'Test Map',
      'publish-map': 'Publish Map'
    };
    return names[workflowId] || workflowId;
  }

  function getActivityIcon(type) {
    const icons = {
      'created': '✨',
      'edited': '✏️',
      'validated': '✅',
      'exported': '📤',
      'analyzed': '🔍'
    };
    return icons[type] || '📄';
  }

  // Message handler
  window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.type) {
      case 'updateDashboard':
        dashboardState = message.state;
        
        // Update all sections
        renderPresets([...message.presets], dashboardState.activePreset);
        renderProjectOverview(dashboardState.projectOverview);
        renderPinnedTools(dashboardState.pinnedTools);
        renderRecentCommands(dashboardState.recentCommands);
        renderSuggestions(dashboardState.contextualSuggestions);
        renderWorkflowProgress(dashboardState.workflowProgress);
        
        if (dashboardState.projectOverview?.recentActivity) {
          renderActivityTimeline(dashboardState.projectOverview.recentActivity);
        }
        break;
    }
  });

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();