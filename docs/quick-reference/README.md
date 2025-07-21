# Quick Reference Documentation

This directory contains quick reference guides and cheat sheets for rapid access to commonly needed information when working with Manic Miners maps.

## Available References

### 📋 [Script Commands](script-commands.md)
Comprehensive quick reference for all scripting commands and patterns.

**Includes:**
- Complete command syntax with examples
- Timer commands and conditions
- Building, vehicle, and creature types
- Common script patterns (tutorial, resource, combat)
- Debugging tips and best practices
- Performance optimization guidelines

**Use when you need to:**
- Look up command syntax quickly
- Find the correct class name for a building/vehicle
- Copy working script patterns
- Debug common issues

### 🎯 [Cheat Sheet](cheat-sheet.md)
One-page reference with the most essential information.

**Includes:**
- Basic DAT file structure
- Common tile IDs
- Essential script commands
- Quick debugging tips
- Coordinate system reminders

**Use when you need to:**
- Quickly check basic syntax
- Remember tile ID numbers
- Refresh on file structure

### 🏗️ [Tile IDs](tile-ids.md)
Complete listing of all tile IDs with descriptions.

**Includes:**
- All 165 tile types
- Grouped by category (floors, walls, hazards, etc.)
- Special tile behaviors
- Undiscovered tile calculations (+100)
- Reinforced wall calculations (+50)

**Use when you need to:**
- Find the right tile ID
- Understand tile properties
- Plan map layouts

### 🍳 [Common Recipes](common-recipes.md)
Ready-to-use script recipes for common scenarios.

**Includes:**
- Victory conditions
- Resource management
- Enemy waves
- Timer systems
- Tutorial sequences
- Achievement tracking

**Use when you need to:**
- Implement common features quickly
- Get started with a working example
- Learn scripting patterns

## How to Use These References

### During Development
Keep these references open in a separate tab or monitor while working on your maps:
1. **Script Commands** - For syntax lookup
2. **Tile IDs** - For map editing
3. **Common Recipes** - For script inspiration

### For Learning
Read through in this order:
1. **Cheat Sheet** - Get the basics down
2. **Common Recipes** - See practical examples
3. **Script Commands** - Deep dive into all options
4. **Tile IDs** - Master map creation

### Quick Lookup Tips

#### Finding Script Syntax
```
Ctrl+F in script-commands.md for:
- "timer" - Timer commands
- "emerge" - Spawning creatures
- "building" - Building types
- "pattern" - Script patterns
```

#### Finding Tile IDs
```
Ctrl+F in tile-ids.md for:
- "crystal" - Resource tiles
- "wall" - Wall types
- "lava" - Hazard tiles
- "floor" - Ground tiles
```

## Most Commonly Referenced Items

### Script Commands
- `msg:text;` - Display message
- `when(condition)[Event]` - Continuous trigger
- `crystals:amount;` - Add/remove crystals
- `emerge:row,col,type;` - Spawn creature
- `win:;` / `lose:;` - End game

### Tile IDs
- `1` - Ground (Floor)
- `38` - Solid Rock (Wall)
- `42` - Crystal Seam
- `46` - Ore Seam
- `6`/`7` - Lava

### Common Mistakes
- Forgetting semicolons (`;`)
- Using X,Y instead of row,col
- Spaces in syntax (`when (x > 5)` ❌)
- Wrong building class names

## Printable Versions

These references are designed to be printer-friendly:
- **Cheat Sheet** - Fits on 1-2 pages
- **Common Recipes** - Print specific sections
- **Tile IDs** - Print as reference card

## Contributing

To improve these references:
1. Keep entries concise and clear
2. Include practical examples
3. Test all code snippets
4. Maintain consistent formatting

## See Also

- [Scripting Patterns](../game-reference/scripting/patterns/README.md) - Detailed pattern documentation
- [DAT Format](../game-reference/format/README.md) - Complete format specification
- [Debugging Guide](../game-reference/scripting/debugging.md) - Troubleshooting help
- [Extension Guide](../extension/USER_GUIDE.md) - VSCode extension features