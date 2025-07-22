import { AutoTiler, supportsAutoTiling } from './autoTiling';

describe('AutoTiling', () => {
  describe('supportsAutoTiling', () => {
    it('should return true for rock/wall tiles', () => {
      expect(supportsAutoTiling(30)).toBe(true); // Loose rock
      expect(supportsAutoTiling(35)).toBe(true); // Hard rock
      expect(supportsAutoTiling(40)).toBe(true); // Solid rock
    });

    it('should return true for water tiles', () => {
      expect(supportsAutoTiling(11)).toBe(true); // Water
      expect(supportsAutoTiling(15)).toBe(true); // Water variant
    });

    it('should return true for lava tiles', () => {
      expect(supportsAutoTiling(6)).toBe(true); // Lava
      expect(supportsAutoTiling(10)).toBe(true); // Lava variant
    });

    it('should return true for crystal tiles', () => {
      expect(supportsAutoTiling(42)).toBe(true); // Energy crystal
      expect(supportsAutoTiling(45)).toBe(true); // Crystal variant
    });

    it('should return true for ore tiles', () => {
      expect(supportsAutoTiling(46)).toBe(true); // Ore
      expect(supportsAutoTiling(49)).toBe(true); // Ore variant
    });

    it('should return false for non-auto-tile types', () => {
      expect(supportsAutoTiling(1)).toBe(false); // Ground
      expect(supportsAutoTiling(101)).toBe(false); // Building
      expect(supportsAutoTiling(0)).toBe(false); // Empty
    });
  });

  describe('AutoTiler.getAutoTiledPositions', () => {
    it('should auto-tile multiple positions', () => {
      // Create a 10x10 map filled with ground (1)
      const tiles = Array(10)
        .fill(null)
        .map(() => Array(10).fill(1));

      const positions = [
        { row: 5, col: 5, tileId: 30 },
        { row: 5, col: 6, tileId: 30 },
        { row: 6, col: 5, tileId: 30 },
        { row: 6, col: 6, tileId: 30 },
      ];

      // Set initial tiles
      positions.forEach(pos => {
        tiles[pos.row][pos.col] = pos.tileId;
      });

      const autoTiler = new AutoTiler(tiles, 10, 10);
      const results = autoTiler.getAutoTiledPositions(positions);

      expect(results).toHaveLength(4);
      results.forEach((result: { row: number; col: number; tileId: number }) => {
        expect(result.tileId).toBeGreaterThanOrEqual(30);
        expect(result.tileId).toBeLessThanOrEqual(44);
      });
    });

    it('should handle water tiles with proper variants', () => {
      const tiles = Array(10)
        .fill(null)
        .map(() => Array(10).fill(1));

      // Create a water line
      const positions = [
        { row: 5, col: 3, tileId: 11 },
        { row: 5, col: 4, tileId: 11 },
        { row: 5, col: 5, tileId: 11 },
        { row: 5, col: 6, tileId: 11 },
        { row: 5, col: 7, tileId: 11 },
      ];

      positions.forEach(pos => {
        tiles[pos.row][pos.col] = pos.tileId;
      });

      const autoTiler = new AutoTiler(tiles, 10, 10);
      const results = autoTiler.getAutoTiledPositions(positions);

      // Middle water tiles should connect horizontally
      results.forEach((result: { row: number; col: number; tileId: number }) => {
        expect(result.tileId).toBeGreaterThanOrEqual(11);
        expect(result.tileId).toBeLessThanOrEqual(16); // Water range
      });
    });

    it('should return original tile if no matching pattern', () => {
      const tiles = Array(10)
        .fill(null)
        .map(() => Array(10).fill(1));

      // Single isolated tile
      const positions = [{ row: 5, col: 5, tileId: 30 }];
      tiles[5][5] = 30;

      const autoTiler = new AutoTiler(tiles, 10, 10);
      const results = autoTiler.getAutoTiledPositions(positions);

      expect(results[0].tileId).toBe(34); // Isolated rock gets hard_default variant
    });
  });

  describe('Edge cases', () => {
    it('should handle tiles at map boundaries', () => {
      const tiles = Array(10)
        .fill(null)
        .map(() => Array(10).fill(1));

      // Top-left corner
      tiles[0][0] = 30;
      const tlPositions = [{ row: 0, col: 0, tileId: 30 }];

      const autoTiler = new AutoTiler(tiles, 10, 10);
      const tlResults = autoTiler.getAutoTiledPositions(tlPositions);
      expect(tlResults[0].tileId).toBeGreaterThanOrEqual(30);

      // Bottom-right corner
      tiles[9][9] = 30;
      const brPositions = [{ row: 9, col: 9, tileId: 30 }];
      const brResults = autoTiler.getAutoTiledPositions(brPositions);
      expect(brResults[0].tileId).toBeGreaterThanOrEqual(30);
    });

    it('should handle empty positions array', () => {
      const tiles = Array(10)
        .fill(null)
        .map(() => Array(10).fill(1));
      const autoTiler = new AutoTiler(tiles, 10, 10);
      const results = autoTiler.getAutoTiledPositions([]);
      expect(results).toEqual([]);
    });

    it('should handle single row/column maps', () => {
      const singleRow = [[1, 1, 1, 1, 1]];
      const autoTiler = new AutoTiler(singleRow, 1, 5);

      singleRow[0][2] = 30;
      const positions = [{ row: 0, col: 2, tileId: 30 }];
      const results = autoTiler.getAutoTiledPositions(positions);
      expect(results[0].tileId).toBeGreaterThanOrEqual(30);
    });
  });
});
