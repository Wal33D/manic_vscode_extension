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
  showInformationMessage: jest.fn(() => Promise.resolve()),
  showErrorMessage: jest.fn(() => Promise.resolve()),
  showWarningMessage: jest.fn(() => Promise.resolve()),
  showInputBox: jest.fn(() => Promise.resolve()),
  showQuickPick: jest.fn(() => Promise.resolve()),
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
  createTreeView: jest.fn(() => ({
    dispose: jest.fn(),
    onDidExpandElement: jest.fn(() => ({ dispose: jest.fn() })),
    onDidCollapseElement: jest.fn(() => ({ dispose: jest.fn() })),
    onDidChangeSelection: jest.fn(() => ({ dispose: jest.fn() })),
    onDidChangeVisibility: jest.fn(() => ({ dispose: jest.fn() })),
    reveal: jest.fn(),
    badge: undefined,
    message: undefined,
    title: undefined,
    description: undefined,
  })),
  createQuickPick: jest.fn(() => ({
    placeholder: '',
    matchOnDescription: false,
    matchOnDetail: false,
    items: [],
    buttons: [],
    show: jest.fn(),
    hide: jest.fn(),
    onDidChangeSelection: jest.fn(() => ({ dispose: jest.fn() })),
    onDidTriggerButton: jest.fn(() => ({ dispose: jest.fn() })),
    dispose: jest.fn(),
  })),
  showTextDocument: jest.fn(),
  showSaveDialog: jest.fn(),
  showOpenDialog: jest.fn(),
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
  registerCodeLensProvider: jest.fn(),
  createDiagnosticCollection: jest.fn(() => ({
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    dispose: jest.fn(),
  })),
  onDidChangeDiagnostics: jest.fn(() => ({ dispose: jest.fn() })),
  getDiagnostics: jest.fn(() => []),
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
  workspaceFolders: undefined,
  fs: {
    writeFile: jest.fn(() => Promise.resolve()),
    readFile: jest.fn(() => Promise.resolve(Buffer.from(''))),
    delete: jest.fn(() => Promise.resolve()),
    rename: jest.fn(() => Promise.resolve()),
    copy: jest.fn(() => Promise.resolve()),
    createDirectory: jest.fn(() => Promise.resolve()),
    readDirectory: jest.fn(() => Promise.resolve([])),
    stat: jest.fn(() => Promise.resolve({ type: 1, ctime: 0, mtime: 0, size: 0 })),
  },
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

export enum QuickPickItemKind {
  Separator = -1,
  Default = 0,
}

export enum StatusBarAlignment {
  Left = 1,
  Right = 2,
}

export enum TreeItemCollapsibleState {
  None = 0,
  Collapsed = 1,
  Expanded = 2,
}

export class TreeItem {
  public label?: string;
  public id?: string;
  public iconPath?: any;
  public description?: string;
  public contextValue?: string;
  public command?: any;
  public collapsibleState?: TreeItemCollapsibleState;
  public resourceUri?: Uri;
  public tooltip?: string | MarkdownString;

  constructor(label: string, collapsibleState?: TreeItemCollapsibleState) {
    this.label = label;
    this.collapsibleState = collapsibleState;
  }
}

export class ThemeIcon {
  constructor(
    public id: string,
    public color?: any
  ) {}
}

export class ThemeColor {
  constructor(public id: string) {}
}

export class EventEmitter<T> {
  private listeners: Array<(e: T) => void> = [];

  event = (listener: (e: T) => void) => {
    this.listeners.push(listener);
    return {
      dispose: () => {
        const index = this.listeners.indexOf(listener);
        if (index >= 0) {
          this.listeners.splice(index, 1);
        }
      },
    };
  };

  fire(event: T): void {
    this.listeners.forEach(listener => listener(event));
  }

  dispose(): void {
    this.listeners = [];
  }
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
