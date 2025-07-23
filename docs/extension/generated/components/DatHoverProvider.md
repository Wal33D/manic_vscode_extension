# DatHoverProvider

## Inheritance

- Implements: `vscode.HoverProvider`

## Properties

| Name | Type | Description |
|------|------|-------------|
| `extensionPath` | `string` |  |

## Methods

### `getTileImagePath(tileId)`

**Parameters:**

- `tileId` (`number`): 

**Returns:** `Uri | undefined`

### `provideHover(document, position, _token)`

**Parameters:**

- `document` (`TextDocument`): 
- `position` (`Position`): 
- `_token` (`CancellationToken`): 

**Returns:** `ProviderResult<Hover>`

### `getInfoHover(word, lineText, position)`

**Parameters:**

- `word` (`string`): 
- `lineText` (`string`): 
- `position` (`Position`): 

**Returns:** `Hover | undefined`

### `getTileHover(_word, position, document)`

**Parameters:**

- `_word` (`string`): 
- `position` (`Position`): 
- `document` (`TextDocument`): 

**Returns:** `Hover | undefined`

### `getObjectiveHover(lineText)`

**Parameters:**

- `lineText` (`string`): 

**Returns:** `Hover | undefined`

### `getEntityHover(word, sectionName)`

**Parameters:**

- `word` (`string`): 
- `sectionName` (`string`): 

**Returns:** `Hover | undefined`

### `getScriptHover(word, lineText)`

**Parameters:**

- `word` (`string`): 
- `lineText` (`string`): 

**Returns:** `Hover | undefined`

### `getResourceHover(word)`

**Parameters:**

- `word` (`string`): 

**Returns:** `Hover | undefined`

### `getTimedEventHover(lineText, sectionName)`

**Parameters:**

- `lineText` (`string`): 
- `sectionName` (`string`): 

**Returns:** `Hover | undefined`

