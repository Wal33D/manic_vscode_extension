# TilePaletteProvider

## Inheritance

- Implements: `vscode.TreeDataProvider<TileTreeItem>`

## Properties

| Name | Type | Description |
|------|------|-------------|
| `_onDidChangeTreeData` | `EventEmitter<void | TileTreeItem | null | undefined>` |  |
| `onDidChangeTreeData` | `Event<void | TileTreeItem | null | undefined>` |  |
| `selectedTileId` | `number` |  |

## Methods

### `refresh()`

**Returns:** `void`

### `getTreeItem(element)`

**Parameters:**

- `element` (`TileTreeItem`): 

**Returns:** `TreeItem`

### `getChildren(element?)`

**Parameters:**

- `element` (`TileTreeItem | undefined`): 

**Returns:** `Thenable<TileTreeItem[]>`

### `setSelectedTile(tileId)`

**Parameters:**

- `tileId` (`number`): 

**Returns:** `void`

### `getSelectedTileId()`

**Returns:** `number`

