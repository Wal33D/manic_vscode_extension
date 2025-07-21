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

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `width` | number | 10-100 | 40 | Map width in tiles |
| `height` | number | 10-100 | 40 | Map height in tiles |
| `biome` | string | rock/ice/lava | rock | Biome type affecting terrain and resources |
| `seed` | number | any | Date.now() | Random seed for reproducible generation |
| `caveComplexity` | number | 0.0-1.0 | 0.5 | Cave system density and interconnectedness |
| `resourceDensity` | number | 0.0-1.0 | 0.3 | Frequency of crystals and ore deposits |

### Advanced Parameters

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `waterLevel` | number | 0-10 | 3 | Height threshold for water/lava placement |
| `erosionFactor` | number | 0.0-1.0 | 0.3 | Terrain smoothing intensity |
| `connectivityTarget` | number | 0.0-1.0 | 0.8 | Minimum cave connectivity ratio |
| `hazardFrequency` | number | 0.0-1.0 | 0.2 | Probability of landslide zones |
| `roomCount` | number | 0-20 | auto | Number of large chambers to generate |
| `tunnelWidth` | number | 1-5 | 2 | Width of connecting tunnels |
| `crystalClusters` | number | 1-50 | auto | Number of crystal clusters |
| `oreVeins` | number | 1-100 | auto | Number of ore vein systems |
| `foundationCount` | number | 0-10 | 3 | Number of building foundations |
| `terraceHeight` | number | 1-5 | 2 | Step height for terraced terrain |

### Biome-Specific Parameters

#### Rock Biome
- `cliffFrequency`: 0.0-1.0 - Frequency of cliff formations
- `boulderDensity`: 0.0-1.0 - Large rock obstacles

#### Ice Biome  
- `iceSheetCoverage`: 0.0-1.0 - Slippery ice coverage
- `crevasseDensity`: 0.0-1.0 - Deep crack hazards

#### Lava Biome
- `lavaFlowWidth`: 1-10 - Width of lava rivers
- `volcanicActivity`: 0.0-1.0 - Eruption zone frequency

## Algorithms

### Terrain Generation

#### 1. Base Heightmap Generation
The terrain starts with multi-octave Perlin noise to create natural-looking elevation:
```typescript
// Pseudocode for height generation
for each tile (x, y):
    height = 0
    amplitude = 1
    frequency = 0.05
    
    for octave in 1..4:
        height += perlin(x * frequency, y * frequency) * amplitude
        amplitude *= 0.5  // Each octave contributes less
        frequency *= 2    // Each octave has higher detail
```

#### 2. Biome-Specific Modifiers
Each biome applies unique transformations:
- **Rock**: Adds cliff formations using step functions
- **Ice**: Smooths terrain and adds glacial valleys
- **Lava**: Creates volcanic peaks and lava flows

#### 3. Erosion Simulation
Simulates natural erosion using a simplified hydraulic model:
```typescript
// Erosion passes smooth sharp edges
for iteration in 1..erosionPasses:
    for each tile:
        avgHeight = average of 8 neighbors
        tile.height = lerp(tile.height, avgHeight, erosionFactor)
```

### Cave Generation

#### 1. Cellular Automata Base
Uses the 4-5 rule for organic cave shapes:
```typescript
// Initial random cave seeds
for each tile:
    tile.isCave = random() < caveDensity

// Apply cellular automata rules
for iteration in 1..5:
    for each tile:
        wallCount = countWallsWithinRadius(tile, 1)
        if wallCount >= 5 || wallCount <= 2:
            tile.isCave = false
        else:
            tile.isCave = true
```

#### 2. Connectivity Algorithm
Ensures all caves are reachable using flood-fill:
```typescript
// Find disconnected cave regions
regions = floodFillAllCaves()

// Connect regions with tunnels
while regions.length > 1:
    region1 = regions[0]
    region2 = findClosestRegion(region1)
    tunnel = createTunnel(region1, region2)
    mergeCaves(tunnel)
    mergeRegions(region1, region2)
```

#### 3. Room Generation
Creates larger chambers at strategic points:
- Intersection of multiple tunnels
- Areas with high connectivity
- Predetermined "room seeds" based on map size

#### 4. Tunnel Boring
A* pathfinding creates natural tunnels:
```typescript
function createTunnel(start, end):
    path = aStar(start, end, {
        costFunction: (tile) => {
            if (tile.isCave) return 1
            if (tile.isHardRock) return 10
            return 5
        }
    })
    
    // Widen path for natural look
    for point in path:
        makeCircularCave(point, tunnelRadius)
```

### Resource Placement

#### 1. Crystal Placement Algorithm
Energy crystals follow power law distribution:
```typescript
// Place crystals in clusters
for clusterCount in 1..desiredClusters:
    center = findSuitableLocation()
    clusterSize = powerLawRandom(1, 10)
    
    for i in 1..clusterSize:
        offset = gaussianRandom(0, clusterSpread)
        placeCrystal(center + offset)
```

#### 2. Ore Distribution
Ore veins follow geological patterns:
- Placed along "fault lines" in the heightmap
- Higher concentration at certain depths
- Biome-specific ore types

#### 3. Building Foundation Placement
Strategic flat areas for construction:
```typescript
function findFoundations():
    candidates = []
    
    for each tile:
        if (isFlatArea(tile, radius=3) && 
            hasGoodConnectivity(tile) &&
            !nearHazard(tile)):
            candidates.add(tile)
    
    // Select diverse locations
    return selectDiversePoints(candidates, targetCount)
```

### Hazard Generation

#### Landslide Areas
Identified by steep slopes and loose material:
```typescript
for each tile:
    slopeAngle = calculateSlope(tile)
    instability = slopeAngle * looseMaterialFactor
    
    if (instability > threshold):
        tile.hasLandslide = true
        tile.landslideDirection = downhillDirection(tile)
```

#### Water/Lava Bodies
Flood-fill from lowest points:
```typescript
lowestPoints = findLocalMinima(heightMap)

for point in lowestPoints:
    if (point.height < waterLevel):
        floodFill(point, {
            condition: (tile) => tile.height < waterLevel,
            action: (tile) => tile.type = WATER
        })
```

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
   - Generation time scales quadratically with map size
   - Browser environments limited by single-thread performance
   - Recommended: Use CLI for batch generation of large maps

2. **Memory**: Very large maps may exceed browser limits
   - Each tile requires ~100 bytes in memory
   - 100x100 map ≈ 1MB base + working memory
   - Browser tab typically limited to 1-2GB

3. **Validation**: Generated maps should be validated before use
   - No guarantee of objective achievability
   - Minimum resource counts not enforced
   - Player spawn point may be suboptimal

4. **Objectives**: Currently generates placeholder objectives
   - Uses simple "collect X crystals" goals
   - No story or progression logic
   - No difficulty balancing

5. **Tile Restrictions**: Some tile combinations are invalid
   - Cannot place buildings on slopes > 45°
   - Water/lava cannot exist above certain heights
   - Some biome-specific tiles may conflict

6. **Pathfinding**: No guarantee of full map traversability
   - Some areas may require building to access
   - Resource placement doesn't consider accessibility
   - No validation of critical path

## Future Improvements

- [ ] Objective generation based on map analysis
  - Analyze map to create contextual objectives
  - Balance difficulty based on resource distribution
  - Generate story elements from map features
  
- [ ] Multi-level/3D map support
  - Underground cave layers
  - Vertical shaft connections
  - 3D pathfinding for multi-level access
  
- [ ] Custom biome definitions
  - JSON-based biome configuration
  - Custom tile sets and rules
  - Biome blending at boundaries
  
- [ ] Map templates and presets
  - Save/load generation parameters
  - Curated preset library
  - Share templates with community
  
- [ ] Performance optimizations
  - Web Worker for generation
  - WASM for critical algorithms  
  - GPU acceleration for Perlin noise
  
- [ ] Export to other formats
  - Direct game save file generation
  - Export as images (PNG/SVG)
  - Convert to other map editors

## Tips and Best Practices

### For Best Results

1. **Start with defaults**: The default parameters are well-balanced
2. **Iterate on seed**: Try multiple seeds with same parameters
3. **Test in-game**: Always validate maps in actual gameplay
4. **Save good parameters**: Document successful parameter combinations

### Parameter Combinations

**Beginner-Friendly Maps**
```json
{
  "caveComplexity": 0.3,
  "resourceDensity": 0.6,
  "hazardFrequency": 0.1,
  "connectivityTarget": 0.95
}
```

**Challenging Maps**
```json
{
  "caveComplexity": 0.8,
  "resourceDensity": 0.2,
  "hazardFrequency": 0.5,
  "connectivityTarget": 0.7
}
```

**Resource-Rich Mining**
```json
{
  "caveComplexity": 0.5,
  "resourceDensity": 0.8,
  "oreVeins": 50,
  "crystalClusters": 20
}
```

### Understanding the Code

Key files to study:
- `map-generator.ts`: Main generation pipeline
- `extracted-functions.ts`: Individual algorithms
- `convert-to-mm.ts`: .dat format serialization
- `python-shims/`: Python compatibility layer

## Troubleshooting

### Common Issues

**Maps appear too uniform**
- Increase `caveComplexity` parameter (try 0.7-0.9)
- Reduce `erosionFactor` for more jagged terrain (try 0.1-0.2)
- Add more octaves to Perlin noise generation
- Increase `terraceHeight` for more dramatic elevation changes

**Not enough resources**
- Increase `resourceDensity` (0.5-0.7 for resource-rich maps)
- Check biome-specific limits:
  - Rock biome: Max 40% resource coverage
  - Ice biome: Max 30% resource coverage  
  - Lava biome: Max 25% resource coverage
- Adjust `crystalClusters` and `oreVeins` manually

**Disconnected areas**
- Increase `connectivityTarget` to 0.9-1.0
- Increase `tunnelWidth` to 3-4 for better connections
- Reduce `caveDensity` if too many isolated pockets
- Check the connectivity map in debug output

**Generation fails**
- Check map dimensions are valid (10-100 per axis)
- Ensure sufficient memory (monitor browser console)
- Verify all parameters in valid ranges
- Common crash causes:
  - `seed` must be a valid number
  - Biome must be exactly "rock", "ice", or "lava"
  - All float parameters must be 0.0-1.0

**Performance issues**
- Use CLI instead of browser for large maps
- Disable real-time preview in UI
- Reduce iteration counts in algorithms
- Profile with browser DevTools to find bottlenecks

### Debug Mode

Enable debug output for detailed generation info:
```typescript
const debugConfig = {
    logTimings: true,
    saveIntermediateSteps: true,
    visualizeAlgorithms: true
};

const mapData = generateMap(params, debugConfig);
```

### Validation Checklist

Before using generated maps:
1. ✓ Check player spawn is accessible
2. ✓ Verify minimum 10 crystals present
3. ✓ Ensure at least one building foundation
4. ✓ Confirm no isolated resource pockets
5. ✓ Validate objective is achievable
6. ✓ Test in game for playability