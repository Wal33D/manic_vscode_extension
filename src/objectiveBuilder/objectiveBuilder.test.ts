import * as vscode from 'vscode';
import { ObjectiveBuilderProvider, ObjectiveDefinition } from './objectiveBuilderProvider';

jest.mock('vscode');

describe('ObjectiveBuilderProvider', () => {
  let provider: ObjectiveBuilderProvider;
  let mockExtensionUri: vscode.Uri;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExtensionUri = vscode.Uri.file('/test/extension');
    provider = new ObjectiveBuilderProvider(mockExtensionUri);
  });

  describe('resolveWebviewView', () => {
    it('should set up webview with correct options', () => {
      const mockWebviewView = {
        webview: {
          options: {},
          html: '',
          onDidReceiveMessage: jest.fn(),
          postMessage: jest.fn(),
          asWebviewUri: jest.fn(uri => uri),
        },
      } as any;

      const mockContext = {} as any;
      const mockToken = {} as any;

      provider.resolveWebviewView(mockWebviewView, mockContext, mockToken);

      expect(mockWebviewView.webview.options).toEqual({
        enableScripts: true,
        localResourceRoots: [mockExtensionUri],
      });

      expect(mockWebviewView.webview.html).toContain('<!DOCTYPE html>');
      expect(mockWebviewView.webview.html).toContain('Objective Builder');
      expect(mockWebviewView.webview.onDidReceiveMessage).toHaveBeenCalled();
    });
  });

  describe('objective definitions', () => {
    it('should provide all objective types', () => {
      // Access private method through prototype
      const definitions = (provider as any).getObjectiveDefinitions();

      expect(definitions).toHaveLength(7);

      const types = definitions.map((d: ObjectiveDefinition) => d.type);
      expect(types).toContain('resources');
      expect(types).toContain('building');
      expect(types).toContain('discovertile');
      expect(types).toContain('variable');
      expect(types).toContain('findminer');
      expect(types).toContain('findbuilding');
      expect(types).toContain('custom');
    });

    it('should have correct resource objective definition', () => {
      const definitions = (provider as any).getObjectiveDefinitions();
      const resourceDef = definitions.find((d: ObjectiveDefinition) => d.type === 'resources');

      expect(resourceDef).toBeDefined();
      expect(resourceDef.parameters).toHaveLength(3);
      expect(resourceDef.parameters[0].name).toBe('crystals');
      expect(resourceDef.parameters[0].type).toBe('number');
      expect(resourceDef.template).toBe('resources: {crystals},{ore},{studs}');
    });

    it('should have correct building objective definition', () => {
      const definitions = (provider as any).getObjectiveDefinitions();
      const buildingDef = definitions.find((d: ObjectiveDefinition) => d.type === 'building');

      expect(buildingDef).toBeDefined();
      expect(buildingDef.parameters).toHaveLength(1);
      expect(buildingDef.parameters[0].type).toBe('enum');
      expect(buildingDef.parameters[0].enum).toContain('BuildingPowerStation_C');
      expect(buildingDef.template).toBe('building:{building}');
    });
  });

  describe('message handling', () => {
    let mockWebviewView: any;
    let messageHandler: (data: any) => void;

    beforeEach(() => {
      mockWebviewView = {
        webview: {
          options: {},
          html: '',
          onDidReceiveMessage: jest.fn(handler => {
            messageHandler = handler;
            return { dispose: jest.fn() };
          }),
          postMessage: jest.fn(),
          asWebviewUri: jest.fn(uri => uri),
        },
      };

      provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
    });

    it('should handle requestObjectiveTypes message', async () => {
      await messageHandler({ type: 'requestObjectiveTypes' });

      expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        type: 'objectiveTypes',
        definitions: expect.any(Array),
      });
    });

    it('should handle insertObjective message', async () => {
      const mockEditor = {
        document: {
          languageId: 'manicminers',
          getText: () => 'info{\n}\ntiles{\n}\n',
          uri: vscode.Uri.file('/test.dat'),
        },
      };

      (vscode.window as any).activeTextEditor = mockEditor;
      (vscode.window as any).showInformationMessage = jest.fn();
      (vscode.workspace as any).applyEdit = jest.fn().mockResolvedValue(true);

      await messageHandler({
        type: 'insertObjective',
        objective: 'resources: 10,5,0',
      });

      expect(vscode.workspace.applyEdit).toHaveBeenCalled();
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Added objective: resources: 10,5,0'
      );
    });

    it('should handle validateObjective message', async () => {
      await messageHandler({
        type: 'validateObjective',
        objective: 'resources: 10,5,0',
      });

      expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        type: 'validationResult',
        isValid: true,
        warnings: [],
      });
    });
  });

  describe('helper methods', () => {
    it('should find best insert position after info section', () => {
      const lines = ['info{', 'rowcount:10', '}', '', 'tiles{', '}'];

      const position = (provider as any).findBestInsertPosition(lines);
      expect(position).toBe(3); // After info section closing brace
    });

    it('should find best insert position after tiles section', () => {
      const lines = ['tiles{', '1,1,1,', '}', ''];

      const position = (provider as any).findBestInsertPosition(lines);
      expect(position).toBe(3); // After tiles section closing brace
    });

    it('should get correct indent from line', () => {
      const indent1 = (provider as any).getIndentFromLine('  resources: 10,0,0');
      expect(indent1).toBe('  ');

      const indent2 = (provider as any).getIndentFromLine('\tbuilding:BuildingPowerStation_C');
      expect(indent2).toBe('\t');

      const indent3 = (provider as any).getIndentFromLine('no indent');
      expect(indent3).toBe('');
    });
  });

  describe('objective insertion', () => {
    it('should create objectives section if missing', async () => {
      const mockEditor = {
        document: {
          languageId: 'manicminers',
          getText: () => 'info{\nrowcount:10\n}\ntiles{\n1,1,1,\n}\n',
          uri: vscode.Uri.file('/test.dat'),
        },
      };

      (vscode.window as any).activeTextEditor = mockEditor;
      (vscode.workspace as any).applyEdit = jest.fn().mockResolvedValue(true);
      (vscode.window as any).showInformationMessage = jest.fn();

      // Mock WorkspaceEdit
      const mockEdit = {
        insert: jest.fn(),
      };
      (vscode as any).WorkspaceEdit = jest.fn().mockImplementation(() => mockEdit);
      (vscode as any).Position = jest
        .fn()
        .mockImplementation((line, char) => ({ line, character: char }));

      await (provider as any).insertObjective('resources: 10,0,0');

      expect(mockEdit.insert).toHaveBeenCalled();
      expect(vscode.workspace.applyEdit).toHaveBeenCalled();
    });

    it('should add to existing objectives section', async () => {
      const mockEditor = {
        document: {
          languageId: 'manicminers',
          getText: () => 'objectives{\nresources: 5,0,0\n}\n',
          uri: vscode.Uri.file('/test.dat'),
        },
      };

      (vscode.window as any).activeTextEditor = mockEditor;
      (vscode.workspace as any).applyEdit = jest.fn().mockResolvedValue(true);
      (vscode.window as any).showInformationMessage = jest.fn();

      const mockEdit = {
        insert: jest.fn(),
      };
      (vscode as any).WorkspaceEdit = jest.fn().mockImplementation(() => mockEdit);
      (vscode as any).Position = jest
        .fn()
        .mockImplementation((line, char) => ({ line, character: char }));

      await (provider as any).insertObjective('building:BuildingPowerStation_C');

      expect(mockEdit.insert).toHaveBeenCalled();
      expect(vscode.workspace.applyEdit).toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('should validate empty objective as invalid', () => {
      const mockWebviewView = {
        webview: {
          postMessage: jest.fn(),
        },
      };
      (provider as any)._view = mockWebviewView;

      (provider as any).validateObjective('');

      expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        type: 'validationResult',
        isValid: false,
        warnings: [],
      });
    });

    it('should validate resources format', () => {
      const mockWebviewView = {
        webview: {
          postMessage: jest.fn(),
        },
      };
      (provider as any)._view = mockWebviewView;

      (provider as any).validateObjective('resources: 10,5,0');

      expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        type: 'validationResult',
        isValid: true,
        warnings: [],
      });
    });

    it('should warn about invalid resources format', () => {
      const mockWebviewView = {
        webview: {
          postMessage: jest.fn(),
        },
      };
      (provider as any)._view = mockWebviewView;

      (provider as any).validateObjective('resources: invalid');

      expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        type: 'validationResult',
        isValid: true,
        warnings: ['Resources format should be: resources: crystals,ore,studs'],
      });
    });
  });
});
