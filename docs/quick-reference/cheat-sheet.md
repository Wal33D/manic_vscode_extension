# Manic Miners VSCode Extension Cheat Sheet

## File Structure

```
section{
    content
}
```

## Essential Sections

### Minimal Valid Map
```
info{
    rowcount: 10;
    colcount: 10;
    biome: rock;
}

tiles{
    38,38,38,38,38,38,38,38,38,38,
    38,1,1,1,1,1,1,1,1,38,
    38,1,1,1,1,1,1,1,1,38,
    38,1,1,1,1,1,1,1,1,38,
    38,1,1,1,1,1,1,1,1,38,
    38,1,1,1,1,1,1,1,1,38,
    38,1,1,1,1,1,1,1,1,38,
    38,1,1,1,1,1,1,1,1,38,
    38,1,1,1,1,1,1,1,1,38,
    38,38,38,38,38,38,38,38,38,38,
}

height{
    0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,
}
```

## Key Tile IDs

| ID | Type | ID | Type |
|----|------|----|----|
| 1 | Ground | 38 | Solid Rock |
| 6 | Lava | 42-45 | Crystal Seam |
| 11 | Water | 46-49 | Ore Seam |
| 26 | Dirt | 50-53 | Recharge Seam |
| 30 | Loose Rock | 63-66 | Rubble |
| 34 | Hard Rock | +50 | Reinforced |
| | | +100 | Undiscovered |

## Coordinate Systems

### Grid (Tiles/Height)
- Zero-indexed: [0,0] to [rows-1, cols-1]
- Format: Always row,col (Y,X)
- Height grid: (rows+1) × (cols+1)

### World (Entities)
- Units: 300 per tile
- Center of [0,0]: (150, 150)
- Formula: `world = (grid × 300) + 150`

## Script Quick Reference

### Basic Structure
```
script{
    # Variables
    int Counter=0
    bool Flag=false
    string Text="Hello"
    
    # Event chain
    MyEvent::
    msg:Text;
    Counter:Counter+1;
    
    # Triggers
    if(init)[MyEvent];
    when(enter:5,5)[msg:Entered];
}
```

### Common Events
```
msg:Text;                    # Show message
crystals:10;                 # Add crystals
ore:-5;                      # Remove ore
emerge:10,10,CreatureType;   # Spawn creature
drill:15,15;                 # Drill wall
place:20,20,1;              # Change tile
win:;                       # Victory
lose:;                      # Defeat
```

### Common Triggers
```
if(init)                    # Once at start
when(time>60)               # After 60 seconds
when(enter:r,c)             # Enter tile
when(drill:r,c)             # Drill wall
when(crystals>=50)          # Resource check
when(buildings.Type>0)      # Building exists
```

## Objectives

### Types
```
objectives{
    building: BuildingToolStore_C 2
    resources: 100,50,0
    discovertile: 20,20/Find the cave
    findbuilding: 30,30
    variable: crystals>=200/Bonus crystals
}
```

## Building Classes
- BuildingToolStore_C
- BuildingPowerStation_C
- BuildingCanteen_C
- BuildingTeleportPad_C
- BuildingSuperTeleport_C
- BuildingGeologicalCenter_C
- BuildingOreRefinery_C
- BuildingUpgradeStation_C
- BuildingSupportStation_C
- BuildingDocks_C
- BuildingMiningLaser_C
- BuildingElectricFence_C

## Vehicle Classes
- VehicleSmallDigger_C
- VehicleGraniteGrinder_C
- VehicleChromeCrusher_C
- VehicleLoaderDozer_C
- VehicleSmallTransportTruck_C
- VehicleCargoCarrier_C
- VehicleRapidRider_C
- VehicleHoverScout_C
- VehicleTunnelScout_C
- VehicleTunnelTransport_C
- VehicleSMLC_C
- VehicleLMLC_C

## Creature Classes
- CreatureRockMonster_C
- CreatureIceMonster_C
- CreatureLavaMonster_C
- CreatureSlimySlug_C
- CreatureSmallSpider_C
- CreatureBat_C

## Entity Placement

### Buildings/Vehicles
```
Type,Translation: X=1650.0 Y=1350.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,ID=0
```

### Creatures (3 lines)
```
CreatureType
Translation: X=450.0 Y=450.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
ID=0,HP=100,Sleep=true
```

### Miners
```
ID=0,Translation: X=1650.0 Y=1350.0 Z=53.095 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,Drill/JobDriver/Level/,Essential=true
```

## Common Patterns

### Resource Collection
```
objectives{
    resources: 50,25,0
}

resources{
crystals:
0,0,0,0,0,
0,10,0,10,0,
0,0,20,0,0,
0,10,0,10,0,
0,0,0,0,0,
ore:
0,0,0,0,0,
0,5,0,5,0,
0,0,10,0,0,
0,5,0,5,0,
0,0,0,0,0,
}
```

### Timed Mission
```
script{
    when(time>300)[lose:];
    when(time>240)[msg:OneMinuteWarning];
}
```

### Hidden Reward
```
script{
    bool Found=false
    when(drill:20,20 and Found==false)[Reward];
    
    Reward::
    Found:true;
    crystals:50;
    msg:SecretFound;
}
```

## VSCode Commands

- `Ctrl+Space` - IntelliSense
- `F12` - Go to definition
- `Shift+F12` - Find references
- `Ctrl+.` - Quick fixes
- `Ctrl+Shift+P` - Command palette

## Extension Features

- Syntax highlighting
- Auto-completion
- Error checking
- Hover information
- Code folding
- Outline view
- Minimap markers

## Common Errors

1. **Missing semicolon** in info section
2. **Missing comma** after tile values
3. **Wrong coordinates** (X,Y vs row,col)
4. **Invalid tile ID** (>165)
5. **Mismatched dimensions** (tiles vs info)

## See Also

### Quick References
- [Script Commands](script-commands.md) - All scripting commands
- [Tile IDs](tile-ids.md) - Complete tile reference
- [Common Recipes](common-recipes.md) - Solutions to common tasks

### Detailed Documentation
- [DAT Format Overview](../game-reference/format/overview.md) - Complete specification
- [Scripting Guide](../game-reference/scripting/overview.md) - In-depth scripting
- [Section Details](../game-reference/format/sections/) - All section formats

### Code Examples
- [Basic Parser](../technical-reference/code-examples/parsing/basic-parser.ts) - Parse maps
- [Simple Cave](../technical-reference/code-examples/generation/simple-cave.ts) - Generate maps
- [Basic Triggers](../technical-reference/code-examples/scripting/basic-triggers.dat) - Script examples

### Tools & Analysis
- [Map Validation](../technical-reference/code-examples/parsing/validation.ts) - Validate maps
- [Map Analysis](../technical-reference/code-examples/utilities/analysis.ts) - Analyze maps
- [Performance Guide](../technical-reference/performance.md) - Optimization tips