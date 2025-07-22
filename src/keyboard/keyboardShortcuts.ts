import * as vscode from 'vscode';

export interface KeyboardShortcut {
  command: string;
  key: string;
  mac?: string;
  when?: string;
  category: string;
  description: string;
}

export class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private customShortcuts: Map<string, string> = new Map();
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadCustomShortcuts();
  }

  /**
   * Initialize all default keyboard shortcuts
   */
  public initializeDefaultShortcuts() {
    const defaultShortcuts: KeyboardShortcut[] = [
      // Navigation & Preview
      {
        command: 'manicMiners.showMapPreview',
        key: 'ctrl+shift+v',
        mac: 'cmd+shift+v',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Navigation',
        description: 'Show Map Preview',
      },
      {
        command: 'manicMiners.openMapEditor',
        key: 'ctrl+k v',
        mac: 'cmd+k v',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Navigation',
        description: 'Open Map Editor (side by side)',
      },
      {
        command: 'manicMiners.switchToTextEditor',
        key: 'f2',
        when: 'manicMiners.mapEditorFocus',
        category: 'Navigation',
        description: 'Switch to Text Editor',
      },
      {
        command: 'manicMiners.showDashboard',
        key: 'ctrl+k ctrl+d',
        mac: 'cmd+k cmd+d',
        category: 'Navigation',
        description: 'Show Dashboard',
      },

      // File Management
      {
        command: 'manicMiners.newFile',
        key: 'ctrl+shift+n',
        mac: 'cmd+shift+n',
        when: 'manicMiners.extensionActive',
        category: 'File Management',
        description: 'Create New Map',
      },
      {
        command: 'manicMiners.insertTemplate',
        key: 'ctrl+shift+t',
        mac: 'cmd+shift+t',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'File Management',
        description: 'Insert Map Template',
      },
      {
        command: 'manicMiners.openInTabbedEditor',
        key: 'ctrl+k ctrl+e',
        mac: 'cmd+k cmd+e',
        when: 'resourceExtname == .dat',
        category: 'File Management',
        description: 'Open in Tabbed Editor',
      },

      // Editing
      {
        command: 'manicMiners.fillAreaEnhanced',
        key: 'ctrl+shift+f',
        mac: 'cmd+shift+f',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Editing',
        description: 'Fill Area with Tile',
      },
      {
        command: 'manicMiners.replaceAllEnhanced',
        key: 'ctrl+shift+h',
        mac: 'cmd+shift+h',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Editing',
        description: 'Replace All Tiles',
      },
      {
        command: 'manicMiners.insertScriptPattern',
        key: 'ctrl+shift+i',
        mac: 'cmd+shift+i',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Editing',
        description: 'Insert Script Pattern',
      },

      // Objectives & Scripts
      {
        command: 'manicMiners.openObjectiveBuilder',
        key: 'ctrl+shift+o',
        mac: 'cmd+shift+o',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Objectives',
        description: 'Open Objective Builder',
      },
      {
        command: 'manicMiners.showScriptPatternDocs',
        key: 'ctrl+k ctrl+s',
        mac: 'cmd+k cmd+s',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Objectives',
        description: 'Show Script Pattern Reference',
      },

      // Validation & Analysis
      {
        command: 'manicMiners.runValidation',
        key: 'ctrl+shift+r',
        mac: 'cmd+shift+r',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Validation',
        description: 'Run Map Validation',
      },
      {
        command: 'manicMiners.fixCommonIssues',
        key: 'ctrl+shift+f1',
        mac: 'cmd+shift+f1',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Validation',
        description: 'Fix Common Issues',
      },
      {
        command: 'manicMiners.showValidationReport',
        key: 'ctrl+alt+r',
        mac: 'cmd+alt+r',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Validation',
        description: 'Show Validation Report',
      },

      // Visualization
      {
        command: 'manicMiners.showHeatMap',
        key: 'ctrl+alt+g',
        mac: 'cmd+alt+g',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Visualization',
        description: 'Show Heat Map Analysis',
      },
      {
        command: 'manicMiners.show3DTerrain',
        key: 'ctrl+alt+3',
        mac: 'cmd+alt+3',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Visualization',
        description: 'Show 3D Terrain View',
      },
      {
        command: 'manicMiners.analyzeTilePatterns',
        key: 'ctrl+alt+t',
        mac: 'cmd+alt+t',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Visualization',
        description: 'Analyze Tile Patterns',
      },

      // AI & Generation
      {
        command: 'manicMiners.showSmartSuggestions',
        key: 'ctrl+alt+s',
        mac: 'cmd+alt+s',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'AI Features',
        description: 'Show Smart Suggestions',
      },
      {
        command: 'manicMiners.generateLevel',
        key: 'ctrl+g',
        mac: 'cmd+g',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'AI Features',
        description: 'Generate New Level',
      },

      // Version Control
      {
        command: 'manicMiners.createVersion',
        key: 'ctrl+alt+v',
        mac: 'cmd+alt+v',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Version Control',
        description: 'Create Map Version',
      },
      {
        command: 'manicMiners.compareVersions',
        key: 'ctrl+alt+d',
        mac: 'cmd+alt+d',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Version Control',
        description: 'Compare Map Versions',
      },
      {
        command: 'manicMiners.showVersionHistory',
        key: 'ctrl+alt+shift+h',
        mac: 'cmd+alt+shift+h',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Version Control',
        description: 'Show Version History',
      },

      // Quick Actions
      {
        command: 'manicMiners.showQuickActions',
        key: 'ctrl+.',
        mac: 'cmd+.',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Quick Actions',
        description: 'Show Quick Actions',
      },
      {
        command: 'manicMiners.manageTemplates',
        key: 'ctrl+k ctrl+m',
        mac: 'cmd+k cmd+m',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Quick Actions',
        description: 'Manage Templates',
      },

      // Help & Tips
      {
        command: 'manicMiners.showCommandTips',
        key: 'f1',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Help',
        description: 'Show Command Tips',
      },
      {
        command: 'manicMiners.showWelcome',
        key: 'ctrl+k ctrl+w',
        mac: 'cmd+k cmd+w',
        category: 'Help',
        description: 'Show Welcome Page',
      },
    ];

    // Register all shortcuts
    defaultShortcuts.forEach(shortcut => {
      this.shortcuts.set(shortcut.command, shortcut);
    });
  }

  /**
   * Get all shortcuts organized by category
   */
  public getShortcutsByCategory(): Map<string, KeyboardShortcut[]> {
    const categorized = new Map<string, KeyboardShortcut[]>();

    this.shortcuts.forEach(shortcut => {
      const category = shortcut.category;
      if (!categorized.has(category)) {
        categorized.set(category, []);
      }
      categorized.get(category)!.push(shortcut);
    });

    return categorized;
  }

  /**
   * Get a specific shortcut
   */
  public getShortcut(command: string): KeyboardShortcut | undefined {
    return this.shortcuts.get(command);
  }

  /**
   * Update a keyboard shortcut
   */
  public async updateShortcut(command: string, newKey: string): Promise<void> {
    this.customShortcuts.set(command, newKey);
    await this.saveCustomShortcuts();

    // Show info message
    vscode.window
      .showInformationMessage(
        `Keyboard shortcut updated. Restart VS Code to apply changes.`,
        'Restart'
      )
      .then(selection => {
        if (selection === 'Restart') {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      });
  }

  /**
   * Reset a shortcut to default
   */
  public async resetShortcut(command: string): Promise<void> {
    this.customShortcuts.delete(command);
    await this.saveCustomShortcuts();
  }

  /**
   * Reset all shortcuts to defaults
   */
  public async resetAllShortcuts(): Promise<void> {
    this.customShortcuts.clear();
    await this.saveCustomShortcuts();
  }

  /**
   * Check if a key combination is already in use
   */
  public isKeyInUse(key: string): boolean {
    const normalizedKey = this.normalizeKey(key);

    for (const shortcut of this.shortcuts.values()) {
      if (this.normalizeKey(shortcut.key) === normalizedKey) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get command using a key combination
   */
  public getCommandByKey(key: string): string | undefined {
    const normalizedKey = this.normalizeKey(key);

    for (const [command, shortcut] of this.shortcuts) {
      const shortcutKey = this.customShortcuts.get(command) || shortcut.key;
      if (this.normalizeKey(shortcutKey) === normalizedKey) {
        return command;
      }
    }

    return undefined;
  }

  /**
   * Export shortcuts to a JSON file
   */
  public async exportShortcuts(): Promise<void> {
    const shortcuts: Record<string, string> = {};

    this.shortcuts.forEach((shortcut, command) => {
      const key = this.customShortcuts.get(command) || shortcut.key;
      shortcuts[command] = key;
    });

    const content = JSON.stringify(shortcuts, null, 2);
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file('manic-miners-shortcuts.json'),
      filters: {
        'JSON Files': ['json'],
      },
    });

    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
      vscode.window.showInformationMessage('Keyboard shortcuts exported successfully.');
    }
  }

  /**
   * Import shortcuts from a JSON file
   */
  public async importShortcuts(): Promise<void> {
    const uri = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        'JSON Files': ['json'],
      },
    });

    if (uri && uri[0]) {
      try {
        const content = await vscode.workspace.fs.readFile(uri[0]);
        const shortcuts = JSON.parse(content.toString());

        for (const [command, key] of Object.entries(shortcuts)) {
          if (typeof key === 'string' && this.shortcuts.has(command)) {
            this.customShortcuts.set(command, key);
          }
        }

        await this.saveCustomShortcuts();
        vscode.window.showInformationMessage(
          'Keyboard shortcuts imported successfully. Restart VS Code to apply changes.'
        );
      } catch (error) {
        vscode.window.showErrorMessage('Failed to import keyboard shortcuts.');
      }
    }
  }

  private normalizeKey(key: string): string {
    return key.toLowerCase().replace(/\s+/g, '');
  }

  private loadCustomShortcuts() {
    const saved = this.context.globalState.get<Record<string, string>>('customKeyboardShortcuts');
    if (saved) {
      this.customShortcuts = new Map(Object.entries(saved));
    }
  }

  private async saveCustomShortcuts() {
    const toSave = Object.fromEntries(this.customShortcuts);
    await this.context.globalState.update('customKeyboardShortcuts', toSave);
  }
}

interface PackageJsonKeybinding {
  command: string;
  key: string;
  mac?: string;
  when?: string;
}

/**
 * Generate keybindings for package.json
 */
export function generateKeybindingsForPackageJson(
  shortcuts: KeyboardShortcut[]
): PackageJsonKeybinding[] {
  return shortcuts.map(shortcut => {
    const binding: PackageJsonKeybinding = {
      command: shortcut.command,
      key: shortcut.key,
    };

    if (shortcut.mac) {
      binding.mac = shortcut.mac;
    }

    if (shortcut.when) {
      binding.when = shortcut.when;
    }

    return binding;
  });
}
