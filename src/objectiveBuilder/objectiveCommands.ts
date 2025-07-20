import * as vscode from 'vscode';
import { DatFileParser } from '../parser/datFileParser';

export function registerObjectiveCommands(context: vscode.ExtensionContext): void {
  // Command to open objective builder
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.openObjectiveBuilder', () => {
      vscode.commands.executeCommand('manicMiners.objectiveBuilder.focus');
    })
  );

  // Command to analyze objectives
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.analyzeObjectives', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'manicminers') {
        vscode.window.showErrorMessage('Please open a Manic Miners DAT file');
        return;
      }

      await analyzeObjectives(editor.document);
    })
  );

  // Command to generate objective report
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.generateObjectiveReport', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'manicminers') {
        vscode.window.showErrorMessage('Please open a Manic Miners DAT file');
        return;
      }

      await generateObjectiveReport(editor.document, context);
    })
  );

  // Command to convert objective format
  context.subscriptions.push(
    vscode.commands.registerCommand('manicMiners.convertObjectiveFormat', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'manicminers') {
        vscode.window.showErrorMessage('Please open a Manic Miners DAT file');
        return;
      }

      await convertObjectiveFormat(editor);
    })
  );
}

async function analyzeObjectives(document: vscode.TextDocument): Promise<void> {
  const parser = new DatFileParser(document.getText());
  const objectivesSection = parser.getSection('objectives');

  if (!objectivesSection) {
    vscode.window.showWarningMessage('No objectives section found in this file');
    return;
  }

  const objectives = parseObjectives(objectivesSection.content);
  const analysis = analyzeObjectiveList(objectives);

  // Show analysis in output channel
  const outputChannel = vscode.window.createOutputChannel('Objective Analysis');
  outputChannel.clear();
  outputChannel.appendLine('=== Objective Analysis ===\n');
  outputChannel.appendLine(`Total objectives: ${objectives.length}`);
  outputChannel.appendLine(`Objective types: ${Object.keys(analysis.types).join(', ')}`);
  outputChannel.appendLine('\nBreakdown:');

  for (const [type, count] of Object.entries(analysis.types)) {
    outputChannel.appendLine(`  ${type}: ${count}`);
  }

  if (analysis.resources.total > 0) {
    outputChannel.appendLine('\nResource Requirements:');
    outputChannel.appendLine(`  Crystals: ${analysis.resources.crystals}`);
    outputChannel.appendLine(`  Ore: ${analysis.resources.ore}`);
    outputChannel.appendLine(`  Studs: ${analysis.resources.studs}`);
  }

  if (analysis.buildings.length > 0) {
    outputChannel.appendLine('\nBuildings Required:');
    analysis.buildings.forEach((building: string) => {
      outputChannel.appendLine(`  - ${formatBuildingName(building)}`);
    });
  }

  if (analysis.locations.length > 0) {
    outputChannel.appendLine('\nLocations to Discover:');
    analysis.locations.forEach((loc: { x: number; y: number; description?: string }) => {
      outputChannel.appendLine(`  - [${loc.x}, ${loc.y}]: ${loc.description || 'No description'}`);
    });
  }

  outputChannel.show();
}

async function generateObjectiveReport(
  document: vscode.TextDocument,
  _context: vscode.ExtensionContext
): Promise<void> {
  const parser = new DatFileParser(document.getText());
  const objectivesSection = parser.getSection('objectives');

  if (!objectivesSection) {
    vscode.window.showWarningMessage('No objectives section found in this file');
    return;
  }

  const objectives = parseObjectives(objectivesSection.content);
  const analysis = analyzeObjectiveList(objectives);

  // Create webview panel for the report
  const panel = vscode.window.createWebviewPanel(
    'objectiveReport',
    'Objective Report',
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  panel.webview.html = generateReportHtml(objectives, analysis);
}

async function convertObjectiveFormat(editor: vscode.TextEditor): Promise<void> {
  const selection = editor.selection;
  const text = editor.document.getText(selection);

  if (!text.trim()) {
    vscode.window.showErrorMessage('Please select objective text to convert');
    return;
  }

  // Show quick pick for format options
  const formatOptions = [
    { label: 'Resources Format', value: 'resources' },
    { label: 'Building Format', value: 'building' },
    { label: 'Discovery Format', value: 'discovery' },
    { label: 'Variable Format', value: 'variable' },
  ];

  const selected = await vscode.window.showQuickPick(formatOptions, {
    placeHolder: 'Select objective format',
  });

  if (!selected) {
    return;
  }

  let converted = '';

  switch (selected.value) {
    case 'resources': {
      const crystals = await vscode.window.showInputBox({
        prompt: 'Crystals to collect',
        value: '10',
      });
      const ore = await vscode.window.showInputBox({ prompt: 'Ore to collect', value: '0' });
      const studs = await vscode.window.showInputBox({ prompt: 'Studs to collect', value: '0' });
      converted = `resources: ${crystals || '0'},${ore || '0'},${studs || '0'}`;
      break;
    }

    case 'building': {
      const buildings = Object.values({
        'Tool Store': 'BuildingToolStore_C',
        'Power Station': 'BuildingPowerStation_C',
        'Teleport Pad': 'BuildingTeleportPad_C',
        Docks: 'BuildingDocks_C',
        'Support Station': 'BuildingSupportStation_C',
        'Ore Refinery': 'BuildingOreRefinery_C',
        'Upgrade Station': 'BuildingUpgradeStation_C',
      });

      const buildingChoice = await vscode.window.showQuickPick(
        buildings.map(b => ({ label: formatBuildingName(b), value: b })),
        { placeHolder: 'Select building' }
      );

      if (buildingChoice) {
        converted = `building:${buildingChoice.value}`;
      }
      break;
    }

    case 'discovery': {
      const x = await vscode.window.showInputBox({ prompt: 'X coordinate', value: '10' });
      const y = await vscode.window.showInputBox({ prompt: 'Y coordinate', value: '10' });
      const desc = await vscode.window.showInputBox({
        prompt: 'Description',
        value: 'Discover the hidden area',
      });
      converted = `discovertile:${x || '0'},${y || '0'}/${desc || ''}`;
      break;
    }

    case 'variable': {
      const condition = await vscode.window.showInputBox({
        prompt: 'Variable condition',
        value: 'monsters_defeated>=5',
      });
      const varDesc = await vscode.window.showInputBox({
        prompt: 'Description',
        value: 'Complete the objective',
      });
      converted = `variable:${condition || ''}/${varDesc || ''}`;
      break;
    }
  }

  if (converted) {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(editor.document.uri, selection, converted);
    await vscode.workspace.applyEdit(edit);
  }
}

// Helper functions
interface Objective {
  type: string;
  crystals?: number;
  ore?: number;
  studs?: number;
  building?: string;
  x?: number;
  y?: number;
  description?: string;
  condition?: string;
  minerID?: string;
  text?: string;
}

function parseObjectives(content: string): Objective[] {
  const lines = content.split('\n').filter(line => line.trim());
  const objectives: Objective[] = [];

  lines.forEach(line => {
    const trimmed = line.trim();

    if (trimmed.startsWith('resources:')) {
      const match = trimmed.match(/resources:\s*(\d+),(\d+),(\d+)/);
      if (match) {
        objectives.push({
          type: 'resources',
          crystals: parseInt(match[1], 10),
          ore: parseInt(match[2], 10),
          studs: parseInt(match[3], 10),
        });
      }
    } else if (trimmed.startsWith('building:')) {
      const building = trimmed.substring(9).trim();
      objectives.push({ type: 'building', building });
    } else if (trimmed.startsWith('discovertile:')) {
      const match = trimmed.match(/discovertile:\s*(\d+),(\d+)(?:\/(.*))?/);
      if (match) {
        objectives.push({
          type: 'discovertile',
          x: parseInt(match[1], 10),
          y: parseInt(match[2], 10),
          description: match[3] || '',
        });
      }
    } else if (trimmed.startsWith('variable:')) {
      const match = trimmed.match(/variable:\s*([^/]+)(?:\/(.*))?/);
      if (match) {
        objectives.push({
          type: 'variable',
          condition: match[1],
          description: match[2] || '',
        });
      }
    } else if (trimmed.startsWith('findminer:')) {
      const minerID = trimmed.substring(10).trim();
      objectives.push({ type: 'findminer', minerID });
    } else if (trimmed.startsWith('findbuilding:')) {
      const match = trimmed.match(/findbuilding:\s*(\d+),(\d+)/);
      if (match) {
        objectives.push({
          type: 'findbuilding',
          x: parseInt(match[1], 10),
          y: parseInt(match[2], 10),
        });
      }
    } else if (trimmed) {
      // Custom objective
      objectives.push({ type: 'custom', text: trimmed });
    }
  });

  return objectives;
}

interface ObjectiveAnalysis {
  types: Record<string, number>;
  resources: { total: number; crystals: number; ore: number; studs: number };
  buildings: string[];
  locations: Array<{ x: number; y: number; description: string }>;
}

function analyzeObjectiveList(objectives: Objective[]): ObjectiveAnalysis {
  const analysis = {
    types: {} as Record<string, number>,
    resources: { total: 0, crystals: 0, ore: 0, studs: 0 },
    buildings: [] as string[],
    locations: [] as Array<{ x: number; y: number; description: string }>,
  };

  objectives.forEach(obj => {
    // Count types
    analysis.types[obj.type] = (analysis.types[obj.type] || 0) + 1;

    // Analyze specifics
    switch (obj.type) {
      case 'resources':
        analysis.resources.crystals += obj.crystals || 0;
        analysis.resources.ore += obj.ore || 0;
        analysis.resources.studs += obj.studs || 0;
        analysis.resources.total += (obj.crystals || 0) + (obj.ore || 0) + (obj.studs || 0);
        break;

      case 'building':
        if (obj.building && !analysis.buildings.includes(obj.building)) {
          analysis.buildings.push(obj.building);
        }
        break;

      case 'discovertile':
      case 'findbuilding':
        analysis.locations.push({
          x: obj.x || 0,
          y: obj.y || 0,
          description: obj.description || `${obj.type} objective`,
        });
        break;
    }
  });

  return analysis;
}

function formatBuildingName(building: string): string {
  return building
    .replace('Building', '')
    .replace('_C', '')
    .replace(/([A-Z])/g, ' $1')
    .trim();
}

function generateReportHtml(objectives: Objective[], analysis: ObjectiveAnalysis): string {
  const objectiveHtml = objectives
    .map((obj, index) => {
      let display = '';
      switch (obj.type) {
        case 'resources':
          display = `Collect ${obj.crystals} crystals, ${obj.ore} ore, ${obj.studs} studs`;
          break;
        case 'building':
          display = `Build ${formatBuildingName(obj.building || '')}`;
          break;
        case 'discovertile':
          display = `Discover location [${obj.x}, ${obj.y}] - ${obj.description}`;
          break;
        case 'variable':
          display = `Complete: ${obj.description} (${obj.condition})`;
          break;
        case 'findminer':
          display = `Find miner: ${obj.minerID}`;
          break;
        case 'findbuilding':
          display = `Find building at [${obj.x}, ${obj.y}]`;
          break;
        case 'custom':
          display = obj.text || '';
          break;
      }

      return `
      <div class="objective">
        <span class="objective-number">${index + 1}.</span>
        <span class="objective-text">${display}</span>
        <span class="objective-type">${obj.type}</span>
      </div>
    `;
    })
    .join('');

  return `<!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: var(--vscode-font-family);
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
          padding: 20px;
          line-height: 1.6;
        }
        h1, h2 {
          color: var(--vscode-foreground);
        }
        .summary {
          background-color: var(--vscode-editor-inactiveSelectionBackground);
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .objective {
          display: flex;
          align-items: center;
          padding: 10px;
          margin: 5px 0;
          background-color: var(--vscode-list-hoverBackground);
          border-radius: 4px;
        }
        .objective-number {
          font-weight: bold;
          margin-right: 10px;
          color: var(--vscode-textLink-foreground);
        }
        .objective-text {
          flex: 1;
        }
        .objective-type {
          font-size: 0.9em;
          color: var(--vscode-descriptionForeground);
          background-color: var(--vscode-badge-background);
          padding: 2px 8px;
          border-radius: 10px;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }
        .stat-card {
          background-color: var(--vscode-editor-inactiveSelectionBackground);
          padding: 15px;
          border-radius: 5px;
        }
        .stat-value {
          font-size: 1.5em;
          font-weight: bold;
          color: var(--vscode-textLink-foreground);
        }
      </style>
    </head>
    <body>
      <h1>Objective Report</h1>
      
      <div class="summary">
        <h2>Summary</h2>
        <p>Total objectives: ${objectives.length}</p>
      </div>
      
      <h2>Objectives</h2>
      <div class="objectives-list">
        ${objectiveHtml}
      </div>
      
      <div class="stats">
        ${
          analysis.resources.total > 0
            ? `
          <div class="stat-card">
            <h3>Resources Required</h3>
            <div>Crystals: <span class="stat-value">${analysis.resources.crystals}</span></div>
            <div>Ore: <span class="stat-value">${analysis.resources.ore}</span></div>
            <div>Studs: <span class="stat-value">${analysis.resources.studs}</span></div>
          </div>
        `
            : ''
        }
        
        ${
          analysis.buildings.length > 0
            ? `
          <div class="stat-card">
            <h3>Buildings to Construct</h3>
            ${analysis.buildings.map((b: string) => `<div>• ${formatBuildingName(b)}</div>`).join('')}
          </div>
        `
            : ''
        }
        
        ${
          analysis.locations.length > 0
            ? `
          <div class="stat-card">
            <h3>Locations to Discover</h3>
            ${analysis.locations.map((l: { x: number; y: number; description: string }) => `<div>• [${l.x}, ${l.y}] - ${l.description}</div>`).join('')}
          </div>
        `
            : ''
        }
      </div>
    </body>
    </html>`;
}
