# LazyLoader

## Properties

| Name | Type | Description |
|------|------|-------------|
| `loadedPanels` | `Map<string, string>` |  |
| `loadingPanels` | `Map<string, Promise<string>>` |  |
| `observers` | `Map<string, any>` |  |

## Methods

### `registerPanel(config)`

**Parameters:**

- `config` (`LazyLoadConfig`): 

**Returns:** `void`

### `loadPanel(panelId, config)`

**Parameters:**

- `panelId` (`string`): 
- `config` (`LazyLoadConfig`): 

**Returns:** `Promise<void>`

### `setupVisibilityObserver(config)`

**Parameters:**

- `config` (`LazyLoadConfig`): 

**Returns:** `void`

### `loadPanelContent(config)`

**Parameters:**

- `config` (`LazyLoadConfig`): 

**Returns:** `Promise<string>`

### `sendPanelContent(panelId, content, isPlaceholder)`

**Parameters:**

- `panelId` (`string`): 
- `content` (`string`): 
- `isPlaceholder` (`boolean`): 

**Returns:** `void`

### `getLoadingPlaceholder()`

**Returns:** `string`

### `getErrorContent(error)`

**Parameters:**

- `error` (`any`): 

**Returns:** `string`

### `clearCache(panelId?)`

**Parameters:**

- `panelId` (`string | undefined`): 

**Returns:** `void`

### `preloadPanels(configs)`

**Parameters:**

- `configs` (`LazyLoadConfig[]`): 

**Returns:** `Promise<void>`

### `delay(ms)`

**Parameters:**

- `ms` (`number`): 

**Returns:** `Promise<void>`

### `dispose()`

**Returns:** `void`

