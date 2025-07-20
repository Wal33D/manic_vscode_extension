import * as vscode from 'vscode';
import { EditHistory, MapEdit, EditChange } from './editHistory';
import { UndoRedoPreviewProvider } from './undoRedoPreview';

export class UndoRedoProvider {
  private editHistories: Map<string, EditHistory> = new Map();
  private statusBarItem: vscode.StatusBarItem;
  private previewPanel: vscode.WebviewPanel | undefined;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.statusBarItem.command = 'manicMiners.showUndoRedoHistory';
    context.subscriptions.push(this.statusBarItem);

    // Update status bar when active editor changes
    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor(() => {
        this.updateStatusBar();
      })
    );
  }

  public getOrCreateHistory(uri: vscode.Uri): EditHistory {
    const key = uri.toString();
    let history = this.editHistories.get(key);
    if (!history) {
      history = new EditHistory();
      this.editHistories.set(key, history);
    }
    return history;
  }

  public recordEdit(uri: vscode.Uri, description: string, changes: EditChange[]): void {
    const history = this.getOrCreateHistory(uri);
    const edit: MapEdit = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      description,
      documentUri: uri,
      changes,
    };
    history.addEdit(edit);
    this.updateStatusBar();
  }

  public async undoWithPreview(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'manicminers') {
      vscode.window.showErrorMessage('No active Manic Miners file');
      return;
    }

    const history = this.getOrCreateHistory(editor.document.uri);
    const edit = history.getUndoEdit();
    if (!edit) {
      vscode.window.showInformationMessage('Nothing to undo');
      return;
    }

    // Show preview
    const proceed = await this.showPreview(edit, 'undo');
    if (!proceed) {
      return;
    }

    // Apply undo
    const undoEdit = new vscode.WorkspaceEdit();
    for (const change of edit.changes) {
      undoEdit.replace(editor.document.uri, change.range, change.oldText);
    }

    const success = await vscode.workspace.applyEdit(undoEdit);
    if (success) {
      history.undo();
      this.updateStatusBar();
      vscode.window.showInformationMessage(`Undid: ${edit.description}`);
    }
  }

  public async redoWithPreview(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'manicminers') {
      vscode.window.showErrorMessage('No active Manic Miners file');
      return;
    }

    const history = this.getOrCreateHistory(editor.document.uri);
    const edit = history.getRedoEdit();
    if (!edit) {
      vscode.window.showInformationMessage('Nothing to redo');
      return;
    }

    // Show preview
    const proceed = await this.showPreview(edit, 'redo');
    if (!proceed) {
      return;
    }

    // Apply redo
    const redoEdit = new vscode.WorkspaceEdit();
    for (const change of edit.changes) {
      redoEdit.replace(editor.document.uri, change.range, change.newText);
    }

    const success = await vscode.workspace.applyEdit(redoEdit);
    if (success) {
      history.redo();
      this.updateStatusBar();
      vscode.window.showInformationMessage(`Redid: ${edit.description}`);
    }
  }

  private async showPreview(edit: MapEdit, action: 'undo' | 'redo'): Promise<boolean> {
    // Use enhanced preview with visual grid
    return await UndoRedoPreviewProvider.showPreview(this.context, edit, action);
  }

  private updateStatusBar(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'manicminers') {
      this.statusBarItem.hide();
      return;
    }

    const history = this.getOrCreateHistory(editor.document.uri);
    const canUndo = history.canUndo();
    const canRedo = history.canRedo();
    const historySize = history.getHistorySize();
    const currentIndex = history.getCurrentIndex();

    if (historySize > 0) {
      this.statusBarItem.text = `$(history) ${currentIndex + 1}/${historySize}`;
      this.statusBarItem.tooltip = `Undo/Redo History\n${canUndo ? '• Can undo' : '• Nothing to undo'}\n${canRedo ? '• Can redo' : '• Nothing to redo'}\nClick to view history`;
      this.statusBarItem.show();
    } else {
      this.statusBarItem.text = '$(history) 0/0';
      this.statusBarItem.tooltip = 'No edit history';
      this.statusBarItem.show();
    }
  }

  public async showHistoryPanel(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'manicminers') {
      vscode.window.showErrorMessage('No active Manic Miners file');
      return;
    }

    const history = this.getOrCreateHistory(editor.document.uri);
    const edits = history.getHistory();
    const currentIndex = history.getCurrentIndex();

    if (edits.length === 0) {
      vscode.window.showInformationMessage('No edit history');
      return;
    }

    // Create webview panel
    if (!this.previewPanel) {
      this.previewPanel = vscode.window.createWebviewPanel(
        'undoRedoHistory',
        'Edit History',
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      this.previewPanel.onDidDispose(() => {
        this.previewPanel = undefined;
      });
    }

    // Generate HTML for history
    this.previewPanel.webview.html = this.generateHistoryHtml(edits, currentIndex);
  }

  private generateHistoryHtml(edits: MapEdit[], currentIndex: number): string {
    const items = edits
      .map((edit, index) => {
        const isCurrent = index === currentIndex;
        const isPast = index <= currentIndex;
        const className = isCurrent ? 'current' : isPast ? 'past' : 'future';

        return `
        <div class="history-item ${className}">
          <div class="time">${new Date(edit.timestamp).toLocaleTimeString()}</div>
          <div class="description">${edit.description}</div>
          <div class="changes">${edit.changes.length} change(s)</div>
        </div>
      `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
          }
          .history-item {
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .history-item.current {
            background-color: var(--vscode-editor-selectionBackground);
            border: 2px solid var(--vscode-focusBorder);
          }
          .history-item.past {
            opacity: 0.8;
          }
          .history-item.future {
            opacity: 0.5;
            font-style: italic;
          }
          .time {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
          }
          .description {
            font-weight: bold;
          }
          .changes {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
          }
        </style>
      </head>
      <body>
        <h2>Edit History</h2>
        <div class="history-list">
          ${items}
        </div>
      </body>
      </html>
    `;
  }

  public clearHistory(uri?: vscode.Uri): void {
    if (uri) {
      const history = this.editHistories.get(uri.toString());
      if (history) {
        history.clear();
        this.updateStatusBar();
      }
    } else {
      // Clear all histories
      this.editHistories.clear();
      this.updateStatusBar();
    }
  }
}
