# Map Preview Feature

The Map Preview feature provides a visual representation of your Manic Miners level directly in VSCode.

## Features

- **Real-time visualization**: See your map update as you edit the tiles section
- **Zoom controls**: Zoom in/out to see details or get an overview (25% to 400%)
- **Tile information**: Hover over tiles to see their ID and type
- **Click navigation**: Click any tile to jump to its location in the editor
- **Color-coded tiles**: Each tile type has a distinct color for easy identification
- **Multi-tile selection**: Hold Shift and drag to select multiple tiles
- **Toggle controls**: Show/hide grid lines and tile IDs
- **Performance optimization**: Viewport culling for large maps (50x50+)
- **Keyboard shortcuts**: Quick access to common functions

## How to Use

1. **Open the Map Preview**:
   - Open any `.dat` file
   - Click the "Map Preview" icon in the Explorer sidebar
   - Or use the command palette: `Manic Miners: Show Map Preview`
   - Or click the map icon in the editor title bar

2. **Navigate the Preview**:
   - Use the + and - buttons to zoom in/out
   - Click "Reset" to return to 100% zoom
   - Use mouse wheel to zoom (hover over the map)
   - Click any tile to jump to it in the editor

3. **Multi-tile Selection**:
   - Hold Shift and drag to select multiple tiles
   - Selected tiles are highlighted in blue
   - Press Escape to clear selection
   - Selection count appears in status bar

4. **Toggle Options**:
   - **Grid**: Check/uncheck to show/hide grid lines
   - **IDs**: Check/uncheck to show/hide tile ID numbers

5. **Keyboard Shortcuts**:
   - `Ctrl/Cmd + +`: Zoom in
   - `Ctrl/Cmd + -`: Zoom out
   - `Ctrl/Cmd + 0`: Reset zoom to 100%
   - `G`: Toggle grid lines
   - `I`: Toggle tile IDs
   - `Escape`: Clear tile selection

6. **Understanding Colors**:
   - **Gray**: Ground tiles (walkable)
   - **Orange/Red**: Lava hazards
   - **Blue**: Water hazards
   - **Brown shades**: Dirt, loose rock, hard rock walls
   - **Black**: Solid rock (impenetrable)
   - **Yellow-green**: Crystal seams
   - **Orange-brown**: Ore seams
   - **Bright yellow**: Recharge seams

## Tile Information

When hovering over a tile, you'll see:
- Tile coordinates [row, col]
- Tile ID number
- Tile name (e.g., "Ground", "Lava", "Crystal Seam")

## Performance Tips

- **Viewport Culling**: Large maps (50x50+) automatically use viewport culling for smooth performance
- **Grid and IDs**: Disable grid lines and tile IDs for better performance on slower systems
- **Zoom Levels**: Lower zoom levels render faster for very large maps
- **Auto-update**: Preview updates automatically with document changes
- **Tile IDs**: Now shown at 150% zoom or higher (previously 200%)

## Recent Improvements

### Version 0.3.0
- **Multi-tile Selection**: Select multiple tiles with Shift+drag for batch operations
- **Toggle Controls**: Show/hide grid lines and tile IDs on demand
- **Keyboard Shortcuts**: Full keyboard control for zoom and toggles
- **Performance Optimization**: Viewport culling for large maps
- **Enhanced UI**: Better controls layout with grouped zoom and toggle options
- **Improved Tile ID Display**: Now visible at 150% zoom (was 200%)

## Technical Details

The map preview uses the tiles section from your `.dat` file and renders each tile as a colored square. The color mapping is based on the official Manic Miners tile definitions, including support for all 90+ tile types and their reinforced variants.

### Performance Features
- Canvas-based rendering for speed
- Viewport culling for maps larger than 50x50
- Optimized scroll handling with debouncing
- Efficient color mapping with caching