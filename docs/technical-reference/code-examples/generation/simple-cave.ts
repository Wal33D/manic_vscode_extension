/**
 * Simple Cave Generation Example
 * 
 * This example demonstrates basic cave generation using cellular automata,
 * a classic technique for creating organic-looking cave systems.
 */

// Cave generation parameters
export interface CaveGeneratorOptions {
  width: number;
  height: number;
  fillProbability?: number;    // Initial random fill chance (0-1)
  smoothingIterations?: number; // Number of CA iterations
  birthLimit?: number;          // Neighbors needed to become solid
  deathLimit?: number;          // Neighbors needed to stay solid
  edgePadding?: number;         // Border of solid rock
  seed?: number;                // Random seed
}

// Map data structure
export interface GeneratedMap {
  tiles: number[][];
  width: number;
  height: number;
  stats: {
    solidPercent: number;
    largestCaveSize: number;
    caveCount: number;
  };
}

/**
 * Generate a cave system using cellular automata
 */
export function generateCave(options: CaveGeneratorOptions): GeneratedMap {
  const opts = {
    fillProbability: 0.45,
    smoothingIterations: 5,
    birthLimit: 4,
    deathLimit: 3,
    edgePadding: 1,
    seed: Date.now(),
    ...options
  };
  
  // Initialize random with seed
  const random = createSeededRandom(opts.seed);
  
  // Create initial random grid
  let grid = initializeGrid(opts.width, opts.height, opts.fillProbability, random);
  
  // Apply cellular automata rules
  for (let i = 0; i < opts.smoothingIterations; i++) {
    grid = smoothGrid(grid, opts.birthLimit, opts.deathLimit);
  }
  
  // Apply edge padding
  if (opts.edgePadding > 0) {
    applyEdgePadding(grid, opts.edgePadding);
  }
  
  // Convert to tile IDs
  const tiles = convertToTiles(grid);
  
  // Calculate statistics
  const stats = calculateStats(tiles);
  
  return {
    tiles,
    width: opts.width,
    height: opts.height,
    stats
  };
}

/**
 * Initialize grid with random values
 */
function initializeGrid(
  width: number,
  height: number,
  fillProbability: number,
  random: () => number
): boolean[][] {
  const grid: boolean[][] = [];
  
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      grid[y][x] = random() < fillProbability;
    }
  }
  
  return grid;
}

/**
 * Apply cellular automata smoothing
 */
function smoothGrid(
  grid: boolean[][],
  birthLimit: number,
  deathLimit: number
): boolean[][] {
  const newGrid: boolean[][] = [];
  const height = grid.length;
  const width = grid[0].length;
  
  for (let y = 0; y < height; y++) {
    newGrid[y] = [];
    for (let x = 0; x < width; x++) {
      const neighbors = countNeighbors(grid, x, y);
      
      if (grid[y][x]) {
        // Currently solid
        newGrid[y][x] = neighbors >= deathLimit;
      } else {
        // Currently empty
        newGrid[y][x] = neighbors > birthLimit;
      }
    }
  }
  
  return newGrid;
}

/**
 * Count neighboring solid cells
 */
function countNeighbors(grid: boolean[][], x: number, y: number): number {
  let count = 0;
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      
      const nx = x + dx;
      const ny = y + dy;
      
      // Out of bounds counts as solid
      if (nx < 0 || nx >= grid[0].length || ny < 0 || ny >= grid.length) {
        count++;
      } else if (grid[ny][nx]) {
        count++;
      }
    }
  }
  
  return count;
}

/**
 * Apply solid rock border
 */
function applyEdgePadding(grid: boolean[][], padding: number) {
  const height = grid.length;
  const width = grid[0].length;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x < padding || x >= width - padding ||
          y < padding || y >= height - padding) {
        grid[y][x] = true;
      }
    }
  }
}

/**
 * Convert boolean grid to tile IDs
 */
function convertToTiles(grid: boolean[][]): number[][] {
  const tiles: number[][] = [];
  
  for (let y = 0; y < grid.length; y++) {
    tiles[y] = [];
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x]) {
        tiles[y][x] = 38; // Solid rock
      } else {
        tiles[y][x] = 1;  // Ground
      }
    }
  }
  
  return tiles;
}

/**
 * Calculate map statistics
 */
function calculateStats(tiles: number[][]): GeneratedMap['stats'] {
  let solidCount = 0;
  const totalTiles = tiles.length * tiles[0].length;
  
  // Count solid tiles
  for (const row of tiles) {
    for (const tile of row) {
      if (tile === 38) solidCount++;
    }
  }
  
  // Find caves using flood fill
  const visited = Array(tiles.length).fill(null).map(() => 
    Array(tiles[0].length).fill(false)
  );
  const caveSizes: number[] = [];
  
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      if (!visited[y][x] && tiles[y][x] !== 38) {
        const size = floodFillCount(tiles, visited, x, y);
        caveSizes.push(size);
      }
    }
  }
  
  return {
    solidPercent: (solidCount / totalTiles) * 100,
    largestCaveSize: Math.max(...caveSizes, 0),
    caveCount: caveSizes.length
  };
}

/**
 * Flood fill to count cave size
 */
function floodFillCount(
  tiles: number[][],
  visited: boolean[][],
  startX: number,
  startY: number
): number {
  const stack: Array<{x: number, y: number}> = [{x: startX, y: startY}];
  let count = 0;
  
  while (stack.length > 0) {
    const {x, y} = stack.pop()!;
    
    if (x < 0 || x >= tiles[0].length || y < 0 || y >= tiles.length) continue;
    if (visited[y][x] || tiles[y][x] === 38) continue;
    
    visited[y][x] = true;
    count++;
    
    stack.push({x: x - 1, y});
    stack.push({x: x + 1, y});
    stack.push({x, y: y - 1});
    stack.push({x, y: y + 1});
  }
  
  return count;
}

/**
 * Create seeded random number generator
 */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  
  return () => {
    state = (state * 1664525 + 1013904223) % 2147483648;
    return state / 2147483648;
  };
}

/**
 * Advanced: Multi-pass generation with different tile types
 */
export function generateDetailedCave(options: CaveGeneratorOptions & {
  oreChance?: number;
  crystalChance?: number;
  looseRockChance?: number;
}): GeneratedMap {
  // Generate base cave
  const map = generateCave(options);
  
  const opts = {
    oreChance: 0.02,
    crystalChance: 0.01,
    looseRockChance: 0.15,
    ...options
  };
  
  const random = createSeededRandom(opts.seed || Date.now());
  
  // Second pass: Add detail tiles
  for (let y = 0; y < map.tiles.length; y++) {
    for (let x = 0; x < map.tiles[y].length; x++) {
      if (map.tiles[y][x] === 38) {
        // Solid rock - maybe convert to ore/crystal
        const neighbors = countGroundNeighbors(map.tiles, x, y);
        
        if (neighbors > 0) {
          const roll = random();
          
          if (roll < opts.crystalChance) {
            map.tiles[y][x] = 42; // Crystal seam
          } else if (roll < opts.crystalChance + opts.oreChance) {
            map.tiles[y][x] = 46; // Ore seam
          } else if (roll < opts.crystalChance + opts.oreChance + opts.looseRockChance) {
            map.tiles[y][x] = 30; // Loose rock
          }
        }
      }
    }
  }
  
  return map;
}

/**
 * Count neighboring ground tiles
 */
function countGroundNeighbors(tiles: number[][], x: number, y: number): number {
  let count = 0;
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < tiles[0].length && 
          ny >= 0 && ny < tiles.length &&
          tiles[ny][nx] === 1) {
        count++;
      }
    }
  }
  
  return count;
}

/**
 * Export map to DAT format
 */
export function exportToDAT(map: GeneratedMap, options: {
  name?: string;
  creator?: string;
  biome?: 'rock' | 'ice' | 'lava';
} = {}): string {
  const opts = {
    name: 'Generated Cave',
    creator: 'Cave Generator',
    biome: 'rock',
    ...options
  };
  
  let dat = '';
  
  // Info section
  dat += 'info{\n';
  dat += `rowcount:${map.height}\n`;
  dat += `colcount:${map.width}\n`;
  dat += `biome:${opts.biome}\n`;
  dat += `creator:${opts.creator}\n`;
  dat += `name:${opts.name}\n`;
  dat += '}\n\n';
  
  // Tiles section
  dat += 'tiles{\n';
  for (const row of map.tiles) {
    dat += row.join(',') + '\n';
  }
  dat += '}\n\n';
  
  // Basic objectives
  dat += 'objectives{\n';
  dat += 'crystals,50\n';
  dat += '}\n\n';
  
  // Simple script
  dat += 'script{\n';
  dat += 'int crystalsCollected=0\n';
  dat += 'when(crystalCollected)[crystalsCollected:crystalsCollected+1]\n';
  dat += 'when(crystalsCollected>=50)[win]\n';
  dat += '}\n';
  
  return dat;
}

/**
 * Example usage
 */
export function exampleUsage() {
  console.log('=== Simple Cave Generation ===\n');
  
  // Generate a simple cave
  const simpleCave = generateCave({
    width: 40,
    height: 40,
    fillProbability: 0.45,
    smoothingIterations: 5
  });
  
  console.log('Simple Cave Stats:');
  console.log(`  Size: ${simpleCave.width}x${simpleCave.height}`);
  console.log(`  Solid: ${simpleCave.stats.solidPercent.toFixed(1)}%`);
  console.log(`  Caves: ${simpleCave.stats.caveCount}`);
  console.log(`  Largest cave: ${simpleCave.stats.largestCaveSize} tiles`);
  console.log();
  
  // Generate a detailed cave
  const detailedCave = generateDetailedCave({
    width: 50,
    height: 50,
    fillProbability: 0.48,
    smoothingIterations: 6,
    oreChance: 0.03,
    crystalChance: 0.015
  });
  
  console.log('Detailed Cave Stats:');
  console.log(`  Size: ${detailedCave.width}x${detailedCave.height}`);
  
  // Count resource tiles
  let crystals = 0, ore = 0;
  for (const row of detailedCave.tiles) {
    for (const tile of row) {
      if (tile === 42) crystals++;
      if (tile === 46) ore++;
    }
  }
  
  console.log(`  Crystal seams: ${crystals}`);
  console.log(`  Ore seams: ${ore}`);
  console.log();
  
  // Export to DAT
  const datContent = exportToDAT(detailedCave, {
    name: 'Example Cave',
    creator: 'Cave Generator Example'
  });
  
  console.log('Exported DAT preview:');
  console.log(datContent.substring(0, 200) + '...\n');
}

// Run example if called directly
if (require.main === module) {
  exampleUsage();
}

/**
 * Utility: ASCII visualization for debugging
 */
export function visualizeMap(map: GeneratedMap): string {
  const symbols: {[key: number]: string} = {
    1: ' ',   // Ground
    30: '.',  // Loose rock
    38: '#',  // Solid rock
    42: '*',  // Crystal
    46: 'o'   // Ore
  };
  
  let ascii = '';
  for (const row of map.tiles) {
    for (const tile of row) {
      ascii += symbols[tile] || '?';
    }
    ascii += '\n';
  }
  
  return ascii;
}