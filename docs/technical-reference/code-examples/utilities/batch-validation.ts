/**
 * Batch Map Validation Utility
 * 
 * This example demonstrates batch validation of multiple map files,
 * including encoding detection, error reporting, and summary statistics.
 * Useful for validating map collections or CI/CD pipelines.
 */

import * as fs from 'fs';
import * as path from 'path';

// Validation result types
export interface ValidationResult {
  file: string;
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  encoding?: string;
  stats?: MapStats;
}

export interface ValidationError {
  type: 'parse' | 'structure' | 'content' | 'encoding';
  message: string;
  section?: string;
  line?: number;
}

export interface ValidationWarning {
  type: 'style' | 'balance' | 'compatibility' | 'performance';
  message: string;
  section?: string;
}

export interface MapStats {
  sections: string[];
  tileCount: number;
  dimensions?: { width: number; height: number };
  resourceCount?: number;
  scriptSize?: number;
}

export interface BatchValidationSummary {
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  totalErrors: number;
  totalWarnings: number;
  commonErrors: Map<string, number>;
  fileResults: ValidationResult[];
}

/**
 * Validate a batch of map files
 */
export async function validateMapBatch(
  directory: string,
  options?: {
    recursive?: boolean;
    pattern?: RegExp;
    stopOnError?: boolean;
    detailed?: boolean;
  }
): Promise<BatchValidationSummary> {
  const defaults = {
    recursive: true,
    pattern: /\.dat$/i,
    stopOnError: false,
    detailed: true
  };
  
  const opts = { ...defaults, ...options };
  const mapFiles = await findMapFiles(directory, opts.pattern, opts.recursive);
  const results: ValidationResult[] = [];
  const commonErrors = new Map<string, number>();
  
  console.log(`Found ${mapFiles.length} map files to validate...\n`);
  
  for (const file of mapFiles) {
    try {
      const result = await validateMapFile(file, opts.detailed);
      results.push(result);
      
      // Track common errors
      for (const error of result.errors) {
        const key = `${error.type}: ${error.message}`;
        commonErrors.set(key, (commonErrors.get(key) || 0) + 1);
      }
      
      // Log progress
      const status = result.valid ? '✓' : '✗';
      const errorCount = result.errors.length;
      const warningCount = result.warnings.length;
      console.log(`${status} ${path.basename(file)} - ${errorCount} errors, ${warningCount} warnings`);
      
      if (opts.stopOnError && !result.valid) {
        console.log('\nStopping due to validation error.');
        break;
      }
    } catch (error) {
      results.push({
        file,
        valid: false,
        errors: [{
          type: 'parse',
          message: `Failed to read file: ${error.message}`
        }],
        warnings: []
      });
    }
  }
  
  // Calculate summary
  const validFiles = results.filter(r => r.valid).length;
  const invalidFiles = results.filter(r => !r.valid).length;
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  
  return {
    totalFiles: mapFiles.length,
    validFiles,
    invalidFiles,
    totalErrors,
    totalWarnings,
    commonErrors,
    fileResults: results
  };
}

/**
 * Find all map files in directory
 */
async function findMapFiles(
  directory: string,
  pattern: RegExp,
  recursive: boolean
): Promise<string[]> {
  const files: string[] = [];
  
  async function scan(dir: string) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && recursive) {
        await scan(fullPath);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(directory);
  return files.sort();
}

/**
 * Validate a single map file
 */
export async function validateMapFile(
  filePath: string,
  detailed: boolean = true
): Promise<ValidationResult> {
  const result: ValidationResult = {
    file: filePath,
    valid: true,
    errors: [],
    warnings: []
  };
  
  try {
    // Read file with encoding detection
    const { content, encoding } = await readFileWithEncoding(filePath);
    result.encoding = encoding;
    
    // Parse sections
    const sections = parseSections(content);
    
    // Validate structure
    validateStructure(sections, result);
    
    // Validate each section
    for (const [name, content] of sections) {
      validateSection(name, content, sections, result);
    }
    
    // Check cross-section consistency
    validateCrossReferences(sections, result);
    
    // Analyze balance and gameplay
    if (detailed) {
      analyzeGameplay(sections, result);
    }
    
    // Collect stats
    if (detailed) {
      result.stats = collectStats(sections);
    }
    
  } catch (error) {
    result.valid = false;
    result.errors.push({
      type: 'parse',
      message: error.message
    });
  }
  
  result.valid = result.errors.length === 0;
  return result;
}

/**
 * Read file with encoding detection
 */
async function readFileWithEncoding(
  filePath: string
): Promise<{ content: string; encoding: string }> {
  const buffer = await fs.promises.readFile(filePath);
  
  // Check for BOM
  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return { content: buffer.toString('utf8'), encoding: 'utf8-bom' };
  }
  
  // Try UTF-8 first
  try {
    const content = buffer.toString('utf8');
    // Simple validation - if no replacement chars, assume UTF-8
    if (!content.includes('\ufffd')) {
      return { content, encoding: 'utf8' };
    }
  } catch (e) {
    // Fall through to other encodings
  }
  
  // Try Windows-1252 (common for game files)
  try {
    const content = buffer.toString('latin1');
    return { content, encoding: 'windows-1252' };
  } catch (e) {
    throw new Error('Unable to detect file encoding');
  }
}

/**
 * Parse sections from content
 */
function parseSections(content: string): Map<string, string> {
  const sections = new Map<string, string>();
  
  // Remove comments
  const cleanContent = content.split('\n')
    .map(line => {
      const commentIndex = line.indexOf('#');
      return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
    })
    .join('\n');
  
  // Match sections
  const sectionRegex = /(\w+)\s*\{([^}]*)\}/gs;
  let match;
  
  while ((match = sectionRegex.exec(cleanContent)) !== null) {
    const name = match[1].toLowerCase();
    const content = match[2].trim();
    sections.set(name, content);
  }
  
  return sections;
}

/**
 * Validate map structure
 */
function validateStructure(
  sections: Map<string, string>,
  result: ValidationResult
): void {
  // Check required sections
  const required = ['info', 'tiles', 'height'];
  for (const section of required) {
    if (!sections.has(section)) {
      result.errors.push({
        type: 'structure',
        message: `Missing required section: ${section}`
      });
    }
  }
  
  // Check for unknown sections
  const knownSections = [
    'info', 'tiles', 'height', 'resources', 'objectives',
    'buildings', 'vehicles', 'creatures', 'miners', 'blocks',
    'script', 'comments', 'briefing', 'briefingsuccess',
    'briefingfailure', 'landslidefrequency', 'lavaspread'
  ];
  
  for (const section of sections.keys()) {
    if (!knownSections.includes(section)) {
      result.warnings.push({
        type: 'compatibility',
        message: `Unknown section: ${section}`,
        section
      });
    }
  }
}

/**
 * Validate individual section
 */
function validateSection(
  name: string,
  content: string,
  allSections: Map<string, string>,
  result: ValidationResult
): void {
  switch (name) {
    case 'info':
      validateInfoSection(content, result);
      break;
    case 'tiles':
      validateGridSection(name, content, allSections, result, 1, 165);
      break;
    case 'height':
      validateGridSection(name, content, allSections, result, 0, 15);
      break;
    case 'resources':
      validateResourcesSection(content, allSections, result);
      break;
    case 'objectives':
      validateObjectivesSection(content, result);
      break;
    case 'script':
      validateScriptSection(content, result);
      break;
    case 'buildings':
    case 'vehicles':
    case 'creatures':
    case 'miners':
      validateEntitySection(name, content, result);
      break;
  }
}

/**
 * Validate info section
 */
function validateInfoSection(content: string, result: ValidationResult): void {
  const lines = content.split('\n').filter(l => l.trim());
  const info: any = {};
  
  for (const line of lines) {
    const match = line.match(/(\w+)\s*:\s*(.+);?/);
    if (!match) {
      result.errors.push({
        type: 'content',
        message: 'Invalid info line format',
        section: 'info'
      });
      continue;
    }
    
    const [, key, value] = match;
    info[key] = value.replace(/;$/, '').trim();
  }
  
  // Check required fields
  if (!info.rowcount || !info.colcount) {
    result.errors.push({
      type: 'content',
      message: 'Missing rowcount or colcount in info section',
      section: 'info'
    });
  }
  
  // Validate dimensions
  const rows = parseInt(info.rowcount);
  const cols = parseInt(info.colcount);
  
  if (isNaN(rows) || isNaN(cols) || rows < 5 || cols < 5 || rows > 200 || cols > 200) {
    result.errors.push({
      type: 'content',
      message: `Invalid map dimensions: ${rows}x${cols}`,
      section: 'info'
    });
  }
  
  // Check biome
  const validBiomes = ['rock', 'ice', 'lava'];
  if (info.biome && !validBiomes.includes(info.biome)) {
    result.warnings.push({
      type: 'content',
      message: `Unknown biome: ${info.biome}`,
      section: 'info'
    });
  }
}

/**
 * Validate grid section (tiles, height, blocks)
 */
function validateGridSection(
  name: string,
  content: string,
  allSections: Map<string, string>,
  result: ValidationResult,
  minValue: number,
  maxValue: number
): void {
  const info = parseInfo(allSections.get('info') || '');
  const expectedRows = parseInt(info.rowcount);
  const expectedCols = parseInt(info.colcount);
  
  if (isNaN(expectedRows) || isNaN(expectedCols)) {
    return; // Info already invalid
  }
  
  const lines = content.split('\n').filter(l => l.trim());
  
  // Check row count
  if (lines.length !== expectedRows) {
    result.errors.push({
      type: 'content',
      message: `${name} has ${lines.length} rows, expected ${expectedRows}`,
      section: name
    });
  }
  
  // Check each row
  for (let i = 0; i < lines.length; i++) {
    const values = lines[i].split(',').filter(v => v.trim());
    
    // Check column count
    if (values.length !== expectedCols) {
      result.errors.push({
        type: 'content',
        message: `${name} row ${i + 1} has ${values.length} values, expected ${expectedCols}`,
        section: name,
        line: i + 1
      });
    }
    
    // Validate values
    for (let j = 0; j < values.length; j++) {
      const value = parseInt(values[j]);
      
      if (isNaN(value)) {
        result.errors.push({
          type: 'content',
          message: `Invalid value at [${i},${j}]: ${values[j]}`,
          section: name,
          line: i + 1
        });
      } else if (value < minValue || value > maxValue) {
        // Special case for tiles - some gaps in valid IDs
        if (name === 'tiles' && !isValidTileId(value)) {
          result.errors.push({
            type: 'content',
            message: `Invalid tile ID at [${i},${j}]: ${value}`,
            section: name,
            line: i + 1
          });
        } else if (name !== 'tiles') {
          result.errors.push({
            type: 'content',
            message: `Value out of range at [${i},${j}]: ${value} (must be ${minValue}-${maxValue})`,
            section: name,
            line: i + 1
          });
        }
      }
    }
  }
}

/**
 * Validate resources section
 */
function validateResourcesSection(
  content: string,
  allSections: Map<string, string>,
  result: ValidationResult
): void {
  const subsections = content.split(/(\w+):/);
  
  for (let i = 1; i < subsections.length; i += 2) {
    const type = subsections[i];
    const data = subsections[i + 1];
    
    if (!['crystals', 'ore', 'studs'].includes(type)) {
      result.warnings.push({
        type: 'content',
        message: `Unknown resource type: ${type}`,
        section: 'resources'
      });
    }
    
    // Validate as binary grid
    validateGridSection(
      `resources.${type}`,
      data,
      allSections,
      result,
      0,
      1
    );
  }
}

/**
 * Validate objectives section
 */
function validateObjectivesSection(
  content: string,
  result: ValidationResult
): void {
  const lines = content.split('\n').filter(l => l.trim());
  
  for (const line of lines) {
    const parts = line.split(':');
    if (parts.length < 2) {
      result.warnings.push({
        type: 'content',
        message: `Invalid objective format: ${line}`,
        section: 'objectives'
      });
      continue;
    }
    
    const type = parts[0].trim();
    const validTypes = [
      'building', 'resources', 'variable',
      'discovertile', 'findbuilding'
    ];
    
    if (!validTypes.includes(type)) {
      result.warnings.push({
        type: 'content',
        message: `Unknown objective type: ${type}`,
        section: 'objectives'
      });
    }
  }
}

/**
 * Validate script section
 */
function validateScriptSection(
  content: string,
  result: ValidationResult
): void {
  // Basic syntax checks
  const lines = content.split('\n');
  let inEventChain = false;
  const declaredVars = new Set<string>();
  const usedVars = new Set<string>();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;
    
    // Variable declaration
    const varMatch = line.match(/^(int|float|bool|string|arrow|timer)\s+(\w+)/);
    if (varMatch) {
      declaredVars.add(varMatch[2]);
      continue;
    }
    
    // Event chain
    if (line.endsWith('::')) {
      inEventChain = true;
      continue;
    }
    
    // Variable usage
    const varUsage = line.match(/(\w+):/);
    if (varUsage && !inEventChain) {
      usedVars.add(varUsage[1]);
    }
    
    // Check for spaces (common error)
    if (line.includes(' :') || line.includes(': ')) {
      result.warnings.push({
        type: 'style',
        message: 'Spaces around colons may cause issues',
        section: 'script',
        line: i + 1
      });
    }
  }
  
  // Check undefined variables
  for (const used of usedVars) {
    if (!declaredVars.has(used) && !isBuiltinVariable(used)) {
      result.warnings.push({
        type: 'content',
        message: `Possibly undefined variable: ${used}`,
        section: 'script'
      });
    }
  }
}

/**
 * Validate entity sections
 */
function validateEntitySection(
  name: string,
  content: string,
  result: ValidationResult
): void {
  const lines = content.split('\n').filter(l => l.trim());
  let entityCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for class name
    if (line.endsWith('_C')) {
      entityCount++;
      
      // Validate class name
      const validPrefix = {
        'buildings': 'Building',
        'vehicles': 'Vehicle',
        'creatures': 'Creature',
        'miners': 'Miner'
      };
      
      const prefix = validPrefix[name];
      if (prefix && !line.startsWith(prefix)) {
        result.warnings.push({
          type: 'content',
          message: `Unexpected class name: ${line}`,
          section: name,
          line: i + 1
        });
      }
    }
  }
  
  if (entityCount === 0) {
    result.warnings.push({
      type: 'content',
      message: `Empty ${name} section`,
      section: name
    });
  }
}

/**
 * Validate cross-references between sections
 */
function validateCrossReferences(
  sections: Map<string, string>,
  result: ValidationResult
): void {
  // Check that tiles referenced in objectives exist
  const objectives = sections.get('objectives');
  if (objectives) {
    const discoverMatches = objectives.matchAll(/discovertile:\s*(\d+),(\d+)/g);
    const info = parseInfo(sections.get('info') || '');
    
    for (const match of discoverMatches) {
      const row = parseInt(match[1]);
      const col = parseInt(match[2]);
      
      if (row >= parseInt(info.rowcount) || col >= parseInt(info.colcount)) {
        result.errors.push({
          type: 'content',
          message: `Objective references invalid tile: ${row},${col}`,
          section: 'objectives'
        });
      }
    }
  }
  
  // Check building requirements
  const buildings = sections.get('buildings');
  const hasToolStore = buildings && buildings.includes('BuildingToolStore_C');
  
  if (!hasToolStore) {
    result.warnings.push({
      type: 'balance',
      message: 'No Tool Store found - map may not be playable'
    });
  }
}

/**
 * Analyze gameplay balance
 */
function analyzeGameplay(
  sections: Map<string, string>,
  result: ValidationResult
): void {
  const tiles = sections.get('tiles');
  if (!tiles) return;
  
  // Count resources
  const crystalCount = (tiles.match(/42|142/g) || []).length;
  const oreCount = (tiles.match(/46|146/g) || []).length;
  
  if (crystalCount < 5) {
    result.warnings.push({
      type: 'balance',
      message: 'Very few crystal deposits found'
    });
  }
  
  // Check for hazards
  const lavaCount = (tiles.match(/6|7/g) || []).length;
  const info = parseInfo(sections.get('info') || '');
  const totalTiles = parseInt(info.rowcount) * parseInt(info.colcount);
  
  if (lavaCount / totalTiles > 0.3) {
    result.warnings.push({
      type: 'balance',
      message: 'High proportion of lava tiles may make map very difficult'
    });
  }
  
  // Check script complexity
  const script = sections.get('script');
  if (script && script.length > 10000) {
    result.warnings.push({
      type: 'performance',
      message: 'Large script section may impact performance'
    });
  }
}

/**
 * Collect map statistics
 */
function collectStats(sections: Map<string, string>): MapStats {
  const info = parseInfo(sections.get('info') || '');
  const tiles = sections.get('tiles');
  const script = sections.get('script');
  
  const stats: MapStats = {
    sections: Array.from(sections.keys()),
    tileCount: 0
  };
  
  if (info.rowcount && info.colcount) {
    stats.dimensions = {
      width: parseInt(info.colcount),
      height: parseInt(info.rowcount)
    };
    stats.tileCount = stats.dimensions.width * stats.dimensions.height;
  }
  
  if (tiles) {
    const crystals = (tiles.match(/42|142/g) || []).length;
    const ore = (tiles.match(/46|146/g) || []).length;
    stats.resourceCount = crystals + ore;
  }
  
  if (script) {
    stats.scriptSize = script.length;
  }
  
  return stats;
}

/**
 * Helper functions
 */
function parseInfo(content: string): any {
  const info: any = {};
  const lines = content.split('\n').filter(l => l.trim());
  
  for (const line of lines) {
    const match = line.match(/(\w+)\s*:\s*(.+);?/);
    if (match) {
      info[match[1]] = match[2].replace(/;$/, '').trim();
    }
  }
  
  return info;
}

function isValidTileId(id: number): boolean {
  // Valid tile IDs have some gaps
  if (id >= 1 && id <= 14) return true;
  if (id >= 26 && id <= 165) return true;
  return false;
}

function isBuiltinVariable(name: string): boolean {
  const builtins = [
    'crystals', 'ore', 'studs', 'time', 'air',
    'buildings', 'vehicles', 'creatures', 'miners'
  ];
  return builtins.includes(name);
}

/**
 * Generate validation report
 */
export function generateValidationReport(summary: BatchValidationSummary): string {
  let report = '=== MAP VALIDATION REPORT ===\n\n';
  
  // Summary
  report += 'SUMMARY:\n';
  report += `  Total Files: ${summary.totalFiles}\n`;
  report += `  Valid: ${summary.validFiles} (${(summary.validFiles / summary.totalFiles * 100).toFixed(1)}%)\n`;
  report += `  Invalid: ${summary.invalidFiles}\n`;
  report += `  Total Errors: ${summary.totalErrors}\n`;
  report += `  Total Warnings: ${summary.totalWarnings}\n\n`;
  
  // Common errors
  if (summary.commonErrors.size > 0) {
    report += 'COMMON ERRORS:\n';
    const sorted = Array.from(summary.commonErrors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    for (const [error, count] of sorted) {
      report += `  ${error} (${count} occurrences)\n`;
    }
    report += '\n';
  }
  
  // Failed files
  const failed = summary.fileResults.filter(r => !r.valid);
  if (failed.length > 0) {
    report += 'FAILED FILES:\n';
    for (const result of failed) {
      report += `  ${path.basename(result.file)}:\n`;
      for (const error of result.errors.slice(0, 3)) {
        report += `    - ${error.message}\n`;
      }
      if (result.errors.length > 3) {
        report += `    ... and ${result.errors.length - 3} more errors\n`;
      }
    }
    report += '\n';
  }
  
  // Warnings summary
  const withWarnings = summary.fileResults.filter(r => r.warnings.length > 0);
  if (withWarnings.length > 0) {
    report += 'FILES WITH WARNINGS:\n';
    for (const result of withWarnings.slice(0, 10)) {
      report += `  ${path.basename(result.file)}: ${result.warnings.length} warnings\n`;
    }
    if (withWarnings.length > 10) {
      report += `  ... and ${withWarnings.length - 10} more files\n`;
    }
  }
  
  return report;
}

/**
 * Example usage
 */
export async function exampleUsage() {
  console.log('=== Batch Map Validation Example ===\n');
  
  // Validate a directory of maps
  const mapsDir = './maps';
  
  try {
    const summary = await validateMapBatch(mapsDir, {
      recursive: true,
      detailed: true
    });
    
    const report = generateValidationReport(summary);
    console.log(report);
    
    // Save detailed results
    await fs.promises.writeFile(
      'validation-results.json',
      JSON.stringify(summary, null, 2)
    );
    
    console.log('\nDetailed results saved to validation-results.json');
    
    // Exit with error code if any maps failed
    if (summary.invalidFiles > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Validation failed:', error);
    process.exit(1);
  }
}

// Run example if called directly
if (require.main === module) {
  exampleUsage();
}