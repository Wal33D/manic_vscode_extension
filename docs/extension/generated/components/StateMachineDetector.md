# StateMachineDetector

## Methods

### `detectStateMachines(scriptContent)`

**Parameters:**

- `scriptContent` (`string`): 

**Returns:** `StateMachine[]`

### `findIntegerVariables(lines)`

**Parameters:**

- `lines` (`string[]`): 

**Returns:** `Map<string, { line: number; initial: number; }>`

### `findStateTransitions(lines, varName)`

**Parameters:**

- `lines` (`string[]`): 
- `varName` (`string`): 

**Returns:** `{ from: number; to: number; trigger: string; line: number; }[]`

### `inferStateName(state, varName, lines)`

**Parameters:**

- `state` (`number`): 
- `varName` (`string`): 
- `lines` (`string[]`): 

**Returns:** `string`

