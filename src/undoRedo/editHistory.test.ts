import { describe, expect, it, beforeEach } from '@jest/globals';
import { EditHistory, MapEdit } from './editHistory';
import * as vscode from 'vscode';

describe('EditHistory', () => {
  let history: EditHistory;
  let mockUri: vscode.Uri;

  beforeEach(() => {
    history = new EditHistory();
    mockUri = vscode.Uri.file('/test/file.dat');
  });

  const createMockEdit = (id: string, description: string): MapEdit => ({
    id,
    timestamp: new Date(),
    description,
    documentUri: mockUri,
    changes: [
      {
        range: new vscode.Range(0, 0, 0, 10),
        oldText: '1,1,1',
        newText: '2,2,2',
      },
    ],
  });

  describe('addEdit', () => {
    it('should add edit to history', () => {
      const edit = createMockEdit('1', 'Test edit');
      history.addEdit(edit);

      expect(history.getHistorySize()).toBe(1);
      expect(history.getCurrentEdit()).toEqual(edit);
    });

    it('should maintain max history size', () => {
      const smallHistory = new EditHistory(3);

      for (let i = 0; i < 5; i++) {
        smallHistory.addEdit(createMockEdit(`${i}`, `Edit ${i}`));
      }

      expect(smallHistory.getHistorySize()).toBe(3);
      expect(smallHistory.getCurrentEdit()?.description).toBe('Edit 4');
    });

    it('should clear redo history when adding new edit', () => {
      history.addEdit(createMockEdit('1', 'Edit 1'));
      history.addEdit(createMockEdit('2', 'Edit 2'));
      history.undo();

      expect(history.canRedo()).toBe(true);

      history.addEdit(createMockEdit('3', 'Edit 3'));

      expect(history.canRedo()).toBe(false);
      expect(history.getHistorySize()).toBe(2);
    });
  });

  describe('undo', () => {
    it('should undo last edit', () => {
      const edit1 = createMockEdit('1', 'Edit 1');
      const edit2 = createMockEdit('2', 'Edit 2');

      history.addEdit(edit1);
      history.addEdit(edit2);

      const undoneEdit = history.undo();

      expect(undoneEdit).toEqual(edit2);
      expect(history.getCurrentEdit()).toEqual(edit1);
    });

    it('should return undefined when nothing to undo', () => {
      expect(history.undo()).toBeUndefined();
    });

    it('should allow multiple undos', () => {
      history.addEdit(createMockEdit('1', 'Edit 1'));
      history.addEdit(createMockEdit('2', 'Edit 2'));
      history.addEdit(createMockEdit('3', 'Edit 3'));

      history.undo();
      history.undo();

      expect(history.getCurrentEdit()?.description).toBe('Edit 1');
    });
  });

  describe('redo', () => {
    it('should redo undone edit', () => {
      const edit1 = createMockEdit('1', 'Edit 1');
      const edit2 = createMockEdit('2', 'Edit 2');

      history.addEdit(edit1);
      history.addEdit(edit2);
      history.undo();

      const redoneEdit = history.redo();

      expect(redoneEdit).toEqual(edit2);
      expect(history.getCurrentEdit()).toEqual(edit2);
    });

    it('should return undefined when nothing to redo', () => {
      history.addEdit(createMockEdit('1', 'Edit 1'));
      expect(history.redo()).toBeUndefined();
    });

    it('should allow multiple redos', () => {
      history.addEdit(createMockEdit('1', 'Edit 1'));
      history.addEdit(createMockEdit('2', 'Edit 2'));
      history.addEdit(createMockEdit('3', 'Edit 3'));

      history.undo();
      history.undo();
      history.redo();
      history.redo();

      expect(history.getCurrentEdit()?.description).toBe('Edit 3');
    });
  });

  describe('canUndo/canRedo', () => {
    it('should correctly report undo/redo availability', () => {
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);

      history.addEdit(createMockEdit('1', 'Edit 1'));
      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);

      history.undo();
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(true);

      history.redo();
      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all history', () => {
      history.addEdit(createMockEdit('1', 'Edit 1'));
      history.addEdit(createMockEdit('2', 'Edit 2'));

      history.clear();

      expect(history.getHistorySize()).toBe(0);
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
    });
  });

  describe('getHistory', () => {
    it('should return copy of history', () => {
      const edit1 = createMockEdit('1', 'Edit 1');
      const edit2 = createMockEdit('2', 'Edit 2');

      history.addEdit(edit1);
      history.addEdit(edit2);

      const historyArray = history.getHistory();

      expect(historyArray).toHaveLength(2);
      expect(historyArray[0]).toEqual(edit1);
      expect(historyArray[1]).toEqual(edit2);

      // Verify it's a copy
      historyArray.pop();
      expect(history.getHistorySize()).toBe(2);
    });
  });
});
