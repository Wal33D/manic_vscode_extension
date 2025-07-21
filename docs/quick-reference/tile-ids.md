# Tile ID Quick Reference

Quick lookup for all Manic Miners tile IDs. Tiles marked with `+50` are reinforced, `+100` are undiscovered.

## Ground & Basic Tiles

| ID | Name | Properties |
|----|------|------------|
| **1** | Ground | Buildable, walkable |
| **2** | Ground (Rough) | Walkable, damaged appearance |

## Water & Lava

| ID | Name | Properties |
|----|------|------------|
| **6** | Lava | Instant death, impassable |
| **7** | Erosion 4 | Nearly lava |
| **8** | Erosion 3 | Heavy damage |
| **9** | Erosion 2 | Visible cracks |
| **10** | Erosion 1 | Light damage |
| **11** | Water | Impassable (except boats) |
| **114** | Water Shore | Water edge/transition |

## Walls - Dirt

| ID | Name | Drill Time |
|----|------|------------|
| **26** | Dirt (Regular) | Fast |
| **27** | Dirt (Corner) | Fast |
| **28** | Dirt (Corner) | Fast |
| **29** | Dirt (Corner) | Fast |

## Walls - Loose Rock  

| ID | Name | Drill Time |
|----|------|------------|
| **30** | Loose Rock (Regular) | Medium |
| **31** | Loose Rock (Corner) | Medium |
| **32** | Loose Rock (Corner) | Medium |
| **33** | Loose Rock (Corner) | Medium |

## Walls - Hard Rock

| ID | Name | Drill Time |
|----|------|------------|
| **34** | Hard Rock (Regular) | Slow |
| **35** | Hard Rock (Corner) | Slow |
| **36** | Hard Rock (Corner) | Slow |
| **37** | Hard Rock (Corner) | Slow |

## Walls - Solid Rock

| ID | Name | Drill Time |
|----|------|------------|
| **38** | Solid Rock (Regular) | Very Slow |
| **39** | Solid Rock (Corner) | Very Slow |
| **40** | Solid Rock (Corner) | Very Slow |
| **41** | Solid Rock (Corner) | Very Slow |

## Resources - Crystal Seams

| ID | Name | Yield | Reinforced |
|----|------|-------|------------|
| **42** | Crystal Seam (Variant 1) | 1 crystal | 92 |
| **43** | Crystal Seam (Variant 2) | 1 crystal | 93 |
| **44** | Crystal Seam (Variant 3) | 1 crystal | 94 |
| **45** | Crystal Seam (Variant 4) | 1 crystal | 95 |

## Resources - Ore Seams

| ID | Name | Yield | Reinforced |
|----|------|-------|------------|
| **46** | Ore Seam (Variant 1) | 3 ore | 96 |
| **47** | Ore Seam (Variant 2) | 3 ore | 97 |
| **48** | Ore Seam (Variant 3) | 3 ore | 98 |
| **49** | Ore Seam (Variant 4) | 3 ore | 99 |

## Resources - Recharge Seams

| ID | Name | Function | Reinforced |
|----|------|----------|------------|
| **50** | Recharge Seam (Variant 1) | Powers fences | 100 |
| **51** | Recharge Seam (Variant 2) | Powers fences | 101 |
| **52** | Recharge Seam (Variant 3) | Powers fences | 102 |
| **53** | Recharge Seam (Variant 4) | Powers fences | 103 |

## Rubble

| ID | Name | Clear Time |
|----|------|------------|
| **63** | Rubble (4 high) | Very slow |
| **64** | Rubble (3 high) | Slow |
| **65** | Rubble (2 high) | Medium |
| **66** | Rubble (1 high) | Fast |

## Special Tiles

| ID | Name | Properties |
|----|------|------------|
| **12** | Slug Hole | Monster spawn point |
| **14** | Power Path | Conducts electricity |
| **112** | Electric Fence | Defensive barrier |
| **163** | Landslide Rubble | Unstable |
| **164** | Dense Rubble | Very unstable |
| **165** | Unstable Rubble | Extremely unstable |

## Modifiers

### Reinforced (+50)
Add 50 to base ID for reinforced version:
- Cannot be drilled normally
- Requires special conditions
- Example: 88 = Reinforced Solid Rock (38 + 50)

### Undiscovered (+100)
Add 100 to base ID for hidden version:
- Not visible until discovered
- Found in hidden caverns
- Example: 101 = Hidden Ground (1 + 100)

## Quick Checks

### Drillable Walls
IDs 26-41 (and their reinforced versions 76-91)

### Resource Tiles
IDs 42-53 (and their reinforced versions 92-103)

### Passable Tiles
- Ground: 1, 2, 101, 102
- Rubble: 63-66 (requires clearing)
- Power Path: 14

### Hazard Tiles
- Lava: 6
- Erosion: 7-10
- Water: 11, 114
- Electric Fence: 112

### Valid Range
1-165 (with some gaps)

## Common Patterns

### Starting Area
```
38,38,38,38,38  # Solid rock border
38,1,1,1,38     # Ground interior
38,1,1,1,38
38,1,1,1,38
38,38,38,38,38
```

### Resource Pocket
```
34,42,43,42,34  # Crystal seams in hard rock
42,43,44,43,42
43,44,45,44,43
42,43,44,43,42
34,42,43,42,34
```

### Hidden Cavern
```
138,138,138,138,138  # Reinforced solid rock
138,101,101,101,138  # Hidden ground
138,142,143,142,138  # Hidden crystals
138,101,101,101,138
138,138,138,138,138
```

## See Also
- [Tiles Section](../game-reference/format/sections/tiles.md) - Detailed tile information
- [Tile Reference](../game-reference/format/tile-reference.md) - Complete specifications
- [Common Recipes](common-recipes.md) - Usage examples