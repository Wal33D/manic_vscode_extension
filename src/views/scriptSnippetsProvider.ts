import * as vscode from 'vscode';

interface ScriptPattern {
  name: string;
  description: string;
  snippet: string;
  category: string;
}

type ScriptItem = ScriptCategory | ScriptSnippet;

export class ScriptSnippetsProvider implements vscode.TreeDataProvider<ScriptItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ScriptItem | undefined | null | void> =
    new vscode.EventEmitter<ScriptItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ScriptItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private patterns: Map<string, ScriptPattern[]> = new Map([
    [
      'triggers',
      [
        {
          name: 'Timer Trigger',
          description: 'Execute actions after a delay',
          snippet: "timer::;\nwait:30;\nmsg:Time's up!;",
          category: 'triggers',
        },
        {
          name: 'Crystal Collected',
          description: 'Trigger when crystals are collected',
          snippet: 'oncrystal::;\n(crystals>=5)msg:Great job! Keep collecting!;',
          category: 'triggers',
        },
        {
          name: 'Building Complete',
          description: 'Trigger when a building is constructed',
          snippet: 'onbuild::;\n(building==PowerStation)msg:Power Station online!;',
          category: 'triggers',
        },
      ],
    ],
    [
      'monsters',
      [
        {
          name: 'Rock Monster Spawn',
          description: 'Spawn a rock monster at location',
          snippet: 'emerge:rockmonster/10,10/heading:180;',
          category: 'monsters',
        },
        {
          name: 'Ice Monster Wave',
          description: 'Spawn multiple ice monsters',
          snippet:
            'emerge:icemonster/5,5/heading:90;\nwait:5;\nemerge:icemonster/15,5/heading:270;',
          category: 'monsters',
        },
        {
          name: 'Lava Monster Boss',
          description: 'Spawn a lava monster boss',
          snippet: 'emerge:lavamonster/20,20/heading:0/aggression:high;',
          category: 'monsters',
        },
      ],
    ],
    [
      'objectives',
      [
        {
          name: 'Timed Objective',
          description: 'Complete objective within time limit',
          snippet:
            'int timeLimit = 300;\ntimer::;\nwait:timeLimit;\n(crystals<10)lose:Time ran out!;',
          category: 'objectives',
        },
        {
          name: 'Progressive Goals',
          description: 'Multi-stage objectives',
          snippet:
            'int stage = 1;\noncrystal::;\n(crystals>=5 && stage==1)msg:Stage 1 complete!;stage=2;\n(crystals>=10 && stage==2)win:You did it!;',
          category: 'objectives',
        },
      ],
    ],
    [
      'environment',
      [
        {
          name: 'Erosion Event',
          description: 'Trigger erosion at specific time',
          snippet: 'erosion::;\nwait:120;\nerosion:10,10/radius:3;',
          category: 'environment',
        },
        {
          name: 'Landslide Sequence',
          description: 'Create a landslide event',
          snippet: 'landslide::;\nwait:60;\nlandslide:15,15/15,20;',
          category: 'environment',
        },
        {
          name: 'Oxygen Depletion',
          description: 'Gradually reduce oxygen',
          snippet: 'oxygen::;\nloop:10;\nwait:30;\noxygen:-5;\nendloop;',
          category: 'environment',
        },
      ],
    ],
  ]);

  constructor(private context: vscode.ExtensionContext) {
    // Load custom snippets
    this.loadCustomSnippets();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ScriptItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ScriptItem): Thenable<ScriptItem[]> {
    if (!element) {
      // Root categories
      const categories = Array.from(this.patterns.keys()).map(
        category =>
          new ScriptCategory(
            this.getCategoryLabel(category),
            category,
            this.patterns.get(category)?.length || 0
          )
      );

      // Add custom category if there are custom snippets
      const customSnippets = this.context.globalState.get<ScriptPattern[]>(
        'customScriptSnippets',
        []
      );
      if (customSnippets.length > 0) {
        categories.push(new ScriptCategory('Custom Snippets', 'custom', customSnippets.length));
      }

      return Promise.resolve(categories);
    } else if (element instanceof ScriptCategory) {
      // Snippets within a category
      let snippets: ScriptPattern[] = [];

      if (element.category === 'custom') {
        snippets = this.context.globalState.get<ScriptPattern[]>('customScriptSnippets', []);
      } else {
        snippets = this.patterns.get(element.category) || [];
      }

      return Promise.resolve(snippets.map(snippet => new ScriptSnippet(snippet)));
    }

    return Promise.resolve([]);
  }

  private getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      triggers: '⚡ Event Triggers',
      monsters: '👾 Monster Scripts',
      objectives: '🎯 Objective Logic',
      environment: '🌍 Environment Effects',
    };
    return labels[category] || category;
  }

  private loadCustomSnippets(): void {
    // Custom snippets are loaded from global state
    // They can be added via a command
  }

  async addCustomSnippet(snippet: ScriptPattern): Promise<void> {
    const customSnippets = this.context.globalState.get<ScriptPattern[]>(
      'customScriptSnippets',
      []
    );
    customSnippets.push({ ...snippet, category: 'custom' });
    await this.context.globalState.update('customScriptSnippets', customSnippets);
    this.refresh();
  }
}

class ScriptCategory extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly category: string,
    public readonly count: number
  ) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = 'scriptCategory';
    this.description = `${count} snippets`;

    // Set icon based on category
    const icons: { [key: string]: string } = {
      triggers: 'zap',
      monsters: 'bug',
      objectives: 'target',
      environment: 'globe',
      custom: 'star',
    };
    this.iconPath = new vscode.ThemeIcon(icons[category] || 'code');
  }
}

class ScriptSnippet extends vscode.TreeItem {
  constructor(public readonly pattern: ScriptPattern) {
    super(pattern.name, vscode.TreeItemCollapsibleState.None);

    this.contextValue = 'scriptSnippet';
    this.tooltip = new vscode.MarkdownString(
      `**${pattern.name}**\n\n${pattern.description}\n\n\`\`\`\n${pattern.snippet}\n\`\`\``
    );
    this.description = pattern.description;
    this.iconPath = new vscode.ThemeIcon('code');

    this.command = {
      command: 'manicMiners.insertScriptSnippet',
      title: 'Insert Snippet',
      arguments: [pattern],
    };
  }
}
