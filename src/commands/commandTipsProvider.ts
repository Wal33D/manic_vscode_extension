import * as vscode from 'vscode';

export interface CommandTip {
  id: string;
  title: string;
  description: string;
  commands: string[];
  icon: string;
  when?: string;
  priority: number;
}

export class CommandTipsProvider {
  private tips: Map<string, CommandTip> = new Map();
  private shownTips: Set<string> = new Set();
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.initializeTips();
    this.loadShownTips();
  }

  private initializeTips() {
    const tips: CommandTip[] = [
      {
        id: 'getting-started',
        title: '🎯 Getting Started with Manic Miners',
        description: 'New to the extension? Try these essential commands:',
        commands: ['manicMiners.showWelcome', 'manicMiners.newFile', 'manicMiners.showDashboard'],
        icon: '$(rocket)',
        priority: 1,
      },
      {
        id: 'efficient-editing',
        title: '⚡ Edit Maps Faster',
        description: 'Speed up your workflow with these editing commands:',
        commands: [
          'manicMiners.fillAreaEnhanced',
          'manicMiners.replaceAllEnhanced',
          'manicMiners.insertTemplate',
        ],
        icon: '$(zap)',
        priority: 2,
      },
      {
        id: 'validation-workflow',
        title: '✅ Keep Your Maps Valid',
        description: 'Ensure map quality with validation tools:',
        commands: [
          'manicMiners.runValidation',
          'manicMiners.fixCommonIssues',
          'manicMiners.showValidationReport',
        ],
        icon: '$(shield)',
        priority: 3,
      },
      {
        id: 'visualization-tools',
        title: '👁️ See Your Maps Differently',
        description: 'Visualize and analyze your maps:',
        commands: [
          'manicMiners.showHeatMap',
          'manicMiners.show3DTerrain',
          'manicMiners.showMapPreview',
        ],
        icon: '$(eye)',
        priority: 4,
      },
      {
        id: 'undo-redo-power',
        title: '↩️ Never Lose Your Work',
        description: 'Master the undo/redo system:',
        commands: ['manicMiners.undo', 'manicMiners.redo', 'manicMiners.showUndoRedoHistory'],
        icon: '$(history)',
        priority: 5,
      },
      {
        id: 'smart-features',
        title: '🤖 AI-Powered Features',
        description: 'Let AI help you create better maps:',
        commands: [
          'manicMiners.generateLevel',
          'manicMiners.showSmartSuggestions',
          'manicMiners.analyzeTilePatterns',
        ],
        icon: '$(sparkle)',
        priority: 6,
      },
    ];

    tips.forEach(tip => this.tips.set(tip.id, tip));
  }

  /**
   * Get a contextual tip based on current activity
   */
  public async getContextualTip(): Promise<CommandTip | undefined> {
    const editor = vscode.window.activeTextEditor;

    // If no editor is open, suggest getting started
    if (!editor) {
      return this.tips.get('getting-started');
    }

    // If editing a .dat file
    if (editor.document.languageId === 'manicminers') {
      const content = editor.document.getText();

      // If file is empty or very small, suggest templates
      if (content.length < 100) {
        return {
          id: 'empty-file',
          title: '📝 Start with a Template',
          description: 'Begin your map with a pre-built template:',
          commands: ['manicMiners.insertTemplate', 'manicMiners.newFile'],
          icon: '$(file-code)',
          priority: 1,
        };
      }

      // If file has no objectives section, suggest objective builder
      if (!content.includes('objectives{')) {
        return {
          id: 'no-objectives',
          title: '🎯 Add Objectives',
          description: 'Make your map playable with objectives:',
          commands: ['manicMiners.openObjectiveBuilder', 'manicMiners.insertScriptPattern'],
          icon: '$(target)',
          priority: 2,
        };
      }

      // If file has been edited recently, suggest validation
      const lastEdit = Date.now() - editor.document.uri.fsPath.length; // Simplified check
      if (lastEdit < 300000) {
        // 5 minutes
        return this.tips.get('validation-workflow');
      }
    }

    // Return a random unshown tip
    return this.getNextUnshownTip();
  }

  /**
   * Get the next tip that hasn't been shown yet
   */
  private getNextUnshownTip(): CommandTip | undefined {
    const unshownTips = Array.from(this.tips.values())
      .filter(tip => !this.shownTips.has(tip.id))
      .sort((a, b) => a.priority - b.priority);

    if (unshownTips.length === 0) {
      // All tips shown, reset
      this.shownTips.clear();
      this.saveShownTips();
      return this.tips.get('getting-started');
    }

    return unshownTips[0];
  }

  /**
   * Show a tip as a notification
   */
  public async showTip(tip: CommandTip) {
    const actions = tip.commands.map(cmd => ({
      title: this.getCommandTitle(cmd),
      command: cmd,
    }));

    const message = `${tip.title}\n${tip.description}`;

    const selection = await vscode.window.showInformationMessage(
      message,
      ...actions.map(a => a.title),
      'Dismiss'
    );

    if (selection && selection !== 'Dismiss') {
      const action = actions.find(a => a.title === selection);
      if (action) {
        vscode.commands.executeCommand(action.command);
      }
    }

    // Mark tip as shown
    this.shownTips.add(tip.id);
    this.saveShownTips();
  }

  /**
   * Show tip in status bar
   */
  public showTipInStatusBar(tip: CommandTip): vscode.StatusBarItem {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, -100);

    statusBarItem.text = `$(lightbulb) ${tip.title}`;
    statusBarItem.tooltip = tip.description;
    statusBarItem.command = {
      title: 'Show Tip Commands',
      command: 'manicMiners.showTipCommands',
      arguments: [tip],
    };

    statusBarItem.show();

    // Auto-hide after 30 seconds
    setTimeout(() => {
      statusBarItem.dispose();
    }, 30000);

    return statusBarItem;
  }

  /**
   * Get daily tip
   */
  public getDailyTip(): CommandTip {
    const today = new Date().toDateString();
    const lastDailyTip = this.context.globalState.get<string>('lastDailyTipDate');

    if (lastDailyTip !== today) {
      this.context.globalState.update('lastDailyTipDate', today);
      const tip = this.getNextUnshownTip() || this.tips.get('getting-started')!;
      return tip;
    }

    // Return the same tip for today
    const dailyTipId = this.context.globalState.get<string>('dailyTipId') || 'getting-started';
    return this.tips.get(dailyTipId) || this.tips.get('getting-started')!;
  }

  private getCommandTitle(commandId: string): string {
    // In a real implementation, this would look up the actual command title
    const titles: Record<string, string> = {
      'manicMiners.showWelcome': 'Welcome Page',
      'manicMiners.newFile': 'New Map',
      'manicMiners.showDashboard': 'Dashboard',
      'manicMiners.fillAreaEnhanced': 'Fill Area',
      'manicMiners.replaceAllEnhanced': 'Replace All',
      'manicMiners.insertTemplate': 'Insert Template',
      'manicMiners.runValidation': 'Validate',
      'manicMiners.fixCommonIssues': 'Auto Fix',
      'manicMiners.showValidationReport': 'Report',
      'manicMiners.showHeatMap': 'Heat Map',
      'manicMiners.show3DTerrain': '3D View',
      'manicMiners.showMapPreview': 'Preview',
      'manicMiners.undo': 'Undo',
      'manicMiners.redo': 'Redo',
      'manicMiners.showUndoRedoHistory': 'History',
      'manicMiners.generateLevel': 'Generate',
      'manicMiners.showSmartSuggestions': 'Suggest',
      'manicMiners.analyzeTilePatterns': 'Analyze',
      'manicMiners.openObjectiveBuilder': 'Objectives',
      'manicMiners.insertScriptPattern': 'Script Pattern',
    };

    return titles[commandId] || commandId;
  }

  private loadShownTips() {
    const shown = this.context.globalState.get<string[]>('shownCommandTips');
    if (shown) {
      this.shownTips = new Set(shown);
    }
  }

  private saveShownTips() {
    this.context.globalState.update('shownCommandTips', Array.from(this.shownTips));
  }
}
