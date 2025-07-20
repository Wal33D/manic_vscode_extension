# Map Validation Feature

Advanced validation for Manic Miners maps including pathfinding checks, resource accessibility, and objective validation.

## Features

- **Real-time Diagnostics**: Errors and warnings appear inline as you edit
- **Pathfinding Analysis**: Checks if all resources are reachable
- **Resource Validation**: Ensures objectives match available resources
- **Structure Validation**: Verifies map dimensions and tile placement
- **Auto-fix Support**: Fix common issues with one click
- **Detailed Reports**: Comprehensive validation reports with actionable insights

## Validation Checks

### 1. Structure Validation
- Verifies tiles section exists
- Checks row/column count consistency
- Validates map dimensions match info section

### 2. Tile Validation
- Detects invalid tile IDs (must be 1-115)
- Warns about deprecated tiles
- Identifies tile placement issues

### 3. Pathfinding Validation
- Ensures starting positions (Tool Stores) exist
- Checks if all resources are reachable from start
- Detects isolated areas on the map
- Validates building accessibility

### 4. Resource Validation
- Counts available resources (crystals, ore, recharge seams)
- Checks if resources are blocked by reinforced walls
- Warns about inaccessible resource placement

### 5. Objective Validation
- Verifies objectives are achievable with available resources
- Checks collection objectives against resource counts
- Validates objective syntax

## How to Use

### Automatic Validation
Validation runs automatically as you edit:
- Red squiggles indicate errors
- Yellow squiggles indicate warnings
- Hover over squiggles for details

### Manual Validation
1. **Run Full Validation**:
   - Click the validation icon in editor title bar
   - Or use Command Palette: `Manic Miners: Run Map Validation`
   - Or press the keyboard shortcut (if configured)

2. **View Validation Report**:
   - Command: `Manic Miners: Show Validation Report`
   - Opens detailed report in side panel
   - Shows all issues organized by type

3. **Fix Common Issues**:
   - Command: `Manic Miners: Fix Common Map Issues`
   - Automatically fixes:
     - Invalid tile IDs (replaced with ground)
     - Missing sections
     - Basic formatting issues

## Understanding Results

### Error Types

#### Critical Errors (Red)
These prevent the map from being playable:
- Missing tiles section
- Invalid tile IDs
- Unachievable objectives

#### Warnings (Yellow)
These may cause gameplay issues:
- Unreachable resources
- Buildings at map edge
- Inconsistent dimensions
- Blocked resources

#### Information (Blue)
Helpful insights about your map:
- Resource counts
- Isolated area detection
- Map statistics

## Examples

### Example 1: Unreachable Resource
```
tiles{
101,1,1,1,1,
40,40,40,40,1,
1,1,1,40,1,
1,40,40,40,1,
1,40,26,40,1,  // Crystal at [4,2] is unreachable!
}
```
**Warning**: "1 crystal seam(s) are unreachable from starting position"

### Example 2: Invalid Objective
```
objectives{
Collect 20 crystals
}
// But map only has 5 crystal tiles
```
**Error**: "Objective requires 20 crystals but map only has 5"

### Example 3: Building at Edge
```
tiles{
101,1,1,1,1,  // Tool Store at edge [0,0]
1,1,1,1,1,
...
}
```
**Warning**: "Building at edge of map [0, 0] may cause issues"

## Tips

### For Best Results
1. Always place at least one Tool Store (starting position)
2. Ensure paths exist to all resources
3. Match objectives to available resources
4. Avoid placing buildings on map edges
5. Use validation before finalizing maps

### Performance
- Large maps (100x100+) may take a moment to validate
- Pathfinding analysis is optimized but thorough
- Disable real-time validation if experiencing lag

## Keyboard Shortcuts

No default shortcuts assigned. You can set custom shortcuts:
1. File → Preferences → Keyboard Shortcuts
2. Search for:
   - `manicMiners.runValidation`
   - `manicMiners.showValidationReport`
   - `manicMiners.fixCommonIssues`

## Integration with Other Features

- **Map Preview**: See validation issues visually
- **Quick Actions**: Fix issues with code actions
- **IntelliSense**: Get suggestions to avoid errors

## Advanced Features

### Pathfinding Algorithm
Uses breadth-first search (BFS) to ensure connectivity:
- Considers walkable tiles (ground types)
- Checks from all starting positions
- Reports unreachable areas

### Resource Accessibility
Analyzes resource placement:
- Warns if surrounded by reinforced walls
- Checks drilling paths
- Validates collection feasibility

### Objective Analysis
Parses and validates objectives:
- Extracts numeric requirements
- Compares with map resources
- Suggests corrections

## Future Improvements

- Heat map visualization for pathfinding
- More auto-fix options
- Custom validation rules
- Performance profiling
- Export validation reports