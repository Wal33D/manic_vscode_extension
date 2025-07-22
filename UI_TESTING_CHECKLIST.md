# UI Components Testing Checklist

## 1. Activity Bar Container
- [ ] Manic Miners icon appears in the activity bar
- [ ] Clicking the icon reveals the extension views
- [ ] Icon has proper tooltip "Manic Miners"

## 2. Maps Explorer View
- [ ] Shows "Recent Maps" section
- [ ] Shows "Templates" section with 5 built-in templates
- [ ] Shows "Samples" section
- [ ] Shows "Workspace Maps" section
- [ ] Double-clicking a map opens it in the editor
- [ ] Refresh button works
- [ ] Recently opened maps appear in Recent Maps

## 3. Tile Palette View
- [ ] Shows tile categories: Ground, Liquids, Walls, Resources, Special
- [ ] Categories are expandable/collapsible
- [ ] Each tile shows ID and name
- [ ] Clicking a tile selects it
- [ ] Selected tile is highlighted

## 4. Script Snippets View
- [ ] Shows categories: Triggers, Monsters, Objectives, Environment, Custom
- [ ] Categories are expandable/collapsible
- [ ] Each snippet shows name and description
- [ ] Double-clicking inserts snippet at cursor
- [ ] "Add Custom Snippet" command works

## 5. Validation View
- [ ] Shows validation status (✓ or ✗)
- [ ] Shows last validation time
- [ ] Groups issues by category
- [ ] Shows error/warning/info counts
- [ ] Clicking an issue navigates to the line

## 6. Status Bar Items
- [ ] Map info shows (title, size, biome) when .dat file is open
- [ ] Tile selection shows current tile
- [ ] Validation status shows error/warning counts
- [ ] Performance metrics show tile count and resources
- [ ] Items update in real-time as document changes

## 7. Commands
- [ ] `Manic Miners: Refresh Maps Explorer` works
- [ ] `Manic Miners: Show Tile Palette` focuses the view
- [ ] `Manic Miners: Add Custom Snippet` prompts for input
- [ ] `Manic Miners: Run Validation` triggers validation
- [ ] All commands appear in Command Palette (Ctrl+Shift+P)

## Issues Found
- [x] Fixed: Duplicate command registration for 'manicMiners.runValidation' (PR #61)

## Test Results
- UI components successfully created and integrated
- All tree views are registered and accessible
- Status bar items display correctly
- Commands are available in Command Palette

## Notes
- Testing with sample .dat files from samples/levels directory
- All UI components are functional but could benefit from:
  - Better integration with Map Editor
  - More visual feedback on actions
  - Enhanced keyboard navigation