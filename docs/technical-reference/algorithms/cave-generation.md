# Cave Generation Algorithm

## Overview
The cave generation system uses cellular automata to create natural-looking cave structures in Manic Miners maps.

## Algorithm Details

### 1. Cellular Automata (4-5 Rule)
```typescript
// Initialize with random noise
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    grid[y][x] = Math.random() < 0.45 ? WALL : FLOOR;
  }
}

// Apply cellular automata iterations
for (let i = 0; i < iterations; i++) {
  const newGrid = grid.map(row => [...row]);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const neighbors = countWallNeighbors(grid, x, y);
      
      // 4-5 rule: 4 or fewer neighbors = floor, 5 or more = wall
      newGrid[y][x] = neighbors >= 5 ? WALL : FLOOR;
    }
  }
  
  grid = newGrid;
}
```

### 2. Connectivity Guarantee
After cave generation, ensure all floor areas are connected:

```typescript
function ensureConnectivity(grid: number[][]): void {
  const regions = findDisconnectedRegions(grid);
  
  // Connect all regions to the largest one
  const largestRegion = regions.sort((a, b) => b.size - a.size)[0];
  
  for (const region of regions.slice(1)) {
    connectRegions(grid, largestRegion, region);
  }
}
```

### 3. Smoothing Pass
Apply smoothing to create more natural cave edges:

```typescript
function smoothCaves(grid: number[][]): void {
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const neighbors = countWallNeighbors(grid, x, y);
      
      // Remove isolated walls (pillars)
      if (grid[y][x] === WALL && neighbors <= 2) {
        grid[y][x] = FLOOR;
      }
      
      // Fill small gaps
      if (grid[y][x] === FLOOR && neighbors >= 7) {
        grid[y][x] = WALL;
      }
    }
  }
}
```

## Parameters

### Cave Complexity (0.0 - 1.0)
- **Low (0.1-0.3)**: Large open caverns
- **Medium (0.4-0.6)**: Balanced mix of passages and rooms
- **High (0.7-1.0)**: Maze-like with narrow passages

### Iterations
- **2-3**: Rough, jagged caves
- **4-5**: Smooth, natural caves (recommended)
- **6+**: Very smooth, may lose detail

### Initial Density
- **0.40**: More open space
- **0.45**: Balanced (default)
- **0.50**: More solid rock

## Common Patterns

### 1. Central Cavern
```typescript
// Create guaranteed open area in center
const centerX = width / 2;
const centerY = height / 2;
const radius = Math.min(width, height) * 0.2;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    if (dist < radius) {
      grid[y][x] = FLOOR;
    }
  }
}
```

### 2. Edge Buffer
```typescript
// Ensure solid walls at map edges
for (let y = 0; y < height; y++) {
  grid[y][0] = WALL;
  grid[y][width - 1] = WALL;
}
for (let x = 0; x < width; x++) {
  grid[0][x] = WALL;
  grid[height - 1][x] = WALL;
}
```

### 3. Minimum Passage Width
```typescript
// Ensure passages are at least 2 tiles wide
function widenPassages(grid: number[][]): void {
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x] === FLOOR) {
        // Check for narrow passages
        const horizontal = grid[y][x-1] === WALL && grid[y][x+1] === WALL;
        const vertical = grid[y-1][x] === WALL && grid[y+1][x] === WALL;
        
        if (horizontal || vertical) {
          // Widen the passage
          if (horizontal) {
            grid[y-1][x] = FLOOR;
            grid[y+1][x] = FLOOR;
          } else {
            grid[y][x-1] = FLOOR;
            grid[y][x+1] = FLOOR;
          }
        }
      }
    }
  }
}
```

## Performance Considerations

### Time Complexity
- Basic generation: O(width × height × iterations)
- Connectivity check: O(width × height)
- Path finding for connections: O(width × height × log(width × height))

### Memory Usage
- Grid storage: width × height × 4 bytes
- Working copies: 2× grid storage during generation
- Region tracking: Additional width × height × 4 bytes

### Optimization Strategies
1. Use typed arrays (Uint8Array) for grids
2. Implement flood fill iteratively (not recursively)
3. Cache neighbor counts during iterations
4. Use bit operations for tile flags

## Integration with Map Generation

### 1. Convert to Tile IDs
```typescript
function cavesToTiles(caveGrid: number[][]): number[][] {
  return caveGrid.map(row => 
    row.map(cell => {
      if (cell === WALL) {
        // Choose wall type based on depth/location
        return selectWallTile(x, y);
      } else {
        return GROUND_TILE; // Tile ID 1
      }
    })
  );
}
```

### 2. Apply to Height Map
```typescript
function applyHeightVariation(tiles: number[][], heights: number[][]): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (tiles[y][x] === GROUND_TILE) {
        // Add slight height variation to floors
        heights[y][x] = Math.floor(Math.random() * 3);
      } else {
        // Walls get more height
        heights[y][x] = 5 + Math.floor(Math.random() * 5);
      }
    }
  }
}
```

## See Also
- [Terrain Generation](terrain-generation.md)
- [Resource Placement](resource-placement.md)
- [Common Patterns](../common-patterns.md)