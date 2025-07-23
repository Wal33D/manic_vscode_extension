# DatFileValidator

## Properties

| Name | Type | Description |
|------|------|-------------|
| `errors` | `ValidationError[]` |  |
| `warnings` | `ValidationError[]` |  |

## Methods

### `validate(datFile)`

**Parameters:**

- `datFile` (`DatFile`): 

**Returns:** `ValidationError[]`

### `validateInfo(info)`

**Parameters:**

- `info` (`InfoSection`): 

**Returns:** `void`

### `validateTiles(tiles, info)`

**Parameters:**

- `tiles` (`number[][]`): 
- `info` (`InfoSection`): 

**Returns:** `void`

### `validateTilePlacement(tiles, row, col, tileId, tileInfo)`

**Parameters:**

- `tiles` (`number[][]`): 
- `row` (`number`): 
- `col` (`number`): 
- `tileId` (`number`): 
- `tileInfo` (`TileDefinition | undefined`): 

**Returns:** `void`

### `getAdjacentTiles(tiles, row, col)`

**Parameters:**

- `tiles` (`number[][]`): 
- `row` (`number`): 
- `col` (`number`): 

**Returns:** `number[]`

### `calculateExpectedVariant(tiles, row, col, tileId)`

**Parameters:**

- `tiles` (`number[][]`): 
- `row` (`number`): 
- `col` (`number`): 
- `tileId` (`number`): 

**Returns:** `number`

### `validateHeight(height, info)`

**Parameters:**

- `height` (`number[][]`): 
- `info` (`InfoSection`): 

**Returns:** `void`

### `validateResources(resources, info)`

**Parameters:**

- `resources` (`{ crystals?: number[][] | undefined; ore?: number[][] | undefined; }`): 
- `info` (`InfoSection`): 

**Returns:** `void`

### `validateObjectives(datFile)`

**Parameters:**

- `datFile` (`DatFile`): 

**Returns:** `void`

### `validateEntities(entities, section, info)`

**Parameters:**

- `entities` (`Entity[]`): 
- `section` (`string`): 
- `info` (`InfoSection`): 

**Returns:** `void`

### `validateGrid(grid, info, section, binaryOnly, minValue?, maxValue?)`

**Parameters:**

- `grid` (`number[][]`): 
- `info` (`InfoSection`): 
- `section` (`string`): 
- `binaryOnly` (`boolean`): 
- `minValue` (`number | undefined`): 
- `maxValue` (`number | undefined`): 

**Returns:** `void`

### `countResources(grid?)`

**Parameters:**

- `grid` (`number[][] | undefined`): 

**Returns:** `number`

### `addError(message, line, column, section?)`

**Parameters:**

- `message` (`string`): 
- `line` (`number`): 
- `column` (`number`): 
- `section` (`string | undefined`): 

**Returns:** `void`

### `addWarning(message, line, column, section?)`

**Parameters:**

- `message` (`string`): 
- `line` (`number`): 
- `column` (`number`): 
- `section` (`string | undefined`): 

**Returns:** `void`

### `validateObjectiveCondition(condition, datFile)`

**Parameters:**

- `condition` (`string`): 
- `datFile` (`DatFile`): 

**Returns:** `void`

