import { MapTemplatesProvider } from './mapTemplatesProvider';
import * as vscode from 'vscode';

jest.mock('vscode');

describe('MapTemplatesProvider', () => {
  describe('getTemplates', () => {
    it('should return all templates', () => {
      const templates = MapTemplatesProvider.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every(t => t.name && t.description && t.tiles)).toBe(true);
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should filter templates by category', () => {
      const roomTemplates = MapTemplatesProvider.getTemplatesByCategory('room');
      expect(roomTemplates.length).toBeGreaterThan(0);
      expect(roomTemplates.every(t => t.category === 'room')).toBe(true);
    });

    it('should return empty array for invalid category', () => {
      const templates = MapTemplatesProvider.getTemplatesByCategory('invalid');
      expect(templates).toEqual([]);
    });
  });

  describe('template structure', () => {
    it('should have valid dimensions for all templates', () => {
      const templates = MapTemplatesProvider.getTemplates();
      templates.forEach(template => {
        expect(template.tiles.length).toBe(template.height);
        template.tiles.forEach(row => {
          expect(row.length).toBe(template.width);
        });
      });
    });

    it('should have valid tile IDs', () => {
      const templates = MapTemplatesProvider.getTemplates();
      templates.forEach(template => {
        template.tiles.forEach(row => {
          row.forEach(tile => {
            expect(tile).toBeGreaterThanOrEqual(1);
            expect(tile).toBeLessThanOrEqual(115);
          });
        });
      });
    });
  });

  describe('showTemplatePicker', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return undefined when category selection is cancelled', async () => {
      (vscode.window.showQuickPick as jest.Mock).mockResolvedValueOnce(undefined);
      const result = await MapTemplatesProvider.showTemplatePicker();
      expect(result).toBeUndefined();
    });

    it('should return undefined when template selection is cancelled', async () => {
      (vscode.window.showQuickPick as jest.Mock)
        .mockResolvedValueOnce('Room')
        .mockResolvedValueOnce(undefined);
      const result = await MapTemplatesProvider.showTemplatePicker();
      expect(result).toBeUndefined();
    });

    it('should return selected template', async () => {
      const expectedTemplate = MapTemplatesProvider.getTemplates()[0];
      (vscode.window.showQuickPick as jest.Mock)
        .mockResolvedValueOnce('All')
        .mockResolvedValueOnce({ template: expectedTemplate });
      const result = await MapTemplatesProvider.showTemplatePicker();
      expect(result).toBe(expectedTemplate);
    });
  });

  describe('insertTemplate', () => {
    let mockEditor: any;
    let mockDocument: any;

    beforeEach(() => {
      mockDocument = {
        getText: () => `info{
rowcount:10
colcount:10
}
tiles{
1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,
1,1,1,1,1,1,1,1,1,1,
}`,
        lineAt: (_line: number) => ({
          text: '1,1,1,1,1,1,1,1,1,1,',
        }),
      };

      mockEditor = {
        document: mockDocument,
        edit: jest.fn(callback => {
          const editBuilder = {
            replace: jest.fn(),
          };
          callback(editBuilder);
          return Promise.resolve(true);
        }),
      };
    });

    it('should insert template at correct position', () => {
      const template = {
        name: 'Test Template',
        description: 'Test',
        width: 3,
        height: 3,
        category: 'room' as const,
        tiles: [
          [40, 40, 40],
          [40, 1, 40],
          [40, 40, 40],
        ],
      };

      const position = new vscode.Position(6, 0); // Row 2 in tiles section
      MapTemplatesProvider.insertTemplate(mockEditor, template, position);

      expect(mockEditor.edit).toHaveBeenCalled();
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Inserted template: Test Template (3x3)'
      );
    });

    it('should show error when tiles section not found', () => {
      mockDocument.getText = () => 'info{\nrowcount:10\n}';
      const template = MapTemplatesProvider.getTemplates()[0];
      const position = new vscode.Position(0, 0);

      MapTemplatesProvider.insertTemplate(mockEditor, template, position);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Could not find tiles section');
    });

    it('should show error when cursor outside tiles section', () => {
      const template = MapTemplatesProvider.getTemplates()[0];
      const position = new vscode.Position(1, 0); // In info section

      MapTemplatesProvider.insertTemplate(mockEditor, template, position);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        'Please position cursor within the tiles section'
      );
    });
  });
});
