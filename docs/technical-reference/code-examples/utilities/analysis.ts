/**
 * Map Analysis Utility Example
 * 
 * This example provides tools for analyzing Manic Miners maps, including
 * statistical analysis, balance checking, difficulty estimation, and
 * gameplay metrics calculation.
 */

// Analysis result types
export interface MapAnalysis {
  basic: BasicStats;
  resources: ResourceAnalysis;
  accessibility: AccessibilityAnalysis;
  difficulty: DifficultyAnalysis;
  balance: BalanceAnalysis;
  recommendations: string[];
}

export interface BasicStats {
  dimensions: { width: number; height: number };
  totalTiles: number;
  tileDistribution: Map<number, number>;
  biome: string;
  openSpaceRatio: number;
  edgeType: 'sealed' | 'open' | 'mixed';
}

export interface ResourceAnalysis {
  crystalCount: number;
  oreCount: number;
  rechargeCount: number;
  crystalDensity: number;
  oreDensity: number;
  resourceClusters: number;
  averageClusterSize: number;
  distribution: 'sparse' | 'balanced' | 'clustered';
}

export interface AccessibilityAnalysis {
  reachableArea: number;
  unreachableArea: number;
  isolatedRegions: number;
  chokePoints: Array<{x: number, y: number, importance: number}>;
  averagePathLength: number;
  connectivityScore: number;
}

export interface DifficultyAnalysis {
  estimatedDifficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  difficultyScore: number;
  hazardDensity: number;
  resourceAccessibility: number;
  navigationComplexity: number;
  threatLevel: number;
}

export interface BalanceAnalysis {
  resourceToSpaceRatio: number;
  hazardToResourceRatio: number;
  miningEffortScore: number;
  expansionPotential: number;
  strategicDepth: number;
}

/**
 * Comprehensive map analysis
 */
export function analyzeMap(
  tiles: number[][],
  info?: any,
  resources?: any,
  script?: string
): MapAnalysis {
  const basic = analyzeBasicStats(tiles, info);
  const resourceAnalysis = analyzeResources(tiles, resources);
  const accessibility = analyzeAccessibility(tiles);
  const difficulty = analyzeDifficulty(tiles, resourceAnalysis, accessibility);
  const balance = analyzeBalance(basic, resourceAnalysis, accessibility);
  const recommendations = generateRecommendations(
    basic, resourceAnalysis, accessibility, difficulty, balance
  );
  
  return {
    basic,
    resources: resourceAnalysis,
    accessibility,
    difficulty,
    balance,
    recommendations
  };
}

/**
 * Basic statistical analysis
 */
function analyzeBasicStats(tiles: number[][], info?: any): BasicStats {
  const height = tiles.length;
  const width = tiles[0].length;
  const totalTiles = width * height;
  
  // Count tile types
  const tileDistribution = new Map<number, number>();
  let openSpaceCount = 0;
  
  for (const row of tiles) {
    for (const tileId of row) {
      tileDistribution.set(tileId, (tileDistribution.get(tileId) || 0) + 1);
      
      if (isPassableTile(tileId)) {
        openSpaceCount++;
      }
    }
  }
  
  // Check edge type
  const edgeType = analyzeEdgeType(tiles);
  
  return {
    dimensions: { width, height },
    totalTiles,
    tileDistribution,
    biome: info?.biome || 'rock',
    openSpaceRatio: openSpaceCount / totalTiles,
    edgeType
  };
}

/**
 * Analyze map edges
 */
function analyzeEdgeType(tiles: number[][]): 'sealed' | 'open' | 'mixed' {
  const height = tiles.length;
  const width = tiles[0].length;
  let sealedEdges = 0;
  let openEdges = 0;
  
  // Check all edge tiles
  for (let x = 0; x < width; x++) {
    if (tiles[0][x] === 38) sealedEdges++; else openEdges++;
    if (tiles[height - 1][x] === 38) sealedEdges++; else openEdges++;
  }
  
  for (let y = 1; y < height - 1; y++) {
    if (tiles[y][0] === 38) sealedEdges++; else openEdges++;
    if (tiles[y][width - 1] === 38) sealedEdges++; else openEdges++;
  }
  
  const totalEdges = sealedEdges + openEdges;
  const sealedRatio = sealedEdges / totalEdges;
  
  if (sealedRatio > 0.95) return 'sealed';
  if (sealedRatio < 0.05) return 'open';
  return 'mixed';
}

/**
 * Resource analysis
 */
function analyzeResources(tiles: number[][], resources?: any): ResourceAnalysis {
  let crystalCount = 0;
  let oreCount = 0;
  let rechargeCount = 0;
  
  // Count resource tiles
  for (const row of tiles) {
    for (const tileId of row) {
      if (tileId === 42 || tileId === 142) crystalCount++;
      else if (tileId === 46 || tileId === 146) oreCount++;
      else if (tileId === 50 || tileId === 150) rechargeCount++;
    }
  }
  
  // Add placed resources if provided
  if (resources) {
    crystalCount += resources.crystals?.length || 0;
    oreCount += resources.ore?.length || 0;
  }
  
  const totalTiles = tiles.length * tiles[0].length;
  const crystalDensity = (crystalCount / totalTiles) * 100;
  const oreDensity = (oreCount / totalTiles) * 100;
  
  // Analyze clustering
  const clusters = findResourceClusters(tiles);
  const averageClusterSize = clusters.length > 0 
    ? clusters.reduce((sum, c) => sum + c.size, 0) / clusters.length 
    : 0;
  
  // Determine distribution pattern
  let distribution: ResourceAnalysis['distribution'] = 'balanced';
  if (clusters.length < 3) distribution = 'sparse';
  else if (averageClusterSize > 5) distribution = 'clustered';
  
  return {
    crystalCount,
    oreCount,
    rechargeCount,
    crystalDensity,
    oreDensity,
    resourceClusters: clusters.length,
    averageClusterSize,
    distribution
  };
}

/**
 * Find resource clusters
 */
function findResourceClusters(tiles: number[][]): Array<{x: number, y: number, size: number}> {
  const resourceTiles = [42, 46, 50, 142, 146, 150];
  const visited = createGrid(tiles[0].length, tiles.length, false);
  const clusters: Array<{x: number, y: number, size: number}> = [];
  
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      if (!visited[y][x] && resourceTiles.includes(tiles[y][x])) {
        const cluster = floodFillCluster(tiles, x, y, visited, resourceTiles);
        if (cluster.size > 0) {
          clusters.push(cluster);
        }
      }
    }
  }
  
  return clusters;
}

/**
 * Flood fill to find cluster
 */
function floodFillCluster(
  tiles: number[][],
  startX: number,
  startY: number,
  visited: boolean[][],
  validTiles: number[]
): {x: number, y: number, size: number} {
  const stack = [{x: startX, y: startY}];
  let size = 0;
  let sumX = 0;
  let sumY = 0;
  
  while (stack.length > 0) {
    const {x, y} = stack.pop()!;
    
    if (x < 0 || x >= tiles[0].length || y < 0 || y >= tiles.length) continue;
    if (visited[y][x]) continue;
    if (!validTiles.includes(tiles[y][x])) continue;
    
    visited[y][x] = true;
    size++;
    sumX += x;
    sumY += y;
    
    stack.push({x: x - 1, y});
    stack.push({x: x + 1, y});
    stack.push({x, y: y - 1});
    stack.push({x, y: y + 1});
  }
  
  return {
    x: Math.floor(sumX / size),
    y: Math.floor(sumY / size),
    size
  };
}

/**
 * Accessibility analysis
 */
function analyzeAccessibility(tiles: number[][]): AccessibilityAnalysis {
  const height = tiles.length;
  const width = tiles[0].length;
  const totalTiles = width * height;
  
  // Find all connected regions
  const regions = findConnectedRegions(tiles);
  const largestRegion = Math.max(...regions.map(r => r.length), 0);
  const reachableArea = largestRegion;
  const unreachableArea = totalTiles - regions.reduce((sum, r) => sum + r.length, 0);
  
  // Find choke points
  const chokePoints = findChokePoints(tiles);
  
  // Calculate average path length
  const averagePathLength = calculateAveragePathLength(tiles, regions[0] || []);
  
  // Calculate connectivity score (0-1)
  const connectivityScore = calculateConnectivityScore(
    regions, reachableArea, totalTiles, chokePoints.length
  );
  
  return {
    reachableArea,
    unreachableArea,
    isolatedRegions: regions.length - 1,
    chokePoints,
    averagePathLength,
    connectivityScore
  };
}

/**
 * Find connected regions
 */
function findConnectedRegions(tiles: number[][]): Array<Array<{x: number, y: number}>> {
  const visited = createGrid(tiles[0].length, tiles.length, false);
  const regions: Array<Array<{x: number, y: number}>> = [];
  
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      if (!visited[y][x] && isPassableTile(tiles[y][x])) {
        const region = extractRegion(tiles, x, y, visited);
        regions.push(region);
      }
    }
  }
  
  return regions.sort((a, b) => b.length - a.length);
}

/**
 * Extract a connected region
 */
function extractRegion(
  tiles: number[][],
  startX: number,
  startY: number,
  visited: boolean[][]
): Array<{x: number, y: number}> {
  const region: Array<{x: number, y: number}> = [];
  const stack = [{x: startX, y: startY}];
  
  while (stack.length > 0) {
    const {x, y} = stack.pop()!;
    
    if (x < 0 || x >= tiles[0].length || y < 0 || y >= tiles.length) continue;
    if (visited[y][x]) continue;
    if (!isPassableTile(tiles[y][x])) continue;
    
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
 * Find choke points (tiles whose removal would disconnect regions)
 */
function findChokePoints(tiles: number[][]): Array<{x: number, y: number, importance: number}> {
  const chokePoints: Array<{x: number, y: number, importance: number}> = [];
  const passableTiles = [];
  
  // Collect all passable tiles
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      if (isPassableTile(tiles[y][x])) {
        passableTiles.push({x, y});
      }
    }
  }
  
  // Test each passable tile
  for (const {x, y} of passableTiles) {
    const importance = calculateChokeImportance(tiles, x, y);
    if (importance > 0) {
      chokePoints.push({x, y, importance});
    }
  }
  
  return chokePoints.sort((a, b) => b.importance - a.importance);
}

/**
 * Calculate choke point importance
 */
function calculateChokeImportance(tiles: number[][], x: number, y: number): number {
  // Temporarily make tile impassable
  const original = tiles[y][x];
  tiles[y][x] = 38;
  
  // Count regions
  const regions = findConnectedRegions(tiles);
  
  // Restore tile
  tiles[y][x] = original;
  
  // If removing this tile creates more regions, it's a choke point
  if (regions.length > 1) {
    // Importance based on size of separated regions
    const sizes = regions.map(r => r.length).sort((a, b) => b - a);
    return sizes[1] || 1; // Size of second largest region
  }
  
  return 0;
}

/**
 * Calculate average path length
 */
function calculateAveragePathLength(
  tiles: number[][],
  region: Array<{x: number, y: number}>
): number {
  if (region.length < 2) return 0;
  
  // Sample random pairs and calculate paths
  const sampleSize = Math.min(10, region.length);
  const samples = [];
  
  for (let i = 0; i < sampleSize; i++) {
    const start = region[Math.floor(Math.random() * region.length)];
    const end = region[Math.floor(Math.random() * region.length)];
    
    if (start !== end) {
      const path = findPath(tiles, start, end);
      if (path) {
        samples.push(path.length);
      }
    }
  }
  
  return samples.length > 0 
    ? samples.reduce((sum, len) => sum + len, 0) / samples.length 
    : 0;
}

/**
 * Calculate connectivity score
 */
function calculateConnectivityScore(
  regions: Array<Array<{x: number, y: number}>>,
  reachableArea: number,
  totalTiles: number,
  chokePointCount: number
): number {
  // Factors:
  // - Single large region is good
  // - High reachable ratio is good
  // - Few choke points is good
  
  const regionScore = regions.length > 0 ? 1 / regions.length : 0;
  const reachableScore = reachableArea / totalTiles;
  const chokeScore = Math.max(0, 1 - chokePointCount / 10);
  
  return (regionScore + reachableScore + chokeScore) / 3;
}

/**
 * Difficulty analysis
 */
function analyzeDifficulty(
  tiles: number[][],
  resources: ResourceAnalysis,
  accessibility: AccessibilityAnalysis
): DifficultyAnalysis {
  // Calculate component scores
  const hazardDensity = calculateHazardDensity(tiles);
  const resourceAccessibility = calculateResourceAccessibility(
    resources, accessibility
  );
  const navigationComplexity = calculateNavigationComplexity(
    tiles, accessibility
  );
  const threatLevel = calculateThreatLevel(tiles);
  
  // Combine into overall difficulty
  const difficultyScore = 
    hazardDensity * 0.3 +
    (1 - resourceAccessibility) * 0.25 +
    navigationComplexity * 0.25 +
    threatLevel * 0.2;
  
  // Categorize
  let estimatedDifficulty: DifficultyAnalysis['estimatedDifficulty'];
  if (difficultyScore < 0.25) estimatedDifficulty = 'easy';
  else if (difficultyScore < 0.5) estimatedDifficulty = 'medium';
  else if (difficultyScore < 0.75) estimatedDifficulty = 'hard';
  else estimatedDifficulty = 'extreme';
  
  return {
    estimatedDifficulty,
    difficultyScore,
    hazardDensity,
    resourceAccessibility,
    navigationComplexity,
    threatLevel
  };
}

/**
 * Calculate hazard density
 */
function calculateHazardDensity(tiles: number[][]): number {
  const hazardTiles = [6, 7, 11, 12]; // Lava, erosion, water, slug holes
  let hazardCount = 0;
  const totalTiles = tiles.length * tiles[0].length;
  
  for (const row of tiles) {
    for (const tileId of row) {
      if (hazardTiles.includes(tileId)) {
        hazardCount++;
      }
    }
  }
  
  return hazardCount / totalTiles;
}

/**
 * Calculate resource accessibility
 */
function calculateResourceAccessibility(
  resources: ResourceAnalysis,
  accessibility: AccessibilityAnalysis
): number {
  // Higher resource density and better connectivity = more accessible
  const resourceScore = Math.min(1, (resources.crystalDensity + resources.oreDensity) / 5);
  const connectivityScore = accessibility.connectivityScore;
  
  return (resourceScore + connectivityScore) / 2;
}

/**
 * Calculate navigation complexity
 */
function calculateNavigationComplexity(
  tiles: number[][],
  accessibility: AccessibilityAnalysis
): number {
  // Factors: choke points, isolated regions, average path length
  const chokeScore = Math.min(1, accessibility.chokePoints.length / 10);
  const regionScore = Math.min(1, accessibility.isolatedRegions / 5);
  const pathScore = Math.min(1, accessibility.averagePathLength / 50);
  
  return (chokeScore + regionScore + pathScore) / 3;
}

/**
 * Calculate threat level
 */
function calculateThreatLevel(tiles: number[][]): number {
  // Estimate based on biome and special tiles
  // This is simplified - in real analysis you'd check script for monsters
  let threatScore = 0;
  
  for (const row of tiles) {
    for (const tileId of row) {
      if (tileId === 6 || tileId === 7) threatScore += 0.002; // Lava
      if (tileId === 12) threatScore += 0.001; // Slug holes
    }
  }
  
  return Math.min(1, threatScore);
}

/**
 * Balance analysis
 */
function analyzeBalance(
  basic: BasicStats,
  resources: ResourceAnalysis,
  accessibility: AccessibilityAnalysis
): BalanceAnalysis {
  const resourceToSpaceRatio = 
    (resources.crystalCount + resources.oreCount) / 
    (basic.openSpaceRatio * basic.totalTiles);
  
  const hazardToResourceRatio = 
    calculateHazardDensity(Array.from({length: basic.dimensions.height}, 
      (_, y) => Array.from({length: basic.dimensions.width}, () => 1))) /
    Math.max(0.01, resources.crystalDensity + resources.oreDensity);
  
  const miningEffortScore = calculateMiningEffort(basic);
  const expansionPotential = calculateExpansionPotential(basic, accessibility);
  const strategicDepth = calculateStrategicDepth(
    resources, accessibility, basic
  );
  
  return {
    resourceToSpaceRatio,
    hazardToResourceRatio,
    miningEffortScore,
    expansionPotential,
    strategicDepth
  };
}

/**
 * Calculate mining effort required
 */
function calculateMiningEffort(basic: BasicStats): number {
  const looseRock = basic.tileDistribution.get(30) || 0;
  const hardRock = basic.tileDistribution.get(34) || 0;
  const solidRock = basic.tileDistribution.get(38) || 0;
  
  const totalRock = looseRock + hardRock + solidRock;
  const weightedEffort = 
    (looseRock * 1 + hardRock * 2 + solidRock * 3) / 
    Math.max(1, totalRock);
  
  return weightedEffort / 3; // Normalize to 0-1
}

/**
 * Calculate expansion potential
 */
function calculateExpansionPotential(
  basic: BasicStats,
  accessibility: AccessibilityAnalysis
): number {
  // Based on open space and connectivity
  const spaceScore = basic.openSpaceRatio;
  const connectScore = accessibility.connectivityScore;
  const edgeScore = basic.edgeType === 'sealed' ? 0.5 : 1.0;
  
  return (spaceScore + connectScore + edgeScore) / 3;
}

/**
 * Calculate strategic depth
 */
function calculateStrategicDepth(
  resources: ResourceAnalysis,
  accessibility: AccessibilityAnalysis,
  basic: BasicStats
): number {
  // Multiple paths, resource choices, expansion options
  const pathDiversity = Math.min(1, accessibility.chokePoints.length / 5);
  const resourceDiversity = resources.distribution === 'balanced' ? 1 : 0.5;
  const spatialComplexity = 1 - basic.openSpaceRatio;
  
  return (pathDiversity + resourceDiversity + spatialComplexity) / 3;
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  basic: BasicStats,
  resources: ResourceAnalysis,
  accessibility: AccessibilityAnalysis,
  difficulty: DifficultyAnalysis,
  balance: BalanceAnalysis
): string[] {
  const recommendations: string[] = [];
  
  // Resource recommendations
  if (resources.crystalDensity < 1) {
    recommendations.push('Consider adding more crystal deposits for better energy economy');
  }
  if (resources.distribution === 'sparse') {
    recommendations.push('Resources are too sparse - consider clustering for strategic interest');
  }
  
  // Accessibility recommendations
  if (accessibility.isolatedRegions > 0) {
    recommendations.push(`${accessibility.isolatedRegions} isolated regions detected - ensure intentional or connect them`);
  }
  if (accessibility.chokePoints.length > 5) {
    recommendations.push('Many choke points detected - consider adding alternate paths');
  }
  
  // Difficulty recommendations
  if (difficulty.estimatedDifficulty === 'extreme') {
    recommendations.push('Map difficulty is extreme - consider reducing hazards or adding resources');
  }
  if (difficulty.estimatedDifficulty === 'easy' && basic.dimensions.width > 30) {
    recommendations.push('Large map with easy difficulty - consider adding challenges');
  }
  
  // Balance recommendations
  if (balance.resourceToSpaceRatio < 0.1) {
    recommendations.push('Low resource density relative to space - may lead to slow gameplay');
  }
  if (balance.expansionPotential < 0.3) {
    recommendations.push('Limited expansion potential - consider opening more areas');
  }
  
  return recommendations;
}

/**
 * Helper functions
 */
function createGrid<T>(width: number, height: number, defaultValue: T): T[][] {
  const grid: T[][] = [];
  for (let y = 0; y < height; y++) {
    grid[y] = new Array(width).fill(defaultValue);
  }
  return grid;
}

function isPassableTile(tileId: number): boolean {
  const passableTiles = [1, 14, 26];
  return passableTiles.includes(tileId);
}

function findPath(
  tiles: number[][],
  start: {x: number, y: number},
  end: {x: number, y: number}
): Array<{x: number, y: number}> | null {
  // Simplified pathfinding for analysis
  // In production, use the full pathfinding implementation
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  return Array(dx + dy).fill(null).map((_, i) => ({
    x: start.x + Math.floor(i * (end.x - start.x) / (dx + dy)),
    y: start.y + Math.floor(i * (end.y - start.y) / (dx + dy))
  }));
}

/**
 * Generate analysis report
 */
export function generateReport(analysis: MapAnalysis): string {
  let report = '=== MAP ANALYSIS REPORT ===\n\n';
  
  // Basic stats
  report += 'BASIC STATISTICS:\n';
  report += `  Dimensions: ${analysis.basic.dimensions.width}x${analysis.basic.dimensions.height}\n`;
  report += `  Biome: ${analysis.basic.biome}\n`;
  report += `  Open Space: ${(analysis.basic.openSpaceRatio * 100).toFixed(1)}%\n`;
  report += `  Edge Type: ${analysis.basic.edgeType}\n\n`;
  
  // Resources
  report += 'RESOURCE ANALYSIS:\n';
  report += `  Crystals: ${analysis.resources.crystalCount} (${analysis.resources.crystalDensity.toFixed(2)}% density)\n`;
  report += `  Ore: ${analysis.resources.oreCount} (${analysis.resources.oreDensity.toFixed(2)}% density)\n`;
  report += `  Distribution: ${analysis.resources.distribution}\n`;
  report += `  Clusters: ${analysis.resources.resourceClusters}\n\n`;
  
  // Accessibility
  report += 'ACCESSIBILITY:\n';
  report += `  Reachable Area: ${analysis.accessibility.reachableArea} tiles\n`;
  report += `  Isolated Regions: ${analysis.accessibility.isolatedRegions}\n`;
  report += `  Choke Points: ${analysis.accessibility.chokePoints.length}\n`;
  report += `  Connectivity Score: ${(analysis.accessibility.connectivityScore * 100).toFixed(1)}%\n\n`;
  
  // Difficulty
  report += 'DIFFICULTY ASSESSMENT:\n';
  report += `  Estimated Difficulty: ${analysis.difficulty.estimatedDifficulty.toUpperCase()}\n`;
  report += `  Difficulty Score: ${(analysis.difficulty.difficultyScore * 100).toFixed(1)}%\n`;
  report += `  Hazard Density: ${(analysis.difficulty.hazardDensity * 100).toFixed(1)}%\n`;
  report += `  Navigation Complexity: ${(analysis.difficulty.navigationComplexity * 100).toFixed(1)}%\n\n`;
  
  // Balance
  report += 'BALANCE METRICS:\n';
  report += `  Resource/Space Ratio: ${analysis.balance.resourceToSpaceRatio.toFixed(3)}\n`;
  report += `  Mining Effort: ${(analysis.balance.miningEffortScore * 100).toFixed(1)}%\n`;
  report += `  Expansion Potential: ${(analysis.balance.expansionPotential * 100).toFixed(1)}%\n`;
  report += `  Strategic Depth: ${(analysis.balance.strategicDepth * 100).toFixed(1)}%\n\n`;
  
  // Recommendations
  if (analysis.recommendations.length > 0) {
    report += 'RECOMMENDATIONS:\n';
    for (const rec of analysis.recommendations) {
      report += `  • ${rec}\n`;
    }
  }
  
  return report;
}

/**
 * Example usage
 */
export function exampleUsage() {
  console.log('=== Map Analysis Example ===\n');
  
  // Create test map
  const testMap = [
    [38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38],
    [38,  1,  1,  1,  1, 34, 42,  1,  1,  1,  1,  1,  1,  1, 38],
    [38,  1, 34, 34,  1, 34, 34,  1, 46,  1, 30, 30,  1,  1, 38],
    [38,  1, 34, 42,  1,  1,  1,  1,  1,  1,  1, 30,  1,  1, 38],
    [38,  1, 34, 34,  1, 38, 38, 38,  1, 38, 38, 38,  1,  1, 38],
    [38,  1,  1,  1,  1, 38,  6,  6,  1,  6,  6, 38,  1,  1, 38],
    [38,  1, 30, 30,  1, 38,  6,  1,  1,  1,  6, 38,  1, 12, 38],
    [38,  1,  1,  1,  1, 38,  1,  1, 50,  1,  1, 38,  1,  1, 38],
    [38,  1, 46,  1,  1, 38, 38,  1,  1,  1, 38, 38,  1,  1, 38],
    [38,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 38],
    [38,  1, 30, 30,  1, 34, 34,  1, 42,  1, 30, 30,  1,  1, 38],
    [38,  1, 30, 46,  1, 34, 42,  1,  1,  1, 30, 46,  1,  1, 38],
    [38,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 38],
    [38,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 38],
    [38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38, 38]
  ];
  
  const info = {
    biome: 'lava',
    rowcount: 15,
    colcount: 15
  };
  
  // Analyze map
  const analysis = analyzeMap(testMap, info);
  
  // Generate and print report
  const report = generateReport(analysis);
  console.log(report);
  
  // Specific insights
  console.log('\nKEY INSIGHTS:');
  console.log(`- This map has ${analysis.accessibility.chokePoints.length} strategic choke points`);
  console.log(`- Resource distribution is ${analysis.resources.distribution}`);
  console.log(`- The map is ${analysis.difficulty.estimatedDifficulty} difficulty`);
  console.log(`- Strategic depth score: ${(analysis.balance.strategicDepth * 100).toFixed(0)}%`);
}

// Run example if called directly
if (require.main === module) {
  exampleUsage();
}