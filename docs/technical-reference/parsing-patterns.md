# DAT File Parsing Patterns

This document describes the parsing strategies and patterns used to read and write Manic Miners .dat map files, extracted from the map-parser reference implementation.

## Overview

The DAT format is a text-based format with a unique structure that requires specific parsing approaches:
- Section-based organization
- Multiple data formats within sections
- Line-based and comma-separated values
- Context-sensitive parsing

## Parser Architecture

### Regex-Based Section Splitting

```typescript
// Split file into sections using closing brace pattern
const sectionSplitRe = /\r\n\}(?:\r\n|$)/;
const sections = content.split(sectionSplitRe)
  .filter(v => v)
  .map(s => s + NEWLINE);
```

### Section Identification

```typescript
// Extract section name from header
const sectionName = sectionInput.match(/^(\S+)\s*\{/)![1];
```

### Section Content Extraction

```typescript
// Remove header and trailing newline
const content = sectionInput
  .replace(/^.*\{/, '')
  .replace(NEWLINE, '');
```

## Section Parsing Patterns

### 1. Key-Value Sections (info, comments)

**Pattern**: Simple key:value pairs

```typescript
class KeyValueSection {
  parse(content: string) {
    const lines = content.split(/\r?\n/);
    const data: Record<string, string> = {};
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const match = line.match(/^\s*(\w+)\s*:\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        data[key] = value.trim();
      }
    }
    
    return data;
  }
  
  serialize(data: Record<string, string>): string {
    return Object.entries(data)
      .map(([key, value]) => `${key}:${value}`)
      .join('\r\n');
  }
}
```

**Example**:
```
info{
  rowcount:40
  colcount:40
  biome:rock
  creator:MapMaker
}
```

### 2. Grid Sections (tiles, height)

**Pattern**: 2D comma-separated values

```typescript
class GridSection {
  parse(content: string) {
    const grid = new Grid<number>(0);
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    
    const height = lines.length;
    const width = lines[0].split(',').length;
    grid.resize(width, height);
    
    lines.forEach((line, y) => {
      const values = line.split(',').map(v => parseInt(v.trim()));
      values.forEach((value, x) => {
        grid.set(x, y, value);
      });
    });
    
    return grid;
  }
  
  serialize(grid: Grid<number>): string {
    const lines: string[] = [];
    
    for (let y = 0; y < grid.height; y++) {
      const row: number[] = [];
      for (let x = 0; x < grid.width; x++) {
        row.push(grid.get(x, y));
      }
      lines.push(row.join(','));
    }
    
    return lines.join('\r\n');
  }
}
```

**Example**:
```
tiles{
  1,1,1,1,1
  1,0,0,0,1
  1,0,11,0,1
  1,0,0,0,1
  1,1,1,1,1
}
```

### 3. List Sections (resources, objectives)

**Pattern**: Multi-format lists with type-specific parsing

```typescript
class ResourcesSection {
  parse(content: string) {
    const resources = {
      crystals: [] as Resource[],
      ore: [] as Resource[],
      studs: [] as Resource[]
    };
    
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    
    for (const line of lines) {
      // Format: x,y or x,y,amount
      const parts = line.split(',').map(p => p.trim());
      
      if (parts.length >= 2) {
        const [x, y, amount = '1'] = parts;
        const resource = {
          x: parseInt(x),
          y: parseInt(y),
          amount: parseInt(amount)
        };
        
        // Determine type based on context or explicit type
        if (line.includes('crystal')) {
          resources.crystals.push(resource);
        } else if (line.includes('ore')) {
          resources.ore.push(resource);
        }
      }
    }
    
    return resources;
  }
}
```

### 4. Complex Object Sections (buildings, vehicles)

**Pattern**: Multi-line objects with properties

```typescript
class BuildingsSection {
  parse(content: string) {
    const buildings: Building[] = [];
    const lines = content.split(/\r?\n/);
    let currentBuilding: Partial<Building> = {};
    
    for (const line of lines) {
      if (!line.trim()) {
        if (Object.keys(currentBuilding).length > 0) {
          buildings.push(currentBuilding as Building);
          currentBuilding = {};
        }
        continue;
      }
      
      // Single-line format: Type,x,y,orientation,level
      if (line.includes(',') && !line.includes(':')) {
        const parts = line.split(',');
        buildings.push({
          type: parts[0],
          x: parseInt(parts[1]),
          y: parseInt(parts[2]),
          orientation: parseInt(parts[3] || '0'),
          level: parseInt(parts[4] || '1')
        });
      }
      // Multi-line format
      else if (line.includes(':')) {
        const [key, value] = line.split(':').map(s => s.trim());
        currentBuilding[key] = parseValue(value);
      }
    }
    
    return buildings;
  }
}
```

### 5. Script Section

**Pattern**: Domain-specific language with custom syntax

```typescript
class ScriptSection {
  parse(content: string) {
    const script = {
      variables: [] as Variable[],
      triggers: [] as Trigger[],
      eventChains: [] as EventChain[]
    };
    
    const lines = content.split(/\r?\n/);
    let inEventChain = false;
    let currentChain: EventChain | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      // Variable declaration
      if (trimmed.match(/^\w+\s+\w+\s*=/)) {
        const [, type, name, value] = trimmed.match(
          /^(\w+)\s+(\w+)\s*=\s*(.*)$/
        )!;
        script.variables.push({ type, name, value });
      }
      // Event chain start
      else if (trimmed.endsWith('::')) {
        inEventChain = true;
        currentChain = {
          name: trimmed.slice(0, -2),
          events: []
        };
        script.eventChains.push(currentChain);
      }
      // Event in chain
      else if (inEventChain && currentChain) {
        currentChain.events.push(trimmed);
      }
      // Trigger
      else if (trimmed.match(/^(if|when)\s*\(/)) {
        script.triggers.push(parseTrigger(trimmed));
      }
    }
    
    return script;
  }
}
```

## Common Parsing Utilities

### Line Processing

```typescript
function processLines(content: string): string[] {
  return content
    .split(/\r?\n/)                    // Handle both \r\n and \n
    .map(line => line.trim())          // Remove whitespace
    .filter(line => line.length > 0)   // Remove empty lines
    .filter(line => !line.startsWith('#')); // Remove comments
}
```

### Value Parsing

```typescript
function parseValue(value: string): any {
  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  // Number
  if (/^-?\d+$/.test(value)) return parseInt(value);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
  
  // String (remove quotes if present)
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  
  return value;
}
```

### Coordinate Parsing

```typescript
interface Coordinate {
  x: number;
  y: number;
}

function parseCoordinate(str: string): Coordinate {
  const [x, y] = str.split(',').map(s => parseInt(s.trim()));
  return { x, y };
}

// Handle both row,col and x,y conventions
function parseGridCoordinate(str: string, isRowCol: boolean): Coordinate {
  const [first, second] = str.split(',').map(s => parseInt(s.trim()));
  return isRowCol ? { x: second, y: first } : { x: first, y: second };
}
```

## Error Handling

### Graceful Degradation

```typescript
class RobustParser {
  parse(content: string): ParseResult {
    const result: ParseResult = {
      data: {},
      errors: [],
      warnings: []
    };
    
    try {
      // Primary parsing logic
      result.data = this.parseContent(content);
    } catch (error) {
      // Fallback to line-by-line parsing
      result.data = this.parseLineByLine(content);
      result.errors.push({
        type: 'ParseError',
        message: error.message,
        recoverable: true
      });
    }
    
    return result;
  }
  
  parseLineByLine(content: string): any {
    const data: any = {};
    const lines = content.split(/\r?\n/);
    
    for (let i = 0; i < lines.length; i++) {
      try {
        const parsed = this.parseLine(lines[i]);
        if (parsed) {
          Object.assign(data, parsed);
        }
      } catch (error) {
        // Skip problematic lines
        console.warn(`Skipping line ${i + 1}: ${error.message}`);
      }
    }
    
    return data;
  }
}
```

### Validation

```typescript
interface ValidationRule {
  test: (value: any) => boolean;
  message: string;
  severity: 'error' | 'warning';
}

class SectionValidator {
  validate(section: any, rules: ValidationRule[]): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    for (const rule of rules) {
      if (!rule.test(section)) {
        results.push({
          severity: rule.severity,
          message: rule.message,
          section: section.name
        });
      }
    }
    
    return results;
  }
}

// Example rules
const infoRules: ValidationRule[] = [
  {
    test: (info) => info.rowcount >= 10 && info.rowcount <= 100,
    message: 'Map height must be between 10 and 100',
    severity: 'error'
  },
  {
    test: (info) => ['rock', 'ice', 'lava'].includes(info.biome),
    message: 'Invalid biome type',
    severity: 'error'
  }
];
```

## Performance Optimization

### Lazy Parsing

```typescript
class LazyMapParser {
  private content: string;
  private sectionCache = new Map<string, any>();
  
  constructor(content: string) {
    this.content = content;
  }
  
  getSection(name: string): any {
    if (this.sectionCache.has(name)) {
      return this.sectionCache.get(name);
    }
    
    const sectionContent = this.extractSection(name);
    if (!sectionContent) return null;
    
    const parsed = this.parseSection(name, sectionContent);
    this.sectionCache.set(name, parsed);
    
    return parsed;
  }
  
  private extractSection(name: string): string | null {
    const regex = new RegExp(
      `${name}\\s*\\{([^}]*)\\}`,
      's'
    );
    const match = this.content.match(regex);
    return match ? match[1] : null;
  }
}
```

### Stream Parsing

```typescript
import { Transform } from 'stream';

class MapStreamParser extends Transform {
  private buffer = '';
  private currentSection: string | null = null;
  
  _transform(chunk: Buffer, encoding: string, callback: Function) {
    this.buffer += chunk.toString();
    
    // Process complete sections
    let match;
    while (match = this.buffer.match(/^([^}]+\})\s*/)) {
      const section = match[1];
      this.buffer = this.buffer.slice(match[0].length);
      
      this.processSection(section);
    }
    
    callback();
  }
  
  _flush(callback: Function) {
    if (this.buffer.trim()) {
      this.processSection(this.buffer);
    }
    callback();
  }
  
  private processSection(section: string) {
    const parsed = this.parseSection(section);
    this.push(JSON.stringify(parsed) + '\n');
  }
}
```

## Serialization Patterns

### Consistent Formatting

```typescript
class MapSerializer {
  private readonly INDENT = '  ';
  private readonly NEWLINE = '\r\n';
  
  serialize(map: Map): string {
    const sections: string[] = [];
    
    // Serialize in consistent order
    const sectionOrder = [
      'comments', 'info', 'tiles', 'height',
      'resources', 'objectives', 'buildings',
      'vehicles', 'creatures', 'miners',
      'script', 'briefing'
    ];
    
    for (const sectionName of sectionOrder) {
      const section = map.sections[sectionName];
      if (section && section.present) {
        sections.push(this.serializeSection(section));
      }
    }
    
    return sections.join(this.NEWLINE);
  }
  
  private serializeSection(section: AbstractMapSection): string {
    const content = section.serialize();
    const lines = content.split(/\r?\n/);
    
    // Apply consistent indentation
    const indented = lines
      .map(line => line.trim() ? this.INDENT + line : '')
      .join(this.NEWLINE);
    
    return `${section.name}{${this.NEWLINE}${indented}${this.NEWLINE}}`;
  }
}
```

### Type-Safe Serialization

```typescript
interface Serializable {
  serialize(): string;
}

class TypedSerializer<T> {
  constructor(
    private readonly formatter: (value: T) => string
  ) {}
  
  serialize(value: T): string {
    return this.formatter(value);
  }
}

// Specialized serializers
const coordinateSerializer = new TypedSerializer<Coordinate>(
  (coord) => `${coord.x},${coord.y}`
);

const buildingSerializer = new TypedSerializer<Building>(
  (building) => [
    building.type,
    building.x,
    building.y,
    building.orientation,
    building.level
  ].join(',')
);
```

## Common Pitfalls and Solutions

### 1. Line Ending Confusion

**Problem**: Mixed \r\n and \n line endings

**Solution**:
```typescript
// Normalize line endings
const normalized = content.replace(/\r\n/g, '\n');
// Or handle both patterns
const lines = content.split(/\r?\n/);
```

### 2. Trailing Commas

**Problem**: Inconsistent handling of trailing commas in CSV data

**Solution**:
```typescript
function parseCSVLine(line: string): number[] {
  return line
    .split(',')
    .map(v => v.trim())
    .filter(v => v.length > 0)  // Remove empty values
    .map(v => parseInt(v));
}
```

### 3. Section Order Dependencies

**Problem**: Some sections reference data from others

**Solution**:
```typescript
class DependencyAwareParser {
  parse(content: string): Map {
    const map = new Map();
    
    // Parse sections in dependency order
    map.sections.info.parse(this.getSection(content, 'info'));
    map.sections.tiles.parse(this.getSection(content, 'tiles'));
    
    // Now we know map dimensions
    const { rowcount, colcount } = map.sections.info;
    map.sections.height.resize(colcount, rowcount);
    map.sections.height.parse(this.getSection(content, 'height'));
    
    // Continue with sections that depend on map size
    // ...
    
    return map;
  }
}
```

### 4. Coordinate System Confusion

**Problem**: Row,Col vs X,Y conventions

**Solution**:
```typescript
class CoordinateSystem {
  static toXY(row: number, col: number): Coordinate {
    return { x: col, y: row };
  }
  
  static toRowCol(x: number, y: number): [number, number] {
    return [y, x];
  }
  
  static parseFlexible(str: string, hint?: 'xy' | 'rowcol'): Coordinate {
    const [first, second] = str.split(',').map(Number);
    
    // Use hint or context to determine format
    if (hint === 'rowcol') {
      return this.toXY(first, second);
    }
    
    return { x: first, y: second };
  }
}
```

## Testing Patterns

### Round-Trip Testing

```typescript
function testRoundTrip(originalContent: string) {
  const map = new Map();
  map.parse(originalContent);
  
  const serialized = map.serialize();
  const map2 = new Map();
  map2.parse(serialized);
  
  // Compare normalized versions
  const normalized1 = normalize(originalContent);
  const normalized2 = normalize(map2.serialize());
  
  expect(normalized1).toEqual(normalized2);
}

function normalize(content: string): string {
  return content
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\s+$/gm, '')   // Trim trailing whitespace
    .replace(/\n+$/, '')     // Remove trailing newlines
    .trim();
}
```

### Edge Case Testing

```typescript
const edgeCases = [
  // Empty sections
  'tiles{\n}',
  
  // Single value grids
  'tiles{\n0\n}',
  
  // Large grids
  generateGrid(100, 100),
  
  // Special characters in strings
  'info{\nname:"Test\"Map\""\n}',
  
  // Missing required sections
  'info{\nrowcount:10\n}'
];

for (const testCase of edgeCases) {
  test(`handles: ${testCase.slice(0, 20)}...`, () => {
    const map = new Map();
    expect(() => map.parse(testCase)).not.toThrow();
  });
}
```

## See Also

- [DAT Format Specification](../game-reference/format/overview.md)
- [Grid Data Structures](algorithms/cave-generation.md#grid-systems)
- [Validation Rules](performance.md#validation)
- [Map Parser Source](https://github.com/your-repo/map-parser)