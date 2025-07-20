import * as vscode from 'vscode';
import { DatFileParser } from './parser/datFileParser';
import { getTileInfo } from './data/tileDefinitions';
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
          const tileInfo = getTileInfo(tileId);
          if (tileInfo) {
            const markdown = new vscode.MarkdownString();
            markdown.appendMarkdown(`**Tile ${tileId}: ${tileInfo.name}**\n\n`);
            markdown.appendMarkdown(`${tileInfo.description}\n\n`);
            markdown.appendMarkdown(`*Category:* ${tileInfo.category}\n\n`);
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
              'The most important building - headquarters for your Rock Raiders. Required in most levels.'
            );
            break;
          case 'BuildingPowerStation_C':
            markdown.appendMarkdown(
              'Generates power for your base. Each building needs power to function.'
            );
            break;
          case 'BuildingOreRefinery_C':
            markdown.appendMarkdown('Processes raw ore into usable building materials.');
            break;
          case 'BuildingCanteen_C':
            markdown.appendMarkdown('Feeds your Rock Raiders to keep them working efficiently.');
            break;
          case 'VehicleSmallDigger_C':
            markdown.appendMarkdown('Small drilling vehicle, fast but limited cargo capacity.');
            break;
          case 'VehicleLargeDigger_C':
            markdown.appendMarkdown('Large drilling vehicle with high cargo capacity.');
            break;
          case 'CreatureLavaMonster_C':
            markdown.appendMarkdown('Dangerous lava creature that emerges from lava tiles.');
            break;
          case 'CreatureRockMonster_C':
            markdown.appendMarkdown(
              'Rock creature that can eat energy crystals and throw boulders.'
            );
            break;
          case 'CreatureSpider_C':
            markdown.appendMarkdown('Small spider creature that can climb walls.');
            break;
        }

        return new vscode.Hover(markdown);
      }
    }

    // Check for entity properties
    if (
      word === 'ID' ||
      word === 'driver' ||
      word === 'Level' ||
      word === 'Essential' ||
      word === 'Teleport' ||
      word === 'Sleep'
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
      }
      return new vscode.Hover(markdown);
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
}
