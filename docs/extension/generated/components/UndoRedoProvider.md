# UndoRedoProvider

## Properties

| Name | Type | Description |
|------|------|-------------|
| `editHistories` | `Map<string, EditHistory>` |  |
| `statusBarItem` | `StatusBarItem` |  |
| `previewPanel` | `WebviewPanel | undefined` |  |
| `context` | `ExtensionContext` |  |

## Methods

### `getOrCreateHistory(uri)`

**Parameters:**

- `uri` (`Uri`): 

**Returns:** `EditHistory`

### `recordEdit(uri, description, changes)`

**Parameters:**

- `uri` (`Uri`): 
- `description` (`string`): 
- `changes` (`EditChange[]`): 

**Returns:** `void`

### `undoWithPreview()`

**Returns:** `Promise<void>`

### `redoWithPreview()`

**Returns:** `Promise<void>`

### `showPreview(edit, action)`

**Parameters:**

- `edit` (`MapEdit`): 
- `action` (`"undo" | "redo"`): 

**Returns:** `Promise<boolean>`

### `updateStatusBar()`

**Returns:** `void`

### `showHistoryPanel()`

**Returns:** `Promise<void>`

### `generateHistoryHtml(edits, currentIndex)`

**Parameters:**

- `edits` (`MapEdit[]`): 
- `currentIndex` (`number`): 

**Returns:** `string`

### `clearHistory(uri?)`

**Parameters:**

- `uri` (`Uri | undefined`): 

**Returns:** `void`

