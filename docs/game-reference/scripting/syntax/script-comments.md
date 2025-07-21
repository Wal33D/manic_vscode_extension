# Script Comments

Comments allow you to add notes and documentation to your scripts that are ignored by the game engine.

## Comment Syntax

Comments use the `#` symbol and everything after it on the line is ignored:

```
# This is a full line comment
init::disable:lights;      # This is an inline comment
```

## Rules

### Leading Spaces
Full line comments can have leading spaces which are ignored:

```
# Valid comment at start of line
        # Also valid - leading spaces are ignored
```

### Inline Comments
Comments can appear after script statements:

```
air+=100;    # Give player 100 air
crystals:50; # Set crystals to 50
```

### Event Chain Termination
**Important**: Comment lines do NOT terminate event chains - only blank lines do:

```
MyChain::
air+=100;
# This comment doesn't end the chain
# Need a blank line to end it

NewChain::  # This starts a new chain
```

### Disabling Code
Comments are useful for temporarily disabling script lines:

```
# emerge:10,10,CreatureRockMonster_C;  # Disabled for testing
msg:TestMessage;                        # This still runs
```

## Best Practices

1. **Document Complex Logic**: Use comments to explain non-obvious code
2. **Mark TODOs**: Use comments for future improvements
3. **Version Notes**: Track changes and modifications
4. **Debugging**: Comment out code instead of deleting during testing

## Examples

### Well-Documented Script
```
# Tutorial Level Script
# Version: 1.2
# Author: MapMaker
# Purpose: Teach basic mining mechanics

script{
    # Initialize variables
    bool TutorialComplete=false  # Track completion
    int Step=0                   # Current tutorial step
    
    # Start tutorial when map loads
    if(init)[StartTutorial];
    
    StartTutorial::
    Step:1;
    msg:Welcome;  # Show welcome message
    # TODO: Add voice acting trigger here
}
```

### Debugging Example
```
TestSpawning::
emerge:10,10,CreatureRockMonster_C;
# emerge:11,11,CreatureRockMonster_C;  # Too many - disabled
# emerge:12,12,CreatureRockMonster_C;  # For later testing
wait:5;
msg:SpawnComplete;
```

## Comparison with comments{} Section

Don't confuse script comments with the `comments{}` section:
- **Script comments**: Use `#`, appear in `script{}`, ignored by engine
- **comments{} section**: Separate DAT file section for map metadata

## See Also
- [Comments Section](../../format/sections/comments.md) - The comments{} section format
- [Script Section](../../format/sections/script.md) - Where script comments appear
- [Event Chains](event-chains.md) - Understanding chain termination