# Terrain3DProvider

## Inheritance

- Implements: `vscode.WebviewViewProvider`

## Properties

| Name | Type | Description |
|------|------|-------------|
| `_view` | `WebviewView | undefined` |  |
| `_currentDocument` | `TextDocument | undefined` |  |

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

### `updatePreview()`

**Returns:** `void`

### `_handleTileClick(x, z, tileId)`

**Parameters:**

- `x` (`number`): 
- `z` (`number`): 
- `tileId` (`number`): 

**Returns:** `void`

### `_getHtmlForWebview(webview)`

**Parameters:**

- `webview` (`Webview`): 

**Returns:** `string`

