import * as vscode from 'vscode';

export interface WorkspaceShortcut {
  key: string;
  mac?: string;
  command: string;
  when?: string;
  description: string;
}

export class WorkspaceKeyboardShortcuts {
  private static shortcuts: WorkspaceShortcut[] = [
    // Panel Navigation
    {
      key: 'ctrl+1',
      mac: 'cmd+1',
      command: 'manicMiners.focusPanel.tools',
      description: 'Focus Tools Panel',
      when: 'manicMiners.workspaceActive',
    },
    {
      key: 'ctrl+2',
      mac: 'cmd+2',
      command: 'manicMiners.focusPanel.layers',
      description: 'Focus Layers Panel',
      when: 'manicMiners.workspaceActive',
    },
    {
      key: 'ctrl+3',
      mac: 'cmd+3',
      command: 'manicMiners.focusPanel.properties',
      description: 'Focus Properties Panel',
      when: 'manicMiners.workspaceActive',
    },
    {
      key: 'ctrl+4',
      mac: 'cmd+4',
      command: 'manicMiners.focusPanel.tilePalette',
      description: 'Focus Tile Palette',
      when: 'manicMiners.workspaceActive',
    },

    // Panel Actions
    {
      key: 'ctrl+w',
      mac: 'cmd+w',
      command: 'manicMiners.closeActivePanel',
      description: 'Close Active Panel',
      when: 'manicMiners.panelFocused',
    },
    {
      key: 'ctrl+shift+w',
      mac: 'cmd+shift+w',
      command: 'manicMiners.closeAllPanels',
      description: 'Close All Panels',
      when: 'manicMiners.workspaceActive',
    },
    {
      key: 'ctrl+m',
      mac: 'cmd+m',
      command: 'manicMiners.minimizePanel',
      description: 'Minimize Current Panel',
      when: 'manicMiners.panelFocused',
    },
    {
      key: 'ctrl+shift+m',
      mac: 'cmd+shift+m',
      command: 'manicMiners.maximizePanel',
      description: 'Maximize Current Panel',
      when: 'manicMiners.panelFocused',
    },

    // Layout Management
    {
      key: 'ctrl+l ctrl+s',
      mac: 'cmd+l cmd+s',
      command: 'manicMiners.saveLayout',
      description: 'Save Current Layout',
      when: 'manicMiners.workspaceActive',
    },
    {
      key: 'ctrl+l ctrl+l',
      mac: 'cmd+l cmd+l',
      command: 'manicMiners.loadLayout',
      description: 'Load Layout',
      when: 'manicMiners.workspaceActive',
    },
    {
      key: 'ctrl+l ctrl+r',
      mac: 'cmd+l cmd+r',
      command: 'manicMiners.resetLayout',
      description: 'Reset Layout to Default',
      when: 'manicMiners.workspaceActive',
    },

    // Workspace Presets
    {
      key: 'ctrl+shift+1',
      mac: 'cmd+shift+1',
      command: 'manicMiners.applyPreset.mapping',
      description: 'Apply Mapping Mode Preset',
      when: 'manicMiners.workspaceActive',
    },
    {
      key: 'ctrl+shift+2',
      mac: 'cmd+shift+2',
      command: 'manicMiners.applyPreset.scripting',
      description: 'Apply Scripting Mode Preset',
      when: 'manicMiners.workspaceActive',
    },
    {
      key: 'ctrl+shift+3',
      mac: 'cmd+shift+3',
      command: 'manicMiners.applyPreset.analysis',
      description: 'Apply Analysis Mode Preset',
      when: 'manicMiners.workspaceActive',
    },
    {
      key: 'ctrl+shift+4',
      mac: 'cmd+shift+4',
      command: 'manicMiners.applyPreset.testing',
      description: 'Apply Testing Mode Preset',
      when: 'manicMiners.workspaceActive',
    },

    // Split View
    {
      key: 'ctrl+\\',
      mac: 'cmd+\\',
      command: 'manicMiners.splitHorizontal',
      description: 'Split View Horizontally',
      when: 'manicMiners.workspaceActive',
    },
    {
      key: 'ctrl+shift+\\',
      mac: 'cmd+shift+\\',
      command: 'manicMiners.splitVertical',
      description: 'Split View Vertically',
      when: 'manicMiners.workspaceActive',
    },
    {
      key: 'ctrl+shift+0',
      mac: 'cmd+shift+0',
      command: 'manicMiners.unsplit',
      description: 'Remove Split',
      when: 'manicMiners.splitViewActive',
    },

    // Tab Navigation
    {
      key: 'ctrl+tab',
      command: 'manicMiners.nextTab',
      description: 'Next Tab',
      when: 'manicMiners.tabsActive',
    },
    {
      key: 'ctrl+shift+tab',
      command: 'manicMiners.previousTab',
      description: 'Previous Tab',
      when: 'manicMiners.tabsActive',
    },
    {
      key: 'ctrl+1-9',
      mac: 'cmd+1-9',
      command: 'manicMiners.goToTab',
      description: 'Go to Tab by Number',
      when: 'manicMiners.tabsActive',
    },

    // Tool Selection (Map Editor)
    {
      key: 'p',
      command: 'manicMiners.selectTool.paint',
      description: 'Select Paint Tool',
      when: 'manicMiners.mapEditorFocus',
    },
    {
      key: 'f',
      command: 'manicMiners.selectTool.fill',
      description: 'Select Fill Tool',
      when: 'manicMiners.mapEditorFocus',
    },
    {
      key: 'l',
      command: 'manicMiners.selectTool.line',
      description: 'Select Line Tool',
      when: 'manicMiners.mapEditorFocus',
    },
    {
      key: 'r',
      command: 'manicMiners.selectTool.rectangle',
      description: 'Select Rectangle Tool',
      when: 'manicMiners.mapEditorFocus',
    },
    {
      key: 'e',
      command: 'manicMiners.selectTool.eraser',
      description: 'Select Eraser Tool',
      when: 'manicMiners.mapEditorFocus',
    },
    {
      key: 's',
      command: 'manicMiners.selectTool.select',
      description: 'Select Selection Tool',
      when: 'manicMiners.mapEditorFocus',
    },
    {
      key: 'i',
      command: 'manicMiners.selectTool.picker',
      description: 'Select Picker Tool',
      when: 'manicMiners.mapEditorFocus',
    },

    // Zoom Controls
    {
      key: 'ctrl+=',
      mac: 'cmd+=',
      command: 'manicMiners.zoomIn',
      description: 'Zoom In',
      when: 'manicMiners.canvasActive',
    },
    {
      key: 'ctrl+-',
      mac: 'cmd+-',
      command: 'manicMiners.zoomOut',
      description: 'Zoom Out',
      when: 'manicMiners.canvasActive',
    },
    {
      key: 'ctrl+0',
      mac: 'cmd+0',
      command: 'manicMiners.zoomReset',
      description: 'Reset Zoom',
      when: 'manicMiners.canvasActive',
    },
    {
      key: 'ctrl+shift+0',
      mac: 'cmd+shift+0',
      command: 'manicMiners.zoomFit',
      description: 'Fit to Window',
      when: 'manicMiners.canvasActive',
    },

    // Focus Mode
    {
      key: 'f11',
      command: 'manicMiners.toggleFocusMode',
      description: 'Toggle Focus Mode',
      when: 'manicMiners.workspaceActive',
    },

    // Quick Actions
    {
      key: 'ctrl+shift+p',
      mac: 'cmd+shift+p',
      command: 'manicMiners.showCommandCenter',
      description: 'Show Command Center',
      when: 'manicMiners.extensionActive',
    },
    {
      key: 'ctrl+k ctrl+t',
      mac: 'cmd+k cmd+t',
      command: 'manicMiners.showToolPalette',
      description: 'Show Tool Palette',
      when: 'manicMiners.workspaceActive',
    },

    // Accessibility
    {
      key: 'ctrl+alt+h',
      mac: 'cmd+alt+h',
      command: 'manicMiners.showKeyboardHelp',
      description: 'Show Keyboard Shortcuts Help',
      when: 'manicMiners.workspaceActive',
    },
    {
      key: 'ctrl+alt+n',
      mac: 'cmd+alt+n',
      command: 'manicMiners.announceStatus',
      description: 'Announce Current Status',
      when: 'manicMiners.workspaceActive',
    },
  ];

  public static register(context: vscode.ExtensionContext): void {
    // Register all keyboard shortcuts
    this.shortcuts.forEach(shortcut => {
      const disposable = vscode.commands.registerCommand(shortcut.command, () => {
        this.handleShortcutCommand(shortcut.command);
      });
      context.subscriptions.push(disposable);
    });

    // Register keyboard help command
    const helpCommand = vscode.commands.registerCommand('manicMiners.showKeyboardHelp', () => {
      this.showKeyboardHelp();
    });
    context.subscriptions.push(helpCommand);
  }

  private static handleShortcutCommand(command: string): void {
    // Handle focus panel commands
    if (command.startsWith('manicMiners.focusPanel.')) {
      const panelId = command.replace('manicMiners.focusPanel.', '');
      vscode.commands.executeCommand('manicMiners.workspace.focusPanel', panelId);
      return;
    }

    // Handle preset commands
    if (command.startsWith('manicMiners.applyPreset.')) {
      const presetId = command.replace('manicMiners.applyPreset.', '');
      vscode.commands.executeCommand('manicMiners.workspace.applyPreset', presetId);
      return;
    }

    // Handle tool selection commands
    if (command.startsWith('manicMiners.selectTool.')) {
      const tool = command.replace('manicMiners.selectTool.', '');
      vscode.commands.executeCommand('manicMiners.workspace.selectTool', tool);
      return;
    }

    // Handle other workspace commands
    const workspaceCommands: Record<string, string> = {
      'manicMiners.closeActivePanel': 'closePanel',
      'manicMiners.closeAllPanels': 'closeAllPanels',
      'manicMiners.minimizePanel': 'minimizePanel',
      'manicMiners.maximizePanel': 'maximizePanel',
      'manicMiners.splitHorizontal': 'splitHorizontal',
      'manicMiners.splitVertical': 'splitVertical',
      'manicMiners.unsplit': 'unsplit',
      'manicMiners.nextTab': 'nextTab',
      'manicMiners.previousTab': 'previousTab',
      'manicMiners.zoomIn': 'zoomIn',
      'manicMiners.zoomOut': 'zoomOut',
      'manicMiners.zoomReset': 'zoomReset',
      'manicMiners.zoomFit': 'zoomFit',
      'manicMiners.toggleFocusMode': 'toggleFocusMode',
    };

    const workspaceCommand = workspaceCommands[command];
    if (workspaceCommand) {
      vscode.commands.executeCommand('manicMiners.workspace.command', workspaceCommand);
    }
  }

  private static showKeyboardHelp(): void {
    const panel = vscode.window.createWebviewPanel(
      'keyboardHelp',
      'Workspace Keyboard Shortcuts',
      vscode.ViewColumn.One,
      {
        enableScripts: false,
      }
    );

    const isMac = process.platform === 'darwin';
    const shortcuts = this.shortcuts.map(s => ({
      ...s,
      key: isMac && s.mac ? s.mac : s.key,
    }));

    // Group shortcuts by category
    const categories: Record<string, WorkspaceShortcut[]> = {
      'Panel Navigation': shortcuts.filter(s => s.command.includes('focusPanel')),
      'Panel Actions': shortcuts.filter(
        s => s.command.includes('Panel') && !s.command.includes('focusPanel')
      ),
      'Layout Management': shortcuts.filter(s => s.command.includes('Layout')),
      'Workspace Presets': shortcuts.filter(s => s.command.includes('Preset')),
      'Split View': shortcuts.filter(s => s.command.includes('split')),
      'Tool Selection': shortcuts.filter(s => s.command.includes('selectTool')),
      'Zoom Controls': shortcuts.filter(s => s.command.includes('zoom')),
      Other: shortcuts.filter(
        s =>
          !s.command.includes('Panel') &&
          !s.command.includes('Layout') &&
          !s.command.includes('Preset') &&
          !s.command.includes('split') &&
          !s.command.includes('selectTool') &&
          !s.command.includes('zoom')
      ),
    };

    panel.webview.html = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Keyboard Shortcuts</title>
      <style>
        body {
          font-family: var(--vscode-font-family);
          color: var(--vscode-foreground);
          background: var(--vscode-editor-background);
          padding: 20px;
          line-height: 1.6;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 20px;
        }
        h2 {
          font-size: 18px;
          margin-top: 24px;
          margin-bottom: 12px;
          color: var(--vscode-textLink-foreground);
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          text-align: left;
          padding: 8px 12px;
          border-bottom: 1px solid var(--vscode-panel-border);
        }
        th {
          font-weight: 600;
          background: var(--vscode-editor-selectionBackground);
        }
        tr:hover {
          background: var(--vscode-list-hoverBackground);
        }
        .key {
          font-family: monospace;
          background: var(--vscode-textBlockQuote-background);
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 12px;
        }
        .when {
          font-size: 11px;
          color: var(--vscode-descriptionForeground);
        }
      </style>
    </head>
    <body>
      <h1>Workspace Keyboard Shortcuts</h1>
      ${Object.entries(categories)
        .map(([category, items]) =>
          items.length > 0
            ? `
        <h2>${category}</h2>
        <table>
          <thead>
            <tr>
              <th>Shortcut</th>
              <th>Description</th>
              <th>Context</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                item => `
              <tr>
                <td><span class="key">${item.key}</span></td>
                <td>${item.description}</td>
                <td class="when">${item.when || 'Always'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `
            : ''
        )
        .join('')}
    </body>
    </html>`;
  }

  public static getShortcuts(): WorkspaceShortcut[] {
    return this.shortcuts;
  }

  public static getShortcutForCommand(command: string): WorkspaceShortcut | undefined {
    return this.shortcuts.find(s => s.command === command);
  }
}
