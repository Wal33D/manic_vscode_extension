import * as vscode from 'vscode';
import { CustomTemplatesManager } from './customTemplates';

export interface MapTemplate {
  name: string;
  description: string;
  width: number;
  height: number;
  tiles: number[][];
  category: 'room' | 'corridor' | 'pattern' | 'structure';
}

export class MapTemplatesProvider {
  private static readonly templates: MapTemplate[] = [
    // Room Templates
    {
      name: 'Small Room',
      description: 'A 5x5 room with walls',
      width: 5,
      height: 5,
      category: 'room',
      tiles: [
        [40, 40, 40, 40, 40],
        [40, 1, 1, 1, 40],
        [40, 1, 1, 1, 40],
        [40, 1, 1, 1, 40],
        [40, 40, 40, 40, 40],
      ],
    },
    {
      name: 'Medium Room',
      description: 'A 7x7 room with walls',
      width: 7,
      height: 7,
      category: 'room',
      tiles: [
        [40, 40, 40, 40, 40, 40, 40],
        [40, 1, 1, 1, 1, 1, 40],
        [40, 1, 1, 1, 1, 1, 40],
        [40, 1, 1, 1, 1, 1, 40],
        [40, 1, 1, 1, 1, 1, 40],
        [40, 1, 1, 1, 1, 1, 40],
        [40, 40, 40, 40, 40, 40, 40],
      ],
    },
    {
      name: 'Large Room',
      description: 'A 9x9 room with reinforced walls',
      width: 9,
      height: 9,
      category: 'room',
      tiles: [
        [90, 90, 90, 90, 90, 90, 90, 90, 90],
        [90, 1, 1, 1, 1, 1, 1, 1, 90],
        [90, 1, 1, 1, 1, 1, 1, 1, 90],
        [90, 1, 1, 1, 1, 1, 1, 1, 90],
        [90, 1, 1, 1, 1, 1, 1, 1, 90],
        [90, 1, 1, 1, 1, 1, 1, 1, 90],
        [90, 1, 1, 1, 1, 1, 1, 1, 90],
        [90, 1, 1, 1, 1, 1, 1, 1, 90],
        [90, 90, 90, 90, 90, 90, 90, 90, 90],
      ],
    },
    // Corridor Templates
    {
      name: 'Horizontal Corridor',
      description: 'A 7x3 horizontal corridor',
      width: 7,
      height: 3,
      category: 'corridor',
      tiles: [
        [40, 40, 40, 40, 40, 40, 40],
        [1, 1, 1, 1, 1, 1, 1],
        [40, 40, 40, 40, 40, 40, 40],
      ],
    },
    {
      name: 'Vertical Corridor',
      description: 'A 3x7 vertical corridor',
      width: 3,
      height: 7,
      category: 'corridor',
      tiles: [
        [40, 1, 40],
        [40, 1, 40],
        [40, 1, 40],
        [40, 1, 40],
        [40, 1, 40],
        [40, 1, 40],
        [40, 1, 40],
      ],
    },
    {
      name: 'T-Junction',
      description: 'A T-shaped junction',
      width: 5,
      height: 5,
      category: 'corridor',
      tiles: [
        [40, 40, 40, 40, 40],
        [1, 1, 1, 1, 1],
        [40, 40, 1, 40, 40],
        [40, 40, 1, 40, 40],
        [40, 40, 1, 40, 40],
      ],
    },
    {
      name: 'Cross Junction',
      description: 'A cross-shaped junction',
      width: 5,
      height: 5,
      category: 'corridor',
      tiles: [
        [40, 40, 1, 40, 40],
        [40, 40, 1, 40, 40],
        [1, 1, 1, 1, 1],
        [40, 40, 1, 40, 40],
        [40, 40, 1, 40, 40],
      ],
    },
    // Pattern Templates
    {
      name: 'Crystal Cluster',
      description: 'A cluster of crystal seams',
      width: 3,
      height: 3,
      category: 'pattern',
      tiles: [
        [26, 26, 26],
        [26, 27, 26],
        [26, 26, 26],
      ],
    },
    {
      name: 'Ore Deposit',
      description: 'An ore seam deposit',
      width: 4,
      height: 4,
      category: 'pattern',
      tiles: [
        [40, 34, 34, 40],
        [34, 35, 35, 34],
        [34, 35, 35, 34],
        [40, 34, 34, 40],
      ],
    },
    {
      name: 'Lava Pool',
      description: 'A small lava hazard',
      width: 4,
      height: 4,
      category: 'pattern',
      tiles: [
        [40, 40, 40, 40],
        [40, 6, 6, 40],
        [40, 6, 6, 40],
        [40, 40, 40, 40],
      ],
    },
    {
      name: 'Water Pool',
      description: 'A small water hazard',
      width: 5,
      height: 5,
      category: 'pattern',
      tiles: [
        [40, 40, 40, 40, 40],
        [40, 11, 11, 11, 40],
        [40, 11, 11, 11, 40],
        [40, 11, 11, 11, 40],
        [40, 40, 40, 40, 40],
      ],
    },
    // Structure Templates
    {
      name: 'Power Station Area',
      description: 'Space for a power station',
      width: 6,
      height: 6,
      category: 'structure',
      tiles: [
        [90, 90, 90, 90, 90, 90],
        [90, 1, 1, 1, 1, 90],
        [90, 1, 1, 1, 1, 90],
        [90, 1, 1, 1, 1, 90],
        [90, 1, 1, 1, 1, 90],
        [90, 90, 90, 90, 90, 90],
      ],
    },
    {
      name: 'Tool Store Area',
      description: 'Space for a tool store with entrance',
      width: 5,
      height: 5,
      category: 'structure',
      tiles: [
        [40, 40, 40, 40, 40],
        [40, 1, 1, 1, 40],
        [40, 1, 1, 1, 1],
        [40, 1, 1, 1, 40],
        [40, 40, 40, 40, 40],
      ],
    },
  ];

  public static getTemplates(): MapTemplate[] {
    return this.templates;
  }

  public static getTemplatesByCategory(category: string): MapTemplate[] {
    return this.templates.filter(t => t.category === category);
  }

  public static async showTemplatePicker(
    customTemplatesManager?: CustomTemplatesManager
  ): Promise<MapTemplate | undefined> {
    const categories = ['All', 'Room', 'Corridor', 'Pattern', 'Structure', 'Custom'];
    const selectedCategory = await vscode.window.showQuickPick(categories, {
      placeHolder: 'Select template category',
    });

    if (!selectedCategory) {
      return undefined;
    }

    let templates: MapTemplate[] = [];

    if (selectedCategory === 'Custom' && customTemplatesManager) {
      templates = await customTemplatesManager.getCustomTemplates();
      if (templates.length === 0) {
        vscode.window.showInformationMessage(
          'No custom templates saved. Create one by selecting tiles in the map preview.'
        );
        return undefined;
      }
    } else if (selectedCategory === 'All') {
      templates = [...this.templates];
      if (customTemplatesManager) {
        const customTemplates = await customTemplatesManager.getCustomTemplates();
        templates.push(...customTemplates);
      }
    } else {
      templates = this.getTemplatesByCategory(selectedCategory.toLowerCase());
    }

    const items = templates.map(template => ({
      label: template.name,
      description: `${template.width}x${template.height} - ${template.description}`,
      detail: `Category: ${template.category}`,
      template,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a template to insert',
      matchOnDescription: true,
      matchOnDetail: true,
    });

    return selected?.template;
  }

  public static insertTemplate(
    editor: vscode.TextEditor,
    template: MapTemplate,
    position: vscode.Position
  ): void {
    const lines = editor.document.getText().split('\n');
    const tilesStartLine = lines.findIndex(line => line.trim() === 'tiles{');
    const tilesEndLine = lines.findIndex(
      (line, index) => index > tilesStartLine && line.trim() === '}'
    );

    if (tilesStartLine === -1 || tilesEndLine === -1) {
      vscode.window.showErrorMessage('Could not find tiles section');
      return;
    }

    // Calculate the position within the tiles grid
    const tilesRow = position.line - tilesStartLine - 1;
    if (tilesRow < 0 || position.line >= tilesEndLine) {
      vscode.window.showErrorMessage('Please position cursor within the tiles section');
      return;
    }

    // Parse existing tiles
    const tileLines: string[][] = [];
    for (let i = tilesStartLine + 1; i < tilesEndLine; i++) {
      const line = lines[i].trim();
      if (line) {
        tileLines.push(
          line
            .split(',')
            .map(t => t.trim())
            .filter(t => t)
        );
      }
    }

    // Calculate column position
    let currentCol = 0;
    const lineText = editor.document.lineAt(position.line).text;
    let charCount = 0;
    for (const tile of lineText.split(',')) {
      if (charCount >= position.character) {
        break;
      }
      charCount += tile.length + 1;
      currentCol++;
    }

    // Apply the template
    editor.edit(editBuilder => {
      for (let row = 0; row < template.height; row++) {
        const targetRow = tilesRow + row;
        if (targetRow >= tileLines.length) {
          break;
        }

        const newTiles = [...tileLines[targetRow]];
        for (let col = 0; col < template.width; col++) {
          const targetCol = currentCol + col;
          if (targetCol < newTiles.length) {
            newTiles[targetCol] = String(template.tiles[row][col]);
          }
        }

        const newLine = newTiles.join(',') + ',';
        const lineNumber = tilesStartLine + 1 + targetRow;
        editBuilder.replace(
          new vscode.Range(
            new vscode.Position(lineNumber, 0),
            new vscode.Position(lineNumber, lines[lineNumber].length)
          ),
          newLine
        );
      }
    });

    vscode.window.showInformationMessage(
      `Inserted template: ${template.name} (${template.width}x${template.height})`
    );
  }
}

export function registerMapTemplateCommands(context: vscode.ExtensionContext): void {
  const customTemplatesManager = new CustomTemplatesManager(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.insertTemplate', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'manicminers') {
        vscode.window.showErrorMessage('Please open a Manic Miners DAT file');
        return;
      }

      const template = await MapTemplatesProvider.showTemplatePicker(customTemplatesManager);
      if (template) {
        MapTemplatesProvider.insertTemplate(editor, template, editor.selection.active);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'manicMiners.createTemplateFromSelection',
      async (selection: { startRow: number; startCol: number; endRow: number; endCol: number }) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'manicminers') {
          vscode.window.showErrorMessage('Please open a Manic Miners DAT file');
          return;
        }

        await customTemplatesManager.createTemplateFromSelection(
          editor.document,
          selection.startRow,
          selection.startCol,
          selection.endRow,
          selection.endCol
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.manageTemplates', async () => {
      await customTemplatesManager.manageTemplates();
    })
  );
}
