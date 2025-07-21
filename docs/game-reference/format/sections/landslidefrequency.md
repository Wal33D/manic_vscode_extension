# Landslide Frequency Section

The `landslidefrequency{}` section defines tiles that periodically collapse, creating dynamic hazards that damage units and buildings below.

## Format

```
landslidefrequency{
    30.0:5,10/8,15/
    15.0:12,20/
    7.5:20,20/20,21/20,22/
}
```

Each line format:
```
INTERVAL:row,col/row,col/...
```

## Components

### Interval (Required)
- **Type**: Float (seconds)
- **Precision**: 0.1 second resolution
- **Behavior**: Minimum time between landslides
- **Actual timing**: Random between interval and 2×interval

Example intervals:
- `30.0`: Landslides every 30-60 seconds
- `15.0`: Landslides every 15-30 seconds  
- `7.5`: Landslides every 7.5-15 seconds

### Tile Locations
- **Format**: `row,col/` for each tile
- **Grouping**: All tiles with same interval on one line
- **Restriction**: Each tile can only have ONE interval

## Landslide Mechanics

### Valid Wall Types
Only these walls can have landslides:
- **26**: Dirt (regular orientation)
- **30**: Loose Rock (regular orientation)
- **34**: Hard Rock (regular orientation)

**Note**: Corner variants cannot have landslides

### Target Requirements
Landslides only trigger if:
1. Wall is discovered (visible)
2. Floor below is not water (11) or lava (8)
3. Space below exists and is accessible

### Damage Effects
Landslides damage:
- Rock Raiders (miners)
- Most vehicles
- Buildings
- Create rubble (no ore yield)

### Immune Units
These are not damaged by landslides:
- `VehicleLoaderDozer_C` - Built to handle rubble
- `VehicleTunnelScout_C` - Flies above
- `VehicleTunnelTransport_C` - Flies above
- `VehicleCargoCarrier_C` - Water vehicle
- `VehicleRapidRider_C` - Water vehicle

### Special Cases
- Power paths survive landslides
- Reinforced walls (ID+50) don't landslide
- Undiscovered tiles inactive until revealed

## Examples

### Basic Hazard
```
landslidefrequency{
    20.0:10,10/
}
```
Single tile landslides every 20-40 seconds

### Danger Zone
```
landslidefrequency{
    10.0:5,10/5,11/5,12/5,13/5,14/
}
```
Row of tiles creating a barrier

### Varied Timing
```
landslidefrequency{
    30.0:8,8/12,12/16,16/
    15.0:10,10/14,14/
    5.0:12,8/12,16/
}
```
Different areas with different danger levels

### Trap Corridor
```
landslidefrequency{
    3.0:10,5/10,6/10,7/10,8/10,9/10,10/10,11/10,12/10,13/10,14/10,15/
}
```
Dangerous passage requiring speed

## Strategic Uses

### Path Hazards
Force players to find alternate routes:
```
landslidefrequency{
    15.0:10,10/11,10/12,10/13,10/14,10/
}
```

### Base Defense
Protect areas from easy access:
```
landslidefrequency{
    20.0:5,15/6,15/7,15/8,15/9,15/
}
```

### Time Pressure
Create urgency in rescue missions:
```
landslidefrequency{
    8.0:20,20/20,21/20,22/
    8.0:21,20/21,21/21,22/
    8.0:22,20/22,21/22,22/
}
```

## Script Integration

### Monitoring Landslides
```
script{
    # EventLandslide_C returns active landslide count
    when(EventLandslide_C>5)[msg:DangerousConditions];
}
```

### No Dynamic Creation
- Cannot create new landslides via script
- Cannot modify intervals via script
- Can only monitor active count

## Map Design Tips

### Placement Guidelines
1. **Near objectives** - Add challenge
2. **Along paths** - Force detours
3. **Over resources** - Risk/reward
4. **Not over water** - Won't trigger

### Balancing
- **30+ seconds**: Minor annoyance
- **15-30 seconds**: Moderate hazard
- **Under 15 seconds**: Major obstacle
- **Under 5 seconds**: Nearly impassable

### Visual Cues
- Players can't see which tiles have landslides
- Use consistent patterns for fairness
- Consider placing rubble as hints

## Common Patterns

### Intermittent Barrier
```
landslidefrequency{
    25.0:10,5/10,10/10,15/10,20/
}
```

### Escalating Danger
```
landslidefrequency{
    30.0:5,10/
    20.0:10,10/
    10.0:15,10/
    5.0:20,10/
}
```

### Resource Protection
```
landslidefrequency{
    # Landslides around crystal cache
    15.0:18,18/18,22/22,18/22,22/
}
```

## Technical Notes

### Grouping Requirement
⚠️ **Critical**: All tiles with same interval MUST be on same line
```
# WRONG - Same interval on multiple lines
landslidefrequency{
    10.0:5,5/
    10.0:6,6/  # This line ignored!
}

# CORRECT - Same interval grouped
landslidefrequency{
    10.0:5,5/6,6/
}
```

### Timing Precision
- Editor saves to 0.1 second precision
- Engine may group at 0.1 second intervals
- Very small differences may be merged

### Performance
- Each active landslide tracked individually
- Large numbers may impact performance
- Consider total hazard count

## See Also
- [Tiles Section](tiles.md) - Valid wall types
- [Info Section](info.md) - Erosion settings
- [Lava Spread Section](lavaspread.md) - Other hazards
- [Common Patterns](../../../technical-reference/common-patterns.md)