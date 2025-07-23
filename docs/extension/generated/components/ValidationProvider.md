# ValidationProvider

## Inheritance

- Implements: `vscode.TreeDataProvider<ValidationItem>`

## Properties

| Name | Type | Description |
|------|------|-------------|
| `_onDidChangeTreeData` | `EventEmitter<void | ValidationItem | null | undefined>` |  |
| `onDidChangeTreeData` | `Event<void | ValidationItem | null | undefined>` |  |
| `issues` | `ValidationIssue[]` |  |
| `lastValidation` | `Date | undefined` |  |

## Methods

### `refresh()`

**Returns:** `void`

### `updateValidation(issues)`

**Parameters:**

- `issues` (`ValidationIssue[]`): 

**Returns:** `void`

### `getTreeItem(element)`

**Parameters:**

- `element` (`ValidationItem`): 

**Returns:** `TreeItem`

### `getChildren(element?)`

**Parameters:**

- `element` (`ValidationItem | undefined`): 

**Returns:** `Thenable<ValidationItem[]>`

### `clearValidation()`

**Returns:** `void`

