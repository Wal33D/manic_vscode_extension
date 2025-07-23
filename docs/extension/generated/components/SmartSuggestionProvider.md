# SmartSuggestionProvider

## Inheritance

- Implements: `vscode.CodeActionProvider`

## Properties

| Name | Type | Description |
|------|------|-------------|
| `suggestionEngine` | `TileSuggestionEngine` |  |

## Methods

### `provideCodeActions(document, range, _context, _token)`

**Parameters:**

- `document` (`TextDocument`): 
- `range` (`Range | Selection`): 
- `_context` (`CodeActionContext`): 
- `_token` (`CancellationToken`): 

**Returns:** `CodeAction[]`

### `parseTilesGrid(content)`

**Parameters:**

- `content` (`string`): 

**Returns:** `number[][]`

### `getGridPosition(document, range, tilesStartLine)`

**Parameters:**

- `document` (`TextDocument`): 
- `range` (`Range`): 
- `tilesStartLine` (`number`): 

**Returns:** `{ row: number; col: number; } | null`

### `createSuggestionAction(document, range, suggestion, gridPosition)`

**Parameters:**

- `document` (`TextDocument`): 
- `range` (`Range`): 
- `suggestion` (`TileSuggestion`): 
- `gridPosition` (`{ row: number; col: number; }`): 

**Returns:** `CodeAction | null`

### `getTileInfo(tileId)`

**Parameters:**

- `tileId` (`number`): 

**Returns:** `TileDefinition | undefined`

