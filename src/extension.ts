import * as vscode from 'vscode';
import { DatCompletionItemProvider } from './completionItemProvider';
import { DatHoverProvider } from './hoverProvider';
import { DatDefinitionProvider } from './definitionProvider';
import { DatReferenceProvider } from './referenceProvider';

export function activate(context: vscode.ExtensionContext) {
  // Extension activated successfully

  const disposable = vscode.commands.registerCommand('dat.helloWorld', () => {
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

  const definitionProvider = vscode.languages.registerDefinitionProvider(
    { scheme: 'file', language: 'manicminers' },
    new DatDefinitionProvider()
  );

  context.subscriptions.push(definitionProvider);

  const referenceProvider = vscode.languages.registerReferenceProvider(
    { scheme: 'file', language: 'manicminers' },
    new DatReferenceProvider()
  );

  context.subscriptions.push(referenceProvider);
}

export function deactivate() {}
