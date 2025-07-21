import * as vscode from 'vscode';

export function registerMapEditorCommands(context: vscode.ExtensionContext): void {
  // Open map editor command
  const openMapEditor = vscode.commands.registerCommand('manicMiners.openMapEditor', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document.fileName.endsWith('.dat')) {
      vscode.window.showErrorMessage('Please open a .dat file to use the map editor');
      return;
    }

    // Open the map editor
    await vscode.commands.executeCommand(
      'vscode.openWith',
      editor.document.uri,
      'manicMiners.mapEditor'
    );
  });

  // Switch to text editor command
  const switchToTextEditor = vscode.commands.registerCommand(
    'manicMiners.switchToTextEditor',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      // Switch back to text editor
      await vscode.commands.executeCommand('vscode.openWith', editor.document.uri, 'default');
    }
  );

  context.subscriptions.push(openMapEditor, switchToTextEditor);
}
