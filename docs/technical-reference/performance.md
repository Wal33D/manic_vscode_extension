# Performance Optimization Guide

This guide covers performance considerations and optimization techniques for working with Manic Miners maps, including parsing, generation, visualization, and scripting.

## Overview

Performance is critical when working with:
- Large maps (80x80+ tiles)
- Complex scripts with many triggers
- Real-time visualization
- Batch processing operations
- Memory-constrained environments

## Map Size Guidelines

### Recommended Limits

| Map Size | Category | Performance Impact | Use Case |
|----------|----------|-------------------|----------|
| 10x10 - 25x25 | Tiny | Negligible | Tutorials, tests |
| 25x25 - 40x40 | Small | Minimal | Quick missions |
| 40x40 - 60x60 | Medium | Moderate | Standard maps |
| 60x60 - 80x80 | Large | Noticeable | Complex missions |
| 80x80 - 100x100 | Huge | Significant | Epic campaigns |
| 100x100+ | Extreme | Severe | Special cases only |

### Memory Usage Estimation

```typescript
function estimateMemoryUsage(rows: number, cols: number): MemoryEstimate {
  const tileCount = rows * cols;
  
  // Base map data
  const tilesMemory = tileCount * 4;        // 4 bytes per tile ID
  const heightMemory = tileCount * 4;       // 4 bytes per height
  const metadataMemory = 1024;              // ~1KB for info section
  
  // Dynamic data (approximate)
  const scriptMemory = 10 * 1024;           // ~10KB average
  const resourceMemory = tileCount * 0.1;   // ~10% tiles have resources
  const objectMemory = tileCount * 0.05;    // ~5% tiles have objects
  
  const total = tilesMemory + heightMemory + metadataMemory + 
                scriptMemory + resourceMemory + objectMemory;
  
  return {
    bytes: total,
    megabytes: total / (1024 * 1024),
    breakdown: {
      tiles: tilesMemory,
      height: heightMemory,
      metadata: metadataMemory,
      script: scriptMemory,
      resources: resourceMemory,
      objects: objectMemory
    }
  };
}

// Example: 60x60 map
// ~28KB base + ~13KB dynamic = ~41KB total
```

## Parsing Performance

### Optimization Strategies

#### 1. Lazy Section Loading

```typescript
class LazyMapParser {
  private sections = new Map<string, () => any>();
  private cache = new Map<string, any>();
  
  constructor(private content: string) {
    // Register lazy loaders
    this.sections.set('tiles', () => this.parseTiles());
    this.sections.set('script', () => this.parseScript());
    // ... more sections
  }
  
  getSection(name: string): any {
    if (!this.cache.has(name)) {
      const loader = this.sections.get(name);
      if (loader) {
        this.cache.set(name, loader());
      }
    }
    return this.cache.get(name);
  }
  
  // Only parse what's needed
  getTiles() { return this.getSection('tiles'); }
  getScript() { return this.getSection('script'); }
}
```

#### 2. Stream Parsing

```typescript
import { Transform } from 'stream';

class MapStreamParser extends Transform {
  private buffer = '';
  private currentSection = '';
  private lineNumber = 0;
  
  _transform(chunk: Buffer, encoding: string, callback: Function) {
    this.buffer += chunk.toString();
    
    // Process complete lines
    let newlineIndex;
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, newlineIndex);
      this.buffer = this.buffer.slice(newlineIndex + 1);
      
      this.processLine(line);
      this.lineNumber++;
    }
    
    callback();
  }
  
  processLine(line: string) {
    // Emit parsed data immediately
    if (line.includes('{')) {
      this.currentSection = line.split('{')[0].trim();
      this.emit('section-start', this.currentSection);
    } else if (line.includes('}')) {
      this.emit('section-end', this.currentSection);
      this.currentSection = '';
    } else if (this.currentSection) {
      this.emit('data', { section: this.currentSection, line });
    }
  }
}
```

#### 3. Optimized Grid Parsing

```typescript
// Fast CSV parsing for grid sections
function parseGridOptimized(content: string): number[][] {
  const lines = content.trim().split('\n');
  const result: number[][] = new Array(lines.length);
  
  for (let i = 0; i < lines.length; i++) {
    // Pre-allocate array size
    const values = lines[i].split(',');
    const row = new Array(values.length);
    
    // Use bitwise operations for int conversion (faster)
    for (let j = 0; j < values.length; j++) {
      row[j] = values[j] | 0;
    }
    
    result[i] = row;
  }
  
  return result;
}

// Using typed arrays for better performance
function parseGridTyped(content: string, width: number, height: number): Uint8Array {
  const result = new Uint8Array(width * height);
  const lines = content.trim().split('\n');
  
  let index = 0;
  for (const line of lines) {
    const values = line.split(',');
    for (const value of values) {
      result[index++] = parseInt(value);
    }
  }
  
  return result;
}
```

### Parsing Benchmarks

| Operation | Small (25x25) | Medium (50x50) | Large (100x100) |
|-----------|---------------|----------------|------------------|
| Full Parse | 5-10ms | 20-40ms | 100-200ms |
| Lazy Parse | 1-2ms | 2-5ms | 5-10ms |
| Stream Parse | 10-15ms | 30-50ms | 120-250ms |
| Grid Only | 1-3ms | 5-10ms | 20-40ms |

## Script Performance

### Trigger Optimization

#### 1. Minimize Active Triggers

```typescript
// BAD: Many similar triggers
when(enter:10,10:miners)[ShowMessage1];
when(enter:10,11:miners)[ShowMessage1];
when(enter:11,10:miners)[ShowMessage1];
when(enter:11,11:miners)[ShowMessage1];

// GOOD: Use area detection
when(enter:10,10:miners)[CheckArea];
when(enter:10,11:miners)[CheckArea];
when(enter:11,10:miners)[CheckArea];
when(enter:11,11:miners)[CheckArea];

CheckArea::
((AreaMessageShown == false))[ShowMessage1; AreaMessageShown:true];
```

#### 2. Efficient Conditions

```typescript
// BAD: Complex condition checked frequently
when(crystals > 50 and ore > 25 and 
     buildings.BuildingToolStore_C > 0 and 
     miners > 5 and time < 600)[ComplexCheck];

// GOOD: Break into stages
bool Stage1Complete=false
bool Stage2Complete=false

when(crystals > 50 and Stage1Complete == false)[CheckStage1];
when(Stage1Complete == true and ore > 25 and Stage2Complete == false)[CheckStage2];

CheckStage1::
Stage1Complete:true;

CheckStage2::
((buildings.BuildingToolStore_C > 0 and miners > 5))[Stage2Complete:true];
```

#### 3. Avoid Tick Events

```typescript
// BAD: Runs 350+ times per second!
tick::
UpdateCounter;
CheckConditions;

// GOOD: Use timer or specific triggers
timer UpdateTimer=0.0,1.0,1.0,PeriodicUpdate

PeriodicUpdate::
UpdateCounter;
CheckConditions;
```

### Script Profiling

```typescript
class ScriptProfiler {
  private metrics = new Map<string, {
    calls: number;
    totalTime: number;
    avgTime: number;
  }>();
  
  profile(name: string, fn: () => void) {
    const start = performance.now();
    fn();
    const duration = performance.now() - start;
    
    const metric = this.metrics.get(name) || {
      calls: 0,
      totalTime: 0,
      avgTime: 0
    };
    
    metric.calls++;
    metric.totalTime += duration;
    metric.avgTime = metric.totalTime / metric.calls;
    
    this.metrics.set(name, metric);
  }
  
  report() {
    console.log('Script Performance Report:');
    for (const [name, metric] of this.metrics) {
      console.log(`${name}: ${metric.calls} calls, ` +
                  `${metric.avgTime.toFixed(2)}ms avg, ` +
                  `${metric.totalTime.toFixed(2)}ms total`);
    }
  }
}
```

## Visualization Performance

### Rendering Optimization

#### 1. Tile Batching

```typescript
function renderTilesBatched(ctx: CanvasRenderingContext2D, tiles: number[][], scale: number) {
  // Group by color to minimize state changes
  const batches = new Map<string, Array<{x: number, y: number}>>();
  
  // First pass: group tiles
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      const color = getTileColor(tiles[y][x]);
      const key = JSON.stringify(color);
      
      if (!batches.has(key)) {
        batches.set(key, []);
      }
      batches.get(key)!.push({x, y});
    }
  }
  
  // Second pass: render batches
  for (const [colorKey, positions] of batches) {
    const color = JSON.parse(colorKey);
    ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
    
    // Draw all tiles of this color at once
    for (const {x, y} of positions) {
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
}
```

#### 2. Canvas Pooling

```typescript
class CanvasPool {
  private available: HTMLCanvasElement[] = [];
  private inUse = new Set<HTMLCanvasElement>();
  
  acquire(width: number, height: number): HTMLCanvasElement {
    // Try to reuse existing canvas
    for (let i = 0; i < this.available.length; i++) {
      const canvas = this.available[i];
      if (canvas.width >= width && canvas.height >= height) {
        this.available.splice(i, 1);
        this.inUse.add(canvas);
        
        // Clear and resize
        canvas.width = width;
        canvas.height = height;
        return canvas;
      }
    }
    
    // Create new canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    this.inUse.add(canvas);
    return canvas;
  }
  
  release(canvas: HTMLCanvasElement) {
    if (this.inUse.delete(canvas)) {
      // Clear canvas
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      this.available.push(canvas);
    }
  }
  
  clear() {
    this.available = [];
    this.inUse.clear();
  }
}
```

#### 3. Level of Detail (LOD)

```typescript
function renderWithLOD(map: MapData, viewport: Viewport, scale: number) {
  const lodScale = calculateLODScale(viewport, scale);
  
  if (lodScale < 0.5) {
    // Ultra low detail - just colors
    renderBlockColors(map, viewport);
  } else if (lodScale < 1.0) {
    // Low detail - no resources or grid
    renderTilesOnly(map, viewport, lodScale);
  } else if (lodScale < 2.0) {
    // Medium detail - tiles and resources
    renderTilesAndResources(map, viewport, lodScale);
  } else {
    // Full detail - everything
    renderFullDetail(map, viewport, lodScale);
  }
}

function calculateLODScale(viewport: Viewport, baseScale: number): number {
  const tilesVisible = viewport.width * viewport.height;
  
  if (tilesVisible > 10000) return 0.25;  // 100x100 view
  if (tilesVisible > 5000) return 0.5;    // 70x70 view
  if (tilesVisible > 2000) return 1.0;    // 45x45 view
  return 2.0;                             // Full detail
}
```

### Rendering Benchmarks

| Map Size | Basic Render | With Effects | With Overlay | Full Quality |
|----------|--------------|--------------|--------------|---------------|
| 25x25 | 5ms | 10ms | 15ms | 20ms |
| 50x50 | 20ms | 40ms | 60ms | 80ms |
| 100x100 | 80ms | 160ms | 240ms | 320ms |

## Memory Optimization

### 1. Sparse Data Structures

```typescript
class SparseGrid<T> {
  private data = new Map<string, T>();
  private defaultValue: T;
  
  constructor(defaultValue: T) {
    this.defaultValue = defaultValue;
  }
  
  set(x: number, y: number, value: T) {
    if (value === this.defaultValue) {
      this.data.delete(`${x},${y}`);
    } else {
      this.data.set(`${x},${y}`, value);
    }
  }
  
  get(x: number, y: number): T {
    return this.data.get(`${x},${y}`) ?? this.defaultValue;
  }
  
  getMemoryUsage(): number {
    // Only stores non-default values
    return this.data.size * 8; // Approximate
  }
}

// Example: 100x100 map with 90% ground tiles
// Full array: 10,000 * 4 bytes = 40KB
// Sparse grid: 1,000 * 8 bytes = 8KB (80% savings)
```

### 2. Object Pooling

```typescript
class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;
  
  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void,
    maxSize: number = 100
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }
  
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }
  
  release(obj: T) {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }
  
  clear() {
    this.pool = [];
  }
}

// Usage example
const tilePool = new ObjectPool(
  () => ({ id: 0, color: null }),
  (tile) => { tile.id = 0; tile.color = null; },
  1000
);
```

### 3. Memory Monitoring

```typescript
class MemoryMonitor {
  private baseline: number;
  private measurements: Array<{time: number, usage: number}> = [];
  
  start() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.baseline = process.memoryUsage().heapUsed;
    }
  }
  
  measure(label: string) {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage().heapUsed;
      const delta = usage - this.baseline;
      
      this.measurements.push({
        time: Date.now(),
        usage: delta
      });
      
      console.log(`[Memory] ${label}: ${(delta / 1024 / 1024).toFixed(2)}MB`);
    }
  }
  
  report() {
    const peak = Math.max(...this.measurements.map(m => m.usage));
    const average = this.measurements.reduce((sum, m) => sum + m.usage, 0) / 
                    this.measurements.length;
    
    console.log(`Memory Report:`);
    console.log(`  Peak: ${(peak / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Average: ${(average / 1024 / 1024).toFixed(2)}MB`);
  }
}
```

## Batch Processing

### Parallel Processing

```typescript
import { Worker } from 'worker_threads';
import os from 'os';

class BatchProcessor {
  private workers: Worker[] = [];
  private taskQueue: any[] = [];
  private results: any[] = [];
  
  constructor(private workerPath: string) {
    const numWorkers = os.cpus().length;
    
    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(workerPath);
      
      worker.on('message', (result) => {
        this.results.push(result);
        this.processNext(worker);
      });
      
      this.workers.push(worker);
    }
  }
  
  async processBatch(items: any[]): Promise<any[]> {
    this.taskQueue = [...items];
    this.results = [];
    
    // Start initial tasks
    for (const worker of this.workers) {
      this.processNext(worker);
    }
    
    // Wait for completion
    return new Promise((resolve) => {
      const checkComplete = setInterval(() => {
        if (this.results.length === items.length) {
          clearInterval(checkComplete);
          resolve(this.results);
        }
      }, 100);
    });
  }
  
  private processNext(worker: Worker) {
    const task = this.taskQueue.shift();
    if (task) {
      worker.postMessage(task);
    }
  }
  
  terminate() {
    for (const worker of this.workers) {
      worker.terminate();
    }
  }
}
```

### Chunked Processing

```typescript
async function processInChunks<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  chunkSize: number = 100,
  onProgress?: (percent: number) => void
): Promise<R[]> {
  const results: R[] = [];
  const total = items.length;
  
  for (let i = 0; i < total; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    
    // Process chunk
    const chunkResults = await Promise.all(
      chunk.map(item => processor(item))
    );
    
    results.push(...chunkResults);
    
    // Report progress
    if (onProgress) {
      onProgress((i + chunk.length) / total * 100);
    }
    
    // Yield to prevent blocking
    await new Promise(resolve => setImmediate(resolve));
  }
  
  return results;
}
```

## Caching Strategies

### 1. LRU Cache

```typescript
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private readonly maxSize: number;
  
  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }
  
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }
  
  set(key: K, value: V) {
    // Remove if exists (to update position)
    this.cache.delete(key);
    
    // Add to end
    this.cache.set(key, value);
    
    // Remove oldest if over limit
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  
  clear() {
    this.cache.clear();
  }
}
```

### 2. Memoization

```typescript
function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
}

// Usage
const expensiveCalculation = memoize(
  (mapData: MapData) => {
    // Complex pathfinding calculation
    return calculateAllPaths(mapData);
  },
  (mapData) => `${mapData.id}-${mapData.version}`
);
```

## Best Practices Summary

### Do's

1. **Profile before optimizing**
   - Measure actual performance
   - Identify real bottlenecks
   - Set performance targets

2. **Use appropriate data structures**
   - Typed arrays for numeric grids
   - Sparse structures for mostly-empty data
   - Maps for key-value lookups

3. **Batch operations**
   - Group similar operations
   - Process in chunks
   - Use worker threads for CPU-intensive tasks

4. **Cache strategically**
   - Cache expensive calculations
   - Implement cache invalidation
   - Monitor cache hit rates

5. **Optimize rendering**
   - Use canvas efficiently
   - Implement LOD systems
   - Batch draw calls

### Don'ts

1. **Avoid premature optimization**
   - Don't optimize without measurements
   - Don't sacrifice readability unnecessarily
   - Don't over-engineer solutions

2. **Prevent memory leaks**
   - Clear references when done
   - Limit cache sizes
   - Clean up event listeners

3. **Minimize script overhead**
   - Avoid tick events
   - Reduce active triggers
   - Simplify conditions

4. **Don't block the main thread**
   - Use async operations
   - Implement progress callbacks
   - Yield periodically

## Performance Monitoring Tools

```typescript
class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  
  startTimer(name: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      
      this.metrics.get(name)!.push(duration);
    };
  }
  
  getStats(name: string) {
    const times = this.metrics.get(name) || [];
    if (times.length === 0) return null;
    
    const sorted = [...times].sort((a, b) => a - b);
    
    return {
      count: times.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: times.reduce((a, b) => a + b) / times.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
  
  report() {
    console.log('Performance Report:');
    console.log('-'.repeat(80));
    
    for (const [name, times] of this.metrics) {
      const stats = this.getStats(name)!;
      console.log(`${name}:`);
      console.log(`  Calls: ${stats.count}`);
      console.log(`  Avg: ${stats.avg.toFixed(2)}ms`);
      console.log(`  P50: ${stats.p50.toFixed(2)}ms`);
      console.log(`  P90: ${stats.p90.toFixed(2)}ms`);
      console.log(`  P99: ${stats.p99.toFixed(2)}ms`);
      console.log();
    }
  }
}

// Usage
const monitor = new PerformanceMonitor();

const endTimer = monitor.startTimer('parseMap');
// ... do work ...
endTimer();

monitor.report();
```

## See Also

- [Parsing Patterns](parsing-patterns.md) - Optimized parsing techniques
- [Visualization Techniques](visualization-techniques.md) - Rendering optimization
- [Script Overview](../game-reference/scripting/overview.md) - Script performance tips
- [Technical Reference](README.md) - Architecture overview