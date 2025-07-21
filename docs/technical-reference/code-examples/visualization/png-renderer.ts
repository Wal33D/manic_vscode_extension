/**
 * PNG Renderer Example
 * 
 * This example demonstrates how to render Manic Miners maps as PNG images
 * using the canvas library with various visualization options.
 */

import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs/promises';

// Rendering options
export interface RenderOptions {
  scale?: number;              // Pixels per tile
  borderWidth?: number;        // Border tiles around map
  showGrid?: boolean;          // Draw grid lines
  showCoordinates?: boolean;   // Show coordinate labels
  showResources?: boolean;     // Highlight resources
  showHeight?: boolean;        // Apply height shading
  backgroundColor?: string;    // Background color
  gridColor?: string;          // Grid line color
  theme?: 'classic' | 'modern' | 'blueprint' | 'thermal';
}

// Map data interface
export interface MapData {
  tiles: number[][];
  height?: number[][];
  resources?: {
    crystals: Array<{x: number, y: number}>;
    ore: Array<{x: number, y: number, amount: number}>;
  };
  info: {
    rowcount: number;
    colcount: number;
    biome: string;
  };
}

// Color themes
const COLOR_THEMES = {
  classic: {
    tiles: new Map([
      [1, '#7C5C46'],    // Ground - brown
      [6, '#FF3200'],    // Lava - bright red
      [11, '#1E54C5'],   // Water - blue
      [12, '#B4B414'],   // Slug hole - yellow
      [14, '#DCDCDC'],   // Power path - light gray
      [26, '#A96D52'],   // Dirt - lighter brown
      [30, '#8B6856'],   // Loose rock - gray-brown
      [34, '#4D3532'],   // Hard rock - dark gray
      [38, '#000000'],   // Solid rock - black
      [42, '#CEE968'],   // Crystal seam - bright green
      [46, '#C8551E'],   // Ore seam - orange
      [50, '#FFFF46'],   // Recharge seam - yellow
    ]),
    background: '#2C2416',
    grid: 'rgba(255, 255, 255, 0.1)'
  },
  modern: {
    tiles: new Map([
      [1, '#E8DCC6'],    // Ground - light tan
      [6, '#FF6B6B'],    // Lava - coral red
      [11, '#4ECDC4'],   // Water - teal
      [12, '#95E1D3'],   // Slug hole - mint
      [14, '#F8F9FA'],   // Power path - white
      [26, '#DDA15E'],   // Dirt - sand
      [30, '#BC6C25'],   // Loose rock - brown
      [34, '#283618'],   // Hard rock - dark green
      [38, '#212529'],   // Solid rock - near black
      [42, '#52B788'],   // Crystal seam - emerald
      [46, '#F4A261'],   // Ore seam - sandy
      [50, '#FFE66D'],   // Recharge seam - light yellow
    ]),
    background: '#F8F9FA',
    grid: 'rgba(0, 0, 0, 0.05)'
  },
  blueprint: {
    tiles: new Map([
      [1, '#1A3A52'],    // Ground - dark blue
      [6, '#FF0000'],    // Lava - red
      [11, '#0080FF'],   // Water - bright blue
      [12, '#FFFF00'],   // Slug hole - yellow
      [14, '#FFFFFF'],   // Power path - white
      [26, '#2C5985'],   // Dirt - medium blue
      [30, '#1F4788'],   // Loose rock - blue
      [34, '#0D2137'],   // Hard rock - very dark blue
      [38, '#000033'],   // Solid rock - near black blue
      [42, '#00FF00'],   // Crystal seam - green
      [46, '#FFA500'],   // Ore seam - orange
      [50, '#FFFF80'],   // Recharge seam - light yellow
    ]),
    background: '#001122',
    grid: 'rgba(255, 255, 255, 0.2)'
  },
  thermal: {
    tiles: new Map([
      [1, '#000080'],    // Ground - cold blue
      [6, '#FFFF00'],    // Lava - hot yellow
      [11, '#0000FF'],   // Water - blue
      [12, '#00FF00'],   // Slug hole - green
      [14, '#800080'],   // Power path - purple
      [26, '#000060'],   // Dirt - dark blue
      [30, '#004040'],   // Loose rock - teal
      [34, '#002020'],   // Hard rock - very dark
      [38, '#000000'],   // Solid rock - black
      [42, '#FF00FF'],   // Crystal seam - magenta
      [46, '#FF8000'],   // Ore seam - orange
      [50, '#FFFF80'],   // Recharge seam - light yellow
    ]),
    background: '#000020',
    grid: 'rgba(255, 255, 255, 0.1)'
  }
};

/**
 * Render a map to PNG
 */
export async function renderMapToPNG(
  mapData: MapData,
  outputPath: string,
  options: RenderOptions = {}
): Promise<void> {
  const opts = {
    scale: 16,
    borderWidth: 2,
    showGrid: false,
    showCoordinates: false,
    showResources: true,
    showHeight: true,
    backgroundColor: '#2C2416',
    gridColor: 'rgba(255, 255, 255, 0.1)',
    theme: 'classic' as const,
    ...options
  };
  
  // Get color theme
  const theme = COLOR_THEMES[opts.theme];
  
  // Calculate canvas dimensions
  const mapWidth = mapData.info.colcount;
  const mapHeight = mapData.info.rowcount;
  const canvasWidth = (mapWidth + opts.borderWidth * 2) * opts.scale;
  const canvasHeight = (mapHeight + opts.borderWidth * 2) * opts.scale;
  
  // Create canvas
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // Draw border
  if (opts.borderWidth > 0) {
    drawBorder(ctx, opts.borderWidth, opts.scale, mapWidth, mapHeight, theme);
  }
  
  // Draw tiles
  drawTiles(ctx, mapData.tiles, opts.scale, opts.borderWidth, theme);
  
  // Apply height shading
  if (opts.showHeight && mapData.height) {
    applyHeightShading(ctx, mapData.height, opts.scale, opts.borderWidth);
  }
  
  // Draw resources overlay
  if (opts.showResources && mapData.resources) {
    drawResources(ctx, mapData.resources, opts.scale, opts.borderWidth);
  }
  
  // Draw grid
  if (opts.showGrid) {
    drawGrid(ctx, mapWidth, mapHeight, opts.scale, opts.borderWidth, theme.grid);
  }
  
  // Draw coordinates
  if (opts.showCoordinates) {
    drawCoordinates(ctx, mapWidth, mapHeight, opts.scale, opts.borderWidth);
  }
  
  // Add biome overlay effect
  applyBiomeEffect(ctx, mapData.info.biome, canvasWidth, canvasHeight);
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(outputPath, buffer);
}

/**
 * Draw map border
 */
function drawBorder(
  ctx: CanvasRenderingContext2D,
  borderWidth: number,
  scale: number,
  mapWidth: number,
  mapHeight: number,
  theme: any
) {
  ctx.fillStyle = theme.tiles.get(38) || '#000000'; // Solid rock color
  
  // Top border
  ctx.fillRect(0, 0, (mapWidth + borderWidth * 2) * scale, borderWidth * scale);
  
  // Bottom border
  ctx.fillRect(
    0,
    (mapHeight + borderWidth) * scale,
    (mapWidth + borderWidth * 2) * scale,
    borderWidth * scale
  );
  
  // Left border
  ctx.fillRect(0, 0, borderWidth * scale, (mapHeight + borderWidth * 2) * scale);
  
  // Right border
  ctx.fillRect(
    (mapWidth + borderWidth) * scale,
    0,
    borderWidth * scale,
    (mapHeight + borderWidth * 2) * scale
  );
}

/**
 * Draw map tiles
 */
function drawTiles(
  ctx: CanvasRenderingContext2D,
  tiles: number[][],
  scale: number,
  borderOffset: number,
  theme: any
) {
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      const tileId = tiles[y][x];
      const color = getTileColor(tileId, theme);
      
      ctx.fillStyle = color;
      ctx.fillRect(
        (x + borderOffset) * scale,
        (y + borderOffset) * scale,
        scale,
        scale
      );
    }
  }
}

/**
 * Get color for a tile ID
 */
function getTileColor(tileId: number, theme: any): string {
  // Check if color is defined in theme
  if (theme.tiles.has(tileId)) {
    return theme.tiles.get(tileId);
  }
  
  // Handle undiscovered tiles (100+ versions)
  if (tileId > 100) {
    const baseTile = tileId - 100;
    if (theme.tiles.has(baseTile)) {
      // Make undiscovered tiles darker
      const baseColor = theme.tiles.get(baseTile);
      return darkenColor(baseColor, 0.5);
    }
  }
  
  // Fallback color
  return '#FF00FF'; // Magenta for unknown tiles
}

/**
 * Apply height-based shading
 */
function applyHeightShading(
  ctx: CanvasRenderingContext2D,
  height: number[][],
  scale: number,
  borderOffset: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  
  for (let y = 0; y < height.length; y++) {
    for (let x = 0; x < height[y].length; x++) {
      const h = height[y][x];
      const shade = 1 - (h / 15) * 0.3; // Heights are 0-15
      
      ctx.fillStyle = `rgba(0, 0, 0, ${1 - shade})`;
      ctx.fillRect(
        (x + borderOffset) * scale,
        (y + borderOffset) * scale,
        scale,
        scale
      );
    }
  }
  
  ctx.restore();
}

/**
 * Draw resource overlays
 */
function drawResources(
  ctx: CanvasRenderingContext2D,
  resources: MapData['resources'],
  scale: number,
  borderOffset: number
) {
  ctx.save();
  
  // Draw crystals
  ctx.fillStyle = 'rgba(206, 233, 104, 0.6)'; // Semi-transparent green
  ctx.strokeStyle = '#90EE90';
  ctx.lineWidth = 2;
  
  for (const crystal of resources!.crystals) {
    const x = (crystal.x + borderOffset) * scale;
    const y = (crystal.y + borderOffset) * scale;
    
    // Draw crystal icon
    ctx.beginPath();
    ctx.moveTo(x + scale * 0.5, y + scale * 0.2);
    ctx.lineTo(x + scale * 0.7, y + scale * 0.5);
    ctx.lineTo(x + scale * 0.5, y + scale * 0.8);
    ctx.lineTo(x + scale * 0.3, y + scale * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  
  // Draw ore
  ctx.fillStyle = 'rgba(200, 85, 30, 0.6)'; // Semi-transparent orange
  ctx.strokeStyle = '#FF8C00';
  
  for (const ore of resources!.ore) {
    const x = (ore.x + borderOffset) * scale;
    const y = (ore.y + borderOffset) * scale;
    
    // Draw ore pile based on amount
    const circles = ore.amount;
    const radius = scale * 0.15;
    
    for (let i = 0; i < circles; i++) {
      const angle = (Math.PI * 2 * i) / circles;
      const cx = x + scale * 0.5 + Math.cos(angle) * radius;
      const cy = y + scale * 0.5 + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  
  ctx.restore();
}

/**
 * Draw grid overlay
 */
function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  borderOffset: number,
  gridColor: string
) {
  ctx.save();
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  
  // Vertical lines
  for (let x = 0; x <= width; x++) {
    ctx.beginPath();
    ctx.moveTo((x + borderOffset) * scale, borderOffset * scale);
    ctx.lineTo((x + borderOffset) * scale, (height + borderOffset) * scale);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let y = 0; y <= height; y++) {
    ctx.beginPath();
    ctx.moveTo(borderOffset * scale, (y + borderOffset) * scale);
    ctx.lineTo((width + borderOffset) * scale, (y + borderOffset) * scale);
    ctx.stroke();
  }
  
  ctx.restore();
}

/**
 * Draw coordinate labels
 */
function drawCoordinates(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  borderOffset: number
) {
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `${Math.floor(scale * 0.4)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Top coordinates (X)
  for (let x = 0; x < width; x += 5) {
    ctx.fillText(
      x.toString(),
      (x + borderOffset + 0.5) * scale,
      (borderOffset - 0.5) * scale
    );
  }
  
  // Left coordinates (Y)
  for (let y = 0; y < height; y += 5) {
    ctx.fillText(
      y.toString(),
      (borderOffset - 0.5) * scale,
      (y + borderOffset + 0.5) * scale
    );
  }
  
  ctx.restore();
}

/**
 * Apply biome-specific effects
 */
function applyBiomeEffect(
  ctx: CanvasRenderingContext2D,
  biome: string,
  width: number,
  height: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  
  switch (biome) {
    case 'ice':
      // Add blue tint
      ctx.fillStyle = 'rgba(150, 200, 240, 0.1)';
      ctx.fillRect(0, 0, width, height);
      break;
      
    case 'lava':
      // Add red glow
      ctx.fillStyle = 'rgba(255, 50, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);
      break;
      
    case 'rock':
    default:
      // Subtle brown tint
      ctx.fillStyle = 'rgba(120, 90, 60, 0.05)';
      ctx.fillRect(0, 0, width, height);
      break;
  }
  
  ctx.restore();
}

/**
 * Utility: Darken a color
 */
function darkenColor(color: string, factor: number): string {
  // Parse hex color
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Darken
  const dr = Math.floor(r * factor);
  const dg = Math.floor(g * factor);
  const db = Math.floor(b * factor);
  
  // Convert back to hex
  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
}

/**
 * Advanced: Render with multiple layers
 */
export async function renderMapLayers(
  mapData: MapData,
  outputPath: string,
  options: RenderOptions = {}
): Promise<void> {
  const scale = options.scale || 16;
  const border = options.borderWidth || 2;
  const width = (mapData.info.colcount + border * 2) * scale;
  const height = (mapData.info.rowcount + border * 2) * scale;
  
  // Create layer canvases
  const layers = {
    background: createCanvas(width, height),
    terrain: createCanvas(width, height),
    height: createCanvas(width, height),
    resources: createCanvas(width, height),
    grid: createCanvas(width, height),
    labels: createCanvas(width, height)
  };
  
  // Render each layer
  const theme = COLOR_THEMES[options.theme || 'classic'];
  
  // Background layer
  const bgCtx = layers.background.getContext('2d');
  bgCtx.fillStyle = theme.background;
  bgCtx.fillRect(0, 0, width, height);
  
  // Terrain layer
  const terrainCtx = layers.terrain.getContext('2d');
  drawBorder(terrainCtx, border, scale, mapData.info.colcount, mapData.info.rowcount, theme);
  drawTiles(terrainCtx, mapData.tiles, scale, border, theme);
  
  // Height layer
  if (options.showHeight && mapData.height) {
    const heightCtx = layers.height.getContext('2d');
    applyHeightShading(heightCtx, mapData.height, scale, border);
  }
  
  // Resources layer
  if (options.showResources && mapData.resources) {
    const resourceCtx = layers.resources.getContext('2d');
    drawResources(resourceCtx, mapData.resources, scale, border);
  }
  
  // Grid layer
  if (options.showGrid) {
    const gridCtx = layers.grid.getContext('2d');
    drawGrid(gridCtx, mapData.info.colcount, mapData.info.rowcount, scale, border, theme.grid);
  }
  
  // Labels layer
  if (options.showCoordinates) {
    const labelCtx = layers.labels.getContext('2d');
    drawCoordinates(labelCtx, mapData.info.colcount, mapData.info.rowcount, scale, border);
  }
  
  // Composite all layers
  const finalCanvas = createCanvas(width, height);
  const finalCtx = finalCanvas.getContext('2d');
  
  // Draw layers in order
  finalCtx.drawImage(layers.background, 0, 0);
  finalCtx.drawImage(layers.terrain, 0, 0);
  
  finalCtx.save();
  finalCtx.globalCompositeOperation = 'multiply';
  finalCtx.drawImage(layers.height, 0, 0);
  finalCtx.restore();
  
  finalCtx.drawImage(layers.resources, 0, 0);
  finalCtx.drawImage(layers.grid, 0, 0);
  finalCtx.drawImage(layers.labels, 0, 0);
  
  // Apply biome effect
  applyBiomeEffect(finalCtx, mapData.info.biome, width, height);
  
  // Save final image
  const buffer = finalCanvas.toBuffer('image/png');
  await fs.writeFile(outputPath, buffer);
}

/**
 * Example usage
 */
export async function exampleUsage() {
  console.log('=== PNG Renderer Example ===\n');
  
  // Create sample map data
  const sampleMap: MapData = {
    tiles: createSampleTiles(25, 25),
    height: createSampleHeight(25, 25),
    resources: {
      crystals: [
        {x: 5, y: 5},
        {x: 10, y: 10},
        {x: 15, y: 15}
      ],
      ore: [
        {x: 8, y: 12, amount: 3},
        {x: 18, y: 8, amount: 2}
      ]
    },
    info: {
      rowcount: 25,
      colcount: 25,
      biome: 'rock'
    }
  };
  
  // Render with different themes
  const themes: Array<RenderOptions['theme']> = ['classic', 'modern', 'blueprint', 'thermal'];
  
  for (const theme of themes) {
    const filename = `map-${theme}.png`;
    console.log(`Rendering ${theme} theme to ${filename}...`);
    
    await renderMapToPNG(sampleMap, filename, {
      scale: 20,
      borderWidth: 2,
      showGrid: theme === 'blueprint',
      showCoordinates: theme === 'blueprint',
      showResources: true,
      showHeight: theme !== 'thermal',
      theme
    });
  }
  
  // Render high-quality version
  console.log('\nRendering high-quality version...');
  await renderMapLayers(sampleMap, 'map-hq.png', {
    scale: 32,
    borderWidth: 3,
    showGrid: true,
    showCoordinates: true,
    showResources: true,
    showHeight: true,
    theme: 'modern'
  });
  
  console.log('\nRendering complete!');
}

/**
 * Create sample tile data
 */
function createSampleTiles(width: number, height: number): number[][] {
  const tiles: number[][] = [];
  
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      // Border
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        tiles[y][x] = 38; // Solid rock
      }
      // Some patterns
      else if ((x + y) % 7 === 0) {
        tiles[y][x] = 34; // Hard rock
      }
      else if ((x * y) % 11 === 0) {
        tiles[y][x] = 30; // Loose rock
      }
      else if (x === 5 && y === 5) {
        tiles[y][x] = 42; // Crystal seam
      }
      else if (x === 10 && y === 10) {
        tiles[y][x] = 42; // Crystal seam
      }
      else if (x === 8 && y === 12) {
        tiles[y][x] = 46; // Ore seam
      }
      else {
        tiles[y][x] = 1; // Ground
      }
    }
  }
  
  return tiles;
}

/**
 * Create sample height data
 */
function createSampleHeight(width: number, height: number): number[][] {
  const heights: number[][] = [];
  
  for (let y = 0; y < height; y++) {
    heights[y] = [];
    for (let x = 0; x < width; x++) {
      // Create some height variation
      const centerX = width / 2;
      const centerY = height / 2;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
      
      heights[y][x] = Math.floor((distance / maxDistance) * 8);
    }
  }
  
  return heights;
}

// Run example if called directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}