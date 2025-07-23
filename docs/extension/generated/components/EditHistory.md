# EditHistory

## Properties

| Name | Type | Description |
|------|------|-------------|
| `history` | `MapEdit[]` |  |
| `currentIndex` | `number` |  |
| `maxHistorySize` | `number` |  |

## Methods

### `addEdit(edit)`

**Parameters:**

- `edit` (`MapEdit`): 

**Returns:** `void`

### `canUndo()`

**Returns:** `boolean`

### `canRedo()`

**Returns:** `boolean`

### `getCurrentEdit()`

**Returns:** `MapEdit | undefined`

### `getUndoEdit()`

**Returns:** `MapEdit | undefined`

### `getRedoEdit()`

**Returns:** `MapEdit | undefined`

### `undo()`

**Returns:** `MapEdit | undefined`

### `redo()`

**Returns:** `MapEdit | undefined`

### `clear()`

**Returns:** `void`

### `getHistory()`

**Returns:** `MapEdit[]`

### `getHistorySize()`

**Returns:** `number`

### `getCurrentIndex()`

**Returns:** `number`

