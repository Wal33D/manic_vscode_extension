import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

/**
 * Standalone Documentation Generator
 * Generates documentation from TypeScript source files without VS Code dependencies
 */
class StandaloneDocGenerator {
  private program!: ts.Program;
  private checker!: ts.TypeChecker;
  private outputDir: string;
  private components: Map<string, ComponentDoc> = new Map();
  private apis: Map<string, APIDoc> = new Map();

  constructor(
    private readonly projectRoot: string,
    config: { outputDir?: string; exclude?: string[] }
  ) {
    this.outputDir = path.join(projectRoot, config.outputDir || 'docs');
    this.initializeTypeScript();
  }

  private initializeTypeScript(): void {
    const configPath = ts.findConfigFile(
      this.projectRoot,
      ts.sys.fileExists,
      'tsconfig.json'
    );

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

  public async generateDocs(): Promise<void> {
    await this.ensureDirectory(this.outputDir);

    // Process source files
    for (const sourceFile of this.program.getSourceFiles()) {
      if (sourceFile.isDeclarationFile) {continue;}
      if (sourceFile.fileName.includes('node_modules')) {continue;}
      
      await this.processSourceFile(sourceFile);
    }

    // Generate documentation files
    await this.generateComponentDocs();
    await this.generateAPIDocs();
    await this.generateIndex();
    
    console.log(`Documentation generated in ${this.outputDir}`);
  }

  private async processSourceFile(sourceFile: ts.SourceFile): Promise<void> {
    const visit = (node: ts.Node) => {
      if (ts.isClassDeclaration(node) && node.name) {
        const symbol = this.checker.getSymbolAtLocation(node.name);
        if (symbol) {
          this.processClass(symbol, node);
        }
      }

      if (ts.isInterfaceDeclaration(node) && node.name) {
        const symbol = this.checker.getSymbolAtLocation(node.name);
        if (symbol) {
          this.processInterface(symbol, node);
        }
      }

      if (ts.isFunctionDeclaration(node) && node.name) {
        const symbol = this.checker.getSymbolAtLocation(node.name);
        if (symbol) {
          this.processFunction(symbol, node);
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  private processClass(symbol: ts.Symbol, node: ts.ClassDeclaration): void {
    const className = symbol.getName();
    const doc: ComponentDoc = {
      name: className,
      type: 'class',
      description: this.getJSDocComment(symbol),
      methods: [],
      properties: [],
      sourceFile: node.getSourceFile().fileName,
      extends: this.getExtends(node),
      implements: this.getImplements(node),
    };

    // Process members
    symbol.members?.forEach((member) => {
      if (member.valueDeclaration && (ts.isMethodSignature(member.valueDeclaration) || 
          ts.isMethodDeclaration(member.valueDeclaration))) {
        doc.methods.push(this.processMethod(member));
      } else if (member.valueDeclaration && (ts.isPropertySignature(member.valueDeclaration) ||
                 ts.isPropertyDeclaration(member.valueDeclaration))) {
        doc.properties.push(this.processProperty(member));
      }
    });

    this.components.set(className, doc);
  }

  private processInterface(symbol: ts.Symbol, node: ts.InterfaceDeclaration): void {
    const doc: ComponentDoc = {
      name: symbol.getName(),
      type: 'interface',
      description: this.getJSDocComment(symbol),
      methods: [],
      properties: [],
      sourceFile: node.getSourceFile().fileName,
    };

    symbol.members?.forEach((member) => {
      if (member.valueDeclaration && ts.isMethodSignature(member.valueDeclaration)) {
        doc.methods.push(this.processMethod(member));
      } else if (member.valueDeclaration && ts.isPropertySignature(member.valueDeclaration)) {
        doc.properties.push(this.processProperty(member));
      }
    });

    this.components.set(symbol.getName(), doc);
  }

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
      };

      this.apis.set(symbol.getName(), api);
    }
  }

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
    };
  }

  private processProperty(symbol: ts.Symbol): PropertyDoc {
    const type = this.checker.getTypeOfSymbolAtLocation(
      symbol,
      symbol.valueDeclaration!
    );

    return {
      name: symbol.getName(),
      description: this.getJSDocComment(symbol),
      type: this.checker.typeToString(type),
      modifiers: this.getModifiers(symbol),
    };
  }

  private getJSDocComment(symbol: ts.Symbol): string {
    const jsDocs = symbol.getJsDocTags();
    const commentTag = jsDocs.find(tag => tag.name === 'description');
    
    if (commentTag && commentTag.text) {
      return commentTag.text.map(t => t.text).join('');
    }

    return '';
  }

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

  private getParameters(signature: ts.Signature): ParameterDoc[] {
    return signature.getParameters().map(param => {
      const paramDeclaration = param.valueDeclaration as ts.ParameterDeclaration;
      const type = this.checker.getTypeOfSymbolAtLocation(param, paramDeclaration);
      
      return {
        name: param.getName(),
        type: this.checker.typeToString(type),
        description: this.getJSDocComment(param),
        optional: paramDeclaration ? paramDeclaration.questionToken !== undefined : false,
      };
    });
  }

  private getReturnType(signature: ts.Signature): string {
    const returnType = signature.getReturnType();
    return this.checker.typeToString(returnType);
  }

  private getModifiers(symbol: ts.Symbol): string[] {
    const modifiers: string[] = [];
    const valueDeclaration = symbol.valueDeclaration;
    
    if (valueDeclaration && ts.canHaveModifiers(valueDeclaration)) {
      const modifierFlags = ts.getCombinedModifierFlags(valueDeclaration);
      if (modifierFlags & ts.ModifierFlags.Private) {modifiers.push('private');}
      if (modifierFlags & ts.ModifierFlags.Protected) {modifiers.push('protected');}
      if (modifierFlags & ts.ModifierFlags.Public) {modifiers.push('public');}
      if (modifierFlags & ts.ModifierFlags.Static) {modifiers.push('static');}
      if (modifierFlags & ts.ModifierFlags.Readonly) {modifiers.push('readonly');}
    }
    
    return modifiers;
  }

  private getModuleName(sourceFile: ts.SourceFile): string {
    const relativePath = path.relative(this.projectRoot, sourceFile.fileName);
    const parts = relativePath.split(path.sep);
    
    if (parts[0] === 'src') {
      parts.shift();
    }
    
    const fileName = parts[parts.length - 1];
    parts[parts.length - 1] = fileName.replace(/\.[^.]+$/, '');
    
    return parts.join('/');
  }

  private async generateComponentDocs(): Promise<void> {
    const componentsDir = path.join(this.outputDir, 'components');
    await this.ensureDirectory(componentsDir);

    for (const [name, doc] of this.components) {
      const content = this.renderComponentDoc(doc);
      const outputPath = path.join(componentsDir, `${name}.md`);
      await fs.promises.writeFile(outputPath, content);
    }
  }

  private renderComponentDoc(doc: ComponentDoc): string {
    let content = `# ${doc.name}\n\n`;
    
    if (doc.description) {
      content += `${doc.description}\n\n`;
    }

    // Inheritance
    if (doc.extends || (doc.implements && doc.implements.length > 0)) {
      content += '## Inheritance\n\n';
      if (doc.extends) {
        content += `- Extends: \`${doc.extends}\`\n`;
      }
      if (doc.implements && doc.implements.length > 0) {
        content += `- Implements: ${doc.implements.map(i => `\`${i}\``).join(', ')}\n`;
      }
      content += '\n';
    }

    // Properties
    if (doc.properties.length > 0) {
      content += '## Properties\n\n';
      content += '| Name | Type | Description |\n';
      content += '|------|------|-------------|\n';
      
      for (const prop of doc.properties) {
        content += `| \`${prop.name}\` | \`${prop.type}\` | ${prop.description} |\n`;
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
      }
    }

    return content;
  }

  private renderParameters(params: ParameterDoc[]): string {
    return params.map(p => {
      let param = p.name;
      if (p.optional) {
        param += '?';
      }
      return param;
    }).join(', ');
  }

  private async generateAPIDocs(): Promise<void> {
    const apiDir = path.join(this.outputDir, 'api');
    await this.ensureDirectory(apiDir);

    let apiIndex = '# API Reference\n\n';
    
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

  private async generateIndex(): Promise<void> {
    let content = '# Manic Miners Documentation\n\n';
    
    content += '## Components\n\n';
    
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

    const indexPath = path.join(this.outputDir, 'index.md');
    await fs.promises.writeFile(indexPath, content);
  }

  private async ensureDirectory(dir: string): Promise<void> {
    try {
      await fs.promises.access(dir);
    } catch {
      await fs.promises.mkdir(dir, { recursive: true });
    }
  }
}

// Type definitions
interface ComponentDoc {
  name: string;
  type: 'class' | 'interface' | 'enum';
  description: string;
  methods: MethodDoc[];
  properties: PropertyDoc[];
  sourceFile: string;
  extends?: string;
  implements?: string[];
}

interface MethodDoc {
  name: string;
  description: string;
  parameters: ParameterDoc[];
  returns: string;
  modifiers: string[];
}

interface PropertyDoc {
  name: string;
  description: string;
  type: string;
  modifiers: string[];
}

interface ParameterDoc {
  name: string;
  type: string;
  description: string;
  optional: boolean;
}

interface APIDoc {
  name: string;
  description: string;
  signature: string;
  module: string;
  parameters: ParameterDoc[];
  returns: string;
}

// Main function
async function generateDocumentation() {
  const projectRoot = path.join(__dirname, '..');
  
  console.log('🚀 Starting documentation generation...');
  console.log(`Project root: ${projectRoot}`);
  
  try {
    const generator = new StandaloneDocGenerator(projectRoot, {
      outputDir: 'docs/generated',
      exclude: ['node_modules', 'test', 'dist', 'out', '.git'],
    });
    
    await generator.generateDocs();
    
    console.log('✅ Documentation generated successfully!');
    console.log(`📁 Output directory: ${path.join(projectRoot, 'docs/generated')}`);
  } catch (error) {
    console.error('❌ Failed to generate documentation:', error);
    process.exit(1);
  }
}

// Run the generator
generateDocumentation();