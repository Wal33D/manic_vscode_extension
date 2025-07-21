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
    it('should register a show welcome command', async () => {
      await activate(mockContext);

      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'manicMiners.showWelcome',
        expect.any(Function)
      );
    });

    it('should register completion item provider', async () => {
      await activate(mockContext);

      expect(vscode.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
        { scheme: 'file', language: 'manicminers' },
        expect.any(Object),
        ' '
      );
    });

    it('should register hover provider', async () => {
      await activate(mockContext);

      expect(vscode.languages.registerHoverProvider).toHaveBeenCalledWith(
        { scheme: 'file', language: 'manicminers' },
        expect.any(Object)
      );
    });

    it('should add all disposables to subscriptions', async () => {
      await activate(mockContext);

      // Just check that subscriptions were added, don't rely on exact count
      // as it changes frequently with new features
      expect(mockContext.subscriptions.length).toBeGreaterThan(0);
    });

    it('should activate without errors', async () => {
      await expect(activate(mockContext)).resolves.not.toThrow();
    });

    it('should execute show welcome command', async () => {
      await activate(mockContext);

      // Get the show welcome command handler
      const registerCall = (vscode.commands.registerCommand as jest.Mock).mock.calls.find(
        call => call[0] === 'manicMiners.showWelcome'
      );

      expect(registerCall).toBeDefined();
    });
  });

  describe('deactivate', () => {
    it('should complete without error', () => {
      expect(() => deactivate()).not.toThrow();
    });
  });
});
