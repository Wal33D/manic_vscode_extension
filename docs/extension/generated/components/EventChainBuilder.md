# EventChainBuilder

## Properties

| Name | Type | Description |
|------|------|-------------|
| `builder` | `ScriptBuilder` |  |
| `eventChain` | `EventChain` |  |

## Methods

### `condition(condition)`

**Parameters:**

- `condition` (`string`): 

**Returns:** `this`

### `cmd(command, params)`

**Parameters:**

- `command` (`string`): 
- `params` (`(string | number)[]`): 

**Returns:** `this`

### `msg(message)`

**Parameters:**

- `message` (`string`): 

**Returns:** `this`

### `objective(objective)`

**Parameters:**

- `objective` (`string`): 

**Returns:** `this`

### `wait(seconds)`

**Parameters:**

- `seconds` (`number`): 

**Returns:** `this`

### `call(eventName)`

**Parameters:**

- `eventName` (`string`): 

**Returns:** `this`

### `emerge(x, y, direction, creature, radius)`

**Parameters:**

- `x` (`number`): 
- `y` (`number`): 
- `direction` (`string`): 
- `creature` (`string`): 
- `radius` (`number`): 

**Returns:** `this`

### `crystals(amount)`

**Parameters:**

- `amount` (`number`): 

**Returns:** `this`

### `ore(amount)`

**Parameters:**

- `amount` (`number`): 

**Returns:** `this`

### `win()`

**Returns:** `this`

### `lose()`

**Returns:** `this`

### `if(condition, thenEvent, elseEvent?)`

**Parameters:**

- `condition` (`string`): 
- `thenEvent` (`string`): 
- `elseEvent` (`string | undefined`): 

**Returns:** `this`

### `build()`

**Returns:** `ScriptBuilder`

