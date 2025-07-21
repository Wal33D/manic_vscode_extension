/**
 * Grid Operations Utility Example
 * 
 * This example provides common grid manipulation functions for working
 * with Manic Miners map data, including transformations, analysis, and
 * utility operations.
 */

// Grid type alias for clarity
export type Grid<T> = T[][];
export type TileGrid = Grid<number>;
export type BoolGrid = Grid<boolean>;

/**
 * Grid creation utilities
 */
export function createGrid<T>(
  width: number,
  height: number,
  defaultValue: T
): Grid<T> {
  const grid: Grid<T> = [];
  for (let y = 0; y < height; y++) {
    grid[y] = new Array(width).fill(defaultValue);
  }
  return grid;
}

export function createGridFromFunction<T>(
  width: number,
  height: number,
  fn: (x: number, y: number) => T
): Grid<T> {
  const grid: Grid<T> = [];
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      grid[y][x] = fn(x, y);
    }
  }
  return grid;
}

/**
 * Grid dimensions
 */
export interface GridDimensions {
  width: number;
  height: number;
}

export function getGridDimensions<T>(grid: Grid<T>): GridDimensions {
  return {
    height: grid.length,
    width: grid.length > 0 ? grid[0].length : 0
  };
}

/**
 * Grid validation
 */
export function isValidGrid<T>(grid: Grid<T>): boolean {
  if (!Array.isArray(grid) || grid.length === 0) return false;
  
  const width = grid[0].length;
  for (const row of grid) {
    if (!Array.isArray(row) || row.length !== width) return false;
  }
  
  return true;
}

export function isInBounds<T>(
  grid: Grid<T>,
  x: number,
  y: number
): boolean {
  return y >= 0 && y < grid.length && x >= 0 && x < grid[0].length;
}

/**
 * Grid transformation
 */
export function cloneGrid<T>(grid: Grid<T>): Grid<T> {
  return grid.map(row => [...row]);
}

export function transposeGrid<T>(grid: Grid<T>): Grid<T> {
  if (grid.length === 0) return [];
  
  const height = grid.length;
  const width = grid[0].length;
  const transposed: Grid<T> = [];
  
  for (let x = 0; x < width; x++) {
    transposed[x] = [];
    for (let y = 0; y < height; y++) {
      transposed[x][y] = grid[y][x];
    }
  }
  
  return transposed;
}

export function rotateGrid90<T>(grid: Grid<T>): Grid<T> {
  const transposed = transposeGrid(grid);
  return reverseRows(transposed);
}

export function rotateGrid180<T>(grid: Grid<T>): Grid<T> {
  return reverseRows(reverseColumns(grid));
}

export function rotateGrid270<T>(grid: Grid<T>): Grid<T> {
  const transposed = transposeGrid(grid);
  return reverseColumns(transposed);
}

export function reverseRows<T>(grid: Grid<T>): Grid<T> {
  return [...grid].reverse();
}

export function reverseColumns<T>(grid: Grid<T>): Grid<T> {
  return grid.map(row => [...row].reverse());
}

export function flipHorizontal<T>(grid: Grid<T>): Grid<T> {
  return reverseColumns(grid);
}

export function flipVertical<T>(grid: Grid<T>): Grid<T> {
  return reverseRows(grid);
}

/**
 * Grid cropping and expansion
 */
export interface CropBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function cropGrid<T>(
  grid: Grid<T>,
  bounds: CropBounds
): Grid<T> {
  const cropped: Grid<T> = [];
  
  for (let y = 0; y < bounds.height; y++) {
    const sourceY = bounds.y + y;
    if (sourceY >= 0 && sourceY < grid.length) {
      cropped[y] = [];
      for (let x = 0; x < bounds.width; x++) {
        const sourceX = bounds.x + x;
        if (sourceX >= 0 && sourceX < grid[sourceY].length) {
          cropped[y][x] = grid[sourceY][sourceX];
        }
      }
    }
  }
  
  return cropped;
}

export function expandGrid<T>(
  grid: Grid<T>,
  padding: number,
  fillValue: T
): Grid<T> {
  const { width, height } = getGridDimensions(grid);
  const newWidth = width + padding * 2;
  const newHeight = height + padding * 2;
  
  const expanded = createGrid(newWidth, newHeight, fillValue);
  
  // Copy original grid to center
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      expanded[y + padding][x + padding] = grid[y][x];
    }
  }
  
  return expanded;
}

/**
 * Grid merging
 */
export function mergeGrids<T>(
  base: Grid<T>,
  overlay: Grid<T>,
  offsetX: number,
  offsetY: number,
  mergeFn: (base: T, overlay: T) => T
): Grid<T> {
  const result = cloneGrid(base);
  
  for (let y = 0; y < overlay.length; y++) {
    for (let x = 0; x < overlay[y].length; x++) {
      const targetX = x + offsetX;
      const targetY = y + offsetY;
      
      if (isInBounds(result, targetX, targetY)) {
        result[targetY][targetX] = mergeFn(
          result[targetY][targetX],
          overlay[y][x]
        );
      }
    }
  }
  
  return result;
}

/**
 * Grid analysis
 */
export function forEachCell<T>(
  grid: Grid<T>,
  fn: (value: T, x: number, y: number) => void
): void {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      fn(grid[y][x], x, y);
    }
  }
}

export function mapGrid<T, R>(
  grid: Grid<T>,
  fn: (value: T, x: number, y: number) => R
): Grid<R> {
  const result: Grid<R> = [];
  
  for (let y = 0; y < grid.length; y++) {
    result[y] = [];
    for (let x = 0; x < grid[y].length; x++) {
      result[y][x] = fn(grid[y][x], x, y);
    }
  }
  
  return result;
}

export function filterCells<T>(
  grid: Grid<T>,
  predicate: (value: T, x: number, y: number) => boolean
): Array<{x: number, y: number, value: T}> {
  const results: Array<{x: number, y: number, value: T}> = [];
  
  forEachCell(grid, (value, x, y) => {
    if (predicate(value, x, y)) {
      results.push({x, y, value});
    }
  });
  
  return results;
}

export function countCells<T>(
  grid: Grid<T>,
  predicate: (value: T) => boolean
): number {
  let count = 0;
  
  forEachCell(grid, (value) => {
    if (predicate(value)) count++;
  });
  
  return count;
}

/**
 * Neighbor operations
 */
export type NeighborDirection = 'orthogonal' | 'diagonal' | 'all';

export function getNeighbors<T>(
  grid: Grid<T>,
  x: number,
  y: number,
  direction: NeighborDirection = 'all'
): Array<{x: number, y: number, value: T}> {
  const neighbors: Array<{x: number, y: number, value: T}> = [];
  
  const offsets = getNeighborOffsets(direction);
  
  for (const {dx, dy} of offsets) {
    const nx = x + dx;
    const ny = y + dy;
    
    if (isInBounds(grid, nx, ny)) {
      neighbors.push({
        x: nx,
        y: ny,
        value: grid[ny][nx]
      });
    }
  }
  
  return neighbors;
}

function getNeighborOffsets(
  direction: NeighborDirection
): Array<{dx: number, dy: number}> {
  const orthogonal = [
    {dx: 0, dy: -1}, // North
    {dx: 1, dy: 0},  // East
    {dx: 0, dy: 1},  // South
    {dx: -1, dy: 0}  // West
  ];
  
  const diagonal = [
    {dx: -1, dy: -1}, // NW
    {dx: 1, dy: -1},  // NE
    {dx: 1, dy: 1},   // SE
    {dx: -1, dy: 1}   // SW
  ];
  
  switch (direction) {
    case 'orthogonal': return orthogonal;
    case 'diagonal': return diagonal;
    case 'all': return [...orthogonal, ...diagonal];
  }
}

export function countNeighbors<T>(
  grid: Grid<T>,
  x: number,
  y: number,
  predicate: (value: T) => boolean,
  direction: NeighborDirection = 'all'
): number {
  const neighbors = getNeighbors(grid, x, y, direction);
  return neighbors.filter(n => predicate(n.value)).length;
}

/**
 * Flood fill operations
 */
export function floodFill<T>(
  grid: Grid<T>,
  startX: number,
  startY: number,
  fillValue: T,
  matchFn: (value: T) => boolean
): Grid<T> {
  const result = cloneGrid(grid);
  const targetValue = grid[startY][startX];
  
  if (!matchFn(targetValue)) return result;
  
  const stack: Array<{x: number, y: number}> = [{x: startX, y: startY}];
  const visited = new Set<string>();
  
  while (stack.length > 0) {
    const {x, y} = stack.pop()!;
    const key = `${x},${y}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    if (!isInBounds(result, x, y)) continue;
    if (!matchFn(result[y][x])) continue;
    
    result[y][x] = fillValue;
    
    stack.push({x: x - 1, y});
    stack.push({x: x + 1, y});
    stack.push({x, y: y - 1});
    stack.push({x, y: y + 1});
  }
  
  return result;
}

export function findConnectedRegions<T>(
  grid: Grid<T>,
  matchFn: (value: T) => boolean
): Array<Array<{x: number, y: number}>> {
  const visited = createGrid(grid[0].length, grid.length, false);
  const regions: Array<Array<{x: number, y: number}>> = [];
  
  forEachCell(grid, (value, x, y) => {
    if (!visited[y][x] && matchFn(value)) {
      const region = extractRegion(grid, x, y, matchFn, visited);
      if (region.length > 0) {
        regions.push(region);
      }
    }
  });
  
  return regions;
}

function extractRegion<T>(
  grid: Grid<T>,
  startX: number,
  startY: number,
  matchFn: (value: T) => boolean,
  visited: BoolGrid
): Array<{x: number, y: number}> {
  const region: Array<{x: number, y: number}> = [];
  const stack: Array<{x: number, y: number}> = [{x: startX, y: startY}];
  
  while (stack.length > 0) {
    const {x, y} = stack.pop()!;
    
    if (!isInBounds(grid, x, y)) continue;
    if (visited[y][x]) continue;
    if (!matchFn(grid[y][x])) continue;
    
    visited[y][x] = true;
    region.push({x, y});
    
    stack.push({x: x - 1, y});
    stack.push({x: x + 1, y});
    stack.push({x, y: y - 1});
    stack.push({x, y: y + 1});
  }
  
  return region;
}

/**
 * Path operations
 */
export function bresenhamLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number
): Array<{x: number, y: number}> {
  const points: Array<{x: number, y: number}> = [];
  
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  
  let x = x0;
  let y = y0;
  
  while (true) {
    points.push({x, y});
    
    if (x === x1 && y === y1) break;
    
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  
  return points;
}

export function drawLine<T>(
  grid: Grid<T>,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  value: T
): Grid<T> {
  const result = cloneGrid(grid);
  const points = bresenhamLine(x0, y0, x1, y1);
  
  for (const {x, y} of points) {
    if (isInBounds(result, x, y)) {
      result[y][x] = value;
    }
  }
  
  return result;
}

export function drawRectangle<T>(
  grid: Grid<T>,
  x: number,
  y: number,
  width: number,
  height: number,
  value: T,
  filled: boolean = false
): Grid<T> {
  const result = cloneGrid(grid);
  
  if (filled) {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const px = x + dx;
        const py = y + dy;
        if (isInBounds(result, px, py)) {
          result[py][px] = value;
        }
      }
    }
  } else {
    // Top and bottom edges
    for (let dx = 0; dx < width; dx++) {
      const px = x + dx;
      if (isInBounds(result, px, y)) result[y][px] = value;
      if (isInBounds(result, px, y + height - 1)) {
        result[y + height - 1][px] = value;
      }
    }
    
    // Left and right edges
    for (let dy = 0; dy < height; dy++) {
      const py = y + dy;
      if (isInBounds(result, x, py)) result[py][x] = value;
      if (isInBounds(result, x + width - 1, py)) {
        result[py][x + width - 1] = value;
      }
    }
  }
  
  return result;
}

export function drawCircle<T>(
  grid: Grid<T>,
  centerX: number,
  centerY: number,
  radius: number,
  value: T,
  filled: boolean = false
): Grid<T> {
  const result = cloneGrid(grid);
  
  if (filled) {
    for (let y = centerY - radius; y <= centerY + radius; y++) {
      for (let x = centerX - radius; x <= centerX + radius; x++) {
        if (isInBounds(result, x, y)) {
          const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          if (dist <= radius) {
            result[y][x] = value;
          }
        }
      }
    }
  } else {
    // Bresenham circle algorithm
    let x = radius;
    let y = 0;
    let err = 0;
    
    while (x >= y) {
      setCirclePoints(result, centerX, centerY, x, y, value);
      
      if (err <= 0) {
        y++;
        err += 2 * y + 1;
      }
      if (err > 0) {
        x--;
        err -= 2 * x + 1;
      }
    }
  }
  
  return result;
}

function setCirclePoints<T>(
  grid: Grid<T>,
  cx: number,
  cy: number,
  x: number,
  y: number,
  value: T
): void {
  const points = [
    {x: cx + x, y: cy + y},
    {x: cx - x, y: cy + y},
    {x: cx + x, y: cy - y},
    {x: cx - x, y: cy - y},
    {x: cx + y, y: cy + x},
    {x: cx - y, y: cy + x},
    {x: cx + y, y: cy - x},
    {x: cx - y, y: cy - x}
  ];
  
  for (const point of points) {
    if (isInBounds(grid, point.x, point.y)) {
      grid[point.y][point.x] = value;
    }
  }
}

/**
 * Convolution operations
 */
export type Kernel = Grid<number>;

export function convolve(
  grid: TileGrid,
  kernel: Kernel,
  edgeMode: 'clamp' | 'wrap' | 'mirror' = 'clamp'
): TileGrid {
  const { width, height } = getGridDimensions(grid);
  const result = createGrid(width, height, 0);
  const kSize = kernel.length;
  const kCenter = Math.floor(kSize / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      
      for (let ky = 0; ky < kSize; ky++) {
        for (let kx = 0; kx < kSize; kx++) {
          const sx = x + kx - kCenter;
          const sy = y + ky - kCenter;
          const sample = sampleGrid(grid, sx, sy, edgeMode);
          sum += sample * kernel[ky][kx];
        }
      }
      
      result[y][x] = Math.round(sum);
    }
  }
  
  return result;
}

function sampleGrid<T>(
  grid: Grid<T>,
  x: number,
  y: number,
  edgeMode: 'clamp' | 'wrap' | 'mirror'
): T {
  const { width, height } = getGridDimensions(grid);
  
  switch (edgeMode) {
    case 'clamp':
      x = Math.max(0, Math.min(width - 1, x));
      y = Math.max(0, Math.min(height - 1, y));
      break;
      
    case 'wrap':
      x = ((x % width) + width) % width;
      y = ((y % height) + height) % height;
      break;
      
    case 'mirror':
      if (x < 0) x = -x;
      if (x >= width) x = 2 * width - x - 2;
      if (y < 0) y = -y;
      if (y >= height) y = 2 * height - y - 2;
      break;
  }
  
  return grid[y][x];
}

// Common kernels
export const KERNELS = {
  blur3x3: [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1]
  ].map(row => row.map(v => v / 16)),
  
  sharpen3x3: [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ],
  
  edgeDetect3x3: [
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1]
  ],
  
  gaussianBlur5x5: [
    [1, 4, 6, 4, 1],
    [4, 16, 24, 16, 4],
    [6, 24, 36, 24, 6],
    [4, 16, 24, 16, 4],
    [1, 4, 6, 4, 1]
  ].map(row => row.map(v => v / 256))
};

/**
 * Utility functions for Manic Miners specific operations
 */
export function isPassableTile(tileId: number): boolean {
  const passableTiles = [1, 14, 26]; // Ground, power path, dirt
  return passableTiles.includes(tileId);
}

export function isSolidTile(tileId: number): boolean {
  const solidTiles = [30, 34, 38]; // Loose rock, hard rock, solid rock
  return solidTiles.includes(tileId);
}

export function isResourceTile(tileId: number): boolean {
  const resourceTiles = [42, 46, 50]; // Crystal, ore, recharge
  return resourceTiles.includes(tileId);
}

export function isHazardTile(tileId: number): boolean {
  const hazardTiles = [6, 7, 11, 12]; // Lava, erosion, water, slug hole
  return hazardTiles.includes(tileId);
}

/**
 * Example usage
 */
export function exampleUsage() {
  console.log('=== Grid Operations Examples ===\n');
  
  // Create a simple map
  const map = createGrid(10, 10, 1);
  
  // Add some walls
  const withWalls = drawRectangle(map, 2, 2, 6, 6, 38, false);
  
  // Add a circle room
  const withRoom = drawCircle(withWalls, 5, 5, 2, 1, true);
  
  // Find connected regions
  const regions = findConnectedRegions(withRoom, v => v === 1);
  console.log(`Found ${regions.length} connected regions`);
  
  // Apply blur
  const blurred = convolve(withRoom, KERNELS.blur3x3);
  
  // Count tile types
  const groundCount = countCells(withRoom, v => v === 1);
  const wallCount = countCells(withRoom, v => v === 38);
  
  console.log(`Ground tiles: ${groundCount}`);
  console.log(`Wall tiles: ${wallCount}`);
  
  // Visualize
  console.log('\nMap visualization:');
  forEachCell(withRoom, (value, x, y) => {
    if (x === 0) process.stdout.write('\n');
    process.stdout.write(value === 1 ? '.' : '#');
  });
  console.log('\n');
}

// Run example if called directly
if (require.main === module) {
  exampleUsage();
}