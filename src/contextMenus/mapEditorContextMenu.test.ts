import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import * as vscode from 'vscode';
import { MapEditorContextMenu } from './mapEditorContextMenu';

describe('MapEditorContextMenu', () => {
  let contextMenu: MapEditorContextMenu;
  let mockDocument: vscode.TextDocument;
  let mockPosition: vscode.Position;

  beforeEach(() => {
    jest.clearAllMocks();
    contextMenu = MapEditorContextMenu.getInstance();

    // Mock document
    mockDocument = {
      getText: jest.fn(
        () => 'tiles{\n42 42 42\n}\nresources{\n}\nbuildings{\n}\nobjectives{\n}\nscript{\n}'
      ),
      lineAt: jest.fn((line: any) => {
        if (typeof line === 'number') {
          return {
            text: line === 1 ? '42 42 42' : 'tiles{',
          };
        }
        // Handle Position object
        return {
          text: line.line === 1 ? '42 42 42' : 'tiles{',
        };
      }),
    } as any;

    mockPosition = new vscode.Position(1, 0);
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = MapEditorContextMenu.getInstance();
      const instance2 = MapEditorContextMenu.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getContextMenuActions', () => {
    it('should return common actions for all sections', async () => {
      const actions = await contextMenu.getContextMenuActions(mockDocument, mockPosition);

      // Check common actions exist
      const copyAction = actions.find(a => a.id === 'copy');
      const pasteAction = actions.find(a => a.id === 'paste');
      const validateAction = actions.find(a => a.id === 'validate');
      const previewAction = actions.find(a => a.id === 'preview');

      expect(copyAction).toBeDefined();
      expect(copyAction?.label).toBe('Copy');
      expect(copyAction?.enabled).toBe(true);

      expect(pasteAction).toBeDefined();
      expect(pasteAction?.label).toBe('Paste');

      expect(validateAction).toBeDefined();
      expect(validateAction?.label).toBe('Validate Map');

      expect(previewAction).toBeDefined();
      expect(previewAction?.label).toBe('Show Map Preview');
    });

    it('should return tile-specific actions when in tiles section', async () => {
      const actions = await contextMenu.getContextMenuActions(mockDocument, mockPosition);

      // Check for tile-specific actions
      const fillAreaAction = actions.find(a => a.id === 'fillArea');
      const replaceAllAction = actions.find(a => a.id === 'replaceAll');
      const insertPatternAction = actions.find(a => a.id === 'insertPattern');
      const analyzeTilesAction = actions.find(a => a.id === 'analyzeTiles');

      expect(fillAreaAction).toBeDefined();
      expect(fillAreaAction?.label).toContain('Fill Area with Tile');

      expect(replaceAllAction).toBeDefined();
      expect(replaceAllAction?.label).toContain('Replace All');

      expect(insertPatternAction).toBeDefined();
      expect(insertPatternAction?.label).toBe('Insert Tile Pattern');

      expect(analyzeTilesAction).toBeDefined();
      expect(analyzeTilesAction?.label).toBe('Analyze Tile Usage');
    });

    it('should return resource-specific actions when in resources section', async () => {
      // Mock document for resources section
      mockDocument.getText = jest.fn(() => 'resources{\ncrystals: 10,10,50\n}');
      mockPosition = new vscode.Position(1, 0);

      const actions = await contextMenu.getContextMenuActions(mockDocument, mockPosition);

      const addResourceAction = actions.find(a => a.id === 'addResource');
      const validateResourcesAction = actions.find(a => a.id === 'validateResources');

      expect(addResourceAction).toBeDefined();
      expect(addResourceAction?.label).toBe('Add Resource');

      expect(validateResourcesAction).toBeDefined();
      expect(validateResourcesAction?.label).toBe('Validate Resource Placement');
    });

    it('should return building-specific actions when in buildings section', async () => {
      // Mock document for buildings section
      mockDocument.getText = jest.fn(() => 'buildings{\nToolStore: 5,5,1,1,1\n}');
      mockPosition = new vscode.Position(1, 0);

      const actions = await contextMenu.getContextMenuActions(mockDocument, mockPosition);

      const addBuildingAction = actions.find(a => a.id === 'addBuilding');
      const checkSpaceAction = actions.find(a => a.id === 'checkBuildingSpace');

      expect(addBuildingAction).toBeDefined();
      expect(addBuildingAction?.label).toBe('Add Building');

      expect(checkSpaceAction).toBeDefined();
      expect(checkSpaceAction?.label).toBe('Check Building Space');
    });

    it('should return objective-specific actions when in objectives section', async () => {
      // Mock document for objectives section
      mockDocument.getText = jest.fn(() => 'objectives{\nresources: crystals,100\n}');
      mockPosition = new vscode.Position(1, 0);

      const actions = await contextMenu.getContextMenuActions(mockDocument, mockPosition);

      const openBuilderAction = actions.find(a => a.id === 'openObjectiveBuilder');
      const addObjectiveAction = actions.find(a => a.id === 'addObjective');
      const analyzeAction = actions.find(a => a.id === 'analyzeObjectives');

      expect(openBuilderAction).toBeDefined();
      expect(openBuilderAction?.label).toBe('Open Objective Builder');

      expect(addObjectiveAction).toBeDefined();
      expect(addObjectiveAction?.label).toBe('Add Objective');

      expect(analyzeAction).toBeDefined();
      expect(analyzeAction?.label).toBe('Analyze Objectives');
    });

    it('should return script-specific actions when in script section', async () => {
      // Mock document for script section
      mockDocument.getText = jest.fn(() => 'script{\nwait(10)\n}');
      mockPosition = new vscode.Position(1, 0);

      const actions = await contextMenu.getContextMenuActions(mockDocument, mockPosition);

      const insertPatternAction = actions.find(a => a.id === 'insertScriptPattern');
      const scriptDocsAction = actions.find(a => a.id === 'scriptDocs');
      const validateScriptAction = actions.find(a => a.id === 'validateScript');

      expect(insertPatternAction).toBeDefined();
      expect(insertPatternAction?.label).toBe('Insert Script Pattern');

      expect(scriptDocsAction).toBeDefined();
      expect(scriptDocsAction?.label).toBe('Show Script Reference');

      expect(validateScriptAction).toBeDefined();
      expect(validateScriptAction?.label).toBe('Validate Script');
    });
  });

  describe('showContextMenu', () => {
    it('should show quick pick with enabled actions only', async () => {
      const mockShowQuickPick = vscode.window.showQuickPick as jest.Mock;
      mockShowQuickPick.mockImplementationOnce(() =>
        Promise.resolve({
          label: '$(copy) Copy',
          action: jest.fn(),
        })
      );

      await contextMenu.showContextMenu(mockDocument, mockPosition);

      expect(vscode.window.showQuickPick).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ label: expect.stringContaining('Copy') }),
          expect.objectContaining({ label: expect.stringContaining('Paste') }),
        ]),
        expect.objectContaining({
          placeHolder: 'Select an action',
        })
      );
    });

    it('should execute selected action', async () => {
      const mockAction = jest.fn();
      const mockShowQuickPick = vscode.window.showQuickPick as jest.Mock;
      mockShowQuickPick.mockImplementationOnce(() =>
        Promise.resolve({
          label: '$(copy) Copy',
          action: mockAction,
        })
      );

      await contextMenu.showContextMenu(mockDocument, mockPosition);

      expect(mockAction).toHaveBeenCalled();
    });

    it('should handle cancelled selection', async () => {
      const mockShowQuickPick = vscode.window.showQuickPick as jest.Mock;
      mockShowQuickPick.mockImplementationOnce(() => Promise.resolve(undefined));

      // Should not throw
      await expect(contextMenu.showContextMenu(mockDocument, mockPosition)).resolves.not.toThrow();
    });
  });

  describe('action handlers', () => {
    it('should execute copy command', async () => {
      const actions = await contextMenu.getContextMenuActions(mockDocument, mockPosition);
      const copyAction = actions.find(a => a.id === 'copy');

      await copyAction?.action();

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'editor.action.clipboardCopyAction'
      );
    });

    it('should execute paste command', async () => {
      const actions = await contextMenu.getContextMenuActions(mockDocument, mockPosition);
      const pasteAction = actions.find(a => a.id === 'paste');

      await pasteAction?.action();

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'editor.action.clipboardPasteAction'
      );
    });

    it('should execute validation command', async () => {
      const actions = await contextMenu.getContextMenuActions(mockDocument, mockPosition);
      const validateAction = actions.find(a => a.id === 'validate');

      await validateAction?.action();

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('manicMiners.runValidation');
    });

    it('should execute map preview command', async () => {
      const actions = await contextMenu.getContextMenuActions(mockDocument, mockPosition);
      const previewAction = actions.find(a => a.id === 'preview');

      await previewAction?.action();

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('manicMiners.showMapPreview');
    });

    it('should execute fill area command for tiles', async () => {
      const actions = await contextMenu.getContextMenuActions(mockDocument, mockPosition);
      const fillAction = actions.find(a => a.id === 'fillArea');

      await fillAction?.action();

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('manicMiners.fillAreaEnhanced');
    });

    it('should add resource when resource action is triggered', async () => {
      // Mock document for resources section
      mockDocument.getText = jest.fn(() => 'resources{\n}');
      mockPosition = new vscode.Position(1, 0);

      // Mock user inputs
      const mockShowQuickPick = vscode.window.showQuickPick as jest.Mock;
      const mockShowInputBox = vscode.window.showInputBox as jest.Mock;
      mockShowQuickPick.mockImplementationOnce(() => Promise.resolve('crystals'));
      mockShowInputBox
        .mockImplementationOnce(() => Promise.resolve('10')) // X coordinate
        .mockImplementationOnce(() => Promise.resolve('20')) // Y coordinate
        .mockImplementationOnce(() => Promise.resolve('50')); // Amount

      // Mock active editor
      const mockEditor = {
        edit: jest.fn((callback: (editBuilder: any) => void) => {
          const mockEditBuilder = {
            insert: jest.fn(),
          };
          callback(mockEditBuilder);
          return Promise.resolve(true);
        }),
      };
      (vscode.window as any).activeTextEditor = mockEditor;

      const actions = await contextMenu.getContextMenuActions(mockDocument, mockPosition);
      const addResourceAction = actions.find(a => a.id === 'addResource');

      await addResourceAction?.action();

      expect(vscode.window.showQuickPick).toHaveBeenCalledWith(
        ['crystals', 'ore', 'studs'],
        expect.objectContaining({ placeHolder: 'Select resource type' })
      );

      expect(mockEditor.edit).toHaveBeenCalled();
      const editCallback = (mockEditor.edit as jest.Mock).mock.calls[0][0] as (
        editBuilder: any
      ) => void;
      const mockEditBuilder = { insert: jest.fn() };
      editCallback(mockEditBuilder);

      expect(mockEditBuilder.insert).toHaveBeenCalledWith(mockPosition, '\ncrystals: 10,20,50');
    });
  });
});
