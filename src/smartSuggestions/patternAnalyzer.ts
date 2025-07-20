// Removed unused imports

export interface PatternAnalysis {
  commonPatterns: TilePattern[];
  symmetryScore: number;
  balanceMetrics: BalanceMetrics;
  suggestions: string[];
}

export interface TilePattern {
  name: string;
  occurrences: number;
  locations: { row: number; col: number }[];
  description: string;
}

export interface BalanceMetrics {
  resourceDistribution: {
    crystals: number;
    ore: number;
    balanced: boolean;
  };
  hazardCoverage: {
    percentage: number;
    isolated: boolean;
  };
  buildableArea: {
    percentage: number;
    largestContiguous: number;
  };
  accessibility: {
    unreachableAreas: number;
    chokePoints: { row: number; col: number }[];
  };
}

export class PatternAnalyzer {
  /**
   * Analyze tile patterns in a map
   */
  public analyzeMap(tiles: number[][]): PatternAnalysis {
    const patterns = this.findCommonPatterns(tiles);
    const symmetryScore = this.calculateSymmetry(tiles);
    const balanceMetrics = this.analyzeBalance(tiles);
    const suggestions = this.generateSuggestions(tiles, patterns, balanceMetrics);

    return {
      commonPatterns: patterns,
      symmetryScore,
      balanceMetrics,
      suggestions,
    };
  }

  /**
   * Find common patterns in the map
   */
  private findCommonPatterns(tiles: number[][]): TilePattern[] {
    const patterns: TilePattern[] = [];

    // Check for room patterns
    patterns.push(...this.findRoomPatterns(tiles));

    // Check for corridor patterns
    patterns.push(...this.findCorridorPatterns(tiles));

    // Check for resource patterns
    patterns.push(...this.findResourcePatterns(tiles));

    // Check for defensive patterns
    patterns.push(...this.findDefensivePatterns(tiles));

    return patterns;
  }

  /**
   * Find room-like patterns (enclosed spaces)
   */
  private findRoomPatterns(tiles: number[][]): TilePattern[] {
    const patterns: TilePattern[] = [];
    const visited = new Set<string>();

    for (let row = 1; row < tiles.length - 1; row++) {
      for (let col = 1; col < tiles[row].length - 1; col++) {
        const key = `${row},${col}`;
        if (visited.has(key)) {
          continue;
        }

        const room = this.detectRoom(tiles, row, col, visited);
        if (room.size >= 9) {
          // At least 3x3
          patterns.push({
            name: 'Room Pattern',
            occurrences: 1,
            locations: Array.from(room).map(k => {
              const [r, c] = k.split(',').map(Number);
              return { row: r, col: c };
            }),
            description: `${Math.sqrt(room.size).toFixed(0)}x${Math.sqrt(room.size).toFixed(0)} enclosed space`,
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Detect a room starting from a position
   */
  private detectRoom(
    tiles: number[][],
    startRow: number,
    startCol: number,
    visited: Set<string>
  ): Set<string> {
    const room = new Set<string>();
    const queue: [number, number][] = [[startRow, startCol]];
    const isGround = (tile: number) => tile === 1;

    while (queue.length > 0) {
      const [row, col] = queue.shift()!;
      const key = `${row},${col}`;

      if (visited.has(key) || !isGround(tiles[row]?.[col])) {
        continue;
      }

      visited.add(key);
      room.add(key);

      // Check neighbors
      const neighbors = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ];

      for (const [r, c] of neighbors) {
        if (r >= 0 && r < tiles.length && c >= 0 && c < tiles[r].length) {
          queue.push([r, c]);
        }
      }
    }

    // Verify it's enclosed
    const isEnclosed = this.isAreaEnclosed(tiles, room);
    return isEnclosed ? room : new Set();
  }

  /**
   * Check if an area is enclosed by walls
   */
  private isAreaEnclosed(tiles: number[][], area: Set<string>): boolean {
    for (const key of area) {
      const [row, col] = key.split(',').map(Number);
      const neighbors = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ];

      for (const [r, c] of neighbors) {
        const neighborKey = `${r},${c}`;
        if (!area.has(neighborKey)) {
          // Check if it's a wall or out of bounds
          if (r < 0 || r >= tiles.length || c < 0 || c >= tiles[r].length) {
            continue;
          }
          const tile = tiles[r][c];
          if (!this.isWall(tile)) {
            return false; // Not enclosed
          }
        }
      }
    }

    return true;
  }

  /**
   * Find corridor patterns
   */
  private findCorridorPatterns(tiles: number[][]): TilePattern[] {
    const patterns: TilePattern[] = [];

    // Horizontal corridors
    for (let row = 0; row < tiles.length; row++) {
      let start = -1;
      for (let col = 0; col < tiles[row].length; col++) {
        if (tiles[row][col] === 1) {
          if (start === -1) {
            start = col;
          }
        } else {
          if (start !== -1 && col - start >= 5) {
            patterns.push({
              name: 'Horizontal Corridor',
              occurrences: 1,
              locations: Array.from({ length: col - start }, (_, i) => ({
                row,
                col: start + i,
              })),
              description: `Length ${col - start} corridor`,
            });
          }
          start = -1;
        }
      }
    }

    return patterns;
  }

  /**
   * Find resource patterns
   */
  private findResourcePatterns(tiles: number[][]): TilePattern[] {
    const patterns: TilePattern[] = [];
    const crystalClusters: { row: number; col: number }[][] = [];
    const oreClusters: { row: number; col: number }[][] = [];

    // Find clusters using flood fill
    const visited = new Set<string>();

    for (let row = 0; row < tiles.length; row++) {
      for (let col = 0; col < tiles[row].length; col++) {
        const key = `${row},${col}`;
        if (visited.has(key)) {
          continue;
        }

        const tile = tiles[row][col];
        if (this.isCrystalSeam(tile)) {
          const cluster = this.findCluster(tiles, row, col, this.isCrystalSeam, visited);
          if (cluster.length >= 3) {
            crystalClusters.push(cluster);
          }
        } else if (this.isOreSeam(tile)) {
          const cluster = this.findCluster(tiles, row, col, this.isOreSeam, visited);
          if (cluster.length >= 3) {
            oreClusters.push(cluster);
          }
        }
      }
    }

    // Add patterns for clusters
    crystalClusters.forEach(cluster => {
      patterns.push({
        name: 'Crystal Cluster',
        occurrences: 1,
        locations: cluster,
        description: `${cluster.length} crystal seams grouped together`,
      });
    });

    oreClusters.forEach(cluster => {
      patterns.push({
        name: 'Ore Cluster',
        occurrences: 1,
        locations: cluster,
        description: `${cluster.length} ore seams grouped together`,
      });
    });

    return patterns;
  }

  /**
   * Find a cluster of similar tiles
   */
  private findCluster(
    tiles: number[][],
    startRow: number,
    startCol: number,
    predicate: (tile: number) => boolean,
    visited: Set<string>
  ): { row: number; col: number }[] {
    const cluster: { row: number; col: number }[] = [];
    const queue: [number, number][] = [[startRow, startCol]];

    while (queue.length > 0) {
      const [row, col] = queue.shift()!;
      const key = `${row},${col}`;

      if (visited.has(key) || !predicate(tiles[row]?.[col] || 0)) {
        continue;
      }

      visited.add(key);
      cluster.push({ row, col });

      // Check all 8 neighbors for clustering
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) {
            continue;
          }
          const r = row + dr;
          const c = col + dc;
          if (r >= 0 && r < tiles.length && c >= 0 && c < tiles[r].length) {
            queue.push([r, c]);
          }
        }
      }
    }

    return cluster;
  }

  /**
   * Find defensive patterns
   */
  private findDefensivePatterns(tiles: number[][]): TilePattern[] {
    const patterns: TilePattern[] = [];

    // Find reinforced walls
    const reinforcedWalls: { row: number; col: number }[] = [];
    for (let row = 0; row < tiles.length; row++) {
      for (let col = 0; col < tiles[row].length; col++) {
        if (tiles[row][col] >= 76 && tiles[row][col] <= 99) {
          reinforcedWalls.push({ row, col });
        }
      }
    }

    if (reinforcedWalls.length >= 5) {
      patterns.push({
        name: 'Defensive Wall',
        occurrences: 1,
        locations: reinforcedWalls,
        description: `${reinforcedWalls.length} reinforced wall segments`,
      });
    }

    return patterns;
  }

  /**
   * Calculate map symmetry score
   */
  private calculateSymmetry(tiles: number[][]): number {
    let horizontalScore = 0;
    let verticalScore = 0;
    let totalComparisons = 0;

    // Check horizontal symmetry
    for (let row = 0; row < tiles.length; row++) {
      for (let col = 0; col < Math.floor(tiles[row].length / 2); col++) {
        const mirrorCol = tiles[row].length - 1 - col;
        if (tiles[row][col] === tiles[row][mirrorCol]) {
          horizontalScore++;
        }
        totalComparisons++;
      }
    }

    // Check vertical symmetry
    for (let row = 0; row < Math.floor(tiles.length / 2); row++) {
      for (let col = 0; col < tiles[row].length; col++) {
        const mirrorRow = tiles.length - 1 - row;
        if (tiles[row][col] === tiles[mirrorRow][col]) {
          verticalScore++;
        }
        totalComparisons++;
      }
    }

    return Math.max(horizontalScore, verticalScore) / totalComparisons;
  }

  /**
   * Analyze map balance
   */
  private analyzeBalance(tiles: number[][]): BalanceMetrics {
    let crystalCount = 0;
    let oreCount = 0;
    let hazardCount = 0;
    let groundCount = 0;
    const totalTiles = tiles.length * (tiles[0]?.length || 0);

    for (const row of tiles) {
      for (const tile of row) {
        if (this.isCrystalSeam(tile)) {
          crystalCount++;
        } else if (this.isOreSeam(tile)) {
          oreCount++;
        } else if (this.isHazard(tile)) {
          hazardCount++;
        } else if (tile === 1) {
          groundCount++;
        }
      }
    }

    // Find largest contiguous buildable area
    const largestArea = this.findLargestBuildableArea(tiles);

    // Find choke points
    const chokePoints = this.findChokePoints(tiles);

    return {
      resourceDistribution: {
        crystals: crystalCount,
        ore: oreCount,
        balanced: Math.abs(crystalCount - oreCount) <= Math.max(crystalCount, oreCount) * 0.3,
      },
      hazardCoverage: {
        percentage: (hazardCount / totalTiles) * 100,
        isolated: this.areHazardsIsolated(tiles),
      },
      buildableArea: {
        percentage: (groundCount / totalTiles) * 100,
        largestContiguous: largestArea,
      },
      accessibility: {
        unreachableAreas: 0, // TODO: Implement pathfinding check
        chokePoints,
      },
    };
  }

  /**
   * Find largest contiguous buildable area
   */
  private findLargestBuildableArea(tiles: number[][]): number {
    const visited = new Set<string>();
    let largestArea = 0;

    for (let row = 0; row < tiles.length; row++) {
      for (let col = 0; col < tiles[row].length; col++) {
        if (tiles[row][col] === 1 && !visited.has(`${row},${col}`)) {
          const area = this.floodFillArea(tiles, row, col, visited);
          largestArea = Math.max(largestArea, area);
        }
      }
    }

    return largestArea;
  }

  /**
   * Flood fill to find connected area size
   */
  private floodFillArea(
    tiles: number[][],
    startRow: number,
    startCol: number,
    visited: Set<string>
  ): number {
    const queue: [number, number][] = [[startRow, startCol]];
    let area = 0;

    while (queue.length > 0) {
      const [row, col] = queue.shift()!;
      const key = `${row},${col}`;

      if (visited.has(key) || tiles[row]?.[col] !== 1) {
        continue;
      }

      visited.add(key);
      area++;

      // Check 4 neighbors
      const neighbors = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ];

      for (const [r, c] of neighbors) {
        if (r >= 0 && r < tiles.length && c >= 0 && c < tiles[r].length) {
          queue.push([r, c]);
        }
      }
    }

    return area;
  }

  /**
   * Find choke points (narrow passages)
   */
  private findChokePoints(tiles: number[][]): { row: number; col: number }[] {
    const chokePoints: { row: number; col: number }[] = [];

    for (let row = 1; row < tiles.length - 1; row++) {
      for (let col = 1; col < tiles[row].length - 1; col++) {
        if (tiles[row][col] === 1) {
          // Check if it's a narrow passage
          const horizontal =
            !this.isPassable(tiles[row][col - 1]) && !this.isPassable(tiles[row][col + 1]);
          const vertical =
            !this.isPassable(tiles[row - 1][col]) && !this.isPassable(tiles[row + 1][col]);

          if (
            (horizontal &&
              this.isPassable(tiles[row - 1][col]) &&
              this.isPassable(tiles[row + 1][col])) ||
            (vertical &&
              this.isPassable(tiles[row][col - 1]) &&
              this.isPassable(tiles[row][col + 1]))
          ) {
            chokePoints.push({ row, col });
          }
        }
      }
    }

    return chokePoints;
  }

  /**
   * Check if hazards are properly isolated
   */
  private areHazardsIsolated(tiles: number[][]): boolean {
    for (let row = 0; row < tiles.length; row++) {
      for (let col = 0; col < tiles[row].length; col++) {
        if (this.isHazard(tiles[row][col])) {
          // Check if hazard has direct access to ground
          const neighbors = [
            [row - 1, col],
            [row + 1, col],
            [row, col - 1],
            [row, col + 1],
          ];

          for (const [r, c] of neighbors) {
            if (r >= 0 && r < tiles.length && c >= 0 && c < tiles[r].length) {
              if (tiles[r][c] === 1) {
                return false; // Hazard touches ground directly
              }
            }
          }
        }
      }
    }

    return true;
  }

  /**
   * Generate suggestions based on analysis
   */
  private generateSuggestions(
    _tiles: number[][],
    patterns: TilePattern[],
    metrics: BalanceMetrics
  ): string[] {
    const suggestions: string[] = [];

    // Resource balance suggestions
    if (!metrics.resourceDistribution.balanced) {
      if (metrics.resourceDistribution.crystals > metrics.resourceDistribution.ore) {
        suggestions.push('Consider adding more ore seams to balance resources');
      } else {
        suggestions.push('Consider adding more crystal seams to balance resources');
      }
    }

    // Hazard suggestions
    if (metrics.hazardCoverage.percentage > 20) {
      suggestions.push('High hazard coverage may make the map too difficult');
    }
    if (!metrics.hazardCoverage.isolated) {
      suggestions.push('Some hazards are not properly isolated - add walls around them');
    }

    // Building area suggestions
    if (metrics.buildableArea.percentage < 15) {
      suggestions.push('Limited buildable area - consider adding more ground tiles');
    }
    if (metrics.buildableArea.largestContiguous < 25) {
      suggestions.push('No large buildable areas found - create bigger open spaces');
    }

    // Choke point suggestions
    if (metrics.accessibility.chokePoints.length > 5) {
      suggestions.push(
        `Found ${metrics.accessibility.chokePoints.length} choke points - consider widening passages`
      );
    }

    // Pattern suggestions
    const roomCount = patterns.filter(p => p.name === 'Room Pattern').length;
    if (roomCount === 0) {
      suggestions.push('No enclosed rooms found - consider creating defined spaces');
    }

    return suggestions;
  }

  // Helper methods
  private isWall(tile: number): boolean {
    return (tile >= 26 && tile <= 41) || (tile >= 76 && tile <= 91);
  }

  private isCrystalSeam(tile: number): boolean {
    return (tile >= 42 && tile <= 45) || (tile >= 92 && tile <= 95);
  }

  private isOreSeam(tile: number): boolean {
    return (tile >= 46 && tile <= 49) || (tile >= 96 && tile <= 99);
  }

  private isHazard(tile: number): boolean {
    return tile === 6 || tile === 11 || tile === 12 || tile === 64;
  }

  private isPassable(tile: number): boolean {
    return tile === 1 || (tile >= 2 && tile <= 5); // Ground and rubble
  }
}
