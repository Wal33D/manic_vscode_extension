# Common Patterns and Gotchas for Manic Miners Map Manipulation

This document contains common patterns, best practices, and gotchas that apply across all map manipulation tools, including the VSCode extension.

## Table of Contents
- [Common Patterns](#common-patterns)
- [Common Gotchas](#common-gotchas)
- [VSCode Extension Patterns](#vscode-extension-patterns)
- [Best Practices Summary](#best-practices-summary)

## Common Patterns

### 1. Safe File Loading Pattern
Always validate maps after loading to ensure data integrity:

```typescript
async function loadMapSafely(filePath: string): Promise<MapData | null> {
  try {
    // Try to parse the map
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const map = parseMap(content);
    
    // Always validate
    const validation = map.validate();
    if (!validation.isValid) {
      console.warn(`Map ${filePath} has issues:`, validation.errors);
      // Optionally try to auto-fix
      if (validation.autoFixable) {
        return autoFixMap(map, validation);
      }
    }
    
    return map;
  } catch (error) {
    console.error(`Failed to load ${filePath}:`, error);
    return null;
  }
}
```

### 2. Resource Counting Pattern
Resources can exist both as tiles and as explicit entries:

```typescript
function countAllResources(map: MapData): ResourceCount {
  const count = {
    crystals: 0,
    ore: 0,
    rechargeSeams: 0
  };
  
  // Check tile-based resources
  for (let y = 0; y < map.info.rowcount; y++) {
    for (let x = 0; x < map.info.colcount; x++) {
      const tile = map.tiles.get(y, x);
      switch (tile) {
        case TileType.CRYSTAL_SEAM:
          count.crystals++;
          break;
        case TileType.ORE_SEAM:
          count.ore++;
          break;
        case TileType.RECHARGE_SEAM:
          count.rechargeSeams++;
          break;
      }
    }
  }
  
  // Add explicit resource entries
  if (map.resources) {
    count.crystals += map.resources.crystals?.length || 0;
    count.ore += map.resources.ore?.reduce((sum, o) => sum + (o.amount || 1), 0) || 0;
  }
  
  return count;
}
```

### 3. Flood Fill Pattern
Common pattern for finding connected regions:

```typescript
function floodFill<T>(
  grid: Grid<T>,
  startX: number,
  startY: number,
  predicate: (value: T) => boolean,
  action: (x: number, y: number) => void
): number {
  const visited = new Set<string>();
  const stack = [[startX, startY]];
  let count = 0;
  
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const key = `${x},${y}`;
    
    if (visited.has(key)) continue;
    if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) continue;
    if (!predicate(grid.get(y, x))) continue;
    
    visited.add(key);
    action(x, y);
    count++;
    
    // Add neighbors
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  
  return count;
}
```

### 4. Map Modification Pattern
Always clone before modifying to preserve original:

```typescript
function modifyMapSafely(
  original: MapData,
  modifier: (map: MapData) => void
): MapData {
  // Deep clone the map
  const modified = cloneDeep(original);
  
  // Apply modifications
  modifier(modified);
  
  // Validate changes
  const validation = modified.validate();
  if (!validation.isValid) {
    throw new Error(`Modifications resulted in invalid map: ${validation.errors.join(', ')}`);
  }
  
  return modified;
}
```

### 5. Batch Processing Pattern
Process multiple maps efficiently:

```typescript
async function batchProcessMaps(
  mapFiles: string[],
  processor: (map: MapData) => Promise<ProcessResult>
): Promise<BatchResult> {
  const results: BatchResult = {
    successful: [],
    failed: [],
    stats: {}
  };
  
  // Process in parallel with concurrency limit
  const CONCURRENCY = 4;
  for (let i = 0; i < mapFiles.length; i += CONCURRENCY) {
    const batch = mapFiles.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.allSettled(
      batch.map(async (file) => {
        const map = await loadMapSafely(file);
        if (!map) throw new Error(`Failed to load ${file}`);
        return { file, result: await processor(map) };
      })
    );
    
    // Collect results
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.successful.push(result.value);
      } else {
        results.failed.push({
          file: batch[index],
          error: result.reason
        });
      }
    });
  }
  
  return results;
}
```

## Common Gotchas

### 1. Coordinate System Confusion
The most common mistake - X/Y vs Row/Col:

```typescript
// ⚠️ GOTCHA: Arrays are [row][col] but we think in (x,y)
// Tiles are stored as tiles[y][x] NOT tiles[x][y]

// WRONG:
const tile = map.tiles[x][y]; // This swaps coordinates!

// CORRECT:
const tile = map.tiles[y][x]; // Row first (y), then column (x)
// Or better, use accessor methods:
const tile = map.tiles.get(y, x);

// When iterating:
for (let y = 0; y < map.info.rowcount; y++) {
  for (let x = 0; x < map.info.colcount; x++) {
    // Process tile at (x, y)
    const tile = map.tiles.get(y, x);
  }
}
```

### 2. Tile ID Gaps
Not all tile IDs are sequential:

```typescript
// ⚠️ GOTCHA: Valid tile IDs have gaps!
// Valid: 0-14, 16-18, 25, 30
// Invalid: 15, 19-24, 26-29, 31+

const VALID_TILE_IDS = new Set([
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
  16, 17, 18, 25, 30
]);

function isValidTileId(id: number): boolean {
  return VALID_TILE_IDS.has(id);
}

// Don't do range checks:
// WRONG: if (id >= 0 && id <= 30) // This allows invalid IDs!
```

### 3. Optional Sections
Not all sections are required:

```typescript
// ⚠️ GOTCHA: Only info{} and tiles{} are required
// All other sections may be missing

// WRONG:
const crystals = map.resources.crystals; // May throw if resources is undefined

// CORRECT:
const crystals = map.resources?.crystals || [];
const objectiveCount = map.objectives?.length || 0;
const hasBuildings = map.buildings && map.buildings.length > 0;
```

### 4. Section Order Independence
Sections can appear in any order:

```typescript
// ⚠️ GOTCHA: Don't assume section order
// Sections can appear in ANY order in the file

// WRONG:
const sections = content.split(/\w+\{/);
const infoSection = sections[0]; // Assumes info is first

// CORRECT:
const sectionRegex = /(\w+)\s*\{([^}]*)\}/g;
const sections = new Map();
let match;
while ((match = sectionRegex.exec(content)) !== null) {
  sections.set(match[1], match[2]);
}
```

### 5. Height vs Elevation
Height values have specific ranges:

```typescript
// ⚠️ GOTCHA: Height values are 0-15, not 0-255
// Used for visual elevation and building placement

// WRONG:
map.height.set(y, x, 100); // Invalid height value

// CORRECT:
const MAX_HEIGHT = 15;
const clampedHeight = Math.min(Math.max(0, desiredHeight), MAX_HEIGHT);
map.height.set(y, x, clampedHeight);
```

### 6. Resource Amount Defaults
Resource amounts have different defaults:

```typescript
// ⚠️ GOTCHA: Different resources have different default amounts
// Crystals: 1 (if not specified)
// Ore: 3 (if not specified)
// Studs: 1 (if not specified)

// In resources{} section:
// "10,10,crystal" means 1 crystal at (10,10)
// "20,20,ore" means 3 ore at (20,20)
// "30,30,ore,5" means 5 ore at (30,30)
```

### 7. Building Placement Constraints
Buildings have placement rules:

```typescript
// ⚠️ GOTCHA: Buildings require flat, clear ground
// - All tiles in building footprint must be GROUND (0)
// - All tiles must have same height
// - No slopes > 1 height difference to neighbors

function canPlaceBuilding(
  map: MapData,
  x: number,
  y: number,
  buildingSize: {width: number, height: number}
): boolean {
  const baseHeight = map.height.get(y, x);
  
  // Check all tiles in footprint
  for (let dy = 0; dy < buildingSize.height; dy++) {
    for (let dx = 0; dx < buildingSize.width; dx++) {
      const tileX = x + dx;
      const tileY = y + dy;
      
      // Must be ground
      if (map.tiles.get(tileY, tileX) !== TileType.GROUND) {
        return false;
      }
      
      // Must be same height
      if (map.height.get(tileY, tileX) !== baseHeight) {
        return false;
      }
    }
  }
  
  return true;
}
```

### 8. String Escaping in Sections
String values need proper escaping:

```typescript
// ⚠️ GOTCHA: Quotes and special characters in strings

// In .dat file:
// name:"My Map"           // OK
// name:My Map             // OK if no special chars
// name:"John's \"Map\""   // Need to escape quotes
// description:"Line 1\nLine 2"  // Newlines need escaping
```

### 9. Memory Limits
Large maps consume significant memory:

```typescript
// ⚠️ GOTCHA: Memory usage scales quadratically
// 100x100 map = 10,000 tiles
// Each tile ~100 bytes in memory = 1MB base
// With rendering: 100x100 * 16px * 16px * 4 bytes = 10MB+

function estimateMemoryUsage(width: number, height: number): number {
  const tileCount = width * height;
  const bytesPerTile = 100; // Rough estimate
  const baseMemory = tileCount * bytesPerTile;
  
  // Add overhead for data structures
  const overhead = baseMemory * 0.5;
  
  return baseMemory + overhead;
}

// Check before processing
if (estimateMemoryUsage(width, height) > 100_000_000) { // 100MB
  console.warn('Large map may cause memory issues');
}
```

### 10. Validation vs Playability
Valid doesn't mean playable:

```typescript
// ⚠️ GOTCHA: A syntactically valid map may be unplayable
// Parser validation only checks format, not gameplay

// Format valid but unplayable:
// - No crystals but objective requires collecting crystals
// - Player spawn surrounded by solid rock
// - Resources in inaccessible areas
// - No path to objective

// Always check both:
const formatValid = map.validate();
const playable = checkPlayability(map); // Custom logic needed
```

## VSCode Extension Patterns

### 1. Webview Communication Pattern
Used in the map editor for UI updates:

```typescript
// Host -> Webview
panel.webview.postMessage({
  command: 'updateTiles',
  tiles: tileData,
  selection: currentSelection
});

// Webview -> Host
vscode.postMessage({
  command: 'tileClicked',
  position: { row: 10, col: 15 }
});
```

### 2. Validation Diagnostic Pattern
Report errors in the editor:

```typescript
function updateDiagnostics(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection
) {
  const diagnostics: vscode.Diagnostic[] = [];
  const validation = validateDatFile(document.getText());
  
  for (const error of validation.errors) {
    const range = new vscode.Range(
      error.line - 1, error.column,
      error.line - 1, error.column + 10
    );
    
    diagnostics.push(new vscode.Diagnostic(
      range,
      error.message,
      vscode.DiagnosticSeverity.Error
    ));
  }
  
  collection.set(document.uri, diagnostics);
}
```

### 3. Auto-Fix Provider Pattern
Provide quick fixes for common issues:

```typescript
class MapAutoFixProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    
    for (const diagnostic of context.diagnostics) {
      if (diagnostic.message.includes('Missing section')) {
        const fix = new vscode.CodeAction(
          'Add missing section',
          vscode.CodeActionKind.QuickFix
        );
        fix.edit = new vscode.WorkspaceEdit();
        // Add the missing section
        actions.push(fix);
      }
    }
    
    return actions;
  }
}
```

### 4. Performance Optimization Pattern
For large maps in the editor:

```typescript
class RenderOptimizer {
  private renderQueue: RenderTask[] = [];
  private isRendering = false;
  
  queueRender(task: RenderTask) {
    this.renderQueue.push(task);
    if (!this.isRendering) {
      this.processQueue();
    }
  }
  
  private async processQueue() {
    this.isRendering = true;
    
    while (this.renderQueue.length > 0) {
      // Batch similar operations
      const batch = this.renderQueue.splice(0, 10);
      await this.renderBatch(batch);
      
      // Yield to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    this.isRendering = false;
  }
}
```

### 5. Undo/Redo Pattern
Track edit history:

```typescript
class EditHistory<T> {
  private history: T[] = [];
  private currentIndex = -1;
  
  push(state: T) {
    // Remove any states after current
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(state);
    this.currentIndex++;
    
    // Limit history size
    if (this.history.length > 100) {
      this.history.shift();
      this.currentIndex--;
    }
  }
  
  undo(): T | undefined {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
  }
  
  redo(): T | undefined {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
  }
}
```

## Best Practices Summary

1. **Always validate** after loading or modifying maps
2. **Handle missing sections** gracefully with optional chaining
3. **Use type guards** for tile ID validation
4. **Remember coordinate system** - tiles[y][x] not tiles[x][y]
5. **Clone before modifying** to preserve originals
6. **Check memory usage** before processing large maps
7. **Test with edge cases** - empty maps, huge maps, missing sections
8. **Provide good error messages** with context about what failed
9. **Use TypeScript strictly** to catch type errors early
10. **Document assumptions** about map format in your code

## See Also

- [Map Generator README](./map-generator/README.md) - Generation algorithms
- [Map Parser README](./map-parser/README.md) - Parsing details
- [Map Visualizer README](./map-visualizer/README.md) - Rendering patterns
- [Main README](./README.md) - Format overview