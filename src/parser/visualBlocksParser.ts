/**
 * Parser for Visual Blocks system
 * Based on game documentation
 */

export interface VisualBlock {
  id: number;
  type: 'trigger' | 'event';
  name: string;
  row: number;
  col: number;
  parameters: Record<string, string | number | boolean>;
  line?: number;
}

export interface BlockWire {
  from: number;
  to: number;
  type: 'normal' | 'backup' | 'random';
  line?: number;
}

export interface BlocksSection {
  blocks: VisualBlock[];
  wires: BlockWire[];
}

// Block type definitions
export const TRIGGER_BLOCKS = {
  TriggerTimer: {
    params: ['row', 'col', 'name', 'delay', 'max', 'min'],
    description: 'Fires periodically at random intervals',
  },
  TriggerEnter: {
    params: ['row', 'col', 'cooldown', 'miners', 'vehicles', 'creature'],
    description: 'Fires when units enter a tile',
  },
  TriggerChange: {
    params: ['row', 'col', 'cooldown', 'tileID'],
    description: 'Fires when a tile changes',
  },
  TriggerEventChain: {
    params: ['row', 'col', 'cooldown', 'name'],
    description: 'Callable from text script',
  },
} as const;

export const EVENT_BLOCKS = {
  EventEmergeCreature: {
    params: ['row', 'col', 'direction', 'cooldown', 'type', 'radius'],
    description: 'Spawns a creature from walls',
  },
  EventDrill: {
    params: ['row', 'col'],
    description: 'Drills a wall tile',
  },
  EventPlace: {
    params: ['row', 'col', 'cooldown', 'tileID'],
    description: 'Changes a tile type',
  },
  EventCallEvent: {
    params: ['row', 'col', 'cooldown', 'function'],
    description: 'Executes script function',
  },
  EventRelay: {
    params: ['row', 'col', 'cooldown', 'delay'],
    description: 'Delays execution flow',
  },
  EventUnitFlee: {
    params: ['row', 'col', 'anywhere'],
    description: 'Makes last spawned creature flee',
  },
  EventRandomSpawnSetup: {
    params: [
      'row',
      'col',
      'type',
      'maxTime',
      'minTime',
      'maxWave',
      'minWave',
      'maxSpawn',
      'minSpawn',
    ],
    description: 'Configures creature waves',
  },
  EventRandomSpawnStart: {
    params: ['row', 'col', 'type'],
    description: 'Start spawning',
  },
  EventRandomSpawnStop: {
    params: ['row', 'col', 'type'],
    description: 'Stop spawning',
  },
} as const;

export class VisualBlocksParser {
  private blocks: VisualBlock[] = [];
  private wires: BlockWire[] = [];
  private errors: string[] = [];

  constructor(
    private content: string,
    private startLine: number = 0
  ) {}

  /**
   * Parse blocks section content
   */
  public parse(): BlocksSection {
    const lines = this.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and comments
      if (!line || line.startsWith('#') || line.startsWith(';')) {
        continue;
      }

      // Parse block definition (e.g., 1/TriggerTimer:10,10,MyTimer,30.0,60.0,30.0)
      const blockMatch = line.match(/^(\d+)\/(\w+):(.*)$/);
      if (blockMatch) {
        this.parseBlock(blockMatch, i);
        continue;
      }

      // Parse wire definition (e.g., 1-2, 1~2, 1?2)
      const wireMatch = line.match(/^(\d+)([-~?])(\d+)$/);
      if (wireMatch) {
        this.parseWire(wireMatch, i);
        continue;
      }

      // Unknown line format
      if (line && !line.startsWith('}')) {
        this.errors.push(`Unknown blocks syntax at line ${this.startLine + i + 1}: ${line}`);
      }
    }

    return {
      blocks: this.blocks,
      wires: this.wires,
    };
  }

  /**
   * Parse a block definition
   */
  private parseBlock(match: RegExpMatchArray, lineIndex: number): void {
    const [, idStr, blockType, paramsStr] = match;
    const id = parseInt(idStr);
    const params = paramsStr.split(',').map(p => p.trim());

    // Determine if it's a trigger or event block
    const isTrigger = blockType.startsWith('Trigger');
    const type: 'trigger' | 'event' = isTrigger ? 'trigger' : 'event';

    // Get block definition
    const blockDefs = isTrigger ? TRIGGER_BLOCKS : EVENT_BLOCKS;
    const blockDef = (
      blockDefs as Record<string, { params: readonly string[]; description: string }>
    )[blockType];

    if (!blockDef) {
      this.errors.push(
        `Unknown block type '${blockType}' at line ${this.startLine + lineIndex + 1}`
      );
      return;
    }

    // Parse parameters
    const blockParams: Record<string, string | number | boolean> = {};
    const expectedParams = blockDef.params;

    // Basic validation
    if (params.length < 2) {
      this.errors.push(
        `Block ${id} missing required row,col parameters at line ${this.startLine + lineIndex + 1}`
      );
      return;
    }

    // Parse row and col (always first two params)
    const row = parseInt(params[0]);
    const col = parseInt(params[1]);

    if (isNaN(row) || isNaN(col)) {
      this.errors.push(
        `Block ${id} has invalid row,col coordinates at line ${this.startLine + lineIndex + 1}`
      );
      return;
    }

    // Parse remaining parameters
    for (let i = 2; i < expectedParams.length && i < params.length; i++) {
      const paramName = expectedParams[i];
      const paramValue = params[i];

      // Parse based on expected type
      if (paramName === 'miners' || paramName === 'vehicles' || paramName === 'anywhere') {
        // Boolean parameters
        blockParams[paramName] = paramValue.toLowerCase() === 'true';
      } else if (
        paramName === 'cooldown' ||
        paramName === 'delay' ||
        paramName.includes('Time') ||
        paramName === 'radius'
      ) {
        // Numeric parameters
        blockParams[paramName] = parseFloat(paramValue);
      } else if (paramName === 'tileID') {
        // Tile ID parameter
        blockParams[paramName] = parseInt(paramValue);
      } else {
        // String parameters (names, types, etc.)
        blockParams[paramName] = paramValue;
      }
    }

    this.blocks.push({
      id,
      type,
      name: blockType,
      row,
      col,
      parameters: blockParams,
      line: this.startLine + lineIndex + 1,
    });
  }

  /**
   * Parse a wire definition
   */
  private parseWire(match: RegExpMatchArray, lineIndex: number): void {
    const [, fromStr, wireType, toStr] = match;
    const from = parseInt(fromStr);
    const to = parseInt(toStr);

    // Validate block IDs exist
    const fromBlock = this.blocks.find(b => b.id === from);
    const toBlock = this.blocks.find(b => b.id === to);

    if (!fromBlock) {
      this.errors.push(
        `Wire references unknown block ${from} at line ${this.startLine + lineIndex + 1}`
      );
    }
    if (!toBlock) {
      this.errors.push(
        `Wire references unknown block ${to} at line ${this.startLine + lineIndex + 1}`
      );
    }

    // Determine wire type
    let type: 'normal' | 'backup' | 'random' = 'normal';
    switch (wireType) {
      case '-':
        type = 'normal';
        break;
      case '~':
        type = 'backup';
        // Validate backup wires only from emerge blocks
        if (fromBlock && !fromBlock.name.includes('Emerge')) {
          this.errors.push(
            `Backup wire (~) can only be used from emerge blocks at line ${this.startLine + lineIndex + 1}`
          );
        }
        break;
      case '?':
        type = 'random';
        break;
    }

    this.wires.push({
      from,
      to,
      type,
      line: this.startLine + lineIndex + 1,
    });
  }

  /**
   * Get parsing errors
   */
  public getErrors(): string[] {
    return this.errors;
  }

  /**
   * Validate blocks section
   */
  public validate(): string[] {
    const validationErrors: string[] = [];

    // Check for duplicate block IDs
    const blockIds = new Set<number>();
    for (const block of this.blocks) {
      if (blockIds.has(block.id)) {
        validationErrors.push(`Duplicate block ID ${block.id}`);
      }
      blockIds.add(block.id);
    }

    // Check for orphaned blocks (no incoming or outgoing wires)
    for (const block of this.blocks) {
      const hasIncoming = this.wires.some(w => w.to === block.id);
      const hasOutgoing = this.wires.some(w => w.from === block.id);

      // Trigger blocks don't need incoming wires
      if (block.type === 'event' && !hasIncoming && !hasOutgoing) {
        validationErrors.push(`Event block ${block.id} (${block.name}) has no connections`);
      }
    }

    // Validate random wires
    const randomSources = new Map<number, number[]>();
    for (const wire of this.wires) {
      if (wire.type === 'random') {
        if (!randomSources.has(wire.from)) {
          randomSources.set(wire.from, []);
        }
        randomSources.get(wire.from)!.push(wire.to);
      }
    }

    // Random wires should have multiple targets
    for (const [source, targets] of randomSources) {
      if (targets.length < 2) {
        validationErrors.push(
          `Block ${source} has random wire(s) but only ${targets.length} target(s) - random wires work best with multiple targets`
        );
      }
    }

    return [...this.errors, ...validationErrors];
  }
}
