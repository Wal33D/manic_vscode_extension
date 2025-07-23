# DashboardProvider

## Inheritance

- Implements: `vscode.WebviewViewProvider`

## Properties

| Name | Type | Description |
|------|------|-------------|
| `_view` | `WebviewView | undefined` |  |
| `_extensionUri` | `Uri` |  |
| `currentMapUri` | `Uri | undefined` |  |
| `stats` | `DashboardStats` |  |

## Methods

### `resolveWebviewView(webviewView, _context, _token)`

**Parameters:**

- `webviewView` (`WebviewView`): 
- `_context` (`WebviewViewResolveContext<unknown>`): 
- `_token` (`CancellationToken`): 

**Returns:** `void`

### `updateCurrentMap(uri)`

**Parameters:**

- `uri` (`Uri`): 

**Returns:** `Promise<void>`

### `countResources(stats)`

**Parameters:**

- `stats` (`{ resourceDistribution: Map<string, { tileCount: number; }>; }`): 

**Returns:** `number`

### `updateRecentMaps(path)`

**Parameters:**

- `path` (`string`): 

**Returns:** `void`

### `updateStats()`

**Returns:** `void`

### `loadStats()`

**Returns:** `DashboardStats`

### `saveStats()`

**Returns:** `void`

### `incrementStat(stat, amount)`

**Parameters:**

- `stat` (`"mapsCreated" | "timeSaved" | "quickActionsUsed" | "objectivesBuilt"`): 
- `amount` (`number`): 

**Returns:** `void`

### `_getHtmlForWebview(webview)`

**Parameters:**

- `webview` (`Webview`): 

**Returns:** `string`

