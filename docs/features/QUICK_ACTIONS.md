# Quick Actions Feature

Quick Actions provide context-sensitive code actions in the tiles section of your Manic Miners DAT files.

## Recent Improvements

### Version 0.3.0
- **Custom Tile Sets**: Save and reuse your favorite tile combinations
- **Enhanced Performance**: Optimized for larger maps
- **Better UI**: Improved action descriptions and organization

## Available Actions

### 1. Convert to Reinforced
- **When**: Selecting a normal tile (ID 1-50)
- **Action**: Converts the tile to its reinforced variant (+50 to ID)
- **Example**: `1` → `51` (Ground → Reinforced Ground)

### 2. Convert to Normal
- **When**: Selecting a reinforced tile (ID 51-100)
- **Action**: Converts the tile back to its normal variant (-50 to ID)
- **Example**: `51` → `1` (Reinforced Ground → Ground)

### 3. Replace with Common Tiles
- **When**: Selecting any tile ID
- **Available replacements**:
  - Ground (1)
  - Lava (6)
  - Water (11)
  - Crystal Seam (26)
  - Ore Seam (34)
  - Recharge Seam (42)
  - Solid Rock (40)

### 4. Fill Area
- **When**: Selecting multiple tiles (drag selection)
- **Action**: Fills the selected area with Ground tiles (ID 1)
- **Usage**: Great for clearing large areas or creating rooms

### 5. Replace All
- **When**: Selecting any tile ID
- **Action**: Replaces all instances of that tile ID with another
- **Usage**: Useful for global tile type changes

### 6. Custom Tile Sets
- **When**: Any tile selected
- **Action**: Replace with tiles from your custom sets
- **Default Sets**:
  - Hazards (Lava, Water, Ice)
  - Resources (Crystals, Ore, Recharge)
  - Walls (Various wall types)
  - Paths (Walkable tiles)
- **Create Your Own**: Save frequently used tile combinations

## How to Use

1. **Single Tile Actions**:
   - Place your cursor on a tile ID in the tiles section
   - Click the lightbulb icon or press `Ctrl+.` (Windows/Linux) or `Cmd+.` (Mac)
   - Select the desired action from the menu

2. **Multi-Tile Actions**:
   - Select multiple tiles by dragging
   - Click the lightbulb icon or use the keyboard shortcut
   - Choose "Fill Area" to replace all selected tiles

3. **Replace All**:
   - Select a tile ID
   - Choose "Replace All X with..."
   - Enter the new tile ID in the prompt
   - All instances will be replaced

## Examples

### Converting Tiles to Reinforced
```
Before:
tiles{
1,1,1,
6,6,6,
11,11,11,
}

After selecting first '1' and choosing "Convert to Reinforced":
tiles{
51,1,1,
6,6,6,
11,11,11,
}
```

### Filling an Area
```
Before (with area selected):
tiles{
[1,2,3,]
[4,5,6,]
[7,8,9,]
}

After "Fill Area with Ground":
tiles{
1,1,1,
1,1,1,
1,1,1,
}
```

### Replace All
```
Before:
tiles{
1,6,1,
6,6,6,
1,6,1,
}

After "Replace All 6 with 11":
tiles{
1,11,1,
11,11,11,
1,11,1,
}
```

## Tips

- Quick Actions only work within the tiles section
- The lightbulb icon appears when actions are available
- Use keyboard shortcuts for faster access
- Multiple tiles can be selected for bulk operations
- Undo (`Ctrl+Z`) works with all quick actions