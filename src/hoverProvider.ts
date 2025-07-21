import * as vscode from 'vscode';
import { DatFileParser } from './parser/datFileParser';
import { getTileInfo } from './data/tileDefinitions';
import {
  getEnhancedTileInfo,
  getTileColor,
  isReinforcedTile,
  getBaseTileId,
} from './data/enhancedTileDefinitions';
import { getExtendedTileInfo } from './data/extendedTileDefinitions';
import {
  getAdvancedTileInfo,
  getHardnessName,
  getDrillTimeEstimate,
  getTileResourceYield,
} from './data/advancedTileDefinitions';
import { BuildingType, VehicleType, CreatureType, BiomeType } from './types/datFileTypes';

// Section descriptions
const sectionDescriptions: Map<string, string> = new Map([
  [
    'comments',
    'Optional section containing comments about the level. These are ignored by the game.',
  ],
  [
    'info',
    'Required section containing level metadata like dimensions, biome, creator, and game settings.',
  ],
  ['tiles', 'Required section defining the tile layout of the level as a 2D grid of tile IDs.'],
  [
    'height',
    'Required section defining the height map of the level as a 2D grid of height values.',
  ],
  [
    'resources',
    'Optional section defining placement of crystals and ore deposits as binary grids (0/1).',
  ],
  ['objectives', 'Optional section defining the win conditions for the level.'],
  [
    'buildings',
    'Optional section defining pre-placed buildings with their positions and properties.',
  ],
  [
    'vehicles',
    'Optional section defining pre-placed vehicles with their positions and properties.',
  ],
  [
    'creatures',
    'Optional section defining creatures (enemies) with their positions and properties.',
  ],
  [
    'miners',
    'Optional section defining pre-placed Rock Raiders with their positions and properties.',
  ],
  ['blocks', 'Optional section defining blocked tiles as a binary grid (0=open, 1=blocked).'],
  ['script', 'Optional section containing the level script with events, conditions, and commands.'],
  ['briefing', 'Optional section containing the mission briefing text shown at level start.'],
  [
    'briefingsuccess',
    'Optional section containing the success message shown when objectives are completed.',
  ],
  [
    'briefingfailure',
    'Optional section containing the failure message shown when the mission fails.',
  ],
  ['landslidefrequency', 'Optional section defining landslide probability for each tile (0-100).'],
  ['lavaspread', 'Optional section defining lava spread behavior as a 2D grid.'],
]);

// Info field descriptions with constraints
const infoFieldDescriptions: Map<string, { detail: string; constraints?: string }> = new Map([
  [
    'rowcount',
    {
      detail: 'Number of rows in the level grid.',
      constraints: 'Required. Must be positive integer, typically 10-200.',
    },
  ],
  [
    'colcount',
    {
      detail: 'Number of columns in the level grid.',
      constraints: 'Required. Must be positive integer, typically 10-200.',
    },
  ],
  [
    'levelname',
    {
      detail: 'Display name for the level shown in game menus.',
      constraints: 'Optional. Any text string.',
    },
  ],
  [
    'creator',
    {
      detail: 'Name of the level creator.',
      constraints: 'Optional. Any text string.',
    },
  ],
  [
    'biome',
    {
      detail: 'Level biome determining visual theme and some gameplay elements.',
      constraints: 'Optional. Values: rock, ice, or lava',
    },
  ],
  [
    'version',
    {
      detail: 'Version identifier for the level.',
      constraints: 'Optional. Any text string.',
    },
  ],
  [
    'camerapos',
    {
      detail: 'Initial camera position and orientation when level starts.',
      constraints:
        'Optional. Format: Translation: X=0.000 Y=0.000 Z=0.000 Rotation: P=0.000000 Y=0.000000 R=0.000000 Scale X=1.000 Y=1.000 Z=1.000',
    },
  ],
  [
    'camerazoom',
    {
      detail: 'Initial camera zoom level.',
      constraints: 'Optional. Float value, typically 0.5-2.0',
    },
  ],
  [
    'opencaves',
    {
      detail: 'Initially open cave connections between tiles.',
      constraints: 'Optional. Format: "x1,y1/x2,y2/..." where each pair is a connected cave.',
    },
  ],
  [
    'oxygen',
    {
      detail: 'Oxygen/time limit for the mission in game time units.',
      constraints: 'Optional. Float value, 0 = no limit',
    },
  ],
  [
    'initialcrystals',
    {
      detail: 'Number of energy crystals available at level start.',
      constraints: 'Optional. Non-negative integer.',
    },
  ],
  [
    'initialore',
    {
      detail: 'Amount of ore available at level start.',
      constraints: 'Optional. Non-negative integer.',
    },
  ],
  [
    'spiderrate',
    {
      detail: 'Percentage chance of spiders spawning from walls.',
      constraints: 'Optional. Integer 0-100.',
    },
  ],
  [
    'spidermin',
    {
      detail: 'Minimum number of spiders that can spawn at once.',
      constraints: 'Optional. Non-negative integer.',
    },
  ],
  [
    'spidermax',
    {
      detail: 'Maximum number of spiders that can spawn at once.',
      constraints: 'Optional. Non-negative integer, must be >= spidermin.',
    },
  ],
  [
    'erosioninitialwaittime',
    {
      detail: 'Time in seconds before erosion begins affecting the level.',
      constraints: 'Optional. Float value.',
    },
  ],
  [
    'erosionscale',
    {
      detail: 'Multiplier for erosion speed/intensity.',
      constraints: 'Optional. Float value, typically 0.0-2.0',
    },
  ],
]);

// Script command descriptions
const scriptCommandDescriptions: Map<string, { syntax: string; description: string }> = new Map([
  [
    'msg',
    {
      syntax: 'msg:duration:message text',
      description: 'Display a message to the player for the specified duration.',
    },
  ],
  [
    'pan',
    {
      syntax: 'pan:x,y',
      description: 'Pan the camera to the specified grid coordinates.',
    },
  ],
  [
    'wait',
    {
      syntax: 'wait:seconds',
      description: 'Wait for the specified number of seconds before continuing.',
    },
  ],
  [
    'truewait',
    {
      syntax: 'truewait:seconds',
      description: 'Wait that blocks all other script execution.',
    },
  ],
  [
    'shake',
    {
      syntax: 'shake:intensity',
      description: 'Shake the screen with the specified intensity.',
    },
  ],
  [
    'drill',
    {
      syntax: 'drill:x,y,tileID',
      description: 'Drill the wall at coordinates to reveal the specified tile type.',
    },
  ],
  [
    'place',
    {
      syntax: 'place:x,y,tileID',
      description: 'Place a tile of the specified type at the coordinates.',
    },
  ],
  [
    'emerge',
    {
      syntax: 'emerge:CreatureType:x,y',
      description: 'Make a creature emerge from the ground at the specified location.',
    },
  ],
  [
    'sound',
    {
      syntax: 'sound:soundfile',
      description: 'Play the specified sound file.',
    },
  ],
  [
    'enable',
    {
      syntax: 'enable:entityID',
      description: 'Enable a disabled building or entity.',
    },
  ],
  [
    'disable',
    {
      syntax: 'disable:entityID',
      description: 'Disable a building or entity.',
    },
  ],
  [
    'wake',
    {
      syntax: 'wake:creatureID',
      description: 'Wake a sleeping creature to make it active.',
    },
  ],
  [
    'stoptimer',
    {
      syntax: 'stoptimer',
      description: 'Stop the mission timer.',
    },
  ],
]);

// Vehicle upgrade descriptions
const vehicleUpgradeDescriptions: Map<string, string> = new Map([
  ['UpEngine', 'Engine upgrade - Increases vehicle speed and acceleration'],
  ['UpDrill', 'Drill upgrade - Allows drilling harder rock types faster'],
  ['UpAddDrill', 'Additional drill - Adds a second drill for faster drilling'],
  ['UpLaser', 'Laser upgrade - Adds a powerful laser for combat and drilling'],
  ['UpScanner', 'Scanner upgrade - Reveals hidden walls and resources'],
  ['UpCargoHold', 'Cargo hold upgrade - Increases carrying capacity'],
  ['UpAddNav', 'Additional navigation - Improves pathfinding and allows water travel'],
]);

// Miner equipment descriptions
const minerEquipmentDescriptions: Map<string, string> = new Map([
  ['Drill', 'Handheld drill for breaking through walls'],
  ['Shovel', 'Shovel for clearing rubble and digging'],
  ['Hammer', 'Hammer for construction and repairs'],
  ['Sandwich', 'Food item that restores miner health'],
  ['Spanner', 'Wrench for vehicle and building repairs'],
  ['Dynamite', 'Explosives for clearing large areas'],
]);

// Miner job descriptions
const minerJobDescriptions: Map<string, string> = new Map([
  ['JobDriver', 'Vehicle operator - Can drive all vehicle types'],
  ['JobSailor', 'Sailor - Can operate water vehicles'],
  ['JobPilot', 'Pilot - Can operate flying vehicles'],
  ['JobGeologist', 'Geologist - Can analyze and find resources'],
  ['JobEngineer', 'Engineer - Faster at building and repairs'],
  ['JobExplosivesExpert', 'Explosives expert - Can use dynamite safely'],
]);

// Objective type descriptions
const objectiveDescriptions: Map<string, string> = new Map([
  [
    'resources',
    'Collect the specified amounts of crystals, ore, and studs. Format: resources:crystals,ore,studs',
  ],
  ['building', 'Construct the specified building type. Format: building:BuildingType_C'],
  [
    'discovertile',
    'Discover (walk on or drill to) a specific location. Format: discovertile:x,y/description',
  ],
  [
    'variable',
    'Complete when a script variable condition is met. Format: variable:condition/description',
  ],
  ['findminer', 'Find and rescue a lost Rock Raider. Format: findminer:minerID'],
]);

export class DatHoverProvider implements vscode.HoverProvider {
  private extensionPath: string;

  constructor(extensionPath: string) {
    this.extensionPath = extensionPath;
  }

  private getTileImagePath(tileId: number): vscode.Uri | undefined {
    const baseTileId = isReinforcedTile(tileId) ? getBaseTileId(tileId) : tileId;

    // Map tile IDs to image files
    if ((baseTileId >= 42 && baseTileId <= 45) || (baseTileId >= 92 && baseTileId <= 95)) {
      // Crystal seam tiles
      return vscode.Uri.file(
        vscode.Uri.joinPath(
          vscode.Uri.file(this.extensionPath),
          'images',
          'resources',
          'crystal_energy.png'
        ).fsPath
      );
    } else if ((baseTileId >= 46 && baseTileId <= 49) || (baseTileId >= 96 && baseTileId <= 99)) {
      // Ore seam tiles
      return vscode.Uri.file(
        vscode.Uri.joinPath(
          vscode.Uri.file(this.extensionPath),
          'images',
          'resources',
          'ore_resource.png'
        ).fsPath
      );
    } else if ((baseTileId >= 50 && baseTileId <= 53) || (baseTileId >= 100 && baseTileId <= 103)) {
      // Recharge seam tiles - for now use energy crystal as placeholder
      return vscode.Uri.file(
        vscode.Uri.joinPath(
          vscode.Uri.file(this.extensionPath),
          'images',
          'resources',
          'crystal_energy.png'
        ).fsPath
      );
    }

    return undefined;
  }

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    // Parse the document to understand context
    const parser = new DatFileParser(document.getText());
    const section = parser.getSectionAtPosition(position.line);
    const lineText = document.lineAt(position).text;
    const wordRange = document.getWordRangeAtPosition(position);
    const word = wordRange ? document.getText(wordRange) : '';

    // Check for section names
    if (lineText.match(/^\s*(\w+)\s*\{/)) {
      const sectionMatch = lineText.match(/^\s*(\w+)\s*\{/);
      if (sectionMatch) {
        const sectionName = sectionMatch[1];
        const description = sectionDescriptions.get(sectionName);
        if (description) {
          return new vscode.Hover(
            new vscode.MarkdownString(`**${sectionName} section**\n\n${description}`)
          );
        }
      }
    }

    // Context-specific hover based on section
    if (section) {
      switch (section.name) {
        case 'info':
          return this.getInfoHover(word, lineText, position);
        case 'tiles':
          return this.getTileHover(word, position, document);
        case 'objectives':
          return this.getObjectiveHover(lineText);
        case 'buildings':
        case 'vehicles':
        case 'creatures':
          return this.getEntityHover(word, section.name);
        case 'script':
          return this.getScriptHover(word, lineText);
        case 'resources':
          return this.getResourceHover(word);
        case 'landslidefrequency':
        case 'lavaspread':
          return this.getTimedEventHover(lineText, section.name);
      }
    }

    return undefined;
  }

  private getInfoHover(
    word: string,
    lineText: string,
    position: vscode.Position
  ): vscode.Hover | undefined {
    // Check for field names
    const fieldInfo = infoFieldDescriptions.get(word.toLowerCase());
    if (fieldInfo) {
      const markdown = new vscode.MarkdownString();
      markdown.appendMarkdown(`**${word}**\n\n${fieldInfo.detail}`);
      if (fieldInfo.constraints) {
        markdown.appendMarkdown(`\n\n*${fieldInfo.constraints}*`);
      }
      return new vscode.Hover(markdown);
    }

    // Check for biome values
    if (lineText.includes('biome') && Object.values(BiomeType).includes(word as BiomeType)) {
      const markdown = new vscode.MarkdownString();
      markdown.appendMarkdown(`**${word} biome**\n\n`);
      switch (word) {
        case 'rock':
          markdown.appendMarkdown(
            'Standard rock biome with brown/gray textures. Most common biome type.'
          );
          break;
        case 'ice':
          markdown.appendMarkdown('Ice biome with blue/white textures and slippery surfaces.');
          break;
        case 'lava':
          markdown.appendMarkdown('Lava biome with red/orange textures and lava hazards.');
          break;
      }
      return new vscode.Hover(markdown);
    }

    // Check for coordinate components
    if (
      lineText.includes('Translation') ||
      lineText.includes('Rotation') ||
      lineText.includes('Scale')
    ) {
      const coordMatch = lineText.match(/([XYZPR])\s*=/);
      if (coordMatch && position.character >= lineText.indexOf(coordMatch[0])) {
        const axis = coordMatch[1];
        const markdown = new vscode.MarkdownString();
        switch (axis) {
          case 'X':
            markdown.appendMarkdown(
              '**X axis**\n\nHorizontal position (left/right) in world units.'
            );
            break;
          case 'Y':
            markdown.appendMarkdown('**Y axis**\n\nVertical position (up/down) in world units.');
            break;
          case 'Z':
            markdown.appendMarkdown(
              '**Z axis**\n\nDepth position (forward/backward) in world units.'
            );
            break;
          case 'P':
            markdown.appendMarkdown('**Pitch**\n\nRotation around the X axis in radians.');
            break;
          case 'R':
            markdown.appendMarkdown('**Roll**\n\nRotation around the Z axis in radians.');
            break;
        }
        return new vscode.Hover(markdown);
      }
    }

    return undefined;
  }

  private getTileHover(
    _word: string,
    position: vscode.Position,
    document: vscode.TextDocument
  ): vscode.Hover | undefined {
    // Try to get tile ID at cursor position
    const tileIdMatch = document.lineAt(position).text.match(/\b(\d+)\b/g);
    if (tileIdMatch) {
      // Find which number the cursor is on
      const lineText = document.lineAt(position).text;
      let currentPos = 0;
      for (const match of tileIdMatch) {
        const matchIndex = lineText.indexOf(match, currentPos);
        if (position.character >= matchIndex && position.character <= matchIndex + match.length) {
          const tileId = parseInt(match);
          // Try advanced tile info first for the most comprehensive data
          const advancedInfo = getAdvancedTileInfo(tileId);
          const tileInfo =
            advancedInfo ||
            getEnhancedTileInfo(tileId) ||
            getTileInfo(tileId) ||
            getExtendedTileInfo(tileId);
          if (tileInfo) {
            const markdown = new vscode.MarkdownString();
            markdown.supportHtml = true;
            markdown.isTrusted = true;

            // Add tile image if available
            const tileImage = this.getTileImagePath(tileId);
            if (tileImage) {
              const imageMarkdown = `<img src="${tileImage}" width="48" height="48" alt="${tileInfo.name}" />\n\n`;
              markdown.appendMarkdown(imageMarkdown);
            }

            markdown.appendMarkdown(`**Tile ${tileId}: ${tileInfo.name}**\n\n`);
            markdown.appendMarkdown(`${tileInfo.description}\n\n`);
            markdown.appendMarkdown(`*Category:* ${tileInfo.category}\n\n`);

            // Add advanced metadata if available
            if (advancedInfo) {
              // Hardness information
              markdown.appendMarkdown(
                `**⛏️ Hardness:** ${getHardnessName(advancedInfo.hardness)} (${getDrillTimeEstimate(advancedInfo.hardness)})\n\n`
              );

              // Physical properties
              const properties = [];
              if (advancedInfo.isWall) {
                properties.push('Wall');
              }
              if (advancedInfo.isFloor) {
                properties.push('Floor');
              }
              if (advancedInfo.isFluid) {
                properties.push('Fluid');
              }
              if (properties.length > 0) {
                markdown.appendMarkdown(`**🏗️ Type:** ${properties.join(', ')}\n\n`);
              }

              // Resource yields
              const yields = getTileResourceYield(tileId);
              if (yields.crystals > 0 || yields.ore > 0 || yields.studs > 0) {
                markdown.appendMarkdown(`**💎 Resource Yields:**\n`);
                if (yields.crystals > 0) {
                  markdown.appendMarkdown(`- Crystals: ${yields.crystals}\n`);
                }
                if (yields.ore > 0) {
                  markdown.appendMarkdown(`- Ore: ${yields.ore}\n`);
                }
                if (yields.studs > 0) {
                  markdown.appendMarkdown(`- Studs: ${yields.studs}\n`);
                }
                markdown.appendMarkdown('\n');
              }

              // Special triggers
              if (advancedInfo.trigger) {
                const triggerEmoji = {
                  flood: '💧',
                  waste: '☢️',
                  spawn: '👾',
                  landslide: '🏔️',
                  erosion: '🌋',
                };
                markdown.appendMarkdown(
                  `**${triggerEmoji[advancedInfo.trigger] || '⚠️'} Trigger:** ${advancedInfo.trigger}\n\n`
                );
              }

              // Slope constraints
              if (advancedInfo.maxSlope !== undefined) {
                markdown.appendMarkdown(`**📐 Max Slope:** ${advancedInfo.maxSlope}\n\n`);
              }

              // Landslide warning
              if (advancedInfo.canLandslide) {
                markdown.appendMarkdown(`**⚠️ Warning:** This tile can cause landslides!\n\n`);
              }
            }

            // Add reinforced indicator
            if (isReinforcedTile(tileId)) {
              markdown.appendMarkdown(`⚠️ *Reinforced tile* - Requires more drilling effort\n\n`);
              const baseTileId = getBaseTileId(tileId);
              const baseTile = getEnhancedTileInfo(baseTileId);
              if (baseTile) {
                markdown.appendMarkdown(`*Base tile:* ${baseTile.name} (ID: ${baseTileId})\n\n`);
              }
            }

            // Add color information if available
            const color = getTileColor(tileId);
            if (color) {
              const colorHex = `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`;
              markdown.appendMarkdown(
                `*Color:* <span style="color: ${colorHex}">⬤</span> RGB(${color.r}, ${color.g}, ${color.b})\n\n`
              );
            }

            // Add tile variant information for walls and resources
            if (tileInfo.category === 'wall' || tileInfo.category === 'resource') {
              const tileVariant = tileId % 4;
              const variantNames = ['Regular', 'Corner', 'Edge', 'Intersect'];
              markdown.appendMarkdown(`*Variant:* ${variantNames[tileVariant]}\n\n`);
            }

            // Add special notes for specific tiles
            if (tileId === 38 || tileId === 88) {
              markdown.appendMarkdown(`💎 *Note:* Solid rock is completely impenetrable\n\n`);
            } else if (tileId >= 42 && tileId <= 45) {
              markdown.appendMarkdown(`💎 *Yield:* 1-5 energy crystals\n\n`);
              markdown.appendMarkdown(
                `*Drill time:* ${isReinforcedTile(tileId) ? '6 seconds' : '3 seconds'}\n\n`
              );
            } else if (tileId >= 46 && tileId <= 49) {
              markdown.appendMarkdown(`⛏️ *Yield:* 1-3 ore\n\n`);
              markdown.appendMarkdown(
                `*Drill time:* ${isReinforcedTile(tileId) ? '6 seconds' : '3 seconds'}\n\n`
              );
            } else if (tileId >= 50 && tileId <= 53) {
              markdown.appendMarkdown(`⚡ *Function:* Powers electric fences\n\n`);
              markdown.appendMarkdown(
                `*Drill time:* ${isReinforcedTile(tileId) ? '8 seconds' : '4 seconds'}\n\n`
              );
            } else if (tileInfo.category === 'wall') {
              const drillTime = isReinforcedTile(tileId) ? '4 seconds' : '2 seconds';
              markdown.appendMarkdown(`*Drill time:* ${drillTime}\n\n`);
            } else if (tileId === 11 || tileId === 111) {
              markdown.appendMarkdown(`💧 *Effect:* Slows vehicles without hover upgrade\n\n`);
              markdown.appendMarkdown(`*Sound:* Water splash effect\n\n`);
            } else if (tileId === 6 || tileId === 106) {
              markdown.appendMarkdown(`🔥 *Danger:* Damages vehicles and miners over time\n\n`);
              markdown.appendMarkdown(`*Sound:* Lava bubbling effect\n\n`);
            } else if (tileId === 12 || tileId === 112) {
              markdown.appendMarkdown(`⚡ *Effect:* Stops creatures when powered\n\n`);
              markdown.appendMarkdown(`*Requires:* Connection to recharge seam\n\n`);
            }

            if (tileInfo.canBuild !== undefined) {
              markdown.appendMarkdown(`*Can build:* ${tileInfo.canBuild ? 'Yes' : 'No'}\n\n`);
            }
            if (tileInfo.canWalk !== undefined) {
              markdown.appendMarkdown(`*Can walk:* ${tileInfo.canWalk ? 'Yes' : 'No'}\n\n`);
            }
            if (tileInfo.canDrill !== undefined) {
              markdown.appendMarkdown(`*Can drill:* ${tileInfo.canDrill ? 'Yes' : 'No'}\n\n`);
            }
            if (tileInfo.category === 'hazard') {
              markdown.appendMarkdown(`*Hazard:* Yes\n\n`);
            }
            return new vscode.Hover(markdown);
          } else {
            return new vscode.Hover(
              `**Tile ${tileId}**\n\nUnknown tile ID. May be custom or invalid.`
            );
          }
        }
        currentPos = matchIndex + match.length;
      }
    }
    return undefined;
  }

  private getObjectiveHover(lineText: string): vscode.Hover | undefined {
    // Check for objective types
    for (const [type, description] of objectiveDescriptions) {
      if (lineText.includes(type + ':')) {
        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(`**${type} objective**\n\n${description}`);
        return new vscode.Hover(markdown);
      }
    }
    return undefined;
  }

  private getEntityHover(word: string, sectionName: string): vscode.Hover | undefined {
    let entityMap: { [key: string]: string } = {};
    let entityType = '';

    switch (sectionName) {
      case 'buildings':
        entityMap = BuildingType;
        entityType = 'Building';
        break;
      case 'vehicles':
        entityMap = VehicleType;
        entityType = 'Vehicle';
        break;
      case 'creatures':
        entityMap = CreatureType;
        entityType = 'Creature';
        break;
    }

    // Check if word matches an entity type
    for (const [key, value] of Object.entries(entityMap)) {
      if (value === word) {
        const name = key.replace(/([A-Z])/g, ' $1').trim();
        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(`**${entityType}: ${name}**\n\n`);

        // Add specific descriptions for common entities
        switch (value) {
          case 'BuildingToolStore_C':
            markdown.appendMarkdown(
              'The most important building - headquarters for your Rock Raiders. Required in most levels.\n\n'
            );
            markdown.appendMarkdown('*Power requirement:* Self-powered\n');
            markdown.appendMarkdown('*Function:* Teleport pad, raider spawn point, tool storage');
            break;
          case 'BuildingPowerStation_C':
            markdown.appendMarkdown(
              'Generates power for your base. Each building needs power to function.\n\n'
            );
            markdown.appendMarkdown('*Power output:* Powers adjacent buildings\n');
            markdown.appendMarkdown('*Upgrade benefit:* Increased power range');
            break;
          case 'BuildingOreRefinery_C':
            markdown.appendMarkdown('Processes raw ore into usable building materials.\n\n');
            markdown.appendMarkdown('*Power requirement:* Must be connected to power\n');
            markdown.appendMarkdown('*Processing rate:* 1 ore every 5 seconds');
            break;
          case 'BuildingCanteen_C':
            markdown.appendMarkdown(
              'Feeds your Rock Raiders to keep them working efficiently.\n\n'
            );
            markdown.appendMarkdown('*Power requirement:* Must be connected to power\n');
            markdown.appendMarkdown('*Effect:* Restores raider health and energy');
            break;
          case 'BuildingMiningLaser_C':
            markdown.appendMarkdown('Automated laser that drills walls from a distance.\n\n');
            markdown.appendMarkdown('*Power requirement:* High power consumption\n');
            markdown.appendMarkdown('*Range:* 5 tiles\n');
            markdown.appendMarkdown('*Drill speed:* Faster than vehicles');
            break;
          case 'VehicleSmallDigger_C':
            markdown.appendMarkdown('Small drilling vehicle, fast but limited cargo capacity.\n\n');
            markdown.appendMarkdown('*Cargo:* 2 units\n');
            markdown.appendMarkdown('*Speed:* Fast\n');
            markdown.appendMarkdown('*Upgrades:* Engine, Drill, Scanner');
            break;
          case 'VehicleLargeDigger_C':
            markdown.appendMarkdown('Large drilling vehicle with high cargo capacity.\n\n');
            markdown.appendMarkdown('*Cargo:* 4 units\n');
            markdown.appendMarkdown('*Speed:* Slow\n');
            markdown.appendMarkdown('*Upgrades:* Engine, AddDrill, CargoHold');
            break;
          case 'VehicleHoverScout_C':
            markdown.appendMarkdown('Fast hover vehicle that can travel over water.\n\n');
            markdown.appendMarkdown('*Cargo:* 1 unit\n');
            markdown.appendMarkdown('*Speed:* Very fast\n');
            markdown.appendMarkdown('*Special:* Can cross water tiles');
            break;
          case 'CreatureLavaMonster_C':
            markdown.appendMarkdown('Dangerous lava creature that emerges from lava tiles.\n\n');
            markdown.appendMarkdown('*Health:* High\n');
            markdown.appendMarkdown('*Attack:* Throws fireballs\n');
            markdown.appendMarkdown('*Weakness:* Water and ice');
            break;
          case 'CreatureRockMonster_C':
            markdown.appendMarkdown(
              'Rock creature that can eat energy crystals and throw boulders.\n\n'
            );
            markdown.appendMarkdown('*Health:* Very high\n');
            markdown.appendMarkdown('*Behavior:* Steals crystals\n');
            markdown.appendMarkdown('*Weakness:* Dynamite');
            break;
          case 'CreatureSpider_C':
            markdown.appendMarkdown('Small spider creature that can climb walls.\n\n');
            markdown.appendMarkdown('*Health:* Low\n');
            markdown.appendMarkdown('*Behavior:* Jumps on raiders\n');
            markdown.appendMarkdown('*Spawning:* Emerges from walls');
            break;
        }

        return new vscode.Hover(markdown);
      }
    }

    // Check for vehicle upgrades
    if (sectionName === 'vehicles' && vehicleUpgradeDescriptions.has(word)) {
      const markdown = new vscode.MarkdownString();
      markdown.appendMarkdown(`**Vehicle Upgrade: ${word}**\n\n`);
      markdown.appendMarkdown(vehicleUpgradeDescriptions.get(word) || '');
      return new vscode.Hover(markdown);
    }

    // Check for entity properties
    if (
      word === 'ID' ||
      word === 'driver' ||
      word === 'Level' ||
      word === 'Essential' ||
      word === 'Teleport' ||
      word === 'Sleep' ||
      word === 'Powerpaths' ||
      word === 'Health' ||
      word === 'upgrades' ||
      word === 'HP'
    ) {
      const markdown = new vscode.MarkdownString();
      switch (word) {
        case 'ID':
          markdown.appendMarkdown(
            '**Entity ID**\n\nUnique identifier for this entity instance. Used in scripts to reference this specific entity.'
          );
          break;
        case 'driver':
          markdown.appendMarkdown(
            '**Vehicle Driver**\n\nSpecifies if a vehicle starts with a driver. Values: Pilot_C or none'
          );
          break;
        case 'Level':
          markdown.appendMarkdown(
            '**Entity Level**\n\nUpgrade level of the entity (0-2 for most entities).'
          );
          break;
        case 'Essential':
          markdown.appendMarkdown(
            '**Essential Entity**\n\nIf true, losing this entity fails the mission.'
          );
          break;
        case 'Teleport':
          markdown.appendMarkdown('**Teleport Enabled**\n\nWhether this entity can be teleported.');
          break;
        case 'Sleep':
          markdown.appendMarkdown('**Sleep State**\n\nWhether a creature starts in sleep mode.');
          break;
        case 'Powerpaths':
          markdown.appendMarkdown(
            '**Power Path Connections**\n\nDefines where power cables connect to this building.\n\n'
          );
          markdown.appendMarkdown('*Format:* X=dx Y=dy Z=dz/\n');
          markdown.appendMarkdown('*Example:* X=0 Y=0 Z=1/ (connects on north side)\n');
          markdown.appendMarkdown(
            '*Directions:* X=1 (east), X=-1 (west), Z=1 (north), Z=-1 (south)'
          );
          break;
        case 'Health':
        case 'HP':
          markdown.appendMarkdown(
            '**Health Points**\n\nEntity health. Use MAX for full health or a specific number.'
          );
          break;
        case 'upgrades':
          markdown.appendMarkdown(
            '**Vehicle Upgrades**\n\nList of upgrades applied to this vehicle.\n\n'
          );
          markdown.appendMarkdown('*Format:* UpgradeName1/UpgradeName2/\n');
          markdown.appendMarkdown(
            '*Available:* UpEngine, UpDrill, UpAddDrill, UpLaser, UpScanner, UpCargoHold, UpAddNav'
          );
          break;
      }
      return new vscode.Hover(markdown);
    }

    // Check for miner properties in miners section
    if (sectionName === 'miners') {
      if (minerEquipmentDescriptions.has(word)) {
        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(`**Miner Equipment: ${word}**\n\n`);
        markdown.appendMarkdown(minerEquipmentDescriptions.get(word) || '');
        return new vscode.Hover(markdown);
      }
      if (minerJobDescriptions.has(word)) {
        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(`**Miner Job: ${word}**\n\n`);
        markdown.appendMarkdown(minerJobDescriptions.get(word) || '');
        return new vscode.Hover(markdown);
      }
    }

    return undefined;
  }

  private getScriptHover(word: string, lineText: string): vscode.Hover | undefined {
    // Check for variable types
    if (['int', 'string', 'float', 'bool'].includes(word)) {
      const markdown = new vscode.MarkdownString();
      markdown.appendMarkdown(
        `**${word} type**\n\nDeclare a variable of type ${word}.\n\nExample: ${word} myVar=${word === 'string' ? '"value"' : '0'}`
      );
      return new vscode.Hover(markdown);
    }

    // Check for script commands
    const commandInfo = scriptCommandDescriptions.get(word);
    if (commandInfo) {
      const markdown = new vscode.MarkdownString();
      markdown.appendMarkdown(
        `**${word} command**\n\n${commandInfo.description}\n\n*Syntax:* \`${commandInfo.syntax}\``
      );
      return new vscode.Hover(markdown);
    }

    // Check for event markers
    if (lineText.includes('::')) {
      const eventMatch = lineText.match(/(\w+)\s*::/);
      if (eventMatch && word === eventMatch[1]) {
        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(
          `**${word} event**\n\nScript event marker. Events can be triggered by game conditions or other script commands.`
        );
        return new vscode.Hover(markdown);
      }
    }

    // Check for condition syntax
    if (lineText.includes('((') && lineText.includes('))')) {
      const conditionMatch = lineText.match(/\(\((.+?)\)\)/);
      if (conditionMatch) {
        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(
          '**Conditional Event**\n\nThis event only triggers when the condition is met.\n\n'
        );
        markdown.appendMarkdown(`*Condition:* \`${conditionMatch[1]}\``);
        return new vscode.Hover(markdown);
      }
    }

    return undefined;
  }

  private getResourceHover(word: string): vscode.Hover | undefined {
    if (word === 'crystals' || word === 'ore') {
      const markdown = new vscode.MarkdownString();
      if (word === 'crystals') {
        markdown.appendMarkdown(
          '**Energy Crystals**\n\nDefines placement of energy crystal deposits. Use 1 to place a crystal, 0 for empty.'
        );
      } else {
        markdown.appendMarkdown(
          '**Ore Deposits**\n\nDefines placement of ore deposits. Use 1 to place ore, 0 for empty.'
        );
      }
      return new vscode.Hover(markdown);
    }
    return undefined;
  }

  private getTimedEventHover(lineText: string, sectionName: string): vscode.Hover | undefined {
    // Check for time:coordinates pattern
    const timeMatch = lineText.match(/(\d+)\s*:/);
    if (timeMatch) {
      const markdown = new vscode.MarkdownString();
      const time = parseInt(timeMatch[1]);

      if (sectionName === 'landslidefrequency') {
        markdown.appendMarkdown(`**Landslide Event**\n\n`);
        markdown.appendMarkdown(`*Time:* ${time} seconds after level start\n\n`);
        markdown.appendMarkdown(`*Format:* time:x1,y1/x2,y2/...\n`);
        markdown.appendMarkdown(`*Effect:* Causes landslides at specified coordinates\n`);
        markdown.appendMarkdown(
          `*Example:* 30:10,15/12,15/ (landslides at (10,15) and (12,15) after 30 seconds)`
        );
      } else if (sectionName === 'lavaspread') {
        markdown.appendMarkdown(`**Lava Spread Event**\n\n`);
        markdown.appendMarkdown(`*Time:* ${time} seconds after level start\n\n`);
        markdown.appendMarkdown(`*Format:* time:x1,y1/x2,y2/...\n`);
        markdown.appendMarkdown(`*Effect:* Spreads lava to specified coordinates\n`);
        markdown.appendMarkdown(
          `*Example:* 60:5,5/5,6/5,7/ (lava spreads to these tiles after 60 seconds)`
        );
      }

      return new vscode.Hover(markdown);
    }

    // Hover for section itself
    if (lineText.includes(sectionName)) {
      const markdown = new vscode.MarkdownString();
      if (sectionName === 'landslidefrequency') {
        markdown.appendMarkdown('**Landslide Frequency Section**\n\n');
        markdown.appendMarkdown('Defines timed landslide events that occur during gameplay.\n\n');
        markdown.appendMarkdown('*Format:* Each line contains time:coordinates\n');
        markdown.appendMarkdown('*Time:* Seconds after level start\n');
        markdown.appendMarkdown('*Coordinates:* x,y pairs separated by /');
      } else {
        markdown.appendMarkdown('**Lava Spread Section**\n\n');
        markdown.appendMarkdown('Defines how lava spreads over time in the level.\n\n');
        markdown.appendMarkdown('*Format:* Each line contains time:coordinates\n');
        markdown.appendMarkdown('*Time:* Seconds after level start\n');
        markdown.appendMarkdown('*Coordinates:* x,y pairs where lava will appear');
      }
      return new vscode.Hover(markdown);
    }

    return undefined;
  }
}
