import { ValidationError } from '../types/datFileTypes';
import {
  VisualBlocksParser,
  VisualBlock,
  BlockWire,
  TRIGGER_BLOCKS,
  EVENT_BLOCKS,
} from '../parser/visualBlocksParser';

export class VisualBlocksValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];

  /**
   * Validate visual blocks content
   */
  public validate(blocksContent: string, startLine: number = 0): ValidationError[] {
    this.errors = [];
    this.warnings = [];

    const parser = new VisualBlocksParser(blocksContent, startLine);
    const blocksSection = parser.parse();
    const parserErrors = parser.getErrors();

    // Add parser errors
    for (const error of parserErrors) {
      this.addError(error, 0, 0, 'blocks');
    }

    // Run validation
    const validationErrors = parser.validate();
    for (const error of validationErrors) {
      this.addWarning(error, 0, 0, 'blocks');
    }

    // Additional validations
    this.validateBlockLocations(blocksSection.blocks);
    this.validateWireConnections(blocksSection.wires, blocksSection.blocks);
    this.validateBlockParameters(blocksSection.blocks);

    return [...this.errors, ...this.warnings];
  }

  /**
   * Validate block locations
   */
  private validateBlockLocations(blocks: VisualBlock[]): void {
    // Check for blocks at same location
    const locations = new Map<string, VisualBlock[]>();

    for (const block of blocks) {
      const key = `${block.row},${block.col}`;
      if (!locations.has(key)) {
        locations.set(key, []);
      }
      locations.get(key)!.push(block);
    }

    // Report overlapping blocks
    for (const [location, blocksAtLocation] of locations) {
      if (blocksAtLocation.length > 1) {
        const blockIds = blocksAtLocation.map(b => b.id).join(', ');
        this.addWarning(
          `Multiple blocks (${blockIds}) at location ${location}`,
          blocksAtLocation[0].line || 0,
          0,
          'blocks'
        );
      }
    }
  }

  /**
   * Validate wire connections
   */
  private validateWireConnections(wires: BlockWire[], blocks: VisualBlock[]): void {
    const blockMap = new Map(blocks.map(b => [b.id, b]));

    for (const wire of wires) {
      const fromBlock = blockMap.get(wire.from);
      const toBlock = blockMap.get(wire.to);

      if (!fromBlock || !toBlock) {
        continue; // Already reported by parser
      }

      // Validate wire types
      if (wire.type === 'backup' && !fromBlock.name.includes('Emerge')) {
        this.addError(
          `Backup wire (~) from block ${wire.from} invalid - only emerge blocks can use backup wires`,
          wire.line || 0,
          0,
          'blocks'
        );
      }

      // Check for self-connections
      if (wire.from === wire.to) {
        this.addError(`Block ${wire.from} connects to itself`, wire.line || 0, 0, 'blocks');
      }
    }

    // Check for circular dependencies (simple check)
    for (const block of blocks) {
      const visited = new Set<number>();
      if (this.hasCircularDependency(block.id, blockMap, wires, visited)) {
        this.addWarning(
          `Potential circular dependency detected starting from block ${block.id}`,
          block.line || 0,
          0,
          'blocks'
        );
      }
    }
  }

  /**
   * Check for circular dependencies
   */
  private hasCircularDependency(
    blockId: number,
    blockMap: Map<number, VisualBlock>,
    wires: BlockWire[],
    visited: Set<number>,
    path: Set<number> = new Set()
  ): boolean {
    if (path.has(blockId)) {
      return true; // Found cycle
    }

    if (visited.has(blockId)) {
      return false; // Already checked this path
    }

    visited.add(blockId);
    path.add(blockId);

    // Check all outgoing connections
    const outgoing = wires.filter(w => w.from === blockId);
    for (const wire of outgoing) {
      if (this.hasCircularDependency(wire.to, blockMap, wires, visited, path)) {
        return true;
      }
    }

    path.delete(blockId);
    return false;
  }

  /**
   * Validate block parameters
   */
  private validateBlockParameters(blocks: VisualBlock[]): void {
    for (const block of blocks) {
      const blockDefs = block.type === 'trigger' ? TRIGGER_BLOCKS : EVENT_BLOCKS;
      const blockDef = blockDefs[block.name as keyof typeof blockDefs];

      if (!blockDef) {
        continue; // Already reported by parser
      }

      // Validate specific parameters based on block type
      switch (block.name) {
        case 'EventEmergeCreature':
          this.validateEmergeBlock(block);
          break;

        case 'EventPlace':
          this.validatePlaceBlock(block);
          break;

        case 'TriggerTimer':
          this.validateTimerBlock(block);
          break;

        case 'EventRandomSpawnSetup':
          this.validateSpawnSetupBlock(block);
          break;
      }
    }
  }

  /**
   * Validate emerge block parameters
   */
  private validateEmergeBlock(block: VisualBlock): void {
    const { direction, type, radius } = block.parameters;

    if (
      direction &&
      typeof direction === 'string' &&
      !['N', 'S', 'E', 'W', 'A'].includes(direction)
    ) {
      this.addError(
        `Block ${block.id}: Invalid emerge direction '${direction}' (must be N/S/E/W/A)`,
        block.line || 0,
        0,
        'blocks'
      );
    }

    if (type && typeof type === 'string' && !this.isValidCreatureType(type)) {
      this.addWarning(
        `Block ${block.id}: Unknown creature type '${type}'`,
        block.line || 0,
        0,
        'blocks'
      );
    }

    if (radius && typeof radius === 'number' && (radius < 0 || radius > 10)) {
      this.addWarning(
        `Block ${block.id}: Emerge radius ${radius} seems unusually ${radius < 0 ? 'small' : 'large'}`,
        block.line || 0,
        0,
        'blocks'
      );
    }
  }

  /**
   * Validate place block parameters
   */
  private validatePlaceBlock(block: VisualBlock): void {
    const { tileID } = block.parameters;

    if (tileID !== undefined && typeof tileID === 'number') {
      if (tileID < 0 || tileID > 255) {
        this.addError(
          `Block ${block.id}: Invalid tile ID ${tileID} (must be 0-255)`,
          block.line || 0,
          0,
          'blocks'
        );
      }
    }
  }

  /**
   * Validate timer block parameters
   */
  private validateTimerBlock(block: VisualBlock): void {
    const { delay, min, max } = block.parameters;

    if (delay !== undefined && typeof delay === 'number' && delay < 0) {
      this.addError(
        `Block ${block.id}: Timer delay cannot be negative`,
        block.line || 0,
        0,
        'blocks'
      );
    }

    if (
      min !== undefined &&
      max !== undefined &&
      typeof min === 'number' &&
      typeof max === 'number' &&
      min > max
    ) {
      this.addWarning(
        `Block ${block.id}: Timer min (${min}) is greater than max (${max})`,
        block.line || 0,
        0,
        'blocks'
      );
    }
  }

  /**
   * Validate spawn setup block parameters
   */
  private validateSpawnSetupBlock(block: VisualBlock): void {
    const { type, minTime, maxTime, minWave, maxWave, minSpawn, maxSpawn } = block.parameters;

    if (type && typeof type === 'string' && !this.isValidCreatureType(type)) {
      this.addWarning(
        `Block ${block.id}: Unknown creature type '${type}'`,
        block.line || 0,
        0,
        'blocks'
      );
    }

    // Validate min/max pairs
    if (minTime !== undefined && maxTime !== undefined && minTime > maxTime) {
      this.addWarning(
        `Block ${block.id}: Min time (${minTime}) greater than max time (${maxTime})`,
        block.line || 0,
        0,
        'blocks'
      );
    }

    if (minWave !== undefined && maxWave !== undefined && minWave > maxWave) {
      this.addWarning(
        `Block ${block.id}: Min wave (${minWave}) greater than max wave (${maxWave})`,
        block.line || 0,
        0,
        'blocks'
      );
    }

    if (minSpawn !== undefined && maxSpawn !== undefined && minSpawn > maxSpawn) {
      this.addWarning(
        `Block ${block.id}: Min spawn (${minSpawn}) greater than max spawn (${maxSpawn})`,
        block.line || 0,
        0,
        'blocks'
      );
    }
  }

  /**
   * Check if creature type is valid
   */
  private isValidCreatureType(type: string): boolean {
    const validTypes = [
      'CreatureSmallSpider_C',
      'CreatureRockMonster_C',
      'CreatureLavaMonster_C',
      'CreatureIceMonster_C',
      'CreatureSlimySlug_C',
      'CreatureBat_C',
    ];
    return validTypes.includes(type);
  }

  private addError(message: string, line: number, column: number, section: string): void {
    this.errors.push({
      message,
      line,
      column,
      severity: 'error',
      section,
    });
  }

  private addWarning(message: string, line: number, column: number, section: string): void {
    this.warnings.push({
      message,
      line,
      column,
      severity: 'warning',
      section,
    });
  }
}
