import * as vscode from 'vscode';

const infoFields = [
  'rowcount',
  'colcount',
  'camerapos',
  'Translation',
  'Rotation',
  'Scale',
  'biome',
  'creator',
  'erosioninitialwaittime',
  'spiderchance',
  'erosionscale',
  'camerazoom',
  'version',
  'oxygen',
  'levelname',
  'initialcrystals',
  'initialore',
  'cameraangle',
  'initialheight',
  'maxheight',
  'minheight',
  'gravity',
  'ambientlight',
  'weather',
  'difficulty',
  'resourcespeed',
  'enemystrength',
  'mapdescription',
  'Rowcount',
  'Colcount',
];

export class DatCompletionItemProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    const linePrefix = document.lineAt(position).text.substr(0, position.character);
    if (/^\s*info\s*{\s*$/.test(linePrefix)) {
      for (const field of infoFields) {
        completionItems.push(new vscode.CompletionItem(field, vscode.CompletionItemKind.Field));
      }
    }

    return completionItems;
  }
}
