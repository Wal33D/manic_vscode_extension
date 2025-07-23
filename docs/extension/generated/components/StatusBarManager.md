# StatusBarManager

## Properties

| Name | Type | Description |
|------|------|-------------|
| `mapInfoItem` | `StatusBarItem` |  |
| `tileInfoItem` | `StatusBarItem` |  |
| `validationItem` | `StatusBarItem` |  |
| `performanceItem` | `StatusBarItem` |  |

## Methods

### `updateActiveDocument(document)`

**Parameters:**

- `document` (`TextDocument | undefined`): 

**Returns:** `void`

### `updateMapInfo(info)`

**Parameters:**

- `info` (`{ rows: number; cols: number; title: string; biome: string; } | undefined`): 

**Returns:** `void`

### `updateTileInfo(tileId, tileName)`

**Parameters:**

- `tileId` (`number`): 
- `tileName` (`string`): 

**Returns:** `void`

### `updateValidation(status, counts?)`

**Parameters:**

- `status` (`"valid" | "errors" | "warnings" | "pending"`): 
- `counts` (`{ errors: number; warnings: number; } | undefined`): 

**Returns:** `void`

### `updatePerformance(stats)`

**Parameters:**

- `stats` (`{ tileCount: number; crystals: number; ore: number; }`): 

**Returns:** `void`

### `updateStatusBarItem(updates)`

**Parameters:**

- `updates` (`{ selectedTile?: string | undefined; validation?: string | undefined; }`): 

**Returns:** `void`

### `dispose()`

**Returns:** `void`

