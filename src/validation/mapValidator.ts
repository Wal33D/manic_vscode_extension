import * as vscode from 'vscode';
import { DatFileParser } from '../parser/datFileParser';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  info: ValidationInfo[];
}

export interface ValidationError {
  type: 'error';
  message: string;
  line?: number;
  column?: number;
  severity: vscode.DiagnosticSeverity;
}

export interface ValidationWarning {
  type: 'warning';
  message: string;
  line?: number;
  column?: number;
  severity: vscode.DiagnosticSeverity;
}

export interface ValidationInfo {
  type: 'info';
  message: string;
  data?: unknown;
}

export class MapValidator {
  private parser: DatFileParser;
  private tiles: number[][] = [];
  private rowCount: number = 0;
  private colCount: number = 0;

  constructor(document: vscode.TextDocument) {
    this.parser = new DatFileParser(document.getText());
    this.parseTiles();
  }

  private parseTiles(): void {
    const tilesSection = this.parser.getSection('tiles');
    if (!tilesSection) {
      return;
    }

    const infoSection = this.parser.getSection('info');
    if (infoSection) {
      const rowMatch = infoSection.content.match(/rowcount:\s*(\d+)/);
      const colMatch = infoSection.content.match(/colcount:\s*(\d+)/);
      if (rowMatch) {
        this.rowCount = parseInt(rowMatch[1], 10);
      }
      if (colMatch) {
        this.colCount = parseInt(colMatch[1], 10);
      }
    }

    this.tiles = tilesSection.content
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .map((line: string) =>
        line
          .split(',')
          .filter((tile: string) => tile.trim().length > 0)
          .map((tile: string) => parseInt(tile.trim(), 10))
      );
  }

  public async validate(): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    // Basic structure validation
    this.validateStructure(errors, warnings);

    // Tile validation
    this.validateTiles(errors, warnings);

    // Pathfinding validation
    const pathfindingResults = this.validatePathfinding();
    errors.push(...pathfindingResults.errors);
    warnings.push(...pathfindingResults.warnings);
    info.push(...pathfindingResults.info);

    // Resource accessibility
    const resourceResults = this.validateResourceAccessibility();
    warnings.push(...resourceResults.warnings);
    info.push(...resourceResults.info);

    // Building placement validation
    const buildingResults = this.validateBuildingPlacements();
    warnings.push(...buildingResults.warnings);

    // Objective validation
    const objectiveResults = this.validateObjectives();
    errors.push(...objectiveResults.errors);
    warnings.push(...objectiveResults.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info,
    };
  }

  private validateStructure(errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Check if tiles section exists
    if (this.tiles.length === 0) {
      errors.push({
        type: 'error',
        message: 'No tiles section found',
        severity: vscode.DiagnosticSeverity.Error,
      });
      return;
    }

    // Check dimensions match
    if (this.rowCount > 0 && this.tiles.length !== this.rowCount) {
      warnings.push({
        type: 'warning',
        message: `Row count mismatch: expected ${this.rowCount}, found ${this.tiles.length}`,
        severity: vscode.DiagnosticSeverity.Warning,
      });
    }

    // Check column consistency
    const colCounts = new Set(this.tiles.map(row => row.length));
    if (colCounts.size > 1) {
      warnings.push({
        type: 'warning',
        message: 'Inconsistent column counts across rows',
        severity: vscode.DiagnosticSeverity.Warning,
      });
    }

    // Check if all rows match expected column count
    if (this.colCount > 0) {
      for (let i = 0; i < this.tiles.length; i++) {
        if (this.tiles[i].length !== this.colCount) {
          warnings.push({
            type: 'warning',
            message: `Row ${i} has ${this.tiles[i].length} columns, expected ${this.colCount}`,
            severity: vscode.DiagnosticSeverity.Warning,
          });
        }
      }
    }
  }

  private validateTiles(errors: ValidationError[], warnings: ValidationWarning[]): void {
    for (let row = 0; row < this.tiles.length; row++) {
      for (let col = 0; col < this.tiles[row].length; col++) {
        const tileId = this.tiles[row][col];

        // Check for invalid tile IDs
        if (isNaN(tileId) || tileId < 1 || tileId > 115) {
          errors.push({
            type: 'error',
            message: `Invalid tile ID ${tileId} at [${row}, ${col}]`,
            line: row,
            column: col,
            severity: vscode.DiagnosticSeverity.Error,
          });
        }

        // Check for deprecated tiles
        if ([16, 17, 18].includes(tileId)) {
          warnings.push({
            type: 'warning',
            message: `Deprecated tile ID ${tileId} at [${row}, ${col}]`,
            line: row,
            column: col,
            severity: vscode.DiagnosticSeverity.Warning,
          });
        }
      }
    }
  }

  private validatePathfinding(): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    info: ValidationInfo[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    // Find starting positions (Tool Stores, typically tile 101)
    const startPositions = this.findTilePositions(101);

    // Find objective positions (could be various tiles)
    const crystalPositions = this.findTilePositions([26, 27, 76, 77]); // Crystal seams
    const orePositions = this.findTilePositions([34, 35, 84, 85]); // Ore seams

    if (startPositions.length === 0) {
      warnings.push({
        type: 'warning',
        message: 'No Tool Store (starting position) found on map',
        severity: vscode.DiagnosticSeverity.Warning,
      });
      return { errors, warnings, info };
    }

    // Check pathfinding from start to resources
    const unreachableCrystals = this.findUnreachablePositions(startPositions, crystalPositions);
    const unreachableOres = this.findUnreachablePositions(startPositions, orePositions);

    if (unreachableCrystals.length > 0) {
      warnings.push({
        type: 'warning',
        message: `${unreachableCrystals.length} crystal seam(s) are unreachable from starting position`,
        severity: vscode.DiagnosticSeverity.Warning,
      });
    }

    if (unreachableOres.length > 0) {
      warnings.push({
        type: 'warning',
        message: `${unreachableOres.length} ore seam(s) are unreachable from starting position`,
        severity: vscode.DiagnosticSeverity.Warning,
      });
    }

    // Check for isolated areas
    const isolatedAreas = this.findIsolatedAreas();
    if (isolatedAreas.length > 0) {
      info.push({
        type: 'info',
        message: `Found ${isolatedAreas.length} isolated area(s) on the map`,
        data: isolatedAreas,
      });
    }

    return { errors, warnings, info };
  }

  private validateResourceAccessibility(): {
    warnings: ValidationWarning[];
    info: ValidationInfo[];
  } {
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    // Check if resources are blocked by reinforced walls
    const reinforcedWalls = [90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100];

    for (let row = 0; row < this.tiles.length; row++) {
      for (let col = 0; col < this.tiles[row].length; col++) {
        const tileId = this.tiles[row][col];

        // Check if it's a resource
        if ([26, 27, 34, 35, 42, 43, 46, 47].includes(tileId)) {
          // Check if surrounded by reinforced walls
          const neighbors = this.getNeighbors(row, col);
          const reinforcedCount = neighbors.filter(n =>
            reinforcedWalls.includes(this.tiles[n.row]?.[n.col])
          ).length;

          if (reinforcedCount >= 3) {
            warnings.push({
              type: 'warning',
              message: `Resource at [${row}, ${col}] is mostly surrounded by reinforced walls`,
              line: row,
              column: col,
              severity: vscode.DiagnosticSeverity.Warning,
            });
          }
        }
      }
    }

    // Count resources
    const crystalCount = this.countTiles([26, 27, 76, 77]);
    const oreCount = this.countTiles([34, 35, 84, 85]);
    const rechargeCount = this.countTiles([42, 43, 46, 47]);

    info.push({
      type: 'info',
      message: `Resources found: ${crystalCount} crystals, ${oreCount} ore, ${rechargeCount} recharge seams`,
    });

    return { warnings, info };
  }

  private validateBuildingPlacements(): { warnings: ValidationWarning[] } {
    const warnings: ValidationWarning[] = [];

    // Check for building tiles in invalid locations
    const buildingTiles = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110];

    for (let row = 0; row < this.tiles.length; row++) {
      for (let col = 0; col < this.tiles[row].length; col++) {
        const tileId = this.tiles[row][col];

        if (buildingTiles.includes(tileId)) {
          // Check if on edge of map
          if (
            row === 0 ||
            row === this.tiles.length - 1 ||
            col === 0 ||
            col === this.tiles[row].length - 1
          ) {
            warnings.push({
              type: 'warning',
              message: `Building at edge of map [${row}, ${col}] may cause issues`,
              line: row,
              column: col,
              severity: vscode.DiagnosticSeverity.Warning,
            });
          }
        }
      }
    }

    return { warnings };
  }

  private validateObjectives(): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const objectivesSection = this.parser.getSection('objectives');
    if (!objectivesSection) {
      warnings.push({
        type: 'warning',
        message: 'No objectives section found',
        severity: vscode.DiagnosticSeverity.Warning,
      });
      return { errors, warnings };
    }

    // Parse objectives and validate
    const objectives = objectivesSection.content.split('\n').filter(line => line.trim());

    if (objectives.length === 0) {
      warnings.push({
        type: 'warning',
        message: 'Objectives section is empty',
        severity: vscode.DiagnosticSeverity.Warning,
      });
    }

    // Check for common objective issues
    objectives.forEach((obj, index) => {
      if (obj.includes('collect') || obj.includes('Collect')) {
        const match = obj.match(/(\d+)/);
        if (match) {
          const amount = parseInt(match[1], 10);

          // Check if objective is achievable based on map resources
          if (obj.toLowerCase().includes('crystal')) {
            const crystalCount = this.countTiles([26, 27, 76, 77]);
            if (crystalCount < amount) {
              errors.push({
                type: 'error',
                message: `Objective requires ${amount} crystals but map only has ${crystalCount}`,
                line: index,
                severity: vscode.DiagnosticSeverity.Error,
              });
            }
          }
        }
      }
    });

    return { errors, warnings };
  }

  // Helper methods
  private findTilePositions(tileIds: number | number[]): Array<{ row: number; col: number }> {
    const positions: Array<{ row: number; col: number }> = [];
    const ids = Array.isArray(tileIds) ? tileIds : [tileIds];

    for (let row = 0; row < this.tiles.length; row++) {
      for (let col = 0; col < this.tiles[row].length; col++) {
        if (ids.includes(this.tiles[row][col])) {
          positions.push({ row, col });
        }
      }
    }

    return positions;
  }

  private findUnreachablePositions(
    starts: Array<{ row: number; col: number }>,
    targets: Array<{ row: number; col: number }>
  ): Array<{ row: number; col: number }> {
    const unreachable: Array<{ row: number; col: number }> = [];

    for (const target of targets) {
      let reachable = false;

      for (const start of starts) {
        if (this.hasPath(start, target)) {
          reachable = true;
          break;
        }
      }

      if (!reachable) {
        unreachable.push(target);
      }
    }

    return unreachable;
  }

  private hasPath(start: { row: number; col: number }, end: { row: number; col: number }): boolean {
    // Simple BFS pathfinding
    const visited = new Set<string>();
    const queue = [start];
    const walkableTiles = [1, 4, 8, 13, 51, 54, 58, 63]; // Ground and reinforced ground tiles

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.row},${current.col}`;

      if (visited.has(key)) {
        continue;
      }

      visited.add(key);

      if (current.row === end.row && current.col === end.col) {
        return true;
      }

      const neighbors = this.getNeighbors(current.row, current.col);
      for (const neighbor of neighbors) {
        const tile = this.tiles[neighbor.row]?.[neighbor.col];
        if (
          tile &&
          (walkableTiles.includes(tile) || (neighbor.row === end.row && neighbor.col === end.col))
        ) {
          queue.push(neighbor);
        }
      }
    }

    return false;
  }

  private findIsolatedAreas(): Array<{
    size: number;
    positions: Array<{ row: number; col: number }>;
  }> {
    const visited = new Set<string>();
    const areas: Array<{ size: number; positions: Array<{ row: number; col: number }> }> = [];
    const walkableTiles = [1, 4, 8, 13, 51, 54, 58, 63];

    for (let row = 0; row < this.tiles.length; row++) {
      for (let col = 0; col < this.tiles[row].length; col++) {
        const key = `${row},${col}`;
        const tile = this.tiles[row][col];

        if (!visited.has(key) && walkableTiles.includes(tile)) {
          const area = this.floodFill(row, col, visited, walkableTiles);
          if (area.length > 0 && area.length < 10) {
            // Small isolated areas
            areas.push({ size: area.length, positions: area });
          }
        }
      }
    }

    return areas;
  }

  private floodFill(
    startRow: number,
    startCol: number,
    visited: Set<string>,
    walkableTiles: number[]
  ): Array<{ row: number; col: number }> {
    const positions: Array<{ row: number; col: number }> = [];
    const queue = [{ row: startRow, col: startCol }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.row},${current.col}`;

      if (visited.has(key)) {
        continue;
      }

      visited.add(key);
      positions.push(current);

      const neighbors = this.getNeighbors(current.row, current.col);
      for (const neighbor of neighbors) {
        const tile = this.tiles[neighbor.row]?.[neighbor.col];
        if (tile && walkableTiles.includes(tile)) {
          queue.push(neighbor);
        }
      }
    }

    return positions;
  }

  private getNeighbors(row: number, col: number): Array<{ row: number; col: number }> {
    const neighbors: Array<{ row: number; col: number }> = [];
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]; // up, down, left, right

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;

      if (
        newRow >= 0 &&
        newRow < this.tiles.length &&
        newCol >= 0 &&
        newCol < this.tiles[newRow].length
      ) {
        neighbors.push({ row: newRow, col: newCol });
      }
    }

    return neighbors;
  }

  private countTiles(tileIds: number[]): number {
    let count = 0;

    for (const row of this.tiles) {
      for (const tile of row) {
        if (tileIds.includes(tile)) {
          count++;
        }
      }
    }

    return count;
  }
}
