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
    // Format: crystals,ore,studs / Description
}
```

**Building Construction:**
```
objectives{
    building: BuildingToolStore_C,2 / Build 2 Tool Stores
    building: BuildingPowerStation_C / Build a Power Station
}
```

**Discovery & Rescue:**
```
objectives{
    discovertile: 15,8 / Find the hidden cavern
    findbuilding: 20,25 / Locate the lost building
    findminer: 3 / Rescue miner with ID 3
    units: 10 / Rescue 10 Rock Raiders
}
```

**Custom Variables:**
```
objectives{
    variable: ObjectiveComplete==true / Complete the mission
    variable: AllBuildingsConstructed==true / Build all structures
    variable: CreatureCount==0 / Eliminate all creatures
}
```

**Combined Objectives:**
```
objectives{
    resources: 25,50,0 / Collect resources,
    building: BuildingGeologicalCenter_C / Build Geological Center,
    variable: HiddenCaveFound==true / Find the hidden cave
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
Implements custom logic and events using a powerful event-driven system.

#### Variable Declarations
```
script{
    // Basic types
    string MessageText="Welcome!"
    bool ObjectiveComplete=false
    int CrystalCount=0
    float TimeElapsed=0.0
    
    // Special types
    arrow GuideArrow=green     // Arrow indicators
    timer SpawnTimer=10,5,3,SpawnEvent  // delay,min,max,event
}
```

#### Event System
```
script{
    // Basic event
    ShowIntro::
    msg:MessageText;
    pan:15,20;      // Pan camera to coordinates
    wait:3;         // Wait 3 seconds
    highlightarrow:5,5,GuideArrow;
    
    // Conditional trigger
    ((time>10))CheckProgress::
    if(crystals>=25)[ShowSuccess];
    else[ShowHint];
    
    // When trigger (continuous check)
    when(crystals>=50)[WinLevel];
    when(buildings.BuildingToolStore_C==0)[LoseLevel];
}
```

#### Advanced Commands
```
script{
    // Camera control
    pan:row,col              // Move camera
    shake:intensity,duration // Screen shake
    
    // Arrows and highlighting  
    highlightarrow:row,col,arrowname
    removearrow:arrowname
    
    // Dynamic spawning
    spawncap:CreatureType,min,max
    spawnwave:creature,count,interval
    addrandomspawn:CreatureType,min,max
    
    // Resource manipulation
    drill:row,col           // Force drill wall
    place:row,col,tileID    // Change tile
    reinforce:row,col       // Reinforce wall
    
    // Sound and messages
    playsound:soundname
    msg:stringvariable      // Display message
    
    // Flow control
    wait:seconds
    win:                    // Win level
    lose:                   // Lose level
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

#### Special Tiles (50-165)
- `50-53`: Recharge Seam (powers electric fences)
- `54-62`: Various rubble types
- `60-61`: Rubble (drillable)
- `62`: Path rubble
- `63`: Invisible barrier
- `64`: Lava erosion source
- `65`: Undiscovered cavern
- `101`: Reinforced ground
- `106`: Reinforced lava
- `111`: Reinforced water
- `112`: Reinforced slug hole
- `114`: Shore/beach tile
- `124`: Energy crystal formation
- `163-165`: Landslide/dense/unstable rubble

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

### Script Command Reference

#### Message & UI Commands
```
msg:stringvar                       // Display message
wait:seconds                        // Pause script
pan:row,col                        // Move camera to tile
shake:intensity,duration           // Screen shake effect
```

#### Arrow & Highlighting
```
arrow ArrowName=color              // Declare arrow (red,green,blue,yellow)
highlightarrow:row,col,arrowname  // Show arrow at location
removearrow:arrowname              // Remove specific arrow
```

#### Resource Commands
```
crystals:amount                    // Add/remove crystals
ore:amount                         // Add/remove ore
studs:amount                       // Add/remove studs
```

#### Spawning Commands
```
spawn:type,row,col                 // Spawn single entity
spawncap:type,min,max              // Set spawn limits
spawnwave:type,count,interval      // Wave spawning
addrandomspawn:type,min,max        // Random spawn points
```

#### Map Manipulation
```
drill:row,col                      // Force drill tile
place:row,col,tileID               // Change tile type
reinforce:row,col                  // Make wall reinforced
teleport:unitID,row,col            // Move unit
destroy:row,col                    // Destroy tile/entity
```

#### Game Flow
```
win:                               // Victory
lose:                              // Defeat
objective:text                     // Update objective display
timer:name,start/stop              // Control timers
```

#### Conditionals
```
if(condition)[EventName]           // One-time check
when(condition)[EventName]         // Continuous check

// Condition examples:
crystals>25                        // Resource check
time>60                            // Time elapsed
buildings.BuildingType>0           // Building count
vehicles.VehicleType>0             // Vehicle count
miners>5                           // Miner count
ObjectiveComplete==true            // Variable check
```

## Best Practices

### Map Design
1. **Always include a Tool Store** - Required for most levels
2. **Provide buildable ground** - At least 5x5 area near start
3. **Balance resources** - Ensure objectives are achievable
4. **Test pathfinding** - Ensure all areas are accessible
5. **Place spawn points carefully** - Away from starting area
6. **Use height variation** - Creates visual interest and strategic depth
7. **Plan power paths** - Buildings need connected power
8. **Layer objectives** - Primary goals with optional challenges

### Script Organization
1. **Declare all variables first** - At the top of script section
2. **Name events clearly** - ShowIntro, CheckProgress, WinCondition
3. **Use arrow colors consistently** - Green=go, Red=danger, etc.
4. **Chain events logically** - Intro→Tutorial→Gameplay→Victory
5. **Test edge cases** - What if player does unexpected actions?

### Resource Balance Guidelines
- **Tutorial levels**: 50-100 surface crystals, minimal threats
- **Easy levels**: 25-50 crystals per objective requirement
- **Medium levels**: 15-25 crystals per requirement, hidden caches
- **Hard levels**: 10-15 crystals, heavy reliance on seams
- **Expert levels**: Scarce resources, time pressure, multiple threats

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
- Missing Tool Store (essential for gameplay)
- Incorrect tile IDs (especially 163-165)
- Unbalanced spawn rates causing difficulty spikes
- Script syntax errors (missing semicolons, brackets)
- Circular script dependencies (infinite loops)
- Forgetting to declare variables before use
- Power path disconnections
- Unreachable resources behind solid rock

### Advanced Techniques

#### Dynamic Difficulty
```
script{
    int Difficulty=0
    
    when(time>300)[IncreaseDifficulty];
    when(miners<3)[DecreaseDifficulty];
    
    IncreaseDifficulty::
    Difficulty:Difficulty+1;
    spawncap:CreatureRockMonster_C,Difficulty,Difficulty*2;
    
    DecreaseDifficulty::
    Difficulty:Difficulty-1;
    spawncap:CreatureRockMonster_C,0,Difficulty;
}
```

#### Multi-Stage Objectives
```
script{
    bool Stage1=false
    bool Stage2=false
    
    when(crystals>=25 and Stage1==false)[CompleteStage1];
    when(buildings.BuildingPowerStation_C>0 and Stage2==false)[CompleteStage2];
    
    CompleteStage1::
    Stage1:true;
    msg:Stage1Text;
    objective:Build a Power Station;
    
    CompleteStage2::
    Stage2:true;
    msg:Stage2Text;
    objective:Find the hidden cache;
}
```

#### Environmental Storytelling
```
script{
    // Breadcrumb trail of messages
    when(discovertile[10,5])[FindClue1];
    when(discovertile[15,8])[FindClue2];
    when(discovertile[20,12])[FindFinalClue];
    
    FindClue1::
    msg:Clue1Text;
    highlightarrow:15,8,YellowArrow;
    
    FindClue2::
    msg:Clue2Text;
    removearrow:YellowArrow;
    highlightarrow:20,12,RedArrow;
}
```