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
      expect((hover as any)?.contents).toBe('Number of rows in the map.');
    });

    it('should provide hover for colcount', () => {
      const document = new TextDocument('info {\n  colcount: 25\n}', 'manicminers');
      const position = new vscode.Position(1, 4); // Position on 'colcount'

      const hover = provider.provideHover(document, position, cancellationToken);

      expect(hover).toBeInstanceOf(vscode.Hover);
      expect((hover as any)?.contents).toBe('Number of columns in the map.');
    });

    it('should provide hover for camerapos', () => {
      const document = new TextDocument('info {\n  camerapos: Translation\n}', 'manicminers');
      const position = new vscode.Position(1, 4); // Position on 'camerapos'

      const hover = provider.provideHover(document, position, cancellationToken);

      expect(hover).toBeInstanceOf(vscode.Hover);
      expect((hover as any)?.contents).toBe(
        'Camera position with translation, rotation, and scale.'
      );
    });

    it('should provide hover for Translation component', () => {
      const document = new TextDocument('camerapos: Translation: X=100', 'manicminers');
      const position = new vscode.Position(0, 12); // Position on 'Translation'

      const hover = provider.provideHover(document, position, cancellationToken);

      expect(hover).toBeInstanceOf(vscode.Hover);
      expect((hover as any)?.contents).toBe(
        'Translation component of camerapos, representing the position in X, Y, Z coordinates.'
      );
    });

    it('should provide hover for Rotation component', () => {
      const document = new TextDocument('Rotation: P=45', 'manicminers');
      const position = new vscode.Position(0, 4); // Position on 'Rotation'

      const hover = provider.provideHover(document, position, cancellationToken);

      expect(hover).toBeInstanceOf(vscode.Hover);
      expect((hover as any)?.contents).toBe(
        'Rotation component of camerapos, representing the pitch (P), yaw (Y), and roll (R) angles.'
      );
    });

    it('should provide hover for Scale component', () => {
      const document = new TextDocument('Scale X=1.0', 'manicminers');
      const position = new vscode.Position(0, 2); // Position on 'Scale'

      const hover = provider.provideHover(document, position, cancellationToken);

      expect(hover).toBeInstanceOf(vscode.Hover);
      expect((hover as any)?.contents).toBe(
        'Scale component of camerapos, representing the scale in X, Y, Z axes.'
      );
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
      expect((hover as any)?.contents).toBe('Number of rows in the map.');
    });

    it('should provide hover for various info fields', () => {
      const fieldsToTest = [
        { field: 'biome', description: 'The biome type of the map (e.g., rock, ice, lava).' },
        { field: 'creator', description: 'Name of the map creator.' },
        { field: 'levelname', description: 'Name of the level.' },
        { field: 'oxygen', description: 'Oxygen levels in the map.' },
        { field: 'gravity', description: 'Gravity setting of the map.' },
      ];

      fieldsToTest.forEach(({ field, description }) => {
        const document = new TextDocument(`info {\n  ${field}: value\n}`, 'manicminers');
        const position = new vscode.Position(1, 4);

        const hover = provider.provideHover(document, position, cancellationToken);

        expect(hover).toBeInstanceOf(vscode.Hover);
        expect((hover as any)?.contents).toBe(description);
      });
    });
  });
});
