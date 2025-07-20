import * as vscode from 'vscode';
import { AccessibilityManager } from './accessibilityManager';
import { getTileInfo } from '../data/tileDefinitions';
import { getEnhancedTileInfo } from '../data/enhancedTileDefinitions';
import { getExtendedTileInfo } from '../data/extendedTileDefinitions';

/**
 * Register accessibility-related commands
 */
export function registerAccessibilityCommands(context: vscode.ExtensionContext): void {
  const accessibilityManager = AccessibilityManager.getInstance(context);

  // Toggle high contrast mode
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.toggleHighContrast', async () => {
      const options = accessibilityManager.getOptions();
      await accessibilityManager.updateOptions({
        highContrast: !options.highContrast,
      });
      vscode.window.showInformationMessage(
        `High contrast mode ${!options.highContrast ? 'enabled' : 'disabled'}`
      );
    })
  );

  // Toggle screen reader mode
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.toggleScreenReader', async () => {
      const options = accessibilityManager.getOptions();
      await accessibilityManager.updateOptions({
        screenReaderMode: !options.screenReaderMode,
      });
      vscode.window.showInformationMessage(
        `Screen reader mode ${!options.screenReaderMode ? 'enabled' : 'disabled'}`
      );
    })
  );

  // Cycle font size
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.cycleFontSize', async () => {
      const options = accessibilityManager.getOptions();
      const sizes: Array<'normal' | 'large' | 'extra-large'> = ['normal', 'large', 'extra-large'];
      const currentIndex = sizes.indexOf(options.fontSize);
      const nextIndex = (currentIndex + 1) % sizes.length;

      await accessibilityManager.updateOptions({
        fontSize: sizes[nextIndex],
      });
      vscode.window.showInformationMessage(`Font size: ${sizes[nextIndex].replace('-', ' ')}`);
    })
  );

  // Toggle reduced motion
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.toggleReducedMotion', async () => {
      const options = accessibilityManager.getOptions();
      await accessibilityManager.updateOptions({
        reducedMotion: !options.reducedMotion,
      });
      vscode.window.showInformationMessage(
        `Reduced motion ${!options.reducedMotion ? 'enabled' : 'disabled'}`
      );
    })
  );

  // Toggle keyboard navigation
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.toggleKeyboardNavigation', async () => {
      const options = accessibilityManager.getOptions();
      await accessibilityManager.updateOptions({
        keyboardNavigation: !options.keyboardNavigation,
      });
      vscode.window.showInformationMessage(
        `Keyboard navigation ${!options.keyboardNavigation ? 'enabled' : 'disabled'}`
      );
    })
  );

  // Show accessibility options
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.showAccessibilityOptions', async () => {
      const options = accessibilityManager.getOptions();

      const items: vscode.QuickPickItem[] = [
        {
          label: `$(eye) High Contrast: ${options.highContrast ? 'On' : 'Off'}`,
          description: 'Toggle high contrast mode for better visibility',
          picked: options.highContrast,
        },
        {
          label: `$(megaphone) Screen Reader: ${options.screenReaderMode ? 'On' : 'Off'}`,
          description: 'Enable screen reader announcements',
          picked: options.screenReaderMode,
        },
        {
          label: `$(text-size) Font Size: ${options.fontSize.replace('-', ' ')}`,
          description: 'Adjust text size in views',
        },
        {
          label: `$(screen-normal) Reduced Motion: ${options.reducedMotion ? 'On' : 'Off'}`,
          description: 'Disable animations and transitions',
          picked: options.reducedMotion,
        },
        {
          label: `$(keyboard) Keyboard Navigation: ${options.keyboardNavigation ? 'On' : 'Off'}`,
          description: 'Enhanced keyboard navigation support',
          picked: options.keyboardNavigation,
        },
      ];

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select an accessibility option to toggle',
        canPickMany: false,
      });

      if (selected) {
        if (selected.label.includes('High Contrast')) {
          vscode.commands.executeCommand('manicMiners.toggleHighContrast');
        } else if (selected.label.includes('Screen Reader')) {
          vscode.commands.executeCommand('manicMiners.toggleScreenReader');
        } else if (selected.label.includes('Font Size')) {
          vscode.commands.executeCommand('manicMiners.cycleFontSize');
        } else if (selected.label.includes('Reduced Motion')) {
          vscode.commands.executeCommand('manicMiners.toggleReducedMotion');
        } else if (selected.label.includes('Keyboard Navigation')) {
          vscode.commands.executeCommand('manicMiners.toggleKeyboardNavigation');
        }
      }
    })
  );

  // Announce tile information
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.announceTileInfo', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'manicminers') {
        accessibilityManager.announce('No Manic Miners file open', 'assertive');
        return;
      }

      const position = editor.selection.active;
      const line = editor.document.lineAt(position.line).text;

      // Try to find tile ID at cursor position
      const beforeCursor = line.substring(0, position.character);
      const afterCursor = line.substring(position.character);

      const beforeMatch = beforeCursor.match(/(\d+)\s*$/);
      const afterMatch = afterCursor.match(/^\s*(\d+)/);

      let tileId: number | null = null;
      if (beforeMatch && afterMatch) {
        tileId = parseInt(beforeMatch[1] + afterMatch[1]);
      } else if (beforeMatch) {
        tileId = parseInt(beforeMatch[1]);
      } else if (afterMatch) {
        tileId = parseInt(afterMatch[1]);
      }

      if (tileId !== null) {
        // Get tile info
        const tileInfo = getTileDescription(tileId);
        accessibilityManager.announce(
          `Tile ${tileId}: ${tileInfo}. Line ${position.line + 1}, Column ${position.character + 1}`
        );
      } else {
        accessibilityManager.announce(
          `No tile at cursor position. Line ${position.line + 1}, Column ${position.character + 1}`
        );
      }
    })
  );

  // Read current line
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.readCurrentLine', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        accessibilityManager.announce('No active editor', 'assertive');
        return;
      }

      const position = editor.selection.active;
      const line = editor.document.lineAt(position.line);
      const lineNumber = position.line + 1;

      // Check if we're in a section
      let section = 'Unknown section';
      for (let i = position.line; i >= 0; i--) {
        const text = editor.document.lineAt(i).text.trim();
        if (text.endsWith('{')) {
          section = text.replace('{', '').trim();
          break;
        }
      }

      accessibilityManager.announce(
        `Line ${lineNumber} in ${section}: ${line.text || '(empty line)'}`
      );
    })
  );

  // Navigate to next/previous section
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.navigateToNextSection', () => {
      navigateSection(true);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.navigateToPreviousSection', () => {
      navigateSection(false);
    })
  );

  // Listen for accessibility changes from webviews
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.accessibilityChanged', options => {
      // This is called when accessibility options change
      // Update all webviews, status bar, etc.
      vscode.commands.executeCommand(
        'setContext',
        'manicMiners.highContrast',
        options.highContrast
      );
      vscode.commands.executeCommand(
        'setContext',
        'manicMiners.screenReader',
        options.screenReaderMode
      );
    })
  );
}

/**
 * Navigate to next or previous section
 */
function navigateSection(forward: boolean): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'manicminers') {
    return;
  }

  const currentLine = editor.selection.active.line;
  const document = editor.document;
  let targetLine = -1;

  if (forward) {
    // Find next section
    for (let i = currentLine + 1; i < document.lineCount; i++) {
      if (document.lineAt(i).text.trim().endsWith('{')) {
        targetLine = i;
        break;
      }
    }
  } else {
    // Find previous section
    for (let i = currentLine - 1; i >= 0; i--) {
      if (document.lineAt(i).text.trim().endsWith('{')) {
        targetLine = i;
        break;
      }
    }
  }

  if (targetLine >= 0) {
    const position = new vscode.Position(targetLine, 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position));

    const sectionName = document.lineAt(targetLine).text.replace('{', '').trim();
    const accessibilityManager = AccessibilityManager.getInstance(
      (global as unknown as Record<string, vscode.ExtensionContext>).extensionContext
    );
    accessibilityManager.announce(`Navigated to ${sectionName} section`);
  }
}

/**
 * Get human-readable tile description
 */
function getTileDescription(tileId: number): string {
  // Import tile definitions at the top of the file

  const tileInfo =
    getTileInfo(tileId) || getEnhancedTileInfo(tileId) || getExtendedTileInfo(tileId);

  if (tileInfo) {
    let description = tileInfo.name;
    if (tileInfo.category) {
      description += `, ${tileInfo.category}`;
    }
    // Use the actual TileDefinition properties
    if (!tileInfo.canDrill) {
      description += ', cannot be drilled';
    }
    if (!tileInfo.canWalk) {
      description += ', impassable';
    }
    if (tileInfo.category === 'hazard') {
      description += ', hazardous';
    }
    return description;
  }

  return 'Unknown tile';
}
