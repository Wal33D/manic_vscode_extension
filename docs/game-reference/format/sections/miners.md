# Miners Section

The `miners{}` section defines Rock Raiders (miners) placed on the map at start. Each miner can have tools, training, and experience levels.

## Format

Each miner is defined on a single line:

```
miners{
    ID=0,Translation,Options,Essential
    ID=1,Translation,Options
}
```

## Miner Components

### 1. ID (Required)
Unique miner identifier:

```
ID=0
```

- Must be unique among all miners
- Starts at 0, increments by 1
- Referenced by vehicles (driver) and scripts
- Reused when miners are teleported away

### 2. Translation (Required)
Position, rotation, and scale:

```
Translation: X=1650.0 Y=1350.0 Z=53.095 Rotation: P=0.0 Y=90.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
```

- **X, Y, Z**: World position (300 units per tile)
- **P, Y, R**: Rotation in degrees
- **Scale**: Size (usually 1.0 for miners)

### 3. Options (Optional)
Tools, jobs, and level upgrades:

```
Drill/Hammer/JobDriver/JobPilot/Level/Level/
```

Format: Each option ends with `/`, no spaces

### 4. Essential (Optional)
Mission-critical miner:

```
Essential=true
```

- Default: False
- True: Teleportation causes mission failure
- Displays star overhead

## Tools and Equipment

### Basic Tools
- `Drill/` - Drilling walls
- `Shovel/` - Clearing rubble faster
- `Hammer/` - Repairing buildings
- `Spanner/` - Repairing vehicles
- `Sandwich/` - Emergency food

### Weapons (Only One)
- `BeamLaser/` - Offensive laser weapon
- `BeamFreezer/` - Freezes creatures
- `BeamPusher/` - Pushes creatures back
- `SonicBlasterTool/` - Sonic damage weapon

**Note**: A miner can only carry ONE weapon type

### Tool Capacity by Level
| Level | Tool Slots | Total Items |
|-------|------------|-------------|
| 1 | 2 | 2 tools |
| 2 | 3 | 3 tools |
| 3 | 4 | 4 tools |
| 4 | 5 | 5 tools |
| 5 | 6 | 5 tools + 1 weapon |

## Jobs (Training)

Miners can know up to 6 jobs:

- `JobExplosivesExpert/` - Handle dynamite
- `JobDriver/` - Drive ground vehicles
- `JobEngineer/` - Repair and build faster
- `JobGeologist/` - Scan for resources
- `JobPilot/` - Pilot hover/flying vehicles
- `JobSailor/` - Navigate water vehicles

## Experience Levels

Miners start at Level 1 by default:

```
# Level 1 (default - no Level/ tags)
# Level 2
Level/
# Level 3
Level/Level/
# Level 4
Level/Level/Level/
# Level 5 (maximum)
Level/Level/Level/Level/
```

Level benefits:
- More tool slots
- Faster work speed
- Better combat abilities
- Higher health

## Examples

### Basic Level 1 Miner
```
miners{
    ID=0,Translation: X=1650.0 Y=1350.0 Z=53.095 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0
}
```

### Equipped Miner
```
miners{
    ID=1,Translation: X=1950.0 Y=1350.0 Z=53.095 Rotation: P=0.0 Y=90.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,Drill/Hammer/JobDriver/
}
```

### Vehicle Driver
```
miners{
    # This miner (ID=2) drives vehicle in vehicles section
    ID=2,Translation: X=2250.0 Y=1350.0 Z=53.095 Rotation: P=0.0 Y=180.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,JobDriver/JobPilot/
}
```

### Elite Miner
```
miners{
    # Level 5, all jobs, fully equipped, essential
    ID=3,Translation: X=3150.0 Y=3150.0 Z=53.095 Rotation: P=0.0 Y=45.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,Drill/BeamLaser/Sandwich/Spanner/Hammer/Shovel/JobExplosivesExpert/JobDriver/JobEngineer/JobGeologist/JobPilot/JobSailor/Level/Level/Level/Level/,Essential=true
}
```

### Starting Crew
```
miners{
    # Chief (essential)
    ID=0,Translation: X=1650.0 Y=1350.0 Z=53.095 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,Drill/Hammer/JobEngineer/JobExplosivesExpert/Level/Level/,Essential=true
    # Driver
    ID=1,Translation: X=1950.0 Y=1350.0 Z=53.095 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,Shovel/JobDriver/JobPilot/
    # Worker
    ID=2,Translation: X=1650.0 Y=1650.0 Z=53.095 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,Drill/
}
```

## Special Configurations

### Combat Squad
```
miners{
    # Laser specialist
    ID=4,Translation: X=4650.0 Y=4650.0 Z=53.095 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,BeamLaser/Level/Level/
    # Freezer specialist
    ID=5,Translation: X=4950.0 Y=4650.0 Z=53.095 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,BeamFreezer/Level/Level/
}
```

### Exploration Team
```
miners{
    # Geologist with scanner
    ID=6,Translation: X=6150.0 Y=6150.0 Z=53.095 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,Drill/JobGeologist/Level/
    # Engineer for repairs
    ID=7,Translation: X=6450.0 Y=6150.0 Z=53.095 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,Hammer/Spanner/JobEngineer/
}
```

## Script Integration

Miners can be referenced in scripts:

```
script{
    miner Chief=0
    miner Driver=1
    
    when(Chief.health<25)[msg:ChiefInDanger];
    when(Driver.driving)[msg:DriverInVehicle];
}
```

Common properties:
- `health` - Current health
- `driving` - In a vehicle
- `location` - Current position

## Placement Guidelines

### Starting Positions
- Near Tool Store for quick access
- Safe from immediate threats
- Grouped for efficiency

### Essential Miners
- Protected positions
- Near critical objectives
- Clear escape routes

### Specialized Teams
- Group by function
- Position near relevant tasks
- Consider job requirements

## Common Patterns

### Basic Starting Crew
```
miners{
    # Minimum viable team
    ID=0,Translation: X=1650.0 Y=1350.0 Z=53.095 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,Drill/
    ID=1,Translation: X=1950.0 Y=1350.0 Z=53.095 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,Drill/
    ID=2,Translation: X=1650.0 Y=1650.0 Z=53.095 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,Shovel/
}
```

### Advanced Team
```
miners{
    # Diverse skills and equipment
    ID=0,Translation: X=3150.0 Y=3150.0 Z=53.095 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,Drill/Hammer/JobEngineer/JobExplosivesExpert/Level/Level/
    ID=1,Translation: X=3450.0 Y=3150.0 Z=53.095 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,BeamLaser/JobDriver/JobPilot/Level/
    ID=2,Translation: X=3150.0 Y=3450.0 Z=53.095 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,Spanner/Shovel/JobGeologist/
}
```

### Tutorial Setup
```
miners{
    # Single miner to teach basics
    ID=0,Translation: X=2550.0 Y=2550.0 Z=53.095 Rotation: P=0.0 Y=0.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0,Essential=true
}
```

## See Also
- [Vehicles Section](vehicles.md) - Driver assignments
- [Script Section](script.md) - Miner triggers
- [Objectives Section](objectives.md) - Miner requirements
- [Common Patterns](../../../technical-reference/common-patterns.md)