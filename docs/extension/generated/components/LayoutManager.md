# LayoutManager

## Methods

### `saveLayout(name, panels)`

**Parameters:**

- `name` (`string`): 
- `panels` (`PanelState[]`): 

**Returns:** `Promise<void>`

### `loadLayout(name)`

**Parameters:**

- `name` (`string`): 

**Returns:** `Promise<WorkspaceLayout | undefined>`

### `deleteLayout(name)`

**Parameters:**

- `name` (`string`): 

**Returns:** `Promise<void>`

### `getSavedLayouts()`

**Returns:** `SavedLayout[]`

### `getLastUsedLayout()`

**Returns:** `Promise<WorkspaceLayout | undefined>`

### `exportLayouts()`

**Returns:** `Promise<string>`

### `importLayouts(json)`

**Parameters:**

- `json` (`string`): 

**Returns:** `Promise<void>`

### `applyLayout(layout)`

**Parameters:**

- `layout` (`WorkspaceLayout`): 

**Returns:** `Promise<void>`

### `getCurrentLayout()`

**Returns:** `WorkspaceLayout`

### `getDefaultLayouts()`

**Returns:** `SavedLayout[]`

