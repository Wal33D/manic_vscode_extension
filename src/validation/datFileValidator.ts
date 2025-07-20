import { DatFile, ValidationError, InfoSection, Entity } from '../types/datFileTypes';
import { getTileInfo } from '../data/tileDefinitions';

export class DatFileValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];

  /**
   * Validate a complete DAT file
   */
  public validate(datFile: DatFile): ValidationError[] {
    this.errors = [];
    this.warnings = [];

    // Validate required sections
    this.validateInfo(datFile.info);
    this.validateTiles(datFile.tiles, datFile.info);
    this.validateHeight(datFile.height, datFile.info);

    // Validate optional sections
    if (datFile.resources) {
      this.validateResources(datFile.resources, datFile.info);
    }
    if (datFile.objectives) {
      this.validateObjectives(datFile);
    }
    if (datFile.buildings) {
      this.validateEntities(datFile.buildings, 'buildings', datFile.info);
    }
    if (datFile.vehicles) {
      this.validateEntities(datFile.vehicles, 'vehicles', datFile.info);
    }
    if (datFile.creatures) {
      this.validateEntities(datFile.creatures, 'creatures', datFile.info);
    }
    if (datFile.blocks) {
      this.validateGrid(datFile.blocks, datFile.info, 'blocks', true);
    }
    if (datFile.landslidefrequency) {
      this.validateGrid(
        datFile.landslidefrequency,
        datFile.info,
        'landslidefrequency',
        false,
        0,
        100
      );
    }
    if (datFile.lavaspread) {
      this.validateGrid(datFile.lavaspread, datFile.info, 'lavaspread');
    }

    return [...this.errors, ...this.warnings];
  }

  /**
   * Validate info section
   */
  private validateInfo(info: InfoSection): void {
    // Check required fields
    if (!info.rowcount || info.rowcount <= 0) {
      this.addError('rowcount must be a positive number', 0, 0, 'info');
    }
    if (!info.colcount || info.colcount <= 0) {
      this.addError('colcount must be a positive number', 0, 0, 'info');
    }

    // Check reasonable limits
    if (info.rowcount > 200) {
      this.addWarning('rowcount is very large (>200), may cause performance issues', 0, 0, 'info');
    }
    if (info.colcount > 200) {
      this.addWarning('colcount is very large (>200), may cause performance issues', 0, 0, 'info');
    }

    // Validate biome
    if (info.biome && !['rock', 'ice', 'lava'].includes(info.biome)) {
      this.addWarning(`Unknown biome type: ${info.biome}`, 0, 0, 'info');
    }

    // Validate numeric ranges
    if (info.spiderrate !== undefined && (info.spiderrate < 0 || info.spiderrate > 100)) {
      this.addError('spiderrate must be between 0 and 100', 0, 0, 'info');
    }
    if (info.oxygen !== undefined && info.oxygen < 0) {
      this.addError('oxygen cannot be negative', 0, 0, 'info');
    }
    if (info.initialcrystals !== undefined && info.initialcrystals < 0) {
      this.addError('initialcrystals cannot be negative', 0, 0, 'info');
    }
    if (info.initialore !== undefined && info.initialore < 0) {
      this.addError('initialore cannot be negative', 0, 0, 'info');
    }
  }

  /**
   * Validate tiles section
   */
  private validateTiles(tiles: number[][], info: InfoSection): void {
    this.validateGrid(tiles, info, 'tiles');

    // Check for unknown tile IDs
    const unknownTiles = new Set<number>();
    for (let row = 0; row < tiles.length; row++) {
      for (let col = 0; col < tiles[row].length; col++) {
        const tileId = tiles[row][col];
        if (!getTileInfo(tileId) && !unknownTiles.has(tileId)) {
          unknownTiles.add(tileId);
          this.addWarning(`Unknown tile ID: ${tileId}`, row, col, 'tiles');
        }
      }
    }

    // Check for required tiles
    let hasGround = false;

    for (const row of tiles) {
      for (const tileId of row) {
        const tileInfo = getTileInfo(tileId);
        if (tileInfo && tileInfo.canBuild) {
          hasGround = true;
        }
      }
    }

    if (!hasGround) {
      this.addError('Level must have at least one buildable ground tile', 0, 0, 'tiles');
    }
  }

  /**
   * Validate height section
   */
  private validateHeight(height: number[][], info: InfoSection): void {
    this.validateGrid(height, info, 'height');

    // Check for negative heights
    for (let row = 0; row < height.length; row++) {
      for (let col = 0; col < height[row].length; col++) {
        if (height[row][col] < 0) {
          this.addError(`Negative height value: ${height[row][col]}`, row, col, 'height');
        }
      }
    }
  }

  /**
   * Validate resources section
   */
  private validateResources(
    resources: { crystals?: number[][]; ore?: number[][] },
    info: InfoSection
  ): void {
    if (resources.crystals) {
      this.validateGrid(resources.crystals, info, 'resources.crystals', true);
    }
    if (resources.ore) {
      this.validateGrid(resources.ore, info, 'resources.ore', true);
    }
  }

  /**
   * Validate objectives
   */
  private validateObjectives(datFile: DatFile): void {
    if (!datFile.objectives || datFile.objectives.length === 0) {
      this.addWarning('No objectives defined for level', 0, 0, 'objectives');
      return;
    }

    for (const objective of datFile.objectives) {
      switch (objective.type) {
        case 'resources':
          if (objective.crystals < 0 || objective.ore < 0 || objective.studs < 0) {
            this.addError('Resource objectives cannot be negative', 0, 0, 'objectives');
          }
          // Check if objectives are achievable
          if (datFile.resources) {
            const totalCrystals = this.countResources(datFile.resources.crystals);
            const totalOre = this.countResources(datFile.resources.ore);

            if (objective.crystals > totalCrystals + (datFile.info.initialcrystals || 0)) {
              this.addWarning(
                `Crystal objective (${objective.crystals}) may exceed available crystals (${totalCrystals})`,
                0,
                0,
                'objectives'
              );
            }
            if (objective.ore > totalOre + (datFile.info.initialore || 0)) {
              this.addWarning(
                `Ore objective (${objective.ore}) may exceed available ore (${totalOre})`,
                0,
                0,
                'objectives'
              );
            }
          }
          break;
        case 'discovertile':
          if (
            objective.x < 0 ||
            objective.x >= datFile.info.colcount ||
            objective.y < 0 ||
            objective.y >= datFile.info.rowcount
          ) {
            this.addError(
              `Discover tile objective has invalid coordinates: ${objective.x},${objective.y}`,
              0,
              0,
              'objectives'
            );
          }
          break;
      }
    }
  }

  /**
   * Validate entities (buildings, vehicles, creatures, miners)
   */
  private validateEntities(entities: Entity[], section: string, info: InfoSection): void {
    for (const entity of entities) {
      // Check if coordinates are within map bounds
      const x = entity.coordinates.translation.x;
      const y = entity.coordinates.translation.y;

      // Convert world coordinates to grid coordinates
      const gridX = Math.floor(x / 150);
      const gridY = Math.floor(y / 150);

      if (gridX < 0 || gridX >= info.colcount || gridY < 0 || gridY >= info.rowcount) {
        this.addWarning(
          `${entity.type} is placed outside map bounds at (${gridX},${gridY})`,
          0,
          0,
          section
        );
      }
    }

    // Check for Tool Store in buildings
    if (section === 'buildings') {
      const hasToolStore = entities.some(e => e.type === 'BuildingToolStore_C');
      if (!hasToolStore) {
        this.addError('Level must have at least one Tool Store', 0, 0, 'buildings');
      }
    }
  }

  /**
   * Generic grid validation
   */
  private validateGrid(
    grid: number[][],
    info: InfoSection,
    section: string,
    binaryOnly: boolean = false,
    minValue?: number,
    maxValue?: number
  ): void {
    // Check dimensions
    if (grid.length !== info.rowcount) {
      this.addError(`${section} has ${grid.length} rows, expected ${info.rowcount}`, 0, 0, section);
    }

    for (let row = 0; row < grid.length; row++) {
      if (grid[row].length !== info.colcount) {
        this.addError(
          `${section} row ${row} has ${grid[row].length} columns, expected ${info.colcount}`,
          row,
          0,
          section
        );
      }

      // Check values
      for (let col = 0; col < grid[row].length; col++) {
        const value = grid[row][col];

        if (binaryOnly && value !== 0 && value !== 1) {
          this.addError(`${section} must contain only 0 or 1, found ${value}`, row, col, section);
        }

        if (minValue !== undefined && value < minValue) {
          this.addError(
            `${section} value ${value} is below minimum ${minValue}`,
            row,
            col,
            section
          );
        }

        if (maxValue !== undefined && value > maxValue) {
          this.addError(
            `${section} value ${value} is above maximum ${maxValue}`,
            row,
            col,
            section
          );
        }
      }
    }
  }

  /**
   * Count resources in a grid
   */
  private countResources(grid?: number[][]): number {
    if (!grid) {
      return 0;
    }
    let count = 0;
    for (const row of grid) {
      for (const value of row) {
        count += value;
      }
    }
    return count;
  }

  /**
   * Add an error
   */
  private addError(message: string, line: number, column: number, section?: string): void {
    this.errors.push({
      severity: 'error',
      message,
      line,
      column,
      section,
    });
  }

  /**
   * Add a warning
   */
  private addWarning(message: string, line: number, column: number, section?: string): void {
    this.warnings.push({
      severity: 'warning',
      message,
      line,
      column,
      section,
    });
  }
}
