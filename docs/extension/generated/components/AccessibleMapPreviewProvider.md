# AccessibleMapPreviewProvider

## Inheritance

- Implements: `vscode.WebviewViewProvider`

## Properties

| Name | Type | Description |
|------|------|-------------|
| `_view` | `WebviewView | undefined` |  |
| `_currentDocument` | `TextDocument | undefined` |  |
| `accessibilityManager` | `AccessibilityManager` |  |
| `focusedTile` | `{ row: number; col: number; } | null` |  |

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

### `_getHtmlForWebview(webview)`

**Parameters:**

- `webview` (`Webview`): 

**Returns:** `string`

### `updatePreview()`

**Returns:** `void`

### `_handleTileClick(row, col, _tileId)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 
- `_tileId` (`number`): 

**Returns:** `void`

### `_handleTilesSelected(tiles)`

**Parameters:**

- `tiles` (`{ row: number; col: number; }[]`): 

**Returns:** `void`

### `handleKeyboardNavigation(key)`

**Parameters:**

- `key` (`string`): 

**Returns:** `void`

### `parseTiles(content)`

**Parameters:**

- `content` (`string`): 

**Returns:** `number[][]`

### `getTileInfo(tileId)`

**Parameters:**

- `tileId` (`number`): 

**Returns:** `TileDefinition | undefined`

