import * as vscode from 'vscode';
import { DatFileParser } from '../parser/datFileParser';

export class StatusBarManager {
  private mapInfoItem: vscode.StatusBarItem;
  private tileInfoItem: vscode.StatusBarItem;
  private validationItem: vscode.StatusBarItem;
  private performanceItem: vscode.StatusBarItem;

  constructor() {
    // Create status bar items
    this.mapInfoItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.mapInfoItem.command = 'manicMiners.showMapInfo';

    this.tileInfoItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    this.tileInfoItem.command = 'manicMiners.showTilePalette';

    this.validationItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
    this.validationItem.command = 'manicMiners.runValidation';

    this.performanceItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

    // Show items
    this.mapInfoItem.show();
    this.tileInfoItem.show();
    this.validationItem.show();
    this.performanceItem.show();

    // Initial state
    this.updateMapInfo(undefined);
    this.updateTileInfo(1, 'Ground');
    this.updateValidation('pending');
  }

  updateActiveDocument(document: vscode.TextDocument | undefined): void {
    if (!document || !document.fileName.endsWith('.dat')) {
      this.updateMapInfo(undefined);
      return;
    }

    try {
      const parser = new DatFileParser(document.getText());
      const datFile = parser.parse();

      if (datFile && datFile.info) {
        this.updateMapInfo({
          rows: datFile.info.rowcount,
          cols: datFile.info.colcount,
          title: datFile.info.levelname || 'Untitled',
          biome: datFile.info.biome || 'rock',
        });

        // Count resources
        let crystalCount = 0;
        let oreCount = 0;

        if (datFile.tiles) {
          for (let row = 0; row < datFile.tiles.length; row++) {
            for (let col = 0; col < datFile.tiles[row].length; col++) {
              const tileId = datFile.tiles[row][col];
              if (tileId >= 42 && tileId <= 45) {
                crystalCount++;
              }
              if (tileId >= 46 && tileId <= 49) {
                oreCount++;
              }
            }
          }
        }

        this.updatePerformance({
          tileCount: datFile.info.rowcount * datFile.info.colcount,
          crystals: crystalCount,
          ore: oreCount,
        });
      }
    } catch (error) {
      this.updateMapInfo(undefined);
    }
  }

  updateMapInfo(
    info: { rows: number; cols: number; title: string; biome: string } | undefined
  ): void {
    if (!info) {
      this.mapInfoItem.text = '$(map) No map open';
      this.mapInfoItem.tooltip = 'Open a .dat file to see map information';
      return;
    }

    this.mapInfoItem.text = `$(map) ${info.title} (${info.rows}×${info.cols})`;
    this.mapInfoItem.tooltip = new vscode.MarkdownString(
      `**Map Information**\n\n` +
        `• Title: ${info.title}\n` +
        `• Size: ${info.rows}×${info.cols}\n` +
        `• Biome: ${info.biome}\n` +
        `• Total tiles: ${info.rows * info.cols}`
    );
  }

  updateTileInfo(tileId: number, tileName: string): void {
    this.tileInfoItem.text = `$(symbol-color) Tile: ${tileId} - ${tileName}`;
    this.tileInfoItem.tooltip = 'Click to open tile palette';
  }

  updateValidation(
    status: 'valid' | 'errors' | 'warnings' | 'pending',
    counts?: { errors: number; warnings: number }
  ): void {
    switch (status) {
      case 'valid':
        this.validationItem.text = '$(check) Valid';
        this.validationItem.tooltip = 'Map validation passed';
        this.validationItem.backgroundColor = undefined;
        break;
      case 'errors':
        this.validationItem.text = `$(error) ${counts?.errors || 0} errors`;
        this.validationItem.tooltip = 'Click to run validation';
        this.validationItem.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.errorBackground'
        );
        break;
      case 'warnings':
        this.validationItem.text = `$(warning) ${counts?.warnings || 0} warnings`;
        this.validationItem.tooltip = 'Click to run validation';
        this.validationItem.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.warningBackground'
        );
        break;
      case 'pending':
        this.validationItem.text = '$(sync~spin) Validation...';
        this.validationItem.tooltip = 'Validation in progress';
        this.validationItem.backgroundColor = undefined;
        break;
    }
  }

  updatePerformance(stats: { tileCount: number; crystals: number; ore: number }): void {
    this.performanceItem.text = `$(dashboard) Tiles: ${stats.tileCount} | $(gem) ${stats.crystals} | $(database) ${stats.ore}`;
    this.performanceItem.tooltip = new vscode.MarkdownString(
      `**Map Statistics**\n\n` +
        `• Total tiles: ${stats.tileCount}\n` +
        `• Energy crystals: ${stats.crystals}\n` +
        `• Ore deposits: ${stats.ore}`
    );
  }

  updateStatusBarItem(updates: { selectedTile?: string; validation?: string }): void {
    if (updates.selectedTile) {
      const match = updates.selectedTile.match(/Tile: (\d+) - (.+)/);
      if (match) {
        this.updateTileInfo(parseInt(match[1]), match[2]);
      }
    }

    if (updates.validation) {
      // Parse validation status from the update
      if (updates.validation.includes('error')) {
        const count = parseInt(updates.validation.match(/\d+/)?.[0] || '0');
        this.updateValidation('errors', { errors: count, warnings: 0 });
      } else if (updates.validation.includes('warning')) {
        const count = parseInt(updates.validation.match(/\d+/)?.[0] || '0');
        this.updateValidation('warnings', { errors: 0, warnings: count });
      } else if (updates.validation.includes('Valid')) {
        this.updateValidation('valid');
      }
    }
  }

  dispose(): void {
    this.mapInfoItem.dispose();
    this.tileInfoItem.dispose();
    this.validationItem.dispose();
    this.performanceItem.dispose();
  }
}
