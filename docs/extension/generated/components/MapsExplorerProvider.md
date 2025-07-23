# MapsExplorerProvider

## Inheritance

- Implements: `vscode.TreeDataProvider<MapItem>`

## Properties

| Name | Type | Description |
|------|------|-------------|
| `_onDidChangeTreeData` | `EventEmitter<void | MapItem | null | undefined>` |  |
| `onDidChangeTreeData` | `Event<void | MapItem | null | undefined>` |  |

## Methods

### `refresh()`

**Returns:** `void`

### `getTreeItem(element)`

**Parameters:**

- `element` (`MapItem`): 

**Returns:** `TreeItem`

### `getChildren(element?)`

**Parameters:**

- `element` (`MapItem | undefined`): 

**Returns:** `Thenable<MapItem[]>`

### `getRecentMaps()`

**Returns:** `Promise<MapItem[]>`

### `getTemplates()`

**Returns:** `Promise<MapItem[]>`

### `getSampleMaps()`

**Returns:** `Promise<MapItem[]>`

### `getWorkspaceMaps()`

**Returns:** `Promise<MapItem[]>`

### `addRecentMap(mapPath)`

**Parameters:**

- `mapPath` (`string`): 

**Returns:** `Promise<void>`

