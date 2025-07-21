# Map Parser

A comprehensive parser library for reading, manipulating, and writing Manic Miners map files (.dat format).

## Overview

This TypeScript library provides a robust parser built with Chevrotain that can handle all sections of Manic Miners map files. It offers an object-oriented interface for working with map data programmatically.

## Features

### Complete Parsing Support
- **All Map Sections**: info, tiles, height, resources, objectives, buildings, vehicles, creatures, etc.
- **Script Parsing**: Full support for map scripting language
- **Error Recovery**: Graceful handling of malformed files
- **Validation**: Built-in data validation

### Object-Oriented API
- **Section Classes**: Dedicated classes for each map section
- **Type Safety**: Full TypeScript type definitions
- **Serialization**: Convert objects back to .dat format
- **Modification**: Easy programmatic map editing

## Directory Structure

```
map-parser/
├── src/
│   ├── map.ts              # Main Map class
│   ├── lexer.ts            # Chevrotain lexer definition
│   ├── grid.ts             # Grid data structures
│   ├── grid-sections.ts    # Grid-based sections (tiles, height)
│   ├── info-section.ts     # Map metadata parsing
│   ├── map-section.ts      # Base section class
│   ├── building.ts         # Building definitions
│   ├── vehicle.ts          # Vehicle definitions
│   ├── miner.ts            # Miner (unit) definitions
│   ├── objective.ts        # Objective parsing
│   ├── tiles.ts            # Tile type definitions
│   ├── timed-event-sections.ts  # Timed events
│   └── transform.ts        # Data transformations
├── examples/               # Usage examples
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript config
```

## Installation

```bash
npm install
```

## Usage

### Basic Parsing
```typescript
import { parseMap } from './src/map';

// Read map file
const mapContent = fs.readFileSync('my-map.dat', 'utf-8');

// Parse the map
const map = parseMap(mapContent);

// Access map data
console.log(`Map size: ${map.info.rowcount}x${map.info.colcount}`);
console.log(`Biome: ${map.info.biome}`);
console.log(`Objectives: ${map.objectives.length}`);
```

### Accessing Map Sections
```typescript
// Map metadata
const info = map.info;
console.log(`Map name: ${info.name}`);
console.log(`Creator: ${info.creator}`);

// Tile data
const tiles = map.tiles;
for (let row = 0; row < tiles.height; row++) {
  for (let col = 0; col < tiles.width; col++) {
    const tileId = tiles.get(row, col);
    console.log(`Tile at ${row},${col}: ${tileId}`);
  }
}

// Resources
const resources = map.resources;
resources.crystals.forEach(crystal => {
  console.log(`Crystal at ${crystal.x},${crystal.y}`);
});

// Objectives
map.objectives.forEach(objective => {
  console.log(`Objective: ${objective.description}`);
  console.log(`Type: ${objective.type}`);
});
```

### Modifying Maps
```typescript
// Change map properties
map.info.name = "Modified Map";
map.info.rowcount = 50;
map.info.colcount = 50;

// Modify tiles
map.tiles.set(10, 10, TileType.SOLID_ROCK);
map.tiles.set(11, 10, TileType.LOOSE_ROCK);

// Add resources
map.resources.addCrystal(15, 15);
map.resources.addOre(20, 20, 3);

// Add a building
map.buildings.add({
  type: BuildingType.TOOL_STORE,
  x: 25,
  y: 25,
  orientation: 0,
  level: 1
});
```

### Serializing Maps
```typescript
// Convert back to .dat format
const outputContent = map.serialize();

// Save to file
fs.writeFileSync('modified-map.dat', outputContent);
```

### Advanced Features

#### Custom Parsing
```typescript
import { MapLexer } from './src/lexer';
import { MapParser } from './src/parser';

// Create custom parser instance
const lexer = new MapLexer();
const parser = new MapParser();

// Parse with error handling
const lexResult = lexer.tokenize(mapContent);
if (lexResult.errors.length > 0) {
  console.error('Lexing errors:', lexResult.errors);
}

const parseResult = parser.parse(lexResult.tokens);
if (parseResult.errors.length > 0) {
  console.error('Parsing errors:', parseResult.errors);
}
```

#### Section Validation
```typescript
// Validate individual sections
const validation = map.validate();
if (!validation.isValid) {
  validation.errors.forEach(error => {
    console.error(`${error.section}: ${error.message}`);
  });
}
```

## Data Structures

### Map Sections

- **info{}**: Map metadata (size, biome, author, etc.)
- **tiles{}**: 2D grid of tile IDs
- **height{}**: Elevation data for each tile
- **resources{}**: Crystal and ore placements
- **objectives{}**: Mission objectives and win conditions
- **buildings{}**: Pre-placed structures
- **vehicles{}**: Vehicle spawn points
- **creatures{}**: Monster spawn locations
- **blocks{}**: Terrain blocks configuration
- **briefing{}**: Mission briefing data
- **script{}**: Map scripting logic

### Tile Types

The parser includes definitions for all tile types:
- Solid/Loose/Hard rock variants
- Ground/Rubble tiles
- Water/Lava tiles
- Special tiles (slughole, erosion, etc.)

## Error Handling

The parser provides detailed error information:
```typescript
try {
  const map = parseMap(content);
} catch (error) {
  if (error instanceof ParseError) {
    console.error(`Parse error at line ${error.line}:${error.column}`);
    console.error(`Message: ${error.message}`);
    console.error(`Context: ${error.context}`);
  }
}
```

## Performance

- Efficient parsing using Chevrotain
- Lazy loading of large sections
- Optimized grid operations
- Minimal memory footprint

## Known Issues

1. Script parsing may not handle all edge cases
2. Some custom map formats may not be fully supported
3. Large maps (>100x100) may have performance impacts

## Contributing

When extending the parser:
1. Add new token types to lexer.ts
2. Update parser rules for new sections
3. Create section classes extending MapSection
4. Add serialization methods
5. Include validation logic
6. Write unit tests

## Future Improvements

- [ ] Streaming parser for very large files
- [ ] Binary format support
- [ ] Map compression
- [ ] Diff/patch generation
- [ ] Schema validation
- [ ] Map format conversion tools