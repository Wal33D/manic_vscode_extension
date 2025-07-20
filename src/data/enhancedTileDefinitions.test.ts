import { describe, expect, it } from '@jest/globals';
import {
  ENHANCED_TILE_DEFINITIONS,
  isReinforcedTile,
  getBaseTileId,
  getReinforcedTileId,
  getEnhancedTileInfo,
  getEnhancedTileName,
  getEnhancedTileDescription,
  getTileColor,
} from './enhancedTileDefinitions';

describe('Enhanced Tile Definitions', () => {
  describe('ENHANCED_TILE_DEFINITIONS', () => {
    it('should contain all 90 tile definitions', () => {
      expect(ENHANCED_TILE_DEFINITIONS.size).toBe(90);
    });

    it('should have proper structure for each tile', () => {
      ENHANCED_TILE_DEFINITIONS.forEach((tile, id) => {
        expect(tile).toHaveProperty('id');
        expect(tile).toHaveProperty('name');
        expect(tile).toHaveProperty('description');
        expect(tile).toHaveProperty('category');
        expect(tile).toHaveProperty('canWalk');
        expect(tile).toHaveProperty('canDrill');
        expect(tile).toHaveProperty('canBuild');
        expect(tile.id).toBe(id);
      });
    });

    it('should have reinforced variants for appropriate tiles', () => {
      // Check that tiles 26-53 have reinforced variants (76-103)
      for (let baseId = 26; baseId <= 53; baseId++) {
        const baseTile = ENHANCED_TILE_DEFINITIONS.get(baseId);
        const reinforcedTile = ENHANCED_TILE_DEFINITIONS.get(baseId + 50);

        expect(baseTile).toBeDefined();
        expect(reinforcedTile).toBeDefined();
        expect(reinforcedTile?.name).toContain(baseTile?.name);
        expect(reinforcedTile?.name).toContain('(Reinforced)');
      }
    });

    it('should have proper color definitions for visual tiles', () => {
      const tilesWithColor = [1, 6, 11, 14, 26, 30, 34, 38, 42, 46, 50];

      tilesWithColor.forEach(tileId => {
        const tile = ENHANCED_TILE_DEFINITIONS.get(tileId);
        expect(tile?.color).toBeDefined();
        expect(tile?.color?.r).toBeGreaterThanOrEqual(0);
        expect(tile?.color?.r).toBeLessThanOrEqual(255);
        expect(tile?.color?.g).toBeGreaterThanOrEqual(0);
        expect(tile?.color?.g).toBeLessThanOrEqual(255);
        expect(tile?.color?.b).toBeGreaterThanOrEqual(0);
        expect(tile?.color?.b).toBeLessThanOrEqual(255);
      });
    });

    it('should properly categorize tiles', () => {
      const categoryTests = [
        { id: 1, category: 'ground' },
        { id: 6, category: 'hazard' },
        { id: 26, category: 'wall' },
        { id: 42, category: 'resource' },
        { id: 12, category: 'hazard' },
        { id: 13, category: 'special' },
      ];

      categoryTests.forEach(({ id, category }) => {
        const tile = ENHANCED_TILE_DEFINITIONS.get(id);
        expect(tile?.category).toBe(category);
      });
    });
  });

  describe('isReinforcedTile', () => {
    it('should correctly identify reinforced tiles', () => {
      expect(isReinforcedTile(76)).toBe(true);
      expect(isReinforcedTile(88)).toBe(true);
      expect(isReinforcedTile(103)).toBe(true);
      expect(isReinforcedTile(114)).toBe(true);
      expect(isReinforcedTile(115)).toBe(true);
    });

    it('should correctly identify non-reinforced tiles', () => {
      expect(isReinforcedTile(1)).toBe(false);
      expect(isReinforcedTile(26)).toBe(false);
      expect(isReinforcedTile(42)).toBe(false);
      expect(isReinforcedTile(53)).toBe(false);
      expect(isReinforcedTile(75)).toBe(false);
    });
  });

  describe('getBaseTileId', () => {
    it('should return base tile ID for reinforced tiles', () => {
      expect(getBaseTileId(76)).toBe(26);
      expect(getBaseTileId(88)).toBe(38);
      expect(getBaseTileId(103)).toBe(53);
      expect(getBaseTileId(114)).toBe(64);
      expect(getBaseTileId(115)).toBe(65);
    });

    it('should return same ID for non-reinforced tiles', () => {
      expect(getBaseTileId(1)).toBe(1);
      expect(getBaseTileId(26)).toBe(26);
      expect(getBaseTileId(42)).toBe(42);
      expect(getBaseTileId(53)).toBe(53);
    });
  });

  describe('getReinforcedTileId', () => {
    it('should return reinforced tile ID for reinforceable tiles', () => {
      expect(getReinforcedTileId(26)).toBe(76);
      expect(getReinforcedTileId(38)).toBe(88);
      expect(getReinforcedTileId(53)).toBe(103);
      expect(getReinforcedTileId(64)).toBe(114);
      expect(getReinforcedTileId(65)).toBe(115);
    });

    it('should return null for non-reinforceable tiles', () => {
      expect(getReinforcedTileId(1)).toBeNull();
      expect(getReinforcedTileId(6)).toBeNull();
      expect(getReinforcedTileId(12)).toBeNull();
      expect(getReinforcedTileId(75)).toBeNull();
    });
  });

  describe('getEnhancedTileInfo', () => {
    it('should return tile info for valid IDs', () => {
      const tile1 = getEnhancedTileInfo(1);
      expect(tile1).toBeDefined();
      expect(tile1?.name).toBe('Ground');
      expect(tile1?.canBuild).toBe(true);

      const tile38 = getEnhancedTileInfo(38);
      expect(tile38).toBeDefined();
      expect(tile38?.name).toBe('Solid Rock Regular');
      expect(tile38?.canDrill).toBe(false);

      const tile88 = getEnhancedTileInfo(88);
      expect(tile88).toBeDefined();
      expect(tile88?.name).toContain('Reinforced');
    });

    it('should return undefined for invalid IDs', () => {
      expect(getEnhancedTileInfo(0)).toBeUndefined();
      expect(getEnhancedTileInfo(116)).toBeUndefined();
      expect(getEnhancedTileInfo(999)).toBeUndefined();
    });
  });

  describe('getEnhancedTileName', () => {
    it('should return tile name for valid IDs', () => {
      expect(getEnhancedTileName(1)).toBe('Ground');
      expect(getEnhancedTileName(38)).toBe('Solid Rock Regular');
      expect(getEnhancedTileName(42)).toBe('Crystal Seam Regular');
      expect(getEnhancedTileName(88)).toContain('Solid Rock Regular (Reinforced)');
    });

    it('should return unknown tile message for invalid IDs', () => {
      expect(getEnhancedTileName(0)).toBe('Unknown Tile (0)');
      expect(getEnhancedTileName(999)).toBe('Unknown Tile (999)');
    });
  });

  describe('getEnhancedTileDescription', () => {
    it('should return tile description for valid IDs', () => {
      expect(getEnhancedTileDescription(1)).toContain('Basic floor tile');
      expect(getEnhancedTileDescription(38)).toContain('Impenetrable solid rock');
      expect(getEnhancedTileDescription(42)).toContain('Contains energy crystals');
    });

    it('should return unknown tile message for invalid IDs', () => {
      expect(getEnhancedTileDescription(0)).toBe('Unknown tile type with ID 0');
      expect(getEnhancedTileDescription(999)).toBe('Unknown tile type with ID 999');
    });
  });

  describe('getTileColor', () => {
    it('should return color for tiles with color property', () => {
      const groundColor = getTileColor(1);
      expect(groundColor).toBeDefined();
      expect(groundColor).toEqual({ r: 124, g: 92, b: 70 });

      const lavaColor = getTileColor(6);
      expect(lavaColor).toBeDefined();
      expect(lavaColor).toEqual({ r: 255, g: 50, b: 0 });

      const waterColor = getTileColor(11);
      expect(waterColor).toBeDefined();
      expect(waterColor).toEqual({ r: 30, g: 84, b: 197 });
    });

    it('should return undefined for tiles without color', () => {
      expect(getTileColor(2)).toBeUndefined();
      expect(getTileColor(3)).toBeUndefined();
      expect(getTileColor(4)).toBeUndefined();
    });

    it('should handle tiles with alpha channel', () => {
      const solidRockColor = getTileColor(38);
      expect(solidRockColor).toBeDefined();
      expect(solidRockColor?.a).toBe(0);
    });
  });

  describe('Tile variants', () => {
    it('should have correct variant patterns for walls', () => {
      const wallTypes = [26, 30, 34, 38]; // Base IDs for wall types

      wallTypes.forEach(baseId => {
        expect(ENHANCED_TILE_DEFINITIONS.get(baseId)?.name).toContain('Regular');
        expect(ENHANCED_TILE_DEFINITIONS.get(baseId + 1)?.name).toContain('Corner');
        expect(ENHANCED_TILE_DEFINITIONS.get(baseId + 2)?.name).toContain('Edge');
        expect(ENHANCED_TILE_DEFINITIONS.get(baseId + 3)?.name).toContain('Intersect');
      });
    });

    it('should have correct variant patterns for resources', () => {
      const resourceTypes = [42, 46, 50]; // Base IDs for resource types

      resourceTypes.forEach(baseId => {
        expect(ENHANCED_TILE_DEFINITIONS.get(baseId)?.name).toContain('Regular');
        expect(ENHANCED_TILE_DEFINITIONS.get(baseId + 1)?.name).toContain('Corner');
        expect(ENHANCED_TILE_DEFINITIONS.get(baseId + 2)?.name).toContain('Edge');
        expect(ENHANCED_TILE_DEFINITIONS.get(baseId + 3)?.name).toContain('Intersect');
      });
    });
  });

  describe('Special tiles', () => {
    it('should properly handle electric fence tiles', () => {
      const electricFence = getEnhancedTileInfo(12);
      expect(electricFence?.name).toBe('Slimy Slug Hole');
      expect(electricFence?.category).toBe('hazard');
      expect(electricFence?.canDrill).toBe(true);
    });

    it('should properly handle power path tiles', () => {
      for (let i = 13; i <= 25; i++) {
        const tile = getEnhancedTileInfo(i);
        expect(tile?.category).toBe('special');
        expect(tile?.name).toContain('Power Path');
      }
    });

    it('should properly handle decorative tiles', () => {
      const decorativeTiles = [60, 61, 62, 63];
      decorativeTiles.forEach(id => {
        const tile = getEnhancedTileInfo(id);
        expect(tile?.name).toContain('Fake Rubble');
        expect(tile?.canWalk).toBe(true);
        expect(tile?.canDrill).toBe(false);
        expect(tile?.canBuild).toBe(false);
      });
    });
  });
});
