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

### 🪄 Magic Wand Tool
- Select all connected tiles of the same type
- Click on any tile to select all connected similar tiles
- Great for selecting regions quickly

### 🔲 Lasso Tool  
- Freehand selection tool
- Click and drag to draw selection outline
- Double-click or press Escape to complete selection

### ⭕ Ellipse Selection
- Create elliptical selections
- Click and drag to define ellipse bounds
- Useful for selecting circular areas

### 🔺 Polygon Selection
- Create polygonal selections with multiple vertices
- Click to add vertices
- Double-click or press Escape to complete polygon

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
- **S**: Switch to Select tool
- **T**: Switch to Stamp tool
- **A**: Toggle Auto-Tiling
- **W**: Switch to Magic Wand tool
- **O**: Switch to Lasso tool
- **E**: Switch to Ellipse selection
- **G**: Switch to Polygon selection
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

## Advanced Features

### 📋 Copy/Paste/Move
- **Copy**: Select a region and press `Ctrl+C` to copy
- **Paste**: Press `Ctrl+V` and click where to paste
- **Move**: Select a region and press `M` to move it
- **Delete**: Select a region and press `Delete` to clear it

### 🎯 Advanced Selection Options
- **Expand Selection**: Grow selection by one tile in all directions
- **Contract Selection**: Shrink selection by one tile
- **Invert Selection**: Select everything except current selection
- **Select All**: Press `Ctrl+A` to select entire map
- **Select by Type**: Select all tiles of a specific type
- **Combine Selections**: Add, subtract, or intersect multiple selections

### 🔍 Zoom and Pan
- **Zoom In/Out**: Use `+`/`-` keys or mouse wheel with Ctrl
- **Reset Zoom**: Press `0` to reset to 100%
- **Pan**: Click and drag with middle mouse or Shift+drag

### 🗺️ Minimap
- Shows overview of entire map in the sidebar
- Click to jump to any location
- Drag the viewport indicator to pan

### 🎨 Tile Patterns
- **Save Pattern**: Select a region and click "Save Pattern"
- **Use Pattern**: Click a saved pattern and use the Stamp tool (T)
- Patterns are saved per workspace

### 🔧 Auto-Tiling
- **Enable/Disable**: Press `A` or click the Auto-Tile button
- Automatically chooses correct tile variants based on neighbors
- Supported tile types:
  - Rock/Wall tiles (30-44): Creates proper edges and corners
  - Water tiles (11-16): Creates shorelines
  - Lava tiles (6-10): Creates lava flows
  - Crystal/Ore seams (42-49): Creates connected veins
- Works with all painting tools (Paint, Fill, Line, Rectangle)

### ↔️ Mirror Modes
- **Horizontal**: Press `H` to mirror horizontally
- **Vertical**: Press `V` to mirror vertically  
- **Both**: Press `B` to mirror in both directions
- **Off**: Select "Off" button to disable mirroring

### 🎭 Layers
- **Add Layer**: Click "New Layer" button
- **Toggle Visibility**: Click the eye icon on each layer
- **Adjust Opacity**: Use the opacity slider
- **Delete Layer**: Hover and click the trash icon
- **Active Layer**: Click to select which layer to edit
- Base layer cannot be deleted

### 💾 Export
- **Export to Image**: Press `E` or click Export button
- Supports PNG and JPEG formats
- Option to include grid lines in export

## Additional Keyboard Shortcuts

### Selection Mode (S)
- **Ctrl+C**: Copy selection
- **Ctrl+V**: Paste selection
- **Delete**: Delete selection
- **M**: Move selection

### Navigation
- **Mouse Wheel + Ctrl**: Zoom in/out
- **Middle Mouse Drag**: Pan around map
- **Shift + Left Drag**: Pan around map

### Mirror Modes
- **H**: Toggle horizontal mirror
- **V**: Toggle vertical mirror
- **B**: Toggle both mirrors

## Performance Tips

1. **Large Maps**: For maps over 100x100, use smaller brush sizes
2. **Layers**: Keep layer count reasonable (under 10) for best performance
3. **Patterns**: Large patterns may cause brief lag when stamping
4. **Zoom**: Working at 100% zoom provides best performance

## Future Enhancements

## Auto-Tiling System

The auto-tiling feature automatically selects the correct tile variant based on neighboring tiles.

### Supported Tile Types
- **Rock/Walls**: Tiles 30-44
- **Water**: Tiles 11-16
- **Lava**: Tiles 6-10
- **Crystals**: Tiles 42-45
- **Ore**: Tiles 46-49

### How to Use
1. Click the **Auto-Tile** button in the toolbar (or press **A**)
2. Paint with supported tile types
3. The system automatically chooses appropriate variants

## Map Validation

The validation system helps ensure your maps are playable and well-designed.

### How to Use
1. Click the **Validate** button (or press **V**)
2. Review issues in the validation panel
3. Click on issues to highlight them on the map
4. Use fix buttons where available

### Validation Categories
- Structure, Tiles, Accessibility, Resources
- Objectives, Buildings, Spawn Points
- Hazards, Performance

## Map Templates

Start with pre-made map layouts that you can customize.

### Built-in Templates
- **Basic Tutorial** (20x20) - Beginner
- **Combat Arena** (30x30) - Intermediate  
- **Puzzle Chamber** (25x25) - Advanced
- **Resource Rush** (35x35) - Intermediate
- **Exploration Cavern** (40x40) - Intermediate

### Using Templates
1. Click **Templates** button (or press **T**)
2. Browse and preview templates
3. Click **Use Template** to start
4. Press **Ctrl+Shift+S** to save current map as template

## Updated Keyboard Shortcuts

- **A**: Toggle auto-tiling
- **T**: Open templates gallery
- **V**: Validate map
- **Ctrl+Shift+S**: Save as template

## Coming Soon

- Animated tile preview
- Collaborative editing  
- Map scripting integration