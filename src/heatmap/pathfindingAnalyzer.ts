import * as vscode from 'vscode';
import { DatFileParser } from '../parser/datFileParser';

export interface PathNode {
  row: number;
  col: number;
  cost: number;
  parent?: PathNode;
}

export interface PathfindingResult {
  path: PathNode[];
  cost: number;
  visited: Set<string>;
}

export interface HeatMapData {
  grid: number[][];
  maxValue: number;
  minValue: number;
  hotspots: { row: number; col: number; value: number }[];
  coldspots: { row: number; col: number; value: number }[];
}

export class PathfindingAnalyzer {
  private tiles: number[][] = [];
  private rowCount: number = 0;
  private colCount: number = 0;

  /**
   * Initialize analyzer with map data
   */
  public initialize(document: vscode.TextDocument): boolean {
    try {
      const parser = new DatFileParser(document.getText());
      const tilesSection = parser.getSection('tiles');

      if (!tilesSection) {
        return false;
      }

      this.tiles = this.parseTiles(tilesSection.content);
      this.rowCount = this.tiles.length;
      this.colCount = this.tiles[0]?.length || 0;

      return true;
    } catch (error) {
      console.error('Failed to initialize pathfinding analyzer:', error);
      return false;
    }
  }

  /**
   * Generate heat map for traffic analysis
   */
  public generateTrafficHeatMap(): HeatMapData {
    const heatGrid: number[][] = Array(this.rowCount)
      .fill(0)
      .map(() => Array(this.colCount).fill(0));

    // Calculate traffic for multiple paths between key points
    const keyPoints = this.findKeyPoints();

    // Generate paths between all pairs of key points
    for (let i = 0; i < keyPoints.length; i++) {
      for (let j = i + 1; j < keyPoints.length; j++) {
        const start = keyPoints[i];
        const end = keyPoints[j];

        const result = this.findPath(start, end);
        if (result) {
          // Increment heat value for each tile in the path
          result.path.forEach(node => {
            heatGrid[node.row][node.col]++;
          });
        }
      }
    }

    return this.processHeatMapData(heatGrid);
  }

  /**
   * Generate heat map for accessibility analysis
   */
  public generateAccessibilityHeatMap(startPoints: { row: number; col: number }[]): HeatMapData {
    const heatGrid: number[][] = Array(this.rowCount)
      .fill(0)
      .map(() => Array(this.colCount).fill(Infinity));

    // For each starting point, calculate distance to all reachable tiles
    startPoints.forEach(start => {
      const distances = this.calculateDistances(start);

      // Update heat grid with minimum distances
      for (let row = 0; row < this.rowCount; row++) {
        for (let col = 0; col < this.colCount; col++) {
          const distance = distances[row][col];
          if (distance < heatGrid[row][col]) {
            heatGrid[row][col] = distance;
          }
        }
      }
    });

    // Convert infinity values to -1 for unreachable areas
    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        if (heatGrid[row][col] === Infinity) {
          heatGrid[row][col] = -1;
        }
      }
    }

    return this.processHeatMapData(heatGrid);
  }

  /**
   * Generate heat map for chokepoint analysis
   */
  public generateChokepointHeatMap(): HeatMapData {
    const heatGrid: number[][] = Array(this.rowCount)
      .fill(0)
      .map(() => Array(this.colCount).fill(0));

    // Analyze each passable tile for chokepoint characteristics
    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        if (this.isPassable(row, col)) {
          const score = this.calculateChokepointScore(row, col);
          heatGrid[row][col] = score;
        }
      }
    }

    return this.processHeatMapData(heatGrid);
  }

  /**
   * Find optimal path between two points using A* algorithm
   */
  public findPath(
    start: { row: number; col: number },
    end: { row: number; col: number }
  ): PathfindingResult | null {
    if (!this.isPassable(start.row, start.col) || !this.isPassable(end.row, end.col)) {
      return null;
    }

    const openSet = new Map<string, PathNode>();
    const closedSet = new Set<string>();
    const visited = new Set<string>();

    const startNode: PathNode = {
      row: start.row,
      col: start.col,
      cost: 0,
    };

    openSet.set(`${start.row},${start.col}`, startNode);

    while (openSet.size > 0) {
      // Find node with lowest f-score
      let current: PathNode | null = null;
      let lowestF = Infinity;

      for (const node of openSet.values()) {
        const f = node.cost + this.heuristic(node, end);
        if (f < lowestF) {
          lowestF = f;
          current = node;
        }
      }

      if (current === null) {
        break;
      }

      const key = `${current.row},${current.col}`;
      openSet.delete(key);
      closedSet.add(key);
      visited.add(key);

      // Check if we reached the goal
      if (current.row === end.row && current.col === end.col) {
        return {
          path: this.reconstructPath(current),
          cost: current.cost,
          visited,
        };
      }

      // Check neighbors
      const neighbors = this.getNeighbors(current.row, current.col);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.row},${neighbor.col}`;

        if (closedSet.has(neighborKey)) {
          continue;
        }

        const tentativeCost = current.cost + this.getMovementCost(current, neighbor);
        const existingNode = openSet.get(neighborKey);

        if (!existingNode || tentativeCost < existingNode.cost) {
          const newNode: PathNode = {
            row: neighbor.row,
            col: neighbor.col,
            cost: tentativeCost,
            parent: current,
          };
          openSet.set(neighborKey, newNode);
        }
      }
    }

    return null;
  }

  /**
   * Calculate distances from a starting point to all reachable tiles
   */
  private calculateDistances(start: { row: number; col: number }): number[][] {
    const distances: number[][] = Array(this.rowCount)
      .fill(0)
      .map(() => Array(this.colCount).fill(Infinity));

    if (!this.isPassable(start.row, start.col)) {
      return distances;
    }

    const queue: { row: number; col: number; distance: number }[] = [];
    queue.push({ ...start, distance: 0 });
    distances[start.row][start.col] = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = this.getNeighbors(current.row, current.col);

      for (const neighbor of neighbors) {
        const newDistance = current.distance + 1;
        if (newDistance < distances[neighbor.row][neighbor.col]) {
          distances[neighbor.row][neighbor.col] = newDistance;
          queue.push({ ...neighbor, distance: newDistance });
        }
      }
    }

    return distances;
  }

  /**
   * Calculate chokepoint score for a tile
   */
  private calculateChokepointScore(row: number, col: number): number {
    if (!this.isPassable(row, col)) {
      return 0;
    }

    // Count passable neighbors
    const neighbors = this.getNeighbors(row, col);
    const passableNeighbors = neighbors.length;

    // Check if tile forms a narrow passage
    const horizontalPassage =
      !this.isPassable(row - 1, col) &&
      !this.isPassable(row + 1, col) &&
      this.isPassable(row, col - 1) &&
      this.isPassable(row, col + 1);

    const verticalPassage =
      !this.isPassable(row, col - 1) &&
      !this.isPassable(row, col + 1) &&
      this.isPassable(row - 1, col) &&
      this.isPassable(row + 1, col);

    let score = 0;

    // High score for narrow passages
    if (horizontalPassage || verticalPassage) {
      score += 10;
    }

    // Higher score for fewer passable neighbors (bottleneck)
    score += Math.max(0, 4 - passableNeighbors) * 3;

    // Check if removing this tile would disconnect areas
    const connectivityScore = this.calculateConnectivityImpact(row, col);
    score += connectivityScore;

    return score;
  }

  /**
   * Calculate how removing a tile would impact connectivity
   */
  private calculateConnectivityImpact(row: number, col: number): number {
    // Simplified check: count distinct neighbor groups
    const neighbors = this.getNeighbors(row, col);
    if (neighbors.length <= 1) {
      return 0;
    }

    // Check if neighbors are connected without going through this tile
    const groups: number[][] = [];
    const assigned = new Map<string, number>();

    neighbors.forEach((neighbor, index) => {
      const key = `${neighbor.row},${neighbor.col}`;
      if (!assigned.has(key)) {
        groups[index] = [index];
        assigned.set(key, index);
      }
    });

    // If multiple groups exist, this tile is important for connectivity
    return (groups.filter(g => g && g.length > 0).length - 1) * 5;
  }

  /**
   * Find key points in the map (spawn points, objectives, resources)
   */
  private findKeyPoints(): { row: number; col: number }[] {
    const points: { row: number; col: number }[] = [];

    // Find ground tiles that might be spawn points or important locations
    // Corners
    if (this.isPassable(0, 0)) {
      points.push({ row: 0, col: 0 });
    }
    if (this.isPassable(0, this.colCount - 1)) {
      points.push({ row: 0, col: this.colCount - 1 });
    }
    if (this.isPassable(this.rowCount - 1, 0)) {
      points.push({ row: this.rowCount - 1, col: 0 });
    }
    if (this.isPassable(this.rowCount - 1, this.colCount - 1)) {
      points.push({ row: this.rowCount - 1, col: this.colCount - 1 });
    }

    // Centers of open areas
    const openAreas = this.findOpenAreas();
    openAreas.forEach(area => {
      points.push(area.center);
    });

    // Resource locations
    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        if (this.isResourceTile(this.tiles[row][col])) {
          // Find nearest passable tile
          const nearest = this.findNearestPassable(row, col);
          if (nearest) {
            points.push(nearest);
          }
        }
      }
    }

    return points;
  }

  /**
   * Find open areas in the map
   */
  private findOpenAreas(): { center: { row: number; col: number }; size: number }[] {
    const areas: { center: { row: number; col: number }; size: number }[] = [];
    const visited = new Set<string>();

    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        const key = `${row},${col}`;
        if (!visited.has(key) && this.isPassable(row, col)) {
          const area = this.floodFillArea(row, col, visited);
          if (area.size >= 9) {
            // At least 3x3
            areas.push(area);
          }
        }
      }
    }

    return areas;
  }

  /**
   * Flood fill to find connected area
   */
  private floodFillArea(
    startRow: number,
    startCol: number,
    visited: Set<string>
  ): { center: { row: number; col: number }; size: number } {
    const queue: { row: number; col: number }[] = [{ row: startRow, col: startCol }];
    const tiles: { row: number; col: number }[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.row},${current.col}`;

      if (visited.has(key) || !this.isPassable(current.row, current.col)) {
        continue;
      }

      visited.add(key);
      tiles.push(current);

      const neighbors = this.getNeighbors(current.row, current.col);
      neighbors.forEach(neighbor => {
        queue.push(neighbor);
      });
    }

    // Calculate center
    const avgRow = Math.floor(tiles.reduce((sum, t) => sum + t.row, 0) / tiles.length);
    const avgCol = Math.floor(tiles.reduce((sum, t) => sum + t.col, 0) / tiles.length);

    return {
      center: { row: avgRow, col: avgCol },
      size: tiles.length,
    };
  }

  /**
   * Find nearest passable tile to a given position
   */
  private findNearestPassable(row: number, col: number): { row: number; col: number } | null {
    const queue: { row: number; col: number; distance: number }[] = [{ row, col, distance: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.row},${current.col}`;

      if (visited.has(key)) {
        continue;
      }
      visited.add(key);

      if (this.isPassable(current.row, current.col)) {
        return { row: current.row, col: current.col };
      }

      // Add all neighbors
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) {
            continue;
          }
          const nr = current.row + dr;
          const nc = current.col + dc;
          if (nr >= 0 && nr < this.rowCount && nc >= 0 && nc < this.colCount) {
            queue.push({ row: nr, col: nc, distance: current.distance + 1 });
          }
        }
      }
    }

    return null;
  }

  /**
   * Get valid neighbors for a tile
   */
  private getNeighbors(row: number, col: number): { row: number; col: number }[] {
    const neighbors: { row: number; col: number }[] = [];
    const directions = [
      { dr: -1, dc: 0 }, // North
      { dr: 1, dc: 0 }, // South
      { dr: 0, dc: -1 }, // West
      { dr: 0, dc: 1 }, // East
    ];

    for (const { dr, dc } of directions) {
      const newRow = row + dr;
      const newCol = col + dc;

      if (
        newRow >= 0 &&
        newRow < this.rowCount &&
        newCol >= 0 &&
        newCol < this.colCount &&
        this.isPassable(newRow, newCol)
      ) {
        neighbors.push({ row: newRow, col: newCol });
      }
    }

    return neighbors;
  }

  /**
   * Calculate heuristic distance (Manhattan distance)
   */
  private heuristic(a: { row: number; col: number }, b: { row: number; col: number }): number {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
  }

  /**
   * Get movement cost between two adjacent tiles
   */
  private getMovementCost(_from: PathNode, to: { row: number; col: number }): number {
    // Base cost
    let cost = 1;

    // Add cost for different tile types
    const tileId = this.tiles[to.row][to.col];

    // Rubble tiles have higher cost
    if (tileId >= 2 && tileId <= 5) {
      cost += tileId - 1; // Higher rubble level = higher cost
    }

    return cost;
  }

  /**
   * Reconstruct path from end node
   */
  private reconstructPath(node: PathNode): PathNode[] {
    const path: PathNode[] = [];
    let current: PathNode | undefined = node;

    while (current) {
      path.unshift({
        row: current.row,
        col: current.col,
        cost: current.cost,
      });
      current = current.parent;
    }

    return path;
  }

  /**
   * Process heat map data to find hotspots and coldspots
   */
  private processHeatMapData(grid: number[][]): HeatMapData {
    let maxValue = -Infinity;
    let minValue = Infinity;
    const hotspots: { row: number; col: number; value: number }[] = [];
    const coldspots: { row: number; col: number; value: number }[] = [];

    // Find min/max values
    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        const value = grid[row][col];
        if (value > 0 || (value === 0 && this.isPassable(row, col))) {
          maxValue = Math.max(maxValue, value);
          minValue = Math.min(minValue, value);
        }
      }
    }

    // Identify hotspots and coldspots
    const threshold = (maxValue - minValue) * 0.2;

    for (let row = 0; row < this.rowCount; row++) {
      for (let col = 0; col < this.colCount; col++) {
        const value = grid[row][col];

        if (value >= maxValue - threshold && value > 0) {
          hotspots.push({ row, col, value });
        } else if (value <= minValue + threshold && value >= 0 && this.isPassable(row, col)) {
          coldspots.push({ row, col, value });
        }
      }
    }

    // Sort by value
    hotspots.sort((a, b) => b.value - a.value);
    coldspots.sort((a, b) => a.value - b.value);

    return {
      grid,
      maxValue,
      minValue,
      hotspots: hotspots.slice(0, 10), // Top 10 hotspots
      coldspots: coldspots.slice(0, 10), // Top 10 coldspots
    };
  }

  /**
   * Check if a tile is passable
   */
  private isPassable(row: number, col: number): boolean {
    if (row < 0 || row >= this.rowCount || col < 0 || col >= this.colCount) {
      return false;
    }

    const tileId = this.tiles[row][col];

    // Ground tiles (1) and rubble (2-5) are passable
    return tileId >= 1 && tileId <= 5;
  }

  /**
   * Check if a tile is a resource
   */
  private isResourceTile(tileId: number): boolean {
    // Crystal seams (42-45, 92-95) and ore seams (46-49, 96-99)
    return (tileId >= 42 && tileId <= 49) || (tileId >= 92 && tileId <= 99);
  }

  /**
   * Parse tiles content into 2D array
   */
  private parseTiles(content: string): number[][] {
    return content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line =>
        line
          .split(',')
          .filter(tile => tile.trim().length > 0)
          .map(tile => parseInt(tile.trim()))
      );
  }
}
