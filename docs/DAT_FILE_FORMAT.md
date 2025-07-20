# Manic Miner .dat File Format Documentation

## Overview

Manic Miner .dat files are text-based level definition files that define all aspects of a game level including terrain, objectives, scripts, and entity placements. Files use Windows-style line endings (CRLF) and follow a section-based structure.

## File Structure

A .dat file consists of multiple sections, each with the format:
```
sectionname{
    content
}
```

## Sections Reference

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

**Fields:**
- `rowcount`: Number of rows in the level grid (required)
- `colcount`: Number of columns in the level grid (required)
- `camerapos`: Initial camera position in format `Translation: X=float Y=float Z=float Rotation: P=float Y=float R=float Scale X=float Y=float Z=float`
- `camerazoom`: Initial camera zoom level (float)
- `biome`: Level biome type (`rock`, `ice`, `lava`)
- `creator`: Level creator name
- `levelname`: Display name of the level
- `version`: Level version string
- `opencaves`: List of initially open cave connections in format `row1,col1/row2,col2/`
- `oxygen`: Oxygen level/timer (float)
- `initialcrystals`: Starting crystal count
- `initialore`: Starting ore count
- `spiderrate`: Spider spawn rate percentage
- `spidermin`: Minimum spider spawn count
- `spidermax`: Maximum spider spawn count
- `erosioninitialwaittime`: Time before erosion starts
- `erosionscale`: Erosion intensity multiplier

Example:
```
info{
    rowcount:22
    colcount:22
    camerapos:Translation: X=3300.000 Y=3300.000 Z=0.000 Rotation: P=44.999989 Y=-89.999992 R=0.000002 Scale X=1.000 Y=1.000 Z=1.000
    biome:rock
    creator:Darren
    levelname:Training Grounds!
    spiderrate:25
    spidermin:0
    spidermax:0
    initialcrystals:19
    opencaves:6,18/18,20/
}
```

### 3. tiles{}
Required section defining the tile type for each grid position. Comma-separated values with rows separated by commas at line end.

**Common Tile IDs:**
- `1`: Ground - Basic floor tile (RGB: 124,92,70)
- `5`: Hot Rock - Nearly molten, dangerous (RGB: 92,58,40)
- `6`: Lava - Instant destruction (RGB: 255,50,0)
- `11`: Water - Requires vehicles with upgrades (RGB: 30,84,197)
- `12`: Slimy Slug Hole - Creature spawn point (RGB: 180,180,20)
- `14`: Power Path - Conductive ground for buildings (RGB: 220,220,220)
- `24`: Loose Rock - Easy to drill (RGB: 180,150,100)
- `26`: Dirt - Soft, drillable (RGB: 169,109,82)
- `30`: Loose Rock - May cause cave-ins (RGB: 139,104,86)
- `34`: Hard Rock - Slow to drill (RGB: 77,53,50)
- `38`: Solid Rock - Impenetrable wall (RGBA: 0,0,0,0 - transparent)
- `42`: Energy Crystal Seam - Primary power source (RGB: 206,233,104)
- `46`: Ore Seam - For upgrades (RGB: 200,85,30)
- `50`: Recharge Seam - Powers electric fences (RGB: 255,255,70)
- `60-65`: Landslide Rubble - Various densities (RGB: 46,23,95 with alpha)
- `101`: Ground - Buildable surface (RGB: 124,92,70)
- `106`: Cooling Lava - Still dangerous (RGBA: 255,70,10,0.9)
- `111`: Water - Deep water hazard (RGB: 30,95,220)
- `112`: Slimy Slug Hole - Another spawn variant (RGB: 180,180,20)
- `114`: Power Path - Alternative ID (RGB: 220,220,220)
- `124`: Floating Panels - Bridges/platforms (RGBA: 70,130,180,0.9)
- `163-165`: Various rubble types from cave-ins

Example:
```
tiles{
38,38,38,38,38,38,38,38,38,38,
38,38,14,14,14,14,14,38,38,38,
38,38,14,24,24,24,14,38,38,38,
38,38,14,24,1,24,14,38,38,38,
38,38,14,14,14,14,14,38,38,38,
38,38,38,38,38,38,38,38,38,38,
}
```

### 4. height{}
Required section defining terrain height at each grid position. Same format as tiles. Heights are integers, with 0 being bedrock.

Example:
```
height{
0,0,0,0,0,0,0,0,0,0,
0,200,200,200,200,200,200,200,200,0,
0,200,200,200,200,200,200,200,200,0,
0,200,200,200,100,200,200,200,200,0,
0,200,200,200,200,200,200,200,200,0,
0,0,0,0,0,0,0,0,0,0,
}
```

### 5. resources{}
Defines resource placement on the map. Contains subsections:
- `crystals:` - Energy crystal placement (0 or 1 for each tile)
- `ore:` - Ore placement (0 or 1 for each tile)

Example:
```
resources{
crystals:
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,1,0,0,0,0,0,
0,0,0,1,0,1,0,0,0,0,
0,0,0,0,1,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
ore:
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,1,0,0,0,1,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,
}
```

### 6. objectives{}
Defines level completion objectives.

**Formats:**
- `resources: crystals,ore,studs` - Collect resources (e.g., `resources: 80,0,100`)
- `building:BuildingType_C` - Build specific building
- `findminer:minerID` - Find lost miner
- `discovertile:x,y/Description` - Discover specific location
- `variable:condition/Description` - Script variable condition

Example:
```
objectives{
resources: 125,0,0
variable:FoundCodes==true/Find the teleportation codes
}
```

### 7. buildings{}
Lists pre-placed buildings with their positions and properties.

**Building Types:**
- `BuildingToolStore_C` - Tool Store (main base)
- `BuildingPowerStation_C` - Power Station
- `BuildingTeleportPad_C` - Teleport Pad
- `BuildingSuperTeleport_C` - Super Teleport
- `BuildingOreRefinery_C` - Ore Refinery
- `BuildingCanteen_C` - Canteen
- `BuildingGeologicalCenter_C` - Geological Center
- `BuildingSupportStation_C` - Support Station
- `BuildingUpgradeStation_C` - Upgrade Station
- `BuildingDocks_C` - Docks
- `BuildingElectricFence_C` - Electric Fence

**Format:**
```
BuildingType_C,Translation: X=float Y=float Z=float Rotation: P=float Y=float R=float Scale X=float Y=float Z=float[,Level=int][,Essential=true][,Teleport=True]
```

Example:
```
buildings{
BuildingToolStore_C,Translation: X=6450.000 Y=12150.000 Z=0.000 Rotation: P=0.000000 Y=-89.999992 R=0.000000 Scale X=1.000 Y=1.000 Z=1.000
BuildingPowerStation_C,Translation: X=2850.000 Y=2850.000 Z=0.000 Rotation: P=0.000000 Y=0.000000 R=0.000000 Scale X=1.000 Y=1.000 Z=1.000,Level=2,Essential=true
}
```

### 8. vehicles{}
Lists pre-placed vehicles.

**Vehicle Types:**
- `VehicleSmallTransportTruck_C` - Small Transport Truck
- `VehicleLMLC_C` - Large Mobile Laser Cutter
- `VehicleSMLC_C` - Small Mobile Laser Cutter
- `VehicleLoaderDozer_C` - Loader Dozer
- `VehicleGraniteGrinder_C` - Granite Grinder
- `VehicleTunnelScout_C` - Tunnel Scout
- `VehicleTunnelTransport_C` - Tunnel Transport
- `VehicleChromeCrusher_C` - Chrome Crusher
- `VehicleCargoCarrier_C` - Cargo Carrier
- `VehicleSmallDigger_C` - Small Digger
- `VehicleRapidRider_C` - Rapid Rider

**Format:**
```
VehicleType_C,Translation: X=float Y=float Z=float Rotation: P=float Y=float R=float Scale X=float Y=float Z=float[,driver=int]
```

### 9. creatures{}
Lists pre-placed creatures.

**Creature Types:**
- `CreatureRockMonster_C` - Rock Monster
- `CreatureLavaMonster_C` - Lava Monster
- `CreatureIceMonster_C` - Ice Monster
- `CreatureSlimySlug_C` - Slimy Slug
- `CreatureSmallSpider_C` - Small Spider
- `CreatureBat_C` - Bat

**Format:**
```
CreatureType_C,Translation: X=float Y=float Z=float Rotation: P=float Y=float R=float Scale X=float Y=float Z=float[,ID=name][,Sleep=true]
```

### 10. miners{}
Lists pre-placed miners.

**Format:**
```
Pilot_C,Translation: X=float Y=float Z=float Rotation: P=float Y=float R=float Scale X=float Y=float Z=float[,ID=int]
```

### 11. blocks{}
Defines blocked/undiggable tiles using same format as tiles section. Use `1` for blocked, `0` for normal.

### 12. script{}
Contains level scripting using event-driven syntax.

**Script Syntax:**
- `init::;` - Initialization block
- `variable Type Name=Value` - Variable declaration
- `EventName::;` - Event declaration
- `(condition)EventName;` - Conditional trigger
- `command:parameters;` - Command execution

**Common Commands:**
- `msg:messageText;` - Display message
- `pan:x,y;` - Pan camera to coordinates
- `wait:seconds;` - Wait duration
- `truewait:seconds;` - Wait (blocks other events)
- `shake:intensity;` - Shake screen
- `drill:x,y[,tileID];` - Drill at location
- `place:x,y,tileID;` - Place tile
- `emerge:MonsterType:x,y[:parameters];` - Spawn creature
- `sound:soundFile;` - Play sound
- `enable:entityName;` - Enable entity
- `disable:entityName;` - Disable entity
- `wake:creatureID;` - Wake sleeping creature

Example:
```
script{
init::;
int AlertLevel=0;
string WelcomeMsg="Welcome to the caverns!"

StartEvent::;
msg:WelcomeMsg;
wait:5;
pan:10,10;

((AlertLevel>5))DangerEvent;

DangerEvent::;
shake:2;
emerge:CreatureLavaMonster_C:15,15:awake;
}
```

### 13. briefing{}
Mission briefing text shown before level starts.

### 14. briefingsuccess{}
Success message shown on level completion.

### 15. briefingfailure{}
Failure message shown on level failure.

### 16. landslidefrequency{}
Grid defining landslide probability for each tile (0-100).

### 17. lavaspread{}
Grid defining lava spread rate for each tile.

## Coordinate System

- Grid coordinates: (row, column) starting from (0,0) at top-left
- World coordinates: X = column * 150, Y = row * 150
- Z coordinates: Elevation above terrain
- Rotation: P=Pitch, Y=Yaw, R=Roll (in degrees)
- Scale: Typically X=1.000 Y=1.000 Z=1.000

## Best Practices

1. Always include required sections (info, tiles, height)
2. Ensure rowcount/colcount match grid dimensions
3. Use consistent line endings (CRLF)
4. Test scripts for syntax errors
5. Validate tile IDs are within valid ranges
6. Ensure objectives are achievable
7. Place Tool Store for level start