import * as vscode from 'vscode';
import { SCRIPT_PATTERNS, getPatternsByCategory } from '../snippets/scriptPatterns';

/**
 * Register script pattern commands
 */
export function registerScriptPatternCommands(context: vscode.ExtensionContext): void {
  // Command to insert a script pattern
  const insertPatternCommand = vscode.commands.registerCommand(
    'manicMiners.insertScriptPattern',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }
      
      // Check if we're in a script section
      const document = editor.document;
      const position = editor.selection.active;
      const currentLine = document.lineAt(position).text;
      
      // Get all text up to current position to check context
      const textBefore = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
      const inScriptSection = textBefore.includes('script{') && !textBefore.includes('script{.*}');
      
      if (!inScriptSection && !currentLine.includes('script{')) {
        const proceed = await vscode.window.showWarningMessage(
          'You are not in a script section. Insert pattern anyway?',
          'Yes',
          'No'
        );
        if (proceed !== 'Yes') {
          return;
        }
      }
      
      // Show category selection
      const categories = [
        { label: '$(symbol-variable) State Management', value: 'state' },
        { label: '$(target) Objectives', value: 'objectives' },
        { label: '$(ruby) Resources', value: 'resources' },
        { label: '$(clock) Timing', value: 'timing' },
        { label: '$(mortarboard) Tutorial', value: 'tutorial' },
        { label: '$(flame) Combat', value: 'combat' },
        { label: '$(compass) Exploration', value: 'exploration' },
        { label: '$(list-unordered) All Patterns', value: 'all' }
      ];
      
      const selectedCategory = await vscode.window.showQuickPick(categories, {
        placeHolder: 'Select pattern category'
      });
      
      if (!selectedCategory) {
        return;
      }
      
      // Get patterns for selected category
      const patterns = selectedCategory.value === 'all' 
        ? SCRIPT_PATTERNS 
        : getPatternsByCategory(selectedCategory.value as 'state' | 'objectives' | 'resources' | 'timing' | 'tutorial' | 'combat' | 'exploration');
      
      // Show pattern selection
      const patternItems = patterns.map(pattern => ({
        label: pattern.name,
        description: pattern.description,
        detail: `Category: ${pattern.category}`,
        pattern
      }));
      
      const selectedPattern = await vscode.window.showQuickPick(patternItems, {
        placeHolder: 'Select a script pattern to insert',
        matchOnDescription: true,
        matchOnDetail: true
      });
      
      if (!selectedPattern) {
        return;
      }
      
      // Insert the pattern
      const snippet = new vscode.SnippetString(selectedPattern.pattern.snippet);
      await editor.insertSnippet(snippet);
      
      // Show info message
      vscode.window.showInformationMessage(
        `Inserted "${selectedPattern.pattern.name}" pattern. Tab through placeholders to customize.`
      );
    }
  );
  
  // Command to show pattern documentation
  const showPatternDocsCommand = vscode.commands.registerCommand(
    'manicMiners.showScriptPatternDocs',
    async () => {
      const panel = vscode.window.createWebviewPanel(
        'scriptPatternDocs',
        'Script Pattern Reference',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true
        }
      );
      
      panel.webview.html = getPatternDocsHtml();
    }
  );
  
  context.subscriptions.push(insertPatternCommand, showPatternDocsCommand);
}

/**
 * Generate HTML documentation for patterns
 */
function getPatternDocsHtml(): string {
  const categories = ['state', 'objectives', 'resources', 'timing', 'tutorial', 'combat', 'exploration'];
  
  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Script Pattern Reference</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        h1, h2, h3 { color: #2c3e50; }
        .category {
          margin-bottom: 40px;
          border-bottom: 2px solid #ecf0f1;
          padding-bottom: 20px;
        }
        .pattern {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 20px;
        }
        .pattern h3 {
          margin-top: 0;
          color: #495057;
        }
        .pattern-description {
          color: #6c757d;
          margin-bottom: 10px;
        }
        pre {
          background: #282c34;
          color: #abb2bf;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
        }
        .keyword { color: #c678dd; }
        .string { color: #98c379; }
        .comment { color: #5c6370; font-style: italic; }
        .number { color: #d19a66; }
        .function { color: #61afef; }
      </style>
    </head>
    <body>
      <h1>Manic Miners Script Pattern Reference</h1>
      <p>Common scripting patterns for creating engaging gameplay. Click "Insert Script Pattern" in the Command Palette to use these in your maps.</p>
  `;
  
  for (const category of categories) {
    const patterns = getPatternsByCategory(category as 'state' | 'objectives' | 'resources' | 'timing' | 'tutorial' | 'combat' | 'exploration');
    if (patterns.length === 0) {
      continue;
    }
    
    html += `
      <div class="category">
        <h2>${formatCategoryName(category)}</h2>
    `;
    
    for (const pattern of patterns) {
      const highlightedCode = highlightScriptCode(pattern.snippet);
      html += `
        <div class="pattern">
          <h3>${pattern.name}</h3>
          <p class="pattern-description">${pattern.description}</p>
          <pre>${highlightedCode}</pre>
        </div>
      `;
    }
    
    html += '</div>';
  }
  
  html += `
    </body>
    </html>
  `;
  
  return html;
}

/**
 * Format category name for display
 */
function formatCategoryName(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1) + ' Patterns';
}

/**
 * Simple syntax highlighting for script code
 */
function highlightScriptCode(code: string): string {
  return code
    // Comments
    .replace(/(#[^\n]*)/g, '<span class="comment">$1</span>')
    // Keywords
    .replace(/\b(when|if|else|and|or|not|true|false|init)\b/g, '<span class="keyword">$1</span>')
    // Numbers
    .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
    // Strings (simple approach)
    .replace(/(\w+):/g, '<span class="function">$1</span>:')
    // Variables
    .replace(/\$\{(\d+):([^}]+)\}/g, '${$1:$2}');
}