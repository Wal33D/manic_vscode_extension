# ScriptBuilder

## Properties

| Name | Type | Description |
|------|------|-------------|
| `variables` | `Map<string, Variable>` |  |
| `events` | `Map<string, EventChain>` |  |
| `usedNames` | `Set<string>` |  |
| `prefix` | `string` |  |
| `eventCounter` | `number` |  |

## Methods

### `uniqueVarName(base)`

**Parameters:**

- `base` (`string`): 

**Returns:** `string`

### `uniqueEventName(base)`

**Parameters:**

- `base` (`string`): 

**Returns:** `string`

### `declareVar(type, name, value)`

**Parameters:**

- `type` (`VariableType`): 
- `name` (`string`): 
- `value` (`string | number | boolean`): 

**Returns:** `string`

### `int(name, value)`

**Parameters:**

- `name` (`string`): 
- `value` (`number`): 

**Returns:** `string`

### `bool(name, value)`

**Parameters:**

- `name` (`string`): 
- `value` (`boolean`): 

**Returns:** `string`

### `timer(name, duration, event?)`

**Parameters:**

- `name` (`string`): 
- `duration` (`number`): 
- `event` (`string | undefined`): 

**Returns:** `string`

### `event(name?)`

**Parameters:**

- `name` (`string | undefined`): 

**Returns:** `EventChainBuilder`

### `addEvent(event)`

**Parameters:**

- `event` (`EventChain`): 

**Returns:** `void`

### `when(condition, eventName?)`

**Parameters:**

- `condition` (`string`): 
- `eventName` (`string | undefined`): 

**Returns:** `EventChainBuilder`

### `once(condition, eventName?)`

**Parameters:**

- `condition` (`string`): 
- `eventName` (`string | undefined`): 

**Returns:** `EventChainBuilder`

### `stateMachine(name, states)`

**Parameters:**

- `name` (`string`): 
- `states` (`Record<string, number>`): 

**Returns:** `StateMachineBuilder`

### `spawner(name)`

**Parameters:**

- `name` (`string`): 

**Returns:** `SpawnerBuilder`

### `optimizeCommands(commands)`

**Parameters:**

- `commands` (`Command[]`): 

**Returns:** `Command[]`

### `serializeSequence(commands)`

**Parameters:**

- `commands` (`Command[]`): 

**Returns:** `string`

### `build()`

**Returns:** `string`

