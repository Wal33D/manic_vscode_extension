# AutoFixProvider

## Inheritance

- Implements: `vscode.CodeActionProvider`

## Methods

### `provideCodeActions(document, range, _context, _token)`

**Parameters:**

- `document` (`TextDocument`): 
- `range` (`Range | Selection`): 
- `_context` (`CodeActionContext`): 
- `_token` (`CancellationToken`): 

**Returns:** `Promise<CodeAction[]>`

### `getFixesForError(document, error)`

**Parameters:**

- `document` (`TextDocument`): 
- `error` (`ValidationError`): 

**Returns:** `CodeAction[]`

### `getContextualFixes(document, range)`

**Parameters:**

- `document` (`TextDocument`): 
- `range` (`Range`): 

**Returns:** `CodeAction[]`

### `createReplaceTileAction(document, error, replacementId, title)`

**Parameters:**

- `document` (`TextDocument`): 
- `error` (`ValidationError`): 
- `replacementId` (`number`): 
- `title` (`string`): 

**Returns:** `CodeAction`

### `createQuickReplaceTileAction(document, range, replacementId, title)`

**Parameters:**

- `document` (`TextDocument`): 
- `range` (`Range`): 
- `replacementId` (`number`): 
- `title` (`string`): 

**Returns:** `CodeAction`

### `createRemoveTileAction(document, error)`

**Parameters:**

- `document` (`TextDocument`): 
- `error` (`ValidationError`): 

**Returns:** `CodeAction`

### `createAddToolStoreAction(document)`

**Parameters:**

- `document` (`TextDocument`): 

**Returns:** `CodeAction`

### `createAddGroundTilesAction(document)`

**Parameters:**

- `document` (`TextDocument`): 

**Returns:** `CodeAction`

### `createAdjustObjectiveAction(document, error)`

**Parameters:**

- `document` (`TextDocument`): 
- `error` (`ValidationError`): 

**Returns:** `CodeAction`

### `createFixCoordinatesAction(document, error)`

**Parameters:**

- `document` (`TextDocument`): 
- `error` (`ValidationError`): 

**Returns:** `CodeAction`

### `createFixNegativeValueAction(document, error)`

**Parameters:**

- `document` (`TextDocument`): 
- `error` (`ValidationError`): 

**Returns:** `CodeAction`

### `createFixGridDimensionsAction(document, error)`

**Parameters:**

- `document` (`TextDocument`): 
- `error` (`ValidationError`): 

**Returns:** `CodeAction`

### `createAddSemicolonAction(document, line)`

**Parameters:**

- `document` (`TextDocument`): 
- `line` (`number`): 

**Returns:** `CodeAction`

### `getSectionStartLine(document, sectionName)`

**Parameters:**

- `document` (`TextDocument`): 
- `sectionName` (`string`): 

**Returns:** `number`

