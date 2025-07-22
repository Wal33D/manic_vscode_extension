// Mock implementation of VS Code API for testing

export enum CompletionItemKind {
  Field = 4,
  Snippet = 14,
  Keyword = 13,
  Method = 1,
  Property = 9,
  Variable = 5,
  Enum = 12,
  EnumMember = 19,
}

export class CompletionItem {
  public detail?: string;
  public documentation?: string;
  public insertText?: string | SnippetString;

  constructor(
    public label: string,
    public kind: CompletionItemKind
  ) {}
}

export class SnippetString {
  constructor(public value: string) {}
}

export class MarkdownString {
  public value: string = '';

  constructor(value?: string) {
    if (value) this.value = value;
  }

  appendMarkdown(value: string): MarkdownString {
    this.value += value;
    return this;
  }
}

export class Hover {
  constructor(public contents: string | string[]) {}
}

export class Position {
  constructor(
    public line: number,
    public character: number
  ) {}
}

export class Range {
  constructor(
    public start: Position,
    public end: Position
  ) {}
}

export class Selection extends Range {
  constructor(
    public anchor: Position,
    public active: Position
  ) {
    super(anchor, active);
  }
}

export class Uri {
  constructor(public fsPath: string) {}
  static file(path: string): Uri {
    return new Uri(path);
  }
  static parse(value: string): Uri {
    return new Uri(value);
  }
  static joinPath(base: Uri, ...pathSegments: string[]): Uri {
    const path = [base.fsPath, ...pathSegments].join('/');
    return new Uri(path);
  }
  toString(): string {
    return this.fsPath;
  }
}

export class Location {
  public range: Range;

  constructor(
    public uri: Uri,
    rangeOrPosition: Range | Position
  ) {
    if (rangeOrPosition instanceof Position) {
      this.range = new Range(rangeOrPosition, rangeOrPosition);
    } else {
      this.range = rangeOrPosition;
    }
  }
}

export class CancellationToken {
  isCancellationRequested = false;
  onCancellationRequested = () => {};
}

// Export TextDocument and CancellationToken also as default exports
export { TextDocument as default };

export const window = {
  showInformationMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showInputBox: jest.fn(),
  showQuickPick: jest.fn(),
  registerWebviewViewProvider: jest.fn(() => ({ dispose: jest.fn() })),
  registerCustomEditorProvider: jest.fn(() => ({ dispose: jest.fn() })),
  onDidChangeActiveTextEditor: jest.fn(() => ({ dispose: jest.fn() })),
  onDidChangeActiveColorTheme: jest.fn(() => ({ dispose: jest.fn() })),
  activeTextEditor: undefined,
  setStatusBarMessage: jest.fn(),
  withProgress: jest.fn((_options, task) => task({ report: jest.fn() })),
  createWebviewPanel: jest.fn(() => ({
    webview: {
      html: '',
      asWebviewUri: jest.fn(uri => uri),
      onDidReceiveMessage: jest.fn(),
      postMessage: jest.fn(),
    },
    dispose: jest.fn(),
    onDidDispose: jest.fn(),
    reveal: jest.fn(),
  })),
  createStatusBarItem: jest.fn(() => ({
    text: '',
    tooltip: '',
    command: '',
    show: jest.fn(),
    hide: jest.fn(),
    dispose: jest.fn(),
  })),
  createOutputChannel: jest.fn(() => ({
    name: '',
    append: jest.fn(),
    appendLine: jest.fn(),
    clear: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    dispose: jest.fn(),
  })),
};

export const commands = {
  registerCommand: jest.fn(),
  executeCommand: jest.fn(),
};

export const languages = {
  registerCompletionItemProvider: jest.fn(),
  registerHoverProvider: jest.fn(),
  registerDefinitionProvider: jest.fn(),
  registerReferenceProvider: jest.fn(),
  registerCodeActionsProvider: jest.fn(),
  createDiagnosticCollection: jest.fn(() => ({
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    dispose: jest.fn(),
  })),
};

export const workspace = {
  onDidChangeTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
  onDidCloseTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
  openTextDocument: jest.fn(),
  applyEdit: jest.fn(),
  getConfiguration: jest.fn(() => ({
    get: jest.fn(() => 'auto'),
    has: jest.fn(() => false),
    inspect: jest.fn(),
    update: jest.fn(),
  })),
};

export enum CodeActionKind {
  QuickFix = 'quickfix',
  Refactor = 'refactor',
}

export class CodeAction {
  edit?: WorkspaceEdit;
  command?: any;
  constructor(
    public title: string,
    public kind: CodeActionKind
  ) {}
}

export class WorkspaceEdit {
  replace = jest.fn();
  insert = jest.fn();
}

export interface CodeActionContext {
  diagnostics: any[];
  only?: CodeActionKind[];
  triggerKind?: CodeActionTriggerKind;
}

export enum CodeActionTriggerKind {
  Invoke = 1,
  Automatic = 2,
}

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3,
}

export class Diagnostic {
  constructor(
    public range: Range,
    public message: string,
    public severity?: DiagnosticSeverity
  ) {}

  code?: string | number;
  source?: string;
}

export enum ProgressLocation {
  SourceControl = 1,
  Window = 10,
  Notification = 15,
}

export enum ViewColumn {
  Active = -1,
  Beside = -2,
  One = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
}

export enum StatusBarAlignment {
  Left = 1,
  Right = 2,
}

// Mock TextDocument
export class TextDocument {
  public uri: Uri;

  constructor(
    private content: string,
    public languageId: string = 'manicminers'
  ) {
    this.uri = Uri.file('/test/document.dat');
  }

  getText(range?: Range): string {
    if (!range) {
      return this.content;
    }
    // Get the specific text within the range
    const lines = this.content.split('\n');
    const line = lines[range.start.line] || '';
    return line.substring(range.start.character, range.end.character);
  }

  lineAt(line: number | Position) {
    const lineNumber = typeof line === 'number' ? line : line.line;
    const lines = this.content.split('\n');
    const text = lines[lineNumber] || '';
    return {
      text,
      lineNumber,
      // Add substr method that completion provider uses
      substr: (start: number, length?: number) => {
        return text.substr(start, length);
      },
    };
  }

  getWordRangeAtPosition(position: Position, regex?: RegExp): Range | undefined {
    const line = this.lineAt(position).text;
    const defaultRegex = regex || /[a-zA-Z_0-9]+/;
    const matches = [...line.matchAll(new RegExp(defaultRegex, 'g'))];

    for (const match of matches) {
      const start = match.index!;
      const end = start + match[0].length;
      if (position.character >= start && position.character <= end) {
        return new Range(new Position(position.line, start), new Position(position.line, end));
      }
    }
    return undefined;
  }
}
