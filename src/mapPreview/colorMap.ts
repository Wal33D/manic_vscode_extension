interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

interface ColorMap {
  [key: number]: Color;
}

export function getColorMap(): ColorMap {
  return {
    // Ground and basics
    1: { r: 124, g: 92, b: 70 }, // Ground
    2: { r: 100, g: 70, b: 50 }, // Rubble 1
    3: { r: 90, g: 60, b: 40 }, // Rubble 2
    4: { r: 80, g: 50, b: 30 }, // Rubble 3
    5: { r: 70, g: 40, b: 20 }, // Rubble 4

    // Hazards
    6: { r: 255, g: 50, b: 0 }, // Lava
    11: { r: 30, g: 84, b: 197 }, // Water
    12: { r: 180, g: 180, b: 20 }, // Slimy Slug hole

    // Building related
    14: { r: 220, g: 220, b: 220 }, // Building power path

    // Walls - Regular
    26: { r: 169, g: 109, b: 82 }, // Dirt
    27: { r: 159, g: 99, b: 72 }, // Dirt variant
    28: { r: 149, g: 89, b: 62 }, // Dirt variant
    29: { r: 139, g: 79, b: 52 }, // Dirt variant

    30: { r: 139, g: 104, b: 86 }, // Loose Rock
    31: { r: 129, g: 94, b: 76 }, // Loose Rock variant
    32: { r: 119, g: 84, b: 66 }, // Loose Rock variant
    33: { r: 109, g: 74, b: 56 }, // Loose Rock variant

    34: { r: 77, g: 53, b: 50 }, // Hard Rock
    35: { r: 67, g: 43, b: 40 }, // Hard Rock variant
    36: { r: 57, g: 33, b: 30 }, // Hard Rock variant
    37: { r: 47, g: 23, b: 20 }, // Hard Rock variant

    38: { r: 20, g: 20, b: 20 }, // Solid Rock (impenetrable)
    39: { r: 15, g: 15, b: 15 }, // Solid Rock variant
    40: { r: 10, g: 10, b: 10 }, // Solid Rock variant
    41: { r: 5, g: 5, b: 5 }, // Solid Rock variant

    // Resources
    42: { r: 206, g: 233, b: 104 }, // Energy Crystal Seam
    43: { r: 196, g: 223, b: 94 }, // Crystal variant
    44: { r: 186, g: 213, b: 84 }, // Crystal variant
    45: { r: 176, g: 203, b: 74 }, // Crystal variant

    46: { r: 200, g: 85, b: 30 }, // Ore Seam
    47: { r: 190, g: 75, b: 20 }, // Ore variant
    48: { r: 180, g: 65, b: 10 }, // Ore variant
    49: { r: 170, g: 55, b: 0 }, // Ore variant

    50: { r: 255, g: 255, b: 70 }, // Recharge Seam
    51: { r: 245, g: 245, b: 60 }, // Recharge variant
    52: { r: 235, g: 235, b: 50 }, // Recharge variant
    53: { r: 225, g: 225, b: 40 }, // Recharge variant

    // Special tiles
    60: { r: 46, g: 23, b: 95, a: 0.1 }, // Landslide rubble
    61: { r: 46, g: 23, b: 95, a: 0.5 }, // Landslide rubble
    62: { r: 46, g: 23, b: 95, a: 0.3 }, // Landslide rubble
    63: { r: 46, g: 23, b: 95 }, // Landslide rubble
    64: { r: 46, g: 23, b: 95, a: 0.7 }, // Cliff type 1
    65: { r: 56, g: 33, b: 105 }, // Cliff type 2

    // Reinforced tiles (base + 50)
    76: { r: 169, g: 109, b: 82, a: 0.7 }, // Reinforced Dirt
    77: { r: 159, g: 99, b: 72, a: 0.7 }, // Reinforced Dirt variant
    78: { r: 149, g: 89, b: 62, a: 0.7 }, // Reinforced Dirt variant
    79: { r: 139, g: 79, b: 52, a: 0.7 }, // Reinforced Dirt variant

    80: { r: 139, g: 104, b: 86, a: 0.7 }, // Reinforced Loose Rock
    81: { r: 129, g: 94, b: 76, a: 0.7 }, // Reinforced Loose Rock variant
    82: { r: 119, g: 84, b: 66, a: 0.7 }, // Reinforced Loose Rock variant
    83: { r: 109, g: 74, b: 56, a: 0.7 }, // Reinforced Loose Rock variant

    84: { r: 77, g: 53, b: 50, a: 0.7 }, // Reinforced Hard Rock
    85: { r: 67, g: 43, b: 40, a: 0.7 }, // Reinforced Hard Rock variant
    86: { r: 57, g: 33, b: 30, a: 0.7 }, // Reinforced Hard Rock variant
    87: { r: 47, g: 23, b: 20, a: 0.7 }, // Reinforced Hard Rock variant

    88: { r: 20, g: 20, b: 20, a: 0.7 }, // Reinforced Solid Rock
    89: { r: 15, g: 15, b: 15, a: 0.7 }, // Reinforced Solid Rock variant
    90: { r: 10, g: 10, b: 10, a: 0.7 }, // Reinforced Solid Rock variant
    91: { r: 5, g: 5, b: 5, a: 0.7 }, // Reinforced Solid Rock variant

    92: { r: 206, g: 233, b: 104, a: 0.7 }, // Reinforced Crystal
    93: { r: 196, g: 223, b: 94, a: 0.7 }, // Reinforced Crystal variant
    94: { r: 186, g: 213, b: 84, a: 0.7 }, // Reinforced Crystal variant
    95: { r: 176, g: 203, b: 74, a: 0.7 }, // Reinforced Crystal variant

    96: { r: 200, g: 85, b: 30, a: 0.7 }, // Reinforced Ore
    97: { r: 190, g: 75, b: 20, a: 0.7 }, // Reinforced Ore variant
    98: { r: 180, g: 65, b: 10, a: 0.7 }, // Reinforced Ore variant
    99: { r: 170, g: 55, b: 0, a: 0.7 }, // Reinforced Ore variant

    100: { r: 255, g: 255, b: 70, a: 0.7 }, // Reinforced Recharge
    101: { r: 124, g: 92, b: 70 }, // Ground duplicate
    102: { r: 173, g: 216, b: 230 }, // Unknown
    103: { r: 100, g: 100, b: 100 }, // Unknown

    106: { r: 255, g: 70, b: 10, a: 0.9 }, // Lava reinforced
    111: { r: 30, g: 95, b: 220 }, // Water reinforced
    112: { r: 180, g: 180, b: 20 }, // Slimy Slug hole reinforced
    114: { r: 220, g: 220, b: 220 }, // Building power path reinforced
    115: { r: 220, g: 220, b: 220 }, // Unknown reinforced

    124: { r: 70, g: 130, b: 180, a: 0.9 }, // Floating Flat Panels

    // Additional tiles
    160: { r: 255, g: 0, b: 0 }, // Unknown red
    161: { r: 238, g: 130, b: 238 }, // Unknown violet
    162: { r: 34, g: 139, b: 34 }, // Unknown green
    163: { r: 46, g: 23, b: 95 }, // Landslide rubble variant
    164: { r: 65, g: 33, b: 95 }, // Landslide rubble variant
    165: { r: 46, g: 23, b: 95, a: 0.5 }, // Weird Rubble
  };
}

export function getTileColor(tileId: number): Color {
  const colorMap = getColorMap();
  return colorMap[tileId] || { r: 128, g: 128, b: 128 }; // Default gray for unknown tiles
}

export function getRgbaString(color: Color): string {
  const alpha = color.a !== undefined ? color.a : 1;
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}
