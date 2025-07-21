# Map Editor Guide

The Manic Miners extension includes a comprehensive visual map editor that allows you to edit .dat files using intuitive painting tools.

## Opening the Map Editor

There are two ways to open the map editor:

1. **Command Palette**: Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and run "Manic Miners: Open Map Editor"
2. **Editor Title Button**: Click the edit icon (✏️) in the editor title bar when viewing a .dat file

## Features

### 🖌️ Tile Painting Tool
- **Default tool** for painting individual tiles or areas
- Supports brush sizes from 1x1 to 10x10
- Click and drag to paint continuously
- Circular brush shape for natural painting

### 🪣 Fill Tool
- Fill connected regions of the same tile type
- Works like paint bucket in image editors
- Great for quickly filling large areas

### 📏 Line Tool
- Draw straight lines between two points
- Click to set start point, click again to draw line
- Preview shows while dragging

### ⬜ Rectangle Tool
- Draw filled rectangles
- Click and drag to define rectangle area
- Preview shows while dragging

### 💉 Tile Picker (Eyedropper)
- Pick a tile from the map to use as current paint color
- Automatically switches back to paint tool after picking

## Controls

### Mouse Controls
- **Left Click**: Apply current tool
- **Click + Drag**: Paint continuously (paint tool only)
- **Hover**: Shows preview overlay for current tool

### Keyboard Shortcuts
- **P**: Switch to Paint tool
- **F**: Switch to Fill tool
- **L**: Switch to Line tool
- **R**: Switch to Rectangle tool
- **K**: Switch to Picker tool
- **[**: Decrease brush size
- **]**: Increase brush size
- **Ctrl+Z** (Cmd+Z on Mac): Undo
- **Ctrl+Y** (Cmd+Y on Mac): Redo

## Tile Palette

The left sidebar shows a palette of common tiles:
- Ground (1)
- Lava (6)
- Water (11)
- Dirt (26)
- Loose Rock (30)
- Hard Rock (34)
- Solid Rock (38, 40)
- Crystal Seam (42)
- Ore Seam (46)
- Recharge Seam (50)

### Adding Custom Tiles
1. Enter a tile ID (1-115) in the custom tile input
2. Click "Add Custom" to add it to your palette
3. The tile will appear with an auto-generated color

## Undo/Redo

The map editor maintains a comprehensive edit history:
- Up to 100 operations can be undone
- Each paint stroke, fill, line, or rectangle is one operation
- History persists during the editing session

## Visual Features

### Grid Overlay
- Subtle grid lines help with precise tile placement
- Grid automatically scales with zoom level

### Coordinate Display
- Shows current row and column under cursor
- Located in the top-right toolbar

### Real-time Preview
- Paint tool shows brush area preview
- Line and rectangle tools show shape preview
- Picker tool highlights the tile to be picked

## Performance

The map editor is optimized for large maps:
- Efficient canvas rendering
- Only redraws changed tiles
- Smooth performance even on 100x100+ maps

## Tips

1. **Large Area Painting**: Use the fill tool for large areas of the same tile
2. **Precise Placement**: Use brush size 1 for detailed work
3. **Quick Color Switching**: Use the picker tool (K) to quickly grab colors from existing tiles
4. **Building Patterns**: Use the rectangle tool to quickly create building foundations
5. **Natural Caves**: Use larger brush sizes (5-8) for more natural-looking cave systems

## Saving Changes

- Changes are automatically saved to the document
- The text editor view updates in real-time
- Use standard VS Code save (`Ctrl+S` / `Cmd+S`) to save to disk

## Switching Views

To switch back to the text editor:
- Run "Manic Miners: Switch to Text Editor" from command palette
- Or use VS Code's "Reopen With..." command

## Troubleshooting

### Map doesn't load
- Ensure the .dat file has valid syntax
- Check that tiles section exists and is properly formatted

### Colors look wrong
- The editor uses standard tile colors from the game
- Custom tiles get auto-generated colors based on their ID

### Performance issues
- Try reducing brush size for better performance
- Very large maps (200x200+) may have some lag

## Future Enhancements

Planned features for future releases:
- Copy/paste tile regions
- Tile stamps and patterns
- Mirror/rotate tools
- Multi-layer editing
- Export to image formats