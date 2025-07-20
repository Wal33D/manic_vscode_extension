import { describe, expect, it, beforeEach } from '@jest/globals';
import * as vscode from 'vscode';
import { DatCompletionItemProvider } from './completionItemProvider';

// Access the mocked classes
const TextDocument = (vscode as any).TextDocument;

describe('DatCompletionItemProvider - Enhanced Features', () => {
  let provider: DatCompletionItemProvider;

  beforeEach(() => {
    provider = new DatCompletionItemProvider();
  });

  describe('Tile Category Completions', () => {
    it('should provide categorized tile completions', () => {
      const document = new TextDocument('tiles {\n  \n}', 'manicminers');
      const position = new vscode.Position(1, 2);

      const completions = provider.provideCompletionItems(document, position);

      // Check for quick access tiles
      const quickAccess = completions.find(c => c.label === '-- Quick Access Tiles --');
      expect(quickAccess).toBeDefined();
      expect(quickAccess?.kind).toBe(vscode.CompletionItemKind.Folder);

      // Check for common tiles
      const groundTile = completions.find(c => c.label === '1');
      expect(groundTile).toBeDefined();
      expect(groundTile?.detail).toContain('⭐ Ground (buildable)');

      const solidRock = completions.find(c => c.label === '38');
      expect(solidRock).toBeDefined();
      expect(solidRock?.detail).toContain('⭐ Solid rock (impassable)');
    });

    it('should show tile categories with emojis', () => {
      const document = new TextDocument('tiles {\n  \n}', 'manicminers');
      const position = new vscode.Position(1, 2);

      const completions = provider.provideCompletionItems(document, position);

      // Check for category separator
      const separator = completions.find(c => c.label === '-- All Tiles by Category --');
      expect(separator).toBeDefined();

      // Check for categorized tiles
      const lavaTile = completions.find(c => c.label === '6');
      expect(lavaTile?.detail).toContain('⭐ Lava hazard');

      const crystalTile = completions.find(c => c.label === '42');
      expect(crystalTile?.detail).toContain('Crystal seam');
    });

    it('should include drill time in tile documentation', () => {
      const document = new TextDocument('tiles {\n  \n}', 'manicminers');
      const position = new vscode.Position(1, 2);

      const completions = provider.provideCompletionItems(document, position);

      const dirtWall = completions.find(c => c.label === '26');
      expect(dirtWall).toBeDefined();
      if (dirtWall?.documentation) {
        const docs = (dirtWall.documentation as vscode.MarkdownString).value;
        expect(docs).toContain('*Drill time:* 3s');
      }

      const reinforcedDirt = completions.find(c => c.label === '76');
      expect(reinforcedDirt?.documentation).toBeDefined();
      const reinforcedDocs = (reinforcedDirt?.documentation as vscode.MarkdownString).value;
      expect(reinforcedDocs).toContain('*Drill time:* 6s');
    });

    it('should show resource yields for resource tiles', () => {
      const document = new TextDocument('tiles {\n  \n}', 'manicminers');
      const position = new vscode.Position(1, 2);

      const completions = provider.provideCompletionItems(document, position);

      const crystalSeam = completions.find(c => c.label === '42');
      if (crystalSeam?.documentation) {
        const crystalDocs = (crystalSeam.documentation as vscode.MarkdownString).value;
        expect(crystalDocs).toContain('*Yields:* crystals');
      }

      const oreSeam = completions.find(c => c.label === '46');
      if (oreSeam?.documentation) {
        const oreDocs = (oreSeam.documentation as vscode.MarkdownString).value;
        expect(oreDocs).toContain('*Yields:* ore');
      }

      const rechargeSeam = completions.find(c => c.label === '50');
      const rechargeDocs = (rechargeSeam?.documentation as vscode.MarkdownString).value;
      expect(rechargeDocs).toContain('*Yields:* recharge');
    });
  });

  describe('Context-Aware Building Completions', () => {
    it('should prioritize Tool Store when missing', () => {
      const document = new TextDocument('buildings {\n  \n}', 'manicminers');
      const position = new vscode.Position(1, 2);

      const completions = provider.provideCompletionItems(document, position);

      const toolStore = completions.find(c => c.label === 'BuildingToolStore_C');
      expect(toolStore).toBeDefined();
      expect(toolStore?.detail).toContain('REQUIRED - Place first!');
      expect(toolStore?.sortText).toBe('0_BuildingToolStore_C');
    });

    it('should include building documentation', () => {
      const document = new TextDocument('buildings {\n  \n}', 'manicminers');
      const position = new vscode.Position(1, 2);

      const completions = provider.provideCompletionItems(document, position);

      const toolStore = completions.find(c => c.label === 'BuildingToolStore_C');
      const toolStoreDocs = (toolStore?.documentation as vscode.MarkdownString).value;
      expect(toolStoreDocs).toContain('Tool Store');
      expect(toolStoreDocs).toContain('Main headquarters');
      expect(toolStoreDocs).toContain('self-powered');

      const powerStation = completions.find(c => c.label === 'BuildingPowerStation_C');
      const powerDocs = (powerStation?.documentation as vscode.MarkdownString).value;
      expect(powerDocs).toContain('Power Station');
      expect(powerDocs).toContain('Provides power to adjacent buildings');
    });

    it('should provide grid to world coordinate helper', () => {
      const document = new TextDocument('buildings {\n  \n}', 'manicminers');
      const position = new vscode.Position(1, 2);

      const completions = provider.provideCompletionItems(document, position);

      const coordHelper = completions.find(c => c.label === 'Grid to World Helper');
      expect(coordHelper).toBeDefined();
      expect(coordHelper?.detail).toContain('Convert grid (10,10) to world coordinates');
    });
  });

  describe('Landslide Frequency Completions', () => {
    it('should provide time interval suggestions', () => {
      const document = new TextDocument('landslidefrequency {\n  \n}', 'manicminers');
      const position = new vscode.Position(1, 2);

      const completions = provider.provideCompletionItems(document, position);

      const thirtySeconds = completions.find(c => c.label === '30:');
      expect(thirtySeconds).toBeDefined();
      expect(thirtySeconds?.detail).toBe('Landslide at 30 seconds');

      const docs = (thirtySeconds?.documentation as vscode.MarkdownString).value;
      expect(docs).toContain('Triggers landslide after 30 seconds (0.5 minutes)');

      const snippet = (thirtySeconds?.insertText as vscode.SnippetString).value;
      expect(snippet).toBe('30:${1:x},${2:y}/');
    });

    it('should provide custom time template', () => {
      const document = new TextDocument('landslidefrequency {\n  \n}', 'manicminers');
      const position = new vscode.Position(1, 2);

      const completions = provider.provideCompletionItems(document, position);

      const custom = completions.find(c => c.label === 'Custom time');
      expect(custom).toBeDefined();
      expect(custom?.detail).toBe('Custom landslide timing');

      const snippet = (custom?.insertText as vscode.SnippetString).value;
      expect(snippet).toBe('${1:time}:${2:x},${3:y}/');
    });
  });

  describe('Lava Spread Completions', () => {
    it('should provide lava spread patterns', () => {
      const document = new TextDocument('lavaspread {\n  \n}', 'manicminers');
      const position = new vscode.Position(1, 2);

      const completions = provider.provideCompletionItems(document, position);

      const earlySpread = completions.find(c => c.label === '60:');
      expect(earlySpread).toBeDefined();
      expect(earlySpread?.detail).toBe('Early spread (1 minute)');

      const mediumSpread = completions.find(c => c.label === '120:');
      expect(mediumSpread).toBeDefined();
      expect(mediumSpread?.detail).toBe('Medium spread (2 minutes)');
    });

    it('should provide multi-tile spread pattern', () => {
      const document = new TextDocument('lavaspread {\n  \n}', 'manicminers');
      const position = new vscode.Position(1, 2);

      const completions = provider.provideCompletionItems(document, position);

      const pattern = completions.find(c => c.label === 'Lava spread pattern');
      expect(pattern).toBeDefined();
      expect(pattern?.detail).toBe('Multi-tile lava spread');

      const snippet = (pattern?.insertText as vscode.SnippetString).value;
      expect(snippet).toBe('${1:60}:${2:x},${3:y}/${4:x2},${5:y2}/');
    });
  });

  describe('getDrillTimeForTile', () => {
    it('should calculate correct drill times', () => {
      // Use private method accessor (for testing only)
      const getDrillTime = (provider as any).getDrillTimeForTile.bind(provider);

      // Dirt walls
      expect(getDrillTime(26)).toBe('3s');
      expect(getDrillTime(76)).toBe('6s'); // Reinforced

      // Loose rock
      expect(getDrillTime(30)).toBe('5s');
      expect(getDrillTime(80)).toBe('10s'); // Reinforced

      // Hard rock
      expect(getDrillTime(34)).toBe('8s');
      expect(getDrillTime(84)).toBe('16s'); // Reinforced

      // Crystal seam
      expect(getDrillTime(42)).toBe('6s');
      expect(getDrillTime(92)).toBe('12s'); // Reinforced

      // Ore seam
      expect(getDrillTime(46)).toBe('7s');
      expect(getDrillTime(96)).toBe('14s'); // Reinforced

      // Recharge seam
      expect(getDrillTime(50)).toBe('5s');
      expect(getDrillTime(100)).toBe('10s'); // Reinforced

      // Rubble
      expect(getDrillTime(2)).toBe('1s');
      expect(getDrillTime(3)).toBe('2s');
      expect(getDrillTime(4)).toBe('3s');
      expect(getDrillTime(5)).toBe('4s');

      // Non-drillable
      expect(getDrillTime(1)).toBe('N/A');
      expect(getDrillTime(38)).toBe('N/A');
    });
  });
});
