import * as vscode from 'vscode';
import { getTileName } from '../data/tileDefinitions';
import { getTileColor } from '../mapPreview/colorMap';

type TileTreeItem = TileCategory | TileItem;

export class TilePaletteProvider implements vscode.TreeDataProvider<TileTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TileTreeItem | undefined | null | void> =
    new vscode.EventEmitter<TileTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TileTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private selectedTileId: number = 1;

  constructor(_context: vscode.ExtensionContext) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TileTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TileTreeItem): Thenable<TileTreeItem[]> {
    if (!element) {
      // Root categories
      return Promise.resolve([
        new TileCategory('Ground', 'ground', [
          { id: 1, name: 'Ground' },
          { id: 2, name: 'Dirt' },
          { id: 3, name: 'Loose Rock' },
          { id: 4, name: 'Hard Rock' },
          { id: 5, name: 'Solid Rock' },
        ]),
        new TileCategory('Liquids', 'liquids', [
          { id: 6, name: 'Lava' },
          { id: 7, name: 'Lava (flow 1)' },
          { id: 8, name: 'Lava (flow 2)' },
          { id: 9, name: 'Lava (flow 3)' },
          { id: 10, name: 'Lava (flow 4)' },
          { id: 11, name: 'Water' },
          { id: 12, name: 'Water (flow 1)' },
          { id: 13, name: 'Water (flow 2)' },
          { id: 14, name: 'Water (flow 3)' },
          { id: 15, name: 'Water (flow 4)' },
          { id: 16, name: 'Water (flow 5)' },
        ]),
        new TileCategory('Walls', 'walls', [
          { id: 26, name: 'Reinforced Wall' },
          { id: 27, name: 'Reinforced Wall (var 1)' },
          { id: 28, name: 'Reinforced Wall (var 2)' },
          { id: 29, name: 'Reinforced Wall (var 3)' },
          { id: 30, name: 'Power Path' },
          { id: 34, name: 'Slimy Slug Hole' },
          { id: 38, name: 'Eroding Wall' },
          { id: 40, name: 'Solid Wall' },
        ]),
        new TileCategory('Resources', 'resources', [
          { id: 42, name: 'Energy Crystal' },
          { id: 43, name: 'Energy Crystal (glow 1)' },
          { id: 44, name: 'Energy Crystal (glow 2)' },
          { id: 45, name: 'Energy Crystal (glow 3)' },
          { id: 46, name: 'Ore Seam' },
          { id: 47, name: 'Ore (var 1)' },
          { id: 48, name: 'Ore (var 2)' },
          { id: 49, name: 'Ore (var 3)' },
          { id: 50, name: 'Recharge Seam' },
          { id: 51, name: 'Recharge Seam (pulse 1)' },
          { id: 52, name: 'Recharge Seam (pulse 2)' },
        ]),
        new TileCategory('Special', 'special', [
          { id: 63, name: 'Rubble (4 high)' },
          { id: 64, name: 'Rubble (3 high)' },
          { id: 65, name: 'Rubble (2 high)' },
          { id: 66, name: 'Rubble (1 high)' },
          { id: 67, name: 'Landslide Rubble (4 high)' },
          { id: 101, name: 'Tool Store' },
          { id: 102, name: 'Teleport Pad' },
          { id: 103, name: 'Building Foundation' },
        ]),
      ]);
    } else if (element instanceof TileCategory) {
      // Tiles within a category
      return Promise.resolve(
        element.tiles.map(tile => new TileItem(tile.id, tile.name, tile.id === this.selectedTileId))
      );
    }

    return Promise.resolve([]);
  }

  setSelectedTile(tileId: number): void {
    this.selectedTileId = tileId;
    this.refresh();

    // Update status bar
    vscode.commands.executeCommand('manicMiners.updateStatusBar', {
      selectedTile: `Tile: ${tileId} - ${getTileName(tileId)}`,
    });
  }

  getSelectedTileId(): number {
    return this.selectedTileId;
  }
}

class TileCategory extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly category: string,
    public readonly tiles: { id: number; name: string }[]
  ) {
    super(label, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = 'tileCategory';
    this.iconPath = new vscode.ThemeIcon('symbol-namespace');
  }
}

class TileItem extends vscode.TreeItem {
  constructor(
    public readonly tileId: number,
    public readonly tileName: string,
    public readonly isSelected: boolean
  ) {
    super(`${tileId}: ${tileName}`, vscode.TreeItemCollapsibleState.None);

    this.contextValue = 'tile';
    this.tooltip = `Tile ${tileId}: ${tileName}`;

    // Create a colored icon using the tile color
    const color = getTileColor(tileId);
    this.iconPath = {
      light: this.createColorIcon(color),
      dark: this.createColorIcon(color),
    };

    // Highlight selected tile
    if (isSelected) {
      this.description = '(selected)';
    }

    this.command = {
      command: 'manicMiners.selectTile',
      title: 'Select Tile',
      arguments: [tileId],
    };
  }

  private createColorIcon(_color: { r: number; g: number; b: number }): vscode.Uri {
    // In a real implementation, we'd generate an SVG data URI
    // For now, use a themed icon placeholder
    return vscode.Uri.parse(
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjYiIGZpbGw9ImN1cnJlbnRDb2xvciIvPjwvc3ZnPg=='
    );
  }
}
