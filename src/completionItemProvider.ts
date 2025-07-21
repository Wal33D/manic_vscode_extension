import * as vscode from 'vscode';
import { DatFileParser } from './parser/datFileParser';
import { BuildingType, VehicleType, CreatureType, BiomeType } from './types/datFileTypes';
import { getTileInfo } from './data/tileDefinitions';
import { getEnhancedTileInfo, isReinforcedTile } from './data/enhancedTileDefinitions';
import {
  SCRIPT_COMMANDS,
  SCRIPT_MACROS,
  CREATURE_TYPES,
  BUILDING_TYPES,
  VEHICLE_TYPES,
} from './validation/scriptCommands';

// Info section fields with descriptions
const infoFieldCompletions: Map<string, { detail: string; documentation: string }> = new Map([
  [
    'rowcount',
    { detail: 'Number of rows', documentation: 'The number of rows in the level grid (required)' },
  ],
  [
    'colcount',
    {
      detail: 'Number of columns',
      documentation: 'The number of columns in the level grid (required)',
    },
  ],
  ['levelname', { detail: 'Level name', documentation: 'Display name for the level' }],
  ['creator', { detail: 'Creator name', documentation: 'Name of the level creator' }],
  ['biome', { detail: 'Biome type', documentation: 'Level biome: rock, ice, or lava' }],
  ['version', { detail: 'Version string', documentation: 'Level version identifier' }],
  [
    'camerapos',
    { detail: 'Camera position', documentation: 'Initial camera position and orientation' },
  ],
  ['camerazoom', { detail: 'Camera zoom', documentation: 'Initial camera zoom level' }],
  [
    'opencaves',
    {
      detail: 'Open caves',
      documentation: 'Initially open cave connections (e.g., "6,18/18,20/")',
    },
  ],
  ['oxygen', { detail: 'Oxygen level', documentation: 'Oxygen timer/level for the mission' }],
  [
    'initialcrystals',
    { detail: 'Starting crystals', documentation: 'Number of energy crystals at level start' },
  ],
  ['initialore', { detail: 'Starting ore', documentation: 'Amount of ore at level start' }],
  [
    'spiderrate',
    { detail: 'Spider spawn rate', documentation: 'Percentage chance of spider spawning (0-100)' },
  ],
  ['spidermin', { detail: 'Min spiders', documentation: 'Minimum number of spiders to spawn' }],
  ['spidermax', { detail: 'Max spiders', documentation: 'Maximum number of spiders to spawn' }],
  [
    'erosioninitialwaittime',
    { detail: 'Erosion wait time', documentation: 'Time before erosion starts' },
  ],
  ['erosionscale', { detail: 'Erosion scale', documentation: 'Erosion intensity multiplier' }],
]);

// Script commands - DEPRECATED: Now using comprehensive list from scriptCommands.ts
const scriptCommandsLegacy = [
  // Messages and UI
  {
    name: 'msg',
    detail: 'Display message',
    documentation: 'Shows a message to the player (msg:MessageString)',
  },
  {
    name: 'playsound',
    detail: 'Play sound',
    documentation: 'Play a sound file (playsound:soundfile)',
  },
  { name: 'sound', detail: 'Play sound', documentation: 'Play a sound file (sound:soundfile)' },

  // Camera control
  { name: 'pan', detail: 'Pan camera', documentation: 'Pan camera to coordinates (pan:x,y)' },
  { name: 'camera', detail: 'Set camera position', documentation: 'Set camera position and angle' },
  {
    name: 'shake',
    detail: 'Shake screen',
    documentation: 'Shake the screen with intensity (shake:intensity)',
  },

  // Time control
  {
    name: 'wait',
    detail: 'Wait duration',
    documentation: 'Wait for specified seconds (wait:seconds)',
  },
  { name: 'truewait', detail: 'Blocking wait', documentation: 'Wait that blocks other events' },

  // Timer management
  {
    name: 'timer',
    detail: 'Define timer',
    documentation: 'Define a timer (timer TimerName=delay[,min,max][,event])',
  },
  {
    name: 'starttimer',
    detail: 'Start timer',
    documentation: 'Start a defined timer (starttimer:TimerName)',
  },
  {
    name: 'stoptimer',
    detail: 'Stop timer',
    documentation: 'Stop a running timer (stoptimer:TimerName)',
  },

  // Terrain modification
  {
    name: 'drill',
    detail: 'Drill tile',
    documentation: 'Drill at coordinates (drill:x,y[,tileId])',
  },
  {
    name: 'place',
    detail: 'Place tile',
    documentation: 'Place tile at coordinates (place:x,y,tileId)',
  },
  {
    name: 'reinforce',
    detail: 'Reinforce wall',
    documentation: 'Reinforce wall at coordinates (reinforce:x,y)',
  },

  // Entity spawning
  {
    name: 'spawn',
    detail: 'Spawn entity',
    documentation: 'Spawn an entity (spawn:type,x,y[,properties])',
  },
  {
    name: 'emerge',
    detail: 'Spawn creature',
    documentation: 'Make creature emerge (emerge:CreatureType:x,y)',
  },
  { name: 'teleport', detail: 'Teleport entity', documentation: 'Teleport entity to location' },
  {
    name: 'destroy',
    detail: 'Destroy entity',
    documentation: 'Destroy entity at location or by ID',
  },

  // Entity control
  { name: 'enable', detail: 'Enable entity', documentation: 'Enable a building or entity' },
  { name: 'disable', detail: 'Disable entity', documentation: 'Disable a building or entity' },
  { name: 'wake', detail: 'Wake creature', documentation: 'Wake a sleeping creature' },
  {
    name: 'setproperty',
    detail: 'Set entity property',
    documentation: 'Set property of an entity',
  },

  // Game flow
  { name: 'objective', detail: 'Set objective', documentation: 'Set or update an objective' },
  { name: 'win', detail: 'Win level', documentation: 'Trigger level win condition' },
  { name: 'lose', detail: 'Lose level', documentation: 'Trigger level lose condition' },

  // Conditional logic
  { name: 'if', detail: 'If condition', documentation: 'Start conditional block (if:condition)' },
  { name: 'then', detail: 'Then block', documentation: 'Execute if condition is true' },
  { name: 'else', detail: 'Else block', documentation: 'Execute if condition is false' },
  { name: 'endif', detail: 'End if', documentation: 'End conditional block' },
  {
    name: 'when',
    detail: 'When event',
    documentation: 'Define event trigger (when(condition)[event])',
  },
];

export class DatCompletionItemProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];
    const lineText = document.lineAt(position).text;
    const linePrefix = lineText.substr(0, position.character);

    // Parse the document to understand context
    const parser = new DatFileParser(document.getText());
    const section = parser.getSectionAtPosition(position.line);

    if (!section) {
      // Outside any section - suggest section names
      if (linePrefix.match(/^\s*$/)) {
        const sections = [
          'comments',
          'info',
          'tiles',
          'height',
          'resources',
          'objectives',
          'buildings',
          'vehicles',
          'creatures',
          'miners',
          'blocks',
          'script',
          'briefing',
          'briefingsuccess',
          'briefingfailure',
          'landslidefrequency',
          'lavaspread',
        ];

        for (const sectionName of sections) {
          const item = new vscode.CompletionItem(
            sectionName + '{',
            vscode.CompletionItemKind.Snippet
          );
          item.insertText = new vscode.SnippetString(`${sectionName}{\n\t$0\n}`);
          item.detail = `${sectionName} section`;
          completionItems.push(item);
        }
      }
      return completionItems;
    }

    // Context-specific completions based on section
    switch (section.name) {
      case 'info':
        return this.getInfoCompletions(linePrefix);

      case 'tiles':
      case 'height':
      case 'blocks':
        return this.getNumericCompletions(linePrefix);

      case 'landslidefrequency':
        return this.getLandslideCompletions(linePrefix);

      case 'lavaspread':
        return this.getLavaSpreadCompletions(linePrefix);

      case 'resources':
        return this.getResourcesCompletions(linePrefix);

      case 'objectives':
        return this.getObjectivesCompletions(linePrefix);

      case 'buildings':
        return this.getBuildingCompletions(linePrefix);

      case 'vehicles':
        return this.getVehicleCompletions(linePrefix);

      case 'creatures':
        return this.getCreatureCompletions(linePrefix);

      case 'script':
        return this.getScriptCompletions(linePrefix, document, position);
    }

    return completionItems;
  }

  private getInfoCompletions(linePrefix: string): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    // If we're at the start of a line in info section, suggest fields
    if (linePrefix.match(/^\s*$/)) {
      for (const [field, info] of infoFieldCompletions) {
        const item = new vscode.CompletionItem(field, vscode.CompletionItemKind.Field);
        item.detail = info.detail;
        item.documentation = new vscode.MarkdownString(info.documentation);
        item.insertText = new vscode.SnippetString(`${field}:$0`);
        completionItems.push(item);
      }
    }

    // Biome value completions
    if (linePrefix.match(/biome\s*:\s*$/)) {
      for (const biome of Object.values(BiomeType)) {
        const item = new vscode.CompletionItem(biome, vscode.CompletionItemKind.EnumMember);
        item.detail = 'Biome type';
        completionItems.push(item);
      }
    }

    // Camera position template
    if (linePrefix.match(/camerapos\s*:\s*$/)) {
      const item = new vscode.CompletionItem(
        'Translation template',
        vscode.CompletionItemKind.Snippet
      );
      item.insertText = new vscode.SnippetString(
        'Translation: X=${1:0.000} Y=${2:0.000} Z=${3:0.000} Rotation: P=${4:0.000000} Y=${5:0.000000} R=${6:0.000000} Scale X=${7:1.000} Y=${8:1.000} Z=${9:1.000}'
      );
      completionItems.push(item);
    }

    return completionItems;
  }

  private getNumericCompletions(linePrefix: string): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    // If we're in tiles section, provide tile ID completions
    if (linePrefix.match(/,\s*$/) || linePrefix.match(/^\s*$/)) {
      // Enhanced tile categories with better organization
      const tileCategories = {
        '🏗️ Buildable Ground': {
          tiles: [1],
          description: 'Safe tiles for construction',
        },
        '🪨 Rubble (Clearable)': {
          tiles: [2, 3, 4, 5],
          description: 'Can be cleared by raiders',
        },
        '🌋 Hazards': {
          tiles: [6, 7, 8, 9, 10, 11, 106, 107, 108, 109, 110, 111],
          description: 'Dangerous terrain',
        },
        '⚡ Special Functions': {
          tiles: [12, 112, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
          description: 'Electric fences and power paths',
        },
        '🪨 Drillable Walls': {
          tiles: [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37],
          description: 'Dirt, loose rock, and hard rock',
        },
        '🔒 Solid Rock': {
          tiles: [38, 39, 40, 41, 88, 89, 90, 91],
          description: 'Cannot be drilled',
        },
        '💎 Crystal Seams': {
          tiles: [42, 43, 44, 45, 92, 93, 94, 95],
          description: 'Contains energy crystals',
        },
        '⛏️ Ore Seams': {
          tiles: [46, 47, 48, 49, 96, 97, 98, 99],
          description: 'Contains building ore',
        },
        '⚡ Recharge Seams': {
          tiles: [50, 51, 52, 53, 100, 101, 102, 103],
          description: 'Powers electric fences',
        },
        '🎨 Decorative': {
          tiles: [58, 60, 61, 62, 63],
          description: 'Visual elements only',
        },
        '🧪 Experimental': {
          tiles: [64, 65, 114, 115],
          description: 'Cliff terrain (experimental)',
        },
        '🛡️ Reinforced Ground': {
          tiles: [76, 77, 78, 79, 80],
          description: 'Harder versions of ground tiles',
        },
        '🛡️ Reinforced Walls': {
          tiles: [76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87],
          description: 'Take 2x longer to drill',
        },
      };

      // Add quick access presets first
      const quickAccessItem = new vscode.CompletionItem(
        '-- Quick Access Tiles --',
        vscode.CompletionItemKind.Folder
      );
      quickAccessItem.detail = 'Common tiles for level building';
      quickAccessItem.sortText = '000';
      quickAccessItem.insertText = '';
      completionItems.push(quickAccessItem);

      // Add common tiles
      const commonTiles = [
        { id: 1, use: 'Ground (buildable)' },
        { id: 38, use: 'Solid rock (impassable)' },
        { id: 26, use: 'Dirt wall (easy)' },
        { id: 34, use: 'Hard rock (difficult)' },
        { id: 42, use: 'Crystal seam' },
        { id: 46, use: 'Ore seam' },
        { id: 6, use: 'Lava hazard' },
        { id: 11, use: 'Water hazard' },
      ];

      for (const common of commonTiles) {
        const item = new vscode.CompletionItem(
          common.id.toString(),
          vscode.CompletionItemKind.Constant
        );
        item.detail = `⭐ ${common.use}`;
        item.sortText = `001-${common.id.toString().padStart(3, '0')}`;
        completionItems.push(item);
      }

      // Add separator
      const separatorItem = new vscode.CompletionItem(
        '-- All Tiles by Category --',
        vscode.CompletionItemKind.Folder
      );
      separatorItem.detail = 'Complete tile listing';
      separatorItem.sortText = '002';
      separatorItem.insertText = '';
      completionItems.push(separatorItem);

      // Add tiles from each category
      let categoryIndex = 0;
      for (const [categoryName, categoryData] of Object.entries(tileCategories)) {
        for (const tileId of categoryData.tiles) {
          const tileInfo = getEnhancedTileInfo(tileId) || getTileInfo(tileId);
          if (tileInfo) {
            const item = new vscode.CompletionItem(
              tileId.toString(),
              vscode.CompletionItemKind.Constant
            );

            const isReinforced = tileId >= 76;
            const reinforcedMarker = isReinforced ? ' 🛡️' : '';

            item.detail = `${categoryName}: ${tileInfo.name}${reinforcedMarker}`;

            const docs = new vscode.MarkdownString();
            docs.appendMarkdown(`**${tileInfo.name}** (ID: ${tileId})\n\n`);
            docs.appendMarkdown(`${tileInfo.description}\n\n`);
            docs.appendMarkdown(`*Category:* ${categoryData.description}\n\n`);

            if (tileInfo.canDrill) {
              const drillTime = this.getDrillTimeForTile(tileId);
              docs.appendMarkdown(`*Drill time:* ${drillTime}\n`);
            }

            if (tileInfo.category === 'resource') {
              const resource =
                (tileId >= 42 && tileId <= 45) || (tileId >= 92 && tileId <= 95)
                  ? 'crystals'
                  : (tileId >= 46 && tileId <= 49) || (tileId >= 96 && tileId <= 99)
                    ? 'ore'
                    : 'recharge';
              docs.appendMarkdown(`*Yields:* ${resource}\n`);
            }

            item.documentation = docs;
            item.sortText = `${(categoryIndex + 3).toString().padStart(3, '0')}-${categoryName}-${tileId.toString().padStart(3, '0')}`;
            completionItems.push(item);
          }
        }
        categoryIndex++;
      }

      // Add a special completion for "show all tiles"
      const showAllItem = new vscode.CompletionItem(
        'View all tile IDs...',
        vscode.CompletionItemKind.Text
      );
      showAllItem.detail = 'Click for complete tile reference (1-115)';
      showAllItem.documentation = new vscode.MarkdownString(
        '**All Tile IDs:**\n\n' +
          '**Ground (1-5, 76-80):** Rubble, dirt, loose rock\n' +
          '**Hazards (6-11, 106-111):** Lava, water, erosion\n' +
          '**Special (12-14, 112-114):** Electric fence, paths\n' +
          '**Walls (26-37, 76-87):** Various rock types\n' +
          '**Solid (38, 88):** Impenetrable rock\n' +
          '**Crystal (42-45, 92-95):** Energy crystal seams\n' +
          '**Ore (46-49, 96-99):** Ore seams\n' +
          '**Recharge (50-53, 100-103):** Power crystal seams\n\n' +
          '*Reinforced tiles = base ID + 50*'
      );
      showAllItem.sortText = 'zzz'; // Put at end
      completionItems.push(showAllItem);
    }

    return completionItems;
  }

  private getDrillTimeForTile(tileId: number): string {
    const baseId = isReinforcedTile(tileId) ? tileId - 50 : tileId;
    const multiplier = isReinforcedTile(tileId) ? 2 : 1;

    if (baseId >= 26 && baseId <= 29) {
      return `${3 * multiplier}s`;
    }
    if (baseId >= 30 && baseId <= 33) {
      return `${5 * multiplier}s`;
    }
    if (baseId >= 34 && baseId <= 37) {
      return `${8 * multiplier}s`;
    }
    if (baseId >= 42 && baseId <= 45) {
      return `${6 * multiplier}s`;
    }
    if (baseId >= 46 && baseId <= 49) {
      return `${7 * multiplier}s`;
    }
    if (baseId >= 50 && baseId <= 53) {
      return `${5 * multiplier}s`;
    }
    if (baseId >= 2 && baseId <= 5) {
      return `${(baseId - 1) * multiplier}s`;
    }

    return 'N/A';
  }

  private getResourcesCompletions(linePrefix: string): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    if (linePrefix.match(/^\s*$/)) {
      // Suggest subsection names
      const subsections = ['crystals', 'ore'];
      for (const subsection of subsections) {
        const item = new vscode.CompletionItem(subsection + ':', vscode.CompletionItemKind.Field);
        item.detail = `${subsection} placement grid`;
        completionItems.push(item);
      }
    }

    return completionItems;
  }

  private getObjectivesCompletions(linePrefix: string): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    if (linePrefix.match(/^\s*$/)) {
      // Resource objective
      const resourceItem = new vscode.CompletionItem(
        'resources:',
        vscode.CompletionItemKind.Snippet
      );
      resourceItem.insertText = new vscode.SnippetString(
        'resources: ${1:crystals},${2:ore},${3:studs}'
      );
      resourceItem.detail = 'Resource collection objective';
      completionItems.push(resourceItem);

      // Building objective
      const buildingItem = new vscode.CompletionItem(
        'building:',
        vscode.CompletionItemKind.Snippet
      );
      buildingItem.insertText = new vscode.SnippetString(
        'building:${1|BuildingToolStore_C,BuildingPowerStation_C,BuildingTeleportPad_C,BuildingDocks_C,BuildingCanteen_C,BuildingSupportStation_C,BuildingOreRefinery_C,BuildingGeologicalCenter_C,BuildingUpgradeStation_C,BuildingMiningLaser_C,BuildingSuperTeleport_C|}'
      );
      buildingItem.detail = 'Building construction objective';
      completionItems.push(buildingItem);

      // Discover tile objective
      const discoverItem = new vscode.CompletionItem(
        'discovertile:',
        vscode.CompletionItemKind.Snippet
      );
      discoverItem.insertText = new vscode.SnippetString(
        'discovertile:${1:x},${2:y}/${3:description}'
      );
      discoverItem.detail = 'Discover location objective';
      completionItems.push(discoverItem);

      // Variable objective
      const variableItem = new vscode.CompletionItem(
        'variable:',
        vscode.CompletionItemKind.Snippet
      );
      variableItem.insertText = new vscode.SnippetString(
        'variable:${1:condition}/${2:description}'
      );
      variableItem.detail = 'Script variable objective';
      completionItems.push(variableItem);

      // Find miner objective
      const minerItem = new vscode.CompletionItem('findminer:', vscode.CompletionItemKind.Snippet);
      minerItem.insertText = new vscode.SnippetString('findminer:${1:minerID}');
      minerItem.detail = 'Find lost miner objective';
      completionItems.push(minerItem);

      // Find building objective
      const findBuildingItem = new vscode.CompletionItem(
        'findbuilding:',
        vscode.CompletionItemKind.Snippet
      );
      findBuildingItem.insertText = new vscode.SnippetString('findbuilding:${1:x},${2:y}');
      findBuildingItem.detail = 'Find hidden building objective';
      completionItems.push(findBuildingItem);
    }

    return completionItems;
  }

  private getBuildingCompletions(linePrefix: string): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    if (linePrefix.match(/^\s*$/) || linePrefix.match(/,\s*$/)) {
      // Smart building suggestions based on what's already present
      const existingBuildings = this.getExistingBuildingsFromDocument();
      const hasToolStore = existingBuildings.includes('BuildingToolStore_C');
      const hasPowerStation = existingBuildings.includes('BuildingPowerStation_C');

      for (const [key, value] of Object.entries(BuildingType)) {
        const item = new vscode.CompletionItem(value, vscode.CompletionItemKind.Class);
        const name = key.replace(/([A-Z])/g, ' $1').trim();

        // Prioritize essential buildings
        if (value === 'BuildingToolStore_C' && !hasToolStore) {
          item.detail = `${name} (REQUIRED - Place first!)`;
          item.sortText = '0_' + value;
        } else if (value === 'BuildingPowerStation_C' && !hasPowerStation) {
          item.detail = `${name} (Recommended - Powers other buildings)`;
          item.sortText = '1_' + value;
        } else {
          item.detail = name;
          item.sortText = '2_' + value;
        }

        // Calculate smart default coordinates based on grid
        const gridX = 20; // Default to center-ish
        const gridY = 20;
        const worldX = gridX * 150;
        const worldY = gridY * 150;

        item.insertText = new vscode.SnippetString(
          `${value},Translation: X=\${1:${worldX.toFixed(3)}} Y=\${2:${worldY.toFixed(3)}} Z=\${3:0.000} Rotation: P=\${4:0.000000} Y=\${5:0.000000} R=\${6:0.000000} Scale X=\${7:1.000} Y=\${8:1.000} Z=\${9:1.000}`
        );

        // Add documentation about the building
        const docs = new vscode.MarkdownString();
        if (value === 'BuildingToolStore_C') {
          docs.appendMarkdown('**Tool Store** - Main headquarters (self-powered)\n\n');
          docs.appendMarkdown('Place this first! Raiders teleport here.');
        } else if (value === 'BuildingPowerStation_C') {
          docs.appendMarkdown('**Power Station** - Provides power to adjacent buildings\n\n');
          docs.appendMarkdown('Place near other buildings for power connection.');
        }
        item.documentation = docs;

        completionItems.push(item);
      }

      // Add a helper for converting grid to world coordinates
      const coordHelper = new vscode.CompletionItem(
        'Grid to World Helper',
        vscode.CompletionItemKind.Snippet
      );
      coordHelper.detail = 'Convert grid (10,10) to world coordinates';
      coordHelper.insertText = new vscode.SnippetString(
        '// Grid (${1:10},${2:10}) = World (${1:10}*150=${3:1500}, ${2:10}*150=${4:1500})'
      );
      coordHelper.sortText = 'zzz';
      completionItems.push(coordHelper);
    }

    return completionItems;
  }

  private getExistingBuildingsFromDocument(): string[] {
    // This is a simplified version - in real implementation, parse the document
    // to find already placed buildings
    return [];
  }

  private getVehicleCompletions(linePrefix: string): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    if (linePrefix.match(/^\s*$/) || linePrefix.match(/,\s*$/)) {
      for (const [key, value] of Object.entries(VehicleType)) {
        const item = new vscode.CompletionItem(value, vscode.CompletionItemKind.Class);
        item.detail = key.replace(/([A-Z])/g, ' $1').trim();
        item.insertText = new vscode.SnippetString(
          `${value},Translation: X=\${1:0.000} Y=\${2:0.000} Z=\${3:0.000} Rotation: P=\${4:0.000000} Y=\${5:0.000000} R=\${6:0.000000} Scale X=\${7:1.000} Y=\${8:1.000} Z=\${9:1.000}`
        );
        completionItems.push(item);
      }
    }

    return completionItems;
  }

  private getCreatureCompletions(linePrefix: string): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    if (linePrefix.match(/^\s*$/) || linePrefix.match(/,\s*$/)) {
      for (const [key, value] of Object.entries(CreatureType)) {
        const item = new vscode.CompletionItem(value, vscode.CompletionItemKind.Class);
        item.detail = key.replace(/([A-Z])/g, ' $1').trim();
        item.insertText = new vscode.SnippetString(
          `${value},Translation: X=\${1:0.000} Y=\${2:0.000} Z=\${3:0.000} Rotation: P=\${4:0.000000} Y=\${5:0.000000} R=\${6:0.000000} Scale X=\${7:1.000} Y=\${8:1.000} Z=\${9:1.000}`
        );
        completionItems.push(item);
      }
    }

    return completionItems;
  }

  private getScriptCompletions(
    linePrefix: string,
    _document: vscode.TextDocument,
    _position: vscode.Position
  ): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    // Variable type completions at the start of a line
    if (linePrefix.match(/^\s*$/)) {
      // Variable types
      const types = ['int', 'string', 'float', 'bool', 'timer', 'arrow'];
      for (const type of types) {
        const item = new vscode.CompletionItem(type, vscode.CompletionItemKind.Keyword);
        if (type === 'timer') {
          item.insertText = new vscode.SnippetString(
            'timer ${1:TimerName}=${2:5},${3:3},${4:8},${5:EventName}'
          );
          item.detail = 'Declare timer variable';
          item.documentation = new vscode.MarkdownString('Timer format: delay[,min,max][,event]');
        } else if (type === 'arrow') {
          item.insertText = new vscode.SnippetString(`arrow \${1:ArrowName}=\${2:green}`);
          item.detail = 'Declare arrow variable';
          item.documentation = new vscode.MarkdownString('Arrow colors: green, red, yellow, blue');
        } else {
          item.insertText = new vscode.SnippetString(`${type} \${1:varName}=\${2:value}`);
          item.detail = `Declare ${type} variable`;
        }
        completionItems.push(item);
      }

      // Event declaration
      const eventItem = new vscode.CompletionItem('when', vscode.CompletionItemKind.Snippet);
      eventItem.insertText = new vscode.SnippetString('when(${1:condition})[${2:EventName}]');
      eventItem.detail = 'Declare conditional event';
      eventItem.documentation = new vscode.MarkdownString('Triggers event when condition is met');
      completionItems.push(eventItem);

      // Comment
      const commentItem = new vscode.CompletionItem('#', vscode.CompletionItemKind.Text);
      commentItem.insertText = '# ';
      commentItem.detail = 'Add comment';
      completionItems.push(commentItem);
    }

    // Suggest script macros in conditions
    if (
      linePrefix.includes('when(') ||
      linePrefix.includes('if(') ||
      linePrefix.match(/[<>=!]/) ||
      linePrefix.match(/\(\s*\w*$/)
    ) {
      // Add all script macros
      for (const [macro, info] of Object.entries(SCRIPT_MACROS)) {
        // Skip entity-specific macros for now
        if (macro.includes('.')) {
          continue;
        }

        const item = new vscode.CompletionItem(macro, vscode.CompletionItemKind.Variable);
        item.detail = `${info.type} - ${info.description}`;

        // Special handling for object macros
        if (macro === 'buildings' || macro === 'creatures' || macro === 'vehicles') {
          item.insertText = new vscode.SnippetString(
            `${macro}.\${1|${macro === 'buildings' ? BUILDING_TYPES.join(',') : macro === 'creatures' ? CREATURE_TYPES.join(',') : VEHICLE_TYPES.join(',')}|}`
          );
          item.documentation = new vscode.MarkdownString(
            `Access ${macro} counts by type\n\nExample: ${macro}.${macro === 'buildings' ? 'BuildingToolStore_C' : macro === 'creatures' ? 'CreatureRockMonster_C' : 'VehicleHoverScout_C'}`
          );
        }

        completionItems.push(item);
      }
    }

    // Script command completions (after :: or indented)
    if (linePrefix.match(/^\s+$/) || linePrefix.match(/::\s*$/)) {
      for (const cmd of scriptCommandsLegacy) {
        const item = new vscode.CompletionItem(cmd.name, vscode.CompletionItemKind.Function);
        item.detail = cmd.detail;
        item.documentation = new vscode.MarkdownString(cmd.documentation);

        // Provide specific snippets for common commands
        switch (cmd.name) {
          case 'msg':
            item.insertText = new vscode.SnippetString('msg:${1:Your message here};');
            break;
          case 'wait':
            item.insertText = new vscode.SnippetString('wait:${1:5};');
            break;
          case 'spawn':
            item.insertText = new vscode.SnippetString('spawn:${1:CreatureType},${2:x},${3:y};');
            break;
          case 'drill':
            item.insertText = new vscode.SnippetString('drill:${1:x},${2:y};');
            break;
          case 'timer':
            item.insertText = new vscode.SnippetString('timer ${1:name}=${2:delay};');
            break;
          case 'when':
            item.insertText = new vscode.SnippetString('when(${1:time=10})[${2:EventName}]');
            break;
          default:
            item.insertText = new vscode.SnippetString(`${cmd.name}:\${1:params};`);
        }
        completionItems.push(item);
      }
    }

    // Event handler completion (after event name)
    if (linePrefix.match(/^\s*\w+$/)) {
      const handlerItem = new vscode.CompletionItem('::', vscode.CompletionItemKind.Operator);
      handlerItem.insertText = new vscode.SnippetString('::$0');
      handlerItem.detail = 'Define event handler';
      completionItems.push(handlerItem);
    }

    // Enhanced command completions using comprehensive list
    if (linePrefix.match(/^\s+/) && !linePrefix.includes(':')) {
      // Add commands from SCRIPT_COMMANDS
      for (const [cmdName, cmdDef] of Object.entries(SCRIPT_COMMANDS)) {
        // Skip if already added by legacy
        if (completionItems.some(item => item.label === cmdName)) {
          continue;
        }

        const item = new vscode.CompletionItem(cmdName, vscode.CompletionItemKind.Function);
        item.detail = cmdDef.description;

        const paramDesc = cmdDef.params.format || cmdDef.params.description;
        item.documentation = new vscode.MarkdownString(
          `**${cmdDef.name}**\n\n${cmdDef.description}\n\nParameters: ${paramDesc}\n\nCategory: ${cmdDef.category}`
        );

        // Add specific snippets based on parameter format
        if (cmdDef.params.format) {
          const params = cmdDef.params.format.split(',').map((p, i) => `\${${i + 1}:${p.trim()}}`);
          item.insertText = new vscode.SnippetString(`${cmdName}:${params.join(',')};`);
        } else if (cmdDef.params.max === 0) {
          item.insertText = new vscode.SnippetString(`${cmdName}:;`);
        } else {
          const paramCount = cmdDef.params.min || 1;
          const params = Array.from({ length: paramCount }, (_, i) => `\${${i + 1}:param${i + 1}}`);
          item.insertText = new vscode.SnippetString(`${cmdName}:${params.join(',')};`);
        }

        completionItems.push(item);
      }
    }

    return completionItems;
  }

  private getLandslideCompletions(linePrefix: string): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    if (linePrefix.match(/^\s*$/)) {
      // Suggest common time intervals
      const timeIntervals = [30, 60, 90, 120, 180, 240, 300];

      for (const time of timeIntervals) {
        const item = new vscode.CompletionItem(`${time}:`, vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString(`${time}:\${1:x},\${2:y}/`);
        item.detail = `Landslide at ${time} seconds`;
        item.documentation = new vscode.MarkdownString(
          `Triggers landslide after ${time} seconds (${time / 60} minutes)`
        );
        completionItems.push(item);
      }

      // Add custom time template
      const customItem = new vscode.CompletionItem(
        'Custom time',
        vscode.CompletionItemKind.Snippet
      );
      customItem.insertText = new vscode.SnippetString('${1:time}:${2:x},${3:y}/');
      customItem.detail = 'Custom landslide timing';
      customItem.documentation = new vscode.MarkdownString(
        'Define custom landslide timing\n\n*Format:* time:x1,y1/x2,y2/'
      );
      completionItems.push(customItem);
    }

    return completionItems;
  }

  private getLavaSpreadCompletions(linePrefix: string): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    if (linePrefix.match(/^\s*$/)) {
      // Suggest common lava spread patterns
      const spreadPatterns = [
        { time: 60, desc: 'Early spread (1 minute)' },
        { time: 120, desc: 'Medium spread (2 minutes)' },
        { time: 180, desc: 'Late spread (3 minutes)' },
        { time: 300, desc: 'Very late spread (5 minutes)' },
      ];

      for (const pattern of spreadPatterns) {
        const item = new vscode.CompletionItem(
          `${pattern.time}:`,
          vscode.CompletionItemKind.Snippet
        );
        item.insertText = new vscode.SnippetString(`${pattern.time}:\${1:x},\${2:y}/`);
        item.detail = pattern.desc;
        item.documentation = new vscode.MarkdownString(
          `Lava spreads to specified tiles after ${pattern.time} seconds`
        );
        completionItems.push(item);
      }

      // Add spreading pattern template
      const patternItem = new vscode.CompletionItem(
        'Lava spread pattern',
        vscode.CompletionItemKind.Snippet
      );
      patternItem.insertText = new vscode.SnippetString('${1:60}:${2:x},${3:y}/${4:x2},${5:y2}/');
      patternItem.detail = 'Multi-tile lava spread';
      patternItem.documentation = new vscode.MarkdownString(
        'Spread lava to multiple tiles at once\n\n*Example:* 60:5,5/5,6/5,7/'
      );
      completionItems.push(patternItem);
    }

    return completionItems;
  }
}
