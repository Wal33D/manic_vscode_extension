import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import * as vscode from 'vscode';
import { activate, deactivate } from './extension';

describe('Extension', () => {
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create a mock extension context
    mockContext = {
      subscriptions: [],
      extensionPath: '/test/path',
      extensionUri: {} as any,
      globalState: {
        get: jest.fn(),
        update: jest.fn(),
        setKeysForSync: jest.fn(),
      } as any,
      localState: {} as any,
      workspaceState: {} as any,
      asAbsolutePath: jest.fn(),
      storagePath: '/test/storage',
      globalStoragePath: '/test/global',
      logPath: '/test/log',
    } as any;
  });

  describe('activate', () => {
    it('should register a hello world command', () => {
      activate(mockContext);

      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'dat.helloWorld',
        expect.any(Function)
      );
    });

    it('should register completion item provider', () => {
      activate(mockContext);

      expect(vscode.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
        { scheme: 'file', language: 'manicminers' },
        expect.any(Object),
        ' '
      );
    });

    it('should register hover provider', () => {
      activate(mockContext);

      expect(vscode.languages.registerHoverProvider).toHaveBeenCalledWith(
        { scheme: 'file', language: 'manicminers' },
        expect.any(Object)
      );
    });

    it('should add all disposables to subscriptions', () => {
      activate(mockContext);

      // Should have 66 subscriptions: hello world command, show map preview command, map preview provider,
      // onDidChangeActiveTextEditor, onDidChangeTextDocument, completion provider, hover provider,
      // definition provider, reference provider, code actions provider (original), code actions provider (autoFix),
      // code actions provider (smart suggestions),
      // fill area command, replace all command, replace with tile set command, create tile set command,
      // insert template command, create template from selection command, manage templates command,
      // diagnostic collection, 3 validation listeners, 3 validation commands,
      // objective builder view, 4 objective commands,
      // undo/redo provider (status bar + onDidChangeActiveTextEditor),
      // enhanced quick actions (3 commands + 4 undo/redo commands + 1 clear history command),
      // smart suggestions (2 commands: showSmartSuggestions, analyzeTilePatterns),
      // heat map provider (1 provider + 1 command + 2 event listeners)
      // 3D terrain provider (1 provider + 1 command + 2 event listeners)
      // level generator (1 command)
      // Actual count: 66 based on new additions
      expect(mockContext.subscriptions).toHaveLength(66);
    });

    it('should activate without errors', () => {
      expect(() => activate(mockContext)).not.toThrow();
    });

    it('should execute hello world command', () => {
      activate(mockContext);

      // Get the command handler
      const commandCall = (vscode.commands.registerCommand as jest.Mock).mock.calls[0];
      const commandHandler = commandCall[1];

      // Execute the command
      (commandHandler as any)();

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Hello World from Manic Miners Dat File!'
      );
    });
  });

  describe('deactivate', () => {
    it('should complete without error', () => {
      expect(() => deactivate()).not.toThrow();
    });
  });
});
