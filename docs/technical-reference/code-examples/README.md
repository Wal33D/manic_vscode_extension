# Code Examples

This directory contains practical code examples demonstrating how to work with Manic Miners map files. The examples are extracted from the reference implementations and organized by use case.

## Directory Structure

```
code-examples/
├── README.md                 # This file
├── parsing/                  # Map parsing examples
│   ├── basic-parser.ts      # Simple map parser
│   ├── stream-parser.ts     # Streaming parser
│   └── validation.ts        # Map validation
├── generation/              # Map generation examples
│   ├── simple-cave.ts       # Basic cave generation
│   ├── biome-specific.ts    # Biome-based generation
│   └── resource-placement.ts # Resource distribution
├── visualization/           # Map rendering examples
│   ├── png-renderer.ts      # PNG image generation
│   ├── thumbnail.ts         # Thumbnail creation
│   └── heat-map.ts          # Statistical visualization
├── scripting/               # Script examples
│   ├── basic-triggers.dat   # Simple trigger examples
│   ├── event-chains.dat     # Event chain patterns
│   └── advanced-logic.dat   # Complex scripting
└── utilities/               # Helper utilities
    ├── grid-operations.ts   # Grid manipulation
    ├── pathfinding.ts       # Path algorithms
    └── analysis.ts          # Map analysis tools
```

## Quick Start

### Parse a Map File

```typescript
import { parseMapFile } from './parsing/basic-parser';

const mapData = await parseMapFile('my-map.dat');
console.log(`Map size: ${mapData.info.rowcount}x${mapData.info.colcount}`);
```

### Generate a Simple Map

```typescript
import { generateCave } from './generation/simple-cave';

const map = generateCave({
  width: 40,
  height: 40,
  openness: 0.45
});

map.save('generated-map.dat');
```

### Render a Map Preview

```typescript
import { renderMapToPNG } from './visualization/png-renderer';

const imageBuffer = await renderMapToPNG(mapData, {
  scale: 16,
  showResources: true
});

fs.writeFileSync('map-preview.png', imageBuffer);
```

## Example Categories

### Parsing Examples
- **Basic Parser**: Simple regex-based parsing
- **Stream Parser**: Memory-efficient streaming parser
- **Validation**: Map integrity checking

### Generation Examples
- **Simple Cave**: Cellular automata cave generation
- **Biome Specific**: Ice, lava, and rock variants
- **Resource Placement**: Crystal and ore distribution

### Visualization Examples
- **PNG Renderer**: Full map rendering with colors
- **Thumbnail**: Small preview generation
- **Heat Map**: Resource density visualization

### Scripting Examples
- **Basic Triggers**: Common trigger patterns
- **Event Chains**: Reusable event sequences
- **Advanced Logic**: Complex game mechanics

### Utility Examples
- **Grid Operations**: Common grid algorithms
- **Pathfinding**: A* and flow field examples
- **Analysis**: Map statistics and metrics

## Running the Examples

### Prerequisites

```bash
npm install typescript ts-node
npm install sharp canvas    # For visualization
npm install chevrotain      # For advanced parsing
```

### Execute Examples

```bash
# Run TypeScript examples
ts-node parsing/basic-parser.ts

# Copy DAT examples to game
cp scripting/basic-triggers.dat /path/to/game/Levels/
```

## Contributing

When adding new examples:
1. Keep examples focused and well-commented
2. Include error handling
3. Show both simple and advanced usage
4. Test with various map sizes
5. Document any assumptions or limitations

## See Also

- [Parsing Patterns](../parsing-patterns.md) - Detailed parsing documentation
- [Algorithms](../algorithms/) - Algorithm implementations
- [Performance Guide](../performance.md) - Optimization tips
- [DAT Format](../../game-reference/format/overview.md) - Format specification