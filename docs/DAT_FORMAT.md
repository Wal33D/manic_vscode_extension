# Manic Miners DAT File Format - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Section Reference](#section-reference)
4. [Tile System](#tile-system)
5. [Coordinate System](#coordinate-system)
6. [Entity System](#entity-system)
7. [Scripting](#scripting)
8. [Best Practices](#best-practices)

## Overview

Manic Miner .dat files are text-based level definition files that define all aspects of a game level including terrain, objectives, scripts, and entity placements. Files use Windows-style line endings (CRLF) and follow a section-based structure.

### Key Characteristics
- Plain text format with section-based structure
- Case-sensitive section names
- Semicolons terminate property values in info section
- Comma-separated values in grid sections
- Comments use `//` for single line

## File Structure

A .dat file consists of multiple sections, each with the format:
```
sectionname{
    content
}
```

### Required Sections
- `info{}` - Level metadata and configuration
- `tiles{}` - Tile layout grid
- `height{}` - Height map grid

### Optional Sections
- `comments{}` - Developer notes
- `objectives{}` - Win conditions
- `resources{}` - Crystal/ore placement
- `buildings{}` - Pre-placed buildings
- `vehicles{}` - Pre-placed vehicles
- `creatures{}` - Enemy placements
- `miners{}` - Rock Raider placements
- `blocks{}` - Blocked tile grid
- `script{}` - Level scripting
- `briefing{}` - Mission briefing
- `briefingsuccess{}` - Success message
- `briefingfailure{}` - Failure message
- `landslidefrequency{}` - Landslide timing
- `lavaspread{}` - Lava spread timing

## Section Reference

### info{} - Level Configuration
Required section containing level metadata.

**Essential Properties:**
```
info{
    rowcount: 25               // Grid height (required)
    colcount: 25               // Grid width (required)
    biome: rock               // rock, ice, or lava
    levelname: My Level       // Display name
    creator: Author Name      // Level designer
}
```

**Camera Properties:**
```
camerapos: Translation: X=2250.0 Y=2250.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
camerazoom: 150.0
```

**Environmental Properties:**
```
oxygen: 1000.0                // Oxygen timer
erosioninitialwaittime: 60   // Seconds before erosion
erosionscale: 1.0            // Erosion intensity
opencaves: 6,18/18,20/       // Pre-opened connections
```

**Resource Properties:**
```
initialcrystals: 10          // Starting crystals
initialore: 5                // Starting ore
```

**Enemy Properties:**
```
spiderrate: 25               // Spawn rate percentage
spidermin: 0                 // Minimum spawns
spidermax: 5                 // Maximum spawns
```

### tiles{} - Terrain Grid
Defines the tile type for each grid position. Values are comma-separated with rows on separate lines.

```
tiles{
    1,1,26,26,26,
    1,1,30,30,30,
    1,1,34,34,34,
    1,1,38,38,38,
    1,1,1,1,1,
}
```

### height{} - Elevation Grid
Defines terrain height (0-15) for each position.

```
height{
    0,0,1,2,3,
    0,0,2,3,4,
    0,0,3,4,5,
    0,0,2,3,4,
    0,0,1,2,3,
}
```

### objectives{} - Win Conditions
Defines what players must accomplish. Multiple objectives are combined with commas.

**Resource Collection:**
```
objectives{
    resources: 50,25,0 / Collect 50 crystals and 25 ore
}
```

**Building Construction:**
```
objectives{
    buildings: BuildingToolStore_C,2 / Build 2 Tool Stores
}
```

**Discovery:**
```
objectives{
    discovers: 15,8 / Find the hidden cavern
}
```

**Custom Variables:**
```
objectives{
    variables: bCreaturesCaged==true / Capture all creatures
}
```

### buildings{} - Pre-placed Buildings
Defines buildings that exist at level start.

```
buildings{
    type: BuildingToolStore_C
    ID: ToolStore01
    essential: true
    coordinates{
        Translation: X=2250.0 Y=2250.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
    }
    Level: 0
    Teleport: 1
    HP: MAX
}
```

### script{} - Level Scripting
Implements custom logic and events.

```
script{
    string: MyVariable = "Hello"
    int: Counter = 0
    
    event: onLevelStart
    {
        msg: Welcome to the level!
        SetObjectiveSwitch: true
    }
    
    event: onBuildingComplete : BuildingToolStore_C
    {
        AddCrystals: 10
        msg: Tool Store built! +10 crystals
    }
}
```

## Tile System

### Tile ID Categories

#### Basic Terrain (1-12)
- `1`: Ground - Buildable floor
- `2-5`: Rubble 1-4 - Cave-in debris
- `6`: Lava - Instant destruction
- `7-10`: Erosion 4-1 - Stability levels
- `11`: Water - Requires upgrades
- `12`: Slimy Slug Hole - Spawn point

#### Power Paths (13-25)
- `13`: In Progress
- `14-15`: Building connection (unpowered/powered)
- `16-25`: Path configurations (1-4 connections)

#### Wall Types (26-49)
Each wall type has 4 variants:
- Base: Standard wall
- +1: Corner variant
- +2: Edge variant
- +3: Intersect variant

Wall materials:
- `26-29`: Dirt (easy)
- `30-33`: Loose Rock (unstable)
- `34-37`: Hard Rock (slow)
- `38-41`: Solid Rock (very slow)
- `42-45`: Crystal Seam (yields crystals)
- `46-49`: Ore Seam (yields ore)

#### Special Tiles (50-65)
- `50-53`: Recharge Seam
- `54-62`: Various rubble types
- `63`: Invisible barrier
- `64`: Lava erosion source
- `65`: Undiscovered cavern

#### Reinforced Variants (76-115)
Add 50 to base tile ID for reinforced version:
- `76-79`: Reinforced Dirt
- `80-83`: Reinforced Loose Rock
- etc.

## Coordinate System

The game uses two coordinate systems:

### Grid Coordinates
- Zero-indexed (0 to rowcount-1, 0 to colcount-1)
- Used in tiles, height, resources sections
- Format: `row,col`

### World Coordinates
- Each tile is 450 units
- Center of tile [0,0] is at world (225, 225)
- Formula: `world = (grid * 450) + 225`
- Used for entity placement

## Entity System

### Building Types
```
BuildingToolStore_C         // Essential starting building
BuildingPowerStation_C      // Generates power
BuildingTeleportPad_C       // Teleport Rock Raiders
BuildingOreRefinery_C       // Process ore
BuildingCanteen_C           // Heal Rock Raiders
BuildingGeologicalCenter_C  // Scan for resources
BuildingSupportStation_C    // Repair vehicles
BuildingUpgradeStation_C    // Upgrade vehicles
BuildingDocks_C             // Water vehicle access
```

### Vehicle Types
```
VehicleSmallTransportTruck_C  // Basic transport
VehicleLMLC_C                 // Loader
VehicleSMLC_C                 // Small Mobile Laser Cutter
VehicleGraniteGrinder_C       // Heavy driller
VehicleChromeCrusher_C        // Combat vehicle
```

### Creature Types
```
CreatureRockMonster_C    // Basic enemy
CreatureLavaMonster_C    // Fire-based enemy
CreatureIceMonster_C     // Ice-based enemy
CreatureSlimySlug_C      // Sap power from buildings
CreatureSmallSpider_C    // Fast, weak enemy
CreatureBat_C            // Flying enemy
```

## Scripting

### Variable Types
- `string`: Text values
- `int`: Whole numbers
- `float`: Decimal numbers
- `bool`: true/false

### Common Events
```
onLevelStart              // When level begins
onBuildingComplete        // Building finished
onObjectiveComplete       // Objective achieved
onUnitDestroyed          // Unit/building destroyed
onCrystalCollected       // Crystal collected
onOreCollected           // Ore collected
```

### Common Commands
```
msg: Display this text              // Show message
SetObjectiveSwitch: true/false      // Control objectives
AddCrystals: 10                     // Give resources
RemoveCrystals: 5
SpawnCreature: type, x, y           // Spawn enemy
CreateLandslide: x, y               // Trigger landslide
```

## Best Practices

### Map Design
1. **Always include a Tool Store** - Required for most levels
2. **Provide buildable ground** - At least 5x5 area near start
3. **Balance resources** - Ensure objectives are achievable
4. **Test pathfinding** - Ensure all areas are accessible
5. **Place spawn points carefully** - Away from starting area

### Performance
1. **Limit map size** - 50x50 maximum recommended
2. **Minimize creatures** - Too many impact performance
3. **Use height sparingly** - Complex terrain slows pathfinding
4. **Optimize scripts** - Avoid complex calculations

### Validation
1. **Check coordinates** - Must be within grid bounds
2. **Verify tile IDs** - Use only valid IDs (1-299)
3. **Test objectives** - Ensure they're completable
4. **Validate entities** - Check spawn positions

### Common Pitfalls
- Forgetting semicolons in info section
- Using 1-indexed instead of 0-indexed coordinates
- Placing buildings on non-ground tiles
- Creating isolated areas with no access
- Setting impossible objectives