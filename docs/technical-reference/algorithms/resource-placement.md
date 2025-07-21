# Resource Placement Algorithm

## Overview
Resource placement in Manic Miners maps uses various distribution strategies to create balanced and interesting gameplay. The system places both tile-based resources (crystal/ore seams) and explicit resource markers.

## Distribution Strategies

### 1. Power Law Distribution
Creates realistic clustering with some areas rich in resources and others sparse.

```typescript
function powerLawDistribution(
  map: TileGrid,
  resourceType: number,
  totalAmount: number,
  alpha: number = 2.0
): void {
  const deposits: Array<{x: number, y: number, size: number}> = [];
  let remaining = totalAmount;
  
  // Generate deposit sizes following power law
  while (remaining > 0) {
    // Size follows power law: P(size) ~ size^(-alpha)
    const u = Math.random();
    const size = Math.floor(Math.pow(u, -1 / (alpha - 1)));
    const actualSize = Math.min(size, remaining);
    
    // Find valid location
    const location = findValidResourceLocation(map);
    if (location) {
      deposits.push({...location, size: actualSize});
      remaining -= actualSize;
    }
  }
  
  // Place deposits on map
  for (const deposit of deposits) {
    placeResourceCluster(map, deposit.x, deposit.y, resourceType, deposit.size);
  }
}
```

### 2. Cluster Placement
Places resources in natural-looking clusters rather than scattered individual tiles.

```typescript
function placeResourceCluster(
  map: TileGrid,
  centerX: number,
  centerY: number,
  resourceType: number,
  size: number
): void {
  const placed = new Set<string>();
  const queue: Array<{x: number, y: number, chance: number}> = [
    {x: centerX, y: centerY, chance: 1.0}
  ];
  
  let remaining = size;
  
  while (queue.length > 0 && remaining > 0) {
    // Sort by chance (highest first)
    queue.sort((a, b) => b.chance - a.chance);
    const current = queue.shift()!;
    
    const key = `${current.x},${current.y}`;
    if (placed.has(key)) continue;
    
    // Check if we can place here
    if (canPlaceResource(map, current.x, current.y)) {
      // Randomly decide based on chance
      if (Math.random() < current.chance) {
        // Choose appropriate variant (0-3) based on neighbors
        const variant = calculateResourceVariant(map, current.x, current.y, resourceType);
        map.set(current.x, current.y, resourceType + variant);
        placed.add(key);
        remaining--;
        
        // Add neighbors to queue with decreasing chance
        const neighbors = getNeighbors(current.x, current.y);
        for (const neighbor of neighbors) {
          if (!placed.has(`${neighbor.x},${neighbor.y}`)) {
            queue.push({
              ...neighbor,
              chance: current.chance * 0.7 // 70% decay
            });
          }
        }
      }
    }
  }
}
```

### 3. Depth-Based Placement
Places more valuable resources deeper in the map, encouraging exploration.

```typescript
function depthBasedPlacement(map: DatFile): void {
  const startX = map.info.colcount / 2;
  const startY = map.info.rowcount / 2;
  
  // Calculate distance from start for each tile
  const distances = calculateDistances(map, startX, startY);
  
  for (let y = 0; y < map.info.rowcount; y++) {
    for (let x = 0; x < map.info.colcount; x++) {
      const distance = distances[y][x];
      if (distance === Infinity) continue; // Unreachable
      
      // Probability of resource increases with distance
      const crystalChance = Math.min(0.1 * (distance / 20), 0.5);
      const oreChance = Math.min(0.05 * (distance / 30), 0.3);
      
      if (canPlaceResource(map, x, y)) {
        if (Math.random() < crystalChance) {
          // Place crystal seam
          map.tiles[y][x] = 42 + Math.floor(Math.random() * 4);
        } else if (Math.random() < oreChance) {
          // Place ore seam
          map.tiles[y][x] = 46 + Math.floor(Math.random() * 4);
        }
      }
    }
  }
}
```

## Resource Types and Properties

### Crystal Seams (IDs 42-45, 92-95)
- **Yield**: 1-5 crystals per tile
- **Default**: 1 crystal
- **Placement**: Often near surface, in clusters
- **Variants**: Shape based on adjacent seams

### Ore Seams (IDs 46-49, 96-99)
- **Yield**: 1-3 ore per tile
- **Default**: 3 ore
- **Placement**: Deeper locations, smaller clusters
- **Variants**: Shape based on adjacent seams

### Recharge Seams (IDs 50-53, 100-103)
- **Purpose**: Power electric fences
- **Placement**: Strategic locations near defenses
- **Special**: Don't yield resources, provide power

### Explicit Resources
In addition to tile-based resources, maps can specify exact amounts:

```typescript
interface ResourceSection {
  crystals?: number[][];  // 2D grid of crystal amounts
  ore?: number[][];       // 2D grid of ore amounts
}

// Example: Place 5 crystals at specific location
map.resources.crystals[10][15] = 5;
```

## Placement Validation

### 1. Check Tile Validity
```typescript
function canPlaceResource(map: TileGrid, x: number, y: number): boolean {
  const currentTile = map.get(x, y);
  
  // Can only replace certain wall types
  const replaceableWalls = [
    26, 27, 28, 29,  // Dirt
    30, 31, 32, 33,  // Loose rock
    34, 35, 36, 37,  // Hard rock
    // Not solid rock (38-41) - those should stay
  ];
  
  return replaceableWalls.includes(currentTile);
}
```

### 2. Variant Selection
```typescript
function calculateResourceVariant(
  map: TileGrid,
  x: number,
  y: number,
  baseType: number
): number {
  // Count adjacent resources of same type
  let connections = 0;
  const neighbors = [
    {dx: 0, dy: -1},  // North
    {dx: 1, dy: 0},   // East
    {dx: 0, dy: 1},   // South
    {dx: -1, dy: 0},  // West
  ];
  
  for (const {dx, dy} of neighbors) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < map.width && ny >= 0 && ny < map.height) {
      const tile = map.get(nx, ny);
      // Check if same resource type (any variant)
      if (Math.floor(tile / 4) === Math.floor(baseType / 4)) {
        connections++;
      }
    }
  }
  
  // Select variant based on connections
  // 0 = isolated, 1 = corner, 2 = edge, 3 = intersection
  if (connections === 0) return 0;
  if (connections === 1) return 1;
  if (connections === 2) return 2;
  return 3;
}
```

## Balancing Strategies

### 1. Resource Quotas
Ensure minimum resources for objectives:

```typescript
function ensureMinimumResources(map: DatFile): void {
  const objectives = map.objectives || [];
  let requiredCrystals = 0;
  let requiredOre = 0;
  
  // Calculate requirements from objectives
  for (const obj of objectives) {
    if (obj.type === 'resources') {
      requiredCrystals = Math.max(requiredCrystals, obj.crystals);
      requiredOre = Math.max(requiredOre, obj.ore);
    }
  }
  
  // Add safety margin (150% of required)
  requiredCrystals = Math.floor(requiredCrystals * 1.5);
  requiredOre = Math.floor(requiredOre * 1.5);
  
  // Count existing resources
  const existing = countAllResources(map);
  
  // Add more if needed
  if (existing.crystals < requiredCrystals) {
    addResources(map, 'crystal', requiredCrystals - existing.crystals);
  }
  if (existing.ore < requiredOre) {
    addResources(map, 'ore', requiredOre - existing.ore);
  }
}
```

### 2. Accessibility Check
Ensure resources can be reached:

```typescript
function validateResourceAccessibility(map: DatFile): string[] {
  const errors: string[] = [];
  const reachable = findReachableTiles(map);
  
  // Check each resource tile
  for (let y = 0; y < map.info.rowcount; y++) {
    for (let x = 0; x < map.info.colcount; x++) {
      const tile = map.tiles[y][x];
      
      // Is this a resource tile?
      if (isResourceTile(tile)) {
        // Check if any adjacent tile is reachable
        let hasAccess = false;
        for (const {nx, ny} of getNeighbors(x, y)) {
          if (reachable.has(`${nx},${ny}`)) {
            hasAccess = true;
            break;
          }
        }
        
        if (!hasAccess) {
          errors.push(`Resource at [${x},${y}] is not accessible`);
        }
      }
    }
  }
  
  return errors;
}
```

## Performance Optimization

### 1. Spatial Indexing
For large maps, use spatial indexing to speed up placement:

```typescript
class ResourcePlacer {
  private grid: SpatialGrid<Resource>;
  
  constructor(width: number, height: number, cellSize: number = 10) {
    this.grid = new SpatialGrid(width, height, cellSize);
  }
  
  findValidLocation(minDistance: number): {x: number, y: number} | null {
    // Use spatial grid to quickly find areas without resources
    const emptyCells = this.grid.getEmptyCells();
    
    for (const cell of emptyCells) {
      const candidates = cell.getRandomPoints(10);
      for (const point of candidates) {
        if (this.isValidLocation(point, minDistance)) {
          return point;
        }
      }
    }
    
    return null;
  }
}
```

### 2. Batch Processing
Place resources in batches for better cache locality:

```typescript
function batchResourcePlacement(
  map: TileGrid,
  placements: Array<{x: number, y: number, type: number}>
): void {
  // Sort by location for better cache performance
  placements.sort((a, b) => {
    const indexA = a.y * map.width + a.x;
    const indexB = b.y * map.width + b.x;
    return indexA - indexB;
  });
  
  // Apply in batches
  const batchSize = 1000;
  for (let i = 0; i < placements.length; i += batchSize) {
    const batch = placements.slice(i, i + batchSize);
    for (const {x, y, type} of batch) {
      map.set(x, y, type);
    }
  }
}
```

## See Also
- [Cave Generation](cave-generation.md)
- [Terrain Generation](terrain-generation.md)
- [Common Patterns](../common-patterns.md)