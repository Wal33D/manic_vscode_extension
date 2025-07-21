# Height Section

The `height{}` section is required and defines the elevation of every tile corner in the map. This creates the 3D terrain topology.

## Format

```
height{
0,0,0,0,
0,300,300,0,
0,300,300,0,
0,0,0,0,
}
```

- One row per line
- Height values separated by commas
- No spaces between values
- Every value must have a trailing comma
- Signed integer values

## Dimensions

For a map with `rowcount` x `colcount` tiles:
- Height grid has `rowcount + 1` rows
- Each row has `colcount + 1` values
- Example: 3x3 tile map has 4x4 height grid

## Visual Representation

```
Heights:     Tiles:
A---B---C    +---+---+
|   |   |    | 1 | 2 |
D---E---F    +---+---+
|   |   |    | 3 | 4 |
G---H---I    +---+---+
```

Each tile shares corners with adjacent tiles:
- Tile 1 uses heights A, B, D, E
- Tile 2 uses heights B, C, E, F
- Heights are shared between adjacent tiles

## Units and Values

- **Unit**: 300 world units = 1 tile height
- **Default**: 0 (ground level)
- **Positive**: Above ground (300 = 1 tile higher)
- **Negative**: Below ground (-300 = 1 tile lower)
- **Range**: No known limits, but extreme values may cause issues

## Important Rules

### Border Heights
- Outer edge heights should remain at 0
- Non-zero border heights can cause texture holes
- In a 3x3 map: 12 border heights, 4 interior heights

### Height Continuity
- Adjacent tiles share corner heights
- Creates smooth terrain transitions
- Cannot have "tears" in terrain

### Runtime Behavior
- Heights are static - cannot change during gameplay
- Set once at map load
- No script commands modify heights

## Examples

### Flat Map (3x3)
```
height{
0,0,0,0,
0,0,0,0,
0,0,0,0,
0,0,0,0,
}
```

### Raised Platform (3x3)
```
height{
0,0,0,0,
0,300,300,0,
0,300,300,0,
0,0,0,0,
}
```

### Ramp (5x3)
```
height{
0,0,0,0,0,0,
0,0,150,300,450,0,
0,0,150,300,450,0,
0,0,0,0,0,0,
}
```

### Valley (5x5)
```
height{
0,0,0,0,0,0,
0,0,0,0,0,0,
0,0,-300,-300,0,0,
0,0,-300,-300,0,0,
0,0,0,0,0,0,
0,0,0,0,0,0,
}
```

## Height Effects on Gameplay

### Building Placement
- Buildings prefer flat terrain (height difference < 150)
- Large height differences prevent construction
- Power paths can traverse moderate slopes

### Unit Movement
- Vehicles struggle with steep slopes
- Rock Raiders can climb steeper terrain
- Extreme heights block all movement

### Visual Effects
- Creates shadows and lighting variation
- Affects camera visibility
- Can hide areas from view

## Validation Checks

1. **Grid Size**: Must be (rowcount+1) x (colcount+1)
2. **Border Values**: Should be 0 to prevent glitches
3. **Extreme Values**: Avoid heights > ±3000 for stability
4. **Comma Format**: Every value needs trailing comma

## Common Patterns

### Crater
```
// Center depression with raised rim
0,300,300,300,0,
300,150,0,150,300,
300,0,-300,0,300,
300,150,0,150,300,
0,300,300,300,0,
```

### Plateau
```
// Flat raised area
0,0,0,0,0,
0,600,600,600,0,
0,600,600,600,0,
0,600,600,600,0,
0,0,0,0,0,
```

## Performance Notes

- Complex height variations impact pathfinding
- Flat maps render faster
- Height calculations affect building placement checks

## See Also
- [Tiles Section](tiles.md) - Tile type definitions
- [Info Section](info.md) - Map dimensions
- [Common Patterns](../../../technical-reference/common-patterns.md)