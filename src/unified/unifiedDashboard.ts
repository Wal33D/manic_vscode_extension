import * as vscode from 'vscode';
import { LazyLoader } from '../workspace/lazyLoader.js';
import { debounce } from '../utils/debounce.js';
import { globalCache } from '../utils/cache.js';
import { generateAriaLabel } from '../utils/accessibility.js';

/**
 * Unified Dashboard Component
 * Central command center for the workspace with comprehensive project overview
 */
export class UnifiedDashboard {
  // private readonly _extensionUri: vscode.Uri;
  private webview?: vscode.Webview;
  private lazyLoader?: LazyLoader;

  // Dashboard state
  private workspaceStats: WorkspaceStats = {
    totalMaps: 0,
    totalMiners: 0,
    totalResources: 0,
    activeProcesses: 0,
    lastUpdate: Date.now(),
  };

  // Recent activity tracking
  private recentActions: RecentAction[] = [];
  private maxRecentActions: number = 50;

  // Workspace presets
  private workspacePresets: WorkspacePreset[] = [];
  // private activePreset?: string;

  // Performance metrics
  private performanceMetrics: PerformanceMetrics = {
    fps: 60,
    memoryUsage: 0,
    cpuUsage: 0,
  };

  // Quick actions
  private quickActions: QuickAction[] = [];

  // Notifications
  private notifications: Notification[] = [];
  private maxNotifications: number = 10;

  // Search functionality
  private searchHistory: string[] = [];
  private searchResults: SearchResult[] = []; // Used in performSearch and other methods

  // Dashboard customization
  private dashboardLayout: DashboardLayout = {
    widgets: [],
    theme: 'default',
  };

  // Update handlers
  private readonly updateStatsDebounced: () => void;
  private readonly updateMetricsDebounced: () => void;

  constructor(_extensionUri: vscode.Uri) {
    // this._extensionUri = extensionUri;

    // Create debounced update functions
    this.updateStatsDebounced = debounce(() => this.updateStats(), 500);
    this.updateMetricsDebounced = debounce(() => this.updateMetrics(), 100);

    // Initialize default presets
    this.initializeDefaultPresets();

    // Initialize quick actions
    this.initializeQuickActions();
  }

  /**
   * Initialize the dashboard within a webview
   */
  public async initialize(webview: vscode.Webview): Promise<void> {
    this.webview = webview;

    // Initialize lazy loader
    this.lazyLoader = new LazyLoader(webview);

    // Set up message handling
    this.setupMessageHandling();

    // Load dashboard UI
    await this.loadDashboardUI();

    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Set up message handling from webview
   */
  private setupMessageHandling(): void {
    if (!this.webview) {
      return;
    }

    this.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'executeAction':
          await this.executeQuickAction(message.actionId);
          break;

        case 'applyPreset':
          await this.applyWorkspacePreset(message.presetId);
          break;

        case 'search':
          await this.performSearch(message.query);
          break;

        case 'dismissNotification':
          this.dismissNotification(message.notificationId);
          break;

        case 'openRecent':
          await this.openRecentItem(message.itemId);
          break;

        case 'customizeWidget':
          await this.customizeWidget(message.widgetId, message.config);
          break;

        case 'exportDashboard':
          await this.exportDashboardConfig();
          break;

        case 'importDashboard':
          await this.importDashboardConfig(message.config);
          break;

        case 'refreshStats':
          await this.refreshAllStats();
          break;

        case 'toggleWidget':
          this.toggleWidget(message.widgetId);
          break;

        case 'createPreset':
          await this.createWorkspacePreset(message.name, message.config);
          break;

        case 'deletePreset':
          this.deleteWorkspacePreset(message.presetId);
          break;

        case 'pinAction':
          this.pinQuickAction(message.actionId);
          break;

        case 'unpinAction':
          this.unpinQuickAction(message.actionId);
          break;

        case 'analytics':
          await this.showAnalytics(message.timeRange);
          break;
      }
    });
  }

  /**
   * Load dashboard UI components
   */
  private async loadDashboardUI(): Promise<void> {
    if (!this.webview) {
      return;
    }

    // Send initial dashboard configuration
    this.webview.postMessage({
      type: 'initDashboard',
      config: {
        stats: this.workspaceStats,
        presets: this.workspacePresets,
        actions: this.quickActions,
        layout: this.dashboardLayout,
      },
    });

    // Load widgets lazily
    await this.loadDashboardWidgets();
  }

  /**
   * Load dashboard widgets
   */
  private async loadDashboardWidgets(): Promise<void> {
    // Statistics widget
    await this.lazyLoader?.loadPanel('dashboardStats', {
      panelId: 'dashboardStats',
      loadContent: async () => this.getStatsWidgetContent(),
      cacheContent: false, // Always fresh stats
    });

    // Quick actions widget
    await this.lazyLoader?.loadPanel('dashboardQuickActions', {
      panelId: 'dashboardQuickActions',
      loadContent: async () => this.getQuickActionsContent(),
      cacheContent: true,
    });

    // Recent activity widget
    await this.lazyLoader?.loadPanel('dashboardRecent', {
      panelId: 'dashboardRecent',
      loadContent: async () => this.getRecentActivityContent(),
      cacheContent: false,
    });

    // Performance monitor widget
    await this.lazyLoader?.loadPanel('dashboardPerformance', {
      panelId: 'dashboardPerformance',
      loadContent: async () => this.getPerformanceContent(),
      cacheContent: false,
    });

    // Notifications widget
    await this.lazyLoader?.loadPanel('dashboardNotifications', {
      panelId: 'dashboardNotifications',
      loadContent: async () => this.getNotificationsContent(),
      cacheContent: false,
    });

    // Search widget
    await this.lazyLoader?.loadPanel('dashboardSearch', {
      panelId: 'dashboardSearch',
      loadContent: async () => this.getSearchWidgetContent(),
      cacheContent: true,
    });
  }

  /**
   * Initialize default workspace presets
   */
  private initializeDefaultPresets(): void {
    this.workspacePresets = [
      {
        id: 'default',
        name: 'Default Layout',
        icon: '🏠',
        layout: {
          panels: {
            left: ['tools', 'layers'],
            right: ['minimap', 'properties'],
            bottom: ['output', 'terminal'],
          },
          sizes: {
            left: 200,
            right: 300,
            bottom: 150,
          },
        },
      },
      {
        id: 'mapEditing',
        name: 'Map Editing',
        icon: '🗺️',
        layout: {
          panels: {
            left: ['tools', 'tiles', 'layers'],
            right: ['minimap', 'properties'],
            bottom: ['output'],
          },
          sizes: {
            left: 250,
            right: 350,
            bottom: 100,
          },
        },
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        icon: '📊',
        layout: {
          panels: {
            left: ['processes'],
            right: ['performance', 'logs'],
            bottom: ['terminal', 'output'],
          },
          sizes: {
            left: 200,
            right: 400,
            bottom: 200,
          },
        },
      },
      {
        id: 'minimal',
        name: 'Minimal',
        icon: '✨',
        layout: {
          panels: {
            left: [],
            right: ['minimap'],
            bottom: [],
          },
          sizes: {
            left: 0,
            right: 200,
            bottom: 0,
          },
        },
      },
    ];
  }

  /**
   * Initialize quick actions
   */
  private initializeQuickActions(): void {
    this.quickActions = [
      {
        id: 'newMap',
        label: 'New Map',
        icon: '➕',
        command: 'manicMiners.createMap',
        description: 'Create a new map',
        category: 'create',
        pinned: true,
      },
      {
        id: 'openMap',
        label: 'Open Map',
        icon: '📂',
        command: 'manicMiners.openMap',
        description: 'Open existing map',
        category: 'file',
        pinned: true,
      },
      {
        id: 'startMiner',
        label: 'Start Miner',
        icon: '⛏️',
        command: 'manicMiners.startMiner',
        description: 'Start a new miner process',
        category: 'process',
        pinned: false,
      },
      {
        id: 'showProcesses',
        label: 'Show Processes',
        icon: '📊',
        command: 'manicMiners.showProcesses',
        description: 'View active processes',
        category: 'view',
        pinned: false,
      },
      {
        id: 'exportMap',
        label: 'Export Map',
        icon: '💾',
        command: 'manicMiners.exportMap',
        description: 'Export current map',
        category: 'file',
        pinned: false,
      },
      {
        id: 'showLogs',
        label: 'Show Logs',
        icon: '📜',
        command: 'manicMiners.showLogs',
        description: 'View miner logs',
        category: 'view',
        pinned: false,
      },
      {
        id: 'preferences',
        label: 'Preferences',
        icon: '⚙️',
        command: 'manicMiners.showPreferences',
        description: 'Open workspace preferences',
        category: 'settings',
        pinned: false,
      },
      {
        id: 'documentation',
        label: 'Documentation',
        icon: '📚',
        command: 'manicMiners.showDocs',
        description: 'Open documentation',
        category: 'help',
        pinned: false,
      },
    ];
  }

  /**
   * Start monitoring workspace
   */
  private startMonitoring(): void {
    // Update stats periodically
    setInterval(() => {
      this.updateStatsDebounced();
    }, 5000);

    // Update performance metrics
    setInterval(() => {
      this.updateMetricsDebounced();
    }, 1000);

    // Clean old notifications
    setInterval(() => {
      this.cleanOldNotifications();
    }, 30000);
  }

  /**
   * Update workspace statistics
   */
  private async updateStats(): Promise<void> {
    try {
      // Get workspace data
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        return;
      }

      // Count maps
      const mapFiles = await vscode.workspace.findFiles('**/*.map.json', null, 1000);
      this.workspaceStats.totalMaps = mapFiles.length;

      // Get active processes (from cache or extension state)
      const processes = globalCache.get('activeProcesses') || [];
      this.workspaceStats.activeProcesses = processes.length;

      // Calculate total miners and resources
      let totalMiners = 0;
      let totalResources = 0;

      for (const process of processes) {
        totalMiners += process.minerCount || 0;
        totalResources += process.resourcesCollected || 0;
      }

      this.workspaceStats.totalMiners = totalMiners;
      this.workspaceStats.totalResources = totalResources;
      this.workspaceStats.lastUpdate = Date.now();

      // Update UI
      this.webview?.postMessage({
        type: 'updateStats',
        stats: this.workspaceStats,
      });
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    // Get metrics from performance monitor if available
    if (globalCache.get('performanceMetrics')) {
      this.performanceMetrics = globalCache.get('performanceMetrics');

      this.webview?.postMessage({
        type: 'updateMetrics',
        metrics: this.performanceMetrics,
      });
    }
  }

  /**
   * Execute quick action
   */
  private async executeQuickAction(actionId: string): Promise<void> {
    const action = this.quickActions.find(a => a.id === actionId);
    if (!action) {
      return;
    }

    // Track action
    this.trackAction({
      id: Date.now().toString(),
      type: 'quickAction',
      label: action.label,
      timestamp: Date.now(),
      details: { actionId },
    });

    // Execute command
    await vscode.commands.executeCommand(action.command);

    // Show notification
    this.addNotification({
      id: Date.now().toString(),
      type: 'info',
      message: `Executed: ${action.label}`,
      timestamp: Date.now(),
    });
  }

  /**
   * Apply workspace preset
   */
  private async applyWorkspacePreset(presetId: string): Promise<void> {
    const preset = this.workspacePresets.find(p => p.id === presetId);
    if (!preset) {
      return;
    }

    // this.activePreset = presetId;

    // Send preset configuration to extension
    await vscode.commands.executeCommand('manicMiners.applyLayout', preset.layout);

    // Track action
    this.trackAction({
      id: Date.now().toString(),
      type: 'preset',
      label: `Applied preset: ${preset.name}`,
      timestamp: Date.now(),
      details: { presetId },
    });

    // Update UI
    this.webview?.postMessage({
      type: 'presetApplied',
      presetId,
    });
  }

  /**
   * Perform search
   */
  private async performSearch(query: string): Promise<void> {
    if (!query.trim()) {
      return;
    }

    // Add to search history
    this.searchHistory.unshift(query);
    if (this.searchHistory.length > 10) {
      this.searchHistory.pop();
    }

    // Clear previous results
    this.searchResults = [];

    // Search in different categories
    const results: SearchResult[] = [];

    // Search in files
    const fileResults = await vscode.workspace.findFiles(`**/*${query}*`, null, 20);
    for (const uri of fileResults) {
      results.push({
        id: uri.toString(),
        type: 'file',
        title: vscode.workspace.asRelativePath(uri),
        description: 'File',
        icon: '📄',
        action: () => vscode.window.showTextDocument(uri),
      });
    }

    // Search in quick actions
    const actionResults = this.quickActions.filter(
      a =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.description.toLowerCase().includes(query.toLowerCase())
    );

    for (const action of actionResults) {
      results.push({
        id: action.id,
        type: 'action',
        title: action.label,
        description: action.description,
        icon: action.icon,
        action: () => vscode.commands.executeCommand(action.command),
      });
    }

    // Search in recent actions
    const recentResults = this.recentActions
      .filter(a => a.label.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);

    for (const recent of recentResults) {
      results.push({
        id: recent.id,
        type: 'recent',
        title: recent.label,
        description: `Recent: ${new Date(recent.timestamp).toLocaleTimeString()}`,
        icon: '🕒',
        action: () => this.openRecentItem(recent.id),
      });
    }

    this.searchResults = results;

    // Update UI
    this.webview?.postMessage({
      type: 'searchResults',
      results: this.searchResults.map(r => ({
        id: r.id,
        type: r.type,
        title: r.title,
        description: r.description,
        icon: r.icon,
      })),
    });
  }

  /**
   * Track user action
   */
  private trackAction(action: RecentAction): void {
    this.recentActions.unshift(action);

    // Limit size
    if (this.recentActions.length > this.maxRecentActions) {
      this.recentActions = this.recentActions.slice(0, this.maxRecentActions);
    }

    // Update UI
    this.webview?.postMessage({
      type: 'updateRecent',
      recent: this.recentActions.slice(0, 10),
    });
  }

  /**
   * Add notification
   */
  private addNotification(notification: Notification): void {
    this.notifications.unshift(notification);

    // Limit size
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    // Update UI
    this.webview?.postMessage({
      type: 'addNotification',
      notification,
    });
  }

  /**
   * Get stats widget content
   */
  private async getStatsWidgetContent(): Promise<string> {
    return `
      <div class="dashboard-widget stats-widget">
        <h3>${generateAriaLabel('widgetTitle', { name: 'Workspace Statistics' })}</h3>
        <div class="stats-grid" role="list">
          <div class="stat-item" role="listitem">
            <span class="stat-icon">🗺️</span>
            <span class="stat-value">${this.workspaceStats.totalMaps}</span>
            <span class="stat-label">Maps</span>
          </div>
          <div class="stat-item" role="listitem">
            <span class="stat-icon">⛏️</span>
            <span class="stat-value">${this.workspaceStats.totalMiners}</span>
            <span class="stat-label">Miners</span>
          </div>
          <div class="stat-item" role="listitem">
            <span class="stat-icon">💎</span>
            <span class="stat-value">${this.workspaceStats.totalResources}</span>
            <span class="stat-label">Resources</span>
          </div>
          <div class="stat-item" role="listitem">
            <span class="stat-icon">⚡</span>
            <span class="stat-value">${this.workspaceStats.activeProcesses}</span>
            <span class="stat-label">Active</span>
          </div>
        </div>
        <div class="stats-footer">
          <small>Last updated: ${new Date(this.workspaceStats.lastUpdate).toLocaleTimeString()}</small>
        </div>
      </div>
    `;
  }

  /**
   * Get quick actions content
   */
  private async getQuickActionsContent(): Promise<string> {
    const pinnedActions = this.quickActions.filter(a => a.pinned);
    const categories = [...new Set(this.quickActions.map(a => a.category))];

    let content = `
      <div class="dashboard-widget quick-actions-widget">
        <h3>${generateAriaLabel('widgetTitle', { name: 'Quick Actions' })}</h3>
        <div class="actions-section">
          <h4>Pinned Actions</h4>
          <div class="actions-grid" role="toolbar">
    `;

    for (const action of pinnedActions) {
      content += `
        <button class="action-btn" data-action="${action.id}" 
                aria-label="${action.description}"
                title="${action.description}">
          <span class="action-icon">${action.icon}</span>
          <span class="action-label">${action.label}</span>
        </button>
      `;
    }

    content += `
          </div>
        </div>
        <div class="actions-categories">
    `;

    for (const category of categories) {
      const categoryActions = this.quickActions.filter(a => a.category === category && !a.pinned);
      if (categoryActions.length === 0) {
        continue;
      }

      content += `
        <details class="action-category">
          <summary>${category.charAt(0).toUpperCase() + category.slice(1)}</summary>
          <div class="category-actions">
      `;

      for (const action of categoryActions) {
        content += `
          <button class="action-item" data-action="${action.id}">
            <span class="action-icon">${action.icon}</span>
            <span>${action.label}</span>
          </button>
        `;
      }

      content += `
          </div>
        </details>
      `;
    }

    content += `
        </div>
      </div>
    `;

    return content;
  }

  /**
   * Get recent activity content
   */
  private async getRecentActivityContent(): Promise<string> {
    const recentItems = this.recentActions.slice(0, 10);

    let content = `
      <div class="dashboard-widget recent-activity-widget">
        <h3>${generateAriaLabel('widgetTitle', { name: 'Recent Activity' })}</h3>
        <div class="recent-list" role="list">
    `;

    if (recentItems.length === 0) {
      content += '<div class="empty-state">No recent activity</div>';
    } else {
      for (const item of recentItems) {
        const timeAgo = this.getTimeAgo(item.timestamp);
        content += `
          <div class="recent-item" role="listitem" data-item="${item.id}">
            <span class="recent-type">${this.getActivityIcon(item.type)}</span>
            <div class="recent-details">
              <span class="recent-label">${item.label}</span>
              <small class="recent-time">${timeAgo}</small>
            </div>
          </div>
        `;
      }
    }

    content += `
        </div>
      </div>
    `;

    return content;
  }

  /**
   * Get performance content
   */
  private async getPerformanceContent(): Promise<string> {
    return `
      <div class="dashboard-widget performance-widget">
        <h3>${generateAriaLabel('widgetTitle', { name: 'Performance Monitor' })}</h3>
        <div class="performance-metrics">
          <div class="metric-item">
            <label>FPS</label>
            <div class="metric-bar">
              <div class="metric-fill" style="width: ${(this.performanceMetrics.fps / 60) * 100}%"></div>
            </div>
            <span class="metric-value">${this.performanceMetrics.fps}</span>
          </div>
          <div class="metric-item">
            <label>Memory</label>
            <div class="metric-bar">
              <div class="metric-fill" style="width: ${this.performanceMetrics.memoryUsage}%"></div>
            </div>
            <span class="metric-value">${this.performanceMetrics.memoryUsage}%</span>
          </div>
          <div class="metric-item">
            <label>CPU</label>
            <div class="metric-bar">
              <div class="metric-fill" style="width: ${this.performanceMetrics.cpuUsage}%"></div>
            </div>
            <span class="metric-value">${this.performanceMetrics.cpuUsage}%</span>
          </div>
        </div>
        <canvas id="performance-chart" width="300" height="100"></canvas>
      </div>
    `;
  }

  /**
   * Get notifications content
   */
  private async getNotificationsContent(): Promise<string> {
    let content = `
      <div class="dashboard-widget notifications-widget">
        <h3>${generateAriaLabel('widgetTitle', { name: 'Notifications' })}</h3>
        <div class="notifications-list" role="log" aria-live="polite">
    `;

    if (this.notifications.length === 0) {
      content += '<div class="empty-state">No notifications</div>';
    } else {
      for (const notification of this.notifications) {
        content += `
          <div class="notification notification-${notification.type}" 
               role="status" data-id="${notification.id}">
            <span class="notification-icon">${this.getNotificationIcon(notification.type)}</span>
            <span class="notification-message">${notification.message}</span>
            <button class="notification-dismiss" aria-label="Dismiss notification">×</button>
          </div>
        `;
      }
    }

    content += `
        </div>
      </div>
    `;

    return content;
  }

  /**
   * Get search widget content
   */
  private async getSearchWidgetContent(): Promise<string> {
    return `
      <div class="dashboard-widget search-widget">
        <h3>${generateAriaLabel('widgetTitle', { name: 'Search' })}</h3>
        <div class="search-container">
          <input type="search" 
                 class="search-input" 
                 placeholder="Search files, actions, or recent items..."
                 aria-label="Search workspace"
                 list="search-history">
          <datalist id="search-history">
            ${this.searchHistory.map(q => `<option value="${q}">`).join('')}
          </datalist>
        </div>
        <div class="search-results" role="listbox" aria-label="Search results"></div>
      </div>
    `;
  }

  /**
   * Helper: Get time ago string
   */
  private getTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) {
      return 'just now';
    }
    if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ago`;
    }
    if (seconds < 86400) {
      return `${Math.floor(seconds / 3600)}h ago`;
    }
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  /**
   * Helper: Get activity icon
   */
  private getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      quickAction: '⚡',
      preset: '🎨',
      file: '📄',
      process: '⚙️',
      edit: '✏️',
      view: '👁️',
    };
    return icons[type] || '📌';
  }

  /**
   * Helper: Get notification icon
   */
  private getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };
    return icons[type] || 'ℹ️';
  }

  /**
   * Clean old notifications
   */
  private cleanOldNotifications(): void {
    const maxAge = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();

    this.notifications = this.notifications.filter(n => now - n.timestamp < maxAge);
  }

  /**
   * Open recent item
   */
  private async openRecentItem(itemId: string): Promise<void> {
    const item = this.recentActions.find(a => a.id === itemId);
    if (!item || !item.details) {
      return;
    }

    // Re-execute based on type
    if (item.type === 'quickAction' && item.details.actionId) {
      await this.executeQuickAction(item.details.actionId);
    } else if (item.type === 'file' && item.details.path) {
      const uri = vscode.Uri.file(item.details.path);
      await vscode.window.showTextDocument(uri);
    }
  }

  /**
   * Customize widget
   */
  private async customizeWidget(widgetId: string, config: any): Promise<void> {
    // Update widget configuration
    const widget = this.dashboardLayout.widgets.find(w => w.id === widgetId);
    if (widget) {
      widget.config = { ...widget.config, ...config };

      // Reload widget
      await this.reloadWidget(widgetId);
    }
  }

  /**
   * Toggle widget visibility
   */
  private toggleWidget(widgetId: string): void {
    const widget = this.dashboardLayout.widgets.find(w => w.id === widgetId);
    if (widget) {
      widget.visible = !widget.visible;

      this.webview?.postMessage({
        type: 'toggleWidget',
        widgetId,
        visible: widget.visible,
      });
    }
  }

  /**
   * Reload widget
   */
  private async reloadWidget(_widgetId: string): Promise<void> {
    // Re-load widget content by loading it again
    await this.loadDashboardWidgets();
  }

  /**
   * Export dashboard configuration
   */
  private async exportDashboardConfig(): Promise<void> {
    const config = {
      layout: this.dashboardLayout,
      presets: this.workspacePresets,
      quickActions: this.quickActions,
      timestamp: Date.now(),
    };

    const uri = await vscode.window.showSaveDialog({
      filters: { JSON: ['json'] },
      defaultUri: vscode.Uri.file('dashboard-config.json'),
    });

    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(config, null, 2)));

      this.addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Dashboard configuration exported',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Import dashboard configuration
   */
  private async importDashboardConfig(config: any): Promise<void> {
    try {
      if (config.layout) {
        this.dashboardLayout = config.layout;
      }

      if (config.presets) {
        this.workspacePresets = config.presets;
      }

      if (config.quickActions) {
        this.quickActions = config.quickActions;
      }

      // Reload dashboard
      await this.loadDashboardUI();

      this.addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Dashboard configuration imported',
        timestamp: Date.now(),
      });
    } catch (error) {
      this.addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Failed to import configuration',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Refresh all statistics
   */
  private async refreshAllStats(): Promise<void> {
    await this.updateStats();
    this.updateMetrics();

    // Reload all widgets
    for (const widget of this.dashboardLayout.widgets) {
      if (widget.visible) {
        await this.reloadWidget(widget.id);
      }
    }
  }

  /**
   * Create workspace preset
   */
  private async createWorkspacePreset(name: string, config: any): Promise<void> {
    const preset: WorkspacePreset = {
      id: `custom-${Date.now()}`,
      name,
      icon: '⭐',
      layout: config,
    };

    this.workspacePresets.push(preset);

    // Update UI
    this.webview?.postMessage({
      type: 'presetsUpdated',
      presets: this.workspacePresets,
    });

    this.addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: `Created preset: ${name}`,
      timestamp: Date.now(),
    });
  }

  /**
   * Delete workspace preset
   */
  private deleteWorkspacePreset(presetId: string): void {
    // Don't delete default presets
    if (['default', 'mapEditing', 'monitoring', 'minimal'].includes(presetId)) {
      this.addNotification({
        id: Date.now().toString(),
        type: 'warning',
        message: 'Cannot delete default presets',
        timestamp: Date.now(),
      });
      return;
    }

    this.workspacePresets = this.workspacePresets.filter(p => p.id !== presetId);

    // Update UI
    this.webview?.postMessage({
      type: 'presetsUpdated',
      presets: this.workspacePresets,
    });
  }

  /**
   * Pin quick action
   */
  private pinQuickAction(actionId: string): void {
    const action = this.quickActions.find(a => a.id === actionId);
    if (action) {
      action.pinned = true;

      // Update UI
      this.webview?.postMessage({
        type: 'actionsUpdated',
        actions: this.quickActions,
      });
    }
  }

  /**
   * Unpin quick action
   */
  private unpinQuickAction(actionId: string): void {
    const action = this.quickActions.find(a => a.id === actionId);
    if (action) {
      action.pinned = false;

      // Update UI
      this.webview?.postMessage({
        type: 'actionsUpdated',
        actions: this.quickActions,
      });
    }
  }

  /**
   * Show analytics
   */
  private async showAnalytics(timeRange: string): Promise<void> {
    // Generate analytics based on time range
    const analytics = await this.generateAnalytics(timeRange);

    this.webview?.postMessage({
      type: 'showAnalytics',
      analytics,
    });
  }

  /**
   * Generate analytics
   */
  private async generateAnalytics(timeRange: string): Promise<any> {
    // This would typically query historical data
    // For now, return sample analytics
    return {
      timeRange,
      summary: {
        totalActions: this.recentActions.length,
        mostUsedAction: this.getMostUsedAction(),
        averageSessionTime: '45 minutes',
        productivityScore: 85,
      },
      charts: {
        activityOverTime: this.getActivityOverTime(),
        actionsByCategory: this.getActionsByCategory(),
      },
    };
  }

  /**
   * Get most used action
   */
  private getMostUsedAction(): string {
    const actionCounts = new Map<string, number>();

    for (const action of this.recentActions) {
      if (action.type === 'quickAction' && action.details?.actionId) {
        const count = actionCounts.get(action.details.actionId) || 0;
        actionCounts.set(action.details.actionId, count + 1);
      }
    }

    let maxCount = 0;
    let mostUsedId = '';

    for (const [id, count] of actionCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostUsedId = id;
      }
    }

    const action = this.quickActions.find(a => a.id === mostUsedId);
    return action?.label || 'None';
  }

  /**
   * Get activity over time
   */
  private getActivityOverTime(): any[] {
    // Group actions by hour
    const hourly = new Map<number, number>();

    for (const action of this.recentActions) {
      const hour = new Date(action.timestamp).getHours();
      hourly.set(hour, (hourly.get(hour) || 0) + 1);
    }

    return Array.from(hourly.entries()).map(([hour, count]) => ({
      hour,
      count,
    }));
  }

  /**
   * Get actions by category
   */
  private getActionsByCategory(): any[] {
    const categories = new Map<string, number>();

    for (const action of this.recentActions) {
      if (action.type === 'quickAction' && action.details?.actionId) {
        const quickAction = this.quickActions.find(a => a.id === action.details?.actionId);
        if (quickAction) {
          categories.set(quickAction.category, (categories.get(quickAction.category) || 0) + 1);
        }
      }
    }

    return Array.from(categories.entries()).map(([category, count]) => ({
      category,
      count,
    }));
  }

  /**
   * Dismiss notification
   */
  private dismissNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);

    this.webview?.postMessage({
      type: 'removeNotification',
      notificationId,
    });
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.lazyLoader?.dispose();

    // Clear data
    this.recentActions = [];
    this.notifications = [];
    this.searchResults = [];
  }
}

// Type definitions
interface WorkspaceStats {
  totalMaps: number;
  totalMiners: number;
  totalResources: number;
  activeProcesses: number;
  lastUpdate: number;
}

interface RecentAction {
  id: string;
  type: string;
  label: string;
  timestamp: number;
  details?: any;
}

interface WorkspacePreset {
  id: string;
  name: string;
  icon: string;
  layout: any;
}

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  command: string;
  description: string;
  category: string;
  pinned: boolean;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
}

interface DashboardWidget {
  id: string;
  type: string;
  visible: boolean;
  config?: any;
}

interface DashboardLayout {
  widgets: DashboardWidget[];
  theme: string;
}
