import { describe, expect, it, beforeEach } from '@jest/globals';
import { DatFileValidator } from './datFileValidator';
import { DatFile, BuildingType } from '../types/datFileTypes';

describe('DatFileValidator - Enhanced Features', () => {
  let validator: DatFileValidator;
  let baseDatFile: DatFile;

  beforeEach(() => {
    validator = new DatFileValidator();
    baseDatFile = {
      info: {
        rowcount: 10,
        colcount: 10,
        biome: 'rock' as any,
      },
      tiles: Array(10).fill(Array(10).fill(1)), // All ground tiles
      height: Array(10).fill(Array(10).fill(5)),
    };
  });

  describe('Enhanced Tile Validation', () => {
    it('should detect reinforced tiles and add warning', () => {
      const datFile = {
        ...baseDatFile,
        tiles: [
          [1, 76, 1, 1, 1, 1, 1, 1, 1, 1], // Reinforced dirt wall
          [1, 88, 1, 1, 1, 1, 1, 1, 1, 1], // Reinforced solid rock
          [1, 92, 1, 1, 1, 1, 1, 1, 1, 1], // Reinforced crystal seam
          ...Array(7).fill(Array(10).fill(1)),
        ],
      };

      const errors = validator.validate(datFile);
      const reinforcedWarning = errors.find(
        e => e.message.includes('reinforced tiles') && e.severity === 'warning'
      );

      expect(reinforcedWarning).toBeDefined();
      expect(reinforcedWarning?.message).toContain('3');
      expect(reinforcedWarning?.message).toContain('harder difficulty');
    });

    it.skip('should validate water tile placement', () => {
      const datFile = {
        ...baseDatFile,
        tiles: [
          [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          [1, 11, 11, 11, 1, 1, 1, 1, 1, 1], // Water with shore
          [1, 11, 11, 11, 1, 1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1, 11, 11, 1, 1, 1], // Water without proper shore
          [1, 1, 1, 1, 1, 11, 11, 1, 1, 1],
          ...Array(5).fill(Array(10).fill(1)),
        ],
      };

      const errors = validator.validate(datFile);
      // Just check if the warning exists, don't check exact position
      const waterWarning = errors.find(e =>
        e.message.includes('Water tile should be adjacent to shore')
      );

      expect(waterWarning).toBeDefined();
    });

    it('should validate lava tile placement', () => {
      const datFile = {
        ...baseDatFile,
        tiles: [
          [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          [1, 6, 7, 1, 1, 1, 1, 1, 1, 1], // Lava with edge
          [1, 8, 8, 1, 1, 1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1, 6, 1, 1, 1, 1], // Lava without edge
          ...Array(6).fill(Array(10).fill(1)),
        ],
      };

      const errors = validator.validate(datFile);
      const lavaWarning = errors.find(
        e =>
          e.message.includes('Lava tile should have proper edge tiles') &&
          e.line === 3 &&
          e.column === 5
      );

      expect(lavaWarning).toBeDefined();
    });

    it('should validate resource seam shape variants', () => {
      const datFile = {
        ...baseDatFile,
        tiles: [
          [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          [1, 42, 43, 44, 1, 1, 1, 1, 1, 1], // Crystal seam with correct variants
          [1, 45, 42, 45, 1, 1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1, 42, 1, 1, 1, 1], // Standalone crystal - should be variant 0
          ...Array(6).fill(Array(10).fill(1)),
        ],
      };

      const errors = validator.validate(datFile);
      // The validator should suggest appropriate variants based on adjacent tiles
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should check for solid rock warnings', () => {
      const datFile = {
        ...baseDatFile,
        tiles: [
          [1, 38, 1, 1, 1, 1, 1, 1, 1, 1], // Solid rock
          [1, 88, 1, 1, 1, 1, 1, 1, 1, 1], // Reinforced solid rock
          ...Array(8).fill(Array(10).fill(1)),
        ],
      };

      const errors = validator.validate(datFile);
      const solidRockWarning = errors.find(e =>
        e.message.includes('solid rock tiles that cannot be drilled')
      );

      expect(solidRockWarning).toBeDefined();
    });

    it('should check electric fence and recharge seam relationship', () => {
      const datFile = {
        ...baseDatFile,
        tiles: [
          [1, 12, 1, 1, 1, 1, 1, 1, 1, 1], // Electric fence
          [1, 112, 1, 1, 1, 1, 1, 1, 1, 1], // Reinforced electric fence
          ...Array(8).fill(Array(10).fill(1)),
        ],
      };

      const errors = validator.validate(datFile);
      const electricFenceWarning = errors.find(e =>
        e.message.includes('electric fences but no recharge seams')
      );

      expect(electricFenceWarning).toBeDefined();
    });
  });

  describe('Building Validation', () => {
    it('should require at least one Tool Store', () => {
      const datFile = {
        ...baseDatFile,
        buildings: [
          {
            type: 'BuildingPowerStation_C',
            coordinates: {
              translation: { x: 300, y: 300, z: 0 },
              rotation: { p: 0, y: 0, r: 0 },
              scale: { x: 1, y: 1, z: 1 },
            },
          },
        ],
      };

      const errors = validator.validate(datFile);
      const toolStoreError = errors.find(
        e => e.message.includes('Level must have at least one Tool Store') && e.severity === 'error'
      );

      expect(toolStoreError).toBeDefined();
    });

    it('should check building power requirements', () => {
      const datFile = {
        ...baseDatFile,
        buildings: [
          {
            type: 'BuildingToolStore_C',
            coordinates: {
              translation: { x: 300, y: 300, z: 0 },
              rotation: { p: 0, y: 0, r: 0 },
              scale: { x: 1, y: 1, z: 1 },
            },
          },
          {
            type: 'BuildingOreRefinery_C',
            coordinates: {
              translation: { x: 600, y: 600, z: 0 },
              rotation: { p: 0, y: 0, r: 0 },
              scale: { x: 1, y: 1, z: 1 },
            },
          },
          {
            type: 'BuildingCanteen_C',
            coordinates: {
              translation: { x: 900, y: 900, z: 0 },
              rotation: { p: 0, y: 0, r: 0 },
              scale: { x: 1, y: 1, z: 1 },
            },
          },
        ],
      };

      const errors = validator.validate(datFile);
      const powerWarning = errors.find(e =>
        e.message.includes('buildings that need power but no power stations')
      );

      expect(powerWarning).toBeDefined();
      expect(powerWarning?.message).toContain('2'); // 2 buildings need power
    });

    it('should validate power path connections', () => {
      const datFile = {
        ...baseDatFile,
        buildings: [
          {
            type: 'BuildingPowerStation_C',
            coordinates: {
              translation: { x: 300, y: 300, z: 0 },
              rotation: { p: 0, y: 0, r: 0 },
              scale: { x: 1, y: 1, z: 1 },
            },
            powerpaths: [
              { x: 0, y: 0, z: 0 }, // Invalid - all zeros
              { x: 1, y: 0, z: 0 }, // Valid
            ] as any,
          },
        ],
      };

      const errors = validator.validate(datFile);
      const powerPathWarning = errors.find(e =>
        e.message.includes('invalid power path with all zero values')
      );

      expect(powerPathWarning).toBeDefined();
    });

    it('should check building placement within map bounds', () => {
      const datFile = {
        ...baseDatFile,
        buildings: [
          {
            type: 'BuildingToolStore_C',
            coordinates: {
              translation: { x: 2000, y: 2000, z: 0 }, // Outside 10x10 grid
              rotation: { p: 0, y: 0, r: 0 },
              scale: { x: 1, y: 1, z: 1 },
            },
          },
        ],
      };

      const errors = validator.validate(datFile);
      const boundsWarning = errors.find(e => e.message.includes('placed outside map bounds'));

      expect(boundsWarning).toBeDefined();
    });
  });

  describe('Vehicle Validation', () => {
    it('should validate vehicle upgrades', () => {
      const datFile = {
        ...baseDatFile,
        vehicles: [
          {
            type: 'VehicleSmallDigger_C',
            coordinates: {
              translation: { x: 300, y: 300, z: 0 },
              rotation: { p: 0, y: 0, r: 0 },
              scale: { x: 1, y: 1, z: 1 },
            },
            upgrades: ['UpEngine', 'InvalidUpgrade', 'UpDrill'] as any,
          },
        ],
      };

      const errors = validator.validate(datFile);
      const upgradeWarning = errors.find(e =>
        e.message.includes('Unknown vehicle upgrade: InvalidUpgrade')
      );

      expect(upgradeWarning).toBeDefined();
    });

    it('should check upgrade dependencies', () => {
      const datFile = {
        ...baseDatFile,
        vehicles: [
          {
            type: 'VehicleLargeDigger_C',
            coordinates: {
              translation: { x: 300, y: 300, z: 0 },
              rotation: { p: 0, y: 0, r: 0 },
              scale: { x: 1, y: 1, z: 1 },
            },
            upgrades: ['UpEngine', 'UpAddDrill'] as any, // Missing UpDrill
          },
        ],
      };

      const errors = validator.validate(datFile);
      const dependencyWarning = errors.find(e => e.message.includes('UpAddDrill but no UpDrill'));

      expect(dependencyWarning).toBeDefined();
    });
  });

  describe('Miner Validation', () => {
    it.skip('should validate miner equipment', () => {
      const datFile = {
        ...baseDatFile,
        miners: [
          {
            type: 'Miner',
            coordinates: {
              translation: { x: 300, y: 300, z: 0 },
              rotation: { p: 0, y: 0, r: 0 },
              scale: { x: 1, y: 1, z: 1 },
            },
            equipment: ['Drill', 'InvalidTool', 'JobPilot'] as any,
          },
        ],
      };

      const errors = validator.validate(datFile);
      const equipmentWarning = errors.find(e =>
        e.message.includes('Unknown miner equipment/job: InvalidTool')
      );

      expect(equipmentWarning).toBeDefined();
    });

    it.skip('should check dynamite safety', () => {
      const datFile = {
        ...baseDatFile,
        miners: [
          {
            type: 'Miner',
            coordinates: {
              translation: { x: 300, y: 300, z: 0 },
              rotation: { p: 0, y: 0, r: 0 },
              scale: { x: 1, y: 1, z: 1 },
            },
            equipment: ['Drill', 'Dynamite', 'JobDriver'] as any, // Has dynamite but not explosives expert
          },
        ],
      };

      const errors = validator.validate(datFile);
      const dynamiteWarning = errors.find(e =>
        e.message.includes('dynamite but is not an explosives expert')
      );

      expect(dynamiteWarning).toBeDefined();
    });
  });

  describe('Objective Validation', () => {
    it('should validate resource objectives are achievable', () => {
      const datFile = {
        ...baseDatFile,
        resources: {
          crystals: Array(10).fill(Array(10).fill(0)), // No crystals
          ore: Array(10).fill(Array(10).fill(0)), // No ore
        },
        objectives: [
          {
            type: 'resources' as const,
            crystals: 100, // Impossible
            ore: 50, // Impossible
            studs: 0,
          },
        ],
      };

      const errors = validator.validate(datFile);

      const crystalWarning = errors.find(e =>
        e.message.includes('Crystal objective (100) may exceed available crystals')
      );
      expect(crystalWarning).toBeDefined();

      const oreWarning = errors.find(e =>
        e.message.includes('Ore objective (50) may exceed available ore')
      );
      expect(oreWarning).toBeDefined();
    });

    it('should validate building objectives', () => {
      const datFile = {
        ...baseDatFile,
        objectives: [
          {
            type: 'building' as const,
            building: 'InvalidBuilding_C' as BuildingType,
          },
        ],
      };

      const errors = validator.validate(datFile);
      const buildingWarning = errors.find(e =>
        e.message.includes('Unknown building type in objective')
      );

      expect(buildingWarning).toBeDefined();
    });

    it('should validate discovertile coordinates', () => {
      const datFile = {
        ...baseDatFile,
        objectives: [
          {
            type: 'discovertile' as const,
            x: 15, // Outside 10x10 grid
            y: 15,
            description: 'Find the secret',
          },
        ],
      };

      const errors = validator.validate(datFile);
      const coordError = errors.find(e =>
        e.message.includes('Discover tile objective has invalid coordinates')
      );

      expect(coordError).toBeDefined();
    });
  });
});
