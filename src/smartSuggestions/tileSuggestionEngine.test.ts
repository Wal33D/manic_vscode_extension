import { describe, expect, it, beforeEach } from '@jest/globals';
import { TileSuggestionEngine } from './tileSuggestionEngine';

describe('TileSuggestionEngine', () => {
  let engine: TileSuggestionEngine;

  beforeEach(() => {
    engine = new TileSuggestionEngine();
  });

  describe('getSuggestions', () => {
    it('should suggest wall continuation', () => {
      // Wall - Empty - Wall pattern
      const tiles = [
        [1, 1, 1],
        [26, 1, 26], // Dirt walls with gap
        [1, 1, 1],
      ];

      const suggestions = engine.getSuggestions(tiles, 1, 1);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].tileId).toBe(26); // Should suggest dirt wall
      expect(suggestions[0].confidence).toBeGreaterThan(0.8);
      expect(suggestions[0].reason).toContain('Continue wall');
    });

    it('should suggest resource clustering', () => {
      // Crystal seams around empty space
      const tiles = [
        [42, 42, 1],
        [42, 1, 1], // Empty space near crystals
        [1, 1, 1],
      ];

      const suggestions = engine.getSuggestions(tiles, 1, 1);

      const crystalSuggestion = suggestions.find(s => s.tileId === 42);
      expect(crystalSuggestion).toBeDefined();
      expect(crystalSuggestion?.reason).toContain('crystal');
    });

    it('should suggest ground for building areas', () => {
      // Ground tiles forming building area
      const tiles = [
        [1, 1, 1],
        [1, 26, 1], // Wall in potential building area
        [1, 1, 1],
      ];

      const suggestions = engine.getSuggestions(tiles, 1, 1);

      const groundSuggestion = suggestions.find(s => s.tileId === 1);
      expect(groundSuggestion).toBeDefined();
      // Accept either buildable area pattern or matching surrounding tiles
      expect(groundSuggestion?.reason.toLowerCase()).toMatch(/buildable area|match surrounding/);
    });

    it('should suggest hazard isolation', () => {
      // Lava tile nearby
      const tiles = [
        [1, 1, 1],
        [1, 1, 6], // Lava adjacent
        [1, 1, 1],
      ];

      const suggestions = engine.getSuggestions(tiles, 1, 1);

      const solidRockSuggestion = suggestions.find(s => s.tileId === 38 || s.tileId === 88);
      expect(solidRockSuggestion).toBeDefined();
      expect(solidRockSuggestion?.reason).toContain('contain hazard');
    });

    it('should match most common surrounding tile', () => {
      // Surrounded by ore seams
      const tiles = [
        [46, 46, 46],
        [46, 1, 46],
        [46, 46, 1],
      ];

      const suggestions = engine.getSuggestions(tiles, 1, 1);

      const oreSuggestion = suggestions.find(s => s.tileId === 46);
      expect(oreSuggestion).toBeDefined();
      expect(oreSuggestion?.reason).toContain('Match surrounding');
    });

    it('should handle edge cases', () => {
      // Corner position
      const tiles = [
        [1, 26],
        [26, 38],
      ];

      const suggestions = engine.getSuggestions(tiles, 0, 0);
      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should limit suggestions to maxSuggestions', () => {
      const tiles = [
        [1, 26, 42],
        [46, 1, 38],
        [6, 11, 30],
      ];

      const suggestions = engine.getSuggestions(tiles, 1, 1, 3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('should remove duplicate suggestions', () => {
      const tiles = [
        [26, 26, 26],
        [26, 1, 26],
        [26, 26, 26],
      ];

      const suggestions = engine.getSuggestions(tiles, 1, 1);
      const tileIds = suggestions.map(s => s.tileId);
      const uniqueTileIds = [...new Set(tileIds)];

      expect(tileIds.length).toBe(uniqueTileIds.length);
    });

    it('should suggest reinforced variants', () => {
      const tiles = [
        [26, 1, 26],
        [1, 1, 1],
        [26, 1, 26],
      ];

      const suggestions = engine.getSuggestions(tiles, 0, 1);
      const reinforcedSuggestion = suggestions.find(s => s.tileId === 76); // Reinforced dirt

      expect(reinforcedSuggestion).toBeDefined();
    });

    it('should handle empty map', () => {
      const tiles: number[][] = [];

      expect(() => engine.getSuggestions(tiles, 0, 0)).not.toThrow();
    });
  });

  describe('pattern matching', () => {
    it('should detect horizontal wall patterns', () => {
      const tiles = [
        [1, 1, 1, 1, 1],
        [38, 38, 1, 38, 38], // Solid rock walls with gap
        [1, 1, 1, 1, 1],
      ];

      const suggestions = engine.getSuggestions(tiles, 1, 2);
      expect(suggestions[0].tileId).toBe(38);
    });

    it('should detect vertical wall patterns', () => {
      const tiles = [
        [1, 30, 1],
        [1, 1, 1],
        [1, 30, 1],
      ];

      const suggestions = engine.getSuggestions(tiles, 1, 1);
      const looseSuggestion = suggestions.find(s => s.tileId === 30);
      expect(looseSuggestion).toBeDefined();
    });

    it('should suggest path smoothing', () => {
      const tiles = [
        [1, 1, 2],
        [1, 26, 2], // Wall interrupting path
        [1, 1, 2],
      ];

      const suggestions = engine.getSuggestions(tiles, 1, 1);
      const pathSuggestion = suggestions.find(s => s.tileId === 1 || s.tileId === 2);
      expect(pathSuggestion).toBeDefined();
      // Accept either path pattern or buildable area pattern
      expect(pathSuggestion?.reason.toLowerCase()).toMatch(/path|buildable|ground/);
    });
  });

  describe('contextual analysis', () => {
    it('should suggest complementary tiles', () => {
      const tiles = [
        [42, 42, 1], // Crystal seams
        [42, 1, 1],
        [1, 1, 1],
      ];

      const suggestions = engine.getSuggestions(tiles, 1, 1);
      // Check if we have any resource suggestions (crystal clustering or ore complementing)
      const resourceSuggestion = suggestions.find(s => s.tileId === 42 || s.tileId === 46);
      expect(resourceSuggestion).toBeDefined();
    });

    it('should handle mixed environments', () => {
      const tiles = [
        [1, 6, 11], // Ground, lava, water
        [26, 1, 38], // Various walls
        [42, 46, 1], // Resources
      ];

      const suggestions = engine.getSuggestions(tiles, 1, 1);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].confidence).toBeGreaterThan(0);
    });
  });
});
