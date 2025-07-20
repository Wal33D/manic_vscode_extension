# Tile Images Directory

This directory contains images for tiles used in hover tooltips and other UI elements.

## Available Images

The following images have been downloaded and are available for use:

1. **crystal_energy.png** - Energy crystal icon
   - Source: https://kb.rockraidersunited.com/Energy_crystal#/media/File:Energy_Crystal_manual.png
   - Used for: Crystal seam tiles (IDs 42-45, 92-95)
   - Also used as placeholder for: Recharge seam tiles (IDs 50-53, 100-103)

2. **crystal_energy_drained.png** - Drained energy crystal icon
   - Source: https://kb.rockraidersunited.com/File:Energy_Crystal_drained_manual.png
   - Used for: Depleted crystal seams (future feature)

3. **ore_resource.png** - Ore icon
   - Source: https://kb.rockraidersunited.com/LEGO_ore#/media/File:Ore_manual.png
   - Used for: Ore seam tiles (IDs 46-49, 96-99)

## Usage in Code

Images are displayed in hover tooltips for resource tiles. The hover provider automatically shows the appropriate image based on the tile ID.

## Additional Images Needed

If you find additional images for these tiles, please add them:
- **crystal_recharge.png** - Specific icon for recharge seam tiles
- **tile_lava.png** - Lava tile visualization
- **tile_water.png** - Water tile visualization
- **tile_ground.png** - Ground tile visualization

## Naming Convention

Use lowercase with underscores, prefixed by tile type:
- crystal_[type].png
- ore_[type].png
- tile_[type].png