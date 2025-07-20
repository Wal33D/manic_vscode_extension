import { describe, expect, it, beforeEach } from '@jest/globals';
import * as vscode from 'vscode';
import { DatCompletionItemProvider } from './completionItemProvider';

// Access the mocked TextDocument
const TextDocument = (vscode as any).TextDocument;

describe('DatCompletionItemProvider', () => {
  let provider: DatCompletionItemProvider;

  beforeEach(() => {
    provider = new DatCompletionItemProvider();
  });

  describe('provideCompletionItems', () => {
    it('should provide completion items when cursor is at start of empty line in info section', () => {
      const document = new TextDocument('info {\n  \n}', 'manicminers');
      const position = new vscode.Position(1, 2); // Position at start of empty line inside info

      const items = provider.provideCompletionItems(document, position);

      expect(items.length).toBeGreaterThan(10);
      expect(items[0]).toBeInstanceOf(vscode.CompletionItem);
      expect(items.some(item => item.label === 'rowcount')).toBe(true);
      expect(items[0].kind).toBe(vscode.CompletionItemKind.Field);
    });

    it('should provide completion items inside info block', () => {
      const document = new TextDocument('info {\n\n}', 'manicminers');
      const position = new vscode.Position(1, 0); // At start of empty line inside info

      const items = provider.provideCompletionItems(document, position);

      expect(items.length).toBeGreaterThan(10);
      expect(items.some(item => item.label === 'colcount')).toBe(true);
      expect(items.some(item => item.label === 'camerapos')).toBe(true);
      expect(items.some(item => item.label === 'biome')).toBe(true);
    });

    it('should provide tile completion items inside tiles block', () => {
      const document = new TextDocument('tiles {\n  \n}', 'manicminers');
      const position = new vscode.Position(1, 2);

      const items = provider.provideCompletionItems(document, position);

      expect(items.length).toBeGreaterThan(0);
      // Should provide tile ID completions
      expect(items.some(item => item.label === '1')).toBe(true); // Ground tile
      expect(items.some(item => item.label === '38')).toBe(true); // Solid rock
    });

    it('should provide section completions outside any section', () => {
      const document = new TextDocument('\n', 'manicminers');
      const position = new vscode.Position(0, 0);

      const items = provider.provideCompletionItems(document, position);

      expect(items.length).toBeGreaterThan(10);
      // Should provide section completions
      expect(items.some(item => item.label === 'info{')).toBe(true);
      expect(items.some(item => item.label === 'tiles{')).toBe(true);
      expect(items.some(item => item.label === 'height{')).toBe(true);
    });

    it('should handle various info field names', () => {
      const document = new TextDocument('info {\n  \n}', 'manicminers');
      const position = new vscode.Position(1, 2); // Inside info block

      const items = provider.provideCompletionItems(document, position);
      const labels = items.map(item => item.label);

      // Check for various expected fields
      expect(labels).toContain('rowcount');
      expect(labels).toContain('colcount');
      expect(labels).toContain('camerapos');
      expect(labels).toContain('biome');
      expect(labels).toContain('creator');
      expect(labels).toContain('levelname');
      expect(labels).toContain('oxygen');
    });

    it('should handle info block with existing content', () => {
      const document = new TextDocument('info {\n  rowcount: 25\n  \n}', 'manicminers');
      const position = new vscode.Position(2, 2); // On empty line after existing content

      const items = provider.provideCompletionItems(document, position);

      expect(items.length).toBeGreaterThan(10);
      // Should still provide all items, even if some are already used
      expect(items.some(item => item.label === 'colcount')).toBe(true);
    });

    it('should handle different spacing in info block declaration', () => {
      const document = new TextDocument('  info  {\n  \n}', 'manicminers');
      const position = new vscode.Position(1, 2); // Inside info block

      const items = provider.provideCompletionItems(document, position);

      expect(items.length).toBeGreaterThan(10);
      expect(items.some(item => item.label === 'rowcount')).toBe(true);
    });
  });
});
