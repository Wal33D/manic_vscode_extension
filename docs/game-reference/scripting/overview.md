# Scripting Language Overview

## Introduction

The Manic Miners scripting language provides dynamic behavior and interactivity to maps through an event-driven system. Scripts respond to game events, control map elements, and create custom gameplay mechanics.

## Core Concepts

### Event-Driven Architecture
Scripts react to triggers (game events) and execute actions (events) in response. This creates a reactive system where gameplay unfolds based on player actions and time.

### Script Structure
```
script{
    # Variable declarations
    int Score=0
    bool GameStarted=false
    
    # Event chains (functions)
    StartGame::
    GameStarted:true;
    msg:Welcome;
    
    # Triggers (event listeners)
    if(init)[StartGame];
    when(enter:5,5)[msg:EnteredZone];
}
```

## Script Components

### 1. Variables
Store and manipulate data:
- **Primitives**: int, float, bool, string
- **Objects**: arrow, timer, miner, vehicle, creature
- **Collections**: Access to game entities

### 2. Triggers
React to game events:
- **if**: Fires once then removes itself
- **when**: Fires every time condition is met

### 3. Event Chains
Named sequences of events (like functions):
```
ChainName::
event1:param;
event2:param;
```

### 4. Events
Actions that modify game state:
- Messages, resource changes, spawning
- Map modifications, win/lose conditions

### 5. Conditions
Boolean tests for branching logic:
```
((crystals >= 50))
((time < 300 and ore > 20))
```

## Execution Model

### Trigger Format
```
OCCURRENCE(TRIGGER)((CONDITION))[TRUE_EVENT][FALSE_EVENT]
```

- **OCCURRENCE**: `if` (once) or `when` (repeating)
- **TRIGGER**: What activates the code
- **CONDITION**: Optional boolean test
- **TRUE_EVENT**: Executes if condition true (or no condition)
- **FALSE_EVENT**: Optional, executes if condition false

### Special Event Chains
- **init**: Called once at map start
- **tick**: Called every frame (use sparingly!)

## Key Features

### No Spaces Rule
Scripts are space-sensitive:
```
# CORRECT
when(enter:5,5)[msg:Hello];

# WRONG - spaces break parsing
when (enter: 5, 5) [msg: Hello];
```

### Coordinate System
Always use row,col order (Y,X):
```
# Tile at row 5, column 10
enter:5,10
```

### Comments
Use `#` for single-line comments:
```
# This is a comment
int Score=0  # This is also a comment
```

## Common Patterns

### Initialization
```
script{
    if(init)[Setup];
    
    Setup::
    msg:MissionBriefing;
    objective:BuildToolStore;
    crystals:10;
}
```

### Resource Monitoring
```
script{
    when(crystals>=50)[ResourceGoalMet];
    
    ResourceGoalMet::
    msg:CrystalsCollected;
    objective:NextObjective;
}
```

### Timed Events
```
script{
    when(time>300)[TimeUp];
    
    TimeUp::
    msg:TimeExpired;
    lose:;
}
```

### Location-Based
```
script{
    when(enter:10,10)[EnteredSecret];
    
    EnteredSecret::
    msg:SecretFound;
    crystals:50;
}
```

## Script Limitations

### Performance
- Avoid complex calculations in `tick`
- Minimize active `when` triggers
- Use specific conditions over broad ones

### Language Constraints
- No arrays or complex data structures
- No user-defined functions beyond event chains
- Limited string manipulation
- No nested conditions in triggers

### Execution Order
- Triggers fire in undefined order
- Event chains execute sequentially
- No guaranteed timing between triggers

## Best Practices

### 1. Organization
```
script{
    # 1. Variables first
    # 2. Event chains second
    # 3. Triggers last
}
```

### 2. Naming Conventions
- Variables: `CamelCase` or `lowercase`
- Event chains: `DescriptiveAction`
- Use meaningful names

### 3. State Management
```
script{
    bool RewardGiven=false
    
    when(crystals>=100 and RewardGiven==false)[GiveReward];
    
    GiveReward::
    RewardGiven:true;
    ore:25;
}
```

### 4. Error Prevention
- Initialize all variables
- Check conditions before actions
- Use state flags to prevent repetition

## Integration with Other Systems

### Objectives
Scripts can complete objectives dynamically:
```
objectives{
    variable: crystals>=100/Collect 100 crystals
}
```

### Block System
Scripts can interact with visual blocks:
```
# Call block system from script
MyBlockTrigger::;

# Block system calls script
EventCallEvent: MyScriptFunction
```

### Map Elements
Scripts control all dynamic elements:
- Buildings and vehicles
- Creatures and miners
- Tiles and resources
- Messages and objectives

## Debugging Tips

1. **Use messages** to track execution
2. **Start simple** and add complexity
3. **Test triggers** individually
4. **Watch for typos** - no error messages!
5. **Check coordinates** - row,col confusion

## Example: Complete Script
```
script{
    # Tutorial mission script
    int Step=0
    bool ToolStoreBuilt=false
    arrow Guide=green
    
    # Initialize mission
    Init::
    msg:WelcomeToTraining;
    objective:BuildYourFirstToolStore;
    highlightarrow:10,10,Guide;
    
    # Check for tool store
    when(buildings.BuildingToolStore_C>0 and ToolStoreBuilt==false)[ToolStoreComplete];
    
    ToolStoreComplete::
    ToolStoreBuilt:true;
    Step:1;
    removearrow:Guide;
    msg:ExcellentWork;
    crystals:20;
    objective:BuildPowerStation;
    
    # Continue with more steps...
}
```

## See Also

### Syntax Reference
- [Variables](syntax/variables.md) - Data types and storage
- [Events](syntax/events.md) - Available actions
- [Triggers](syntax/triggers.md) - Event listeners
- [Conditions](syntax/conditions.md) - Boolean logic
- [Event Chains](syntax/event-chains.md) - Functions
- [Macros](syntax/macros.md) - Built-in constants

### Patterns & Best Practices
- [Common Patterns](patterns/common-patterns.md) - Production-ready script patterns
- [Debugging Guide](debugging.md) - Troubleshooting and testing strategies

### Class Reference
- [Buildings Class](classes/buildings.md) - Building properties
- [Creatures Class](classes/creatures.md) - Creature properties
- [Miners Class](classes/miners.md) - Miner properties
- [Vehicles Class](classes/vehicles.md) - Vehicle properties

### Code Examples
- [Basic Triggers](../../technical-reference/code-examples/scripting/basic-triggers.dat) - Common patterns
- [Event Chains](../../technical-reference/code-examples/scripting/event-chains.dat) - Advanced chains
- [Advanced Logic](../../technical-reference/code-examples/scripting/advanced-logic.dat) - Complex systems

### Related Documentation
- [Script Section](../format/sections/script.md) - Format details
- [Visual Blocks](visual-blocks.md) - Node-based scripting
- [Performance Guide](../../technical-reference/performance.md#script-performance) - Optimization tips
- [Quick Reference](../../quick-reference/script-commands.md) - Command syntax