# Manic Miners Map Reference Implementations

This directory contains reference implementations and tools for working with Manic Miners map files (`.dat` format). These codebases serve as examples and documentation for understanding the map file format and various operations that can be performed on map data.

## Overview

### 📁 Directory Structure

```
map-reference-implementations/
├── groundhog-main/     # Advanced procedural map generator (NEW)
├── map-generator/      # Original procedural map generation tool
├── map-parser/         # Comprehensive map file parser
├── map-visualizer/     # Map visualization and analysis tools
└── COMMON-PATTERNS.md  # Essential patterns and pitfalls
```

## 🎯 Purpose

These reference implementations are maintained as examples for:
- Understanding the Manic Miners `.dat` file format
- Learning different approaches to map manipulation
- Providing code examples for VSCode extension development
- Documenting map data structures and algorithms

**Note:** These are reference implementations only - they are not integrated into the VSCode extension directly.

## 📚 Components

### 1. GroundHog Map Generator (`groundhog-main/`) 🆕
An advanced procedural map generator with sophisticated algorithms and web UI.

**Key Features:**
- Advanced cave generation with realistic terrain
- Sophisticated objective placement and balancing
- Built-in validation to ensure winnable maps
- Web-based UI with real-time preview
- Extensive customization parameters
- Event scripting and briefing generation
- Multiple biome support with biome-specific features

**Technologies:** TypeScript, React, Vite, Vitest

**Usage:**
```bash
cd groundhog-main
yarn install
yarn dev  # Runs at localhost:5173
```

[Full Documentation →](./groundhog-main/README.md)

### 2. Original Map Generator (`map-generator/`)
A TypeScript/React application that procedurally generates Manic Miners maps.

**Key Features:**
- Procedural terrain generation with caves, ore deposits, and crystals
- Support for different biomes (ice, rock, lava)
- Web UI for parameter configuration
- CLI tools for batch generation
- Exports directly to `.dat` format

**Technologies:** TypeScript, React, MobX, Canvas API

[Full Documentation →](./map-generator/README.md)

### 2. Map Parser (`map-parser/`)
A robust parser library for reading and manipulating Manic Miners map files.

**Key Features:**
- Complete parsing of all map sections
- Object-oriented data model
- Serialization/deserialization
- Built with Chevrotain parser generator

**Technologies:** TypeScript, Chevrotain, Lodash

[Full Documentation →](./map-parser/README.md)

### 3. Map Visualizer (`map-visualizer/`)
Tools for visualizing and analyzing existing map files.

**Key Features:**
- Generate PNG previews of maps
- Create thumbnail images
- Calculate map statistics
- Analyze resource distribution
- Map integrity checking

**Technologies:** TypeScript, Sharp, Canvas

[Full Documentation →](./map-visualizer/README.md)

## 🗺️ Map File Format

All three implementations work with the Manic Miners `.dat` format, a text-based format that defines map layout, resources, objectives, and scripts.

### Format Overview

```
# Comments start with # and are ignored
# Sections can appear in any order
# Each section uses the format: sectionname{ ... }

info{
  rowcount:40              # Map height in tiles
  colcount:40              # Map width in tiles  
  biome:rock               # rock, ice, or lava
  creator:"Author Name"    # Optional: map creator
  name:"Map Title"         # Optional: map name
  version:1                # Optional: format version
}

tiles{
  # 2D array of tile type IDs
  # Rows are newline-separated, values are comma-separated
  1,1,1,1,1,1,1,1,1,1,
  1,0,0,0,0,0,0,0,0,1,
  1,0,5,5,0,0,6,0,0,1,
  // ... complete grid
}

height{
  # Elevation values 0-15 for each tile
  # Same format as tiles section
  5,5,5,5,5,5,5,5,5,5,
  5,4,4,4,4,4,4,4,4,5,
  5,4,3,3,3,3,3,3,4,5,
  // ... complete grid
}
```

### Complete Section Reference

#### Required Sections
- `info{}` - Map metadata (dimensions, biome)
- `tiles{}` - Terrain layout grid

#### Optional Sections
- `height{}` - Elevation data for 3D terrain
- `resources{}` - Crystal, ore, and stud placements
- `objectives{}` - Mission goals and win conditions
- `buildings{}` - Pre-placed structures
- `vehicles{}` - Vehicle spawn points
- `creatures{}` - Monster/enemy spawns
- `blocks{}` - Special terrain blocks
- `briefing{}` - Mission briefing text
- `script{}` - Map event scripting

### Tile Type Reference

| ID | Type | Description | Properties |
|----|------|-------------|------------|
| 1 | GROUND | Walkable floor | Can build |
| 2-5 | RUBBLE_1-4 | Debris piles | Levels 1-4, must clear |
| 6 | LAVA | Molten rock | Instant death |
| 8 | SOLID_ROCK | Basic wall | Medium drilling |
| 9 | HARD_ROCK | Harder wall | Slow drilling |
| 10 | LOOSE_ROCK | Soft wall | Fast drilling |
| 11 | WATER | Deep water | Impassable |
| 12 | SLUGHOLE | Monster spawn | Enemies emerge |
| 13 | EROSION | Spreading lava | Expands over time |
| 14-25 | POWER_PATH | Power cable variants | Conducts energy |
| 26 | DIRT | Soft material | Very fast drilling |
| 29 | UNDISCOVERED_CAVERN | Hidden cave | Reveals when drilled |
| 30 | CAVERN_FLOOR | Natural cave | Pre-excavated |
| 34 | RECHARGE_SEAM | Energy seam | Heals units |
| 35-45 | CRYSTAL_SEAM | Crystal deposits | Yield levels |
| 42-45 | CRYSTAL_SEAM_HIGH | High yield crystals | 3-5 crystals |
| 46-49 | ORE_SEAM | Ore deposits | Various yields |
| 48-55 | ORE_SEAM_HIGH | High yield ore | 3-5 ore |
| 56-62 | REINFORCED_ROCK | Reinforced walls | Very slow drilling |
| 63 | SOLID_ROCK | Unbreakable | Cannot drill |
| 64-100 | REINFORCED_VARIANTS | Various reinforced | Different hardness |
| 101+ | SPECIAL_TILES | Building foundations | Pre-placed structures |

### Coordinate System

```
Origin (0,0) is top-left corner
X increases rightward (column)
Y increases downward (row)

Example 5x5 grid:
  X: 0   1   2   3   4
Y
0   [0,0][1,0][2,0][3,0][4,0]
1   [0,1][1,1][2,1][3,1][4,1]  
2   [0,2][1,2][2,2][3,2][4,2]
3   [0,3][1,3][2,3][3,3][4,3]
4   [0,4][1,4][2,4][3,4][4,4]
```

### Example: Minimal Valid Map

```
info{
  rowcount:10
  colcount:10
  biome:rock
}

tiles{
  30,30,30,30,30,30,30,30,30,30,
  30,1,1,1,1,1,1,1,1,30,
  30,1,0,0,0,0,0,0,1,30,
  30,1,0,0,0,0,0,0,1,30,
  30,1,0,0,0,0,0,0,1,30,
  30,1,0,0,0,0,0,0,1,30,
  30,1,0,0,0,0,0,0,1,30,
  30,1,0,0,0,0,0,0,1,30,
  30,1,1,1,1,1,1,1,1,30,
  30,30,30,30,30,30,30,30,30,30,
}
```

## 🚀 VSCode Extension Integration

While these are reference implementations, the VSCode extension incorporates many concepts from these tools:

### Current Extension Features

1. **Visual Map Editor**
   - Tile painting with brush sizes
   - Auto-tiling system
   - Layer support with opacity
   - Undo/redo functionality
   - Real-time validation
   - Minimap navigation

2. **Map Analysis Tools**
   - Accessibility validation
   - Resource distribution heatmaps
   - Path finding visualization
   - Statistical analysis
   - Performance optimization

3. **Enhanced Editing**
   - IntelliSense for all sections
   - Quick actions and fixes
   - Snippet support
   - Keyboard shortcuts
   - Command palette integration

4. **Validation & Testing**
   - Comprehensive error checking
   - Auto-fix suggestions
   - Playability analysis
   - Golden file testing

### Extension Architecture

The VSCode extension uses concepts from these reference implementations:

```typescript
// From map-parser: Structured data handling
import { DatFile, TileGrid } from '../types/datFileTypes';

// From map-visualizer: Rendering logic
import { MapRenderer } from '../mapEditor/mapRenderer';

// From map-generator: Validation patterns
import { MapAccessibilityValidator } from '../validation/mapAccessibilityValidator';
```

## 🔧 Common Use Cases

### For VSCode Extension Development

1. **Understanding File Format**
   - Study `map-parser/src/lexer.ts` for tokenization
   - Review `map-parser/src/map-section.ts` for section handling
   - Check format specifications in parser README

2. **Validation Logic**
   - Reference `map-visualizer/analysis/mapIntegrityCheck.ts`
   - See validation rules in `map-parser/src/map.ts`
   - Use parser's built-in validation methods

3. **Visualization**
   - Learn from `map-visualizer/renderer/generatePNGImage.ts`
   - Study color mappings in `colorMap.ts`
   - Understand coordinate transformations

4. **Data Structures**
   - Grid handling in `map-parser/src/grid.ts`
   - Section classes for type safety
   - Serialization patterns

### For Map Creation

1. **Procedural Generation**
   ```typescript
   // Generate a new map
   import { generateMap } from './map-generator/core/map-generator';
   const map = generateMap({
     width: 40,
     height: 40,
     biome: 'rock',
     caveComplexity: 0.6
   });
   ```

2. **Manual Editing**
   ```typescript
   // Parse, modify, save
   import { parseMap } from './map-parser/src/map';
   const map = parseMap(fileContent);
   map.tiles.set(10, 10, TileType.CRYSTAL_SEAM);
   const output = map.serialize();
   ```

3. **Batch Analysis**
   ```typescript
   // Analyze map collection
   import { analyzeMapSet } from './map-visualizer/analysis';
   const stats = await analyzeMapSet(mapFiles);
   console.log(`Average crystals: ${stats.avgCrystals}`);
   ```

### Common Patterns and Gotchas

#### Pattern: Safe Map Loading
```typescript
// Always validate after loading
function loadMapSafely(content: string) {
  try {
    const map = parseMap(content);
    const validation = map.validate();
    if (!validation.isValid) {
      console.warn('Map has issues:', validation.errors);
    }
    return map;
  } catch (error) {
    console.error('Failed to parse map:', error);
    return null;
  }
}
```

#### Pattern: Resource Counting
```typescript
// Count all resource types
function countAllResources(map: MapData) {
  let crystals = 0, ore = 0;
  
  // Check tile-based resources
  map.tiles.forEach((row, y) => {
    row.forEach((tile, x) => {
      if (tile === TileType.CRYSTAL_SEAM) crystals++;
      if (tile === TileType.ORE_SEAM) ore++;
    });
  });
  
  // Add explicit resources
  crystals += map.resources?.crystals?.length || 0;
  ore += map.resources?.ore?.reduce((sum, o) => sum + o.amount, 0) || 0;
  
  return { crystals, ore };
}
```

#### Gotcha: Coordinate Systems
```typescript
// ⚠️ Common mistake: X/Y confusion
// Tiles are stored as [row][col] but often accessed as (x,y)

// Wrong:
const tile = map.tiles[x][y]; // This swaps coordinates!

// Correct:
const tile = map.tiles.get(y, x); // Row first, then column
// Or:
const tile = map.tiles[y][x]; // If using raw arrays
```

#### Gotcha: Tile ID Validation
```typescript
// ⚠️ Not all tile IDs are sequential
// The extension now supports 165+ tile types!

function isValidTileId(id: number): boolean {
  // Basic terrain tiles: 1-63
  if (id >= 1 && id <= 63) return true;
  
  // Reinforced variants: 64-100
  if (id >= 64 && id <= 100) return true;
  
  // Special tiles: 101-165
  if (id >= 101 && id <= 165) return true;
  
  return false;
}

// Better approach - use the tile definition system
import { getTileInfo } from './tileDefinitions';
const tileInfo = getTileInfo(id);
if (tileInfo) {
  // Valid tile with metadata
}
```

#### Gotcha: Section Order
```typescript
// ⚠️ Sections can appear in any order
// Don't assume info{} comes first

// Wrong:
const firstSection = mapContent.split('{')[0];
if (firstSection !== 'info') throw Error('Invalid');

// Correct:
const sections = parseAllSections(mapContent);
if (!sections.has('info')) throw Error('Missing info');
```

## 📝 Important Notes

### Development Notes
- Each component has its own dependencies and build process
- Code is provided as-is for reference purposes  
- Some implementations may have overlapping functionality
- Focus is on clarity and documentation over optimization
- These are reference implementations - not production-ready libraries

### Technical Considerations

1. **Memory Usage**
   - Parser: ~2.5x file size in memory
   - Generator: ~100 bytes per tile
   - Visualizer: ~4 bytes per pixel

2. **Performance**
   - Small maps (< 40x40): < 100ms total processing
   - Medium maps (40-80): 100-500ms
   - Large maps (> 80x80): 500ms-2s

3. **Compatibility**
   - Node.js 14+ required
   - TypeScript 4.0+ for development
   - Modern browser for generator UI

### Best Practices

1. **Always validate generated maps**
   ```typescript
   const map = generateMap(params);
   const issues = mapIntegrityCheck(map);
   if (issues.length > 0) {
     // Handle validation failures
   }
   ```

2. **Handle encoding properly**
   ```typescript
   // Maps may use different encodings
   const content = fs.readFileSync(file, 'utf-8');
   // Parser auto-detects encoding when needed
   ```

3. **Check resource limits**
   ```typescript
   // Ensure playable maps
   const MIN_CRYSTALS = 10;
   const resources = countResources(map);
   if (resources.crystals < MIN_CRYSTALS) {
     // Add more crystals or warn user
   }
   ```

## 🤝 Contributing

When adding new reference implementations:

1. **Create a new directory at the root level**
   ```
   map-reference-implementations/
   └── your-new-tool/
       ├── README.md
       ├── src/
       ├── package.json
       └── tsconfig.json
   ```

2. **Include a comprehensive README.md**
   - Clear purpose statement
   - Feature list
   - Installation instructions
   - Usage examples with code
   - API documentation
   - Known limitations

3. **Document the purpose and key algorithms**
   - Explain why this tool exists
   - Detail any unique algorithms
   - Include complexity analysis
   - Reference papers/sources if applicable

4. **Provide usage examples**
   ```typescript
   // Show common use cases
   // Include error handling
   // Demonstrate all major features
   ```

5. **Keep dependencies minimal and well-documented**
   - Justify each dependency
   - Use popular, maintained packages
   - Document version requirements
   - Avoid platform-specific code

### Code Standards

- Use TypeScript with strict mode
- Follow existing naming conventions
- Add JSDoc comments to exports
- Include type definitions
- Write self-documenting code

### Documentation Standards

- Use clear, concise language
- Include code examples for every feature
- Add diagrams where helpful
- Keep README under 1000 lines
- Update this main README when adding tools

## 🎮 Advanced Features

### Script Generation (GroundHog)
GroundHog can generate sophisticated event scripts:

```typescript
// Example: Dynamic difficulty adjustment
script{
  event:onInit
  command:setVar difficulty 1
  
  event:onTimer 300
  command:if crystals > 50
  command:setVar difficulty 2
  command:spawnCreature slug 10 10
  
  event:onBuildingComplete
  command:showMessage "Well done!"
}
```

### Map Templates (Extension)
The extension provides template support:

```typescript
// Save current selection as template
const template = {
  name: "Crystal Cave",
  tiles: selectedTiles,
  resources: selectedResources,
  tags: ["cave", "crystals", "medium"]
};
```

### Accessibility Analysis
Both the extension and reference implementations include pathfinding:

```typescript
// Check if objective is reachable
const validator = new MapAccessibilityValidator();
const result = validator.validate(datFile);
if (!result.isValid) {
  console.error("Unreachable objectives:", result.errors);
}
```

## 📊 Performance Considerations

### Map Size Limits
- Small (< 40x40): Instant processing
- Medium (40-100): < 1 second
- Large (100-200): 1-5 seconds  
- Huge (200+): May require optimization

### Memory Usage
```typescript
// Estimate memory for large maps
const estimateMemory = (width: number, height: number) => {
  const tiles = width * height * 4; // 4 bytes per tile
  const rendering = width * height * 16 * 16 * 4; // Canvas pixels
  const overhead = (tiles + rendering) * 0.3; // Data structures
  return tiles + rendering + overhead;
};
```

## 🔄 Recent Updates

### VSCode Extension (v0.3.0+)
- 165+ tile types with full metadata
- Professional UI with dashboard
- Map editor with layers and animation
- Comprehensive validation system
- Performance optimizations for large maps
- Command palette integration
- Keyboard shortcuts system

### GroundHog Integration
- Advanced procedural generation algorithms
- Sophisticated objective balancing
- Event scripting support
- Web-based preview interface

## 📖 Additional Resources

- [Common Patterns and Gotchas](./COMMON-PATTERNS.md) - Essential patterns and pitfalls to avoid
- [Map Format Specification](#-map-file-format) - Detailed format documentation  
- [GroundHog Documentation](./groundhog-main/README.md) - Advanced generation
- [Extension Commands Reference](../README.md#commands) - All available commands
- Component-specific documentation in each subdirectory

## 🤝 Community

- [Manic Miners Discord](https://discord.gg/manicminers) - Active community
- [GitHub Issues](https://github.com/Wal33D/vscode-manic-miners/issues) - Bug reports
- [GroundHog Web App](https://charredutensil.github.io/groundhog/) - Try it online

---

For questions about the VSCode extension, see the main project README.
For questions about these reference implementations, check each component's documentation.