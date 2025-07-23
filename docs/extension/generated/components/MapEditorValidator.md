# MapEditorValidator

## Inheritance

- Extends: `MapValidator`

## Properties

| Name | Type | Description |
|------|------|-------------|
| `editorTiles` | `number[][]` |  |
| `editorRowCount` | `number` |  |
| `editorColCount` | `number` |  |
| `editorParser` | `DatFileParser` |  |

## Methods

### `parseEditorTiles()`

**Returns:** `void`

### `validateForEditor()`

**Returns:** `Promise<MapValidationResult>`

### `categorizeIssue(message)`

**Parameters:**

- `message` (`string`): 

**Returns:** `ValidationCategory`

### `validateSpawnPoints()`

**Returns:** `MapValidationIssue[]`

### `validateHazards()`

**Returns:** `MapValidationIssue[]`

### `validatePerformance()`

**Returns:** `MapValidationIssue[]`

### `validateBalance()`

**Returns:** `MapValidationIssue[]`

### `generateStatistics()`

**Returns:** `MapStatistics`

### `generateSuggestions(_issues, stats)`

**Parameters:**

- `_issues` (`MapValidationIssue[]`): 
- `stats` (`MapStatistics`): 

**Returns:** `MapSuggestion[]`

### `findEditorTilePositions(tileIds)`

**Parameters:**

- `tileIds` (`number | number[]`): 

**Returns:** `{ row: number; col: number; }[]`

### `countEditorTiles(tileIds)`

**Parameters:**

- `tileIds` (`number[]`): 

**Returns:** `number`

### `countWalkableTilesAround(centerRow, centerCol, radius)`

**Parameters:**

- `centerRow` (`number`): 
- `centerCol` (`number`): 
- `radius` (`number`): 

**Returns:** `number`

### `groupConnectedEditorTiles(positions)`

**Parameters:**

- `positions` (`{ row: number; col: number; }[]`): 

**Returns:** `{ row: number; col: number; }[][]`

### `floodFillEditorPositions(start, allPositions, visited)`

**Parameters:**

- `start` (`{ row: number; col: number; }`): 
- `allPositions` (`{ row: number; col: number; }[]`): 
- `visited` (`Set<string>`): 

**Returns:** `{ row: number; col: number; }[]`

### `getEditorDistance(pos1, pos2)`

**Parameters:**

- `pos1` (`{ row: number; col: number; }`): 
- `pos2` (`{ row: number; col: number; }`): 

**Returns:** `number`

### `calculateWallComplexity()`

**Returns:** `number`

### `findAllConnectedAreas()`

**Returns:** `{ row: number; col: number; }[][]`

### `findResourcesNearSpawn(distance)`

**Parameters:**

- `distance` (`number`): 

**Returns:** `{ row: number; col: number; }[]`

