import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import * as vscode from 'vscode';
import { HeatMapProvider } from './heatMapProvider';

// Mock vscode module
jest.mock('vscode');

describe('HeatMapProvider', () => {
  let provider: HeatMapProvider;
  let mockExtensionUri: vscode.Uri;
  let mockWebviewView: vscode.WebviewView;
  let mockWebview: vscode.Webview;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock objects
    mockExtensionUri = { fsPath: '/test/extension' } as vscode.Uri;
    mockWebview = {
      options: {},
      html: '',
      onDidReceiveMessage: jest.fn(),
      postMessage: jest.fn(),
      asWebviewUri: jest.fn(uri => uri),
    } as any;

    mockWebviewView = {
      webview: mockWebview,
      visible: true,
    } as any;

    provider = new HeatMapProvider(mockExtensionUri);
  });

  describe('resolveWebviewView', () => {
    it('should set webview options and HTML', () => {
      provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

      expect(mockWebview.options).toEqual({
        enableScripts: true,
        localResourceRoots: [mockExtensionUri],
      });
      expect(mockWebview.html).toContain('<!DOCTYPE html>');
      expect(mockWebview.html).toContain('Heat Map Analysis');
    });

    it('should register message handlers', () => {
      provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

      expect(mockWebview.onDidReceiveMessage).toHaveBeenCalled();
    });

    it('should update heat map when document is set and view is visible', () => {
      const mockDocument = {
        getText: () => `info{
rowcount:5
colcount:5
}
tiles{
101,1,1,1,26,
1,1,1,1,1,
1,1,42,1,1,
1,1,1,1,1,
101,1,1,1,26,
}`,
        languageId: 'manicminers',
      } as any;

      provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
      provider.updateDocument(mockDocument);

      // Verify that the webview received a message
      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'updateHeatMap',
          mode: 'traffic',
        })
      );
    });
  });

  describe('updateDocument', () => {
    it('should initialize analyzer and update heat map', () => {
      const mockDocument = {
        getText: () => `info{
rowcount:3
colcount:3
}
tiles{
101,1,26,
1,1,1,
26,1,101,
}`,
        languageId: 'manicminers',
      } as any;

      provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
      provider.updateDocument(mockDocument);

      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'updateHeatMap',
          heatMapData: expect.objectContaining({
            grid: expect.any(Array),
            maxValue: expect.any(Number),
            minValue: expect.any(Number),
            hotspots: expect.any(Array),
            coldspots: expect.any(Array),
          }),
        })
      );
    });
  });

  describe('message handling', () => {
    it('should handle changeMode message', () => {
      const mockDocument = {
        getText: () => `info{
rowcount:3
colcount:3
}
tiles{
101,1,26,
1,1,1,
26,1,101,
}`,
        languageId: 'manicminers',
      } as any;

      provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
      provider.updateDocument(mockDocument);

      // Get the message handler
      const messageHandler = (mockWebview.onDidReceiveMessage as jest.Mock).mock.calls[0][0] as (
        data: any
      ) => void;

      // Clear previous calls
      jest.clearAllMocks();

      // Send changeMode message
      messageHandler({ type: 'changeMode', mode: 'accessibility' });

      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'updateHeatMap',
          mode: 'accessibility',
        })
      );
    });

    it('should handle navigateToHotspot message', () => {
      const mockDocument = {
        getText: () => `info{
rowcount:3
colcount:3
}
tiles{
101,1,26,
1,1,1,
26,1,101,
}`,
        languageId: 'manicminers',
        uri: { fsPath: '/test/file.dat' } as vscode.Uri,
      } as any;

      // Mock vscode.window.activeTextEditor
      const mockEditor = {
        document: mockDocument,
        selection: null,
        revealRange: jest.fn(),
      };
      (vscode.window as any).activeTextEditor = mockEditor;

      provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
      provider.updateDocument(mockDocument);

      // Get the message handler
      const messageHandler = (mockWebview.onDidReceiveMessage as jest.Mock).mock.calls[0][0] as (
        data: any
      ) => void;

      // Send navigateToHotspot message
      messageHandler({ type: 'navigateToHotspot', row: 1, col: 2 });

      // Should have called revealRange (navigation logic)
      expect(mockEditor.revealRange).toHaveBeenCalled();
    });

    it('should handle showStatistics message', () => {
      const mockDocument = {
        getText: () => `info{
rowcount:3
colcount:3
}
tiles{
101,1,26,
1,1,1,
26,1,101,
}`,
        languageId: 'manicminers',
      } as any;

      // Mock createOutputChannel
      const mockChannel = {
        clear: jest.fn(),
        append: jest.fn(),
        show: jest.fn(),
      };
      (vscode.window.createOutputChannel as jest.Mock).mockReturnValue(mockChannel);

      provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
      provider.updateDocument(mockDocument);

      // Get the message handler
      const messageHandler = (mockWebview.onDidReceiveMessage as jest.Mock).mock.calls[0][0] as (
        data: any
      ) => void;

      // Send showStatistics message
      messageHandler({ type: 'showStatistics' });

      expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('Heat Map Statistics');
      expect(mockChannel.append).toHaveBeenCalledWith(
        expect.stringContaining('Heat Map Statistics')
      );
      expect(mockChannel.show).toHaveBeenCalled();
    });
  });
});
