import * as vscode from 'vscode';
import { MapEditorProvider } from './mapEditorProvider';

// Mock vscode module
jest.mock('vscode');

describe('MapEditorProvider', () => {
  let provider: MapEditorProvider;
  let mockContext: vscode.ExtensionContext;
  let mockDocument: vscode.TextDocument;
  let mockWebviewPanel: vscode.WebviewPanel;
  let mockWebview: vscode.Webview;

  beforeEach(() => {
    // Setup mocks
    mockContext = {
      subscriptions: [],
      extensionUri: vscode.Uri.parse('file:///test'),
      workspaceState: {
        get: jest.fn().mockReturnValue([]),
        update: jest.fn().mockResolvedValue(undefined),
      },
    } as any;

    mockDocument = {
      uri: vscode.Uri.parse('file:///test.dat'),
      getText: jest.fn().mockReturnValue(`info{
rowcount:10
colcount:10
}
tiles{
1,1,1,1,1,1,1,1,1,1
1,1,1,1,1,1,1,1,1,1
1,1,1,1,1,1,1,1,1,1
1,1,1,1,1,1,1,1,1,1
1,1,1,1,1,1,1,1,1,1
1,1,1,1,1,1,1,1,1,1
1,1,1,1,1,1,1,1,1,1
1,1,1,1,1,1,1,1,1,1
1,1,1,1,1,1,1,1,1,1
1,1,1,1,1,1,1,1,1,1
}
height{
10,10,10,10,10,10,10,10,10,10
10,10,10,10,10,10,10,10,10,10
10,10,10,10,10,10,10,10,10,10
10,10,10,10,10,10,10,10,10,10
10,10,10,10,10,10,10,10,10,10
10,10,10,10,10,10,10,10,10,10
10,10,10,10,10,10,10,10,10,10
10,10,10,10,10,10,10,10,10,10
10,10,10,10,10,10,10,10,10,10
10,10,10,10,10,10,10,10,10,10
}`),
      lineCount: 20,
    } as any;

    mockWebview = {
      postMessage: jest.fn().mockResolvedValue(true),
      html: '',
      asWebviewUri: jest.fn(uri => uri),
      onDidReceiveMessage: jest.fn(),
    } as any;

    mockWebviewPanel = {
      webview: mockWebview,
      onDidDispose: jest.fn(),
      onDidChangeViewState: jest.fn(),
    } as any;

    provider = new MapEditorProvider(mockContext);
  });

  describe('resolveCustomTextEditor', () => {
    it('should load valid map document', async () => {
      await provider.resolveCustomTextEditor(mockDocument, mockWebviewPanel, {} as any);

      expect(mockWebview.html).toContain('<!DOCTYPE html>');
      expect(mockWebview.html).toContain('Map Editor');
      expect(mockWebview.html).not.toContain('Error Loading Map');
    });

    it('should handle invalid document format', async () => {
      mockDocument.getText = jest.fn().mockReturnValue('invalid content');

      await provider.resolveCustomTextEditor(mockDocument, mockWebviewPanel, {} as any);

      expect(mockWebview.html).toContain('Error Loading Map');
    });

    it('should handle oversized maps', async () => {
      mockDocument.getText = jest.fn().mockReturnValue(`info{
rowcount:1000
colcount:1000
}
tiles{
1,1,1
}
height{
10,10,10
}`);

      await provider.resolveCustomTextEditor(mockDocument, mockWebviewPanel, {} as any);

      expect(mockWebview.html).toContain('Map too large');
    });
  });

  describe('Message handling', () => {
    let messageHandler: any;

    beforeEach(async () => {
      // Capture the message handler
      (mockWebview as any).onDidReceiveMessage = jest.fn((handler: any) => {
        messageHandler = handler;
        return { dispose: jest.fn() };
      });

      await provider.resolveCustomTextEditor(mockDocument, mockWebviewPanel, {} as any);
    });

    it('should handle paint message', async () => {
      const applyEditSpy = jest.spyOn(vscode.workspace, 'applyEdit').mockResolvedValue(true);

      await messageHandler({
        type: 'paint',
        tiles: [{ row: 1, col: 1, tileId: 42 }],
        description: 'Test paint',
      });

      expect(applyEditSpy).toHaveBeenCalled();
    });

    it('should handle copy message', async () => {
      await messageHandler({
        type: 'copy',
        selection: { startRow: 1, startCol: 1, endRow: 2, endCol: 2 },
      });

      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: 'copyComplete',
        selection: { startRow: 1, startCol: 1, endRow: 2, endCol: 2 },
      });
    });

    it('should handle validateMap message', async () => {
      await messageHandler({
        type: 'validateMap',
      });

      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'validationResult',
        })
      );
    });

    it('should handle getTemplates message', async () => {
      await messageHandler({
        type: 'getTemplates',
      });

      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'templates',
          templates: expect.any(Array),
        })
      );
    });
  });

  describe('Custom editor capabilities', () => {
    it('should provide correct view type', () => {
      expect((MapEditorProvider as any).viewType).toBe('manicMiners.mapEditor');
    });

    it('should handle document save', async () => {
      const applyEditSpy = jest.spyOn(vscode.workspace, 'applyEdit').mockResolvedValue(true);

      // Simulate a paint operation to trigger document change
      const messageHandler = jest.fn();
      (mockWebview as any).onDidReceiveMessage = jest.fn((handler: any) => {
        messageHandler.mockImplementation(handler);
        return { dispose: jest.fn() };
      });

      await provider.resolveCustomTextEditor(mockDocument, mockWebviewPanel, {} as any);

      await messageHandler({
        type: 'paint',
        tiles: [{ row: 1, col: 1, tileId: 42 }],
        description: 'Test paint',
      });

      expect(applyEditSpy).toHaveBeenCalled();
    });
  });
});
