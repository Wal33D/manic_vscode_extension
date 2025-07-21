# Scripting Syntax Reference

This directory contains detailed documentation for the Manic Miners scripting language syntax. Understanding these syntax rules is crucial for creating functional and efficient scripts.

## Syntax Components

### Core Language Elements

- **[variables.md](variables.md)** - Variable types, declaration, and usage
  - Integer, float, boolean, string, and object types
  - Variable naming rules and scope
  - Initial values and type conversion

- **[events.md](events.md)** - Event declaration and command reference
  - Complete list of available events
  - Event syntax and parameters
  - Command execution flow

- **[triggers.md](triggers.md)** - Trigger conditions and syntax
  - `when()` for continuous checking
  - `if()` for one-time evaluation
  - Trigger combination with logical operators

- **[event-chains.md](event-chains.md)** - Sequencing multiple events
  - Event chain declaration with `::`
  - Calling chains from triggers
  - Chain execution order

### Advanced Features

- **[macros.md](macros.md)** - Built-in macros and system variables
  - Resource macros (crystals, ore, studs)
  - Game state macros (time, buildings, creatures)
  - Special macros (random, get, erosionscale)

- **[conditions.md](conditions.md)** - Logical expressions and operators
  - Comparison operators (`>`, `<`, `==`, `!=`)
  - Logical operators (`and`, `or`, `not`)
  - Complex condition construction

- **[classes.md](classes.md)** - Object types and collections
  - Building, vehicle, and creature classes
  - Collection properties and methods
  - Class-specific triggers and events

## Syntax Rules Summary

### 1. No Spaces in Syntax
```
❌ WRONG: when (crystals > 50) [Victory]
✅ RIGHT: when(crystals>50)[Victory]
```

### 2. Semicolon Statement Termination
```
❌ WRONG: msg:Hello
         crystals:50
✅ RIGHT: msg:Hello;
         crystals:50;
```

### 3. Event Chain Declaration
```
❌ WRONG: EventName:
         msg:Hello;
✅ RIGHT: EventName::
         msg:Hello;
```

### 4. Case Sensitivity
Event names and variables are case-sensitive:
```
❌ WRONG: when(crystals>50)[victory];
         Victory::
✅ RIGHT: when(crystals>50)[Victory];
         Victory::
```

### 5. Coordinate Order
Always use row,col order (not X,Y):
```
❌ WRONG: emerge:X,Y,CreatureType
✅ RIGHT: emerge:row,col,CreatureType
```

## Learning Path

### For Beginners
1. Start with [variables.md](variables.md) - Understanding data types
2. Learn [triggers.md](triggers.md) - Making things happen
3. Study [events.md](events.md) - Available actions
4. Practice with [event-chains.md](event-chains.md) - Combining actions

### For Intermediate Users
1. Master [conditions.md](conditions.md) - Complex logic
2. Explore [macros.md](macros.md) - Built-in functionality
3. Understand [classes.md](classes.md) - Object manipulation

### For Advanced Users
1. Optimize with trigger combinations
2. Create complex state machines
3. Leverage class properties efficiently

## Quick Examples

### Basic Script Structure
```
script{
    # Variables
    int Score=0
    bool GameActive=true
    
    # Triggers
    when(init)[StartGame]
    when(crystals>=50)[CheckVictory]
    
    # Event chains
    StartGame::
    msg:Welcome;
    objective:Collect 50 crystals;
    
    CheckVictory::
    if(GameActive==true)[Victory];
    
    Victory::
    GameActive:false;
    msg:YouWin;
    win:;
}
```

### Common Patterns
```
# State tracking
bool HasKey=false
when(drill:10,10 and HasKey==false)[FindKey]

# Progressive objectives
int Stage=1
when(crystals>=10*Stage)[NextStage]

# Timed events
timer Countdown=60
when(Countdown.expired)[TimeUp]
```

## Syntax Pitfalls to Avoid

1. **Forgetting semicolons** - Every statement needs one
2. **Adding spaces** - No spaces in conditions or event calls
3. **Wrong coordinate order** - It's row,col not X,Y
4. **Case mismatches** - Event names must match exactly
5. **Missing double colons** - Event declarations need `::`

## See Also

- [Scripting Overview](../overview.md) - General scripting concepts
- [Common Patterns](../patterns/common-patterns.md) - Practical examples
- [Debugging Guide](../debugging.md) - Troubleshooting scripts
- [Reserved Words](../reserved-words.md) - Keywords to avoid