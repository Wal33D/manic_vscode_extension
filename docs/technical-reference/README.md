# Manic Miners Map Reference Implementations

This directory contains three reference implementations for working with Manic Miners map files (`.dat` format). These codebases serve as examples and documentation for understanding the map file format and various operations that can be performed on map data.

## Overview

### 📁 Directory Structure

```
map-reference-implementations/
├── map-generator/      # Procedural map generation tool
├── map-parser/         # Comprehensive map file parser
└── map-visualizer/     # Map visualization and analysis tools
```

## 🎯 Purpose

These reference implementations are maintained as examples for:
- Understanding the Manic Miners `.dat` file format
- Learning different approaches to map manipulation
- Providing code examples for VSCode extension development
- Documenting map data structures and algorithms

**Note:** These are reference implementations only - they are not integrated into the VSCode extension directly.

## 📚 Components

### 1. Map Generator (`map-generator/`)
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
| 0 | GROUND | Walkable floor | Can build |
| 1 | SOLID_ROCK | Basic wall | Drillable |
| 2 | HARD_ROCK | Reinforced wall | Slow drilling |
| 3 | LOOSE_ROCK | Unstable wall | May collapse |
| 4 | DIRT | Soft material | Fast drilling |
| 5 | ORE_SEAM | Ore deposit | Yields 1-5 ore |
| 6 | CRYSTAL_SEAM | Energy crystal | Yields 1 crystal |
| 7 | RECHARGE_SEAM | Recharge point | Heals units |
| 8 | LAVA | Molten rock | Instant death |
| 9 | WATER | Deep water | Impassable |
| 10 | EROSION | Spreading lava | Expands slowly |
| 11 | SLUGHOLE | Monster spawn | Enemies emerge |
| 12 | RUBBLE | Debris pile | Must clear |
| 13 | REINFORCED | Steel wall | Unbreakable |
| 14 | POWER_PATH | Power cable | Conducts energy |
| 25 | CAVERN_FLOOR | Natural cave | Pre-excavated |
| 30 | SOLID_BORDER | Map edge | Cannot pass |

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
// Valid IDs: 0-14, 16-18, 25, 30 (gaps exist!)

function isValidTileId(id: number): boolean {
  const validIds = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,16,17,18,25,30];
  return validIds.includes(id);
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

## 📖 Additional Resources

### Core Documentation
- [Common Patterns and Gotchas](common-patterns.md) - Essential patterns and pitfalls to avoid
- [Map Format Specification](../game-reference/format/overview.md) - Complete format documentation
- [Performance Guide](performance.md) - Optimization techniques

### Algorithm Documentation
- [Cave Generation](algorithms/cave-generation.md) - Procedural cave algorithms
- [Terrain Generation](algorithms/terrain-generation.md) - Biome-specific generation
- [Resource Placement](algorithms/resource-placement.md) - Strategic placement
- [Pathfinding](algorithms/pathfinding.md) - Navigation algorithms

### Code Examples
- [Parsing Examples](code-examples/parsing/) - Map file parsing
- [Generation Examples](code-examples/generation/) - Map creation
- [Visualization Examples](code-examples/visualization/) - Rendering maps
- [Utility Examples](code-examples/utilities/) - Helper functions

### Related Documentation
- [DAT Format Overview](../game-reference/format/overview.md) - File format details
- [Scripting Guide](../game-reference/scripting/overview.md) - Script programming
- [Quick Reference](../quick-reference/cheat-sheet.md) - Quick lookup
- [Extension User Guide](../extension/USER_GUIDE.md) - Using the VSCode extension

### Cross-Reference by Task

#### "I want to parse a map file"
1. Start with [Basic Parser Example](code-examples/parsing/basic-parser.ts)
2. Learn about [Parsing Patterns](parsing-patterns.md)
3. See [Validation Example](code-examples/parsing/validation.ts)

#### "I want to generate a map"
1. Start with [Simple Cave Example](code-examples/generation/simple-cave.ts)
2. Learn about [Cave Generation Algorithm](algorithms/cave-generation.md)
3. Try [Biome-Specific Generation](code-examples/generation/biome-specific.ts)

#### "I want to visualize a map"
1. Start with [PNG Renderer Example](code-examples/visualization/png-renderer.ts)
2. Learn about [Visualization Techniques](visualization-techniques.md)
3. Create [Thumbnails](code-examples/visualization/thumbnail.ts) or [Heat Maps](code-examples/visualization/heat-map.ts)

#### "I want to analyze a map"
1. Use [Map Analysis Tools](code-examples/utilities/analysis.ts)
2. Apply [Grid Operations](code-examples/utilities/grid-operations.ts)
3. Implement [Pathfinding](code-examples/utilities/pathfinding.ts)

---

For questions about the VSCode extension, see the [main project README](../../README.md).
For game format questions, see the [game reference documentation](../game-reference/README.md).