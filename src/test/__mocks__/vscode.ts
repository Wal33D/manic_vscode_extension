// Mock implementation of VS Code API for testing

export enum CompletionItemKind {
  Field = 4,
}

export class CompletionItem {
  constructor(
    public label: string,
    public kind: CompletionItemKind
  ) {}
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
};

export const commands = {
  registerCommand: jest.fn(),
};

export const languages = {
  registerCompletionItemProvider: jest.fn(),
  registerHoverProvider: jest.fn(),
};

// Mock TextDocument
export class TextDocument {
  constructor(
    private content: string,
    public languageId: string = 'manicminers'
  ) {}

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
    const defaultRegex = regex || /[a-zA-Z]+/;
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
