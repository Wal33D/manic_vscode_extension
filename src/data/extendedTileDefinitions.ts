import { TileDefinition } from './tileDefinitions';

// Extended tile definitions for IDs 116-299 and beyond
// These tiles are used in various game levels but their exact properties need research

// Helper function to create placeholder tile definitions
function createPlaceholderTile(
  id: number,
  category: 'ground' | 'wall' | 'resource' | 'hazard' | 'special' | 'rubble',
  description?: string
): TileDefinition {
  return {
    id,
    name: `Tile ${id}`,
    description: description || `Game tile ID ${id} - properties to be determined`,
    category,
    canWalk: false,
    canDrill: false,
    canBuild: false,
  };
}

// Tiles 116-165 - Common in many levels
export const EXTENDED_TILE_DEFINITIONS_116_165: Map<number, TileDefinition> = new Map([
  // Based on patterns, these might be special terrain variants
  [
    116,
    {
      id: 116,
      name: 'Special Ground 1',
      description: 'Special terrain variant - commonly used in levels',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    117,
    {
      id: 117,
      name: 'Special Ground 2',
      description: 'Special terrain variant',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    118,
    {
      id: 118,
      name: 'Special Ground 3',
      description: 'Special terrain variant',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    119,
    {
      id: 119,
      name: 'Special Ground 4',
      description: 'Special terrain variant',
      category: 'special',
      canWalk: true,
      canDrill: false,
      canBuild: false,
    },
  ],
  [
    120,
    {
      id: 120,
      name: 'Special Wall 1',
      description: 'Special wall variant',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    121,
    {
      id: 121,
      name: 'Special Wall 2',
      description: 'Special wall variant',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    122,
    {
      id: 122,
      name: 'Special Wall 3',
      description: 'Special wall variant',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
    },
  ],
  [
    123,
    {
      id: 123,
      name: 'Special Wall 4',
      description: 'Special wall variant',
      category: 'wall',
      canWalk: false,
      canDrill: true,
      canBuild: false,
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
    125,
    {
      id: 125,
      name: 'Special Hazard 1',
      description: 'Special hazard tile',
      category: 'hazard',
      canWalk: false,
      canDrill: false,
      canBuild: false,
    },
  ],
]);

// Add remaining tiles 126-165 as placeholders
for (let i = 126; i <= 162; i++) {
  if (i === 142 || i === 159) {
    continue; // Skip gaps in the data
  }

  let category: 'ground' | 'wall' | 'resource' | 'hazard' | 'special' | 'rubble' = 'special';
  if (i >= 126 && i <= 129) {
    category = 'hazard';
  } else if (i >= 130 && i <= 141) {
    category = 'special';
  } else if (i >= 143 && i <= 158) {
    category = 'wall';
  } else if (i >= 160 && i <= 162) {
    category = 'rubble';
  }

  EXTENDED_TILE_DEFINITIONS_116_165.set(i, createPlaceholderTile(i, category));
}

// Tiles 166-299 - Frequently used in game levels
export const EXTENDED_TILE_DEFINITIONS_166_299: Map<number, TileDefinition> = new Map();

// Add tiles 166-299 as placeholders with educated guesses based on ID ranges
for (let i = 166; i <= 299; i++) {
  // Skip gaps found in the data
  if (i === 238 || i === 253 || i === 287 || i === 293) {
    continue;
  }

  let category: 'ground' | 'wall' | 'resource' | 'hazard' | 'special' | 'rubble' = 'special';
  let description = `Game tile ID ${i}`;

  // Make educated guesses based on ID patterns
  if (i >= 166 && i <= 175) {
    category = 'ground';
    description = `Ground variant ${i - 165}`;
  } else if (i >= 176 && i <= 199) {
    category = 'wall';
    description = `Wall variant ${i - 175}`;
  } else if (i >= 200 && i <= 225) {
    category = 'resource';
    description = `Resource variant ${i - 199}`;
  } else if (i >= 226 && i <= 250) {
    category = 'hazard';
    description = `Hazard variant ${i - 225}`;
  } else if (i >= 251 && i <= 275) {
    category = 'special';
    description = `Special tile ${i - 250}`;
  } else if (i >= 276 && i <= 299) {
    category = 'rubble';
    description = `Rubble variant ${i - 275}`;
  }

  EXTENDED_TILE_DEFINITIONS_166_299.set(i, {
    id: i,
    name: `Tile ${i}`,
    description,
    category,
    canWalk: category === 'ground' || category === 'special',
    canDrill: category === 'wall' || category === 'resource' || category === 'rubble',
    canBuild: category === 'ground',
  });
}

// Combine all extended definitions
export const ALL_EXTENDED_TILE_DEFINITIONS: Map<number, TileDefinition> = new Map([
  ...EXTENDED_TILE_DEFINITIONS_116_165,
  ...EXTENDED_TILE_DEFINITIONS_166_299,
]);

// Export helper to get extended tile info
export function getExtendedTileInfo(tileId: number): TileDefinition | undefined {
  return ALL_EXTENDED_TILE_DEFINITIONS.get(tileId);
}
