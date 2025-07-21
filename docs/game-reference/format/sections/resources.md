# Resources Section

The `resources{}` section defines explicit crystal and ore placement on specific tiles, separate from tile-based resource seams.

## Format

```
resources{
crystals:
0,0,0,
0,10,0,
0,0,0,
ore:
0,0,0,
0,5,0,
0,0,0,
}
```

## Structure

- Contains two subsections: `crystals:` and `ore:`
- Each subsection starts with resource type on a line by itself
- Followed by a grid matching map dimensions
- Same format as tiles section (rows and columns)
- Order doesn't matter, but the editor always writes crystals section first

## Resource Types

### Crystals
- Used for constructing buildings
- Visible on ground tiles when discovered
- Hidden in walls until drilled

### Ore
- Used for building vehicles and upgrades
- Same visibility rules as crystals
- Often placed in smaller quantities

## Grid Format

- Must have exactly `rowcount` rows
- Each row must have exactly `colcount` values
- Values are positive integers (0 = no resources)
- Every value needs trailing comma
- No spaces between values

## Resource Behavior

### On Ground Tiles
- Resources immediately visible (if tile is discovered)
- Can be collected by Rock Raiders
- No drilling required

### In Walls
- Resources hidden until wall is drilled
- Released when wall collapses
- Physics simulation for falling resources

### In Undiscovered Areas
- Not visible until area is discovered
- Revealed when cavern is opened
- Can be placed on hidden ground (101)

## Important Considerations

### Performance Warning
⚠️ **Large resource counts cause severe lag!**
- Each resource is individually simulated by physics
- 100+ resources per tile can freeze the game
- Recommended maximum: 20-30 per tile
- Spread large quantities across multiple tiles
- While upper limit per tile is unknown, practical limits based on physics engine mean thousands of resources will cause massive lag even on fast machines - potentially making the map unplayable

### Border Tiles
- Typically have 0 resources
- Resources on borders may be inaccessible
- Keep resources within playable area

## Interaction with Tile-Based Resources

This section works alongside tile-based resource seams:
- Crystal seam tiles (42-45) provide 1 crystal by default
- Ore seam tiles (46-49) provide 3 ore by default
- This section can override or supplement those amounts

## Examples

### Basic Resource Placement
```
resources{
crystals:
0,0,0,0,0,
0,5,0,5,0,
0,0,10,0,0,
0,5,0,5,0,
0,0,0,0,0,
ore:
0,0,0,0,0,
0,0,3,0,0,
0,3,0,3,0,
0,0,3,0,0,
0,0,0,0,0,
}
```

### Hidden Cache
```
resources{
crystals:
0,0,0,0,0,
0,0,0,0,0,
30,30,30,30,30,    // Hidden behind walls
0,0,0,0,0,
0,0,0,0,0,
ore:
0,0,0,0,0,
0,0,0,0,0,
15,15,15,15,15,    // Matching ore placement
0,0,0,0,0,
0,0,0,0,0,
}
```

### Starting Resources
```
resources{
crystals:
0,0,0,0,0,
0,10,10,10,0,     // Near starting area
0,10,0,10,0,      // Immediately available
0,10,10,10,0,
0,0,0,0,0,
ore:
0,0,0,0,0,
0,5,0,5,0,        // Less ore than crystals
0,0,0,0,0,
0,5,0,5,0,
0,0,0,0,0,
}
```

## Validation Rules

1. **Non-negative values**: No negative resource counts
2. **Grid dimensions**: Must match map size exactly
3. **Performance limits**: Avoid >30 resources per tile
4. **Both types required**: If section exists, include both crystals and ore
5. **Order**: Crystals typically written first (not required)

## Strategic Placement

### Early Game
- Place 5-15 crystals near start
- Limited ore to encourage exploration
- Visible resources for immediate use

### Mid Game
- Hidden caches behind walls
- Larger deposits further from start
- Balance risk vs reward

### Late Game
- Deep deposits for final objectives
- Protected by hazards or enemies
- Sufficient for victory conditions

## See Also
- [Tiles Section](tiles.md) - Resource seam tiles
- [Objectives Section](objectives.md) - Resource collection goals
- [Script Section](script.md) - Dynamic resource rewards
- [Resource Placement Algorithm](../../../technical-reference/algorithms/resource-placement.md)