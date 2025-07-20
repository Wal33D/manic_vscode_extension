# Change Log

All notable changes to the "Manic Miners DAT File Support" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.3.0] - 2024-01-20

### Added
- **Visual Map Preview** - Real-time canvas-based map rendering
  - Zoom controls (25% to 400%)
  - Click to navigate to tile in editor
  - Multi-tile selection with Shift+drag
  - Toggle grid lines and tile IDs
  - Keyboard shortcuts for all controls
  - Performance optimizations for large maps
- **Objective Builder** - Visual interface for creating level objectives
  - Support for all objective types
  - Real-time preview and validation
  - Parameter validation
  - Quick examples
  - Analysis and reporting commands
- **Map Validation** - Advanced validation system
  - Pathfinding analysis with BFS algorithm
  - Resource accessibility checks
  - Objective validation
  - Real-time diagnostics
  - Auto-fix for common issues
  - Comprehensive validation reports
- **Quick Actions** - Context-aware code actions
  - Convert between normal and reinforced tiles
  - Fill rectangular areas
  - Replace all instances of a tile
  - Custom tile sets with persistent storage
- **Map Templates** - Reusable level patterns
  - Pre-built templates for common structures
  - Create custom templates from selection
  - Template management system
  - Parameter customization

### Enhanced
- IntelliSense now supports all DAT file sections
- Go-to-definition for miners, buildings, and script variables
- Find all references functionality
- Improved hover information with tile details
- Enhanced snippets for all sections

### Fixed
- TypeScript strict mode compliance
- ESLint rule violations
- Test coverage gaps
- Performance issues with large files

## [0.2.5] - 2024-01-19

### Added
- Enhanced test coverage
- Game asset images for buildings and vehicles
- Improved documentation

### Fixed
- TypeScript compilation errors
- ESLint formatting issues
- Failing unit tests

## [0.2.0] - 2024-01-18

### Added
- Enhanced tile definitions with 115+ tiles
- Smart completions with drill time information
- Advanced validation
- Improved IntelliSense

## [0.1.0] - 2024-01-17

### Added
- Extended syntax highlighting
- Basic validation
- Code snippets
- Navigation features

## [0.0.1] - 2024-01-15

### Added
- Initial release
- Basic syntax highlighting for DAT files
- IntelliSense for `info` section fields
- Hover information provider
- Language configuration
- Comment support
- Auto-closing pairs