/**
 * Biome-Specific Map Generation Example
 * 
 * This example demonstrates how to generate maps with characteristics
 * specific to each biome (rock, ice, lava), including appropriate
 * hazards, terrain features, and visual elements.
 */

// Biome-specific generation options
export interface BiomeGeneratorOptions {
  width: number;
  height: number;
  biome: 'rock' | 'ice' | 'lava';
  complexity?: 'simple' | 'medium' | 'complex';
  hazardDensity?: number;  // 0-1, how many hazards
  resourceRichness?: number; // 0-1, resource abundance
  seed?: number;
}

// Biome-specific tile sets
const BIOME_TILES = {
  rock: {
    ground: 1,
    dirt: 26,
    looseRock: 30,
    hardRock: 34,
    solidRock: 38,
    crystal: 42,
    ore: 46,
    recharge: 50,
    hazards: [12], // Slug holes
  },
  ice: {
    ground: 11,    // Water acts as ground in ice biome
    dirt: 26,
    looseRock: 30,
    hardRock: 34,
    solidRock: 38,
    crystal: 42,
    ore: 46,
    recharge: 50,
    hazards: [11], // More water
  },
  lava: {
    ground: 1,
    dirt: 26,
    looseRock: 30,
    hardRock: 34,
    solidRock: 38,
    crystal: 42,
    ore: 46,
    recharge: 50,
    hazards: [6, 7], // Lava and erosion
  }
};

// Biome-specific patterns
const BIOME_PATTERNS = {
  rock: {
    caveSmoothing: 5,
    fillProbability: 0.45,
    tunnelChance: 0.3,
    chamberChance: 0.2
  },
  ice: {
    caveSmoothing: 3,    // Less smoothing for jagged ice
    fillProbability: 0.40,
    tunnelChance: 0.4,   // More tunnels
    chamberChance: 0.15,
    slipperiness: 0.7    // Ice-specific
  },
  lava: {
    caveSmoothing: 7,    // More smoothing for flowing lava
    fillProbability: 0.50,
    tunnelChance: 0.2,
    chamberChance: 0.3,  // More chambers
    erosionRate: 0.3     // Lava-specific
  }
};

/**
 * Generate a biome-specific map
 */
export function generateBiomeMap(options: BiomeGeneratorOptions): {
  tiles: number[][];
  height: number[][];
  info: any;
  features: string[];
} {
  const opts = {
    complexity: 'medium',
    hazardDensity: 0.1,
    resourceRichness: 0.5,
    seed: Date.now(),
    ...options
  };
  
  const random = createSeededRandom(opts.seed);
  const pattern = BIOME_PATTERNS[opts.biome];
  const tiles = BIOME_TILES[opts.biome];
  
  // Generate base terrain
  let grid = generateBaseTerrain(opts.width, opts.height, pattern, random);
  
  // Add biome-specific features
  switch (opts.biome) {
    case 'rock':
      addRockFeatures(grid, opts, random);
      break;
    case 'ice':
      addIceFeatures(grid, opts, random);
      break;
    case 'lava':
      addLavaFeatures(grid, opts, random);
      break;
  }
  
  // Generate height map
  const heightMap = generateHeightMap(grid, opts.biome, random);
  
  // Convert to tile IDs
  const tileMap = convertToTileMap(grid, tiles);
  
  // Add resources
  addResources(tileMap, opts.resourceRichness, tiles, random);
  
  // Add hazards
  addHazards(tileMap, opts.hazardDensity, tiles.hazards, random);
  
  // Identify features for description
  const features = identifyFeatures(tileMap, opts.biome);
  
  return {
    tiles: tileMap,
    height: heightMap,
    info: {
      rowcount: opts.height,
      colcount: opts.width,
      biome: opts.biome,
      creator: 'Biome Generator',
      version: '1.0',
      features: features.join(', ')
    },
    features
  };
}

/**
 * Generate base terrain using cellular automata
 */
function generateBaseTerrain(
  width: number,
  height: number,
  pattern: any,
  random: () => number
): number[][] {
  // 0 = empty, 1 = solid, 2+ = special features
  let grid: number[][] = [];
  
  // Initialize with random fill
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      grid[y][x] = random() < pattern.fillProbability ? 1 : 0;
    }
  }
  
  // Apply cellular automata
  for (let i = 0; i < pattern.caveSmoothing; i++) {
    grid = smoothTerrain(grid);
  }
  
  // Add tunnels and chambers
  if (random() < pattern.tunnelChance) {
    addTunnels(grid, random);
  }
  
  if (random() < pattern.chamberChance) {
    addChambers(grid, random);
  }
  
  // Ensure edges are solid
  addBorder(grid, 1);
  
  return grid;
}

/**
 * Smooth terrain using CA rules
 */
function smoothTerrain(grid: number[][]): number[][] {
  const newGrid: number[][] = [];
  
  for (let y = 0; y < grid.length; y++) {
    newGrid[y] = [];
    for (let x = 0; x < grid[y].length; x++) {
      const neighbors = countNeighbors(grid, x, y, 1);
      
      if (grid[y][x] === 1) {
        newGrid[y][x] = neighbors >= 4 ? 1 : 0;
      } else {
        newGrid[y][x] = neighbors >= 5 ? 1 : 0;
      }
    }
  }
  
  return newGrid;
}

/**
 * Add rock biome features
 */
function addRockFeatures(grid: number[][], options: BiomeGeneratorOptions, random: () => number) {
  // Add earthquake cracks
  if (options.complexity !== 'simple') {
    const crackCount = Math.floor(random() * 3) + 1;
    for (let i = 0; i < crackCount; i++) {
      addCrack(grid, random);
    }
  }
  
  // Add rubble areas
  if (options.complexity === 'complex') {
    addRubbleZones(grid, random);
  }
}

/**
 * Add ice biome features
 */
function addIceFeatures(grid: number[][], options: BiomeGeneratorOptions, random: () => number) {
  // Add ice flows (water channels)
  if (options.complexity !== 'simple') {
    const flowCount = Math.floor(random() * 2) + 1;
    for (let i = 0; i < flowCount; i++) {
      addIceFlow(grid, random);
    }
  }
  
  // Add frozen caverns
  if (options.complexity === 'complex') {
    addFrozenCaverns(grid, random);
  }
}

/**
 * Add lava biome features
 */
function addLavaFeatures(grid: number[][], options: BiomeGeneratorOptions, random: () => number) {
  // Add lava flows
  const flowCount = Math.floor(random() * 4) + 2;
  for (let i = 0; i < flowCount; i++) {
    addLavaFlow(grid, random);
  }
  
  // Add volcanic chambers
  if (options.complexity !== 'simple') {
    addVolcanicChambers(grid, random);
  }
  
  // Add erosion zones
  if (options.complexity === 'complex') {
    addErosionZones(grid, random);
  }
}

/**
 * Feature generation helpers
 */
function addCrack(grid: number[][], random: () => number) {
  const startX = Math.floor(random() * grid[0].length);
  const startY = Math.floor(random() * grid.length);
  const length = Math.floor(random() * 20) + 10;
  const direction = random() * Math.PI * 2;
  
  let x = startX;
  let y = startY;
  
  for (let i = 0; i < length; i++) {
    if (x >= 1 && x < grid[0].length - 1 && y >= 1 && y < grid.length - 1) {
      grid[Math.floor(y)][Math.floor(x)] = 0;
      
      // Widen crack slightly
      if (random() < 0.3) {
        const dx = Math.floor(random() * 3) - 1;
        const dy = Math.floor(random() * 3) - 1;
        const nx = Math.floor(x) + dx;
        const ny = Math.floor(y) + dy;
        
        if (nx >= 1 && nx < grid[0].length - 1 && ny >= 1 && ny < grid.length - 1) {
          grid[ny][nx] = 0;
        }
      }
    }
    
    x += Math.cos(direction) + (random() - 0.5) * 0.5;
    y += Math.sin(direction) + (random() - 0.5) * 0.5;
  }
}

function addLavaFlow(grid: number[][], random: () => number) {
  const startX = Math.floor(random() * grid[0].length);
  const startY = 0;
  const targetY = grid.length - 1;
  
  let x = startX;
  let y = startY;
  
  while (y < targetY) {
    if (x >= 1 && x < grid[0].length - 1) {
      // Mark as lava (3)
      grid[y][x] = 3;
      
      // Widen flow
      if (random() < 0.4) {
        if (x > 1) grid[y][x - 1] = 3;
        if (x < grid[0].length - 2) grid[y][x + 1] = 3;
      }
    }
    
    // Flow downward with some horizontal movement
    y++;
    x += Math.floor(random() * 3) - 1;
    x = Math.max(1, Math.min(grid[0].length - 2, x));
  }
}

function addIceFlow(grid: number[][], random: () => number) {
  // Similar to lava but creates water channels (4)
  const horizontal = random() < 0.5;
  
  if (horizontal) {
    const y = Math.floor(random() * (grid.length - 2)) + 1;
    for (let x = 1; x < grid[0].length - 1; x++) {
      if (random() < 0.7) {
        grid[y][x] = 4;
        if (random() < 0.3 && y > 1) grid[y - 1][x] = 4;
        if (random() < 0.3 && y < grid.length - 2) grid[y + 1][x] = 4;
      }
    }
  } else {
    const x = Math.floor(random() * (grid[0].length - 2)) + 1;
    for (let y = 1; y < grid.length - 1; y++) {
      if (random() < 0.7) {
        grid[y][x] = 4;
        if (random() < 0.3 && x > 1) grid[y][x - 1] = 4;
        if (random() < 0.3 && x < grid[0].length - 2) grid[y][x + 1] = 4;
      }
    }
  }
}

/**
 * Add connecting tunnels
 */
function addTunnels(grid: number[][], random: () => number) {
  const tunnelCount = Math.floor(random() * 3) + 1;
  
  for (let i = 0; i < tunnelCount; i++) {
    const startX = Math.floor(random() * (grid[0].length - 20)) + 10;
    const startY = Math.floor(random() * (grid.length - 20)) + 10;
    const endX = Math.floor(random() * (grid[0].length - 20)) + 10;
    const endY = Math.floor(random() * (grid.length - 20)) + 10;
    
    carveTunnel(grid, startX, startY, endX, endY, random);
  }
}

function carveTunnel(
  grid: number[][],
  x1: number, y1: number,
  x2: number, y2: number,
  random: () => number
) {
  let x = x1;
  let y = y1;
  
  while (Math.abs(x - x2) > 1 || Math.abs(y - y2) > 1) {
    // Carve current position
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 1 && nx < grid[0].length - 1 && 
            ny >= 1 && ny < grid.length - 1) {
          grid[ny][nx] = 0;
        }
      }
    }
    
    // Move toward target with some randomness
    if (random() < 0.7) {
      if (x < x2) x++;
      else if (x > x2) x--;
    } else {
      x += random() < 0.5 ? -1 : 1;
    }
    
    if (random() < 0.7) {
      if (y < y2) y++;
      else if (y > y2) y--;
    } else {
      y += random() < 0.5 ? -1 : 1;
    }
  }
}

/**
 * Add chambers
 */
function addChambers(grid: number[][], random: () => number) {
  const chamberCount = Math.floor(random() * 3) + 1;
  
  for (let i = 0; i < chamberCount; i++) {
    const cx = Math.floor(random() * (grid[0].length - 20)) + 10;
    const cy = Math.floor(random() * (grid.length - 20)) + 10;
    const radius = Math.floor(random() * 5) + 3;
    
    carveCircle(grid, cx, cy, radius);
  }
}

function carveCircle(grid: number[][], cx: number, cy: number, radius: number) {
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      if (x >= 1 && x < grid[0].length - 1 && 
          y >= 1 && y < grid.length - 1) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist <= radius) {
          grid[y][x] = 0;
        }
      }
    }
  }
}

/**
 * Generate height map based on biome
 */
function generateHeightMap(
  grid: number[][],
  biome: string,
  random: () => number
): number[][] {
  const heightMap: number[][] = [];
  
  for (let y = 0; y < grid.length; y++) {
    heightMap[y] = [];
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === 0) {
        // Open space - vary by biome
        switch (biome) {
          case 'ice':
            // Ice has more dramatic height differences
            heightMap[y][x] = Math.floor(random() * 8);
            break;
          case 'lava':
            // Lava is generally flatter
            heightMap[y][x] = Math.floor(random() * 4);
            break;
          default:
            // Rock has moderate variation
            heightMap[y][x] = Math.floor(random() * 6);
        }
      } else {
        // Solid areas are higher
        heightMap[y][x] = Math.floor(random() * 6) + 9;
      }
    }
  }
  
  // Smooth height map
  return smoothHeightMap(heightMap);
}

function smoothHeightMap(heightMap: number[][]): number[][] {
  const smoothed: number[][] = [];
  
  for (let y = 0; y < heightMap.length; y++) {
    smoothed[y] = [];
    for (let x = 0; x < heightMap[y].length; x++) {
      let sum = 0;
      let count = 0;
      
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < heightMap.length && 
              nx >= 0 && nx < heightMap[0].length) {
            sum += heightMap[ny][nx];
            count++;
          }
        }
      }
      
      smoothed[y][x] = Math.floor(sum / count);
    }
  }
  
  return smoothed;
}

/**
 * Convert grid to tile IDs
 */
function convertToTileMap(grid: number[][], tiles: any): number[][] {
  const tileMap: number[][] = [];
  
  for (let y = 0; y < grid.length; y++) {
    tileMap[y] = [];
    for (let x = 0; x < grid[y].length; x++) {
      switch (grid[y][x]) {
        case 0:
          tileMap[y][x] = tiles.ground;
          break;
        case 1:
          tileMap[y][x] = tiles.solidRock;
          break;
        case 3: // Lava
          tileMap[y][x] = 6;
          break;
        case 4: // Water/ice
          tileMap[y][x] = 11;
          break;
        default:
          tileMap[y][x] = tiles.solidRock;
      }
    }
  }
  
  return tileMap;
}

/**
 * Add resources to the map
 */
function addResources(
  tileMap: number[][],
  richness: number,
  tiles: any,
  random: () => number
) {
  for (let y = 1; y < tileMap.length - 1; y++) {
    for (let x = 1; x < tileMap[y].length - 1; x++) {
      if (tileMap[y][x] === tiles.solidRock) {
        // Check if adjacent to open space
        let hasOpenNeighbor = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (tileMap[y + dy][x + dx] === tiles.ground) {
              hasOpenNeighbor = true;
              break;
            }
          }
        }
        
        if (hasOpenNeighbor) {
          const roll = random();
          if (roll < richness * 0.03) {
            tileMap[y][x] = tiles.crystal;
          } else if (roll < richness * 0.08) {
            tileMap[y][x] = tiles.ore;
          } else if (roll < richness * 0.1) {
            tileMap[y][x] = tiles.recharge;
          } else if (roll < 0.3) {
            tileMap[y][x] = tiles.looseRock;
          } else if (roll < 0.6) {
            tileMap[y][x] = tiles.hardRock;
          }
        }
      }
    }
  }
}

/**
 * Add biome-specific hazards
 */
function addHazards(
  tileMap: number[][],
  density: number,
  hazardTiles: number[],
  random: () => number
) {
  if (hazardTiles.length === 0) return;
  
  for (let y = 1; y < tileMap.length - 1; y++) {
    for (let x = 1; x < tileMap[y].length - 1; x++) {
      if (tileMap[y][x] === 1) { // Ground tile
        if (random() < density * 0.01) {
          const hazard = hazardTiles[Math.floor(random() * hazardTiles.length)];
          tileMap[y][x] = hazard;
        }
      }
    }
  }
}

/**
 * Identify map features for description
 */
function identifyFeatures(tileMap: number[][], biome: string): string[] {
  const features: string[] = [];
  
  // Count tile types
  const tileCounts = new Map<number, number>();
  for (const row of tileMap) {
    for (const tile of row) {
      tileCounts.set(tile, (tileCounts.get(tile) || 0) + 1);
    }
  }
  
  // Biome-specific feature detection
  switch (biome) {
    case 'rock':
      if (tileCounts.get(12) || 0 > 5) features.push('slug holes');
      if (tileCounts.get(42) || 0 > 10) features.push('crystal-rich');
      break;
    case 'ice':
      if (tileCounts.get(11) || 0 > 50) features.push('frozen lakes');
      features.push('slippery surfaces');
      break;
    case 'lava':
      if (tileCounts.get(6) || 0 > 20) features.push('lava flows');
      if (tileCounts.get(7) || 0 > 10) features.push('erosion zones');
      features.push('extreme heat');
      break;
  }
  
  return features;
}

/**
 * Additional biome-specific helpers
 */
function addRubbleZones(grid: number[][], random: () => number) {
  const zoneCount = Math.floor(random() * 3) + 1;
  
  for (let i = 0; i < zoneCount; i++) {
    const cx = Math.floor(random() * (grid[0].length - 10)) + 5;
    const cy = Math.floor(random() * (grid.length - 10)) + 5;
    const size = Math.floor(random() * 4) + 2;
    
    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size; dx <= size; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 1 && x < grid[0].length - 1 && 
            y >= 1 && y < grid.length - 1 &&
            grid[y][x] === 1 && random() < 0.6) {
          grid[y][x] = 5; // Mark as rubble
        }
      }
    }
  }
}

function addFrozenCaverns(grid: number[][], random: () => number) {
  // Create crystalline ice formations
  const formationCount = Math.floor(random() * 4) + 2;
  
  for (let i = 0; i < formationCount; i++) {
    const cx = Math.floor(random() * (grid[0].length - 10)) + 5;
    const cy = Math.floor(random() * (grid.length - 10)) + 5;
    
    // Create star-shaped formation
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
      const length = Math.floor(random() * 5) + 3;
      for (let dist = 0; dist < length; dist++) {
        const x = Math.floor(cx + Math.cos(angle) * dist);
        const y = Math.floor(cy + Math.sin(angle) * dist);
        
        if (x >= 1 && x < grid[0].length - 1 && 
            y >= 1 && y < grid.length - 1) {
          grid[y][x] = 6; // Ice formation
        }
      }
    }
  }
}

function addVolcanicChambers(grid: number[][], random: () => number) {
  const chamberCount = Math.floor(random() * 2) + 1;
  
  for (let i = 0; i < chamberCount; i++) {
    const cx = Math.floor(random() * (grid[0].length - 15)) + 7;
    const cy = Math.floor(random() * (grid.length - 15)) + 7;
    const radius = Math.floor(random() * 4) + 4;
    
    // Carve chamber
    carveCircle(grid, cx, cy, radius);
    
    // Add lava pool in center
    carveCircle(grid, cx, cy, radius - 2);
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < grid[0].length && 
            y >= 0 && y < grid.length) {
          grid[y][x] = 3; // Lava
        }
      }
    }
  }
}

function addErosionZones(grid: number[][], random: () => number) {
  const zoneCount = Math.floor(random() * 3) + 1;
  
  for (let i = 0; i < zoneCount; i++) {
    const cx = Math.floor(random() * (grid[0].length - 10)) + 5;
    const cy = Math.floor(random() * (grid.length - 10)) + 5;
    const radius = Math.floor(random() * 5) + 3;
    
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        if (x >= 1 && x < grid[0].length - 1 && 
            y >= 1 && y < grid.length - 1) {
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          if (dist <= radius && grid[y][x] === 1 && random() < 0.7) {
            grid[y][x] = 7; // Erosion
          }
        }
      }
    }
  }
}

/**
 * Seeded random number generator
 */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2147483648;
    return state / 2147483648;
  };
}

/**
 * Count neighbors of specific type
 */
function countNeighbors(grid: number[][], x: number, y: number, type: number): number {
  let count = 0;
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx < 0 || nx >= grid[0].length || ny < 0 || ny >= grid.length) {
        count++; // Out of bounds counts as solid
      } else if (grid[ny][nx] === type) {
        count++;
      }
    }
  }
  
  return count;
}

/**
 * Add solid border
 */
function addBorder(grid: number[][], thickness: number) {
  const height = grid.length;
  const width = grid[0].length;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x < thickness || x >= width - thickness ||
          y < thickness || y >= height - thickness) {
        grid[y][x] = 1;
      }
    }
  }
}

/**
 * Example usage
 */
export function exampleUsage() {
  console.log('=== Biome-Specific Map Generation ===\n');
  
  // Generate one map of each biome
  const biomes: Array<'rock' | 'ice' | 'lava'> = ['rock', 'ice', 'lava'];
  
  for (const biome of biomes) {
    console.log(`Generating ${biome.toUpperCase()} biome map...`);
    
    const map = generateBiomeMap({
      width: 50,
      height: 50,
      biome: biome,
      complexity: 'complex',
      hazardDensity: 0.15,
      resourceRichness: 0.6,
      seed: 12345 + biomes.indexOf(biome)
    });
    
    // Count specific features
    const featureCounts = new Map<number, number>();
    for (const row of map.tiles) {
      for (const tile of row) {
        featureCounts.set(tile, (featureCounts.get(tile) || 0) + 1);
      }
    }
    
    console.log(`  Size: ${map.info.colcount}x${map.info.rowcount}`);
    console.log(`  Features: ${map.features.join(', ')}`);
    
    // Report biome-specific tiles
    switch (biome) {
      case 'rock':
        console.log(`  Slug holes: ${featureCounts.get(12) || 0}`);
        break;
      case 'ice':
        console.log(`  Water tiles: ${featureCounts.get(11) || 0}`);
        break;
      case 'lava':
        console.log(`  Lava tiles: ${featureCounts.get(6) || 0}`);
        console.log(`  Erosion tiles: ${featureCounts.get(7) || 0}`);
        break;
    }
    
    console.log(`  Crystal seams: ${featureCounts.get(42) || 0}`);
    console.log(`  Ore seams: ${featureCounts.get(46) || 0}`);
    console.log();
  }
}

// Run example if called directly
if (require.main === module) {
  exampleUsage();
}