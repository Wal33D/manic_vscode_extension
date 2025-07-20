import * as vscode from 'vscode';
import { MapTemplate } from './mapTemplatesProvider';

export class CustomTemplatesManager {
  private static readonly STORAGE_KEY = 'manicMiners.customTemplates';

  constructor(private context: vscode.ExtensionContext) {}

  async getCustomTemplates(): Promise<MapTemplate[]> {
    const stored = this.context.globalState.get<MapTemplate[]>(CustomTemplatesManager.STORAGE_KEY);
    return stored || [];
  }

  async saveTemplate(template: MapTemplate): Promise<void> {
    const templates = await this.getCustomTemplates();
    const existingIndex = templates.findIndex(t => t.name === template.name);

    if (existingIndex >= 0) {
      const overwrite = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: `Template "${template.name}" already exists. Overwrite?`,
      });

      if (overwrite !== 'Yes') {
        return;
      }

      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }

    await this.context.globalState.update(CustomTemplatesManager.STORAGE_KEY, templates);
    vscode.window.showInformationMessage(`Saved template: ${template.name}`);
  }

  async deleteTemplate(name: string): Promise<void> {
    const templates = await this.getCustomTemplates();
    const filtered = templates.filter(t => t.name !== name);
    await this.context.globalState.update(CustomTemplatesManager.STORAGE_KEY, filtered);
    vscode.window.showInformationMessage(`Deleted template: ${name}`);
  }

  async createTemplateFromSelection(
    document: vscode.TextDocument,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ): Promise<void> {
    // Parse the tiles section
    const lines = document.getText().split('\n');
    const tilesStartLine = lines.findIndex(line => line.trim() === 'tiles{');
    if (tilesStartLine === -1) {
      vscode.window.showErrorMessage('Could not find tiles section');
      return;
    }

    // Extract the selected tiles
    const tiles: number[][] = [];
    for (let row = startRow; row <= endRow; row++) {
      const lineIndex = tilesStartLine + 1 + row;
      if (lineIndex >= lines.length) {
        break;
      }

      const line = lines[lineIndex];
      const tileCols = line
        .split(',')
        .map(t => t.trim())
        .filter(t => t);
      const rowTiles: number[] = [];

      for (let col = startCol; col <= endCol && col < tileCols.length; col++) {
        const tileId = parseInt(tileCols[col], 10);
        if (!isNaN(tileId)) {
          rowTiles.push(tileId);
        }
      }

      if (rowTiles.length > 0) {
        tiles.push(rowTiles);
      }
    }

    if (tiles.length === 0) {
      vscode.window.showErrorMessage('No valid tiles in selection');
      return;
    }

    // Get template details from user
    const name = await vscode.window.showInputBox({
      prompt: 'Enter a name for this template',
      placeHolder: 'My Custom Template',
    });

    if (!name) {
      return;
    }

    const description = await vscode.window.showInputBox({
      prompt: 'Enter a description for this template',
      placeHolder: 'Description of what this template is for',
    });

    const categories = ['room', 'corridor', 'pattern', 'structure', 'custom'];
    const category = (await vscode.window.showQuickPick(categories, {
      placeHolder: 'Select a category for this template',
    })) as 'room' | 'corridor' | 'pattern' | 'structure';

    if (!category) {
      return;
    }

    const template: MapTemplate = {
      name,
      description: description || '',
      width: tiles[0].length,
      height: tiles.length,
      tiles,
      category,
    };

    await this.saveTemplate(template);
  }

  async manageTemplates(): Promise<void> {
    const templates = await this.getCustomTemplates();

    if (templates.length === 0) {
      vscode.window.showInformationMessage('No custom templates saved yet');
      return;
    }

    const items = templates.map(t => ({
      label: t.name,
      description: `${t.width}x${t.height} - ${t.category}`,
      detail: t.description,
      template: t,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a template to delete',
    });

    if (!selected) {
      return;
    }

    const action = await vscode.window.showQuickPick(['Delete', 'Cancel'], {
      placeHolder: `What would you like to do with "${selected.template.name}"?`,
    });

    if (action === 'Delete') {
      await this.deleteTemplate(selected.template.name);
    }
  }
}
