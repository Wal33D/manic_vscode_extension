# Development Guide

## Setting Up Development Environment

### Prerequisites
- Node.js 18.x or higher
- VSCode 1.89.0 or higher
- Git

### Installation Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/Wal33D/vscode-manic-miners.git
   cd vscode-manic-miners
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Open in VSCode:
   ```bash
   code .
   ```

## Development Workflow

### Running the Extension
1. Press `F5` to launch a new VSCode window with the extension
2. Open any `.dat` file to test features
3. Use `Ctrl+R` to reload the window after making changes

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/path/to/test.ts

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Code Quality Checks
```bash
# TypeScript type checking
npm run type-check

# ESLint
npm run lint
npm run lint:fix

# Prettier formatting
npm run format
npm run format:check
```

## Quick PR Workflow

We use automated scripts for efficient PR creation:

### One-Command PR
```bash
./scripts/utils/claude-quick-pr.sh "Your commit message"
```

This automatically:
1. Runs type checking
2. Runs linting
3. Formats code
4. Creates a feature branch
5. Commits changes
6. Creates PR
7. Waits for CI tests
8. Merges on success

### Manual Workflow
If you prefer manual control:
```bash
# 1. Check your code
npm run type-check
npm run lint
npm run format

# 2. Create branch
git checkout -b feature-name

# 3. Commit
git add -A
git commit -m "Description"

# 4. Push and create PR
git push -u origin feature-name
gh pr create --title "Title" --body "Description"
```

## Code Architecture

### Directory Structure
```
src/
├── core/                 # Core language features
│   ├── completionItemProvider.ts
│   ├── hoverProvider.ts
│   ├── definitionProvider.ts
│   └── referenceProvider.ts
├── validation/          # Validation system
│   ├── mapValidator.ts
│   ├── datFileValidator.ts
│   └── diagnosticProvider.ts
├── ui/                  # UI components
│   ├── mapPreview/
│   ├── objectiveBuilder/
│   └── mapTemplates/
├── actions/             # Quick actions
│   └── quickActionsProvider.ts
├── undoRedo/           # Undo/redo system
├── data/               # Static data
│   ├── tileDefinitions.ts
│   └── enhancedTileDefinitions.ts
├── parser/             # File parsing
└── test/               # Test utilities

package.json            # Extension manifest
syntaxes/              # TextMate grammars
snippets/              # Code snippets
```

### Key Components

#### Providers
All VSCode integration uses the provider pattern:
```typescript
export class MyProvider implements vscode.SomeProvider {
  provideX(document: vscode.TextDocument, position: vscode.Position) {
    // Implementation
  }
}
```

#### Tile System
Three-tier tile definition system:
1. Basic tiles (1-65) in `tileDefinitions.ts`
2. Enhanced tiles (66-115) in `enhancedTileDefinitions.ts`
3. Extended tiles (116-299) in `extendedTileDefinitions.ts`

#### Validation System
- `MapValidator`: High-level validation orchestrator
- `DatFileValidator`: Syntax and structure validation
- `DiagnosticProvider`: VSCode diagnostic integration

## Testing Guidelines

### Unit Tests
- Test individual functions and classes
- Mock VSCode APIs using `src/test/__mocks__/vscode.ts`
- Aim for 80%+ coverage

### Integration Tests
- Test feature workflows end-to-end
- Use real .dat file samples
- Verify user-facing behavior

### Test Structure
```typescript
describe('ComponentName', () => {
  let component: ComponentType;
  
  beforeEach(() => {
    // Setup
  });
  
  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = createInput();
      
      // Act
      const result = component.method(input);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

## Contributing Guidelines

### Code Style
- Use TypeScript strict mode
- Follow ESLint rules (no warnings allowed)
- Use Prettier for formatting
- Prefer explicit types over inference

### Commit Messages
Format: `<type>: <description>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

### Pull Requests
1. Create from feature branch
2. Include clear description
3. Reference any related issues
4. Ensure all tests pass
5. Update documentation if needed

### Code Review Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Follows project conventions
- [ ] Performance considered

## Debugging

### Extension Debugging
1. Set breakpoints in VSCode
2. Launch with F5
3. Use Debug Console for output
4. Check Extension Host output

### Common Issues

#### Extension Not Activating
- Check `activationEvents` in package.json
- Verify file associations
- Check console for errors

#### IntelliSense Not Working
- Ensure language ID matches
- Check provider registration
- Verify document selectors

#### Tests Failing
- Update mocks if VSCode API changed
- Check for timing issues
- Verify test isolation

## Performance Considerations

### Best Practices
1. Lazy load heavy modules
2. Cache expensive computations
3. Use debouncing for real-time features
4. Dispose resources properly

### Profiling
```typescript
console.time('operation');
// Code to profile
console.timeEnd('operation');
```

## Release Process

### Version Bump
```bash
# Patch release (0.0.x)
npm version patch

# Minor release (0.x.0)
npm version minor

# Major release (x.0.0)
npm version major
```

### Publishing
```bash
# Package extension
npm run package

# Publish to marketplace
npm run publish
```

## Resources

### Documentation
- [VSCode Extension API](https://code.visualstudio.com/api)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)

### Tools
- [VSCode Extension Generator](https://github.com/Microsoft/vscode-generator-code)
- [TextMate Grammar Tester](https://rubular.com/)
- [VSCode Webview UI Toolkit](https://github.com/microsoft/vscode-webview-ui-toolkit)