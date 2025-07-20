# Manic Miner DAT File Support for Visual Studio Code

[![CI](https://github.com/Wal33D/vscode-manic-miners/actions/workflows/ci.yml/badge.svg)](https://github.com/Wal33D/vscode-manic-miners/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/visual-studio-marketplace/v/Wal33D.manic-miners-dat)](https://marketplace.visualstudio.com/items?itemName=Wal33D.manic-miners-dat)

A comprehensive Visual Studio Code extension providing full language support, visual editing tools, and advanced analysis for Manic Miner `.dat` level files. Create, edit, and optimize game levels with professional development tools.

![Manic Miner DAT File Extension Demo](images/demo.gif)

## Features

### 🎨 Syntax Highlighting
Full syntax highlighting for all DAT file sections including:
- `info` - Level metadata and configuration
- `tiles` - Tile layout data
- `height` - Height map information
- `resources` - Crystal and ore placement
- `objectives` - Level goals
- `buildings` - Pre-placed structures
- `script` - Level scripting
- And more!

### 💡 IntelliSense Support
- **Auto-completion** for field names within the `info` section
- Context-aware suggestions for faster editing
- Reduces typos and improves productivity

### 📖 Hover Information
- Detailed descriptions for all `info` section fields
- Explains what each field controls
- Special support for camera position components

### 🗺️ Visual Map Preview
- Real-time visual representation of your level
- Zoom controls (25% to 400%) and tile information on hover
- Click tiles to jump to their location in the editor
- Multi-tile selection with Shift+drag
- Toggle grid lines and tile IDs
- Full keyboard navigation and shortcuts
- Performance optimized for large maps

### ⚡ Quick Actions
- Convert tiles between normal and reinforced variants
- Replace tiles with common types
- Fill areas and replace all instances of a tile type
- Context-sensitive actions in the tiles section
- Custom tile sets for frequently used combinations
- Save and reuse your favorite tile patterns
- Smart tile suggestions based on surrounding context

### 🎯 Objective Builder
- Visual interface for creating level objectives
- Support for all objective types (resources, buildings, discovery, etc.)
- Real-time preview of objective syntax
- Parameter validation and helpful examples
- Analyze existing objectives with detailed reports
- Convert between objective formats easily

### 🔍 Map Validation
- Advanced pathfinding analysis
- Resource accessibility checks
- Objective validation
- Real-time diagnostics with inline errors and warnings
- Auto-fix support for common issues
- Comprehensive validation reports

### 📝 Map Templates
- Pre-built templates for common level patterns
- Create custom templates from selection
- Manage and organize your template library
- Quick insertion with customizable parameters

### 🔄 Undo/Redo System
- Sophisticated undo/redo for map operations
- Visual preview before applying changes
- History tracking (50 operations per file)
- Survives file saves
- Status bar integration

### 📊 Heat Map Analysis
- Visualize pathfinding and traffic patterns
- Identify bottlenecks and optimize routes
- Multiple analysis modes (traffic, accessibility, chokepoints)
- Statistical insights and hotspot detection

### 🔒 Version Control
- Track map changes over time
- Visual diff between versions
- Restore previous versions
- Git-like versioning system
- Commit messages and history

### ♿ Accessibility Features
- Full screen reader support
- High contrast mode
- Keyboard-only navigation
- ARIA labels for all UI elements
- Accessible map descriptions

### 🔧 Language Configuration
- Comment support (line `//` and block `/* */`)
- Auto-closing pairs for brackets and quotes
- Smart indentation
- Go-to-definition for references
- Find all references for entities

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Press `Ctrl+P` / `Cmd+P` to open the Quick Open dialog
3. Type `ext install manic-miners.dat`
4. Click Install

### From VSIX Package
1. Download the `.vsix` file from [Releases](https://github.com/Wal33D/vscode-manic-miners/releases)
2. Open VS Code
3. Press `Ctrl+Shift+P` / `Cmd+Shift+P`
4. Type "Install from VSIX" and select the command
5. Choose the downloaded `.vsix` file

## Usage

### Basic Usage
1. Open any `.dat` file in VS Code
2. The extension automatically activates for Manic Miner level files
3. Start typing in an `info` block to see auto-completion
4. Hover over field names to see descriptions

### Example
```dat
info{
    rowcount: 25        // Hover to see: "Number of rows in the map"
    colcount: 25        // Hover to see: "Number of columns in the map"
    biome: rock         // Hover to see: "The biome type of the map"
    // Type here to see auto-completion suggestions
}
```

## Supported Fields

The extension currently provides IntelliSense for these `info` section fields:

| Field | Description |
|-------|-------------|
| `rowcount` / `colcount` | Map dimensions |
| `camerapos` | Camera position with Translation, Rotation, and Scale |
| `biome` | Map biome type (rock, ice, lava) |
| `creator` | Level creator name |
| `levelname` | Name of the level |
| `oxygen` | Oxygen levels |
| `gravity` | Gravity setting |
| And many more... |

## Configuration

This extension works out of the box with no configuration required. Future versions may add customizable settings.

## Documentation

- 📖 [User Guide](docs/USER_GUIDE.md) - Comprehensive guide to all features
- 🛠️ [Developer Guide](docs/DEVELOPER_GUIDE.md) - Setup and contribution guidelines
- 📄 [DAT Format Reference](docs/DAT_FORMAT.md) - Complete file format specification
- 🎮 [Tile Reference](docs/reference/TILE_REFERENCE.md) - All tile IDs and properties

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup
1. Clone the repository
2. Run `npm install`
3. Open in VS Code
4. Press `F5` to run the extension in a new VS Code window

See the [Developer Guide](docs/DEVELOPER_GUIDE.md) for detailed instructions.

## Known Issues

- Large maps (200x200+) may experience slight performance lag in preview
- Some advanced script commands may not have full IntelliSense support

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

### Latest Release

Major features include:
- **Visual Map Preview** with zoom, multi-selection, and keyboard controls
- **Heat Map Analysis** for pathfinding and traffic visualization
- **Version Control** with visual diff and history tracking
- **Accessibility Features** including screen reader and high contrast support
- **Smart Tile Suggestions** based on context analysis
- **Undo/Redo System** with visual preview
- **Objective Builder** interface for creating level objectives
- **Map Validation** with pathfinding analysis and auto-fix
- **Quick Actions** for tile manipulation and custom tile sets
- **Map Templates** system with custom template support

### 0.2.5

- Enhanced test coverage
- Fixed TypeScript and ESLint errors
- Added game asset images
- Improved Phase 2 functionality

### 0.0.1

Initial release featuring:
- Basic syntax highlighting for DAT files
- IntelliSense for `info` section fields
- Hover information provider
- Language configuration

## Roadmap

### Completed ✅
- Extend IntelliSense to all sections
- Add validation and diagnostics
- Implement code snippets
- Add level preview functionality
- Support for go-to-definition
- Heat map visualization
- Version control integration
- Accessibility features
- Smart tile suggestions
- Undo/redo with preview

### In Development 🚧
- Tile statistics panel
- Map diff tool improvements
- Minimap navigation
- Performance profiler

### Future Plans 📋
- Auto-formatting support
- Map export to image/PDF
- Collaborative editing
- AI-powered map generation
- Tutorial mode

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the Manic Miners community for inspiration
- Built with the [VS Code Extension API](https://code.visualstudio.com/api)

---

**Enjoy editing your Manic Miner levels!** 🎮⛏️