# Visual Blocks System

The visual blocks system provides a node-based alternative to text scripting. It uses blocks connected by wires to create game logic, making it accessible to non-programmers while maintaining full scripting power.

## Overview

Visual blocks consist of:
- **Trigger Blocks** - Detect events (blue blocks)
- **Event Blocks** - Perform actions (green blocks)
- **Wires** - Connect blocks to define flow
- **Properties** - Configure block behavior

## Block Categories

### Trigger Blocks (Blue)

Triggers start execution chains when conditions are met.

#### Timer Trigger
Fires periodically at random intervals.
```
TriggerTimer:row,col,name,delay,max,min
```
- **name**: Reference from script
- **delay**: Initial wait (seconds)
- **max/min**: Random interval range

#### Enter Trigger
Fires when units enter a tile.
```
TriggerEnter:row,col,cooldown,miners,vehicles,creature
```
- **cooldown**: Minimum time between triggers
- **miners/vehicles**: true/false to detect
- **creature**: Optional creature class

#### Change Trigger
Fires when a tile changes.
```
TriggerChange:row,col,cooldown,tileID
```
- **tileID**: Optional specific tile to detect

#### Event Chain Trigger
Callable from text script.
```
TriggerEventChain:row,col,cooldown,name
```
- **name**: Call as `name::` from script

### Event Blocks (Green)

Events perform actions when triggered.

#### Emerge Creature
Spawns a creature from walls.
```
EventEmergeCreature:row,col,direction,cooldown,type,radius
```
- **direction**: N/S/E/W/A (auto)
- **type**: CreatureRockMonster_C, etc.
- **radius**: Search distance for walls

#### Drill
Drills a wall tile.
```
EventDrill:row,col
```

#### Place
Changes a tile type.
```
EventPlace:row,col,cooldown,tileID
```
- **tileID**: New tile type (1-165)

#### Call Event
Executes script function.
```
EventCallEvent:row,col,cooldown,function
```
- **function**: Script event chain name

#### Relay
Delays execution flow.
```
EventRelay:row,col,cooldown,delay
```
- **delay**: Seconds to wait

#### Unit Flee
Makes last spawned creature flee.
```
EventUnitFlee:row,col,anywhere
```
- **anywhere**: true = random edge, false = specific tile

#### Random Spawn Setup
Configures creature waves.
```
EventRandomSpawnSetup:row,col,type,maxTime,minTime,maxWave,minWave,maxSpawn,minSpawn
```

#### Random Spawn Control
```
EventRandomSpawnStart:row,col,type
EventRandomSpawnStop:row,col,type
```

## Wire Types

### Normal Wire (-)
Standard execution flow.
```
1-2  # Block 1 triggers block 2
```

### Backup Wire (~)
Executes only if emerge fails.
```
1~2  # If block 1 (emerge) fails, trigger block 2
```

### Random Wire (?)
Randomly selects ONE target.
```
1?2
1?3
1?4  # Block 1 triggers ONE of 2, 3, or 4
```

## Visual Editor

### Block Placement
1. Select block type from palette
2. Click on map to place
3. Configure properties in panel
4. Blocks auto-assign unique IDs

### Wire Creation
1. Click output port of source block
2. Click input port of target block
3. Choose wire type if prompted
4. Wire appears between blocks

### Block Properties
- Double-click block to edit
- Properties panel shows options
- Validation prevents errors
- Preview shows connections

## Script Integration

### Calling Blocks from Script
```
script{
    # Define in blocks
    # TriggerEventChain:10,10,0.0,StartWave
    
    # Call from script
    when(time > 60)[StartWave];
    
    StartWave::  # Triggers block system
}
```

### Calling Script from Blocks
```
blocks{
    # EventCallEvent:10,10,0.0,ScriptFunction
}

script{
    ScriptFunction::
    msg:CalledFromBlocks;
}
```

### Shared Timers
```
blocks{
    # TriggerTimer:10,10,SharedTimer,30.0,60.0,30.0
}

script{
    # Control block timer
    stoptimer:SharedTimer;
    starttimer:SharedTimer;
}
```

## Common Patterns

### Basic Enemy Spawner
```
[Timer] ---> [Emerge Creature]
   |              |
   |              v
   |         [Unit Flee]
   |
   +--------> [Call Event: msg:WaveSpawned]
```

### Trap System
```
[Enter Trigger] ---> [Emerge Creature]
       |                    |
       |                    ~
       |                    v
       |              [Call Event: msg:TrapFailed]
       |
       +-----------> [Drill] x4 (surround player)
```

### Wave Manager
```
[Event Chain: StartWaves] ---> [Random Spawn Setup]
                                       |
                                       v
                               [Random Spawn Start]

[Event Chain: StopWaves] ----> [Random Spawn Stop]
```

### Timed Sequence
```
[Timer] ---> [Event 1]
   |            
   |         
   +-------> [Relay 5s] ---> [Event 2]
   |         
   +-------> [Relay 10s] --> [Event 3]
```

## Advanced Techniques

### State Machines
```
# Phase 1
[Timer "Phase1"] ---> [Emerge Spider]
         |                   |
         |                   v
         |              [Relay 30s]
         |                   |
         |                   v
         +-----------> [Stop Timer "Phase1"]
                             |
                             v
                       [Start Timer "Phase2"]
```

### Error Handling
```
[Trigger] ---> [Emerge] ---> [Success Events]
                  |
                  ~
                  v
            [Backup Plan] ---> [Alternative Events]
```

### Random Events
```
[Timer] --?--> [Event A: Spawn Spider]
   |     
   ?------?--> [Event B: Resource Bonus]
   |     
   ?------?--> [Event C: Cave In]
```

## Best Practices

### 1. Organization
- Group related blocks visually
- Use meaningful names
- Document complex logic
- Keep wire paths clear

### 2. Performance
- Limit active timers
- Use appropriate cooldowns
- Avoid rapid triggers
- Clean up unused blocks

### 3. Debugging
- Test incrementally
- Use Call Event for messages
- Check block discovery
- Verify wire connections

### 4. Maintainability
- Name all event chains
- Comment complex systems
- Use consistent patterns
- Avoid wire spaghetti

## Limitations

### Block Constraints
- Blocks only work in discovered areas
- IDs must be unique
- Some properties can't be changed at runtime
- Limited to predefined block types

### Wire Rules
- Only emerge can use backup wires
- Random wires select ONE target
- No conditional wires
- No loops without delays

### Integration Limits
- Async execution with script
- Can't read block properties from script
- Limited debugging visibility
- No dynamic block creation

## Technical Details

### Internal Implementation
- Blocks compile to event chains at load
- Each block gets unique internal name
- Wires become event calls
- Cooldowns managed per-block

### Discovery Requirements
- Block location must be discovered
- Triggers won't fire in undiscovered areas
- Events can affect undiscovered tiles
- Discovery checked at execution time

### Execution Order
- Triggers fire asynchronously
- Wire order not guaranteed
- Events queue separately
- Cooldowns prevent overlap

## Examples

### Complete Defense System
```
blocks{
    # Detection perimeter
    1/TriggerEnter:10,10,0.0,true,true,
    2/TriggerEnter:10,20,0.0,true,true,
    3/TriggerEnter:20,10,0.0,true,true,
    4/TriggerEnter:20,20,0.0,true,true,
    
    # Alert system
    5/EventCallEvent:15,15,0.0,IntruderAlert
    
    # Spawn defenders
    6/EventEmergeCreature:15,15,A,30.0,CreatureRockMonster_C,5
    
    # Connect all triggers to alert
    1-5
    2-5
    3-5
    4-5
    
    # Alert triggers defenders
    5-6
}

script{
    IntruderAlert::
    msg:DefenseActivated;
    shake:2.0,1.0;
}
```

### Progressive Difficulty
```
blocks{
    # Phase timers
    1/TriggerTimer:10,10,Phase1,0.0,60.0,60.0
    2/TriggerTimer:10,10,Phase2,120.0,45.0,45.0
    3/TriggerTimer:10,10,Phase3,240.0,30.0,30.0
    
    # Phase 1: Easy
    4/EventEmergeCreature:20,20,A,0.0,CreatureSmallSpider_C,3
    
    # Phase 2: Medium
    5/EventEmergeCreature:20,20,A,0.0,CreatureRockMonster_C,2
    
    # Phase 3: Hard
    6/EventEmergeCreature:20,20,A,0.0,CreatureLavaMonster_C,1
    
    # Wire phases
    1-4
    2-5  
    3-6
}

script{
    # Stop earlier phases
    when(time > 120)[stoptimer:Phase1];
    when(time > 240)[stoptimer:Phase2];
}
```

## See Also
- [Script Overview](overview.md) - Text scripting system
- [Blocks Section](../format/sections/blocks.md) - Technical format
- [Event Chains](syntax/event-chains.md) - Script integration
- [Common Patterns](../../technical-reference/common-patterns.md) - Examples