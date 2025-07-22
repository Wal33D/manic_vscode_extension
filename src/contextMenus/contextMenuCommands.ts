import * as vscode from 'vscode';
import { MapEditorContextMenu } from './mapEditorContextMenu';

export function registerContextMenuCommands(context: vscode.ExtensionContext) {
  const contextMenu = MapEditorContextMenu.getInstance();

  // Register the main context menu command
  const showContextMenuCmd = vscode.commands.registerCommand(
    'manicMiners.showContextMenu',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'manicminers') {
        const position = editor.selection.active;
        await contextMenu.showContextMenu(editor.document, position);
      }
    }
  );
  context.subscriptions.push(showContextMenuCmd);

  // Register context menu for specific elements
  const showTileContextMenuCmd = vscode.commands.registerCommand(
    'manicMiners.showTileContextMenu',
    async (args: { line: number; character: number }) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'manicminers') {
        const position = new vscode.Position(args.line, args.character);
        await contextMenu.showContextMenu(editor.document, position);
      }
    }
  );
  context.subscriptions.push(showTileContextMenuCmd);

  // Quick action commands that can be triggered from context menu
  const quickFillCmd = vscode.commands.registerCommand('manicMiners.quickFill', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const position = editor.selection.active;
    const line = editor.document.lineAt(position).text;
    const match = line.match(/\d+/g);

    if (match) {
      const currentValue = match[0];
      const newValue = await vscode.window.showInputBox({
        prompt: `Replace tile ${currentValue} with:`,
        validateInput: v => (isNaN(Number(v)) ? 'Must be a number' : null),
      });

      if (newValue !== undefined) {
        await vscode.commands.executeCommand('manicMiners.replaceAllEnhanced');
      }
    }
  });
  context.subscriptions.push(quickFillCmd);

  // Register hover provider for context menu hints
  const hoverProvider = vscode.languages.registerHoverProvider(
    { scheme: 'file', language: 'manicminers' },
    {
      provideHover(document, position) {
        const section = getCurrentSection(document, position);

        if (section === 'tiles' || section === 'height') {
          const line = document.lineAt(position).text;
          const values = line.trim().split(/\s+/);
          const charIndex = position.character;
          let currentValue = '';

          // Find which value the cursor is on
          let currentPos = 0;
          for (const value of values) {
            if (charIndex >= currentPos && charIndex <= currentPos + value.length) {
              currentValue = value;
              break;
            }
            currentPos += value.length + 1;
          }

          if (currentValue && !isNaN(Number(currentValue))) {
            const markdown = new vscode.MarkdownString();
            markdown.isTrusted = true;
            markdown.appendMarkdown(
              `**${section === 'tiles' ? 'Tile' : 'Height'}: ${currentValue}**\n\n`
            );
            markdown.appendMarkdown(`Right-click for context menu or use:\n`);
            markdown.appendMarkdown(`- \`Ctrl+.\` for quick actions\n`);
            markdown.appendMarkdown(`- \`Ctrl+Shift+F\` to fill area\n`);
            markdown.appendMarkdown(`- \`Ctrl+Shift+H\` to replace all\n`);

            return new vscode.Hover(markdown);
          }
        }

        return null;
      },
    }
  );
  context.subscriptions.push(hoverProvider);

  // Register code lens provider for context menu hints
  const codeLensProvider = vscode.languages.registerCodeLensProvider(
    { scheme: 'file', language: 'manicminers' },
    {
      provideCodeLenses(document) {
        const codeLenses: vscode.CodeLens[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Add code lens for section headers
          if (line.trim().endsWith('{')) {
            const range = new vscode.Range(i, 0, i, line.length);

            const command: vscode.Command = {
              title: '≡ Menu',
              command: 'manicMiners.showContextMenu',
              tooltip: 'Show context menu for this section',
            };

            codeLenses.push(new vscode.CodeLens(range, command));
          }
        }

        return codeLenses;
      },
    }
  );
  context.subscriptions.push(codeLensProvider);
}

function getCurrentSection(document: vscode.TextDocument, position: vscode.Position): string {
  const text = document.getText();
  const lines = text.split('\n');
  let currentSection = '';

  for (let i = 0; i <= position.line; i++) {
    const line = lines[i].trim();
    if (line.endsWith('{')) {
      currentSection = line.slice(0, -1);
    }
  }

  return currentSection;
}
