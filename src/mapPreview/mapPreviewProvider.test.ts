import * as vscode from 'vscode';
import { MapPreviewProvider } from './mapPreviewProvider';

jest.mock('vscode');

describe('MapPreviewProvider', () => {
  let provider: MapPreviewProvider;
  let mockUri: vscode.Uri;

  beforeEach(() => {
    mockUri = { fsPath: '/test/extension' } as vscode.Uri;
    provider = new MapPreviewProvider(mockUri);
  });

  describe('updateDocument', () => {
    it('should handle documents with tiles section', () => {
      const mockDocument = {
        getText: () => `info{
rowcount:10
colcount:10
}
tiles{
1,1,1,1,1,1,1,1,1,1,
1,6,6,6,1,1,11,11,1,1,
1,6,6,6,1,1,11,11,1,1,
1,1,1,1,1,1,1,1,1,1,
1,26,26,26,1,42,42,42,1,1,
1,26,26,26,1,42,42,42,1,1,
1,26,26,26,1,42,42,42,1,1,
1,1,1,1,1,1,1,1,1,1,
1,34,34,34,1,46,46,46,1,1,
1,1,1,1,1,1,1,1,1,1,
}`,
        languageId: 'manicminers',
      } as vscode.TextDocument;

      const mockView = {
        webview: {
          postMessage: jest.fn(),
        },
      };

      // Set up the provider with a mock view
      (provider as any)._view = mockView;

      // Test updateDocument
      provider.updateDocument(mockDocument);

      // Verify postMessage was called with tile data
      expect(mockView.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'updateTiles',
          rowcount: 10,
          colcount: 10,
          tiles: expect.any(Array),
        })
      );
    });

    it('should handle documents without tiles section', () => {
      const mockDocument = {
        getText: () => `info{
rowcount:10
colcount:10
}`,
        languageId: 'manicminers',
      } as vscode.TextDocument;

      const mockView = {
        webview: {
          postMessage: jest.fn(),
        },
      };

      (provider as any)._view = mockView;

      provider.updateDocument(mockDocument);

      expect(mockView.webview.postMessage).toHaveBeenCalledWith({
        type: 'noTiles',
      });
    });

    it('should handle documents with invalid tiles data', () => {
      const mockDocument = {
        getText: () => `tiles{
invalid,data,here
}`,
        languageId: 'manicminers',
      } as vscode.TextDocument;

      const mockView = {
        webview: {
          postMessage: jest.fn(),
        },
      };

      (provider as any)._view = mockView;

      provider.updateDocument(mockDocument);

      // Should still send tile data even if parsing fails for some tiles
      expect(mockView.webview.postMessage).toHaveBeenCalled();
      const call = mockView.webview.postMessage.mock.calls[0][0];
      expect(call.type).toBe('updateTiles');
    });
  });
});
