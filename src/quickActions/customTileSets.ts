import * as vscode from 'vscode';

export interface CustomTileSet {
  name: string;
  tiles: number[];
  description?: string;
}

export class CustomTileSetsManager {
  private static readonly STORAGE_KEY = 'manicMiners.customTileSets';

  constructor(private context: vscode.ExtensionContext) {}

  async getTileSets(): Promise<CustomTileSet[]> {
    const stored = this.context.globalState.get<CustomTileSet[]>(CustomTileSetsManager.STORAGE_KEY);
    return stored || this.getDefaultTileSets();
  }

  async saveTileSet(tileSet: CustomTileSet): Promise<void> {
    const tileSets = await this.getTileSets();
    const existingIndex = tileSets.findIndex(ts => ts.name === tileSet.name);

    if (existingIndex >= 0) {
      tileSets[existingIndex] = tileSet;
    } else {
      tileSets.push(tileSet);
    }

    await this.context.globalState.update(CustomTileSetsManager.STORAGE_KEY, tileSets);
  }

  async deleteTileSet(name: string): Promise<void> {
    const tileSets = await this.getTileSets();
    const filtered = tileSets.filter(ts => ts.name !== name);
    await this.context.globalState.update(CustomTileSetsManager.STORAGE_KEY, filtered);
  }

  async showTileSetPicker(): Promise<CustomTileSet | undefined> {
    const tileSets = await this.getTileSets();
    const items = tileSets.map(ts => ({
      label: ts.name,
      description: ts.description || `${ts.tiles.length} tiles`,
      detail: `Tiles: ${ts.tiles.join(', ')}`,
      tileSet: ts,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a custom tile set',
    });

    return selected?.tileSet;
  }

  async createTileSetFromSelection(tiles: number[]): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter a name for this tile set',
      placeHolder: 'My Custom Tiles',
    });

    if (!name) {
      return;
    }

    const description = await vscode.window.showInputBox({
      prompt: 'Enter a description (optional)',
      placeHolder: 'Description of what these tiles are for',
    });

    const tileSet: CustomTileSet = {
      name,
      tiles: [...new Set(tiles)], // Remove duplicates
      description,
    };

    await this.saveTileSet(tileSet);
    vscode.window.showInformationMessage(`Saved tile set: ${name}`);
  }

  private getDefaultTileSets(): CustomTileSet[] {
    return [
      {
        name: 'Hazards',
        tiles: [6, 11, 12, 19], // Lava, Water, Ice, Erosion
        description: 'All hazard tiles',
      },
      {
        name: 'Resources',
        tiles: [26, 27, 34, 35, 42, 43, 46, 47], // Crystals, Ore, Recharge
        description: 'All resource tiles',
      },
      {
        name: 'Walls',
        tiles: [30, 38, 40, 80, 88, 90], // Various wall types
        description: 'Common wall tiles',
      },
      {
        name: 'Paths',
        tiles: [1, 4, 8, 13], // Ground, Rubble, PowerPath
        description: 'Walkable path tiles',
      },
    ];
  }
}
