# Manic Miners VSCode Extension Documentation

Welcome to the comprehensive documentation for the Manic Miners VSCode Extension. This documentation combines extension-specific guides, game format references, and technical implementation details.

## 📚 Documentation Sections

### 🎮 Extension Documentation
Guides for using and developing the VSCode extension.
- [User Guide](extension/USER_GUIDE.md) - How to use the extension
- [Developer Guide](extension/DEVELOPER_GUIDE.md) - Contributing to the extension
- [Development History](extension/DEVELOPMENT_PHASES.md) - Project development phases
- [Future Plans](extension/IMPROVEMENT_PLAN.md) - Roadmap and improvement ideas

### 🎯 Game Reference
Comprehensive documentation about the Manic Miners game format and scripting language.
- [Game Reference Overview](game-reference/README.md) - Attribution and navigation
- [DAT File Format](DAT_FORMAT.md) - Complete format specification
- [Advanced Scripting](ADVANCED_SCRIPTING.md) - In-depth scripting guide
- [Web Documentation](web-docs/index.html) - Browse the full game documentation

### 🔧 Technical Reference
Implementation details, algorithms, and code examples.
- [Technical Overview](technical-reference/README.md) - Reference implementations
- [Common Patterns](technical-reference/common-patterns.md) - Patterns and gotchas
- [Algorithm Documentation](technical-reference/algorithms/) - Generation algorithms

### ⚡ Quick Reference
Fast access to commonly needed information.
- [Tile ID Reference](game-reference/format/tile-reference.md) - All tile IDs (1-165)
- [Script Commands](quick-reference/script-commands.md) - Command syntax reference
- [Common Recipes](quick-reference/common-recipes.md) - Solutions to common tasks

## 🗺️ Documentation Map

```
┌──────────────────────────────────────────────────────────┐
│                  Extension User                          │
│                        ↓                                 │
│              [Extension User Guide]                      │
│                   ↓         ↓                           │
│        [Quick Reference]  [Game Reference]              │
│              ↓                    ↓                     │
│    [Technical Reference]  [Web Documentation]           │
│              ↓                                          │
│        [Developer Guide]                                │
└──────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### For Extension Users
1. Start with the [User Guide](extension/USER_GUIDE.md)
2. Reference the [Tile IDs](game-reference/format/tile-reference.md) while editing
3. Learn scripting with [Advanced Scripting](ADVANCED_SCRIPTING.md)

### For Level Designers
1. Understand the [DAT File Format](DAT_FORMAT.md)
2. Browse [Web Documentation](web-docs/index.html) for detailed specs
3. Check [Common Patterns](technical-reference/common-patterns.md) for best practices

### For Developers
1. Read the [Developer Guide](extension/DEVELOPER_GUIDE.md)
2. Study [Technical Reference](technical-reference/README.md) for implementation details
3. Review code examples in the reference implementations

## 📋 Documentation Plan

For details on the documentation organization and integration process, see the [Documentation Integration Plan](DOCUMENTATION_INTEGRATION_PLAN.md).

## 🤝 Contributing

Contributions to the documentation are welcome! Please:
1. Follow the existing structure and formatting
2. Maintain attribution for community-sourced content
3. Update cross-references when adding new content
4. Test all code examples before submitting

## 📄 License and Attribution

- Extension documentation is part of the VSCode extension project
- Game reference documentation is from [ManicMiners/docs](https://github.com/ManicMiners/docs)
- See individual sections for specific attribution

## 🔗 Quick Links

- [User Guide](extension/USER_GUIDE.md) - Get started with the extension
- [DAT Format Reference](game-reference/format/overview.md) - Complete format specification
- [Scripting Guide](game-reference/scripting/overview.md) - Learn Manic Miners scripting
- [Technical Reference](technical-reference/README.md) - Implementation details
- [Quick Reference](quick-reference/cheat-sheet.md) - Quick lookup guides
- [Code Examples](technical-reference/code-examples/README.md) - Practical implementations

## 🗂️ Cross-Reference Index

### By Topic

#### Map Creation
- **Concepts**: [Cave Generation](technical-reference/algorithms/cave-generation.md) → [Terrain Generation](technical-reference/algorithms/terrain-generation.md) → [Resource Placement](technical-reference/algorithms/resource-placement.md)
- **Examples**: [Simple Cave](technical-reference/code-examples/generation/simple-cave.ts) → [Biome-Specific](technical-reference/code-examples/generation/biome-specific.ts) → [Resource Placement](technical-reference/code-examples/generation/resource-placement.ts)
- **Reference**: [Tiles Section](game-reference/format/sections/tiles.md) → [Height Section](game-reference/format/sections/height.md)

#### Map Parsing
- **Concepts**: [Format Overview](game-reference/format/overview.md) → [Parsing Patterns](technical-reference/parsing-patterns.md)
- **Examples**: [Basic Parser](technical-reference/code-examples/parsing/basic-parser.ts) → [Stream Parser](technical-reference/code-examples/parsing/stream-parser.ts) → [Validation](technical-reference/code-examples/parsing/validation.ts)
- **Tools**: [Grid Operations](technical-reference/code-examples/utilities/grid-operations.ts) → [Analysis](technical-reference/code-examples/utilities/analysis.ts)

#### Scripting
- **Reference**: [Script Section](game-reference/format/sections/script.md) → [Scripting Overview](game-reference/scripting/overview.md)
- **Syntax**: [Variables](game-reference/scripting/syntax/variables.md) → [Events](game-reference/scripting/syntax/events.md) → [Triggers](game-reference/scripting/syntax/triggers.md)
- **Examples**: [Basic Triggers](technical-reference/code-examples/scripting/basic-triggers.dat) → [Event Chains](technical-reference/code-examples/scripting/event-chains.dat) → [Advanced Logic](technical-reference/code-examples/scripting/advanced-logic.dat)

#### Visualization
- **Concepts**: [Visualization Techniques](technical-reference/visualization-techniques.md) → [Performance Guide](technical-reference/performance.md)
- **Examples**: [PNG Renderer](technical-reference/code-examples/visualization/png-renderer.ts) → [Thumbnails](technical-reference/code-examples/visualization/thumbnail.ts) → [Heat Maps](technical-reference/code-examples/visualization/heat-map.ts)

#### Game Objects
- **Buildings**: [Format](game-reference/format/sections/buildings.md) → [Script Class](game-reference/scripting/classes/buildings.md)
- **Creatures**: [Format](game-reference/format/sections/creatures.md) → [Script Class](game-reference/scripting/classes/creatures.md)
- **Vehicles**: [Format](game-reference/format/sections/vehicles.md) → [Script Class](game-reference/scripting/classes/vehicles.md)

### By Skill Level

#### Beginner
1. [User Guide](extension/USER_GUIDE.md)
2. [Cheat Sheet](quick-reference/cheat-sheet.md)
3. [Tile IDs](quick-reference/tile-ids.md)
4. [Basic Triggers Example](technical-reference/code-examples/scripting/basic-triggers.dat)

#### Intermediate
1. [DAT Format Overview](game-reference/format/overview.md)
2. [Scripting Overview](game-reference/scripting/overview.md)
3. [Common Patterns](technical-reference/common-patterns.md)
4. [Simple Cave Generation](technical-reference/code-examples/generation/simple-cave.ts)

#### Advanced
1. [Parsing Patterns](technical-reference/parsing-patterns.md)
2. [Advanced Logic Example](technical-reference/code-examples/scripting/advanced-logic.dat)
3. [Pathfinding Algorithms](technical-reference/algorithms/pathfinding.md)
4. [Map Analysis Tools](technical-reference/code-examples/utilities/analysis.ts)

## Additional Resources
- 📝 [Main README](../README.md) - Extension overview
- 📜 [Changelog](../CHANGELOG.md) - Version history
- 🚀 [Workflow Guide](../CLAUDE.md) - Development workflow automation