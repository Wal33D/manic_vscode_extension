/**
 * Basic Map Parser Example
 * 
 * This example demonstrates a simple approach to parsing Manic Miners .dat files
 * using regular expressions and string manipulation.
 */

import * as fs from 'fs/promises';

// Type definitions
interface MapData {
  info: {
    rowcount: number;
    colcount: number;
    biome: string;
    creator?: string;
    version?: string;
  };
  tiles?: number[][];
  height?: number[][];
  resources?: {
    crystals: Array<{x: number, y: number}>;
    ore: Array<{x: number, y: number, amount: number}>;
  };
  script?: string;
  [key: string]: any;
}

/**
 * Parse a map file from disk
 */
export async function parseMapFile(filePath: string): Promise<MapData> {
  const content = await fs.readFile(filePath, 'utf-8');
  return parseMapContent(content);
}

/**
 * Parse map content from string
 */
export function parseMapContent(content: string): MapData {
  const map: MapData = {
    info: {
      rowcount: 0,
      colcount: 0,
      biome: 'rock'
    }
  };

  // Split into sections
  const sections = extractSections(content);

  // Parse each section
  for (const [name, sectionContent] of sections) {
    switch (name) {
      case 'info':
        map.info = parseInfoSection(sectionContent);
        break;
      case 'tiles':
        map.tiles = parseGridSection(sectionContent);
        break;
      case 'height':
        map.height = parseGridSection(sectionContent);
        break;
      case 'resources':
        map.resources = parseResourcesSection(sectionContent);
        break;
      case 'script':
        map.script = sectionContent.trim();
        break;
      default:
        // Store other sections as-is
        map[name] = sectionContent;
    }
  }

  return map;
}

/**
 * Extract sections from map content
 */
function extractSections(content: string): Map<string, string> {
  const sections = new Map<string, string>();
  
  // Match section pattern: name{...}
  const sectionRegex = /(\w+)\s*\{([^}]*)\}/gs;
  let match;

  while ((match = sectionRegex.exec(content)) !== null) {
    const [, name, sectionContent] = match;
    sections.set(name, sectionContent.trim());
  }

  return sections;
}

/**
 * Parse info section
 */
function parseInfoSection(content: string): MapData['info'] {
  const info: MapData['info'] = {
    rowcount: 40,
    colcount: 40,
    biome: 'rock'
  };

  // Parse key:value pairs
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*(\w+)\s*:\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      switch (key) {
        case 'rowcount':
        case 'colcount':
          info[key] = parseInt(value);
          break;
        default:
          info[key] = value.trim();
      }
    }
  }

  return info;
}

/**
 * Parse grid sections (tiles, height)
 */
function parseGridSection(content: string): number[][] {
  const grid: number[][] = [];
  const lines = content.split('\n').filter(line => line.trim());

  for (const line of lines) {
    const row = line.split(',').map(val => parseInt(val.trim()));
    grid.push(row);
  }

  return grid;
}

/**
 * Parse resources section
 */
function parseResourcesSection(content: string): MapData['resources'] {
  const resources: MapData['resources'] = {
    crystals: [],
    ore: []
  };

  const lines = content.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    // Simple format: x,y,type[,amount]
    const parts = line.split(',').map(p => p.trim());
    if (parts.length >= 3) {
      const x = parseInt(parts[0]);
      const y = parseInt(parts[1]);
      const type = parts[2];
      
      if (type === 'crystal') {
        resources.crystals.push({ x, y });
      } else if (type === 'ore') {
        const amount = parts[3] ? parseInt(parts[3]) : 3;
        resources.ore.push({ x, y, amount });
      }
    }
  }

  return resources;
}

/**
 * Example usage
 */
async function example() {
  try {
    // Parse a map file
    const map = await parseMapFile('example-map.dat');
    
    // Display basic info
    console.log('Map Information:');
    console.log(`  Size: ${map.info.rowcount}x${map.info.colcount}`);
    console.log(`  Biome: ${map.info.biome}`);
    console.log(`  Creator: ${map.info.creator || 'Unknown'}`);
    
    // Count tile types
    if (map.tiles) {
      const tileCounts = new Map<number, number>();
      for (const row of map.tiles) {
        for (const tile of row) {
          tileCounts.set(tile, (tileCounts.get(tile) || 0) + 1);
        }
      }
      
      console.log('\nTile Distribution:');
      for (const [tileId, count] of tileCounts) {
        const percent = (count / (map.info.rowcount * map.info.colcount) * 100).toFixed(1);
        console.log(`  Tile ${tileId}: ${count} (${percent}%)`);
      }
    }
    
    // Show resources
    if (map.resources) {
      console.log('\nResources:');
      console.log(`  Crystals: ${map.resources.crystals.length}`);
      console.log(`  Ore deposits: ${map.resources.ore.length}`);
    }
    
  } catch (error) {
    console.error('Error parsing map:', error);
  }
}

// Run example if called directly
if (require.main === module) {
  example();
}

/**
 * Validation helper
 */
export function validateMap(map: MapData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!map.info.rowcount || map.info.rowcount < 10 || map.info.rowcount > 100) {
    errors.push('Invalid row count (must be 10-100)');
  }
  
  if (!map.info.colcount || map.info.colcount < 10 || map.info.colcount > 100) {
    errors.push('Invalid column count (must be 10-100)');
  }
  
  if (!['rock', 'ice', 'lava'].includes(map.info.biome)) {
    errors.push('Invalid biome (must be rock, ice, or lava)');
  }

  // Check tile dimensions
  if (map.tiles) {
    if (map.tiles.length !== map.info.rowcount) {
      errors.push('Tile array height mismatch');
    }
    
    for (let i = 0; i < map.tiles.length; i++) {
      if (map.tiles[i].length !== map.info.colcount) {
        errors.push(`Row ${i} width mismatch`);
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}