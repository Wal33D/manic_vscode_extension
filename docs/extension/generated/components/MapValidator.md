# MapValidator

## Properties

| Name | Type | Description |
|------|------|-------------|
| `parser` | `DatFileParser` |  |
| `tiles` | `number[][]` |  |
| `rowCount` | `number` |  |
| `colCount` | `number` |  |

## Methods

### `parseTiles()`

**Returns:** `void`

### `validate()`

**Returns:** `Promise<ValidationResult>`

### `validateStructure(errors, warnings)`

**Parameters:**

- `errors` (`ValidationError[]`): 
- `warnings` (`ValidationWarning[]`): 

**Returns:** `void`

### `validateTiles(errors, warnings)`

**Parameters:**

- `errors` (`ValidationError[]`): 
- `warnings` (`ValidationWarning[]`): 

**Returns:** `void`

### `validatePathfinding()`

**Returns:** `{ errors: ValidationError[]; warnings: ValidationWarning[]; info: ValidationInfo[]; }`

### `validateResourceAccessibility()`

**Returns:** `{ warnings: ValidationWarning[]; info: ValidationInfo[]; }`

### `validateBuildingPlacements()`

**Returns:** `{ warnings: ValidationWarning[]; }`

### `validateObjectives()`

**Returns:** `{ errors: ValidationError[]; warnings: ValidationWarning[]; }`

### `findTilePositions(tileIds)`

**Parameters:**

- `tileIds` (`number | number[]`): 

**Returns:** `{ row: number; col: number; }[]`

### `findUnreachablePositions(starts, targets)`

**Parameters:**

- `starts` (`{ row: number; col: number; }[]`): 
- `targets` (`{ row: number; col: number; }[]`): 

**Returns:** `{ row: number; col: number; }[]`

### `hasPath(start, end)`

**Parameters:**

- `start` (`{ row: number; col: number; }`): 
- `end` (`{ row: number; col: number; }`): 

**Returns:** `boolean`

### `findIsolatedAreas()`

**Returns:** `{ size: number; positions: { row: number; col: number; }[]; }[]`

### `floodFill(startRow, startCol, visited, walkableTiles)`

**Parameters:**

- `startRow` (`number`): 
- `startCol` (`number`): 
- `visited` (`Set<string>`): 
- `walkableTiles` (`number[]`): 

**Returns:** `{ row: number; col: number; }[]`

### `getNeighbors(row, col)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 

**Returns:** `{ row: number; col: number; }[]`

### `countTiles(tileIds)`

**Parameters:**

- `tileIds` (`number[]`): 

**Returns:** `number`

