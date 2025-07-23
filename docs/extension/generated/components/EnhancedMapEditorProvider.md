# EnhancedMapEditorProvider

## Inheritance

- Implements: `vscode.CustomTextEditorProvider`

## Properties

| Name | Type | Description |
|------|------|-------------|
| `workspaceIntegration` | `boolean` |  |
| `panelManager` | `PanelManager | undefined` |  |

## Methods

### `resolveCustomTextEditor(document, webviewPanel, _token)`

**Parameters:**

- `document` (`TextDocument`): 
- `webviewPanel` (`WebviewPanel`): 
- `_token` (`CancellationToken`): 

**Returns:** `Promise<void>`

### `handlePanelMessage(message, webviewPanel)`

**Parameters:**

- `message` (`any`): 
- `webviewPanel` (`WebviewPanel`): 

**Returns:** `Promise<void>`

### `handleToolMessage(message, webviewPanel, _document)`

**Parameters:**

- `message` (`any`): 
- `webviewPanel` (`WebviewPanel`): 
- `_document` (`TextDocument`): 

**Returns:** `Promise<void>`

### `handlePropertyMessage(message, webviewPanel, _document)`

**Parameters:**

- `message` (`any`): 
- `webviewPanel` (`WebviewPanel`): 
- `_document` (`TextDocument`): 

**Returns:** `Promise<void>`

### `updatePropertyInspector(webview, tool)`

**Parameters:**

- `webview` (`Webview`): 
- `tool` (`string`): 

**Returns:** `void`

### `getToolProperties(tool)`

**Parameters:**

- `tool` (`string`): 

**Returns:** `any`

### `getTileOptions()`

**Returns:** `{ value: number; label: string; }[]`

### `updatePanelStates(webview)`

**Parameters:**

- `webview` (`Webview`): 

**Returns:** `void`

### `getEnhancedHtml(webview, _document)`

**Parameters:**

- `webview` (`Webview`): 
- `_document` (`TextDocument`): 

**Returns:** `string`

### `updateEnhancedWebview(webview, document)`

**Parameters:**

- `webview` (`Webview`): 
- `document` (`TextDocument`): 

**Returns:** `void`

### `sendMapData(webview, document)`

**Parameters:**

- `webview` (`Webview`): 
- `document` (`TextDocument`): 

**Returns:** `void`

### `parseMapData(text)`

**Parameters:**

- `text` (`string`): 

**Returns:** `any`

### `updateDocument(message, _webviewPanel, document)`

**Parameters:**

- `message` (`any`): 
- `_webviewPanel` (`WebviewPanel`): 
- `document` (`TextDocument`): 

**Returns:** `Promise<void>`

### `getNonce()`

**Returns:** `string`

