# PanelManager

## Properties

| Name | Type | Description |
|------|------|-------------|
| `panels` | `Map<string, PanelState>` |  |
| `_onPanelChange` | `EventEmitter<PanelState>` |  |
| `onPanelChange` | `Event<PanelState>` |  |

## Methods

### `initializeDefaultPanels()`

**Returns:** `void`

### `loadPanelStates()`

**Returns:** `void`

### `savePanelStates()`

**Returns:** `void`

### `getPanelStates()`

**Returns:** `PanelState[]`

### `getPanel(id)`

**Parameters:**

- `id` (`string`): 

**Returns:** `PanelState | undefined`

### `togglePanel(id)`

**Parameters:**

- `id` (`string`): 

**Returns:** `void`

### `showPanel(id)`

**Parameters:**

- `id` (`string`): 

**Returns:** `void`

### `closePanel(id)`

**Parameters:**

- `id` (`string`): 

**Returns:** `void`

### `dockPanel(id, position)`

**Parameters:**

- `id` (`string`): 
- `position` (`"left" | "right" | "top" | "bottom" | "center" | "float"`): 

**Returns:** `void`

### `resizePanel(id, size)`

**Parameters:**

- `id` (`string`): 
- `size` (`Partial<{ width: string | number; height: string | number; }>`): 

**Returns:** `void`

### `movePanel(id, position)`

**Parameters:**

- `id` (`string`): 
- `position` (`{ x?: number | undefined; y?: number | undefined; }`): 

**Returns:** `void`

### `collapsePanel(id, collapsed)`

**Parameters:**

- `id` (`string`): 
- `collapsed` (`boolean`): 

**Returns:** `void`

### `maximizePanel(id, maximized)`

**Parameters:**

- `id` (`string`): 
- `maximized` (`boolean`): 

**Returns:** `void`

### `focusPanel(id)`

**Parameters:**

- `id` (`string`): 

**Returns:** `void`

### `applyLayout(layout)`

**Parameters:**

- `layout` (`WorkspaceLayout`): 

**Returns:** `void`

### `getVisiblePanels()`

**Returns:** `PanelState[]`

### `getPanelsByPosition(position)`

**Parameters:**

- `position` (`"left" | "right" | "top" | "bottom" | "center" | "float"`): 

**Returns:** `PanelState[]`

### `setActiveTab(panelId)`

**Parameters:**

- `panelId` (`string`): 

**Returns:** `void`

### `getTabGroups()`

**Returns:** `Map<string, PanelState[]>`

### `createTabGroup(panelIds, groupName)`

**Parameters:**

- `panelIds` (`string[]`): 
- `groupName` (`string`): 

**Returns:** `void`

### `dispose()`

**Returns:** `void`

