# Lava Spread Section

The `lavaspread{}` section defines tiles that gradually erode into lava, creating expanding hazard zones that add time pressure to missions.

## Format

```
lavaspread{
    30.0/10.0:5,10/5,11/
    15.0/0.0:10,20/11,20/12,20/
    7.5/20.0:15,15/
}
```

Each line format:
```
INTERVAL/DELAY:row,col/row,col/...
```

## Components

### Interval (Required)
- **Type**: Float (seconds)
- **Precision**: 0.1 second resolution
- **Behavior**: Time between erosion phases
- **Actual timing**: Random between interval and 2×interval

### Delay (Required)
- **Type**: Float (seconds)
- **Precision**: 0.1 second resolution
- **Purpose**: Initial wait before erosion starts
- **Stacks with**: Global erosioninitialwaittime

### Tile Locations
- **Format**: `row,col/` for each tile
- **Grouping**: All tiles with same interval/delay on one line
- **Restriction**: Each tile can only have ONE erosion setting

## Erosion Mechanics

### Erosion Phases
Tiles progress through 5 phases:

1. **Erosion 1** (Tile ID 10) - Light damage
2. **Erosion 2** (Tile ID 9) - Visible cracks
3. **Erosion 3** (Tile ID 8) - Heavy damage
4. **Erosion 4** (Tile ID 7) - Nearly lava
5. **Lava** (Tile ID 6) - Fully converted

### Requirements
Erosion only starts if:
- Tile is discovered (visible)
- Adjacent to existing lava
- Initial delay has passed
- Global delay has passed

### Starting Mid-Phase
If a tile already has erosion ID (7-10):
- Starts at next phase after delay
- Example: Tile 8 becomes tile 7 after first interval

## Global Modifiers

### erosionscale (Info Section)
Multiplies all intervals:
```
info{
    erosionscale: 2.0;  # Double all erosion times
}
```
- `1.0`: Normal speed (default)
- `2.0`: Half speed
- `0.5`: Double speed
- `0.0`: Disable all erosion

### erosioninitialwaittime (Info Section)
Global delay before any erosion:
```
info{
    erosioninitialwaittime: 60.0;  # 1 minute grace period
}
```

## Examples

### Basic Spread
```
lavaspread{
    20.0/0.0:10,10/
}
```
Single tile starts eroding immediately, 20-40 seconds per phase

### Delayed Threat
```
lavaspread{
    15.0/60.0:5,5/5,6/5,7/6,5/6,6/6,7/7,5/7,6/7,7/
}
```
3x3 area starts eroding after 1 minute

### Progressive Danger
```
lavaspread{
    30.0/0.0:10,10/10,20/20,10/20,20/
    20.0/30.0:12,12/12,18/18,12/18,18/
    10.0/60.0:15,15/
}
```
Three waves of erosion at different speeds

### Spreading Line
```
lavaspread{
    5.0/0.0:10,5/
    5.0/5.0:10,6/
    5.0/10.0:10,7/
    5.0/15.0:10,8/
    5.0/20.0:10,9/
}
```
Creates advancing lava front

## Strategic Uses

### Path Closure
Force players to act quickly:
```
lavaspread{
    10.0/30.0:15,10/16,10/17,10/18,10/19,10/
}
```

### Resource Timer
Limited time to collect resources:
```
lavaspread{
    20.0/45.0:25,25/25,26/25,27/26,25/26,26/26,27/27,25/27,26/27,27/
}
```

### Base Threat
Eventual danger to starting area:
```
lavaspread{
    25.0/120.0:5,5/5,6/6,5/6,6/
}
```

## Calculation Examples

### Total Time to Lava
For a ground tile (ID 1) with 15.0/30.0 setting:
- Wait: 30 seconds initial delay
- Phase 1→2: 15-30 seconds
- Phase 2→3: 15-30 seconds
- Phase 3→4: 15-30 seconds
- Phase 4→5: 15-30 seconds
- **Total**: 90-150 seconds after discovery

### With Global Modifiers
```
info{
    erosionscale: 2.0;
    erosioninitialwaittime: 60.0;
}
lavaspread{
    10.0/30.0:10,10/
}
```
- Global wait: 60 seconds
- Tile delay: 30 seconds
- Per phase: 20-40 seconds (10×2 to 10×2×2)
- **Total**: 170-250 seconds

## Map Design Tips

### Placement Strategy
1. **Adjacent to lava** - Required for activation
2. **Choke points** - Create time pressure
3. **Resource areas** - Force risk/reward decisions
4. **Escape routes** - Don't trap players unfairly

### Timing Balance
- **30+ seconds**: Long-term threat
- **15-30 seconds**: Medium pressure
- **Under 15 seconds**: Urgent danger
- **Under 5 seconds**: Extreme challenge

### Visual Progression
- Players can see erosion phases
- Use consistent patterns
- Consider starting some tiles mid-erosion

## Common Patterns

### Expanding Pool
```
lavaspread{
    # Ring 1
    15.0/0.0:9,10/10,9/11,10/10,11/
    # Ring 2
    15.0/30.0:8,10/9,9/9,11/10,8/10,12/11,9/11,11/12,10/
}
```

### Corridor Collapse
```
lavaspread{
    10.0/0.0:5,10/
    10.0/10.0:6,10/
    10.0/20.0:7,10/
    10.0/30.0:8,10/
    10.0/40.0:9,10/
}
```

### Safe Zone Timer
```
lavaspread{
    # Surrounds safe area slowly
    25.0/90.0:18,18/18,19/18,20/18,21/18,22/
    25.0/90.0:19,18/19,22/
    25.0/90.0:20,18/20,22/
    25.0/90.0:21,18/21,22/
    25.0/90.0:22,18/22,19/22,20/22,21/22,22/
}
```

## Technical Notes

### No Script Control
- Cannot create new erosions via script
- Cannot modify existing erosions
- Can change `erosionscale` macro dynamically
- Can manually place lava tiles via script

### Grouping Requirement
⚠️ **Critical**: All tiles with same interval/delay MUST be on same line
```
# WRONG
lavaspread{
    10.0/5.0:5,5/
    10.0/5.0:6,6/  # Ignored!
}

# CORRECT
lavaspread{
    10.0/5.0:5,5/6,6/
}
```

### Performance Impact
- Each active erosion tracked
- Many erosions may impact performance
- Consider total active erosions

## Script Workarounds

### Manual Lava Spread
```
script{
    int LavaTimer=0
    
    Tick::
    LavaTimer:LavaTimer+1;
    ((LavaTimer>300))[SpreadLava];
    
    SpreadLava::
    LavaTimer:0;
    place:10,10,6;  # Place lava
}
```

## See Also
- [Info Section](info.md) - Global erosion settings
- [Tiles Section](tiles.md) - Erosion tile IDs
- [Landslide Frequency Section](landslidefrequency.md) - Other hazards
- [Script Section](script.md) - Manual tile changes
- [Common Patterns](../../../technical-reference/common-patterns.md)