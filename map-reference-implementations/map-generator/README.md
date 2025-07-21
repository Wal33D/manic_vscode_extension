# Map Generator

A procedural map generation tool for Manic Miners that creates playable maps with terrain features, resources, and objectives.

## Overview

This tool was originally written in Python and converted to TypeScript. It generates maps procedurally using various algorithms for terrain generation, cave systems, and resource placement.

## Features

### Terrain Generation
- **Biome Support**: Rock, Ice, and Lava biomes with unique characteristics
- **Cave Systems**: Procedurally generated interconnected caves
- **Height Maps**: Realistic terrain elevation
- **Landslides**: Dynamic hazard areas
- **Water/Lava Bodies**: Hazardous terrain features

### Resource Distribution
- **Energy Crystals**: Strategically placed power sources
- **Ore Deposits**: Minable resources for building
- **Recharge Seams**: Special power-up locations
- **Building Foundations**: Pre-cleared areas for structures

### Map Sizes
- Small (25x25)
- Medium (40x40) 
- Large (60x60)
- Custom dimensions

## Directory Structure

```
map-generator/
├── core/               # Core generation logic
│   ├── map-generator.ts    # Main generation algorithms
│   ├── map-generator.py    # Original Python implementation
│   ├── convert-to-mm.ts    # Converts to .dat format
│   ├── extracted-functions.ts  # Utility functions
│   ├── misc.ts            # Helper utilities
│   └── python-shims/      # Python stdlib compatibility
├── ui/                 # React web interface
│   ├── browser.tsx        # Main UI component
│   └── parameters.tsx     # Parameter configuration
├── cli/                # Command-line tools
│   ├── cli.ts            # CLI interface
│   └── displayPNG.ts     # PNG preview generation
└── examples/           # Example generated maps
```

## Quick Start

### Web Interface
```bash
# Install dependencies
npm install

# Start development server
yarn start
# or
npm run dev

# Open http://localhost:8080
```

### Command Line
```bash
# Generate a single map
npm run cli -- --size medium --biome rock --output my-map.dat

# Batch generation
npm run cli -- --batch 10 --size large --biome random

# With specific seed
npm run cli -- --seed 12345 --size small --biome ice
```

### Programmatic Usage
```typescript
import { generateMap } from './core/map-generator';
import { convertToMM } from './core/convert-to-mm';

// Generate map data
const mapData = generateMap({
  width: 40,
  height: 40,
  biome: 'rock',
  seed: Date.now()
});

// Convert to .dat format
const datContent = convertToMM(mapData);

// Save to file
fs.writeFileSync('generated-map.dat', datContent);
```

## Generation Parameters

### Core Parameters
- `width/height`: Map dimensions (10-100)
- `biome`: rock, ice, or lava
- `seed`: Random seed for reproducibility
- `caveComplexity`: 0.0-1.0 (cave system density)
- `resourceDensity`: 0.0-1.0 (crystal/ore frequency)

### Advanced Parameters
- `waterLevel`: Height threshold for water/lava
- `erosionFactor`: Terrain smoothing amount
- `connectivityTarget`: Desired cave connectivity
- `hazardFrequency`: Landslide probability

## Algorithms

### Terrain Generation
1. **Base Heightmap**: Perlin noise for natural terrain
2. **Biome Modifiers**: Biome-specific adjustments
3. **Erosion**: Smoothing passes for realism

### Cave Generation
1. **Cellular Automata**: Initial cave shapes
2. **Connection Algorithm**: Ensures traversability  
3. **Room Generation**: Creates larger caverns
4. **Tunnel Boring**: Connects isolated areas

### Resource Placement
1. **Clustering**: Groups similar resources
2. **Distance Weighting**: Balances accessibility
3. **Scarcity Levels**: Controls resource availability

## Python to TypeScript Conversion

The original Python implementation used:
- `random` module → TypeScript PRNG implementation
- `numpy` arrays → TypeScript 2D arrays
- `PIL` for images → Canvas API

Python shims in `python-shims/` provide compatibility for:
- `random.choice()`, `random.randint()`
- `os.path` operations
- Basic `time` functions

## Configuration Files

### package.json
Contains build scripts and dependencies.

### tsconfig.json  
TypeScript compiler configuration.

### webpack.config.ts
Bundling configuration for web interface.

## Known Limitations

1. **Performance**: Large maps (>80x80) may be slow
2. **Memory**: Very large maps may exceed browser limits
3. **Validation**: Generated maps should be validated before use
4. **Objectives**: Currently generates placeholder objectives

## Future Improvements

- [ ] Objective generation based on map analysis
- [ ] Multi-level/3D map support
- [ ] Custom biome definitions
- [ ] Map templates and presets
- [ ] Performance optimizations
- [ ] Export to other formats

## Troubleshooting

**Maps appear too uniform**
- Increase `caveComplexity` parameter
- Adjust `erosionFactor` for more variety

**Not enough resources**
- Increase `resourceDensity`
- Check biome-specific limits

**Disconnected areas**
- Increase `connectivityTarget`
- Enable tunnel boring option

**Generation fails**
- Check map dimensions are valid
- Ensure sufficient memory available
- Verify all parameters in valid ranges