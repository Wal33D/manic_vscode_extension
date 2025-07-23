# AdvancedSelectionTool

## Properties

| Name | Type | Description |
|------|------|-------------|
| `tiles` | `number[][]` |  |
| `rows` | `number` |  |
| `cols` | `number` |  |

## Methods

### `magicWandSelect(startRow, startCol, tolerance)`

**Parameters:**

- `startRow` (`number`): 
- `startCol` (`number`): 
- `tolerance` (`number`): 

**Returns:** `SelectionRegion`

### `lassoSelect(path)`

**Parameters:**

- `path` (`SelectionPoint[]`): 

**Returns:** `SelectionRegion`

### `ellipseSelect(centerRow, centerCol, radiusRows, radiusCols)`

**Parameters:**

- `centerRow` (`number`): 
- `centerCol` (`number`): 
- `radiusRows` (`number`): 
- `radiusCols` (`number`): 

**Returns:** `SelectionRegion`

### `polygonSelect(vertices)`

**Parameters:**

- `vertices` (`SelectionPoint[]`): 

**Returns:** `SelectionRegion`

### `expandSelection(selection)`

**Parameters:**

- `selection` (`SelectionRegion`): 

**Returns:** `SelectionRegion`

### `contractSelection(selection)`

**Parameters:**

- `selection` (`SelectionRegion`): 

**Returns:** `SelectionRegion`

### `selectByTileType(tileType)`

**Parameters:**

- `tileType` (`number`): 

**Returns:** `SelectionRegion`

### `invertSelection(selection)`

**Parameters:**

- `selection` (`SelectionRegion`): 

**Returns:** `SelectionRegion`

### `selectByRange(minTileId, maxTileId)`

**Parameters:**

- `minTileId` (`number`): 
- `maxTileId` (`number`): 

**Returns:** `SelectionRegion`

### `combineSelections(selection1, selection2, mode)`

**Parameters:**

- `selection1` (`SelectionRegion`): 
- `selection2` (`SelectionRegion`): 
- `mode` (`"add" | "subtract" | "intersect"`): 

**Returns:** `SelectionRegion`

### `isValidPosition(row, col)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 

**Returns:** `boolean`

### `tilesMatch(tile1, tile2, tolerance)`

**Parameters:**

- `tile1` (`number`): 
- `tile2` (`number`): 
- `tolerance` (`number`): 

**Returns:** `boolean`

### `getNeighbors(row, col)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 

**Returns:** `SelectionPoint[]`

### `pointInPolygon(point, polygon)`

**Parameters:**

- `point` (`SelectionPoint`): 
- `polygon` (`SelectionPoint[]`): 

**Returns:** `boolean`

### `getBounds(points)`

**Parameters:**

- `points` (`SelectionPoint[]`): 

**Returns:** `{ minRow: number; maxRow: number; minCol: number; maxCol: number; }`

### `createEmptySelection()`

**Returns:** `SelectionRegion`

### `createSelectionFromSet(selected)`

**Parameters:**

- `selected` (`Set<string>`): 

**Returns:** `SelectionRegion`

