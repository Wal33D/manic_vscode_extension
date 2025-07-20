import * as vscode from 'vscode';
import { DatCompletionItemProvider } from './completionItemProvider';
import { DatHoverProvider } from './hoverProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "dat" is now active!');

  let disposable = vscode.commands.registerCommand('dat.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from Manic Miners Dat File!');
  });

  context.subscriptions.push(disposable);

  const completionItemProvider = vscode.languages.registerCompletionItemProvider(
    { scheme: 'file', language: 'manicminers' },
    new DatCompletionItemProvider(),
    ...[' ']
  );

  context.subscriptions.push(completionItemProvider);

  const hoverProvider = vscode.languages.registerHoverProvider(
    { scheme: 'file', language: 'manicminers' },
    new DatHoverProvider()
  );

  context.subscriptions.push(hoverProvider);
}

export function deactivate() {}
