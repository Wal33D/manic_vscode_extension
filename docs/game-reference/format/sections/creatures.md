# Creatures Section

The `creatures{}` section defines enemy creatures placed on the map. Creatures can be sleeping, have custom health, and serve as obstacles or objectives.

## Format

Creatures use a multi-line format:

```
creatures{
    CreatureType
    Translation: X=450.0 Y=450.0 Z=0.0 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
    ID=0,HP=100,Sleep=true
}
```

Each creature requires three lines:
1. Creature type
2. Translation (position/rotation/scale)
3. ID and optional properties

## Creature Types

### Combat Creatures
- `CreatureRockMonster_C` - Throws boulders, eats Rock Raiders
- `CreatureIceMonster_C` - Freezes units temporarily
- `CreatureLavaMonster_C` - Heat-based attacks
- `CreatureSlimySlug_C` - Slows units, leaves slime trail

### Small Creatures
- `CreatureSmallSpider_C` - Fast, low health, spawns from drilling
- `CreatureBat_C` - Visual effect only, no gameplay impact

## Properties

### Translation (Required)
Same format as buildings and vehicles:

```
Translation: X=1650.0 Y=1350.0 Z=137.15 Rotation: P=0.0 Y=45.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
```

- **X, Y, Z**: World position (300 units per tile)
- **P, Y, R**: Rotation in degrees
- **Scale**: Size multiplier (affects HP)

### ID (Required)
Unique creature identifier:

```
ID=0
```

- Must be unique among all creatures
- Starts at 0, increments by 1
- Used by scripts to reference creature
- Reused when creatures are defeated

### HP (Optional)
Custom hit points:

```
HP=150
```

- Default values vary by type
- Scaled by creature scale
- Cannot exceed maximum for type

#### Default HP Values
| Creature Type | Default HP | Max HP |
|--------------|------------|---------|
| Rock Monster | 100 | Scale-dependent |
| Ice Monster | 100 | Scale-dependent |
| Lava Monster | 100 | Scale-dependent |
| Slimy Slug | 100 | Scale-dependent |
| Small Spider | 5 | Scale-dependent |
| Bat | N/A | N/A |

### Sleep (Optional)
Creature starts sleeping:

```
Sleep=true
```

- Default: Awake
- Wakes when: Miner approaches or attacked
- Not available for: Spiders and Bats

## Scale Effects

Scale affects both size and stats:

```
Scale X=2.0 Y=2.0 Z=2.0
```

- **1.0**: Normal size and HP
- **0.5**: Half size, reduced HP
- **2.0**: Double size, increased HP
- **4.0**: Quad size (spiders can be huge!)

Maximum HP formula:
```
MaxHP = DefaultHP * ((ScaleX + ScaleY + ScaleZ) / 3)
```

## Examples

### Basic Rock Monster
```
creatures{
    CreatureRockMonster_C
    Translation: X=3150.0 Y=3150.0 Z=137.15 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
    ID=0
}
```

### Sleeping Giant Ice Monster
```
creatures{
    CreatureIceMonster_C
    Translation: X=6150.0 Y=6150.0 Z=137.15 Rotation: P=0.0 Y=180.0 R=0.0 Scale X=2.0 Y=2.0 Z=2.0
    ID=1,HP=180,Sleep=true
}
```

### Spider Nest
```
creatures{
    CreatureSmallSpider_C
    Translation: X=4650.0 Y=4650.0 Z=32.15 Rotation: P=0.0 Y=45.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
    ID=2
    CreatureSmallSpider_C
    Translation: X=4750.0 Y=4650.0 Z=32.15 Rotation: P=0.0 Y=90.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
    ID=3
    CreatureSmallSpider_C
    Translation: X=4650.0 Y=4750.0 Z=32.15 Rotation: P=0.0 Y=135.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
    ID=4
}
```

### Boss Creature
```
creatures{
    CreatureLavaMonster_C
    Translation: X=9150.0 Y=9150.0 Z=137.15 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=3.0 Y=3.0 Z=3.0
    ID=5,HP=250,Sleep=true
}
```

## Creature Behaviors

### Rock Monster
- **Attack**: Throws boulders
- **Special**: Can pick up and eat Rock Raiders
- **Weakness**: Dynamite, laser weapons
- **Movement**: Walks through walls

### Ice Monster
- **Attack**: Freeze beam
- **Special**: Temporarily disables units
- **Weakness**: Laser weapons
- **Movement**: Standard ground

### Lava Monster
- **Attack**: Heat damage
- **Special**: Immune to lava
- **Weakness**: Freezing attacks
- **Movement**: Can cross lava

### Slimy Slug
- **Attack**: Spit slime
- **Special**: Leaves slime trail that slows units
- **Weakness**: All weapons
- **Movement**: Very slow

### Small Spider
- **Attack**: Quick bite
- **Special**: Can spawn from walls when drilling
- **Weakness**: Any attack (low HP)
- **Movement**: Very fast

### Bat
- **Attack**: None
- **Special**: Visual effect only
- **Weakness**: Cannot be attacked
- **Movement**: Flying in swarm pattern

## Script Integration

Creatures can be referenced in scripts:

```
script{
    creature Boss=CreatureLavaMonster_C:5
    
    when(Boss.health<50)[emerge:15,15,CreatureSlimySlug_C];
    when(Boss.dead)[msg:BossDefeated];
}
```

Common triggers:
- `CreatureType.dead` - When any of type defeated
- `creature.health<N` - Health threshold
- `creature.awake` - When creature wakes

## Placement Guidelines

### Combat Balance
- Space creatures to prevent overwhelming players
- Consider available weapons
- Place near objectives for challenge

### Sleeping Creatures
- Use as surprises in hidden areas
- Create tension with placement
- Wake radius is approximately 5 tiles

### Boss Encounters
- Large scale (2.0-4.0)
- High HP
- Isolated arena area
- Script support for phases

## Common Patterns

### Guard Post
```
creatures{
    # Two monsters guarding passage
    CreatureRockMonster_C
    Translation: X=3150.0 Y=3150.0 Z=137.15 Rotation: P=0.0 Y=45.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
    ID=0
    CreatureRockMonster_C
    Translation: X=3150.0 Y=3750.0 Z=137.15 Rotation: P=0.0 Y=-45.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
    ID=1
}
```

### Hidden Ambush
```
creatures{
    # Sleeping monsters in cavern
    CreatureIceMonster_C
    Translation: X=6150.0 Y=6150.0 Z=137.15 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.5 Y=1.5 Z=1.5
    ID=2,Sleep=true
    CreatureIceMonster_C
    Translation: X=6450.0 Y=6450.0 Z=137.15 Rotation: P=0.0 Y=90.0 R=0.0 Scale X=1.5 Y=1.5 Z=1.5
    ID=3,Sleep=true
}
```

### Spider Infestation
```
creatures{
    # Multiple small spiders
    CreatureSmallSpider_C
    Translation: X=4650.0 Y=4650.0 Z=32.15 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=2.0 Y=2.0 Z=2.0
    ID=4,HP=10
    CreatureSmallSpider_C
    Translation: X=4750.0 Y=4750.0 Z=32.15 Rotation: P=0.0 Y=45.0 R=0.0 Scale X=2.0 Y=2.0 Z=2.0
    ID=5,HP=10
}
```

## See Also
- [Script Section](script.md) - Creature triggers
- [Info Section](info.md) - Spider spawn settings
- [Common Patterns](../../../technical-reference/common-patterns.md)