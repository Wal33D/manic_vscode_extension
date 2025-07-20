# Undo/Redo System

## Overview
The Manic Miners extension provides a sophisticated undo/redo system specifically designed for map editing operations. Unlike standard text editor undo, this system tracks semantic map changes and provides visual previews.

## Features

### Edit History Tracking
- Tracks all map editing operations (fill area, replace tiles, etc.)
- Maintains separate history for each file
- Preserves history during the editing session
- Maximum 50 operations per file (configurable)

### Visual Preview
Before executing an undo or redo operation, the system shows:
- Grid visualization with affected tiles highlighted
- Summary of changes to be applied
- Tile transition details (e.g., "Ground → Lava")
- Total number of affected tiles

### Status Bar Integration
The status bar shows:
- Current position in history (e.g., "3/5")
- Undo/redo availability
- Click to open history panel

## Usage

### Keyboard Shortcuts
- **Undo**: `Cmd+Alt+Z` (Mac) / `Ctrl+Alt+Z` (Windows/Linux)
- **Redo**: `Cmd+Alt+Y` (Mac) / `Ctrl+Alt+Y` (Windows/Linux)
- **Show History**: `Cmd+Alt+H` (Mac) / `Ctrl+Alt+H` (Windows/Linux)

### Commands
Access via Command Palette (`Cmd/Ctrl+Shift+P`):
- `Manic Miners: Undo Map Edit` - Undo with preview
- `Manic Miners: Redo Map Edit` - Redo with preview
- `Manic Miners: Show Edit History` - View complete history
- `Manic Miners: Clear Edit History` - Reset history

### Supported Operations
The following operations are tracked in history:
1. **Fill Area** - Fill selected region with a tile type
2. **Replace All** - Replace all instances of one tile with another
3. **Tile Set Operations** - Apply custom tile sets
4. **Auto-fixes** - Validation error corrections

## Visual Preview Interface

### Preview Window
When you trigger undo/redo, a preview window appears showing:

```
┌─────────────────────────────────────┐
│ Undo: Fill area with tile 26 (15)  │
├─────────────────────────────────────┤
│                                     │
│  [Grid visualization with           │
│   highlighted affected tiles]       │
│                                     │
├─────────────────────────────────────┤
│ Changes Summary (15 tiles)          │
│                                     │
│ Ground (1) → Dirt Wall (26)  12     │
│ Lava (6) → Dirt Wall (26)     3     │
│                                     │
├─────────────────────────────────────┤
│ [Undo Changes]    [Cancel]          │
└─────────────────────────────────────┘
```

### History Panel
The history panel displays:
- Chronological list of all edits
- Timestamp for each operation
- Current position indicator
- Number of changes per operation

## Implementation Details

### Edit Tracking
Each edit records:
- Unique ID and timestamp
- Description of the operation
- Document URI
- Array of changes (old text, new text, range)

### Memory Management
- Oldest edits are removed when limit reached
- History cleared when file is closed
- Separate history per file
- Efficient storage of change data

### Integration Points
The undo/redo system integrates with:
- Quick Actions (all operations are tracked)
- Validation auto-fixes
- Future map editing features

## Examples

### Example 1: Fill Area
1. Select a region in the tiles section
2. Use quick action "Fill Area with Ground (1)"
3. System records the operation
4. Press `Cmd+Alt+Z` to preview undo
5. Confirm to revert the fill operation

### Example 2: Replace All Tiles
1. Use "Replace All 26 with..." command
2. Enter replacement tile ID (e.g., 42)
3. System replaces all instances and records
4. Can undo to restore original tiles

### Example 3: Multiple Operations
1. Perform several edits
2. Open history panel to see all operations
3. Undo multiple times to reach desired state
4. Redo to move forward in history

## Configuration

### Settings
Future settings will include:
- `manicMiners.undoRedo.maxHistory`: Maximum history size (default: 50)
- `manicMiners.undoRedo.showPreview`: Enable/disable preview (default: true)
- `manicMiners.undoRedo.preserveOnSave`: Keep history after save (default: false)

## Tips & Best Practices

1. **Use Preview**: Always review the preview before confirming
2. **Save Regularly**: History is session-based
3. **Batch Operations**: Multiple small edits can fill history quickly
4. **Clear When Needed**: Use clear command to reset if history gets cluttered

## Troubleshooting

### History Not Working
- Ensure you're editing a .dat file
- Check that operations are supported (not all edits are tracked)
- Verify keyboard shortcuts aren't conflicting

### Preview Not Showing
- Check if preview window is behind other windows
- Ensure sufficient screen space
- Try using command palette instead of shortcuts

### Performance Issues
- Clear history if it gets too large
- Reduce max history size in settings
- Close unnecessary files to free memory