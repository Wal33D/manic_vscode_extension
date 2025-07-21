# DAT File Format Overview

## Introduction

Manic Miners level files use the `.dat` extension and contain all information needed to define a playable level. The format is text-based with a section structure, making it human-readable and editable.

## File Encoding and Format

### Supported Encodings
DAT files support the following text encodings:

1. **ANSI 8-bit** (Windows current code page) - No BOM
2. **UTF-8 with BOM** - Starts with bytes `0xEF, 0xBB, 0xBF`
3. **UTF-16LE with BOM** - Starts with bytes `0xFF, 0xFE` 
4. **UTF-16BE with BOM** - Starts with bytes `0xFE, 0xFF`

### Important Encoding Notes
- **Line endings**: Must use Windows CRLF (`\r\n`)
- **Unsupported**: UTF-16 without BOM, UTF-32 (important for Mac users)
- **Editor behavior**: The Manic Miners editor saves as UTF-16LE BOM if any non-ANSI characters are present
- **Legacy support**: If file ends with CTRL-Z (0x1A), content after is ignored

### Internationalization Constraints
While DAT files support Unicode, certain elements have restrictions:

**Must be lowercase ANSI (a-z only)**:
- Section names (e.g., `info`, `tiles`, `script`)

**Must be ANSI western characters (A-Z, a-z, 0-9, underscore)**:
- Variable names
- Event chain names
- Macro names

**Support full Unicode**:
- Level name and creator (in info section)
- String variables and messages
- Briefing text
- Comments

## File Structure

A DAT file consists of multiple sections, each with the format:
```
sectionname{
    content
}
```

## Section Types

### Required Sections
These sections must be present in every valid DAT file:

1. **info{}** - Level metadata and configuration
2. **tiles{}** - Tile layout (the actual map)
3. **height{}** - Height/elevation data for each tile

### Optional Sections
These sections add features and complexity to levels:

- **comments{}** - Developer notes and documentation
- **objectives{}** - Win conditions and goals
- **resources{}** - Crystal and ore placement
- **buildings{}** - Pre-placed structures
- **vehicles{}** - Pre-placed vehicles
- **creatures{}** - Enemy spawn points
- **miners{}** - Rock Raider placements
- **blocks{}** - Movement blocking overlay
- **script{}** - Level scripting and events
- **briefing{}** - Mission briefing text
- **briefingsuccess{}** - Success message
- **briefingfailure{}** - Failure message
- **landslidefrequency{}** - Landslide timing
- **lavaspread{}** - Lava expansion timing

### Legacy Sections (Deprecated)
These sections are still accepted for backwards compatibility but are ignored:

- **monsters{}** - Old enemy placement system (use creatures{} instead)
- **monsterfrequency{}** - Old spawn timing (use script{} instead)

**Note**: The editor no longer generates these sections.

## Data Types

### Grid Data
Sections like `tiles`, `height`, `resources`, and `blocks` use 2D grid format:
```
section{
1,2,3,4,5,
6,7,8,9,10,
11,12,13,14,15,
}
```
- One row per line
- Values separated by commas
- No spaces between values
- Every value must have a trailing comma

### Key-Value Data
The `info` section uses key-value pairs:
```
info{
    rowcount: 25;
    colcount: 25;
    biome: rock;
}
```
- Format: `key: value;`
- Semicolon terminates each entry
- String values don't need quotes

### Entity Data
Buildings, vehicles, creatures, and miners use structured format:
```
buildings{
    BuildingToolStore_C
    ID=ToolStore1
    essential=true
    coordinates{
        Translation: X=2250.0 Y=2250.0 Z=0.0 
        Rotation: P=0.0 Y=0.0 R=0.0 
        Scale X=1.0 Y=1.0 Z=1.0
    }
}
```

### Script Data
The script section uses its own syntax:
```
script{
    string WelcomeMsg="Welcome!"
    int Counter=0
    
    ShowMessage::
    msg:WelcomeMsg;
    Counter:Counter+1;
}
```

## Coordinate Systems

### Grid Coordinates
- Zero-indexed: (0,0) to (colcount-1, rowcount-1)
- Used in: tiles, height, resources sections
- X = column, Y = row (note: this is often confusing!)

### World Coordinates
- Each tile is 300 world units
- Center of tile [0,0] is at world (150, 150)
- Formula: `world = (grid * 300) + 150`
- Used in: entity placement (buildings, vehicles, etc.)

### Important Note on Coordinates
The most common error is X/Y confusion:
- In grid sections: `tiles[row][col]` or `tiles[y][x]`
- In world coordinates: X is east/west, Y is north/south
- Always verify coordinate usage in your specific context

## Validation Rules

### General Rules
1. All required sections must be present
2. Grid dimensions must match info section values
3. Tile IDs must be valid (1-165, with some gaps)
4. Entity positions must be within map bounds
5. Objectives must be achievable with available resources

### Section-Specific Rules
- **tiles**: Border tiles typically solid rock (ID 38)
- **height**: Values 0-15 only
- **resources**: Binary grids (0 or 1)
- **buildings**: At least one Tool Store required
- **script**: Variables must be declared before use


## Example Minimal File
```
info{
    rowcount: 5;
    colcount: 5;
}

tiles{
38,38,38,38,38,
38,1,1,1,38,
38,1,1,1,38,
38,1,1,1,38,
38,38,38,38,38,
}

height{
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
0,0,0,0,0,
}
```

## Common Patterns

### Starting Area
```
// 3x3 buildable area surrounded by walls
30,30,30,30,30,
30,1,1,1,30,
30,1,1,1,30,
30,1,1,1,30,
30,30,30,30,30,
```

### Resource Placement
```
// Crystal seam cluster
34,42,43,42,34,
42,43,44,43,42,
43,44,45,44,43,
42,43,44,43,42,
34,42,43,42,34,
```

## See Also

### References
- [Tile Reference](tile-reference.md) - Complete tile ID list
- [Section Documentation](sections/) - Detailed section specifications
- [Scripting Guide](../scripting/overview.md) - Script section details
- [Common Patterns](../../technical-reference/common-patterns.md) - Best practices

### Related Code Examples
- [Basic Parser](../../technical-reference/code-examples/parsing/basic-parser.ts) - Parse DAT files
- [Stream Parser](../../technical-reference/code-examples/parsing/stream-parser.ts) - Memory-efficient parsing
- [Validation](../../technical-reference/code-examples/parsing/validation.ts) - Validate DAT files
- [Map Analysis](../../technical-reference/code-examples/utilities/analysis.ts) - Analyze map properties

### Related Documentation
- [Parsing Patterns](../../technical-reference/parsing-patterns.md) - Advanced parsing techniques
- [Performance Guide](../../technical-reference/performance.md) - Optimize large maps
- [Quick Reference](../../quick-reference/cheat-sheet.md) - One-page format summary