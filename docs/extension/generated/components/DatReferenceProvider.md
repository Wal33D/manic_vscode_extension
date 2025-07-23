# DatReferenceProvider

## Inheritance

- Implements: `vscode.ReferenceProvider`

## Methods

### `provideReferences(document, position, context, _token)`

**Parameters:**

- `document` (`TextDocument`): 
- `position` (`Position`): 
- `context` (`ReferenceContext`): 
- `_token` (`CancellationToken`): 

**Returns:** `ProviderResult<Location[]>`

### `isEntityId(lineText)`

**Parameters:**

- `lineText` (`string`): 

**Returns:** `boolean`

### `isEventName(lineText)`

**Parameters:**

- `lineText` (`string`): 

**Returns:** `boolean`

### `isVariableName(lineText)`

**Parameters:**

- `lineText` (`string`): 

**Returns:** `boolean`

### `isSectionName(word)`

**Parameters:**

- `word` (`string`): 

**Returns:** `boolean`

### `findDefinition(document, _word, lineText, currentSection, _parser)`

**Parameters:**

- `document` (`TextDocument`): 
- `_word` (`string`): 
- `lineText` (`string`): 
- `currentSection` (`SectionInfo | undefined`): 
- `_parser` (`DatFileParser`): 

**Returns:** `Location | undefined`

### `findEntityReferences(document, entityId, parser)`

**Parameters:**

- `document` (`TextDocument`): 
- `entityId` (`string`): 
- `parser` (`DatFileParser`): 

**Returns:** `Location[]`

### `findEventReferences(document, eventName, parser)`

**Parameters:**

- `document` (`TextDocument`): 
- `eventName` (`string`): 
- `parser` (`DatFileParser`): 

**Returns:** `Location[]`

### `findVariableReferences(document, varName, parser)`

**Parameters:**

- `document` (`TextDocument`): 
- `varName` (`string`): 
- `parser` (`DatFileParser`): 

**Returns:** `Location[]`

### `findSectionReferences(document, sectionName)`

**Parameters:**

- `document` (`TextDocument`): 
- `sectionName` (`string`): 

**Returns:** `Location[]`

