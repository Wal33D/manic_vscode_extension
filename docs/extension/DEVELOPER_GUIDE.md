# Manic Miners Extension Developer Guide

This guide covers development setup, architecture, and contribution guidelines for the Manic Miners VS Code extension.

## Table of Contents
1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Architecture Overview](#architecture-overview)
4. [Key Components](#key-components)
5. [Testing](#testing)
6. [Contributing](#contributing)
7. [Build & Deploy](#build--deploy)
8. [Code Standards](#code-standards)

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- VS Code (latest stable)
- Git

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/Wal33D/manic_vscode_extension.git
cd manic_vscode_extension

# Install dependencies
npm install

# Compile TypeScript
npm run compile
```

### Development Workflow
1. Open project in VS Code
2. Press `F5` to launch Extension Development Host
3. Open any `.dat` file to test
4. Make changes and reload with `Cmd/Ctrl+R`

### Available Scripts
```bash
npm run compile      # Compile TypeScript
npm run watch       # Watch mode for development
npm run lint        # Run ESLint
npm run format      # Format with Prettier
npm run test        # Run tests
npm run type-check  # Check TypeScript types
npm run package     # Create VSIX package
```

## Project Structure

```
manic_vscode_extension/
├── src/
│   ├── extension.ts              # Extension entry point
│   ├── parser/                   # DAT file parsing
│   │   ├── datFileParser.ts
│   │   └── parseHelpers.ts
│   ├── providers/                # VS Code providers
│   │   ├── completionItemProvider.ts
│   │   ├── hoverProvider.ts
│   │   ├── definitionProvider.ts
│   │   └── referenceProvider.ts
│   ├── mapPreview/              # Visual preview system
│   │   ├── mapPreviewProvider.ts
│   │   └── previewRenderer.ts
│   ├── validation/              # Map validation
│   │   ├── mapValidator.ts
│   │   ├── autoFixProvider.ts
│   │   └── validationCommands.ts
│   ├── heatmap/                 # Heat map analysis
│   │   ├── heatMapProvider.ts
│   │   ├── pathfindingAnalyzer.ts
│   │   └── heatMapRenderer.ts
│   ├── versionControl/          # Version management
│   │   ├── mapVersionControl.ts
│   │   └── diffProvider.ts
│   ├── accessibility/           # Accessibility features
│   │   ├── accessibilityManager.ts
│   │   └── screenReaderProvider.ts
│   └── test/                    # Unit tests
├── syntaxes/                    # TextMate grammars
├── snippets/                    # Code snippets
├── images/                      # Icons and assets
├── docs/                        # Documentation
└── package.json                 # Extension manifest
```

## Architecture Overview

### Core Systems

#### 1. Language Support
- **Parser**: Converts DAT files to AST
- **Providers**: IntelliSense, hover, navigation
- **Syntax**: TextMate grammar for highlighting

#### 2. Visual Systems
- **Map Preview**: Canvas-based rendering
- **Heat Maps**: Pathfinding visualization
- **Diff View**: Version comparison

#### 3. Validation & Fixes
- **Validator**: Multi-pass validation
- **Auto-fix**: CodeActionProvider for fixes
- **Diagnostics**: Real-time error reporting

#### 4. Data Management
- **Version Control**: Git-like versioning
- **Templates**: Reusable map patterns
- **Settings**: User preferences

### Key Design Patterns

#### Provider Pattern
All VS Code integration uses providers:
```typescript
class MapPreviewProvider implements vscode.WebviewViewProvider {
  public resolveWebviewView(webviewView: vscode.WebviewView) {
    // Implementation
  }
}
```

#### Command Pattern
Commands are registered in extension.ts:
```typescript
const command = vscode.commands.registerCommand('manicMiners.showMapPreview', () => {
  // Command implementation
});
context.subscriptions.push(command);
```

#### Observer Pattern
File changes and updates use event emitters:
```typescript
private _onDidChangeTreeData = new vscode.EventEmitter<MapVersion>();
readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
```

## Key Components

### DatFileParser
Parses DAT files into structured data:
```typescript
const parser = new DatFileParser(document.getText());
const tilesSection = parser.getSection('tiles');
const tiles = parser.parseTilesSection(tilesSection);
```

### MapValidator
Comprehensive validation with multiple passes:
```typescript
const validator = new MapValidator();
const results = await validator.validateDocument(document);
// results.errors, results.warnings, results.info
```

### PathfindingAnalyzer
A* pathfinding for accessibility checks:
```typescript
const analyzer = new PathfindingAnalyzer();
analyzer.initialize(document);
const path = analyzer.findPath(start, end);
```

### HeatMapRenderer
Generates visual heat maps:
```typescript
const heatMap = analyzer.generateTrafficHeatMap();
const renderData = HeatMapRenderer.generateHeatMapRenderData(heatMap, 'traffic');
```

## Testing

### Unit Tests
Located in `src/test/`:
```bash
npm run test           # Run all tests
npm run test -- --watch # Watch mode
npm run test -- path/to/test # Specific test
```

### Test Structure
```typescript
describe('ComponentName', () => {
  let component: ComponentType;
  
  beforeEach(() => {
    component = new ComponentType();
  });
  
  it('should do something', () => {
    const result = component.method();
    expect(result).toBe(expected);
  });
});
```

### Mocking VS Code API
Use the mock in `src/test/__mocks__/vscode.ts`:
```typescript
jest.mock('vscode', () => require('../__mocks__/vscode'));
```

## Contributing

### Git Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes and test
4. Commit with clear messages
5. Push and create PR

### Code Quality Checks
Before committing:
```bash
npm run type-check  # TypeScript validation
npm run lint        # ESLint checks
npm run format      # Prettier formatting
npm run test        # Unit tests
```

### Pull Request Guidelines
- Clear description of changes
- Reference any related issues
- Include tests for new features
- Update documentation
- Pass all CI checks

### Automated Workflow
Use the provided scripts:
```bash
./scripts/utils/claude-quick-pr.sh "Description of changes"
```

## Build & Deploy

### Creating VSIX Package
```bash
npm run package
# Creates manic-miners-dat-x.x.x.vsix
```

### Publishing
1. Update version in package.json
2. Update CHANGELOG.md
3. Create release tag
4. Run: `vsce publish`

### CI/CD Pipeline
GitHub Actions runs on every push:
- TypeScript compilation
- ESLint validation
- Unit tests
- Package creation

## Code Standards

### TypeScript
- Strict mode enabled
- No `any` types without justification
- Explicit return types for public methods
- Interfaces for data structures

### Naming Conventions
- PascalCase: Classes, interfaces, types
- camelCase: Variables, functions, methods
- UPPER_SNAKE_CASE: Constants
- kebab-case: File names

### File Organization
- One class/interface per file
- Group related functionality
- Export only what's needed
- Use index.ts for clean imports

### Documentation
- JSDoc for public APIs
- Inline comments for complex logic
- README for each major component
- Update docs with features

### Error Handling
```typescript
try {
  // Operation
} catch (error) {
  logger.error('Operation failed', error);
  // User-friendly message
  vscode.window.showErrorMessage('Could not complete operation');
}
```

### Performance
- Lazy load heavy components
- Cache expensive computations
- Debounce rapid events
- Profile with large files

## Debugging

### Extension Debugging
1. Set breakpoints in VS Code
2. Press F5 to launch
3. Use Debug Console
4. Check Extension Host logs

### Logging
```typescript
import { logger } from './utils/logger';

logger.info('Operation started');
logger.error('Error occurred', error);
```

### Common Issues
- **Extension not activating**: Check activationEvents in package.json
- **Commands not found**: Verify registration in extension.ts
- **Provider not working**: Check disposal and subscriptions

## Future Development

### Planned Features
See the todo list in active development:
- Tile statistics panel
- Map diff tool
- Minimap navigation
- Performance profiler
- Tutorial mode

### Architecture Improvements
- Migrate to VS Code's notebook API
- Implement LSP for better performance
- Add telemetry for usage insights
- Create extension API for plugins

## Resources

### Documentation
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

### Tools
- [vsce](https://github.com/microsoft/vscode-vsce) - Publishing tool
- [yo code](https://github.com/Microsoft/vscode-generator-code) - Extension generator
- [Extension Test Runner](https://github.com/microsoft/vscode-extension-test-runner)

### Community
- [VS Code Discord](https://aka.ms/vscode-discord)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/vscode-extensions)
- [GitHub Discussions](https://github.com/microsoft/vscode-discussions)