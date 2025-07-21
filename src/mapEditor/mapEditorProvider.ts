import * as vscode from 'vscode';
import { DatFileParser } from '../parser/datFileParser';
import { EditHistory, MapEdit, EditChange } from '../undoRedo/editHistory';
import { getTileColor } from '../mapPreview/colorMap';
import { getTileName } from '../data/tileDefinitions';
import { AutoTiler, supportsAutoTiling } from './autoTiling';
import { MapEditorValidator } from './mapEditorValidator';
import { MapTemplateManager, MapTemplate } from './mapTemplates';

export interface PaintTool {
  type: 'paint' | 'fill' | 'line' | 'rectangle' | 'picker' | 'select' | 'stamp';
  size: number;
  tileId: number;
  mirrorMode?: 'horizontal' | 'vertical' | 'both' | 'off';
  autoTile?: boolean;
}

export interface SelectionData {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  tiles: number[][];
}

export interface TilePattern {
  id: string;
  name: string;
  tiles: number[][];
  width: number;
  height: number;
}

export interface MapLayer {
  id: string;
  name: string;
  tiles: number[][];
  visible: boolean;
  opacity: number;
  locked: boolean;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay';
}

// Maximum map dimensions to prevent performance issues
const MAX_MAP_DIMENSION = 500;
const MAX_TILE_ID = 115;
const MIN_TILE_ID = 1;

export class MapEditorProvider implements vscode.CustomTextEditorProvider {
  private static readonly viewType = 'manicMiners.mapEditor';
  private editHistory = new EditHistory(100);
  private layers: Map<string, MapLayer[]> = new Map();

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new MapEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      MapEditorProvider.viewType,
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false,
      }
    );
    return providerRegistration;
  }

  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
    };

    // Initial update
    this.updateWebview(webviewPanel.webview, document);

    // Update when document changes
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        this.updateWebview(webviewPanel.webview, document);
      }
    });

    // Handle messages from webview
    webviewPanel.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'paint':
          await this.handlePaint(document, message.tiles, message.description);
          break;
        case 'undo':
          await this.handleUndo(document);
          break;
        case 'redo':
          await this.handleRedo(document);
          break;
        case 'getTileInfo':
          webviewPanel.webview.postMessage({
            type: 'tileInfo',
            row: message.row,
            col: message.col,
            tileId: message.tileId,
            tileName: getTileName(message.tileId),
          });
          break;
        case 'error':
          vscode.window.showErrorMessage(message.message || 'An error occurred in the map editor');
          break;
        case 'copy':
          await this.handleCopy(webviewPanel.webview, message.selection);
          break;
        case 'paste':
          await this.handlePaste(
            document,
            message.tiles,
            message.row,
            message.col,
            message.description
          );
          break;
        case 'delete':
          await this.handleDelete(document, message.selection, message.description);
          break;
        case 'move':
          await this.handleMove(
            document,
            message.selection,
            message.targetRow,
            message.targetCol,
            message.description
          );
          break;
        case 'export':
          await this.handleExport(webviewPanel.webview, message.format, message.includeGrid);
          break;
        case 'saveExport':
          await this.handleSaveExport(message.imageData, message.path);
          break;
        case 'savePattern':
          await this.handleSavePattern(webviewPanel.webview, message.pattern);
          break;
        case 'deletePattern':
          await this.handleDeletePattern(webviewPanel.webview, message.patternId);
          break;
        case 'stampPattern':
          await this.handleStampPattern(
            document,
            message.pattern,
            message.row,
            message.col,
            message.description
          );
          break;
        case 'createLayer':
          await this.handleCreateLayer(webviewPanel.webview, message.name);
          break;
        case 'deleteLayer':
          await this.handleDeleteLayer(webviewPanel.webview, message.layerId);
          break;
        case 'updateLayer':
          await this.handleUpdateLayer(webviewPanel.webview, message.layer);
          break;
        case 'mergeLayersDown':
          await this.handleMergeLayersDown(webviewPanel.webview, document, message.layerId);
          break;
        case 'autoTile':
          await this.handleAutoTile(document, message.tiles, message.description);
          break;
        case 'checkAutoTileSupport':
          webviewPanel.webview.postMessage({
            type: 'autoTileSupport',
            tileId: message.tileId,
            supported: supportsAutoTiling(message.tileId),
          });
          break;
        case 'validateMap':
          await this.handleValidateMap(webviewPanel.webview, document);
          break;
        case 'fixValidationIssue':
          await this.handleFixValidationIssue(document, message.issue, message.fix);
          break;
        case 'getTemplates':
          await this.handleGetTemplates(webviewPanel.webview);
          break;
        case 'useTemplate':
          await this.handleUseTemplate(document, webviewPanel.webview, message.template);
          break;
        case 'saveAsTemplate':
          await this.handleSaveAsTemplate(
            webviewPanel.webview,
            message.name,
            message.description,
            message.objectives,
            message.tiles
          );
          break;
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });
  }

  private async handlePaint(
    document: vscode.TextDocument,
    tiles: { row: number; col: number; tileId: number }[],
    description: string
  ): Promise<void> {
    try {
      // Validate tiles input
      if (!Array.isArray(tiles) || tiles.length === 0) {
        vscode.window.showErrorMessage('Invalid tiles data received');
        return;
      }

      // Validate each tile
      for (const tile of tiles) {
        if (
          typeof tile.row !== 'number' ||
          typeof tile.col !== 'number' ||
          typeof tile.tileId !== 'number'
        ) {
          vscode.window.showErrorMessage('Invalid tile data format');
          return;
        }
        if (tile.tileId < MIN_TILE_ID || tile.tileId > MAX_TILE_ID) {
          vscode.window.showErrorMessage(
            `Invalid tile ID: ${tile.tileId}. Must be between ${MIN_TILE_ID} and ${MAX_TILE_ID}`
          );
          return;
        }
      }
      const parser = new DatFileParser(document.getText());
      const tilesSection = parser.getSection('tiles');
      if (!tilesSection) {
        vscode.window.showErrorMessage('No tiles section found in document');
        return;
      }

      const lines = document.getText().split('\n');
      const tilesStartLine = lines.findIndex(line => line.trim() === 'tiles{');
      const tilesEndLine = lines.findIndex(
        (line, index) => index > tilesStartLine && line.trim() === '}'
      );

      if (tilesStartLine === -1 || tilesEndLine === -1) {
        return;
      }

      const edit = new vscode.WorkspaceEdit();
      const changes: EditChange[] = [];

      // Parse current tiles
      const tileLines = lines.slice(tilesStartLine + 1, tilesEndLine);
      const tileGrid: number[][] = tileLines
        .filter(line => line.trim().length > 0)
        .map(line => line.split(',').map(t => parseInt(t.trim(), 10)));

      // Group tiles by row for efficient editing
      const tilesByRow = new Map<number, { col: number; tileId: number }[]>();
      for (const tile of tiles) {
        if (!tilesByRow.has(tile.row)) {
          tilesByRow.set(tile.row, []);
        }
        tilesByRow.get(tile.row)!.push({ col: tile.col, tileId: tile.tileId });
      }

      // Apply changes with bounds checking
      for (const [row, rowTiles] of tilesByRow) {
        if (row < 0 || row >= tileGrid.length) {
          continue; // Skip invalid rows
        }
        const lineIndex = tilesStartLine + 1 + row;
        const oldLine = lines[lineIndex];
        const tiles = [...tileGrid[row]];

        // Track old values for undo
        for (const { col, tileId } of rowTiles) {
          if (col < 0 || col >= tiles.length) {
            continue; // Skip invalid columns
          }
          const oldTileId = tiles[col];
          tiles[col] = tileId;

          // Find character position in line
          const tileStrings = oldLine.split(',');
          let charPos = 0;
          for (let i = 0; i < col; i++) {
            charPos += tileStrings[i].length + 1; // +1 for comma
          }

          changes.push({
            range: new vscode.Range(
              lineIndex,
              charPos,
              lineIndex,
              charPos + tileStrings[col].trim().length
            ),
            oldText: String(oldTileId),
            newText: String(tileId),
          });
        }

        const newLine = tiles.join(',');
        edit.replace(
          document.uri,
          new vscode.Range(lineIndex, 0, lineIndex, oldLine.length),
          newLine
        );
      }

      // Record edit for undo history
      const mapEdit: MapEdit = {
        id: Date.now().toString(),
        timestamp: new Date(),
        description,
        documentUri: document.uri,
        changes,
      };

      const success = await vscode.workspace.applyEdit(edit);
      if (success) {
        this.editHistory.addEdit(mapEdit);
      } else {
        vscode.window.showErrorMessage('Failed to apply changes to the document');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error painting tiles: ${errorMessage}`);
    }
  }

  private async handleUndo(document: vscode.TextDocument): Promise<void> {
    try {
      const edit = this.editHistory.undo();
      if (!edit) {
        return;
      }

      const workspaceEdit = new vscode.WorkspaceEdit();
      for (const change of edit.changes) {
        workspaceEdit.replace(document.uri, change.range, change.oldText);
      }

      const success = await vscode.workspace.applyEdit(workspaceEdit);
      if (!success) {
        vscode.window.showErrorMessage('Failed to undo changes');
        // Re-add the edit to history since undo failed
        this.editHistory.addEdit(edit);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error during undo: ${errorMessage}`);
    }
  }

  private async handleRedo(document: vscode.TextDocument): Promise<void> {
    try {
      const edit = this.editHistory.redo();
      if (!edit) {
        return;
      }

      const workspaceEdit = new vscode.WorkspaceEdit();
      for (const change of edit.changes) {
        workspaceEdit.replace(document.uri, change.range, change.newText);
      }

      const success = await vscode.workspace.applyEdit(workspaceEdit);
      if (!success) {
        vscode.window.showErrorMessage('Failed to redo changes');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error during redo: ${errorMessage}`);
    }
  }

  private async handleCopy(webview: vscode.Webview, selection: SelectionData): Promise<void> {
    try {
      if (!selection) {
        vscode.window.showErrorMessage('Invalid selection data');
        return;
      }

      webview.postMessage({
        type: 'copyComplete',
        selection: selection,
      });

      vscode.window.showInformationMessage(
        `Copied ${Math.abs(selection.endRow - selection.startRow) + 1}x${Math.abs(selection.endCol - selection.startCol) + 1} tile region`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error copying selection: ${errorMessage}`);
    }
  }

  private async handlePaste(
    document: vscode.TextDocument,
    tiles: { row: number; col: number; tileId: number }[],
    _targetRow: number,
    _targetCol: number,
    description: string
  ): Promise<void> {
    try {
      if (!Array.isArray(tiles) || tiles.length === 0) {
        vscode.window.showErrorMessage('No tiles to paste');
        return;
      }

      await this.handlePaint(document, tiles, description);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error pasting tiles: ${errorMessage}`);
    }
  }

  private async handleDelete(
    document: vscode.TextDocument,
    selection: SelectionData,
    description: string
  ): Promise<void> {
    try {
      if (!selection) {
        vscode.window.showErrorMessage('Invalid selection for deletion');
        return;
      }

      const tilesToDelete: { row: number; col: number; tileId: number }[] = [];
      for (let row = selection.startRow; row <= selection.endRow; row++) {
        for (let col = selection.startCol; col <= selection.endCol; col++) {
          tilesToDelete.push({ row, col, tileId: 1 }); // Ground tile
        }
      }

      await this.handlePaint(document, tilesToDelete, description);

      vscode.window.showInformationMessage(
        `Deleted ${Math.abs(selection.endRow - selection.startRow) + 1}x${Math.abs(selection.endCol - selection.startCol) + 1} tile region`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error deleting selection: ${errorMessage}`);
    }
  }

  private async handleMove(
    document: vscode.TextDocument,
    selection: SelectionData,
    targetRow: number,
    targetCol: number,
    description: string
  ): Promise<void> {
    try {
      if (!selection || !selection.tiles) {
        vscode.window.showErrorMessage('Invalid move operation');
        return;
      }

      await this.handleDelete(document, selection, `${description} - delete source`);

      const tilesToPaste: { row: number; col: number; tileId: number }[] = [];
      for (let r = 0; r < selection.tiles.length; r++) {
        for (let c = 0; c < selection.tiles[r].length; c++) {
          const newRow = targetRow + r;
          const newCol = targetCol + c;
          tilesToPaste.push({
            row: newRow,
            col: newCol,
            tileId: selection.tiles[r][c],
          });
        }
      }

      await this.handlePaint(document, tilesToPaste, `${description} - paste at target`);

      vscode.window.showInformationMessage(
        `Moved ${selection.tiles.length}x${selection.tiles[0].length} tile region`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error moving selection: ${errorMessage}`);
    }
  }

  private async handleExport(
    webview: vscode.Webview,
    format: string,
    includeGrid: boolean
  ): Promise<void> {
    try {
      const saveOptions: vscode.SaveDialogOptions = {
        filters: format === 'png' ? { 'PNG Image': ['png'] } : { 'JPEG Image': ['jpg', 'jpeg'] },
        defaultUri: vscode.Uri.file(`map_export.${format}`),
      };

      const saveUri = await vscode.window.showSaveDialog(saveOptions);

      if (saveUri) {
        webview.postMessage({
          type: 'requestExport',
          path: saveUri.fsPath,
          format,
          includeGrid,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error exporting map: ${errorMessage}`);
    }
  }

  private async handleSaveExport(imageData: string, path: string): Promise<void> {
    try {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      await vscode.workspace.fs.writeFile(vscode.Uri.file(path), buffer);

      vscode.window.showInformationMessage(`Map exported successfully to ${path}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error saving exported map: ${errorMessage}`);
    }
  }

  private async handleSavePattern(webview: vscode.Webview, pattern: TilePattern): Promise<void> {
    try {
      const patterns = this.context.workspaceState.get<TilePattern[]>('tilePatterns', []);

      const existingIndex = patterns.findIndex(p => p.name === pattern.name);
      if (existingIndex >= 0) {
        const replace = await vscode.window.showQuickPick(['Yes', 'No'], {
          placeHolder: `Pattern "${pattern.name}" already exists. Replace it?`,
        });
        if (replace !== 'Yes') {
          return;
        }
        patterns[existingIndex] = pattern;
      } else {
        patterns.push(pattern);
      }

      await this.context.workspaceState.update('tilePatterns', patterns);

      webview.postMessage({
        type: 'patternsUpdated',
        patterns: patterns,
      });

      vscode.window.showInformationMessage(`Pattern "${pattern.name}" saved successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error saving pattern: ${errorMessage}`);
    }
  }

  private async handleDeletePattern(webview: vscode.Webview, patternId: string): Promise<void> {
    try {
      let patterns = this.context.workspaceState.get<TilePattern[]>('tilePatterns', []);
      patterns = patterns.filter(p => p.id !== patternId);

      await this.context.workspaceState.update('tilePatterns', patterns);

      webview.postMessage({
        type: 'patternsUpdated',
        patterns: patterns,
      });

      vscode.window.showInformationMessage('Pattern deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error deleting pattern: ${errorMessage}`);
    }
  }

  private async handleStampPattern(
    document: vscode.TextDocument,
    pattern: TilePattern,
    row: number,
    col: number,
    description: string
  ): Promise<void> {
    try {
      const tiles: { row: number; col: number; tileId: number }[] = [];

      for (let r = 0; r < pattern.height; r++) {
        for (let c = 0; c < pattern.width; c++) {
          const targetRow = row + r;
          const targetCol = col + c;

          tiles.push({
            row: targetRow,
            col: targetCol,
            tileId: pattern.tiles[r][c],
          });
        }
      }

      await this.handlePaint(document, tiles, description);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error stamping pattern: ${errorMessage}`);
    }
  }

  private async handleCreateLayer(webview: vscode.Webview, name: string): Promise<void> {
    try {
      const documentUri = webview.toString();
      const layers = this.layers.get(documentUri) || [];

      const newLayer: MapLayer = {
        id: Date.now().toString(),
        name: name || `Layer ${layers.length + 1}`,
        tiles: [], // Will be initialized when we have map dimensions
        visible: true,
        opacity: 1.0,
        locked: false,
        blendMode: 'normal',
      };

      layers.push(newLayer);
      this.layers.set(documentUri, layers);

      webview.postMessage({
        type: 'layersUpdated',
        layers: layers,
      });

      vscode.window.showInformationMessage(`Layer "${newLayer.name}" created`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error creating layer: ${errorMessage}`);
    }
  }

  private async handleDeleteLayer(webview: vscode.Webview, layerId: string): Promise<void> {
    try {
      const documentUri = webview.toString();
      let layers = this.layers.get(documentUri) || [];

      layers = layers.filter(l => l.id !== layerId);
      this.layers.set(documentUri, layers);

      webview.postMessage({
        type: 'layersUpdated',
        layers: layers,
      });

      vscode.window.showInformationMessage('Layer deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error deleting layer: ${errorMessage}`);
    }
  }

  private async handleUpdateLayer(webview: vscode.Webview, layer: MapLayer): Promise<void> {
    try {
      const documentUri = webview.toString();
      const layers = this.layers.get(documentUri) || [];

      const index = layers.findIndex(l => l.id === layer.id);
      if (index >= 0) {
        layers[index] = layer;
        this.layers.set(documentUri, layers);

        webview.postMessage({
          type: 'layersUpdated',
          layers: layers,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error updating layer: ${errorMessage}`);
    }
  }

  private async handleMergeLayersDown(
    webview: vscode.Webview,
    _document: vscode.TextDocument,
    layerId: string
  ): Promise<void> {
    try {
      const documentUri = webview.toString();
      const layers = this.layers.get(documentUri) || [];

      const layerIndex = layers.findIndex(l => l.id === layerId);
      if (layerIndex > 0) {
        const topLayer = layers[layerIndex];
        const bottomLayer = layers[layerIndex - 1];

        // Merge tiles
        for (let r = 0; r < topLayer.tiles.length; r++) {
          for (let c = 0; c < topLayer.tiles[r].length; c++) {
            if (topLayer.tiles[r][c] !== 0) {
              bottomLayer.tiles[r][c] = topLayer.tiles[r][c];
            }
          }
        }

        // Remove top layer
        layers.splice(layerIndex, 1);
        this.layers.set(documentUri, layers);

        webview.postMessage({
          type: 'layersUpdated',
          layers: layers,
        });

        vscode.window.showInformationMessage('Layers merged successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error merging layers: ${errorMessage}`);
    }
  }

  private async handleAutoTile(
    document: vscode.TextDocument,
    tiles: { row: number; col: number; tileId: number }[],
    description: string
  ): Promise<void> {
    try {
      const parser = new DatFileParser(document.getText());
      const tilesSection = parser.getSection('tiles');
      if (!tilesSection) {
        vscode.window.showErrorMessage('No tiles section found in document');
        return;
      }

      const lines = document.getText().split('\n');
      const tilesStartLine = lines.findIndex(line => line.trim() === 'tiles{');
      const tilesEndLine = lines.findIndex(
        (line, index) => index > tilesStartLine && line.trim() === '}'
      );

      if (tilesStartLine === -1 || tilesEndLine === -1) {
        return;
      }

      // Parse current tiles
      const tileLines = lines.slice(tilesStartLine + 1, tilesEndLine);
      const tileGrid: number[][] = tileLines
        .filter(line => line.trim().length > 0)
        .map(line => line.split(',').map(t => parseInt(t.trim(), 10)));

      // Create AutoTiler instance
      const rows = tileGrid.length;
      const cols = tileGrid[0]?.length || 0;
      const autoTiler = new AutoTiler(tileGrid, rows, cols);

      // Apply auto-tiling
      const autoTiledChanges = autoTiler.updateAndAutoTile(tiles);

      // Combine original tiles with auto-tiled changes
      const allChanges = [...tiles, ...autoTiledChanges];

      // Apply all changes
      if (allChanges.length > 0) {
        await this.handlePaint(document, allChanges, description);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error applying auto-tiling: ${errorMessage}`);
    }
  }

  private async handleValidateMap(
    webview: vscode.Webview,
    document: vscode.TextDocument
  ): Promise<void> {
    try {
      const validator = new MapEditorValidator(document);
      const result = await validator.validateForEditor();

      webview.postMessage({
        type: 'validationResult',
        result: result,
      });

      // Show summary in VS Code
      const errorCount = result.issues.filter(i => i.type === 'error').length;
      const warningCount = result.issues.filter(i => i.type === 'warning').length;

      if (errorCount === 0 && warningCount === 0) {
        vscode.window.showInformationMessage('Map validation passed! No issues found.');
      } else {
        const message = `Map validation found ${errorCount} error(s) and ${warningCount} warning(s)`;
        if (errorCount > 0) {
          vscode.window.showErrorMessage(message);
        } else {
          vscode.window.showWarningMessage(message);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error validating map: ${errorMessage}`);
    }
  }

  private async handleFixValidationIssue(
    document: vscode.TextDocument,
    _issue: any,
    fix: string
  ): Promise<void> {
    try {
      // Handle different types of fixes
      switch (fix) {
        case 'addSpawnPoint': {
          // Find a suitable location for spawn point
          const parser = new DatFileParser(document.getText());
          const tilesSection = parser.getSection('tiles');
          if (!tilesSection) {
            return;
          }

          // Find center of largest open area
          // For now, just place at center of map
          const info = parser.parse().info;
          const centerRow = Math.floor(info.rowcount / 2);
          const centerCol = Math.floor(info.colcount / 2);

          await this.handlePaint(
            document,
            [{ row: centerRow, col: centerCol, tileId: 101 }],
            'Add Tool Store (spawn point)'
          );
          break;
        }

        case 'connectArea':
          // This would require more complex pathfinding
          vscode.window.showInformationMessage(
            'Automatic area connection not yet implemented. Please manually connect the isolated areas.'
          );
          break;

        default:
          vscode.window.showWarningMessage(`Unknown fix type: ${fix}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error applying fix: ${errorMessage}`);
    }
  }

  private updateWebview(webview: vscode.Webview, document: vscode.TextDocument): void {
    try {
      const parser = new DatFileParser(document.getText());
      const datFile = parser.parse();

      if (!datFile || !datFile.tiles) {
        webview.html = this.getErrorHtml('Unable to parse map file: Missing tiles section');
        return;
      }

      // Validate map dimensions
      if (datFile.info.rowcount > MAX_MAP_DIMENSION || datFile.info.colcount > MAX_MAP_DIMENSION) {
        webview.html = this.getErrorHtml(
          `Map too large: ${datFile.info.rowcount}x${datFile.info.colcount}. Maximum supported size is ${MAX_MAP_DIMENSION}x${MAX_MAP_DIMENSION}`
        );
        return;
      }

      // Validate tile data
      if (datFile.tiles.length !== datFile.info.rowcount) {
        webview.html = this.getErrorHtml(
          `Map data mismatch: Expected ${datFile.info.rowcount} rows but found ${datFile.tiles.length}`
        );
        return;
      }

      webview.html = this.getHtmlContent(webview, datFile.tiles, datFile.info);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      webview.html = this.getErrorHtml(errorMessage);
    }
  }

  private getHtmlContent(
    webview: vscode.Webview,
    tiles: number[][],
    info: { rowcount: number; colcount: number }
  ): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'mapEditor.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'mapEditor.css')
    );

    // Get tile colors for palette
    const tileColors: { [key: number]: string } = {};
    const commonTiles = [1, 6, 11, 26, 30, 34, 38, 40, 42, 46, 50];
    for (const tileId of commonTiles) {
      const color = getTileColor(tileId);
      tileColors[tileId] = `rgb(${color.r}, ${color.g}, ${color.b})`;
    }

    // Get saved patterns
    const patterns = this.context.workspaceState.get<TilePattern[]>('tilePatterns', []);

    // Initialize layers for this document
    const documentUri = webview.toString();
    if (!this.layers.has(documentUri)) {
      const baseLayer: MapLayer = {
        id: 'base',
        name: 'Base Layer',
        tiles: tiles,
        visible: true,
        opacity: 1.0,
        locked: false,
        blendMode: 'normal',
      };
      this.layers.set(documentUri, [baseLayer]);
    }
    const layers = this.layers.get(documentUri) || [];

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Map Editor</title>
      <link href="${styleUri}" rel="stylesheet">
    </head>
    <body>
      <div id="container">
        <div id="toolbar">
          <h2>Map Editor</h2>
          <div class="tool-group">
            <label>Tool:</label>
            <button class="tool-btn active" data-tool="paint" title="Paint (P)">🖌️ Paint</button>
            <button class="tool-btn" data-tool="fill" title="Fill (F)">🪣 Fill</button>
            <button class="tool-btn" data-tool="line" title="Line (L)">📏 Line</button>
            <button class="tool-btn" data-tool="rectangle" title="Rectangle (R)">⬜ Rectangle</button>
            <button class="tool-btn" data-tool="picker" title="Picker (K)">💉 Picker</button>
            <button class="tool-btn" data-tool="select" title="Select (S)">⬛ Select</button>
            <button class="tool-btn" data-tool="stamp" title="Stamp (T)">🎨 Stamp</button>
          </div>
          
          <div class="tool-group">
            <label>Brush Size:</label>
            <input type="range" id="brushSize" min="1" max="10" value="1">
            <span id="brushSizeDisplay">1</span>
          </div>
          
          <div class="tool-group">
            <label>Selected Tile:</label>
            <div id="selectedTile" class="tile-preview" style="background-color: ${tileColors[1]}"></div>
            <span id="selectedTileId">1 - Ground</span>
          </div>
          
          <div class="tool-group">
            <button id="undoBtn" title="Undo (Ctrl+Z)">↶ Undo</button>
            <button id="redoBtn" title="Redo (Ctrl+Y)">↷ Redo</button>
          </div>
          
          <div class="tool-group">
            <button id="copyBtn" title="Copy (Ctrl+C)" disabled>📋 Copy</button>
            <button id="pasteBtn" title="Paste (Ctrl+V)" disabled>📄 Paste</button>
            <button id="deleteBtn" title="Delete (Delete)" disabled>🗑️ Delete</button>
            <button id="moveBtn" title="Move (M)" disabled>↔️ Move</button>
          </div>
          
          <div class="tool-group">
            <button id="zoomInBtn" title="Zoom In (+)">🔍+</button>
            <button id="zoomOutBtn" title="Zoom Out (-)">🔍-</button>
            <button id="zoomResetBtn" title="Reset Zoom (0)">🔍 100%</button>
            <span id="zoomLevel">100%</span>
          </div>
          
          <div class="tool-group">
            <button id="gridToggleBtn" class="active" title="Toggle Grid (G)">⊞ Grid</button>
          </div>
          
          <div class="tool-group">
            <button id="exportBtn" title="Export Map (E)">💾 Export</button>
          </div>
          
          <div class="tool-group">
            <label>Mirror:</label>
            <button class="mirror-btn active" data-mirror="off" title="No Mirror">Off</button>
            <button class="mirror-btn" data-mirror="horizontal" title="Mirror Horizontally">↔️</button>
            <button class="mirror-btn" data-mirror="vertical" title="Mirror Vertically">↕️</button>
            <button class="mirror-btn" data-mirror="both" title="Mirror Both Ways">✢</button>
          </div>
          
          <div class="tool-group">
            <button id="autoTileBtn" title="Toggle Auto-Tiling (A)">🔧 Auto-Tile</button>
          </div>
          
          <div class="tool-group">
            <button id="validateBtn" title="Validate Map (V)">✓ Validate</button>
          </div>
          
          <div class="tool-group">
            <button id="templateBtn" title="Map Templates (T)">📋 Templates</button>
          </div>
          
          <div class="coordinates">
            <span id="coords">Row: -, Col: -</span>
          </div>
        </div>
        
        <div id="mainContent">
          <div id="palette">
            <h3>Tile Palette</h3>
            <div id="tileList">
              ${commonTiles
                .map(
                  tileId => `
                <div class="palette-tile ${tileId === 1 ? 'selected' : ''}" 
                     data-tile-id="${tileId}"
                     style="background-color: ${tileColors[tileId]}"
                     title="${getTileName(tileId)}">
                  <span class="tile-id">${tileId}</span>
                </div>
              `
                )
                .join('')}
            </div>
            <input type="number" id="customTileId" min="1" max="115" placeholder="Custom ID">
            <button id="addCustomTile">Add Custom</button>
            
            <h3>Minimap</h3>
            <div id="minimapContainer">
              <canvas id="minimap"></canvas>
              <div id="minimapViewport"></div>
            </div>
            
            <h3>Tile Patterns</h3>
            <div id="patternsSection">
              <button id="savePatternBtn" title="Save current selection as pattern" disabled>💾 Save Pattern</button>
              <div id="patternsList"></div>
            </div>
            
            <h3>Layers</h3>
            <div id="layersSection">
              <button id="addLayerBtn" title="Add new layer">➕ New Layer</button>
              <div id="layersList"></div>
            </div>
          </div>
          
          <div id="mapContainer">
            <div id="mapViewport">
              <canvas id="mapCanvas"></canvas>
              <canvas id="overlayCanvas"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <div class="progress-overlay" id="progressOverlay">
        <div class="progress-content">
          <div class="progress-spinner"></div>
          <div id="progressText">Processing...</div>
        </div>
      </div>
      
      <div class="status-message" id="statusMessage"></div>
      
      <script>
        const vscode = acquireVsCodeApi();
        const tiles = ${JSON.stringify(tiles)};
        const rows = ${info.rowcount};
        const cols = ${info.colcount};
        const tileColors = ${JSON.stringify(tileColors)};
        let savedPatterns = ${JSON.stringify(patterns)};
        let mapLayers = ${JSON.stringify(layers)};
        let currentLayerId = 'base';
      </script>
      
      <!-- Template Gallery -->
      <div class="template-gallery" id="templateGallery">
        <div class="template-gallery-content">
          <div class="template-header">
            <h2>Map Templates</h2>
            <button class="template-close" id="templateClose">&times;</button>
          </div>
          <div class="template-body">
            <div class="template-categories" id="templateCategories">
              <div class="template-category active" data-category="all">
                <span class="template-category-icon">📋</span>
                <span>All Templates</span>
              </div>
              <div class="template-category" data-category="tutorial">
                <span class="template-category-icon">🎓</span>
                <span>Tutorial</span>
              </div>
              <div class="template-category" data-category="combat">
                <span class="template-category-icon">⚔️</span>
                <span>Combat</span>
              </div>
              <div class="template-category" data-category="puzzle">
                <span class="template-category-icon">🧩</span>
                <span>Puzzle</span>
              </div>
              <div class="template-category" data-category="exploration">
                <span class="template-category-icon">🗺️</span>
                <span>Exploration</span>
              </div>
              <div class="template-category" data-category="resource">
                <span class="template-category-icon">💎</span>
                <span>Resource</span>
              </div>
              <div class="template-category" data-category="custom">
                <span class="template-category-icon">⭐</span>
                <span>Custom</span>
              </div>
            </div>
            <div class="template-grid" id="templateGrid">
              <!-- Templates will be inserted here -->
            </div>
          </div>
        </div>
      </div>
      
      <!-- Template Details Panel -->
      <div class="template-details" id="templateDetails">
        <div class="template-details-header">
          <h3 id="templateDetailsTitle">Template Details</h3>
          <button class="template-details-close" id="templateDetailsClose">&times;</button>
        </div>
        <div class="template-details-content">
          <div class="template-preview-large" id="templatePreviewLarge">
            <canvas id="templatePreviewCanvas"></canvas>
          </div>
          <div class="template-section">
            <h4>Description</h4>
            <p id="templateDetailsDescription"></p>
          </div>
          <div class="template-section">
            <h4>Objectives</h4>
            <ul class="template-objectives-list" id="templateDetailsObjectives"></ul>
          </div>
          <div class="template-section">
            <h4>Map Properties</h4>
            <div id="templateDetailsProperties"></div>
          </div>
        </div>
        <div class="template-actions">
          <button class="template-use-btn" id="templateUseBtn">Use Template</button>
          <button class="template-customize-btn" id="templateCustomizeBtn">Customize</button>
        </div>
      </div>
      
      <!-- Save as Template Dialog -->
      <div class="save-template-dialog" id="saveTemplateDialog" style="display: none;">
        <div class="save-template-content">
          <h3>Save as Template</h3>
          <div class="save-template-field">
            <label for="templateName">Template Name</label>
            <input type="text" id="templateName" placeholder="My Custom Template">
          </div>
          <div class="save-template-field">
            <label for="templateDescription">Description</label>
            <textarea id="templateDescription" placeholder="Describe your template..."></textarea>
          </div>
          <div class="save-template-field">
            <label for="templateObjectives">Objectives (one per line)</label>
            <textarea id="templateObjectives" placeholder="Collect 10 crystals&#10;Build a base&#10;Defeat all enemies"></textarea>
          </div>
          <div class="save-template-buttons">
            <button class="save-template-save" id="saveTemplateConfirm">Save Template</button>
            <button class="save-template-cancel" id="saveTemplateCancel">Cancel</button>
          </div>
        </div>
      </div>
      
      <script src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  private async handleGetTemplates(webview: vscode.Webview): Promise<void> {
    try {
      const templates = MapTemplateManager.getAllTemplates();
      webview.postMessage({
        type: 'templates',
        templates: templates.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          difficulty: t.difficulty,
          size: t.size,
          tiles: t.tiles,
          objectives: t.objectives,
          info: t.info,
        })),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error loading templates: ${errorMessage}`);
    }
  }

  private async handleUseTemplate(
    document: vscode.TextDocument,
    webview: vscode.Webview,
    template: MapTemplate
  ): Promise<void> {
    try {
      const parser = new DatFileParser(document.getText());
      const datFile = parser.parse();

      // Update map dimensions
      datFile.info.rowcount = template.size.rows;
      datFile.info.colcount = template.size.cols;

      // Update tiles
      datFile.tiles = template.tiles;

      // Note: Template objectives are simple strings, not parsed Objective types
      // They would need to be parsed properly to convert to Objective[] type

      // Update info section if template has additional info
      if (template.info) {
        Object.assign(datFile.info, template.info);
      }

      // Convert back to .dat format
      const newContent = this.serializeDatFile(datFile);

      // Apply the edit
      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), newContent);

      await vscode.workspace.applyEdit(edit);

      // Notify webview
      webview.postMessage({
        type: 'templateLoaded',
        tiles: template.tiles,
      });

      vscode.window.showInformationMessage(`Template "${template.name}" loaded successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error using template: ${errorMessage}`);
    }
  }

  private async handleSaveAsTemplate(
    webview: vscode.Webview,
    name: string,
    description: string,
    objectives: string[],
    tiles: number[][]
  ): Promise<void> {
    try {
      const template = MapTemplateManager.createCustomTemplate(
        name,
        description,
        tiles,
        objectives
      );

      // Save to workspace state
      const context = (this as any).context;
      if (context) {
        const savedTemplates = context.workspaceState.get('customTemplates', []) as MapTemplate[];
        savedTemplates.push(template);
        await context.workspaceState.update('customTemplates', savedTemplates);

        // Add to template manager
        MapTemplateManager.addTemplate(template);
      }

      webview.postMessage({
        type: 'templateSaved',
      });

      vscode.window.showInformationMessage(`Template "${name}" saved successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Error saving template: ${errorMessage}`);
    }
  }

  private serializeDatFile(datFile: any): string {
    let content = '';

    // Info section
    content += '[info]\n';
    content += `rowcount:${datFile.info.rowcount}\n`;
    content += `colcount:${datFile.info.colcount}\n`;
    if (datFile.info.camerapos) {
      content += `camerapos:${datFile.info.camerapos}\n`;
    }
    if (datFile.info.biome) {
      content += `biome:${datFile.info.biome}\n`;
    }
    if (datFile.info.creator) {
      content += `creator:${datFile.info.creator}\n`;
    }
    content += '\n';

    // Tiles section
    content += '[tiles]\n';
    for (const row of datFile.tiles) {
      content += row.join(',') + '\n';
    }
    content += '\n';

    // Height section (if exists)
    if (datFile.height && datFile.height.length > 0) {
      content += '[height]\n';
      for (const row of datFile.height) {
        content += row.join(',') + '\n';
      }
      content += '\n';
    }

    // Objectives section (handle both parsed Objective[] and string[])
    if (datFile.objectives && datFile.objectives.length > 0) {
      content += '[objectives]\n';
      // Check if objectives are already strings or need to be serialized
      const objectiveStrings = datFile.objectives.map((obj: any) => {
        if (typeof obj === 'string') {
          return obj;
        }
        // Handle parsed objective objects - simplified serialization
        return JSON.stringify(obj);
      });
      content += objectiveStrings.join('\n') + '\n';
      content += '\n';
    }

    // Buildings section (if exists)
    if (datFile.buildings && datFile.buildings.length > 0) {
      content += '[buildings]\n';
      content += datFile.buildings.join('\n') + '\n';
      content += '\n';
    }

    // Script section (if exists)
    if (datFile.script) {
      content += '[script]\n';
      content += datFile.script + '\n';
    }

    return content;
  }

  private getErrorHtml(message: string): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Map Editor - Error</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          background: #1e1e1e;
          color: #cccccc;
        }
        .error {
          background: #2d2d2d;
          border: 1px solid #f44747;
          border-radius: 8px;
          padding: 20px;
          max-width: 500px;
        }
        h2 { color: #f44747; margin-top: 0; }
      </style>
    </head>
    <body>
      <div class="error">
        <h2>Error Loading Map</h2>
        <p>${message}</p>
      </div>
    </body>
    </html>`;
  }
}
