import * as vscode from 'vscode';
import { QuickActionsProvider } from './quickActionsProvider';

jest.mock('vscode');

describe('QuickActionsProvider', () => {
  let provider: QuickActionsProvider;
  let mockDocument: vscode.TextDocument;
  let mockRange: vscode.Range;
  let mockTileSetsManager: any;

  beforeEach(() => {
    mockTileSetsManager = {
      getTileSets: jest.fn().mockResolvedValue([]),
      saveTileSet: jest.fn(),
      deleteTileSet: jest.fn(),
      showTileSetPicker: jest.fn(),
      createTileSetFromSelection: jest.fn(),
    };

    provider = new QuickActionsProvider(mockTileSetsManager);
    mockRange = new vscode.Range(new vscode.Position(5, 0), new vscode.Position(5, 10));
  });

  describe('provideCodeActions', () => {
    it('should provide reinforced conversion for normal tiles', () => {
      mockDocument = {
        getText: (range?: vscode.Range) => {
          if (!range) {
            return `info{
rowcount:3
colcount:3
}
tiles{
1,2,3,
4,5,6,
7,8,9,
}`;
          }
          return '1,2,3,';
        },
        lineAt: () => ({ text: '1,2,3,' }),
        uri: { fsPath: '/test.dat' } as vscode.Uri,
      } as any;

      const actions = provider.provideCodeActions(
        mockDocument,
        mockRange,
        {} as vscode.CodeActionContext,
        {} as vscode.CancellationToken
      );

      expect(actions.length).toBeGreaterThan(0);
      const reinforcedAction = actions.find(a => a.title.includes('Convert to Reinforced'));
      expect(reinforcedAction).toBeDefined();
      expect(reinforcedAction?.title).toContain('1 → 51');
    });

    it('should provide normal conversion for reinforced tiles', () => {
      mockDocument = {
        getText: (range?: vscode.Range) => {
          if (!range) {
            return `info{
rowcount:3
colcount:3
}
tiles{
51,52,53,
54,55,56,
57,58,59,
}`;
          }
          return '51,52,53,';
        },
        lineAt: () => ({ text: '51,52,53,' }),
        uri: { fsPath: '/test.dat' } as vscode.Uri,
      } as any;

      const actions = provider.provideCodeActions(
        mockDocument,
        mockRange,
        {} as vscode.CodeActionContext,
        {} as vscode.CancellationToken
      );

      const normalAction = actions.find(a => a.title.includes('Convert to Normal'));
      expect(normalAction).toBeDefined();
      expect(normalAction?.title).toContain('51 → 1');
    });

    it('should provide tile replacement options', () => {
      mockDocument = {
        getText: (range?: vscode.Range) => {
          if (!range) {
            return `info{
rowcount:3
colcount:3
}
tiles{
1,2,3,
4,5,6,
7,8,9,
}`;
          }
          return '1';
        },
        lineAt: () => ({ text: '1,2,3,' }),
        uri: { fsPath: '/test.dat' } as vscode.Uri,
      } as any;

      const actions = provider.provideCodeActions(
        mockDocument,
        mockRange,
        {} as vscode.CodeActionContext,
        {} as vscode.CancellationToken
      );

      const replacementActions = actions.filter(a => a.title.includes('Replace with'));
      expect(replacementActions.length).toBeGreaterThan(0);
      expect(replacementActions.some(a => a.title.includes('Lava'))).toBe(true);
      expect(replacementActions.some(a => a.title.includes('Water'))).toBe(true);
    });

    it('should not provide actions outside tiles section', () => {
      mockDocument = {
        getText: (range?: vscode.Range) => {
          if (!range) {
            return `info{
rowcount:3
colcount:3
}
tiles{
1,2,3,
}`;
          }
          return 'rowcount:3';
        },
        lineAt: () => ({ text: 'rowcount:3' }),
        uri: { fsPath: '/test.dat' } as vscode.Uri,
      } as any;

      const actionsOutside = provider.provideCodeActions(
        mockDocument,
        new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 10)),
        {} as vscode.CodeActionContext,
        {} as vscode.CancellationToken
      );

      expect(actionsOutside).toHaveLength(0);
    });

    it('should provide fill area action for multi-line selection', () => {
      mockDocument = {
        getText: (range?: vscode.Range) => {
          if (!range) {
            return `info{
rowcount:3
colcount:3
}
tiles{
1,2,3,
4,5,6,
7,8,9,
}`;
          }
          return '1,2,3,\n4,5,6,';
        },
        lineAt: () => ({ text: '1,2,3,' }),
        uri: { fsPath: '/test.dat' } as vscode.Uri,
      } as any;

      const multiLineRange = new vscode.Range(
        new vscode.Position(5, 0),
        new vscode.Position(6, 10)
      );

      const actions = provider.provideCodeActions(
        mockDocument,
        multiLineRange,
        {} as vscode.CodeActionContext,
        {} as vscode.CancellationToken
      );

      const fillAction = actions.find(a => a.title.includes('Fill Area'));
      expect(fillAction).toBeDefined();
    });

    it('should provide replace all action', () => {
      mockDocument = {
        getText: (range?: vscode.Range) => {
          if (!range) {
            return `info{
rowcount:3
colcount:3
}
tiles{
1,2,3,
4,5,6,
7,8,9,
}`;
          }
          return '5';
        },
        lineAt: () => ({ text: '4,5,6,' }),
        uri: { fsPath: '/test.dat' } as vscode.Uri,
      } as any;

      const actions = provider.provideCodeActions(
        mockDocument,
        new vscode.Range(new vscode.Position(6, 2), new vscode.Position(6, 3)),
        {} as vscode.CodeActionContext,
        {} as vscode.CancellationToken
      );

      const replaceAllAction = actions.find(a => a.title.includes('Replace All 5'));
      expect(replaceAllAction).toBeDefined();
    });

    it('should provide custom tile set action', () => {
      mockDocument = {
        getText: (range?: vscode.Range) => {
          if (!range) {
            return `info{
rowcount:3
colcount:3
}
tiles{
1,2,3,
4,5,6,
7,8,9,
}`;
          }
          return '1,2,3,';
        },
        lineAt: () => ({ text: '1,2,3,' }),
        uri: { fsPath: '/test.dat' } as vscode.Uri,
      } as any;

      const actions = provider.provideCodeActions(
        mockDocument,
        mockRange,
        {} as vscode.CodeActionContext,
        {} as vscode.CancellationToken
      );

      const tileSetAction = actions.find(a => a.title.includes('Custom Tile Set'));
      expect(tileSetAction).toBeDefined();
    });
  });
});
