# TextDocument

## Properties

| Name | Type | Description |
|------|------|-------------|
| `uri` | `Uri` |  |

## Methods

### `getText(range?)`

**Parameters:**

- `range` (`Range | undefined`): 

**Returns:** `string`

### `lineAt(line)`

**Parameters:**

- `line` (`number | Position`): 

**Returns:** `{ text: string; lineNumber: number; substr: (start: number, length?: number | undefined) => string; }`

### `getWordRangeAtPosition(position, regex?)`

**Parameters:**

- `position` (`Position`): 
- `regex` (`RegExp | undefined`): 

**Returns:** `Range | undefined`

