# WelcomePageProvider

## Properties

| Name | Type | Description |
|------|------|-------------|
| `panel` | `WebviewPanel | undefined` |  |

## Methods

### `show()`

**Returns:** `Promise<void>`

### `getWebviewContent(webview)`

**Parameters:**

- `webview` (`Webview`): 

**Returns:** `string`

### `openDocument(relativePath)`

**Parameters:**

- `relativePath` (`string`): 

**Returns:** `Promise<void>`

### `openSampleFile(sampleName?)`

**Parameters:**

- `sampleName` (`string | undefined`): 

**Returns:** `Promise<void>`

### `getSampleContent(sampleName?)`

**Parameters:**

- `sampleName` (`string | undefined`): 

**Returns:** `string`

### `getRecentMaps()`

**Returns:** `string[]`

### `openRecentMap(mapPath)`

**Parameters:**

- `mapPath` (`string`): 

**Returns:** `Promise<void>`

### `clearRecentMaps()`

**Returns:** `Promise<void>`

### `getExtensionStats()`

**Returns:** `{ mapsCreated: number; timeSaved: number; quickActions: number; objectivesBuilt: number; }`

