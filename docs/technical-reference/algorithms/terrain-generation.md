# Terrain Generation Algorithm

## Overview

The terrain generation system in Manic Miners uses a combination of cellular automata, noise functions, and biome-specific rules to create diverse and playable cave systems. The algorithm is based on the map-generator reference implementation.

## Core Algorithm: Speleogenesis

The primary cave generation uses a cellular automata approach called "speleogenesis" (cave formation).

### Basic Cellular Automata

```typescript
function speleogenesis(array: Array2D) {
  let changed = true;
  while (changed) {
    changed = false;
    const tempMap = cloneArray(array);
    
    for (let i = 1; i < array.length - 1; i++) {
      for (let j = 1; j < array[0].length - 1; j++) {
        // Count adjacent solid tiles
        let adjacent = 0;
        if (tempMap[i + 1][j] === -1) adjacent++;
        if (tempMap[i - 1][j] === -1) adjacent++;
        if (tempMap[i][j + 1] === -1) adjacent++;
        if (tempMap[i][j - 1] === -1) adjacent++;
        
        // Apply rules
        if (adjacent === 0) {
          // Isolated tiles become open
          if (array[i][j] !== 0) {
            changed = true;
            array[i][j] = 0;
          }
        } else if (adjacent >= 3) {
          // Tiles with 3+ solid neighbors become solid
          if (array[i][j] !== -1) {
            changed = true;
            array[i][j] = -1;
          }
        }
      }
    }
  }
}
```

## Generation Pipeline

### 1. Initialization
```typescript
function initializeTerrain(params: Parameters) {
  // Create base arrays
  const solidArray = createArray(params.length, params.width, -1);
  const wallArray = createArray(params.length, params.width, -1);
  
  // Apply initial randomization
  randomize(solidArray, 1 - params.solidDensity);
  randomize(wallArray, 1 - params.wallDensity);
}
```

### 2. Layer Generation
The map is built in layers:

1. **Solid Layer**: Determines basic cave structure
2. **Wall Layer**: Adds drillable walls within caves
3. **Resource Layers**: Places ore and crystals
4. **Flow Layer**: Adds water/lava features

### 3. Randomization
```typescript
function randomize(array: Array2D, emptyChance: number) {
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array[0].length; j++) {
      if (i === 0 || j === 0 || 
          i === array.length - 1 || 
          j === array[0].length - 1) {
        // Keep borders solid
        array[i][j] = -1;
      } else {
        // Random based on density
        array[i][j] = Math.random() < emptyChance ? 0 : -1;
      }
    }
  }
}
```

## Biome-Specific Features

### Rock Biome
- Standard cave generation
- Moderate resource distribution
- Balanced terrain features

### Ice Biome
```typescript
function applyIceBiome(array: Array2D, params: Parameters) {
  // Ice biomes have more open areas
  const iceDensity = params.solidDensity * 0.8;
  
  // Add ice-specific features
  addIceLakes(array);
  addSlipperyPaths(array);
}
```

### Lava Biome
```typescript
function applyLavaBiome(array: Array2D, params: Parameters) {
  // Create lava flows
  const sources = findLavaSources(array);
  
  for (const source of sources) {
    createLavaFlow(array, source, params.lavaSpread);
  }
  
  // Add erosion markers
  markErosionTiles(array);
}
```

## Height Map Generation

### Base Height
```typescript
function generateHeightMap(terrain: Array2D): Array2D {
  const height = createArray(terrain.length + 1, terrain[0].length + 1, 0);
  
  // Apply base elevation
  for (let i = 0; i < height.length; i++) {
    for (let j = 0; j < height[0].length; j++) {
      // Border at 0
      if (i === 0 || j === 0 || 
          i === height.length - 1 || 
          j === height[0].length - 1) {
        height[i][j] = 0;
        continue;
      }
      
      // Base height from terrain type
      const terrainType = getTerrainAt(terrain, i, j);
      height[i][j] = getBaseHeight(terrainType);
    }
  }
  
  // Smooth heights
  smoothHeightMap(height);
  
  return height;
}
```

### Height Smoothing
```typescript
function smoothHeightMap(height: Array2D, iterations: number = 3) {
  for (let iter = 0; iter < iterations; iter++) {
    const temp = cloneArray(height);
    
    for (let i = 1; i < height.length - 1; i++) {
      for (let j = 1; j < height[0].length - 1; j++) {
        // Average with neighbors
        const sum = 
          temp[i-1][j-1] + temp[i-1][j] + temp[i-1][j+1] +
          temp[i][j-1] + temp[i][j] + temp[i][j+1] +
          temp[i+1][j-1] + temp[i+1][j] + temp[i+1][j+1];
        
        height[i][j] = Math.floor(sum / 9);
      }
    }
  }
}
```

## Resource Distribution

### Crystal Placement
```typescript
function placeCrystals(terrain: Array2D, params: Parameters) {
  const crystalArray = createArray(terrain.length, terrain[0].length, -1);
  
  // Initial random placement
  randomize(crystalArray, 1 - params.crystalDensity);
  
  // Apply cellular automata for clustering
  speleogenesis(crystalArray);
  
  // Convert to crystal tiles
  for (let i = 0; i < terrain.length; i++) {
    for (let j = 0; j < terrain[0].length; j++) {
      if (crystalArray[i][j] === -1 && isValidWall(terrain[i][j])) {
        // Crystal seam variants (42-45)
        terrain[i][j] = 42 + Math.floor(Math.random() * 4);
      }
    }
  }
}
```

### Ore Distribution
Similar to crystals but with different density and clustering parameters:
```typescript
function placeOre(terrain: Array2D, params: Parameters) {
  // Ore is typically less common than crystals
  const oreDensity = params.oreDensity * 0.7;
  
  // Place ore deeper in the map
  const oreArray = createWeightedArray(terrain, oreDensity, 'depth');
  
  // Apply generation
  speleogenesis(oreArray);
  applyOreSeams(terrain, oreArray);
}
```

## Flow Systems (Water/Lava)

### Flow Creation
```typescript
function createFlowList(
  array: Array2D, 
  density: number, 
  height: Array2D, 
  preFlow: number, 
  terrain: number
): Point[][] {
  const flowArray = createArray(array.length, array[0].length, -1);
  const spillList: Point[][] = [];
  const sources: Point[] = [];
  
  // Find potential flow sources
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array[0].length; j++) {
      if (array[i][j] === 0 && Math.random() < density) {
        sources.push([i, j]);
      }
    }
  }
  
  // Create flows from each source
  for (const source of sources) {
    const flow = simulateFlow(source, height, terrain);
    spillList.push(flow);
  }
  
  return spillList;
}
```

### Flow Simulation
```typescript
function simulateFlow(
  source: Point, 
  height: Array2D, 
  maxElevationDiff: number
): Point[] {
  const flow = [source];
  const visited = new Set<string>();
  visited.add(`${source[0]},${source[1]}`);
  
  let i = 0;
  while (i < flow.length) {
    const current = flow[i];
    const currentElevation = getElevationAt(height, current);
    
    // Check all adjacent tiles
    const adjacent = getAdjacentTiles(current);
    
    for (const next of adjacent) {
      const key = `${next[0]},${next[1]}`;
      if (visited.has(key)) continue;
      
      const nextElevation = getElevationAt(height, next);
      
      // Flow downhill or across small elevation changes
      if (currentElevation >= nextElevation - maxElevationDiff) {
        flow.push(next);
        visited.add(key);
      }
    }
    
    i++;
  }
  
  return flow;
}
```

## Cleanup and Validation

### Fill Extra Spaces
```typescript
function fillExtra(array: Array2D): boolean {
  // Find largest connected area
  const areas = findConnectedAreas(array);
  if (areas.length === 0) return false;
  
  const largestArea = areas.sort((a, b) => b.size - a.size)[0];
  
  // Fill all smaller areas
  for (const area of areas) {
    if (area !== largestArea) {
      for (const [i, j] of area.tiles) {
        array[i][j] = -1; // Make solid
      }
    }
  }
  
  // Ensure minimum open space
  return largestArea.size >= getMinimumOpenSpace(array);
}
```

### Detail Pass
```typescript
function details(array: Array2D, passes: number) {
  for (let pass = 0; pass < passes; pass++) {
    const temp = cloneArray(array);
    
    for (let i = 1; i < array.length - 1; i++) {
      for (let j = 1; j < array[0].length - 1; j++) {
        if (temp[i][j] === -1) {
          // Check for isolated walls
          const neighbors = countNeighbors(temp, i, j, -1);
          if (neighbors <= 1) {
            array[i][j] = 0; // Remove isolated walls
          }
        }
      }
    }
  }
}
```

## Performance Optimization

### Chunking for Large Maps
```typescript
function generateLargeMap(params: Parameters) {
  const chunkSize = 64;
  const chunks: Array2D[] = [];
  
  // Generate chunks
  for (let cy = 0; cy < params.length; cy += chunkSize) {
    for (let cx = 0; cx < params.width; cx += chunkSize) {
      const chunk = generateChunk(cx, cy, chunkSize, params);
      chunks.push(chunk);
    }
  }
  
  // Stitch chunks together
  return stitchChunks(chunks, params);
}
```

### Parallel Processing
For web implementation:
```typescript
async function generateTerrainAsync(params: Parameters) {
  const workers = [];
  const workerCount = navigator.hardwareConcurrency || 4;
  
  // Split work among workers
  for (let i = 0; i < workerCount; i++) {
    const worker = new Worker('terrain-worker.js');
    workers.push(worker);
  }
  
  // Generate in parallel
  const results = await Promise.all(
    workers.map(w => generateWithWorker(w, params))
  );
  
  // Combine results
  return combineWorkerResults(results);
}
```

## Common Issues and Solutions

### Issue: Disconnected Caves
**Solution**: Use flood fill to identify largest area and fill others.

### Issue: Too Dense/Sparse
**Solution**: Adjust density parameters and run multiple iterations.

### Issue: Resource Imbalance
**Solution**: Count resources after generation and redistribute if needed.

### Issue: Performance on Large Maps
**Solution**: Use chunking, caching, and web workers.

## See Also
- [Cave Generation](cave-generation.md) - Detailed cellular automata
- [Resource Placement](resource-placement.md) - Resource distribution
- [Common Patterns](../common-patterns.md) - Implementation tips
- [Code Examples](../code-examples/generation/) - Generation examples