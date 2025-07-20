import { describe, expect, it, beforeEach } from '@jest/globals';
import * as vscode from 'vscode';
import { DatHoverProvider } from './hoverProvider';

// Access the mocked classes
const TextDocument = (vscode as any).TextDocument;
const CancellationToken = (vscode as any).CancellationToken;

describe('DatHoverProvider', () => {
  let provider: DatHoverProvider;
  let cancellationToken: vscode.CancellationToken;

  beforeEach(() => {
    provider = new DatHoverProvider();
    cancellationToken = new CancellationToken();
  });

  describe('provideHover', () => {
    it('should provide hover for rowcount', () => {
      const document = new TextDocument('info {\n  rowcount: 25\n}', 'manicminers');
      const position = new vscode.Position(1, 4); // Position on 'rowcount'

      const hover = provider.provideHover(document, position, cancellationToken);

      expect(hover).toBeInstanceOf(vscode.Hover);
      const content = (hover as any)?.contents;
      expect(content.value).toContain('**rowcount**');
      expect(content.value).toContain('Number of rows in the level grid');
    });

    it('should provide hover for colcount', () => {
      const document = new TextDocument('info {\n  colcount: 25\n}', 'manicminers');
      const position = new vscode.Position(1, 4); // Position on 'colcount'

      const hover = provider.provideHover(document, position, cancellationToken);

      expect(hover).toBeInstanceOf(vscode.Hover);
      const content = (hover as any)?.contents;
      expect(content.value).toContain('**colcount**');
      expect(content.value).toContain('Number of columns in the level grid');
    });

    it('should provide hover for camerapos', () => {
      const document = new TextDocument('info {\n  camerapos: Translation\n}', 'manicminers');
      const position = new vscode.Position(1, 4); // Position on 'camerapos'

      const hover = provider.provideHover(document, position, cancellationToken);

      expect(hover).toBeInstanceOf(vscode.Hover);
      const content = (hover as any)?.contents;
      expect(content.value).toContain('**camerapos**');
      expect(content.value).toContain('Initial camera position and orientation');
    });

    it('should provide hover for Translation component', () => {
      const document = new TextDocument(
        'info {\n  camerapos: Translation: X=100\n}',
        'manicminers'
      );
      const position = new vscode.Position(1, 26); // Position on '='

      const hover = provider.provideHover(document, position, cancellationToken);

      expect(hover).toBeInstanceOf(vscode.Hover);
      const content = (hover as any)?.contents;
      expect(content.value).toContain('**X axis**');
      expect(content.value).toContain('Horizontal position');
    });

    it('should provide hover for Rotation component', () => {
      const document = new TextDocument('info {\n  camerapos: Rotation: P=45\n}', 'manicminers');
      const position = new vscode.Position(1, 24); // Position on 'P'

      const hover = provider.provideHover(document, position, cancellationToken);

      expect(hover).toBeInstanceOf(vscode.Hover);
      const content = (hover as any)?.contents;
      expect(content.value).toContain('**Pitch**');
      expect(content.value).toContain('Rotation around the X axis');
    });

    it('should provide hover for Scale component', () => {
      const document = new TextDocument('info {\n  camerapos: Scale X=1.0\n}', 'manicminers');
      const position = new vscode.Position(1, 22); // Position on 'X'

      const hover = provider.provideHover(document, position, cancellationToken);

      expect(hover).toBeInstanceOf(vscode.Hover);
      const content = (hover as any)?.contents;
      expect(content.value).toContain('**X axis**');
      expect(content.value).toContain('Horizontal position');
    });

    it('should return undefined for unknown words', () => {
      const document = new TextDocument('info {\n  unknown: value\n}', 'manicminers');
      const position = new vscode.Position(1, 4); // Position on 'unknown'

      const hover = provider.provideHover(document, position, cancellationToken);

      expect(hover).toBeUndefined();
    });

    it('should return undefined when not on a word', () => {
      const document = new TextDocument('info {\n  \n}', 'manicminers');
      const position = new vscode.Position(1, 2); // Empty space

      const hover = provider.provideHover(document, position, cancellationToken);

      expect(hover).toBeUndefined();
    });

    it('should handle case-insensitive field names', () => {
      const document = new TextDocument('info {\n  ROWCOUNT: 25\n}', 'manicminers');
      const position = new vscode.Position(1, 4); // Position on 'ROWCOUNT'

      const hover = provider.provideHover(document, position, cancellationToken);

      expect(hover).toBeInstanceOf(vscode.Hover);
      const content = (hover as any)?.contents;
      expect(content.value).toContain('**ROWCOUNT**');
      expect(content.value).toContain('Number of rows in the level grid');
    });

    it('should provide hover for various info fields', () => {
      const fieldsToTest = [
        { field: 'biome', contains: 'Level biome determining visual theme' },
        { field: 'creator', contains: 'Name of the level creator' },
        { field: 'levelname', contains: 'Display name for the level' },
        { field: 'oxygen', contains: 'Oxygen/time limit for the mission' },
      ];

      fieldsToTest.forEach(({ field, contains }) => {
        const document = new TextDocument(`info {\n  ${field}: value\n}`, 'manicminers');
        const position = new vscode.Position(1, 4);

        const hover = provider.provideHover(document, position, cancellationToken);

        expect(hover).toBeInstanceOf(vscode.Hover);
        const content = (hover as any)?.contents;
        expect(content.value).toContain(contains);
      });
    });

    it('should provide hover for tile IDs', () => {
      const document = new TextDocument('tiles {\n  1,38,42\n}', 'manicminers');
      const position = new vscode.Position(1, 5); // Position on '38'

      const hover = provider.provideHover(document, position, cancellationToken);

      expect(hover).toBeInstanceOf(vscode.Hover);
      const content = (hover as any)?.contents;
      expect(content.value).toContain('**Tile 38: Solid Rock**');
      expect(content.value).toContain('Impenetrable solid rock wall');
    });

    it('should provide hover for section names', () => {
      const document = new TextDocument('tiles {\n  1,2,3\n}', 'manicminers');
      const position = new vscode.Position(0, 2); // Position on 'tiles'

      const hover = provider.provideHover(document, position, cancellationToken);

      expect(hover).toBeInstanceOf(vscode.Hover);
      const content = (hover as any)?.contents;
      expect(content.value).toContain('**tiles section**');
      expect(content.value).toContain('Required section defining the tile layout');
    });
  });
});
