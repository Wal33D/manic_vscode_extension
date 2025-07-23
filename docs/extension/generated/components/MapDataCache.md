# MapDataCache

## Properties

| Name | Type | Description |
|------|------|-------------|
| `tileCache` | `LRUCache<any>` |  |
| `mapCache` | `LRUCache<any>` |  |
| `validationCache` | `LRUCache<any>` |  |

## Methods

### `getTileData(mapId, x, y)`

**Parameters:**

- `mapId` (`string`): 
- `x` (`number`): 
- `y` (`number`): 

**Returns:** `any`

### `setTileData(mapId, x, y, data)`

**Parameters:**

- `mapId` (`string`): 
- `x` (`number`): 
- `y` (`number`): 
- `data` (`any`): 

**Returns:** `void`

### `getMapData(mapId)`

**Parameters:**

- `mapId` (`string`): 

**Returns:** `any`

### `setMapData(mapId, data)`

**Parameters:**

- `mapId` (`string`): 
- `data` (`any`): 

**Returns:** `void`

### `getValidationResult(mapId)`

**Parameters:**

- `mapId` (`string`): 

**Returns:** `any`

### `setValidationResult(mapId, result)`

**Parameters:**

- `mapId` (`string`): 
- `result` (`any`): 

**Returns:** `void`

### `invalidateMap(mapId)`

**Parameters:**

- `mapId` (`string`): 

**Returns:** `void`

### `clearAll()`

**Returns:** `void`

### `getStats()`

**Returns:** `Record<string, any>`

