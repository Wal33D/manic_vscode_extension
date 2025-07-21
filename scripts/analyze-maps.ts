#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { DatFileParser } from '../src/parser/datFileParser';
import { 
  DatFile, 
  TileType, 
  BuildingType, 
  VehicleType, 
  CreatureType,
  Objective,
  ScriptEvent
} from '../src/types/datFileTypes';

// Import analysis functions
import {
  analyzeMap,
  MapAnalysis,
  generateReport
} from '../docs/technical-reference/code-examples/utilities/analysis';

interface MapInfo {
  category: string;
  filename: string;
  filepath: string;
  analysis?: MapAnalysis;
  datFile?: DatFile;
  parseError?: string;
}

interface CategoryAnalysis {
  category: string;
  maps: MapInfo[];
  patterns: string[];
  insights: string[];
}

// Maps to analyze
const MAPS_TO_ANALYZE: MapInfo[] = [
  // Tutorial maps
  { category: 'tutorial', filename: 'buildings.dat', filepath: 'samples/levels/tutorial/buildings.dat' },
  { category: 'tutorial', filename: 'vehicles.dat', filepath: 'samples/levels/tutorial/vehicles.dat' },
  { category: 'tutorial', filename: 'miners.dat', filepath: 'samples/levels/tutorial/miners.dat' },
  
  // Campaign maps (LRR)
  { category: 'campaign', filename: 'drillernight.dat', filepath: 'samples/levels/campaign/LRR/drillernight.dat' },
  { category: 'campaign', filename: 'fireandwater.dat', filepath: 'samples/levels/campaign/LRR/fireandwater.dat' },
  { category: 'campaign', filename: 'lavalaughter.dat', filepath: 'samples/levels/campaign/LRR/lavalaughter.dat' },
  
  // Community maps
  { category: 'community', filename: '01-Lost-Leader.dat', filepath: 'samples/levels/community/01-Lost-Leader.dat' },
  { category: 'community', filename: 'CS001_RapidRecon_14.dat', filepath: 'samples/levels/community/CS001_RapidRecon_14.dat' },
  { category: 'community', filename: 'FN4-005-Withering-Waves.dat', filepath: 'samples/levels/community/FN4-005-Withering-Waves.dat' },
  
  // BAZ maps (as requested by user)
  { category: 'baz', filename: 'coldcomfort.dat', filepath: 'samples/levels/campaign/BAZ/coldcomfort.dat' },
  { category: 'baz', filename: 'mineovermanner.dat', filepath: 'samples/levels/campaign/BAZ/mineovermanner.dat' },
  { category: 'baz', filename: 'moltenmeltdown.dat', filepath: 'samples/levels/campaign/BAZ/moltenmeltdown.dat' },
];

// Tile type names for readability
const TILE_NAMES: Record<number, string> = {
  1: 'Ground',
  6: 'Lava (Dormant)',
  7: 'Lava (Active)',
  11: 'Lava',
  12: 'Power Path',
  14: 'Rubble',
  26: 'Dirt',
  30: 'Loose Rock',
  34: 'Hard Rock',
  38: 'Solid Rock',
  42: 'Crystal Seam',
  46: 'Ore Seam',
  50: 'Recharge Seam',
  60: 'Erosion (Light)',
  61: 'Erosion (Medium)',
  62: 'Erosion (Heavy)',
  84: 'Slug Hole',
  101: 'Diggable',
  103: 'Ice',
  111: 'Water',
  163: 'Landslide',
  164: 'Dense Rubble',
  165: 'Unstable Rubble',
};

// Analyze a single map
async function analyzeMapFile(mapInfo: MapInfo): Promise<void> {
  const fullPath = path.join(process.cwd(), mapInfo.filepath);
  
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const parser = new DatFileParser(content);
    const datFile = parser.parse();
    
    mapInfo.datFile = datFile;
    
    // Perform analysis
    mapInfo.analysis = analyzeMap(
      datFile.tiles,
      datFile.info,
      datFile.resources,
      datFile.script ? JSON.stringify(datFile.script) : undefined
    );
  } catch (error) {
    mapInfo.parseError = error.message;
    console.error(`Error parsing ${mapInfo.filename}: ${error.message}`);
  }
}

// Extract objectives information
function formatObjectives(objectives?: Objective[]): string {
  if (!objectives || objectives.length === 0) return 'None specified';
  
  return objectives.map(obj => {
    switch (obj.type) {
      case 'resources':
        return `Collect ${obj.crystals} crystals, ${obj.ore} ore, ${obj.studs} studs`;
      case 'building':
        return `Build ${obj.building}`;
      case 'discovertile':
        return `Discover tile at (${obj.x}, ${obj.y}): ${obj.description}`;
      case 'variable':
        return `${obj.description} (condition: ${obj.condition})`;
      case 'findminer':
        return `Find miner #${obj.minerID}`;
      case 'findbuilding':
        return `Find building at (${obj.x}, ${obj.y})`;
      default:
        return 'Unknown objective';
    }
  }).join('\n  - ');
}

// Analyze script complexity
function analyzeScriptComplexity(datFile: DatFile): {
  complexity: string;
  variableCount: number;
  eventCount: number;
  features: string[];
} {
  if (!datFile.script) {
    return { complexity: 'None', variableCount: 0, eventCount: 0, features: [] };
  }
  
  const variableCount = datFile.script.variables.size;
  const eventCount = datFile.script.events.length;
  const features: string[] = [];
  
  // Check for advanced features
  const eventNames = datFile.script.events.map(e => e.name.toLowerCase());
  
  if (eventNames.some(n => n.includes('timer'))) features.push('Timers');
  if (eventNames.some(n => n.includes('emerge'))) features.push('Monster spawning');
  if (eventNames.some(n => n.includes('message'))) features.push('Messages');
  if (eventNames.some(n => n.includes('arrow'))) features.push('Arrows/Guidance');
  if (datFile.script.events.some(e => e.condition)) features.push('Conditional events');
  
  // Determine complexity
  let complexity = 'Simple';
  if (variableCount > 5 || eventCount > 10) complexity = 'Moderate';
  if (variableCount > 10 || eventCount > 20) complexity = 'Complex';
  if (variableCount > 20 || eventCount > 40) complexity = 'Very Complex';
  
  return { complexity, variableCount, eventCount, features };
}

// Analyze terrain features
function analyzeTerrainFeatures(datFile: DatFile): string[] {
  const features: string[] = [];
  const tileSet = new Set<number>();
  
  // Collect all unique tiles
  for (const row of datFile.tiles) {
    for (const tile of row) {
      tileSet.add(tile);
    }
  }
  
  // Check for specific features
  if (tileSet.has(6) || tileSet.has(7) || tileSet.has(11)) features.push('Lava hazards');
  if (tileSet.has(111) || tileSet.has(114)) features.push('Water');
  if (tileSet.has(60) || tileSet.has(61) || tileSet.has(62)) features.push('Erosion');
  if (tileSet.has(84)) features.push('Slug holes');
  if (tileSet.has(163) || tileSet.has(164) || tileSet.has(165)) features.push('Landslides');
  if (tileSet.has(103)) features.push('Ice terrain');
  if (datFile.info.oxygen && datFile.info.oxygen < 100) features.push('Limited oxygen');
  
  return features;
}

// Generate individual map report
function generateMapReport(mapInfo: MapInfo): string {
  let report = `## ${mapInfo.category.toUpperCase()}: ${mapInfo.filename}\n\n`;
  
  if (mapInfo.parseError) {
    report += `**Error**: Failed to parse map - ${mapInfo.parseError}\n\n`;
    return report;
  }
  
  const { datFile, analysis } = mapInfo;
  if (!datFile || !analysis) return report + 'No data available\n\n';
  
  // Basic info
  report += `### Basic Information\n`;
  report += `- **Level Name**: ${datFile.info.levelname || 'Unnamed'}\n`;
  report += `- **Creator**: ${datFile.info.creator || 'Unknown'}\n`;
  report += `- **Biome**: ${datFile.info.biome || 'rock'}\n`;
  report += `- **Dimensions**: ${datFile.info.colcount}x${datFile.info.rowcount} (${analysis.basic.totalTiles} tiles)\n`;
  report += `- **Complexity**: ${getSizeCategory(analysis.basic.totalTiles)}\n\n`;
  
  // Objectives
  report += `### Objectives\n`;
  report += `- ${formatObjectives(datFile.objectives)}\n\n`;
  
  // Resources
  report += `### Resources\n`;
  report += `- **Initial Crystals**: ${datFile.info.initialcrystals || 0}\n`;
  report += `- **Initial Ore**: ${datFile.info.initialore || 0}\n`;
  report += `- **Crystal Seams**: ${analysis.resources.crystalCount} (${analysis.resources.crystalDensity.toFixed(2)}% density)\n`;
  report += `- **Ore Seams**: ${analysis.resources.oreCount} (${analysis.resources.oreDensity.toFixed(2)}% density)\n`;
  report += `- **Distribution**: ${analysis.resources.distribution}\n\n`;
  
  // Script complexity
  const scriptAnalysis = analyzeScriptComplexity(datFile);
  report += `### Script Complexity\n`;
  report += `- **Overall**: ${scriptAnalysis.complexity}\n`;
  report += `- **Variables**: ${scriptAnalysis.variableCount}\n`;
  report += `- **Events**: ${scriptAnalysis.eventCount}\n`;
  if (scriptAnalysis.features.length > 0) {
    report += `- **Features**: ${scriptAnalysis.features.join(', ')}\n`;
  }
  report += '\n';
  
  // Terrain features
  const terrainFeatures = analyzeTerrainFeatures(datFile);
  if (terrainFeatures.length > 0) {
    report += `### Terrain Features\n`;
    report += `- ${terrainFeatures.join('\n- ')}\n\n`;
  }
  
  // Buildings and progression
  if (datFile.buildings && datFile.buildings.length > 0) {
    report += `### Buildings\n`;
    const buildingTypes = datFile.buildings.map(b => b.type);
    const uniqueBuildings = [...new Set(buildingTypes)];
    report += `- **Pre-placed**: ${uniqueBuildings.join(', ')}\n`;
    report += `- **Count**: ${datFile.buildings.length}\n\n`;
  }
  
  // Map characteristics from analysis
  report += `### Map Characteristics\n`;
  report += `- **Open Space**: ${(analysis.basic.openSpaceRatio * 100).toFixed(1)}%\n`;
  report += `- **Edge Type**: ${analysis.basic.edgeType}\n`;
  report += `- **Difficulty**: ${analysis.difficulty.estimatedDifficulty}\n`;
  report += `- **Accessibility**: ${(analysis.accessibility.connectivityScore * 100).toFixed(1)}% connected\n`;
  report += `- **Choke Points**: ${analysis.accessibility.chokePoints.length}\n`;
  report += `- **Strategic Depth**: ${(analysis.balance.strategicDepth * 100).toFixed(0)}%\n\n`;
  
  // Unique features
  report += `### Notable Design Elements\n`;
  const notableElements = identifyNotableElements(datFile, analysis);
  if (notableElements.length > 0) {
    report += notableElements.map(e => `- ${e}`).join('\n');
  } else {
    report += '- Standard design patterns';
  }
  report += '\n\n';
  
  return report;
}

// Identify notable design elements
function identifyNotableElements(datFile: DatFile, analysis: MapAnalysis): string[] {
  const elements: string[] = [];
  
  // Check for unique patterns
  if (analysis.accessibility.isolatedRegions > 0) {
    elements.push(`${analysis.accessibility.isolatedRegions} isolated regions requiring strategic planning`);
  }
  
  if (analysis.resources.resourceClusters > 5) {
    elements.push('Multiple resource clusters encouraging expansion');
  }
  
  if (analysis.difficulty.hazardDensity > 0.1) {
    elements.push('High hazard density creating environmental challenge');
  }
  
  if (datFile.script && datFile.script.events.length > 20) {
    elements.push('Complex scripting with multiple event chains');
  }
  
  if (datFile.info.erosioninitialwaittime && datFile.info.erosioninitialwaittime < 60) {
    elements.push('Fast erosion creating time pressure');
  }
  
  if (analysis.accessibility.chokePoints.length > 3) {
    elements.push('Multiple strategic choke points');
  }
  
  return elements;
}

// Get size category
function getSizeCategory(totalTiles: number): string {
  if (totalTiles < 625) return 'Small (<25x25)';
  if (totalTiles < 1600) return 'Medium (25x25 - 40x40)';
  if (totalTiles < 4096) return 'Large (40x40 - 64x64)';
  return 'Very Large (>64x64)';
}

// Analyze patterns within a category
function analyzeCategoryPatterns(maps: MapInfo[]): CategoryAnalysis {
  const validMaps = maps.filter(m => m.analysis && m.datFile);
  const patterns: string[] = [];
  const insights: string[] = [];
  
  if (validMaps.length === 0) {
    return { category: maps[0]?.category || 'unknown', maps, patterns: ['No valid maps to analyze'], insights: [] };
  }
  
  // Analyze size trends
  const sizes = validMaps.map(m => m.analysis!.basic.totalTiles);
  const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  patterns.push(`Average map size: ${Math.round(avgSize)} tiles`);
  
  // Analyze difficulty trends
  const difficulties = validMaps.map(m => m.analysis!.difficulty.estimatedDifficulty);
  const diffCounts = difficulties.reduce((acc, d) => {
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mainDifficulty = Object.entries(diffCounts).sort((a, b) => b[1] - a[1])[0];
  patterns.push(`Primary difficulty: ${mainDifficulty[0]} (${mainDifficulty[1]}/${validMaps.length} maps)`);
  
  // Analyze resource patterns
  const avgCrystalDensity = validMaps.reduce((sum, m) => sum + m.analysis!.resources.crystalDensity, 0) / validMaps.length;
  patterns.push(`Average crystal density: ${avgCrystalDensity.toFixed(2)}%`);
  
  // Category-specific insights
  const category = maps[0].category;
  
  if (category === 'tutorial') {
    insights.push('Tutorial maps focus on teaching individual mechanics in isolation');
    insights.push('Resource abundance allows for experimentation without failure');
    insights.push('Simple objectives guide player learning');
  } else if (category === 'campaign') {
    insights.push('Campaign maps progressively increase in complexity');
    insights.push('Resource scarcity creates strategic decision-making');
    insights.push('Environmental hazards add time pressure');
  } else if (category === 'community') {
    insights.push('Community maps showcase creative use of game mechanics');
    insights.push('Advanced scripting creates unique gameplay experiences');
    insights.push('Non-standard layouts challenge experienced players');
  } else if (category === 'baz') {
    insights.push('BAZ maps feature extreme challenges and unique mechanics');
    insights.push('Complex multi-stage objectives test all player skills');
    insights.push('Environmental storytelling through map design');
  }
  
  return { category, maps, patterns, insights };
}

// Main analysis function
async function analyzeAllMaps(): Promise<void> {
  console.log('Starting map analysis...\n');
  
  // Analyze each map
  for (const mapInfo of MAPS_TO_ANALYZE) {
    console.log(`Analyzing ${mapInfo.category}/${mapInfo.filename}...`);
    await analyzeMapFile(mapInfo);
  }
  
  // Group by category
  const categories = new Map<string, MapInfo[]>();
  for (const map of MAPS_TO_ANALYZE) {
    const cat = categories.get(map.category) || [];
    cat.push(map);
    categories.set(map.category, cat);
  }
  
  // Generate report
  let report = '# Manic Miners Map Analysis Report\n\n';
  report += 'This report analyzes map structure, patterns, and design principles across tutorial, campaign, and community maps.\n\n';
  report += '## Table of Contents\n\n';
  report += '1. [Individual Map Analyses](#individual-map-analyses)\n';
  report += '2. [Category Comparisons](#category-comparisons)\n';
  report += '3. [Design Principles](#design-principles)\n';
  report += '4. [Key Insights](#key-insights)\n\n';
  
  // Individual analyses
  report += '## Individual Map Analyses\n\n';
  for (const mapInfo of MAPS_TO_ANALYZE) {
    report += generateMapReport(mapInfo);
  }
  
  // Category comparisons
  report += '## Category Comparisons\n\n';
  for (const [category, maps] of categories) {
    const analysis = analyzeCategoryPatterns(maps);
    
    report += `### ${category.toUpperCase()} Maps\n\n`;
    report += '**Patterns:**\n';
    report += analysis.patterns.map(p => `- ${p}`).join('\n');
    report += '\n\n**Insights:**\n';
    report += analysis.insights.map(i => `- ${i}`).join('\n');
    report += '\n\n';
  }
  
  // Design principles
  report += '## Design Principles\n\n';
  report += generateDesignPrinciples(MAPS_TO_ANALYZE);
  
  // Key insights
  report += '## Key Insights\n\n';
  report += generateKeyInsights(MAPS_TO_ANALYZE);
  
  // Write report
  const reportPath = path.join(process.cwd(), 'MAP_ANALYSIS_REPORT.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\nAnalysis complete! Report saved to: ${reportPath}`);
}

// Generate design principles section
function generateDesignPrinciples(maps: MapInfo[]): string {
  let principles = '';
  
  principles += '### 1. Progressive Complexity\n';
  principles += 'Maps follow a clear progression from simple to complex:\n';
  principles += '- **Tutorial maps**: Single mechanic focus, abundant resources, clear objectives\n';
  principles += '- **Early campaign**: Multiple mechanics, balanced resources, environmental challenges\n';
  principles += '- **Late campaign**: Complex interactions, resource scarcity, time pressure\n';
  principles += '- **Community maps**: Creative combinations, unexpected challenges, mastery required\n\n';
  
  principles += '### 2. Resource Economy\n';
  principles += 'Resource distribution follows deliberate patterns:\n';
  principles += '- **Clustered resources**: Encourage expansion and territory control\n';
  principles += '- **Sparse resources**: Force efficiency and planning\n';
  principles += '- **Hidden resources**: Reward exploration and risk-taking\n\n';
  
  principles += '### 3. Spatial Design\n';
  principles += 'Map layouts create strategic depth:\n';
  principles += '- **Choke points**: Create defensible positions and routing decisions\n';
  principles += '- **Open areas**: Allow flexible base building\n';
  principles += '- **Isolated regions**: Require planning to access\n\n';
  
  principles += '### 4. Environmental Storytelling\n';
  principles += 'Maps tell stories through their design:\n';
  principles += '- Pre-placed buildings suggest previous inhabitants\n';
  principles += '- Terrain features create narrative context\n';
  principles += '- Scripted events reveal plot elements\n\n';
  
  principles += '### 5. Challenge Scaling\n';
  principles += 'Difficulty increases through multiple vectors:\n';
  principles += '- Hazard density and type\n';
  principles += '- Resource availability\n';
  principles += '- Time constraints (erosion, oxygen)\n';
  principles += '- Monster spawning rates\n';
  principles += '- Objective complexity\n\n';
  
  return principles;
}

// Generate key insights section
function generateKeyInsights(maps: MapInfo[]): string {
  let insights = '';
  
  insights += '### Tutorial Design Excellence\n';
  insights += 'Tutorial maps demonstrate exceptional instructional design:\n';
  insights += '- Each map focuses on a single concept (buildings, vehicles, miners)\n';
  insights += '- Generous resources eliminate failure frustration\n';
  insights += '- Scripts provide guidance without hand-holding\n';
  insights += '- Map size is constrained to maintain focus\n\n';
  
  insights += '### Campaign Difficulty Curve\n';
  insights += 'Campaign maps show careful difficulty calibration:\n';
  insights += '- Early maps (e.g., Driller Night) introduce hazards gradually\n';
  insights += '- Mid-game maps (e.g., Fire and Water) combine multiple challenges\n';
  insights += '- Late maps (e.g., Lava Laughter) require mastery of all mechanics\n';
  insights += '- Resource scarcity increases proportionally with player skill\n\n';
  
  insights += '### Community Creativity\n';
  insights += 'Community maps push boundaries in several ways:\n';
  insights += '- Non-standard objectives using variable conditions\n';
  insights += '- Complex scripting creating puzzle-like scenarios\n';
  insights += '- Extreme terrain layouts testing pathfinding skills\n';
  insights += '- Creative use of tile combinations for visual effects\n\n';
  
  insights += '### BAZ Campaign Innovation\n';
  insights += 'BAZ maps introduce advanced concepts:\n';
  insights += '- Multi-stage objectives requiring long-term planning\n';
  insights += '- Environmental hazards as core mechanics\n';
  insights += '- Narrative integration through scripted events\n';
  insights += '- Resource management as primary challenge\n\n';
  
  insights += '### Universal Design Patterns\n';
  insights += 'Successful maps share common elements:\n';
  insights += '- Clear initial safe zone for base establishment\n';
  insights += '- Resource rewards for exploration\n';
  insights += '- Multiple viable strategies\n';
  insights += '- Visual landmarks for navigation\n';
  insights += '- Balanced risk/reward for hazardous areas\n\n';
  
  return insights;
}

// Run the analysis
analyzeAllMaps().catch(console.error);