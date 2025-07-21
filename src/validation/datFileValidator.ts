import {
  DatFile,
  ValidationError,
  InfoSection,
  Entity,
  BuildingType,
  ScriptSection,
} from '../types/datFileTypes';
import { getTileInfo } from '../data/tileDefinitions';
import {
  getEnhancedTileInfo,
  isReinforcedTile,
  getBaseTileId,
} from '../data/enhancedTileDefinitions';
import { getExtendedTileInfo } from '../data/extendedTileDefinitions';

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
    if (datFile.script) {
      this.validateScript(datFile.script);
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
    const reinforcedCount = new Map<number, number>();
    let hasSolidRock = false;
    let hasWater = false;
    let hasLava = false;
    let hasElectricFence = false;
    let hasRechargeSeam = false;

    for (let row = 0; row < tiles.length; row++) {
      for (let col = 0; col < tiles[row].length; col++) {
        const tileId = tiles[row][col];
        const tileInfo =
          getEnhancedTileInfo(tileId) || getTileInfo(tileId) || getExtendedTileInfo(tileId);

        if (!tileInfo && !unknownTiles.has(tileId)) {
          unknownTiles.add(tileId);
          this.addWarning(`Unknown tile ID: ${tileId}`, row, col, 'tiles');
        }

        // Track reinforced tiles
        if (isReinforcedTile(tileId)) {
          const baseTileId = getBaseTileId(tileId);
          reinforcedCount.set(baseTileId, (reinforcedCount.get(baseTileId) || 0) + 1);
        }

        // Track special tiles
        if (tileId === 38 || tileId === 88) {
          hasSolidRock = true;
        }
        if (tileId === 11 || tileId === 111) {
          hasWater = true;
        }
        if (tileId === 6 || tileId === 106) {
          hasLava = true;
        }
        if (tileId === 12 || tileId === 112) {
          hasElectricFence = true;
        }
        if ((tileId >= 50 && tileId <= 53) || (tileId >= 100 && tileId <= 103)) {
          hasRechargeSeam = true;
        }

        // Validate tile variants for walls and resources
        if (tileInfo && (tileInfo.category === 'wall' || tileInfo.category === 'resource')) {
          const variant = tileId % 4;
          if (variant < 0 || variant > 3) {
            this.addError(
              `Invalid variant for ${tileInfo.category} tile: ${tileId}`,
              row,
              col,
              'tiles'
            );
          }
        }

        // Advanced tile placement validation
        this.validateTilePlacement(tiles, row, col, tileId, tileInfo);
      }
    }

    // Check for required tiles
    let hasGround = false;

    for (const row of tiles) {
      for (const tileId of row) {
        const tileInfo =
          getEnhancedTileInfo(tileId) || getTileInfo(tileId) || getExtendedTileInfo(tileId);
        if (tileInfo && tileInfo.canBuild) {
          hasGround = true;
        }
      }
    }

    if (!hasGround) {
      this.addError('Level must have at least one buildable ground tile', 0, 0, 'tiles');
    }

    // Add informational warnings
    if (reinforcedCount.size > 0) {
      const totalReinforced = Array.from(reinforcedCount.values()).reduce((a, b) => a + b, 0);
      this.addWarning(
        `Level contains ${totalReinforced} reinforced tiles (harder difficulty)`,
        0,
        0,
        'tiles'
      );
    }

    if (hasSolidRock) {
      this.addWarning('Level contains solid rock tiles that cannot be drilled', 0, 0, 'tiles');
    }

    if (hasWater && !info.biome?.includes('ice')) {
      this.addWarning(
        'Level contains water - ensure vehicles have appropriate upgrades',
        0,
        0,
        'tiles'
      );
    }

    if (hasLava && info.biome !== 'lava') {
      this.addWarning('Level contains lava in non-lava biome', 0, 0, 'tiles');
    }

    if (hasElectricFence && !hasRechargeSeam) {
      this.addWarning(
        'Level has electric fences but no recharge seams to power them',
        0,
        0,
        'tiles'
      );
    }
  }

  /**
   * Validate tile placement rules
   */
  private validateTilePlacement(
    tiles: number[][],
    row: number,
    col: number,
    tileId: number,
    tileInfo: ReturnType<typeof getEnhancedTileInfo>
  ): void {
    // Check water tile placement
    if (tileId === 11 || tileId === 111) {
      const adjacentTiles = this.getAdjacentTiles(tiles, row, col);
      let hasShore = false;

      for (const adjacent of adjacentTiles) {
        const adjInfo =
          getEnhancedTileInfo(adjacent) || getTileInfo(adjacent) || getExtendedTileInfo(adjacent);
        if (adjInfo && (adjInfo.category === 'ground' || adjacent === 14 || adjacent === 114)) {
          hasShore = true;
          break;
        }
      }

      if (!hasShore) {
        this.addWarning('Water tile should be adjacent to shore/ground tiles', row, col, 'tiles');
      }
    }

    // Check lava tile placement
    if (tileId === 6 || tileId === 106) {
      const adjacentTiles = this.getAdjacentTiles(tiles, row, col);
      let hasEdge = false;

      for (const adjacent of adjacentTiles) {
        if (adjacent === 7 || adjacent === 107 || adjacent === 8 || adjacent === 108) {
          hasEdge = true;
          break;
        }
      }

      if (!hasEdge && adjacentTiles.some(adj => adj !== 6 && adj !== 106)) {
        this.addWarning(
          'Lava tile should have proper edge tiles when adjacent to non-lava',
          row,
          col,
          'tiles'
        );
      }
    }

    // Check resource seam shape variants
    if (tileInfo && tileInfo.category === 'resource') {
      const variant = tileId % 4;
      const expectedVariant = this.calculateExpectedVariant(tiles, row, col, tileId);

      if (variant !== expectedVariant) {
        this.addWarning(
          `Resource seam uses variant ${variant} but ${expectedVariant} would be more appropriate based on adjacent tiles`,
          row,
          col,
          'tiles'
        );
      }
    }
  }

  /**
   * Get adjacent tile IDs
   */
  private getAdjacentTiles(tiles: number[][], row: number, col: number): number[] {
    const adjacent: number[] = [];
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]; // N, S, W, E

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;

      if (newRow >= 0 && newRow < tiles.length && newCol >= 0 && newCol < tiles[newRow].length) {
        adjacent.push(tiles[newRow][newCol]);
      }
    }

    return adjacent;
  }

  /**
   * Calculate expected variant based on adjacent tiles
   */
  private calculateExpectedVariant(
    tiles: number[][],
    row: number,
    col: number,
    tileId: number
  ): number {
    const baseTileId = isReinforcedTile(tileId) ? getBaseTileId(tileId) : tileId;
    const baseType = Math.floor(baseTileId / 4) * 4; // Get base of variant group

    const adjacent = this.getAdjacentTiles(tiles, row, col);
    let connectionCount = 0;

    for (const adj of adjacent) {
      const adjBase = isReinforcedTile(adj) ? getBaseTileId(adj) : adj;
      if (Math.floor(adjBase / 4) * 4 === baseType) {
        connectionCount++;
      }
    }

    // Return variant based on connection count
    // 0 = regular, 1 = corner, 2 = edge, 3 = intersect
    if (connectionCount >= 3) {
      return 3;
    } // Intersect
    if (connectionCount === 2) {
      return 2;
    } // Edge
    if (connectionCount === 1) {
      return 1;
    } // Corner
    return 0; // Regular
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
        case 'findbuilding':
          if (
            objective.x < 0 ||
            objective.x >= datFile.info.colcount ||
            objective.y < 0 ||
            objective.y >= datFile.info.rowcount
          ) {
            this.addError(
              `Find building objective has invalid coordinates: ${objective.x},${objective.y}`,
              0,
              0,
              'objectives'
            );
          }
          break;
        case 'variable':
          // Check if condition seems valid
          if (!objective.condition || objective.condition.trim() === '') {
            this.addError('Variable objective has empty condition', 0, 0, 'objectives');
          } else {
            // Validate condition syntax and variable references
            this.validateObjectiveCondition(objective.condition, datFile);
          }
          break;
        case 'building': {
          // Check if building type is valid
          const validBuildings = Object.values(BuildingType);
          if (!validBuildings.includes(objective.building)) {
            this.addWarning(
              `Unknown building type in objective: ${objective.building}`,
              0,
              0,
              'objectives'
            );
          }
          break;
        }
      }
    }
  }

  /**
   * Validate entities (buildings, vehicles, creatures, miners)
   */
  private validateEntities(entities: Entity[], section: string, info: InfoSection): void {
    const entityIds = new Set<string>();
    const powerStations: Entity[] = [];
    const buildingsNeedingPower: Entity[] = [];

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

      // Check for duplicate IDs
      if ('id' in entity && entity.id) {
        const entityId = String(entity.id);
        if (entityIds.has(entityId)) {
          this.addError(`Duplicate entity ID: ${entityId}`, 0, 0, section);
        } else {
          entityIds.add(entityId);
        }
      }

      // Track power-related buildings
      if (section === 'buildings') {
        if (entity.type === 'BuildingPowerStation_C') {
          powerStations.push(entity);
        } else if (entity.type !== 'BuildingToolStore_C') {
          // Tool Store is self-powered
          buildingsNeedingPower.push(entity);
        }

        // Validate power paths
        if ('powerpaths' in entity && entity.powerpaths && Array.isArray(entity.powerpaths)) {
          for (const path of entity.powerpaths) {
            if (!path.x && !path.y && !path.z) {
              this.addWarning(
                `${entity.type} has invalid power path with all zero values`,
                0,
                0,
                section
              );
            }
          }
        }
      }

      // Validate vehicle upgrades
      if (
        section === 'vehicles' &&
        'upgrades' in entity &&
        entity.upgrades &&
        Array.isArray(entity.upgrades)
      ) {
        const validUpgrades = [
          'UpEngine',
          'UpDrill',
          'UpAddDrill',
          'UpLaser',
          'UpScanner',
          'UpCargoHold',
          'UpAddNav',
        ];
        for (const upgrade of entity.upgrades) {
          if (!validUpgrades.includes(upgrade)) {
            this.addWarning(`Unknown vehicle upgrade: ${upgrade}`, 0, 0, section);
          }
        }

        // Check upgrade compatibility
        if (
          entity.upgrades &&
          Array.isArray(entity.upgrades) &&
          entity.upgrades.includes('UpAddDrill') &&
          !entity.upgrades.includes('UpDrill')
        ) {
          this.addWarning(
            'Vehicle has UpAddDrill but no UpDrill - additional drill requires base drill',
            0,
            0,
            section
          );
        }
      }

      // Validate miner equipment and jobs
      if (
        section === 'miners' &&
        'equipment' in entity &&
        entity.equipment &&
        Array.isArray(entity.equipment)
      ) {
        const validEquipment = ['Drill', 'Shovel', 'Hammer', 'Sandwich', 'Spanner', 'Dynamite'];
        const validJobs = [
          'JobDriver',
          'JobSailor',
          'JobPilot',
          'JobGeologist',
          'JobEngineer',
          'JobExplosivesExpert',
        ];

        for (const item of entity.equipment) {
          if (!validEquipment.includes(item) && !validJobs.includes(item)) {
            this.addWarning(`Unknown miner equipment/job: ${item}`, 0, 0, section);
          }
        }

        // Check for explosives expert with dynamite
        if (
          entity.equipment &&
          Array.isArray(entity.equipment) &&
          entity.equipment.includes('Dynamite') &&
          !entity.equipment.includes('JobExplosivesExpert')
        ) {
          this.addWarning(
            'Miner has dynamite but is not an explosives expert - may be dangerous',
            0,
            0,
            section
          );
        }
      }
    }

    // Check for Tool Store in buildings
    if (section === 'buildings') {
      const hasToolStore = entities.some(e => e.type === 'BuildingToolStore_C');
      if (!hasToolStore) {
        this.addError('Level must have at least one Tool Store', 0, 0, 'buildings');
      }

      // Check if buildings needing power are connected
      if (buildingsNeedingPower.length > 0 && powerStations.length === 0) {
        this.addWarning(
          `Level has ${buildingsNeedingPower.length} buildings that need power but no power stations`,
          0,
          0,
          'buildings'
        );
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

  /**
   * Validate script section
   */
  private validateScript(script: ScriptSection): void {
    // Validate script variables
    const definedVariables = new Set<string>();
    const validScriptCommands = [
      'msg',
      'wait',
      'spawn',
      'timer',
      'starttimer',
      'stoptimer',
      'playsound',
      'camera',
      'shake',
      'objective',
      'win',
      'lose',
      'drill',
      'reinforce',
      'place',
      'teleport',
      'destroy',
      'setproperty',
      'if',
      'then',
      'else',
      'endif',
      'when',
    ];

    // Track defined variables
    script.variables.forEach((value: unknown, name: string) => {
      definedVariables.add(name);

      // Validate timer syntax
      if (name.toLowerCase().includes('timer') && typeof value === 'string') {
        const timerMatch = value.match(/^(\d+)(?:,(\d+))?(?:,(\d+))?(?:,(\w+))?$/);
        if (!timerMatch) {
          this.addError(
            `Invalid timer syntax for '${name}': ${value}. Expected: delay[,min,max][,event]`,
            0,
            0,
            'script'
          );
        }
      }
    });

    // Validate events
    const eventNames = new Set<string>();
    for (const event of script.events) {
      // Check for duplicate event names
      if (eventNames.has(event.name)) {
        this.addWarning(`Duplicate event name: ${event.name}`, 0, 0, 'script');
      }
      eventNames.add(event.name);

      // Validate event condition
      if (event.condition) {
        // Check if condition references undefined variables
        const conditionVars = event.condition.match(/\b[a-zA-Z_]\w*\b/g) || [];
        for (const varName of conditionVars) {
          if (
            !definedVariables.has(varName) &&
            !['time', 'crystals', 'ore', 'miners', 'buildings'].includes(varName)
          ) {
            this.addWarning(
              `Event '${event.name}' references undefined variable: ${varName}`,
              0,
              0,
              'script'
            );
          }
        }
      }

      // Validate commands
      for (const command of event.commands) {
        if (!validScriptCommands.includes(command.command.toLowerCase())) {
          this.addWarning(
            `Unknown script command '${command.command}' in event '${event.name}'`,
            0,
            0,
            'script'
          );
        }

        // Validate specific command parameters
        switch (command.command.toLowerCase()) {
          case 'wait':
            if (command.parameters.length !== 1 || isNaN(Number(command.parameters[0]))) {
              this.addError(`'wait' command requires a single numeric parameter`, 0, 0, 'script');
            }
            break;
          case 'spawn':
            if (command.parameters.length < 3) {
              this.addError(
                `'spawn' command requires at least 3 parameters: type, x, y`,
                0,
                0,
                'script'
              );
            }
            break;
          case 'timer':
            if (command.parameters.length < 1) {
              this.addError(`'timer' command requires a timer name`, 0, 0, 'script');
            }
            break;
        }
      }
    }
  }

  /**
   * Validate objective condition syntax and variable references
   */
  private validateObjectiveCondition(condition: string, datFile: DatFile): void {
    // Built-in variables that are always available
    const builtInVariables = [
      'crystals',
      'ore',
      'studs',
      'miners',
      'buildings',
      'vehicles',
      'time',
      'erosion',
      'oxygen',
      'landslides',
      'monsters',
    ];

    // Collect variables from script section if it exists
    const scriptVariables = new Set<string>();
    if (datFile.script) {
      datFile.script.variables.forEach((_value, name) => {
        scriptVariables.add(name);
      });
    }

    // Parse the condition for variable references
    // Match variable names (alphanumeric + underscore, not starting with number)
    const variableRefs = condition.match(/\b[a-zA-Z_]\w*\b/g) || [];

    for (const varRef of variableRefs) {
      // Skip operators and keywords
      if (['and', 'or', 'not', 'true', 'false', 'AND', 'OR', 'NOT'].includes(varRef)) {
        continue;
      }

      // Check if variable is defined
      if (!builtInVariables.includes(varRef.toLowerCase()) && !scriptVariables.has(varRef)) {
        this.addWarning(
          `Objective condition references undefined variable: ${varRef}`,
          0,
          0,
          'objectives'
        );
      }
    }

    // Validate operator syntax
    const validOperators = ['==', '!=', '>', '<', '>=', '<='];
    const hasValidOperator = validOperators.some(op => condition.includes(op));

    if (!hasValidOperator) {
      this.addWarning(
        'Objective condition should contain a comparison operator (==, !=, >, <, >=, <=)',
        0,
        0,
        'objectives'
      );
    }

    // Check for balanced parentheses
    let parenCount = 0;
    for (const char of condition) {
      if (char === '(') {
        parenCount++;
      }
      if (char === ')') {
        parenCount--;
      }
      if (parenCount < 0) {
        this.addError('Objective condition has unmatched closing parenthesis', 0, 0, 'objectives');
        return;
      }
    }
    if (parenCount > 0) {
      this.addError('Objective condition has unmatched opening parenthesis', 0, 0, 'objectives');
    }
  }
}
