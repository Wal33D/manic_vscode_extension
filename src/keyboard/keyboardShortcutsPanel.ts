import * as vscode from 'vscode';
import { KeyboardShortcutManager, KeyboardShortcut } from './keyboardShortcuts';

export class KeyboardShortcutsPanel {
  public static currentPanel: KeyboardShortcutsPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private shortcutManager: KeyboardShortcutManager;

  public static createOrShow(extensionUri: vscode.Uri, shortcutManager: KeyboardShortcutManager) {
    const column = vscode.ViewColumn.One;

    // If we already have a panel, show it
    if (KeyboardShortcutsPanel.currentPanel) {
      KeyboardShortcutsPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Create a new panel
    const panel = vscode.window.createWebviewPanel(
      'manicMinersKeyboardShortcuts',
      'Manic Miners Keyboard Shortcuts',
      column,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
      }
    );

    KeyboardShortcutsPanel.currentPanel = new KeyboardShortcutsPanel(
      panel,
      extensionUri,
      shortcutManager
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    shortcutManager: KeyboardShortcutManager
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this.shortcutManager = shortcutManager;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      () => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'updateShortcut':
            this.shortcutManager.updateShortcut(message.command, message.newKey);
            this._update();
            break;
          case 'resetShortcut':
            this.shortcutManager.resetShortcut(message.command);
            this._update();
            break;
          case 'resetAll':
            this.shortcutManager.resetAllShortcuts();
            this._update();
            break;
          case 'export':
            this.shortcutManager.exportShortcuts();
            break;
          case 'import':
            this.shortcutManager.importShortcuts().then(() => this._update());
            break;
          case 'executeCommand':
            vscode.commands.executeCommand(message.command);
            break;
          case 'showInKeybindings':
            vscode.commands.executeCommand(
              'workbench.action.openGlobalKeybindings',
              message.command
            );
            break;
        }
      },
      null,
      this._disposables
    );
  }

  public dispose() {
    KeyboardShortcutsPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'Manic Miners Keyboard Shortcuts';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'keyboardShortcuts.css')
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'keyboardShortcuts.js')
    );

    const shortcutsByCategory = this.shortcutManager.getShortcutsByCategory();
    const categoryOrder = [
      'Navigation',
      'File Management',
      'Editing',
      'Objectives',
      'Validation',
      'Visualization',
      'AI Features',
      'Version Control',
      'Quick Actions',
      'Help',
    ];

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${styleUri}" rel="stylesheet">
      <title>Keyboard Shortcuts</title>
    </head>
    <body>
      <div class="shortcuts-container">
        <header>
          <h1>⌨️ Manic Miners Keyboard Shortcuts</h1>
          <div class="header-actions">
            <button class="action-button" onclick="searchShortcuts()">
              🔍 Search
            </button>
            <button class="action-button" onclick="exportShortcuts()">
              📤 Export
            </button>
            <button class="action-button" onclick="importShortcuts()">
              📥 Import
            </button>
            <button class="action-button danger" onclick="resetAllShortcuts()">
              🔄 Reset All
            </button>
          </div>
        </header>

        <div class="search-container" id="searchContainer" style="display: none;">
          <input 
            type="text" 
            id="searchInput" 
            placeholder="Search shortcuts by command name or key combination..."
            onkeyup="filterShortcuts()"
          />
        </div>

        <div class="shortcuts-content">
          ${categoryOrder
            .map(category => {
              const shortcuts = shortcutsByCategory.get(category);
              if (!shortcuts || shortcuts.length === 0) {
                return '';
              }

              return `
                <div class="category-section">
                  <h2 class="category-title">${this.getCategoryIcon(category)} ${category}</h2>
                  <div class="shortcuts-grid">
                    ${shortcuts.map(shortcut => this.renderShortcut(shortcut)).join('')}
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>

        <div class="tips-section">
          <h3>💡 Tips</h3>
          <ul>
            <li>Press <kbd>Ctrl+K Ctrl+S</kbd> to open VS Code's keyboard shortcuts editor</li>
            <li>Most shortcuts have Mac equivalents using <kbd>Cmd</kbd> instead of <kbd>Ctrl</kbd></li>
            <li>You can customize any shortcut by clicking the edit button</li>
            <li>Use <kbd>Ctrl+Shift+M</kbd> to quickly access all commands</li>
          </ul>
        </div>
      </div>

      <script src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  private renderShortcut(shortcut: KeyboardShortcut): string {
    const isMac = process.platform === 'darwin';
    const key = isMac && shortcut.mac ? shortcut.mac : shortcut.key;

    return `
      <div class="shortcut-item" data-command="${shortcut.command}">
        <div class="shortcut-info">
          <div class="shortcut-description">${shortcut.description}</div>
          <div class="shortcut-command">${shortcut.command}</div>
        </div>
        <div class="shortcut-key">
          <kbd>${this.formatKey(key)}</kbd>
        </div>
        <div class="shortcut-actions">
          <button 
            class="icon-button" 
            title="Try this command"
            onclick="executeCommand('${shortcut.command}')"
          >
            ▶️
          </button>
          <button 
            class="icon-button" 
            title="Edit in VS Code Keybindings"
            onclick="showInKeybindings('${shortcut.command}')"
          >
            ⚙️
          </button>
        </div>
      </div>
    `;
  }

  private formatKey(key: string): string {
    return key
      .split('+')
      .map(part => part.trim())
      .map(part => {
        // Capitalize modifier keys
        if (['ctrl', 'cmd', 'alt', 'shift', 'meta'].includes(part.toLowerCase())) {
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }
        // Handle special keys
        if (part.toLowerCase() === 'space') {
          return 'Space';
        }
        if (part.toLowerCase() === 'tab') {
          return 'Tab';
        }
        if (part.toLowerCase() === 'enter') {
          return 'Enter';
        }
        if (part.toLowerCase() === 'escape') {
          return 'Esc';
        }
        // Handle arrow keys
        if (part.toLowerCase() === 'up') {
          return '↑';
        }
        if (part.toLowerCase() === 'down') {
          return '↓';
        }
        if (part.toLowerCase() === 'left') {
          return '←';
        }
        if (part.toLowerCase() === 'right') {
          return '→';
        }
        // Default
        return part.toUpperCase();
      })
      .join(' + ');
  }

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      Navigation: '🧭',
      'File Management': '📁',
      Editing: '✏️',
      Objectives: '🎯',
      Validation: '✅',
      Visualization: '📊',
      'AI Features': '🤖',
      'Version Control': '📝',
      'Quick Actions': '⚡',
      Help: '❓',
    };
    return icons[category] || '📌';
  }
}
