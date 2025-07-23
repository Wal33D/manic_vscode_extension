# ScriptSnippetsProvider

## Inheritance

- Implements: `vscode.TreeDataProvider<ScriptItem>`

## Properties

| Name | Type | Description |
|------|------|-------------|
| `_onDidChangeTreeData` | `EventEmitter<void | ScriptItem | null | undefined>` |  |
| `onDidChangeTreeData` | `Event<void | ScriptItem | null | undefined>` |  |
| `patterns` | `Map<string, ScriptPattern[]>` |  |

## Methods

### `refresh()`

**Returns:** `void`

### `getTreeItem(element)`

**Parameters:**

- `element` (`ScriptItem`): 

**Returns:** `TreeItem`

### `getChildren(element?)`

**Parameters:**

- `element` (`ScriptItem | undefined`): 

**Returns:** `Thenable<ScriptItem[]>`

### `getCategoryLabel(category)`

**Parameters:**

- `category` (`string`): 

**Returns:** `string`

### `loadCustomSnippets()`

**Returns:** `void`

### `addCustomSnippet(snippet)`

**Parameters:**

- `snippet` (`ScriptPattern`): 

**Returns:** `Promise<void>`

