/**
 * Pathfinding Utility Example
 * 
 * This example demonstrates various pathfinding algorithms for Manic Miners maps,
 * including A*, Dijkstra, flow fields, and specialized mining paths.
 */

// Types
export interface Point {
  x: number;
  y: number;
}

export interface PathNode extends Point {
  g: number; // Cost from start
  h: number; // Heuristic to end
  f: number; // Total cost (g + h)
  parent?: PathNode;
}

export interface PathfindingOptions {
  allowDiagonal?: boolean;
  maxSearchNodes?: number;
  heuristic?: 'manhattan' | 'euclidean' | 'chebyshev';
  canMine?: boolean; // Allow pathing through minable tiles
  miningCost?: number; // Extra cost for mining
}

export type CostFunction = (fromTile: number, toTile: number, x: number, y: number) => number;

/**
 * A* Pathfinding Algorithm
 */
export function findPath(
  tiles: number[][],
  start: Point,
  end: Point,
  options: PathfindingOptions = {}
): Point[] | null {
  const opts = {
    allowDiagonal: false,
    maxSearchNodes: 1000,
    heuristic: 'manhattan' as const,
    canMine: false,
    miningCost: 10,
    ...options
  };
  
  // Check if start and end are valid
  if (!isValidPosition(tiles, start) || !isValidPosition(tiles, end)) {
    return null;
  }
  
  const openList: PathNode[] = [];
  const closedSet = new Set<string>();
  const nodeMap = new Map<string, PathNode>();
  
  // Create start node
  const startNode: PathNode = {
    x: start.x,
    y: start.y,
    g: 0,
    h: getHeuristic(start, end, opts.heuristic),
    f: 0
  };
  startNode.f = startNode.g + startNode.h;
  
  openList.push(startNode);
  nodeMap.set(getKey(start), startNode);
  
  let nodesSearched = 0;
  
  while (openList.length > 0 && nodesSearched < opts.maxSearchNodes) {
    // Get node with lowest f score
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift()!;
    nodesSearched++;
    
    // Check if we reached the goal
    if (current.x === end.x && current.y === end.y) {
      return reconstructPath(current);
    }
    
    closedSet.add(getKey(current));
    
    // Check neighbors
    const neighbors = getNeighbors(tiles, current, opts.allowDiagonal);
    
    for (const neighbor of neighbors) {
      const key = getKey(neighbor);
      
      if (closedSet.has(key)) continue;
      
      // Calculate movement cost
      const moveCost = getMovementCost(
        tiles,
        current,
        neighbor,
        opts.canMine,
        opts.miningCost
      );
      
      if (moveCost === Infinity) continue;
      
      const g = current.g + moveCost;
      
      let neighborNode = nodeMap.get(key);
      
      if (!neighborNode) {
        // Create new node
        neighborNode = {
          x: neighbor.x,
          y: neighbor.y,
          g: g,
          h: getHeuristic(neighbor, end, opts.heuristic),
          f: 0,
          parent: current
        };
        neighborNode.f = neighborNode.g + neighborNode.h;
        
        openList.push(neighborNode);
        nodeMap.set(key, neighborNode);
      } else if (g < neighborNode.g) {
        // Update existing node
        neighborNode.g = g;
        neighborNode.f = g + neighborNode.h;
        neighborNode.parent = current;
        
        // Re-add to open list if not already there
        if (!openList.includes(neighborNode)) {
          openList.push(neighborNode);
        }
      }
    }
  }
  
  return null; // No path found
}

/**
 * Dijkstra's Algorithm (finds shortest path to all reachable tiles)
 */
export function dijkstraMap(
  tiles: number[][],
  start: Point,
  options: PathfindingOptions = {}
): Map<string, number> {
  const distances = new Map<string, number>();
  const visited = new Set<string>();
  const queue: Array<{point: Point, dist: number}> = [];
  
  // Initialize
  queue.push({point: start, dist: 0});
  distances.set(getKey(start), 0);
  
  while (queue.length > 0) {
    // Sort by distance
    queue.sort((a, b) => a.dist - b.dist);
    const {point: current, dist} = queue.shift()!;
    const currentKey = getKey(current);
    
    if (visited.has(currentKey)) continue;
    visited.add(currentKey);
    
    // Check neighbors
    const neighbors = getNeighbors(tiles, current, options.allowDiagonal);
    
    for (const neighbor of neighbors) {
      const neighborKey = getKey(neighbor);
      
      if (visited.has(neighborKey)) continue;
      
      const moveCost = getMovementCost(
        tiles,
        current,
        neighbor,
        options.canMine || false,
        options.miningCost || 10
      );
      
      if (moveCost === Infinity) continue;
      
      const newDist = dist + moveCost;
      const currentDist = distances.get(neighborKey) || Infinity;
      
      if (newDist < currentDist) {
        distances.set(neighborKey, newDist);
        queue.push({point: neighbor, dist: newDist});
      }
    }
  }
  
  return distances;
}

/**
 * Flow Field Pathfinding (efficient for multiple agents)
 */
export interface FlowField {
  directions: Array<Array<{dx: number, dy: number} | null>>;
  distances: number[][];
}

export function generateFlowField(
  tiles: number[][],
  targets: Point[],
  options: PathfindingOptions = {}
): FlowField {
  const height = tiles.length;
  const width = tiles[0].length;
  
  // Initialize distance field
  const distances: number[][] = [];
  for (let y = 0; y < height; y++) {
    distances[y] = new Array(width).fill(Infinity);
  }
  
  // BFS from all targets
  const queue: Array<{point: Point, dist: number}> = [];
  
  for (const target of targets) {
    if (isValidPosition(tiles, target)) {
      queue.push({point: target, dist: 0});
      distances[target.y][target.x] = 0;
    }
  }
  
  while (queue.length > 0) {
    const {point: current, dist} = queue.shift()!;
    
    const neighbors = getNeighbors(tiles, current, options.allowDiagonal);
    
    for (const neighbor of neighbors) {
      const moveCost = getMovementCost(
        tiles,
        current,
        neighbor,
        options.canMine || false,
        options.miningCost || 10
      );
      
      if (moveCost === Infinity) continue;
      
      const newDist = dist + moveCost;
      
      if (newDist < distances[neighbor.y][neighbor.x]) {
        distances[neighbor.y][neighbor.x] = newDist;
        queue.push({point: neighbor, dist: newDist});
      }
    }
  }
  
  // Generate direction field
  const directions: Array<Array<{dx: number, dy: number} | null>> = [];
  
  for (let y = 0; y < height; y++) {
    directions[y] = [];
    for (let x = 0; x < width; x++) {
      if (distances[y][x] === Infinity) {
        directions[y][x] = null;
      } else {
        directions[y][x] = getBestDirection(distances, {x, y}, options.allowDiagonal);
      }
    }
  }
  
  return { directions, distances };
}

/**
 * Follow flow field from a point
 */
export function followFlowField(
  flowField: FlowField,
  start: Point,
  maxSteps: number = 1000
): Point[] {
  const path: Point[] = [];
  let current = {...start};
  let steps = 0;
  
  while (steps < maxSteps) {
    path.push({...current});
    
    const direction = flowField.directions[current.y]?.[current.x];
    if (!direction) break;
    
    current.x += direction.dx;
    current.y += direction.dy;
    
    // Check if we reached a target (distance 0)
    if (flowField.distances[current.y]?.[current.x] === 0) {
      path.push({...current});
      break;
    }
    
    steps++;
  }
  
  return path;
}

/**
 * Mining-aware pathfinding (finds optimal path considering mining time)
 */
export function findMiningPath(
  tiles: number[][],
  start: Point,
  end: Point,
  miningSpeed: Map<number, number> // Tile ID -> mining time
): Point[] | null {
  // Custom cost function for mining
  const getMiningCost = (fromTile: number, toTile: number): number => {
    if (isPassableTile(toTile)) return 1;
    if (miningSpeed.has(toTile)) return miningSpeed.get(toTile)!;
    return Infinity;
  };
  
  return findPathWithCost(tiles, start, end, getMiningCost);
}

/**
 * Find path with custom cost function
 */
export function findPathWithCost(
  tiles: number[][],
  start: Point,
  end: Point,
  costFn: CostFunction,
  heuristic: PathfindingOptions['heuristic'] = 'manhattan'
): Point[] | null {
  const openList: PathNode[] = [];
  const closedSet = new Set<string>();
  const nodeMap = new Map<string, PathNode>();
  
  // Create start node
  const startNode: PathNode = {
    x: start.x,
    y: start.y,
    g: 0,
    h: getHeuristic(start, end, heuristic),
    f: 0
  };
  startNode.f = startNode.g + startNode.h;
  
  openList.push(startNode);
  nodeMap.set(getKey(start), startNode);
  
  while (openList.length > 0) {
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift()!;
    
    if (current.x === end.x && current.y === end.y) {
      return reconstructPath(current);
    }
    
    closedSet.add(getKey(current));
    
    const neighbors = getAllNeighbors(current);
    
    for (const neighbor of neighbors) {
      if (!isValidPosition(tiles, neighbor)) continue;
      
      const key = getKey(neighbor);
      if (closedSet.has(key)) continue;
      
      const fromTile = tiles[current.y][current.x];
      const toTile = tiles[neighbor.y][neighbor.x];
      const moveCost = costFn(fromTile, toTile, neighbor.x, neighbor.y);
      
      if (moveCost === Infinity) continue;
      
      const g = current.g + moveCost;
      
      let neighborNode = nodeMap.get(key);
      
      if (!neighborNode) {
        neighborNode = {
          x: neighbor.x,
          y: neighbor.y,
          g: g,
          h: getHeuristic(neighbor, end, heuristic),
          f: 0,
          parent: current
        };
        neighborNode.f = neighborNode.g + neighborNode.h;
        
        openList.push(neighborNode);
        nodeMap.set(key, neighborNode);
      } else if (g < neighborNode.g) {
        neighborNode.g = g;
        neighborNode.f = g + neighborNode.h;
        neighborNode.parent = current;
        
        if (!openList.includes(neighborNode)) {
          openList.push(neighborNode);
        }
      }
    }
  }
  
  return null;
}

/**
 * Find nearest reachable target
 */
export function findNearestTarget(
  tiles: number[][],
  start: Point,
  targets: Point[],
  options: PathfindingOptions = {}
): {target: Point, path: Point[]} | null {
  let nearestTarget: Point | null = null;
  let shortestPath: Point[] | null = null;
  let shortestDistance = Infinity;
  
  for (const target of targets) {
    const path = findPath(tiles, start, target, options);
    
    if (path && path.length < shortestDistance) {
      shortestDistance = path.length;
      shortestPath = path;
      nearestTarget = target;
    }
  }
  
  if (nearestTarget && shortestPath) {
    return { target: nearestTarget, path: shortestPath };
  }
  
  return null;
}

/**
 * Helper functions
 */
function isValidPosition(tiles: number[][], point: Point): boolean {
  return point.y >= 0 && point.y < tiles.length &&
         point.x >= 0 && point.x < tiles[0].length;
}

function getKey(point: Point): string {
  return `${point.x},${point.y}`;
}

function getHeuristic(
  from: Point,
  to: Point,
  type: PathfindingOptions['heuristic']
): number {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  
  switch (type) {
    case 'manhattan':
      return dx + dy;
    case 'euclidean':
      return Math.sqrt(dx * dx + dy * dy);
    case 'chebyshev':
      return Math.max(dx, dy);
    default:
      return dx + dy;
  }
}

function getNeighbors(
  tiles: number[][],
  point: Point,
  allowDiagonal: boolean
): Point[] {
  const neighbors: Point[] = [];
  
  // Orthogonal neighbors
  const orthogonal = [
    {x: point.x, y: point.y - 1},
    {x: point.x + 1, y: point.y},
    {x: point.x, y: point.y + 1},
    {x: point.x - 1, y: point.y}
  ];
  
  for (const neighbor of orthogonal) {
    if (isValidPosition(tiles, neighbor)) {
      neighbors.push(neighbor);
    }
  }
  
  // Diagonal neighbors
  if (allowDiagonal) {
    const diagonal = [
      {x: point.x - 1, y: point.y - 1},
      {x: point.x + 1, y: point.y - 1},
      {x: point.x + 1, y: point.y + 1},
      {x: point.x - 1, y: point.y + 1}
    ];
    
    for (const neighbor of diagonal) {
      if (isValidPosition(tiles, neighbor)) {
        neighbors.push(neighbor);
      }
    }
  }
  
  return neighbors;
}

function getAllNeighbors(point: Point): Point[] {
  return [
    {x: point.x, y: point.y - 1},
    {x: point.x + 1, y: point.y},
    {x: point.x, y: point.y + 1},
    {x: point.x - 1, y: point.y}
  ];
}

function getMovementCost(
  tiles: number[][],
  from: Point,
  to: Point,
  canMine: boolean,
  miningCost: number
): number {
  const toTile = tiles[to.y][to.x];
  
  // Check if passable
  if (isPassableTile(toTile)) {
    return 1;
  }
  
  // Check if minable
  if (canMine && isMinableTile(toTile)) {
    return miningCost;
  }
  
  return Infinity;
}

function isPassableTile(tileId: number): boolean {
  const passableTiles = [1, 14, 26]; // Ground, power path, dirt
  return passableTiles.includes(tileId);
}

function isMinableTile(tileId: number): boolean {
  const minableTiles = [30, 34, 42, 46, 50]; // Loose rock, hard rock, resources
  return minableTiles.includes(tileId);
}

function reconstructPath(endNode: PathNode): Point[] {
  const path: Point[] = [];
  let current: PathNode | undefined = endNode;
  
  while (current) {
    path.unshift({x: current.x, y: current.y});
    current = current.parent;
  }
  
  return path;
}

function getBestDirection(
  distances: number[][],
  point: Point,
  allowDiagonal: boolean
): {dx: number, dy: number} | null {
  const currentDist = distances[point.y][point.x];
  let bestDir: {dx: number, dy: number} | null = null;
  let bestDist = currentDist;
  
  const directions = allowDiagonal ? [
    {dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: -1, dy: 0},
    {dx: -1, dy: -1}, {dx: 1, dy: -1}, {dx: 1, dy: 1}, {dx: -1, dy: 1}
  ] : [
    {dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: -1, dy: 0}
  ];
  
  for (const dir of directions) {
    const nx = point.x + dir.dx;
    const ny = point.y + dir.dy;
    
    if (ny >= 0 && ny < distances.length && 
        nx >= 0 && nx < distances[0].length) {
      const neighborDist = distances[ny][nx];
      
      if (neighborDist < bestDist) {
        bestDist = neighborDist;
        bestDir = dir;
      }
    }
  }
  
  return bestDir;
}

/**
 * Visualization helper
 */
export function visualizePath(
  tiles: number[][],
  path: Point[],
  start?: Point,
  end?: Point
): string {
  const height = tiles.length;
  const width = tiles[0].length;
  const pathSet = new Set(path.map(p => getKey(p)));
  
  let result = '';
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = getKey({x, y});
      
      if (start && x === start.x && y === start.y) {
        result += 'S';
      } else if (end && x === end.x && y === end.y) {
        result += 'E';
      } else if (pathSet.has(key)) {
        result += '*';
      } else if (tiles[y][x] === 38) {
        result += '#';
      } else if (tiles[y][x] === 1) {
        result += '.';
      } else {
        result += '?';
      }
    }
    result += '\n';
  }
  
  return result;
}

/**
 * Example usage
 */
export function exampleUsage() {
  console.log('=== Pathfinding Examples ===\n');
  
  // Create test map
  const map = [
    [38, 38, 38, 38, 38, 38, 38, 38, 38, 38],
    [38,  1,  1,  1, 38,  1,  1,  1,  1, 38],
    [38,  1, 38,  1, 38,  1, 38, 38,  1, 38],
    [38,  1, 38,  1,  1,  1,  1, 38,  1, 38],
    [38,  1, 38, 38, 38, 38,  1, 38,  1, 38],
    [38,  1,  1,  1,  1,  1,  1, 38,  1, 38],
    [38, 38, 38,  1, 38, 38, 38, 38,  1, 38],
    [38,  1,  1,  1,  1,  1,  1,  1,  1, 38],
    [38,  1, 30, 30, 30,  1, 38, 38, 38, 38],
    [38, 38, 38, 38, 38, 38, 38, 38, 38, 38]
  ];
  
  const start = {x: 1, y: 1};
  const end = {x: 8, y: 8};
  
  // Basic pathfinding
  console.log('Basic A* pathfinding:');
  const path = findPath(map, start, end);
  if (path) {
    console.log(`Path found with ${path.length} steps`);
    console.log(visualizePath(map, path, start, end));
  }
  
  // Mining path
  console.log('\nMining-aware pathfinding:');
  const miningSpeed = new Map([
    [30, 5], // Loose rock takes 5 time units
    [34, 10], // Hard rock takes 10 time units
  ]);
  
  const miningPath = findMiningPath(map, start, {x: 3, y: 8}, miningSpeed);
  if (miningPath) {
    console.log(`Mining path found with ${miningPath.length} steps`);
  }
  
  // Flow field
  console.log('\nFlow field generation:');
  const flowField = generateFlowField(map, [end]);
  const flowPath = followFlowField(flowField, start);
  console.log(`Flow field path: ${flowPath.length} steps`);
  
  // Multiple targets
  console.log('\nFind nearest target:');
  const targets = [
    {x: 8, y: 1},
    {x: 8, y: 8},
    {x: 1, y: 8}
  ];
  
  const nearest = findNearestTarget(map, start, targets);
  if (nearest) {
    console.log(`Nearest target at (${nearest.target.x}, ${nearest.target.y})`);
    console.log(`Distance: ${nearest.path.length} steps`);
  }
}

// Run example if called directly
if (require.main === module) {
  exampleUsage();
}