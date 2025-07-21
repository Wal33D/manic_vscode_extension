# DAT File Sections Reference

This directory contains detailed documentation for each section of the Manic Miners DAT file format. Each section serves a specific purpose in defining map structure, gameplay mechanics, and visual elements.

## Section Overview

### Core Map Structure (Required)
These three sections are mandatory for every valid DAT file:

- **[info.md](info.md)** - Map metadata including dimensions, biome, and creator information
- **[tiles.md](tiles.md)** - The actual map layout defining walls, floors, and terrain features  
- **[height.md](height.md)** - Elevation data for each vertex in the map grid

### Gameplay Elements

- **[resources.md](resources.md)** - Crystal and ore seam placements for resource collection
- **[objectives.md](objectives.md)** - Mission goals and victory conditions
- **[buildings.md](buildings.md)** - Pre-placed structures and their properties
- **[vehicles.md](vehicles.md)** - Starting vehicles and their configurations
- **[creatures.md](creatures.md)** - Initial creature spawns and enemy placements
- **[miners.md](miners.md)** - Starting Rock Raider positions and properties

### Scripting & Automation

- **[script.md](script.md)** - The powerful event-driven scripting system for dynamic gameplay
- **[blocks.md](blocks.md)** - Visual node-based scripting alternative for non-programmers

### Environmental Hazards

- **[landslidefrequency.md](landslidefrequency.md)** - Falling rock configurations and timing
- **[lavaspread.md](lavaspread.md)** - Lava flow speed and erosion settings

### Text & Narrative

- **[briefing.md](briefing.md)** - Pre-mission briefing text
- **[briefingsuccess.md](briefingsuccess.md)** - Victory message displayed on mission completion
- **[briefingfailure.md](briefingfailure.md)** - Defeat message shown on mission failure
- **[comments.md](comments.md)** - Developer notes and documentation within the map file

## Section Structure

Each section follows this general format:
```
sectionname{
    // section content
}
```

## Reading Order

For new map creators, we recommend reading the sections in this order:

1. **Start with the basics:**
   - [info.md](info.md) - Understand map metadata
   - [tiles.md](tiles.md) - Learn tile types and layout
   - [height.md](height.md) - Grasp elevation concepts

2. **Add gameplay elements:**
   - [objectives.md](objectives.md) - Define win conditions
   - [resources.md](resources.md) - Place collectible resources
   - [buildings.md](buildings.md) - Add starting structures

3. **Enhance with scripting:**
   - [script.md](script.md) - Create dynamic events
   - [blocks.md](blocks.md) - Alternative visual scripting

4. **Polish and refine:**
   - [briefing.md](briefing.md) - Add narrative context
   - [creatures.md](creatures.md) - Include challenges
   - Environmental hazards for difficulty

## Quick Reference

| Section                | Required | Purpose               |
| ---------------------- | :------: | --------------------- |
| **info**               |     ✅    | Map metadata          |
| **tiles**              |     ✅    | Map layout            |
| **height**             |     ✅    | Terrain elevation     |
| **resources**          |     ❌    | Crystals & ore        |
| **objectives**         |     ❌    | Win conditions        |
| **script**             |     ❌    | Dynamic events        |
| **buildings**          |     ❌    | Pre-placed structures |
| **vehicles**           |     ❌    | Starting vehicles     |
| **creatures**          |     ❌    | Enemy spawns          |
| **miners**             |     ❌    | Rock Raiders          |
| **blocks**             |     ❌    | Visual scripting      |
| **briefing**           |     ❌    | Mission intro         |
| **briefingsuccess**    |     ❌    | Win message           |
| **briefingfailure**    |     ❌    | Lose message          |
| **landslidefrequency** |     ❌    | Rock hazards          |
| **lavaspread**         |     ❌    | Lava erosion          |
| **comments**           |     ❌    | Developer notes       |

## See Also

- [DAT Format Overview](../overview.md) - General format structure
- [Tile Reference](../tile-reference.md) - Complete tile ID listing
- [Scripting Patterns](../../scripting/patterns/README.md) - Script examples
- [Map Design Guide](../../map-design-guide.md) - Best practices