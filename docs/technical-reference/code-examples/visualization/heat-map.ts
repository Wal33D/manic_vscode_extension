/**
 * Heat Map Visualization Example
 * 
 * This example demonstrates how to create statistical heat maps for
 * analyzing various aspects of Manic Miners maps, such as resource
 * distribution, accessibility, and difficulty.
 */

import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs/promises';

// Heat map types
export type HeatMapType = 
  | 'resource-density'      // Resource concentration
  | 'accessibility'         // Distance from starting areas
  | 'path-complexity'       // Path finding difficulty
  | 'danger-zones'          // Hazard proximity
  | 'cave-connectivity'     // Connected area analysis
  | 'height-variation'      // Elevation changes
  | 'custom';               // User-defined metric

// Heat map options
export interface HeatMapOptions {
  type: HeatMapType;
  colorScheme?: 'thermal' | 'rainbow' | 'grayscale' | 'custom';
  minValue?: number;
  maxValue?: number;
  scale?: number;
  showLegend?: boolean;
  overlayTerrain?: boolean;
  smoothing?: boolean;
  customMetric?: (tiles: number[][], x: number, y: number) => number;
}

// Color schemes
const COLOR_SCHEMES = {
  thermal: [
    { value: 0.0, color: { r: 0, g: 0, b: 0 } },        // Black (cold)
    { value: 0.25, color: { r: 0, g: 0, b: 255 } },     // Blue
    { value: 0.5, color: { r: 0, g: 255, b: 255 } },    // Cyan
    { value: 0.75, color: { r: 255, g: 255, b: 0 } },   // Yellow
    { value: 1.0, color: { r: 255, g: 0, b: 0 } }       // Red (hot)
  ],
  rainbow: [
    { value: 0.0, color: { r: 128, g: 0, b: 128 } },    // Purple
    { value: 0.17, color: { r: 0, g: 0, b: 255 } },     // Blue
    { value: 0.33, color: { r: 0, g: 255, b: 255 } },   // Cyan
    { value: 0.5, color: { r: 0, g: 255, b: 0 } },      // Green
    { value: 0.67, color: { r: 255, g: 255, b: 0 } },   // Yellow
    { value: 0.83, color: { r: 255, g: 128, b: 0 } },   // Orange
    { value: 1.0, color: { r: 255, g: 0, b: 0 } }       // Red
  ],
  grayscale: [
    { value: 0.0, color: { r: 0, g: 0, b: 0 } },        // Black
    { value: 0.5, color: { r: 128, g: 128, b: 128 } },  // Gray
    { value: 1.0, color: { r: 255, g: 255, b: 255 } }   // White
  ]
};

/**
 * Generate a heat map visualization
 */
export async function generateHeatMap(
  tiles: number[][],
  outputPath: string,
  options: HeatMapOptions
): Promise<void> {
  const opts = {
    colorScheme: 'thermal' as const,
    scale: 8,
    showLegend: true,
    overlayTerrain: false,
    smoothing: true,
    ...options
  };
  
  // Calculate heat values
  const heatData = calculateHeatData(tiles, opts);
  
  // Normalize values
  const { normalized, min, max } = normalizeHeatData(heatData);
  
  // Apply smoothing if requested
  const finalData = opts.smoothing ? smoothHeatData(normalized) : normalized;
  
  // Create canvas
  const width = tiles[0].length;
  const height = tiles.length;
  const canvasWidth = width * opts.scale + (opts.showLegend ? 100 : 0);
  const canvasHeight = height * opts.scale;
  
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // Render heat map
  renderHeatMap(ctx, finalData, opts.scale, opts.colorScheme);
  
  // Overlay terrain if requested
  if (opts.overlayTerrain) {
    overlayTerrain(ctx, tiles, opts.scale);
  }
  
  // Draw legend
  if (opts.showLegend) {
    drawLegend(ctx, width * opts.scale, 0, 100, canvasHeight, 
               opts.colorScheme, min, max, opts.type);
  }
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(outputPath, buffer);
}

/**
 * Calculate heat data based on type
 */
function calculateHeatData(
  tiles: number[][],
  options: HeatMapOptions
): number[][] {
  const width = tiles[0].length;
  const height = tiles.length;
  const heatData: number[][] = [];
  
  // Initialize heat data
  for (let y = 0; y < height; y++) {
    heatData[y] = new Array(width).fill(0);
  }
  
  switch (options.type) {
    case 'resource-density':
      calculateResourceDensity(tiles, heatData);
      break;
      
    case 'accessibility':
      calculateAccessibility(tiles, heatData);
      break;
      
    case 'path-complexity':
      calculatePathComplexity(tiles, heatData);
      break;
      
    case 'danger-zones':
      calculateDangerZones(tiles, heatData);
      break;
      
    case 'cave-connectivity':
      calculateCaveConnectivity(tiles, heatData);
      break;
      
    case 'height-variation':
      calculateHeightVariation(tiles, heatData);
      break;
      
    case 'custom':
      if (options.customMetric) {
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            heatData[y][x] = options.customMetric(tiles, x, y);
          }
        }
      }
      break;
  }
  
  return heatData;
}

/**
 * Calculate resource density heat map
 */
function calculateResourceDensity(tiles: number[][], heatData: number[][]) {
  const resourceTiles = [42, 46, 50]; // Crystal, ore, recharge
  const radius = 5;
  
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      if (resourceTiles.includes(tiles[y][x])) {
        // Add heat around resource
        addHeat(heatData, x, y, radius, 1.0);
      }
    }
  }
}

/**
 * Calculate accessibility from edges
 */
function calculateAccessibility(tiles: number[][], heatData: number[][]) {
  const solidTile = 38;
  const queue: Array<{x: number, y: number, dist: number}> = [];
  const visited = new Set<string>();
  
  // Start from all edge tiles that aren't solid
  for (let x = 0; x < tiles[0].length; x++) {
    if (tiles[0][x] !== solidTile) {
      queue.push({x, y: 0, dist: 0});
      visited.add(`${x},0`);
    }
    if (tiles[tiles.length - 1][x] !== solidTile) {
      queue.push({x, y: tiles.length - 1, dist: 0});
      visited.add(`${x},${tiles.length - 1}`);
    }
  }
  
  for (let y = 0; y < tiles.length; y++) {
    if (tiles[y][0] !== solidTile) {
      queue.push({x: 0, y, dist: 0});
      visited.add(`0,${y}`);
    }
    if (tiles[y][tiles[y].length - 1] !== solidTile) {
      queue.push({x: tiles[y].length - 1, y, dist: 0});
      visited.add(`${tiles[y].length - 1},${y}`);
    }
  }
  
  // BFS to calculate distances
  while (queue.length > 0) {
    const {x, y, dist} = queue.shift()!;
    heatData[y][x] = dist;
    
    // Check neighbors
    const neighbors = [
      {x: x - 1, y}, {x: x + 1, y},
      {x, y: y - 1}, {x, y: y + 1}
    ];
    
    for (const {x: nx, y: ny} of neighbors) {
      const key = `${nx},${ny}`;
      if (nx >= 0 && nx < tiles[0].length && 
          ny >= 0 && ny < tiles.length &&
          !visited.has(key) && 
          tiles[ny][nx] !== solidTile) {
        visited.add(key);
        queue.push({x: nx, y: ny, dist: dist + 1});
      }
    }
  }
}

/**
 * Calculate path complexity
 */
function calculatePathComplexity(tiles: number[][], heatData: number[][]) {
  const passableTiles = [1, 14, 26]; // Ground, power path, dirt
  
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      if (passableTiles.includes(tiles[y][x])) {
        // Count obstacles in surrounding area
        let complexity = 0;
        const radius = 3;
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < tiles[0].length && 
                ny >= 0 && ny < tiles.length &&
                !passableTiles.includes(tiles[ny][nx])) {
              complexity++;
            }
          }
        }
        
        heatData[y][x] = complexity;
      }
    }
  }
}

/**
 * Calculate danger zones
 */
function calculateDangerZones(tiles: number[][], heatData: number[][]) {
  const dangerTiles = [
    { id: 6, heat: 2.0 },   // Lava - very dangerous
    { id: 7, heat: 1.5 },   // Erosion
    { id: 11, heat: 0.5 },  // Water - mild danger
    { id: 12, heat: 1.0 }   // Slug hole
  ];
  
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      const danger = dangerTiles.find(d => d.id === tiles[y][x]);
      if (danger) {
        // Add danger heat with falloff
        addHeat(heatData, x, y, 4, danger.heat);
      }
    }
  }
}

/**
 * Calculate cave connectivity
 */
function calculateCaveConnectivity(tiles: number[][], heatData: number[][]) {
  const solidTile = 38;
  const visited = Array(tiles.length).fill(null).map(() => 
    Array(tiles[0].length).fill(false)
  );
  
  let regionId = 0;
  const regionSizes = new Map<number, number>();
  
  // Find all connected regions
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      if (!visited[y][x] && tiles[y][x] !== solidTile) {
        const size = floodFillRegion(tiles, visited, x, y, regionId, heatData);
        regionSizes.set(regionId, size);
        regionId++;
      }
    }
  }
  
  // Normalize by region size (larger regions = higher heat)
  const maxSize = Math.max(...regionSizes.values());
  
  for (let y = 0; y < heatData.length; y++) {
    for (let x = 0; x < heatData[y].length; x++) {
      if (heatData[y][x] >= 0) {
        const region = heatData[y][x];
        const size = regionSizes.get(region) || 0;
        heatData[y][x] = size / maxSize;
      }
    }
  }
}

/**
 * Calculate height variation
 */
function calculateHeightVariation(tiles: number[][], heatData: number[][]) {
  // Simulate height based on distance from solid rock
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      if (tiles[y][x] !== 38) { // Not solid rock
        // Calculate variation based on neighboring tiles
        let variation = 0;
        let count = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < tiles[0].length && 
                ny >= 0 && ny < tiles.length) {
              if (tiles[ny][nx] !== tiles[y][x]) {
                variation++;
              }
              count++;
            }
          }
        }
        
        heatData[y][x] = variation / count;
      }
    }
  }
}

/**
 * Add heat with falloff
 */
function addHeat(
  heatData: number[][],
  centerX: number,
  centerY: number,
  radius: number,
  intensity: number
) {
  for (let y = Math.max(0, centerY - radius); 
       y <= Math.min(heatData.length - 1, centerY + radius); y++) {
    for (let x = Math.max(0, centerX - radius); 
         x <= Math.min(heatData[0].length - 1, centerX + radius); x++) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (distance <= radius) {
        const falloff = 1 - (distance / radius);
        heatData[y][x] += intensity * falloff;
      }
    }
  }
}

/**
 * Flood fill a region
 */
function floodFillRegion(
  tiles: number[][],
  visited: boolean[][],
  startX: number,
  startY: number,
  regionId: number,
  heatData: number[][]
): number {
  const stack = [{x: startX, y: startY}];
  let size = 0;
  
  while (stack.length > 0) {
    const {x, y} = stack.pop()!;
    
    if (x < 0 || x >= tiles[0].length || y < 0 || y >= tiles.length) continue;
    if (visited[y][x] || tiles[y][x] === 38) continue;
    
    visited[y][x] = true;
    heatData[y][x] = regionId;
    size++;
    
    stack.push({x: x - 1, y});
    stack.push({x: x + 1, y});
    stack.push({x, y: y - 1});
    stack.push({x, y: y + 1});
  }
  
  return size;
}

/**
 * Normalize heat data
 */
function normalizeHeatData(heatData: number[][]): {
  normalized: number[][],
  min: number,
  max: number
} {
  let min = Infinity;
  let max = -Infinity;
  
  // Find min/max
  for (const row of heatData) {
    for (const value of row) {
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  
  // Normalize to 0-1
  const normalized: number[][] = [];
  const range = max - min || 1;
  
  for (let y = 0; y < heatData.length; y++) {
    normalized[y] = [];
    for (let x = 0; x < heatData[y].length; x++) {
      normalized[y][x] = (heatData[y][x] - min) / range;
    }
  }
  
  return { normalized, min, max };
}

/**
 * Smooth heat data using gaussian blur
 */
function smoothHeatData(data: number[][]): number[][] {
  const kernel = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1]
  ];
  const kernelSum = 16;
  
  const smoothed: number[][] = [];
  
  for (let y = 0; y < data.length; y++) {
    smoothed[y] = [];
    for (let x = 0; x < data[y].length; x++) {
      let sum = 0;
      let count = 0;
      
      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          const ny = y + ky - 1;
          const nx = x + kx - 1;
          
          if (ny >= 0 && ny < data.length && 
              nx >= 0 && nx < data[0].length) {
            sum += data[ny][nx] * kernel[ky][kx];
            count += kernel[ky][kx];
          }
        }
      }
      
      smoothed[y][x] = sum / count;
    }
  }
  
  return smoothed;
}

/**
 * Render heat map
 */
function renderHeatMap(
  ctx: CanvasRenderingContext2D,
  data: number[][],
  scale: number,
  colorScheme: string
) {
  const scheme = COLOR_SCHEMES[colorScheme as keyof typeof COLOR_SCHEMES] || COLOR_SCHEMES.thermal;
  
  for (let y = 0; y < data.length; y++) {
    for (let x = 0; x < data[y].length; x++) {
      const value = data[y][x];
      const color = interpolateColor(value, scheme);
      
      ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
}

/**
 * Interpolate color from scheme
 */
function interpolateColor(
  value: number,
  scheme: Array<{value: number, color: {r: number, g: number, b: number}}>
): {r: number, g: number, b: number} {
  // Find surrounding colors
  let lower = scheme[0];
  let upper = scheme[scheme.length - 1];
  
  for (let i = 0; i < scheme.length - 1; i++) {
    if (value >= scheme[i].value && value <= scheme[i + 1].value) {
      lower = scheme[i];
      upper = scheme[i + 1];
      break;
    }
  }
  
  // Interpolate
  const range = upper.value - lower.value || 1;
  const t = (value - lower.value) / range;
  
  return {
    r: Math.floor(lower.color.r + (upper.color.r - lower.color.r) * t),
    g: Math.floor(lower.color.g + (upper.color.g - lower.color.g) * t),
    b: Math.floor(lower.color.b + (upper.color.b - lower.color.b) * t)
  };
}

/**
 * Overlay terrain outlines
 */
function overlayTerrain(
  ctx: CanvasRenderingContext2D,
  tiles: number[][],
  scale: number
) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      if (tiles[y][x] === 38) { // Solid rock
        // Check if edge tile
        let isEdge = false;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (Math.abs(dx) + Math.abs(dy) !== 1) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx < 0 || nx >= tiles[0].length || 
                ny < 0 || ny >= tiles.length ||
                tiles[ny][nx] !== 38) {
              isEdge = true;
              break;
            }
          }
        }
        
        if (isEdge) {
          ctx.strokeRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  }
  
  ctx.restore();
}

/**
 * Draw color legend
 */
function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  colorScheme: string,
  minValue: number,
  maxValue: number,
  type: HeatMapType
) {
  const scheme = COLOR_SCHEMES[colorScheme as keyof typeof COLOR_SCHEMES] || COLOR_SCHEMES.thermal;
  const padding = 10;
  const barWidth = 20;
  const barHeight = height - padding * 4 - 40;
  const barX = x + padding;
  const barY = y + padding + 20;
  
  // Draw title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(getHeatMapTitle(type), x + width / 2, y + padding + 10);
  
  // Draw gradient bar
  for (let i = 0; i < barHeight; i++) {
    const value = 1 - (i / barHeight);
    const color = interpolateColor(value, scheme);
    
    ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
    ctx.fillRect(barX, barY + i, barWidth, 1);
  }
  
  // Draw border
  ctx.strokeStyle = '#FFFFFF';
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  
  // Draw labels
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '10px Arial';
  ctx.textAlign = 'left';
  
  const labelX = barX + barWidth + 5;
  ctx.fillText(maxValue.toFixed(1), labelX, barY + 10);
  ctx.fillText(((maxValue + minValue) / 2).toFixed(1), labelX, barY + barHeight / 2);
  ctx.fillText(minValue.toFixed(1), labelX, barY + barHeight);
}

/**
 * Get heat map title
 */
function getHeatMapTitle(type: HeatMapType): string {
  const titles: Record<HeatMapType, string> = {
    'resource-density': 'Resource Density',
    'accessibility': 'Accessibility',
    'path-complexity': 'Path Complexity',
    'danger-zones': 'Danger Zones',
    'cave-connectivity': 'Cave Connectivity',
    'height-variation': 'Height Variation',
    'custom': 'Custom Metric'
  };
  
  return titles[type] || 'Heat Map';
}

/**
 * Batch generate multiple heat maps
 */
export async function generateHeatMapSet(
  tiles: number[][],
  outputDir: string,
  types: HeatMapType[] = [
    'resource-density',
    'accessibility',
    'danger-zones',
    'cave-connectivity'
  ]
): Promise<void> {
  for (const type of types) {
    const outputPath = `${outputDir}/heatmap-${type}.png`;
    await generateHeatMap(tiles, outputPath, {
      type,
      scale: 8,
      showLegend: true,
      overlayTerrain: true,
      smoothing: true
    });
    
    console.log(`Generated: ${outputPath}`);
  }
}

/**
 * Example usage
 */
export async function exampleUsage() {
  console.log('=== Heat Map Visualization Example ===\n');
  
  // Create test map
  const testMap = createTestMap(50, 50);
  
  // Generate individual heat maps
  const types: HeatMapType[] = [
    'resource-density',
    'accessibility',
    'path-complexity',
    'danger-zones',
    'cave-connectivity'
  ];
  
  for (const type of types) {
    console.log(`Generating ${type} heat map...`);
    await generateHeatMap(testMap, `heatmap-${type}.png`, {
      type,
      scale: 10,
      showLegend: true,
      overlayTerrain: type !== 'cave-connectivity',
      smoothing: true
    });
  }
  
  // Generate custom heat map
  console.log('\nGenerating custom heat map...');
  await generateHeatMap(testMap, 'heatmap-custom.png', {
    type: 'custom',
    customMetric: (tiles, x, y) => {
      // Distance from center
      const centerX = tiles[0].length / 2;
      const centerY = tiles.length / 2;
      return Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    },
    colorScheme: 'rainbow',
    scale: 10,
    showLegend: true
  });
  
  console.log('\nHeat map generation complete!');
}

/**
 * Create test map with various features
 */
function createTestMap(width: number, height: number): number[][] {
  const map: number[][] = [];
  
  for (let y = 0; y < height; y++) {
    map[y] = [];
    for (let x = 0; x < width; x++) {
      // Border
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        map[y][x] = 38;
      }
      // Create some caves
      else if ((x > 10 && x < 20 && y > 10 && y < 20) ||
               (x > 30 && x < 40 && y > 30 && y < 40)) {
        map[y][x] = 1;
      }
      // Add some resources
      else if ((x === 15 && y === 15) || (x === 35 && y === 35)) {
        map[y][x] = 42; // Crystal
      }
      else if ((x === 25 && y === 25)) {
        map[y][x] = 46; // Ore
      }
      // Add hazards
      else if (x > 20 && x < 25 && y === 25) {
        map[y][x] = 6; // Lava
      }
      // Default rock
      else {
        map[y][x] = Math.random() < 0.7 ? 38 : 34;
      }
    }
  }
  
  return map;
}

// Run example if called directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}