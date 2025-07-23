# AutoTiler

## Properties

| Name | Type | Description |
|------|------|-------------|
| `tiles` | `number[][]` |  |
| `rows` | `number` |  |
| `cols` | `number` |  |

## Methods

### `getAutoTileType(tileId)`

**Parameters:**

- `tileId` (`number`): 

**Returns:** `AutoTileType | null`

### `isSameTileType(row, col, tileType)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 
- `tileType` (`AutoTileType`): 

**Returns:** `boolean`

### `getNeighborInfo(row, col, tileType)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 
- `tileType` (`AutoTileType`): 

**Returns:** `NeighborInfo`

### `neighborInfoToBitmask(info)`

**Parameters:**

- `info` (`NeighborInfo`): 

**Returns:** `number`

### `patternMatches(patternMask, neighborMask)`

**Parameters:**

- `patternMask` (`number`): 
- `neighborMask` (`number`): 

**Returns:** `boolean`

### `getAutoTile(row, col, baseTileId)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 
- `baseTileId` (`number`): 

**Returns:** `number`

### `countBits(n)`

**Parameters:**

- `n` (`number`): 

**Returns:** `number`

### `autoTileRegion(startRow, startCol, endRow, endCol, baseTileId)`

**Parameters:**

- `startRow` (`number`): 
- `startCol` (`number`): 
- `endRow` (`number`): 
- `endCol` (`number`): 
- `baseTileId` (`number`): 

**Returns:** `{ row: number; col: number; tileId: number; }[]`

### `updateAndAutoTile(tilesToUpdate)`

**Parameters:**

- `tilesToUpdate` (`{ row: number; col: number; tileId: number; }[]`): 

**Returns:** `{ row: number; col: number; tileId: number; }[]`

### `getAutoTiledPositions(positions)`

**Parameters:**

- `positions` (`{ row: number; col: number; tileId: number; }[]`): 

**Returns:** `{ row: number; col: number; tileId: number; }[]`

