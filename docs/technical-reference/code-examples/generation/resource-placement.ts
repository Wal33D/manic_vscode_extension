/**
 * Resource Placement Example
 * 
 * This example demonstrates various strategies for placing crystals, ore,
 * and other resources in Manic Miners maps with balanced distribution.
 */

// Resource placement options
export interface ResourcePlacementOptions {
  crystalDensity?: number;      // Crystals per 100 tiles
  oreDensity?: number;          // Ore deposits per 100 tiles
  rechargeDensity?: number;     // Recharge seams per 100 tiles
  distribution?: 'random' | 'clustered' | 'veins' | 'strategic';
  minDistanceBetween?: number;  // Minimum tiles between resources
  wallAdjacencyRequired?: boolean;
  balanceQuadrants?: boolean;   // Ensure even distribution
  seed?: number;
}

// Resource types
export interface Resource {
  x: number;
  y: number;
  type: 'crystal' | 'ore' | 'recharge';
  amount?: number; // For ore
}

// Resource placement result
export interface ResourceMap {
  crystals: Array<{x: number, y: number}>;
  ore: Array<{x: number, y: number, amount: number}>;
  recharge: Array<{x: number, y: number}>;
  stats: {
    totalCrystals: number;
    totalOre: number;
    totalRecharge: number;
    averageSpacing: number;
    quadrantBalance: number[]; // Resources per quadrant
  };
}

/**
 * Place resources on a map
 */
export function placeResources(
  tiles: number[][],
  options: ResourcePlacementOptions = {}
): ResourceMap {
  const opts = {
    crystalDensity: 2.0,
    oreDensity: 1.5,
    rechargeDensity: 0.5,
    distribution: 'clustered' as const,
    minDistanceBetween: 3,
    wallAdjacencyRequired: true,
    balanceQuadrants: true,
    seed: Date.now(),
    ...options
  };
  
  const random = createSeededRandom(opts.seed);
  const width = tiles[0].length;
  const height = tiles.length;
  const totalTiles = width * height;
  
  // Calculate target counts
  const targetCrystals = Math.floor(totalTiles * opts.crystalDensity / 100);
  const targetOre = Math.floor(totalTiles * opts.oreDensity / 100);
  const targetRecharge = Math.floor(totalTiles * opts.rechargeDensity / 100);
  
  // Find valid placement locations
  const validLocations = findValidLocations(tiles, opts.wallAdjacencyRequired);
  
  // Place resources based on distribution strategy
  let resources: Resource[] = [];
  
  switch (opts.distribution) {
    case 'random':
      resources = placeRandomly(validLocations, targetCrystals, targetOre, targetRecharge, random);
      break;
    case 'clustered':
      resources = placeClustered(validLocations, tiles, targetCrystals, targetOre, targetRecharge, random);
      break;
    case 'veins':
      resources = placeVeins(validLocations, tiles, targetCrystals, targetOre, targetRecharge, random);
      break;
    case 'strategic':
      resources = placeStrategically(validLocations, tiles, targetCrystals, targetOre, targetRecharge, random);
      break;
  }
  
  // Apply minimum distance constraint
  if (opts.minDistanceBetween > 0) {
    resources = enforceMinDistance(resources, opts.minDistanceBetween);
  }
  
  // Balance quadrants if requested
  if (opts.balanceQuadrants) {
    resources = balanceQuadrants(resources, tiles, random);
  }
  
  // Convert to result format
  const result = formatResult(resources, tiles);
  
  return result;
}

/**
 * Find valid resource placement locations
 */
function findValidLocations(tiles: number[][], wallAdjacent: boolean): Array<{x: number, y: number}> {
  const locations: Array<{x: number, y: number}> = [];
  const solidTiles = [30, 34, 38]; // Loose rock, hard rock, solid rock
  
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      const tile = tiles[y][x];
      
      if (solidTiles.includes(tile)) {
        if (!wallAdjacent || hasOpenNeighbor(tiles, x, y)) {
          locations.push({x, y});
        }
      }
    }
  }
  
  return locations;
}

/**
 * Check if a tile has at least one open neighbor
 */
function hasOpenNeighbor(tiles: number[][], x: number, y: number): boolean {
  const openTiles = [1, 14]; // Ground, power path
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < tiles[0].length && 
          ny >= 0 && ny < tiles.length &&
          openTiles.includes(tiles[ny][nx])) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Random distribution
 */
function placeRandomly(
  locations: Array<{x: number, y: number}>,
  crystals: number,
  ore: number,
  recharge: number,
  random: () => number
): Resource[] {
  const resources: Resource[] = [];
  const shuffled = shuffleArray([...locations], random);
  let index = 0;
  
  // Place crystals
  for (let i = 0; i < crystals && index < shuffled.length; i++) {
    resources.push({
      ...shuffled[index++],
      type: 'crystal'
    });
  }
  
  // Place ore
  for (let i = 0; i < ore && index < shuffled.length; i++) {
    resources.push({
      ...shuffled[index++],
      type: 'ore',
      amount: Math.floor(random() * 3) + 1 // 1-3 ore
    });
  }
  
  // Place recharge
  for (let i = 0; i < recharge && index < shuffled.length; i++) {
    resources.push({
      ...shuffled[index++],
      type: 'recharge'
    });
  }
  
  return resources;
}

/**
 * Clustered distribution
 */
function placeClustered(
  locations: Array<{x: number, y: number}>,
  tiles: number[][],
  crystals: number,
  ore: number,
  recharge: number,
  random: () => number
): Resource[] {
  const resources: Resource[] = [];
  
  // Create clusters for each resource type
  const clusterSizes = {
    crystal: 3 + Math.floor(random() * 3),
    ore: 2 + Math.floor(random() * 2),
    recharge: 1
  };
  
  // Place crystal clusters
  placeResourceClusters(
    resources, locations, tiles, 'crystal',
    crystals, clusterSizes.crystal, random
  );
  
  // Place ore clusters
  placeResourceClusters(
    resources, locations, tiles, 'ore',
    ore, clusterSizes.ore, random
  );
  
  // Place recharge (usually single)
  placeResourceClusters(
    resources, locations, tiles, 'recharge',
    recharge, clusterSizes.recharge, random
  );
  
  return resources;
}

/**
 * Place resource clusters
 */
function placeResourceClusters(
  resources: Resource[],
  locations: Array<{x: number, y: number}>,
  tiles: number[][],
  type: 'crystal' | 'ore' | 'recharge',
  targetCount: number,
  clusterSize: number,
  random: () => number
) {
  const used = new Set<string>();
  let placed = 0;
  
  while (placed < targetCount && locations.length > 0) {
    // Pick random center
    const center = locations[Math.floor(random() * locations.length)];
    const key = `${center.x},${center.y}`;
    
    if (used.has(key)) continue;
    
    // Find nearby valid locations
    const cluster: Array<{x: number, y: number}> = [center];
    used.add(key);
    
    // Grow cluster
    for (let i = 1; i < clusterSize && placed + i < targetCount; i++) {
      const nearby = findNearbyLocation(center, locations, used, 3, random);
      if (nearby) {
        cluster.push(nearby);
        used.add(`${nearby.x},${nearby.y}`);
      }
    }
    
    // Add cluster to resources
    for (const loc of cluster) {
      resources.push({
        ...loc,
        type,
        amount: type === 'ore' ? Math.floor(random() * 3) + 1 : undefined
      });
      placed++;
    }
  }
}

/**
 * Find nearby valid location
 */
function findNearbyLocation(
  center: {x: number, y: number},
  locations: Array<{x: number, y: number}>,
  used: Set<string>,
  maxDistance: number,
  random: () => number
): {x: number, y: number} | null {
  const nearby = locations.filter(loc => {
    const dist = Math.abs(loc.x - center.x) + Math.abs(loc.y - center.y);
    const key = `${loc.x},${loc.y}`;
    return dist <= maxDistance && !used.has(key);
  });
  
  if (nearby.length === 0) return null;
  
  return nearby[Math.floor(random() * nearby.length)];
}

/**
 * Vein distribution (connected lines of resources)
 */
function placeVeins(
  locations: Array<{x: number, y: number}>,
  tiles: number[][],
  crystals: number,
  ore: number,
  recharge: number,
  random: () => number
): Resource[] {
  const resources: Resource[] = [];
  
  // Crystal veins (longer)
  const crystalVeins = Math.ceil(crystals / 5);
  for (let i = 0; i < crystalVeins; i++) {
    const vein = createVein(locations, tiles, 'crystal', 5 + Math.floor(random() * 5), random);
    resources.push(...vein);
  }
  
  // Ore veins (medium)
  const oreVeins = Math.ceil(ore / 3);
  for (let i = 0; i < oreVeins; i++) {
    const vein = createVein(locations, tiles, 'ore', 3 + Math.floor(random() * 3), random);
    resources.push(...vein);
  }
  
  // Recharge (usually single or small veins)
  const rechargeVeins = Math.ceil(recharge / 2);
  for (let i = 0; i < rechargeVeins; i++) {
    const vein = createVein(locations, tiles, 'recharge', 1 + Math.floor(random() * 2), random);
    resources.push(...vein);
  }
  
  return resources;
}

/**
 * Create a vein of resources
 */
function createVein(
  locations: Array<{x: number, y: number}>,
  tiles: number[][],
  type: 'crystal' | 'ore' | 'recharge',
  length: number,
  random: () => number
): Resource[] {
  const vein: Resource[] = [];
  const used = new Set<string>();
  
  // Start from random location
  const start = locations[Math.floor(random() * locations.length)];
  let current = start;
  vein.push({
    ...current,
    type,
    amount: type === 'ore' ? Math.floor(random() * 3) + 1 : undefined
  });
  used.add(`${current.x},${current.y}`);
  
  // Grow vein
  for (let i = 1; i < length; i++) {
    // Find adjacent solid tile
    const adjacent = findAdjacentSolid(current, tiles, used);
    if (adjacent.length === 0) break;
    
    // Pick random adjacent
    current = adjacent[Math.floor(random() * adjacent.length)];
    vein.push({
      ...current,
      type,
      amount: type === 'ore' ? Math.floor(random() * 3) + 1 : undefined
    });
    used.add(`${current.x},${current.y}`);
  }
  
  return vein;
}

/**
 * Find adjacent solid tiles
 */
function findAdjacentSolid(
  pos: {x: number, y: number},
  tiles: number[][],
  used: Set<string>
): Array<{x: number, y: number}> {
  const adjacent: Array<{x: number, y: number}> = [];
  const solidTiles = [30, 34, 38];
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (Math.abs(dx) + Math.abs(dy) !== 1) continue; // Only orthogonal
      
      const x = pos.x + dx;
      const y = pos.y + dy;
      const key = `${x},${y}`;
      
      if (x >= 0 && x < tiles[0].length && 
          y >= 0 && y < tiles.length &&
          solidTiles.includes(tiles[y][x]) &&
          !used.has(key)) {
        adjacent.push({x, y});
      }
    }
  }
  
  return adjacent;
}

/**
 * Strategic distribution (game balance focused)
 */
function placeStrategically(
  locations: Array<{x: number, y: number}>,
  tiles: number[][],
  crystals: number,
  ore: number,
  recharge: number,
  random: () => number
): Resource[] {
  const resources: Resource[] = [];
  const width = tiles[0].length;
  const height = tiles.length;
  
  // Identify key areas
  const startArea = {x: Math.floor(width * 0.2), y: Math.floor(height * 0.2)};
  const centerArea = {x: Math.floor(width * 0.5), y: Math.floor(height * 0.5)};
  const farAreas = [
    {x: Math.floor(width * 0.8), y: Math.floor(height * 0.2)},
    {x: Math.floor(width * 0.2), y: Math.floor(height * 0.8)},
    {x: Math.floor(width * 0.8), y: Math.floor(height * 0.8)}
  ];
  
  // Place starting resources (easy access)
  const startingResources = Math.floor(crystals * 0.2);
  placeNearPoint(resources, locations, startArea, 'crystal', startingResources, 10, random);
  
  // Place mid-game resources
  const midResources = Math.floor(crystals * 0.4);
  placeNearPoint(resources, locations, centerArea, 'crystal', midResources, 15, random);
  
  // Place late-game resources (harder to reach)
  const lateResources = crystals - startingResources - midResources;
  for (const area of farAreas) {
    placeNearPoint(
      resources, locations, area, 'crystal',
      Math.floor(lateResources / farAreas.length), 10, random
    );
  }
  
  // Distribute ore more evenly
  const orePerQuadrant = Math.floor(ore / 4);
  const quadrants = [
    {x: width * 0.25, y: height * 0.25},
    {x: width * 0.75, y: height * 0.25},
    {x: width * 0.25, y: height * 0.75},
    {x: width * 0.75, y: height * 0.75}
  ];
  
  for (const quad of quadrants) {
    placeNearPoint(resources, locations, quad, 'ore', orePerQuadrant, 12, random);
  }
  
  // Place recharge strategically (between areas)
  const rechargePoints = [
    {x: width * 0.5, y: height * 0.25},
    {x: width * 0.25, y: height * 0.5},
    {x: width * 0.75, y: height * 0.5},
    {x: width * 0.5, y: height * 0.75}
  ];
  
  for (let i = 0; i < recharge && i < rechargePoints.length; i++) {
    placeNearPoint(resources, locations, rechargePoints[i], 'recharge', 1, 8, random);
  }
  
  return resources;
}

/**
 * Place resources near a point
 */
function placeNearPoint(
  resources: Resource[],
  locations: Array<{x: number, y: number}>,
  point: {x: number, y: number},
  type: 'crystal' | 'ore' | 'recharge',
  count: number,
  radius: number,
  random: () => number
) {
  const nearby = locations.filter(loc => {
    const dist = Math.sqrt((loc.x - point.x) ** 2 + (loc.y - point.y) ** 2);
    return dist <= radius;
  });
  
  const shuffled = shuffleArray(nearby, random);
  
  for (let i = 0; i < count && i < shuffled.length; i++) {
    resources.push({
      ...shuffled[i],
      type,
      amount: type === 'ore' ? Math.floor(random() * 3) + 1 : undefined
    });
  }
}

/**
 * Enforce minimum distance between resources
 */
function enforceMinDistance(resources: Resource[], minDistance: number): Resource[] {
  const filtered: Resource[] = [];
  
  for (const resource of resources) {
    let tooClose = false;
    
    for (const existing of filtered) {
      const dist = Math.sqrt(
        (resource.x - existing.x) ** 2 + 
        (resource.y - existing.y) ** 2
      );
      
      if (dist < minDistance) {
        tooClose = true;
        break;
      }
    }
    
    if (!tooClose) {
      filtered.push(resource);
    }
  }
  
  return filtered;
}

/**
 * Balance resources across quadrants
 */
function balanceQuadrants(
  resources: Resource[],
  tiles: number[][],
  random: () => number
): Resource[] {
  const width = tiles[0].length;
  const height = tiles.length;
  const midX = Math.floor(width / 2);
  const midY = Math.floor(height / 2);
  
  // Count resources per quadrant
  const quadrants = [
    {resources: [] as Resource[], minX: 0, maxX: midX, minY: 0, maxY: midY},
    {resources: [] as Resource[], minX: midX, maxX: width, minY: 0, maxY: midY},
    {resources: [] as Resource[], minX: 0, maxX: midX, minY: midY, maxY: height},
    {resources: [] as Resource[], minX: midX, maxX: width, minY: midY, maxY: height}
  ];
  
  // Assign resources to quadrants
  for (const resource of resources) {
    for (const quad of quadrants) {
      if (resource.x >= quad.minX && resource.x < quad.maxX &&
          resource.y >= quad.minY && resource.y < quad.maxY) {
        quad.resources.push(resource);
        break;
      }
    }
  }
  
  // Find target count (average)
  const totalResources = resources.length;
  const targetPerQuadrant = Math.floor(totalResources / 4);
  
  // Balance by moving excess resources
  const balanced: Resource[] = [];
  
  for (let i = 0; i < quadrants.length; i++) {
    const quad = quadrants[i];
    
    if (quad.resources.length > targetPerQuadrant) {
      // Keep only target amount
      const shuffled = shuffleArray(quad.resources, random);
      balanced.push(...shuffled.slice(0, targetPerQuadrant));
    } else {
      // Keep all
      balanced.push(...quad.resources);
    }
  }
  
  return balanced;
}

/**
 * Format result
 */
function formatResult(resources: Resource[], tiles: number[][]): ResourceMap {
  const crystals = resources
    .filter(r => r.type === 'crystal')
    .map(r => ({x: r.x, y: r.y}));
    
  const ore = resources
    .filter(r => r.type === 'ore')
    .map(r => ({x: r.x, y: r.y, amount: r.amount || 3}));
    
  const recharge = resources
    .filter(r => r.type === 'recharge')
    .map(r => ({x: r.x, y: r.y}));
  
  // Calculate statistics
  const allPositions = resources.map(r => ({x: r.x, y: r.y}));
  const avgSpacing = calculateAverageSpacing(allPositions);
  const quadBalance = calculateQuadrantBalance(resources, tiles);
  
  return {
    crystals,
    ore,
    recharge,
    stats: {
      totalCrystals: crystals.length,
      totalOre: ore.reduce((sum, o) => sum + o.amount, 0),
      totalRecharge: recharge.length,
      averageSpacing: avgSpacing,
      quadrantBalance: quadBalance
    }
  };
}

/**
 * Calculate average spacing between resources
 */
function calculateAverageSpacing(positions: Array<{x: number, y: number}>): number {
  if (positions.length < 2) return 0;
  
  let totalDistance = 0;
  let count = 0;
  
  for (let i = 0; i < positions.length - 1; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dist = Math.sqrt(
        (positions[i].x - positions[j].x) ** 2 +
        (positions[i].y - positions[j].y) ** 2
      );
      totalDistance += dist;
      count++;
    }
  }
  
  return count > 0 ? totalDistance / count : 0;
}

/**
 * Calculate resource distribution across quadrants
 */
function calculateQuadrantBalance(resources: Resource[], tiles: number[][]): number[] {
  const width = tiles[0].length;
  const height = tiles.length;
  const midX = Math.floor(width / 2);
  const midY = Math.floor(height / 2);
  
  const quadCounts = [0, 0, 0, 0];
  
  for (const resource of resources) {
    const quadIndex = 
      (resource.x >= midX ? 1 : 0) +
      (resource.y >= midY ? 2 : 0);
    quadCounts[quadIndex]++;
  }
  
  return quadCounts;
}

/**
 * Utility functions
 */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2147483648;
    return state / 2147483648;
  };
}

function shuffleArray<T>(array: T[], random: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Update tiles array with resources
 */
export function applyResourcesToTiles(
  tiles: number[][],
  resources: ResourceMap
): number[][] {
  const updated = tiles.map(row => [...row]);
  
  // Apply crystals (42 for crystal seam)
  for (const crystal of resources.crystals) {
    if (updated[crystal.y] && updated[crystal.y][crystal.x] !== undefined) {
      updated[crystal.y][crystal.x] = 42;
    }
  }
  
  // Apply ore (46 for ore seam)
  for (const ore of resources.ore) {
    if (updated[ore.y] && updated[ore.y][ore.x] !== undefined) {
      updated[ore.y][ore.x] = 46;
    }
  }
  
  // Apply recharge (50 for recharge seam)
  for (const recharge of resources.recharge) {
    if (updated[recharge.y] && updated[recharge.y][recharge.x] !== undefined) {
      updated[recharge.y][recharge.x] = 50;
    }
  }
  
  return updated;
}

/**
 * Example usage
 */
export function exampleUsage() {
  console.log('=== Resource Placement Examples ===\n');
  
  // Create a simple test map
  const testMap = createTestMap(40, 40);
  
  // Test different distribution strategies
  const strategies: Array<ResourcePlacementOptions['distribution']> = 
    ['random', 'clustered', 'veins', 'strategic'];
  
  for (const strategy of strategies) {
    console.log(`${strategy.toUpperCase()} Distribution:`);
    
    const resources = placeResources(testMap, {
      distribution: strategy,
      crystalDensity: 2.0,
      oreDensity: 1.5,
      rechargeDensity: 0.5,
      minDistanceBetween: strategy === 'random' ? 3 : 2,
      seed: 12345
    });
    
    console.log(`  Crystals: ${resources.stats.totalCrystals}`);
    console.log(`  Ore: ${resources.stats.totalOre}`);
    console.log(`  Recharge: ${resources.stats.totalRecharge}`);
    console.log(`  Avg spacing: ${resources.stats.averageSpacing.toFixed(2)} tiles`);
    console.log(`  Quadrant distribution: [${resources.stats.quadrantBalance.join(', ')}]`);
    console.log();
  }
  
  // Demonstrate resource-rich vs resource-poor
  console.log('Resource Density Comparison:');
  
  const poor = placeResources(testMap, {
    crystalDensity: 0.5,
    oreDensity: 0.3,
    rechargeDensity: 0.1,
    distribution: 'clustered'
  });
  
  const rich = placeResources(testMap, {
    crystalDensity: 4.0,
    oreDensity: 3.0,
    rechargeDensity: 1.0,
    distribution: 'clustered'
  });
  
  console.log('  Poor map: ', 
    `${poor.stats.totalCrystals} crystals, `,
    `${poor.stats.totalOre} ore, `,
    `${poor.stats.totalRecharge} recharge`
  );
  
  console.log('  Rich map: ', 
    `${rich.stats.totalCrystals} crystals, `,
    `${rich.stats.totalOre} ore, `,
    `${rich.stats.totalRecharge} recharge`
  );
}

/**
 * Create a simple test map
 */
function createTestMap(width: number, height: number): number[][] {
  const map: number[][] = [];
  
  for (let y = 0; y < height; y++) {
    map[y] = [];
    for (let x = 0; x < width; x++) {
      // Border
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        map[y][x] = 38; // Solid rock
      }
      // Scattered rock
      else if ((x + y) % 5 === 0) {
        map[y][x] = 34; // Hard rock
      }
      // Open space
      else {
        map[y][x] = 1; // Ground
      }
    }
  }
  
  return map;
}

// Run example if called directly
if (require.main === module) {
  exampleUsage();
}