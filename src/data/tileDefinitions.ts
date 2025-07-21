import { TileType } from '../types/datFileTypes';

export interface TileDefinition {
  id: number;
  name: string;
  description: string;
  category: 'ground' | 'wall' | 'resource' | 'hazard' | 'special' | 'rubble';
  canWalk: boolean;
  canDrill: boolean;
  canBuild: boolean;
  color?: { r: number; g: number; b: number; a?: number };
}

export const TILE_DEFINITIONS: Map<number, TileDefinition> = new Map([
  [
    TileType.Ground,
    {
      id: TileType.Ground,
      name: 'Ground',
      description: 'Basic floor tile where buildings can be constructed',
      category: 'ground',
      canWalk: true,
      canDrill: false,
      canBuild: true,
      color: { r: 124, g: 92, b: 70 },
    },
  ],
  [
    5,
    {
      id: 5,
      name: 'Hot Rock',
      description: 'Extremely hot rock, almost molten - dangerous to cross',
      category: 'hazard',
      canWalk: false,
      canDrill: true,
      canBuild: false,
      color: { r: 92, g: 58, b: 40 },
    },
  ],
  [
    TileType.Lava1,
    {
      id: TileType.Lava1,
      name: 'Lava',
      description: 'Molten lava - instantly destroys anything that touches it',
      category: 'hazard',
      canWalk: false,
      canDrill: false,
      canBuild: false,
      color: { r: 255, g: 50, b: 0 },
    },
  ],
  [
    TileType.Lava2,
    {
      id: TileType.Lava2,
      name: 'Lava (Type 2)',
      description: 'Lava pool - will damage anything that enters',
      category: 'hazard',
      canWalk: false,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    TileType.Lava,
    {
      id: TileType.Lava,
      name: 'Water',
      description: 'Water hazard - vehicles need upgrades to cross',
      category: 'hazard',
      canWalk: false,
      canDrill: false,
      canBuild: false,
      color: { r: 30, g: 84, b: 197 },
    },
  ],
  [
    12,
    {
      id: 12,
      name: 'Slimy Slug Hole',
      description: 'Spawning point for Slimy Slugs',
      category: 'hazard',
      canWalk: false,
      canDrill: true,
      canBuild: false,
      color: { r: 180, g: 180, b: 20 },
    },
  ],
  [
    TileType.Dirt,
    {
      id: TileType.Dirt,
      name: 'Power Path',
      description: 'Conductive ground for building power connections',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: true,
      color: { r: 220, g: 220, b: 220 },
    },
  ],
  [
    TileType.LooseRock,
    {
      id: TileType.LooseRock,
      name: 'Loose Rock',
      description: 'Unstable rock that can be drilled quickly',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    TileType.SolidRock,
    {
      id: TileType.SolidRock,
      name: 'Dirt',
      description: 'Soft dirt that can be drilled quickly',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
      color: { r: 169, g: 109, b: 82 },
    },
  ],
  [
    TileType.Water,
    {
      id: TileType.Water,
      name: 'Loose Rock',
      description: 'Unstable rock that is easy to drill but may cause cave-ins',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
      color: { r: 139, g: 104, b: 86 },
    },
  ],
  [
    TileType.EnergyCrystalSeam,
    {
      id: TileType.EnergyCrystalSeam,
      name: 'Hard Rock',
      description: 'Very hard rock that takes longer to drill through',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
      color: { r: 77, g: 53, b: 50 },
    },
  ],
  [
    TileType.SolidWall,
    {
      id: TileType.SolidWall,
      name: 'Solid Rock',
      description: 'Impenetrable solid rock wall - cannot be drilled',
      category: 'wall',
      canWalk: false,
      canDrill: false,
      canBuild: false,
      color: { r: 0, g: 0, b: 0, a: 0 },
    },
  ],
  [
    TileType.OreSeam,
    {
      id: TileType.OreSeam,
      name: 'Energy Crystal Seam',
      description: 'Contains energy crystals - your primary power source',
      category: 'resource',
      canWalk: false,
      canDrill: true,
      canBuild: false,
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
      canWalk: false,
      canDrill: true,
      canBuild: false,
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
      canWalk: false,
      canDrill: true,
      canBuild: false,
      color: { r: 255, g: 255, b: 70 },
    },
  ],
  [
    60,
    {
      id: 60,
      name: 'Landslide Rubble (Light)',
      description: 'Light rubble from cave-ins',
      category: 'rubble',
      canWalk: false,
      canDrill: true,
      canBuild: false,
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
      canWalk: false,
      canDrill: true,
      canBuild: false,
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
      canWalk: false,
      canDrill: true,
      canBuild: false,
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
      canWalk: false,
      canDrill: true,
      canBuild: false,
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
      canWalk: false,
      canDrill: true,
      canBuild: false,
      color: { r: 46, g: 23, b: 95, a: 0.7 },
    },
  ],
  [
    TileType.DiggableTerrain,
    {
      id: TileType.DiggableTerrain,
      name: 'Ground',
      description: 'Basic ground tile suitable for construction',
      category: 'ground',
      canWalk: true,
      canDrill: false,
      canBuild: true,
      color: { r: 124, g: 92, b: 70 },
    },
  ],
  [
    TileType.Special1,
    {
      id: TileType.Special1,
      name: 'Special Tile 1',
      description: 'Special purpose tile',
      category: 'special',
      canWalk: false,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    TileType.Special2,
    {
      id: TileType.Special2,
      name: 'Lava (Cooling)',
      description: 'Partially cooled lava - still extremely dangerous',
      category: 'hazard',
      canWalk: false,
      canDrill: false,
      canBuild: false,
      color: { r: 255, g: 70, b: 10, a: 0.9 },
    },
  ],
  [
    TileType.Water1,
    {
      id: TileType.Water1,
      name: 'Water',
      description: 'Deep water - requires boats or bridges to cross',
      category: 'hazard',
      canWalk: false,
      canDrill: false,
      canBuild: false,
      color: { r: 30, g: 95, b: 220 },
    },
  ],
  [
    112,
    {
      id: 112,
      name: 'Slimy Slug Hole',
      description: 'Another spawning point for Slimy Slugs',
      category: 'hazard',
      canWalk: false,
      canDrill: true,
      canBuild: false,
      color: { r: 180, g: 180, b: 20 },
    },
  ],
  [
    TileType.Water2,
    {
      id: TileType.Water2,
      name: 'Power Path',
      description: 'Conductive pathway for power distribution',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: true,
      color: { r: 220, g: 220, b: 220 },
    },
  ],
  [
    115,
    {
      id: 115,
      name: 'Unknown Tile',
      description: 'Purpose unknown',
      category: 'special',
      canWalk: false,
      canDrill: false,
      canBuild: false,
      color: { r: 220, g: 220, b: 220 },
    },
  ],
  [
    124,
    {
      id: 124,
      name: 'Floating Panels',
      description: 'Floating flat panels - possibly bridges or platforms',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
      color: { r: 70, g: 130, b: 180, a: 0.9 },
    },
  ],
  [
    163,
    {
      id: 163,
      name: 'Landslide Rubble',
      description: 'Standard cave-in debris',
      category: 'rubble',
      canWalk: false,
      canDrill: true,
      canBuild: false,
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
      canWalk: false,
      canDrill: true,
      canBuild: false,
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
      canWalk: false,
      canDrill: true,
      canBuild: false,
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
      canWalk: true,
      canDrill: false,
      canBuild: false,
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
      canWalk: true,
      canDrill: false,
      canBuild: false,
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
      canWalk: true,
      canDrill: false,
      canBuild: false,
      color: { r: 80, g: 60, b: 40 },
    },
  ],
  [
    TileType.PowerPath,
    {
      id: TileType.PowerPath,
      name: 'Power Path',
      description: 'Conducts power between buildings',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
      color: { r: 255, g: 255, b: 0 },
    },
  ],
  [
    TileType.Erosion1,
    {
      id: TileType.Erosion1,
      name: 'Erosion (Stage 1)',
      description: 'Beginning stages of erosion',
      category: 'hazard',
      canWalk: true,
      canDrill: true,
      canBuild: false,
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
      canWalk: true,
      canDrill: true,
      canBuild: false,
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
      canWalk: false,
      canDrill: false,
      canBuild: false,
      color: { r: 90, g: 70, b: 50 },
    },
  ],
  [
    TileType.SlugHole,
    {
      id: TileType.SlugHole,
      name: 'Slug Hole',
      description: 'Spawning point for Slimy Slugs',
      category: 'hazard',
      canWalk: false,
      canDrill: true,
      canBuild: false,
      color: { r: 150, g: 150, b: 20 },
    },
  ],
  [
    TileType.RechargeSeam,
    {
      id: TileType.RechargeSeam,
      name: 'Recharge Seam',
      description: 'Provides power recharge for vehicles',
      category: 'resource',
      canWalk: false,
      canDrill: true,
      canBuild: false,
      color: { r: 255, g: 200, b: 0 },
    },
  ],
  [
    TileType.IceTerrain,
    {
      id: TileType.IceTerrain,
      name: 'Ice',
      description: 'Slippery ice terrain',
      category: 'special',
      canWalk: true,
      canDrill: true,
      canBuild: false,
      color: { r: 200, g: 230, b: 255 },
    },
  ],
  [
    TileType.HardRock,
    {
      id: TileType.HardRock,
      name: 'Hard Rock',
      description: 'Harder rock that takes longer to drill',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
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
      canWalk: false,
      canDrill: true,
      canBuild: false,
      color: { r: 30, g: 30, b: 30 },
    },
  ],
]);

// Helper function to get tile info
export function getTileInfo(tileId: number): TileDefinition | undefined {
  return TILE_DEFINITIONS.get(tileId);
}

// Helper function to get tile name
export function getTileName(tileId: number): string {
  const info = getTileInfo(tileId);
  return info ? info.name : `Unknown Tile (${tileId})`;
}

// Helper function to get tile description
export function getTileDescription(tileId: number): string {
  const info = getTileInfo(tileId);
  return info ? info.description : `Unknown tile type with ID ${tileId}`;
}
