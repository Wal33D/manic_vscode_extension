# Reserved Words

## Overview

Reserved words are special keywords in the Manic Miners scripting language that cannot be used as variable names, event chain names, or other identifiers. Using these words will cause script parsing errors or unexpected behavior.

## Reserved Keywords

### Language Keywords
- `int` - Integer variable declaration
- `float` - Floating-point variable declaration  
- `bool` - Boolean variable declaration
- `string` - String variable declaration
- `arrow` - Arrow object declaration
- `timer` - Timer object declaration
- `miner` - Miner object declaration
- `vehicle` - Vehicle object declaration
- `creature` - Creature object declaration

### Control Keywords
- `if` - One-time trigger
- `when` - Repeating trigger
- `true` - Boolean true value
- `false` - Boolean false value

### Built-in Variables
- `crystals` - Crystal resource count
- `ore` - Ore resource count
- `studs` - Stud resource count
- `air` - Air supply level
- `time` - Elapsed mission time
- `buildings` - Building collection
- `vehicles` - Vehicle collection
- `creatures` - Creature collection
- `miners` - Miner collection

### Event Names
All built-in event names are reserved:
- `msg`, `drill`, `place`, `trulyplace`, `undiscover`
- `highlightarrow`, `removearrow`, `destroyall`
- `emergebl`, `emerge`, `generatelandslide`
- `pause`, `unpause`, `win`, `lose`, `quitloop`
- `starttimer`, `stoptimer`, `callfunction`
- And many more...

### Macro Names
- `init` - Initialization trigger
- `tick` - Per-frame update trigger
- All class property macros

## Complete Reserved Words List

For the complete, up-to-date list of reserved words including all events, macros, and built-in identifiers, see the comprehensive [Reserved Words Reference](../../web-docs/_pages/ReservedWords.md).

## Best Practices

1. **Use descriptive names** that clearly indicate purpose
2. **Add prefixes** to avoid conflicts (e.g., `myTimer` instead of `timer`)
3. **Check the list** before naming new variables or chains
4. **Use camelCase** for multi-word identifiers
5. **Avoid abbreviations** that might conflict with reserved words

## Examples

### Good Variable Names
```
int playerScore=0
bool hasFoundSecret=false
string welcomeMessage="Hello"
timer countdownTimer=MyTimer
```

### Bad Variable Names (Reserved)
```
int crystals=0        # Reserved - built-in variable
bool true=false       # Reserved - keyword
string msg="test"     # Reserved - event name
timer timer=MyTimer   # Reserved - type name
```

## See Also
- [Variables](syntax/variables.md) - Variable declaration syntax
- [Macros](syntax/macros.md) - Built-in macro reference
- [Events](syntax/events.md) - Event command reference
- [Complete Reserved Words List](../../web-docs/_pages/ReservedWords.md)