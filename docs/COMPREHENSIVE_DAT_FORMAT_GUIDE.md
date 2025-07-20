# Comprehensive Manic Miners DAT File Format Guide

## Table of Contents
1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Complete Tile Reference](#complete-tile-reference)
4. [Section Reference](#section-reference)
5. [Coordinate System](#coordinate-system)
6. [Best Practices](#best-practices)

## Overview

Manic Miner .dat files are text-based level definition files that define all aspects of a game level including terrain, objectives, scripts, and entity placements. Files use Windows-style line endings (CRLF) and follow a section-based structure.

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

## Complete Tile Reference

### Tile ID System
- **Base tiles**: IDs 1-65 represent the fundamental tile types
- **Reinforced tiles**: IDs 76-115 are reinforced variants (base ID + 50)
- **Reinforced tiles** require significantly more drilling effort

### Basic Terrain (1-12)

| ID | Name | Description | Properties | Color (RGB) |
|----|------|-------------|------------|-------------|
| 1 | Ground | Basic floor tile where buildings can be constructed | Can walk, Can build | 124, 92, 70 |
| 2 | Rubble Level 1 | Light rubble from cave-ins, easy to clear | Can drill | - |
| 3 | Rubble Level 2 | Medium rubble, moderate effort to clear | Can drill | - |
| 4 | Rubble Level 3 | Heavy rubble, takes time to clear | Can drill | - |
| 5 | Rubble Level 4 | Dense rubble, difficult to clear | Can drill | - |
| 6 | Lava | Molten lava - instantly destroys anything that touches it | Hazard | 255, 50, 0 |
| 7 | Erosion Level 4 | Severely eroded terrain - highly unstable | Can walk (risky) | - |
| 8 | Erosion Level 3 | Heavily eroded terrain - unstable | Can walk (risky) | - |
| 9 | Erosion Level 2 | Moderately eroded terrain | Can walk | - |
| 10 | Erosion Level 1 | Lightly eroded terrain | Can walk, Can build | - |
| 11 | Water | Deep water - vehicles need water upgrade to cross | Hazard | 30, 84, 197 |
| 12 | Slimy Slug Hole | Spawning point for Slimy Slugs | Can drill, Hazard | 180, 180, 20 |

### Power Path Network (13-25)

| ID | Name | Description | Properties |
|----|------|-------------|------------|
| 13 | Power Path In Progress | Power path under construction | Can walk |
| 14 | Power Path Building | Power path connected to building (unpowered) | Can walk |
| 15 | Power Path Building Powered | Power path connected to building (powered) | Can walk |
| 16-17 | Power Path 1 | Single direction (unpowered/powered) | Can walk |
| 18-19 | Power Path 2 Adjacent | Two adjacent connections (unpowered/powered) | Can walk |
| 20-21 | Power Path 2 Opposite | Two opposite connections (unpowered/powered) | Can walk |
| 22-23 | Power Path 3 | Three-way junction (unpowered/powered) | Can walk |
| 24-25 | Power Path 4 | Four-way junction (unpowered/powered) | Can walk |

### Wall Types (26-41)

Each wall type has 4 shape variants: Regular, Corner, Edge, Intersect

| ID Range | Type | Description | Drill Speed | Color (RGB) |
|----------|------|-------------|-------------|-------------|
| 26-29 | Dirt | Soft earth wall | Very Fast | 169, 109, 82 |
| 30-33 | Loose Rock | Unstable, may cause cave-ins | Fast | 139, 104, 86 |
| 34-37 | Hard Rock | Dense rock wall | Slow | 77, 53, 50 |
| 38-41 | Solid Rock | Impenetrable | Cannot drill | 0, 0, 0 (transparent) |

### Resource Seams (42-53)

Each seam type has 4 shape variants: Regular, Corner, Edge, Intersect

| ID Range | Type | Description | Yield | Color (RGB) |
|----------|------|-------------|-------|-------------|
| 42-45 | Crystal Seam | Energy crystals - primary power | 1-5 crystals | 206, 233, 104 |
| 46-49 | Ore Seam | Ore for building/upgrades | 1-3 ore | 200, 85, 30 |
| 50-53 | Recharge Seam | Powers electric fences | Fence power | 255, 255, 70 |

### Special Tiles (58-65)

| ID | Name | Description | Properties |
|----|------|-------------|------------|
| 58 | Roof | Cave ceiling that blocks vision and movement | Blocks all |
| 60-63 | Fake Rubble 1-4 | Decorative rubble | Can walk |
| 64-65 | Cliff Type 1-2 | Experimental cliff terrain | Cannot walk |

### Reinforced Tiles (76-115)

Reinforced variants of tiles 26-53 (walls and resources) plus cliff types (114-115). These require approximately 2x drilling time.

## Section Reference

### 1. comments{}
Optional section for level designer notes and comments. Content is ignored by the game.
```
comments{
    Level created by: Author Name
    Version: 1.0
    Notes: This is a challenging level with lava hazards
}
```

### 2. info{}
Required section containing level metadata and configuration.

**Key Fields:**
- `rowcount`, `colcount`: Grid dimensions (required)
- `levelname`: Display name
- `creator`: Author name
- `biome`: `rock`, `ice`, or `lava`
- `camerapos`: Initial camera position
- `initialcrystals`, `initialore`: Starting resources
- `opencaves`: Pre-opened connections (format: `row1,col1/row2,col2/`)
- `oxygen`: Oxygen timer
- `spiderrate`, `spidermin`, `spidermax`: Spider spawn settings
- `erosioninitialwaittime`, `erosionscale`: Erosion settings

Example:
```
info{
    rowcount:22
    colcount:22
    levelname:Training Grounds!
    creator:Darren
    biome:rock
    camerapos:Translation: X=3300.000 Y=3300.000 Z=0.000 Rotation: P=44.999989 Y=-89.999992 R=0.000002 Scale X=1.000 Y=1.000 Z=1.000
    initialcrystals:19
    opencaves:6,18/18,20/
}
```

### 3. tiles{}
Required section defining the tile type for each grid position. Comma-separated values with rows separated by commas at line end.

### 4. height{}
Required section defining terrain elevation. Same format as tiles{}.

### 5. resources{}
Optional section for crystal and ore placement. Contains two subsections:
- `crystals:` - Binary grid (0/1)
- `ore:` - Binary grid (0/1)

### 6. objectives{}
Defines level completion objectives. Multiple objectives can be specified.

**Objective Types:**
1. `resources: crystals,ore,studs` - Collect resources
2. `building:BuildingType_C` - Construct building
3. `discovertile:x,y/Description` - Reach location
4. `findbuilding:x,y` - Locate hidden building
5. `variable:condition/Description` - Script condition

Example:
```
objectives{
    building:BuildingDocks_C
    discovertile:2,48/Lost Rockraiders 1
    resources: 250,0,0
}
```

### 7. buildings{}
Pre-placed buildings with properties.

**Building Types:**
- `BuildingToolStore_C` - Main base (usually required)
- `BuildingTeleportPad_C` - Unit/material transport
- `BuildingDocks_C` - Water vehicle deployment
- `BuildingCanteen_C` - Miner training/housing
- `BuildingPowerStation_C` - Power generation
- `BuildingSupportStation_C` - Vehicle repair/recharge
- `BuildingOreRefinery_C` - Ore processing
- `BuildingGeologicalCenter_C` - Resource scanning
- `BuildingUpgradeStation_C` - Upgrades
- `BuildingMiningLaser_C` - Automated defense
- `BuildingSuperTeleport_C` - Advanced teleport

**Format:**
```
BuildingName
Translation: X=float Y=float Z=float Rotation: P=float Y=float R=float Scale X=float Y=float Z=float
Level=int
Teleport=True/False
Health=MAX/float
Powerpaths=X=int Y=int Z=int/
```

### 8. vehicles{}
Pre-placed vehicles with upgrades.

**Vehicle Types:**
- Small: `VehicleSmallDigger_C`, `VehicleSmallTransportTruck_C`, `VehicleHoverScout_C`, `VehicleTunnelScout_C`
- Medium: `VehicleLoaderDozer_C`, `VehicleRapidRider_C`, `VehicleCargoCarrier_C`, `VehicleTunnelTransport_C`
- Large: `VehicleChromeCrusher_C`, `VehicleGraniteGrinder_C`, `VehicleLMLC_C`, `VehicleSMLC_C`

**Upgrades:**
- `UpEngine` - Speed
- `UpDrill`/`UpAddDrill` - Drilling
- `UpLaser` - Weapons
- `UpScanner` - Radar range
- `UpCargoHold` - Storage
- `UpAddNav` - Navigation

**Format:**
```
VehicleName
Translation: X=float Y=float Z=float Rotation: P=float Y=float R=float Scale X=float Y=float Z=float
upgrades=Upgrade1/Upgrade2/,HP=MAX/float,driver=NO/minerID,ID=int
```

### 9. creatures{}
Enemy creature placements.

**Creature Types:**
- `CreatureRockMonster_C`
- `CreatureLavaMonster_C`
- `CreatureIceMonster_C`
- `CreatureSlimySlug_C`
- `CreatureSmallSpider_C`
- `CreatureBat_C`

### 10. miners{}
Rock Raider placements with skills.

**Tools:** Drill, Shovel, Hammer, Sandwich, Spanner
**Jobs:** JobDriver, JobSailor, JobPilot, JobGeologist, JobEngineer, JobExplosivesExpert

**Format:**
```
ID=minerID/optionalName
Translation: X=float Y=float Z=float Rotation: P=float Y=float R=float Scale X=float Y=float Z=float
Skill1/Skill2/Level/
```

### 11. blocks{}
Binary grid (0/1) defining blocked tiles.

### 12. script{}
Event-driven level scripting.

**Commands:**
- `msg:text` - Display message
- `pan:x,y` - Camera movement
- `wait:seconds` - Delay
- `shake:intensity` - Screen shake
- `drill:x,y,tileID` - Force drill
- `place:x,y,tileID` - Place tile
- `emerge:CreatureType:x,y` - Spawn creature
- `sound:file` - Play sound
- `enable/disable:entity` - Toggle entities

### 13-15. Briefing Sections
- `briefing{}` - Mission start text
- `briefingsuccess{}` - Victory message
- `briefingfailure{}` - Defeat message

### 16-17. Timed Event Sections
Both use format: `timeInSeconds:x1,y1/x2,y2/`

- `landslidefrequency{}` - Landslide timing
- `lavaspread{}` - Lava expansion timing

## Coordinate System

- **Grid coordinates**: (row, column) starting from (0,0) at top-left
- **World coordinates**: X = column × 150, Y = row × 150
- **Z coordinates**: Elevation above terrain
- **Rotation**: P=Pitch, Y=Yaw, R=Roll (in degrees)
- **Scale**: Typically X=1.000 Y=1.000 Z=1.000

## Best Practices

1. **Structure**
   - Always include required sections (info, tiles, height)
   - Ensure rowcount/colcount match grid dimensions
   - Use consistent CRLF line endings

2. **Gameplay Balance**
   - Place Tool Store for level start
   - Balance resource distribution
   - Ensure objectives are achievable
   - Test power path connectivity

3. **Tiles**
   - Validate tile IDs are within valid ranges
   - Use reinforced tiles sparingly
   - Plan erosion and hazard placement carefully

4. **Scripting**
   - Test scripts for syntax errors
   - Use meaningful variable names
   - Comment complex logic

5. **Performance**
   - Limit creature spawns
   - Avoid excessive script triggers
   - Keep maps reasonable size (typically 20-60 tiles square)