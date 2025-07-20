# Manic Miner DAT File Support for Visual Studio Code

[![CI](https://github.com/Wal33D/vscode-manic-miners/actions/workflows/ci.yml/badge.svg)](https://github.com/Wal33D/vscode-manic-miners/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/visual-studio-marketplace/v/Wal33D.manic-miners-dat)](https://marketplace.visualstudio.com/items?itemName=Wal33D.manic-miners-dat)

A comprehensive Visual Studio Code extension providing language support for Manic Miner `.dat` level files. Edit game levels with full syntax highlighting, IntelliSense, and helpful tooltips.

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
- Zoom controls and tile information on hover
- Click tiles to jump to their location in the editor
- **NEW**: Multi-tile selection with Shift+drag
- **NEW**: Toggle grid lines and tile IDs
- **NEW**: Keyboard shortcuts for all controls
- **NEW**: Performance optimizations for large maps

### ⚡ Quick Actions
- Convert tiles between normal and reinforced variants
- Replace tiles with common types
- Fill areas and replace all instances of a tile type
- Context-sensitive actions in the tiles section
- **NEW**: Custom tile sets for frequently used combinations
- **NEW**: Save and reuse your favorite tile patterns

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup
1. Clone the repository
2. Run `npm install`
3. Open in VS Code
4. Press `F5` to run the extension in a new VS Code window

See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## Known Issues

- Large maps (200x200+) may experience slight performance lag in preview
- Some advanced script commands may not have full IntelliSense support

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

### 0.3.0 - Phase 3 Complete

Major feature release:
- **Visual Map Preview** with zoom, multi-selection, and keyboard controls
- **Objective Builder** interface for creating level objectives
- **Map Validation** with pathfinding analysis and auto-fix
- **Quick Actions** for tile manipulation and custom tile sets
- **Map Templates** system with custom template support
- Enhanced IntelliSense for all sections
- Go-to-definition and find references
- Real-time diagnostics
- Performance optimizations

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

- [x] Extend IntelliSense to all sections
- [x] Add validation and diagnostics
- [x] Implement code snippets
- [x] Add level preview functionality
- [x] Support for go-to-definition
- [ ] Auto-formatting support
- [ ] Map export functionality
- [ ] Collaborative editing support
- [ ] AI-powered map generation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the Manic Miners community for inspiration
- Built with the [VS Code Extension API](https://code.visualstudio.com/api)

---

**Enjoy editing your Manic Miner levels!** 🎮⛏️