# Complete Manic Miners Tile Reference

## Overview
This is a comprehensive reference of all tile types used in Manic Miners .dat files, compiled from the game's source code and additional context files. Tiles are the fundamental building blocks of levels, defining terrain, hazards, resources, and special features.

## Tile ID System
- **Base tiles**: IDs 1-65 represent the fundamental tile types
- **Reinforced tiles**: IDs 76-115 are reinforced variants (base ID + 50)
- **Reinforced tiles** require significantly more drilling effort and are used to create more challenging obstacles

## Complete Tile Listing

### Basic Terrain (1-12)

| ID | Name | Description | Properties | Color (RGB) |
|----|------|-------------|------------|-------------|
| 1 | Ground | Basic floor tile where buildings can be constructed | Can walk, Can build | 124, 92, 70 |
| 2 | Rubble Level 1 | Light rubble from cave-ins, easy to clear | Can drill | - |
| 3 | Rubble Level 2 | Medium rubble, moderate effort to clear | Can drill | - |
| 4 | Rubble Level 3 | Heavy rubble, takes time to clear | Can drill | - |
| 5 | Rubble Level 4 | Dense rubble, difficult to clear | Can drill | - |
| 6 | Lava | Molten lava - instantly destroys anything that touches it | Hazard | 255, 50, 0 |
| 7 | Erosion Level 4 | Severely eroded terrain - highly unstable | Can walk (risky) | - |
| 8 | Erosion Level 3 | Heavily eroded terrain - unstable | Can walk (risky) | - |
| 9 | Erosion Level 2 | Moderately eroded terrain | Can walk | - |
| 10 | Erosion Level 1 | Lightly eroded terrain | Can walk, Can build | - |
| 11 | Water | Deep water - vehicles need water upgrade to cross | Hazard | 30, 84, 197 |
| 12 | Slimy Slug Hole | Spawning point for Slimy Slugs | Can drill, Hazard | 180, 180, 20 |

### Power Path Network (13-25)

Power paths conduct electricity between buildings and create the power grid.

| ID | Name | Description | Properties | Color (RGB) |
|----|------|-------------|------------|-------------|
| 13 | Power Path In Progress | Power path under construction | Can walk | - |
| 14 | Power Path Building | Power path connected to building (unpowered) | Can walk | 220, 220, 220 |
| 15 | Power Path Building Powered | Power path connected to building (powered) | Can walk | - |
| 16 | Power Path 1 | Single direction power path (unpowered) | Can walk | - |
| 17 | Power Path 1 Powered | Single direction power path (powered) | Can walk | - |
| 18 | Power Path 2 Adjacent | Two adjacent power connections (unpowered) | Can walk | - |
| 19 | Power Path 2 Adjacent Powered | Two adjacent power connections (powered) | Can walk | - |
| 20 | Power Path 2 Opposite | Two opposite power connections (unpowered) | Can walk | - |
| 21 | Power Path 2 Opposite Powered | Two opposite power connections (powered) | Can walk | - |
| 22 | Power Path 3 | Three-way power junction (unpowered) | Can walk | - |
| 23 | Power Path 3 Powered | Three-way power junction (powered) | Can walk | - |
| 24 | Power Path 4 | Four-way power junction (unpowered) | Can walk | 180, 150, 100 |
| 25 | Power Path 4 Powered | Four-way power junction (powered) | Can walk | - |

### Wall Types (26-41)

Each wall type has 4 shape variants for proper rendering:
- **Regular**: Standard wall piece
- **Corner**: L-shaped corner piece
- **Edge**: Single edge piece
- **Intersect**: Cross intersection piece

#### Dirt Walls (26-29)
| ID | Name | Description | Drill Speed | Color (RGB) |
|----|------|-------------|-------------|-------------|
| 26 | Dirt Regular | Soft earth wall, very easy to drill | Very Fast | 169, 109, 82 |
| 27 | Dirt Corner | Dirt wall corner piece | Very Fast | - |
| 28 | Dirt Edge | Dirt wall edge piece | Very Fast | - |
| 29 | Dirt Intersect | Dirt wall intersection | Very Fast | - |

#### Loose Rock Walls (30-33)
| ID | Name | Description | Drill Speed | Color (RGB) |
|----|------|-------------|-------------|-------------|
| 30 | Loose Rock Regular | Unstable rock, may cause cave-ins | Fast | 139, 104, 86 |
| 31 | Loose Rock Corner | Loose rock corner piece | Fast | - |
| 32 | Loose Rock Edge | Loose rock edge piece | Fast | - |
| 33 | Loose Rock Intersect | Loose rock intersection | Fast | - |

#### Hard Rock Walls (34-37)
| ID | Name | Description | Drill Speed | Color (RGB) |
|----|------|-------------|-------------|-------------|
| 34 | Hard Rock Regular | Dense rock wall, slow to drill | Slow | 77, 53, 50 |
| 35 | Hard Rock Corner | Hard rock corner piece | Slow | - |
| 36 | Hard Rock Edge | Hard rock edge piece | Slow | - |
| 37 | Hard Rock Intersect | Hard rock intersection | Slow | - |

#### Solid Rock Walls (38-41)
| ID | Name | Description | Drill Speed | Color (RGBA) |
|----|------|-------------|-------------|-------------|
| 38 | Solid Rock Regular | Impenetrable wall, cannot be drilled | Cannot drill | 0, 0, 0, 0 |
| 39 | Solid Rock Corner | Solid rock corner piece | Cannot drill | - |
| 40 | Solid Rock Edge | Solid rock edge piece | Cannot drill | - |
| 41 | Solid Rock Intersect | Solid rock intersection | Cannot drill | - |

### Resource Seams (42-53)

Resource seams contain valuable materials and have the same 4 shape variants as walls.

#### Crystal Seams (42-45)
| ID | Name | Description | Yield | Color (RGB) |
|----|------|-------------|-------|-------------|
| 42 | Crystal Seam Regular | Contains energy crystals - primary power source | 1-5 crystals | 206, 233, 104 |
| 43 | Crystal Seam Corner | Crystal seam corner piece | 1-5 crystals | - |
| 44 | Crystal Seam Edge | Crystal seam edge piece | 1-5 crystals | - |
| 45 | Crystal Seam Intersect | Crystal seam intersection | 1-5 crystals | - |

#### Ore Seams (46-49)
| ID | Name | Description | Yield | Color (RGB) |
|----|------|-------------|-------|-------------|
| 46 | Ore Seam Regular | Contains ore for building and upgrades | 1-3 ore | 200, 85, 30 |
| 47 | Ore Seam Corner | Ore seam corner piece | 1-3 ore | - |
| 48 | Ore Seam Edge | Ore seam edge piece | 1-3 ore | - |
| 49 | Ore Seam Intersect | Ore seam intersection | 1-3 ore | - |

#### Recharge Seams (50-53)
| ID | Name | Description | Function | Color (RGB) |
|----|------|-------------|----------|-------------|
| 50 | Recharge Seam Regular | Special crystals that power electric fences | Fence power | 255, 255, 70 |
| 51 | Recharge Seam Corner | Recharge seam corner piece | Fence power | - |
| 52 | Recharge Seam Edge | Recharge seam edge piece | Fence power | - |
| 53 | Recharge Seam Intersect | Recharge seam intersection | Fence power | - |

### Unused IDs (54-57)
These IDs are reserved but not used in standard gameplay.

### Special Tiles (58-65)

| ID | Name | Description | Properties | Color (RGBA) |
|----|------|-------------|------------|--------------|
| 58 | Roof | Cave ceiling that blocks vision and movement | Blocks all | - |
| 59 | UNUSED5 | Reserved for future use | - | - |
| 60 | Fake Rubble 1 | Light decorative rubble | Can walk | 46, 23, 95, 0.1 |
| 61 | Fake Rubble 2 | Medium decorative rubble | Can walk | 46, 23, 95, 0.5 |
| 62 | Fake Rubble 3 | Standard decorative rubble | Can walk | 46, 23, 95, 0.3 |
| 63 | Fake Rubble 4 | Heavy decorative rubble | Can walk | 46, 23, 95 |
| 64 | Cliff Type 1 (Experimental) | Experimental cliff terrain | Cannot walk | 46, 23, 95, 0.7 |
| 65 | Cliff Type 2 (Experimental) | Alternative cliff terrain | Cannot walk | 128, 0, 128 |

### Reinforced Tiles (76-115)

Reinforced tiles are stronger variants that require approximately 2x the drilling time. They use the same visual appearance but with a reinforced indicator.

#### Reinforced Walls (76-91)
| ID | Base Type | Name |
|----|-----------|------|
| 76 | Dirt Regular (26) | Dirt Regular (Reinforced) |
| 77 | Dirt Corner (27) | Dirt Corner (Reinforced) |
| 78 | Dirt Edge (28) | Dirt Edge (Reinforced) |
| 79 | Dirt Intersect (29) | Dirt Intersect (Reinforced) |
| 80 | Loose Rock Regular (30) | Loose Rock Regular (Reinforced) |
| 81 | Loose Rock Corner (31) | Loose Rock Corner (Reinforced) |
| 82 | Loose Rock Edge (32) | Loose Rock Edge (Reinforced) |
| 83 | Loose Rock Intersect (33) | Loose Rock Intersect (Reinforced) |
| 84 | Hard Rock Regular (34) | Hard Rock Regular (Reinforced) |
| 85 | Hard Rock Corner (35) | Hard Rock Corner (Reinforced) |
| 86 | Hard Rock Edge (36) | Hard Rock Edge (Reinforced) |
| 87 | Hard Rock Intersect (37) | Hard Rock Intersect (Reinforced) |
| 88 | Solid Rock Regular (38) | Solid Rock Regular (Reinforced) - Still undrillable |
| 89 | Solid Rock Corner (39) | Solid Rock Corner (Reinforced) - Still undrillable |
| 90 | Solid Rock Edge (40) | Solid Rock Edge (Reinforced) - Still undrillable |
| 91 | Solid Rock Intersect (41) | Solid Rock Intersect (Reinforced) - Still undrillable |

#### Reinforced Resource Seams (92-103)
| ID | Base Type | Name |
|----|-----------|------|
| 92 | Crystal Seam Regular (42) | Crystal Seam Regular (Reinforced) |
| 93 | Crystal Seam Corner (43) | Crystal Seam Corner (Reinforced) |
| 94 | Crystal Seam Edge (44) | Crystal Seam Edge (Reinforced) |
| 95 | Crystal Seam Intersect (45) | Crystal Seam Intersect (Reinforced) |
| 96 | Ore Seam Regular (46) | Ore Seam Regular (Reinforced) |
| 97 | Ore Seam Corner (47) | Ore Seam Corner (Reinforced) |
| 98 | Ore Seam Edge (48) | Ore Seam Edge (Reinforced) |
| 99 | Ore Seam Intersect (49) | Ore Seam Intersect (Reinforced) |
| 100 | Recharge Seam Regular (50) | Recharge Seam Regular (Reinforced) |
| 101 | Recharge Seam Corner (51) | Recharge Seam Corner (Reinforced) |
| 102 | Recharge Seam Edge (52) | Recharge Seam Edge (Reinforced) |
| 103 | Recharge Seam Intersect (53) | Recharge Seam Intersect (Reinforced) |

#### Reinforced Special Tiles (114-115)
| ID | Base Type | Name |
|----|-----------|------|
| 114 | Cliff Type 1 (64) | Cliff Type 1 (Reinforced) |
| 115 | Cliff Type 2 (65) | Cliff Type 2 (Reinforced) |

### Additional High-ID Tiles

Some maps use tiles with IDs above 100 that duplicate functionality or add special features:

| ID | Name | Description | Color (RGB/RGBA) |
|----|------|-------------|------------------|
| 101 | Ground (Reinforced) | Explosion-resistant ground variant | 124, 92, 70 |
| 106 | Lava (Reinforced) | Special lava variant used in advanced levels | 255, 70, 10, 0.9 |
| 111 | Water (Deep) | Deeper water requiring advanced hover upgrades | 30, 95, 220 |
| 112 | Slimy Slug Hole (Reinforced) | Spawns more aggressive slugs | 180, 180, 20 |
| 114 | Shore/Beach | Transition between water and land tiles | 220, 200, 150 |
| 124 | Energy Crystal Formation | Large crystal deposit (5-10 crystals) | 70, 255, 180, 0.9 |
| 163 | Landslide Rubble | Result of landslide events, heavy debris | 110, 90, 70 |
| 164 | Dense Rubble | Extremely compacted debris, slow to clear | 100, 80, 60 |
| 165 | Unstable Rubble | May trigger additional landslides when disturbed | 120, 100, 80 |

## Biome-Specific Colors

Some tiles may have different appearances based on the level's biome setting:

### Rock Biome
- Standard colors as listed above
- Border color: 120, 115, 110 (gray) with 0.2 alpha

### Lava Biome
- Warmer color palette
- More orange/red tints
- Border color: 255, 50, 0 (orange) with 0.2 alpha

### Ice Biome
- Cooler color palette
- More blue/white tints
- Border color: 150, 200, 240 (light blue) with 0.2 alpha

## Usage Notes

1. **Wall Variants**: The Corner, Edge, and Intersect variants are used by the game engine for proper wall rendering at junctions and edges. Level designers typically only need to place the Regular variant, and the game will automatically use the correct variant.

2. **Reinforced Tiles**: Use reinforced tiles sparingly as they significantly increase difficulty. They're best used to protect important areas or create challenging paths.

3. **Resource Distribution**: Crystal and ore seams should be balanced - too many make the level too easy, too few make it impossible.

4. **Hazard Placement**: Lava and water tiles create natural barriers. Use erosion tiles to create areas that degrade over time.

5. **Power Path Planning**: Always ensure buildings can connect to the power grid through power paths.

## Advanced Usage Patterns

### Common Tile Combinations

#### Starting Areas
- **Basic**: 5x5 area of tile 1 (Ground) surrounded by tile 26-29 (Dirt)
- **Advanced**: Mix tile 1 with tile 101 (Reinforced Ground) for explosion resistance
- **With Power**: Pre-place tiles 14-25 for power grid foundation

#### Natural Barriers
- **Water Bodies**: Tile 11 (Water) with tile 114 (Shore) edges
- **Lava Lakes**: Tile 6 (Lava) with tiles 7-10 (Erosion) for expanding danger
- **Cliffs**: Tiles 64-65 (Experimental cliffs) or tile 38 (Solid Rock)

#### Resource Placement
- **Early Game**: Tiles 42-45 (Crystal Seam) near start, 1-2 tiles deep
- **Mid Game**: Tiles 46-49 (Ore Seam) behind tiles 30-33 (Loose Rock)
- **Late Game**: Tiles 92-99 (Reinforced Seams) behind tiles 84-87 (Hard Rock)
- **Bonus Caches**: Tile 124 (Crystal Formation) behind tile 65 (Undiscovered)

#### Progressive Difficulty
- **Layer 1**: Tile 26 (Dirt) - 1-2 tiles deep
- **Layer 2**: Tile 30 (Loose Rock) - 2-3 tiles deep
- **Layer 3**: Tile 34 (Hard Rock) - 3-4 tiles deep
- **Core**: Tile 38 (Solid Rock) or reinforced variants

### Special Techniques

#### Hidden Passages
```
38,38,38,38,38  // Solid rock wall
38,30,30,30,38  // Hidden passage with loose rock
38,38,65,38,38  // Undiscovered cavern entrance
```

#### Timed Challenges
```
1,1,1,10,9,8,7,6  // Erosion cascade toward lava
```

#### Resource Puzzles
```
38,42,38  // Crystal seam blocked by solid rock
50,12,50  // Recharge seams power fence around slug hole
```

### Performance Considerations

1. **Tile Limits**: Maps larger than 64x64 may impact performance
2. **Entity Spawners**: Limit tiles 12 (Slug Holes) to 5-10 per map
3. **Water/Lava**: Large bodies (>100 tiles) can slow pathfinding
4. **Reinforced Walls**: Excessive use (>30% of map) frustrates players

### Validation Rules

1. **Valid IDs**: 1-165 (despite some gaps)
2. **Building Placement**: Only on tiles 1, 101
3. **Vehicle Movement**: Requires tile 1 or cleared paths
4. **Power Paths**: Work on tiles 1, 13-25
5. **Special IDs**: 163-165 are valid (landslide rubble)