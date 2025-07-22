export interface MapTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  size: { rows: number; cols: number };
  preview?: string; // Base64 encoded preview image
  tiles: number[][];
  objectives?: string[];
  info?: {
    rowcount: number;
    colcount: number;
    camerapos?: string;
    biome?: string;
    creator?: string;
  };
}

export enum TemplateCategory {
  TUTORIAL = 'tutorial',
  COMBAT = 'combat',
  PUZZLE = 'puzzle',
  EXPLORATION = 'exploration',
  RESOURCE = 'resource',
  CUSTOM = 'custom',
}

export class MapTemplateManager {
  private static templates: Map<string, MapTemplate> = new Map();

  static {
    // Initialize built-in templates
    this.registerBuiltInTemplates();
  }

  private static registerBuiltInTemplates(): void {
    // Small tutorial map
    this.addTemplate({
      id: 'tutorial-basic',
      name: 'Basic Tutorial',
      description:
        'A small map perfect for learning the basics. Includes a spawn point, some resources, and simple objectives.',
      category: TemplateCategory.TUTORIAL,
      difficulty: 'beginner',
      size: { rows: 20, cols: 20 },
      tiles: this.generateTutorialMap(),
      objectives: [
        'Collect 5 Energy Crystals',
        'Build a Support Station',
        'Clear the rubble blocking the path',
      ],
      info: {
        rowcount: 20,
        colcount: 20,
        biome: 'rock',
        creator: 'Template System',
      },
    });

    // Combat arena
    this.addTemplate({
      id: 'combat-arena',
      name: 'Combat Arena',
      description: 'An arena-style map with defensive positions and strategic resource placement.',
      category: TemplateCategory.COMBAT,
      difficulty: 'intermediate',
      size: { rows: 30, cols: 30 },
      tiles: this.generateCombatArena(),
      objectives: [
        'Defend your Tool Store for 10 minutes',
        'Defeat all monster spawns',
        'Build 3 defensive structures',
      ],
      info: {
        rowcount: 30,
        colcount: 30,
        biome: 'lava',
        creator: 'Template System',
      },
    });

    // Puzzle chamber
    this.addTemplate({
      id: 'puzzle-chamber',
      name: 'Puzzle Chamber',
      description: 'A mind-bending puzzle map with interconnected chambers and hidden passages.',
      category: TemplateCategory.PUZZLE,
      difficulty: 'advanced',
      size: { rows: 25, cols: 25 },
      tiles: this.generatePuzzleChamber(),
      objectives: [
        'Find the hidden crystal cache',
        'Activate all 4 power nodes',
        'Escape through the secret exit',
      ],
      info: {
        rowcount: 25,
        colcount: 25,
        biome: 'ice',
        creator: 'Template System',
      },
    });

    // Resource rush
    this.addTemplate({
      id: 'resource-rush',
      name: 'Resource Rush',
      description: 'A resource-rich map perfect for mining operations and economic challenges.',
      category: TemplateCategory.RESOURCE,
      difficulty: 'intermediate',
      size: { rows: 35, cols: 35 },
      tiles: this.generateResourceRush(),
      objectives: [
        'Collect 50 Energy Crystals',
        'Mine 30 units of Ore',
        'Build a complete mining operation',
      ],
      info: {
        rowcount: 35,
        colcount: 35,
        biome: 'rock',
        creator: 'Template System',
      },
    });

    // Exploration cavern
    this.addTemplate({
      id: 'exploration-cavern',
      name: 'Exploration Cavern',
      description: 'A vast cavern system with multiple paths and hidden treasures.',
      category: TemplateCategory.EXPLORATION,
      difficulty: 'intermediate',
      size: { rows: 40, cols: 40 },
      tiles: this.generateExplorationCavern(),
      objectives: ['Explore 80% of the map', 'Find all 5 hidden artifacts', 'Establish 3 outposts'],
      info: {
        rowcount: 40,
        colcount: 40,
        biome: 'rock',
        creator: 'Template System',
      },
    });
  }

  private static generateTutorialMap(): number[][] {
    const rows = 20;
    const cols = 20;
    const map: number[][] = [];

    // Initialize with solid rock
    for (let r = 0; r < rows; r++) {
      map[r] = new Array(cols).fill(40); // Solid rock
    }

    // Create main chamber
    for (let r = 5; r < 15; r++) {
      for (let c = 5; c < 15; c++) {
        map[r][c] = 1; // Ground
      }
    }

    // Add spawn point
    map[10][10] = 101; // Tool Store

    // Add some resources
    map[7][7] = 42; // Crystal seam
    map[7][12] = 42; // Crystal seam
    map[12][7] = 46; // Ore seam
    map[12][12] = 46; // Ore seam

    // Add paths
    for (let c = 3; c < 17; c++) {
      if (c !== 10) {
        // Don't overwrite spawn point
        map[10][c] = 1; // Horizontal path
      }
    }
    for (let r = 3; r < 17; r++) {
      if (r !== 10) {
        // Don't overwrite spawn point
        map[r][10] = 1; // Vertical path
      }
    }

    // Add some loose rock for clearing objectives
    map[10][4] = 30; // Loose rock
    map[10][15] = 30; // Loose rock
    map[4][10] = 30; // Loose rock
    map[15][10] = 30; // Loose rock

    return map;
  }

  private static generateCombatArena(): number[][] {
    const rows = 30;
    const cols = 30;
    const map: number[][] = [];

    // Initialize with solid rock
    for (let r = 0; r < rows; r++) {
      map[r] = new Array(cols).fill(40); // Solid rock
    }

    // Create arena
    const centerR = Math.floor(rows / 2);
    const centerC = Math.floor(cols / 2);
    const radius = 12;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dist = Math.sqrt(Math.pow(r - centerR, 2) + Math.pow(c - centerC, 2));
        if (dist < radius) {
          map[r][c] = 1; // Ground
        }
      }
    }

    // Add spawn point in center
    map[centerR][centerC] = 101; // Tool Store

    // Add defensive walls
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const wallR = Math.round(centerR + Math.cos(angle) * 8);
      const wallC = Math.round(centerC + Math.sin(angle) * 8);
      if (wallR > 0 && wallR < rows - 1 && wallC > 0 && wallC < cols - 1) {
        map[wallR][wallC] = 38; // Reinforced wall
      }
    }

    // Add resource deposits in corners
    const positions = [
      { r: centerR - 6, c: centerC - 6 },
      { r: centerR - 6, c: centerC + 6 },
      { r: centerR + 6, c: centerC - 6 },
      { r: centerR + 6, c: centerC + 6 },
    ];

    for (const pos of positions) {
      if (map[pos.r]?.[pos.c] === 1) {
        map[pos.r][pos.c] = 42; // Crystal seam
      }
    }

    // Add some lava hazards
    map[centerR - 10][centerC] = 6; // Lava
    map[centerR + 10][centerC] = 6; // Lava
    map[centerR][centerC - 10] = 6; // Lava
    map[centerR][centerC + 10] = 6; // Lava

    return map;
  }

  private static generatePuzzleChamber(): number[][] {
    const rows = 25;
    const cols = 25;
    const map: number[][] = [];

    // Initialize with solid rock
    for (let r = 0; r < rows; r++) {
      map[r] = new Array(cols).fill(40); // Solid rock
    }

    // Create chambers
    const chambers = [
      { r: 5, c: 5, w: 5, h: 5 }, // Top-left
      { r: 5, c: 15, w: 5, h: 5 }, // Top-right
      { r: 15, c: 5, w: 5, h: 5 }, // Bottom-left
      { r: 15, c: 15, w: 5, h: 5 }, // Bottom-right
      { r: 10, c: 10, w: 5, h: 5 }, // Center
    ];

    for (const chamber of chambers) {
      for (let r = chamber.r; r < chamber.r + chamber.h; r++) {
        for (let c = chamber.c; c < chamber.c + chamber.w; c++) {
          map[r][c] = 1; // Ground
        }
      }
    }

    // Create connecting paths
    // Horizontal paths
    for (let c = 7; c < 18; c++) {
      map[7][c] = 1; // Top path
      map[17][c] = 1; // Bottom path
      map[12][c] = 1; // Middle path
    }
    // Vertical paths
    for (let r = 7; r < 18; r++) {
      map[r][7] = 1; // Left path
      map[r][17] = 1; // Right path
      map[r][12] = 1; // Middle path
    }

    // Add spawn point
    map[12][12] = 101; // Tool Store in center

    // Add power nodes in each corner chamber
    map[7][7] = 102; // Power Station placeholder
    map[7][17] = 102; // Power Station placeholder
    map[17][7] = 102; // Power Station placeholder
    map[17][17] = 102; // Power Station placeholder

    // Add hidden crystal cache
    map[2][12] = 44; // Energy crystal (hidden)

    // Add barriers that need to be solved
    map[12][10] = 90; // Electric fence
    map[12][14] = 90; // Electric fence
    map[10][12] = 90; // Electric fence
    map[14][12] = 90; // Electric fence

    return map;
  }

  private static generateResourceRush(): number[][] {
    const rows = 35;
    const cols = 35;
    const map: number[][] = [];

    // Initialize with solid rock
    for (let r = 0; r < rows; r++) {
      map[r] = new Array(cols).fill(40); // Solid rock
    }

    // Create main mining area
    for (let r = 5; r < 30; r++) {
      for (let c = 5; c < 30; c++) {
        if (Math.random() < 0.7) {
          map[r][c] = 1; // Ground
        } else if (Math.random() < 0.5) {
          map[r][c] = 30; // Loose rock
        }
      }
    }

    // Add spawn point
    map[17][17] = 101; // Tool Store in center

    // Create resource veins
    const resourceVeins = [
      { r: 8, c: 8, type: 42, size: 3 }, // Crystal vein
      { r: 8, c: 26, type: 42, size: 3 }, // Crystal vein
      { r: 26, c: 8, type: 46, size: 3 }, // Ore vein
      { r: 26, c: 26, type: 46, size: 3 }, // Ore vein
      { r: 17, c: 8, type: 44, size: 2 }, // Energy crystal
      { r: 17, c: 26, type: 48, size: 2 }, // Ore
    ];

    for (const vein of resourceVeins) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = vein.r + dr;
          const c = vein.c + dc;
          if (r > 0 && r < rows - 1 && c > 0 && c < cols - 1 && Math.random() < 0.8) {
            map[r][c] = vein.type;
          }
        }
      }
    }

    // Add recharge seams
    for (let i = 0; i < 5; i++) {
      const r = Math.floor(Math.random() * 20) + 7;
      const c = Math.floor(Math.random() * 20) + 7;
      if (map[r][c] === 1) {
        map[r][c] = 50; // Recharge seam
      }
    }

    return map;
  }

  private static generateExplorationCavern(): number[][] {
    const rows = 40;
    const cols = 40;
    const map: number[][] = [];

    // Initialize with solid rock
    for (let r = 0; r < rows; r++) {
      map[r] = new Array(cols).fill(40); // Solid rock
    }

    // Generate cavern system using random walk
    const paths: Array<{ r: number; c: number }> = [];
    const startPoints = [
      { r: 20, c: 20 }, // Center
      { r: 10, c: 10 }, // Top-left
      { r: 10, c: 30 }, // Top-right
      { r: 30, c: 10 }, // Bottom-left
      { r: 30, c: 30 }, // Bottom-right
    ];

    // Random walk from each start point
    for (const start of startPoints) {
      // eslint-disable-next-line prefer-const
      let current = { ...start };
      const steps = 100;

      for (let i = 0; i < steps; i++) {
        if (current.r > 2 && current.r < rows - 3 && current.c > 2 && current.c < cols - 3) {
          paths.push({ ...current });

          // Random direction
          const dir = Math.floor(Math.random() * 4);
          switch (dir) {
            case 0:
              current.r--;
              break;
            case 1:
              current.r++;
              break;
            case 2:
              current.c--;
              break;
            case 3:
              current.c++;
              break;
          }
        }
      }
    }

    // Create paths with some width
    for (const pos of paths) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = pos.r + dr;
          const c = pos.c + dc;
          if (r > 0 && r < rows - 1 && c > 0 && c < cols - 1) {
            map[r][c] = 1; // Ground
          }
        }
      }
    }

    // Add spawn point
    map[20][20] = 101; // Tool Store in center

    // Add hidden artifacts
    const artifacts = [
      { r: 5, c: 5 },
      { r: 5, c: 35 },
      { r: 35, c: 5 },
      { r: 35, c: 35 },
      { r: 20, c: 35 },
    ];

    for (const artifact of artifacts) {
      if (map[artifact.r]?.[artifact.c] !== undefined) {
        // Create small chamber for artifact
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const r = artifact.r + dr;
            const c = artifact.c + dc;
            if (r > 0 && r < rows - 1 && c > 0 && c < cols - 1) {
              map[r][c] = 1; // Ground
            }
          }
        }
        map[artifact.r][artifact.c] = 44; // Energy crystal as artifact
      }
    }

    // Add some water features
    for (let i = 0; i < 10; i++) {
      const r = Math.floor(Math.random() * (rows - 10)) + 5;
      const c = Math.floor(Math.random() * (cols - 10)) + 5;
      if (map[r][c] === 1) {
        map[r][c] = 11; // Water
      }
    }

    return map;
  }

  public static addTemplate(template: MapTemplate): void {
    this.templates.set(template.id, template);
  }

  public static getTemplate(id: string): MapTemplate | undefined {
    return this.templates.get(id);
  }

  public static getAllTemplates(): MapTemplate[] {
    return Array.from(this.templates.values());
  }

  public static getTemplatesByCategory(category: TemplateCategory): MapTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  public static exportTemplate(template: MapTemplate): string {
    return JSON.stringify(template, null, 2);
  }

  public static importTemplate(jsonString: string): MapTemplate | null {
    try {
      const template = JSON.parse(jsonString) as MapTemplate;
      // Validate template structure
      if (
        template.id &&
        template.name &&
        template.tiles &&
        Array.isArray(template.tiles) &&
        template.tiles.length > 0
      ) {
        return template;
      }
    } catch (error) {
      // Invalid JSON
    }
    return null;
  }

  public static createCustomTemplate(
    name: string,
    description: string,
    tiles: number[][],
    objectives?: string[]
  ): MapTemplate {
    const rows = tiles.length;
    const cols = tiles[0]?.length || 0;

    return {
      id: `custom-${Date.now()}`,
      name,
      description,
      category: TemplateCategory.CUSTOM,
      difficulty: 'intermediate',
      size: { rows, cols },
      tiles,
      objectives,
      info: {
        rowcount: rows,
        colcount: cols,
        creator: 'User',
      },
    };
  }
}
