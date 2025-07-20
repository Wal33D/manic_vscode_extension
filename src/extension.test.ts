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
      globalState: {} as any,
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

      // Should have 3 subscriptions: command, completion provider, hover provider
      expect(mockContext.subscriptions).toHaveLength(3);
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
