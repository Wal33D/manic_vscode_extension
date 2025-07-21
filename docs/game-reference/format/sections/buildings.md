# Buildings Section

The `buildings{}` section defines pre-placed buildings on the map. These can be in discovered or undiscovered areas.

## Format

Each building is defined on a single line with comma-separated values:

```
buildings{
    BuildingType,Translation,Level,Teleport,Essential
    BuildingType,Translation
}
```

## Building Components

### 1. Building Type (Required)
The collection class name:

- `BuildingCanteen_C` - Feeds Rock Raiders
- `BuildingDocks_C` - Water vehicle construction
- `BuildingElectricFence_C` - Defense barrier
- `BuildingGeologicalCenter_C` - Scans for resources
- `BuildingMiningLaser_C` - Automated drilling
- `BuildingOreRefinery_C` - Processes ore
- `BuildingPowerStation_C` - Provides power
- `BuildingSuperTeleport_C` - Large vehicle teleport
- `BuildingSupportStation_C` - Recharges vehicles
- `BuildingTeleportPad_C` - Small unit teleport
- `BuildingToolStore_C` - Central HQ building
- `BuildingUpgradeStation_C` - Vehicle upgrades

### 2. Translation (Required)
Position, rotation, and scale:

```
Translation: X=1650.0 Y=1350.0 Z=0.0 Rotation: P=0.0 Y=180.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
```

#### Translation Components
- **X**: East/West position (300 units per tile)
- **Y**: North/South position (300 units per tile)
- **Z**: Height position (300 units per tile)

#### Rotation Components
- **P**: Pitch in degrees (-180 to 180)
- **Y**: Yaw in degrees (-180 to 180)
- **R**: Roll in degrees (-180 to 180)

#### Scale Components
- **X, Y, Z**: Scale factors (default 1.0)

### 3. Level (Optional)
Upgrade level for upgradeable buildings:

```
Level=3
```

- Default: Level 1
- Must be valid for building type
- Tool Store: Levels 1-3
- Other buildings vary

### 4. Teleport (Optional)
Shows teleport animation on discovery:

```
Teleport=True
```

- Default: False (instant appearance)
- True: Teleports down when discovered
- Useful for mission start buildings

### 5. Essential (Optional)
Building loss causes mission failure:

```
Essential=true
```

- Default: False
- True: Displays star overhead
- Destruction = instant mission failure

## Coordinate System

Buildings use world coordinates:
- Each tile = 300 world units
- Tile [0,0] center = (150, 150)
- Tile [x,y] center = (x*300+150, y*300+150)

Example conversions:
- Tile [5,4] = World (1650, 1350)
- Tile [10,10] = World (3150, 3150)

## Placement Rules

### Valid Placement
1. On ground tiles (ID 1 or 101)
2. Sufficient flat space
3. No overlapping buildings
4. Within map bounds

### Manual Placement
- Editor enforces rules automatically
- Manual editing can break rules
- Invalid placement may make building unusable
- Can bury buildings (negative Z)
- Can float buildings (positive Z)

## Examples

### Basic Tool Store
```
buildings{
    BuildingToolStore_C,Translation: X=1650.0 Y=1350.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
}
```

### Essential Level 3 Tool Store with Teleport
```
buildings{
    BuildingToolStore_C,Translation: X=3150.0 Y=3150.0 Z=0.0 Rotation: P=0.0 Y=180.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,Level=3,Teleport=True,Essential=true
}
```

### Multiple Buildings
```
buildings{
    BuildingToolStore_C,Translation: X=1650.0 Y=1350.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,Essential=true
    BuildingPowerStation_C,Translation: X=1950.0 Y=1350.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
    BuildingCanteen_C,Translation: X=1650.0 Y=1650.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
}
```

### Hidden Building
```
buildings{
    # In undiscovered cavern at tile [20,20]
    BuildingGeologicalCenter_C,Translation: X=6150.0 Y=6150.0 Z=0.0 Rotation: P=0.0 Y=90.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,Teleport=True
}
```

## Building Sizes

Approximate footprints:
- **Tool Store**: 2x2 tiles
- **Power Station**: 2x2 tiles
- **Canteen**: 1x1 tile
- **Teleport Pad**: 1x1 tile
- **Super Teleport**: 3x3 tiles
- **Support Station**: 2x2 tiles
- **Upgrade Station**: 2x2 tiles
- **Ore Refinery**: 2x2 tiles
- **Geological Center**: 1x1 tile
- **Mining Laser**: 1x1 tile
- **Docks**: 2x3 tiles (needs water)
- **Electric Fence**: 1x1 per segment

## Important Notes

1. **No Building IDs**: Buildings don't have unique identifiers
2. **Discovery**: Buildings in hidden areas appear when discovered
3. **Objectives**: Can be referenced in objectives section
4. **Script Access**: Use building class counts in scripts
5. **Overlap**: Undefined behavior if buildings overlap

## Common Patterns

### Starting Base
```
buildings{
    # Central Tool Store
    BuildingToolStore_C,Translation: X=3750.0 Y=3750.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,Level=2,Essential=true
    # Support buildings around it
    BuildingPowerStation_C,Translation: X=4050.0 Y=3750.0 Z=0.0 Rotation: P=0.0 Y=270.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
    BuildingCanteen_C,Translation: X=3450.0 Y=3750.0 Z=0.0 Rotation: P=0.0 Y=90.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
}
```

### Hidden Objective
```
buildings{
    # Player must find this building to complete objective
    BuildingSuperTeleport_C,Translation: X=9150.0 Y=9150.0 Z=0.0 Rotation: P=0.0 Y=45.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,Teleport=True
}
```

## See Also
- [Objectives Section](objectives.md) - Building objectives
- [Tiles Section](tiles.md) - Valid placement tiles
- [Script Section](script.md) - Building-related triggers
- [Common Patterns](../../../technical-reference/common-patterns.md)