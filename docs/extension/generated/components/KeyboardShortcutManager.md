# KeyboardShortcutManager

## Properties

| Name | Type | Description |
|------|------|-------------|
| `shortcuts` | `Map<string, KeyboardShortcut>` |  |
| `customShortcuts` | `Map<string, string>` |  |
| `context` | `ExtensionContext` |  |

## Methods

### `initializeDefaultShortcuts()`

**Returns:** `void`

### `getShortcutsByCategory()`

**Returns:** `Map<string, KeyboardShortcut[]>`

### `getShortcut(command)`

**Parameters:**

- `command` (`string`): 

**Returns:** `KeyboardShortcut | undefined`

### `updateShortcut(command, newKey)`

**Parameters:**

- `command` (`string`): 
- `newKey` (`string`): 

**Returns:** `Promise<void>`

### `resetShortcut(command)`

**Parameters:**

- `command` (`string`): 

**Returns:** `Promise<void>`

### `resetAllShortcuts()`

**Returns:** `Promise<void>`

### `isKeyInUse(key)`

**Parameters:**

- `key` (`string`): 

**Returns:** `boolean`

### `getCommandByKey(key)`

**Parameters:**

- `key` (`string`): 

**Returns:** `string | undefined`

### `exportShortcuts()`

**Returns:** `Promise<void>`

### `importShortcuts()`

**Returns:** `Promise<void>`

### `normalizeKey(key)`

**Parameters:**

- `key` (`string`): 

**Returns:** `string`

### `loadCustomShortcuts()`

**Returns:** `void`

### `saveCustomShortcuts()`

**Returns:** `Promise<void>`

