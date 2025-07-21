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

All three implementations work with the Manic Miners `.dat` format:

```
info{
  rowcount:40
  colcount:40
  biome:rock
  // ... other metadata
}

tiles{
  1,1,1,1,1,1,1,1,1,1,
  1,0,0,0,0,0,0,0,0,1,
  // ... 2D grid of tile IDs
}

height{
  5,5,5,5,5,5,5,5,5,5,
  5,4,4,4,4,4,4,4,4,5,
  // ... elevation data
}

// Additional sections for resources, objectives, buildings, etc.
```

## 🔧 Common Use Cases

### For VSCode Extension Development
1. **Understanding File Format**: Study the parser implementation
2. **Validation Logic**: Reference the integrity checking algorithms
3. **Visualization**: See how maps are rendered to images
4. **Data Structures**: Learn from the object models

### For Map Creation
1. **Procedural Generation**: Use the generator for creating base maps
2. **Manual Editing**: Parse, modify, and re-serialize maps
3. **Batch Processing**: Analyze multiple maps for patterns

## 📝 Notes

- Each component has its own dependencies and build process
- Code is provided as-is for reference purposes
- Some implementations may have overlapping functionality
- Focus is on clarity and documentation over optimization

## 🤝 Contributing

When adding new reference implementations:
1. Create a new directory at the root level
2. Include a comprehensive README.md
3. Document the purpose and key algorithms
4. Provide usage examples
5. Keep dependencies minimal and well-documented

---

For questions about the VSCode extension, see the main project README.
For questions about these reference implementations, check each component's documentation.