export interface AutoTileRule {
  tileType: string;
  patterns: TilePattern[];
}

export interface TilePattern {
  name: string;
  // Bitmask representing neighbor tiles (8 directions)
  // Bit order: NW, N, NE, W, E, SW, S, SE
  neighborMask: number;
  resultTileId: number;
}

export interface NeighborInfo {
  nw: boolean;
  n: boolean;
  ne: boolean;
  w: boolean;
  e: boolean;
  sw: boolean;
  s: boolean;
  se: boolean;
}

// Common tile types that support auto-tiling
export enum AutoTileType {
  WALL = 'wall',
  WATER = 'water',
  LAVA = 'lava',
  CRYSTAL = 'crystal',
  ORE = 'ore',
}

// Auto-tile configurations for different tile types
export const AUTO_TILE_RULES: Map<AutoTileType, AutoTileRule> = new Map([
  [
    AutoTileType.WALL,
    {
      tileType: 'rock',
      patterns: [
        // Solid rock variants based on neighbors
        { name: 'solid_center', neighborMask: 0b11111111, resultTileId: 38 },
        { name: 'solid_edge_n', neighborMask: 0b00011111, resultTileId: 39 },
        { name: 'solid_edge_s', neighborMask: 0b11111000, resultTileId: 40 },
        { name: 'solid_edge_e', neighborMask: 0b11000111, resultTileId: 41 },
        { name: 'solid_edge_w', neighborMask: 0b01111100, resultTileId: 37 },
        { name: 'solid_corner_ne', neighborMask: 0b00000111, resultTileId: 35 },
        { name: 'solid_corner_nw', neighborMask: 0b00011100, resultTileId: 36 },
        { name: 'solid_corner_se', neighborMask: 0b11000001, resultTileId: 43 },
        { name: 'solid_corner_sw', neighborMask: 0b01110000, resultTileId: 44 },
        // Hard rock for partial connections
        { name: 'hard_default', neighborMask: 0b00000000, resultTileId: 34 },
      ],
    },
  ],
  [
    AutoTileType.WATER,
    {
      tileType: 'water',
      patterns: [
        // Water tiles with shore detection
        { name: 'water_center', neighborMask: 0b11111111, resultTileId: 11 },
        { name: 'water_shore_n', neighborMask: 0b00011111, resultTileId: 12 },
        { name: 'water_shore_s', neighborMask: 0b11111000, resultTileId: 13 },
        { name: 'water_shore_e', neighborMask: 0b11000111, resultTileId: 14 },
        { name: 'water_shore_w', neighborMask: 0b01111100, resultTileId: 15 },
        { name: 'water_corner', neighborMask: 0b00000000, resultTileId: 16 },
      ],
    },
  ],
  [
    AutoTileType.LAVA,
    {
      tileType: 'lava',
      patterns: [
        // Lava flow patterns
        { name: 'lava_center', neighborMask: 0b11111111, resultTileId: 6 },
        { name: 'lava_flow_n', neighborMask: 0b00011111, resultTileId: 7 },
        { name: 'lava_flow_s', neighborMask: 0b11111000, resultTileId: 8 },
        { name: 'lava_flow_e', neighborMask: 0b11000111, resultTileId: 9 },
        { name: 'lava_flow_w', neighborMask: 0b01111100, resultTileId: 10 },
      ],
    },
  ],
  [
    AutoTileType.CRYSTAL,
    {
      tileType: 'crystal',
      patterns: [
        // Crystal seam patterns
        { name: 'crystal_horizontal', neighborMask: 0b00010100, resultTileId: 42 },
        { name: 'crystal_vertical', neighborMask: 0b01000001, resultTileId: 43 },
        { name: 'crystal_corner', neighborMask: 0b00010001, resultTileId: 44 },
        { name: 'crystal_single', neighborMask: 0b00000000, resultTileId: 45 },
      ],
    },
  ],
  [
    AutoTileType.ORE,
    {
      tileType: 'ore',
      patterns: [
        // Ore seam patterns
        { name: 'ore_horizontal', neighborMask: 0b00010100, resultTileId: 46 },
        { name: 'ore_vertical', neighborMask: 0b01000001, resultTileId: 47 },
        { name: 'ore_corner', neighborMask: 0b00010001, resultTileId: 48 },
        { name: 'ore_single', neighborMask: 0b00000000, resultTileId: 49 },
      ],
    },
  ],
]);

export class AutoTiler {
  private tiles: number[][];
  private rows: number;
  private cols: number;

  constructor(tiles: number[][], rows: number, cols: number) {
    this.tiles = tiles;
    this.rows = rows;
    this.cols = cols;
  }

  /**
   * Get the auto-tile type for a given tile ID
   */
  private getAutoTileType(tileId: number): AutoTileType | null {
    // Wall/Rock tiles (30-44)
    if (tileId >= 30 && tileId <= 44) {
      return AutoTileType.WALL;
    }
    // Water tiles (11-16)
    if (tileId >= 11 && tileId <= 16) {
      return AutoTileType.WATER;
    }
    // Lava tiles (6-10)
    if (tileId >= 6 && tileId <= 10) {
      return AutoTileType.LAVA;
    }
    // Crystal tiles (42-45)
    if (tileId >= 42 && tileId <= 45) {
      return AutoTileType.CRYSTAL;
    }
    // Ore tiles (46-49)
    if (tileId >= 46 && tileId <= 49) {
      return AutoTileType.ORE;
    }
    return null;
  }

  /**
   * Check if a tile at given position matches the auto-tile type
   */
  private isSameTileType(row: number, col: number, tileType: AutoTileType): boolean {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      // Treat out-of-bounds as matching (for edge tiles)
      return true;
    }
    const tileId = this.tiles[row][col];
    return this.getAutoTileType(tileId) === tileType;
  }

  /**
   * Get neighbor information for a tile
   */
  private getNeighborInfo(row: number, col: number, tileType: AutoTileType): NeighborInfo {
    return {
      nw: this.isSameTileType(row - 1, col - 1, tileType),
      n: this.isSameTileType(row - 1, col, tileType),
      ne: this.isSameTileType(row - 1, col + 1, tileType),
      w: this.isSameTileType(row, col - 1, tileType),
      e: this.isSameTileType(row, col + 1, tileType),
      sw: this.isSameTileType(row + 1, col - 1, tileType),
      s: this.isSameTileType(row + 1, col, tileType),
      se: this.isSameTileType(row + 1, col + 1, tileType),
    };
  }

  /**
   * Convert neighbor info to bitmask
   */
  private neighborInfoToBitmask(info: NeighborInfo): number {
    let mask = 0;
    if (info.nw) {
      mask |= 1 << 7;
    }
    if (info.n) {
      mask |= 1 << 6;
    }
    if (info.ne) {
      mask |= 1 << 5;
    }
    if (info.w) {
      mask |= 1 << 4;
    }
    if (info.e) {
      mask |= 1 << 3;
    }
    if (info.sw) {
      mask |= 1 << 2;
    }
    if (info.s) {
      mask |= 1 << 1;
    }
    if (info.se) {
      mask |= 1 << 0;
    }
    return mask;
  }

  /**
   * Check if a pattern matches the neighbor mask
   */
  private patternMatches(patternMask: number, neighborMask: number): boolean {
    // For cardinal directions (N, S, E, W), require exact match
    const cardinalBits = 0b01011010; // Bits for N, S, E, W
    const cardinalMatch = (patternMask & cardinalBits) === (neighborMask & cardinalBits);

    // For diagonal directions, allow flexibility
    const diagonalBits = 0b10100101; // Bits for NW, NE, SW, SE
    const diagonalRequired = patternMask & diagonalBits;
    const diagonalPresent = neighborMask & diagonalBits;
    const diagonalMatch = (diagonalRequired & diagonalPresent) === diagonalRequired;

    return cardinalMatch && diagonalMatch;
  }

  /**
   * Get the best matching tile for the given position
   */
  public getAutoTile(row: number, col: number, baseTileId: number): number {
    const tileType = this.getAutoTileType(baseTileId);
    if (!tileType) {
      return baseTileId;
    }

    const rule = AUTO_TILE_RULES.get(tileType);
    if (!rule) {
      return baseTileId;
    }

    const neighborInfo = this.getNeighborInfo(row, col, tileType);
    const neighborMask = this.neighborInfoToBitmask(neighborInfo);

    // Find the best matching pattern
    let bestMatch: TilePattern | null = null;
    let bestScore = -1;

    for (const pattern of rule.patterns) {
      if (this.patternMatches(pattern.neighborMask, neighborMask)) {
        // Calculate match score (more bits matching = higher score)
        const matchingBits = ~(pattern.neighborMask ^ neighborMask) & 0xff;
        const score = this.countBits(matchingBits);

        if (score > bestScore) {
          bestScore = score;
          bestMatch = pattern;
        }
      }
    }

    return bestMatch ? bestMatch.resultTileId : baseTileId;
  }

  /**
   * Count the number of set bits in a number
   */
  private countBits(n: number): number {
    let count = 0;
    while (n) {
      count += n & 1;
      n >>= 1;
    }
    return count;
  }

  /**
   * Auto-tile a specific region
   */
  public autoTileRegion(
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    baseTileId: number
  ): Array<{ row: number; col: number; tileId: number }> {
    const changes: Array<{ row: number; col: number; tileId: number }> = [];

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
          const autoTileId = this.getAutoTile(row, col, baseTileId);
          if (autoTileId !== this.tiles[row][col]) {
            changes.push({ row, col, tileId: autoTileId });
          }
        }
      }
    }

    return changes;
  }

  /**
   * Update tiles and recalculate auto-tiling for affected areas
   */
  public updateAndAutoTile(
    tilesToUpdate: Array<{ row: number; col: number; tileId: number }>
  ): Array<{ row: number; col: number; tileId: number }> {
    const affectedPositions = new Set<string>();
    const changes: Array<{ row: number; col: number; tileId: number }> = [];

    // First, apply the updates
    for (const tile of tilesToUpdate) {
      if (tile.row >= 0 && tile.row < this.rows && tile.col >= 0 && tile.col < this.cols) {
        this.tiles[tile.row][tile.col] = tile.tileId;

        // Mark this position and all neighbors as affected
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const r = tile.row + dr;
            const c = tile.col + dc;
            if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
              affectedPositions.add(`${r},${c}`);
            }
          }
        }
      }
    }

    // Then, recalculate auto-tiling for all affected positions
    for (const pos of affectedPositions) {
      const [row, col] = pos.split(',').map(Number);
      const currentTileId = this.tiles[row][col];
      const autoTileId = this.getAutoTile(row, col, currentTileId);

      if (autoTileId !== currentTileId) {
        changes.push({ row, col, tileId: autoTileId });
        this.tiles[row][col] = autoTileId;
      }
    }

    return changes;
  }

  /**
   * Get auto-tiled positions for multiple tile placements
   */
  public getAutoTiledPositions(
    positions: Array<{ row: number; col: number; tileId: number }>
  ): Array<{ row: number; col: number; tileId: number }> {
    const results: Array<{ row: number; col: number; tileId: number }> = [];

    // Apply tiles temporarily
    const originalTiles: Array<{ row: number; col: number; tileId: number }> = [];
    for (const pos of positions) {
      if (pos.row >= 0 && pos.row < this.rows && pos.col >= 0 && pos.col < this.cols) {
        originalTiles.push({
          row: pos.row,
          col: pos.col,
          tileId: this.tiles[pos.row][pos.col],
        });
        this.tiles[pos.row][pos.col] = pos.tileId;
      }
    }

    // Calculate auto-tiling for each position
    for (const pos of positions) {
      if (pos.row >= 0 && pos.row < this.rows && pos.col >= 0 && pos.col < this.cols) {
        const autoTileId = this.getAutoTile(pos.row, pos.col, pos.tileId);
        results.push({
          row: pos.row,
          col: pos.col,
          tileId: autoTileId,
        });
      }
    }

    // Restore original tiles
    for (const tile of originalTiles) {
      this.tiles[tile.row][tile.col] = tile.tileId;
    }

    return results;
  }
}

/**
 * Check if a tile supports auto-tiling
 */
export function supportsAutoTiling(tileId: number): boolean {
  // Wall/Rock tiles
  if (tileId >= 30 && tileId <= 44) {
    return true;
  }
  // Water tiles
  if (tileId >= 11 && tileId <= 16) {
    return true;
  }
  // Lava tiles
  if (tileId >= 6 && tileId <= 10) {
    return true;
  }
  // Crystal tiles
  if (tileId >= 42 && tileId <= 45) {
    return true;
  }
  // Ore tiles
  if (tileId >= 46 && tileId <= 49) {
    return true;
  }

  return false;
}

/**
 * Get the base tile ID for auto-tiling
 */
export function getBaseTileId(tileType: AutoTileType): number {
  switch (tileType) {
    case AutoTileType.WALL:
      return 34; // Hard rock
    case AutoTileType.WATER:
      return 11; // Water
    case AutoTileType.LAVA:
      return 6; // Lava
    case AutoTileType.CRYSTAL:
      return 42; // Crystal seam
    case AutoTileType.ORE:
      return 46; // Ore seam
    default:
      return 1; // Ground
  }
}
