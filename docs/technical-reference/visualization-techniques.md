# Map Visualization Techniques

This document describes visualization strategies for rendering Manic Miners maps as images, extracted from the map-visualizer reference implementation.

## Overview

Map visualization transforms grid-based map data into visual representations using:
- Canvas-based rendering
- Color mapping for tile types
- Multi-layer composition
- Performance optimization techniques

## Core Rendering Pipeline

### 1. Canvas Setup

```typescript
import { createCanvas, CanvasRenderingContext2D } from 'canvas';

function setupCanvas(width: number, height: number, scale: number, border: number) {
  const canvasWidth = (width + border * 2) * scale;
  const canvasHeight = (height + border * 2) * scale;
  
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  
  return { canvas, ctx, canvasWidth, canvasHeight };
}
```

### 2. Coordinate Transformation

```typescript
// Handle row/col orientation differences
function normalizeMapDimensions(wallArray: number[][]) {
  let height = wallArray.length;
  let width = wallArray[0].length;
  
  // Switch dimensions if height > width for better display
  if (height > width) {
    [height, width] = [width, height];
    // Transpose the array
    wallArray = transpose(wallArray);
  }
  
  return { wallArray, width, height };
}

function transpose<T>(array: T[][]): T[][] {
  return array[0].map((_, colIndex) => 
    array.map(row => row[colIndex])
  );
}
```

### 3. Tile Rendering

```typescript
async function renderMapTiles(
  ctx: CanvasRenderingContext2D,
  wallArray: number[][],
  scale: number,
  borderTiles: number
) {
  for (let y = 0; y < wallArray.length; y++) {
    for (let x = 0; x < wallArray[y].length; x++) {
      const tileId = wallArray[y][x];
      const color = getTileColor(tileId);
      
      // Calculate pixel position with border offset
      const pixelX = (x + borderTiles) * scale;
      const pixelY = (y + borderTiles) * scale;
      
      // Draw tile
      ctx.fillStyle = colorToCSS(color);
      ctx.fillRect(pixelX, pixelY, scale, scale);
      
      // Optional: Add tile borders
      if (SHOW_GRID) {
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.strokeRect(pixelX, pixelY, scale, scale);
      }
    }
  }
}
```

## Color Mapping System

### Tile Color Definitions

```typescript
interface Color {
  r: number;  // Red (0-255)
  g: number;  // Green (0-255)
  b: number;  // Blue (0-255)
  alpha?: number;  // Opacity (0-1)
}

const tileColors: Map<number, Color> = new Map([
  // Basic terrain
  [1, { r: 124, g: 92, b: 70 }],        // Ground - brown
  [26, { r: 169, g: 109, b: 82 }],      // Dirt - lighter brown
  [30, { r: 139, g: 104, b: 86 }],      // Loose Rock - gray-brown
  [34, { r: 77, g: 53, b: 50 }],        // Hard Rock - dark gray
  [38, { r: 0, g: 0, b: 0, alpha: 0 }], // Solid Rock - transparent
  
  // Resources
  [42, { r: 206, g: 233, b: 104 }],     // Crystal Seam - bright green
  [46, { r: 200, g: 85, b: 30 }],       // Ore Seam - orange
  [50, { r: 255, g: 255, b: 70 }],      // Recharge Seam - yellow
  
  // Hazards
  [6, { r: 255, g: 50, b: 0 }],         // Lava - bright red-orange
  [11, { r: 30, g: 84, b: 197 }],       // Water - blue
  [12, { r: 180, g: 180, b: 20 }],      // Slug hole - yellow-green
  
  // Special
  [14, { r: 220, g: 220, b: 220 }],     // Power path - light gray
  [60, { r: 46, g: 23, b: 95, alpha: 0.1 }], // Rubble - purple (various alphas)
]);
```

### Color Conversion

```typescript
function colorToCSS(color: Color): string {
  if (color.alpha !== undefined) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.alpha})`;
  }
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function hexToColor(hex: string): Color {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}
```

### Biome-Specific Styling

```typescript
function getBiomeColor(biome: string): string {
  const biomeColors = {
    rock: { r: 120, g: 115, b: 110, alpha: 0.2 },
    lava: { r: 255, g: 50, b: 0, alpha: 0.2 },
    ice: { r: 150, g: 200, b: 240, alpha: 0.2 }
  };
  
  const color = biomeColors[biome] || biomeColors.rock;
  return colorToCSS(color);
}

// Apply biome tinting
function applyBiomeTint(ctx: CanvasRenderingContext2D, biome: string) {
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = getBiomeColor(biome);
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.globalCompositeOperation = 'source-over';
}
```

## Advanced Rendering Techniques

### 1. Multi-Layer Composition

```typescript
class LayeredRenderer {
  private layers: Map<string, HTMLCanvasElement> = new Map();
  
  addLayer(name: string, renderFn: (ctx: CanvasRenderingContext2D) => void) {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');
    
    renderFn(ctx);
    this.layers.set(name, canvas);
  }
  
  composite(): Buffer {
    const final = createCanvas(this.width, this.height);
    const ctx = final.getContext('2d');
    
    // Draw layers in order
    const layerOrder = ['terrain', 'resources', 'hazards', 'grid', 'overlay'];
    
    for (const layerName of layerOrder) {
      const layer = this.layers.get(layerName);
      if (layer) {
        ctx.drawImage(layer, 0, 0);
      }
    }
    
    return final.toBuffer('image/png');
  }
}
```

### 2. Height-Based Shading

```typescript
function applyHeightShading(
  ctx: CanvasRenderingContext2D,
  heightArray: number[][],
  scale: number,
  intensity: number = 0.3
) {
  for (let y = 0; y < heightArray.length; y++) {
    for (let x = 0; x < heightArray[y].length; x++) {
      const height = heightArray[y][x];
      const normalizedHeight = height / 15; // Heights are 0-15
      
      // Calculate shading
      const shade = 1 - (normalizedHeight * intensity);
      
      // Apply darkening overlay
      ctx.fillStyle = `rgba(0, 0, 0, ${1 - shade})`;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
}
```

### 3. Resource Overlay

```typescript
function renderResourceOverlay(
  ctx: CanvasRenderingContext2D,
  resources: ResourceData,
  scale: number,
  borderOffset: number
) {
  // Crystal icons
  for (const crystal of resources.crystals) {
    drawCrystalIcon(ctx, 
      (crystal.x + borderOffset) * scale,
      (crystal.y + borderOffset) * scale,
      scale * 0.6
    );
  }
  
  // Ore deposits
  for (const ore of resources.ore) {
    drawOreIcon(ctx,
      (ore.x + borderOffset) * scale,
      (ore.y + borderOffset) * scale,
      scale * 0.5,
      ore.amount
    );
  }
}

function drawCrystalIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x + size/2, y + size/2);
  
  // Draw crystal shape
  ctx.beginPath();
  ctx.moveTo(0, -size/2);
  ctx.lineTo(size/3, 0);
  ctx.lineTo(0, size/2);
  ctx.lineTo(-size/3, 0);
  ctx.closePath();
  
  // Gradient fill
  const gradient = ctx.createLinearGradient(-size/2, 0, size/2, 0);
  gradient.addColorStop(0, '#90EE90');
  gradient.addColorStop(0.5, '#FFFFFF');
  gradient.addColorStop(1, '#228B22');
  
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = '#006400';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.restore();
}
```

### 4. Thumbnail Generation

```typescript
async function generateThumbnail(
  mapData: MapData,
  targetWidth: number,
  targetHeight: number
): Promise<Buffer> {
  // Calculate scale to fit
  const scaleX = targetWidth / mapData.width;
  const scaleY = targetHeight / mapData.height;
  const scale = Math.min(scaleX, scaleY);
  
  // Create small canvas
  const width = Math.floor(mapData.width * scale);
  const height = Math.floor(mapData.height * scale);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Render simplified version
  for (let y = 0; y < mapData.height; y++) {
    for (let x = 0; x < mapData.width; x++) {
      const tileId = mapData.tiles[y][x];
      const color = getSimplifiedColor(tileId);
      
      ctx.fillStyle = colorToCSS(color);
      ctx.fillRect(
        Math.floor(x * scale),
        Math.floor(y * scale),
        Math.ceil(scale),
        Math.ceil(scale)
      );
    }
  }
  
  // Use sharp for final optimization
  return sharp(canvas.toBuffer())
    .resize(targetWidth, targetHeight, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({ quality: 85, compressionLevel: 9 })
    .toBuffer();
}
```

## Performance Optimization

### 1. Tile Batching

```typescript
function renderTilesBatched(
  ctx: CanvasRenderingContext2D,
  tiles: number[][],
  scale: number
) {
  // Group tiles by color
  const tileGroups = new Map<string, Array<{x: number, y: number}>>();
  
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      const color = colorToCSS(getTileColor(tiles[y][x]));
      
      if (!tileGroups.has(color)) {
        tileGroups.set(color, []);
      }
      
      tileGroups.get(color)!.push({ x, y });
    }
  }
  
  // Render each color group in one pass
  for (const [color, positions] of tileGroups) {
    ctx.fillStyle = color;
    
    for (const { x, y } of positions) {
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
}
```

### 2. Caching Strategies

```typescript
class TileCache {
  private cache = new Map<string, ImageData>();
  
  getTile(tileId: number, scale: number): ImageData {
    const key = `${tileId}-${scale}`;
    
    if (!this.cache.has(key)) {
      const canvas = createCanvas(scale, scale);
      const ctx = canvas.getContext('2d');
      
      // Render tile
      const color = getTileColor(tileId);
      ctx.fillStyle = colorToCSS(color);
      ctx.fillRect(0, 0, scale, scale);
      
      // Cache as ImageData
      this.cache.set(key, ctx.getImageData(0, 0, scale, scale));
    }
    
    return this.cache.get(key)!;
  }
  
  clear() {
    this.cache.clear();
  }
}
```

### 3. Progressive Rendering

```typescript
async function renderProgressive(
  ctx: CanvasRenderingContext2D,
  tiles: number[][],
  scale: number,
  onProgress?: (percent: number) => void
) {
  const totalTiles = tiles.length * tiles[0].length;
  let rendered = 0;
  const chunkSize = 1000;
  
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      renderTile(ctx, tiles[y][x], x, y, scale);
      rendered++;
      
      // Yield periodically
      if (rendered % chunkSize === 0) {
        if (onProgress) {
          onProgress((rendered / totalTiles) * 100);
        }
        
        // Allow other operations
        await new Promise(resolve => setImmediate(resolve));
      }
    }
  }
}
```

## Image Processing Pipeline

### 1. Complete Generation Flow

```typescript
export async function generateMapImage(
  mapData: MapData,
  options: RenderOptions = {}
): Promise<Buffer> {
  // Set defaults
  const opts = {
    scale: 20,
    border: 2,
    showGrid: false,
    showResources: true,
    showHeightShading: true,
    outputFormat: 'png',
    ...options
  };
  
  // Normalize dimensions
  const { wallArray, width, height } = normalizeMapDimensions(mapData.tiles);
  
  // Setup canvas
  const { canvas, ctx } = setupCanvas(width, height, opts.scale, opts.border);
  
  // Draw border/background
  ctx.fillStyle = getBiomeColor(mapData.biome);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Render terrain
  await renderMapTiles(ctx, wallArray, opts.scale, opts.border);
  
  // Apply effects
  if (opts.showHeightShading && mapData.height) {
    applyHeightShading(ctx, mapData.height, opts.scale);
  }
  
  // Overlay resources
  if (opts.showResources && mapData.resources) {
    renderResourceOverlay(ctx, mapData.resources, opts.scale, opts.border);
  }
  
  // Grid overlay
  if (opts.showGrid) {
    drawGrid(ctx, width, height, opts.scale, opts.border);
  }
  
  // Convert to buffer
  return finalizeImage(canvas, opts.outputFormat);
}
```

### 2. Post-Processing

```typescript
async function finalizeImage(
  canvas: Canvas,
  format: 'png' | 'jpeg' | 'webp'
): Promise<Buffer> {
  const buffer = canvas.toBuffer(`image/${format}`);
  
  // Optimize with sharp
  let sharpInstance = sharp(buffer);
  
  switch (format) {
    case 'png':
      sharpInstance = sharpInstance.png({
        compressionLevel: 9,
        adaptiveFiltering: true
      });
      break;
      
    case 'jpeg':
      sharpInstance = sharpInstance.jpeg({
        quality: 90,
        progressive: true
      });
      break;
      
    case 'webp':
      sharpInstance = sharpInstance.webp({
        quality: 85,
        lossless: false
      });
      break;
  }
  
  return sharpInstance.toBuffer();
}
```

## Visualization Features

### 1. Heat Maps

```typescript
function generateHeatMap(
  data: number[][],
  colorScale: (value: number) => Color
): ImageData {
  // Find min/max for normalization
  let min = Infinity, max = -Infinity;
  
  for (const row of data) {
    for (const value of row) {
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  
  // Render heat map
  const canvas = createCanvas(data[0].length, data.length);
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  
  for (let y = 0; y < data.length; y++) {
    for (let x = 0; x < data[y].length; x++) {
      const normalized = (data[y][x] - min) / (max - min);
      const color = colorScale(normalized);
      
      const index = (y * canvas.width + x) * 4;
      imageData.data[index] = color.r;
      imageData.data[index + 1] = color.g;
      imageData.data[index + 2] = color.b;
      imageData.data[index + 3] = 255;
    }
  }
  
  return imageData;
}

// Predefined color scales
const heatScales = {
  thermal: (value: number) => ({
    r: Math.floor(255 * value),
    g: Math.floor(255 * (1 - Math.abs(value - 0.5) * 2)),
    b: Math.floor(255 * (1 - value))
  }),
  
  grayscale: (value: number) => {
    const v = Math.floor(255 * value);
    return { r: v, g: v, b: v };
  }
};
```

### 2. Path Visualization

```typescript
function drawPath(
  ctx: CanvasRenderingContext2D,
  path: Array<{x: number, y: number}>,
  scale: number,
  style: PathStyle = {}
) {
  const opts = {
    color: '#FF0000',
    width: 3,
    dash: [],
    arrow: true,
    ...style
  };
  
  ctx.save();
  ctx.strokeStyle = opts.color;
  ctx.lineWidth = opts.width;
  ctx.setLineDash(opts.dash);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Draw path
  ctx.beginPath();
  for (let i = 0; i < path.length; i++) {
    const x = (path[i].x + 0.5) * scale;
    const y = (path[i].y + 0.5) * scale;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  
  // Draw arrow at end
  if (opts.arrow && path.length >= 2) {
    const last = path[path.length - 1];
    const prev = path[path.length - 2];
    
    const angle = Math.atan2(
      last.y - prev.y,
      last.x - prev.x
    );
    
    drawArrow(ctx, 
      (last.x + 0.5) * scale,
      (last.y + 0.5) * scale,
      angle,
      scale * 0.3
    );
  }
  
  ctx.restore();
}
```

### 3. Annotation System

```typescript
class MapAnnotator {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private scale: number
  ) {}
  
  addLabel(x: number, y: number, text: string, style: LabelStyle = {}) {
    const opts = {
      font: `${this.scale * 0.4}px Arial`,
      color: '#FFFFFF',
      background: 'rgba(0, 0, 0, 0.7)',
      padding: this.scale * 0.1,
      ...style
    };
    
    this.ctx.save();
    this.ctx.font = opts.font;
    
    // Measure text
    const metrics = this.ctx.measureText(text);
    const width = metrics.width + opts.padding * 2;
    const height = this.scale * 0.5 + opts.padding * 2;
    
    // Draw background
    this.ctx.fillStyle = opts.background;
    this.ctx.fillRect(
      x * this.scale - opts.padding,
      y * this.scale - opts.padding,
      width,
      height
    );
    
    // Draw text
    this.ctx.fillStyle = opts.color;
    this.ctx.fillText(
      text,
      x * this.scale,
      y * this.scale + this.scale * 0.4
    );
    
    this.ctx.restore();
  }
  
  addMarker(x: number, y: number, type: MarkerType) {
    const markers = {
      start: '🏁',
      objective: '⭐',
      danger: '⚠️',
      resource: '💎'
    };
    
    this.ctx.font = `${this.scale * 0.6}px Arial`;
    this.ctx.fillText(
      markers[type],
      x * this.scale,
      y * this.scale + this.scale * 0.5
    );
  }
}
```

## Error Handling and Validation

### Input Validation

```typescript
function validateMapData(mapData: any): mapData is MapData {
  // Check required fields
  if (!mapData.tiles || !Array.isArray(mapData.tiles)) {
    throw new Error('Invalid map data: missing tiles array');
  }
  
  if (!mapData.width || !mapData.height) {
    throw new Error('Invalid map data: missing dimensions');
  }
  
  // Validate tile array dimensions
  if (mapData.tiles.length !== mapData.height) {
    throw new Error('Tile array height mismatch');
  }
  
  for (let i = 0; i < mapData.tiles.length; i++) {
    if (mapData.tiles[i].length !== mapData.width) {
      throw new Error(`Row ${i} width mismatch`);
    }
  }
  
  return true;
}
```

### Graceful Degradation

```typescript
function getTileColorSafe(tileId: number): Color {
  // Known tile color
  if (tileColors.has(tileId)) {
    return tileColors.get(tileId)!;
  }
  
  // Fallback patterns
  if (tileId >= 100) {
    // Undiscovered variant - use base tile
    const baseTile = tileId - 100;
    if (tileColors.has(baseTile)) {
      const color = { ...tileColors.get(baseTile)! };
      color.alpha = 0.5; // Make semi-transparent
      return color;
    }
  }
  
  // Unknown tile - use distinctive color
  console.warn(`Unknown tile ID: ${tileId}`);
  return {
    r: 255,
    g: 0,
    b: 255, // Magenta for unknown
    alpha: 0.8
  };
}
```

## Testing Visualization

### Visual Regression Testing

```typescript
import pixelmatch from 'pixelmatch';

async function compareImages(
  actual: Buffer,
  expected: Buffer,
  threshold: number = 0.1
): Promise<{ match: boolean; diff?: Buffer }> {
  const img1 = await sharp(actual).raw().toBuffer();
  const img2 = await sharp(expected).raw().toBuffer();
  
  const { width, height } = await sharp(actual).metadata();
  const diff = Buffer.alloc(width * height * 4);
  
  const mismatchedPixels = pixelmatch(
    img1,
    img2,
    diff,
    width,
    height,
    { threshold }
  );
  
  const match = mismatchedPixels === 0;
  
  if (!match) {
    // Generate diff image
    const diffImage = await sharp(diff, {
      raw: { width, height, channels: 4 }
    }).png().toBuffer();
    
    return { match, diff: diffImage };
  }
  
  return { match };
}
```

## Best Practices

### 1. Memory Management
```typescript
// Use object pools for repeated operations
const canvasPool = new ObjectPool(() => createCanvas(1, 1));

// Clear references when done
function cleanup(ctx: CanvasRenderingContext2D) {
  ctx.canvas.width = 0;
  ctx.canvas.height = 0;
}
```

### 2. Color Consistency
```typescript
// Centralize color definitions
const TILE_COLORS = Object.freeze({
  GROUND: { r: 124, g: 92, b: 70 },
  LAVA: { r: 255, g: 50, b: 0 },
  // ...
});

// Use color constants
function getTileColor(tileId: number): Color {
  switch(tileId) {
    case 1: return TILE_COLORS.GROUND;
    case 6: return TILE_COLORS.LAVA;
    // ...
  }
}
```

### 3. Scalable Rendering
```typescript
// Support different quality levels
enum RenderQuality {
  LOW = 4,     // 4px per tile
  MEDIUM = 16, // 16px per tile  
  HIGH = 32,   // 32px per tile
  ULTRA = 64   // 64px per tile
}

// Adapt based on map size
function getOptimalScale(mapSize: number): number {
  if (mapSize > 100) return RenderQuality.LOW;
  if (mapSize > 50) return RenderQuality.MEDIUM;
  return RenderQuality.HIGH;
}
```

## See Also

- [Color Mapping Reference](../game-reference/format/tile-reference.md)
- [Canvas API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [Performance Guide](performance.md)