import { TileDefinition } from './tileDefinitions';

// Complete tile definitions based on additional_context analysis
export const ENHANCED_TILE_DEFINITIONS: Map<number, TileDefinition> = new Map([
  // Basic terrain (1-12)
  [
    1,
    {
      id: 1,
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
    2,
    {
      id: 2,
      name: 'Rubble Level 1',
      description: 'Light rubble - easy to clear',
      category: 'rubble',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    3,
    {
      id: 3,
      name: 'Rubble Level 2',
      description: 'Medium rubble - moderate effort to clear',
      category: 'rubble',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    4,
    {
      id: 4,
      name: 'Rubble Level 3',
      description: 'Heavy rubble - takes time to clear',
      category: 'rubble',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    5,
    {
      id: 5,
      name: 'Rubble Level 4',
      description: 'Dense rubble - difficult to clear',
      category: 'rubble',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    6,
    {
      id: 6,
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
    7,
    {
      id: 7,
      name: 'Erosion Level 4',
      description: 'Severely eroded terrain - unstable',
      category: 'hazard',
      canWalk: true,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    8,
    {
      id: 8,
      name: 'Erosion Level 3',
      description: 'Heavily eroded terrain',
      category: 'hazard',
      canWalk: true,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    9,
    {
      id: 9,
      name: 'Erosion Level 2',
      description: 'Moderately eroded terrain',
      category: 'hazard',
      canWalk: true,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    10,
    {
      id: 10,
      name: 'Erosion Level 1',
      description: 'Lightly eroded terrain',
      category: 'hazard',
      canWalk: true,
      canDrill: false,
      canBuild: true,
    },
  ],
  [
    11,
    {
      id: 11,
      name: 'Water',
      description: 'Deep water - vehicles need upgrades to cross',
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

  // Power paths (13-25)
  [
    13,
    {
      id: 13,
      name: 'Power Path In Progress',
      description: 'Power path under construction',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    14,
    {
      id: 14,
      name: 'Power Path Building',
      description: 'Power path connected to building (unpowered)',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
      color: { r: 220, g: 220, b: 220 },
    },
  ],
  [
    15,
    {
      id: 15,
      name: 'Power Path Building Powered',
      description: 'Power path connected to building (powered)',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    16,
    {
      id: 16,
      name: 'Power Path 1',
      description: 'Single direction power path (unpowered)',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    17,
    {
      id: 17,
      name: 'Power Path 1 Powered',
      description: 'Single direction power path (powered)',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    18,
    {
      id: 18,
      name: 'Power Path 2 Adjacent',
      description: 'Two adjacent power connections (unpowered)',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    19,
    {
      id: 19,
      name: 'Power Path 2 Adjacent Powered',
      description: 'Two adjacent power connections (powered)',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    20,
    {
      id: 20,
      name: 'Power Path 2 Opposite',
      description: 'Two opposite power connections (unpowered)',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    21,
    {
      id: 21,
      name: 'Power Path 2 Opposite Powered',
      description: 'Two opposite power connections (powered)',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    22,
    {
      id: 22,
      name: 'Power Path 3',
      description: 'Three-way power junction (unpowered)',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    23,
    {
      id: 23,
      name: 'Power Path 3 Powered',
      description: 'Three-way power junction (powered)',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    24,
    {
      id: 24,
      name: 'Power Path 4',
      description: 'Four-way power junction (unpowered)',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    25,
    {
      id: 25,
      name: 'Power Path 4 Powered',
      description: 'Four-way power junction (powered)',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
    },
  ],

  // Wall types (26-41)
  [
    26,
    {
      id: 26,
      name: 'Dirt Regular',
      description: 'Soft dirt wall - very easy to drill',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
      color: { r: 169, g: 109, b: 82 },
    },
  ],
  [
    27,
    {
      id: 27,
      name: 'Dirt Corner',
      description: 'Dirt wall corner piece',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    28,
    {
      id: 28,
      name: 'Dirt Edge',
      description: 'Dirt wall edge piece',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    29,
    {
      id: 29,
      name: 'Dirt Intersect',
      description: 'Dirt wall intersection',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    30,
    {
      id: 30,
      name: 'Loose Rock Regular',
      description: 'Unstable rock wall - easy to drill but may cause cave-ins',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
      color: { r: 139, g: 104, b: 86 },
    },
  ],
  [
    31,
    {
      id: 31,
      name: 'Loose Rock Corner',
      description: 'Loose rock wall corner piece',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    32,
    {
      id: 32,
      name: 'Loose Rock Edge',
      description: 'Loose rock wall edge piece',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    33,
    {
      id: 33,
      name: 'Loose Rock Intersect',
      description: 'Loose rock wall intersection',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    34,
    {
      id: 34,
      name: 'Hard Rock Regular',
      description: 'Dense rock wall - takes longer to drill',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
      color: { r: 77, g: 53, b: 50 },
    },
  ],
  [
    35,
    {
      id: 35,
      name: 'Hard Rock Corner',
      description: 'Hard rock wall corner piece',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    36,
    {
      id: 36,
      name: 'Hard Rock Edge',
      description: 'Hard rock wall edge piece',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    37,
    {
      id: 37,
      name: 'Hard Rock Intersect',
      description: 'Hard rock wall intersection',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    38,
    {
      id: 38,
      name: 'Solid Rock Regular',
      description: 'Impenetrable solid rock - cannot be drilled',
      category: 'wall',
      canWalk: false,
      canDrill: false,
      canBuild: false,
      color: { r: 0, g: 0, b: 0, a: 0 },
    },
  ],
  [
    39,
    {
      id: 39,
      name: 'Solid Rock Corner',
      description: 'Solid rock wall corner piece - cannot be drilled',
      category: 'wall',
      canWalk: false,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    40,
    {
      id: 40,
      name: 'Solid Rock Edge',
      description: 'Solid rock wall edge piece - cannot be drilled',
      category: 'wall',
      canWalk: false,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    41,
    {
      id: 41,
      name: 'Solid Rock Intersect',
      description: 'Solid rock wall intersection - cannot be drilled',
      category: 'wall',
      canWalk: false,
      canDrill: false,
      canBuild: false,
    },
  ],

  // Resource seams (42-53)
  [
    42,
    {
      id: 42,
      name: 'Crystal Seam Regular',
      description: 'Contains energy crystals - your primary power source',
      category: 'resource',
      canWalk: false,
      canDrill: true,
      canBuild: false,
      color: { r: 206, g: 233, b: 104 },
    },
  ],
  [
    43,
    {
      id: 43,
      name: 'Crystal Seam Corner',
      description: 'Crystal seam corner piece',
      category: 'resource',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    44,
    {
      id: 44,
      name: 'Crystal Seam Edge',
      description: 'Crystal seam edge piece',
      category: 'resource',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    45,
    {
      id: 45,
      name: 'Crystal Seam Intersect',
      description: 'Crystal seam intersection',
      category: 'resource',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    46,
    {
      id: 46,
      name: 'Ore Seam Regular',
      description: 'Contains ore used for building and vehicle upgrades',
      category: 'resource',
      canWalk: false,
      canDrill: true,
      canBuild: false,
      color: { r: 200, g: 85, b: 30 },
    },
  ],
  [
    47,
    {
      id: 47,
      name: 'Ore Seam Corner',
      description: 'Ore seam corner piece',
      category: 'resource',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    48,
    {
      id: 48,
      name: 'Ore Seam Edge',
      description: 'Ore seam edge piece',
      category: 'resource',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    49,
    {
      id: 49,
      name: 'Ore Seam Intersect',
      description: 'Ore seam intersection',
      category: 'resource',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    50,
    {
      id: 50,
      name: 'Recharge Seam Regular',
      description: 'Special crystal formation that recharges electric fences',
      category: 'resource',
      canWalk: false,
      canDrill: true,
      canBuild: false,
      color: { r: 255, g: 255, b: 70 },
    },
  ],
  [
    51,
    {
      id: 51,
      name: 'Recharge Seam Corner',
      description: 'Recharge seam corner piece',
      category: 'resource',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    52,
    {
      id: 52,
      name: 'Recharge Seam Edge',
      description: 'Recharge seam edge piece',
      category: 'resource',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    53,
    {
      id: 53,
      name: 'Recharge Seam Intersect',
      description: 'Recharge seam intersection',
      category: 'resource',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],

  // Special tiles (58-65)
  [
    58,
    {
      id: 58,
      name: 'Roof',
      description: 'Cave roof - blocks vision and movement',
      category: 'special',
      canWalk: false,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    60,
    {
      id: 60,
      name: 'Fake Rubble 1',
      description: "Decorative rubble - doesn't affect gameplay",
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
      color: { r: 46, g: 23, b: 95, a: 0.1 },
    },
  ],
  [
    61,
    {
      id: 61,
      name: 'Fake Rubble 2',
      description: "Decorative rubble - doesn't affect gameplay",
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
      color: { r: 46, g: 23, b: 95, a: 0.5 },
    },
  ],
  [
    62,
    {
      id: 62,
      name: 'Fake Rubble 3',
      description: "Decorative rubble - doesn't affect gameplay",
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
      color: { r: 46, g: 23, b: 95, a: 0.3 },
    },
  ],
  [
    63,
    {
      id: 63,
      name: 'Fake Rubble 4',
      description: "Decorative rubble - doesn't affect gameplay",
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
      color: { r: 46, g: 23, b: 95 },
    },
  ],
  [
    64,
    {
      id: 64,
      name: 'Cliff Type 1 (Experimental)',
      description: 'Experimental cliff terrain',
      category: 'special',
      canWalk: false,
      canDrill: false,
      canBuild: false,
      color: { r: 46, g: 23, b: 95, a: 0.7 },
    },
  ],
  [
    65,
    {
      id: 65,
      name: 'Cliff Type 2 (Experimental)',
      description: 'Experimental cliff terrain variant',
      category: 'special',
      canWalk: false,
      canDrill: false,
      canBuild: false,
    },
  ],
]);

// Reinforced tiles (base ID + 50)
// Add reinforced variants for tiles 26-53 and 64-65
for (let baseId = 26; baseId <= 53; baseId++) {
  const baseTile = ENHANCED_TILE_DEFINITIONS.get(baseId);
  if (baseTile) {
    const reinforcedId = baseId + 50;
    ENHANCED_TILE_DEFINITIONS.set(reinforcedId, {
      ...baseTile,
      id: reinforcedId,
      name: baseTile.name + ' (Reinforced)',
      description: baseTile.description + ' - Reinforced version requires more drilling effort',
    });
  }
}

// Add reinforced cliff types
ENHANCED_TILE_DEFINITIONS.set(114, {
  id: 114,
  name: 'Cliff Type 1 (Reinforced)',
  description: 'Reinforced experimental cliff terrain',
  category: 'special',
  canWalk: false,
  canDrill: false,
  canBuild: false,
});

ENHANCED_TILE_DEFINITIONS.set(115, {
  id: 115,
  name: 'Cliff Type 2 (Reinforced)',
  description: 'Reinforced experimental cliff terrain variant',
  category: 'special',
  canWalk: false,
  canDrill: false,
  canBuild: false,
});

// Helper functions
export function isReinforcedTile(tileId: number): boolean {
  return (tileId >= 76 && tileId <= 103) || tileId === 114 || tileId === 115;
}

export function getBaseTileId(tileId: number): number {
  if (isReinforcedTile(tileId)) {
    return tileId - 50;
  }
  return tileId;
}

export function getReinforcedTileId(tileId: number): number | null {
  if (tileId >= 26 && tileId <= 53) {
    return tileId + 50;
  }
  if (tileId === 64 || tileId === 65) {
    return tileId + 50;
  }
  return null;
}

// Export enhanced tile info getter
export function getEnhancedTileInfo(tileId: number): TileDefinition | undefined {
  return ENHANCED_TILE_DEFINITIONS.get(tileId);
}

// Export enhanced tile name getter
export function getEnhancedTileName(tileId: number): string {
  const info = getEnhancedTileInfo(tileId);
  return info ? info.name : `Unknown Tile (${tileId})`;
}

// Export enhanced tile description getter
export function getEnhancedTileDescription(tileId: number): string {
  const info = getEnhancedTileInfo(tileId);
  return info ? info.description : `Unknown tile type with ID ${tileId}`;
}

// Get tile color for visualization
export function getTileColor(
  tileId: number
): { r: number; g: number; b: number; a?: number } | undefined {
  const info = getEnhancedTileInfo(tileId);
  return info?.color;
}
