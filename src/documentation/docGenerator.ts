import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

/**
 * Documentation Generator
 * Automatically generates documentation from TypeScript source files
 */
export class DocGenerator {
  private program!: ts.Program;
  private checker!: ts.TypeChecker;
  private outputDir: string;
  private components: Map<string, ComponentDoc> = new Map();
  private apis: Map<string, APIDoc> = new Map();

  constructor(
    private readonly projectRoot: string,
    config: DocGeneratorConfig
  ) {
    this.outputDir = path.join(projectRoot, config.outputDir || 'docs');
    this.initializeTypeScript();
  }

  /**
   * Initialize TypeScript compiler
   */
  private initializeTypeScript(): void {
    const configPath = ts.findConfigFile(this.projectRoot, ts.sys.fileExists, 'tsconfig.json');

    if (!configPath) {
      throw new Error('Could not find tsconfig.json');
    }

    const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
    const { options, fileNames } = ts.parseJsonConfigFileContent(
      config,
      ts.sys,
      path.dirname(configPath)
    );

    this.program = ts.createProgram(fileNames, options);
    this.checker = this.program.getTypeChecker();
  }

  /**
   * Generate documentation for all components
   */
  public async generateDocs(): Promise<void> {
    // Create output directory
    await this.ensureDirectory(this.outputDir);

    // Scan source files
    for (const sourceFile of this.program.getSourceFiles()) {
      if (sourceFile.isDeclarationFile) {
        continue;
      }

      // Skip node_modules
      if (sourceFile.fileName.includes('node_modules')) {
        continue;
      }

      await this.processSourceFile(sourceFile);
    }

    // Generate documentation files
    await this.generateComponentDocs();
    await this.generateAPIDocs();
    await this.generateIndex();
    await this.generateExamples();

    vscode.window.showInformationMessage(`Documentation generated in ${this.outputDir}`);
  }

  /**
   * Process a source file
   */
  private async processSourceFile(sourceFile: ts.SourceFile): Promise<void> {
    const visit = (node: ts.Node) => {
      // Process classes
      if (ts.isClassDeclaration(node) && node.name) {
        const symbol = this.checker.getSymbolAtLocation(node.name);
        if (symbol) {
          this.processClass(symbol, node);
        }
      }

      // Process interfaces
      if (ts.isInterfaceDeclaration(node) && node.name) {
        const symbol = this.checker.getSymbolAtLocation(node.name);
        if (symbol) {
          this.processInterface(symbol, node);
        }
      }

      // Process functions
      if (ts.isFunctionDeclaration(node) && node.name) {
        const symbol = this.checker.getSymbolAtLocation(node.name);
        if (symbol) {
          this.processFunction(symbol, node);
        }
      }

      // Process exports
      if (ts.isExportDeclaration(node)) {
        this.processExport(node);
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  /**
   * Process a class declaration
   */
  private processClass(symbol: ts.Symbol, node: ts.ClassDeclaration): void {
    const className = symbol.getName();
    const doc: ComponentDoc = {
      name: className,
      type: 'class',
      description: this.getJSDocComment(symbol),
      methods: [],
      properties: [],
      events: [],
      examples: [],
      sourceFile: node.getSourceFile().fileName,
      extends: this.getExtends(node),
      implementsList: this.getImplements(node),
    };

    // Process members
    symbol.members?.forEach(member => {
      if (
        member.valueDeclaration &&
        (ts.isMethodSignature(member.valueDeclaration) ||
          ts.isMethodDeclaration(member.valueDeclaration))
      ) {
        doc.methods.push(this.processMethod(member));
      } else if (
        member.valueDeclaration &&
        (ts.isPropertySignature(member.valueDeclaration) ||
          ts.isPropertyDeclaration(member.valueDeclaration))
      ) {
        doc.properties.push(this.processProperty(member));
      }
    });

    // Look for event patterns
    doc.events = this.extractEvents(doc);

    // Extract examples from comments
    doc.examples = this.extractExamples(symbol);

    this.components.set(className, doc);
  }

  /**
   * Process a method
   */
  private processMethod(symbol: ts.Symbol): MethodDoc {
    const signature = this.checker.getSignatureFromDeclaration(
      symbol.valueDeclaration as ts.MethodDeclaration
    );

    return {
      name: symbol.getName(),
      description: this.getJSDocComment(symbol),
      parameters: signature ? this.getParameters(signature) : [],
      returns: signature ? this.getReturnType(signature) : 'void',
      modifiers: this.getModifiers(symbol),
      examples: this.extractExamples(symbol),
    };
  }

  /**
   * Process a property
   */
  private processProperty(symbol: ts.Symbol): PropertyDoc {
    const type = this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);

    return {
      name: symbol.getName(),
      description: this.getJSDocComment(symbol),
      type: this.checker.typeToString(type),
      modifiers: this.getModifiers(symbol),
      defaultValue: this.getDefaultValue(symbol),
    };
  }

  /**
   * Get JSDoc comment
   */
  private getJSDocComment(symbol: ts.Symbol): string {
    const jsDocs = symbol.getJsDocTags();
    const commentTag = jsDocs.find(tag => tag.name === 'description');

    if (commentTag && commentTag.text) {
      return commentTag.text.map(t => t.text).join('');
    }

    // Try to get comment from declaration
    const declaration = symbol.valueDeclaration;
    if (declaration) {
      const sourceFile = declaration.getSourceFile();
      const commentRanges = ts.getLeadingCommentRanges(sourceFile.text, declaration.pos);

      if (commentRanges && commentRanges.length > 0) {
        const comment = sourceFile.text.substring(commentRanges[0].pos, commentRanges[0].end);
        return this.parseJSDocComment(comment);
      }
    }

    return '';
  }

  /**
   * Parse JSDoc comment
   */
  private parseJSDocComment(comment: string): string {
    const lines = comment.split('\n');
    const cleanedLines = lines
      .map(line => line.replace(/^\s*\*\s?/, ''))
      .filter(line => !line.startsWith('@'));

    return cleanedLines.join('\n').trim();
  }

  /**
   * Extract examples from JSDoc
   */
  private extractExamples(symbol: ts.Symbol): Example[] {
    const examples: Example[] = [];
    const jsDocs = symbol.getJsDocTags();

    jsDocs.forEach(tag => {
      if (tag.name === 'example' && tag.text) {
        const exampleText = tag.text.map(t => t.text).join('');
        examples.push({
          title: 'Example',
          code: exampleText.trim(),
          language: 'typescript',
        });
      }
    });

    return examples;
  }

  /**
   * Generate component documentation
   */
  private async generateComponentDocs(): Promise<void> {
    const componentsDir = path.join(this.outputDir, 'components');
    await this.ensureDirectory(componentsDir);

    for (const [name, doc] of this.components) {
      const content = this.renderComponentDoc(doc);
      const outputPath = path.join(componentsDir, `${name}.md`);
      await fs.promises.writeFile(outputPath, content);
    }
  }

  /**
   * Render component documentation
   */
  private renderComponentDoc(doc: ComponentDoc): string {
    let content = `# ${doc.name}\n\n`;

    if (doc.description) {
      content += `${doc.description}\n\n`;
    }

    // Inheritance
    if (doc.extends || (doc.implementsList && doc.implementsList.length > 0)) {
      content += '## Inheritance\n\n';
      if (doc.extends) {
        content += `- Extends: \`${doc.extends}\`\n`;
      }
      if (doc.implementsList && doc.implementsList.length > 0) {
        content += `- Implements: ${doc.implementsList.map(i => `\`${i}\``).join(', ')}\n`;
      }
      content += '\n';
    }

    // Properties
    if (doc.properties.length > 0) {
      content += '## Properties\n\n';
      content += '| Name | Type | Description | Default |\n';
      content += '|------|------|-------------|---------|\\n';

      for (const prop of doc.properties) {
        content += `| \`${prop.name}\` | \`${prop.type}\` | ${prop.description} | ${prop.defaultValue || '-'} |\n`;
      }
      content += '\n';
    }

    // Methods
    if (doc.methods.length > 0) {
      content += '## Methods\n\n';

      for (const method of doc.methods) {
        content += `### \`${method.name}(${this.renderParameters(method.parameters)})\`\n\n`;

        if (method.description) {
          content += `${method.description}\n\n`;
        }

        if (method.parameters.length > 0) {
          content += '**Parameters:**\n\n';
          for (const param of method.parameters) {
            content += `- \`${param.name}\` (\`${param.type}\`): ${param.description}\n`;
          }
          content += '\n';
        }

        content += `**Returns:** \`${method.returns}\`\n\n`;

        if (method.examples.length > 0) {
          content += '**Examples:**\n\n';
          for (const example of method.examples) {
            content += '```' + example.language + '\n';
            content += example.code + '\n';
            content += '```\n\n';
          }
        }
      }
    }

    // Events
    if (doc.events.length > 0) {
      content += '## Events\n\n';

      for (const event of doc.events) {
        content += `### \`${event.name}\`\n\n`;

        if (event.description) {
          content += `${event.description}\n\n`;
        }

        content += `**Payload:** \`${event.payload}\`\n\n`;
      }
    }

    // Examples
    if (doc.examples.length > 0) {
      content += '## Examples\n\n';

      for (const example of doc.examples) {
        if (example.title) {
          content += `### ${example.title}\n\n`;
        }

        content += '```' + example.language + '\n';
        content += example.code + '\n';
        content += '```\n\n';
      }
    }

    return content;
  }

  /**
   * Render parameters
   */
  private renderParameters(params: ParameterDoc[]): string {
    return params
      .map(p => {
        let param = p.name;
        if (p.optional) {
          param += '?';
        }
        return param;
      })
      .join(', ');
  }

  /**
   * Generate index
   */
  private async generateIndex(): Promise<void> {
    let content = '# Manic Miners Documentation\n\n';

    content += '## Components\n\n';

    // Group components by type
    const classes = Array.from(this.components.values()).filter(c => c.type === 'class');
    const interfaces = Array.from(this.components.values()).filter(c => c.type === 'interface');

    if (classes.length > 0) {
      content += '### Classes\n\n';
      for (const cls of classes) {
        content += `- [${cls.name}](components/${cls.name}.md) - ${cls.description}\n`;
      }
      content += '\n';
    }

    if (interfaces.length > 0) {
      content += '### Interfaces\n\n';
      for (const iface of interfaces) {
        content += `- [${iface.name}](components/${iface.name}.md) - ${iface.description}\n`;
      }
      content += '\n';
    }

    content += '## API Reference\n\n';
    content += '- [Full API Documentation](api/index.md)\n\n';

    content += '## Examples\n\n';
    content += '- [Getting Started](examples/getting-started.md)\n';
    content += '- [Advanced Usage](examples/advanced.md)\n';
    content += '- [Plugin Development](examples/plugins.md)\n';

    const indexPath = path.join(this.outputDir, 'index.md');
    await fs.promises.writeFile(indexPath, content);
  }

  /**
   * Generate API documentation
   */
  private async generateAPIDocs(): Promise<void> {
    const apiDir = path.join(this.outputDir, 'api');
    await this.ensureDirectory(apiDir);

    // Generate API index
    let apiIndex = '# API Reference\n\n';

    // Group by module
    const modules = this.groupAPIsByModule();

    for (const [module, apis] of modules) {
      apiIndex += `## ${module}\n\n`;

      for (const api of apis) {
        apiIndex += `### ${api.name}\n\n`;
        apiIndex += `${api.description}\n\n`;

        if (api.signature) {
          apiIndex += '```typescript\n';
          apiIndex += api.signature + '\n';
          apiIndex += '```\n\n';
        }
      }
    }

    const apiIndexPath = path.join(apiDir, 'index.md');
    await fs.promises.writeFile(apiIndexPath, apiIndex);
  }

  /**
   * Generate examples
   */
  private async generateExamples(): Promise<void> {
    const examplesDir = path.join(this.outputDir, 'examples');
    await this.ensureDirectory(examplesDir);

    // Getting Started
    const gettingStarted = `# Getting Started

## Installation

\`\`\`bash
npm install manic-miners-vscode
\`\`\`

## Basic Usage

### Creating a Map Editor

\`\`\`typescript
import { UnifiedMapEditor } from 'manic-miners-vscode';

const editor = new UnifiedMapEditor(extensionUri);
await editor.initialize(webview);
await editor.loadMap('/path/to/map.dat');
\`\`\`

### Using the Event Bus

\`\`\`typescript
import { eventBus } from 'manic-miners-vscode';

// Subscribe to events
eventBus.on('workspace:mapLoaded', (data) => {
  console.log('Map loaded:', data.path);
});

// Emit events
eventBus.emit('workspace:toolChanged', {
  tool: 'brush',
  previousTool: 'pencil'
});
\`\`\`

### State Synchronization

\`\`\`typescript
import { stateSync } from 'manic-miners-vscode';

// Set state
stateSync.setState('selectedTile', 42, 'mapEditor');

// Get state
const selectedTile = stateSync.getState('selectedTile');

// Subscribe to changes
stateSync.subscribe('selectedTile', (value) => {
  console.log('Selected tile changed:', value);
});
\`\`\`
`;

    await fs.promises.writeFile(path.join(examplesDir, 'getting-started.md'), gettingStarted);

    // Advanced usage
    const advanced = `# Advanced Usage

## Custom Plugins

### Creating a Plugin

\`\`\`typescript
import { PluginManager } from 'manic-miners-vscode';

const myPlugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  main: './dist/plugin.js',
  permissions: ['filesystem', 'ui'],
  contributes: {
    commands: [
      {
        id: 'myPlugin.doSomething',
        title: 'Do Something',
        handler: 'doSomething'
      }
    ]
  }
};

// Register plugin
await pluginManager.registerPlugin(myPlugin, { type: 'local', path: './my-plugin' });
\`\`\`

### Custom Themes

\`\`\`typescript
import { themeManager } from 'manic-miners-vscode';

const customTheme = {
  id: 'my-theme',
  name: 'My Custom Theme',
  colors: {
    primary: '#007ACC',
    secondary: '#2C2C2C',
    background: '#1E1E1E',
    foreground: '#CCCCCC'
  },
  rules: [
    {
      selector: '.panel',
      styles: {
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)'
      }
    }
  ]
};

themeManager.registerTheme(customTheme);
themeManager.applyTheme('my-theme');
\`\`\`

### Performance Optimization

\`\`\`typescript
// Use progressive rendering for large maps
editor.enableProgressiveRendering({
  chunkSize: 100,
  delay: 16
});

// Enable worker threads
editor.useWorkers({
  maxWorkers: 4,
  tasks: ['pathfinding', 'validation']
});
\`\`\`
`;

    await fs.promises.writeFile(path.join(examplesDir, 'advanced.md'), advanced);
  }

  /**
   * Process interface declaration
   */
  private processInterface(symbol: ts.Symbol, node: ts.InterfaceDeclaration): void {
    const doc: ComponentDoc = {
      name: symbol.getName(),
      type: 'interface',
      description: this.getJSDocComment(symbol),
      methods: [],
      properties: [],
      events: [],
      examples: [],
      sourceFile: node.getSourceFile().fileName,
    };

    // Process members
    symbol.members?.forEach(member => {
      if (member.valueDeclaration && ts.isMethodSignature(member.valueDeclaration)) {
        doc.methods.push(this.processMethod(member));
      } else if (member.valueDeclaration && ts.isPropertySignature(member.valueDeclaration)) {
        doc.properties.push(this.processProperty(member));
      }
    });

    this.components.set(symbol.getName(), doc);
  }

  /**
   * Process function declaration
   */
  private processFunction(symbol: ts.Symbol, node: ts.FunctionDeclaration): void {
    const signature = this.checker.getSignatureFromDeclaration(node);

    if (signature) {
      const api: APIDoc = {
        name: symbol.getName(),
        description: this.getJSDocComment(symbol),
        signature: this.checker.signatureToString(signature),
        module: this.getModuleName(node.getSourceFile()),
        parameters: this.getParameters(signature),
        returns: this.getReturnType(signature),
        examples: this.extractExamples(symbol),
      };

      this.apis.set(symbol.getName(), api);
    }
  }

  /**
   * Process export declaration
   */
  private processExport(node: ts.ExportDeclaration): void {
    // Handle named exports
    if (node.exportClause && ts.isNamedExports(node.exportClause)) {
      node.exportClause.elements.forEach(element => {
        const symbol = this.checker.getSymbolAtLocation(element.name);
        if (symbol) {
          const aliasedSymbol = this.checker.getAliasedSymbol(symbol);
          // Mark as exported
          if (this.components.has(aliasedSymbol.getName())) {
            const doc = this.components.get(aliasedSymbol.getName())!;
            doc.exported = true;
          }
        }
      });
    }
  }

  /**
   * Get extends clause
   */
  private getExtends(node: ts.ClassDeclaration): string | undefined {
    if (node.heritageClauses) {
      for (const clause of node.heritageClauses) {
        if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
          return clause.types[0].getText();
        }
      }
    }
    return undefined;
  }

  /**
   * Get implements clause
   */
  private getImplements(node: ts.ClassDeclaration): string[] {
    const implementsList: string[] = [];

    if (node.heritageClauses) {
      for (const clause of node.heritageClauses) {
        if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
          clause.types.forEach(type => {
            implementsList.push(type.getText());
          });
        }
      }
    }

    return implementsList;
  }

  /**
   * Get parameters
   */
  private getParameters(signature: ts.Signature): ParameterDoc[] {
    return signature.getParameters().map(param => {
      const paramDeclaration = param.valueDeclaration as ts.ParameterDeclaration;
      const type = this.checker.getTypeOfSymbolAtLocation(param, paramDeclaration);

      return {
        name: param.getName(),
        type: this.checker.typeToString(type),
        description: this.getJSDocComment(param),
        optional: paramDeclaration ? paramDeclaration.questionToken !== undefined : false,
        defaultValue:
          paramDeclaration && paramDeclaration.initializer
            ? paramDeclaration.initializer.getText()
            : undefined,
      };
    });
  }

  /**
   * Get return type
   */
  private getReturnType(signature: ts.Signature): string {
    const returnType = signature.getReturnType();
    return this.checker.typeToString(returnType);
  }

  /**
   * Get modifiers
   */
  private getModifiers(symbol: ts.Symbol): string[] {
    const modifiers: string[] = [];

    // TypeScript SymbolFlags don't have these specific flags
    // We'll check modifiers differently
    const valueDeclaration = symbol.valueDeclaration;
    if (valueDeclaration && ts.canHaveModifiers(valueDeclaration)) {
      const modifierFlags = ts.getCombinedModifierFlags(valueDeclaration);
      if (modifierFlags & ts.ModifierFlags.Private) {
        modifiers.push('private');
      }
      if (modifierFlags & ts.ModifierFlags.Protected) {
        modifiers.push('protected');
      }
      if (modifierFlags & ts.ModifierFlags.Public) {
        modifiers.push('public');
      }
      if (modifierFlags & ts.ModifierFlags.Static) {
        modifiers.push('static');
      }
      if (modifierFlags & ts.ModifierFlags.Readonly) {
        modifiers.push('readonly');
      }
    }

    return modifiers;
  }

  /**
   * Get default value
   */
  private getDefaultValue(symbol: ts.Symbol): string | undefined {
    const declaration = symbol.valueDeclaration as ts.PropertyDeclaration;

    if (declaration && declaration.initializer) {
      return declaration.initializer.getText();
    }

    return undefined;
  }

  /**
   * Extract events
   */
  private extractEvents(doc: ComponentDoc): EventDoc[] {
    const events: EventDoc[] = [];

    // Look for event emitter patterns
    doc.methods.forEach(method => {
      if (method.name.startsWith('on') || method.name.startsWith('emit')) {
        const eventName = method.name.replace(/^(on|emit)/, '');
        const event: EventDoc = {
          name: eventName,
          description: method.description,
          payload: method.parameters[0]?.type || 'void',
        };
        events.push(event);
      }
    });

    return events;
  }

  /**
   * Get module name
   */
  private getModuleName(sourceFile: ts.SourceFile): string {
    const relativePath = path.relative(this.projectRoot, sourceFile.fileName);
    const parts = relativePath.split(path.sep);

    // Remove src prefix and file extension
    if (parts[0] === 'src') {
      parts.shift();
    }

    const fileName = parts[parts.length - 1];
    parts[parts.length - 1] = fileName.replace(/\.[^.]+$/, '');

    return parts.join('/');
  }

  /**
   * Group APIs by module
   */
  private groupAPIsByModule(): Map<string, APIDoc[]> {
    const groups = new Map<string, APIDoc[]>();

    this.apis.forEach(api => {
      const module = api.module || 'default';

      if (!groups.has(module)) {
        groups.set(module, []);
      }

      groups.get(module)!.push(api);
    });

    return groups;
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectory(dir: string): Promise<void> {
    try {
      await fs.promises.access(dir);
    } catch {
      await fs.promises.mkdir(dir, { recursive: true });
    }
  }
}

// Type definitions
export interface DocGeneratorConfig {
  outputDir?: string;
  include?: string[];
  exclude?: string[];
  theme?: string;
}

interface ComponentDoc {
  name: string;
  type: 'class' | 'interface' | 'enum';
  description: string;
  methods: MethodDoc[];
  properties: PropertyDoc[];
  events: EventDoc[];
  examples: Example[];
  sourceFile: string;
  extends?: string;
  implementsList?: string[];
  exported?: boolean;
}

interface MethodDoc {
  name: string;
  description: string;
  parameters: ParameterDoc[];
  returns: string;
  modifiers: string[];
  examples: Example[];
}

interface PropertyDoc {
  name: string;
  description: string;
  type: string;
  modifiers: string[];
  defaultValue?: string;
}

interface ParameterDoc {
  name: string;
  type: string;
  description: string;
  optional: boolean;
  defaultValue?: string;
}

interface EventDoc {
  name: string;
  description: string;
  payload: string;
}

interface Example {
  title?: string;
  code: string;
  language: string;
}

interface APIDoc {
  name: string;
  description: string;
  signature: string;
  module: string;
  parameters: ParameterDoc[];
  returns: string;
  examples: Example[];
}
