/**
 * Web Worker for heavy map computations
 * Handles intensive operations off the main thread
 */

// Map computation functions
const MapComputations = {
  /**
   * Calculate map statistics
   */
  calculateStatistics(mapData) {
    const stats = {
      totalTiles: 0,
      tileTypes: {},
      heightDistribution: new Array(10).fill(0),
      buildings: {},
      crystals: 0,
      ore: 0,
      energyCrystals: 0,
      rechargeSeams: 0,
      pathableArea: 0,
      nonPathableArea: 0
    };

    const { width, height, tiles } = mapData;
    stats.totalTiles = width * height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = tiles[y * width + x];
        
        // Count tile types
        stats.tileTypes[tile.type] = (stats.tileTypes[tile.type] || 0) + 1;
        
        // Height distribution
        if (tile.height !== undefined && tile.height < 10) {
          stats.heightDistribution[tile.height]++;
        }
        
        // Buildings
        if (tile.building) {
          stats.buildings[tile.building] = (stats.buildings[tile.building] || 0) + 1;
        }
        
        // Resources
        if (tile.crystals) stats.crystals += tile.crystals;
        if (tile.ore) stats.ore += tile.ore;
        if (tile.energyCrystal) stats.energyCrystals++;
        if (tile.rechargeSeam) stats.rechargeSeams++;
        
        // Pathability
        if (tile.pathable) {
          stats.pathableArea++;
        } else {
          stats.nonPathableArea++;
        }
      }
    }

    return stats;
  },

  /**
   * Generate heat map data
   */
  generateHeatMap(mapData, options) {
    const { width, height, tiles } = mapData;
    const { type } = options;
    const heatMap = new Array(height).fill(null).map(() => new Array(width).fill(0));

    switch (type) {
      case 'pathfinding':
        // Calculate pathfinding complexity
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const tile = tiles[y * width + x];
            let heat = 0;
            
            // Base heat from tile type
            if (!tile.pathable) heat = 10;
            else if (tile.type === 'rubble') heat = 5;
            else if (tile.type === 'dirt') heat = 2;
            
            // Add heat from surrounding tiles
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const neighbor = tiles[ny * width + nx];
                  if (!neighbor.pathable) heat += 1;
                }
              }
            }
            
            heatMap[y][x] = Math.min(heat, 10);
          }
        }
        break;
        
      case 'resources':
        // Resource density heat map
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const tile = tiles[y * width + x];
            let heat = 0;
            
            if (tile.crystals) heat += tile.crystals * 2;
            if (tile.ore) heat += tile.ore;
            if (tile.energyCrystal) heat += 5;
            if (tile.rechargeSeam) heat += 3;
            
            // Spread heat to nearby tiles
            for (let dy = -2; dy <= 2; dy++) {
              for (let dx = -2; dx <= 2; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (nx >= 0 && nx < width && ny >= 0 && ny < height && distance > 0) {
                  heatMap[ny][nx] += heat / (distance * 2);
                }
              }
            }
          }
        }
        
        // Normalize heat map
        let maxHeat = 0;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            maxHeat = Math.max(maxHeat, heatMap[y][x]);
          }
        }
        if (maxHeat > 0) {
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              heatMap[y][x] = (heatMap[y][x] / maxHeat) * 10;
            }
          }
        }
        break;
        
      case 'height':
        // Height variation heat map
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const tile = tiles[y * width + x];
            heatMap[y][x] = tile.height || 0;
          }
        }
        break;
    }

    return heatMap;
  },

  /**
   * Validate map data
   */
  validateMap(mapData) {
    const issues = {
      errors: [],
      warnings: [],
      info: []
    };

    const { width, height, tiles, metadata } = mapData;

    // Basic validation
    if (!width || !height || width < 10 || height < 10) {
      issues.errors.push('Map dimensions must be at least 10x10');
    }

    if (!tiles || tiles.length !== width * height) {
      issues.errors.push('Invalid tile data');
    }

    // Check for required elements
    let hasToolStore = false;
    let hasStartPoint = false;
    const isolatedTiles = [];
    const unreachableBuildings = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = tiles[y * width + x];
        
        if (tile.building === 'ToolStore') hasToolStore = true;
        if (tile.startPoint) hasStartPoint = true;
        
        // Check for isolated tiles
        if (tile.pathable) {
          let hasPathableNeighbor = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const neighbor = tiles[ny * width + nx];
                if (neighbor.pathable) {
                  hasPathableNeighbor = true;
                  break;
                }
              }
            }
            if (hasPathableNeighbor) break;
          }
          if (!hasPathableNeighbor) {
            isolatedTiles.push({ x, y });
          }
        }
        
        // Check building accessibility
        if (tile.building && !tile.pathable) {
          unreachableBuildings.push({ x, y, building: tile.building });
        }
      }
    }

    // Report issues
    if (!hasToolStore) {
      issues.errors.push('Map must have at least one Tool Store');
    }
    
    if (!hasStartPoint) {
      issues.warnings.push('No start point defined');
    }
    
    if (isolatedTiles.length > 0) {
      issues.warnings.push(`Found ${isolatedTiles.length} isolated pathable tiles`);
    }
    
    if (unreachableBuildings.length > 0) {
      issues.errors.push(`Found ${unreachableBuildings.length} unreachable buildings`);
    }

    // Performance warnings
    const pathableRatio = mapData.pathableArea / (width * height);
    if (pathableRatio < 0.2) {
      issues.warnings.push('Less than 20% of map is pathable - may cause gameplay issues');
    }

    return issues;
  },

  /**
   * Find optimal paths
   */
  findPath(mapData, start, end, options = {}) {
    const { width, height, tiles } = mapData;
    const { allowDiagonal = true, maxCost = 1000 } = options;

    // A* pathfinding implementation
    const getKey = (x, y) => `${x},${y}`;
    const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    
    const openSet = new Set([getKey(start.x, start.y)]);
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    
    gScore.set(getKey(start.x, start.y), 0);
    fScore.set(getKey(start.x, start.y), heuristic(start, end));
    
    while (openSet.size > 0) {
      // Find node with lowest fScore
      let current = null;
      let lowestF = Infinity;
      
      for (const key of openSet) {
        const f = fScore.get(key) || Infinity;
        if (f < lowestF) {
          lowestF = f;
          const [x, y] = key.split(',').map(Number);
          current = { x, y };
        }
      }
      
      if (!current) break;
      
      // Check if we reached the goal
      if (current.x === end.x && current.y === end.y) {
        // Reconstruct path
        const path = [];
        let node = getKey(current.x, current.y);
        
        while (node) {
          const [x, y] = node.split(',').map(Number);
          path.unshift({ x, y });
          node = cameFrom.get(node);
        }
        
        return { path, cost: gScore.get(getKey(end.x, end.y)) };
      }
      
      openSet.delete(getKey(current.x, current.y));
      
      // Check neighbors
      const neighbors = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (!allowDiagonal && dx !== 0 && dy !== 0) continue;
          
          const nx = current.x + dx;
          const ny = current.y + dy;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const tile = tiles[ny * width + nx];
            if (tile.pathable) {
              neighbors.push({ x: nx, y: ny });
            }
          }
        }
      }
      
      for (const neighbor of neighbors) {
        const neighborKey = getKey(neighbor.x, neighbor.y);
        const tentativeGScore = (gScore.get(getKey(current.x, current.y)) || 0) + 1;
        
        if (tentativeGScore >= maxCost) continue;
        
        if (tentativeGScore < (gScore.get(neighborKey) || Infinity)) {
          cameFrom.set(neighborKey, getKey(current.x, current.y));
          gScore.set(neighborKey, tentativeGScore);
          fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, end));
          openSet.add(neighborKey);
        }
      }
    }
    
    return { path: null, cost: Infinity };
  },

  /**
   * Generate tile chunks for progressive rendering
   */
  generateTileChunks(mapData, chunkSize = 16) {
    const { width, height, tiles } = mapData;
    const chunks = [];
    
    for (let cy = 0; cy < height; cy += chunkSize) {
      for (let cx = 0; cx < width; cx += chunkSize) {
        const chunk = {
          x: cx,
          y: cy,
          width: Math.min(chunkSize, width - cx),
          height: Math.min(chunkSize, height - cy),
          tiles: []
        };
        
        for (let y = 0; y < chunk.height; y++) {
          for (let x = 0; x < chunk.width; x++) {
            const globalX = cx + x;
            const globalY = cy + y;
            chunk.tiles.push(tiles[globalY * width + globalX]);
          }
        }
        
        chunks.push(chunk);
      }
    }
    
    return chunks;
  }
};

// Message handler
self.addEventListener('message', async (event) => {
  const { id, type, data } = event.data;
  
  try {
    let result;
    
    switch (type) {
      case 'calculateStatistics':
        result = MapComputations.calculateStatistics(data.mapData);
        break;
        
      case 'generateHeatMap':
        result = MapComputations.generateHeatMap(data.mapData, data.options);
        break;
        
      case 'validateMap':
        result = MapComputations.validateMap(data.mapData);
        break;
        
      case 'findPath':
        result = MapComputations.findPath(data.mapData, data.start, data.end, data.options);
        break;
        
      case 'generateTileChunks':
        result = MapComputations.generateTileChunks(data.mapData, data.chunkSize);
        break;
        
      default:
        throw new Error(`Unknown computation type: ${type}`);
    }
    
    // Send result back
    self.postMessage({
      id,
      type: 'result',
      result
    });
    
  } catch (error) {
    // Send error back
    self.postMessage({
      id,
      type: 'error',
      error: error.message
    });
  }
});

// Notify that worker is ready
self.postMessage({ type: 'ready' });