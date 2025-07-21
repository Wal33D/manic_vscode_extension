/**
 * Map accessibility validator
 * Checks for unreachable objectives, spawn point accessibility, and impossible scenarios
 */

import { DatFile, Entity, Objective, ValidationError } from '../types/datFileTypes';

export interface AccessibilityResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  reachabilityMap?: number[][];
  unreachableAreas?: { row: number; col: number }[];
  analysis?: {
    totalAccessibleTiles: number;
    totalGroundTiles: number;
    accessibilityPercentage: number;
    isolatedAreas: number;
    criticalPaths: { from: string; to: string; path: any[] }[];
  };
}

export interface ObjectiveLocation {
  type: string;
  position: { row: number; col: number };
  description: string;
}

export class MapAccessibilityValidator {
  private tiles: number[][] = [];
  private buildings: Entity[] = [];
  private objectives: Objective[] = [];
  private rowCount = 0;
  private colCount = 0;

  /**
   * Validate map accessibility
   */
  public validate(datFile: DatFile): AccessibilityResult {
    this.tiles = datFile.tiles;
    this.buildings = datFile.buildings || [];
    this.objectives = datFile.objectives || [];
    this.rowCount = datFile.info.rowcount;
    this.colCount = datFile.info.colcount;

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Find critical locations
    const toolStore = this.findToolStore();
    const objectiveLocations = this.findObjectiveLocations();
    const spawnPoints = this.findSpawnPoints();
    const crystalLocations = this.findCrystalLocations();
    const buildingSites = this.findBuildingSites();

    // Check 1: Tool Store accessibility
    if (!toolStore) {
      errors.push({
        message: 'No Tool Store found - map cannot be played',
        severity: 'error',
        line: 0,
        column: 0,
      });
      return { isValid: false, errors, warnings };
    }

    // Generate reachability map from Tool Store
    const reachabilityMap = this.generateReachabilityMap(toolStore);
    const unreachableAreas = this.findUnreachableAreas(reachabilityMap);

    // Check 2: Objective accessibility
    for (const objective of objectiveLocations) {
      if (!this.isLocationReachable(objective.position, reachabilityMap)) {
        errors.push({
          message: `${objective.type} objective at [${objective.position.row}, ${objective.position.col}] is unreachable from Tool Store`,
          severity: 'error',
          line: objective.position.row,
          column: objective.position.col,
        });
      }
    }

    // Check 3: Crystal accessibility for resource objectives
    const resourceObjective = this.objectives.find(
      obj => obj.type === 'resources' && obj.crystals && obj.crystals > 0
    );

    if (resourceObjective) {
      const reachableCrystals = crystalLocations.filter(loc =>
        this.isLocationReachable(loc, reachabilityMap)
      );

      if (reachableCrystals.length === 0) {
        errors.push({
          message: 'No crystals are reachable - crystal collection objective impossible',
          severity: 'error',
          line: 0,
          column: 0,
        });
      } else if (
        'crystals' in resourceObjective &&
        reachableCrystals.length < (resourceObjective.crystals || 0)
      ) {
        warnings.push({
          message: `Only ${reachableCrystals.length} crystals are reachable, but objective requires ${resourceObjective.crystals}`,
          severity: 'warning',
          line: 0,
          column: 0,
        });
      }
    }

    // Check 4: Building site accessibility
    const buildObjectives = this.objectives.filter(obj => obj.type === 'building');
    for (const buildObj of buildObjectives) {
      const requiredBuildings = this.getRequiredBuildings(buildObj);
      const accessibleSites = buildingSites.filter(site =>
        this.isLocationReachable(site, reachabilityMap)
      );

      if (accessibleSites.length < requiredBuildings.length) {
        errors.push({
          message: `Not enough accessible building sites for construction objectives`,
          severity: 'error',
          line: 0,
          column: 0,
        });
      }
    }

    // Check 5: Map connectivity
    const isolatedAreas = this.findIsolatedAreas();
    if (isolatedAreas.length > 1) {
      warnings.push({
        message: `Map has ${isolatedAreas.length} isolated areas - some parts may be inaccessible`,
        severity: 'warning',
        line: 0,
        column: 0,
      });

      // Check if any isolated area contains important items
      for (const area of isolatedAreas) {
        if (area.hasResources) {
          warnings.push({
            message: `Isolated area at [${area.center.row}, ${area.center.col}] contains resources that cannot be reached`,
            severity: 'warning',
            line: area.center.row,
            column: area.center.col,
          });
        }
      }
    }

    // Check 6: Critical path analysis
    const criticalPaths = this.analyzeCriticalPaths(toolStore, objectiveLocations);
    for (const path of criticalPaths) {
      if (path.chokepoints.length > 0) {
        warnings.push({
          message: `Critical path from ${path.from} to ${path.to} has ${path.chokepoints.length} chokepoint(s) that could be blocked`,
          severity: 'warning',
          line: path.chokepoints[0].row,
          column: path.chokepoints[0].col,
        });
      }
    }

    // Check 7: Spawn point validation
    if (spawnPoints.length === 0) {
      warnings.push({
        message: 'No clear spawn points found - units may spawn in unexpected locations',
        severity: 'warning',
        line: 0,
        column: 0,
      });
    } else {
      for (const spawn of spawnPoints) {
        if (!this.hasAdequateSpace(spawn)) {
          warnings.push({
            message: `Spawn point at [${spawn.row}, ${spawn.col}] has limited space for units`,
            severity: 'warning',
            line: spawn.row,
            column: spawn.col,
          });
        }
      }
    }

    // Check 8: Impossible scenario detection
    const impossibleScenarios = this.detectImpossibleScenarios();
    errors.push(...impossibleScenarios);

    // Calculate analysis metrics
    const analysis = this.calculateAccessibilityMetrics(reachabilityMap, criticalPaths);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      reachabilityMap,
      unreachableAreas,
      analysis,
    };
  }

  /**
   * Find Tool Store location
   */
  private findToolStore(): { row: number; col: number } | null {
    for (const building of this.buildings) {
      if (building.type === 'BuildingToolStore_C') {
        const x = Math.floor(building.coordinates.translation.x / 100);
        const y = Math.floor(building.coordinates.translation.y / 100);
        return { row: y, col: x };
      }
    }
    return null;
  }

  /**
   * Find objective locations on the map
   */
  private findObjectiveLocations(): ObjectiveLocation[] {
    const locations: ObjectiveLocation[] = [];

    // Find drill objectives
    for (const objective of this.objectives) {
      if (objective.type === 'discovertile') {
        const discoverObjective = objective as any;
        if (discoverObjective.x !== undefined && discoverObjective.y !== undefined) {
          locations.push({
            type: 'Discover location',
            position: { row: discoverObjective.y, col: discoverObjective.x },
            description: 'Discover tile objective',
          });
        }
      }
    }

    // Find specific building objectives
    for (const building of this.buildings) {
      if (this.isMissionCriticalBuilding(building.type)) {
        const x = Math.floor(building.coordinates.translation.x / 100);
        const y = Math.floor(building.coordinates.translation.y / 100);
        locations.push({
          type: building.type,
          position: { row: y, col: x },
          description: 'Mission critical building',
        });
      }
    }

    return locations;
  }

  /**
   * Find spawn points (open areas near Tool Store)
   */
  private findSpawnPoints(): { row: number; col: number }[] {
    const toolStore = this.findToolStore();
    if (!toolStore) {
      return [];
    }

    const spawnPoints: { row: number; col: number }[] = [];
    const searchRadius = 5;

    for (let dr = -searchRadius; dr <= searchRadius; dr++) {
      for (let dc = -searchRadius; dc <= searchRadius; dc++) {
        const row = toolStore.row + dr;
        const col = toolStore.col + dc;

        if (this.isValidSpawnPoint(row, col)) {
          spawnPoints.push({ row, col });
        }
      }
    }

    return spawnPoints;
  }

  /**
   * Find crystal locations
   */
  private findCrystalLocations(): { row: number; col: number }[] {
    const locations: { row: number; col: number }[] = [];

    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        const tileId = this.tiles[row][col];
        // Crystal seams (42-45) and reinforced crystal seams (92-95)
        if ((tileId >= 42 && tileId <= 45) || (tileId >= 92 && tileId <= 95)) {
          locations.push({ row, col });
        }
      }
    }

    return locations;
  }

  /**
   * Find suitable building sites
   */
  private findBuildingSites(): { row: number; col: number }[] {
    const sites: { row: number; col: number }[] = [];
    const requiredSize = 3; // Most buildings need 3x3 space

    for (let row = 0; row <= this.rowCount - requiredSize; row++) {
      for (let col = 0; col <= this.colCount - requiredSize; col++) {
        if (this.isSuitableBuildingSite(row, col, requiredSize)) {
          sites.push({ row: row + 1, col: col + 1 }); // Center of the site
        }
      }
    }

    return sites;
  }

  /**
   * Generate reachability map using flood fill from a starting point
   */
  private generateReachabilityMap(start: { row: number; col: number }): number[][] {
    const reachabilityMap: number[][] = Array(this.rowCount)
      .fill(0)
      .map(() => Array(this.colCount).fill(-1));

    const queue: { row: number; col: number; distance: number }[] = [];
    queue.push({ ...start, distance: 0 });
    reachabilityMap[start.row][start.col] = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = this.getPassableNeighbors(current.row, current.col);

      for (const neighbor of neighbors) {
        if (reachabilityMap[neighbor.row][neighbor.col] === -1) {
          const distance = current.distance + 1;
          reachabilityMap[neighbor.row][neighbor.col] = distance;
          queue.push({ ...neighbor, distance });
        }
      }
    }

    return reachabilityMap;
  }

  /**
   * Find unreachable areas
   */
  private findUnreachableAreas(reachabilityMap: number[][]): { row: number; col: number }[] {
    const unreachable: { row: number; col: number }[] = [];

    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        if (this.isPassable(row, col) && reachabilityMap[row][col] === -1) {
          unreachable.push({ row, col });
        }
      }
    }

    return unreachable;
  }

  /**
   * Check if a location is reachable
   */
  private isLocationReachable(
    location: { row: number; col: number },
    reachabilityMap: number[][]
  ): boolean {
    // Check the location itself
    if (reachabilityMap[location.row][location.col] >= 0) {
      return true;
    }

    // Check adjacent tiles for resources that need to be mined
    const neighbors = this.getAllNeighbors(location.row, location.col);
    return neighbors.some(n => reachabilityMap[n.row][n.col] >= 0);
  }

  /**
   * Find isolated areas
   */
  private findIsolatedAreas(): Array<{
    center: { row: number; col: number };
    size: number;
    hasResources: boolean;
  }> {
    const visited = new Set<string>();
    const areas: Array<{
      center: { row: number; col: number };
      size: number;
      hasResources: boolean;
    }> = [];

    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        const key = `${row},${col}`;
        if (!visited.has(key) && this.isPassable(row, col)) {
          const area = this.exploreArea(row, col, visited);
          if (area.size > 0) {
            areas.push(area);
          }
        }
      }
    }

    return areas.sort((a, b) => b.size - a.size);
  }

  /**
   * Explore connected area using flood fill
   */
  private exploreArea(
    startRow: number,
    startCol: number,
    visited: Set<string>
  ): {
    center: { row: number; col: number };
    size: number;
    hasResources: boolean;
  } {
    const queue: { row: number; col: number }[] = [{ row: startRow, col: startCol }];
    const tiles: { row: number; col: number }[] = [];
    let hasResources = false;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.row},${current.col}`;

      if (visited.has(key) || !this.isPassable(current.row, current.col)) {
        continue;
      }

      visited.add(key);
      tiles.push(current);

      // Check for adjacent resources
      const neighbors = this.getAllNeighbors(current.row, current.col);
      for (const neighbor of neighbors) {
        if (this.isResourceTile(this.tiles[neighbor.row][neighbor.col])) {
          hasResources = true;
        }
        if (this.isPassable(neighbor.row, neighbor.col)) {
          queue.push(neighbor);
        }
      }
    }

    // Calculate center
    const avgRow = Math.floor(tiles.reduce((sum, t) => sum + t.row, 0) / tiles.length) || startRow;
    const avgCol = Math.floor(tiles.reduce((sum, t) => sum + t.col, 0) / tiles.length) || startCol;

    return {
      center: { row: avgRow, col: avgCol },
      size: tiles.length,
      hasResources,
    };
  }

  /**
   * Analyze critical paths between important locations
   */
  private analyzeCriticalPaths(
    toolStore: { row: number; col: number },
    objectives: ObjectiveLocation[]
  ): Array<{
    from: string;
    to: string;
    path: any[];
    chokepoints: { row: number; col: number }[];
  }> {
    const criticalPaths: Array<{
      from: string;
      to: string;
      path: any[];
      chokepoints: { row: number; col: number }[];
    }> = [];

    // Analyze paths from Tool Store to each objective
    for (const objective of objectives) {
      const pathResult = this.findPath(toolStore, objective.position);
      if (pathResult) {
        const chokepoints = this.identifyChokepoints(pathResult.path);
        criticalPaths.push({
          from: 'Tool Store',
          to: objective.type,
          path: pathResult.path,
          chokepoints,
        });
      }
    }

    return criticalPaths;
  }

  /**
   * Identify chokepoints in a path
   */
  private identifyChokepoints(
    path: Array<{ row: number; col: number }>
  ): { row: number; col: number }[] {
    const chokepoints: { row: number; col: number }[] = [];

    for (const point of path) {
      if (this.isChokepoint(point.row, point.col)) {
        chokepoints.push(point);
      }
    }

    return chokepoints;
  }

  /**
   * Check if a tile is a chokepoint
   */
  private isChokepoint(row: number, col: number): boolean {
    const passableNeighbors = this.getPassableNeighbors(row, col).length;

    // A chokepoint has exactly 2 passable neighbors in opposite directions
    if (passableNeighbors !== 2) {
      return false;
    }

    // Check for narrow passage pattern
    const north = this.isPassable(row - 1, col);
    const south = this.isPassable(row + 1, col);
    const west = this.isPassable(row, col - 1);
    const east = this.isPassable(row, col + 1);

    return (north && south && !west && !east) || (!north && !south && west && east);
  }

  /**
   * Detect impossible scenarios
   */
  private detectImpossibleScenarios(): ValidationError[] {
    const errors: ValidationError[] = [];

    // Scenario 1: Slug holes blocking all paths
    const slugHoles = this.findSlugHoles();
    if (slugHoles.length > 0) {
      const toolStore = this.findToolStore();
      if (toolStore) {
        const reachabilityWithoutSlugs = this.generateReachabilityMapAvoidingTiles(
          toolStore,
          slugHoles
        );
        const criticalLocations = this.findObjectiveLocations();

        for (const location of criticalLocations) {
          if (!this.isLocationReachable(location.position, reachabilityWithoutSlugs)) {
            errors.push({
              message: `${location.type} would become unreachable if slug holes at [${slugHoles[0].row}, ${slugHoles[0].col}] spawn slugs`,
              severity: 'error',
              line: location.position.row,
              column: location.position.col,
            });
          }
        }
      }
    }

    // Scenario 2: Erosion making paths impossible
    const erosionRisks = this.identifyErosionRisks();
    for (const risk of erosionRisks) {
      if (risk.severity === 'critical') {
        errors.push({
          message: `Critical path at [${risk.location.row}, ${risk.location.col}] vulnerable to erosion - map could become unwinnable`,
          severity: 'error',
          line: risk.location.row,
          column: risk.location.col,
        });
      }
    }

    // Scenario 3: Not enough resources for objectives
    const resourceAnalysis = this.analyzeResourceAvailability();
    if (!resourceAnalysis.sufficient) {
      errors.push({
        message: resourceAnalysis.message,
        severity: 'error',
        line: 0,
        column: 0,
      });
    }

    return errors;
  }

  /**
   * Check if location has adequate space
   */
  private hasAdequateSpace(location: { row: number; col: number }): boolean {
    let openTiles = 0;
    const requiredSpace = 4; // At least 4 adjacent open tiles

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) {
          continue;
        }
        const row = location.row + dr;
        const col = location.col + dc;
        if (this.isPassable(row, col)) {
          openTiles++;
        }
      }
    }

    return openTiles >= requiredSpace;
  }

  /**
   * Calculate accessibility metrics
   */
  private calculateAccessibilityMetrics(reachabilityMap: number[][], criticalPaths: any[]): any {
    let totalAccessibleTiles = 0;
    let totalGroundTiles = 0;

    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        if (this.isPassable(row, col)) {
          totalGroundTiles++;
          if (reachabilityMap[row][col] >= 0) {
            totalAccessibleTiles++;
          }
        }
      }
    }

    const accessibilityPercentage =
      totalGroundTiles > 0 ? (totalAccessibleTiles / totalGroundTiles) * 100 : 0;

    const isolatedAreas = this.findIsolatedAreas().length;

    return {
      totalAccessibleTiles,
      totalGroundTiles,
      accessibilityPercentage: Math.round(accessibilityPercentage * 10) / 10,
      isolatedAreas,
      criticalPaths: criticalPaths.map(cp => ({
        from: cp.from,
        to: cp.to,
        path: cp.path,
      })),
    };
  }

  // Helper methods

  private isPassable(row: number, col: number): boolean {
    if (row < 0 || row >= this.rowCount || col < 0 || col >= this.colCount) {
      return false;
    }

    const tileId = this.tiles[row][col];

    // Ground tiles (1) and rubble (2-5) are passable
    if (tileId >= 1 && tileId <= 5) {
      return true;
    }

    // Power paths (14-25) are passable
    if (tileId >= 14 && tileId <= 25) {
      return true;
    }

    // Building tiles
    if (tileId === 101 || tileId === 114 || tileId === 115) {
      return true;
    }

    return false;
  }

  private getPassableNeighbors(row: number, col: number): { row: number; col: number }[] {
    const neighbors: { row: number; col: number }[] = [];
    const directions = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 },
    ];

    for (const { dr, dc } of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (this.isPassable(newRow, newCol)) {
        neighbors.push({ row: newRow, col: newCol });
      }
    }

    return neighbors;
  }

  private getAllNeighbors(row: number, col: number): { row: number; col: number }[] {
    const neighbors: { row: number; col: number }[] = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) {
          continue;
        }
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < this.rowCount && newCol >= 0 && newCol < this.colCount) {
          neighbors.push({ row: newRow, col: newCol });
        }
      }
    }

    return neighbors;
  }

  private isResourceTile(tileId: number): boolean {
    // Crystal seams (42-45, 92-95) and ore seams (46-49, 96-99)
    return (
      (tileId >= 42 && tileId <= 45) ||
      (tileId >= 92 && tileId <= 95) ||
      (tileId >= 46 && tileId <= 49) ||
      (tileId >= 96 && tileId <= 99)
    );
  }

  private isMissionCriticalBuilding(type: string): boolean {
    const criticalTypes = [
      'BuildingDocks_C',
      'BuildingSuperTeleport_C',
      'BuildingGeodesicPowerStation_C',
      'BuildingMiningLaser_C',
    ];
    return criticalTypes.includes(type);
  }

  private isValidSpawnPoint(row: number, col: number): boolean {
    return this.isPassable(row, col) && this.hasAdequateSpace({ row, col });
  }

  private isSuitableBuildingSite(row: number, col: number, size: number): boolean {
    // Check if all tiles in the area are ground
    for (let dr = 0; dr < size; dr++) {
      for (let dc = 0; dc < size; dc++) {
        const tileId = this.tiles[row + dr]?.[col + dc];
        if (!tileId || tileId !== 1) {
          // Must be ground tile
          return false;
        }
      }
    }

    // Check if area is reachable (at least one adjacent passable tile)
    for (let dr = -1; dr <= size; dr++) {
      for (let dc = -1; dc <= size; dc++) {
        if (dr >= 0 && dr < size && dc >= 0 && dc < size) {
          continue;
        }
        if (this.isPassable(row + dr, col + dc)) {
          return true;
        }
      }
    }

    return false;
  }

  private getRequiredBuildings(objective: Objective): string[] {
    // Extract required buildings from objective
    const buildings: string[] = [];
    const buildingTypes = [
      'teleportPad',
      'docks',
      'supportStation',
      'powerStation',
      'oreRefinery',
      'barracks',
      'upgradeStation',
      'geologicalCenter',
      'miningLaser',
      'superTeleport',
    ];

    for (const buildingType of buildingTypes) {
      if (buildingType in objective && (objective as any)[buildingType] > 0) {
        buildings.push(buildingType);
      }
    }

    return buildings;
  }

  private findPath(
    start: { row: number; col: number },
    end: { row: number; col: number }
  ): { path: any[]; cost: number } | null {
    // Use A* pathfinding
    const openSet = new Map<string, any>();
    const closedSet = new Set<string>();

    const startNode = {
      row: start.row,
      col: start.col,
      g: 0,
      h: this.heuristic(start, end),
      f: 0,
      parent: null,
    };
    startNode.f = startNode.g + startNode.h;

    openSet.set(`${start.row},${start.col}`, startNode);

    while (openSet.size > 0) {
      // Find node with lowest f score
      let current: any = null;
      let lowestF = Infinity;
      for (const node of openSet.values()) {
        if (node.f < lowestF) {
          lowestF = node.f;
          current = node;
        }
      }

      if (!current) {
        break;
      }

      // Check if we reached the goal
      if (current.row === end.row && current.col === end.col) {
        const path = [];
        let node = current;
        while (node) {
          path.unshift({ row: node.row, col: node.col });
          node = node.parent;
        }
        return { path, cost: current.g };
      }

      const key = `${current.row},${current.col}`;
      openSet.delete(key);
      closedSet.add(key);

      // Check neighbors
      const neighbors = this.getPassableNeighbors(current.row, current.col);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.row},${neighbor.col}`;
        if (closedSet.has(neighborKey)) {
          continue;
        }

        const g = current.g + 1;
        const h = this.heuristic(neighbor, end);
        const f = g + h;

        const existing = openSet.get(neighborKey);
        if (!existing || g < existing.g) {
          openSet.set(neighborKey, {
            row: neighbor.row,
            col: neighbor.col,
            g,
            h,
            f,
            parent: current,
          });
        }
      }
    }

    return null;
  }

  private heuristic(a: { row: number; col: number }, b: { row: number; col: number }): number {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
  }

  private findSlugHoles(): { row: number; col: number }[] {
    const slugHoles: { row: number; col: number }[] = [];

    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        const tileId = this.tiles[row][col];
        if (tileId === 12 || tileId === 112) {
          // Slug hole tiles
          slugHoles.push({ row, col });
        }
      }
    }

    return slugHoles;
  }

  private generateReachabilityMapAvoidingTiles(
    start: { row: number; col: number },
    avoidTiles: { row: number; col: number }[]
  ): number[][] {
    const reachabilityMap: number[][] = Array(this.rowCount)
      .fill(0)
      .map(() => Array(this.colCount).fill(-1));

    const avoidSet = new Set(avoidTiles.map(t => `${t.row},${t.col}`));

    const queue: { row: number; col: number; distance: number }[] = [];
    queue.push({ ...start, distance: 0 });
    reachabilityMap[start.row][start.col] = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = this.getPassableNeighbors(current.row, current.col);

      for (const neighbor of neighbors) {
        const key = `${neighbor.row},${neighbor.col}`;
        if (!avoidSet.has(key) && reachabilityMap[neighbor.row][neighbor.col] === -1) {
          const distance = current.distance + 1;
          reachabilityMap[neighbor.row][neighbor.col] = distance;
          queue.push({ ...neighbor, distance });
        }
      }
    }

    return reachabilityMap;
  }

  private identifyErosionRisks(): Array<{
    location: { row: number; col: number };
    severity: 'low' | 'medium' | 'critical';
  }> {
    const risks: Array<{
      location: { row: number; col: number };
      severity: 'low' | 'medium' | 'critical';
    }> = [];

    // Find tiles adjacent to lava or water that are on critical paths
    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        if (this.isPassable(row, col)) {
          const adjacentToHazard = this.isAdjacentToHazard(row, col);
          if (adjacentToHazard) {
            const severity = this.isChokepoint(row, col) ? 'critical' : 'medium';
            risks.push({ location: { row, col }, severity });
          }
        }
      }
    }

    return risks;
  }

  private isAdjacentToHazard(row: number, col: number): boolean {
    const neighbors = this.getAllNeighbors(row, col);
    return neighbors.some(n => {
      const tileId = this.tiles[n.row][n.col];
      return tileId === 6 || tileId === 11; // Lava or water
    });
  }

  private analyzeResourceAvailability(): { sufficient: boolean; message: string } {
    const objectives = this.objectives;
    let requiredCrystals = 0;
    let requiredOre = 0;

    for (const obj of objectives) {
      if (obj.type === 'resources') {
        const resObj = obj as any;
        requiredCrystals += resObj.crystals || 0;
        requiredOre += resObj.ore || 0;
      }
    }

    // Count available resources
    let availableCrystals = 0;
    let availableOre = 0;

    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        const tileId = this.tiles[row][col];
        if ((tileId >= 42 && tileId <= 45) || (tileId >= 92 && tileId <= 95)) {
          availableCrystals++;
        } else if ((tileId >= 46 && tileId <= 49) || (tileId >= 96 && tileId <= 99)) {
          availableOre++;
        }
      }
    }

    if (requiredCrystals > availableCrystals) {
      return {
        sufficient: false,
        message: `Map has only ${availableCrystals} crystals but objectives require ${requiredCrystals}`,
      };
    }

    if (requiredOre > availableOre * 3) {
      // Each ore seam typically yields 3 ore
      return {
        sufficient: false,
        message: `Map has only ${availableOre} ore seams (${
          availableOre * 3
        } ore) but objectives require ${requiredOre}`,
      };
    }

    return { sufficient: true, message: 'Resources sufficient for objectives' };
  }
}
