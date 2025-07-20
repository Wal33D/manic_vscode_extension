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
    it('should provide completion items when cursor is at end of info { line', () => {
      const document = new TextDocument('info {\n  \n}', 'manicminers');
      const position = new vscode.Position(0, 6); // Position right after 'info {'

      const items = provider.provideCompletionItems(document, position);

      expect(items).toHaveLength(30);
      expect(items[0]).toBeInstanceOf(vscode.CompletionItem);
      expect(items[0].label).toBe('rowcount');
      expect(items[0].kind).toBe(vscode.CompletionItemKind.Field);
    });

    it('should provide completion items at the start of info block', () => {
      const document = new TextDocument('  info  {  ', 'manicminers');
      const position = new vscode.Position(0, 11); // At end of line

      const items = provider.provideCompletionItems(document, position);

      expect(items).toHaveLength(30);
      expect(items.some(item => item.label === 'colcount')).toBe(true);
      expect(items.some(item => item.label === 'camerapos')).toBe(true);
      expect(items.some(item => item.label === 'biome')).toBe(true);
    });

    it('should not provide completion items outside info block', () => {
      const document = new TextDocument('tiles {', 'manicminers');
      const position = new vscode.Position(0, 7);

      const items = provider.provideCompletionItems(document, position);

      expect(items).toHaveLength(0);
    });

    it('should not provide completion items before info block', () => {
      const document = new TextDocument('  \ninfo {\n}', 'manicminers');
      const position = new vscode.Position(0, 2);

      const items = provider.provideCompletionItems(document, position);

      expect(items).toHaveLength(0);
    });

    it('should handle various info field names', () => {
      const document = new TextDocument('info { ', 'manicminers');
      const position = new vscode.Position(0, 7); // After 'info { '

      const items = provider.provideCompletionItems(document, position);
      const labels = items.map(item => item.label);

      // Check for various expected fields
      expect(labels).toContain('rowcount');
      expect(labels).toContain('colcount');
      expect(labels).toContain('camerapos');
      expect(labels).toContain('Translation');
      expect(labels).toContain('Rotation');
      expect(labels).toContain('Scale');
      expect(labels).toContain('biome');
      expect(labels).toContain('creator');
      expect(labels).toContain('levelname');
      expect(labels).toContain('oxygen');
      expect(labels).toContain('gravity');
    });

    it('should handle info block with existing content', () => {
      const document = new TextDocument('info {\n  rowcount: 25\n  info {  ', 'manicminers');
      const position = new vscode.Position(2, 10); // At end of nested info line

      const items = provider.provideCompletionItems(document, position);

      expect(items).toHaveLength(30);
      // Should still provide all items, even if some are already used
    });

    it('should handle different spacing in info block declaration', () => {
      const document = new TextDocument('  info  {  ', 'manicminers');
      const position = new vscode.Position(0, 11); // At end of line with spaces

      const items = provider.provideCompletionItems(document, position);

      expect(items).toHaveLength(30);
    });
  });
});
