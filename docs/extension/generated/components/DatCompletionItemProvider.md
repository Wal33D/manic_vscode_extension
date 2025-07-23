# DatCompletionItemProvider

## Inheritance

- Implements: `vscode.CompletionItemProvider`

## Methods

### `provideCompletionItems(document, position)`

**Parameters:**

- `document` (`TextDocument`): 
- `position` (`Position`): 

**Returns:** `CompletionItem[]`

### `getInfoCompletions(linePrefix)`

**Parameters:**

- `linePrefix` (`string`): 

**Returns:** `CompletionItem[]`

### `getNumericCompletions(linePrefix)`

**Parameters:**

- `linePrefix` (`string`): 

**Returns:** `CompletionItem[]`

### `getDrillTimeForTile(tileId)`

**Parameters:**

- `tileId` (`number`): 

**Returns:** `string`

### `getResourcesCompletions(linePrefix)`

**Parameters:**

- `linePrefix` (`string`): 

**Returns:** `CompletionItem[]`

### `getObjectivesCompletions(linePrefix)`

**Parameters:**

- `linePrefix` (`string`): 

**Returns:** `CompletionItem[]`

### `getBuildingCompletions(linePrefix)`

**Parameters:**

- `linePrefix` (`string`): 

**Returns:** `CompletionItem[]`

### `getExistingBuildingsFromDocument()`

**Returns:** `string[]`

### `getVehicleCompletions(linePrefix)`

**Parameters:**

- `linePrefix` (`string`): 

**Returns:** `CompletionItem[]`

### `getCreatureCompletions(linePrefix)`

**Parameters:**

- `linePrefix` (`string`): 

**Returns:** `CompletionItem[]`

### `getScriptCompletions(linePrefix, _document, _position)`

**Parameters:**

- `linePrefix` (`string`): 
- `_document` (`TextDocument`): 
- `_position` (`Position`): 

**Returns:** `CompletionItem[]`

### `getLandslideCompletions(linePrefix)`

**Parameters:**

- `linePrefix` (`string`): 

**Returns:** `CompletionItem[]`

### `getLavaSpreadCompletions(linePrefix)`

**Parameters:**

- `linePrefix` (`string`): 

**Returns:** `CompletionItem[]`

