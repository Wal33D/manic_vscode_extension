# Map Rendering Guide

This guide explains how Manic Miners maps should be rendered to ensure consistent and correct display across all visualization tools.

## Table of Contents
1. [Coordinate System](#coordinate-system)
2. [Dimension Mapping](#dimension-mapping)
3. [Common Pitfalls](#common-pitfalls)
4. [Implementation Examples](#implementation-examples)
5. [Tile Color Reference](#tile-color-reference)
6. [Testing Different Map Sizes](#testing-different-map-sizes)

## Coordinate System

### Map Data Structure
Maps in Manic Miners use a 2D array structure where:
- **First index** = Row (Y coordinate)
- **Second index** = Column (X coordinate)

```typescript
// Correct array access pattern
const tileId = tiles[row][col];  // or tiles[y][x]
```

### Visual Representation
```
   Col 0   Col 1   Col 2   Col 3
Row 0 [38]    [38]    [38]    [38]
Row 1 [38]    [1]     [1]     [38]
Row 2 [38]    [1]     [1]     [38]
Row 3 [38]    [38]    [38]    [38]
```

## Dimension Mapping

### Critical Rule
- **Width** = Number of **columns** (`colcount`)
- **Height** = Number of **rows** (`rowcount`)

### Correct Implementation
```typescript
// From info section
const width = datFile.info.colcount;   // Map width
const height = datFile.info.rowcount;  // Map height

// Canvas size calculation
const canvasWidth = width * tileSize;   // cols * tileSize
const canvasHeight = height * tileSize; // rows * tileSize
```

### Incorrect Pattern to Avoid
```typescript
// ❌ WRONG - Never swap dimensions based on aspect ratio
if (height > width) {
    [height, width] = [width, height];  // This breaks non-square maps!
}
```

## Common Pitfalls

### 1. Dimension Swapping
**Problem**: Some implementations swap width/height for "portrait" orientations.
**Solution**: Never swap dimensions. A 40x69 map should always render as 40 rows by 69 columns.

### 2. Coordinate Confusion
**Problem**: Mixing up row/col with x/y coordinates.
**Solution**: Remember the conversion:
```typescript
// When iterating over tiles
for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
        const x = col * tileSize;  // X coordinate = column
        const y = row * tileSize;  // Y coordinate = row
        drawTile(x, y, tiles[row][col]);
    }
}
```

### 3. Camera Positioning (3D)
**Problem**: Using only one dimension for camera distance calculations.
**Solution**: Use the maximum dimension:
```typescript
const maxDim = Math.max(cols, rows);
camera.position.set(maxDim, maxDim * 0.8, maxDim * 1.5);
```

### 4. Array Conversion
**Problem**: Converting between 1D and 2D arrays incorrectly.
**Solution**: Use consistent row-major order:
```typescript
// 1D to 2D conversion
const tiles2D = [];
for (let i = 0; i < rows; i++) {
    tiles2D[i] = tiles1D.slice(i * cols, (i + 1) * cols);
}

// 2D to 1D conversion
const tiles1D = tiles2D.flat();
```

## Implementation Examples

### 2D Canvas Rendering (JavaScript)
```javascript
function renderMap(tiles, tileSize) {
    const rows = tiles.length;
    const cols = tiles[0].length;
    const width = cols * tileSize;
    const height = rows * tileSize;
    
    canvas.width = width;
    canvas.height = height;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * tileSize;
            const y = row * tileSize;
            const tileId = tiles[row][col];
            
            ctx.fillStyle = getTileColor(tileId);
            ctx.fillRect(x, y, tileSize, tileSize);
        }
    }
}
```

### 3D Terrain Rendering (Three.js)
```javascript
function createTerrain(tiles, heightMap) {
    const rows = tiles.length;
    const cols = tiles[0].length;
    
    // Create geometry with correct dimensions
    const geometry = new THREE.PlaneGeometry(
        cols,     // width = columns
        rows,     // height = rows
        cols - 1, // width segments
        rows - 1  // height segments
    );
    
    // Update vertices
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const vertexIndex = (row * cols + col) * 3;
            const height = heightMap[row][col];
            vertices[vertexIndex + 1] = height * heightScale;
        }
    }
}
```

### Python Implementation
```python
def render_map(wall_array, scale):
    rows = len(wall_array)
    cols = len(wall_array[0])
    width = cols * scale
    height = rows * scale
    
    # Create image
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    # Draw tiles
    for row in range(rows):
        for col in range(cols):
            x = col * scale
            y = row * scale
            tile_id = wall_array[row][col]
            color = get_tile_color(tile_id)
            draw.rectangle([x, y, x + scale, y + scale], fill=color)
    
    return img
```

## Tile Color Reference

### Standard Tile Colors
Based on the reference implementations, here are the standard colors:

```typescript
const TILE_COLORS = {
    // Basic terrain
    1:  { r: 124, g: 92,  b: 70  },  // Ground (Cavern Floor)
    6:  { r: 255, g: 50,  b: 0   },  // Lava
    11: { r: 30,  g: 84,  b: 197 },  // Water
    12: { r: 180, g: 180, b: 20  },  // Slimy Slug Hole
    14: { r: 220, g: 220, b: 220 },  // Building Power Path
    
    // Rock types
    26: { r: 169, g: 109, b: 82  },  // Dirt
    30: { r: 139, g: 104, b: 86  },  // Loose Rock
    34: { r: 77,  g: 53,  b: 50  },  // Hard Rock
    38: { r: 0,   g: 0,   b: 0   },  // Solid Rock
    
    // Resources
    42: { r: 206, g: 233, b: 104 },  // Energy Crystal Seam
    46: { r: 200, g: 85,  b: 30  },  // Ore Seam
    50: { r: 255, g: 255, b: 70  },  // Recharge Seam
    
    // Rubble
    63: { r: 46,  g: 23,  b: 95  },  // Landslide Rubble
    
    // Hidden tiles (add 100 to regular tile ID)
    101: { r: 124, g: 92, b: 70, alpha: 0.5 },  // Hidden Ground
    111: { r: 30,  g: 95, b: 220, alpha: 0.5 }, // Hidden Water
    // etc...
};
```

### Biome Border Colors
```typescript
const BIOME_COLORS = {
    rock: { r: 120, g: 115, b: 110, alpha: 0.2 },
    lava: { r: 255, g: 50,  b: 0,   alpha: 0.2 },
    ice:  { r: 150, g: 200, b: 240, alpha: 0.2 }
};
```

## Testing Different Map Sizes

### Test Cases
Always test your rendering with these map configurations:

1. **Square Map** (40x40)
   - Width = Height
   - Should appear as a perfect square

2. **Wide Map** (69x40)
   - Width > Height
   - Should appear wider than tall
   - Common in actual game maps

3. **Tall Map** (40x69)
   - Height > Width
   - Should appear taller than wide
   - Less common but must work correctly

4. **Small Map** (8x8)
   - Minimum practical size
   - Good for testing edge cases

5. **Large Map** (100x100)
   - Tests performance
   - Ensures scaling works properly

### Visual Test
```
40x40 Square:        69x40 Wide:         40x69 Tall:
+--------+           +------------+      +-----+
|        |           |            |      |     |
|        |           |            |      |     |
|        |           +------------+      |     |
+--------+                                |     |
                                         |     |
                                         +-----+
```

### Sample Test Code
```typescript
function testMapRendering() {
    const testMaps = [
        { name: "Square", rows: 40, cols: 40 },
        { name: "Wide", rows: 40, cols: 69 },
        { name: "Tall", rows: 69, cols: 40 },
        { name: "Small", rows: 8, cols: 8 },
        { name: "Large", rows: 100, cols: 100 }
    ];
    
    testMaps.forEach(({ name, rows, cols }) => {
        console.log(`Testing ${name} map (${rows}x${cols})`);
        const tiles = generateTestTiles(rows, cols);
        
        // Verify dimensions
        assert(tiles.length === rows, "Row count mismatch");
        assert(tiles[0].length === cols, "Column count mismatch");
        
        // Render and verify aspect ratio
        const rendered = renderMap(tiles);
        const aspectRatio = rendered.width / rendered.height;
        const expectedRatio = cols / rows;
        assert(Math.abs(aspectRatio - expectedRatio) < 0.01, "Aspect ratio incorrect");
    });
}
```

## Summary

1. **Always** treat the first array index as row (Y) and second as column (X)
2. **Never** swap width and height based on aspect ratio
3. **Map** width to columns and height to rows consistently
4. **Test** with various map sizes, especially non-square ones
5. **Use** the standard color palette for consistency across tools

Following these guidelines will ensure your map rendering is correct and consistent with the game engine and other tools in the ecosystem.