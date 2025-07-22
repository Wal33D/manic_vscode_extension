import { AdvancedSelectionTool, SelectionRegion } from './advancedSelection';

describe('AdvancedSelectionTool', () => {
  let tool: AdvancedSelectionTool;
  let tiles: number[][];

  beforeEach(() => {
    // Create a 10x10 test map
    tiles = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 1, 0, 0, 0, 1],
      [1, 0, 2, 2, 1, 1, 0, 3, 0, 1],
      [1, 0, 2, 2, 1, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 4, 4, 4, 1, 1, 5, 5, 5, 1],
      [1, 4, 4, 4, 1, 1, 5, 5, 5, 1],
      [1, 4, 4, 4, 1, 1, 5, 5, 5, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
    tool = new AdvancedSelectionTool(tiles, 10, 10);
  });

  describe('Magic Wand Selection', () => {
    it('should select all connected tiles of the same type', () => {
      const selection = tool.magicWandSelect(2, 2);

      expect(selection.points.length).toBe(4); // 4 connected '2' tiles
      expect(selection.bounds.minRow).toBe(2);
      expect(selection.bounds.maxRow).toBe(3);
      expect(selection.bounds.minCol).toBe(2);
      expect(selection.bounds.maxCol).toBe(3);
    });

    it('should select single tile when no connected tiles', () => {
      const selection = tool.magicWandSelect(1, 1);

      expect(selection.points.length).toBe(1);
      expect(selection.points[0]).toEqual({ row: 1, col: 1 });
    });

    it('should handle edge tiles correctly', () => {
      const selection = tool.magicWandSelect(0, 0);

      expect(selection.points.length).toBe(38); // All connected '1' tiles on border
      expect(selection.bounds.minRow).toBe(0);
      expect(selection.bounds.maxRow).toBe(9);
    });

    it('should return empty selection for invalid position', () => {
      const selection = tool.magicWandSelect(10, 10);

      expect(selection.points.length).toBe(0);
    });
  });

  describe('Lasso Selection', () => {
    it('should select tiles within lasso path', () => {
      const path = [
        { row: 1, col: 1 },
        { row: 1, col: 4 },
        { row: 4, col: 4 },
        { row: 4, col: 1 },
      ];

      const selection = tool.lassoSelect(path);

      expect(selection.points.length).toBe(16); // 4x4 area
      expect(selection.bounds.minRow).toBe(1);
      expect(selection.bounds.maxRow).toBe(4);
      expect(selection.bounds.minCol).toBe(1);
      expect(selection.bounds.maxCol).toBe(4);
    });

    it('should handle non-rectangular lasso shapes', () => {
      const path = [
        { row: 2, col: 2 },
        { row: 2, col: 4 },
        { row: 4, col: 3 },
        { row: 3, col: 2 },
      ];

      const selection = tool.lassoSelect(path);

      expect(selection.points.length).toBeGreaterThan(0);
      expect(selection.points.length).toBeLessThan(9); // Less than full rectangle
    });

    it('should return empty selection for invalid path', () => {
      const path = [{ row: 1, col: 1 }]; // Only one point

      const selection = tool.lassoSelect(path);

      expect(selection.points.length).toBe(0);
    });
  });

  describe('Ellipse Selection', () => {
    it('should select tiles within ellipse', () => {
      const selection = tool.ellipseSelect(5, 5, 2, 2);

      expect(selection.points.length).toBeGreaterThan(0);
      // Should include center
      expect(selection.points).toContainEqual({ row: 5, col: 5 });
    });

    it('should handle circular selection', () => {
      const selection = tool.ellipseSelect(5, 5, 2, 2);

      // Should be roughly circular
      const hasCorners = selection.points.some(
        p =>
          (p.row === 3 && p.col === 3) ||
          (p.row === 3 && p.col === 7) ||
          (p.row === 7 && p.col === 3) ||
          (p.row === 7 && p.col === 7)
      );

      expect(hasCorners).toBe(false); // Corners should be excluded
    });

    it('should handle edge clipping', () => {
      const selection = tool.ellipseSelect(0, 0, 3, 3);

      // All selected points should be within map bounds
      selection.points.forEach(point => {
        expect(point.row).toBeGreaterThanOrEqual(0);
        expect(point.col).toBeGreaterThanOrEqual(0);
        expect(point.row).toBeLessThan(10);
        expect(point.col).toBeLessThan(10);
      });
    });
  });

  describe('Polygon Selection', () => {
    it('should select tiles within polygon', () => {
      const vertices = [
        { row: 2, col: 2 },
        { row: 2, col: 7 },
        { row: 7, col: 7 },
        { row: 7, col: 2 },
      ];

      const selection = tool.polygonSelect(vertices);

      expect(selection.points.length).toBe(36); // 6x6 area
    });

    it('should handle triangular polygon', () => {
      const vertices = [
        { row: 2, col: 5 },
        { row: 7, col: 2 },
        { row: 7, col: 8 },
      ];

      const selection = tool.polygonSelect(vertices);

      expect(selection.points.length).toBeGreaterThan(0);
      expect(selection.points.length).toBeLessThan(36); // Less than rectangle
    });
  });

  describe('Selection Modification', () => {
    describe('Expand Selection', () => {
      it('should expand selection by one tile', () => {
        const initial: SelectionRegion = {
          points: [{ row: 5, col: 5 }],
          bounds: { minRow: 5, maxRow: 5, minCol: 5, maxCol: 5 },
        };

        const expanded = tool.expandSelection(initial);

        expect(expanded.points.length).toBe(5); // Center + 4 neighbors
        expect(expanded.bounds.minRow).toBe(4);
        expect(expanded.bounds.maxRow).toBe(6);
        expect(expanded.bounds.minCol).toBe(4);
        expect(expanded.bounds.maxCol).toBe(6);
      });
    });

    describe('Contract Selection', () => {
      it('should contract selection by one tile', () => {
        const initial: SelectionRegion = {
          points: [
            { row: 4, col: 4 },
            { row: 4, col: 5 },
            { row: 4, col: 6 },
            { row: 5, col: 4 },
            { row: 5, col: 5 },
            { row: 5, col: 6 },
            { row: 6, col: 4 },
            { row: 6, col: 5 },
            { row: 6, col: 6 },
          ],
          bounds: { minRow: 4, maxRow: 6, minCol: 4, maxCol: 6 },
        };

        const contracted = tool.contractSelection(initial);

        expect(contracted.points.length).toBe(1); // Only center remains
        expect(contracted.points[0]).toEqual({ row: 5, col: 5 });
      });
    });

    describe('Invert Selection', () => {
      it('should invert selection', () => {
        const initial: SelectionRegion = {
          points: [
            { row: 0, col: 0 },
            { row: 0, col: 1 },
          ],
          bounds: { minRow: 0, maxRow: 0, minCol: 0, maxCol: 1 },
        };

        const inverted = tool.invertSelection(initial);

        expect(inverted.points.length).toBe(98); // 100 - 2
      });
    });

    describe('Select by Tile Type', () => {
      it('should select all tiles of specified type', () => {
        const selection = tool.selectByTileType(4);

        expect(selection.points.length).toBe(9); // 3x3 area of '4' tiles
        selection.points.forEach(point => {
          expect(tiles[point.row][point.col]).toBe(4);
        });
      });

      it('should return empty selection for non-existent tile type', () => {
        const selection = tool.selectByTileType(99);

        expect(selection.points.length).toBe(0);
      });
    });

    describe('Select by Range', () => {
      it('should select tiles within range', () => {
        const selection = tool.selectByRange(2, 4);

        expect(selection.points.length).toBe(13); // 4 '2's + 9 '4's
        selection.points.forEach(point => {
          const tileId = tiles[point.row][point.col];
          expect(tileId).toBeGreaterThanOrEqual(2);
          expect(tileId).toBeLessThanOrEqual(4);
        });
      });
    });

    describe('Combine Selections', () => {
      it('should add selections', () => {
        const selection1: SelectionRegion = {
          points: [
            { row: 0, col: 0 },
            { row: 0, col: 1 },
          ],
          bounds: { minRow: 0, maxRow: 0, minCol: 0, maxCol: 1 },
        };

        const selection2: SelectionRegion = {
          points: [
            { row: 0, col: 1 },
            { row: 0, col: 2 },
          ],
          bounds: { minRow: 0, maxRow: 0, minCol: 1, maxCol: 2 },
        };

        const combined = tool.combineSelections(selection1, selection2, 'add');

        expect(combined.points.length).toBe(3); // Union of both
      });

      it('should subtract selections', () => {
        const selection1: SelectionRegion = {
          points: [
            { row: 0, col: 0 },
            { row: 0, col: 1 },
            { row: 0, col: 2 },
          ],
          bounds: { minRow: 0, maxRow: 0, minCol: 0, maxCol: 2 },
        };

        const selection2: SelectionRegion = {
          points: [{ row: 0, col: 1 }],
          bounds: { minRow: 0, maxRow: 0, minCol: 1, maxCol: 1 },
        };

        const combined = tool.combineSelections(selection1, selection2, 'subtract');

        expect(combined.points.length).toBe(2);
        expect(combined.points).toContainEqual({ row: 0, col: 0 });
        expect(combined.points).toContainEqual({ row: 0, col: 2 });
      });

      it('should intersect selections', () => {
        const selection1: SelectionRegion = {
          points: [
            { row: 0, col: 0 },
            { row: 0, col: 1 },
          ],
          bounds: { minRow: 0, maxRow: 0, minCol: 0, maxCol: 1 },
        };

        const selection2: SelectionRegion = {
          points: [
            { row: 0, col: 1 },
            { row: 0, col: 2 },
          ],
          bounds: { minRow: 0, maxRow: 0, minCol: 1, maxCol: 2 },
        };

        const combined = tool.combineSelections(selection1, selection2, 'intersect');

        expect(combined.points.length).toBe(1);
        expect(combined.points[0]).toEqual({ row: 0, col: 1 });
      });
    });
  });
});
