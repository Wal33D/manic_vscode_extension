import * as vscode from 'vscode';
import * as path from 'path';
import { PanelState } from '../workspace/panelManager';
import { LayoutManager } from '../workspace/layoutManager';

interface WorkspacePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  layout: {
    panels: string[];
    positions: Record<string, string>;
    sizes?: Record<string, number>;
  };
}

interface ProjectOverview {
  totalMaps: number;
  mapsByCategory: Map<string, number>;
  recentActivity: ActivityItem[];
  projectHealth: {
    validMaps: number;
    warningMaps: number;
    errorMaps: number;
  };
}

interface ActivityItem {
  timestamp: number;
  type: 'created' | 'edited' | 'validated' | 'exported' | 'analyzed';
  mapName: string;
  mapPath: string;
  details?: string;
}

interface CommandCenterState {
  currentProject: string;
  activePreset: string;
  projectOverview: ProjectOverview;
  recentCommands: CommandItem[];
  contextualSuggestions: Suggestion[];
  workflowProgress: WorkflowProgress;
  pinnedTools: string[];
}

interface CommandItem {
  id: string;
  label: string;
  icon: string;
  category: string;
  lastUsed?: number;
  usageCount: number;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  command: string;
  priority: number;
  context: string[];
}

interface WorkflowProgress {
  currentWorkflow?: string;
  steps: WorkflowStep[];
  currentStep: number;
}

interface WorkflowStep {
  id: string;
  title: string;
  completed: boolean;
  optional?: boolean;
}

export class EnhancedDashboardProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'manicMiners.enhancedDashboard';

  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;
  private layoutManager: LayoutManager;
  private state: CommandCenterState;

  private readonly workspacePresets: WorkspacePreset[] = [
    {
      id: 'mapping',
      name: 'Mapping Mode',
      description: 'Optimized for map creation and editing',
      icon: '🗺️',
      layout: {
        panels: ['mapEditor', 'tools', 'layers', 'tilePalette', 'properties'],
        positions: {
          mapEditor: 'center',
          tools: 'left',
          layers: 'right',
          tilePalette: 'left',
          properties: 'right',
        },
      },
    },
    {
      id: 'scripting',
      name: 'Scripting Mode',
      description: 'Focus on script development',
      icon: '📝',
      layout: {
        panels: ['editor', 'scriptPatterns', 'validation', 'console'],
        positions: {
          editor: 'center',
          scriptPatterns: 'right',
          validation: 'bottom',
          console: 'bottom',
        },
      },
    },
    {
      id: 'analysis',
      name: 'Analysis Mode',
      description: 'Map analysis and optimization',
      icon: '📊',
      layout: {
        panels: ['mapPreview', 'heatMap', 'statistics', 'terrain3D'],
        positions: {
          mapPreview: 'center',
          heatMap: 'right',
          statistics: 'bottom',
          terrain3D: 'right',
        },
      },
    },
    {
      id: 'testing',
      name: 'Testing Mode',
      description: 'Validate and test maps',
      icon: '🧪',
      layout: {
        panels: ['mapPreview', 'validation', 'objectives', 'console'],
        positions: {
          mapPreview: 'center',
          validation: 'right',
          objectives: 'left',
          console: 'bottom',
        },
      },
    },
  ];

  constructor(private readonly context: vscode.ExtensionContext) {
    this._extensionUri = context.extensionUri;
    this.layoutManager = new LayoutManager(context);

    this.state = this.loadState();

    // Watch for active editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && editor.document.languageId === 'manicminers') {
        this.updateContextualSuggestions(editor.document);
        this.updateProjectOverview();
      }
    });

    // Track command usage
    this.setupCommandTracking();
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'media'),
        vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace'),
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'applyPreset':
          await this.applyWorkspacePreset(message.presetId);
          break;
        case 'executeCommand':
          await this.executeCommand(message.commandId, message.args);
          break;
        case 'createCustomPreset':
          await this.createCustomPreset();
          break;
        case 'openMap':
          await this.openMap(message.path);
          break;
        case 'pinTool':
          this.togglePinnedTool(message.toolId);
          break;
        case 'startWorkflow':
          await this.startWorkflow(message.workflowId);
          break;
        case 'refreshOverview':
          this.updateProjectOverview();
          break;
      }
    });

    // Update when view becomes visible
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.updateView();
      }
    });

    // Initial update
    this.updateView();
  }

  private async applyWorkspacePreset(presetId: string) {
    const preset = this.workspacePresets.find(p => p.id === presetId);
    if (!preset) {
      return;
    }

    // Save current preset
    this.state.activePreset = presetId;
    this.saveState();

    // Apply layout
    await this.layoutManager.applyLayout({
      panels: preset.layout.panels.map(id => ({
        id,
        title: id.charAt(0).toUpperCase() + id.slice(1),
        icon: '📋',
        position: preset.layout.positions[id] as PanelState['position'],
        visible: true,
        size: { width: 300, height: 400 },
      })),
    });

    // Show notification
    vscode.window.showInformationMessage(`Switched to ${preset.name}`);

    // Update view
    this.updateView();
  }

  private async executeCommand(commandId: string, args?: any) {
    try {
      // Track command usage
      this.trackCommandUsage(commandId);

      // Execute command
      await vscode.commands.executeCommand(commandId, args);

      // Update recent commands
      this.updateRecentCommands(commandId);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to execute command: ${commandId}`);
    }
  }

  private async createCustomPreset() {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter preset name',
      placeHolder: 'My Custom Layout',
    });

    if (!name) {
      return;
    }

    const description = await vscode.window.showInputBox({
      prompt: 'Enter preset description',
      placeHolder: 'Description of your custom layout',
    });

    // Get current layout
    const currentLayout = this.layoutManager.getCurrentLayout();

    // Create custom preset
    const customPreset: WorkspacePreset = {
      id: `custom-${Date.now()}`,
      name,
      description: description || '',
      icon: '⭐',
      layout: {
        panels: currentLayout.panels.map((p: PanelState) => p.id),
        positions: Object.fromEntries(
          currentLayout.panels.map((p: PanelState) => [p.id, p.position])
        ),
      },
    };

    // Save custom preset
    const customPresets = this.context.globalState.get<WorkspacePreset[]>('customPresets', []);
    customPresets.push(customPreset);
    await this.context.globalState.update('customPresets', customPresets);

    vscode.window.showInformationMessage(`Created preset: ${name}`);
    this.updateView();
  }

  private async openMap(mapPath: string) {
    const uri = vscode.Uri.file(mapPath);
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);

    // Add to recent activity
    this.addActivity('edited', path.basename(mapPath), mapPath);
  }

  private togglePinnedTool(toolId: string) {
    const index = this.state.pinnedTools.indexOf(toolId);
    if (index === -1) {
      this.state.pinnedTools.push(toolId);
    } else {
      this.state.pinnedTools.splice(index, 1);
    }

    this.saveState();
    this.updateView();
  }

  private async startWorkflow(workflowId: string) {
    // Define workflows
    const workflows: Record<string, WorkflowStep[]> = {
      'new-map': [
        { id: 'create', title: 'Create new map', completed: false },
        { id: 'configure', title: 'Configure map settings', completed: false },
        { id: 'design', title: 'Design map layout', completed: false },
        { id: 'script', title: 'Add scripts', completed: false, optional: true },
        { id: 'validate', title: 'Validate map', completed: false },
        { id: 'save', title: 'Save map', completed: false },
      ],
      'optimize-map': [
        { id: 'analyze', title: 'Analyze current map', completed: false },
        { id: 'identify', title: 'Identify issues', completed: false },
        { id: 'optimize', title: 'Apply optimizations', completed: false },
        { id: 'test', title: 'Test changes', completed: false },
        { id: 'finalize', title: 'Finalize optimizations', completed: false },
      ],
    };

    const steps = workflows[workflowId];
    if (!steps) {
      return;
    }

    this.state.workflowProgress = {
      currentWorkflow: workflowId,
      steps,
      currentStep: 0,
    };

    this.saveState();
    this.updateView();

    // Start first step
    await this.executeWorkflowStep(0);
  }

  private async executeWorkflowStep(stepIndex: number) {
    const workflow = this.state.workflowProgress;
    if (!workflow || stepIndex >= workflow.steps.length) {
      return;
    }

    const step = workflow.steps[stepIndex];

    // Execute step-specific commands
    switch (step.id) {
      case 'create':
        await vscode.commands.executeCommand('manicMiners.newFile');
        break;
      case 'analyze':
        await vscode.commands.executeCommand('manicMiners.showHeatMap');
        break;
      case 'validate':
        await vscode.commands.executeCommand('manicMiners.runValidation');
        break;
      // Add more step handlers
    }

    // Mark step as completed
    step.completed = true;
    workflow.currentStep = stepIndex + 1;

    this.saveState();
    this.updateView();
  }

  private updateProjectOverview() {
    // Get all .dat files in workspace
    vscode.workspace.findFiles('**/*.dat').then(files => {
      const overview: ProjectOverview = {
        totalMaps: files.length,
        mapsByCategory: new Map(),
        recentActivity: this.state.projectOverview?.recentActivity || [],
        projectHealth: {
          validMaps: 0,
          warningMaps: 0,
          errorMaps: 0,
        },
      };

      // Analyze each map
      files.forEach(file => {
        // Get diagnostics for file
        const diagnostics = vscode.languages.getDiagnostics(file);

        if (diagnostics.length === 0) {
          overview.projectHealth.validMaps++;
        } else {
          const hasErrors = diagnostics.some(d => d.severity === vscode.DiagnosticSeverity.Error);
          if (hasErrors) {
            overview.projectHealth.errorMaps++;
          } else {
            overview.projectHealth.warningMaps++;
          }
        }

        // Categorize by folder
        const category = path.dirname(file.fsPath).split(path.sep).pop() || 'root';
        overview.mapsByCategory.set(category, (overview.mapsByCategory.get(category) || 0) + 1);
      });

      this.state.projectOverview = overview;
      this.saveState();
      this.updateView();
    });
  }

  private updateContextualSuggestions(document: vscode.TextDocument) {
    const suggestions: Suggestion[] = [];
    const text = document.getText();

    // Analyze document content
    const hasScripts = text.includes('script{');
    const hasObjectives = text.includes('objectives{');

    // Generate suggestions based on content
    if (!hasObjectives) {
      suggestions.push({
        id: 'add-objectives',
        title: 'Add Objectives',
        description: 'This map has no objectives defined',
        command: 'manicMiners.openObjectiveBuilder',
        priority: 1,
        context: ['no-objectives'],
      });
    }

    if (!hasScripts) {
      suggestions.push({
        id: 'add-scripts',
        title: 'Add Scripts',
        description: 'Enhance your map with scripting',
        command: 'manicMiners.insertScriptPattern',
        priority: 2,
        context: ['no-scripts'],
      });
    }

    // Check for validation issues
    const diagnostics = vscode.languages.getDiagnostics(document.uri);
    if (diagnostics.length > 0) {
      suggestions.push({
        id: 'fix-issues',
        title: 'Fix Validation Issues',
        description: `${diagnostics.length} issues found`,
        command: 'manicMiners.runValidation',
        priority: 0,
        context: ['has-issues'],
      });
    }

    // Sort by priority
    suggestions.sort((a, b) => a.priority - b.priority);

    this.state.contextualSuggestions = suggestions;
    this.saveState();
    this.updateView();
  }

  private setupCommandTracking() {
    // Track all manicMiners commands
    const commands = [
      'manicMiners.newFile',
      'manicMiners.openMapEditor',
      'manicMiners.runValidation',
      'manicMiners.showHeatMap',
      'manicMiners.openObjectiveBuilder',
      'manicMiners.insertScriptPattern',
      'manicMiners.showQuickActions',
      'manicMiners.generateCaveSystem',
      'manicMiners.export',
    ];

    commands.forEach(cmd => {
      const disposable = vscode.commands.registerCommand(`${cmd}.tracked`, async (...args) => {
        this.trackCommandUsage(cmd);
        return vscode.commands.executeCommand(cmd, ...args);
      });
      this.context.subscriptions.push(disposable);
    });
  }

  private trackCommandUsage(commandId: string) {
    const commands = this.context.globalState.get<Record<string, CommandItem>>('commandUsage', {});

    if (!commands[commandId]) {
      commands[commandId] = {
        id: commandId,
        label: this.getCommandLabel(commandId),
        icon: this.getCommandIcon(commandId),
        category: this.getCommandCategory(commandId),
        usageCount: 0,
      };
    }

    commands[commandId].usageCount++;
    commands[commandId].lastUsed = Date.now();

    this.context.globalState.update('commandUsage', commands);
  }

  private updateRecentCommands(commandId: string) {
    const command: CommandItem = {
      id: commandId,
      label: this.getCommandLabel(commandId),
      icon: this.getCommandIcon(commandId),
      category: this.getCommandCategory(commandId),
      lastUsed: Date.now(),
      usageCount: 1,
    };

    // Remove if already exists
    this.state.recentCommands = this.state.recentCommands.filter(c => c.id !== commandId);

    // Add to front
    this.state.recentCommands.unshift(command);

    // Keep only last 10
    this.state.recentCommands = this.state.recentCommands.slice(0, 10);

    this.saveState();
    this.updateView();
  }

  private getCommandLabel(commandId: string): string {
    const labels: Record<string, string> = {
      'manicMiners.newFile': 'New Map',
      'manicMiners.openMapEditor': 'Open Map Editor',
      'manicMiners.runValidation': 'Validate Map',
      'manicMiners.showHeatMap': 'Show Heat Map',
      'manicMiners.openObjectiveBuilder': 'Objective Builder',
      'manicMiners.insertScriptPattern': 'Insert Script',
      'manicMiners.showQuickActions': 'Quick Actions',
      'manicMiners.generateCaveSystem': 'Generate Cave',
      'manicMiners.export': 'Export Map',
    };
    return labels[commandId] || commandId;
  }

  private getCommandIcon(commandId: string): string {
    const icons: Record<string, string> = {
      'manicMiners.newFile': '📄',
      'manicMiners.openMapEditor': '✏️',
      'manicMiners.runValidation': '✅',
      'manicMiners.showHeatMap': '🔥',
      'manicMiners.openObjectiveBuilder': '🎯',
      'manicMiners.insertScriptPattern': '📝',
      'manicMiners.showQuickActions': '⚡',
      'manicMiners.generateCaveSystem': '⛏️',
      'manicMiners.export': '📤',
    };
    return icons[commandId] || '🔧';
  }

  private getCommandCategory(commandId: string): string {
    if (commandId.includes('new') || commandId.includes('create')) {
      return 'create';
    }
    if (commandId.includes('edit') || commandId.includes('insert')) {
      return 'edit';
    }
    if (commandId.includes('validate') || commandId.includes('test')) {
      return 'validate';
    }
    if (commandId.includes('show') || commandId.includes('view')) {
      return 'view';
    }
    return 'tools';
  }

  private addActivity(
    type: ActivityItem['type'],
    mapName: string,
    mapPath: string,
    details?: string
  ) {
    const activity: ActivityItem = {
      timestamp: Date.now(),
      type,
      mapName,
      mapPath,
      details,
    };

    if (!this.state.projectOverview) {
      this.state.projectOverview = {
        totalMaps: 0,
        mapsByCategory: new Map(),
        recentActivity: [],
        projectHealth: {
          validMaps: 0,
          warningMaps: 0,
          errorMaps: 0,
        },
      };
    }

    this.state.projectOverview.recentActivity.unshift(activity);
    this.state.projectOverview.recentActivity = this.state.projectOverview.recentActivity.slice(
      0,
      20
    );

    this.saveState();
    this.updateView();
  }

  private updateView() {
    if (this._view) {
      // Get custom presets
      const customPresets = this.context.globalState.get<WorkspacePreset[]>('customPresets', []);
      const allPresets = [...this.workspacePresets, ...customPresets];

      this._view.webview.postMessage({
        type: 'updateDashboard',
        state: this.state,
        presets: allPresets,
        currentWorkspace: vscode.workspace.name || 'Untitled Workspace',
      });
    }
  }

  private loadState(): CommandCenterState {
    const saved = this.context.globalState.get<Partial<CommandCenterState>>(
      'commandCenterState',
      {}
    );

    return {
      currentProject: vscode.workspace.name || 'Untitled',
      activePreset: saved.activePreset || 'mapping',
      projectOverview: saved.projectOverview || {
        totalMaps: 0,
        mapsByCategory: new Map(),
        recentActivity: [],
        projectHealth: {
          validMaps: 0,
          warningMaps: 0,
          errorMaps: 0,
        },
      },
      recentCommands: saved.recentCommands || [],
      contextualSuggestions: saved.contextualSuggestions || [],
      workflowProgress: saved.workflowProgress || {
        currentStep: 0,
        steps: [],
      },
      pinnedTools: saved.pinnedTools || [
        'manicMiners.newFile',
        'manicMiners.openMapEditor',
        'manicMiners.runValidation',
      ],
    };
  }

  private saveState() {
    this.context.globalState.update('commandCenterState', this.state);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'enhancedDashboard.css')
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'enhancedDashboard.js')
    );
    const workspaceStyleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'workspace', 'workspace.css')
    );

    const nonce = this.getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:;">
      <link href="${workspaceStyleUri}" rel="stylesheet">
      <link href="${styleUri}" rel="stylesheet">
      <title>Command Center</title>
    </head>
    <body>
      <div id="command-center">
        <!-- Header -->
        <div class="command-header">
          <h1>🎮 Command Center</h1>
          <div class="header-actions">
            <button class="icon-button" data-action="refresh" title="Refresh">
              <span class="codicon codicon-refresh"></span>
            </button>
            <button class="icon-button" data-action="settings" title="Settings">
              <span class="codicon codicon-settings-gear"></span>
            </button>
          </div>
        </div>

        <!-- Workspace Presets -->
        <section class="workspace-presets">
          <h2>Workspace Presets</h2>
          <div class="preset-grid" id="presetGrid">
            <!-- Presets will be populated by JavaScript -->
          </div>
          <button class="create-preset-btn" data-action="createPreset">
            <span class="codicon codicon-add"></span>
            Create Custom Preset
          </button>
        </section>

        <!-- Project Overview -->
        <section class="project-overview">
          <h2>Project Overview</h2>
          <div class="overview-stats" id="overviewStats">
            <div class="stat-card">
              <div class="stat-value" id="totalMaps">0</div>
              <div class="stat-label">Total Maps</div>
            </div>
            <div class="stat-card health-valid">
              <div class="stat-value" id="validMaps">0</div>
              <div class="stat-label">Valid</div>
            </div>
            <div class="stat-card health-warning">
              <div class="stat-value" id="warningMaps">0</div>
              <div class="stat-label">Warnings</div>
            </div>
            <div class="stat-card health-error">
              <div class="stat-value" id="errorMaps">0</div>
              <div class="stat-label">Errors</div>
            </div>
          </div>
          <div class="map-categories" id="mapCategories">
            <!-- Categories will be populated by JavaScript -->
          </div>
        </section>

        <!-- Quick Access Tools -->
        <section class="quick-tools">
          <h2>Quick Access</h2>
          <div class="pinned-tools" id="pinnedTools">
            <!-- Pinned tools will be populated by JavaScript -->
          </div>
          <div class="recent-commands" id="recentCommands">
            <h3>Recent Commands</h3>
            <!-- Recent commands will be populated by JavaScript -->
          </div>
        </section>

        <!-- Contextual Suggestions -->
        <section class="suggestions" id="suggestionsSection">
          <h2>Suggestions</h2>
          <div class="suggestion-list" id="suggestionList">
            <!-- Suggestions will be populated by JavaScript -->
          </div>
        </section>

        <!-- Workflow Progress -->
        <section class="workflow-progress" id="workflowSection" style="display: none;">
          <h2>Workflow Progress</h2>
          <div class="workflow-content" id="workflowContent">
            <!-- Workflow steps will be populated by JavaScript -->
          </div>
        </section>

        <!-- Recent Activity -->
        <section class="recent-activity">
          <h2>Recent Activity</h2>
          <div class="activity-timeline" id="activityTimeline">
            <!-- Activity items will be populated by JavaScript -->
          </div>
        </section>

        <!-- Quick Workflows -->
        <section class="quick-workflows">
          <h2>Quick Start Workflows</h2>
          <div class="workflow-grid">
            <button class="workflow-card" data-workflow="new-map">
              <span class="workflow-icon">🗺️</span>
              <span class="workflow-title">Create New Map</span>
              <span class="workflow-desc">Step-by-step map creation</span>
            </button>
            <button class="workflow-card" data-workflow="optimize-map">
              <span class="workflow-icon">⚡</span>
              <span class="workflow-title">Optimize Map</span>
              <span class="workflow-desc">Analyze and improve performance</span>
            </button>
            <button class="workflow-card" data-workflow="test-map">
              <span class="workflow-icon">🧪</span>
              <span class="workflow-title">Test Map</span>
              <span class="workflow-desc">Validate and test thoroughly</span>
            </button>
            <button class="workflow-card" data-workflow="publish-map">
              <span class="workflow-icon">🚀</span>
              <span class="workflow-title">Publish Map</span>
              <span class="workflow-desc">Prepare for distribution</span>
            </button>
          </div>
        </section>
      </div>

      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  private getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new EnhancedDashboardProvider(context);

    const disposable = vscode.window.registerWebviewViewProvider(
      EnhancedDashboardProvider.viewType,
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    );

    return disposable;
  }
}
