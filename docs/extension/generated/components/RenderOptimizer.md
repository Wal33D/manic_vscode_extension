# RenderOptimizer

## Properties

| Name | Type | Description |
|------|------|-------------|
| `frameStats` | `RenderStats` |  |
| `lastFrameTime` | `number` |  |
| `frameCount` | `number` |  |
| `fpsUpdateTime` | `number` |  |
| `lodLevels` | `LODLevel[]` |  |

## Methods

### `calculateViewportBounds(scrollLeft, scrollTop, viewWidth, viewHeight, tileSize, totalRows, totalCols, margin)`

**Parameters:**

- `scrollLeft` (`number`): 
- `scrollTop` (`number`): 
- `viewWidth` (`number`): 
- `viewHeight` (`number`): 
- `tileSize` (`number`): 
- `totalRows` (`number`): 
- `totalCols` (`number`): 
- `margin` (`number`): 

**Returns:** `ViewportBounds`

### `getLODLevel(zoomLevel)`

**Parameters:**

- `zoomLevel` (`number`): 

**Returns:** `LODLevel`

### `shouldOptimize(rows, cols)`

**Parameters:**

- `rows` (`number`): 
- `cols` (`number`): 

**Returns:** `boolean`

### `calculateOptimalTileSize(baseSize, zoomLevel, _viewportSize, mapSize)`

**Parameters:**

- `baseSize` (`number`): 
- `zoomLevel` (`number`): 
- `_viewportSize` (`{ width: number; height: number; }`): 
- `mapSize` (`{ rows: number; cols: number; }`): 

**Returns:** `number`

### `updateStats(renderedTiles, totalTiles)`

**Parameters:**

- `renderedTiles` (`number`): 
- `totalTiles` (`number`): 

**Returns:** `void`

### `getStats()`

**Returns:** `RenderStats`

### `createRenderBatches(items, bounds, batchSize)`

**Parameters:**

- `items` (`T[][]`): 
- `bounds` (`ViewportBounds`): 
- `batchSize` (`number`): 

**Returns:** `T[][][]`

### `throttleRender(renderFn, delay)`

**Parameters:**

- `renderFn` (`() => void`): 
- `delay` (`number`): 

**Returns:** `() => void`

### `calculate3DLODLevel(distance)`

**Parameters:**

- `distance` (`number`): 

**Returns:** `number`

### `optimizeTerrainGeometry(rows, cols, lodLevel)`

**Parameters:**

- `rows` (`number`): 
- `cols` (`number`): 
- `lodLevel` (`number`): 

**Returns:** `{ segments: { x: number; y: number; }; skip: number; }`

### `isTileInFrustum(tilePosition, _frustum, _tileSize)`

**Parameters:**

- `tilePosition` (`{ x: number; y: number; z: number; }`): 
- `_frustum` (`unknown`): 
- `_tileSize` (`number`): 

**Returns:** `boolean`

### `adaptQualityToPerformance()`

**Returns:** `{ reduceQuality: boolean; skipFrames: number; reducedTileSize: boolean; }`

