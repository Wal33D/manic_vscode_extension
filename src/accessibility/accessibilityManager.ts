import * as vscode from 'vscode';

export interface AccessibilityOptions {
  highContrast: boolean;
  screenReaderMode: boolean;
  reducedMotion: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  keyboardNavigation: boolean;
}

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private options: AccessibilityOptions;
  private readonly optionsKey = 'manicMiners.accessibility';

  private constructor(private context: vscode.ExtensionContext) {
    this.options = this.loadOptions();
    this.watchVSCodeSettings();
  }

  public static getInstance(context: vscode.ExtensionContext): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager(context);
    }
    return AccessibilityManager.instance;
  }

  /**
   * Get current accessibility options
   */
  public getOptions(): AccessibilityOptions {
    return { ...this.options };
  }

  /**
   * Update accessibility options
   */
  public async updateOptions(updates: Partial<AccessibilityOptions>): Promise<void> {
    this.options = { ...this.options, ...updates };
    await this.saveOptions();
    this.notifyOptionsChanged();
  }

  /**
   * Check if high contrast mode is enabled
   */
  public isHighContrastEnabled(): boolean {
    return (
      this.options.highContrast ||
      vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast
    );
  }

  /**
   * Check if screen reader mode is enabled
   */
  public isScreenReaderEnabled(): boolean {
    return this.options.screenReaderMode;
  }

  /**
   * Get ARIA attributes for webviews
   */
  public getAriaAttributes(): Record<string, string> {
    const attrs: Record<string, string> = {
      role: 'application',
      'aria-label': 'Manic Miners Map Editor',
    };

    if (this.isScreenReaderEnabled()) {
      attrs['aria-live'] = 'polite';
      attrs['aria-atomic'] = 'true';
    }

    return attrs;
  }

  /**
   * Get CSS classes for accessibility
   */
  public getCssClasses(): string[] {
    const classes: string[] = [];

    if (this.isHighContrastEnabled()) {
      classes.push('high-contrast');
    }

    if (this.options.reducedMotion) {
      classes.push('reduced-motion');
    }

    if (this.options.fontSize !== 'normal') {
      classes.push(`font-${this.options.fontSize}`);
    }

    if (this.options.keyboardNavigation) {
      classes.push('keyboard-nav');
    }

    return classes;
  }

  /**
   * Generate accessible HTML attributes
   */
  public generateHtmlAttributes(): string {
    const attrs = this.getAriaAttributes();
    const classes = this.getCssClasses();

    let html = '';
    for (const [key, value] of Object.entries(attrs)) {
      html += ` ${key}="${value}"`;
    }

    if (classes.length > 0) {
      html += ` class="${classes.join(' ')}"`;
    }

    return html;
  }

  /**
   * Get accessible color scheme
   */
  public getColorScheme(): Record<string, string> {
    if (this.isHighContrastEnabled()) {
      return {
        background: '#000000',
        foreground: '#FFFFFF',
        border: '#FFFFFF',
        accent: '#FFFF00',
        error: '#FF0000',
        warning: '#FFA500',
        success: '#00FF00',
        info: '#00FFFF',
      };
    }

    // Normal color scheme
    return {
      background: 'var(--vscode-editor-background)',
      foreground: 'var(--vscode-editor-foreground)',
      border: 'var(--vscode-panel-border)',
      accent: 'var(--vscode-button-background)',
      error: 'var(--vscode-editorError-foreground)',
      warning: 'var(--vscode-editorWarning-foreground)',
      success: 'var(--vscode-terminal-ansiGreen)',
      info: 'var(--vscode-editorInfo-foreground)',
    };
  }

  /**
   * Announce message to screen reader
   */
  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (this.isScreenReaderEnabled()) {
      // Send to status bar for screen reader
      vscode.window.setStatusBarMessage(message, priority === 'assertive' ? 5000 : 3000);
    }
  }

  /**
   * Load options from storage
   */
  private loadOptions(): AccessibilityOptions {
    const stored = this.context.globalState.get<AccessibilityOptions>(this.optionsKey);
    return (
      stored || {
        highContrast: false,
        screenReaderMode: false,
        reducedMotion: false,
        fontSize: 'normal',
        keyboardNavigation: true,
      }
    );
  }

  /**
   * Save options to storage
   */
  private async saveOptions(): Promise<void> {
    await this.context.globalState.update(this.optionsKey, this.options);
  }

  /**
   * Watch VSCode settings for accessibility changes
   */
  private watchVSCodeSettings(): void {
    // Listen for theme changes
    vscode.window.onDidChangeActiveColorTheme(() => {
      this.notifyOptionsChanged();
    });

    // Check for system preferences
    const config = vscode.workspace.getConfiguration('editor');
    const accessibilitySupport = config.get<string>('accessibilitySupport');
    if (accessibilitySupport === 'on') {
      this.options.screenReaderMode = true;
    }
  }

  /**
   * Notify that options have changed
   */
  private notifyOptionsChanged(): void {
    vscode.commands.executeCommand('manicMiners.accessibilityChanged', this.options);
  }
}
