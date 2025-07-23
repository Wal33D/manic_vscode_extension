# WorkspaceProvider

## Inheritance

- Implements: `vscode.WebviewViewProvider`

## Properties

| Name | Type | Description |
|------|------|-------------|
| `_view` | `WebviewView | undefined` |  |
| `panelManager` | `PanelManager` |  |
| `layoutManager` | `LayoutManager` |  |
| `lazyLoader` | `LazyLoader | undefined` |  |
| `updateWebviewDebounced` | `() => void` |  |
| `liveRegion` | `AriaLiveRegion | undefined` |  |

## Methods

### `resolveWebviewView(webviewView, _context, _token)`

**Parameters:**

- `webviewView` (`WebviewView`): 
- `_context` (`WebviewViewResolveContext<unknown>`): 
- `_token` (`CancellationToken`): 

**Returns:** `void`

### `handlePanelMessage(message)`

**Parameters:**

- `message` (`{ command: string; panelId?: string | undefined; position?: string | { x?: number | undefined; y?: number | undefined; } | undefined; size?: { width: string | number; height: string | number; } | undefined; collapsed?: boolean | undefined; }`): 

**Returns:** `Promise<void>`

### `handleLayoutMessage(message)`

**Parameters:**

- `message` (`{ command: string; name?: string | undefined; preset?: string | undefined; }`): 

**Returns:** `Promise<void>`

### `handleToolMessage(message)`

**Parameters:**

- `message` (`{ command: string; tileId?: number | undefined; tool?: string | undefined; action?: string | undefined; args?: unknown; }`): 

**Returns:** `Promise<void>`

### `focusPanel(panelId)`

**Parameters:**

- `panelId` (`string`): 

**Returns:** `void`

### `selectTool(tool)`

**Parameters:**

- `tool` (`string`): 

**Returns:** `void`

### `executeWorkspaceCommand(command, _args?)`

**Parameters:**

- `command` (`string`): 
- `_args` (`any`): 

**Returns:** `void`

### `closeActivePanel()`

**Returns:** `void`

### `minimizeActivePanel()`

**Returns:** `void`

### `maximizeActivePanel()`

**Returns:** `void`

### `splitView(direction)`

**Parameters:**

- `direction` (`"horizontal" | "vertical"`): 

**Returns:** `void`

### `unsplitView()`

**Returns:** `void`

### `navigateTab(direction)`

**Parameters:**

- `direction` (`"next" | "previous"`): 

**Returns:** `void`

### `handleZoom(command)`

**Parameters:**

- `command` (`string`): 

**Returns:** `void`

### `toggleFocusMode()`

**Returns:** `void`

### `initializeWorkspace()`

**Returns:** `Promise<void>`

### `hideAllPanels()`

**Returns:** `void`

### `applyPresetLayout(preset)`

**Parameters:**

- `preset` (`string`): 

**Returns:** `void`

### `updateWebview()`

**Returns:** `void`

### `_getHtmlForWebview(webview)`

**Parameters:**

- `webview` (`Webview`): 

**Returns:** `string`

### `getNonce()`

**Returns:** `string`

### `dispose()`

**Returns:** `void`

### `setupAccessibility(webview)`

**Parameters:**

- `webview` (`Webview`): 

**Returns:** `void`

### `setupLazyLoading()`

**Returns:** `void`

### `handleLazyLoad(panelId)`

**Parameters:**

- `panelId` (`string`): 

**Returns:** `Promise<void>`

### `handleDataRequest(message)`

**Parameters:**

- `message` (`{ type: string; requestType: string; mapId?: string | undefined; params?: any; }`): 

**Returns:** `Promise<void>`

### `loadMapData(mapId)`

**Parameters:**

- `mapId` (`string`): 

**Returns:** `Promise<any>`

### `loadTileData(_mapId, x, y)`

**Parameters:**

- `_mapId` (`string`): 
- `x` (`number`): 
- `y` (`number`): 

**Returns:** `Promise<any>`

