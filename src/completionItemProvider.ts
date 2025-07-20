import * as vscode from 'vscode';
import { DatFileParser } from './parser/datFileParser';
import { BuildingType, VehicleType, CreatureType, BiomeType } from './types/datFileTypes';
import { getTileInfo } from './data/tileDefinitions';

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

// Script commands
const scriptCommands = [
  { name: 'msg', detail: 'Display message', documentation: 'Shows a message to the player' },
  {
    name: 'pan',
    detail: 'Pan camera',
    documentation: 'Pan camera to coordinates (e.g., pan:10,15)',
  },
  { name: 'wait', detail: 'Wait duration', documentation: 'Wait for specified seconds' },
  { name: 'truewait', detail: 'Blocking wait', documentation: 'Wait that blocks other events' },
  { name: 'shake', detail: 'Shake screen', documentation: 'Shake the screen with intensity' },
  {
    name: 'drill',
    detail: 'Drill tile',
    documentation: 'Drill at coordinates (e.g., drill:10,15,38)',
  },
  { name: 'place', detail: 'Place tile', documentation: 'Place tile at coordinates' },
  {
    name: 'emerge',
    detail: 'Spawn creature',
    documentation: 'Make creature emerge (e.g., emerge:CreatureLavaMonster_C:10,15)',
  },
  { name: 'sound', detail: 'Play sound', documentation: 'Play a sound file' },
  { name: 'enable', detail: 'Enable entity', documentation: 'Enable a building or entity' },
  { name: 'disable', detail: 'Disable entity', documentation: 'Disable a building or entity' },
  { name: 'wake', detail: 'Wake creature', documentation: 'Wake a sleeping creature' },
  { name: 'stoptimer', detail: 'Stop timer', documentation: 'Stop a running timer' },
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
      case 'landslidefrequency':
      case 'lavaspread':
        return this.getNumericCompletions(linePrefix);

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
      // Common tile IDs
      const commonTiles = [1, 38, 42, 46, 26, 24, 14, 11, 50, 34, 30];

      for (const tileId of commonTiles) {
        const tileInfo = getTileInfo(tileId);
        if (tileInfo) {
          const item = new vscode.CompletionItem(
            tileId.toString(),
            vscode.CompletionItemKind.Constant
          );
          item.detail = tileInfo.name;
          item.documentation = new vscode.MarkdownString(tileInfo.description);
          completionItems.push(item);
        }
      }
    }

    return completionItems;
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
        'building:${1|BuildingPowerStation_C,BuildingOreRefinery_C,BuildingCanteen_C|}'
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
    }

    return completionItems;
  }

  private getBuildingCompletions(linePrefix: string): vscode.CompletionItem[] {
    const completionItems: vscode.CompletionItem[] = [];

    if (linePrefix.match(/^\s*$/) || linePrefix.match(/,\s*$/)) {
      for (const [key, value] of Object.entries(BuildingType)) {
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

    // Variable type completions
    if (linePrefix.match(/^\s*$/)) {
      const types = ['int', 'string', 'float', 'bool'];
      for (const type of types) {
        const item = new vscode.CompletionItem(type, vscode.CompletionItemKind.Keyword);
        item.insertText = new vscode.SnippetString(`${type} \${1:varName}=\${2:value}`);
        item.detail = `Declare ${type} variable`;
        completionItems.push(item);
      }

      // Event declaration
      const eventItem = new vscode.CompletionItem('event', vscode.CompletionItemKind.Snippet);
      eventItem.insertText = new vscode.SnippetString('${1:EventName}::;\n$0');
      eventItem.detail = 'Declare new event';
      completionItems.push(eventItem);
    }

    // Script command completions
    if (linePrefix.match(/^\s+$/)) {
      for (const cmd of scriptCommands) {
        const item = new vscode.CompletionItem(cmd.name, vscode.CompletionItemKind.Function);
        item.detail = cmd.detail;
        item.documentation = new vscode.MarkdownString(cmd.documentation);
        item.insertText = new vscode.SnippetString(`${cmd.name}:\${1:params};`);
        completionItems.push(item);
      }
    }

    return completionItems;
  }
}
