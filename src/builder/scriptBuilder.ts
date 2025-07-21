/**
 * Type-safe script builder inspired by groundhog
 * Provides a declarative API for building Manic Miners scripts
 */

export type VariableType = 'int' | 'float' | 'bool' | 'string' | 'timer' | 'arrow';

export interface Variable {
  name: string;
  type: VariableType;
  value: string | number | boolean;
}

export interface EventChain {
  name: string;
  condition?: string;
  commands: Command[];
}

export interface Command {
  command: string;
  parameters?: (string | number)[];
}

export interface Timer {
  name: string;
  duration: number;
  event?: string;
}

/**
 * ScriptBuilder provides a type-safe API for building scripts
 */
export class ScriptBuilder {
  private variables = new Map<string, Variable>();
  private events = new Map<string, EventChain>();
  private usedNames = new Set<string>();
  private prefix: string;
  private eventCounter = 0;

  constructor(prefix: string = 'sb') {
    this.prefix = prefix;
  }

  /**
   * Generate a unique variable name
   */
  private uniqueVarName(base: string): string {
    let name = `${this.prefix}${base}`;
    let counter = 0;

    while (this.usedNames.has(name)) {
      counter++;
      name = `${this.prefix}${base}${counter}`;
    }

    this.usedNames.add(name);
    return name;
  }

  /**
   * Generate a unique event name
   */
  private uniqueEventName(base: string = 'Event'): string {
    let name = `${this.prefix}${base}${this.eventCounter++}`;

    while (this.usedNames.has(name)) {
      this.eventCounter++;
      name = `${this.prefix}${base}${this.eventCounter}`;
    }

    this.usedNames.add(name);
    return name;
  }

  /**
   * Declare a variable
   */
  public declareVar(type: VariableType, name: string, value: string | number | boolean): string {
    const varName = this.uniqueVarName(name);
    this.variables.set(varName, { name: varName, type, value });
    return varName;
  }

  /**
   * Declare an integer variable
   */
  public int(name: string, value: number = 0): string {
    return this.declareVar('int', name, value);
  }

  /**
   * Declare a boolean variable
   */
  public bool(name: string, value: boolean = false): string {
    return this.declareVar('bool', name, value);
  }

  /**
   * Declare a timer
   */
  public timer(name: string, duration: number, event?: string): string {
    const timerName = this.uniqueVarName(name);
    const value = event ? `${duration},${event}` : duration.toString();
    this.variables.set(timerName, { name: timerName, type: 'timer', value });
    return timerName;
  }

  /**
   * Create an event chain
   */
  public event(name?: string): EventChainBuilder {
    const eventName = name ? this.uniqueEventName(name) : this.uniqueEventName();
    return new EventChainBuilder(this, eventName);
  }

  /**
   * Add an event chain
   */
  public addEvent(event: EventChain): void {
    // Check for duplicate commands and optimize
    const optimizedCommands = this.optimizeCommands(event.commands);
    this.events.set(event.name, { ...event, commands: optimizedCommands });
  }

  /**
   * Create a conditional event
   */
  public when(condition: string, eventName?: string): EventChainBuilder {
    const name = eventName || this.uniqueEventName();
    const builder = new EventChainBuilder(this, name);
    builder.condition(condition);
    return builder;
  }

  /**
   * Create a one-time event with mutex
   */
  public once(condition: string, eventName?: string): EventChainBuilder {
    const flagVar = this.bool(`${eventName || 'Once'}Done`, false);
    const name = eventName || this.uniqueEventName();
    const builder = new EventChainBuilder(this, name);
    builder.condition(`${condition} and ${flagVar}==false`);
    builder.cmd(`${flagVar}:true`);
    return builder;
  }

  /**
   * Create a state machine
   */
  public stateMachine(name: string, states: Record<string, number>): StateMachineBuilder {
    const stateVar = this.int(`${name}State`, 0);
    return new StateMachineBuilder(this, stateVar, states);
  }

  /**
   * Create a spawner pattern
   */
  public spawner(name: string): SpawnerBuilder {
    return new SpawnerBuilder(this, name);
  }

  /**
   * Optimize commands by detecting repeated sequences
   */
  private optimizeCommands(commands: Command[]): Command[] {
    if (commands.length < 4) {
      // Too short to optimize
      return commands;
    }

    // Find repeated sequences of at least 2 commands
    const sequences = new Map<string, { count: number; indices: number[] }>();

    for (let i = 0; i < commands.length - 1; i++) {
      for (let length = 2; length <= Math.min(5, commands.length - i); length++) {
        const sequence = commands.slice(i, i + length);
        const key = this.serializeSequence(sequence);

        if (!sequences.has(key)) {
          sequences.set(key, { count: 0, indices: [] });
        }

        const data = sequences.get(key)!;
        data.count++;
        data.indices.push(i);
      }
    }

    // Find sequences worth extracting (appear at least 3 times)
    const worthySequences = Array.from(sequences.entries())
      .filter(([, data]) => data.count >= 3)
      .sort((a, b) => {
        // Prioritize longer sequences with more occurrences
        const scoreA = a[1].count * a[0].split('|').length;
        const scoreB = b[1].count * b[0].split('|').length;
        return scoreB - scoreA;
      });

    if (worthySequences.length === 0) {
      return commands;
    }

    // For now, just return the original commands
    // In a full implementation, we would:
    // 1. Extract the repeated sequences to separate events
    // 2. Replace occurrences with 'call' commands
    // 3. Add the extracted events to the script
    return commands;
  }

  /**
   * Serialize a command sequence for comparison
   */
  private serializeSequence(commands: Command[]): string {
    return commands
      .map(cmd => {
        const params = cmd.parameters ? `:${cmd.parameters.join(',')}` : '';
        return `${cmd.command}${params}`;
      })
      .join('|');
  }

  /**
   * Build the final script
   */
  public build(): string {
    const lines: string[] = [];

    // Add variables
    this.variables.forEach(variable => {
      const valueStr =
        typeof variable.value === 'boolean'
          ? variable.value
            ? 'true'
            : 'false'
          : variable.value.toString();
      lines.push(`${variable.type} ${variable.name}=${valueStr}`);
    });

    if (this.variables.size > 0) {
      lines.push('');
    }

    // Add events
    this.events.forEach(event => {
      if (event.condition) {
        lines.push(`when(${event.condition})[${event.name}]`);
        lines.push('');
      }

      lines.push(`${event.name}::`);

      event.commands.forEach(cmd => {
        const params = cmd.parameters ? `:${cmd.parameters.join(',')}` : '';
        lines.push(`${cmd.command}${params};`);
      });

      lines.push('');
    });

    return lines.join('\n').trim();
  }
}

/**
 * Builder for event chains
 */
export class EventChainBuilder {
  private builder: ScriptBuilder;
  private eventChain: EventChain;

  constructor(builder: ScriptBuilder, name: string) {
    this.builder = builder;
    this.eventChain = {
      name,
      commands: [],
    };
  }

  /**
   * Set the condition for this event
   */
  public condition(condition: string): this {
    this.eventChain.condition = condition;
    return this;
  }

  /**
   * Add a command
   */
  public cmd(command: string, ...params: (string | number)[]): this {
    if (params.length > 0) {
      this.eventChain.commands.push({ command, parameters: params });
    } else {
      // Parse inline command format
      const match = command.match(/^(\w+)(?::(.+))?;?$/);
      if (match) {
        const [, cmd, paramStr] = match;
        const parameters = paramStr ? paramStr.split(',').map(p => p.trim()) : undefined;
        this.eventChain.commands.push({ command: cmd, parameters });
      } else {
        // Raw command
        this.eventChain.commands.push({ command });
      }
    }
    return this;
  }

  /**
   * Add a message command
   */
  public msg(message: string): this {
    return this.cmd('msg', message);
  }

  /**
   * Add an objective command
   */
  public objective(objective: string): this {
    return this.cmd('objective', objective);
  }

  /**
   * Add a wait command
   */
  public wait(seconds: number): this {
    return this.cmd('wait', seconds);
  }

  /**
   * Call another event
   */
  public call(eventName: string): this {
    return this.cmd('call', eventName);
  }

  /**
   * Add emerge command
   */
  public emerge(x: number, y: number, direction: string, creature: string, radius: number): this {
    return this.cmd('emerge', x, y, direction, creature, radius);
  }

  /**
   * Modify crystals
   */
  public crystals(amount: number): this {
    return this.cmd('crystals', amount);
  }

  /**
   * Modify ore
   */
  public ore(amount: number): this {
    return this.cmd('ore', amount);
  }

  /**
   * Win the level
   */
  public win(): this {
    return this.cmd('win');
  }

  /**
   * Lose the level
   */
  public lose(): this {
    return this.cmd('lose');
  }

  /**
   * Conditional execution
   */
  public if(condition: string, thenEvent: string, elseEvent?: string): this {
    if (elseEvent) {
      return this.cmd(`if(${condition})[${thenEvent}][${elseEvent}]`);
    } else {
      return this.cmd(`if(${condition})[${thenEvent}]`);
    }
  }

  /**
   * Build and add this event to the script
   */
  public build(): ScriptBuilder {
    this.builder.addEvent(this.eventChain);
    return this.builder;
  }
}

/**
 * Builder for state machines
 */
export class StateMachineBuilder {
  private builder: ScriptBuilder;
  private stateVar: string;
  private states: Record<string, number>;

  constructor(builder: ScriptBuilder, stateVar: string, states: Record<string, number>) {
    this.builder = builder;
    this.stateVar = stateVar;
    this.states = states;
  }

  /**
   * Add a state transition
   */
  public transition(fromState: string, toState: string, condition?: string): EventChainBuilder {
    const fromValue = this.states[fromState];
    const toValue = this.states[toState];

    if (fromValue === undefined || toValue === undefined) {
      throw new Error(`Invalid state: ${fromState} or ${toState}`);
    }

    const fullCondition = condition
      ? `${this.stateVar}==${fromValue} and ${condition}`
      : `${this.stateVar}==${fromValue}`;

    return this.builder.when(fullCondition).cmd(`${this.stateVar}:${toValue}`);
  }

  /**
   * Check if in a specific state
   */
  public inState(state: string): string {
    const value = this.states[state];
    if (value === undefined) {
      throw new Error(`Invalid state: ${state}`);
    }
    return `${this.stateVar}==${value}`;
  }
}

/**
 * Builder for spawner patterns
 */
export class SpawnerBuilder {
  private builder: ScriptBuilder;
  private name: string;
  private config: {
    creature?: string;
    minWave?: number;
    maxWave?: number;
    minTime?: number;
    maxTime?: number;
    emergePoints?: Array<{ x: number; y: number; direction: string }>;
    cooldown?: number;
    armCondition?: string;
  } = {};

  constructor(builder: ScriptBuilder, name: string) {
    this.builder = builder;
    this.name = name;
  }

  /**
   * Set creature type
   */
  public creature(type: string): this {
    this.config.creature = type;
    return this;
  }

  /**
   * Set wave size
   */
  public waveSize(min: number, max: number): this {
    this.config.minWave = min;
    this.config.maxWave = max;
    return this;
  }

  /**
   * Set spawn timing
   */
  public timing(minSeconds: number, maxSeconds: number): this {
    this.config.minTime = minSeconds;
    this.config.maxTime = maxSeconds;
    return this;
  }

  /**
   * Add emerge point
   */
  public emergeAt(x: number, y: number, direction: string = 'A'): this {
    if (!this.config.emergePoints) {
      this.config.emergePoints = [];
    }
    this.config.emergePoints.push({ x, y, direction });
    return this;
  }

  /**
   * Set cooldown
   */
  public cooldown(seconds: number): this {
    this.config.cooldown = seconds;
    return this;
  }

  /**
   * Set arm condition
   */
  public armWhen(condition: string): this {
    this.config.armCondition = condition;
    return this;
  }

  /**
   * Build the spawner
   */
  public build(): ScriptBuilder {
    if (
      !this.config.creature ||
      !this.config.emergePoints ||
      this.config.emergePoints.length === 0
    ) {
      throw new Error('Spawner requires creature type and at least one emerge point');
    }

    // Create state machine for spawner
    const states = {
      IDLE: 0,
      ARMED: 1,
      SPAWNING: 2,
      COOLDOWN: 3,
    };

    const stateMachine = this.builder.stateMachine(this.name, states);

    // Variables
    const cooldownVar = this.builder.int(`${this.name}Cooldown`, 0);
    this.builder.int(`${this.name}Point`, 0);

    // Arm transition
    if (this.config.armCondition) {
      stateMachine.transition('IDLE', 'ARMED', this.config.armCondition).build();
    }

    // Spawn transition
    stateMachine
      .transition('ARMED', 'SPAWNING', 'true')
      .cmd(
        'addrandomspawn',
        this.config.creature!,
        this.config.minTime || 30,
        this.config.maxTime || 60
      )
      .cmd('spawncap', this.config.creature!, this.config.minWave || 3, this.config.maxWave || 5)
      .cmd('startrandomspawn', this.config.creature!)
      .build();

    // Cooldown transition
    stateMachine
      .transition('SPAWNING', 'COOLDOWN', 'true')
      .cmd('stoprandomspawn', this.config.creature!)
      .cmd(`${cooldownVar}:time+${this.config.cooldown || 60}`)
      .build();

    // Reset transition
    this.builder
      .when(`${stateMachine.inState('COOLDOWN')} and time>=${cooldownVar}`)
      .cmd(`${this.builder.int(`${this.name}State`, 0)}:1`) // Back to ARMED
      .build();

    return this.builder;
  }
}
