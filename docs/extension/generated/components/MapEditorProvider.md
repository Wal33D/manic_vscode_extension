# MapEditorProvider

## Inheritance

- Implements: `vscode.CustomTextEditorProvider`

## Properties

| Name | Type | Description |
|------|------|-------------|
| `editHistory` | `EditHistory` |  |
| `layers` | `Map<string, MapLayer[]>` |  |

## Methods

### `resolveCustomTextEditor(document, webviewPanel, _token)`

**Parameters:**

- `document` (`TextDocument`): 
- `webviewPanel` (`WebviewPanel`): 
- `_token` (`CancellationToken`): 

**Returns:** `Promise<void>`

### `handlePaint(document, tiles, description)`

**Parameters:**

- `document` (`TextDocument`): 
- `tiles` (`{ row: number; col: number; tileId: number; }[]`): 
- `description` (`string`): 

**Returns:** `Promise<void>`

### `handleUndo(document)`

**Parameters:**

- `document` (`TextDocument`): 

**Returns:** `Promise<void>`

### `handleRedo(document)`

**Parameters:**

- `document` (`TextDocument`): 

**Returns:** `Promise<void>`

### `handleCopy(webview, selection)`

**Parameters:**

- `webview` (`Webview`): 
- `selection` (`SelectionData`): 

**Returns:** `Promise<void>`

### `handlePaste(document, tiles, _targetRow, _targetCol, description)`

**Parameters:**

- `document` (`TextDocument`): 
- `tiles` (`{ row: number; col: number; tileId: number; }[]`): 
- `_targetRow` (`number`): 
- `_targetCol` (`number`): 
- `description` (`string`): 

**Returns:** `Promise<void>`

### `handleDelete(document, selection, description)`

**Parameters:**

- `document` (`TextDocument`): 
- `selection` (`SelectionData`): 
- `description` (`string`): 

**Returns:** `Promise<void>`

### `handleMove(document, selection, targetRow, targetCol, description)`

**Parameters:**

- `document` (`TextDocument`): 
- `selection` (`SelectionData`): 
- `targetRow` (`number`): 
- `targetCol` (`number`): 
- `description` (`string`): 

**Returns:** `Promise<void>`

### `handleExport(webview, format, includeGrid)`

**Parameters:**

- `webview` (`Webview`): 
- `format` (`string`): 
- `includeGrid` (`boolean`): 

**Returns:** `Promise<void>`

### `handleSaveExport(imageData, path)`

**Parameters:**

- `imageData` (`string`): 
- `path` (`string`): 

**Returns:** `Promise<void>`

### `handleSavePattern(webview, pattern)`

**Parameters:**

- `webview` (`Webview`): 
- `pattern` (`TilePattern`): 

**Returns:** `Promise<void>`

### `handleDeletePattern(webview, patternId)`

**Parameters:**

- `webview` (`Webview`): 
- `patternId` (`string`): 

**Returns:** `Promise<void>`

### `handleStampPattern(document, pattern, row, col, description)`

**Parameters:**

- `document` (`TextDocument`): 
- `pattern` (`TilePattern`): 
- `row` (`number`): 
- `col` (`number`): 
- `description` (`string`): 

**Returns:** `Promise<void>`

### `handleCreateLayer(webview, name)`

**Parameters:**

- `webview` (`Webview`): 
- `name` (`string`): 

**Returns:** `Promise<void>`

### `handleDeleteLayer(webview, layerId)`

**Parameters:**

- `webview` (`Webview`): 
- `layerId` (`string`): 

**Returns:** `Promise<void>`

### `handleUpdateLayer(webview, layer)`

**Parameters:**

- `webview` (`Webview`): 
- `layer` (`MapLayer`): 

**Returns:** `Promise<void>`

### `handleMergeLayersDown(webview, _document, layerId)`

**Parameters:**

- `webview` (`Webview`): 
- `_document` (`TextDocument`): 
- `layerId` (`string`): 

**Returns:** `Promise<void>`

### `handleAutoTile(document, tiles, description)`

**Parameters:**

- `document` (`TextDocument`): 
- `tiles` (`{ row: number; col: number; tileId: number; }[]`): 
- `description` (`string`): 

**Returns:** `Promise<void>`

### `handleValidateMap(webview, document)`

**Parameters:**

- `webview` (`Webview`): 
- `document` (`TextDocument`): 

**Returns:** `Promise<void>`

### `handleFixValidationIssue(document, _issue, fix)`

**Parameters:**

- `document` (`TextDocument`): 
- `_issue` (`any`): 
- `fix` (`string`): 

**Returns:** `Promise<void>`

### `updateWebview(webview, document)`

**Parameters:**

- `webview` (`Webview`): 
- `document` (`TextDocument`): 

**Returns:** `void`

### `getHtmlContent(webview, tiles, info)`

**Parameters:**

- `webview` (`Webview`): 
- `tiles` (`number[][]`): 
- `info` (`{ rowcount: number; colcount: number; }`): 

**Returns:** `string`

### `handleGetTemplates(webview)`

**Parameters:**

- `webview` (`Webview`): 

**Returns:** `Promise<void>`

### `handleUseTemplate(document, webview, template)`

**Parameters:**

- `document` (`TextDocument`): 
- `webview` (`Webview`): 
- `template` (`MapTemplate`): 

**Returns:** `Promise<void>`

### `handleSaveAsTemplate(webview, name, description, objectives, tiles)`

**Parameters:**

- `webview` (`Webview`): 
- `name` (`string`): 
- `description` (`string`): 
- `objectives` (`string[]`): 
- `tiles` (`number[][]`): 

**Returns:** `Promise<void>`

### `handleAdvancedSelect(webview, document, mode, params)`

**Parameters:**

- `webview` (`Webview`): 
- `document` (`TextDocument`): 
- `mode` (`SelectionMode`): 
- `params` (`any`): 

**Returns:** `Promise<void>`

### `handleModifySelection(webview, operation, selection)`

**Parameters:**

- `webview` (`Webview`): 
- `operation` (`string`): 
- `selection` (`any`): 

**Returns:** `Promise<void>`

### `handleToggleAnimation(webview, enabled)`

**Parameters:**

- `webview` (`Webview`): 
- `enabled` (`boolean`): 

**Returns:** `Promise<void>`

### `serializeDatFile(datFile)`

**Parameters:**

- `datFile` (`any`): 

**Returns:** `string`

### `getErrorHtml(message)`

**Parameters:**

- `message` (`string`): 

**Returns:** `string`

