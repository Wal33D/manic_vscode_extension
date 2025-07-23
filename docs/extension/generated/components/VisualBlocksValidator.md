# VisualBlocksValidator

## Properties

| Name | Type | Description |
|------|------|-------------|
| `errors` | `ValidationError[]` |  |
| `warnings` | `ValidationError[]` |  |

## Methods

### `validate(blocksContent, startLine)`

**Parameters:**

- `blocksContent` (`string`): 
- `startLine` (`number`): 

**Returns:** `ValidationError[]`

### `validateBlockLocations(blocks)`

**Parameters:**

- `blocks` (`VisualBlock[]`): 

**Returns:** `void`

### `validateWireConnections(wires, blocks)`

**Parameters:**

- `wires` (`BlockWire[]`): 
- `blocks` (`VisualBlock[]`): 

**Returns:** `void`

### `hasCircularDependency(blockId, blockMap, wires, visited, path)`

**Parameters:**

- `blockId` (`number`): 
- `blockMap` (`Map<number, VisualBlock>`): 
- `wires` (`BlockWire[]`): 
- `visited` (`Set<number>`): 
- `path` (`Set<number>`): 

**Returns:** `boolean`

### `validateBlockParameters(blocks)`

**Parameters:**

- `blocks` (`VisualBlock[]`): 

**Returns:** `void`

### `validateEmergeBlock(block)`

**Parameters:**

- `block` (`VisualBlock`): 

**Returns:** `void`

### `validatePlaceBlock(block)`

**Parameters:**

- `block` (`VisualBlock`): 

**Returns:** `void`

### `validateTimerBlock(block)`

**Parameters:**

- `block` (`VisualBlock`): 

**Returns:** `void`

### `validateSpawnSetupBlock(block)`

**Parameters:**

- `block` (`VisualBlock`): 

**Returns:** `void`

### `isValidCreatureType(type)`

**Parameters:**

- `type` (`string`): 

**Returns:** `boolean`

### `addError(message, line, column, section)`

**Parameters:**

- `message` (`string`): 
- `line` (`number`): 
- `column` (`number`): 
- `section` (`string`): 

**Returns:** `void`

### `addWarning(message, line, column, section)`

**Parameters:**

- `message` (`string`): 
- `line` (`number`): 
- `column` (`number`): 
- `section` (`string`): 

**Returns:** `void`

