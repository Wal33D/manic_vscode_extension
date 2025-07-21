/**
 * Map Validation Example
 * 
 * This example demonstrates comprehensive validation of Manic Miners map files,
 * including structure validation, data integrity checks, and game rule compliance.
 */

import { MapData } from './basic-parser';

// Validation result types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats?: MapStatistics;
}

export interface ValidationError {
  section: string;
  field?: string;
  message: string;
  severity: 'error' | 'critical';
  location?: { row?: number; col?: number };
}

export interface ValidationWarning {
  section: string;
  field?: string;
  message: string;
  suggestion?: string;
}

export interface MapStatistics {
  tileDistribution: Map<number, number>;
  resourceCount: { crystals: number; ore: number };
  openSpacePercent: number;
  edgeAccessibility: boolean;
  avgHeight: number;
  scriptComplexity: number;
}

/**
 * Main validation function
 */
export function validateMap(map: MapData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Structure validation
  validateStructure(map, errors, warnings);
  
  // Section-specific validation
  validateInfo(map.info, errors, warnings);
  validateTiles(map.tiles, map.info, errors, warnings);
  validateHeight(map.height, map.info, errors, warnings);
  validateResources(map.resources, map.tiles, errors, warnings);
  validateScript(map.script, errors, warnings);
  validateObjectives(map.objectives, errors, warnings);
  
  // Game rule validation
  validateGameRules(map, errors, warnings);
  
  // Calculate statistics if valid
  let stats: MapStatistics | undefined;
  if (errors.length === 0) {
    stats = calculateStatistics(map);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats
  };
}

/**
 * Validate basic structure
 */
function validateStructure(map: MapData, errors: ValidationError[], warnings: ValidationWarning[]) {
  // Required sections
  if (!map.info) {
    errors.push({
      section: 'info',
      message: 'Missing required info section',
      severity: 'critical'
    });
  }
  
  if (!map.tiles) {
    errors.push({
      section: 'tiles',
      message: 'Missing required tiles section',
      severity: 'critical'
    });
  }
  
  // Optional but recommended sections
  if (!map.objectives) {
    warnings.push({
      section: 'objectives',
      message: 'No objectives defined',
      suggestion: 'Add at least one objective for a complete map'
    });
  }
  
  if (!map.script) {
    warnings.push({
      section: 'script',
      message: 'No scripting defined',
      suggestion: 'Consider adding scripts for enhanced gameplay'
    });
  }
}

/**
 * Validate info section
 */
function validateInfo(info: MapData['info'], errors: ValidationError[], warnings: ValidationWarning[]) {
  if (!info) return;
  
  // Required fields
  if (!info.rowcount || info.rowcount < 10 || info.rowcount > 100) {
    errors.push({
      section: 'info',
      field: 'rowcount',
      message: `Invalid row count: ${info.rowcount} (must be 10-100)`,
      severity: 'error'
    });
  }
  
  if (!info.colcount || info.colcount < 10 || info.colcount > 100) {
    errors.push({
      section: 'info',
      field: 'colcount',
      message: `Invalid column count: ${info.colcount} (must be 10-100)`,
      severity: 'error'
    });
  }
  
  // Biome validation
  const validBiomes = ['rock', 'ice', 'lava'];
  if (!validBiomes.includes(info.biome)) {
    errors.push({
      section: 'info',
      field: 'biome',
      message: `Invalid biome: ${info.biome} (must be ${validBiomes.join(', ')})`,
      severity: 'error'
    });
  }
  
  // Recommended fields
  if (!info.creator) {
    warnings.push({
      section: 'info',
      field: 'creator',
      message: 'No creator specified',
      suggestion: 'Add creator field for attribution'
    });
  }
  
  if (!info.version) {
    warnings.push({
      section: 'info',
      field: 'version',
      message: 'No version specified',
      suggestion: 'Add version field for compatibility tracking'
    });
  }
}

/**
 * Validate tiles section
 */
function validateTiles(
  tiles: number[][] | undefined,
  info: MapData['info'],
  errors: ValidationError[],
  warnings: ValidationWarning[]
) {
  if (!tiles || !info) return;
  
  // Dimension check
  if (tiles.length !== info.rowcount) {
    errors.push({
      section: 'tiles',
      message: `Tile array height (${tiles.length}) doesn't match rowcount (${info.rowcount})`,
      severity: 'error'
    });
  }
  
  // Valid tile IDs
  const validTileIds = new Set([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
    26, 30, 34, 38, 42, 46, 50, 54, 58, 60, 62, 63, 64, 65, 66, 67,
    70, 71, 72, 73, 74, 75, 76, 77, 78, 79,
    // ... add all valid tile IDs up to 165
  ]);
  
  for (let row = 0; row < tiles.length; row++) {
    // Width check
    if (tiles[row].length !== info.colcount) {
      errors.push({
        section: 'tiles',
        message: `Row ${row} width (${tiles[row].length}) doesn't match colcount (${info.colcount})`,
        severity: 'error',
        location: { row }
      });
      continue;
    }
    
    // Validate each tile
    for (let col = 0; col < tiles[row].length; col++) {
      const tileId = tiles[row][col];
      
      // Range check
      if (tileId < 1 || tileId > 165) {
        errors.push({
          section: 'tiles',
          message: `Invalid tile ID ${tileId} at (${row},${col})`,
          severity: 'error',
          location: { row, col }
        });
      }
      
      // Known tile check
      if (!validTileIds.has(tileId) && tileId >= 1 && tileId <= 165) {
        warnings.push({
          section: 'tiles',
          message: `Unknown tile ID ${tileId} at (${row},${col})`,
          suggestion: 'This may be a new or modded tile type'
        });
      }
    }
  }
  
  // Edge validation
  validateEdges(tiles, errors, warnings);
}

/**
 * Validate map edges
 */
function validateEdges(tiles: number[][], errors: ValidationError[], warnings: ValidationWarning[]) {
  const solidRockId = 38;
  let hasNonSolidEdge = false;
  
  // Check top and bottom edges
  for (let col = 0; col < tiles[0].length; col++) {
    if (tiles[0][col] !== solidRockId) hasNonSolidEdge = true;
    if (tiles[tiles.length - 1][col] !== solidRockId) hasNonSolidEdge = true;
  }
  
  // Check left and right edges
  for (let row = 0; row < tiles.length; row++) {
    if (tiles[row][0] !== solidRockId) hasNonSolidEdge = true;
    if (tiles[row][tiles[row].length - 1] !== solidRockId) hasNonSolidEdge = true;
  }
  
  if (hasNonSolidEdge) {
    warnings.push({
      section: 'tiles',
      message: 'Map edges contain non-solid rock tiles',
      suggestion: 'Consider using solid rock (38) for all edge tiles to prevent out-of-bounds issues'
    });
  }
}

/**
 * Validate height section
 */
function validateHeight(
  height: number[][] | undefined,
  info: MapData['info'],
  errors: ValidationError[],
  warnings: ValidationWarning[]
) {
  if (!height) {
    warnings.push({
      section: 'height',
      message: 'No height data provided',
      suggestion: 'Add height variation for more interesting terrain'
    });
    return;
  }
  
  // Dimension check
  if (height.length !== info.rowcount) {
    errors.push({
      section: 'height',
      message: `Height array rows (${height.length}) doesn't match rowcount (${info.rowcount})`,
      severity: 'error'
    });
  }
  
  let hasVariation = false;
  
  for (let row = 0; row < height.length; row++) {
    if (height[row].length !== info.colcount) {
      errors.push({
        section: 'height',
        message: `Height row ${row} width doesn't match colcount`,
        severity: 'error',
        location: { row }
      });
      continue;
    }
    
    for (let col = 0; col < height[row].length; col++) {
      const h = height[row][col];
      
      // Valid range: 0-15
      if (h < 0 || h > 15) {
        errors.push({
          section: 'height',
          message: `Invalid height ${h} at (${row},${col}) - must be 0-15`,
          severity: 'error',
          location: { row, col }
        });
      }
      
      if (h !== 0) hasVariation = true;
    }
  }
  
  if (!hasVariation) {
    warnings.push({
      section: 'height',
      message: 'All heights are 0',
      suggestion: 'Consider adding height variation for visual interest'
    });
  }
}

/**
 * Validate resources
 */
function validateResources(
  resources: MapData['resources'],
  tiles: number[][] | undefined,
  errors: ValidationError[],
  warnings: ValidationWarning[]
) {
  if (!resources || !tiles) return;
  
  const crystalSeamIds = [42, 142]; // Regular and undiscovered
  const oreSeamIds = [46, 146];
  
  // Validate crystal placements
  for (const crystal of resources.crystals) {
    if (!isValidPosition(crystal.x, crystal.y, tiles)) {
      errors.push({
        section: 'resources',
        message: `Crystal at invalid position (${crystal.x},${crystal.y})`,
        severity: 'error',
        location: { row: crystal.y, col: crystal.x }
      });
      continue;
    }
    
    const tileId = tiles[crystal.y][crystal.x];
    if (!crystalSeamIds.includes(tileId)) {
      warnings.push({
        section: 'resources',
        message: `Crystal at (${crystal.x},${crystal.y}) not on crystal seam tile`,
        suggestion: 'Place crystals on crystal seam tiles (42, 142) for consistency'
      });
    }
  }
  
  // Validate ore placements
  for (const ore of resources.ore) {
    if (!isValidPosition(ore.x, ore.y, tiles)) {
      errors.push({
        section: 'resources',
        message: `Ore at invalid position (${ore.x},${ore.y})`,
        severity: 'error',
        location: { row: ore.y, col: ore.x }
      });
      continue;
    }
    
    const tileId = tiles[ore.y][ore.x];
    if (!oreSeamIds.includes(tileId)) {
      warnings.push({
        section: 'resources',
        message: `Ore at (${ore.x},${ore.y}) not on ore seam tile`,
        suggestion: 'Place ore on ore seam tiles (46, 146) for consistency'
      });
    }
    
    // Validate ore amount
    if (ore.amount < 1 || ore.amount > 5) {
      errors.push({
        section: 'resources',
        message: `Invalid ore amount ${ore.amount} at (${ore.x},${ore.y}) - must be 1-5`,
        severity: 'error',
        location: { row: ore.y, col: ore.x }
      });
    }
  }
  
  // Resource balance warnings
  if (resources.crystals.length === 0) {
    warnings.push({
      section: 'resources',
      message: 'No crystals in map',
      suggestion: 'Add crystals for energy collection gameplay'
    });
  }
  
  if (resources.ore.length === 0) {
    warnings.push({
      section: 'resources',
      message: 'No ore deposits in map',
      suggestion: 'Add ore for building material gameplay'
    });
  }
}

/**
 * Validate script section
 */
function validateScript(
  script: string | undefined,
  errors: ValidationError[],
  warnings: ValidationWarning[]
) {
  if (!script) return;
  
  // Basic syntax validation
  const lines = script.split('\n');
  let openBrackets = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip comments and empty lines
    if (!line || line.startsWith('//')) continue;
    
    // Count brackets
    openBrackets += (line.match(/\[/g) || []).length;
    openBrackets -= (line.match(/\]/g) || []).length;
    
    // Check for common syntax errors
    if (line.includes('when(') && !line.includes(')')) {
      errors.push({
        section: 'script',
        message: `Unclosed when condition at line ${i + 1}`,
        severity: 'error'
      });
    }
    
    // Variable declaration check
    if (line.includes('=') && !line.includes('::')) {
      const parts = line.split('=');
      if (parts.length === 2) {
        const varDecl = parts[0].trim();
        if (!varDecl.match(/^(int|bool|string|float)\s+\w+$/)) {
          warnings.push({
            section: 'script',
            message: `Possible missing type declaration at line ${i + 1}`,
            suggestion: 'Variable declarations should include type (int, bool, string, float)'
          });
        }
      }
    }
  }
  
  if (openBrackets !== 0) {
    errors.push({
      section: 'script',
      message: `Mismatched brackets in script (${openBrackets > 0 ? 'unclosed' : 'extra closing'})`,
      severity: 'error'
    });
  }
  
  // Check for required elements
  validateScriptContent(script, warnings);
}

/**
 * Validate script content
 */
function validateScriptContent(script: string, warnings: ValidationWarning[]) {
  // Check for common missing elements
  if (!script.includes('win:')) {
    warnings.push({
      section: 'script',
      message: 'No win event handler found',
      suggestion: 'Add win:: handler to define victory conditions'
    });
  }
  
  if (!script.includes('lose:')) {
    warnings.push({
      section: 'script',
      message: 'No lose event handler found',
      suggestion: 'Add lose:: handler to define defeat conditions'
    });
  }
  
  if (!script.includes('init:')) {
    warnings.push({
      section: 'script',
      message: 'No init event handler found',
      suggestion: 'Add init:: handler for level setup'
    });
  }
}

/**
 * Validate objectives
 */
function validateObjectives(
  objectives: any,
  errors: ValidationError[],
  warnings: ValidationWarning[]
) {
  if (!objectives) return;
  
  // Parse objectives format
  const lines = objectives.toString().split('\n').filter(l => l.trim());
  
  for (const line of lines) {
    const parts = line.split(',');
    
    if (parts.length < 2) {
      errors.push({
        section: 'objectives',
        message: `Invalid objective format: ${line}`,
        severity: 'error'
      });
      continue;
    }
    
    const [type, ...params] = parts;
    
    // Validate objective types
    const validTypes = ['crystals', 'ore', 'buildings', 'timer', 'survive'];
    if (!validTypes.includes(type)) {
      warnings.push({
        section: 'objectives',
        message: `Unknown objective type: ${type}`,
        suggestion: `Use one of: ${validTypes.join(', ')}`
      });
    }
    
    // Type-specific validation
    switch (type) {
      case 'crystals':
      case 'ore':
        if (params.length < 1 || isNaN(parseInt(params[0]))) {
          errors.push({
            section: 'objectives',
            message: `Invalid ${type} objective amount`,
            severity: 'error'
          });
        }
        break;
    }
  }
}

/**
 * Validate game rules
 */
function validateGameRules(map: MapData, errors: ValidationError[], warnings: ValidationWarning[]) {
  if (!map.tiles) return;
  
  // Check for isolated areas
  const accessible = checkAccessibility(map.tiles);
  if (!accessible.fullyConnected) {
    warnings.push({
      section: 'tiles',
      message: `Map has ${accessible.regions} isolated regions`,
      suggestion: 'Ensure all areas are reachable or intentionally isolated'
    });
  }
  
  // Check for required elements
  if (map.buildings) {
    const hasToolStore = map.buildings.toString().includes('BuildingToolStore');
    if (!hasToolStore) {
      warnings.push({
        section: 'buildings',
        message: 'No Tool Store in map',
        suggestion: 'Consider adding a Tool Store for full gameplay'
      });
    }
  }
}

/**
 * Helper functions
 */
function isValidPosition(x: number, y: number, tiles: number[][]): boolean {
  return y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length;
}

function checkAccessibility(tiles: number[][]): { fullyConnected: boolean; regions: number } {
  // Simple flood fill to find connected regions
  const visited = Array(tiles.length).fill(null).map(() => Array(tiles[0].length).fill(false));
  let regions = 0;
  
  for (let row = 0; row < tiles.length; row++) {
    for (let col = 0; col < tiles[row].length; col++) {
      if (!visited[row][col] && tiles[row][col] !== 38) { // Not solid rock
        regions++;
        floodFill(tiles, visited, row, col);
      }
    }
  }
  
  return { fullyConnected: regions <= 1, regions };
}

function floodFill(tiles: number[][], visited: boolean[][], row: number, col: number) {
  if (row < 0 || row >= tiles.length || col < 0 || col >= tiles[0].length) return;
  if (visited[row][col] || tiles[row][col] === 38) return;
  
  visited[row][col] = true;
  
  floodFill(tiles, visited, row - 1, col);
  floodFill(tiles, visited, row + 1, col);
  floodFill(tiles, visited, row, col - 1);
  floodFill(tiles, visited, row, col + 1);
}

/**
 * Calculate map statistics
 */
function calculateStatistics(map: MapData): MapStatistics {
  const stats: MapStatistics = {
    tileDistribution: new Map(),
    resourceCount: { crystals: 0, ore: 0 },
    openSpacePercent: 0,
    edgeAccessibility: false,
    avgHeight: 0,
    scriptComplexity: 0
  };
  
  // Tile distribution
  if (map.tiles) {
    let openTiles = 0;
    for (const row of map.tiles) {
      for (const tile of row) {
        stats.tileDistribution.set(tile, (stats.tileDistribution.get(tile) || 0) + 1);
        if (tile === 1) openTiles++; // Ground tiles
      }
    }
    stats.openSpacePercent = (openTiles / (map.info.rowcount * map.info.colcount)) * 100;
  }
  
  // Resources
  if (map.resources) {
    stats.resourceCount.crystals = map.resources.crystals.length;
    stats.resourceCount.ore = map.resources.ore.reduce((sum, ore) => sum + ore.amount, 0);
  }
  
  // Average height
  if (map.height) {
    let totalHeight = 0;
    for (const row of map.height) {
      for (const h of row) {
        totalHeight += h;
      }
    }
    stats.avgHeight = totalHeight / (map.info.rowcount * map.info.colcount);
  }
  
  // Script complexity (simple line count)
  if (map.script) {
    stats.scriptComplexity = map.script.split('\n').filter(l => l.trim() && !l.startsWith('//')).length;
  }
  
  return stats;
}

/**
 * Example usage
 */
export function validateMapFile(mapData: MapData): void {
  console.log('=== Map Validation ===\n');
  
  const result = validateMap(mapData);
  
  console.log(`Valid: ${result.valid ? 'YES' : 'NO'}\n`);
  
  if (result.errors.length > 0) {
    console.log('ERRORS:');
    for (const error of result.errors) {
      console.log(`  [${error.severity.toUpperCase()}] ${error.section}: ${error.message}`);
      if (error.location) {
        console.log(`    Location: (${error.location.row}, ${error.location.col})`);
      }
    }
    console.log();
  }
  
  if (result.warnings.length > 0) {
    console.log('WARNINGS:');
    for (const warning of result.warnings) {
      console.log(`  ${warning.section}: ${warning.message}`);
      if (warning.suggestion) {
        console.log(`    → ${warning.suggestion}`);
      }
    }
    console.log();
  }
  
  if (result.stats) {
    console.log('STATISTICS:');
    console.log(`  Open space: ${result.stats.openSpacePercent.toFixed(1)}%`);
    console.log(`  Resources: ${result.stats.resourceCount.crystals} crystals, ${result.stats.resourceCount.ore} ore`);
    console.log(`  Average height: ${result.stats.avgHeight.toFixed(2)}`);
    console.log(`  Script complexity: ${result.stats.scriptComplexity} lines`);
  }
}