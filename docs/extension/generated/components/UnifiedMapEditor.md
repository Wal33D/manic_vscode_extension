# UnifiedMapEditor

## Properties

| Name | Type | Description |
|------|------|-------------|
| `webview` | `Webview | undefined` |  |
| `currentMapPath` | `string | undefined` |  |
| `isDirty` | `boolean` |  |
| `autoSaveTimer` | `Timeout | undefined` |  |
| `lazyLoader` | `LazyLoader | undefined` |  |
| `currentTool` | `string` |  |
| `selectedTileId` | `number` |  |
| `brushSize` | `number` |  |
| `selectionArea` | `{ start: { x: number; y: number; }; end: { x: number; y: number; }; } | undefined` |  |
| `copiedTiles` | `any[] | undefined` |  |
| `toolHistory` | `string[]` |  |
| `zoomLevel` | `number` |  |
| `viewportOffset` | `{ x: number; y: number; }` |  |
| `undoStack` | `any[]` |  |
| `redoStack` | `any[]` |  |
| `maxUndoLevels` | `number` |  |
| `saveDebounced` | `() => void` |  |

## Methods

### `initialize(webview)`

**Parameters:**

- `webview` (`Webview`): 

**Returns:** `Promise<void>`

### `loadMap(mapPath)`

**Parameters:**

- `mapPath` (`string`): 

**Returns:** `Promise<void>`

### `setupMessageHandling()`

**Returns:** `void`

### `loadEditorUI()`

**Returns:** `Promise<void>`

### `handleToolChange(message)`

**Parameters:**

- `message` (`any`): 

**Returns:** `void`

### `handleTileChange(message)`

**Parameters:**

- `message` (`any`): 

**Returns:** `void`

### `handleEditAction(message)`

**Parameters:**

- `message` (`any`): 

**Returns:** `Promise<void>`

### `placeTile(x, y, tileId)`

**Parameters:**

- `x` (`number`): 
- `y` (`number`): 
- `tileId` (`number`): 

**Returns:** `Promise<void>`

### `paintArea(tiles)`

**Parameters:**

- `tiles` (`{ x: number; y: number; tileId: number; }[]`): 

**Returns:** `Promise<void>`

### `fillArea(startX, startY, tileId)`

**Parameters:**

- `startX` (`number`): 
- `startY` (`number`): 
- `tileId` (`number`): 

**Returns:** `Promise<void>`

### `saveMap()`

**Returns:** `Promise<void>`

### `autoSave()`

**Returns:** `Promise<void>`

### `undo()`

**Returns:** `Promise<void>`

### `redo()`

**Returns:** `Promise<void>`

### `exportMap(format)`

**Parameters:**

- `format` (`string`): 

**Returns:** `Promise<void>`

### `loadMapData(mapPath)`

**Parameters:**

- `mapPath` (`string`): 

**Returns:** `Promise<any>`

### `displayMap(mapData)`

**Parameters:**

- `mapData` (`any`): 

**Returns:** `Promise<void>`

### `getToolsPanelContent()`

**Returns:** `Promise<string>`

### `getLayersPanelContent()`

**Returns:** `Promise<string>`

### `exportAsImage(_mapData)`

**Parameters:**

- `_mapData` (`any`): 

**Returns:** `Promise<void>`

### `exportAsJSON(mapData)`

**Parameters:**

- `mapData` (`any`): 

**Returns:** `Promise<void>`

### `handleSettingsChange(message)`

**Parameters:**

- `message` (`any`): 

**Returns:** `void`

### `setTileHeight(x, y, height)`

**Parameters:**

- `x` (`number`): 
- `y` (`number`): 
- `height` (`number`): 

**Returns:** `Promise<void>`

### `placeBuilding(x, y, buildingType)`

**Parameters:**

- `x` (`number`): 
- `y` (`number`): 
- `buildingType` (`string`): 

**Returns:** `Promise<void>`

### `placeResource(x, y, resourceType, amount)`

**Parameters:**

- `x` (`number`): 
- `y` (`number`): 
- `resourceType` (`string`): 
- `amount` (`number`): 

**Returns:** `Promise<void>`

### `saveUndoState()`

**Returns:** `Promise<void>`

### `copySelection()`

**Returns:** `Promise<void>`

### `pasteSelection(x, y)`

**Parameters:**

- `x` (`number`): 
- `y` (`number`): 

**Returns:** `Promise<void>`

### `deleteSelection()`

**Returns:** `Promise<void>`

### `selectAll()`

**Returns:** `Promise<void>`

### `handleZoom(level, centerX?, centerY?)`

**Parameters:**

- `level` (`number`): 
- `centerX` (`number | undefined`): 
- `centerY` (`number | undefined`): 

**Returns:** `void`

### `handlePan(deltaX, deltaY)`

**Parameters:**

- `deltaX` (`number`): 
- `deltaY` (`number`): 

**Returns:** `void`

### `handleSelection(message)`

**Parameters:**

- `message` (`any`): 

**Returns:** `Promise<void>`

### `handleTransform(message)`

**Parameters:**

- `message` (`any`): 

**Returns:** `Promise<void>`

### `handleLayerChange(message)`

**Parameters:**

- `message` (`any`): 

**Returns:** `void`

### `drawRectangle(start, end, tileId, filled)`

**Parameters:**

- `start` (`{ x: number; y: number; }`): 
- `end` (`{ x: number; y: number; }`): 
- `tileId` (`number`): 
- `filled` (`boolean`): 

**Returns:** `Promise<void>`

### `drawEllipse(center, radiusX, radiusY, tileId, filled)`

**Parameters:**

- `center` (`{ x: number; y: number; }`): 
- `radiusX` (`number`): 
- `radiusY` (`number`): 
- `tileId` (`number`): 
- `filled` (`boolean`): 

**Returns:** `Promise<void>`

### `drawLine(start, end, tileId, width)`

**Parameters:**

- `start` (`{ x: number; y: number; }`): 
- `end` (`{ x: number; y: number; }`): 
- `tileId` (`number`): 
- `width` (`number`): 

**Returns:** `Promise<void>`

### `rotateSelection(angle)`

**Parameters:**

- `angle` (`number`): 

**Returns:** `Promise<void>`

### `flipSelection(horizontal, _vertical)`

**Parameters:**

- `horizontal` (`boolean`): 
- `_vertical` (`boolean`): 

**Returns:** `Promise<void>`

### `scaleSelection(scaleX, scaleY)`

**Parameters:**

- `scaleX` (`number`): 
- `scaleY` (`number`): 

**Returns:** `Promise<void>`

### `updateRecentTools(tool)`

**Parameters:**

- `tool` (`string`): 

**Returns:** `void`

### `updateStatusEnhanced()`

**Returns:** `void`

### `dispose()`

**Returns:** `void`

