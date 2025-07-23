# CommandSearchProvider

## Properties

| Name | Type | Description |
|------|------|-------------|
| `searchHistory` | `string[]` |  |
| `commandPalette` | `CommandPaletteProvider` |  |

## Methods

### `searchCommands(query)`

**Parameters:**

- `query` (`string`): 

**Returns:** `CommandSearchResult[]`

### `searchByCategory(category)`

**Parameters:**

- `category` (`string`): 

**Returns:** `CommandSearchResult[]`

### `searchByTag(_tag)`

**Parameters:**

- `_tag` (`string`): 

**Returns:** `CommandSearchResult[]`

### `searchByKeyboardShortcut(_shortcut)`

**Parameters:**

- `_shortcut` (`string`): 

**Returns:** `CommandSearchResult[]`

### `fuzzySearch(_query)`

**Parameters:**

- `_query` (`string`): 

**Returns:** `CommandSearchResult[]`

### `isKeyboardShortcutQuery(query)`

**Parameters:**

- `query` (`string`): 

**Returns:** `boolean`

### `getSuggestions(partial)`

**Parameters:**

- `partial` (`string`): 

**Returns:** `SearchSuggestion[]`

### `addToHistory(search)`

**Parameters:**

- `search` (`string`): 

**Returns:** `void`

