# VisualBlocksParser

## Properties

| Name | Type | Description |
|------|------|-------------|
| `blocks` | `VisualBlock[]` |  |
| `wires` | `BlockWire[]` |  |
| `errors` | `string[]` |  |

## Methods

### `parse()`

**Returns:** `BlocksSection`

### `parseBlock(match, lineIndex)`

**Parameters:**

- `match` (`RegExpMatchArray`): 
- `lineIndex` (`number`): 

**Returns:** `void`

### `parseWire(match, lineIndex)`

**Parameters:**

- `match` (`RegExpMatchArray`): 
- `lineIndex` (`number`): 

**Returns:** `void`

### `getErrors()`

**Returns:** `string[]`

### `validate()`

**Returns:** `string[]`

