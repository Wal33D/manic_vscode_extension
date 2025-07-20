import { getTileInfo } from '../data/tileDefinitions';
import { getEnhancedTileInfo } from '../data/enhancedTileDefinitions';
import { getExtendedTileInfo } from '../data/extendedTileDefinitions';
import { TilePattern, PatternMatch, TileSuggestion } from './types';

export class TileSuggestionEngine {
  private patterns: TilePattern[] = [];

  constructor() {
    this.initializePatterns();
  }

  /**
   * Get smart suggestions for a tile position based on surrounding context
   */
  public getSuggestions(
    tiles: number[][],
    row: number,
    col: number,
    maxSuggestions: number = 5
  ): TileSuggestion[] {
    const suggestions: TileSuggestion[] = [];
    const surroundingTiles = this.getSurroundingTiles(tiles, row, col);

    // Check each pattern for matches
    for (const pattern of this.patterns) {
      const match = this.matchPattern(pattern, surroundingTiles);
      if (match.confidence > 0.5) {
        suggestions.push(...this.generateSuggestionsFromPattern(pattern, match, surroundingTiles));
      }
    }

    // Add context-aware suggestions
    suggestions.push(...this.getContextualSuggestions(surroundingTiles));

    // Sort by confidence and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxSuggestions)
      .filter((s, i, arr) => arr.findIndex(x => x.tileId === s.tileId) === i); // Remove duplicates
  }

  /**
   * Get tiles surrounding a position (3x3 grid)
   */
  private getSurroundingTiles(tiles: number[][], row: number, col: number): (number | null)[][] {
    const surrounding: (number | null)[][] = [];

    for (let r = -1; r <= 1; r++) {
      const rowData: (number | null)[] = [];
      for (let c = -1; c <= 1; c++) {
        const tileRow = row + r;
        const tileCol = col + c;

        if (
          tileRow >= 0 &&
          tileRow < tiles.length &&
          tileCol >= 0 &&
          tileCol < tiles[tileRow].length
        ) {
          rowData.push(tiles[tileRow][tileCol]);
        } else {
          rowData.push(null); // Out of bounds
        }
      }
      surrounding.push(rowData);
    }

    return surrounding;
  }

  /**
   * Initialize common tile patterns
   */
  private initializePatterns(): void {
    // Wall continuation pattern
    this.patterns.push({
      name: 'Wall Continuation',
      description: 'Continue wall segments',
      matcher: surrounding => {
        // const center = surrounding[1][1]; // Currently unused
        const left = surrounding[1][0];
        const right = surrounding[1][2];
        const top = surrounding[0][1];
        const bottom = surrounding[2][1];

        // Check horizontal walls
        if (this.isWall(left) && this.isWall(right)) {
          return { confidence: 0.9, data: { wallType: left } };
        }

        // Check vertical walls
        if (this.isWall(top) && this.isWall(bottom)) {
          return { confidence: 0.9, data: { wallType: top } };
        }

        return { confidence: 0, data: {} };
      },
      suggester: match => {
        const wallType = (match.data.wallType as number) || 26;
        return [
          { tileId: wallType, reason: 'Continue wall segment', confidence: 0.9 },
          { tileId: wallType + 50, reason: 'Continue with reinforced wall', confidence: 0.7 },
        ];
      },
    });

    // Resource cluster pattern
    this.patterns.push({
      name: 'Resource Cluster',
      description: 'Group resources together',
      matcher: surrounding => {
        let crystalCount = 0;
        let oreCount = 0;

        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            if (r === 1 && c === 1) {
              continue;
            } // Skip center
            const tile = surrounding[r][c];
            if (this.isCrystalSeam(tile)) {
              crystalCount++;
            }
            if (this.isOreSeam(tile)) {
              oreCount++;
            }
          }
        }

        if (crystalCount >= 2 && crystalCount < 5) {
          return { confidence: 0.7, data: { type: 'crystal' } };
        }
        if (oreCount >= 2 && oreCount < 5) {
          return { confidence: 0.7, data: { type: 'ore' } };
        }

        return { confidence: 0, data: {} };
      },
      suggester: match => {
        if (match.data.type === 'crystal') {
          return [
            { tileId: 42, reason: 'Group crystal seams together', confidence: 0.8 },
            { tileId: 43, reason: 'Crystal seam variant', confidence: 0.7 },
          ];
        } else if (match.data.type === 'ore') {
          return [
            { tileId: 46, reason: 'Group ore seams together', confidence: 0.8 },
            { tileId: 47, reason: 'Ore seam variant', confidence: 0.7 },
          ];
        }
        return [];
      },
    });

    // Building area pattern
    this.patterns.push({
      name: 'Building Area',
      description: 'Create buildable areas',
      matcher: surrounding => {
        let groundCount = 0;

        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            if (surrounding[r][c] === 1) {
              groundCount++;
            }
          }
        }

        if (groundCount >= 5) {
          // Only trigger for many ground tiles
          return { confidence: 0.7, data: {} };
        }

        return { confidence: 0, data: {} };
      },
      suggester: () => [
        { tileId: 1, reason: 'Extend buildable area', confidence: 0.8 },
        { tileId: 13, reason: 'Power path for building area', confidence: 0.6 },
      ],
    });

    // Hazard isolation pattern
    this.patterns.push({
      name: 'Hazard Isolation',
      description: 'Isolate hazardous tiles',
      matcher: surrounding => {
        let hazardCount = 0;

        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            if (r === 1 && c === 1) {
              continue;
            }
            const tile = surrounding[r][c];
            if (this.isHazard(tile)) {
              hazardCount++;
            }
          }
        }

        if (hazardCount > 0) {
          return { confidence: 0.8, data: {} };
        }

        return { confidence: 0, data: {} };
      },
      suggester: () => [
        { tileId: 38, reason: 'Solid rock to contain hazard', confidence: 0.9 },
        { tileId: 88, reason: 'Reinforced solid rock for better containment', confidence: 0.8 },
      ],
    });

    // Path smoothing pattern
    this.patterns.push({
      name: 'Path Smoothing',
      description: 'Create smooth paths',
      matcher: surrounding => {
        const paths = [];

        // Check for path-like tiles (ground, rubble)
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const tile = surrounding[r][c];
            if (tile !== null && (tile === 1 || (tile >= 2 && tile <= 5))) {
              paths.push({ r, c });
            }
          }
        }

        // If we have a line of paths, suggest continuing it
        if (paths.length >= 2) {
          return { confidence: 0.85, data: { pathType: 1 } }; // Higher confidence for path pattern
        }

        return { confidence: 0, data: {} };
      },
      suggester: _match => [
        { tileId: 1, reason: 'Continue path with ground', confidence: 0.8 },
        { tileId: 2, reason: 'Light rubble for variety', confidence: 0.6 },
      ],
    });
  }

  /**
   * Get contextual suggestions based on tile analysis
   */
  private getContextualSuggestions(surrounding: (number | null)[][]): TileSuggestion[] {
    const suggestions: TileSuggestion[] = [];
    const tileCounts = new Map<number, number>();

    // Count surrounding tile types
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (r === 1 && c === 1) {
          continue;
        } // Skip center
        const tile = surrounding[r][c];
        if (tile !== null) {
          tileCounts.set(tile, (tileCounts.get(tile) || 0) + 1);
        }
      }
    }

    // Suggest most common surrounding tile
    const sortedTiles = Array.from(tileCounts.entries()).sort((a, b) => b[1] - a[1]);

    if (sortedTiles.length > 0 && sortedTiles[0][1] >= 2) {
      const [mostCommonTile, count] = sortedTiles[0];
      const tileInfo = this.getTileInfo(mostCommonTile);

      suggestions.push({
        tileId: mostCommonTile,
        reason: `Match surrounding ${tileInfo?.name || `tile ${mostCommonTile}`}`,
        confidence: 0.5 + count * 0.05, // Higher confidence for many surrounding tiles
      });
    }

    // Suggest complementary tiles
    for (const [tile, count] of tileCounts) {
      const complementary = this.getComplementaryTile(tile);
      if (complementary && count >= 2) {
        const tileInfo = this.getTileInfo(complementary);
        suggestions.push({
          tileId: complementary,
          reason: `Complement nearby tiles with ${tileInfo?.name || `tile ${complementary}`}`,
          confidence: 0.65, // Higher confidence for complementary tiles
        });
      }
    }

    return suggestions;
  }

  /**
   * Match a pattern against surrounding tiles
   */
  private matchPattern(pattern: TilePattern, surrounding: (number | null)[][]): PatternMatch {
    return pattern.matcher(surrounding);
  }

  /**
   * Generate suggestions from a matched pattern
   */
  private generateSuggestionsFromPattern(
    pattern: TilePattern,
    match: PatternMatch,
    surrounding: (number | null)[][]
  ): TileSuggestion[] {
    return pattern.suggester(match, surrounding);
  }

  /**
   * Check if a tile is a wall type
   */
  private isWall(tile: number | null): boolean {
    if (tile === null) {
      return false;
    }
    return (tile >= 26 && tile <= 41) || (tile >= 76 && tile <= 91);
  }

  /**
   * Check if a tile is a crystal seam
   */
  private isCrystalSeam(tile: number | null): boolean {
    if (tile === null) {
      return false;
    }
    return (tile >= 42 && tile <= 45) || (tile >= 92 && tile <= 95);
  }

  /**
   * Check if a tile is an ore seam
   */
  private isOreSeam(tile: number | null): boolean {
    if (tile === null) {
      return false;
    }
    return (tile >= 46 && tile <= 49) || (tile >= 96 && tile <= 99);
  }

  /**
   * Check if a tile is hazardous
   */
  private isHazard(tile: number | null): boolean {
    if (tile === null) {
      return false;
    }
    return tile === 6 || tile === 11 || tile === 12 || tile === 64; // Lava, water, slug hole, lava erosion
  }

  /**
   * Get complementary tile for a given tile
   */
  private getComplementaryTile(tile: number): number | null {
    // Ground complements walls
    if (tile === 1) {
      return 26;
    } // Ground -> Dirt wall

    // Walls complement ground
    if (this.isWall(tile)) {
      return 1;
    }

    // Crystal complements ore
    if (this.isCrystalSeam(tile)) {
      return 46;
    } // Crystal -> Ore
    if (this.isOreSeam(tile)) {
      return 42;
    } // Ore -> Crystal

    return null;
  }

  /**
   * Get tile information from any definition source
   */
  private getTileInfo(tileId: number) {
    return getTileInfo(tileId) || getEnhancedTileInfo(tileId) || getExtendedTileInfo(tileId);
  }
}
