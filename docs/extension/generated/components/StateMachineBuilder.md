# StateMachineBuilder

## Properties

| Name | Type | Description |
|------|------|-------------|
| `builder` | `ScriptBuilder` |  |
| `stateVar` | `string` |  |
| `states` | `Record<string, number>` |  |

## Methods

### `transition(fromState, toState, condition?)`

**Parameters:**

- `fromState` (`string`): 
- `toState` (`string`): 
- `condition` (`string | undefined`): 

**Returns:** `EventChainBuilder`

### `inState(state)`

**Parameters:**

- `state` (`string`): 

**Returns:** `string`

