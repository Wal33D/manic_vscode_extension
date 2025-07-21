import { TileType } from '../types/datFileTypes';

/**
 * Hardness levels for tiles, inspired by groundhog's implementation
 * Determines drill difficulty and time required
 */
export enum Hardness {
  NONE = 0, // No drilling needed (floors, water, lava)
  RUBBLE = 1, // Very easy to clear (landslide debris)
  DIRT = 2, // Basic wall, quick to drill
  LOOSE = 3, // Loose rock, moderate drilling time
  SEAM = 4, // Resource seams, takes time but yields resources
  HARD = 5, // Hard rock, slow drilling
  SOLID = 6, // Cannot be drilled (impenetrable)
}

/**
 * Special trigger types when tiles are drilled or interacted with
 */
export type TileTrigger = null | 'flood' | 'waste' | 'spawn' | 'landslide' | 'erosion';

/**
 * Enhanced tile definition with gameplay-relevant properties
 * Based on groundhog's comprehensive tile system
 */
export interface AdvancedTileDefinition {
  id: number;
  name: string;
  description: string;
  category: 'ground' | 'wall' | 'resource' | 'hazard' | 'special' | 'rubble';

  // Physical properties
  hardness: Hardness;
  isWall: boolean;
  isFloor: boolean;
  isFluid: boolean;

  // Movement and building
  canWalk: boolean;
  canDrill: boolean;
  canBuild: boolean;
  canLandslide: boolean;

  // Terrain properties
  maxSlope?: number; // Maximum allowed height difference (undefined = no limit)

  // Resource yields
  crystalYield: number; // Number of crystals when drilled
  oreYield: number; // Number of ore when drilled
  studsYield: number; // Number of studs when drilled

  // Special behaviors
  trigger: TileTrigger;

  // Visual properties
  color?: { r: number; g: number; b: number; a?: number };
}

/**
 * Comprehensive tile definitions with enhanced metadata
 */
export const ADVANCED_TILE_DEFINITIONS: Map<number, AdvancedTileDefinition> = new Map([
  // Ground tiles
  [
    TileType.Ground,
    {
      id: TileType.Ground,
      name: 'Ground',
      description: 'Basic floor tile where buildings can be constructed',
      category: 'ground',
      hardness: Hardness.NONE,
      isWall: false,
      isFloor: true,
      isFluid: false,
      canWalk: true,
      canDrill: false,
      canBuild: true,
      canLandslide: false,
      maxSlope: 3,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 124, g: 92, b: 70 },
    },
  ],
  [
    TileType.PowerPath,
    {
      id: TileType.PowerPath,
      name: 'Power Path',
      description: 'Conducts power between buildings',
      category: 'special',
      hardness: Hardness.NONE,
      isWall: false,
      isFloor: true,
      isFluid: false,
      canWalk: true,
      canDrill: false,
      canBuild: false,
      canLandslide: false,
      maxSlope: 3,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 255, g: 255, b: 0 },
    },
  ],

  // Wall tiles - Dirt
  [
    TileType.SolidRock,
    {
      id: TileType.SolidRock,
      name: 'Dirt',
      description: 'Soft dirt that can be drilled quickly',
      category: 'wall',
      hardness: Hardness.DIRT,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: true,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 169, g: 109, b: 82 },
    },
  ],

  // Wall tiles - Loose Rock
  [
    TileType.LooseRock,
    {
      id: TileType.LooseRock,
      name: 'Loose Rock',
      description: 'Unstable rock that can be drilled quickly',
      category: 'wall',
      hardness: Hardness.LOOSE,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: true,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: 'landslide',
      color: { r: 139, g: 104, b: 86 },
    },
  ],
  [
    TileType.Water,
    {
      id: TileType.Water,
      name: 'Loose Rock (Variant)',
      description: 'Unstable rock that is easy to drill but may cause cave-ins',
      category: 'wall',
      hardness: Hardness.LOOSE,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: true,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: 'landslide',
      color: { r: 139, g: 104, b: 86 },
    },
  ],

  // Wall tiles - Hard Rock
  [
    TileType.EnergyCrystalSeam,
    {
      id: TileType.EnergyCrystalSeam,
      name: 'Hard Rock',
      description: 'Very hard rock that takes longer to drill through',
      category: 'wall',
      hardness: Hardness.HARD,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 77, g: 53, b: 50 },
    },
  ],
  [
    TileType.HardRock,
    {
      id: TileType.HardRock,
      name: 'Hard Rock (Variant)',
      description: 'Harder rock that takes longer to drill',
      category: 'wall',
      hardness: Hardness.HARD,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 50, g: 50, b: 50 },
    },
  ],
  [
    TileType.SuperHardRock,
    {
      id: TileType.SuperHardRock,
      name: 'Super Hard Rock',
      description: 'Extremely hard rock, requires special equipment',
      category: 'wall',
      hardness: Hardness.HARD,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 30, g: 30, b: 30 },
    },
  ],

  // Wall tiles - Solid Rock
  [
    TileType.SolidWall,
    {
      id: TileType.SolidWall,
      name: 'Solid Rock',
      description: 'Impenetrable solid rock wall - cannot be drilled',
      category: 'wall',
      hardness: Hardness.SOLID,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: false,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 0, g: 0, b: 0, a: 0 },
    },
  ],

  // Resource tiles
  [
    TileType.OreSeam,
    {
      id: TileType.OreSeam,
      name: 'Energy Crystal Seam',
      description: 'Contains energy crystals - your primary power source',
      category: 'resource',
      hardness: Hardness.SEAM,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: false,
      crystalYield: 5, // Yields 5 crystals when drilled
      oreYield: 0,
      studsYield: 0,
      trigger: 'spawn', // May spawn creatures when drilled
      color: { r: 206, g: 233, b: 104 },
    },
  ],
  [
    TileType.CrystalSeam,
    {
      id: TileType.CrystalSeam,
      name: 'Ore Seam',
      description: 'Contains ore used for building and vehicle upgrades',
      category: 'resource',
      hardness: Hardness.SEAM,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 3, // Yields 3 ore when drilled
      studsYield: 0,
      trigger: null,
      color: { r: 200, g: 85, b: 30 },
    },
  ],
  [
    TileType.ReinforcedWall,
    {
      id: TileType.ReinforcedWall,
      name: 'Recharge Seam',
      description: 'Special crystal formation that recharges electric fences',
      category: 'resource',
      hardness: Hardness.SEAM,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: false,
      crystalYield: 1,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 255, g: 255, b: 70 },
    },
  ],
  [
    TileType.RechargeSeam,
    {
      id: TileType.RechargeSeam,
      name: 'Recharge Seam (Variant)',
      description: 'Provides power recharge for vehicles',
      category: 'resource',
      hardness: Hardness.SEAM,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: false,
      crystalYield: 2,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 255, g: 200, b: 0 },
    },
  ],

  // Hazard tiles - Fluids
  [
    TileType.Lava,
    {
      id: TileType.Lava,
      name: 'Water',
      description: 'Water hazard - vehicles need upgrades to cross',
      category: 'hazard',
      hardness: Hardness.NONE,
      isWall: false,
      isFloor: false,
      isFluid: true,
      canWalk: false,
      canDrill: false,
      canBuild: false,
      canLandslide: false,
      maxSlope: undefined, // Water flows at any slope
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: 'flood',
      color: { r: 30, g: 84, b: 197 },
    },
  ],
  [
    TileType.Water1,
    {
      id: TileType.Water1,
      name: 'Water (Deep)',
      description: 'Deep water - requires boats or bridges to cross',
      category: 'hazard',
      hardness: Hardness.NONE,
      isWall: false,
      isFloor: false,
      isFluid: true,
      canWalk: false,
      canDrill: false,
      canBuild: false,
      canLandslide: false,
      maxSlope: undefined,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: 'flood',
      color: { r: 30, g: 95, b: 220 },
    },
  ],
  [
    TileType.Lava1,
    {
      id: TileType.Lava1,
      name: 'Lava',
      description: 'Molten lava - instantly destroys anything that touches it',
      category: 'hazard',
      hardness: Hardness.NONE,
      isWall: false,
      isFloor: false,
      isFluid: true,
      canWalk: false,
      canDrill: false,
      canBuild: false,
      canLandslide: false,
      maxSlope: undefined,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: 'erosion',
      color: { r: 255, g: 50, b: 0 },
    },
  ],
  [
    TileType.Lava2,
    {
      id: TileType.Lava2,
      name: 'Lava (Pool)',
      description: 'Lava pool - will damage anything that enters',
      category: 'hazard',
      hardness: Hardness.NONE,
      isWall: false,
      isFloor: false,
      isFluid: true,
      canWalk: false,
      canDrill: false,
      canBuild: false,
      canLandslide: false,
      maxSlope: undefined,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: 'erosion',
      color: { r: 255, g: 60, b: 10 },
    },
  ],
  [
    TileType.Special2,
    {
      id: TileType.Special2,
      name: 'Lava (Cooling)',
      description: 'Partially cooled lava - still extremely dangerous',
      category: 'hazard',
      hardness: Hardness.NONE,
      isWall: false,
      isFloor: false,
      isFluid: true,
      canWalk: false,
      canDrill: false,
      canBuild: false,
      canLandslide: false,
      maxSlope: undefined,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: 'erosion',
      color: { r: 255, g: 70, b: 10, a: 0.9 },
    },
  ],

  // Hazard tiles - Other
  [
    5,
    {
      id: 5,
      name: 'Hot Rock',
      description: 'Extremely hot rock, almost molten - dangerous to cross',
      category: 'hazard',
      hardness: Hardness.HARD,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: 'erosion',
      color: { r: 92, g: 58, b: 40 },
    },
  ],
  [
    12,
    {
      id: 12,
      name: 'Slimy Slug Hole',
      description: 'Spawning point for Slimy Slugs',
      category: 'hazard',
      hardness: Hardness.DIRT,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: 'spawn',
      color: { r: 180, g: 180, b: 20 },
    },
  ],
  [
    112,
    {
      id: 112,
      name: 'Slimy Slug Hole (Variant)',
      description: 'Another spawning point for Slimy Slugs',
      category: 'hazard',
      hardness: Hardness.DIRT,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: 'spawn',
      color: { r: 180, g: 180, b: 20 },
    },
  ],
  [
    TileType.SlugHole,
    {
      id: TileType.SlugHole,
      name: 'Slug Hole (Main)',
      description: 'Primary spawning point for Slimy Slugs',
      category: 'hazard',
      hardness: Hardness.DIRT,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: 'spawn',
      color: { r: 150, g: 150, b: 20 },
    },
  ],

  // Rubble tiles
  [
    60,
    {
      id: 60,
      name: 'Landslide Rubble (Light)',
      description: 'Light rubble from cave-ins',
      category: 'rubble',
      hardness: Hardness.RUBBLE,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 46, g: 23, b: 95, a: 0.1 },
    },
  ],
  [
    61,
    {
      id: 61,
      name: 'Landslide Rubble (Medium)',
      description: 'Medium rubble from cave-ins',
      category: 'rubble',
      hardness: Hardness.RUBBLE,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 46, g: 23, b: 95, a: 0.5 },
    },
  ],
  [
    62,
    {
      id: 62,
      name: 'Landslide Rubble',
      description: 'Rubble from cave-ins',
      category: 'rubble',
      hardness: Hardness.RUBBLE,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 46, g: 23, b: 95, a: 0.3 },
    },
  ],
  [
    TileType.SpecialTerrain,
    {
      id: TileType.SpecialTerrain,
      name: 'Landslide Rubble (Heavy)',
      description: 'Heavy rubble from major cave-ins',
      category: 'rubble',
      hardness: Hardness.RUBBLE,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 46, g: 23, b: 95 },
    },
  ],
  [
    64,
    {
      id: 64,
      name: 'Landslide Rubble (Dense)',
      description: 'Dense rubble that takes time to clear',
      category: 'rubble',
      hardness: Hardness.RUBBLE,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 46, g: 23, b: 95, a: 0.7 },
    },
  ],
  [
    163,
    {
      id: 163,
      name: 'Landslide Rubble (Standard)',
      description: 'Standard cave-in debris',
      category: 'rubble',
      hardness: Hardness.RUBBLE,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 46, g: 23, b: 95 },
    },
  ],
  [
    164,
    {
      id: 164,
      name: 'Dense Rubble',
      description: 'Compacted rubble from major cave-ins',
      category: 'rubble',
      hardness: Hardness.RUBBLE,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 65, g: 33, b: 95 },
    },
  ],
  [
    165,
    {
      id: 165,
      name: 'Unstable Rubble',
      description: 'Loose rubble that may shift when disturbed',
      category: 'rubble',
      hardness: Hardness.RUBBLE,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: true,
      canBuild: false,
      canLandslide: true,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: 'landslide',
      color: { r: 46, g: 23, b: 95, a: 0.5 },
    },
  ],
  [
    TileType.Rubble1,
    {
      id: TileType.Rubble1,
      name: 'Rubble (Light)',
      description: 'Light rubble that can be cleared',
      category: 'rubble',
      hardness: Hardness.RUBBLE,
      isWall: false,
      isFloor: true,
      isFluid: false,
      canWalk: true,
      canDrill: false,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 100, g: 80, b: 60 },
    },
  ],
  [
    TileType.Rubble2,
    {
      id: TileType.Rubble2,
      name: 'Rubble (Medium)',
      description: 'Medium rubble that takes longer to clear',
      category: 'rubble',
      hardness: Hardness.RUBBLE,
      isWall: false,
      isFloor: true,
      isFluid: false,
      canWalk: true,
      canDrill: false,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 90, g: 70, b: 50 },
    },
  ],
  [
    TileType.Rubble3,
    {
      id: TileType.Rubble3,
      name: 'Rubble (Heavy)',
      description: 'Heavy rubble that takes the longest to clear',
      category: 'rubble',
      hardness: Hardness.RUBBLE,
      isWall: false,
      isFloor: true,
      isFluid: false,
      canWalk: true,
      canDrill: false,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 80, g: 60, b: 40 },
    },
  ],

  // Erosion tiles
  [
    TileType.Erosion1,
    {
      id: TileType.Erosion1,
      name: 'Erosion (Stage 1)',
      description: 'Beginning stages of erosion',
      category: 'hazard',
      hardness: Hardness.DIRT,
      isWall: false,
      isFloor: true,
      isFluid: false,
      canWalk: true,
      canDrill: true,
      canBuild: false,
      canLandslide: true,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: 'erosion',
      color: { r: 110, g: 90, b: 70 },
    },
  ],
  [
    TileType.Erosion2,
    {
      id: TileType.Erosion2,
      name: 'Erosion (Stage 2)',
      description: 'Advanced erosion, more dangerous',
      category: 'hazard',
      hardness: Hardness.LOOSE,
      isWall: false,
      isFloor: true,
      isFluid: false,
      canWalk: true,
      canDrill: true,
      canBuild: false,
      canLandslide: true,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: 'erosion',
      color: { r: 100, g: 80, b: 60 },
    },
  ],
  [
    TileType.Erosion3,
    {
      id: TileType.Erosion3,
      name: 'Erosion (Stage 3)',
      description: 'Critical erosion, about to collapse',
      category: 'hazard',
      hardness: Hardness.NONE,
      isWall: false,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: false,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: 'erosion',
      color: { r: 90, g: 70, b: 50 },
    },
  ],

  // Special tiles
  [
    TileType.DiggableTerrain,
    {
      id: TileType.DiggableTerrain,
      name: 'Ground (Reinforced)',
      description: 'Reinforced ground tile suitable for heavy construction',
      category: 'ground',
      hardness: Hardness.NONE,
      isWall: false,
      isFloor: true,
      isFluid: false,
      canWalk: true,
      canDrill: false,
      canBuild: true,
      canLandslide: false,
      maxSlope: 4,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 124, g: 92, b: 70 },
    },
  ],
  [
    TileType.Dirt,
    {
      id: TileType.Dirt,
      name: 'Power Path (Variant)',
      description: 'Alternative conductive ground for power connections',
      category: 'special',
      hardness: Hardness.NONE,
      isWall: false,
      isFloor: true,
      isFluid: false,
      canWalk: true,
      canDrill: false,
      canBuild: true,
      canLandslide: false,
      maxSlope: 3,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 220, g: 220, b: 220 },
    },
  ],
  [
    TileType.Water2,
    {
      id: TileType.Water2,
      name: 'Power Path (Enhanced)',
      description: 'Enhanced conductive pathway for power distribution',
      category: 'special',
      hardness: Hardness.NONE,
      isWall: false,
      isFloor: true,
      isFluid: false,
      canWalk: true,
      canDrill: false,
      canBuild: true,
      canLandslide: false,
      maxSlope: 3,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 220, g: 220, b: 220 },
    },
  ],
  [
    TileType.IceTerrain,
    {
      id: TileType.IceTerrain,
      name: 'Ice',
      description: 'Slippery ice terrain - vehicles may slide',
      category: 'special',
      hardness: Hardness.HARD,
      isWall: false,
      isFloor: true,
      isFluid: false,
      canWalk: true,
      canDrill: true,
      canBuild: false,
      canLandslide: false,
      maxSlope: 1, // Very limited slope on ice
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 200, g: 230, b: 255 },
    },
  ],
  [
    124,
    {
      id: 124,
      name: 'Floating Panels',
      description: 'Floating flat panels - possibly bridges or platforms',
      category: 'special',
      hardness: Hardness.NONE,
      isWall: false,
      isFloor: true,
      isFluid: false,
      canWalk: true,
      canDrill: false,
      canBuild: false,
      canLandslide: false,
      maxSlope: 0, // Must be perfectly flat
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 70, g: 130, b: 180, a: 0.9 },
    },
  ],
  [
    TileType.Special1,
    {
      id: TileType.Special1,
      name: 'Special Tile 1',
      description: 'Special purpose tile',
      category: 'special',
      hardness: Hardness.SOLID,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: false,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 128, g: 128, b: 128 },
    },
  ],
  [
    115,
    {
      id: 115,
      name: 'Unknown Tile',
      description: 'Purpose unknown',
      category: 'special',
      hardness: Hardness.SOLID,
      isWall: true,
      isFloor: false,
      isFluid: false,
      canWalk: false,
      canDrill: false,
      canBuild: false,
      canLandslide: false,
      crystalYield: 0,
      oreYield: 0,
      studsYield: 0,
      trigger: null,
      color: { r: 220, g: 220, b: 220 },
    },
  ],
]);

/**
 * Helper function to get enhanced tile info
 */
export function getAdvancedTileInfo(tileId: number): AdvancedTileDefinition | undefined {
  return ADVANCED_TILE_DEFINITIONS.get(tileId);
}

/**
 * Get hardness name for display
 */
export function getHardnessName(hardness: Hardness): string {
  switch (hardness) {
    case Hardness.NONE:
      return 'None';
    case Hardness.RUBBLE:
      return 'Rubble';
    case Hardness.DIRT:
      return 'Dirt';
    case Hardness.LOOSE:
      return 'Loose Rock';
    case Hardness.SEAM:
      return 'Resource Seam';
    case Hardness.HARD:
      return 'Hard Rock';
    case Hardness.SOLID:
      return 'Solid Rock';
    default:
      return 'Unknown';
  }
}

/**
 * Get drill time estimate based on hardness
 */
export function getDrillTimeEstimate(hardness: Hardness): string {
  switch (hardness) {
    case Hardness.NONE:
      return 'Not drillable';
    case Hardness.RUBBLE:
      return 'Very fast (~2s)';
    case Hardness.DIRT:
      return 'Fast (~5s)';
    case Hardness.LOOSE:
      return 'Moderate (~10s)';
    case Hardness.SEAM:
      return 'Slow (~15s)';
    case Hardness.HARD:
      return 'Very slow (~20s)';
    case Hardness.SOLID:
      return 'Cannot be drilled';
    default:
      return 'Unknown';
  }
}

/**
 * Get all tiles that yield a specific resource
 */
export function getTilesWithResource(resource: 'crystal' | 'ore' | 'studs'): number[] {
  const tiles: number[] = [];
  ADVANCED_TILE_DEFINITIONS.forEach((tile, id) => {
    if (resource === 'crystal' && tile.crystalYield > 0) {
      tiles.push(id);
    } else if (resource === 'ore' && tile.oreYield > 0) {
      tiles.push(id);
    } else if (resource === 'studs' && tile.studsYield > 0) {
      tiles.push(id);
    }
  });
  return tiles;
}

/**
 * Get tiles by hardness level
 */
export function getTilesByHardness(hardness: Hardness): number[] {
  const tiles: number[] = [];
  ADVANCED_TILE_DEFINITIONS.forEach((tile, id) => {
    if (tile.hardness === hardness) {
      tiles.push(id);
    }
  });
  return tiles;
}

/**
 * Get tiles that can trigger special events
 */
export function getTilesWithTriggers(): Map<TileTrigger, number[]> {
  const triggers = new Map<TileTrigger, number[]>();

  ADVANCED_TILE_DEFINITIONS.forEach((tile, id) => {
    if (tile.trigger !== null) {
      if (!triggers.has(tile.trigger)) {
        triggers.set(tile.trigger, []);
      }
      triggers.get(tile.trigger)!.push(id);
    }
  });

  return triggers;
}

/**
 * Check if a tile can support a building at a given slope
 */
export function canBuildAtSlope(tileId: number, currentSlope: number): boolean {
  const tile = getAdvancedTileInfo(tileId);
  if (!tile || !tile.canBuild) {
    return false;
  }
  if (tile.maxSlope === undefined) {
    return true;
  }
  return currentSlope <= tile.maxSlope;
}

/**
 * Type guards for tile categories
 */
export function isWallTile(tileId: number): boolean {
  const tile = getAdvancedTileInfo(tileId);
  return tile?.isWall ?? false;
}

export function isFloorTile(tileId: number): boolean {
  const tile = getAdvancedTileInfo(tileId);
  return tile?.isFloor ?? false;
}

export function isFluidTile(tileId: number): boolean {
  const tile = getAdvancedTileInfo(tileId);
  return tile?.isFluid ?? false;
}

export function isResourceTile(tileId: number): boolean {
  const tile = getAdvancedTileInfo(tileId);
  return tile?.category === 'resource';
}

export function isHazardTile(tileId: number): boolean {
  const tile = getAdvancedTileInfo(tileId);
  return tile?.category === 'hazard';
}

/**
 * Get total resource yield from drilling a tile
 */
export function getTileResourceYield(tileId: number): {
  crystals: number;
  ore: number;
  studs: number;
} {
  const tile = getAdvancedTileInfo(tileId);
  return {
    crystals: tile?.crystalYield ?? 0,
    ore: tile?.oreYield ?? 0,
    studs: tile?.studsYield ?? 0,
  };
}
