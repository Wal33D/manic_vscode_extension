import * as vscode from 'vscode';
import { DatFile, InfoSection, BuildingType } from '../types/datFileTypes';

export interface LevelGeneratorConfig {
  name: string;
  description: string;
  category: 'tutorial' | 'mining' | 'combat' | 'survival' | 'puzzle' | 'custom';
  difficulty: 'easy' | 'medium' | 'hard';
  size: 'small' | 'medium' | 'large';
  biome: 'rock' | 'ice' | 'lava';
}

export interface GeneratedLevel {
  datFile: Partial<DatFile>;
  description: string;
}

export class LevelGeneratorProvider {
  private static readonly generators: Map<
    string,
    (config: LevelGeneratorConfig) => GeneratedLevel
  > = new Map([
    ['tutorial', LevelGeneratorProvider.generateTutorialLevel],
    ['mining', LevelGeneratorProvider.generateMiningLevel],
    ['combat', LevelGeneratorProvider.generateCombatLevel],
    ['survival', LevelGeneratorProvider.generateSurvivalLevel],
    ['puzzle', LevelGeneratorProvider.generatePuzzleLevel],
  ]);

  public static async generateLevel(): Promise<string | undefined> {
    // Step 1: Select level type
    const levelTypes = [
      {
        label: 'Tutorial Level',
        value: 'tutorial',
        description: 'Basic level for learning game mechanics',
      },
      { label: 'Mining Challenge', value: 'mining', description: 'Focus on resource collection' },
      { label: 'Combat Mission', value: 'combat', description: 'Defend against monsters' },
      { label: 'Survival Mode', value: 'survival', description: 'Limited resources and oxygen' },
      { label: 'Puzzle Map', value: 'puzzle', description: 'Strategic thinking required' },
    ];

    const selectedType = await vscode.window.showQuickPick(levelTypes, {
      placeHolder: 'Select level type',
      matchOnDescription: true,
    });

    if (!selectedType) {
      return undefined;
    }

    // Step 2: Select difficulty
    const difficulties = [
      { label: 'Easy', value: 'easy' },
      { label: 'Medium', value: 'medium' },
      { label: 'Hard', value: 'hard' },
    ];

    const selectedDifficulty = await vscode.window.showQuickPick(difficulties, {
      placeHolder: 'Select difficulty level',
    });

    if (!selectedDifficulty) {
      return undefined;
    }

    // Step 3: Select size
    const sizes = [
      { label: 'Small (25x25)', value: 'small' },
      { label: 'Medium (40x40)', value: 'medium' },
      { label: 'Large (60x60)', value: 'large' },
    ];

    const selectedSize = await vscode.window.showQuickPick(sizes, {
      placeHolder: 'Select map size',
    });

    if (!selectedSize) {
      return undefined;
    }

    // Step 4: Select biome
    const biomes = [
      { label: 'Rock', value: 'rock' },
      { label: 'Ice', value: 'ice' },
      { label: 'Lava', value: 'lava' },
    ];

    const selectedBiome = await vscode.window.showQuickPick(biomes, {
      placeHolder: 'Select biome',
    });

    if (!selectedBiome) {
      return undefined;
    }

    // Step 5: Get level name
    const levelName = await vscode.window.showInputBox({
      prompt: 'Enter level name',
      placeHolder: 'My Custom Level',
      value: `${selectedType.label} - ${selectedDifficulty.label}`,
    });

    if (!levelName) {
      return undefined;
    }

    // Generate the level
    const config: LevelGeneratorConfig = {
      name: levelName,
      description: `${selectedType.description} (${selectedDifficulty.label})`,
      category: selectedType.value as any,
      difficulty: selectedDifficulty.value as any,
      size: selectedSize.value as any,
      biome: selectedBiome.value as any,
    };

    const generator = this.generators.get(config.category);
    if (!generator) {
      vscode.window.showErrorMessage('Generator not found for selected level type');
      return undefined;
    }

    const generatedLevel = generator(config);
    return this.formatDatFile(generatedLevel.datFile, config);
  }

  private static generateTutorialLevel(config: LevelGeneratorConfig): GeneratedLevel {
    const size = config.size === 'small' ? 25 : config.size === 'medium' ? 40 : 60;
    const tiles: number[][] = [];
    const height: number[][] = [];
    const resources = { crystals: [], ore: [] } as any;

    // Initialize arrays
    for (let i = 0; i < size; i++) {
      tiles[i] = new Array(size).fill(1);
      height[i] = new Array(size).fill(0);
      resources.crystals[i] = new Array(size).fill(0);
      resources.ore[i] = new Array(size).fill(0);
    }

    // Create border walls
    for (let i = 0; i < size; i++) {
      tiles[0][i] = 38;
      tiles[size - 1][i] = 38;
      tiles[i][0] = 38;
      tiles[i][size - 1] = 38;
    }

    // Create starting area (top-left)
    for (let y = 1; y <= 5; y++) {
      for (let x = 1; x <= 5; x++) {
        tiles[y][x] = 101; // Reinforced ground
        height[y][x] = 10;
      }
    }

    // Add tutorial resources
    tiles[2][6] = 26; // Crystal seam
    tiles[3][6] = 26;
    resources.crystals[2][6] = 1;
    resources.crystals[3][6] = 1;

    tiles[6][2] = 34; // Ore seam
    tiles[6][3] = 34;
    resources.ore[6][2] = 1;
    resources.ore[6][3] = 1;

    // Create a path
    for (let x = 6; x < 15; x++) {
      tiles[3][x] = 1;
      tiles[4][x] = 1;
    }

    // Add discovery area
    for (let y = 2; y <= 6; y++) {
      for (let x = 15; x <= 19; x++) {
        tiles[y][x] = 1;
        if (y === 4 && x === 17) {
          tiles[y][x] = 50; // Recharge seam for discovery
        }
      }
    }

    const datFile: Partial<DatFile> = {
      info: {
        rowcount: size,
        colcount: size,
        biome: config.biome,
        creator: 'Level Generator',
        version: '1.0',
        levelname: config.name,
        briefing:
          'Welcome to Manic Miners! This tutorial will teach you the basics.\n\n1. Build a Tool Store\n2. Collect some crystals\n3. Discover the hidden recharge seam',
        briefingsuccess: 'Well done! You have completed the tutorial.',
        briefingfailure: 'Try again! Remember to follow the objectives.',
        oxygen: config.difficulty === 'easy' ? 1000 : 500,
        initialcrystals: 5,
        initialore: 5,
      } as InfoSection,
      tiles,
      height,
      resources,
      objectives: [
        { type: 'building', building: BuildingType.ToolStore },
        { type: 'resources', crystals: 10, ore: 5, studs: 0 },
        { type: 'discovertile', x: 17, y: 4, description: 'Discover the recharge seam' },
      ],
      buildings: [
        {
          type: 'BuildingToolStore_C',
          coordinates: {
            translation: { x: 450, y: 450, z: 0 },
            rotation: { p: 0, y: 0, r: 0 },
            scale: { x: 1, y: 1, z: 1 },
          },
          properties: {
            ID: 'ToolStore1',
            Teleport: 2,
          },
        },
      ],
      script: {
        variables: new Map([
          ['hasBuiltToolStore', 'false'],
          ['tutorialPhase', '0'],
        ]),
        events: [
          {
            name: 'start',
            condition: '',
            commands: [
              {
                command: 'msg',
                parameters: [
                  'Welcome to the tutorial! First, reinforce the ground near your Tool Store.',
                ],
              },
              { command: 'wait', parameters: ['3'] },
              { command: 'camera', parameters: ['3', '3'] },
              { command: 'objective', parameters: ['0'] },
            ],
          },
          {
            name: 'FirstCrystal',
            condition: 'crystals >= 1',
            commands: [
              { command: 'msg', parameters: ['Great! You collected your first crystal!'] },
              { command: 'tutorialPhase', parameters: ['1'] },
            ],
          },
          {
            name: 'ObjectivesComplete',
            condition: 'crystals >= 10 && ore >= 5',
            commands: [
              {
                command: 'msg',
                parameters: ['Excellent work! Now find the hidden recharge seam.'],
              },
              { command: 'camera', parameters: ['17', '4'] },
              { command: 'objective', parameters: ['2'] },
            ],
          },
        ],
      },
    };

    return {
      datFile,
      description: 'A tutorial level with guided objectives and helpful scripts',
    };
  }

  private static generateMiningLevel(config: LevelGeneratorConfig): GeneratedLevel {
    const size = config.size === 'small' ? 25 : config.size === 'medium' ? 40 : 60;
    const tiles: number[][] = [];
    const height: number[][] = [];
    const resources = { crystals: [], ore: [] } as any;

    // Initialize arrays
    for (let i = 0; i < size; i++) {
      tiles[i] = new Array(size).fill(40); // Start with all walls
      height[i] = new Array(size).fill(0);
      resources.crystals[i] = new Array(size).fill(0);
      resources.ore[i] = new Array(size).fill(0);
    }

    // Create mining caverns
    const caverns = config.difficulty === 'easy' ? 3 : config.difficulty === 'medium' ? 5 : 7;
    const resourceMultiplier =
      config.difficulty === 'easy' ? 1.5 : config.difficulty === 'medium' ? 1.0 : 0.7;

    for (let c = 0; c < caverns; c++) {
      const cx = Math.floor(Math.random() * (size - 10)) + 5;
      const cy = Math.floor(Math.random() * (size - 10)) + 5;
      const radius = Math.floor(Math.random() * 3) + 3;

      // Create cavern
      for (let y = cy - radius; y <= cy + radius; y++) {
        for (let x = cx - radius; x <= cx + radius; x++) {
          if (x > 0 && x < size - 1 && y > 0 && y < size - 1) {
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            if (dist <= radius) {
              tiles[y][x] = 1;
              height[y][x] = Math.floor(Math.random() * 20);
            }
          }
        }
      }

      // Add resources around cavern edges
      for (let y = cy - radius - 1; y <= cy + radius + 1; y++) {
        for (let x = cx - radius - 1; x <= cx + radius + 1; x++) {
          if (x > 0 && x < size - 1 && y > 0 && y < size - 1) {
            if (tiles[y][x] === 40 && Math.random() < 0.3 * resourceMultiplier) {
              if (Math.random() < 0.5) {
                tiles[y][x] = 26 + Math.floor(Math.random() * 4); // Crystal variants
                resources.crystals[y][x] = 1;
              } else {
                tiles[y][x] = 34 + Math.floor(Math.random() * 4); // Ore variants
                resources.ore[y][x] = 1;
              }
            }
          }
        }
      }
    }

    // Connect caverns with tunnels
    for (let i = 0; i < caverns - 1; i++) {
      const startX = Math.floor(Math.random() * (size - 2)) + 1;
      const startY = Math.floor(Math.random() * (size - 2)) + 1;
      const endX = Math.floor(Math.random() * (size - 2)) + 1;
      const endY = Math.floor(Math.random() * (size - 2)) + 1;

      // Simple tunnel algorithm
      let x = startX;
      let y = startY;
      while (x !== endX || y !== endY) {
        tiles[y][x] = 1;
        if (x < endX) x++;
        else if (x > endX) x--;
        if (y < endY) y++;
        else if (y > endY) y--;
      }
    }

    // Ensure starting area
    for (let y = 1; y <= 5; y++) {
      for (let x = 1; x <= 5; x++) {
        tiles[y][x] = 101;
        height[y][x] = 0;
      }
    }

    const totalCrystals =
      config.difficulty === 'easy' ? 100 : config.difficulty === 'medium' ? 150 : 200;
    const totalOre = config.difficulty === 'easy' ? 80 : config.difficulty === 'medium' ? 120 : 160;

    const datFile: Partial<DatFile> = {
      info: {
        rowcount: size,
        colcount: size,
        biome: config.biome,
        creator: 'Level Generator',
        version: '1.0',
        levelname: config.name,
        briefing: `Mining Challenge!\n\nCollect ${totalCrystals} crystals and ${totalOre} ore from the caverns.\n\nDifficulty: ${config.difficulty}`,
        briefingsuccess: 'Outstanding mining operation! All resources collected.',
        briefingfailure: 'Mining operation failed. Try a different approach.',
        oxygen: config.difficulty === 'easy' ? 800 : config.difficulty === 'medium' ? 600 : 400,
        initialcrystals: 10,
        initialore: 10,
        spiderrate: config.difficulty === 'easy' ? 5 : config.difficulty === 'medium' ? 15 : 25,
      } as InfoSection,
      tiles,
      height,
      resources,
      objectives: [{ type: 'resources', crystals: totalCrystals, ore: totalOre, studs: 0 }],
      buildings: [
        {
          type: 'BuildingToolStore_C',
          coordinates: {
            translation: { x: 450, y: 450, z: 0 },
            rotation: { p: 0, y: 0, r: 0 },
            scale: { x: 1, y: 1, z: 1 },
          },
          properties: {
            ID: 'ToolStore1',
            Teleport: 2,
          },
        },
      ],
    };

    return {
      datFile,
      description: 'A mining-focused level with resource collection objectives',
    };
  }

  private static generateCombatLevel(config: LevelGeneratorConfig): GeneratedLevel {
    const size = config.size === 'small' ? 25 : config.size === 'medium' ? 40 : 60;
    const tiles: number[][] = [];
    const height: number[][] = [];

    // Initialize arrays
    for (let i = 0; i < size; i++) {
      tiles[i] = new Array(size).fill(1);
      height[i] = new Array(size).fill(0);
    }

    // Create defensive positions
    const center = Math.floor(size / 2);

    // Central fortress
    for (let y = center - 5; y <= center + 5; y++) {
      for (let x = center - 5; x <= center + 5; x++) {
        if (y === center - 5 || y === center + 5 || x === center - 5 || x === center + 5) {
          tiles[y][x] = config.difficulty === 'hard' ? 90 : 40; // Reinforced walls for hard
          height[y][x] = 20;
        } else {
          tiles[y][x] = 101;
          height[y][x] = 10;
        }
      }
    }

    // Create defensive corridors
    const directions = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ];
    for (const [dx, dy] of directions) {
      for (let i = 1; i <= 8; i++) {
        const x = center + dx * (5 + i);
        const y = center + dy * (5 + i);
        if (x > 0 && x < size - 1 && y > 0 && y < size - 1) {
          tiles[y][x] = 1;
          if (x - 1 >= 0) tiles[y][x - 1] = 40;
          if (x + 1 < size) tiles[y][x + 1] = 40;
          if (y - 1 >= 0) tiles[y - 1][x] = 40;
          if (y + 1 < size) tiles[y + 1][x] = 40;
        }
      }
    }

    // Add electric fences for defense
    if (config.difficulty !== 'easy') {
      for (let i = 0; i < 4; i++) {
        const fx = center + directions[i][0] * 10;
        const fy = center + directions[i][1] * 10;
        if (fx > 0 && fx < size - 1 && fy > 0 && fy < size - 1) {
          tiles[fy][fx] = 12; // Electric fence
        }
      }
    }

    // Add some recharge seams
    tiles[center - 3][center] = 50;
    tiles[center + 3][center] = 50;
    tiles[center][center - 3] = 50;
    tiles[center][center + 3] = 50;

    const waves = config.difficulty === 'easy' ? 3 : config.difficulty === 'medium' ? 5 : 7;
    const spiderCount = config.difficulty === 'easy' ? 5 : config.difficulty === 'medium' ? 10 : 15;

    const datFile: Partial<DatFile> = {
      info: {
        rowcount: size,
        colcount: size,
        biome: config.biome,
        creator: 'Level Generator',
        version: '1.0',
        levelname: config.name,
        briefing: `Defend your base!\n\nSurvive ${waves} waves of monster attacks.\n\nBuild defenses and prepare for combat!`,
        briefingsuccess: 'Victory! All monster waves defeated.',
        briefingfailure: 'Base overrun! Strengthen your defenses.',
        oxygen: 1000,
        initialcrystals: 50,
        initialore: 30,
        spiderrate: 0, // Controlled by script
      } as InfoSection,
      tiles,
      height,
      objectives: [
        {
          type: 'variable',
          condition: `wavesCompleted >= ${waves}`,
          description: `Survive ${waves} waves`,
        },
        { type: 'building', building: BuildingType.ToolStore },
      ],
      buildings: [
        {
          type: 'BuildingToolStore_C',
          coordinates: {
            translation: { x: center * 150, y: center * 150, z: 0 },
            rotation: { p: 0, y: 0, r: 0 },
            scale: { x: 1, y: 1, z: 1 },
          },
          properties: {
            ID: 'ToolStore1',
            Teleport: 2,
            Essential: true,
          },
        },
      ],
      script: {
        variables: new Map([
          ['currentWave', '0'],
          ['wavesCompleted', '0'],
          ['waveTimer', '120,100,140,NextWave'],
        ]),
        events: [
          {
            name: 'start',
            condition: '',
            commands: [
              {
                command: 'msg',
                parameters: ['Prepare your defenses! First wave incoming in 2 minutes!'],
              },
              { command: 'starttimer', parameters: ['waveTimer'] },
            ],
          },
          {
            name: 'NextWave',
            condition: '',
            commands: [
              { command: 'msg', parameters: [`Wave ${waves} incoming!`] },
              { command: 'shake', parameters: ['3'] },
              { command: 'playsound', parameters: ['alarm'] },
              ...Array(spiderCount)
                .fill(null)
                .map(() => ({
                  command: 'spawn',
                  parameters: [
                    'Creature_SmallSpider_C',
                    String(Math.floor(Math.random() * size)),
                    String(Math.floor(Math.random() * size)),
                  ],
                })),
            ],
          },
          {
            name: 'WaveComplete',
            condition: 'monsters == 0 && currentWave > 0',
            commands: [
              { command: 'msg', parameters: ['Wave completed! Prepare for the next one.'] },
              { command: 'wavesCompleted', parameters: ['wavesCompleted + 1'] },
              { command: 'starttimer', parameters: ['waveTimer'] },
            ],
          },
          {
            name: 'Victory',
            condition: `wavesCompleted >= ${waves}`,
            commands: [
              { command: 'msg', parameters: ['All waves defeated! Victory is yours!'] },
              { command: 'win', parameters: ['Mission accomplished!'] },
            ],
          },
        ],
      },
    };

    return {
      datFile,
      description: 'A combat-focused level with wave-based monster attacks',
    };
  }

  private static generateSurvivalLevel(config: LevelGeneratorConfig): GeneratedLevel {
    const size = config.size === 'small' ? 25 : config.size === 'medium' ? 40 : 60;
    const tiles: number[][] = [];
    const height: number[][] = [];
    const resources = { crystals: [], ore: [] } as any;

    // Initialize arrays
    for (let i = 0; i < size; i++) {
      tiles[i] = new Array(size).fill(40);
      height[i] = new Array(size).fill(0);
      resources.crystals[i] = new Array(size).fill(0);
      resources.ore[i] = new Array(size).fill(0);
    }

    // Create sparse caverns with limited resources
    const caverns = config.difficulty === 'easy' ? 5 : config.difficulty === 'medium' ? 3 : 2;
    const oxygenTime =
      config.difficulty === 'easy' ? 600 : config.difficulty === 'medium' ? 450 : 300;

    // Starting cavern
    for (let y = 2; y <= 6; y++) {
      for (let x = 2; x <= 6; x++) {
        tiles[y][x] = 101;
      }
    }

    // Scattered small caverns
    for (let c = 0; c < caverns; c++) {
      const cx = Math.floor(Math.random() * (size - 10)) + 5;
      const cy = Math.floor(Math.random() * (size - 10)) + 5;

      for (let y = cy - 1; y <= cy + 1; y++) {
        for (let x = cx - 1; x <= cx + 1; x++) {
          if (x > 0 && x < size - 1 && y > 0 && y < size - 1) {
            tiles[y][x] = 1;

            // Very limited resources
            if (Math.random() < 0.1) {
              tiles[y][x] = Math.random() < 0.5 ? 26 : 34;
              if (tiles[y][x] === 26) {
                resources.crystals[y][x] = 1;
              } else {
                resources.ore[y][x] = 1;
              }
            }
          }
        }
      }
    }

    // Add hazards
    if (config.difficulty !== 'easy') {
      const hazardCount = config.difficulty === 'medium' ? 3 : 5;
      for (let h = 0; h < hazardCount; h++) {
        const hx = Math.floor(Math.random() * (size - 4)) + 2;
        const hy = Math.floor(Math.random() * (size - 4)) + 2;
        tiles[hy][hx] = config.biome === 'lava' ? 6 : 11; // Lava or water
      }
    }

    const datFile: Partial<DatFile> = {
      info: {
        rowcount: size,
        colcount: size,
        biome: config.biome,
        creator: 'Level Generator',
        version: '1.0',
        levelname: config.name,
        briefing: `Survival Challenge!\n\nOxygen is limited to ${oxygenTime} seconds.\nResources are scarce.\nFind a way to survive and escape!`,
        briefingsuccess: 'Against all odds, you survived!',
        briefingfailure: 'The cavern claims another victim...',
        oxygen: oxygenTime,
        initialcrystals: 5,
        initialore: 5,
        erosioninitialwaittime: config.difficulty === 'hard' ? 60 : 120,
        erosionscale: config.difficulty === 'hard' ? 2.0 : 1.0,
      } as InfoSection,
      tiles,
      height,
      resources,
      objectives: [
        { type: 'building', building: BuildingType.ToolStore },
        { type: 'variable', condition: 'oxygen > 0', description: 'Survive until rescue' },
        { type: 'resources', crystals: 25, ore: 25, studs: 0 },
      ],
      buildings: [
        {
          type: 'BuildingToolStore_C',
          coordinates: {
            translation: { x: 600, y: 600, z: 0 },
            rotation: { p: 0, y: 0, r: 0 },
            scale: { x: 1, y: 1, z: 1 },
          },
          properties: {
            ID: 'ToolStore1',
            Teleport: 1,
            Essential: true,
          },
        },
      ],
      script: {
        variables: new Map([
          ['warningGiven', 'false'],
          ['criticalWarning', 'false'],
        ]),
        events: [
          {
            name: 'start',
            condition: '',
            commands: [
              {
                command: 'msg',
                parameters: [`WARNING: Oxygen supply limited to ${oxygenTime} seconds!`],
              },
              { command: 'wait', parameters: ['3'] },
              { command: 'msg', parameters: ['Find resources quickly or perish!'] },
            ],
          },
          {
            name: 'OxygenWarning',
            condition: 'oxygen < 120 && warningGiven == false',
            commands: [
              { command: 'msg', parameters: ['CAUTION: Oxygen levels critical!'] },
              { command: 'shake', parameters: ['2'] },
              { command: 'playsound', parameters: ['warning'] },
              { command: 'warningGiven', parameters: ['true'] },
            ],
          },
          {
            name: 'OxygenCritical',
            condition: 'oxygen < 30 && criticalWarning == false',
            commands: [
              { command: 'msg', parameters: ['EMERGENCY: 30 seconds of oxygen remaining!'] },
              { command: 'shake', parameters: ['5'] },
              { command: 'playsound', parameters: ['alarm'] },
              { command: 'criticalWarning', parameters: ['true'] },
            ],
          },
          {
            name: 'ResourceBonus',
            condition: 'crystals >= 15 && ore >= 15',
            commands: [
              { command: 'msg', parameters: ['Good progress! Keep collecting!'] },
              { command: 'oxygen', parameters: ['oxygen + 60'] },
              { command: 'msg', parameters: ['Bonus oxygen awarded!'] },
            ],
          },
        ],
      },
    };

    return {
      datFile,
      description: 'A survival level with limited oxygen and scarce resources',
    };
  }

  private static generatePuzzleLevel(config: LevelGeneratorConfig): GeneratedLevel {
    const size = config.size === 'small' ? 25 : config.size === 'medium' ? 40 : 60;
    const tiles: number[][] = [];
    const height: number[][] = [];

    // Initialize arrays
    for (let i = 0; i < size; i++) {
      tiles[i] = new Array(size).fill(38); // Solid rock
      height[i] = new Array(size).fill(0);
    }

    // Create puzzle chambers
    const chambers = [
      { x: 5, y: 5, w: 5, h: 5 },
      { x: 15, y: 5, w: 5, h: 5 },
      { x: 5, y: 15, w: 5, h: 5 },
      { x: 15, y: 15, w: 5, h: 5 },
    ];

    // Create chambers
    for (const chamber of chambers) {
      for (let y = chamber.y; y < chamber.y + chamber.h; y++) {
        for (let x = chamber.x; x < chamber.x + chamber.w; x++) {
          if (x < size && y < size) {
            tiles[y][x] = 1;
            height[y][x] = Math.floor(Math.random() * 10);
          }
        }
      }
    }

    // Create connecting paths (puzzle element)
    // Path 1-2 (horizontal)
    for (let x = 10; x < 15; x++) {
      tiles[7][x] = 40; // Drillable wall
      tiles[8][x] = 40;
    }

    // Path 2-4 (vertical)
    for (let y = 10; y < 15; y++) {
      tiles[y][17] = 40;
      tiles[y][18] = 40;
    }

    // Path 3-4 (horizontal)
    for (let x = 10; x < 15; x++) {
      tiles[17][x] = 40;
      tiles[18][x] = 40;
    }

    // Path 1-3 (vertical)
    for (let y = 10; y < 15; y++) {
      tiles[y][7] = 40;
      tiles[y][8] = 40;
    }

    // Add puzzle elements
    tiles[7][7] = 50; // Recharge seam in chamber 1
    tiles[17][17] = 46; // Ore seam in chamber 4
    tiles[7][17] = 12; // Electric fence blocking chamber 2
    tiles[17][7] = 11; // Water hazard in chamber 3

    // Hidden chamber with objective
    for (let y = 11; y <= 13; y++) {
      for (let x = 11; x <= 13; x++) {
        tiles[y][x] = 88; // Solid rock (reinforced)
      }
    }
    tiles[12][12] = 163; // Special tile for discovery

    const datFile: Partial<DatFile> = {
      info: {
        rowcount: size,
        colcount: size,
        biome: config.biome,
        creator: 'Level Generator',
        version: '1.0',
        levelname: config.name,
        briefing:
          'Puzzle Challenge!\n\nNavigate through the chambers and discover the secret.\n\nThink before you drill!',
        briefingsuccess: 'Brilliant! You solved the puzzle!',
        briefingfailure: 'The puzzle remains unsolved. Try a different approach.',
        oxygen: 1000,
        initialcrystals: 20,
        initialore: 10,
      } as InfoSection,
      tiles,
      height,
      objectives: [
        { type: 'discovertile', x: 12, y: 12, description: 'Discover the hidden chamber' },
        {
          type: 'variable',
          condition: 'chambersVisited >= 4',
          description: 'Visit all four chambers',
        },
      ],
      buildings: [
        {
          type: 'BuildingToolStore_C',
          coordinates: {
            translation: { x: 1050, y: 1050, z: 0 },
            rotation: { p: 0, y: 0, r: 0 },
            scale: { x: 1, y: 1, z: 1 },
          },
          properties: {
            ID: 'ToolStore1',
            Teleport: 1,
          },
        },
      ],
      script: {
        variables: new Map([
          ['chamber1', 'false'],
          ['chamber2', 'false'],
          ['chamber3', 'false'],
          ['chamber4', 'false'],
          ['chambersVisited', '0'],
          ['hintsGiven', '0'],
        ]),
        events: [
          {
            name: 'start',
            condition: '',
            commands: [
              {
                command: 'msg',
                parameters: ['Four chambers, one secret. Choose your path wisely.'],
              },
              { command: 'camera', parameters: ['12', '12'] },
              { command: 'wait', parameters: ['2'] },
              { command: 'camera', parameters: ['7', '7'] },
            ],
          },
          {
            name: 'Chamber1Enter',
            condition: 'chamber1 == false',
            commands: [
              {
                command: 'msg',
                parameters: ['Chamber 1: The power source. This might be useful later.'],
              },
              { command: 'chamber1', parameters: ['true'] },
              { command: 'chambersVisited', parameters: ['chambersVisited + 1'] },
            ],
          },
          {
            name: 'HintTrigger',
            condition: 'chambersVisited >= 2 && hintsGiven == 0',
            commands: [
              {
                command: 'msg',
                parameters: ['Hint: The center holds the secret, but solid rock blocks the way.'],
              },
              { command: 'hintsGiven', parameters: ['1'] },
            ],
          },
          {
            name: 'AllChambersVisited',
            condition: 'chambersVisited >= 4',
            commands: [
              {
                command: 'msg',
                parameters: ['All chambers visited! The center can now be accessed.'],
              },
              { command: 'drill', parameters: ['11', '12'] },
              { command: 'drill', parameters: ['13', '12'] },
              { command: 'drill', parameters: ['12', '11'] },
              { command: 'drill', parameters: ['12', '13'] },
            ],
          },
        ],
      },
    };

    return {
      datFile,
      description: 'A puzzle level requiring strategic thinking and exploration',
    };
  }

  private static formatDatFile(datFile: Partial<DatFile>, config: LevelGeneratorConfig): string {
    let output = '';

    // Comments section
    output += 'comments {\n';
    output += `  Generated ${config.category} level\n`;
    output += `  Name: ${config.name}\n`;
    output += `  Difficulty: ${config.difficulty}\n`;
    output += `  Size: ${config.size}\n`;
    output += `  Biome: ${config.biome}\n`;
    output += `  Created: ${new Date().toISOString()}\n`;
    output += '}\n\n';

    // Info section
    if (datFile.info) {
      output += 'info {\n';
      const info = datFile.info as any;
      for (const [key, value] of Object.entries(info)) {
        if (value !== undefined && value !== null) {
          output += `  ${key}: ${value}\n`;
        }
      }
      output += '}\n\n';
    }

    // Tiles section
    if (datFile.tiles) {
      output += 'tiles {\n';
      for (const row of datFile.tiles) {
        output += '  ' + row.join(',') + ',\n';
      }
      output = output.slice(0, -2) + '\n'; // Remove last comma
      output += '}\n\n';
    }

    // Height section
    if (datFile.height) {
      output += 'height {\n';
      for (const row of datFile.height) {
        output += '  ' + row.join(',') + ',\n';
      }
      output = output.slice(0, -2) + '\n'; // Remove last comma
      output += '}\n\n';
    }

    // Resources section
    if (datFile.resources) {
      output += 'resources {\n';
      if (datFile.resources.crystals) {
        output += '  crystals:\n';
        for (const row of datFile.resources.crystals) {
          output += '  ' + row.join(',') + ',\n';
        }
        output = output.slice(0, -2) + '\n'; // Remove last comma
      }
      if (datFile.resources.ore) {
        output += '  ore:\n';
        for (const row of datFile.resources.ore) {
          output += '  ' + row.join(',') + ',\n';
        }
        output = output.slice(0, -2) + '\n'; // Remove last comma
      }
      output += '}\n\n';
    }

    // Objectives section
    if (datFile.objectives && datFile.objectives.length > 0) {
      output += 'objectives {\n';
      for (const obj of datFile.objectives) {
        switch (obj.type) {
          case 'resources':
            output += `  resources: ${obj.crystals}, ${obj.ore}, ${obj.studs} / Collect resources\n`;
            break;
          case 'building':
            output += `  building: ${obj.building}\n`;
            break;
          case 'discovertile':
            output += `  discovertile: ${obj.x}, ${obj.y} / ${obj.description || 'Discover location'}\n`;
            break;
          case 'variable':
            output += `  variable: ${obj.condition} / ${obj.description || 'Complete objective'}\n`;
            break;
        }
      }
      output += '}\n\n';
    }

    // Buildings section
    if (datFile.buildings && datFile.buildings.length > 0) {
      output += 'buildings {\n';
      for (const building of datFile.buildings) {
        output += `  ${building.type}`;
        output += ` Translation: X=${building.coordinates.translation.x} Y=${building.coordinates.translation.y} Z=${building.coordinates.translation.z}`;
        if (building.properties) {
          for (const [key, value] of Object.entries(building.properties)) {
            output += `, ${key}=${value}`;
          }
        }
        output += '\n';
      }
      output += '}\n\n';
    }

    // Script section
    if (datFile.script) {
      output += 'script {\n';

      // Variables
      if (datFile.script.variables.size > 0) {
        for (const [name, value] of datFile.script.variables) {
          output += `  string ${name} = ${value}\n`;
        }
        output += '\n';
      }

      // Events
      for (const event of datFile.script.events) {
        if (event.condition) {
          output += `  ((${event.condition})) ${event.name} ;\n`;
        } else {
          output += `  ${event.name} :: ;\n`;
        }
        for (const cmd of event.commands) {
          output += `    ${cmd.command}: ${cmd.parameters.join(', ')};\n`;
        }
        output += '\n';
      }

      output += '}\n';
    }

    return output;
  }
}

export function registerLevelGeneratorCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.generateLevel', async () => {
      const generatedContent = await LevelGeneratorProvider.generateLevel();

      if (generatedContent) {
        // Create a new untitled document with the generated content
        const doc = await vscode.workspace.openTextDocument({
          content: generatedContent,
          language: 'manicminers',
        });

        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage('Level generated successfully!');
      }
    })
  );
}
