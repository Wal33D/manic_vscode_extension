/**
 * Advanced selection tools for the map editor
 * Includes magic wand, lasso, and other selection utilities
 */

export interface SelectionPoint {
  row: number;
  col: number;
}

export interface SelectionRegion {
  points: SelectionPoint[];
  bounds: {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
  };
}

export enum SelectionMode {
  RECTANGLE = 'rectangle',
  MAGIC_WAND = 'magic_wand',
  LASSO = 'lasso',
  ELLIPSE = 'ellipse',
  POLYGON = 'polygon',
}

export class AdvancedSelectionTool {
  private tiles: number[][];
  private rows: number;
  private cols: number;

  constructor(tiles: number[][], rows: number, cols: number) {
    this.tiles = tiles;
    this.rows = rows;
    this.cols = cols;
  }

  /**
   * Magic wand selection - selects all connected tiles of the same type
   */
  public magicWandSelect(
    startRow: number,
    startCol: number,
    tolerance: number = 0
  ): SelectionRegion {
    if (!this.isValidPosition(startRow, startCol)) {
      return this.createEmptySelection();
    }

    const targetTile = this.tiles[startRow][startCol];
    const visited = new Set<string>();
    const selected = new Set<string>();
    const queue: SelectionPoint[] = [{ row: startRow, col: startCol }];

    // BFS to find all connected tiles
    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.row},${current.col}`;

      if (visited.has(key)) {
        continue;
      }
      visited.add(key);

      if (this.isValidPosition(current.row, current.col)) {
        const currentTile = this.tiles[current.row][current.col];

        // Check if tile matches within tolerance
        if (this.tilesMatch(currentTile, targetTile, tolerance)) {
          selected.add(key);

          // Add neighbors to queue
          const neighbors = this.getNeighbors(current.row, current.col);
          neighbors.forEach(neighbor => {
            const neighborKey = `${neighbor.row},${neighbor.col}`;
            if (!visited.has(neighborKey)) {
              queue.push(neighbor);
            }
          });
        }
      }
    }

    return this.createSelectionFromSet(selected);
  }

  /**
   * Lasso selection - freehand selection tool
   */
  public lassoSelect(path: SelectionPoint[]): SelectionRegion {
    if (path.length < 3) {
      return this.createEmptySelection();
    }

    const selected = new Set<string>();
    const bounds = this.getBounds(path);

    // Check each point in the bounding box
    for (let row = bounds.minRow; row <= bounds.maxRow; row++) {
      for (let col = bounds.minCol; col <= bounds.maxCol; col++) {
        if (this.isValidPosition(row, col) && this.pointInPolygon({ row, col }, path)) {
          selected.add(`${row},${col}`);
        }
      }
    }

    return this.createSelectionFromSet(selected);
  }

  /**
   * Ellipse selection
   */
  public ellipseSelect(
    centerRow: number,
    centerCol: number,
    radiusRows: number,
    radiusCols: number
  ): SelectionRegion {
    const selected = new Set<string>();

    const minRow = Math.max(0, Math.floor(centerRow - radiusRows));
    const maxRow = Math.min(this.rows - 1, Math.ceil(centerRow + radiusRows));
    const minCol = Math.max(0, Math.floor(centerCol - radiusCols));
    const maxCol = Math.min(this.cols - 1, Math.ceil(centerCol + radiusCols));

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        // Check if point is inside ellipse
        const dx = (col - centerCol) / radiusCols;
        const dy = (row - centerRow) / radiusRows;
        if (dx * dx + dy * dy <= 1) {
          selected.add(`${row},${col}`);
        }
      }
    }

    return this.createSelectionFromSet(selected);
  }

  /**
   * Polygon selection - select area within a polygon
   */
  public polygonSelect(vertices: SelectionPoint[]): SelectionRegion {
    if (vertices.length < 3) {
      return this.createEmptySelection();
    }

    return this.lassoSelect(vertices); // Reuse lasso logic
  }

  /**
   * Expand selection by one tile in all directions
   */
  public expandSelection(selection: SelectionRegion): SelectionRegion {
    const expanded = new Set<string>();

    selection.points.forEach(point => {
      expanded.add(`${point.row},${point.col}`);
      const neighbors = this.getNeighbors(point.row, point.col);
      neighbors.forEach(neighbor => {
        if (this.isValidPosition(neighbor.row, neighbor.col)) {
          expanded.add(`${neighbor.row},${neighbor.col}`);
        }
      });
    });

    return this.createSelectionFromSet(expanded);
  }

  /**
   * Contract selection by one tile
   */
  public contractSelection(selection: SelectionRegion): SelectionRegion {
    const contracted = new Set<string>();

    selection.points.forEach(point => {
      const neighbors = this.getNeighbors(point.row, point.col);
      const isEdge = neighbors.some(neighbor => {
        return !selection.points.some(p => p.row === neighbor.row && p.col === neighbor.col);
      });

      if (!isEdge) {
        contracted.add(`${point.row},${point.col}`);
      }
    });

    return this.createSelectionFromSet(contracted);
  }

  /**
   * Select all tiles of a specific type
   */
  public selectByTileType(tileType: number): SelectionRegion {
    const selected = new Set<string>();

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.tiles[row][col] === tileType) {
          selected.add(`${row},${col}`);
        }
      }
    }

    return this.createSelectionFromSet(selected);
  }

  /**
   * Invert the current selection
   */
  public invertSelection(selection: SelectionRegion): SelectionRegion {
    const selected = new Set<string>();
    const currentPoints = new Set(selection.points.map(p => `${p.row},${p.col}`));

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const key = `${row},${col}`;
        if (!currentPoints.has(key)) {
          selected.add(key);
        }
      }
    }

    return this.createSelectionFromSet(selected);
  }

  /**
   * Select tiles within a color range
   */
  public selectByRange(minTileId: number, maxTileId: number): SelectionRegion {
    const selected = new Set<string>();

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const tile = this.tiles[row][col];
        if (tile >= minTileId && tile <= maxTileId) {
          selected.add(`${row},${col}`);
        }
      }
    }

    return this.createSelectionFromSet(selected);
  }

  /**
   * Combine two selections
   */
  public combineSelections(
    selection1: SelectionRegion,
    selection2: SelectionRegion,
    mode: 'add' | 'subtract' | 'intersect' = 'add'
  ): SelectionRegion {
    const set1 = new Set(selection1.points.map(p => `${p.row},${p.col}`));
    const set2 = new Set(selection2.points.map(p => `${p.row},${p.col}`));
    let result: Set<string>;

    switch (mode) {
      case 'add':
        result = new Set([...set1, ...set2]);
        break;
      case 'subtract':
        result = new Set([...set1].filter(x => !set2.has(x)));
        break;
      case 'intersect':
        result = new Set([...set1].filter(x => set2.has(x)));
        break;
    }

    return this.createSelectionFromSet(result);
  }

  // Helper methods
  private isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  private tilesMatch(tile1: number, tile2: number, tolerance: number): boolean {
    if (tolerance === 0) {
      return tile1 === tile2;
    }

    // For tolerance > 0, we could implement a more sophisticated matching
    // For now, we'll use simple numeric difference
    return Math.abs(tile1 - tile2) <= tolerance;
  }

  private getNeighbors(row: number, col: number): SelectionPoint[] {
    const neighbors: SelectionPoint[] = [];
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1], // Cardinal
    ];

    directions.forEach(([dr, dc]) => {
      const newRow = row + dr;
      const newCol = col + dc;
      if (this.isValidPosition(newRow, newCol)) {
        neighbors.push({ row: newRow, col: newCol });
      }
    });

    return neighbors;
  }

  private pointInPolygon(point: SelectionPoint, polygon: SelectionPoint[]): boolean {
    let inside = false;
    const x = point.col;
    const y = point.row;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].col;
      const yi = polygon[i].row;
      const xj = polygon[j].col;
      const yj = polygon[j].row;

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  }

  private getBounds(points: SelectionPoint[]): {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
  } {
    let minRow = this.rows;
    let maxRow = -1;
    let minCol = this.cols;
    let maxCol = -1;

    points.forEach(point => {
      minRow = Math.min(minRow, point.row);
      maxRow = Math.max(maxRow, point.row);
      minCol = Math.min(minCol, point.col);
      maxCol = Math.max(maxCol, point.col);
    });

    return { minRow, maxRow, minCol, maxCol };
  }

  private createEmptySelection(): SelectionRegion {
    return {
      points: [],
      bounds: { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 },
    };
  }

  private createSelectionFromSet(selected: Set<string>): SelectionRegion {
    const points: SelectionPoint[] = [];
    let minRow = this.rows;
    let maxRow = -1;
    let minCol = this.cols;
    let maxCol = -1;

    selected.forEach(key => {
      const [row, col] = key.split(',').map(Number);
      points.push({ row, col });
      minRow = Math.min(minRow, row);
      maxRow = Math.max(maxRow, row);
      minCol = Math.min(minCol, col);
      maxCol = Math.max(maxCol, col);
    });

    return {
      points,
      bounds:
        points.length > 0
          ? { minRow, maxRow, minCol, maxCol }
          : { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 },
    };
  }
}
