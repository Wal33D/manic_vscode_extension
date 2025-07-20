import * as vscode from 'vscode';

export interface ObjectiveDefinition {
  type:
    | 'resources'
    | 'building'
    | 'discovertile'
    | 'variable'
    | 'findminer'
    | 'findbuilding'
    | 'custom';
  description: string;
  parameters: Array<{
    name: string;
    type: 'number' | 'string' | 'enum' | 'coordinates';
    description: string;
    default?: string | number;
    enum?: string[];
  }>;
  template: string;
}

export class ObjectiveBuilderProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'manicMiners.objectiveBuilder';

  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;

  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async data => {
      switch (data.type) {
        case 'insertObjective':
          await this.insertObjective(data.objective);
          break;
        case 'requestObjectiveTypes':
          this.sendObjectiveTypes();
          break;
        case 'validateObjective':
          this.validateObjective(data.objective);
          break;
      }
    });

    // Update when editor changes
    vscode.window.onDidChangeActiveTextEditor(() => {
      if (this._view) {
        this.updateEditorState();
      }
    });

    this.updateEditorState();
  }

  private getObjectiveDefinitions(): ObjectiveDefinition[] {
    return [
      {
        type: 'resources',
        description: 'Collect a specific amount of resources',
        parameters: [
          {
            name: 'crystals',
            type: 'number',
            description: 'Number of energy crystals to collect',
            default: 10,
          },
          {
            name: 'ore',
            type: 'number',
            description: 'Number of ore to collect',
            default: 0,
          },
          {
            name: 'studs',
            type: 'number',
            description: 'Number of building studs to collect',
            default: 0,
          },
        ],
        template: 'resources: {crystals},{ore},{studs}',
      },
      {
        type: 'building',
        description: 'Construct a specific building',
        parameters: [
          {
            name: 'building',
            type: 'enum',
            description: 'Building type to construct',
            enum: [
              'BuildingToolStore_C',
              'BuildingPowerStation_C',
              'BuildingTeleportPad_C',
              'BuildingDocks_C',
              'BuildingCanteen_C',
              'BuildingSupportStation_C',
              'BuildingOreRefinery_C',
              'BuildingGeologicalCenter_C',
              'BuildingUpgradeStation_C',
              'BuildingMiningLaser_C',
              'BuildingSuperTeleport_C',
            ],
            default: 'BuildingPowerStation_C',
          },
        ],
        template: 'building:{building}',
      },
      {
        type: 'discovertile',
        description: 'Discover a specific location on the map',
        parameters: [
          {
            name: 'x',
            type: 'number',
            description: 'X coordinate (column)',
            default: 10,
          },
          {
            name: 'y',
            type: 'number',
            description: 'Y coordinate (row)',
            default: 10,
          },
          {
            name: 'description',
            type: 'string',
            description: 'Description shown to player',
            default: 'Discover the hidden cavern',
          },
        ],
        template: 'discovertile:{x},{y}/{description}',
      },
      {
        type: 'variable',
        description: 'Complete when a script variable condition is met',
        parameters: [
          {
            name: 'condition',
            type: 'string',
            description: 'Script variable condition',
            default: 'monsters_defeated>=5',
          },
          {
            name: 'description',
            type: 'string',
            description: 'Description shown to player',
            default: 'Defeat all monsters',
          },
        ],
        template: 'variable:{condition}/{description}',
      },
      {
        type: 'findminer',
        description: 'Find and rescue a lost Rock Raider',
        parameters: [
          {
            name: 'minerID',
            type: 'string',
            description: 'ID of the miner to find',
            default: 'lost_miner_1',
          },
        ],
        template: 'findminer:{minerID}',
      },
      {
        type: 'findbuilding',
        description: 'Find a hidden building at specific coordinates',
        parameters: [
          {
            name: 'x',
            type: 'number',
            description: 'X coordinate (column)',
            default: 15,
          },
          {
            name: 'y',
            type: 'number',
            description: 'Y coordinate (row)',
            default: 15,
          },
        ],
        template: 'findbuilding:{x},{y}',
      },
      {
        type: 'custom',
        description: 'Create a custom objective',
        parameters: [
          {
            name: 'objective',
            type: 'string',
            description: 'Custom objective text',
            default: '',
          },
        ],
        template: '{objective}',
      },
    ];
  }

  private sendObjectiveTypes() {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'objectiveTypes',
        definitions: this.getObjectiveDefinitions(),
      });
    }
  }

  private updateEditorState() {
    const editor = vscode.window.activeTextEditor;
    const isDatFile = editor?.document.languageId === 'manicminers';

    if (this._view) {
      this._view.webview.postMessage({
        type: 'editorState',
        isDatFile,
        hasObjectivesSection: isDatFile ? this.hasObjectivesSection(editor!.document) : false,
      });
    }
  }

  private hasObjectivesSection(document: vscode.TextDocument): boolean {
    const text = document.getText();
    return text.includes('objectives{');
  }

  private async insertObjective(objective: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'manicminers') {
      vscode.window.showErrorMessage('Please open a Manic Miners DAT file');
      return;
    }

    const document = editor.document;
    const text = document.getText();
    const lines = text.split('\n');

    // Find objectives section
    let objectivesStart = -1;
    let objectivesEnd = -1;
    let braceDepth = 0;
    let inObjectives = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim() === 'objectives{') {
        objectivesStart = i;
        inObjectives = true;
        braceDepth = 1;
      } else if (inObjectives) {
        for (const char of line) {
          if (char === '{') {
            braceDepth++;
          } else if (char === '}') {
            braceDepth--;
            if (braceDepth === 0) {
              objectivesEnd = i;
              inObjectives = false;
              break;
            }
          }
        }
      }
    }

    const edit = new vscode.WorkspaceEdit();

    if (objectivesStart === -1) {
      // No objectives section, create one
      const insertPosition = this.findBestInsertPosition(lines);
      const newSection = `objectives{\n${objective}\n}\n`;

      edit.insert(document.uri, new vscode.Position(insertPosition, 0), newSection);
    } else {
      // Add to existing objectives section
      const insertLine = objectivesEnd;
      const indent = this.getIndentFromLine(lines[objectivesStart + 1] || '');

      edit.insert(document.uri, new vscode.Position(insertLine, 0), `${indent}${objective}\n`);
    }

    await vscode.workspace.applyEdit(edit);

    // Show success message
    vscode.window.showInformationMessage(`Added objective: ${objective}`);
  }

  private findBestInsertPosition(lines: string[]): number {
    // Try to insert after info section or tiles section
    const sections = ['info', 'tiles', 'resources'];

    for (const section of sections) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === `${section}{`) {
          // Find the end of this section
          let braceDepth = 1;
          for (let j = i + 1; j < lines.length; j++) {
            for (const char of lines[j]) {
              if (char === '{') {
                braceDepth++;
              } else if (char === '}') {
                braceDepth--;
                if (braceDepth === 0) {
                  return j + 1;
                }
              }
            }
          }
        }
      }
    }

    // Default to end of file
    return lines.length;
  }

  private getIndentFromLine(line: string): string {
    const match = line.match(/^(\s*)/);
    return match ? match[1] : '';
  }

  private validateObjective(objective: string) {
    // Simple validation
    const isValid = objective.trim().length > 0;
    const warnings: string[] = [];

    if (objective.includes('resources:')) {
      const match = objective.match(/resources:\s*(\d+),(\d+),(\d+)/);
      if (!match) {
        warnings.push('Resources format should be: resources: crystals,ore,studs');
      }
    }

    if (this._view) {
      this._view.webview.postMessage({
        type: 'validationResult',
        isValid,
        warnings,
      });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'objectiveBuilder.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'objectiveBuilder.css')
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri}" rel="stylesheet">
        <title>Objective Builder</title>
      </head>
      <body>
        <div class="objective-builder">
          <h3>Objective Builder</h3>
          
          <div class="form-group">
            <label for="objective-type">Objective Type:</label>
            <select id="objective-type" class="form-control">
              <option value="">Select type...</option>
            </select>
          </div>
          
          <div id="parameters" class="parameters-section"></div>
          
          <div class="preview-section">
            <label>Preview:</label>
            <div id="preview" class="preview"></div>
          </div>
          
          <div class="actions">
            <button id="insert-btn" class="btn btn-primary" disabled>Insert Objective</button>
            <button id="validate-btn" class="btn btn-secondary">Validate</button>
          </div>
          
          <div id="messages" class="messages"></div>
          
          <div class="help-section">
            <h4>Common Objectives</h4>
            <div class="examples">
              <div class="example" data-objective="resources: 20,0,0">Collect 20 crystals</div>
              <div class="example" data-objective="resources: 10,10,0">Collect 10 crystals and 10 ore</div>
              <div class="example" data-objective="building:BuildingPowerStation_C">Build a Power Station</div>
              <div class="example" data-objective="discovertile:25,30/Find the hidden cache">Discover location</div>
            </div>
          </div>
        </div>
        
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
