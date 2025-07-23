# HeatMapProvider

## Inheritance

- Implements: `vscode.WebviewViewProvider`

## Properties

| Name | Type | Description |
|------|------|-------------|
| `_view` | `WebviewView | undefined` |  |
| `_currentDocument` | `TextDocument | undefined` |  |
| `analyzer` | `PathfindingAnalyzer` |  |
| `currentHeatMap` | `HeatMapData | undefined` |  |
| `currentMode` | `"traffic" | "accessibility" | "chokepoint"` |  |

## Methods

### `resolveWebviewView(webviewView, _context, _token)`

**Parameters:**

- `webviewView` (`WebviewView`): 
- `_context` (`WebviewViewResolveContext<unknown>`): 
- `_token` (`CancellationToken`): 

**Returns:** `void`

### `updateDocument(document)`

**Parameters:**

- `document` (`TextDocument`): 

**Returns:** `void`

### `updateHeatMap()`

**Returns:** `void`

### `exportHeatMap()`

**Returns:** `Promise<void>`

### `showStatistics()`

**Returns:** `void`

### `navigateToPosition(row, col)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 

**Returns:** `void`

### `_getHtmlForWebview(webview)`

**Parameters:**

- `webview` (`Webview`): 

**Returns:** `string`

