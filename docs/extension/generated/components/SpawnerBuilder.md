# SpawnerBuilder

## Properties

| Name | Type | Description |
|------|------|-------------|
| `builder` | `ScriptBuilder` |  |
| `name` | `string` |  |
| `config` | `{ creature?: string | undefined; minWave?: number | undefined; maxWave?: number | undefined; minTime?: number | undefined; maxTime?: number | undefined; emergePoints?: { x: number; y: number; direction: string; }[] | undefined; cooldown?: number | undefined; armCondition?: string | undefined; }` |  |

## Methods

### `creature(type)`

**Parameters:**

- `type` (`string`): 

**Returns:** `this`

### `waveSize(min, max)`

**Parameters:**

- `min` (`number`): 
- `max` (`number`): 

**Returns:** `this`

### `timing(minSeconds, maxSeconds)`

**Parameters:**

- `minSeconds` (`number`): 
- `maxSeconds` (`number`): 

**Returns:** `this`

### `emergeAt(x, y, direction)`

**Parameters:**

- `x` (`number`): 
- `y` (`number`): 
- `direction` (`string`): 

**Returns:** `this`

### `cooldown(seconds)`

**Parameters:**

- `seconds` (`number`): 

**Returns:** `this`

### `armWhen(condition)`

**Parameters:**

- `condition` (`string`): 

**Returns:** `this`

### `build()`

**Returns:** `ScriptBuilder`

