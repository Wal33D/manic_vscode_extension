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

**Tile ID System:**
- Base tiles: IDs 1-65
- Reinforced tiles: Base ID + 50 (e.g., Dirt=26, Dirt_Reinforced=76)
- Reinforced tiles require more drilling effort

**Tile Categories:**

#### Basic Terrain (1-12)
- `1`: Ground - Basic floor tile where buildings can be constructed (RGB: 124,92,70)
- `2-5`: Rubble Levels 1-4 - Increasing density of cave-in debris
- `6`: Lava - Molten lava, instantly destroys anything (RGB: 255,50,0)
- `7-10`: Erosion Levels 4-1 - Terrain stability decreases with higher levels
- `11`: Water - Deep water, vehicles need upgrades to cross (RGB: 30,84,197)
- `12`: Slimy Slug Hole - Creature spawn point (RGB: 180,180,20)

#### Power Paths (13-25)
- `13`: Power Path In Progress - Under construction
- `14`: Power Path Building - Connected to building (unpowered) (RGB: 220,220,220)
- `15`: Power Path Building Powered - Connected to building (powered)
- `16-17`: Power Path 1 - Single direction (unpowered/powered)
- `18-19`: Power Path 2 Adjacent - Two adjacent connections (unpowered/powered)
- `20-21`: Power Path 2 Opposite - Two opposite connections (unpowered/powered)
- `22-23`: Power Path 3 - Three-way junction (unpowered/powered)
- `24-25`: Power Path 4 - Four-way junction (unpowered/powered)

#### Wall Types (26-41)
Each wall type has 4 variants: Regular, Corner, Edge, Intersect
- `26-29`: Dirt - Soft earth, very easy to drill (RGB: 169,109,82)
- `30-33`: Loose Rock - Unstable, may cause cave-ins (RGB: 139,104,86)
- `34-37`: Hard Rock - Dense rock, slow to drill (RGB: 77,53,50)
- `38-41`: Solid Rock - Impenetrable, cannot be drilled (RGBA: 0,0,0,0)

#### Resource Seams (42-53)
Each seam type has 4 variants: Regular, Corner, Edge, Intersect
- `42-45`: Crystal Seam - Contains energy crystals (RGB: 206,233,104)
- `46-49`: Ore Seam - Contains ore for building/upgrades (RGB: 200,85,30)
- `50-53`: Recharge Seam - Powers electric fences (RGB: 255,255,70)

#### Special Tiles (58-65)
- `58`: Roof - Cave ceiling, blocks vision
- `60-63`: Fake Rubble 1-4 - Decorative, doesn't affect gameplay
- `64-65`: Cliff Type 1-2 (Experimental) - Experimental cliff terrain

#### Reinforced Tiles (76-115)
- `76-103`: Reinforced versions of tiles 26-53 (walls and resources)
- `114-115`: Reinforced cliff types

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
Defines level completion objectives. Multiple objectives can be specified.

**Objective Types:**

1. **resources** - Collect specified amounts of resources
   - Format: `resources: crystals,ore,studs`
   - Example: `resources: 125,50,0` (collect 125 crystals, 50 ore, 0 studs)

2. **building** - Construct a specific building type
   - Format: `building:BuildingType_C`
   - Example: `building:BuildingGeologicalCenter_C`

3. **discovertile** - Discover (reach or drill to) a specific location
   - Format: `discovertile:x,y/Description`
   - Example: `discovertile:30,22/Find the lost Rock Raider`

4. **findbuilding** - Locate a hidden building at specific coordinates
   - Format: `findbuilding:x,y`
   - Example: `findbuilding:39,3`

5. **variable** - Complete when a script variable condition is met
   - Format: `variable:condition/Description`
   - Example: `variable:FoundCodes==true/Find the teleportation codes`

Example:
```
objectives{
building:BuildingDocks_C
discovertile:2,48/Lost Rockraiders 1
building:BuildingGeologicalCenter_C
resources: 250,0,0
}
```

### 7. buildings{}
Lists pre-placed buildings with their positions and properties.

**Building Types:**
- `BuildingToolStore_C` - Tool Store (main base, required for most levels)
- `BuildingTeleportPad_C` - Teleport Pad (transports units and materials)
- `BuildingDocks_C` - Docks (water vehicle deployment)
- `BuildingCanteen_C` - Canteen (trains and houses Rock Raiders)
- `BuildingPowerStation_C` - Power Station (generates power for the base)
- `BuildingSupportStation_C` - Support Station (repairs vehicles and recharges energy)
- `BuildingOreRefinery_C` - Ore Refinery (processes ore into usable materials)
- `BuildingGeologicalCenter_C` - Geological Center (scans for hidden resources)
- `BuildingUpgradeStation_C` - Upgrade Station (upgrades vehicles and buildings)
- `BuildingMiningLaser_C` - Mining Laser (automated drilling defense)
- `BuildingSuperTeleport_C` - Super Teleport (advanced teleportation)

**Format:**
```
BuildingName
Translation: X=float Y=float Z=float Rotation: P=float Y=float R=float Scale X=float Y=float Z=float
Level=int
Teleport=True/False
Health=MAX/float
Powerpaths=X=int Y=int Z=int/X=int Y=int Z=int/
```

Example:
```
buildings{
BuildingToolStore_C
Translation: X=6450.000 Y=12150.000 Z=0.000 Rotation: P=0.000000 Y=-89.999992 R=0.000000 Scale X=1.000 Y=1.000 Z=1.000
Level=1
Teleport=False
Health=MAX
Powerpaths=X=0 Y=3 Z=5/

BuildingMiningLaser_C
Translation: X=1650.000 Y=1650.000 Z=0.000 Rotation: P=0.000000 Y=-89.999992 R=0.000000 Scale X=1.000 Y=1.000 Z=1.000
Level=1
Teleport=False
Health=MAX
Powerpaths=X=0 Y=5 Z=5/

}
```

### 8. vehicles{}
Lists pre-placed vehicles with their properties and upgrades.

**Vehicle Types:**
- `VehicleLoaderDozer_C` - Loader Dozer (versatile construction vehicle)
- `VehicleLMLC_C` - Large Mobile Laser Cutter (heavy drilling)
- `VehicleChromeCrusher_C` - Chrome Crusher (large drilling vehicle)
- `VehicleRapidRider_C` - Rapid Rider (fast scout vehicle)
- `VehicleCargoCarrier_C` - Cargo Carrier (transport vehicle)
- `VehicleSMLC_C` - Small Mobile Laser Cutter (light drilling)
- `VehicleSmallTransportTruck_C` - Small Transport Truck (basic transport)
- `VehicleSmallDigger_C` - Small Digger (compact drilling)
- `VehicleTunnelScout_C` - Tunnel Scout (exploration vehicle)
- `VehicleHoverScout_C` - Hover Scout (water-capable scout)
- `VehicleTunnelTransport_C` - Tunnel Transport (armored transport)
- `VehicleGraniteGrinder_C` - Granite Grinder (heavy-duty drilling)

**Vehicle Upgrades:**
- `UpEngine` - Increased speed
- `UpDrill` - Enhanced drilling capability
- `UpAddDrill` - Additional drill
- `UpLaser` - Laser weapon system
- `UpScanner` - Extended radar range
- `UpCargoHold` - Increased storage capacity
- `UpAddNav` - Navigation system

**Format:**
```
VehicleName
Translation: X=float Y=float Z=float Rotation: P=float Y=float R=float Scale X=float Y=float Z=float
upgrades=UpgradeName1/UpgradeName2/,HP=MAX/float,driver=NO/minerID,ID=int
```

Example:
```
vehicles{
VehicleRapidRider_C
Translation: X=820.883 Y=13300.196 Z=5.852 Rotation: P=0.000082 Y=89.511635 R=-0.012451 Scale X=0.910 Y=0.910 Z=0.910
upgrades=UpAddDrill/,HP=MAX,driver=4

VehicleLoaderDozer_C
Translation: X=1500.000 Y=1500.000 Z=0.000 Rotation: P=0.000000 Y=0.000000 R=0.000000 Scale X=1.000 Y=1.000 Z=1.000
upgrades=UpEngine/UpScanner/,HP=MAX,driver=NO

}
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
Lists pre-placed Rock Raiders (miners) with their properties and skills.

**Miner Tools/Equipment:**
- `Drill` - Basic drilling tool
- `Shovel` - Rubble clearing tool
- `Hammer` - Construction/repair tool
- `Sandwich` - Food item (morale boost)
- `Spanner` - Advanced repair tool

**Miner Jobs/Skills:**
- `JobDriver` - Can operate vehicles
- `JobSailor` - Can operate water vehicles
- `JobPilot` - Can operate flying vehicles
- `JobGeologist` - Can identify hidden resources
- `JobEngineer` - Enhanced building/repair skills
- `JobExplosivesExpert` - Can use dynamite

**Format:**
```
ID=minerID/optionalName
Translation: X=float Y=float Z=float Rotation: P=float Y=float R=float Scale X=float Y=float Z=float
Skill1/Skill2/Level/Level/
```

Example:
```
miners{
ID=1/Chief
Translation: X=6300.000 Y=12000.000 Z=0.000 Rotation: P=0.000000 Y=45.000000 R=0.000000 Scale X=1.000 Y=1.000 Z=1.000
Drill/JobDriver/Level/Level/

ID=2
Translation: X=6450.000 Y=12150.000 Z=0.000 Rotation: P=0.000000 Y=0.000000 R=0.000000 Scale X=1.000 Y=1.000 Z=1.000
Shovel/JobGeologist/Level/

}
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
Defines the frequency/probability of landslides occurring at specific tiles. Uses a time-based event system.

**Format:**
```
timeInSeconds:x1,y1/x2,y2/x3,y3/
```

Example:
```
landslidefrequency{
30:5,10/6,10/7,10/
60:15,20/16,20/
120:25,30/26,30/27,30/
}
```

This means:
- At 30 seconds: Landslides may occur at tiles (5,10), (6,10), (7,10)
- At 60 seconds: Additional landslides at (15,20), (16,20)
- At 120 seconds: More landslides at (25,30), (26,30), (27,30)

### 17. lavaspread{}
Defines how lava spreads across the map over time. Uses the same time-based format as landslidefrequency.

**Format:**
```
timeInSeconds:x1,y1/x2,y2/x3,y3/
```

Example:
```
lavaspread{
45:10,15/11,15/
90:10,16/11,16/12,16/
180:10,17/11,17/12,17/13,17/
}
```

This creates expanding lava flows that spread outward over time.

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