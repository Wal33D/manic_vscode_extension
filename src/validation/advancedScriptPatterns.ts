/**
 * Advanced script pattern detection and validation
 * Based on groundhog's sophisticated script analysis
 */

export interface MutexPattern {
  variableName: string;
  line: number;
  type: 'global_cooldown' | 'one_time_event' | 'exclusive_state';
  relatedEvents: string[];
}

export interface StateMachine {
  variableName: string;
  states: Map<number, string>;
  transitions: Array<{
    from: number;
    to: number;
    trigger: string;
    line: number;
  }>;
  initialState: number;
}

export interface ResourceFlow {
  resource: 'crystals' | 'ore' | 'studs' | 'air';
  sources: Array<{ amount: number; line: number; event?: string }>;
  sinks: Array<{ amount: number; line: number; event?: string }>;
  balance: number;
}

export interface PerformanceMetrics {
  eventCount: number;
  conditionComplexity: number;
  timerCount: number;
  spawnerCount: number;
  estimatedLoad: 'low' | 'medium' | 'high' | 'critical';
}

export interface CircularDependency {
  events: string[];
  line: number;
}

export interface DeadlockRisk {
  events: string[];
  sharedResources: string[];
  riskLevel: 'low' | 'medium' | 'high';
  line: number;
}

/**
 * Detects mutex patterns in scripts
 */
export class MutexDetector {
  private mutexPatterns: MutexPattern[] = [];
  
  /**
   * Detect all mutex patterns in a script
   */
  public detectPatterns(scriptContent: string): MutexPattern[] {
    this.mutexPatterns = [];
    const lines = scriptContent.split('\n');
    
    // Detect global cooldown mutexes
    this.detectGlobalCooldowns(lines);
    
    // Detect one-time event flags
    this.detectOneTimeEvents(lines);
    
    // Detect exclusive state variables
    this.detectExclusiveStates(lines);
    
    return this.mutexPatterns;
  }
  
  private detectGlobalCooldowns(lines: string[]): void {
    // Pattern: variable used to prevent rapid triggering
    const cooldownPattern = /(\w+)\s*:\s*(\w+)\s*\+\s*\d+/; // var:var+time
    const checkPattern = /when\s*\(.*\s+and\s+(\w+)\s*[<>]=?\s*time/i;
    
    const cooldownVars = new Set<string>();
    
    lines.forEach((line, index) => {
      const cooldownMatch = line.match(cooldownPattern);
      if (cooldownMatch && cooldownMatch[1] === cooldownMatch[2]) {
        cooldownVars.add(cooldownMatch[1]);
      }
      
      const checkMatch = line.match(checkPattern);
      if (checkMatch && cooldownVars.has(checkMatch[1])) {
        this.mutexPatterns.push({
          variableName: checkMatch[1],
          line: index + 1,
          type: 'global_cooldown',
          relatedEvents: this.findRelatedEvents(lines, checkMatch[1]),
        });
      }
    });
  }
  
  private detectOneTimeEvents(lines: string[]): void {
    // Pattern: bool variable that's only set to true, never reset
    const boolDeclaration = /bool\s+(\w+)\s*=\s*false/;
    const setTruePattern = /(\w+)\s*:\s*true/;
    const checkFalsePattern = /when\s*\(.*\s+and\s+(\w+)\s*==\s*false/i;
    
    const boolVars = new Map<string, number>();
    const setToTrue = new Set<string>();
    const checkedFalse = new Set<string>();
    
    lines.forEach((line, index) => {
      const declMatch = line.match(boolDeclaration);
      if (declMatch) {
        boolVars.set(declMatch[1], index + 1);
      }
      
      const setMatch = line.match(setTruePattern);
      if (setMatch && boolVars.has(setMatch[1])) {
        setToTrue.add(setMatch[1]);
      }
      
      const checkMatch = line.match(checkFalsePattern);
      if (checkMatch && boolVars.has(checkMatch[1])) {
        checkedFalse.add(checkMatch[1]);
      }
    });
    
    // Variables that are checked for false and set to true but never reset
    for (const [varName, line] of boolVars) {
      if (setToTrue.has(varName) && checkedFalse.has(varName)) {
        // Check if it's ever set back to false
        const setFalsePattern = new RegExp(`${varName}\\s*:\\s*false`);
        const isResetToFalse = lines.some(l => setFalsePattern.test(l));
        
        if (!isResetToFalse) {
          this.mutexPatterns.push({
            variableName: varName,
            line,
            type: 'one_time_event',
            relatedEvents: this.findRelatedEvents(lines, varName),
          });
        }
      }
    }
  }
  
  private detectExclusiveStates(lines: string[]): void {
    // Pattern: int variable used as state machine
    const intDeclaration = /int\s+(\w+)\s*=\s*(\d+)/;
    const stateCheck = /when\s*\(.*\s+and\s+(\w+)\s*==\s*(\d+)/i;
    const stateSet = /(\w+)\s*:\s*(\d+)/;
    
    const intVars = new Map<string, { line: number; initial: number }>();
    const stateTransitions = new Map<string, Set<number>>();
    
    lines.forEach((line, index) => {
      const declMatch = line.match(intDeclaration);
      if (declMatch) {
        intVars.set(declMatch[1], {
          line: index + 1,
          initial: parseInt(declMatch[2]),
        });
      }
      
      const checkMatch = line.match(stateCheck);
      if (checkMatch && intVars.has(checkMatch[1])) {
        if (!stateTransitions.has(checkMatch[1])) {
          stateTransitions.set(checkMatch[1], new Set());
        }
        stateTransitions.get(checkMatch[1])!.add(parseInt(checkMatch[2]));
      }
      
      const setMatch = line.match(stateSet);
      if (setMatch && intVars.has(setMatch[1])) {
        if (!stateTransitions.has(setMatch[1])) {
          stateTransitions.set(setMatch[1], new Set());
        }
        stateTransitions.get(setMatch[1])!.add(parseInt(setMatch[2]));
      }
    });
    
    // Variables with multiple distinct states
    for (const [varName, states] of stateTransitions) {
      if (states.size >= 3) {
        const varInfo = intVars.get(varName)!;
        this.mutexPatterns.push({
          variableName: varName,
          line: varInfo.line,
          type: 'exclusive_state',
          relatedEvents: this.findRelatedEvents(lines, varName),
        });
      }
    }
  }
  
  private findRelatedEvents(lines: string[], variableName: string): string[] {
    const events: string[] = [];
    const eventPattern = /(\w+)::/;
    
    lines.forEach(line => {
      if (line.includes(variableName)) {
        const match = line.match(eventPattern);
        if (match) {
          events.push(match[1]);
        }
      }
    });
    
    return [...new Set(events)];
  }
}

/**
 * Detects and validates state machines in scripts
 */
export class StateMachineDetector {
  /**
   * Detect state machines in a script
   */
  public detectStateMachines(scriptContent: string): StateMachine[] {
    const lines = scriptContent.split('\n');
    const stateMachines: StateMachine[] = [];
    
    // Find integer variables that might be state machines
    const intVars = this.findIntegerVariables(lines);
    
    for (const [varName, info] of intVars) {
      const transitions = this.findStateTransitions(lines, varName);
      
      if (transitions.length >= 2) {
        const states = new Map<number, string>();
        const uniqueStates = new Set<number>();
        
        transitions.forEach(t => {
          uniqueStates.add(t.from);
          uniqueStates.add(t.to);
        });
        
        // Name states based on common patterns
        uniqueStates.forEach(state => {
          states.set(state, this.inferStateName(state, varName, lines));
        });
        
        stateMachines.push({
          variableName: varName,
          states,
          transitions,
          initialState: info.initial,
        });
      }
    }
    
    return stateMachines;
  }
  
  private findIntegerVariables(lines: string[]): Map<string, { line: number; initial: number }> {
    const vars = new Map<string, { line: number; initial: number }>();
    const pattern = /int\s+(\w+)\s*=\s*(\d+)/;
    
    lines.forEach((line, index) => {
      const match = line.match(pattern);
      if (match) {
        vars.set(match[1], {
          line: index + 1,
          initial: parseInt(match[2]),
        });
      }
    });
    
    return vars;
  }
  
  private findStateTransitions(lines: string[], varName: string): Array<{ from: number; to: number; trigger: string; line: number }> {
    const transitions: Array<{ from: number; to: number; trigger: string; line: number }> = [];
    const checkPattern = new RegExp(`when\\s*\\(.*${varName}\\s*==\\s*(\\d+).*\\)\\s*\\[(\\w+)\\]`, 'i');
    const setPattern = new RegExp(`${varName}\\s*:\\s*(\\d+)`);
    
    let currentCondition: { state: number; event: string } | null = null;
    
    lines.forEach((line, index) => {
      const checkMatch = line.match(checkPattern);
      if (checkMatch) {
        currentCondition = {
          state: parseInt(checkMatch[1]),
          event: checkMatch[2],
        };
      }
      
      if (currentCondition) {
        const setMatch = line.match(setPattern);
        if (setMatch) {
          transitions.push({
            from: currentCondition.state,
            to: parseInt(setMatch[1]),
            trigger: currentCondition.event,
            line: index + 1,
          });
        }
      }
      
      // Reset on new event
      if (line.includes('::')) {
        currentCondition = null;
      }
    });
    
    return transitions;
  }
  
  private inferStateName(state: number, varName: string, lines: string[]): string {
    // Common state naming patterns
    const commonNames: Record<number, string> = {
      0: 'IDLE',
      1: 'ACTIVE',
      2: 'COMPLETE',
      3: 'FAILED',
    };
    
    // Try to find comments or patterns that indicate state purpose
    const statePattern = new RegExp(`${varName}\\s*:\\s*${state}`);
    for (let i = 0; i < lines.length; i++) {
      if (statePattern.test(lines[i])) {
        // Check for comments on same or previous line
        const comment = lines[i].match(/#\s*(.+)/) || (i > 0 ? lines[i-1].match(/#\s*(.+)/) : null);
        if (comment) {
          return comment[1].trim().toUpperCase().replace(/\s+/g, '_');
        }
      }
    }
    
    return commonNames[state] || `STATE_${state}`;
  }
}

/**
 * Analyzes resource flow in scripts
 */
export class ResourceFlowAnalyzer {
  /**
   * Analyze resource flow in a script
   */
  public analyzeResourceFlow(scriptContent: string): Map<string, ResourceFlow> {
    const lines = scriptContent.split('\n');
    const flows = new Map<string, ResourceFlow>();
    
    // Initialize resource flows
    const resources: Array<'crystals' | 'ore' | 'studs' | 'air'> = ['crystals', 'ore', 'studs', 'air'];
    resources.forEach(resource => {
      flows.set(resource, {
        resource,
        sources: [],
        sinks: [],
        balance: 0,
      });
    });
    
    lines.forEach((line, index) => {
      // Detect resource additions
      const addPattern = /(crystals|ore|studs)\s*:\s*(\d+)/;
      const addMatch = line.match(addPattern);
      if (addMatch) {
        const flow = flows.get(addMatch[1] as 'crystals' | 'ore' | 'studs')!;
        const amount = parseInt(addMatch[2]);
        flow.sources.push({ amount, line: index + 1 });
        flow.balance += amount;
      }
      
      // Detect resource costs in objectives
      const costPattern = /(crystals|ore|studs)\s*>=\s*(\d+)/;
      const costMatch = line.match(costPattern);
      if (costMatch && line.includes('objective')) {
        const flow = flows.get(costMatch[1] as 'crystals' | 'ore' | 'studs')!;
        const amount = parseInt(costMatch[2]);
        flow.sinks.push({ amount, line: index + 1 });
        flow.balance -= amount;
      }
      
      // Detect air supply changes
      if (line.includes('oxygen:')) {
        const airMatch = line.match(/oxygen:\s*(\d+)\/(\d+)/);
        if (airMatch) {
          const flow = flows.get('air')!;
          flow.sources.push({ amount: parseInt(airMatch[1]), line: index + 1 });
        }
      }
    });
    
    return flows;
  }
}

/**
 * Calculate performance metrics for scripts
 */
export class PerformanceAnalyzer {
  /**
   * Analyze script performance impact
   */
  public analyzePerformance(scriptContent: string): PerformanceMetrics {
    const lines = scriptContent.split('\n');
    
    const metrics: PerformanceMetrics = {
      eventCount: 0,
      conditionComplexity: 0,
      timerCount: 0,
      spawnerCount: 0,
      estimatedLoad: 'low',
    };
    
    lines.forEach(line => {
      // Count events
      if (line.includes('::')) {
        metrics.eventCount++;
      }
      
      // Count timers
      if (line.match(/timer\s+\w+\s*=/)) {
        metrics.timerCount++;
      }
      
      // Count spawners
      if (line.includes('spawncap:') || line.includes('addrandomspawn:')) {
        metrics.spawnerCount++;
      }
      
      // Measure condition complexity
      const whenMatch = line.match(/when\s*\((.*)\)/);
      if (whenMatch) {
        const condition = whenMatch[1];
        const operators = (condition.match(/and|or/g) || []).length;
        metrics.conditionComplexity += operators + 1;
      }
    });
    
    // Calculate estimated load
    const score = 
      metrics.eventCount * 1 +
      metrics.conditionComplexity * 0.5 +
      metrics.timerCount * 2 +
      metrics.spawnerCount * 3;
    
    if (score < 20) {
      metrics.estimatedLoad = 'low';
    } else if (score < 50) {
      metrics.estimatedLoad = 'medium';
    } else if (score < 100) {
      metrics.estimatedLoad = 'high';
    } else {
      metrics.estimatedLoad = 'critical';
    }
    
    return metrics;
  }
  
  /**
   * Get performance recommendations
   */
  public getRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];
    
    if (metrics.estimatedLoad === 'critical') {
      recommendations.push('Consider splitting complex logic into multiple levels');
    }
    
    if (metrics.conditionComplexity > 50) {
      recommendations.push('Complex conditions may impact performance - consider simplifying or using state machines');
    }
    
    if (metrics.timerCount > 10) {
      recommendations.push('High timer count - consider consolidating timers where possible');
    }
    
    if (metrics.spawnerCount > 5) {
      recommendations.push('Multiple spawners active - ensure spawn caps are reasonable');
    }
    
    if (metrics.eventCount > 100) {
      recommendations.push('Large number of events - consider using event chains to reduce duplication');
    }
    
    return recommendations;
  }
}

/**
 * Detects circular dependencies in event chains
 */
export class CircularDependencyDetector {
  private eventGraph: Map<string, Set<string>> = new Map();
  private circularDeps: CircularDependency[] = [];
  
  /**
   * Detect circular dependencies in scripts
   */
  public detectCircularDependencies(scriptContent: string): CircularDependency[] {
    this.circularDeps = [];
    this.buildEventGraph(scriptContent);
    
    // Check each event for circular dependencies
    for (const [event] of this.eventGraph) {
      const visited = new Set<string>();
      const path: string[] = [];
      this.dfs(event, visited, path);
    }
    
    return this.circularDeps;
  }
  
  private buildEventGraph(scriptContent: string): void {
    const lines = scriptContent.split('\n');
    let currentEvent: string | null = null;
    
    lines.forEach((line, index) => {
      // Detect event definition
      const eventMatch = line.match(/^(\w+)::/);
      if (eventMatch) {
        currentEvent = eventMatch[1];
        if (!this.eventGraph.has(currentEvent)) {
          this.eventGraph.set(currentEvent, new Set());
        }
      }
      
      // Detect event calls
      if (currentEvent) {
        // Direct event call
        const callMatch = line.match(/(\w+)::;/);
        if (callMatch && callMatch[1] !== currentEvent) {
          this.eventGraph.get(currentEvent)!.add(callMatch[1]);
        }
        
        // Conditional event trigger
        const whenMatch = line.match(/when\s*\([^)]+\)\s*\[(\w+)\]/);
        if (whenMatch) {
          this.eventGraph.get(currentEvent)!.add(whenMatch[1]);
        }
        
        // Call command
        const callCmdMatch = line.match(/call\s*:\s*(\w+)/);
        if (callCmdMatch) {
          this.eventGraph.get(currentEvent)!.add(callCmdMatch[1]);
        }
        
        // If conditions that trigger events
        const ifMatch = line.match(/if\s*\([^)]+\)\s*\[(\w+)\]/);
        if (ifMatch) {
          this.eventGraph.get(currentEvent)!.add(ifMatch[1]);
        }
      }
    });
  }
  
  private dfs(event: string, visited: Set<string>, path: string[]): void {
    if (path.includes(event)) {
      // Found circular dependency
      const cycleStart = path.indexOf(event);
      const cycle = [...path.slice(cycleStart), event];
      
      // Avoid duplicate reports of the same cycle
      const cycleKey = cycle.sort().join('-');
      const alreadyReported = this.circularDeps.some(dep => 
        dep.events.sort().join('-') === cycleKey
      );
      
      if (!alreadyReported) {
        this.circularDeps.push({
          events: cycle,
          line: 0, // Line number would need to be tracked in real implementation
        });
      }
      return;
    }
    
    if (visited.has(event)) {
      return;
    }
    
    visited.add(event);
    path.push(event);
    
    const dependencies = this.eventGraph.get(event) || new Set();
    for (const dep of dependencies) {
      this.dfs(dep, visited, [...path]);
    }
  }
}

/**
 * Detects potential deadlock situations
 */
export class DeadlockDetector {
  /**
   * Detect potential deadlocks in scripts
   */
  public detectDeadlocks(scriptContent: string): DeadlockRisk[] {
    const lines = scriptContent.split('\n');
    const deadlocks: DeadlockRisk[] = [];
    
    // Find events that modify shared state
    const eventResources = this.findEventResourceUsage(lines);
    
    // Find events that wait on conditions
    const eventWaits = this.findEventWaitConditions(lines);
    
    // Analyze for potential deadlocks
    const events = Array.from(eventResources.keys());
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];
        
        const resources1 = eventResources.get(event1) || new Set();
        const resources2 = eventResources.get(event2) || new Set();
        const waits1 = eventWaits.get(event1) || new Set();
        const waits2 = eventWaits.get(event2) || new Set();
        
        // Check for circular wait conditions
        const sharedResources = new Set([...resources1].filter(r => resources2.has(r)));
        
        if (sharedResources.size > 0) {
          // Check if they wait on each other's resources
          const event1WaitsOnEvent2 = [...waits1].some(w => resources2.has(w));
          const event2WaitsOnEvent1 = [...waits2].some(w => resources1.has(w));
          
          if (event1WaitsOnEvent2 && event2WaitsOnEvent1) {
            deadlocks.push({
              events: [event1, event2],
              sharedResources: Array.from(sharedResources),
              riskLevel: 'high',
              line: 0,
            });
          } else if (event1WaitsOnEvent2 || event2WaitsOnEvent1) {
            deadlocks.push({
              events: [event1, event2],
              sharedResources: Array.from(sharedResources),
              riskLevel: 'medium',
              line: 0,
            });
          }
        }
      }
    }
    
    return deadlocks;
  }
  
  private findEventResourceUsage(lines: string[]): Map<string, Set<string>> {
    const eventResources = new Map<string, Set<string>>();
    let currentEvent: string | null = null;
    
    lines.forEach(line => {
      const eventMatch = line.match(/^(\w+)::/);
      if (eventMatch) {
        currentEvent = eventMatch[1];
        eventResources.set(currentEvent, new Set());
      }
      
      if (currentEvent) {
        // Variable assignments
        const assignMatch = line.match(/(\w+)\s*:/);
        if (assignMatch && !line.includes('::')) {
          eventResources.get(currentEvent)!.add(assignMatch[1]);
        }
        
        // Resource modifications
        const resourceMatch = line.match(/(crystals|ore|studs|air)\s*:/);
        if (resourceMatch) {
          eventResources.get(currentEvent)!.add(resourceMatch[1]);
        }
      }
    });
    
    return eventResources;
  }
  
  private findEventWaitConditions(lines: string[]): Map<string, Set<string>> {
    const eventWaits = new Map<string, Set<string>>();
    let currentEvent: string | null = null;
    
    lines.forEach(line => {
      const eventMatch = line.match(/^(\w+)::/);
      if (eventMatch) {
        currentEvent = eventMatch[1];
      }
      
      // Find when conditions that reference variables
      const whenMatch = line.match(/when\s*\(([^)]+)\)\s*\[(\w+)\]/);
      if (whenMatch) {
        const condition = whenMatch[1];
        const targetEvent = whenMatch[2];
        
        if (!eventWaits.has(targetEvent)) {
          eventWaits.set(targetEvent, new Set());
        }
        
        // Extract variable references from condition
        const varRefs = condition.match(/\b\w+\b/g) || [];
        varRefs.forEach(ref => {
          if (!['and', 'or', 'not', 'true', 'false'].includes(ref)) {
            eventWaits.get(targetEvent)!.add(ref);
          }
        });
      }
    });
    
    return eventWaits;
  }
}