# Map Visualizer

Tools for parsing, visualizing, and analyzing Manic Miners map files with image generation and statistical analysis capabilities.

## Overview

This collection of TypeScript utilities provides functionality for reading existing map files, generating visual representations, and performing various analyses on map data. It's particularly useful for understanding map structure and creating previews.

## Features

### Map Parsing
- **Simple Parser**: Regex-based parser for .dat files
- **Encoding Detection**: Handles various file encodings
- **Data Extraction**: Extracts all map sections

### Visualization
- **PNG Generation**: Full-color map previews
- **Thumbnail Creation**: Small preview images
- **Color Mapping**: Consistent tile coloring
- **Custom Palettes**: Support for different visual styles

### Analysis Tools
- **Resource Counting**: Crystal and ore statistics
- **Map Size Analysis**: Categorization and metrics
- **Integrity Checking**: Validation of map data
- **Statistical Logging**: Detailed map information

## Directory Structure

```
map-visualizer/
├── parser/                 # Map file parsing
│   ├── mapFileParser.ts   # Main parser implementation
│   └── types.ts           # TypeScript interfaces
├── renderer/              # Image generation
│   ├── generatePNGImage.ts      # Full-size map images
│   └── generateThumbnailImage.ts # Thumbnail generation
├── analysis/              # Map analysis utilities
│   ├── averageMapSize.ts        # Size calculations
│   ├── cleanMapFile.ts          # File sanitization
│   ├── colorMap.ts              # Tile color mappings
│   ├── constructDescriptions.ts # Description generation
│   ├── countResources.ts        # Resource statistics
│   ├── generateShortDescription.ts # Brief summaries
│   ├── getSizeCategory.ts       # Size categorization
│   ├── logMapDataStats.ts       # Statistical logging
│   └── mapIntegrityCheck.ts     # Validation checks
└── types.ts               # Shared type definitions
```

## Usage

### Parsing Maps
```typescript
import { parseMapFile } from './parser/mapFileParser';

// Parse a map file
const mapData = await parseMapFile('path/to/map.dat');

// Access parsed data
console.log(`Map: ${mapData.info.name}`);
console.log(`Size: ${mapData.info.rowcount}x${mapData.info.colcount}`);
console.log(`Biome: ${mapData.info.biome}`);
```

### Generating Images

#### Full Map Preview
```typescript
import { generatePNGImage } from './renderer/generatePNGImage';

// Generate full-size map image
const imageBuffer = await generatePNGImage(mapData, {
  tileSize: 16,        // Pixels per tile
  showGrid: true,      // Draw grid lines
  showResources: true  // Overlay resources
});

// Save to file
fs.writeFileSync('map-preview.png', imageBuffer);
```

#### Thumbnail Generation
```typescript
import { generateThumbnailImage } from './renderer/generateThumbnailImage';

// Create small preview
const thumbnail = await generateThumbnailImage(mapData, {
  width: 128,
  height: 128,
  quality: 85
});

fs.writeFileSync('map-thumb.jpg', thumbnail);
```

### Map Analysis

#### Resource Statistics
```typescript
import { countResources } from './analysis/countResources';

const stats = countResources(mapData);
console.log(`Crystals: ${stats.crystals}`);
console.log(`Ore deposits: ${stats.ore}`);
console.log(`Recharge seams: ${stats.rechargeSeams}`);
```

#### Map Categorization
```typescript
import { getSizeCategory } from './analysis/getSizeCategory';
import { averageMapSize } from './analysis/averageMapSize';

const category = getSizeCategory(mapData);
console.log(`Map category: ${category}`); // 'small', 'medium', 'large'

const avgSize = averageMapSize(mapData);
console.log(`Average dimension: ${avgSize}`);
```

#### Integrity Checking
```typescript
import { mapIntegrityCheck } from './analysis/mapIntegrityCheck';

const issues = mapIntegrityCheck(mapData);
if (issues.length > 0) {
  console.log('Map issues found:');
  issues.forEach(issue => {
    console.log(`- ${issue.type}: ${issue.message}`);
  });
}
```

#### Description Generation
```typescript
import { constructDescriptions } from './analysis/constructDescriptions';
import { generateShortDescription } from './analysis/generateShortDescription';

// Detailed description
const fullDesc = constructDescriptions(mapData);
console.log(fullDesc);

// Brief summary
const shortDesc = generateShortDescription(mapData);
console.log(shortDesc); // e.g., "Medium Rock map with 15 crystals"
```

### Utility Functions

#### File Cleaning
```typescript
import { cleanMapFile } from './analysis/cleanMapFile';

// Remove invalid characters, normalize line endings
const cleaned = cleanMapFile(rawMapContent);
```

#### Statistical Logging
```typescript
import { logMapDataStats } from './analysis/logMapDataStats';

// Log comprehensive statistics
logMapDataStats(mapData);
// Outputs detailed information about tiles, resources, objectives, etc.
```

## Color Mapping

The visualizer uses a consistent color scheme for tiles:

```typescript
const colorMap = {
  SOLID_ROCK: '#404040',
  LOOSE_ROCK: '#606060',
  HARD_ROCK: '#303030',
  DIRT: '#8B7355',
  GROUND: '#90EE90',
  LAVA: '#FF4500',
  WATER: '#4682B4',
  CRYSTAL_SEAM: '#E0FFFF',
  ORE_SEAM: '#DAA520',
  // ... more tile types
};
```

## Image Generation Options

### PNG Options
- `tileSize`: Pixels per map tile (default: 16)
- `showGrid`: Draw grid lines between tiles
- `showResources`: Overlay resource indicators
- `backgroundColor`: Canvas background color
- `padding`: Border around the map

### Thumbnail Options
- `width/height`: Target dimensions
- `quality`: JPEG quality (1-100)
- `format`: 'png' or 'jpeg'

## Performance Considerations

- Large maps may require significant memory for image generation
- Use thumbnails for previews in lists
- Consider streaming for very large datasets
- Cache generated images when possible

## Dependencies

- **sharp**: High-performance image processing
- **canvas**: 2D drawing API
- **chardet**: Character encoding detection
- **iconv-lite**: Character encoding conversion

## Error Handling

```typescript
try {
  const mapData = await parseMapFile(filePath);
  const image = await generatePNGImage(mapData);
} catch (error) {
  if (error.code === 'INVALID_MAP_FORMAT') {
    console.error('Invalid map file format');
  } else if (error.code === 'IMAGE_GENERATION_FAILED') {
    console.error('Failed to generate image');
  }
}
```

## Known Limitations

1. Parser uses regex instead of formal grammar
2. Some edge cases in map format may not be handled
3. Large images may exceed memory limits
4. Limited customization for visual output

## Future Enhancements

- [ ] SVG output format
- [ ] Heatmap visualizations
- [ ] 3D terrain rendering
- [ ] Animation support for objectives
- [ ] Custom color schemes
- [ ] Web-based viewer