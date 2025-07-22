import * as vscode from 'vscode';

export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: string;
  enabled: boolean;
  action: () => void | Promise<void>;
}

export class MapEditorContextMenu {
  private static instance: MapEditorContextMenu;

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): MapEditorContextMenu {
    if (!MapEditorContextMenu.instance) {
      MapEditorContextMenu.instance = new MapEditorContextMenu();
    }
    return MapEditorContextMenu.instance;
  }

  /**
   * Get context menu actions for a specific position in the document
   */
  public async getContextMenuActions(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<ContextMenuAction[]> {
    const actions: ContextMenuAction[] = [];
    const section = this.getCurrentSection(document, position);

    // Common actions
    actions.push({
      id: 'copy',
      label: 'Copy',
      icon: '$(copy)',
      enabled: true,
      action: async () => {
        await vscode.commands.executeCommand('editor.action.clipboardCopyAction');
      },
    });

    actions.push({
      id: 'paste',
      label: 'Paste',
      icon: '$(paste)',
      enabled: true,
      action: async () => {
        await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
      },
    });

    actions.push({
      id: 'separator1',
      label: '---',
      enabled: false,
      action: () => {},
    });

    // Section-specific actions
    if (section === 'tiles' || section === 'height') {
      actions.push(...this.getTileActions(document, position, section));
    } else if (section === 'resources') {
      actions.push(...this.getResourceActions(document, position));
    } else if (section === 'buildings') {
      actions.push(...this.getBuildingActions(document, position));
    } else if (section === 'objectives') {
      actions.push(...this.getObjectiveActions(document, position));
    } else if (section === 'script') {
      actions.push(...this.getScriptActions(document, position));
    }

    // Global actions
    actions.push({
      id: 'separator2',
      label: '---',
      enabled: false,
      action: () => {},
    });

    actions.push({
      id: 'validate',
      label: 'Validate Map',
      icon: '$(check)',
      enabled: true,
      action: async () => {
        await vscode.commands.executeCommand('manicMiners.runValidation');
      },
    });

    actions.push({
      id: 'preview',
      label: 'Show Map Preview',
      icon: '$(map)',
      enabled: true,
      action: async () => {
        await vscode.commands.executeCommand('manicMiners.showMapPreview');
      },
    });

    return actions;
  }

  /**
   * Show context menu at cursor position
   */
  public async showContextMenu(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<void> {
    const actions = await this.getContextMenuActions(document, position);
    const menuItems = actions
      .filter(a => a.id !== 'separator1' && a.id !== 'separator2')
      .filter(a => a.enabled)
      .map(a => ({
        label: a.icon ? `${a.icon} ${a.label}` : a.label,
        action: a.action,
      }));

    const selected = await vscode.window.showQuickPick(menuItems, {
      placeHolder: 'Select an action',
    });

    if (selected) {
      await selected.action();
    }
  }

  private getCurrentSection(document: vscode.TextDocument, position: vscode.Position): string {
    const text = document.getText();
    const lines = text.split('\n');
    let currentSection = '';

    for (let i = 0; i <= position.line; i++) {
      const line = lines[i].trim();
      if (line.endsWith('{')) {
        currentSection = line.slice(0, -1);
      }
    }

    return currentSection;
  }

  private getTileActions(
    document: vscode.TextDocument,
    position: vscode.Position,
    section: string
  ): ContextMenuAction[] {
    const actions: ContextMenuAction[] = [];

    // Get tile value at position
    const line = document.lineAt(position).text;
    const values = line.trim().split(/\s+/);
    const charIndex = position.character;
    let currentValue = '';

    // Find which value the cursor is on
    let currentPos = 0;
    for (const value of values) {
      if (charIndex >= currentPos && charIndex <= currentPos + value.length) {
        currentValue = value;
        break;
      }
      currentPos += value.length + 1; // +1 for space
    }

    if (currentValue && !isNaN(Number(currentValue))) {
      actions.push({
        id: 'fillArea',
        label: `Fill Area with ${section === 'tiles' ? 'Tile' : 'Height'} ${currentValue}`,
        icon: '$(symbol-color)',
        enabled: true,
        action: async () => {
          await vscode.commands.executeCommand('manicMiners.fillAreaEnhanced');
        },
      });

      actions.push({
        id: 'replaceAll',
        label: `Replace All ${currentValue} Values`,
        icon: '$(replace-all)',
        enabled: true,
        action: async () => {
          await vscode.commands.executeCommand('manicMiners.replaceAllEnhanced');
        },
      });
    }

    actions.push({
      id: 'insertPattern',
      label: 'Insert Tile Pattern',
      icon: '$(symbol-namespace)',
      enabled: section === 'tiles',
      action: async () => {
        await vscode.commands.executeCommand('manicMiners.insertTemplate');
      },
    });

    actions.push({
      id: 'analyzeTiles',
      label: 'Analyze Tile Usage',
      icon: '$(graph)',
      enabled: true,
      action: async () => {
        await vscode.commands.executeCommand('manicMiners.analyzeTilePatterns');
      },
    });

    return actions;
  }

  private getResourceActions(
    _document: vscode.TextDocument,
    position: vscode.Position
  ): ContextMenuAction[] {
    const actions: ContextMenuAction[] = [];

    actions.push({
      id: 'addResource',
      label: 'Add Resource',
      icon: '$(add)',
      enabled: true,
      action: async () => {
        const resourceTypes = ['crystals', 'ore', 'studs'];
        const type = await vscode.window.showQuickPick(resourceTypes, {
          placeHolder: 'Select resource type',
        });

        if (type) {
          const x = await vscode.window.showInputBox({
            prompt: 'X coordinate',
            validateInput: v => (isNaN(Number(v)) ? 'Must be a number' : null),
          });
          const y = await vscode.window.showInputBox({
            prompt: 'Y coordinate',
            validateInput: v => (isNaN(Number(v)) ? 'Must be a number' : null),
          });
          const amount = await vscode.window.showInputBox({
            prompt: 'Amount',
            validateInput: v => (isNaN(Number(v)) ? 'Must be a number' : null),
          });

          if (x && y && amount) {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
              await editor.edit(editBuilder => {
                editBuilder.insert(position, `\n${type}: ${x},${y},${amount}`);
              });
            }
          }
        }
      },
    });

    actions.push({
      id: 'validateResources',
      label: 'Validate Resource Placement',
      icon: '$(check)',
      enabled: true,
      action: async () => {
        await vscode.commands.executeCommand('manicMiners.runValidation');
      },
    });

    return actions;
  }

  private getBuildingActions(
    _document: vscode.TextDocument,
    position: vscode.Position
  ): ContextMenuAction[] {
    const actions: ContextMenuAction[] = [];

    actions.push({
      id: 'addBuilding',
      label: 'Add Building',
      icon: '$(add)',
      enabled: true,
      action: async () => {
        const buildingTypes = [
          'ToolStore',
          'TeleportPad',
          'PowerStation',
          'OreRefinery',
          'Docks',
          'SupportStation',
          'UpgradeStation',
          'GeologicalCenter',
        ];

        const type = await vscode.window.showQuickPick(buildingTypes, {
          placeHolder: 'Select building type',
        });

        if (type) {
          const x = await vscode.window.showInputBox({
            prompt: 'X coordinate',
            validateInput: v => (isNaN(Number(v)) ? 'Must be a number' : null),
          });
          const y = await vscode.window.showInputBox({
            prompt: 'Y coordinate',
            validateInput: v => (isNaN(Number(v)) ? 'Must be a number' : null),
          });

          if (x && y) {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
              await editor.edit(editBuilder => {
                editBuilder.insert(
                  position,
                  `\n${type}: ${x},${y},${type === 'ToolStore' ? '1,1,1' : '1'}`
                );
              });
            }
          }
        }
      },
    });

    actions.push({
      id: 'checkBuildingSpace',
      label: 'Check Building Space',
      icon: '$(inspect)',
      enabled: true,
      action: async () => {
        vscode.window.showInformationMessage('Checking available building space...');
        // Implementation would analyze the map for suitable building locations
      },
    });

    return actions;
  }

  private getObjectiveActions(
    _document: vscode.TextDocument,
    position: vscode.Position
  ): ContextMenuAction[] {
    const actions: ContextMenuAction[] = [];

    actions.push({
      id: 'openObjectiveBuilder',
      label: 'Open Objective Builder',
      icon: '$(target)',
      enabled: true,
      action: async () => {
        await vscode.commands.executeCommand('manicMiners.openObjectiveBuilder');
      },
    });

    actions.push({
      id: 'addObjective',
      label: 'Add Objective',
      icon: '$(add)',
      enabled: true,
      action: async () => {
        const objectiveTypes = ['resources', 'buildings', 'units', 'time'];
        const type = await vscode.window.showQuickPick(objectiveTypes, {
          placeHolder: 'Select objective type',
        });

        if (type) {
          let objectiveText = '';
          switch (type) {
            case 'resources': {
              const resourceType = await vscode.window.showInputBox({
                prompt: 'Resource type (crystals/ore/studs)',
              });
              const amount = await vscode.window.showInputBox({
                prompt: 'Amount required',
              });
              if (resourceType && amount) {
                objectiveText = `resources: ${resourceType},${amount}`;
              }
              break;
            }
            case 'buildings': {
              const buildingType = await vscode.window.showInputBox({
                prompt: 'Building type',
              });
              const count = await vscode.window.showInputBox({
                prompt: 'Number required',
              });
              if (buildingType && count) {
                objectiveText = `buildings: ${buildingType},${count}`;
              }
              break;
            }
          }

          if (objectiveText) {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
              await editor.edit(editBuilder => {
                editBuilder.insert(position, `\n${objectiveText}`);
              });
            }
          }
        }
      },
    });

    actions.push({
      id: 'analyzeObjectives',
      label: 'Analyze Objectives',
      icon: '$(graph)',
      enabled: true,
      action: async () => {
        await vscode.commands.executeCommand('manicMiners.analyzeObjectives');
      },
    });

    return actions;
  }

  private getScriptActions(
    _document: vscode.TextDocument,
    _position: vscode.Position
  ): ContextMenuAction[] {
    const actions: ContextMenuAction[] = [];

    actions.push({
      id: 'insertScriptPattern',
      label: 'Insert Script Pattern',
      icon: '$(code)',
      enabled: true,
      action: async () => {
        await vscode.commands.executeCommand('manicMiners.insertScriptPattern');
      },
    });

    actions.push({
      id: 'scriptDocs',
      label: 'Show Script Reference',
      icon: '$(book)',
      enabled: true,
      action: async () => {
        await vscode.commands.executeCommand('manicMiners.showScriptPatternDocs');
      },
    });

    actions.push({
      id: 'validateScript',
      label: 'Validate Script',
      icon: '$(check)',
      enabled: true,
      action: async () => {
        await vscode.commands.executeCommand('manicMiners.runValidation');
      },
    });

    return actions;
  }
}
