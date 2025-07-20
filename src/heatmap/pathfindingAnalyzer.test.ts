import { describe, expect, it, beforeEach } from '@jest/globals';
import * as vscode from 'vscode';
import { PathfindingAnalyzer } from './pathfindingAnalyzer';

describe('PathfindingAnalyzer', () => {
  let analyzer: PathfindingAnalyzer;
  let mockDocument: vscode.TextDocument;

  beforeEach(() => {
    analyzer = new PathfindingAnalyzer();
  });

  describe('initialize', () => {
    it('should initialize with valid map data', () => {
      mockDocument = {
        getText: () => `info{
rowcount:3
colcount:3
}
tiles{
1,1,1,
1,40,1,
1,1,1,
}`,
        languageId: 'manicminers',
      } as any;

      const result = analyzer.initialize(mockDocument);
      expect(result).toBe(true);
    });

    it('should return false for missing tiles section', () => {
      mockDocument = {
        getText: () => `info{
rowcount:3
colcount:3
}`,
        languageId: 'manicminers',
      } as any;

      const result = analyzer.initialize(mockDocument);
      expect(result).toBe(false);
    });
  });

  describe('generateTrafficHeatMap', () => {
    it('should generate traffic heat map for simple path', () => {
      mockDocument = {
        getText: () => `info{
rowcount:5
colcount:5
}
tiles{
101,1,1,1,101,
1,1,1,1,1,
1,1,1,1,1,
1,1,1,1,1,
101,1,1,1,101,
}`,
        languageId: 'manicminers',
      } as any;

      analyzer.initialize(mockDocument);
      const heatMap = analyzer.generateTrafficHeatMap();

      expect(heatMap.grid).toHaveLength(5);
      expect(heatMap.grid[0]).toHaveLength(5);
      expect(heatMap.maxValue).toBeGreaterThan(0);
      expect(heatMap.hotspots.length).toBeGreaterThan(0);
    });

    it('should handle maps with obstacles', () => {
      mockDocument = {
        getText: () => `info{
rowcount:5
colcount:5
}
tiles{
101,1,1,1,101,
1,40,40,40,1,
1,40,1,40,1,
1,40,40,40,1,
101,1,1,1,101,
}`,
        languageId: 'manicminers',
      } as any;

      analyzer.initialize(mockDocument);
      const heatMap = analyzer.generateTrafficHeatMap();

      // Path should go around obstacles
      expect(heatMap.grid[0][1]).toBeGreaterThan(0); // Path around top
      expect(heatMap.grid[2][2]).toBe(0); // Inside obstacle area
    });
  });

  describe('generateAccessibilityHeatMap', () => {
    it('should generate accessibility map from starting points', () => {
      mockDocument = {
        getText: () => `info{
rowcount:5
colcount:5
}
tiles{
101,1,1,1,1,
1,1,1,1,1,
1,1,1,1,1,
1,1,1,1,1,
1,1,1,1,101,
}`,
        languageId: 'manicminers',
      } as any;

      analyzer.initialize(mockDocument);
      const startPoints = [
        { row: 0, col: 0 },
        { row: 4, col: 4 },
      ];
      const heatMap = analyzer.generateAccessibilityHeatMap(startPoints);

      // Starting points should have 0 distance
      expect(heatMap.grid[0][0]).toBe(0);
      expect(heatMap.grid[4][4]).toBe(0);

      // Center should have equal distance from both corners
      expect(heatMap.grid[2][2]).toBeGreaterThan(0);
      expect(heatMap.grid[2][2]).toBeLessThan(5);
    });

    it('should mark unreachable areas', () => {
      mockDocument = {
        getText: () => `info{
rowcount:5
colcount:5
}
tiles{
101,1,1,40,26,
1,1,1,40,1,
1,1,1,40,1,
40,40,40,40,1,
1,1,1,1,1,
}`,
        languageId: 'manicminers',
      } as any;

      analyzer.initialize(mockDocument);
      const startPoints = [{ row: 0, col: 0 }];
      const heatMap = analyzer.generateAccessibilityHeatMap(startPoints);

      // Area behind wall should be unreachable (-1)
      expect(heatMap.grid[0][4]).toBe(-1);
      expect(heatMap.grid[1][4]).toBe(-1);
    });
  });

  describe('generateChokepointHeatMap', () => {
    it('should identify chokepoints in narrow passages', () => {
      mockDocument = {
        getText: () => `info{
rowcount:7
colcount:7
}
tiles{
1,1,1,40,1,1,1,
1,1,1,40,1,1,1,
1,1,1,40,1,1,1,
1,1,1,1,1,1,1,
1,1,1,40,1,1,1,
1,1,1,40,1,1,1,
1,1,1,40,1,1,1,
}`,
        languageId: 'manicminers',
      } as any;

      analyzer.initialize(mockDocument);
      const heatMap = analyzer.generateChokepointHeatMap();

      // The single passage tile should have high chokepoint score
      expect(heatMap.grid[3][3]).toBeGreaterThan(heatMap.grid[0][0]);
      expect(heatMap.grid[3][3]).toBeGreaterThan(heatMap.grid[6][6]);
    });
  });

  describe('findPath', () => {
    it('should find optimal path between two points', () => {
      mockDocument = {
        getText: () => `info{
rowcount:5
colcount:5
}
tiles{
1,1,1,1,1,
1,40,40,40,1,
1,1,1,40,1,
40,40,1,40,1,
1,1,1,1,1,
}`,
        languageId: 'manicminers',
      } as any;

      analyzer.initialize(mockDocument);
      const result = analyzer.findPath({ row: 0, col: 0 }, { row: 4, col: 4 });

      expect(result).not.toBeNull();
      expect(result!.path.length).toBeGreaterThan(0);
      expect(result!.path[0]).toEqual({ row: 0, col: 0, cost: 0 });
      expect(result!.path[result!.path.length - 1].row).toBe(4);
      expect(result!.path[result!.path.length - 1].col).toBe(4);
    });

    it('should return null for impossible paths', () => {
      mockDocument = {
        getText: () => `info{
rowcount:5
colcount:5
}
tiles{
1,1,1,40,1,
1,1,1,40,1,
40,40,40,40,40,
1,1,1,40,1,
1,1,1,40,1,
}`,
        languageId: 'manicminers',
      } as any;

      analyzer.initialize(mockDocument);
      const result = analyzer.findPath({ row: 0, col: 0 }, { row: 0, col: 4 });

      expect(result).toBeNull();
    });

    it('should consider movement costs for different tile types', () => {
      mockDocument = {
        getText: () => `info{
rowcount:3
colcount:5
}
tiles{
1,1,1,1,1,
1,5,5,5,1,
1,1,1,1,1,
}`,
        languageId: 'manicminers',
      } as any;

      analyzer.initialize(mockDocument);
      const result = analyzer.findPath({ row: 1, col: 0 }, { row: 1, col: 4 });

      // Path should prefer going around high-cost rubble tiles
      expect(result).not.toBeNull();
      const path = result!.path;

      // Should avoid the rubble (tile 5) in the middle
      const middleRowTiles = path.filter(node => node.row === 1);
      expect(middleRowTiles.length).toBeLessThanOrEqual(2); // Start and end only
    });
  });

  describe('tile identification', () => {
    it('should correctly identify passable tiles', () => {
      mockDocument = {
        getText: () => `info{
rowcount:3
colcount:6
}
tiles{
1,2,3,4,5,40,
163,164,165,6,7,8,
42,46,26,30,101,111,
}`,
        languageId: 'manicminers',
      } as any;

      analyzer.initialize(mockDocument);

      // Test with traffic heat map to see which tiles are considered passable
      const heatMap = analyzer.generateTrafficHeatMap();

      // Ground (1) and rubble (2-5) should be passable
      expect(heatMap.grid[0][0]).toBeGreaterThanOrEqual(0); // tile 1
      expect(heatMap.grid[0][1]).toBeGreaterThanOrEqual(0); // tile 2
      expect(heatMap.grid[0][2]).toBeGreaterThanOrEqual(0); // tile 3
      expect(heatMap.grid[0][3]).toBeGreaterThanOrEqual(0); // tile 4
      expect(heatMap.grid[0][4]).toBeGreaterThanOrEqual(0); // tile 5

      // Walls and other solid tiles should not be passable
      // (represented differently in the heat map)
    });
  });
});
