import * as vscode from 'vscode';
import { MapEditorValidator, ValidationCategory } from './mapEditorValidator';

// Mock vscode module
jest.mock('vscode');

// Mock document
function createMockDocument(content: string): vscode.TextDocument {
  return {
    getText: () => content,
    uri: vscode.Uri.parse('file:///test.dat'),
    lineCount: content.split('\n').length,
  } as any;
}

describe('MapEditorValidator', () => {
  describe('Basic validation', () => {
    it('should validate a simple valid map', async () => {
      const content = `[info]
rowcount:10
colcount:10

[tiles]
1,1,1,1,1,1,1,1,1,1
1,0,0,0,0,0,0,0,0,1
1,0,101,0,0,0,0,0,0,1
1,0,0,0,0,0,0,0,0,1
1,0,0,0,42,0,0,0,0,1
1,0,0,0,0,0,0,0,0,1
1,0,0,0,0,0,46,0,0,1
1,0,0,0,0,0,0,0,0,1
1,0,0,0,0,0,0,0,0,1
1,1,1,1,1,1,1,1,1,1`;

      const doc = createMockDocument(content);
      const validator = new MapEditorValidator(doc);
      const result = await validator.validateForEditor();

      expect(result.issues.filter(i => i.type === 'error')).toHaveLength(0);
    });

    it('should detect missing spawn points', async () => {
      const content = `[info]
rowcount:5
colcount:5

[tiles]
1,1,1,1,1
1,0,0,0,1
1,0,0,0,1
1,0,0,0,1
1,1,1,1,1`;

      const doc = createMockDocument(content);
      const validator = new MapEditorValidator(doc);
      const result = await validator.validateForEditor();

      const spawnErrors = result.issues.filter(
        i => i.category === ValidationCategory.SPAWN_POINTS && i.type === 'error'
      );
      expect(spawnErrors).toHaveLength(1);
      expect(spawnErrors[0].message).toContain('No Tool Store');
    });
  });

  describe('Spawn point validation', () => {
    it('should warn about limited space around spawn', async () => {
      const content = `[info]
rowcount:5
colcount:5

[tiles]
40,40,40,40,40
40,40,40,40,40
40,40,101,40,40
40,40,40,40,40
40,40,40,40,40`;

      const doc = createMockDocument(content);
      const validator = new MapEditorValidator(doc);
      const result = await validator.validateForEditor();

      const spawnWarnings = result.issues.filter(
        i => i.category === ValidationCategory.SPAWN_POINTS && i.type === 'warning'
      );
      expect(spawnWarnings.length).toBeGreaterThan(0);
      expect(spawnWarnings[0].message).toContain('limited surrounding space');
    });

    it('should info about multiple spawn points', async () => {
      const content = `[info]
rowcount:5
colcount:5

[tiles]
1,1,1,1,1
1,101,0,101,1
1,0,0,0,1
1,101,0,0,1
1,1,1,1,1`;

      const doc = createMockDocument(content);
      const validator = new MapEditorValidator(doc);
      const result = await validator.validateForEditor();

      const spawnInfo = result.issues.filter(
        i => i.category === ValidationCategory.SPAWN_POINTS && i.type === 'info'
      );
      expect(spawnInfo.length).toBeGreaterThan(0);
      expect(spawnInfo[0].message).toContain('Multiple Tool Stores');
    });
  });

  describe('Hazard validation', () => {
    it('should warn about small lava pools', async () => {
      const content = `[info]
rowcount:5
colcount:5

[tiles]
1,1,1,1,1
1,0,6,0,1
1,0,0,0,1
1,0,0,0,1
1,1,1,1,1`;

      const doc = createMockDocument(content);
      const validator = new MapEditorValidator(doc);
      const result = await validator.validateForEditor();

      const hazardWarnings = result.issues.filter(
        i => i.category === ValidationCategory.HAZARDS && i.type === 'warning'
      );
      const lavaWarning = hazardWarnings.find(w => w.message.includes('Small lava pool'));
      expect(lavaWarning).toBeDefined();
    });

    it('should warn about hazards near spawn', async () => {
      const content = `[info]
rowcount:5
colcount:5

[tiles]
1,1,1,1,1
1,101,6,0,1
1,0,0,0,1
1,0,0,0,1
1,1,1,1,1`;

      const doc = createMockDocument(content);
      const validator = new MapEditorValidator(doc);
      const result = await validator.validateForEditor();

      const hazardWarnings = result.issues.filter(
        i => i.category === ValidationCategory.HAZARDS && i.type === 'warning'
      );
      const nearSpawnWarning = hazardWarnings.find(w => w.message.includes('near spawn point'));
      expect(nearSpawnWarning).toBeDefined();
    });
  });

  describe('Resource validation', () => {
    it('should warn about missing crystals', async () => {
      const content = `[info]
rowcount:5
colcount:5

[tiles]
1,1,1,1,1
1,101,0,0,1
1,0,0,0,1
1,0,0,46,1
1,1,1,1,1`;

      const doc = createMockDocument(content);
      const validator = new MapEditorValidator(doc);
      const result = await validator.validateForEditor();

      const resourceWarnings = result.issues.filter(
        i => i.category === ValidationCategory.RESOURCES && i.type === 'warning'
      );
      const crystalWarning = resourceWarnings.find(w => w.message.includes('No crystal deposits'));
      expect(crystalWarning).toBeDefined();
    });

    it('should info about unbalanced resources', async () => {
      const content = `[info]
rowcount:5
colcount:5

[tiles]
1,1,1,1,1
1,101,42,42,1
1,42,42,42,1
1,42,42,46,1
1,1,1,1,1`;

      const doc = createMockDocument(content);
      const validator = new MapEditorValidator(doc);
      const result = await validator.validateForEditor();

      const resourceInfo = result.issues.filter(
        i => i.category === ValidationCategory.RESOURCES && i.type === 'info'
      );
      const balanceInfo = resourceInfo.find(i => i.message.includes('Unbalanced resource ratio'));
      expect(balanceInfo).toBeDefined();
    });
  });

  describe('Performance validation', () => {
    it('should warn about large maps', async () => {
      const rows = 250;
      const cols = 250;
      const tiles = Array(rows).fill(null).map(() => Array(cols).fill('1').join(','));
      
      const content = `[info]
rowcount:${rows}
colcount:${cols}

[tiles]
${tiles.join('\n')}`;

      const doc = createMockDocument(content);
      const validator = new MapEditorValidator(doc);
      const result = await validator.validateForEditor();

      const perfWarnings = result.issues.filter(
        i => i.category === ValidationCategory.PERFORMANCE && i.type === 'warning'
      );
      const sizeWarning = perfWarnings.find(w => w.message.includes('Large map detected'));
      expect(sizeWarning).toBeDefined();
    });
  });

  describe('Statistics generation', () => {
    it('should calculate correct statistics', async () => {
      const content = `[info]
rowcount:5
colcount:5

[tiles]
40,40,40,40,40
40,1,1,1,40
40,1,101,42,40
40,1,46,6,40
40,40,40,40,40`;

      const doc = createMockDocument(content);
      const validator = new MapEditorValidator(doc);
      const result = await validator.validateForEditor();

      expect(result.statistics.totalTiles).toBe(25);
      expect(result.statistics.walkableArea).toBeGreaterThan(0);
      expect(result.statistics.wallArea).toBeGreaterThan(0);
      expect(result.statistics.resourceCount.crystals).toBe(1);
      expect(result.statistics.resourceCount.ore).toBe(1);
      expect(result.statistics.hazardCount.lava).toBe(1);
      expect(result.statistics.spawnPointCount).toBe(1);
    });
  });

  describe('Suggestions generation', () => {
    it('should suggest adding spawn point when missing', async () => {
      const content = `[info]
rowcount:5
colcount:5

[tiles]
1,1,1,1,1
1,0,0,0,1
1,0,0,0,1
1,0,0,0,1
1,1,1,1,1`;

      const doc = createMockDocument(content);
      const validator = new MapEditorValidator(doc);
      const result = await validator.validateForEditor();

      const spawnSuggestion = result.suggestions.find(
        s => s.message.includes('Add at least one Tool Store')
      );
      expect(spawnSuggestion).toBeDefined();
      expect(spawnSuggestion?.priority).toBe('high');
      expect(spawnSuggestion?.autoFixAvailable).toBe(true);
    });

    it('should suggest adding resources when too few', async () => {
      const content = `[info]
rowcount:10
colcount:10

[tiles]
1,1,1,1,1,1,1,1,1,1
1,0,0,0,0,0,0,0,0,1
1,0,101,0,0,0,0,0,0,1
1,0,0,0,0,0,0,0,0,1
1,0,0,0,42,0,0,0,0,1
1,0,0,0,0,0,0,0,0,1
1,0,0,0,0,0,0,0,0,1
1,0,0,0,0,0,0,0,0,1
1,0,0,0,0,0,0,0,0,1
1,1,1,1,1,1,1,1,1,1`;

      const doc = createMockDocument(content);
      const validator = new MapEditorValidator(doc);
      const result = await validator.validateForEditor();

      const resourceSuggestion = result.suggestions.find(
        s => s.message.includes('Consider adding more resources')
      );
      expect(resourceSuggestion).toBeDefined();
      expect(resourceSuggestion?.priority).toBe('medium');
    });
  });

  describe('Category classification', () => {
    it('should categorize issues correctly', async () => {
      const content = `[info]
rowcount:5
colcount:5

[tiles]
1,1,1,1,1
1,0,0,0,1
1,0,0,0,1
1,0,0,0,1
1,1,1,1,1

[objectives]
collect 10 crystals`;

      const doc = createMockDocument(content);
      const validator = new MapEditorValidator(doc);
      const result = await validator.validateForEditor();

      // Should have spawn point issue
      const spawnIssues = result.issues.filter(i => i.category === ValidationCategory.SPAWN_POINTS);
      expect(spawnIssues.length).toBeGreaterThan(0);

      // Should have objective issue (not enough crystals)
      const objectiveIssues = result.issues.filter(i => i.category === ValidationCategory.OBJECTIVES);
      expect(objectiveIssues.length).toBeGreaterThan(0);
    });
  });
});