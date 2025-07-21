import * as vscode from 'vscode';
import { DatFileParser } from '../parser/datFileParser';
import { MapValidator } from '../validation/mapValidator';

export interface MapValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  position?: { row: number; col: number };
  area?: Array<{ row: number; col: number }>;
  severity: vscode.DiagnosticSeverity;
  category: ValidationCategory;
}

export enum ValidationCategory {
  STRUCTURE = 'structure',
  TILES = 'tiles',
  ACCESSIBILITY = 'accessibility',
  RESOURCES = 'resources',
  OBJECTIVES = 'objectives',
  BUILDINGS = 'buildings',
  SPAWN_POINTS = 'spawn_points',
  HAZARDS = 'hazards',
  PERFORMANCE = 'performance',
}

export interface MapValidationResult {
  issues: MapValidationIssue[];
  statistics: MapStatistics;
  suggestions: MapSuggestion[];
}

export interface MapStatistics {
  totalTiles: number;
  walkableArea: number;
  wallArea: number;
  resourceCount: {
    crystals: number;
    ore: number;
    rechargeSeams: number;
  };
  hazardCount: {
    lava: number;
    water: number;
    erosion: number;
  };
  buildingCount: number;
  spawnPointCount: number;
  largestConnectedArea: number;
  isolatedAreas: number;
}

export interface MapSuggestion {
  type: 'improvement' | 'optimization' | 'balance';
  message: string;
  priority: 'low' | 'medium' | 'high';
  autoFixAvailable?: boolean;
  autoFixAction?: () => void;
}

export class MapEditorValidator extends MapValidator {
  private editorTiles: number[][] = [];
  private editorRowCount: number = 0;
  private editorColCount: number = 0;
  private editorParser: DatFileParser;

  constructor(document: vscode.TextDocument) {
    super(document);
    this.editorParser = new DatFileParser(document.getText());
    this.parseEditorTiles();
  }

  private parseEditorTiles(): void {
    const tilesSection = this.editorParser.getSection('tiles');
    if (!tilesSection) {
      return;
    }

    const infoSection = this.editorParser.getSection('info');
    if (infoSection) {
      const rowMatch = infoSection.content.match(/rowcount:\s*(\d+)/);
      const colMatch = infoSection.content.match(/colcount:\s*(\d+)/);
      if (rowMatch) {
        this.editorRowCount = parseInt(rowMatch[1], 10);
      }
      if (colMatch) {
        this.editorColCount = parseInt(colMatch[1], 10);
      }
    }

    this.editorTiles = tilesSection.content
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .map((line: string) =>
        line
          .split(',')
          .filter((tile: string) => tile.trim().length > 0)
          .map((tile: string) => parseInt(tile.trim(), 10))
      );
  }

  public async validateForEditor(): Promise<MapValidationResult> {
    const baseResult = await this.validate();
    const issues: MapValidationIssue[] = [];

    // Convert base validation results to editor format
    for (const error of baseResult.errors) {
      issues.push({
        type: 'error',
        message: error.message,
        position:
          error.line !== undefined ? { row: error.line, col: error.column || 0 } : undefined,
        severity: error.severity,
        category: this.categorizeIssue(error.message),
      });
    }

    for (const warning of baseResult.warnings) {
      issues.push({
        type: 'warning',
        message: warning.message,
        position:
          warning.line !== undefined ? { row: warning.line, col: warning.column || 0 } : undefined,
        severity: warning.severity,
        category: this.categorizeIssue(warning.message),
      });
    }

    // Add enhanced validations
    issues.push(...this.validateSpawnPoints());
    issues.push(...this.validateHazards());
    issues.push(...this.validatePerformance());
    issues.push(...this.validateBalance());

    // Generate statistics
    const statistics = this.generateStatistics();

    // Generate suggestions
    const suggestions = this.generateSuggestions(issues, statistics);

    return { issues, statistics, suggestions };
  }

  private categorizeIssue(message: string): ValidationCategory {
    if (message.includes('tile') || message.includes('Tile')) {
      return ValidationCategory.TILES;
    }
    if (message.includes('reach') || message.includes('path') || message.includes('isolated')) {
      return ValidationCategory.ACCESSIBILITY;
    }
    if (message.includes('resource') || message.includes('crystal') || message.includes('ore')) {
      return ValidationCategory.RESOURCES;
    }
    if (message.includes('objective')) {
      return ValidationCategory.OBJECTIVES;
    }
    if (message.includes('building') || message.includes('Building')) {
      return ValidationCategory.BUILDINGS;
    }
    if (message.includes('spawn') || message.includes('Tool Store')) {
      return ValidationCategory.SPAWN_POINTS;
    }
    return ValidationCategory.STRUCTURE;
  }

  private validateSpawnPoints(): MapValidationIssue[] {
    const issues: MapValidationIssue[] = [];
    const toolStores = this.findEditorTilePositions(101); // Tool Store tile

    if (toolStores.length === 0) {
      issues.push({
        type: 'error',
        message: 'No Tool Store (spawn point) found. Players need at least one spawn point.',
        severity: vscode.DiagnosticSeverity.Error,
        category: ValidationCategory.SPAWN_POINTS,
      });
    } else if (toolStores.length > 1) {
      issues.push({
        type: 'info',
        message: `Multiple Tool Stores found (${toolStores.length}). Consider if all are necessary.`,
        severity: vscode.DiagnosticSeverity.Information,
        category: ValidationCategory.SPAWN_POINTS,
      });
    }

    // Check spawn point accessibility
    for (const store of toolStores) {
      const surroundingWalkable = this.countWalkableTilesAround(store.row, store.col, 2);
      if (surroundingWalkable < 8) {
        issues.push({
          type: 'warning',
          message:
            'Tool Store has limited surrounding space. Players may have difficulty starting.',
          position: store,
          severity: vscode.DiagnosticSeverity.Warning,
          category: ValidationCategory.SPAWN_POINTS,
        });
      }
    }

    return issues;
  }

  private validateHazards(): MapValidationIssue[] {
    const issues: MapValidationIssue[] = [];

    // Check lava placement
    const lavaTiles = this.findEditorTilePositions([6, 7, 8, 9, 10]);
    const lavaGroups = this.groupConnectedEditorTiles(lavaTiles);

    for (const group of lavaGroups) {
      if (group.length < 3) {
        issues.push({
          type: 'warning',
          message: 'Small lava pool detected. Consider expanding for better visual impact.',
          position: group[0],
          area: group,
          severity: vscode.DiagnosticSeverity.Information,
          category: ValidationCategory.HAZARDS,
        });
      }
    }

    // Check water placement
    const waterTiles = this.findEditorTilePositions([11, 12, 13, 14, 15, 16]);
    const waterGroups = this.groupConnectedEditorTiles(waterTiles);

    for (const group of waterGroups) {
      if (group.length === 1) {
        issues.push({
          type: 'warning',
          message: 'Single water tile detected. Water usually looks better in groups.',
          position: group[0],
          severity: vscode.DiagnosticSeverity.Information,
          category: ValidationCategory.HAZARDS,
        });
      }
    }

    // Check hazard proximity to spawn
    const toolStores = this.findEditorTilePositions(101);
    for (const store of toolStores) {
      const nearbyHazards = [...lavaTiles, ...waterTiles].filter(
        hazard => this.getEditorDistance(store, hazard) < 5
      );

      if (nearbyHazards.length > 0) {
        issues.push({
          type: 'warning',
          message: 'Hazards detected near spawn point. Consider moving them further away.',
          position: store,
          severity: vscode.DiagnosticSeverity.Warning,
          category: ValidationCategory.HAZARDS,
        });
      }
    }

    return issues;
  }

  private validatePerformance(): MapValidationIssue[] {
    const issues: MapValidationIssue[] = [];

    // Check map size
    const totalTiles = this.editorRowCount * this.editorColCount;
    if (totalTiles > 40000) {
      issues.push({
        type: 'warning',
        message: `Large map detected (${this.editorRowCount}x${this.editorColCount}). May impact game performance.`,
        severity: vscode.DiagnosticSeverity.Warning,
        category: ValidationCategory.PERFORMANCE,
      });
    }

    // Check entity density
    const buildingTiles = this.countEditorTiles([101, 102, 103, 104, 105, 106, 107, 108, 109, 110]);
    const entityDensity = buildingTiles / totalTiles;

    if (entityDensity > 0.1) {
      issues.push({
        type: 'warning',
        message: 'High building density detected. May impact pathfinding performance.',
        severity: vscode.DiagnosticSeverity.Information,
        category: ValidationCategory.PERFORMANCE,
      });
    }

    // Check for complex geometry
    // Wall tiles count is used to determine overall complexity - not used directly
    const wallComplexity = this.calculateWallComplexity();

    if (wallComplexity > 0.7) {
      issues.push({
        type: 'info',
        message: 'Complex wall patterns detected. Consider simplifying for better performance.',
        severity: vscode.DiagnosticSeverity.Information,
        category: ValidationCategory.PERFORMANCE,
      });
    }

    return issues;
  }

  private validateBalance(): MapValidationIssue[] {
    const issues: MapValidationIssue[] = [];

    // Check resource distribution
    const crystalCount = this.countEditorTiles([42, 43, 44, 45]);
    const oreCount = this.countEditorTiles([46, 47, 48, 49]);
    // Recharge seams tracked in statistics but not used for balance warnings

    if (crystalCount === 0) {
      issues.push({
        type: 'warning',
        message: 'No crystal deposits found. Players need crystals for most buildings.',
        severity: vscode.DiagnosticSeverity.Warning,
        category: ValidationCategory.RESOURCES,
      });
    }

    const resourceRatio = oreCount > 0 ? crystalCount / oreCount : 0;
    if (resourceRatio > 3 || resourceRatio < 0.33) {
      issues.push({
        type: 'info',
        message: `Unbalanced resource ratio (${crystalCount} crystals : ${oreCount} ore). Consider adjusting.`,
        severity: vscode.DiagnosticSeverity.Information,
        category: ValidationCategory.RESOURCES,
      });
    }

    // Check difficulty curve
    const easyResources = this.findResourcesNearSpawn(10);
    const totalResources = crystalCount + oreCount;

    if (easyResources.length / totalResources > 0.5) {
      issues.push({
        type: 'info',
        message: 'Most resources are near spawn. Consider spreading them out for progression.',
        severity: vscode.DiagnosticSeverity.Information,
        category: ValidationCategory.RESOURCES,
      });
    }

    return issues;
  }

  private generateStatistics(): MapStatistics {
    const totalTiles = this.editorRowCount * this.editorColCount;
    const walkableTiles = [1, 4, 8, 13, 51, 54, 58, 63];
    const wallTiles = Array.from({ length: 50 }, (_, i) => i + 30); // Tiles 30-79 are various walls

    const walkableCount = this.countEditorTiles(walkableTiles);
    const wallCount = this.countEditorTiles(wallTiles);

    const connectedAreas = this.findAllConnectedAreas();
    const largestArea = Math.max(...connectedAreas.map(area => area.length), 0);

    return {
      totalTiles,
      walkableArea: walkableCount,
      wallArea: wallCount,
      resourceCount: {
        crystals: this.countEditorTiles([42, 43, 44, 45]),
        ore: this.countEditorTiles([46, 47, 48, 49]),
        rechargeSeams: this.countEditorTiles([50]),
      },
      hazardCount: {
        lava: this.countEditorTiles([6, 7, 8, 9, 10]),
        water: this.countEditorTiles([11, 12, 13, 14, 15, 16]),
        erosion: this.countEditorTiles([25]), // Erosion tile
      },
      buildingCount: this.countEditorTiles([101, 102, 103, 104, 105, 106, 107, 108, 109, 110]),
      spawnPointCount: this.countEditorTiles([101]),
      largestConnectedArea: largestArea,
      isolatedAreas: connectedAreas.filter(area => area.length < 10).length,
    };
  }

  private generateSuggestions(
    _issues: MapValidationIssue[],
    stats: MapStatistics
  ): MapSuggestion[] {
    const suggestions: MapSuggestion[] = [];

    // Accessibility suggestions
    if (stats.isolatedAreas > 0) {
      suggestions.push({
        type: 'improvement',
        message: `Connect ${stats.isolatedAreas} isolated areas to the main map for better gameplay.`,
        priority: 'high',
      });
    }

    // Resource balance suggestions
    const totalResources = stats.resourceCount.crystals + stats.resourceCount.ore;
    if (totalResources < 20) {
      suggestions.push({
        type: 'balance',
        message: 'Consider adding more resources to extend gameplay duration.',
        priority: 'medium',
      });
    }

    // Hazard suggestions
    if (stats.hazardCount.lava + stats.hazardCount.water === 0) {
      suggestions.push({
        type: 'improvement',
        message: 'Consider adding environmental hazards for more challenging gameplay.',
        priority: 'low',
      });
    }

    // Performance suggestions
    if (stats.wallArea / stats.totalTiles > 0.7) {
      suggestions.push({
        type: 'optimization',
        message: 'High wall density detected. Consider opening up more areas.',
        priority: 'medium',
      });
    }

    // Spawn point suggestions
    if (stats.spawnPointCount === 0) {
      suggestions.push({
        type: 'improvement',
        message: 'Add at least one Tool Store as a spawn point for players.',
        priority: 'high',
        autoFixAvailable: true,
      });
    }

    return suggestions;
  }

  // Helper methods
  private findEditorTilePositions(tileIds: number | number[]): Array<{ row: number; col: number }> {
    const positions: Array<{ row: number; col: number }> = [];
    const ids = Array.isArray(tileIds) ? tileIds : [tileIds];

    for (let row = 0; row < this.editorTiles.length; row++) {
      for (let col = 0; col < this.editorTiles[row].length; col++) {
        if (ids.includes(this.editorTiles[row][col])) {
          positions.push({ row, col });
        }
      }
    }

    return positions;
  }

  private countEditorTiles(tileIds: number[]): number {
    let count = 0;
    for (const row of this.editorTiles) {
      for (const tile of row) {
        if (tileIds.includes(tile)) {
          count++;
        }
      }
    }
    return count;
  }

  private countWalkableTilesAround(centerRow: number, centerCol: number, radius: number): number {
    const walkableTiles = [1, 4, 8, 13, 51, 54, 58, 63];
    let count = 0;

    for (let r = -radius; r <= radius; r++) {
      for (let c = -radius; c <= radius; c++) {
        if (r === 0 && c === 0) {
          continue;
        }

        const row = centerRow + r;
        const col = centerCol + c;

        if (
          row >= 0 &&
          row < this.editorTiles.length &&
          col >= 0 &&
          col < this.editorTiles[row].length
        ) {
          if (walkableTiles.includes(this.editorTiles[row][col])) {
            count++;
          }
        }
      }
    }

    return count;
  }

  private groupConnectedEditorTiles(
    positions: Array<{ row: number; col: number }>
  ): Array<Array<{ row: number; col: number }>> {
    const groups: Array<Array<{ row: number; col: number }>> = [];
    const visited = new Set<string>();

    for (const pos of positions) {
      const key = `${pos.row},${pos.col}`;
      if (!visited.has(key)) {
        const group = this.floodFillEditorPositions(pos, positions, visited);
        if (group.length > 0) {
          groups.push(group);
        }
      }
    }

    return groups;
  }

  private floodFillEditorPositions(
    start: { row: number; col: number },
    allPositions: Array<{ row: number; col: number }>,
    visited: Set<string>
  ): Array<{ row: number; col: number }> {
    const group: Array<{ row: number; col: number }> = [];
    const queue = [start];
    const positionSet = new Set(allPositions.map(p => `${p.row},${p.col}`));

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.row},${current.col}`;

      if (visited.has(key)) {
        continue;
      }

      visited.add(key);
      group.push(current);

      // Check 4-directional neighbors
      const neighbors = [
        { row: current.row - 1, col: current.col },
        { row: current.row + 1, col: current.col },
        { row: current.row, col: current.col - 1 },
        { row: current.row, col: current.col + 1 },
      ];

      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.row},${neighbor.col}`;
        if (positionSet.has(neighborKey) && !visited.has(neighborKey)) {
          queue.push(neighbor);
        }
      }
    }

    return group;
  }

  private getEditorDistance(
    pos1: { row: number; col: number },
    pos2: { row: number; col: number }
  ): number {
    return Math.sqrt(Math.pow(pos2.row - pos1.row, 2) + Math.pow(pos2.col - pos1.col, 2));
  }

  private calculateWallComplexity(): number {
    // Calculate the ratio of wall edges to total walls
    const wallTiles = Array.from({ length: 50 }, (_, i) => i + 30);
    let wallCount = 0;
    let edgeCount = 0;

    for (let row = 0; row < this.editorTiles.length; row++) {
      for (let col = 0; col < this.editorTiles[row].length; col++) {
        if (wallTiles.includes(this.editorTiles[row][col])) {
          wallCount++;

          // Count edges (adjacent to non-wall)
          const neighbors = [
            { row: row - 1, col },
            { row: row + 1, col },
            { row, col: col - 1 },
            { row, col: col + 1 },
          ];

          for (const n of neighbors) {
            if (
              n.row >= 0 &&
              n.row < this.editorTiles.length &&
              n.col >= 0 &&
              n.col < this.editorTiles[n.row].length
            ) {
              if (!wallTiles.includes(this.editorTiles[n.row][n.col])) {
                edgeCount++;
                break;
              }
            }
          }
        }
      }
    }

    return wallCount > 0 ? edgeCount / wallCount : 0;
  }

  private findAllConnectedAreas(): Array<Array<{ row: number; col: number }>> {
    const walkableTiles = [1, 4, 8, 13, 51, 54, 58, 63];
    const visited = new Set<string>();
    const areas: Array<Array<{ row: number; col: number }>> = [];

    for (let row = 0; row < this.editorTiles.length; row++) {
      for (let col = 0; col < this.editorTiles[row].length; col++) {
        const key = `${row},${col}`;
        if (!visited.has(key) && walkableTiles.includes(this.editorTiles[row][col])) {
          const area: Array<{ row: number; col: number }> = [];
          const queue = [{ row, col }];

          while (queue.length > 0) {
            const current = queue.shift()!;
            const currentKey = `${current.row},${current.col}`;

            if (visited.has(currentKey)) {
              continue;
            }

            visited.add(currentKey);
            area.push(current);

            const neighbors = [
              { row: current.row - 1, col: current.col },
              { row: current.row + 1, col: current.col },
              { row: current.row, col: current.col - 1 },
              { row: current.row, col: current.col + 1 },
            ];

            for (const n of neighbors) {
              if (
                n.row >= 0 &&
                n.row < this.editorTiles.length &&
                n.col >= 0 &&
                n.col < this.editorTiles[n.row].length &&
                walkableTiles.includes(this.editorTiles[n.row][n.col])
              ) {
                queue.push(n);
              }
            }
          }

          if (area.length > 0) {
            areas.push(area);
          }
        }
      }
    }

    return areas;
  }

  private findResourcesNearSpawn(distance: number): Array<{ row: number; col: number }> {
    const spawnPoints = this.findEditorTilePositions(101);
    const resources = this.findEditorTilePositions([42, 43, 44, 45, 46, 47, 48, 49, 50]);
    const nearResources: Array<{ row: number; col: number }> = [];

    for (const spawn of spawnPoints) {
      for (const resource of resources) {
        if (this.getEditorDistance(spawn, resource) <= distance) {
          nearResources.push(resource);
        }
      }
    }

    return nearResources;
  }
}
