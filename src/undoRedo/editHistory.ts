import * as vscode from 'vscode';

export interface MapEdit {
  id: string;
  timestamp: Date;
  description: string;
  documentUri: vscode.Uri;
  changes: EditChange[];
}

export interface EditChange {
  range: vscode.Range;
  oldText: string;
  newText: string;
}

export class EditHistory {
  private history: MapEdit[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  constructor(maxHistorySize: number = 50) {
    this.maxHistorySize = maxHistorySize;
  }

  public addEdit(edit: MapEdit): void {
    // Remove any edits after the current index (redo history)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Add the new edit
    this.history.push(edit);
    this.currentIndex++;

    // Maintain max history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  public canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  public canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  public getCurrentEdit(): MapEdit | undefined {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return undefined;
  }

  public getUndoEdit(): MapEdit | undefined {
    if (this.canUndo()) {
      return this.history[this.currentIndex];
    }
    return undefined;
  }

  public getRedoEdit(): MapEdit | undefined {
    if (this.canRedo()) {
      return this.history[this.currentIndex + 1];
    }
    return undefined;
  }

  public undo(): MapEdit | undefined {
    if (this.canUndo()) {
      const edit = this.history[this.currentIndex];
      this.currentIndex--;
      return edit;
    }
    return undefined;
  }

  public redo(): MapEdit | undefined {
    if (this.canRedo()) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return undefined;
  }

  public clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  public getHistory(): MapEdit[] {
    return [...this.history];
  }

  public getHistorySize(): number {
    return this.history.length;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }
}
