# Blocks Section

The `blocks{}` section defines visual scripting logic using a block-and-wire system. This provides a visual alternative to text-based scripting for common map behaviors.

## Overview

The block system consists of:
- **Triggers**: Events that start actions (timers, tile entry, etc.)
- **Events**: Actions to perform (spawn creatures, drill walls, etc.)
- **Wires**: Connections between blocks defining execution flow
- **Creatures**: Specialized blocks for creature spawning

## Block Types

### 1. Trigger Blocks

#### Timer Trigger
Fires periodically:
```
1/TriggerTimer:10,10,MyTimer,5.0,30.0,20.0
```
- ID: 1 (unique block ID)
- Location: row 10, col 10
- Name: MyTimer (accessible from script)
- Initial delay: 5.0 seconds
- Max interval: 30.0 seconds
- Min interval: 20.0 seconds (random 20-30)

#### Enter Trigger
Fires when units enter tile:
```
2/TriggerEnter:15,15,10.0,true,true,
```
- Cooldown: 10.0 seconds
- Triggers on: miners (true), vehicles (true)
- Optional: creature class name

#### Change Trigger
Fires when tile changes:
```
3/TriggerChange:20,20,5.0,1
```
- Monitors: tile at [20,20]
- Cooldown: 5.0 seconds
- Optional: specific tile ID (1 = ground)

#### Event Chain Trigger
Callable from script:
```
4/TriggerEventChain:5,5,0.0,StartWave
```
- Name: StartWave (call from script)
- Cooldown: 0.0 (no limit)

### 2. Event Blocks

#### Emerge Creature
Spawns a creature:
```
5/EventEmergeCreature:25,25,A,15.0,CreatureRockMonster_C,2
```
- Direction: A (automatic)
- Cooldown: 15.0 seconds
- Type: Rock Monster
- Radius: 2 tiles

#### Drill
Drills a wall:
```
6/EventDrill:30,30
```
- Target: tile at [30,30]

#### Place
Changes tile type:
```
7/EventPlace:35,35,0.0,42
```
- Target: tile at [35,35]
- New tile: 42 (crystal seam)
- Cooldown: 0.0

#### Call Event
Executes script event:
```
8/EventCallEvent:10,10,0.0,MyScriptFunction
```
- Calls: MyScriptFunction in script
- Cooldown: 0.0

#### Relay
Delays execution:
```
9/EventRelay:10,10,0.0,5.0
```
- Cooldown: 0.0
- Delay: 5.0 seconds before continuing

### 3. Creature Blocks

#### Flee
Makes creature flee:
```
10/EventUnitFlee:40,40,false
```
- Flee to: [40,40]
- Anywhere: false (specific location)

#### Random Spawn Setup
Configures wave spawning:
```
11/EventRandomSpawnSetup:10,10,CreatureSmallSpider_C,60.0,30.0,3,6,1,3
```
- Type: Small Spider
- Cooldown: 30-60 seconds between waves
- Spawn: 3-6 per wave
- Waves: 1-3 concurrent

#### Random Spawn Control
```
12/EventRandomSpawnStart:10,10,CreatureSmallSpider_C
13/EventRandomSpawnStop:10,10,CreatureSmallSpider_C
```

### 4. Wire Types

#### Normal Wire (-)
Standard execution flow:
```
1-5
```
Block 1 triggers block 5

#### Backup Wire (~)
Only if emerge fails:
```
5~6
```
If block 5 (emerge) fails, trigger block 6
- Emerge is the only block that can fail
- Backup wires only execute if the emerge block fails

#### Random Wire (?)
One random choice:
```
1?2
1?3
1?4
```
Block 1 randomly triggers ONE of blocks 2, 3, or 4
- Only one random wire executes per trigger
- Other non-random wires still execute normally

> **Note**: The `?` and `~` wire modifiers are internally implemented as modifiers on events within an Event Chain.

## Complete Example

```
blocks{
    # Timer that triggers every 30 seconds
    1/TriggerTimer:10,10,WaveTimer,0.0,30.0,30.0
    
    # Spawn rock monster when timer fires
    2/EventEmergeCreature:20,20,A,0.0,CreatureRockMonster_C,3
    
    # If spawn fails, show message
    3/EventCallEvent:10,10,0.0,msg:SpawnFailed
    
    # Make monster flee after spawn
    4/EventUnitFlee:40,0,true
    
    # Connect timer to spawn
    1-2
    
    # Backup if spawn fails
    2~3
    
    # Make creature flee after spawn
    2-4
    
    # Player enters trigger area
    5/TriggerEnter:15,15,0.0,true,false,
    
    # Drill wall when entered
    6/EventDrill:15,20
    
    # Connect enter to drill
    5-6
}
```

## Script Integration

### Calling Block System from Script
```
script{
    # Define in blocks: 4/TriggerEventChain:5,5,0.0,StartAttack
    StartAttack::;  # Script calls block system
}
```

### Calling Script from Block System
```
blocks{
    # Call script function
    8/EventCallEvent:10,10,0.0,MyScriptFunction
}
```

### Accessing Block Timers
```
script{
    # Timer defined in blocks: 1/TriggerTimer:10,10,WaveTimer,5.0,30.0
    stoptimer:WaveTimer;
    starttimer:WaveTimer;
}
```

## Important Notes

1. **Discovery**: Blocks only activate in discovered areas
2. **IDs**: Must be unique, assigned by editor
3. **Cooldowns**: Prevent rapid triggering
4. **Emerge Failures**: Only emerge can fail and use backup wires
5. **Internal Names**: System generates hidden event chains

## Technical Details

### Block Execution
- Blocks are converted to internal event chains at map load
- Execution is asynchronous - triggers return immediately
- Actions from triggers happen eventually, not instantly
- Failed emerge events are the only blocks that can fail

### Coordinate Requirements
- Block coordinates must be in discovered areas to activate
- Actual coordinates for some blocks don't matter (just discovery)
- Trigger coordinates (Enter, Change) must be exact

### Cooldown Behavior
- Cooldown prevents rapid re-triggering
- Events during cooldown are ignored, not queued
- Each block tracks its own cooldown independently
- 0.0 cooldown means no restrictions

### Wire Processing
- Normal wires (-) always execute if source succeeds
- Backup wires (~) only execute if emerge fails
- Random wires (?) select ONE from all random wires
- Multiple wire types can exist from same block
- Wire execution order is not guaranteed

### Creature-Specific Rules
- Emerge is the only block that can fail (if no valid spawn location)
- Flee requires previous emerge in wire chain
- Random spawn requires setup before start
- Creatures must have valid spawn locations (appropriate tiles)
- Bats cannot be used in emerge blocks (visual only)

### Supported Creature Classes
- CreatureIceMonster_C
- CreatureLavaMonster_C  
- CreatureRockMonster_C
- CreatureSlimySlug_C
- CreatureSmallSpider_C
- CreatureBat_C (visual only, limited support)

### Event Chain Names
- User-defined names must be unique
- Follow same rules as script event chain names
- Names are preserved once created
- Internal names are auto-generated (don't call directly)

### Script Integration Rules
- TriggerEventChain names can be called from script
- EventCallEvent can call script functions/chains
- Timer names accessible via starttimer/stoptimer
- Calls are asynchronous - don't expect immediate execution

## Common Patterns

### Wave Attack System
```
blocks{
    # Setup spider waves
    1/EventRandomSpawnSetup:10,10,CreatureSmallSpider_C,45.0,30.0,2,4,1,2
    
    # Start trigger
    2/TriggerEventChain:10,10,0.0,BeginWaves
    
    # Start waves
    3/EventRandomSpawnStart:10,10,CreatureSmallSpider_C
    
    # Stop trigger (from script)
    4/TriggerEventChain:10,10,0.0,EndWaves
    
    # Stop waves
    5/EventRandomSpawnStop:10,10,CreatureSmallSpider_C
    
    # Wiring
    2-3
    4-5
}
```

### Trap System
```
blocks{
    # Player steps on tile
    1/TriggerEnter:20,20,30.0,true,true,
    
    # Spawn monster
    2/EventEmergeCreature:22,22,A,0.0,CreatureLavaMonster_C,1
    
    # And collapse walls
    3/EventDrill:20,18
    4/EventDrill:20,22
    5/EventDrill:18,20
    6/EventDrill:22,20
    
    # Connect trigger to all events
    1-2
    1-3
    1-4
    1-5
    1-6
}
```

### Timed Events
```
blocks{
    # Initial timer
    1/TriggerTimer:10,10,MainTimer,10.0,10.0,10.0
    
    # First relay (5 second delay)
    2/EventRelay:10,10,0.0,5.0
    
    # Second relay (10 second delay)
    3/EventRelay:10,10,0.0,10.0
    
    # Events at different times
    4/EventCallEvent:10,10,0.0,msg:Event1
    5/EventCallEvent:10,10,0.0,msg:Event2
    6/EventCallEvent:10,10,0.0,msg:Event3
    
    # Timer triggers immediate event
    1-4
    # And delayed events
    1-2
    2-5
    1-3
    3-6
}
```

## See Also
- [Script Section](script.md) - Text-based scripting
- [Creatures Section](creatures.md) - Creature properties
- [Common Patterns](../../../technical-reference/common-patterns.md)