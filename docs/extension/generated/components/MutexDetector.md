# MutexDetector

## Properties

| Name | Type | Description |
|------|------|-------------|
| `mutexPatterns` | `MutexPattern[]` |  |

## Methods

### `detectPatterns(scriptContent)`

**Parameters:**

- `scriptContent` (`string`): 

**Returns:** `MutexPattern[]`

### `detectGlobalCooldowns(lines)`

**Parameters:**

- `lines` (`string[]`): 

**Returns:** `void`

### `detectOneTimeEvents(lines)`

**Parameters:**

- `lines` (`string[]`): 

**Returns:** `void`

### `detectExclusiveStates(lines)`

**Parameters:**

- `lines` (`string[]`): 

**Returns:** `void`

### `findRelatedEvents(lines, variableName)`

**Parameters:**

- `lines` (`string[]`): 
- `variableName` (`string`): 

**Returns:** `string[]`

