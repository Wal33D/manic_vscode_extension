import { ScriptSection, ValidationError } from '../types/datFileTypes';
import {
  SCRIPT_COMMANDS,
  SCRIPT_MACROS,
  CREATURE_TYPES,
  BUILDING_TYPES,
  VEHICLE_TYPES,
} from './scriptCommands';
import {
  MutexDetector,
  StateMachineDetector,
  ResourceFlowAnalyzer,
  PerformanceAnalyzer,
  CircularDependencyDetector,
  DeadlockDetector,
} from './advancedScriptPatterns';

export class EnhancedScriptValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];

  // Track script state
  private definedVariables = new Map<string, string>(); // name -> type
  private definedTimers = new Set<string>();
  private definedArrows = new Set<string>();
  private eventNames = new Set<string>();

  constructor() {}

  /**
   * Validate a script section with enhanced rules
   */
  public validate(script: ScriptSection): ValidationError[] {
    this.errors = [];
    this.warnings = [];
    this.definedVariables.clear();
    this.definedTimers.clear();
    this.definedArrows.clear();
    this.eventNames.clear();

    // First pass: collect all variable declarations
    this.collectVariables(script);

    // Second pass: validate events and commands
    this.validateEvents(script);

    // Third pass: detect advanced patterns
    this.detectAdvancedPatterns(script);

    return [...this.errors, ...this.warnings];
  }

  /**
   * Collect all variable declarations
   */
  private collectVariables(script: ScriptSection): void {
    script.variables.forEach((value: unknown, name: string) => {
      // Parse typed declarations (e.g., "int Counter=0")
      const typeMatch = name.match(/^(int|float|bool|string|arrow|timer)\s+(\w+)$/);

      if (typeMatch) {
        const [, type, varName] = typeMatch;
        this.definedVariables.set(varName, type);

        if (type === 'timer') {
          this.definedTimers.add(varName);
          this.validateTimerSyntax(varName, value);
        } else if (type === 'arrow') {
          this.definedArrows.add(varName);
        }
      } else {
        // Legacy format or simple assignment
        this.definedVariables.set(name, 'unknown');

        // Try to infer type
        if (name.toLowerCase().includes('timer')) {
          this.definedTimers.add(name);
          this.validateTimerSyntax(name, value);
        }
      }
    });
  }

  /**
   * Validate timer syntax
   */
  private validateTimerSyntax(name: string, value: unknown): void {
    if (typeof value === 'string') {
      const timerMatch = value.match(
        /^(\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?))?(?:,(\d+(?:\.\d+)?))?(?:,(\w+))?$/
      );
      if (!timerMatch) {
        this.addError(
          `Invalid timer syntax for '${name}': ${value}. Expected: delay[,min,max][,event]`,
          0,
          0,
          'script'
        );
      } else {
        const [, , min, max, eventName] = timerMatch;

        // Validate timer values
        if (min && max && parseFloat(min) > parseFloat(max)) {
          this.addWarning(
            `Timer '${name}' has min (${min}) greater than max (${max})`,
            0,
            0,
            'script'
          );
        }

        // Check if event exists (will be validated in second pass)
        if (eventName) {
          // Store for later validation
          this.eventNames.add(eventName);
        }
      }
    }
  }

  /**
   * Validate all events
   */
  private validateEvents(script: ScriptSection): void {
    const definedEvents = new Set<string>();

    for (const event of script.events) {
      // Check for duplicate event names
      if (definedEvents.has(event.name)) {
        this.addWarning(`Duplicate event name: ${event.name}`, 0, 0, 'script');
      }
      definedEvents.add(event.name);

      // Validate event condition
      if (event.condition) {
        this.validateCondition(event.condition, event.name);
      }

      // Validate commands
      for (const command of event.commands) {
        this.validateCommand(command, event.name);
      }
    }

    // Check for referenced but undefined events
    for (const eventName of this.eventNames) {
      if (!definedEvents.has(eventName)) {
        this.addWarning(`Timer references undefined event: ${eventName}`, 0, 0, 'script');
      }
    }
  }

  /**
   * Validate a condition expression
   */
  private validateCondition(condition: string, eventName: string): void {
    // Extract all variable/macro references
    const refs = condition.match(/\b[a-zA-Z_]\w*(?:\.\w+)?/g) || [];

    for (const ref of refs) {
      // Skip operators and keywords
      if (['and', 'or', 'not', 'true', 'false', 'AND', 'OR', 'NOT'].includes(ref)) {
        continue;
      }

      // Check if it's a defined variable
      if (this.definedVariables.has(ref)) {
        continue;
      }

      // Check if it's a valid macro
      if (SCRIPT_MACROS[ref as keyof typeof SCRIPT_MACROS]) {
        continue;
      }

      // Check for timer macros (TimerName.remaining, TimerName.expired)
      const timerMatch = ref.match(/^(\w+)\.(remaining|expired)$/);
      if (timerMatch) {
        const [, timerName] = timerMatch;
        if (this.definedTimers.has(timerName)) {
          continue; // Valid timer macro
        } else {
          this.addWarning(
            `Condition in '${eventName}' references undefined timer: ${timerName}`,
            0,
            0,
            'script'
          );
          continue;
        }
      }

      // Check for building/creature/vehicle counts
      const entityMatch = ref.match(/^(buildings|creatures|vehicles)\.(\w+)$/);
      if (entityMatch) {
        const [, category, entityType] = entityMatch;
        let validTypes: readonly string[] = [];

        switch (category) {
          case 'buildings':
            validTypes = BUILDING_TYPES;
            break;
          case 'creatures':
            validTypes = CREATURE_TYPES;
            break;
          case 'vehicles':
            validTypes = VEHICLE_TYPES;
            break;
        }

        if (validTypes.includes(entityType)) {
          continue; // Valid entity reference
        } else {
          this.addWarning(
            `Unknown ${category} type '${entityType}' in event '${eventName}'`,
            0,
            0,
            'script'
          );
          continue;
        }
      }

      // Unknown reference
      this.addWarning(
        `Event '${eventName}' references undefined variable or macro: ${ref}`,
        0,
        0,
        'script'
      );
    }
  }

  /**
   * Validate a single command
   */
  private validateCommand(
    command: { command: string; parameters: string[] },
    eventName: string
  ): void {
    const cmdName = command.command.toLowerCase();

    // Check for variable assignment (varName:value)
    if (command.command.includes(':') && !SCRIPT_COMMANDS[cmdName]) {
      const parts = command.command.split(':');
      if (parts.length === 2) {
        const [varName, value] = parts;

        // Check if variable is defined
        if (!this.definedVariables.has(varName.trim())) {
          this.addWarning(
            `Assignment to undefined variable '${varName}' in event '${eventName}'`,
            0,
            0,
            'script'
          );
        }

        // Validate math operations
        if (
          value.includes('+') ||
          value.includes('-') ||
          value.includes('*') ||
          value.includes('//')
        ) {
          this.validateMathExpression(value, eventName);
        }

        return;
      }
    }

    // Check if command exists
    const cmdDef = SCRIPT_COMMANDS[cmdName];
    if (!cmdDef) {
      this.addWarning(
        `Unknown script command '${command.command}' in event '${eventName}'`,
        0,
        0,
        'script'
      );
      return;
    }

    // Validate parameter count
    const paramCount = command.parameters.length;
    if (paramCount < cmdDef.params.min) {
      this.addError(
        `'${cmdName}' requires at least ${cmdDef.params.min} parameter(s), got ${paramCount}`,
        0,
        0,
        'script'
      );
      return;
    }

    if (cmdDef.params.max !== undefined && paramCount > cmdDef.params.max) {
      this.addError(
        `'${cmdName}' accepts at most ${cmdDef.params.max} parameter(s), got ${paramCount}`,
        0,
        0,
        'script'
      );
      return;
    }

    // Validate specific command parameters
    this.validateCommandParameters(cmdName, command.parameters, eventName);
  }

  /**
   * Validate parameters for specific commands
   */
  private validateCommandParameters(cmdName: string, params: string[], _eventName: string): void {
    switch (cmdName) {
      case 'wait':
      case 'truewait':
      case 'speed':
        if (params.length > 0 && isNaN(Number(params[0]))) {
          this.addError(`'${cmdName}' requires a numeric parameter`, 0, 0, 'script');
        }
        break;

      case 'emerge':
        if (params.length >= 5) {
          const [row, col, dir, creature, radius] = params;

          if (isNaN(Number(row)) || isNaN(Number(col))) {
            this.addError(`'emerge' requires numeric row,col coordinates`, 0, 0, 'script');
          }

          if (!['N', 'S', 'E', 'W', 'A'].includes(dir.toUpperCase())) {
            this.addError(`'emerge' direction must be N/S/E/W/A, got '${dir}'`, 0, 0, 'script');
          }

          if (!CREATURE_TYPES.includes(creature as (typeof CREATURE_TYPES)[number])) {
            this.addWarning(`Unknown creature type '${creature}'`, 0, 0, 'script');
          }

          if (isNaN(Number(radius))) {
            this.addError(`'emerge' radius must be numeric`, 0, 0, 'script');
          }
        }
        break;

      case 'place':
      case 'drill':
      case 'placerubble':
      case 'heighttrigger':
      case 'pan':
      case 'miners':
        if (params.length >= 2) {
          const [row, col] = params;
          if (isNaN(Number(row)) || isNaN(Number(col))) {
            this.addError(`'${cmdName}' requires numeric row,col coordinates`, 0, 0, 'script');
          }
        }

        if (cmdName === 'place' && params.length >= 3) {
          const tileId = Number(params[2]);
          if (isNaN(tileId) || tileId < 0 || tileId > 255) {
            this.addError(`'place' tile ID must be between 0-255`, 0, 0, 'script');
          }
        }

        if (cmdName === 'placerubble' && params.length >= 3) {
          const height = Number(params[2]);
          if (isNaN(height) || height < 1 || height > 4) {
            this.addError(`'placerubble' height must be between 1-4`, 0, 0, 'script');
          }
        }
        break;

      case 'showarrow':
      case 'hidearrow':
      case 'highlight':
      case 'highlightarrow':
      case 'removearrow': {
        if (cmdName !== 'hidearrow' && cmdName !== 'removearrow' && params.length >= 2) {
          const [row, col] = params;
          if (isNaN(Number(row)) || isNaN(Number(col))) {
            this.addError(`'${cmdName}' requires numeric row,col coordinates`, 0, 0, 'script');
          }
        }

        // Check arrow variable
        const arrowParam =
          cmdName === 'hidearrow' || cmdName === 'removearrow' ? params[0] : params[2];
        if (
          arrowParam &&
          !this.definedArrows.has(arrowParam) &&
          !this.definedVariables.has(arrowParam)
        ) {
          this.addWarning(`Arrow variable '${arrowParam}' not defined`, 0, 0, 'script');
        }
        break;
      }

      case 'starttimer':
      case 'stoptimer':
        if (params.length > 0 && !this.definedTimers.has(params[0])) {
          this.addWarning(`Timer '${params[0]}' not defined`, 0, 0, 'script');
        }
        break;

      case 'msg':
      case 'qmsg':
      case 'objective':
        if (params.length > 0 && !this.definedVariables.has(params[0])) {
          // Check if it's a literal string (common pattern)
          if (!params[0].match(/^[A-Za-z]\w*$/)) {
            this.addWarning(`Message variable '${params[0]}' not defined`, 0, 0, 'script');
          }
        }
        break;

      case 'disable':
      case 'enable':
        if (params.length > 0) {
          const validTargets = [
            'miners',
            'vehicles',
            'buildings',
            'lights',
            'light',
            'Dynamite_C',
            ...BUILDING_TYPES,
            ...VEHICLE_TYPES,
          ];
          if (!validTargets.includes(params[0])) {
            this.addWarning(`Unknown ${cmdName} target '${params[0]}'`, 0, 0, 'script');
          }
        }
        break;
    }
  }

  /**
   * Validate math expressions
   */
  private validateMathExpression(expr: string, eventName: string): void {
    // Extract variable references from math expressions
    const vars = expr.match(/\b[a-zA-Z_]\w*\b/g) || [];

    for (const varName of vars) {
      if (!this.definedVariables.has(varName) && isNaN(Number(varName))) {
        this.addWarning(
          `Math expression in '${eventName}' references undefined variable: ${varName}`,
          0,
          0,
          'script'
        );
      }
    }
  }

  /**
   * Detect advanced script patterns
   */
  private detectAdvancedPatterns(script: ScriptSection): void {
    const scriptContent = this.reconstructScriptContent(script);

    // Detect mutex patterns
    const mutexDetector = new MutexDetector();
    const mutexPatterns = mutexDetector.detectPatterns(scriptContent);

    mutexPatterns.forEach(pattern => {
      const patternType = pattern.type.replace(/_/g, ' ');
      this.addWarning(
        `Detected ${patternType} pattern with variable '${pattern.variableName}' - ensure proper synchronization`,
        pattern.line,
        0,
        'script'
      );

      if (pattern.type === 'global_cooldown' && pattern.relatedEvents.length > 3) {
        this.addWarning(
          `Variable '${pattern.variableName}' is used as cooldown for ${pattern.relatedEvents.length} events - consider separate cooldowns`,
          pattern.line,
          0,
          'script'
        );
      }
    });

    // Detect state machines
    const stateMachineDetector = new StateMachineDetector();
    const stateMachines = stateMachineDetector.detectStateMachines(scriptContent);

    stateMachines.forEach(machine => {
      this.addWarning(
        `Detected state machine with variable '${machine.variableName}' (${machine.states.size} states, ${machine.transitions.length} transitions)`,
        0,
        0,
        'script'
      );

      // Check for unreachable states
      const reachableStates = new Set<number>([machine.initialState]);
      machine.transitions.forEach(t => reachableStates.add(t.to));

      machine.states.forEach((name, state) => {
        if (!reachableStates.has(state) && state !== machine.initialState) {
          this.addError(
            `State '${name}' (${state}) in machine '${machine.variableName}' is unreachable`,
            0,
            0,
            'script'
          );
        }
      });

      // Check for dead-end states
      const hasOutgoing = new Set(machine.transitions.map(t => t.from));
      machine.states.forEach((name, state) => {
        if (!hasOutgoing.has(state) && state !== 0) {
          // Assuming 0 is often a terminal state
          this.addWarning(
            `State '${name}' (${state}) in machine '${machine.variableName}' has no outgoing transitions`,
            0,
            0,
            'script'
          );
        }
      });
    });

    // Analyze resource flow
    const resourceAnalyzer = new ResourceFlowAnalyzer();
    const resourceFlows = resourceAnalyzer.analyzeResourceFlow(scriptContent);

    resourceFlows.forEach((flow, resource) => {
      if (flow.balance < 0) {
        this.addWarning(
          `Resource '${resource}' has negative balance (${flow.balance}) - sources: ${flow.sources.length}, sinks: ${flow.sinks.length}`,
          0,
          0,
          'script'
        );
      }

      if (resource === 'crystals' && flow.sinks.length > 0 && flow.sources.length === 0) {
        this.addError(
          `Crystals required for objectives but no crystal sources found in script`,
          0,
          0,
          'script'
        );
      }
    });

    // Analyze performance
    const performanceAnalyzer = new PerformanceAnalyzer();
    const metrics = performanceAnalyzer.analyzePerformance(scriptContent);

    if (metrics.estimatedLoad === 'critical') {
      this.addError(
        `Script has critical performance load - Events: ${metrics.eventCount}, Complexity: ${metrics.conditionComplexity}, Timers: ${metrics.timerCount}, Spawners: ${metrics.spawnerCount}`,
        0,
        0,
        'script'
      );
    } else if (metrics.estimatedLoad === 'high') {
      this.addWarning(`Script has high performance load - consider optimization`, 0, 0, 'script');
    }

    const recommendations = performanceAnalyzer.getRecommendations(metrics);
    recommendations.forEach(rec => {
      this.addWarning(rec, 0, 0, 'script');
    });

    // Detect circular dependencies
    const circularDetector = new CircularDependencyDetector();
    const circularDeps = circularDetector.detectCircularDependencies(scriptContent);

    circularDeps.forEach(dep => {
      this.addError(
        `Circular dependency detected: ${dep.events.join(' → ')}`,
        dep.line,
        0,
        'script'
      );
    });

    // Detect potential deadlocks
    const deadlockDetector = new DeadlockDetector();
    const deadlocks = deadlockDetector.detectDeadlocks(scriptContent);

    deadlocks.forEach(deadlock => {
      const severity = deadlock.riskLevel === 'high' ? 'error' : 'warning';
      const message = `Potential deadlock between events [${deadlock.events.join(', ')}] on resources [${deadlock.sharedResources.join(', ')}]`;

      if (severity === 'error') {
        this.addError(message, deadlock.line, 0, 'script');
      } else {
        this.addWarning(message, deadlock.line, 0, 'script');
      }
    });
  }

  /**
   * Reconstruct script content from parsed structure
   */
  private reconstructScriptContent(script: ScriptSection): string {
    const lines: string[] = [];

    // Add variables
    script.variables.forEach((value, name) => {
      lines.push(`${name}=${value}`);
    });

    // Add events
    script.events.forEach(event => {
      if (event.condition) {
        lines.push(`when(${event.condition})[${event.name}]`);
      }
      lines.push(`${event.name}::`);
      event.commands.forEach(cmd => {
        const params = cmd.parameters ? `:${cmd.parameters.join(',')}` : '';
        lines.push(`${cmd.command}${params};`);
      });
    });

    return lines.join('\n');
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
