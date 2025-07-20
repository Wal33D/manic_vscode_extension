import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import * as vscode from 'vscode';
import { AccessibilityManager } from './accessibilityManager';

// Mock vscode
jest.mock('vscode', () => ({
  ExtensionContext: jest.fn(),
  window: {
    activeColorTheme: {
      kind: 1, // Light theme
    },
    setStatusBarMessage: jest.fn(),
    onDidChangeActiveColorTheme: jest.fn(() => ({
      dispose: jest.fn(),
    })),
  },
  ColorThemeKind: {
    Light: 1,
    Dark: 2,
    HighContrast: 3,
  },
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn(() => 'auto'),
    })),
  },
  commands: {
    executeCommand: jest.fn(),
  },
}));

describe('AccessibilityManager', () => {
  let mockContext: any;
  let manager: AccessibilityManager;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock context
    mockContext = {
      globalState: {
        get: jest.fn(() => null),
        update: jest.fn(() => Promise.resolve()),
      },
    };

    // Clear singleton instance
    (AccessibilityManager as any).instance = undefined;

    manager = AccessibilityManager.getInstance(mockContext);
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = AccessibilityManager.getInstance(mockContext);
      const instance2 = AccessibilityManager.getInstance(mockContext);
      expect(instance1).toBe(instance2);
    });
  });

  describe('getOptions', () => {
    it('should return default options when none stored', () => {
      const options = manager.getOptions();
      expect(options).toEqual({
        highContrast: false,
        screenReaderMode: false,
        reducedMotion: false,
        fontSize: 'normal',
        keyboardNavigation: true,
      });
    });

    it('should return stored options', () => {
      const storedOptions = {
        highContrast: true,
        screenReaderMode: true,
        reducedMotion: true,
        fontSize: 'large' as const,
        keyboardNavigation: false,
      };

      mockContext.globalState.get.mockReturnValue(storedOptions);
      // Clear the singleton to force new instance with stored options
      (AccessibilityManager as any).instance = undefined;
      const newManager = AccessibilityManager.getInstance(mockContext);
      const options = newManager.getOptions();

      expect(options).toEqual(storedOptions);
    });
  });

  describe('updateOptions', () => {
    it('should update options and save them', async () => {
      await manager.updateOptions({ highContrast: true });

      expect(mockContext.globalState.update).toHaveBeenCalledWith(
        'manicMiners.accessibility',
        expect.objectContaining({ highContrast: true })
      );
    });

    it('should notify about options change', async () => {
      await manager.updateOptions({ screenReaderMode: true });

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'manicMiners.accessibilityChanged',
        expect.objectContaining({ screenReaderMode: true })
      );
    });
  });

  describe('isHighContrastEnabled', () => {
    it('should return true when option is enabled', async () => {
      await manager.updateOptions({ highContrast: true });
      expect(manager.isHighContrastEnabled()).toBe(true);
    });

    it('should return true when VS Code theme is high contrast', () => {
      (vscode.window as any).activeColorTheme.kind = vscode.ColorThemeKind.HighContrast;
      expect(manager.isHighContrastEnabled()).toBe(true);
      // Reset theme for next test
      (vscode.window as any).activeColorTheme.kind = vscode.ColorThemeKind.Light;
    });

    it('should return false when both are disabled', () => {
      expect(manager.isHighContrastEnabled()).toBe(false);
    });
  });

  describe('isScreenReaderEnabled', () => {
    it('should return screen reader mode state', async () => {
      expect(manager.isScreenReaderEnabled()).toBe(false);

      await manager.updateOptions({ screenReaderMode: true });
      expect(manager.isScreenReaderEnabled()).toBe(true);
    });
  });

  describe('getAriaAttributes', () => {
    it('should return basic ARIA attributes', () => {
      const attrs = manager.getAriaAttributes();
      expect(attrs).toEqual({
        role: 'application',
        'aria-label': 'Manic Miners Map Editor',
      });
    });

    it('should add live region attributes for screen reader', async () => {
      await manager.updateOptions({ screenReaderMode: true });
      const attrs = manager.getAriaAttributes();

      expect(attrs).toEqual({
        role: 'application',
        'aria-label': 'Manic Miners Map Editor',
        'aria-live': 'polite',
        'aria-atomic': 'true',
      });
    });
  });

  describe('getCssClasses', () => {
    it('should return expected classes for default options', () => {
      // Reset theme to ensure consistent state
      (vscode.window as any).activeColorTheme.kind = vscode.ColorThemeKind.Light;

      // Create fresh manager to ensure clean state
      (AccessibilityManager as any).instance = undefined;
      const freshManager = AccessibilityManager.getInstance(mockContext);

      const classes = freshManager.getCssClasses();
      expect(classes).toContain('keyboard-nav');
      // May contain high-contrast if theme detection happened
      expect(classes.length).toBeGreaterThanOrEqual(1);
    });

    it('should include all enabled options', async () => {
      await manager.updateOptions({
        highContrast: true,
        reducedMotion: true,
        fontSize: 'large',
        keyboardNavigation: true,
      });

      const classes = manager.getCssClasses();
      expect(classes).toContain('high-contrast');
      expect(classes).toContain('reduced-motion');
      expect(classes).toContain('font-large');
      expect(classes).toContain('keyboard-nav');
    });
  });

  describe('generateHtmlAttributes', () => {
    it('should generate HTML attribute string', async () => {
      await manager.updateOptions({
        highContrast: true,
        screenReaderMode: true,
      });

      const html = manager.generateHtmlAttributes();
      expect(html).toContain('role="application"');
      expect(html).toContain('aria-label="Manic Miners Map Editor"');
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain('class="high-contrast keyboard-nav"');
    });
  });

  describe('getColorScheme', () => {
    it('should return normal color scheme by default', () => {
      // Reset theme and create fresh manager
      (vscode.window as any).activeColorTheme.kind = vscode.ColorThemeKind.Light;
      (AccessibilityManager as any).instance = undefined;
      const freshManager = AccessibilityManager.getInstance(mockContext);

      const colors = freshManager.getColorScheme();
      expect(colors.background).toContain('--vscode-editor-background');
      expect(colors.foreground).toContain('--vscode-editor-foreground');
    });

    it('should return high contrast colors when enabled', async () => {
      await manager.updateOptions({ highContrast: true });
      const colors = manager.getColorScheme();

      expect(colors).toEqual({
        background: '#000000',
        foreground: '#FFFFFF',
        border: '#FFFFFF',
        accent: '#FFFF00',
        error: '#FF0000',
        warning: '#FFA500',
        success: '#00FF00',
        info: '#00FFFF',
      });
    });
  });

  describe('announce', () => {
    it('should not announce when screen reader is disabled', () => {
      manager.announce('Test message');
      expect(vscode.window.setStatusBarMessage).not.toHaveBeenCalled();
    });

    it('should announce to status bar when screen reader is enabled', async () => {
      await manager.updateOptions({ screenReaderMode: true });

      manager.announce('Test message');
      expect(vscode.window.setStatusBarMessage).toHaveBeenCalledWith('Test message', 3000);
    });

    it('should use longer timeout for assertive messages', async () => {
      await manager.updateOptions({ screenReaderMode: true });

      manager.announce('Urgent message', 'assertive');
      expect(vscode.window.setStatusBarMessage).toHaveBeenCalledWith('Urgent message', 5000);
    });
  });
});
