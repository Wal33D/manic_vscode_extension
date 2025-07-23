# CommandPaletteProvider

## Properties

| Name | Type | Description |
|------|------|-------------|
| `commands` | `Map<string, CommandDefinition>` |  |
| `categories` | `Map<string, CommandCategory>` |  |
| `recentCommands` | `string[]` |  |
| `favoriteCommands` | `Set<string>` |  |
| `context` | `ExtensionContext` |  |

## Methods

### `initializeCategories()`

**Returns:** `void`

### `registerCommand(definition)`

**Parameters:**

- `definition` (`CommandDefinition`): 

**Returns:** `void`

### `showCommandPalette()`

**Returns:** `Promise<void>`

### `getQuickPickItems()`

**Returns:** `Promise<QuickPickItem[]>`

### `createCommandItem(cmd)`

**Parameters:**

- `cmd` (`CommandDefinition`): 

**Returns:** `CommandQuickPickItem`

### `getRecentItems()`

**Returns:** `CommandQuickPickItem[]`

### `getFavoriteItems()`

**Returns:** `CommandQuickPickItem[]`

### `getCommandsForCategory(categoryId)`

**Parameters:**

- `categoryId` (`string`): 

**Returns:** `CommandDefinition[]`

### `showCategoryCommands(categoryId)`

**Parameters:**

- `categoryId` (`string`): 

**Returns:** `Promise<void>`

### `executeCommand(command)`

**Parameters:**

- `command` (`string`): 

**Returns:** `Promise<void>`

### `addToRecent(command)`

**Parameters:**

- `command` (`string`): 

**Returns:** `void`

### `toggleFavorite(command)`

**Parameters:**

- `command` (`string`): 

**Returns:** `void`

### `loadRecentCommands()`

**Returns:** `void`

### `saveRecentCommands()`

**Returns:** `void`

### `loadFavoriteCommands()`

**Returns:** `void`

### `saveFavoriteCommands()`

**Returns:** `void`

### `initializeDefaultCommands()`

**Returns:** `void`

