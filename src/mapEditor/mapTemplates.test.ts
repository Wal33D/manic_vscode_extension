import { MapTemplateManager, MapTemplate, TemplateCategory } from './mapTemplates';

describe('MapTemplateManager', () => {
  beforeEach(() => {
    // Clear any custom templates before each test
    MapTemplateManager['templates'].clear();
    MapTemplateManager['registerBuiltInTemplates']();
  });

  describe('Built-in templates', () => {
    it('should have all built-in templates registered', () => {
      const templates = MapTemplateManager.getAllTemplates();

      expect(templates.length).toBeGreaterThanOrEqual(5);

      // Check for each expected template
      expect(MapTemplateManager.getTemplate('tutorial-basic')).toBeDefined();
      expect(MapTemplateManager.getTemplate('combat-arena')).toBeDefined();
      expect(MapTemplateManager.getTemplate('puzzle-chamber')).toBeDefined();
      expect(MapTemplateManager.getTemplate('resource-rush')).toBeDefined();
      expect(MapTemplateManager.getTemplate('exploration-cavern')).toBeDefined();
    });

    it('should have correct properties for tutorial template', () => {
      const tutorial = MapTemplateManager.getTemplate('tutorial-basic');

      expect(tutorial).toBeDefined();
      expect(tutorial!.name).toBe('Basic Tutorial');
      expect(tutorial!.category).toBe(TemplateCategory.TUTORIAL);
      expect(tutorial!.difficulty).toBe('beginner');
      expect(tutorial!.size.rows).toBe(20);
      expect(tutorial!.size.cols).toBe(20);
      expect(tutorial!.objectives).toHaveLength(3);
    });

    it('should generate valid tile arrays', () => {
      const templates = MapTemplateManager.getAllTemplates();

      templates.forEach(template => {
        expect(template.tiles).toBeDefined();
        expect(template.tiles.length).toBe(template.size.rows);
        expect(template.tiles[0].length).toBe(template.size.cols);

        // Check all tiles are valid numbers
        template.tiles.forEach(row => {
          row.forEach(tile => {
            expect(typeof tile).toBe('number');
            expect(tile).toBeGreaterThanOrEqual(0);
          });
        });
      });
    });
  });

  describe('Template filtering', () => {
    it('should filter templates by category', () => {
      const tutorialTemplates = MapTemplateManager.getTemplatesByCategory(
        TemplateCategory.TUTORIAL
      );
      expect(tutorialTemplates.length).toBeGreaterThanOrEqual(1);
      expect(tutorialTemplates.every(t => t.category === TemplateCategory.TUTORIAL)).toBe(true);

      const combatTemplates = MapTemplateManager.getTemplatesByCategory(TemplateCategory.COMBAT);
      expect(combatTemplates.length).toBeGreaterThanOrEqual(1);
      expect(combatTemplates.every(t => t.category === TemplateCategory.COMBAT)).toBe(true);
    });

    it('should return empty array for non-existent category', () => {
      const customTemplates = MapTemplateManager.getTemplatesByCategory(TemplateCategory.CUSTOM);
      expect(customTemplates).toEqual([]);
    });
  });

  describe('Custom template management', () => {
    it('should create custom template with correct properties', () => {
      const tiles = Array(10)
        .fill(null)
        .map(() => Array(10).fill(1));
      const objectives = ['Test objective 1', 'Test objective 2'];

      const template = MapTemplateManager.createCustomTemplate(
        'My Test Map',
        'A test map for unit tests',
        tiles,
        objectives
      );

      expect(template.id).toMatch(/^custom-\d+$/);
      expect(template.name).toBe('My Test Map');
      expect(template.description).toBe('A test map for unit tests');
      expect(template.category).toBe(TemplateCategory.CUSTOM);
      expect(template.difficulty).toBe('intermediate');
      expect(template.size.rows).toBe(10);
      expect(template.size.cols).toBe(10);
      expect(template.tiles).toEqual(tiles);
      expect(template.objectives).toEqual(objectives);
      expect(template.info?.creator).toBe('User');
    });

    it('should add custom template to manager', () => {
      const tiles = Array(5)
        .fill(null)
        .map(() => Array(5).fill(1));

      const template = MapTemplateManager.createCustomTemplate(
        'Small Map',
        'A small test map',
        tiles
      );

      MapTemplateManager.addTemplate(template);

      expect(MapTemplateManager.getTemplate(template.id)).toEqual(template);
      expect(MapTemplateManager.getAllTemplates()).toContain(template);
    });
  });

  describe('Template export/import', () => {
    it('should export template as JSON string', () => {
      const template = MapTemplateManager.getTemplate('tutorial-basic');
      const exported = MapTemplateManager.exportTemplate(template!);

      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(parsed.id).toBe('tutorial-basic');
      expect(parsed.name).toBe('Basic Tutorial');
    });

    it('should import valid template JSON', () => {
      const templateData: MapTemplate = {
        id: 'imported-test',
        name: 'Imported Test',
        description: 'An imported template',
        category: TemplateCategory.CUSTOM,
        difficulty: 'intermediate',
        size: { rows: 5, cols: 5 },
        tiles: Array(5)
          .fill(null)
          .map(() => Array(5).fill(1)),
      };

      const json = JSON.stringify(templateData);
      const imported = MapTemplateManager.importTemplate(json);

      expect(imported).toBeDefined();
      expect(imported!.id).toBe('imported-test');
      expect(imported!.name).toBe('Imported Test');
    });

    it('should reject invalid template JSON', () => {
      const invalidJson = '{"invalid": "template"}';
      const imported = MapTemplateManager.importTemplate(invalidJson);
      expect(imported).toBeNull();
    });

    it('should reject corrupted JSON', () => {
      const corruptedJson = '{"id": "test", "name": ';
      const imported = MapTemplateManager.importTemplate(corruptedJson);
      expect(imported).toBeNull();
    });
  });

  describe('Template generation algorithms', () => {
    it('should generate tutorial map with spawn point', () => {
      const tutorial = MapTemplateManager.getTemplate('tutorial-basic');
      const tiles = tutorial!.tiles;

      // Find Tool Store (101)
      let foundSpawn = false;
      for (let r = 0; r < tiles.length; r++) {
        for (let c = 0; c < tiles[r].length; c++) {
          if (tiles[r][c] === 101) {
            foundSpawn = true;
            break;
          }
        }
      }

      expect(foundSpawn).toBe(true);
    });

    it('should generate combat arena with circular shape', () => {
      const arena = MapTemplateManager.getTemplate('combat-arena');
      const tiles = arena!.tiles;
      const centerR = Math.floor(tiles.length / 2);
      const centerC = Math.floor(tiles[0].length / 2);

      // Center should be walkable
      expect(tiles[centerR][centerC]).toBe(101); // Tool Store

      // Corners should be solid
      expect(tiles[0][0]).toBe(40); // Solid rock
      expect(tiles[0][tiles[0].length - 1]).toBe(40);
      expect(tiles[tiles.length - 1][0]).toBe(40);
      expect(tiles[tiles.length - 1][tiles[0].length - 1]).toBe(40);
    });

    it('should generate puzzle chamber with connected rooms', () => {
      const puzzle = MapTemplateManager.getTemplate('puzzle-chamber');
      const tiles = puzzle!.tiles;

      // Check for chambers (ground tiles)
      let chamberCount = 0;
      const chambers = [
        { r: 5, c: 5 }, // Top-left
        { r: 5, c: 15 }, // Top-right
        { r: 15, c: 5 }, // Bottom-left
        { r: 15, c: 15 }, // Bottom-right
        { r: 10, c: 10 }, // Center
      ];

      chambers.forEach(chamber => {
        if (tiles[chamber.r][chamber.c] === 1) {
          chamberCount++;
        }
      });

      expect(chamberCount).toBeGreaterThanOrEqual(4); // At least 4 chambers should exist
    });

    it('should generate resource rush with multiple resource types', () => {
      const rush = MapTemplateManager.getTemplate('resource-rush');
      const tiles = rush!.tiles;

      let crystalCount = 0;
      let oreCount = 0;

      tiles.forEach(row => {
        row.forEach(tile => {
          if (tile >= 42 && tile <= 45) crystalCount++;
          if (tile >= 46 && tile <= 49) oreCount++;
        });
      });

      expect(crystalCount).toBeGreaterThan(0);
      expect(oreCount).toBeGreaterThan(0);
    });

    it('should generate exploration cavern with varied terrain', () => {
      const cavern = MapTemplateManager.getTemplate('exploration-cavern');
      const tiles = cavern!.tiles;

      // Count different tile types
      const tileCounts = new Map<number, number>();
      tiles.forEach(row => {
        row.forEach(tile => {
          tileCounts.set(tile, (tileCounts.get(tile) || 0) + 1);
        });
      });

      // Should have at least ground, rock, and possibly water
      expect(tileCounts.size).toBeGreaterThanOrEqual(2);
      expect(tileCounts.get(1) || 0).toBeGreaterThan(0); // Ground
      expect(tileCounts.get(40) || 0).toBeGreaterThan(0); // Solid rock
    });
  });
});
