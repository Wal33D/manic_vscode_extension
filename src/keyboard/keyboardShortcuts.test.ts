import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import * as vscode from 'vscode';
import { KeyboardShortcutManager } from './keyboardShortcuts';

describe('KeyboardShortcutManager', () => {
  let manager: KeyboardShortcutManager;
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock extension context
    mockContext = {
      globalState: {
        get: jest.fn(),
        update: jest.fn(),
      },
    } as any;

    manager = new KeyboardShortcutManager(mockContext);
  });

  describe('initializeDefaultShortcuts', () => {
    it('should initialize all default shortcuts', () => {
      manager.initializeDefaultShortcuts();

      // Check some key shortcuts exist
      expect(manager.getShortcut('manicMiners.showMapPreview')).toBeDefined();
      expect(manager.getShortcut('manicMiners.runValidation')).toBeDefined();
      expect(manager.getShortcut('manicMiners.fillAreaEnhanced')).toBeDefined();
    });

    it('should set correct properties for shortcuts', () => {
      manager.initializeDefaultShortcuts();

      const mapPreviewShortcut = manager.getShortcut('manicMiners.showMapPreview');
      expect(mapPreviewShortcut).toEqual({
        command: 'manicMiners.showMapPreview',
        key: 'ctrl+shift+v',
        mac: 'cmd+shift+v',
        when: 'editorTextFocus && editorLangId == manicminers',
        category: 'Navigation',
        description: 'Show Map Preview',
      });
    });
  });

  describe('getShortcutsByCategory', () => {
    beforeEach(() => {
      manager.initializeDefaultShortcuts();
    });

    it('should organize shortcuts by category', () => {
      const categorized = manager.getShortcutsByCategory();

      // Check categories exist
      expect(categorized.has('Navigation')).toBe(true);
      expect(categorized.has('Editing')).toBe(true);
      expect(categorized.has('Validation')).toBe(true);
      expect(categorized.has('Visualization')).toBe(true);
    });

    it('should group shortcuts correctly', () => {
      const categorized = manager.getShortcutsByCategory();

      const navigationShortcuts = categorized.get('Navigation');
      const editingShortcuts = categorized.get('Editing');

      expect(navigationShortcuts).toBeDefined();
      expect(navigationShortcuts?.length).toBeGreaterThan(0);
      expect(navigationShortcuts?.some(s => s.command === 'manicMiners.showMapPreview')).toBe(true);

      expect(editingShortcuts).toBeDefined();
      expect(editingShortcuts?.length).toBeGreaterThan(0);
      expect(editingShortcuts?.some(s => s.command === 'manicMiners.fillAreaEnhanced')).toBe(true);
    });
  });

  describe('getShortcut', () => {
    beforeEach(() => {
      manager.initializeDefaultShortcuts();
    });

    it('should return shortcut for valid command', () => {
      const shortcut = manager.getShortcut('manicMiners.runValidation');
      expect(shortcut).toBeDefined();
      expect(shortcut?.key).toBe('ctrl+shift+r');
    });

    it('should return undefined for invalid command', () => {
      const shortcut = manager.getShortcut('invalid.command');
      expect(shortcut).toBeUndefined();
    });
  });

  describe('updateShortcut', () => {
    beforeEach(() => {
      manager.initializeDefaultShortcuts();
    });

    it('should update custom shortcut', async () => {
      await manager.updateShortcut('manicMiners.runValidation', 'ctrl+alt+v');

      expect(mockContext.globalState.update).toHaveBeenCalledWith(
        'customKeyboardShortcuts',
        expect.objectContaining({
          'manicMiners.runValidation': 'ctrl+alt+v',
        })
      );

      const mockShowInfoMessage = vscode.window.showInformationMessage as jest.Mock;
      expect(mockShowInfoMessage).toHaveBeenCalledWith(
        'Keyboard shortcut updated. Restart VS Code to apply changes.',
        'Restart'
      );
    });

    it('should handle restart selection', async () => {
      const mockShowInfoMessage = vscode.window.showInformationMessage as jest.Mock;
      mockShowInfoMessage.mockImplementation(() => Promise.resolve('Restart'));

      await manager.updateShortcut('manicMiners.runValidation', 'ctrl+alt+v');

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.action.reloadWindow');
    });
  });

  describe('resetShortcut', () => {
    beforeEach(() => {
      manager.initializeDefaultShortcuts();
    });

    it('should reset custom shortcut', async () => {
      // First set a custom shortcut
      await manager.updateShortcut('manicMiners.runValidation', 'ctrl+alt+v');

      // Then reset it
      await manager.resetShortcut('manicMiners.runValidation');

      expect(mockContext.globalState.update).toHaveBeenLastCalledWith(
        'customKeyboardShortcuts',
        expect.objectContaining({})
      );
    });
  });

  describe('resetAllShortcuts', () => {
    it('should clear all custom shortcuts', async () => {
      manager.initializeDefaultShortcuts();

      // Set some custom shortcuts
      await manager.updateShortcut('manicMiners.runValidation', 'ctrl+alt+v');
      await manager.updateShortcut('manicMiners.showMapPreview', 'ctrl+alt+p');

      // Reset all
      await manager.resetAllShortcuts();

      expect(mockContext.globalState.update).toHaveBeenLastCalledWith(
        'customKeyboardShortcuts',
        {}
      );
    });
  });

  describe('isKeyInUse', () => {
    beforeEach(() => {
      manager.initializeDefaultShortcuts();
    });

    it('should return true for used key combination', () => {
      expect(manager.isKeyInUse('ctrl+shift+v')).toBe(true);
      expect(manager.isKeyInUse('ctrl+shift+r')).toBe(true);
    });

    it('should return false for unused key combination', () => {
      expect(manager.isKeyInUse('ctrl+alt+x')).toBe(false);
      expect(manager.isKeyInUse('f13')).toBe(false);
    });

    it('should handle normalized key combinations', () => {
      // Should recognize variations
      expect(manager.isKeyInUse('Ctrl+Shift+V')).toBe(true);
      expect(manager.isKeyInUse('CTRL+SHIFT+V')).toBe(true);
    });
  });

  describe('getCommandByKey', () => {
    beforeEach(() => {
      manager.initializeDefaultShortcuts();
    });

    it('should return command for valid key combination', () => {
      expect(manager.getCommandByKey('ctrl+shift+v')).toBe('manicMiners.showMapPreview');
      expect(manager.getCommandByKey('ctrl+shift+r')).toBe('manicMiners.runValidation');
    });

    it('should return undefined for invalid key combination', () => {
      expect(manager.getCommandByKey('ctrl+alt+x')).toBeUndefined();
    });

    it('should respect custom shortcuts', async () => {
      await manager.updateShortcut('manicMiners.runValidation', 'ctrl+alt+v');

      // Mock the loaded custom shortcuts
      (manager as any).customShortcuts.set('manicMiners.runValidation', 'ctrl+alt+v');

      expect(manager.getCommandByKey('ctrl+alt+v')).toBe('manicMiners.runValidation');
    });
  });

  describe('exportShortcuts', () => {
    beforeEach(() => {
      manager.initializeDefaultShortcuts();
    });

    it('should export shortcuts to JSON file', async () => {
      const mockUri = vscode.Uri.file('/test/shortcuts.json');
      const mockShowSaveDialog = vscode.window.showSaveDialog as jest.Mock;
      mockShowSaveDialog.mockImplementationOnce(() => Promise.resolve(mockUri));

      await manager.exportShortcuts();

      expect(vscode.window.showSaveDialog).toHaveBeenCalledWith({
        defaultUri: vscode.Uri.file('manic-miners-shortcuts.json'),
        filters: {
          'JSON Files': ['json'],
        },
      });

      const mockWriteFile = vscode.workspace.fs.writeFile as jest.Mock;
      expect(mockWriteFile).toHaveBeenCalledWith(mockUri, expect.any(Buffer));

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Keyboard shortcuts exported successfully.'
      );
    });

    it('should handle cancelled save dialog', async () => {
      const mockShowSaveDialog = vscode.window.showSaveDialog as jest.Mock;
      mockShowSaveDialog.mockImplementationOnce(() => Promise.resolve(undefined));

      await manager.exportShortcuts();

      expect(vscode.workspace.fs.writeFile).not.toHaveBeenCalled();
    });

    it('should include custom shortcuts in export', async () => {
      await manager.updateShortcut('manicMiners.runValidation', 'ctrl+alt+v');
      (manager as any).customShortcuts.set('manicMiners.runValidation', 'ctrl+alt+v');

      const mockUri = vscode.Uri.file('/test/shortcuts.json');
      const mockShowSaveDialog = vscode.window.showSaveDialog as jest.Mock;
      mockShowSaveDialog.mockImplementationOnce(() => Promise.resolve(mockUri));

      await manager.exportShortcuts();

      const mockWriteFile = vscode.workspace.fs.writeFile as jest.Mock;
      const writeCall = mockWriteFile.mock.calls[0];
      const content = (writeCall[1] as Buffer).toString();
      const exported = JSON.parse(content);

      expect(exported['manicMiners.runValidation']).toBe('ctrl+alt+v');
    });
  });

  describe('importShortcuts', () => {
    beforeEach(() => {
      manager.initializeDefaultShortcuts();
    });

    it('should import shortcuts from JSON file', async () => {
      const mockUri = [vscode.Uri.file('/test/shortcuts.json')];
      const mockShowOpenDialog = vscode.window.showOpenDialog as jest.Mock;
      mockShowOpenDialog.mockImplementationOnce(() => Promise.resolve(mockUri));

      const importData = {
        'manicMiners.runValidation': 'ctrl+alt+v',
        'manicMiners.showMapPreview': 'ctrl+alt+p',
      };
      const mockReadFile = vscode.workspace.fs.readFile as jest.Mock;
      mockReadFile.mockImplementationOnce(() =>
        Promise.resolve(Buffer.from(JSON.stringify(importData)))
      );

      await manager.importShortcuts();

      expect(vscode.window.showOpenDialog).toHaveBeenCalledWith({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
          'JSON Files': ['json'],
        },
      });

      expect(mockContext.globalState.update).toHaveBeenCalledWith(
        'customKeyboardShortcuts',
        importData
      );

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Keyboard shortcuts imported successfully. Restart VS Code to apply changes.'
      );
    });

    it('should handle cancelled open dialog', async () => {
      const mockShowOpenDialog = vscode.window.showOpenDialog as jest.Mock;
      mockShowOpenDialog.mockImplementationOnce(() => Promise.resolve(undefined));

      await manager.importShortcuts();

      expect(vscode.workspace.fs.readFile).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON', async () => {
      const mockUri = [vscode.Uri.file('/test/shortcuts.json')];
      const mockShowOpenDialog = vscode.window.showOpenDialog as jest.Mock;
      const mockReadFile = vscode.workspace.fs.readFile as jest.Mock;
      mockShowOpenDialog.mockImplementationOnce(() => Promise.resolve(mockUri));
      mockReadFile.mockImplementationOnce(() => Promise.resolve(Buffer.from('invalid json')));

      await manager.importShortcuts();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        'Failed to import keyboard shortcuts.'
      );
    });
  });

  describe('custom shortcuts persistence', () => {
    it('should load custom shortcuts from global state', () => {
      const customShortcuts = {
        'manicMiners.runValidation': 'ctrl+alt+v',
      };
      (mockContext.globalState.get as jest.Mock).mockReturnValue(customShortcuts);

      // Create new instance to trigger loading
      new KeyboardShortcutManager(mockContext);

      expect(mockContext.globalState.get).toHaveBeenCalledWith('customKeyboardShortcuts');
    });

    it('should save custom shortcuts to global state', async () => {
      manager.initializeDefaultShortcuts();
      await manager.updateShortcut('manicMiners.runValidation', 'ctrl+alt+v');

      expect(mockContext.globalState.update).toHaveBeenCalledWith(
        'customKeyboardShortcuts',
        expect.objectContaining({
          'manicMiners.runValidation': 'ctrl+alt+v',
        })
      );
    });
  });
});
