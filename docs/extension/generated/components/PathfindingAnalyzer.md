# PathfindingAnalyzer

## Properties

| Name | Type | Description |
|------|------|-------------|
| `tiles` | `number[][]` |  |
| `rowCount` | `number` |  |
| `colCount` | `number` |  |

## Methods

### `initialize(document)`

**Parameters:**

- `document` (`TextDocument`): 

**Returns:** `boolean`

### `generateTrafficHeatMap()`

**Returns:** `HeatMapData`

### `generateAccessibilityHeatMap(startPoints)`

**Parameters:**

- `startPoints` (`{ row: number; col: number; }[]`): 

**Returns:** `HeatMapData`

### `generateChokepointHeatMap()`

**Returns:** `HeatMapData`

### `findPath(start, end)`

**Parameters:**

- `start` (`{ row: number; col: number; }`): 
- `end` (`{ row: number; col: number; }`): 

**Returns:** `PathfindingResult | null`

### `calculateDistances(start)`

**Parameters:**

- `start` (`{ row: number; col: number; }`): 

**Returns:** `number[][]`

### `calculateChokepointScore(row, col)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 

**Returns:** `number`

### `calculateConnectivityImpact(row, col)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 

**Returns:** `number`

### `findKeyPoints()`

**Returns:** `{ row: number; col: number; }[]`

### `findOpenAreas()`

**Returns:** `{ center: { row: number; col: number; }; size: number; }[]`

### `floodFillArea(startRow, startCol, visited)`

**Parameters:**

- `startRow` (`number`): 
- `startCol` (`number`): 
- `visited` (`Set<string>`): 

**Returns:** `{ center: { row: number; col: number; }; size: number; }`

### `findNearestPassable(row, col)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 

**Returns:** `{ row: number; col: number; } | null`

### `getNeighbors(row, col)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 

**Returns:** `{ row: number; col: number; }[]`

### `heuristic(a, b)`

**Parameters:**

- `a` (`{ row: number; col: number; }`): 
- `b` (`{ row: number; col: number; }`): 

**Returns:** `number`

### `getMovementCost(_from, to)`

**Parameters:**

- `_from` (`PathNode`): 
- `to` (`{ row: number; col: number; }`): 

**Returns:** `number`

### `reconstructPath(node)`

**Parameters:**

- `node` (`PathNode`): 

**Returns:** `PathNode[]`

### `processHeatMapData(grid)`

**Parameters:**

- `grid` (`number[][]`): 

**Returns:** `HeatMapData`

### `isPassable(row, col)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 

**Returns:** `boolean`

### `isResourceTile(tileId)`

**Parameters:**

- `tileId` (`number`): 

**Returns:** `boolean`

### `parseTiles(content)`

**Parameters:**

- `content` (`string`): 

**Returns:** `number[][]`

