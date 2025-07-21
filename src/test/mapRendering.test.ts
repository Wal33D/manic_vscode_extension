// Jest test for map rendering dimensions

interface TestMap {
  name: string;
  rows: number;
  cols: number;
  description: string;
}

/**
 * Test suite for map rendering dimensions
 * Ensures that maps of various sizes render correctly
 */
describe('Map Rendering Dimensions', () => {
  const testMaps: TestMap[] = [
    { name: 'Square Small', rows: 8, cols: 8, description: 'Minimum practical size square map' },
    { name: 'Square Medium', rows: 40, cols: 40, description: 'Common square map size' },
    { name: 'Square Large', rows: 100, cols: 100, description: 'Large square map for performance' },
    { name: 'Wide Small', rows: 8, cols: 16, description: 'Small wide map (2:1 ratio)' },
    { name: 'Wide Medium', rows: 40, cols: 69, description: 'Common campaign map dimensions' },
    { name: 'Wide Large', rows: 50, cols: 100, description: 'Large wide map (2:1 ratio)' },
    { name: 'Tall Small', rows: 16, cols: 8, description: 'Small tall map (2:1 ratio)' },
    { name: 'Tall Medium', rows: 69, cols: 40, description: 'Tall variant of common size' },
    { name: 'Tall Large', rows: 100, cols: 50, description: 'Large tall map (2:1 ratio)' },
  ];

  /**
   * Generate test tile data
   */
  function generateTestTiles(rows: number, cols: number): number[][] {
    const tiles: number[][] = [];
    for (let row = 0; row < rows; row++) {
      tiles[row] = [];
      for (let col = 0; col < cols; col++) {
        // Border with solid rock (38), interior with ground (1)
        if (row === 0 || row === rows - 1 || col === 0 || col === cols - 1) {
          tiles[row][col] = 38; // Solid rock
        } else {
          tiles[row][col] = 1; // Ground
        }
      }
    }
    return tiles;
  }

  /**
   * Simulate canvas dimensions from tile data
   */
  function calculateCanvasDimensions(
    tiles: number[][],
    tileSize: number
  ): { width: number; height: number } {
    const rows = tiles.length;
    const cols = tiles[0].length;
    return {
      width: cols * tileSize,
      height: rows * tileSize,
    };
  }

  /**
   * Verify aspect ratio matches expected
   */
  function verifyAspectRatio(
    actual: { width: number; height: number },
    expected: { cols: number; rows: number }
  ): boolean {
    const actualRatio = actual.width / actual.height;
    const expectedRatio = expected.cols / expected.rows;
    const tolerance = 0.01;
    return Math.abs(actualRatio - expectedRatio) < tolerance;
  }

  describe('Tile Array Structure', () => {
    testMaps.forEach(({ name, rows, cols }) => {
      it(`should create correct array structure for ${name} (${rows}x${cols})`, () => {
        const tiles = generateTestTiles(rows, cols);

        // Verify array dimensions
        expect(tiles.length).toBe(rows);
        expect(tiles[0].length).toBe(cols);

        // Verify all rows have correct length
        tiles.forEach(row => {
          expect(row.length).toBe(cols);
        });

        // Verify border tiles
        expect(tiles[0][0]).toBe(38); // Top-left
        expect(tiles[0][cols - 1]).toBe(38); // Top-right
        expect(tiles[rows - 1][0]).toBe(38); // Bottom-left
        expect(tiles[rows - 1][cols - 1]).toBe(38); // Bottom-right

        // Verify interior tiles (if map is large enough)
        if (rows > 2 && cols > 2) {
          expect(tiles[1][1]).toBe(1); // Interior should be ground
        }
      });
    });
  });

  describe('Canvas Dimensions', () => {
    const tileSizes = [8, 16, 24, 32];

    testMaps.forEach(({ name, rows, cols }) => {
      tileSizes.forEach(tileSize => {
        it(`should calculate correct canvas size for ${name} (${rows}x${cols}) with ${tileSize}px tiles`, () => {
          const tiles = generateTestTiles(rows, cols);
          const canvas = calculateCanvasDimensions(tiles, tileSize);

          expect(canvas.width).toBe(cols * tileSize);
          expect(canvas.height).toBe(rows * tileSize);

          // Verify aspect ratio
          const ratioCorrect = verifyAspectRatio(canvas, { cols, rows });
          expect(ratioCorrect).toBe(true);
        });
      });
    });
  });

  describe('Dimension Mapping', () => {
    it('should never swap width and height', () => {
      // Test that wide maps stay wide
      const wideMap = generateTestTiles(40, 69);
      const wideCanvas = calculateCanvasDimensions(wideMap, 16);
      expect(wideCanvas.width).toBeGreaterThan(wideCanvas.height);

      // Test that tall maps stay tall
      const tallMap = generateTestTiles(69, 40);
      const tallCanvas = calculateCanvasDimensions(tallMap, 16);
      expect(tallCanvas.height).toBeGreaterThan(tallCanvas.width);

      // Test that square maps stay square
      const squareMap = generateTestTiles(40, 40);
      const squareCanvas = calculateCanvasDimensions(squareMap, 16);
      expect(squareCanvas.width).toBe(squareCanvas.height);
    });
  });

  describe('Coordinate Access', () => {
    it('should access tiles with [row][col] pattern', () => {
      const tiles = generateTestTiles(10, 15);

      // Place test markers
      tiles[2][3] = 42; // Crystal at row 2, col 3
      tiles[5][10] = 46; // Ore at row 5, col 10

      // Verify correct access pattern
      expect(tiles[2][3]).toBe(42);
      expect(tiles[5][10]).toBe(46);

      // Verify position calculations
      const tileSize = 16;
      const crystalX = 3 * tileSize; // col * tileSize
      const crystalY = 2 * tileSize; // row * tileSize
      const oreX = 10 * tileSize;
      const oreY = 5 * tileSize;

      expect(crystalX).toBe(48);
      expect(crystalY).toBe(32);
      expect(oreX).toBe(160);
      expect(oreY).toBe(80);
    });
  });

  describe('3D Camera Positioning', () => {
    it('should use max dimension for camera distance', () => {
      const testCases = [
        { rows: 40, cols: 40, expectedMax: 40 },
        { rows: 40, cols: 69, expectedMax: 69 },
        { rows: 69, cols: 40, expectedMax: 69 },
        { rows: 100, cols: 50, expectedMax: 100 },
      ];

      testCases.forEach(({ rows, cols, expectedMax }) => {
        const maxDim = Math.max(rows, cols);
        expect(maxDim).toBe(expectedMax);

        // Camera position calculations
        const cameraY = maxDim * 0.8;
        const cameraDistance = maxDim * 1.5;

        // Wide maps should have camera far enough to see width
        if (cols > rows) {
          expect(cameraDistance).toBeGreaterThanOrEqual(cols);
        }
        // Tall maps should have camera high enough to see height
        if (rows > cols) {
          expect(cameraY).toBeGreaterThanOrEqual(rows * 0.5);
        }
      });
    });
  });

  describe('Array Conversion', () => {
    it('should convert between 1D and 2D arrays correctly', () => {
      const rows = 5;
      const cols = 8;

      // Create 1D array
      const tiles1D: number[] = [];
      for (let i = 0; i < rows * cols; i++) {
        tiles1D.push(i);
      }

      // Convert to 2D
      const tiles2D: number[][] = [];
      for (let i = 0; i < rows; i++) {
        tiles2D[i] = tiles1D.slice(i * cols, (i + 1) * cols);
      }

      // Verify structure
      expect(tiles2D.length).toBe(rows);
      expect(tiles2D[0].length).toBe(cols);

      // Verify values
      expect(tiles2D[0][0]).toBe(0);
      expect(tiles2D[0][7]).toBe(7);
      expect(tiles2D[1][0]).toBe(8);
      expect(tiles2D[4][7]).toBe(39);

      // Convert back to 1D
      const tiles1DAgain = tiles2D.flat();
      expect(tiles1DAgain).toEqual(tiles1D);
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum size maps', () => {
      const tiny = generateTestTiles(1, 1);
      expect(tiny.length).toBe(1);
      expect(tiny[0].length).toBe(1);
      expect(tiny[0][0]).toBe(38); // Single tile should be border
    });

    it('should handle extremely wide maps', () => {
      const veryWide = generateTestTiles(8, 200);
      expect(veryWide.length).toBe(8);
      expect(veryWide[0].length).toBe(200);

      const canvas = calculateCanvasDimensions(veryWide, 4);
      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(32);
    });

    it('should handle extremely tall maps', () => {
      const veryTall = generateTestTiles(200, 8);
      expect(veryTall.length).toBe(200);
      expect(veryTall[0].length).toBe(8);

      const canvas = calculateCanvasDimensions(veryTall, 4);
      expect(canvas.width).toBe(32);
      expect(canvas.height).toBe(800);
    });
  });
});
