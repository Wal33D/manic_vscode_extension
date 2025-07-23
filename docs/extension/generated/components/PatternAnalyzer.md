# PatternAnalyzer

## Methods

### `analyzeMap(tiles)`

**Parameters:**

- `tiles` (`number[][]`): 

**Returns:** `PatternAnalysis`

### `findCommonPatterns(tiles)`

**Parameters:**

- `tiles` (`number[][]`): 

**Returns:** `TilePattern[]`

### `findRoomPatterns(tiles)`

**Parameters:**

- `tiles` (`number[][]`): 

**Returns:** `TilePattern[]`

### `detectRoom(tiles, startRow, startCol, visited)`

**Parameters:**

- `tiles` (`number[][]`): 
- `startRow` (`number`): 
- `startCol` (`number`): 
- `visited` (`Set<string>`): 

**Returns:** `Set<string>`

### `isAreaEnclosed(tiles, area)`

**Parameters:**

- `tiles` (`number[][]`): 
- `area` (`Set<string>`): 

**Returns:** `boolean`

### `findCorridorPatterns(tiles)`

**Parameters:**

- `tiles` (`number[][]`): 

**Returns:** `TilePattern[]`

### `findResourcePatterns(tiles)`

**Parameters:**

- `tiles` (`number[][]`): 

**Returns:** `TilePattern[]`

### `findCluster(tiles, startRow, startCol, predicate, visited)`

**Parameters:**

- `tiles` (`number[][]`): 
- `startRow` (`number`): 
- `startCol` (`number`): 
- `predicate` (`(tile: number) => boolean`): 
- `visited` (`Set<string>`): 

**Returns:** `{ row: number; col: number; }[]`

### `findDefensivePatterns(tiles)`

**Parameters:**

- `tiles` (`number[][]`): 

**Returns:** `TilePattern[]`

### `calculateSymmetry(tiles)`

**Parameters:**

- `tiles` (`number[][]`): 

**Returns:** `number`

### `analyzeBalance(tiles)`

**Parameters:**

- `tiles` (`number[][]`): 

**Returns:** `BalanceMetrics`

### `findLargestBuildableArea(tiles)`

**Parameters:**

- `tiles` (`number[][]`): 

**Returns:** `number`

### `floodFillArea(tiles, startRow, startCol, visited)`

**Parameters:**

- `tiles` (`number[][]`): 
- `startRow` (`number`): 
- `startCol` (`number`): 
- `visited` (`Set<string>`): 

**Returns:** `number`

### `findChokePoints(tiles)`

**Parameters:**

- `tiles` (`number[][]`): 

**Returns:** `{ row: number; col: number; }[]`

### `areHazardsIsolated(tiles)`

**Parameters:**

- `tiles` (`number[][]`): 

**Returns:** `boolean`

### `generateSuggestions(_tiles, patterns, metrics)`

**Parameters:**

- `_tiles` (`number[][]`): 
- `patterns` (`TilePattern[]`): 
- `metrics` (`BalanceMetrics`): 

**Returns:** `string[]`

### `isWall(tile)`

**Parameters:**

- `tile` (`number`): 

**Returns:** `boolean`

### `isCrystalSeam(tile)`

**Parameters:**

- `tile` (`number`): 

**Returns:** `boolean`

### `isOreSeam(tile)`

**Parameters:**

- `tile` (`number`): 

**Returns:** `boolean`

### `isHazard(tile)`

**Parameters:**

- `tile` (`number`): 

**Returns:** `boolean`

### `isPassable(tile)`

**Parameters:**

- `tile` (`number`): 

**Returns:** `boolean`

