# MapEditorContextMenu

## Methods

### `getContextMenuActions(document, position)`

**Parameters:**

- `document` (`TextDocument`): 
- `position` (`Position`): 

**Returns:** `Promise<ContextMenuAction[]>`

### `showContextMenu(document, position)`

**Parameters:**

- `document` (`TextDocument`): 
- `position` (`Position`): 

**Returns:** `Promise<void>`

### `getCurrentSection(document, position)`

**Parameters:**

- `document` (`TextDocument`): 
- `position` (`Position`): 

**Returns:** `string`

### `getTileActions(document, position, section)`

**Parameters:**

- `document` (`TextDocument`): 
- `position` (`Position`): 
- `section` (`string`): 

**Returns:** `ContextMenuAction[]`

### `getResourceActions(_document, position)`

**Parameters:**

- `_document` (`TextDocument`): 
- `position` (`Position`): 

**Returns:** `ContextMenuAction[]`

### `getBuildingActions(_document, position)`

**Parameters:**

- `_document` (`TextDocument`): 
- `position` (`Position`): 

**Returns:** `ContextMenuAction[]`

### `getObjectiveActions(_document, position)`

**Parameters:**

- `_document` (`TextDocument`): 
- `position` (`Position`): 

**Returns:** `ContextMenuAction[]`

### `getScriptActions(_document, _position)`

**Parameters:**

- `_document` (`TextDocument`): 
- `_position` (`Position`): 

**Returns:** `ContextMenuAction[]`

