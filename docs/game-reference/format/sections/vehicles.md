# Vehicles Section

The `vehicles{}` section defines pre-placed vehicles on the map. Vehicles can be in discovered or undiscovered areas and may have drivers and upgrades.

## Format

Each vehicle is defined on a single line with comma-separated values:

```
vehicles{
    VehicleType,Translation,Upgrades,Driver,ID,Essential
    VehicleType,Translation,ID
}
```

## Vehicle Components

### 1. Vehicle Type (Required)
The collection class name:

#### Ground Vehicles
- `VehicleSmallDigger_C` - Basic drilling vehicle
- `VehicleGraniteGrinder_C` - Heavy drilling vehicle
- `VehicleChromeCrusher_C` - Advanced drilling vehicle
- `VehicleLoaderDozer_C` - Rubble clearing vehicle
- `VehicleSmallTransportTruck_C` - Small ore/crystal transport
- `VehicleCargoCarrier_C` - Large transport vehicle
- `VehicleRapidRider_C` - Fast scout with optional drill

#### Hover Vehicles
- `VehicleHoverScout_C` - Fast water/lava crossing scout
- `VehicleTunnelScout_C` - Underground exploration
- `VehicleTunnelTransport_C` - Underground transport

#### Laser Vehicles
- `VehicleSMLC_C` - Small Mobile Laser Cutter
- `VehicleLMLC_C` - Large Mobile Laser Cutter

### 2. Translation (Required)
Position, rotation, and scale:

```
Translation: X=450.0 Y=450.0 Z=0.0 Rotation: P=0.0 Y=90.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
```

Same format as buildings:
- **Translation**: X, Y, Z in world units (300 per tile)
- **Rotation**: P (pitch), Y (yaw), R (roll) in degrees
- **Scale**: X, Y, Z scale factors (default 1.0)

### 3. Upgrades (Optional)
Vehicle-specific enhancements:

```
upgrades=UpDrill/UpEngine/UpScanner/
```

#### Upgrade Reference

| Vehicle | Available Upgrades |
|---------|-------------------|
| Cargo Carrier | `UpAddNav/` |
| Chrome Crusher | `UpDrill/` `UpLaser/` `UpScanner/` `UpEngine/` |
| Granite Grinder | `UpDrill/` `UpEngine/` |
| Hover Scout | `UpEngine/` |
| LMLC | `UpEngine/` `UpLaser/` `UpAddNav/` |
| Loader Dozer | `UpEngine/` |
| Rapid Rider | `UpCargoHold/` `UpAddDrill/` |
| Small Digger | `UpDrill/` `UpEngine/` |
| Small Transport | `UpCargoHold/` `UpEngine/` |
| SMLC | `UpEngine/` `UpLaser/` |
| Tunnel Scout | `UpAddDrill/` |
| Tunnel Transport | None |

#### Upgrade Effects
- **UpDrill**: Faster drilling speed
- **UpEngine**: Increased movement speed
- **UpLaser**: More powerful laser
- **UpScanner**: Enhanced scanning range
- **UpCargoHold**: Larger capacity
- **UpAddDrill**: Adds drilling capability
- **UpAddNav**: Lava navigation (LMLC hidden upgrade)

### 4. Driver (Optional)
References a miner ID:

```
driver=2
```

- Must match an ID in the miners section
- Miner starts inside vehicle
- Both vehicle and miner must be defined

### 5. ID (Required)
Unique vehicle identifier:

```
ID=0
```

- Must be unique among all vehicles
- Starts at 0, increments by 1
- Used by scripts to reference vehicle
- Reused when vehicles are destroyed

### 6. Essential (Optional)
Mission-critical vehicle:

```
Essential=true
```

- Default: False
- True: Loss causes instant mission failure
- Displays star overhead
- Cannot be teleported away

## Examples

### Basic Small Digger
```
vehicles{
    VehicleSmallDigger_C,Translation: X=1650.0 Y=1350.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,ID=0
}
```

### Fully Upgraded Chrome Crusher with Driver
```
vehicles{
    VehicleChromeCrusher_C,Translation: X=3150.0 Y=3150.0 Z=0.0 Rotation: P=0.0 Y=-90.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,upgrades=UpDrill/UpLaser/UpScanner/UpEngine/,driver=2,ID=1,Essential=true
}
```

### Multiple Vehicles
```
vehicles{
    VehicleSmallDigger_C,Translation: X=1650.0 Y=1350.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,ID=0
    VehicleSmallTransportTruck_C,Translation: X=1950.0 Y=1350.0 Z=0.0 Rotation: P=0.0 Y=180.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,upgrades=UpCargoHold/,ID=1
    VehicleHoverScout_C,Translation: X=2250.0 Y=1350.0 Z=0.0 Rotation: P=0.0 Y=90.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,upgrades=UpEngine/,ID=2
}
```

### Hidden Essential Vehicle
```
vehicles{
    # In undiscovered cavern, must be found
    VehicleLMLC_C,Translation: X=9150.0 Y=9150.0 Z=0.0 Rotation: P=0.0 Y=45.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,upgrades=UpEngine/UpLaser/,ID=5,Essential=true
}
```

## Vehicle Characteristics

### Small Digger
- **Role**: Basic drilling
- **Speed**: Slow
- **Capacity**: 2 ore/crystals
- **Special**: Cheapest vehicle

### Granite Grinder
- **Role**: Heavy drilling
- **Speed**: Very slow
- **Capacity**: 4 ore/crystals
- **Special**: Drills hard rock faster

### Chrome Crusher
- **Role**: Advanced drilling
- **Speed**: Medium
- **Capacity**: 5 ore/crystals
- **Special**: Most upgrade options

### Loader Dozer
- **Role**: Clear rubble
- **Speed**: Slow
- **Capacity**: None
- **Special**: Only vehicle that clears rubble

### Transport Vehicles
- **Small Transport**: 10 capacity
- **Cargo Carrier**: 20 capacity
- **Special**: No drilling ability

### Hover Vehicles
- **Hover Scout**: Crosses water/lava
- **Tunnel Scout**: Finds hidden caverns
- **Tunnel Transport**: Carries through walls

### Laser Vehicles
- **SMLC**: Small, agile laser
- **LMLC**: Powerful, can cross lava with UpAddNav

## Placement Guidelines

### Starting Vehicles
- Place near Tool Store
- Include at least one drilling vehicle
- Consider map objectives

### Hidden Vehicles
- Reward for exploration
- Often upgraded
- May be essential for objectives

### Strategic Placement
- Near resources for transport
- By water for hover vehicles
- In defended positions if essential

## Script Integration

Vehicles can be referenced in scripts:

```
script{
    vehicle ChromeCrusher=VehicleChromeCrusher_C:1
    
    when(ChromeCrusher.health<50)[msg:VehicleDamaged];
    when(ChromeCrusher.dead)[lose:];
}
```

## Common Patterns

### Basic Starting Fleet
```
vehicles{
    VehicleSmallDigger_C,Translation: X=1650.0 Y=1350.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,ID=0
    VehicleSmallTransportTruck_C,Translation: X=1950.0 Y=1350.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,ID=1
}
```

### Advanced Exploration Setup
```
vehicles{
    VehicleChromeCrusher_C,Translation: X=3150.0 Y=3150.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,upgrades=UpDrill/UpScanner/,ID=0
    VehicleHoverScout_C,Translation: X=3450.0 Y=3150.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,ID=1
    VehicleTunnelScout_C,Translation: X=3750.0 Y=3150.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,ID=2
}
```

## See Also
- [Miners Section](miners.md) - Driver assignments
- [Buildings Section](buildings.md) - Vehicle construction
- [Script Section](script.md) - Vehicle triggers
- [Common Patterns](../../../technical-reference/common-patterns.md)