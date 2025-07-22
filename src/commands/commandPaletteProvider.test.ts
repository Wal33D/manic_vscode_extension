import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import * as vscode from 'vscode';
import { CommandPaletteProvider, CommandDefinition } from './commandPaletteProvider';

describe('CommandPaletteProvider', () => {
  let provider: CommandPaletteProvider;
  let mockContext: vscode.ExtensionContext;
  let mockQuickPick: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock extension context
    mockContext = {
      globalState: {
        get: jest.fn(),
        update: jest.fn(() => Promise.resolve()),
      },
    } as any;

    // Factory function to create a new quick pick mock
    (vscode.window.createQuickPick as jest.Mock).mockImplementation(() => {
      const buttonHandlers: Array<(button: any) => void> = [];
      const selectionHandlers: Array<(selection: any[]) => void> = [];

      const quickPick: any = {
        placeholder: '',
        matchOnDescription: false,
        matchOnDetail: false,
        items: [],
        buttons: [],
        show: jest.fn(),
        hide: jest.fn(),
        onDidChangeSelection: jest.fn((handler: (selection: any[]) => void) => {
          selectionHandlers.push(handler);
          quickPick._selectionHandler = handler;
          return { dispose: jest.fn() };
        }),
        onDidTriggerButton: jest.fn((handler: (button: any) => void) => {
          buttonHandlers.push(handler);
          quickPick._buttonHandler = handler;
          return { dispose: jest.fn() };
        }),
        dispose: jest.fn(),
        _selectionHandler: null as any,
        _buttonHandler: null as any,
        _triggerButton: (button: any) => {
          buttonHandlers.forEach(handler => handler(button));
        },
        _triggerSelection: (selection: any[]) => {
          selectionHandlers.forEach(handler => handler(selection));
        },
      };

      // Store the most recently created quickPick for test access
      mockQuickPick = quickPick;
      return quickPick;
    });

    // Reset singleton
    (CommandPaletteProvider as any).instance = undefined;
    provider = CommandPaletteProvider.getInstance(mockContext);
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = CommandPaletteProvider.getInstance(mockContext);
      const instance2 = CommandPaletteProvider.getInstance(mockContext);
      expect(instance1).toBe(instance2);
    });
  });

  describe('registerCommand', () => {
    it('should register command definition', async () => {
      const command: CommandDefinition = {
        command: 'test.command',
        title: 'Test Command',
        category: 'editing', // Use a valid category
        description: 'Test description',
        icon: '$(test)',
      };

      provider.registerCommand(command);

      // Verify by showing command palette
      await provider.showCommandPalette();
      const items = mockQuickPick.items;

      const testCommand = items.find((item: any) => item.command === 'test.command');
      expect(testCommand).toBeDefined();
      expect(testCommand.label).toContain('Test Command');
    });
  });

  describe('showCommandPalette', () => {
    beforeEach(() => {
      // Initialize with some test commands
      provider.registerCommand({
        command: 'test.command1',
        title: 'Test Command 1',
        category: 'editing',
      });
      provider.registerCommand({
        command: 'test.command2',
        title: 'Test Command 2',
        category: 'validation',
      });
    });

    it('should create and show quick pick', async () => {
      await provider.showCommandPalette();

      expect(vscode.window.createQuickPick).toHaveBeenCalled();
      expect(mockQuickPick.placeholder).toBe('Search for Manic Miners commands...');
      expect(mockQuickPick.matchOnDescription).toBe(true);
      expect(mockQuickPick.matchOnDetail).toBe(true);
      expect(mockQuickPick.show).toHaveBeenCalled();
    });

    it('should include categories in quick pick items', async () => {
      await provider.showCommandPalette();

      const items = mockQuickPick.items;
      const categoryItems = items.filter((item: any) => item.categoryId);

      // Should have category items
      expect(categoryItems.length).toBeGreaterThan(0);

      // Check for specific categories
      const fileManagementCategory = categoryItems.find(
        (item: any) => item.categoryId === 'file-management'
      );
      expect(fileManagementCategory).toBeDefined();
      expect(fileManagementCategory.label).toContain('File & Project Management');
    });

    it('should include registered commands in quick pick items', async () => {
      await provider.showCommandPalette();

      const items = mockQuickPick.items;
      const commandItems = items.filter((item: any) => item.command);

      // Should include test commands
      const testCommand1 = commandItems.find((item: any) => item.command === 'test.command1');
      const testCommand2 = commandItems.find((item: any) => item.command === 'test.command2');

      expect(testCommand1).toBeDefined();
      expect(testCommand1.label).toContain('Test Command 1');
      expect(testCommand2).toBeDefined();
      expect(testCommand2.label).toContain('Test Command 2');
    });

    it('should handle command selection', async () => {
      await provider.showCommandPalette();

      // Get the selection handler
      const selectionHandler = mockQuickPick._selectionHandler;

      // Simulate selecting a command
      const mockSelection = [
        {
          command: 'test.command1',
          label: 'Test Command 1',
        },
      ];

      selectionHandler(mockSelection);

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('test.command1');
      expect(mockQuickPick.hide).toHaveBeenCalled();
    });

    it('should handle category selection', async () => {
      await provider.showCommandPalette();

      // Get the selection handler
      const selectionHandler = mockQuickPick._selectionHandler;

      // Simulate selecting a category
      const mockSelection = [
        {
          categoryId: 'editing',
          label: 'Editing',
        },
      ];

      // Mock the second quick pick for category commands
      const mockCategoryQuickPick = {
        placeholder: '',
        items: [],
        show: jest.fn(),
        hide: jest.fn(),
        onDidChangeSelection: jest.fn(),
      };
      (vscode.window.createQuickPick as jest.Mock)
        .mockReturnValueOnce(mockQuickPick)
        .mockReturnValueOnce(mockCategoryQuickPick);

      selectionHandler(mockSelection);

      expect(mockQuickPick.hide).toHaveBeenCalled();
    });

    it('should add custom buttons for favorites and recent', async () => {
      // Add at least one command so the palette has content
      provider.registerCommand({
        command: 'test.command',
        title: 'Test Command',
        category: 'editing',
      });

      await provider.showCommandPalette();

      // Verify the quick pick was configured correctly
      expect(mockQuickPick.buttons).toHaveLength(2);
      expect((mockQuickPick.buttons[0] as any).tooltip).toBe('Show Favorites');
      expect((mockQuickPick.buttons[1] as any).tooltip).toBe('Show Recent');
    });

    it('should handle favorite button click', async () => {
      // Add a favorite command
      provider.registerCommand({
        command: 'test.favorite',
        title: 'Favorite Command',
        category: 'editing',
      });
      provider.toggleFavorite('test.favorite');

      await provider.showCommandPalette();

      // Verify button handler was registered
      expect(mockQuickPick.onDidTriggerButton).toHaveBeenCalled();

      // Simulate clicking favorites button
      mockQuickPick._triggerButton({ tooltip: 'Show Favorites' });

      // Items should be updated to show only favorites
      expect(mockQuickPick.items).toBeDefined();
      expect(mockQuickPick.items.length).toBeGreaterThan(0);

      // Check that the items are favorite items
      const favoriteItems = mockQuickPick.items.filter(
        (item: any) => item.command === 'test.favorite'
      );
      expect(favoriteItems.length).toBe(1);
      expect(favoriteItems[0].label).toContain('$(star-full)');
    });
  });

  describe('recent commands', () => {
    it('should load recent commands from global state', () => {
      const recentCommands = ['command1', 'command2'];
      (mockContext.globalState.get as jest.Mock).mockReturnValueOnce(recentCommands);

      // Create new instance to trigger loading
      (CommandPaletteProvider as any).instance = undefined;
      provider = CommandPaletteProvider.getInstance(mockContext);

      expect(mockContext.globalState.get).toHaveBeenCalledWith('recentCommands');
    });

    it('should add command to recent after execution', async () => {
      provider.registerCommand({
        command: 'test.command',
        title: 'Test Command',
        category: 'validation',
      });

      await provider.showCommandPalette();

      // Simulate command execution
      mockQuickPick._triggerSelection([{ command: 'test.command' }]);

      // The update might be async, so let's wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockContext.globalState.update).toHaveBeenCalledWith(
        'recentCommands',
        expect.arrayContaining(['test.command'])
      );
    });

    it('should limit recent commands to 10', async () => {
      // Register all commands first
      for (let i = 0; i < 12; i++) {
        provider.registerCommand({
          command: `test.command${i}`,
          title: `Test Command ${i}`,
          category: 'editing',
        });
      }

      // Show command palette once
      await provider.showCommandPalette();

      // Execute commands to add them to recent
      for (let i = 0; i < 12; i++) {
        mockQuickPick._triggerSelection([{ command: `test.command${i}` }]);
        // Small delay to ensure async operations complete
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      // Find the last call that updates recent commands
      const calls = (mockContext.globalState.update as jest.Mock).mock.calls;
      const recentCalls = calls.filter(call => call[0] === 'recentCommands');
      expect(recentCalls.length).toBeGreaterThan(0);

      const lastCall = recentCalls[recentCalls.length - 1];
      expect(lastCall[1]).toHaveLength(10);
      expect((lastCall[1] as string[])[0]).toBe('test.command11'); // Most recent
      expect((lastCall[1] as string[])[9]).toBe('test.command2'); // 10th most recent
    });
  });

  describe('favorite commands', () => {
    it('should load favorite commands from global state', () => {
      const favoriteCommands = ['command1', 'command2'];
      (mockContext.globalState.get as jest.Mock)
        .mockReturnValueOnce(undefined) // recent commands
        .mockReturnValueOnce(favoriteCommands); // favorite commands

      // Create new instance to trigger loading
      (CommandPaletteProvider as any).instance = undefined;
      provider = CommandPaletteProvider.getInstance(mockContext);

      expect(mockContext.globalState.get).toHaveBeenCalledWith('favoriteCommands');
    });

    it('should toggle favorite status', () => {
      provider.toggleFavorite('test.command');
      expect(mockContext.globalState.update).toHaveBeenCalledWith('favoriteCommands', [
        'test.command',
      ]);

      // Toggle off
      provider.toggleFavorite('test.command');
      expect(mockContext.globalState.update).toHaveBeenCalledWith('favoriteCommands', []);
    });

    it('should mark favorite commands in items', async () => {
      provider.registerCommand({
        command: 'test.favorite',
        title: 'Favorite Command',
        category: 'editing',
      });
      provider.registerCommand({
        command: 'test.regular',
        title: 'Regular Command',
        category: 'validation',
      });

      provider.toggleFavorite('test.favorite');

      await provider.showCommandPalette();
      const items = mockQuickPick.items;

      const favoriteItem = items.find((item: any) => item.command === 'test.favorite');
      const regularItem = items.find((item: any) => item.command === 'test.regular');

      expect(favoriteItem).toBeDefined();
      expect(regularItem).toBeDefined();
      expect(favoriteItem.label).toContain('$(star-full)');
      expect(regularItem.label).not.toContain('$(star-full)');
    });
  });

  describe('initializeDefaultCommands', () => {
    it('should register all default commands', async () => {
      provider.initializeDefaultCommands();

      await provider.showCommandPalette();
      const items = mockQuickPick.items;
      const commandItems = items.filter((item: any) => item.command);

      // Check for some key commands
      const newFileCommand = commandItems.find(
        (item: any) => item.command === 'manicMiners.newFile'
      );
      const runValidationCommand = commandItems.find(
        (item: any) => item.command === 'manicMiners.runValidation'
      );
      const showMapPreviewCommand = commandItems.find(
        (item: any) => item.command === 'manicMiners.showMapPreview'
      );

      expect(newFileCommand).toBeDefined();
      expect(runValidationCommand).toBeDefined();
      expect(showMapPreviewCommand).toBeDefined();
    });

    it('should assign commands to correct categories', async () => {
      provider.initializeDefaultCommands();

      await provider.showCommandPalette();
      const items = mockQuickPick.items;
      const commandItems = items.filter((item: any) => item.command);

      // Check category assignments
      const fileCommand = commandItems.find((item: any) => item.command === 'manicMiners.newFile');
      const validationCommand = commandItems.find(
        (item: any) => item.command === 'manicMiners.runValidation'
      );

      expect(fileCommand?.description).toBe('file-management');
      expect(validationCommand?.description).toBe('validation');
    });

    it('should include keybindings in command labels', async () => {
      provider.initializeDefaultCommands();

      await provider.showCommandPalette();
      const items = mockQuickPick.items;

      const fillAreaCommand = items.find(
        (item: any) => item.command === 'manicMiners.fillAreaEnhanced'
      );

      expect(fillAreaCommand).toBeDefined();
      expect(fillAreaCommand?.label).toContain('(Ctrl+Shift+F)');
    });
  });

  describe('error handling', () => {
    it('should show error message when command execution fails', async () => {
      const mockExecuteCommand = vscode.commands.executeCommand as jest.Mock;
      mockExecuteCommand.mockImplementation(() => Promise.reject(new Error('Test error')));

      provider.registerCommand({
        command: 'test.failing',
        title: 'Failing Command',
        category: 'editing',
      });

      await provider.showCommandPalette();

      // Simulate command selection
      mockQuickPick._triggerSelection([{ command: 'test.failing' }]);

      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        'Failed to execute command: test.failing'
      );
    });
  });
});
