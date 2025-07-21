# Manic Miners Extension User Guide

This comprehensive guide covers all features and functionality of the Manic Miners VS Code extension for editing `.dat` map files.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Map Preview](#map-preview)
3. [Map Validation](#map-validation)
4. [Quick Actions](#quick-actions)
5. [Map Templates](#map-templates)
6. [Objective Builder](#objective-builder)
7. [Undo/Redo System](#undoredo-system)
8. [Version Control](#version-control)
9. [Heat Map Analysis](#heat-map-analysis)
10. [Accessibility Features](#accessibility-features)
11. [Smart Tile Suggestions](#smart-tile-suggestions)
12. [Keyboard Shortcuts](#keyboard-shortcuts)

## Getting Started

### Installation
1. Install the extension from the VS Code marketplace
2. Open any `.dat` file - the extension activates automatically
3. Access commands via Command Palette (`Cmd/Ctrl+Shift+P`)

### Basic Features
- **Syntax Highlighting**: Full color coding for all DAT file sections
- **IntelliSense**: Auto-completion and hover information
- **Navigation**: Go to definition, find references
- **Validation**: Real-time error checking

## Map Preview

Visual representation of your map with interactive features.

### Opening the Preview
- Command: `Manic Miners: Show Map Preview`
- Keyboard: `Cmd/Ctrl+Shift+M`
- Click the map icon in the editor title bar

### Features
- **Zoom**: 25% to 400% with mouse wheel or buttons
- **Pan**: Click and drag to move around
- **Tile Info**: Hover for tile details
- **Navigation**: Click tiles to jump to their location in code
- **Selection**: Shift+drag for multi-tile selection
- **Grid**: Toggle grid lines and tile IDs

### Keyboard Controls
- `+`/`-`: Zoom in/out
- `0`: Reset zoom to 100%
- `G`: Toggle grid
- `I`: Toggle tile IDs
- Arrow keys: Pan the view

## Map Validation

Comprehensive validation system with auto-fix capabilities.

### Running Validation
- Command: `Manic Miners: Run Map Validation`
- Automatic validation on save
- Real-time diagnostics in Problems panel

### Validation Checks
- **Structure**: Correct section format and syntax
- **Pathfinding**: Ensures all areas are accessible
- **Resources**: Verifies miners can reach crystals/ore
- **Objectives**: Validates objective requirements
- **Buildings**: Checks for required structures (Tool Store)
- **Boundaries**: Warns about tiles at map edges

### Auto-Fix
- Click the lightbulb icon on errors
- Command: `Manic Miners: Fix Common Map Issues`
- Available fixes:
  - Add missing Tool Store
  - Fix map dimensions
  - Correct invalid tile IDs
  - Add missing sections

## Quick Actions

Context-aware actions for efficient map editing.

### Tile Operations
Right-click in the tiles section for:
- **Convert to Reinforced**: Make tiles harder to drill
- **Fill Area**: Fill rectangular selection
- **Replace All**: Change all instances of a tile
- **Replace with Set**: Use predefined tile combinations

### Custom Tile Sets
- Create your own tile combinations
- Save frequently used patterns
- Access via `Replace with Tile Set` action

## Map Templates

Pre-built and custom templates for quick map creation.

### Using Templates
1. Command: `Manic Miners: Insert Map Template`
2. Choose from:
   - Training Ground (10x10)
   - Small Mining Operation (20x15)
   - Medium Excavation (30x20)
   - Large Mining Complex (40x30)
   - Hazard Challenge (25x25)
   - Custom templates

### Creating Custom Templates
1. Select tiles in your map
2. Command: `Create Template from Selection`
3. Name and save your template
4. Reuse across projects

### Managing Templates
- Command: `Manage Custom Templates`
- Edit, rename, or delete templates
- Export/import template collections

## Objective Builder

Visual interface for creating and managing level objectives.

### Opening the Builder
- Command: `Manic Miners: Open Objective Builder`
- Edit existing objectives or create new ones

### Supported Objectives
- **Collect Resources**: Crystals, ore, studs
- **Build Structures**: Specific buildings
- **Mine Blocks**: Quantity of tiles
- **Find/Rescue**: Units and objects
- **Reach Locations**: Specific tiles
- **Time Challenges**: Complete within time

### Features
- Real-time validation
- Parameter checking
- Quick examples
- Preview before insertion

## Undo/Redo System

Sophisticated undo/redo specifically for map operations.

### Usage
- **Undo**: `Cmd/Ctrl+Alt+Z`
- **Redo**: `Cmd/Ctrl+Alt+Shift+Z`
- View history: Click status bar indicator

### Features
- Visual preview before undo/redo
- Shows affected tiles
- Maintains 50 operations per file
- Survives file saves

### Supported Operations
- Fill area
- Replace tiles
- Template insertion
- Quick actions
- Auto-fixes

## Version Control

Track and manage different versions of your maps.

### Creating Versions
- Command: `Create Map Version`
- Automatic on significant changes
- Add commit messages

### Managing Versions
- Command: `Show Version History`
- Features:
  - Visual diff between versions
  - Restore previous versions
  - Compare side-by-side
  - Track change history

### Git Integration
- Works with existing Git repositories
- Visual indicators for changes
- Merge conflict resolution for maps

## Heat Map Analysis

Visualize pathfinding and traffic patterns in your map.

### Opening Heat Maps
- Command: `Manic Miners: Show Heat Map`
- Choose analysis type:
  - **Traffic**: Most traveled paths
  - **Accessibility**: Reachable areas
  - **Chokepoints**: Bottlenecks

### Features
- Color-coded visualization
- Statistical analysis
- Hotspot identification
- Export data

### Use Cases
- Optimize mining routes
- Identify navigation issues
- Balance resource placement
- Improve level flow

## Accessibility Features

Full support for users with different accessibility needs.

### Screen Reader Support
- All UI elements have ARIA labels
- Tile descriptions read aloud
- Navigation announcements
- Status updates

### High Contrast Mode
- Command: `Toggle High Contrast Mode`
- Enhanced visibility
- Clear tile boundaries
- Accessible color schemes

### Keyboard Navigation
- Full keyboard control
- No mouse required
- Customizable shortcuts
- Focus indicators

## Smart Tile Suggestions

AI-powered suggestions based on context.

### Using Suggestions
- Command: `Show Smart Tile Suggestions`
- Analyzes surrounding tiles
- Suggests appropriate replacements
- Learns from patterns

### Features
- Context-aware recommendations
- Pattern recognition
- Common configuration detection
- Usage statistics

## Keyboard Shortcuts

### Essential Shortcuts
| Action | Windows/Linux | macOS |
|--------|--------------|-------|
| Show Map Preview | `Ctrl+Shift+M` | `Cmd+Shift+M` |
| Run Validation | `Ctrl+Shift+V` | `Cmd+Shift+V` |
| Quick Actions | `Ctrl+.` | `Cmd+.` |
| Undo Map Edit | `Ctrl+Alt+Z` | `Cmd+Alt+Z` |
| Redo Map Edit | `Ctrl+Alt+Shift+Z` | `Cmd+Alt+Shift+Z` |

### Map Preview Controls
| Action | Key |
|--------|-----|
| Zoom In | `+` |
| Zoom Out | `-` |
| Reset Zoom | `0` |
| Toggle Grid | `G` |
| Toggle IDs | `I` |
| Pan | Arrow Keys |

### Customization
1. Open Keyboard Shortcuts: `Ctrl/Cmd+K Ctrl/Cmd+S`
2. Search for "Manic Miners"
3. Click the pencil icon to change
4. Press desired key combination

## Tips & Tricks

### Performance
- Use heat maps to optimize mining routes
- Validate frequently to catch issues early
- Create templates for repeated structures

### Workflow
1. Start with a template
2. Use quick actions for bulk edits
3. Validate as you work
4. Create versions at milestones
5. Use heat maps for final optimization

### Best Practices
- Keep Tool Store accessible
- Avoid tiles at map edges
- Test pathfinding with validation
- Use meaningful objective IDs
- Comment complex scripts

## Troubleshooting

### Common Issues
- **Preview not updating**: Save the file first
- **Validation errors**: Check for typos in section names
- **Performance issues**: Disable tile IDs for large maps
- **Can't find commands**: Ensure .dat file is active

### Getting Help
- View extension logs: `Output` panel → `Manic Miners`
- Report issues on GitHub
- Check documentation for updates

## Additional Resources
- [DAT File Format Guide](./DAT_FORMAT.md)
- [Tile Reference](./reference/TILE_REFERENCE.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)