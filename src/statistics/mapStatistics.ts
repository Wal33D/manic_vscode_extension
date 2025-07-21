/**
 * Map statistics analyzer inspired by groundhog's analysis tools
 * Provides comprehensive analysis of DAT file maps
 */

import { DatFile } from '../types/datFileTypes';
import { getAdvancedTileInfo, Hardness } from '../data/advancedTileDefinitions';

export interface TileDistribution {
  tileId: number;
  name: string;
  count: number;
  percentage: number;
  category: string;
}

export interface ResourceDistribution {
  type: 'crystals' | 'ore';
  totalYield: number;
  tileCount: number;
  averagePerTile: number;
  clusters: ResourceCluster[];
}

export interface ResourceCluster {
  center: { x: number; y: number };
  tiles: Array<{ x: number; y: number; yield: number }>;
  totalYield: number;
}

export interface AccessibilityScore {
  overallScore: number; // 0-100
  reachableArea: number; // percentage
  isolatedRegions: Array<{ tiles: number; center: { x: number; y: number } }>;
  chokepointCount: number;
  averagePathWidth: number;
}

export interface DifficultyEstimate {
  overall: 'easy' | 'medium' | 'hard' | 'extreme';
  factors: {
    resourceAvailability: number; // 0-100
    accessibleArea: number; // 0-100
    drillDifficulty: number; // 0-100
    hazardDensity: number; // 0-100
    objectiveComplexity: number; // 0-100
  };
  recommendations: string[];
}

export interface MapBalance {
  isBalanced: boolean;
  issues: string[];
  suggestions: string[];
  metrics: {
    resourceToHazardRatio: number;
    openToWallRatio: number;
    pathComplexity: number;
  };
}

export interface MapStatistics {
  dimensions: { width: number; height: number };
  tileDistribution: TileDistribution[];
  resourceDistribution: Map<string, ResourceDistribution>;
  accessibility: AccessibilityScore;
  difficulty: DifficultyEstimate;
  balance: MapBalance;
  heatmaps: {
    resource: number[][];
    difficulty: number[][];
    accessibility: number[][];
  };
}

/**
 * Analyzes DAT file maps and generates comprehensive statistics
 */
export class MapStatisticsAnalyzer {
  private datFile: DatFile;
  private width: number;
  private height: number;

  constructor(datFile: DatFile) {
    this.datFile = datFile;
    this.width = datFile.info?.colcount || 0;
    this.height = datFile.info?.rowcount || 0;
  }

  /**
   * Generate comprehensive map statistics
   */
  public analyzeMap(): MapStatistics {
    return {
      dimensions: { width: this.width, height: this.height },
      tileDistribution: this.calculateTileDistribution(),
      resourceDistribution: this.analyzeResourceDistribution(),
      accessibility: this.calculateAccessibility(),
      difficulty: this.estimateDifficulty(),
      balance: this.analyzeBalance(),
      heatmaps: this.generateHeatmaps(),
    };
  }

  /**
   * Calculate tile distribution statistics
   */
  private calculateTileDistribution(): TileDistribution[] {
    const tileCounts = new Map<number, number>();
    const totalTiles = this.width * this.height;

    // Count tiles
    if (this.datFile.tiles) {
      for (const row of this.datFile.tiles) {
        for (const tileId of row) {
          tileCounts.set(tileId, (tileCounts.get(tileId) || 0) + 1);
        }
      }
    }

    // Create distribution array
    const distribution: TileDistribution[] = [];

    for (const [tileId, count] of tileCounts) {
      const tileInfo = getAdvancedTileInfo(tileId);
      if (tileInfo) {
        distribution.push({
          tileId,
          name: tileInfo.name,
          count,
          percentage: (count / totalTiles) * 100,
          category: tileInfo.category,
        });
      }
    }

    // Sort by count descending
    return distribution.sort((a, b) => b.count - a.count);
  }

  /**
   * Analyze resource distribution and clustering
   */
  private analyzeResourceDistribution(): Map<string, ResourceDistribution> {
    const distributions = new Map<string, ResourceDistribution>();

    // Initialize resource types
    const resourceTypes: Array<'crystals' | 'ore'> = ['crystals', 'ore'];

    for (const type of resourceTypes) {
      const clusters = this.findResourceClusters(type);
      let totalYield = 0;
      let tileCount = 0;

      for (const cluster of clusters) {
        totalYield += cluster.totalYield;
        tileCount += cluster.tiles.length;
      }

      distributions.set(type, {
        type,
        totalYield,
        tileCount,
        averagePerTile: tileCount > 0 ? totalYield / tileCount : 0,
        clusters,
      });
    }

    return distributions;
  }

  /**
   * Find resource clusters using flood fill
   */
  private findResourceClusters(resourceType: 'crystals' | 'ore'): ResourceCluster[] {
    const clusters: ResourceCluster[] = [];
    const visited = new Set<string>();

    if (!this.datFile.tiles || !this.datFile.resources) {
      return clusters;
    }

    const resourceGrid = this.datFile.resources[resourceType];
    if (!resourceGrid) {
      return clusters;
    }

    // Find all resource tiles
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const key = `${x},${y}`;
        if (visited.has(key)) {
          continue;
        }

        const yield_ = resourceGrid[y]?.[x] || 0;
        if (yield_ > 0) {
          // Found a resource tile, flood fill to find cluster
          const cluster = this.floodFillCluster(x, y, resourceGrid, visited);
          if (cluster.tiles.length > 0) {
            clusters.push(cluster);
          }
        }
      }
    }

    return clusters;
  }

  /**
   * Flood fill to find connected resource tiles
   */
  private floodFillCluster(
    startX: number,
    startY: number,
    resourceGrid: number[][],
    visited: Set<string>
  ): ResourceCluster {
    const tiles: Array<{ x: number; y: number; yield: number }> = [];
    const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
    let totalYield = 0;

    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      const key = `${x},${y}`;

      if (visited.has(key) || x < 0 || x >= this.width || y < 0 || y >= this.height) {
        continue;
      }

      const yield_ = resourceGrid[y]?.[x] || 0;
      if (yield_ === 0) {
        continue;
      }

      visited.add(key);
      tiles.push({ x, y, yield: yield_ });
      totalYield += yield_;

      // Check adjacent tiles
      queue.push({ x: x + 1, y });
      queue.push({ x: x - 1, y });
      queue.push({ x, y: y + 1 });
      queue.push({ x, y: y - 1 });
    }

    // Calculate cluster center
    const centerX = tiles.reduce((sum, t) => sum + t.x, 0) / tiles.length;
    const centerY = tiles.reduce((sum, t) => sum + t.y, 0) / tiles.length;

    return {
      center: { x: Math.round(centerX), y: Math.round(centerY) },
      tiles,
      totalYield,
    };
  }

  /**
   * Calculate map accessibility score
   */
  private calculateAccessibility(): AccessibilityScore {
    const reachable = new Set<string>();
    const visited = new Set<string>();
    const isolatedRegions: Array<{ tiles: number; center: { x: number; y: number } }> = [];

    if (!this.datFile.tiles) {
      return {
        overallScore: 0,
        reachableArea: 0,
        isolatedRegions: [],
        chokepointCount: 0,
        averagePathWidth: 0,
      };
    }

    // Find starting point (usually Tool Store or miners)
    let startX = 0,
      startY = 0;

    // Check for Tool Store
    if (this.datFile.buildings) {
      const toolStore = this.datFile.buildings.find(b => b.type === 'Toolstation');
      if (toolStore) {
        startX = (toolStore as any).x || 0;
        startY = (toolStore as any).y || 0;
      }
    }

    // Flood fill from start to find main reachable area
    const mainArea = this.floodFillAccessible(startX, startY, visited);
    mainArea.forEach(key => reachable.add(key));

    // Find isolated regions
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const key = `${x},${y}`;
        if (!visited.has(key)) {
          const tileId = this.datFile.tiles[y][x];
          const tileInfo = getAdvancedTileInfo(tileId);

          if (tileInfo && tileInfo.isFloor) {
            // Found an unvisited floor tile - potential isolated region
            const region = this.floodFillAccessible(x, y, visited);
            if (region.size > 0) {
              const tiles = Array.from(region).map(k => {
                const [x, y] = k.split(',').map(Number);
                return { x, y };
              });

              const centerX = tiles.reduce((sum, t) => sum + t.x, 0) / tiles.length;
              const centerY = tiles.reduce((sum, t) => sum + t.y, 0) / tiles.length;

              isolatedRegions.push({
                tiles: region.size,
                center: { x: Math.round(centerX), y: Math.round(centerY) },
              });
            }
          }
        }
      }
    }

    // Calculate metrics
    const totalFloorTiles = this.countFloorTiles();
    const reachableArea = (reachable.size / totalFloorTiles) * 100;
    const chokepoints = this.findChokepoints(reachable);
    const avgPathWidth = this.calculateAveragePathWidth(reachable);

    // Calculate overall score
    let score = reachableArea;
    score -= isolatedRegions.length * 5;
    score -= chokepoints * 2;
    score = Math.max(0, Math.min(100, score));

    return {
      overallScore: score,
      reachableArea,
      isolatedRegions,
      chokepointCount: chokepoints,
      averagePathWidth: avgPathWidth,
    };
  }

  /**
   * Flood fill to find accessible tiles
   */
  private floodFillAccessible(startX: number, startY: number, visited: Set<string>): Set<string> {
    const accessible = new Set<string>();
    const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      const key = `${x},${y}`;

      if (visited.has(key) || x < 0 || x >= this.width || y < 0 || y >= this.height) {
        continue;
      }

      visited.add(key);

      const tileId = this.datFile.tiles![y][x];
      const tileInfo = getAdvancedTileInfo(tileId);

      if (!tileInfo || (!tileInfo.isFloor && tileInfo.hardness === Hardness.SOLID)) {
        continue;
      }

      accessible.add(key);

      // Check adjacent tiles
      queue.push({ x: x + 1, y });
      queue.push({ x: x - 1, y });
      queue.push({ x, y: y + 1 });
      queue.push({ x, y: y - 1 });
    }

    return accessible;
  }

  /**
   * Count total floor tiles
   */
  private countFloorTiles(): number {
    let count = 0;

    if (this.datFile.tiles) {
      for (const row of this.datFile.tiles) {
        for (const tileId of row) {
          const tileInfo = getAdvancedTileInfo(tileId);
          if (tileInfo && tileInfo.isFloor) {
            count++;
          }
        }
      }
    }

    return count || 1; // Avoid division by zero
  }

  /**
   * Find chokepoints in accessible area
   */
  private findChokepoints(accessible: Set<string>): number {
    let chokepoints = 0;

    for (const key of accessible) {
      const [x, y] = key.split(',').map(Number);

      // Check if this tile is a chokepoint (only 2 opposite neighbors are accessible)
      const neighbors = [
        { x: x + 1, y, opposite: `${x - 1},${y}` },
        { x: x - 1, y, opposite: `${x + 1},${y}` },
        { x, y: y + 1, opposite: `${x},${y - 1}` },
        { x, y: y - 1, opposite: `${x},${y + 1}` },
      ];

      let accessibleNeighbors = 0;
      let hasOpposite = false;

      for (const neighbor of neighbors) {
        const nKey = `${neighbor.x},${neighbor.y}`;
        if (accessible.has(nKey)) {
          accessibleNeighbors++;
          if (accessible.has(neighbor.opposite)) {
            hasOpposite = true;
          }
        }
      }

      if (accessibleNeighbors === 2 && hasOpposite) {
        chokepoints++;
      }
    }

    return chokepoints;
  }

  /**
   * Calculate average path width
   */
  private calculateAveragePathWidth(accessible: Set<string>): number {
    let totalWidth = 0;
    let measurements = 0;

    // Sample path widths at various points
    for (const key of accessible) {
      const [x, y] = key.split(',').map(Number);

      // Measure horizontal width
      let hWidth = 1;
      let i = 1;
      while (accessible.has(`${x + i},${y}`)) {
        hWidth++;
        i++;
      }
      i = 1;
      while (accessible.has(`${x - i},${y}`)) {
        hWidth++;
        i++;
      }

      // Measure vertical width
      let vWidth = 1;
      i = 1;
      while (accessible.has(`${x},${y + i}`)) {
        vWidth++;
        i++;
      }
      i = 1;
      while (accessible.has(`${x},${y - i}`)) {
        vWidth++;
        i++;
      }

      totalWidth += Math.min(hWidth, vWidth);
      measurements++;
    }

    return measurements > 0 ? totalWidth / measurements : 0;
  }

  /**
   * Estimate map difficulty
   */
  private estimateDifficulty(): DifficultyEstimate {
    const factors = {
      resourceAvailability: this.calculateResourceAvailability(),
      accessibleArea: this.calculateAccessibleAreaScore(),
      drillDifficulty: this.calculateDrillDifficulty(),
      hazardDensity: this.calculateHazardDensity(),
      objectiveComplexity: this.calculateObjectiveComplexity(),
    };

    // Calculate overall difficulty
    const avgScore = Object.values(factors).reduce((a, b) => a + b, 0) / 5;

    let overall: DifficultyEstimate['overall'];
    if (avgScore > 75) {
      overall = 'easy';
    } else if (avgScore > 50) {
      overall = 'medium';
    } else if (avgScore > 25) {
      overall = 'hard';
    } else {
      overall = 'extreme';
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (factors.resourceAvailability < 30) {
      recommendations.push('Consider adding more resource deposits');
    }
    if (factors.accessibleArea < 40) {
      recommendations.push('Map may be too restrictive - add more paths');
    }
    if (factors.drillDifficulty < 20) {
      recommendations.push('High proportion of hard rock may frustrate players');
    }
    if (factors.hazardDensity < 30) {
      recommendations.push('High hazard density - ensure safe zones exist');
    }
    if (factors.objectiveComplexity < 40) {
      recommendations.push('Complex objectives - consider adding hints');
    }

    return { overall, factors, recommendations };
  }

  /**
   * Calculate resource availability score
   */
  private calculateResourceAvailability(): number {
    const distributions = this.analyzeResourceDistribution();
    let totalYield = 0;

    for (const [, dist] of distributions) {
      totalYield += dist.totalYield;
    }

    // Score based on yield per 100 tiles
    const yieldPer100 = (totalYield / (this.width * this.height)) * 100;

    // Convert to 0-100 score (higher is easier)
    return Math.min(100, yieldPer100 * 2);
  }

  /**
   * Calculate accessible area score
   */
  private calculateAccessibleAreaScore(): number {
    const accessibility = this.calculateAccessibility();
    return accessibility.reachableArea;
  }

  /**
   * Calculate drill difficulty score
   */
  private calculateDrillDifficulty(): number {
    let totalHardness = 0;
    let wallCount = 0;

    if (this.datFile.tiles) {
      for (const row of this.datFile.tiles) {
        for (const tileId of row) {
          const tileInfo = getAdvancedTileInfo(tileId);
          if (tileInfo && tileInfo.isWall) {
            totalHardness += tileInfo.hardness;
            wallCount++;
          }
        }
      }
    }

    if (wallCount === 0) {
      return 100;
    }

    const avgHardness = totalHardness / wallCount;
    // Convert to 0-100 score (lower hardness = higher score)
    return Math.max(0, 100 - (avgHardness / Hardness.SOLID) * 100);
  }

  /**
   * Calculate hazard density score
   */
  private calculateHazardDensity(): number {
    let hazardCount = 0;

    if (this.datFile.tiles) {
      for (const row of this.datFile.tiles) {
        for (const tileId of row) {
          const tileInfo = getAdvancedTileInfo(tileId);
          if (tileInfo && (tileInfo.isFluid || tileInfo.trigger)) {
            hazardCount++;
          }
        }
      }
    }

    const hazardPercentage = (hazardCount / (this.width * this.height)) * 100;
    // Convert to 0-100 score (lower hazards = higher score)
    return Math.max(0, 100 - hazardPercentage * 4);
  }

  /**
   * Calculate objective complexity score
   */
  private calculateObjectiveComplexity(): number {
    if (!this.datFile.objectives || this.datFile.objectives.length === 0) {
      return 100; // No objectives = easy
    }

    let complexityScore = 100;

    for (const objective of this.datFile.objectives) {
      if ((objective.type as string) === 'crystals' || (objective.type as string) === 'ore') {
        const amount = parseInt((objective as any).condition) || 0;
        if (amount > 100) {
          complexityScore -= 10;
        }
        if (amount > 200) {
          complexityScore -= 10;
        }
      } else if ((objective.type as string) === 'timer') {
        complexityScore -= 20; // Timer objectives are harder
      } else if ((objective.type as string) === 'block') {
        complexityScore -= 5; // Mining objectives
      }
    }

    return Math.max(0, complexityScore);
  }

  /**
   * Analyze map balance
   */
  private analyzeBalance(): MapBalance {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Calculate metrics
    const resourceCount = this.countResourceTiles();
    const hazardCount = this.countHazardTiles();
    const openCount = this.countFloorTiles();
    const wallCount = this.countWallTiles();

    const resourceToHazardRatio = hazardCount > 0 ? resourceCount / hazardCount : resourceCount;
    const openToWallRatio = wallCount > 0 ? openCount / wallCount : openCount;
    const pathComplexity = this.calculatePathComplexity();

    // Check balance issues
    if (resourceToHazardRatio < 0.5) {
      issues.push('Too many hazards relative to resources');
      suggestions.push('Add more resource deposits or reduce hazards');
    }

    if (openToWallRatio < 0.3) {
      issues.push('Map is too cramped');
      suggestions.push('Open up more areas for movement');
    } else if (openToWallRatio > 3) {
      issues.push('Map may be too open');
      suggestions.push('Add more walls for strategic drilling');
    }

    if (pathComplexity > 80) {
      issues.push('Path layout is overly complex');
      suggestions.push('Simplify main paths between key areas');
    }

    const isBalanced = issues.length === 0;

    return {
      isBalanced,
      issues,
      suggestions,
      metrics: {
        resourceToHazardRatio,
        openToWallRatio,
        pathComplexity,
      },
    };
  }

  /**
   * Count resource tiles
   */
  private countResourceTiles(): number {
    let count = 0;

    if (this.datFile.resources) {
      const resourceTypes: Array<'crystals' | 'ore'> = ['crystals', 'ore'];
      for (const type of resourceTypes) {
        const grid = this.datFile.resources[type];
        if (grid) {
          for (const row of grid) {
            for (const value of row) {
              if (value > 0) {
                count++;
              }
            }
          }
        }
      }
    }

    return count;
  }

  /**
   * Count hazard tiles
   */
  private countHazardTiles(): number {
    let count = 0;

    if (this.datFile.tiles) {
      for (const row of this.datFile.tiles) {
        for (const tileId of row) {
          const tileInfo = getAdvancedTileInfo(tileId);
          if (tileInfo && (tileInfo.isFluid || tileInfo.trigger)) {
            count++;
          }
        }
      }
    }

    return count;
  }

  /**
   * Count wall tiles
   */
  private countWallTiles(): number {
    let count = 0;

    if (this.datFile.tiles) {
      for (const row of this.datFile.tiles) {
        for (const tileId of row) {
          const tileInfo = getAdvancedTileInfo(tileId);
          if (tileInfo && tileInfo.isWall) {
            count++;
          }
        }
      }
    }

    return count;
  }

  /**
   * Calculate path complexity
   */
  private calculatePathComplexity(): number {
    // Simple heuristic based on chokepoints and isolated regions
    const accessibility = this.calculateAccessibility();

    let complexity = 0;
    complexity += accessibility.chokepointCount * 5;
    complexity += accessibility.isolatedRegions.length * 10;
    complexity += (5 - accessibility.averagePathWidth) * 10;

    return Math.min(100, complexity);
  }

  /**
   * Generate heatmaps for visualization
   */
  private generateHeatmaps(): MapStatistics['heatmaps'] {
    const resource = this.generateResourceHeatmap();
    const difficulty = this.generateDifficultyHeatmap();
    const accessibility = this.generateAccessibilityHeatmap();

    return { resource, difficulty, accessibility };
  }

  /**
   * Generate resource density heatmap
   */
  private generateResourceHeatmap(): number[][] {
    const heatmap: number[][] = Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(0));

    if (!this.datFile.resources) {
      return heatmap;
    }

    // Combine all resource types
    const resourceTypes: Array<'crystals' | 'ore'> = ['crystals', 'ore'];

    for (const type of resourceTypes) {
      const grid = this.datFile.resources[type];
      if (grid) {
        for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
            const value = grid[y]?.[x] || 0;
            if (value > 0) {
              // Apply gaussian blur for heat effect
              this.applyHeat(heatmap, x, y, value * 10, 3);
            }
          }
        }
      }
    }

    // Normalize to 0-100
    return this.normalizeHeatmap(heatmap);
  }

  /**
   * Generate difficulty heatmap
   */
  private generateDifficultyHeatmap(): number[][] {
    const heatmap: number[][] = Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(0));

    if (!this.datFile.tiles) {
      return heatmap;
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tileId = this.datFile.tiles[y][x];
        const tileInfo = getAdvancedTileInfo(tileId);

        if (tileInfo) {
          let difficulty = 0;

          // Hardness contributes to difficulty
          if (tileInfo.isWall) {
            difficulty += tileInfo.hardness * 10;
          }

          // Hazards increase difficulty
          if (tileInfo.isFluid || tileInfo.trigger) {
            difficulty += 50;
          }

          if (difficulty > 0) {
            this.applyHeat(heatmap, x, y, difficulty, 2);
          }
        }
      }
    }

    return this.normalizeHeatmap(heatmap);
  }

  /**
   * Generate accessibility heatmap
   */
  private generateAccessibilityHeatmap(): number[][] {
    const heatmap: number[][] = Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(0));

    const accessibility = this.calculateAccessibility();
    const accessible = this.floodFillAccessible(0, 0, new Set());

    // Mark accessible areas
    for (const key of accessible) {
      const [x, y] = key.split(',').map(Number);
      this.applyHeat(heatmap, x, y, 100, 1);
    }

    // Mark isolated regions differently
    for (const region of accessibility.isolatedRegions) {
      this.applyHeat(heatmap, region.center.x, region.center.y, 50, 3);
    }

    return this.normalizeHeatmap(heatmap);
  }

  /**
   * Apply heat to heatmap with falloff
   */
  private applyHeat(
    heatmap: number[][],
    cx: number,
    cy: number,
    intensity: number,
    radius: number
  ): void {
    for (let y = Math.max(0, cy - radius); y <= Math.min(this.height - 1, cy + radius); y++) {
      for (let x = Math.max(0, cx - radius); x <= Math.min(this.width - 1, cx + radius); x++) {
        const distance = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (distance <= radius) {
          const falloff = 1 - distance / radius;
          heatmap[y][x] += intensity * falloff;
        }
      }
    }
  }

  /**
   * Normalize heatmap values to 0-100
   */
  private normalizeHeatmap(heatmap: number[][]): number[][] {
    let max = 0;

    // Find max value
    for (const row of heatmap) {
      for (const value of row) {
        max = Math.max(max, value);
      }
    }

    if (max === 0) {
      return heatmap;
    }

    // Normalize
    return heatmap.map(row => row.map(value => Math.round((value / max) * 100)));
  }

  /**
   * Generate a text report of the statistics
   */
  public generateReport(stats: MapStatistics): string {
    const lines: string[] = [];

    lines.push('=== MAP STATISTICS REPORT ===');
    lines.push('');

    // Dimensions
    lines.push(`Map Size: ${stats.dimensions.width}x${stats.dimensions.height}`);
    lines.push('');

    // Tile Distribution
    lines.push('Top 5 Tile Types:');
    stats.tileDistribution.slice(0, 5).forEach(dist => {
      lines.push(`  ${dist.name}: ${dist.count} tiles (${dist.percentage.toFixed(1)}%)`);
    });
    lines.push('');

    // Resources
    lines.push('Resource Distribution:');
    for (const [type, dist] of stats.resourceDistribution) {
      lines.push(`  ${type}: ${dist.totalYield} total (${dist.clusters.length} clusters)`);
    }
    lines.push('');

    // Accessibility
    lines.push('Accessibility:');
    lines.push(`  Overall Score: ${stats.accessibility.overallScore.toFixed(0)}/100`);
    lines.push(`  Reachable Area: ${stats.accessibility.reachableArea.toFixed(1)}%`);
    lines.push(`  Isolated Regions: ${stats.accessibility.isolatedRegions.length}`);
    lines.push(`  Chokepoints: ${stats.accessibility.chokepointCount}`);
    lines.push('');

    // Difficulty
    lines.push(`Difficulty: ${stats.difficulty.overall.toUpperCase()}`);
    lines.push('Factors:');
    Object.entries(stats.difficulty.factors).forEach(([factor, score]) => {
      lines.push(`  ${factor}: ${score.toFixed(0)}/100`);
    });
    lines.push('');

    // Balance
    lines.push(`Balance: ${stats.balance.isBalanced ? 'GOOD' : 'NEEDS WORK'}`);
    if (stats.balance.issues.length > 0) {
      lines.push('Issues:');
      stats.balance.issues.forEach(issue => {
        lines.push(`  - ${issue}`);
      });
    }
    if (stats.balance.suggestions.length > 0) {
      lines.push('Suggestions:');
      stats.balance.suggestions.forEach(suggestion => {
        lines.push(`  - ${suggestion}`);
      });
    }

    return lines.join('\n');
  }
}
