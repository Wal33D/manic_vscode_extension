# KeyboardShortcutsPanel

## Properties

| Name | Type | Description |
|------|------|-------------|
| `_panel` | `WebviewPanel` |  |
| `_extensionUri` | `Uri` |  |
| `_disposables` | `Disposable[]` |  |
| `shortcutManager` | `KeyboardShortcutManager` |  |

## Methods

### `dispose()`

**Returns:** `void`

### `_update()`

**Returns:** `void`

### `_getHtmlForWebview(webview)`

**Parameters:**

- `webview` (`Webview`): 

**Returns:** `string`

### `renderShortcut(shortcut)`

**Parameters:**

- `shortcut` (`KeyboardShortcut`): 

**Returns:** `string`

### `formatKey(key)`

**Parameters:**

- `key` (`string`): 

**Returns:** `string`

### `getCategoryIcon(category)`

**Parameters:**

- `category` (`string`): 

**Returns:** `string`

