import * as vscode from 'vscode';

export interface CommandDefinition {
  command: string;
  title: string;
  category: string;
  description?: string;
  icon?: string;
  keybinding?: string;
  when?: string;
  tags?: string[];
}

export interface CommandCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  priority: number;
}

export class CommandPaletteProvider {
  private static instance: CommandPaletteProvider;
  private commands: Map<string, CommandDefinition> = new Map();
  private categories: Map<string, CommandCategory> = new Map();
  private recentCommands: string[] = [];
  private favoriteCommands: Set<string> = new Set();
  private context: vscode.ExtensionContext;

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.initializeCategories();
    this.loadRecentCommands();
    this.loadFavoriteCommands();
  }

  public static getInstance(context: vscode.ExtensionContext): CommandPaletteProvider {
    if (!CommandPaletteProvider.instance) {
      CommandPaletteProvider.instance = new CommandPaletteProvider(context);
    }
    return CommandPaletteProvider.instance;
  }

  private initializeCategories() {
    const categories: CommandCategory[] = [
      {
        id: 'file-management',
        title: '📁 File & Project Management',
        description: 'Create, open, and manage Manic Miners map files',
        icon: '$(files)',
        priority: 1,
      },
      {
        id: 'editing',
        title: '✏️ Map Editing & Templates',
        description: 'Edit maps, manage templates, and insert patterns',
        icon: '$(edit)',
        priority: 2,
      },
      {
        id: 'validation',
        title: '✅ Validation & Quality',
        description: 'Validate maps and fix common issues',
        icon: '$(check)',
        priority: 3,
      },
      {
        id: 'objectives',
        title: '🎯 Objectives & Scripts',
        description: 'Manage objectives and script patterns',
        icon: '$(target)',
        priority: 4,
      },
      {
        id: 'history',
        title: '📜 History & Version Control',
        description: 'Undo/redo changes and manage versions',
        icon: '$(history)',
        priority: 5,
      },
      {
        id: 'visualization',
        title: '📊 Visualization & Analysis',
        description: 'View maps in different ways',
        icon: '$(graph)',
        priority: 6,
      },
      {
        id: 'accessibility',
        title: '♿ Accessibility',
        description: 'Accessibility features and settings',
        icon: '$(accessibility)',
        priority: 7,
      },
      {
        id: 'generation',
        title: '✨ Generation & AI',
        description: 'Generate levels and get smart suggestions',
        icon: '$(sparkle)',
        priority: 8,
      },
      {
        id: 'help',
        title: '❓ Help & Documentation',
        description: 'Get help and learn about features',
        icon: '$(question)',
        priority: 9,
      },
    ];

    categories.forEach(cat => this.categories.set(cat.id, cat));
  }

  public registerCommand(definition: CommandDefinition) {
    this.commands.set(definition.command, definition);
  }

  public async showCommandPalette() {
    const quickPick = vscode.window.createQuickPick();
    quickPick.placeholder = 'Search for Manic Miners commands...';
    quickPick.matchOnDescription = true;
    quickPick.matchOnDetail = true;

    const items = await this.getQuickPickItems();
    quickPick.items = items;

    // Handle selection
    quickPick.onDidChangeSelection(selection => {
      if (selection[0]) {
        const item = selection[0] as CommandQuickPickItem;
        if (item.command) {
          this.executeCommand(item.command);
          quickPick.hide();
        } else if (item.categoryId) {
          // Show commands for this category
          this.showCategoryCommands(item.categoryId);
          quickPick.hide();
        }
      }
    });

    // Add custom buttons
    quickPick.buttons = [
      {
        iconPath: new vscode.ThemeIcon('star'),
        tooltip: 'Show Favorites',
      },
      {
        iconPath: new vscode.ThemeIcon('history'),
        tooltip: 'Show Recent',
      },
    ];

    quickPick.onDidTriggerButton(button => {
      if (button.tooltip === 'Show Favorites') {
        quickPick.items = this.getFavoriteItems();
      } else if (button.tooltip === 'Show Recent') {
        quickPick.items = this.getRecentItems();
      }
    });

    quickPick.show();
  }

  private async getQuickPickItems(): Promise<vscode.QuickPickItem[]> {
    const items: CommandQuickPickItem[] = [];

    // Add recent commands section if any
    if (this.recentCommands.length > 0) {
      items.push({
        label: '$(history) Recent Commands',
        kind: vscode.QuickPickItemKind.Separator,
      });

      const recentItems = this.getRecentItems().slice(0, 3);
      items.push(...recentItems);

      items.push({
        label: '',
        kind: vscode.QuickPickItemKind.Separator,
      });
    }

    // Add categories
    items.push({
      label: '$(folder) Command Categories',
      kind: vscode.QuickPickItemKind.Separator,
    });

    const sortedCategories = Array.from(this.categories.values()).sort(
      (a, b) => a.priority - b.priority
    );

    for (const category of sortedCategories) {
      const commandCount = this.getCommandsForCategory(category.id).length;
      items.push({
        label: category.title,
        description: `${commandCount} commands`,
        detail: category.description,
        categoryId: category.id,
        iconPath: new vscode.ThemeIcon(category.icon.replace(/\$\((.*)\)/, '$1')),
      });
    }

    // Add all commands section
    items.push({
      label: '',
      kind: vscode.QuickPickItemKind.Separator,
    });

    items.push({
      label: '$(list-unordered) All Commands',
      kind: vscode.QuickPickItemKind.Separator,
    });

    // Add all registered commands
    const allCommands = Array.from(this.commands.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    );

    for (const cmd of allCommands) {
      items.push(this.createCommandItem(cmd));
    }

    return items;
  }

  private createCommandItem(cmd: CommandDefinition): CommandQuickPickItem {
    const isFavorite = this.favoriteCommands.has(cmd.command);
    const keybinding = cmd.keybinding ? ` (${cmd.keybinding})` : '';

    return {
      label: `${isFavorite ? '$(star-full) ' : ''}${cmd.title}${keybinding}`,
      description: cmd.category,
      detail: cmd.description,
      command: cmd.command,
      iconPath: cmd.icon ? new vscode.ThemeIcon(cmd.icon.replace(/\$\((.*)\)/, '$1')) : undefined,
    };
  }

  private getRecentItems(): CommandQuickPickItem[] {
    return this.recentCommands
      .map(cmdId => this.commands.get(cmdId))
      .filter(cmd => cmd !== undefined)
      .map(cmd => this.createCommandItem(cmd!));
  }

  private getFavoriteItems(): CommandQuickPickItem[] {
    return Array.from(this.favoriteCommands)
      .map(cmdId => this.commands.get(cmdId))
      .filter(cmd => cmd !== undefined)
      .map(cmd => this.createCommandItem(cmd!));
  }

  private getCommandsForCategory(categoryId: string): CommandDefinition[] {
    return Array.from(this.commands.values()).filter(cmd => cmd.category === categoryId);
  }

  private async showCategoryCommands(categoryId: string) {
    const category = this.categories.get(categoryId);
    if (!category) {
      return;
    }

    const commands = this.getCommandsForCategory(categoryId);
    const quickPick = vscode.window.createQuickPick();
    quickPick.placeholder = `Commands in ${category.title}`;
    quickPick.items = commands.map(cmd => this.createCommandItem(cmd));

    quickPick.onDidChangeSelection(selection => {
      if (selection[0]) {
        const item = selection[0] as CommandQuickPickItem;
        if (item.command) {
          this.executeCommand(item.command);
          quickPick.hide();
        }
      }
    });

    quickPick.show();
  }

  private async executeCommand(command: string) {
    try {
      await vscode.commands.executeCommand(command);
      this.addToRecent(command);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to execute command: ${command}`);
    }
  }

  private addToRecent(command: string) {
    // Remove if already in recent
    const index = this.recentCommands.indexOf(command);
    if (index > -1) {
      this.recentCommands.splice(index, 1);
    }

    // Add to beginning
    this.recentCommands.unshift(command);

    // Keep only last 10
    if (this.recentCommands.length > 10) {
      this.recentCommands = this.recentCommands.slice(0, 10);
    }

    this.saveRecentCommands();
  }

  public toggleFavorite(command: string) {
    if (this.favoriteCommands.has(command)) {
      this.favoriteCommands.delete(command);
    } else {
      this.favoriteCommands.add(command);
    }
    this.saveFavoriteCommands();
  }

  private loadRecentCommands() {
    const saved = this.context.globalState.get<string[]>('recentCommands');
    if (saved) {
      this.recentCommands = saved;
    }
  }

  private saveRecentCommands() {
    this.context.globalState.update('recentCommands', this.recentCommands);
  }

  private loadFavoriteCommands() {
    const saved = this.context.globalState.get<string[]>('favoriteCommands');
    if (saved) {
      this.favoriteCommands = new Set(saved);
    }
  }

  private saveFavoriteCommands() {
    this.context.globalState.update('favoriteCommands', Array.from(this.favoriteCommands));
  }

  public initializeDefaultCommands() {
    // File Management
    this.registerCommand({
      command: 'manicMiners.newFile',
      title: 'Create New Map',
      category: 'file-management',
      description: 'Create a new Manic Miners map file',
      icon: '$(new-file)',
      tags: ['new', 'create', 'file', 'map'],
    });

    this.registerCommand({
      command: 'manicMiners.showDashboard',
      title: 'Show Dashboard',
      category: 'file-management',
      description: 'Open the Manic Miners dashboard',
      icon: '$(dashboard)',
      tags: ['dashboard', 'overview', 'home'],
    });

    this.registerCommand({
      command: 'manicMiners.openMapEditor',
      title: 'Open Map Editor',
      category: 'file-management',
      description: 'Open the visual map editor',
      icon: '$(edit)',
      tags: ['editor', 'visual', 'open'],
    });

    // Editing
    this.registerCommand({
      command: 'manicMiners.insertTemplate',
      title: 'Insert Map Template',
      category: 'editing',
      description: 'Insert a pre-built map template',
      icon: '$(file-code)',
      tags: ['template', 'insert', 'preset'],
    });

    this.registerCommand({
      command: 'manicMiners.fillAreaEnhanced',
      title: 'Fill Area',
      category: 'editing',
      description: 'Fill an area with a specific tile (with undo support)',
      icon: '$(color-mode)',
      keybinding: 'Ctrl+Shift+F',
      tags: ['fill', 'area', 'paint'],
    });

    this.registerCommand({
      command: 'manicMiners.replaceAllEnhanced',
      title: 'Replace All Tiles',
      category: 'editing',
      description: 'Replace all occurrences of a tile type',
      icon: '$(replace-all)',
      keybinding: 'Ctrl+Shift+H',
      tags: ['replace', 'find', 'substitute'],
    });

    // Validation
    this.registerCommand({
      command: 'manicMiners.runValidation',
      title: 'Run Map Validation',
      category: 'validation',
      description: 'Check map for errors and issues',
      icon: '$(check)',
      tags: ['validate', 'check', 'verify', 'test'],
    });

    this.registerCommand({
      command: 'manicMiners.fixCommonIssues',
      title: 'Fix Common Issues',
      category: 'validation',
      description: 'Automatically fix common map problems',
      icon: '$(wrench)',
      tags: ['fix', 'repair', 'auto'],
    });

    // Objectives
    this.registerCommand({
      command: 'manicMiners.openObjectiveBuilder',
      title: 'Open Objective Builder',
      category: 'objectives',
      description: 'Visual tool for creating map objectives',
      icon: '$(target)',
      tags: ['objective', 'goal', 'builder'],
    });

    this.registerCommand({
      command: 'manicMiners.insertScriptPattern',
      title: 'Insert Script Pattern',
      category: 'objectives',
      description: 'Insert common script patterns',
      icon: '$(code)',
      tags: ['script', 'pattern', 'snippet'],
    });

    // History
    this.registerCommand({
      command: 'manicMiners.undo',
      title: 'Undo',
      category: 'history',
      description: 'Undo the last map edit',
      icon: '$(discard)',
      keybinding: 'Ctrl+Z',
      tags: ['undo', 'revert', 'back'],
    });

    this.registerCommand({
      command: 'manicMiners.redo',
      title: 'Redo',
      category: 'history',
      description: 'Redo the last undone edit',
      icon: '$(redo)',
      keybinding: 'Ctrl+Y',
      tags: ['redo', 'forward'],
    });

    this.registerCommand({
      command: 'manicMiners.showUndoRedoHistory',
      title: 'Show Edit History',
      category: 'history',
      description: 'View and navigate edit history',
      icon: '$(history)',
      tags: ['history', 'edits', 'timeline'],
    });

    // Visualization
    this.registerCommand({
      command: 'manicMiners.showMapPreview',
      title: 'Show Map Preview',
      category: 'visualization',
      description: 'Preview the current map visually',
      icon: '$(eye)',
      tags: ['preview', 'view', 'visual'],
    });

    this.registerCommand({
      command: 'manicMiners.showHeatMap',
      title: 'Show Heat Map Analysis',
      category: 'visualization',
      description: 'Analyze map accessibility and pathfinding',
      icon: '$(graph-line)',
      tags: ['heatmap', 'analysis', 'pathfinding'],
    });

    this.registerCommand({
      command: 'manicMiners.show3DTerrain',
      title: 'Show 3D Terrain',
      category: 'visualization',
      description: 'View map in 3D perspective',
      icon: '$(map-filled)',
      tags: ['3d', 'terrain', 'perspective'],
    });

    // Generation
    this.registerCommand({
      command: 'manicMiners.generateLevel',
      title: 'Generate New Level',
      category: 'generation',
      description: 'AI-powered level generation',
      icon: '$(sparkle)',
      tags: ['generate', 'ai', 'create', 'auto'],
    });

    this.registerCommand({
      command: 'manicMiners.showSmartSuggestions',
      title: 'Show Smart Suggestions',
      category: 'generation',
      description: 'Get AI-powered tile suggestions',
      icon: '$(lightbulb)',
      tags: ['suggest', 'smart', 'ai', 'help'],
    });

    // Accessibility
    this.registerCommand({
      command: 'manicMiners.showAccessibilityOptions',
      title: 'Accessibility Options',
      category: 'accessibility',
      description: 'Configure accessibility features',
      icon: '$(accessibility)',
      tags: ['accessibility', 'a11y', 'options'],
    });

    this.registerCommand({
      command: 'manicMiners.toggleHighContrast',
      title: 'Toggle High Contrast',
      category: 'accessibility',
      description: 'Enable/disable high contrast mode',
      icon: '$(eye)',
      tags: ['contrast', 'visibility', 'toggle'],
    });

    // Help
    this.registerCommand({
      command: 'manicMiners.showWelcome',
      title: 'Show Welcome Page',
      category: 'help',
      description: 'Open the welcome page with tutorials',
      icon: '$(home)',
      tags: ['welcome', 'start', 'help', 'tutorial'],
    });

    this.registerCommand({
      command: 'manicMiners.showCommands',
      title: 'Show All Commands',
      category: 'help',
      description: 'Browse all available commands',
      icon: '$(list-unordered)',
      tags: ['commands', 'all', 'list', 'help'],
    });
  }
}

interface CommandQuickPickItem extends vscode.QuickPickItem {
  command?: string;
  categoryId?: string;
}
