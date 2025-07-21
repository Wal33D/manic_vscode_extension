# Pathfinding Algorithm

## Overview

Pathfinding in Manic Miners determines how Rock Raiders, vehicles, and creatures navigate the map. The game uses a modified A* algorithm with terrain-specific costs and constraints.

## Core Algorithm

### Basic A* Implementation

```typescript
interface PathNode {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // Total cost (g + h)
  parent: PathNode | null;
}

function findPath(
  start: Point,
  goal: Point,
  map: TileGrid,
  unit: UnitType
): Point[] | null {
  const openSet = new PriorityQueue<PathNode>();
  const closedSet = new Set<string>();
  
  const startNode: PathNode = {
    x: start.x,
    y: start.y,
    g: 0,
    h: heuristic(start, goal),
    f: 0,
    parent: null
  };
  startNode.f = startNode.g + startNode.h;
  
  openSet.enqueue(startNode);
  
  while (!openSet.isEmpty()) {
    const current = openSet.dequeue();
    
    // Goal reached
    if (current.x === goal.x && current.y === goal.y) {
      return reconstructPath(current);
    }
    
    closedSet.add(`${current.x},${current.y}`);
    
    // Check neighbors
    const neighbors = getNeighbors(current);
    
    for (const neighbor of neighbors) {
      const key = `${neighbor.x},${neighbor.y}`;
      if (closedSet.has(key)) continue;
      
      // Check if passable for this unit type
      if (!isPassable(map, neighbor.x, neighbor.y, unit)) {
        continue;
      }
      
      // Calculate costs
      const moveCost = getMoveCost(map, current, neighbor, unit);
      const g = current.g + moveCost;
      
      // Check if better path
      const existing = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
      if (existing && g >= existing.g) continue;
      
      // Add/update node
      const node: PathNode = {
        x: neighbor.x,
        y: neighbor.y,
        g: g,
        h: heuristic(neighbor, goal),
        f: 0,
        parent: current
      };
      node.f = node.g + node.h;
      
      if (existing) {
        openSet.update(node);
      } else {
        openSet.enqueue(node);
      }
    }
  }
  
  return null; // No path found
}
```

### Heuristic Functions

```typescript
// Manhattan distance (4-directional movement)
function manhattanDistance(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Euclidean distance (8-directional movement)
function euclideanDistance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Diagonal distance (optimized for 8-directional)
function diagonalDistance(a: Point, b: Point): number {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return Math.max(dx, dy) + (Math.sqrt(2) - 1) * Math.min(dx, dy);
}
```

## Terrain Costs

### Movement Cost Calculation

```typescript
function getMoveCost(
  map: TileGrid,
  from: PathNode,
  to: Point,
  unit: UnitType
): number {
  const fromTile = map.get(from.y, from.x);
  const toTile = map.get(to.y, to.x);
  
  // Base cost
  let cost = 1.0;
  
  // Diagonal movement
  if (from.x !== to.x && from.y !== to.y) {
    cost = Math.sqrt(2); // ~1.414
  }
  
  // Terrain modifiers
  cost *= getTerrainCost(toTile, unit);
  
  // Height difference
  const heightDiff = Math.abs(
    getHeight(map, to) - getHeight(map, from)
  );
  cost *= 1 + (heightDiff * 0.1);
  
  // Rubble penalty
  if (isRubble(toTile)) {
    cost *= getRubblePenalty(toTile);
  }
  
  // Power path bonus
  if (isPowerPath(toTile) && unit.canUsePowerPath) {
    cost *= 0.5; // Double speed
  }
  
  return cost;
}
```

### Terrain Cost Table

```typescript
const TERRAIN_COSTS: Record<UnitType, Record<TileType, number>> = {
  ROCK_RAIDER: {
    GROUND: 1.0,
    RUBBLE_1: 2.0,
    RUBBLE_2: 3.0,
    RUBBLE_3: 4.0,
    RUBBLE_4: 5.0,
    POWER_PATH: 0.5,
    WATER: Infinity,
    LAVA: Infinity,
    WALL: Infinity,
  },
  SMALL_DIGGER: {
    GROUND: 1.0,
    RUBBLE_1: 1.5,
    RUBBLE_2: 2.0,
    RUBBLE_3: 2.5,
    RUBBLE_4: 3.0,
    POWER_PATH: 0.7,
    WATER: Infinity,
    LAVA: Infinity,
    WALL: Infinity,
  },
  HOVER_SCOUT: {
    GROUND: 1.0,
    RUBBLE_1: 1.0,
    RUBBLE_2: 1.0,
    RUBBLE_3: 1.0,
    RUBBLE_4: 1.0,
    POWER_PATH: 1.0,
    WATER: 1.0,      // Can cross
    LAVA: 1.2,       // Slightly slower
    WALL: Infinity,
  },
  ROCK_MONSTER: {
    GROUND: 1.0,
    RUBBLE_1: 1.0,
    RUBBLE_2: 1.0,
    RUBBLE_3: 1.0,
    RUBBLE_4: 1.0,
    POWER_PATH: 1.0,
    WATER: Infinity,
    LAVA: Infinity,
    WALL: 0.0,       // Can walk through!
  }
};
```

## Unit-Specific Pathfinding

### Rock Raiders (Miners)

```typescript
class RockRaiderPathfinder {
  findPath(start: Point, goal: Point): Point[] | null {
    // Basic pathfinding with terrain costs
    return findPath(start, goal, this.map, UnitType.ROCK_RAIDER);
  }
  
  findPathToResource(start: Point): Point[] | null {
    // Find nearest collectible resource
    const resources = findAllResources(this.map);
    let bestPath: Point[] | null = null;
    let bestCost = Infinity;
    
    for (const resource of resources) {
      const path = this.findPath(start, resource);
      if (path && path.length < bestCost) {
        bestPath = path;
        bestCost = path.length;
      }
    }
    
    return bestPath;
  }
}
```

### Vehicles

```typescript
class VehiclePathfinder {
  private vehicleType: VehicleType;
  private size: number; // 1x1, 2x2, etc.
  
  canFit(x: number, y: number): boolean {
    // Check if vehicle size fits at position
    for (let dy = 0; dy < this.size; dy++) {
      for (let dx = 0; dx < this.size; dx++) {
        if (!isPassable(this.map, x + dx, y + dy, this.vehicleType)) {
          return false;
        }
      }
    }
    return true;
  }
  
  findPath(start: Point, goal: Point): Point[] | null {
    // Modified A* that checks vehicle size
    // Similar to basic but uses canFit() instead of isPassable()
    return findPathWithSize(start, goal, this.map, this.size);
  }
}
```

### Flying Units

```typescript
class FlyingPathfinder {
  findPath(start: Point, goal: Point): Point[] | null {
    // Straight line path for flying units
    return bresenhamLine(start, goal);
  }
  
  findPathAvoidingThreats(start: Point, goal: Point): Point[] | null {
    // A* with threat avoidance
    const threats = findAllThreats(this.map);
    
    return findPath(start, goal, this.map, UnitType.FLYING, {
      customCost: (node: PathNode) => {
        let cost = 1.0;
        
        // Add penalty for being near threats
        for (const threat of threats) {
          const dist = distance(node, threat);
          if (dist < 5) {
            cost += (5 - dist) * 2;
          }
        }
        
        return cost;
      }
    });
  }
}
```

### Creatures

```typescript
class CreaturePathfinder {
  private aggressionLevel: number;
  
  findPathToTarget(start: Point, target: Unit): Point[] | null {
    const goal = target.position;
    
    // Rock Monsters can path through walls
    if (this.creatureType === CreatureType.ROCK_MONSTER) {
      return findPathThroughWalls(start, goal);
    }
    
    // Normal pathfinding for others
    return findPath(start, goal, this.map, this.creatureType);
  }
  
  findPatrolPath(center: Point, radius: number): Point[] {
    // Generate circular patrol route
    const points: Point[] = [];
    const steps = 8;
    
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const x = center.x + Math.round(Math.cos(angle) * radius);
      const y = center.y + Math.round(Math.sin(angle) * radius);
      
      if (isValid(x, y)) {
        points.push({x, y});
      }
    }
    
    // Connect points with paths
    const fullPath: Point[] = [];
    for (let i = 0; i < points.length; i++) {
      const next = (i + 1) % points.length;
      const segment = findPath(points[i], points[next]);
      if (segment) {
        fullPath.push(...segment);
      }
    }
    
    return fullPath;
  }
}
```

## Optimization Techniques

### Hierarchical Pathfinding

```typescript
class HierarchicalPathfinder {
  private clusters: ClusterGraph;
  private clusterSize = 8;
  
  constructor(map: TileGrid) {
    this.clusters = this.buildClusters(map);
  }
  
  findPath(start: Point, goal: Point): Point[] | null {
    // Find cluster path first
    const startCluster = this.getCluster(start);
    const goalCluster = this.getCluster(goal);
    
    if (startCluster === goalCluster) {
      // Same cluster - direct path
      return findPath(start, goal, this.map);
    }
    
    // Find path between clusters
    const clusterPath = this.findClusterPath(startCluster, goalCluster);
    if (!clusterPath) return null;
    
    // Build full path through clusters
    const fullPath: Point[] = [];
    let current = start;
    
    for (const cluster of clusterPath) {
      const entry = this.findClusterEntry(current, cluster);
      const exit = this.findClusterExit(cluster, goal);
      
      const segment = findPath(current, exit, this.map);
      if (segment) {
        fullPath.push(...segment);
        current = exit;
      }
    }
    
    return fullPath;
  }
}
```

### Path Caching

```typescript
class CachedPathfinder {
  private cache = new Map<string, Point[]>();
  private maxCacheSize = 100;
  
  findPath(start: Point, goal: Point): Point[] | null {
    const key = `${start.x},${start.y}-${goal.x},${goal.y}`;
    
    // Check cache
    if (this.cache.has(key)) {
      const cached = this.cache.get(key)!;
      if (this.isPathValid(cached)) {
        return cached;
      }
      this.cache.delete(key);
    }
    
    // Calculate path
    const path = findPath(start, goal, this.map);
    
    if (path) {
      // Cache result
      this.cache.set(key, path);
      
      // Evict old entries if needed
      if (this.cache.size > this.maxCacheSize) {
        const oldest = this.cache.keys().next().value;
        this.cache.delete(oldest);
      }
    }
    
    return path;
  }
  
  isPathValid(path: Point[]): boolean {
    // Check if all tiles in path are still passable
    for (const point of path) {
      if (!isPassable(this.map, point.x, point.y)) {
        return false;
      }
    }
    return true;
  }
}
```

### Jump Point Search (JPS)

```typescript
function jumpPointSearch(start: Point, goal: Point, map: TileGrid): Point[] | null {
  // JPS optimization for uniform-cost grids
  // Reduces nodes explored by "jumping" over symmetrical paths
  
  function jump(x: number, y: number, dx: number, dy: number): Point | null {
    const next = {x: x + dx, y: y + dy};
    
    if (!isPassable(map, next.x, next.y)) return null;
    if (next.x === goal.x && next.y === goal.y) return next;
    
    // Check forced neighbors
    if (dx !== 0 && dy !== 0) {
      // Diagonal move
      if ((isPassable(map, x - dx, y + dy) && !isPassable(map, x - dx, y)) ||
          (isPassable(map, x + dx, y - dy) && !isPassable(map, x, y - dy))) {
        return next;
      }
      
      // Continue diagonal
      if (jump(next.x, next.y, dx, 0) || jump(next.x, next.y, 0, dy)) {
        return next;
      }
    } else {
      // Straight move
      if (dx !== 0) {
        // Horizontal
        if ((isPassable(map, x + dx, y + 1) && !isPassable(map, x, y + 1)) ||
            (isPassable(map, x + dx, y - 1) && !isPassable(map, x, y - 1))) {
          return next;
        }
      } else {
        // Vertical
        if ((isPassable(map, x + 1, y + dy) && !isPassable(map, x + 1, y)) ||
            (isPassable(map, x - 1, y + dy) && !isPassable(map, x - 1, y))) {
          return next;
        }
      }
    }
    
    // Continue jumping
    return jump(next.x, next.y, dx, dy);
  }
  
  // Use jump() in A* instead of single-step neighbors
  // Implementation details omitted for brevity
  return null;
}
```

## Dynamic Obstacles

### Moving Units Avoidance

```typescript
function findPathAvoidingUnits(
  start: Point,
  goal: Point,
  movingUnits: Unit[]
): Point[] | null {
  // Predict unit positions
  const predictions = predictUnitPositions(movingUnits);
  
  // Modified A* with time dimension
  return findPathWithTime(start, goal, predictions);
}

function predictUnitPositions(units: Unit[]): Map<number, Set<string>> {
  const predictions = new Map<number, Set<string>>();
  
  for (let time = 0; time < 30; time++) {
    const positions = new Set<string>();
    
    for (const unit of units) {
      const futurePos = predictPosition(unit, time);
      positions.add(`${futurePos.x},${futurePos.y}`);
    }
    
    predictions.set(time, positions);
  }
  
  return predictions;
}
```

### Dynamic Map Changes

```typescript
class DynamicPathfinder {
  private mapVersion = 0;
  private pathCache = new Map<string, {path: Point[], version: number}>();
  
  onMapChange(changes: TileChange[]): void {
    this.mapVersion++;
    
    // Invalidate affected cached paths
    for (const [key, cached] of this.pathCache) {
      if (this.pathAffectedByChanges(cached.path, changes)) {
        this.pathCache.delete(key);
      }
    }
  }
  
  findPath(start: Point, goal: Point): Point[] | null {
    const key = `${start.x},${start.y}-${goal.x},${goal.y}`;
    const cached = this.pathCache.get(key);
    
    if (cached && cached.version === this.mapVersion) {
      return cached.path;
    }
    
    const path = findPath(start, goal, this.map);
    if (path) {
      this.pathCache.set(key, {path, version: this.mapVersion});
    }
    
    return path;
  }
}
```

## Performance Considerations

### Early Exit Strategies

```typescript
function findPathWithLimit(
  start: Point,
  goal: Point,
  maxNodes: number = 1000
): Point[] | null {
  let nodesExplored = 0;
  
  // Modified A* with node limit
  while (!openSet.isEmpty() && nodesExplored < maxNodes) {
    nodesExplored++;
    // ... rest of A* algorithm
  }
  
  if (nodesExplored >= maxNodes) {
    // Fallback to simple path
    return bresenhamLine(start, goal);
  }
}
```

### Batch Pathfinding

```typescript
function findMultiplePaths(requests: PathRequest[]): PathResult[] {
  // Sort by priority
  requests.sort((a, b) => b.priority - a.priority);
  
  const results: PathResult[] = [];
  const timeLimit = 16; // ms per frame
  const startTime = performance.now();
  
  for (const request of requests) {
    if (performance.now() - startTime > timeLimit) {
      // Defer remaining to next frame
      setTimeout(() => findMultiplePaths(requests.slice(results.length)), 0);
      break;
    }
    
    const path = findPath(request.start, request.goal);
    results.push({id: request.id, path});
  }
  
  return results;
}
```

## Common Issues and Solutions

### Issue: Units Getting Stuck
**Solution**: Implement local avoidance
```typescript
function unstickUnit(unit: Unit): void {
  const spiralOffsets = generateSpiral(3);
  
  for (const offset of spiralOffsets) {
    const newPos = {
      x: unit.x + offset.x,
      y: unit.y + offset.y
    };
    
    if (isPassable(map, newPos.x, newPos.y)) {
      unit.moveTo(newPos);
      return;
    }
  }
}
```

### Issue: Path Invalidation
**Solution**: Incremental replanning
```typescript
function updatePath(unit: Unit): void {
  if (!unit.path || unit.pathIndex >= unit.path.length) return;
  
  // Check next few waypoints
  for (let i = unit.pathIndex; i < Math.min(unit.pathIndex + 3, unit.path.length); i++) {
    const waypoint = unit.path[i];
    if (!isPassable(map, waypoint.x, waypoint.y)) {
      // Replan from current position
      const newPath = findPath(unit.position, unit.goal);
      if (newPath) {
        unit.path = newPath;
        unit.pathIndex = 0;
      }
      return;
    }
  }
}
```

## See Also
- [Terrain Generation](terrain-generation.md) - Map structure
- [Common Patterns](../common-patterns.md) - Implementation tips
- [Cave Generation](cave-generation.md) - Passability rules