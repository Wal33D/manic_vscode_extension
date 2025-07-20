# Manic Miner DAT File Support for Visual Studio Code

[![Version](https://img.shields.io/visual-studio-marketplace/v/manic-miners.dat)](https://marketplace.visualstudio.com/items?itemName=manic-miners.dat)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/manic-miners.dat)](https://marketplace.visualstudio.com/items?itemName=manic-miners.dat)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/manic-miners.dat)](https://marketplace.visualstudio.com/items?itemName=manic-miners.dat)

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

### 🔧 Language Configuration
- Comment support (line `//` and block `/* */`)
- Auto-closing pairs for brackets and quotes
- Smart indentation

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Press `Ctrl+P` / `Cmd+P` to open the Quick Open dialog
3. Type `ext install manic-miners.dat`
4. Click Install

### From VSIX Package
1. Download the `.vsix` file from [Releases](https://github.com/yourusername/manic_vscode_extension/releases)
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

- IntelliSense currently only works within `info` blocks
- Additional sections will receive enhanced support in future versions

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

### 0.0.1

Initial release featuring:
- Basic syntax highlighting for DAT files
- IntelliSense for `info` section fields
- Hover information provider
- Language configuration

## Roadmap

- [ ] Extend IntelliSense to all sections
- [ ] Add validation and diagnostics
- [ ] Implement code snippets
- [ ] Add level preview functionality
- [ ] Support for go-to-definition
- [ ] Auto-formatting support

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the Manic Miners community for inspiration
- Built with the [VS Code Extension API](https://code.visualstudio.com/api)

---

**Enjoy editing your Manic Miner levels!** 🎮⛏️