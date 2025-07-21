/**
 * Thumbnail Generation Example
 * 
 * This example demonstrates efficient thumbnail generation for Manic Miners maps,
 * including optimization techniques for small-scale rendering.
 */

import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';
import sharp from 'sharp';

// Thumbnail options
export interface ThumbnailOptions {
  width?: number;              // Target width in pixels
  height?: number;             // Target height in pixels
  fit?: 'contain' | 'cover' | 'fill';
  quality?: 'low' | 'medium' | 'high';
  showResources?: boolean;     // Show resource indicators
  simplifyColors?: boolean;    // Use simplified color palette
  addBorder?: boolean;         // Add frame border
  format?: 'png' | 'jpeg' | 'webp';
}

// Simplified tile colors for thumbnails
const SIMPLE_COLORS = {
  empty: '#8B7355',      // Brown for ground/dirt
  solid: '#2F2F2F',      // Dark gray for rock
  resource: '#FFD700',   // Gold for resources
  hazard: '#DC143C',     // Crimson for hazards
  special: '#4169E1'     // Royal blue for special
};

/**
 * Generate a thumbnail from map data
 */
export async function generateThumbnail(
  tiles: number[][],
  outputPath: string,
  options: ThumbnailOptions = {}
): Promise<Buffer> {
  const opts = {
    width: 128,
    height: 128,
    fit: 'contain' as const,
    quality: 'medium' as const,
    showResources: true,
    simplifyColors: true,
    addBorder: true,
    format: 'png' as const,
    ...options
  };
  
  // Calculate tile scale based on quality
  const tileScale = getQualityScale(opts.quality);
  
  // Create canvas at tile scale
  const mapWidth = tiles[0].length;
  const mapHeight = tiles.length;
  const canvasWidth = mapWidth * tileScale;
  const canvasHeight = mapHeight * tileScale;
  
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  
  // Render tiles
  if (opts.simplifyColors) {
    renderSimplified(ctx, tiles, tileScale);
  } else {
    renderDetailed(ctx, tiles, tileScale);
  }
  
  // Add resource indicators if requested
  if (opts.showResources) {
    addResourceIndicators(ctx, tiles, tileScale);
  }
  
  // Convert to buffer for processing
  let buffer = canvas.toBuffer('image/png');
  
  // Process with sharp for final sizing
  buffer = await processWithSharp(buffer, opts);
  
  return buffer;
}

/**
 * Get tile scale based on quality setting
 */
function getQualityScale(quality: ThumbnailOptions['quality']): number {
  switch (quality) {
    case 'low': return 1;
    case 'high': return 4;
    default: return 2;
  }
}

/**
 * Render simplified version
 */
function renderSimplified(
  ctx: CanvasRenderingContext2D,
  tiles: number[][],
  scale: number
) {
  // Group tiles into categories
  const categories = categorizeTiles();
  
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      const tileId = tiles[y][x];
      const category = getTileCategory(tileId, categories);
      
      ctx.fillStyle = SIMPLE_COLORS[category];
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
}

/**
 * Render detailed version
 */
function renderDetailed(
  ctx: CanvasRenderingContext2D,
  tiles: number[][],
  scale: number
) {
  const colors = getDetailedColors();
  
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      const tileId = tiles[y][x];
      const color = colors.get(tileId) || '#FF00FF';
      
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
}

/**
 * Categorize tiles for simplified rendering
 */
function categorizeTiles(): Map<string, number[]> {
  return new Map([
    ['empty', [1, 14, 26]],                    // Ground, power path, dirt
    ['solid', [30, 34, 38]],                   // Rock types
    ['resource', [42, 46, 50]],                // Crystal, ore, recharge
    ['hazard', [6, 7, 11, 12]],               // Lava, erosion, water, slug
    ['special', [16, 17, 18, 63, 64, 65]]     // Special tiles
  ]);
}

/**
 * Get tile category
 */
function getTileCategory(
  tileId: number,
  categories: Map<string, number[]>
): keyof typeof SIMPLE_COLORS {
  for (const [category, tiles] of categories) {
    if (tiles.includes(tileId)) {
      return category as keyof typeof SIMPLE_COLORS;
    }
  }
  
  // Handle undiscovered tiles
  if (tileId > 100) {
    const baseTile = tileId - 100;
    return getTileCategory(baseTile, categories);
  }
  
  return 'special';
}

/**
 * Add resource indicators
 */
function addResourceIndicators(
  ctx: CanvasRenderingContext2D,
  tiles: number[][],
  scale: number
) {
  const resourceTiles = [42, 46, 50]; // Crystal, ore, recharge
  
  ctx.save();
  ctx.globalAlpha = 0.8;
  
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      const tileId = tiles[y][x];
      
      if (resourceTiles.includes(tileId)) {
        // Draw highlight
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = Math.max(1, scale / 4);
        ctx.strokeRect(
          x * scale + ctx.lineWidth / 2,
          y * scale + ctx.lineWidth / 2,
          scale - ctx.lineWidth,
          scale - ctx.lineWidth
        );
        
        // Draw icon if scale allows
        if (scale >= 4) {
          drawResourceIcon(ctx, tileId, x * scale, y * scale, scale);
        }
      }
    }
  }
  
  ctx.restore();
}

/**
 * Draw resource icon
 */
function drawResourceIcon(
  ctx: CanvasRenderingContext2D,
  tileId: number,
  x: number,
  y: number,
  size: number
) {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const icons: {[key: number]: string} = {
    42: '◆', // Crystal
    46: '●', // Ore
    50: '⚡' // Recharge
  };
  
  const icon = icons[tileId] || '?';
  ctx.fillText(icon, x + size / 2, y + size / 2);
}

/**
 * Get detailed color mapping
 */
function getDetailedColors(): Map<number, string> {
  return new Map([
    [1, '#7C5C46'],    // Ground
    [6, '#FF3200'],    // Lava
    [11, '#1E54C5'],   // Water
    [12, '#B4B414'],   // Slug hole
    [14, '#DCDCDC'],   // Power path
    [26, '#A96D52'],   // Dirt
    [30, '#8B6856'],   // Loose rock
    [34, '#4D3532'],   // Hard rock
    [38, '#000000'],   // Solid rock
    [42, '#CEE968'],   // Crystal seam
    [46, '#C8551E'],   // Ore seam
    [50, '#FFFF46'],   // Recharge seam
  ]);
}

/**
 * Process with sharp for final output
 */
async function processWithSharp(
  buffer: Buffer,
  options: ThumbnailOptions
): Promise<Buffer> {
  let pipeline = sharp(buffer);
  
  // Resize to target dimensions
  pipeline = pipeline.resize(options.width, options.height, {
    fit: options.fit,
    position: 'centre',
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  });
  
  // Add border if requested
  if (options.addBorder) {
    pipeline = pipeline.extend({
      top: 2,
      bottom: 2,
      left: 2,
      right: 2,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    });
  }
  
  // Set output format and quality
  switch (options.format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({
        quality: getJpegQuality(options.quality),
        progressive: true
      });
      break;
      
    case 'webp':
      pipeline = pipeline.webp({
        quality: getJpegQuality(options.quality),
        lossless: false
      });
      break;
      
    default:
      pipeline = pipeline.png({
        compressionLevel: 9,
        palette: options.simplifyColors
      });
  }
  
  return pipeline.toBuffer();
}

/**
 * Get JPEG quality setting
 */
function getJpegQuality(quality: ThumbnailOptions['quality']): number {
  switch (quality) {
    case 'low': return 60;
    case 'high': return 95;
    default: return 80;
  }
}

/**
 * Batch thumbnail generation
 */
export async function generateThumbnailBatch(
  maps: Array<{tiles: number[][], name: string}>,
  outputDir: string,
  options: ThumbnailOptions = {}
): Promise<void> {
  const results: Array<{name: string, path: string, size: number}> = [];
  
  for (const map of maps) {
    const outputPath = `${outputDir}/${map.name}-thumb.${options.format || 'png'}`;
    const buffer = await generateThumbnail(map.tiles, outputPath, options);
    
    results.push({
      name: map.name,
      path: outputPath,
      size: buffer.length
    });
    
    // Save file
    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, buffer);
  }
  
  // Generate index
  await generateThumbnailIndex(results, outputDir);
}

/**
 * Generate HTML index of thumbnails
 */
async function generateThumbnailIndex(
  thumbnails: Array<{name: string, path: string, size: number}>,
  outputDir: string
): Promise<void> {
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>Map Thumbnails</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f0f0f0; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; }
    .thumbnail { background: white; border-radius: 8px; padding: 10px; text-align: center; }
    .thumbnail img { max-width: 100%; height: auto; border: 1px solid #ddd; }
    .thumbnail .name { margin-top: 10px; font-weight: bold; }
    .thumbnail .size { color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Map Thumbnails</h1>
    <div class="grid">`;
  
  for (const thumb of thumbnails) {
    const filename = thumb.path.split('/').pop();
    const sizeKB = (thumb.size / 1024).toFixed(1);
    
    html += `
      <div class="thumbnail">
        <img src="${filename}" alt="${thumb.name}">
        <div class="name">${thumb.name}</div>
        <div class="size">${sizeKB} KB</div>
      </div>`;
  }
  
  html += `
    </div>
  </div>
</body>
</html>`;
  
  const fs = await import('fs/promises');
  await fs.writeFile(`${outputDir}/index.html`, html);
}

/**
 * Advanced: Generate preview strip
 */
export async function generatePreviewStrip(
  maps: Array<{tiles: number[][], name: string}>,
  outputPath: string,
  options: {
    thumbnailSize?: number;
    spacing?: number;
    maxWidth?: number;
  } = {}
): Promise<void> {
  const opts = {
    thumbnailSize: 64,
    spacing: 10,
    maxWidth: 800,
    ...options
  };
  
  // Generate individual thumbnails
  const thumbnails: Canvas[] = [];
  
  for (const map of maps) {
    const canvas = createCanvas(opts.thumbnailSize, opts.thumbnailSize);
    const ctx = canvas.getContext('2d');
    
    // Render simplified
    const scale = opts.thumbnailSize / Math.max(map.tiles.length, map.tiles[0].length);
    renderSimplified(ctx, map.tiles, scale);
    
    thumbnails.push(canvas);
  }
  
  // Calculate strip dimensions
  const thumbsPerRow = Math.floor((opts.maxWidth + opts.spacing) / (opts.thumbnailSize + opts.spacing));
  const rows = Math.ceil(thumbnails.length / thumbsPerRow);
  const stripWidth = Math.min(
    thumbnails.length * (opts.thumbnailSize + opts.spacing) - opts.spacing,
    opts.maxWidth
  );
  const stripHeight = rows * (opts.thumbnailSize + opts.spacing) - opts.spacing;
  
  // Create strip canvas
  const strip = createCanvas(stripWidth, stripHeight);
  const stripCtx = strip.getContext('2d');
  
  // Fill background
  stripCtx.fillStyle = '#333333';
  stripCtx.fillRect(0, 0, stripWidth, stripHeight);
  
  // Place thumbnails
  for (let i = 0; i < thumbnails.length; i++) {
    const row = Math.floor(i / thumbsPerRow);
    const col = i % thumbsPerRow;
    const x = col * (opts.thumbnailSize + opts.spacing);
    const y = row * (opts.thumbnailSize + opts.spacing);
    
    stripCtx.drawImage(thumbnails[i], x, y);
    
    // Add label
    stripCtx.fillStyle = '#FFFFFF';
    stripCtx.font = '10px Arial';
    stripCtx.fillText(maps[i].name, x + 2, y + opts.thumbnailSize - 2);
  }
  
  // Save strip
  const buffer = strip.toBuffer('image/png');
  const fs = await import('fs/promises');
  await fs.writeFile(outputPath, buffer);
}

/**
 * Example usage
 */
export async function exampleUsage() {
  console.log('=== Thumbnail Generation Example ===\n');
  
  // Create sample maps
  const sampleMaps = [
    { tiles: createRandomMap(40, 40, 'simple'), name: 'simple-cave' },
    { tiles: createRandomMap(50, 50, 'complex'), name: 'complex-cave' },
    { tiles: createRandomMap(30, 30, 'resource'), name: 'resource-rich' }
  ];
  
  // Generate individual thumbnails
  console.log('Generating individual thumbnails...');
  
  for (const map of sampleMaps) {
    await generateThumbnail(
      map.tiles,
      `${map.name}-thumb.png`,
      {
        width: 128,
        height: 128,
        quality: 'high',
        showResources: true,
        simplifyColors: true,
        addBorder: true
      }
    );
    
    console.log(`  Generated: ${map.name}-thumb.png`);
  }
  
  // Generate thumbnail batch with index
  console.log('\nGenerating thumbnail batch...');
  await generateThumbnailBatch(sampleMaps, '.', {
    width: 96,
    height: 96,
    quality: 'medium',
    format: 'webp'
  });
  
  // Generate preview strip
  console.log('\nGenerating preview strip...');
  await generatePreviewStrip(sampleMaps, 'preview-strip.png', {
    thumbnailSize: 64,
    spacing: 10,
    maxWidth: 400
  });
  
  console.log('\nThumbnail generation complete!');
}

/**
 * Create random map for testing
 */
function createRandomMap(
  width: number,
  height: number,
  type: 'simple' | 'complex' | 'resource'
): number[][] {
  const map: number[][] = [];
  
  for (let y = 0; y < height; y++) {
    map[y] = [];
    for (let x = 0; x < width; x++) {
      // Border
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        map[y][x] = 38;
      }
      // Content based on type
      else {
        switch (type) {
          case 'simple':
            map[y][x] = Math.random() < 0.3 ? 34 : 1;
            break;
            
          case 'complex':
            const rand = Math.random();
            if (rand < 0.4) map[y][x] = 38;
            else if (rand < 0.6) map[y][x] = 34;
            else if (rand < 0.8) map[y][x] = 30;
            else map[y][x] = 1;
            break;
            
          case 'resource':
            const rrand = Math.random();
            if (rrand < 0.3) map[y][x] = 34;
            else if (rrand < 0.35) map[y][x] = 42;
            else if (rrand < 0.38) map[y][x] = 46;
            else map[y][x] = 1;
            break;
        }
      }
    }
  }
  
  return map;
}

// Run example if called directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}