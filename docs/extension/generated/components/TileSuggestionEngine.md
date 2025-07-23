# TileSuggestionEngine

## Properties

| Name | Type | Description |
|------|------|-------------|
| `patterns` | `TilePattern[]` |  |

## Methods

### `getSuggestions(tiles, row, col, maxSuggestions)`

**Parameters:**

- `tiles` (`number[][]`): 
- `row` (`number`): 
- `col` (`number`): 
- `maxSuggestions` (`number`): 

**Returns:** `TileSuggestion[]`

### `getSurroundingTiles(tiles, row, col)`

**Parameters:**

- `tiles` (`number[][]`): 
- `row` (`number`): 
- `col` (`number`): 

**Returns:** `(number | null)[][]`

### `initializePatterns()`

**Returns:** `void`

### `getContextualSuggestions(surrounding)`

**Parameters:**

- `surrounding` (`(number | null)[][]`): 

**Returns:** `TileSuggestion[]`

### `matchPattern(pattern, surrounding)`

**Parameters:**

- `pattern` (`TilePattern`): 
- `surrounding` (`(number | null)[][]`): 

**Returns:** `PatternMatch`

### `generateSuggestionsFromPattern(pattern, match, surrounding)`

**Parameters:**

- `pattern` (`TilePattern`): 
- `match` (`PatternMatch`): 
- `surrounding` (`(number | null)[][]`): 

**Returns:** `TileSuggestion[]`

### `isWall(tile)`

**Parameters:**

- `tile` (`number | null`): 

**Returns:** `boolean`

### `isCrystalSeam(tile)`

**Parameters:**

- `tile` (`number | null`): 

**Returns:** `boolean`

### `isOreSeam(tile)`

**Parameters:**

- `tile` (`number | null`): 

**Returns:** `boolean`

### `isHazard(tile)`

**Parameters:**

- `tile` (`number | null`): 

**Returns:** `boolean`

### `getComplementaryTile(tile)`

**Parameters:**

- `tile` (`number`): 

**Returns:** `number | null`

### `getTileInfo(tileId)`

**Parameters:**

- `tileId` (`number`): 

**Returns:** `TileDefinition | undefined`

