# DatDefinitionProvider

## Inheritance

- Implements: `vscode.DefinitionProvider`

## Methods

### `provideDefinition(document, position, _token)`

**Parameters:**

- `document` (`TextDocument`): 
- `position` (`Position`): 
- `_token` (`CancellationToken`): 

**Returns:** `ProviderResult<Definition>`

### `isSectionReference(word)`

**Parameters:**

- `word` (`string`): 

**Returns:** `boolean`

### `findEntityDefinition(document, entityId, parser)`

**Parameters:**

- `document` (`TextDocument`): 
- `entityId` (`string`): 
- `parser` (`DatFileParser`): 

**Returns:** `Location | undefined`

### `findEventDefinition(document, eventName, parser)`

**Parameters:**

- `document` (`TextDocument`): 
- `eventName` (`string`): 
- `parser` (`DatFileParser`): 

**Returns:** `Location | undefined`

### `findVariableDefinition(document, varName, parser)`

**Parameters:**

- `document` (`TextDocument`): 
- `varName` (`string`): 
- `parser` (`DatFileParser`): 

**Returns:** `Location | undefined`

### `extractEventName(lineText)`

**Parameters:**

- `lineText` (`string`): 

**Returns:** `string | undefined`

### `findEventInBlocks(document, eventName, parser)`

**Parameters:**

- `document` (`TextDocument`): 
- `eventName` (`string`): 
- `parser` (`DatFileParser`): 

**Returns:** `Location | undefined`

### `findBlockDefinition(document, blockId, parser)`

**Parameters:**

- `document` (`TextDocument`): 
- `blockId` (`number`): 
- `parser` (`DatFileParser`): 

**Returns:** `Location | undefined`

