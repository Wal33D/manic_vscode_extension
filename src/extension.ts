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

export function activate(context: vscode.ExtensionContext) {
  // Store context globally for accessibility manager
  (global as unknown as Record<string, vscode.ExtensionContext>).extensionContext = context;
  // Extension activated successfully

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
}

export function deactivate() {}
