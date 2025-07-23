import * as vscode from 'vscode';
import { EventEmitter } from 'events';

/**
 * Test helper utilities for Manic Miners extension tests
 */

/**
 * Creates a mock VS Code ExtensionContext for testing
 */
export function createMockContext(): vscode.ExtensionContext {
  const globalState = new Map<string, any>();
  const workspaceState = new Map<string, any>();
  const subscriptions: vscode.Disposable[] = [];

  return {
    subscriptions,
    workspaceState: {
      get: (key: string) => workspaceState.get(key),
      update: async (key: string, value: any) => {
        workspaceState.set(key, value);
      },
      keys: () => Array.from(workspaceState.keys()),
    },
    globalState: {
      get: (key: string) => globalState.get(key),
      update: async (key: string, value: any) => {
        globalState.set(key, value);
      },
      keys: () => Array.from(globalState.keys()),
      setKeysForSync: jest.fn(),
    },
    extensionPath: '/test/extension',
    extensionUri: vscode.Uri.file('/test/extension'),
    environmentVariableCollection: {} as any,
    storagePath: '/test/storage',
    globalStoragePath: '/test/global-storage',
    logPath: '/test/logs',
    extensionMode: vscode.ExtensionMode.Test,
    extension: {} as any,
    secrets: {
      get: jest.fn(),
      store: jest.fn(),
      delete: jest.fn(),
      onDidChange: jest.fn(),
    },
    storageUri: vscode.Uri.file('/test/storage'),
    globalStorageUri: vscode.Uri.file('/test/global-storage'),
    logUri: vscode.Uri.file('/test/logs'),
    asAbsolutePath: (relativePath: string) => `/test/extension/${relativePath}`,
  } as any;
}

/**
 * Creates a mock webview for testing
 */
export function createMockWebview(): vscode.Webview {
  const messageHandlers: ((message: any) => void)[] = [];

  return {
    html: '',
    options: {
      enableScripts: true,
      localResourceRoots: [],
    },
    cspSource: 'test-csp',
    asWebviewUri: (uri: vscode.Uri) => uri,
    postMessage: jest.fn(),
    onDidReceiveMessage: (handler: (message: any) => void) => {
      messageHandlers.push(handler);
      return {
        dispose: () => {
          const index = messageHandlers.indexOf(handler);
          if (index >= 0) {
            messageHandlers.splice(index, 1);
          }
        },
      };
    },
    // Helper method to simulate messages from webview
    _simulateMessage: (message: any) => {
      messageHandlers.forEach(handler => handler(message));
    },
  } as any;
}

/**
 * Creates a mock webview view for testing
 */
export function createMockWebviewView(): vscode.WebviewView {
  const webview = createMockWebview();
  const eventEmitter = new EventEmitter();

  return {
    webview,
    viewType: 'test-view',
    visible: true,
    badge: undefined,
    title: 'Test View',
    description: undefined,
    show: jest.fn(),
    onDidDispose: (handler: () => void) => {
      eventEmitter.on('dispose', handler);
      return { dispose: () => eventEmitter.off('dispose', handler) };
    },
    onDidChangeVisibility: (handler: () => void) => {
      eventEmitter.on('visibility', handler);
      return { dispose: () => eventEmitter.off('visibility', handler) };
    },
    // Helper method to trigger events
    _triggerEvent: (event: string) => {
      eventEmitter.emit(event);
    },
  } as any;
}

/**
 * Creates a mock document with Manic Miners content
 */
export function createMockDocument(content: string): vscode.TextDocument {
  const lines = content.split('\n');

  return {
    uri: vscode.Uri.file('/test/map.dat'),
    fileName: '/test/map.dat',
    isUntitled: false,
    languageId: 'manicminers',
    version: 1,
    isDirty: false,
    isClosed: false,
    save: jest.fn(),
    eol: vscode.EndOfLine.LF,
    lineCount: lines.length,
    getText: (range?: vscode.Range) => {
      if (!range) {
        return content;
      }
      // Simplified range extraction
      const startLine = lines[range.start.line] || '';
      return startLine.substring(range.start.character, range.end.character);
    },
    getWordRangeAtPosition: (position: vscode.Position, regex?: RegExp) => {
      const line = lines[position.line] || '';
      const defaultRegex = regex || /[a-zA-Z_0-9]+/;
      const matches = [...line.matchAll(new RegExp(defaultRegex, 'g'))];

      for (const match of matches) {
        const start = match.index!;
        const end = start + match[0].length;
        if (position.character >= start && position.character <= end) {
          return new vscode.Range(
            new vscode.Position(position.line, start),
            new vscode.Position(position.line, end)
          );
        }
      }
      return undefined;
    },
    lineAt: (lineOrPos: number | vscode.Position) => {
      const lineNumber = typeof lineOrPos === 'number' ? lineOrPos : lineOrPos.line;
      const text = lines[lineNumber] || '';
      return {
        lineNumber,
        text,
        range: new vscode.Range(
          new vscode.Position(lineNumber, 0),
          new vscode.Position(lineNumber, text.length)
        ),
        rangeIncludingLineBreak: new vscode.Range(
          new vscode.Position(lineNumber, 0),
          new vscode.Position(lineNumber + 1, 0)
        ),
        firstNonWhitespaceCharacterIndex: text.search(/\S/),
        isEmptyOrWhitespace: text.trim().length === 0,
      };
    },
    offsetAt: (position: vscode.Position) => {
      let offset = 0;
      for (let i = 0; i < position.line; i++) {
        offset += lines[i].length + 1; // +1 for newline
      }
      offset += position.character;
      return offset;
    },
    positionAt: (offset: number) => {
      let currentOffset = 0;
      for (let i = 0; i < lines.length; i++) {
        const lineLength = lines[i].length + 1;
        if (currentOffset + lineLength > offset) {
          return new vscode.Position(i, offset - currentOffset);
        }
        currentOffset += lineLength;
      }
      return new vscode.Position(lines.length - 1, lines[lines.length - 1].length);
    },
    validateRange: (range: vscode.Range) => range,
    validatePosition: (position: vscode.Position) => position,
  } as any;
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 1000,
  interval: number = 10
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

/**
 * Creates sample Manic Miners map data
 */
export function createSampleMapData() {
  return {
    info: {
      name: 'Test Map',
      author: 'Test Author',
      version: '1.0',
      size: { width: 50, height: 50 },
    },
    tiles: Array(50 * 50)
      .fill(null)
      .map((_, i) => ({
        id: i,
        type: Math.floor(Math.random() * 5),
        height: Math.floor(Math.random() * 10),
      })),
    buildings: [
      { x: 10, y: 10, type: 'toolstore' },
      { x: 20, y: 20, type: 'teleport' },
    ],
    resources: {
      crystals: [
        { x: 5, y: 5, amount: 10 },
        { x: 15, y: 15, amount: 5 },
      ],
      ore: [{ x: 25, y: 25, amount: 20 }],
    },
  };
}

/**
 * Creates a mock file system for testing
 */
export class MockFileSystem {
  private files: Map<string, Buffer> = new Map();

  async writeFile(uri: vscode.Uri, content: Uint8Array): Promise<void> {
    this.files.set(uri.fsPath, Buffer.from(content));
  }

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    const content = this.files.get(uri.fsPath);
    if (!content) {
      throw new Error(`File not found: ${uri.fsPath}`);
    }
    return content as unknown as Uint8Array;
  }

  async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    if (!this.files.has(uri.fsPath)) {
      throw new Error(`File not found: ${uri.fsPath}`);
    }
    const content = this.files.get(uri.fsPath)!;
    return {
      type: vscode.FileType.File,
      ctime: Date.now(),
      mtime: Date.now(),
      size: content.length,
    };
  }

  async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    const dirPath = uri.fsPath;
    const entries: [string, vscode.FileType][] = [];

    for (const [path] of this.files) {
      if (path.startsWith(dirPath) && path !== dirPath) {
        const relativePath = path.substring(dirPath.length + 1);
        if (!relativePath.includes('/')) {
          entries.push([relativePath, vscode.FileType.File]);
        }
      }
    }

    return entries;
  }

  async createDirectory(_uri: vscode.Uri): Promise<void> {
    // No-op for mock
  }

  async delete(uri: vscode.Uri, options?: { recursive?: boolean }): Promise<void> {
    if (options?.recursive) {
      const prefix = uri.fsPath;
      for (const [path] of this.files) {
        if (path.startsWith(prefix)) {
          this.files.delete(path);
        }
      }
    } else {
      this.files.delete(uri.fsPath);
    }
  }

  async rename(
    oldUri: vscode.Uri,
    newUri: vscode.Uri,
    _options?: { overwrite?: boolean }
  ): Promise<void> {
    const content = this.files.get(oldUri.fsPath);
    if (!content) {
      throw new Error(`File not found: ${oldUri.fsPath}`);
    }
    this.files.set(newUri.fsPath, content);
    this.files.delete(oldUri.fsPath);
  }

  async copy(source: vscode.Uri, destination: vscode.Uri): Promise<void> {
    const content = this.files.get(source.fsPath);
    if (!content) {
      throw new Error(`File not found: ${source.fsPath}`);
    }
    this.files.set(destination.fsPath, Buffer.from(content));
  }

  // Helper methods
  addFile(path: string, content: string): void {
    this.files.set(path, Buffer.from(content));
  }

  getFile(path: string): string | undefined {
    const buffer = this.files.get(path);
    return buffer ? buffer.toString() : undefined;
  }

  clear(): void {
    this.files.clear();
  }
}
