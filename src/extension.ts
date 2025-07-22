import * as vscode from 'vscode';
import { DatCompletionItemProvider } from './completionItemProvider';
import { DatHoverProvider } from './hoverProvider';
import { DatDefinitionProvider } from './definitionProvider';
import { DatReferenceProvider } from './referenceProvider';
import { MapPreviewProvider } from './mapPreview/mapPreviewProvider';
import {
  QuickActionsProvider,
  registerQuickActionsCommands,
} from './quickActions/quickActionsProvider';
import { registerMapTemplateCommands } from './mapTemplates/mapTemplatesProvider';
import { CustomTileSetsManager } from './quickActions/customTileSets';
import { MapDiagnosticProvider } from './validation/diagnosticProvider';
import { registerValidationCommands } from './validation/validationCommands';
import { ObjectiveBuilderProvider } from './objectiveBuilder/objectiveBuilderProvider';
import { registerObjectiveCommands } from './objectiveBuilder/objectiveCommands';
import { AutoFixProvider } from './validation/autoFixProvider';
import { UndoRedoProvider } from './undoRedo/undoRedoProvider';
import { registerEnhancedQuickActionsCommands } from './quickActions/quickActionsEnhanced';
import {
  SmartSuggestionProvider,
  registerSmartSuggestionCommands,
} from './smartSuggestions/smartSuggestionProvider';
import { MapVersionControl } from './versionControl/mapVersionControl';
import { MapDiffProvider } from './versionControl/mapDiffProvider';
import { registerVersionControlCommands } from './versionControl/versionControlCommands';
import { AccessibilityManager } from './accessibility/accessibilityManager';
import { AccessibleMapPreviewProvider } from './accessibility/accessibleMapPreview';
import { registerAccessibilityCommands } from './accessibility/accessibilityCommands';
import { HeatMapProvider } from './heatmap/heatMapProvider';
import { Terrain3DProvider } from './terrain3d/terrain3DProvider';
import { registerLevelGeneratorCommands } from './levelGenerators/levelGeneratorProvider';
import { WelcomePageProvider } from './welcomePage';
// Import package metadata for welcome/version tracking
import { registerScriptPatternCommands } from './commands/scriptPatternCommands';
import { registerMapEditorCommands } from './mapEditor/mapEditorCommands';
import { MapEditorProvider } from './mapEditor/mapEditorProvider';
import { MapsExplorerProvider } from './views/mapsExplorerProvider';
import { TilePaletteProvider } from './views/tilePaletteProvider';
import { ScriptSnippetsProvider } from './views/scriptSnippetsProvider';
import { ValidationProvider } from './views/validationProvider';
import { DashboardProvider } from './views/dashboardProvider';
import { StatusBarManager } from './statusBar/statusBarManager';
import { CommandPaletteProvider } from './commands/commandPaletteProvider';
import { CommandTipsProvider } from './commands/commandTipsProvider';
import { KeyboardShortcutManager } from './keyboard/keyboardShortcuts';
import { KeyboardShortcutsPanel } from './keyboard/keyboardShortcutsPanel';
import { registerContextMenuCommands } from './contextMenus/contextMenuCommands';

export async function activate(context: vscode.ExtensionContext) {
  // Store context globally for accessibility manager
  (global as unknown as Record<string, vscode.ExtensionContext>).extensionContext = context;
  // Extension activated successfully

  // Initialize welcome page provider and command
  const welcomePageProvider = new WelcomePageProvider(context);
  const showWelcomeCommand = vscode.commands.registerCommand('manicMiners.showWelcome', () => {
    welcomePageProvider.show();
  });
  context.subscriptions.push(showWelcomeCommand);

  // Always show welcome page on activation
  await welcomePageProvider.show();

  // Register new file command
  const newFileCommand = vscode.commands.registerCommand('manicMiners.newFile', async () => {
    const content = `info{
Title=New Map
Author=Unknown
Description=A new Manic Miners map
}

tiles{
4 4 4 4 4 4 4 4 4 4
4 1 1 1 1 1 1 1 1 4
4 1 0 0 0 0 0 0 1 4
4 1 0 0 0 0 0 0 1 4
4 1 0 0 0 0 0 0 1 4
4 1 0 0 0 0 0 0 1 4
4 1 0 0 0 0 0 0 1 4
4 1 0 0 0 0 0 0 1 4
4 1 1 1 1 1 1 1 1 4
4 4 4 4 4 4 4 4 4 4
}

height{
5 5 5 5 5 5 5 5 5 5
5 3 3 3 3 3 3 3 3 5
5 3 0 0 0 0 0 0 3 5
5 3 0 0 0 0 0 0 3 5
5 3 0 0 0 0 0 0 3 5
5 3 0 0 0 0 0 0 3 5
5 3 0 0 0 0 0 0 3 5
5 3 0 0 0 0 0 0 3 5
5 3 3 3 3 3 3 3 3 5
5 5 5 5 5 5 5 5 5 5
}

resources{
crystals: 5,5,10
}

buildings{
ToolStore: 5,4,1,1,1
}

objectives{
resources: crystals,5
}

script{
; Your script here
}`;

    const doc = await vscode.workspace.openTextDocument({
      content,
      language: 'manicminers',
    });
    await vscode.window.showTextDocument(doc);
  });
  context.subscriptions.push(newFileCommand);

  // Register show commands command
  const showCommandsCommand = vscode.commands.registerCommand('manicMiners.showCommands', () => {
    vscode.commands.executeCommand('workbench.action.showCommands', 'Manic Miners');
  });
  context.subscriptions.push(showCommandsCommand);

  const disposable = vscode.commands.registerCommand('dat.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from Manic Miners Dat File!');
  });

  context.subscriptions.push(disposable);

  // Command to show map preview
  const showMapPreviewCommand = vscode.commands.registerCommand(
    'manicMiners.showMapPreview',
    () => {
      vscode.commands.executeCommand('manicMiners.mapPreview.focus');
    }
  );

  context.subscriptions.push(showMapPreviewCommand);

  // Initialize Accessibility Manager
  AccessibilityManager.getInstance(context);

  // Register Map Preview Provider with accessibility support
  const mapPreviewProvider = new AccessibleMapPreviewProvider(context.extensionUri, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(MapPreviewProvider.viewType, mapPreviewProvider)
  );

  // Update map preview when active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && editor.document.languageId === 'manicminers') {
        mapPreviewProvider.updateDocument(editor.document);
      }
    })
  );

  // Update map preview when document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => {
      if (
        e.document.languageId === 'manicminers' &&
        e.document === vscode.window.activeTextEditor?.document
      ) {
        mapPreviewProvider.updateDocument(e.document);
      }
    })
  );

  // Initialize with current document
  if (vscode.window.activeTextEditor?.document.languageId === 'manicminers') {
    mapPreviewProvider.updateDocument(vscode.window.activeTextEditor.document);
  }

  const completionItemProvider = vscode.languages.registerCompletionItemProvider(
    { scheme: 'file', language: 'manicminers' },
    new DatCompletionItemProvider(),
    ...[' ']
  );

  context.subscriptions.push(completionItemProvider);

  const hoverProvider = vscode.languages.registerHoverProvider(
    { scheme: 'file', language: 'manicminers' },
    new DatHoverProvider(context.extensionPath)
  );

  context.subscriptions.push(hoverProvider);

  const definitionProvider = vscode.languages.registerDefinitionProvider(
    { scheme: 'file', language: 'manicminers' },
    new DatDefinitionProvider()
  );

  context.subscriptions.push(definitionProvider);

  const referenceProvider = vscode.languages.registerReferenceProvider(
    { scheme: 'file', language: 'manicminers' },
    new DatReferenceProvider()
  );

  context.subscriptions.push(referenceProvider);

  // Create tile sets manager
  const tileSetsManager = new CustomTileSetsManager(context);

  // Create undo/redo provider
  const undoRedoProvider = new UndoRedoProvider(context);

  // Register Quick Actions Provider
  const quickActionsProvider = vscode.languages.registerCodeActionsProvider(
    { scheme: 'file', language: 'manicminers' },
    new QuickActionsProvider(tileSetsManager),
    {
      providedCodeActionKinds: QuickActionsProvider.providedCodeActionKinds,
    }
  );

  context.subscriptions.push(quickActionsProvider);

  // Register Quick Actions Commands (keeping original for backward compatibility)
  registerQuickActionsCommands(context, tileSetsManager);

  // Register Enhanced Quick Actions Commands with undo/redo support
  registerEnhancedQuickActionsCommands(context, tileSetsManager, undoRedoProvider);

  // Register Map Template Commands
  registerMapTemplateCommands(context);

  // Register Map Validation
  MapDiagnosticProvider.register(context);
  registerValidationCommands(context);

  // Register Auto-Fix Provider
  const autoFixProvider = vscode.languages.registerCodeActionsProvider(
    { scheme: 'file', language: 'manicminers' },
    new AutoFixProvider(),
    {
      providedCodeActionKinds: AutoFixProvider.providedCodeActionKinds,
    }
  );
  context.subscriptions.push(autoFixProvider);

  // Register Smart Suggestion Provider
  const smartSuggestionProvider = vscode.languages.registerCodeActionsProvider(
    { scheme: 'file', language: 'manicminers' },
    new SmartSuggestionProvider(),
    {
      providedCodeActionKinds: SmartSuggestionProvider.providedCodeActionKinds,
    }
  );
  context.subscriptions.push(smartSuggestionProvider);

  // Register Smart Suggestion Commands
  registerSmartSuggestionCommands(context);

  // Register Script Pattern Commands
  registerScriptPatternCommands(context);

  // Register Map Editor
  registerMapEditorCommands(context);

  // Register Map Editor Provider
  context.subscriptions.push(MapEditorProvider.register(context));

  // Register Objective Builder Provider
  const objectiveBuilderProvider = new ObjectiveBuilderProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ObjectiveBuilderProvider.viewType,
      objectiveBuilderProvider
    )
  );

  // Register Objective Commands
  registerObjectiveCommands(context);

  // Register Version Control
  const versionControl = new MapVersionControl(context);

  // Register Map Diff Provider
  const mapDiffProvider = new MapDiffProvider(
    context.extensionUri,
    hash => versionControl.getVersion(hash),
    (from, to) => versionControl.getDiff(from, to)
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('manicMiners.mapDiff', mapDiffProvider)
  );

  // Register Version Control Commands
  registerVersionControlCommands(context, versionControl, mapDiffProvider);

  // Register Accessibility Commands
  registerAccessibilityCommands(context);

  // Register Level Generator Commands
  registerLevelGeneratorCommands(context);

  // Register Heat Map Provider
  const heatMapProvider = new HeatMapProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(HeatMapProvider.viewType, heatMapProvider)
  );

  // Update heat map when active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && editor.document.languageId === 'manicminers') {
        heatMapProvider.updateDocument(editor.document);
      }
    })
  );

  // Update heat map when document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => {
      if (
        e.document.languageId === 'manicminers' &&
        e.document === vscode.window.activeTextEditor?.document
      ) {
        heatMapProvider.updateDocument(e.document);
      }
    })
  );

  // Initialize heat map with current document
  if (vscode.window.activeTextEditor?.document.languageId === 'manicminers') {
    heatMapProvider.updateDocument(vscode.window.activeTextEditor.document);
  }

  // Register heat map command
  const showHeatMapCommand = vscode.commands.registerCommand('manicMiners.showHeatMap', () => {
    vscode.commands.executeCommand('manicMiners.heatMap.focus');
  });
  context.subscriptions.push(showHeatMapCommand);

  // Register 3D Terrain Provider
  const terrain3DProvider = new Terrain3DProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(Terrain3DProvider.viewType, terrain3DProvider)
  );

  // Update 3D terrain when active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && editor.document.languageId === 'manicminers') {
        terrain3DProvider.updateDocument(editor.document);
      }
    })
  );

  // Update 3D terrain when document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => {
      if (
        e.document.languageId === 'manicminers' &&
        e.document === vscode.window.activeTextEditor?.document
      ) {
        terrain3DProvider.updateDocument(e.document);
      }
    })
  );

  // Initialize 3D terrain with current document
  if (vscode.window.activeTextEditor?.document.languageId === 'manicminers') {
    terrain3DProvider.updateDocument(vscode.window.activeTextEditor.document);
  }

  // Register 3D terrain command
  const show3DTerrainCommand = vscode.commands.registerCommand('manicMiners.show3DTerrain', () => {
    vscode.commands.executeCommand('manicMiners.terrain3D.focus');
  });
  context.subscriptions.push(show3DTerrainCommand);

  // Register Dashboard Provider
  context.subscriptions.push(DashboardProvider.register(context));

  // Register dashboard command
  const showDashboardCommand = vscode.commands.registerCommand('manicMiners.showDashboard', () => {
    vscode.commands.executeCommand('manicMiners.dashboard.focus');
  });
  context.subscriptions.push(showDashboardCommand);

  // Initialize Status Bar Manager
  const statusBarManager = new StatusBarManager();
  context.subscriptions.push(statusBarManager);

  // Update status bar when active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      statusBarManager.updateActiveDocument(editor?.document);
    })
  );

  // Initialize Command Palette System
  const commandPalette = CommandPaletteProvider.getInstance(context);
  commandPalette.initializeDefaultCommands();

  // Initialize Command Search (for future use)
  // const commandSearch = new CommandSearchProvider(commandPalette);

  // Initialize Command Tips
  const commandTips = new CommandTipsProvider(context);

  // Register enhanced command palette command
  const showEnhancedCommandPaletteCmd = vscode.commands.registerCommand(
    'manicMiners.showEnhancedCommandPalette',
    () => {
      commandPalette.showCommandPalette();
    }
  );
  context.subscriptions.push(showEnhancedCommandPaletteCmd);

  // Register command tips command
  const showCommandTipsCmd = vscode.commands.registerCommand(
    'manicMiners.showCommandTips',
    async () => {
      const tip = await commandTips.getContextualTip();
      if (tip) {
        await commandTips.showTip(tip);
      }
    }
  );
  context.subscriptions.push(showCommandTipsCmd);

  // Show daily tip on startup
  const dailyTip = commandTips.getDailyTip();
  setTimeout(() => {
    commandTips.showTipInStatusBar(dailyTip);
  }, 5000);

  // Initialize Keyboard Shortcuts Manager
  const keyboardShortcutManager = new KeyboardShortcutManager(context);
  keyboardShortcutManager.initializeDefaultShortcuts();

  // Register keyboard shortcuts panel command
  const showKeyboardShortcutsCmd = vscode.commands.registerCommand(
    'manicMiners.showKeyboardShortcuts',
    () => {
      KeyboardShortcutsPanel.createOrShow(context.extensionUri, keyboardShortcutManager);
    }
  );
  context.subscriptions.push(showKeyboardShortcutsCmd);

  // Register Workspace Provider (replaces floating panels)
  const { WorkspaceProvider } = await import('./workspace/workspaceProvider.js');
  const workspaceProvider = new WorkspaceProvider(context.extensionUri, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(WorkspaceProvider.viewType, workspaceProvider)
  );

  // Register workspace commands
  const showWorkspaceCmd = vscode.commands.registerCommand('manicMiners.showWorkspace', () => {
    vscode.commands.executeCommand('manicMiners.workspace.focus');
  });
  context.subscriptions.push(showWorkspaceCmd);

  const resetWorkspaceCmd = vscode.commands.registerCommand('manicMiners.resetWorkspace', () => {
    vscode.window
      .showWarningMessage('Reset workspace to default layout?', 'Yes', 'No')
      .then(answer => {
        if (answer === 'Yes') {
          workspaceProvider.dispose();
          vscode.commands.executeCommand('manicMiners.workspace.focus');
        }
      });
  });
  context.subscriptions.push(resetWorkspaceCmd);

  // Register tool selection command
  const selectToolCmd = vscode.commands.registerCommand(
    'manicMiners.selectTool',
    (tool: string) => {
      // Update selected tool in workspace
      statusBarManager.updateStatusBarItem({ selectedTile: `Tool: ${tool}` });
      // Show notification for demo
      vscode.window.showInformationMessage(`Selected tool: ${tool}`);
    }
  );
  context.subscriptions.push(selectToolCmd);

  // Register property update command
  const updatePropertyCmd = vscode.commands.registerCommand(
    'manicMiners.updateProperty',
    (data: { property: string; value: string | number }) => {
      // Handle property updates
      if (data.property === 'tileType') {
        tilePaletteProvider.setSelectedTile(Number(data.value));
      }
      // Update status bar with property info
      vscode.commands.executeCommand('manicMiners.updateStatusBar', {
        selectedTile: `${data.property}: ${data.value}`,
      });
    }
  );
  context.subscriptions.push(updatePropertyCmd);

  // Register layer toggle command
  const toggleLayerCmd = vscode.commands.registerCommand(
    'manicMiners.toggleLayer',
    (layer: string) => {
      // Toggle layer visibility
      vscode.window.showInformationMessage(`Toggled layer: ${layer}`);
    }
  );
  context.subscriptions.push(toggleLayerCmd);

  // Register context menu commands
  registerContextMenuCommands(context);

  // Set extension active context
  vscode.commands.executeCommand('setContext', 'manicMiners.extensionActive', true);

  // Update status bar when document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document === vscode.window.activeTextEditor?.document) {
        statusBarManager.updateActiveDocument(e.document);
      }
    })
  );

  // Initialize with current document
  statusBarManager.updateActiveDocument(vscode.window.activeTextEditor?.document);

  // Register Maps Explorer Provider
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const mapsExplorerProvider = new MapsExplorerProvider(workspaceRoot, context);
  vscode.window.createTreeView('manicMiners.explorer', {
    treeDataProvider: mapsExplorerProvider,
    showCollapseAll: true,
  });

  // Register Tile Palette Provider
  const tilePaletteProvider = new TilePaletteProvider(context);
  vscode.window.createTreeView('manicMiners.tilePalette', {
    treeDataProvider: tilePaletteProvider,
  });

  // Register Script Snippets Provider
  const scriptSnippetsProvider = new ScriptSnippetsProvider(context);
  vscode.window.createTreeView('manicMiners.scriptSnippets', {
    treeDataProvider: scriptSnippetsProvider,
    showCollapseAll: true,
  });

  // Register Validation Provider
  const validationProvider = new ValidationProvider(context);
  vscode.window.createTreeView('manicMiners.validation', {
    treeDataProvider: validationProvider,
  });

  // Register commands for new UI components
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.refreshMapsExplorer', () =>
      mapsExplorerProvider.refresh()
    ),
    vscode.commands.registerCommand('manicMiners.openMap', async (mapPath: string) => {
      const document = await vscode.workspace.openTextDocument(mapPath);
      await vscode.window.showTextDocument(document);
      mapsExplorerProvider.addRecentMap(mapPath);
    }),
    vscode.commands.registerCommand('manicMiners.selectTile', (tileId: number) => {
      tilePaletteProvider.setSelectedTile(tileId);
    }),
    vscode.commands.registerCommand('manicMiners.showTilePalette', () => {
      vscode.commands.executeCommand('manicMiners.tilePalette.focus');
    }),
    vscode.commands.registerCommand(
      'manicMiners.insertScriptSnippet',
      async (pattern: { snippet: string }) => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const position = editor.selection.active;
          await editor.edit(editBuilder => {
            editBuilder.insert(position, pattern.snippet);
          });
        }
      }
    ),
    vscode.commands.registerCommand('manicMiners.addCustomSnippet', async () => {
      const name = await vscode.window.showInputBox({ prompt: 'Snippet name' });
      if (!name) {
        return;
      }

      const description = await vscode.window.showInputBox({ prompt: 'Snippet description' });
      if (!description) {
        return;
      }

      const snippet = await vscode.window.showInputBox({
        prompt: 'Script snippet',
        placeHolder: 'timer::;\\nwait:30;',
      });
      if (!snippet) {
        return;
      }

      await scriptSnippetsProvider.addCustomSnippet({
        name,
        description,
        snippet,
        category: 'custom',
      });
    }),
    vscode.commands.registerCommand('manicMiners.showMapInfo', () => {
      // Show detailed map info in a quick pick or information message
      const editor = vscode.window.activeTextEditor;
      if (editor?.document.fileName.endsWith('.dat')) {
        vscode.window.showInformationMessage('Map information displayed in status bar');
      }
    }),
    vscode.commands.registerCommand(
      'manicMiners.updateStatusBar',
      (updates: { selectedTile?: string; validation?: string }) => {
        statusBarManager.updateStatusBarItem(updates);
      }
    ),
    vscode.commands.registerCommand('manicMiners.goToLine', (line: number) => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const position = new vscode.Position(line - 1, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position));
      }
    })
  );

  // Update validation provider when diagnostics change
  context.subscriptions.push(
    vscode.languages.onDidChangeDiagnostics(() => {
      const editor = vscode.window.activeTextEditor;
      if (editor?.document.languageId === 'manicminers') {
        const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
        const issues = diagnostics.map(d => ({
          severity:
            d.severity === vscode.DiagnosticSeverity.Error
              ? ('error' as const)
              : d.severity === vscode.DiagnosticSeverity.Warning
                ? ('warning' as const)
                : ('info' as const),
          message: d.message,
          line: d.range.start.line + 1,
          category: d.source || 'General',
        }));
        validationProvider.updateValidation(issues);
      }
    })
  );
}

export function deactivate() {}
