import * as vscode from 'vscode';
import { eventBus } from './eventBus.js';
import { stateSync, StateKeys } from './stateSync.js';

/**
 * Unified Theme Manager
 * Manages themes across all components with live updates and custom theme support
 */
export class ThemeManager {
  private static instance: ThemeManager;
  private themes: Map<string, Theme> = new Map();
  private activeTheme: string = 'dark';
  private customProperties: Map<string, string> = new Map();
  private themeObservers: Set<ThemeObserver> = new Set();
  private cssVariables: Map<string, string> = new Map();
  // private styleElements: Map<string, HTMLStyleElement> = new Map();

  // Theme transition
  private transitionDuration: number = 300;
  private isTransitioning: boolean = false;

  // Color utilities
  private colorCache: Map<string, ColorInfo> = new Map();

  private constructor() {
    this.initializeDefaultThemes();
    this.setupStateSync();
    this.setupEventListeners();
    this.detectSystemTheme();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Register a theme
   */
  public registerTheme(theme: Theme): void {
    this.themes.set(theme.id, theme);

    // Validate theme
    this.validateTheme(theme);

    // Emit theme registered event
    eventBus.emit('theme:registered', { theme: theme.id });
  }

  /**
   * Apply theme
   */
  public async applyTheme(themeId: string, options?: ApplyThemeOptions): Promise<void> {
    const theme = this.themes.get(themeId);
    if (!theme) {
      throw new Error(`Theme '${themeId}' not found`);
    }

    // Check if already active
    if (this.activeTheme === themeId && !options?.force) {
      return;
    }

    // Start transition
    if (options?.animate && !this.isTransitioning) {
      this.startTransition();
    }

    // Store previous theme
    const previousTheme = this.activeTheme;
    this.activeTheme = themeId;

    // Update state
    stateSync.setState(StateKeys.THEME, themeId, 'themeManager');

    // Apply theme colors
    this.applyThemeColors(theme);

    // Apply custom properties
    this.applyCustomProperties(theme);

    // Update VS Code theme if needed
    if (theme.vscodeTheme) {
      await this.applyVSCodeTheme(theme.vscodeTheme);
    }

    // Notify observers
    this.notifyObservers(theme, previousTheme);

    // Emit theme changed event
    eventBus.emit('theme:changed', {
      theme: themeId,
      previousTheme,
      colors: this.getCurrentColors(),
    });

    // End transition
    if (options?.animate && this.isTransitioning) {
      setTimeout(() => this.endTransition(), this.transitionDuration);
    }
  }

  /**
   * Get current theme
   */
  public getCurrentTheme(): Theme | undefined {
    return this.themes.get(this.activeTheme);
  }

  /**
   * Get theme by ID
   */
  public getTheme(themeId: string): Theme | undefined {
    return this.themes.get(themeId);
  }

  /**
   * Get all themes
   */
  public getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Create custom theme
   */
  public createCustomTheme(config: CustomThemeConfig): Theme {
    const baseTheme = this.themes.get(config.baseTheme || 'dark');
    if (!baseTheme) {
      throw new Error('Base theme not found');
    }

    // Merge with base theme
    const customTheme: Theme = {
      id: config.id,
      name: config.name,
      type: baseTheme.type,
      colors: {
        ...baseTheme.colors,
        ...config.colors,
      },
      custom: {
        ...baseTheme.custom,
        ...config.custom,
      },
      vscodeTheme: config.vscodeTheme || baseTheme.vscodeTheme,
    };

    // Register the custom theme
    this.registerTheme(customTheme);

    // Save to workspace settings
    this.saveCustomTheme(customTheme);

    return customTheme;
  }

  /**
   * Update theme property
   */
  public updateThemeProperty(property: string, value: string): void {
    this.customProperties.set(property, value);
    this.applyCSSVariable(property, value);

    // Emit property updated event
    eventBus.emit('theme:propertyUpdated', { property, value });
  }

  /**
   * Get theme color
   */
  public getColor(colorKey: string): string | undefined {
    const theme = this.getCurrentTheme();
    if (!theme) {
      return undefined;
    }

    // Check nested paths (e.g., 'editor.background')
    const keys = colorKey.split('.');
    let value: any = theme.colors;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return typeof value === 'string' ? value : undefined;
  }

  /**
   * Get computed color
   */
  public getComputedColor(color: string): ColorInfo {
    // Check cache
    if (this.colorCache.has(color)) {
      return this.colorCache.get(color)!;
    }

    // Compute color info
    const info = this.computeColorInfo(color);
    this.colorCache.set(color, info);

    return info;
  }

  /**
   * Observe theme changes
   */
  public observe(observer: ThemeObserver): Unsubscribe {
    this.themeObservers.add(observer);

    // Call immediately with current theme
    const currentTheme = this.getCurrentTheme();
    if (currentTheme) {
      observer(currentTheme, undefined);
    }

    return () => {
      this.themeObservers.delete(observer);
    };
  }

  /**
   * Generate CSS for current theme
   */
  public generateCSS(): string {
    const theme = this.getCurrentTheme();
    if (!theme) {
      return '';
    }

    let css = ':root {\n';

    // Add color variables
    const addColors = (obj: any, prefix: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          const varName = `--${prefix}${key}`.replace(/([A-Z])/g, '-$1').toLowerCase();
          css += `  ${varName}: ${value};\n`;
        } else if (typeof value === 'object') {
          addColors(value, `${prefix}${key}-`);
        }
      }
    };

    addColors(theme.colors);

    // Add custom properties
    if (theme.custom) {
      for (const [key, value] of Object.entries(theme.custom)) {
        css += `  --${key}: ${value};\n`;
      }
    }

    // Add computed properties
    css += this.generateComputedProperties(theme);

    css += '}\n\n';

    // Add theme-specific styles
    if (theme.styles) {
      css += theme.styles;
    }

    return css;
  }

  /**
   * Export theme
   */
  public exportTheme(themeId: string): string {
    const theme = this.themes.get(themeId);
    if (!theme) {
      throw new Error(`Theme '${themeId}' not found`);
    }

    return JSON.stringify(theme, null, 2);
  }

  /**
   * Import theme
   */
  public importTheme(themeData: string): Theme {
    try {
      const theme = JSON.parse(themeData) as Theme;
      this.validateTheme(theme);
      this.registerTheme(theme);
      return theme;
    } catch (error) {
      throw new Error(`Failed to import theme: ${error}`);
    }
  }

  /**
   * Initialize default themes
   */
  private initializeDefaultThemes(): void {
    // Dark theme
    this.registerTheme({
      id: 'dark',
      name: 'Dark',
      type: 'dark',
      colors: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        primary: '#007acc',
        secondary: '#3794ff',
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#2196f3',

        editor: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          lineHighlight: '#2a2a2a',
          selection: '#264f78',
          cursor: '#aeafad',
          whitespace: '#3b3b3b',
        },

        panel: {
          background: '#252526',
          border: '#3c3c3c',
          header: '#2d2d30',
          active: '#094771',
        },

        button: {
          background: '#0e639c',
          foreground: '#ffffff',
          hover: '#1177bb',
          disabled: '#5a5a5a',
        },

        input: {
          background: '#3c3c3c',
          foreground: '#cccccc',
          border: '#3c3c3c',
          placeholder: '#7a7a7a',
        },
      },

      custom: {
        shadowColor: 'rgba(0, 0, 0, 0.25)',
        borderRadius: '4px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '13px',
        lineHeight: '1.5',
      },

      vscodeTheme: 'Default Dark+',
    });

    // Light theme
    this.registerTheme({
      id: 'light',
      name: 'Light',
      type: 'light',
      colors: {
        background: '#ffffff',
        foreground: '#333333',
        primary: '#0066cc',
        secondary: '#0099ff',
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#2196f3',

        editor: {
          background: '#ffffff',
          foreground: '#333333',
          lineHighlight: '#f5f5f5',
          selection: '#add6ff',
          cursor: '#333333',
          whitespace: '#e8e8e8',
        },

        panel: {
          background: '#f3f3f3',
          border: '#e5e5e5',
          header: '#e8e8e8',
          active: '#e0ebf5',
        },

        button: {
          background: '#0066cc',
          foreground: '#ffffff',
          hover: '#0052a3',
          disabled: '#cccccc',
        },

        input: {
          background: '#ffffff',
          foreground: '#333333',
          border: '#d6d6d6',
          placeholder: '#999999',
        },
      },

      custom: {
        shadowColor: 'rgba(0, 0, 0, 0.15)',
        borderRadius: '4px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '13px',
        lineHeight: '1.5',
      },

      vscodeTheme: 'Default Light+',
    });

    // High contrast theme
    this.registerTheme({
      id: 'highContrast',
      name: 'High Contrast',
      type: 'highContrast',
      colors: {
        background: '#000000',
        foreground: '#ffffff',
        primary: '#00ffff',
        secondary: '#ffff00',
        success: '#00ff00',
        warning: '#ffff00',
        error: '#ff0000',
        info: '#00ffff',

        editor: {
          background: '#000000',
          foreground: '#ffffff',
          lineHighlight: '#333333',
          selection: '#ffff00',
          cursor: '#ffffff',
          whitespace: '#666666',
        },

        panel: {
          background: '#000000',
          border: '#ffffff',
          header: '#333333',
          active: '#ffff00',
        },

        button: {
          background: '#ffffff',
          foreground: '#000000',
          hover: '#ffff00',
          disabled: '#666666',
        },

        input: {
          background: '#000000',
          foreground: '#ffffff',
          border: '#ffffff',
          placeholder: '#cccccc',
        },
      },

      custom: {
        shadowColor: 'none',
        borderRadius: '0',
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '14px',
        lineHeight: '1.6',
        borderWidth: '2px',
      },

      vscodeTheme: 'Default High Contrast',
    });
  }

  /**
   * Apply theme colors
   */
  private applyThemeColors(theme: Theme): void {
    this.cssVariables.clear();

    const processColors = (obj: any, prefix: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          const varName = `--${prefix}${key}`.replace(/([A-Z])/g, '-$1').toLowerCase();
          this.cssVariables.set(varName, value);
        } else if (typeof value === 'object') {
          processColors(value, `${prefix}${key}-`);
        }
      }
    };

    processColors(theme.colors);

    // Apply CSS variables
    for (const [name, value] of this.cssVariables) {
      this.applyCSSVariable(name, value);
    }
  }

  /**
   * Apply custom properties
   */
  private applyCustomProperties(theme: Theme): void {
    if (!theme.custom) {
      return;
    }

    for (const [key, value] of Object.entries(theme.custom)) {
      const varName = `--${key}`;
      this.applyCSSVariable(varName, value);
    }
  }

  /**
   * Apply CSS variable
   */
  private applyCSSVariable(name: string, value: string): void {
    // Apply to all webviews
    // const panels = vscode.window.visibleTextEditors;

    // Send to all webviews via event bus
    eventBus.emit('theme:cssVariable', { name, value });

    // Store for new webviews
    this.customProperties.set(name, value);
  }

  /**
   * Apply VS Code theme
   */
  private async applyVSCodeTheme(themeName: string): Promise<void> {
    try {
      await vscode.workspace
        .getConfiguration()
        .update('workbench.colorTheme', themeName, vscode.ConfigurationTarget.Workspace);
    } catch (error) {
      console.error('Failed to apply VS Code theme:', error);
    }
  }

  /**
   * Setup state sync
   */
  private setupStateSync(): void {
    // Subscribe to theme state changes
    stateSync.subscribe(StateKeys.THEME, theme => {
      if (typeof theme === 'string' && theme !== this.activeTheme) {
        this.applyTheme(theme);
      }
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for VS Code theme changes
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('workbench.colorTheme')) {
        this.handleVSCodeThemeChange();
      }
    });

    // Listen for webview requests
    eventBus.on('theme:request', {
      callback: (_data: any) => {
        eventBus.emit('theme:response', {
          theme: this.activeTheme,
          css: this.generateCSS(),
          colors: this.getCurrentColors(),
        });
      },
    });
  }

  /**
   * Detect system theme
   */
  private detectSystemTheme(): void {
    const config = vscode.workspace.getConfiguration('window');
    const autoDetect = config.get('autoDetectColorScheme', false);

    if (autoDetect) {
      // Check VS Code's current theme
      const currentTheme = vscode.workspace
        .getConfiguration()
        .get('workbench.colorTheme') as string;

      if (currentTheme.toLowerCase().includes('light')) {
        this.activeTheme = 'light';
      } else if (currentTheme.toLowerCase().includes('contrast')) {
        this.activeTheme = 'highContrast';
      } else {
        this.activeTheme = 'dark';
      }
    }
  }

  /**
   * Handle VS Code theme change
   */
  private handleVSCodeThemeChange(): void {
    const currentVSCodeTheme = vscode.workspace
      .getConfiguration()
      .get('workbench.colorTheme') as string;

    // Find matching theme
    for (const theme of this.themes.values()) {
      if (theme.vscodeTheme === currentVSCodeTheme) {
        this.applyTheme(theme.id);
        return;
      }
    }
  }

  /**
   * Validate theme
   */
  private validateTheme(theme: Theme): void {
    const requiredColors = ['background', 'foreground', 'primary'];

    for (const color of requiredColors) {
      if (!theme.colors[color]) {
        throw new Error(`Theme '${theme.id}' missing required color: ${color}`);
      }
    }
  }

  /**
   * Generate computed properties
   */
  private generateComputedProperties(theme: Theme): string {
    let css = '';

    // Generate opacity variants
    const opacityLevels = [10, 20, 30, 40, 50, 60, 70, 80, 90];

    for (const level of opacityLevels) {
      const alpha = (level / 100).toFixed(2);
      css += `  --opacity-${level}: ${alpha};\n`;
    }

    // Generate color variants
    const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info'];

    for (const colorName of colors) {
      const color = theme.colors[colorName];
      if (color) {
        const colorInfo = this.getComputedColor(color);

        // Lighter variants
        css += `  --${colorName}-light: ${colorInfo.lighter};\n`;
        css += `  --${colorName}-lighter: ${colorInfo.muchLighter};\n`;

        // Darker variants
        css += `  --${colorName}-dark: ${colorInfo.darker};\n`;
        css += `  --${colorName}-darker: ${colorInfo.muchDarker};\n`;

        // Alpha variants
        css += `  --${colorName}-10: ${colorInfo.alpha10};\n`;
        css += `  --${colorName}-20: ${colorInfo.alpha20};\n`;
        css += `  --${colorName}-50: ${colorInfo.alpha50};\n`;
      }
    }

    return css;
  }

  /**
   * Compute color information
   */
  private computeColorInfo(color: string): ColorInfo {
    // Parse color
    const rgb = this.parseColor(color);

    return {
      original: color,
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hex: this.rgbToHex(rgb),
      lighter: this.adjustBrightness(rgb, 0.2),
      muchLighter: this.adjustBrightness(rgb, 0.4),
      darker: this.adjustBrightness(rgb, -0.2),
      muchDarker: this.adjustBrightness(rgb, -0.4),
      alpha10: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
      alpha20: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
      alpha50: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`,
      contrast: this.getContrastColor(rgb),
    };
  }

  /**
   * Parse color string to RGB
   */
  private parseColor(color: string): RGB {
    // Hex color
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return { r, g, b };
    }

    // RGB color
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
      };
    }

    // Default to black
    return { r: 0, g: 0, b: 0 };
  }

  /**
   * Convert RGB to hex
   */
  private rgbToHex(rgb: RGB): string {
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }

  /**
   * Adjust brightness
   */
  private adjustBrightness(rgb: RGB, factor: number): string {
    const adjust = (value: number) => {
      const adjusted = factor > 0 ? value + (255 - value) * factor : value + value * factor;
      return Math.round(Math.max(0, Math.min(255, adjusted)));
    };

    return `rgb(${adjust(rgb.r)}, ${adjust(rgb.g)}, ${adjust(rgb.b)})`;
  }

  /**
   * Get contrast color
   */
  private getContrastColor(rgb: RGB): string {
    // Calculate luminance
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  /**
   * Get current colors
   */
  private getCurrentColors(): Record<string, string> {
    const colors: Record<string, string> = {};

    for (const [name, value] of this.cssVariables) {
      colors[name] = value;
    }

    for (const [name, value] of this.customProperties) {
      colors[name] = value;
    }

    return colors;
  }

  /**
   * Start theme transition
   */
  private startTransition(): void {
    this.isTransitioning = true;
    eventBus.emit('theme:transitionStart');
  }

  /**
   * End theme transition
   */
  private endTransition(): void {
    this.isTransitioning = false;
    eventBus.emit('theme:transitionEnd');
  }

  /**
   * Notify theme observers
   */
  private notifyObservers(theme: Theme, previousTheme: string): void {
    const previous = this.themes.get(previousTheme);

    for (const observer of this.themeObservers) {
      try {
        observer(theme, previous);
      } catch (error) {
        console.error('Error in theme observer:', error);
      }
    }
  }

  /**
   * Save custom theme
   */
  private async saveCustomTheme(theme: Theme): Promise<void> {
    try {
      const customThemes = vscode.workspace
        .getConfiguration()
        .get<Record<string, Theme>>('manicMiners.customThemes', {});
      customThemes[theme.id] = theme;

      await vscode.workspace
        .getConfiguration()
        .update('manicMiners.customThemes', customThemes, vscode.ConfigurationTarget.Workspace);
    } catch (error) {
      console.error('Failed to save custom theme:', error);
    }
  }
}

// Type definitions
export interface Theme {
  id: string;
  name: string;
  type: 'light' | 'dark' | 'highContrast';
  colors: ThemeColors;
  custom?: Record<string, string>;
  styles?: string;
  vscodeTheme?: string;
}

export interface ThemeColors {
  // Base colors
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;

  // Component-specific colors
  editor?: {
    background: string;
    foreground: string;
    lineHighlight: string;
    selection: string;
    cursor: string;
    whitespace: string;
    [key: string]: string;
  };

  panel?: {
    background: string;
    border: string;
    header: string;
    active: string;
    [key: string]: string;
  };

  button?: {
    background: string;
    foreground: string;
    hover: string;
    disabled: string;
    [key: string]: string;
  };

  input?: {
    background: string;
    foreground: string;
    border: string;
    placeholder: string;
    [key: string]: string;
  };

  [key: string]: any;
}

export interface CustomThemeConfig {
  id: string;
  name: string;
  baseTheme?: string;
  colors?: Partial<ThemeColors>;
  custom?: Record<string, string>;
  vscodeTheme?: string;
}

export interface ApplyThemeOptions {
  animate?: boolean;
  force?: boolean;
}

export interface ColorInfo {
  original: string;
  rgb: string;
  hex: string;
  lighter: string;
  muchLighter: string;
  darker: string;
  muchDarker: string;
  alpha10: string;
  alpha20: string;
  alpha50: string;
  contrast: string;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

export type ThemeObserver = (theme: Theme, previousTheme?: Theme) => void;
export type Unsubscribe = () => void;

// Export singleton instance
export const themeManager = ThemeManager.getInstance();

// Theme utilities
export function createThemeCSS(_theme: Theme): string {
  return themeManager.generateCSS();
}

export function getThemeColor(colorPath: string): string | undefined {
  return themeManager.getColor(colorPath);
}

export function applyThemeToWebview(webview: vscode.Webview): void {
  const css = themeManager.generateCSS();
  webview.postMessage({
    type: 'theme:apply',
    css,
    theme: themeManager.getCurrentTheme(),
  });
}
