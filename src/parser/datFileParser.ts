import {
  DatFile,
  InfoSection,
  Coordinates,
  Entity,
  EntityPropertyValue,
  Objective,
  ScriptSection,
  ScriptEvent,
  ScriptVariableValue,
  DatParseError,
  SectionInfo,
  BiomeType,
  BuildingType,
} from '../types/datFileTypes';

export class DatFileParser {
  private lines: string[];
  private sections: Map<string, SectionInfo>;

  constructor(content: string) {
    this.lines = content.split(/\r?\n/);
    this.sections = new Map();
    this.parseSections();
  }

  /**
   * Parse sections from the file
   */
  private parseSections(): void {
    let currentSection: SectionInfo | null = null;
    let braceDepth = 0;
    let sectionContent: string[] = [];

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const trimmed = line.trim();

      // Check for section start
      const sectionMatch = trimmed.match(/^(\w+)\s*\{$/);
      if (sectionMatch && braceDepth === 0) {
        currentSection = {
          name: sectionMatch[1],
          startLine: i,
          endLine: -1,
          content: '',
        };
        braceDepth++;
        sectionContent = [];
        continue;
      }

      // Track braces
      for (const char of trimmed) {
        if (char === '{') {
          braceDepth++;
        }
        if (char === '}') {
          braceDepth--;
        }
      }

      // Check for section end
      if (currentSection && braceDepth === 0 && trimmed.includes('}')) {
        currentSection.endLine = i;
        currentSection.content = sectionContent.join('\n');
        this.sections.set(currentSection.name, currentSection);
        currentSection = null;
      } else if (currentSection && braceDepth > 0) {
        // Add content line (excluding opening and closing braces)
        if (!trimmed.match(/^[{}]\s*$/)) {
          sectionContent.push(line);
        }
      }
    }
  }

  /**
   * Parse the complete DAT file
   */
  public parse(): DatFile {
    const result: Partial<DatFile> = {};

    // Parse each section
    for (const [name, section] of this.sections) {
      switch (name) {
        case 'comments':
          result.comments = this.parseComments(section);
          break;
        case 'info':
          result.info = this.parseInfo(section);
          break;
        case 'tiles':
          result.tiles = this.parseGrid(section);
          break;
        case 'height':
          result.height = this.parseGrid(section);
          break;
        case 'resources':
          result.resources = this.parseResources(section);
          break;
        case 'objectives':
          result.objectives = this.parseObjectives(section);
          break;
        case 'buildings':
          result.buildings = this.parseEntities(section);
          break;
        case 'vehicles':
          result.vehicles = this.parseEntities(section);
          break;
        case 'creatures':
          result.creatures = this.parseEntities(section);
          break;
        case 'miners':
          result.miners = this.parseEntities(section);
          break;
        case 'blocks':
          result.blocks = this.parseGrid(section);
          break;
        case 'script':
          result.script = this.parseScript(section);
          break;
        case 'briefing':
          result.briefing = section.content.trim();
          break;
        case 'briefingsuccess':
          result.briefingsuccess = section.content.trim();
          break;
        case 'briefingfailure':
          result.briefingfailure = section.content.trim();
          break;
        case 'landslidefrequency':
          result.landslidefrequency = this.parseGrid(section);
          break;
        case 'lavaspread':
          result.lavaspread = this.parseGrid(section);
          break;
      }
    }

    // Validate required sections
    if (!result.info) {
      throw new DatParseError('Missing required info section', 0, 0);
    }
    if (!result.tiles) {
      throw new DatParseError('Missing required tiles section', 0, 0);
    }
    if (!result.height) {
      throw new DatParseError('Missing required height section', 0, 0);
    }

    return result as DatFile;
  }

  /**
   * Parse comments section
   */
  private parseComments(section: SectionInfo): string[] {
    return section.content.split('\n').filter(line => line.trim().length > 0);
  }

  /**
   * Parse info section
   */
  private parseInfo(section: SectionInfo): InfoSection {
    const info: Partial<InfoSection> = {};
    const lines = section.content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) {
        continue;
      }

      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      switch (key.toLowerCase()) {
        case 'rowcount':
          info.rowcount = parseInt(value);
          break;
        case 'colcount':
          info.colcount = parseInt(value);
          break;
        case 'camerapos':
          info.camerapos = this.parseCoordinates(value);
          break;
        case 'camerazoom':
          info.camerazoom = parseFloat(value);
          break;
        case 'biome':
          info.biome = value as BiomeType;
          break;
        case 'creator':
          info.creator = value;
          break;
        case 'levelname':
          info.levelname = value;
          break;
        case 'version':
          info.version = value;
          break;
        case 'opencaves':
          info.opencaves = value;
          break;
        case 'oxygen':
          info.oxygen = parseFloat(value);
          break;
        case 'initialcrystals':
          info.initialcrystals = parseInt(value);
          break;
        case 'initialore':
          info.initialore = parseInt(value);
          break;
        case 'spiderrate':
          info.spiderrate = parseInt(value);
          break;
        case 'spidermin':
          info.spidermin = parseInt(value);
          break;
        case 'spidermax':
          info.spidermax = parseInt(value);
          break;
        case 'erosioninitialwaittime':
          info.erosioninitialwaittime = parseFloat(value);
          break;
        case 'erosionscale':
          info.erosionscale = parseFloat(value);
          break;
      }
    }

    if (!info.rowcount || !info.colcount) {
      throw new DatParseError(
        'Missing required rowcount or colcount in info section',
        section.startLine,
        0,
        'info'
      );
    }

    return info as InfoSection;
  }

  /**
   * Parse a grid section (tiles, height, blocks, etc.)
   */
  private parseGrid(section: SectionInfo): number[][] {
    const grid: number[][] = [];
    const lines = section.content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      // Remove trailing comma and split
      const values = trimmed.replace(/,\s*$/, '').split(',');
      const row: number[] = [];

      for (const value of values) {
        const num = parseInt(value.trim());
        if (!isNaN(num)) {
          row.push(num);
        }
      }

      if (row.length > 0) {
        grid.push(row);
      }
    }

    return grid;
  }

  /**
   * Parse resources section
   */
  private parseResources(section: SectionInfo): { crystals?: number[][]; ore?: number[][] } {
    const resources: { crystals?: number[][]; ore?: number[][] } = {};
    const lines = section.content.split('\n');
    let currentSubsection: 'crystals' | 'ore' | null = null;
    let currentGrid: number[][] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === 'crystals:') {
        if (currentSubsection && currentGrid.length > 0) {
          resources[currentSubsection] = currentGrid;
        }
        currentSubsection = 'crystals';
        currentGrid = [];
      } else if (trimmed === 'ore:') {
        if (currentSubsection && currentGrid.length > 0) {
          resources[currentSubsection] = currentGrid;
        }
        currentSubsection = 'ore';
        currentGrid = [];
      } else if (trimmed && currentSubsection) {
        // Parse grid line
        const values = trimmed.replace(/,\s*$/, '').split(',');
        const row: number[] = [];

        for (const value of values) {
          const num = parseInt(value.trim());
          if (!isNaN(num)) {
            row.push(num);
          }
        }

        if (row.length > 0) {
          currentGrid.push(row);
        }
      }
    }

    // Add last subsection
    if (currentSubsection && currentGrid.length > 0) {
      resources[currentSubsection] = currentGrid;
    }

    return resources;
  }

  /**
   * Parse objectives section
   */
  private parseObjectives(section: SectionInfo): Objective[] {
    const objectives: Objective[] = [];
    const lines = section.content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      // Resources objective
      if (trimmed.startsWith('resources:')) {
        const values = trimmed.substring('resources:'.length).trim().split(',');
        if (values.length >= 3) {
          objectives.push({
            type: 'resources',
            crystals: parseInt(values[0]),
            ore: parseInt(values[1]),
            studs: parseInt(values[2]),
          });
        }
      }
      // Building objective
      else if (trimmed.startsWith('building:')) {
        objectives.push({
          type: 'building',
          building: trimmed.substring('building:'.length).trim() as BuildingType,
        });
      }
      // Discover tile objective
      else if (trimmed.startsWith('discovertile:')) {
        const match = trimmed.match(/discovertile:\s*(\d+),(\d+)\/(.+)/);
        if (match) {
          objectives.push({
            type: 'discovertile',
            x: parseInt(match[1]),
            y: parseInt(match[2]),
            description: match[3],
          });
        }
      }
      // Variable objective
      else if (trimmed.startsWith('variable:')) {
        const match = trimmed.match(/variable:(.+?)\/(.+)/);
        if (match) {
          objectives.push({
            type: 'variable',
            condition: match[1],
            description: match[2],
          });
        }
      }
      // Find miner objective
      else if (trimmed.startsWith('findminer:')) {
        objectives.push({
          type: 'findminer',
          minerID: parseInt(trimmed.substring('findminer:'.length).trim()),
        });
      }
    }

    return objectives;
  }

  /**
   * Parse entities section (buildings, vehicles, creatures, miners)
   */
  private parseEntities(section: SectionInfo): Entity[] {
    const entities: Entity[] = [];
    const lines = section.content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      // Split by comma but preserve commas within coordinate strings
      const parts = this.smartSplit(trimmed, ',');
      if (parts.length < 2) {
        continue;
      }

      const type = parts[0];
      const coordString = parts[1];
      const coordinates = this.parseCoordinates(coordString);

      const entity: Entity = { type, coordinates };

      // Parse additional properties
      if (parts.length > 2) {
        entity.properties = {};
        for (let i = 2; i < parts.length; i++) {
          const prop = parts[i].trim();
          const equalIndex = prop.indexOf('=');
          if (equalIndex > -1) {
            const key = prop.substring(0, equalIndex);
            const value = prop.substring(equalIndex + 1);
            entity.properties[key] = this.parsePropertyValue(value);
          }
        }
      }

      entities.push(entity);
    }

    return entities;
  }

  /**
   * Parse script section
   */
  private parseScript(section: SectionInfo): ScriptSection {
    const script: ScriptSection = {
      variables: new Map(),
      events: [],
    };

    const lines = section.content.split('\n');
    let currentEvent: ScriptEvent | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      // Variable declaration
      if (trimmed.match(/^(int|string|float|bool)\s+\w+/)) {
        const match = trimmed.match(/^(int|string|float|bool)\s+(\w+)\s*=\s*(.+)$/);
        if (match) {
          const [, type, name, value] = match;
          script.variables.set(name, this.parseScriptValue(value, type));
        }
      }
      // Event declaration
      else if (trimmed.endsWith('::;')) {
        if (currentEvent) {
          script.events.push(currentEvent);
        }
        const name = trimmed.slice(0, -3);
        currentEvent = { name, commands: [] };
      }
      // Conditional event trigger
      else if (trimmed.match(/^\(.+\)\w+;$/)) {
        const match = trimmed.match(/^\((.+)\)(\w+);$/);
        if (match && currentEvent) {
          currentEvent.condition = match[1];
        }
      }
      // Command
      else if (trimmed.includes(':') && trimmed.endsWith(';')) {
        const colonIndex = trimmed.indexOf(':');
        const command = trimmed.substring(0, colonIndex);
        const params = trimmed.substring(colonIndex + 1, trimmed.length - 1);

        if (currentEvent) {
          currentEvent.commands.push({
            command,
            parameters: this.parseScriptParameters(params),
          });
        }
      }
    }

    // Add last event
    if (currentEvent) {
      script.events.push(currentEvent);
    }

    return script;
  }

  /**
   * Parse coordinates string
   */
  private parseCoordinates(str: string): Coordinates {
    const coords: Coordinates = {
      translation: { x: 0, y: 0, z: 0 },
      rotation: { p: 0, y: 0, r: 0 },
      scale: { x: 1, y: 1, z: 1 },
    };

    // Parse Translation
    const transMatch = str.match(/Translation:\s*X=([\d.-]+)\s*Y=([\d.-]+)\s*Z=([\d.-]+)/);
    if (transMatch) {
      coords.translation.x = parseFloat(transMatch[1]);
      coords.translation.y = parseFloat(transMatch[2]);
      coords.translation.z = parseFloat(transMatch[3]);
    }

    // Parse Rotation
    const rotMatch = str.match(/Rotation:\s*P=([\d.-]+)\s*Y=([\d.-]+)\s*R=([\d.-]+)/);
    if (rotMatch) {
      coords.rotation.p = parseFloat(rotMatch[1]);
      coords.rotation.y = parseFloat(rotMatch[2]);
      coords.rotation.r = parseFloat(rotMatch[3]);
    }

    // Parse Scale
    const scaleMatch = str.match(/Scale\s*X=([\d.-]+)\s*Y=([\d.-]+)\s*Z=([\d.-]+)/);
    if (scaleMatch) {
      coords.scale.x = parseFloat(scaleMatch[1]);
      coords.scale.y = parseFloat(scaleMatch[2]);
      coords.scale.z = parseFloat(scaleMatch[3]);
    }

    return coords;
  }

  /**
   * Smart split that preserves coordinate strings
   */
  private smartSplit(str: string, delimiter: string): string[] {
    const results: string[] = [];
    let current = '';
    let depth = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (char === 'T' && str.slice(i).startsWith('Translation:')) {
        depth++;
      } else if (char === 'S' && str.slice(i).startsWith('Scale') && depth > 0) {
        // Check if we're at the end of a coordinate string
        const remaining = str.slice(i);
        const scaleEnd = remaining.search(/Scale\s*X=[\d.-]+\s*Y=[\d.-]+\s*Z=[\d.-]+/);
        if (scaleEnd !== -1) {
          const fullMatch = remaining.match(/Scale\s*X=[\d.-]+\s*Y=[\d.-]+\s*Z=[\d.-]+/);
          if (fullMatch) {
            current += fullMatch[0];
            i += fullMatch[0].length - 1;
            depth--;
            continue;
          }
        }
      }

      if (char === delimiter && depth === 0) {
        results.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current) {
      results.push(current.trim());
    }

    return results;
  }

  /**
   * Parse property value
   */
  private parsePropertyValue(value: string): EntityPropertyValue {
    if (value === 'true' || value === 'True') {
      return true;
    }
    if (value === 'false' || value === 'False') {
      return false;
    }
    if (!isNaN(Number(value))) {
      return Number(value);
    }
    return value;
  }

  /**
   * Parse script value based on type
   */
  private parseScriptValue(value: string, type: string): ScriptVariableValue {
    value = value.trim();

    switch (type) {
      case 'int':
        return parseInt(value);
      case 'float':
        return parseFloat(value);
      case 'bool':
        return value === 'true';
      case 'string':
        // Remove quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          return value.slice(1, -1);
        }
        return value;
      default:
        return value;
    }
  }

  /**
   * Parse script command parameters
   */
  private parseScriptParameters(params: string): string[] {
    if (!params) {
      return [];
    }

    // Handle different parameter formats
    if (params.includes(':')) {
      // Complex format like emerge parameters
      return params.split(':').map(p => p.trim());
    } else {
      // Simple comma-separated
      return params.split(',').map(p => p.trim());
    }
  }

  /**
   * Get all sections
   */
  public getSections(): Map<string, SectionInfo> {
    return this.sections;
  }

  /**
   * Get section at position
   */
  public getSectionAtPosition(line: number): SectionInfo | undefined {
    for (const section of this.sections.values()) {
      if (line >= section.startLine && line <= section.endLine) {
        return section;
      }
    }
    return undefined;
  }

  /**
   * Get a section by name
   */
  public getSection(name: string): SectionInfo | undefined {
    return this.sections.get(name);
  }

  /**
   * Get tiles as a 2D array
   */
  public getTileArray(): number[][] | null {
    const tilesSection = this.getSection('tiles');
    if (!tilesSection) {
      return null;
    }

    try {
      return this.parseGrid(tilesSection);
    } catch (error) {
      return null;
    }
  }
}
