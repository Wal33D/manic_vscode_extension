# EnhancedScriptValidator

## Properties

| Name | Type | Description |
|------|------|-------------|
| `errors` | `ValidationError[]` |  |
| `warnings` | `ValidationError[]` |  |
| `definedVariables` | `Map<string, string>` |  |
| `definedTimers` | `Set<string>` |  |
| `definedArrows` | `Set<string>` |  |
| `eventNames` | `Set<string>` |  |

## Methods

### `validate(script)`

**Parameters:**

- `script` (`ScriptSection`): 

**Returns:** `ValidationError[]`

### `collectVariables(script)`

**Parameters:**

- `script` (`ScriptSection`): 

**Returns:** `void`

### `validateTimerSyntax(name, value)`

**Parameters:**

- `name` (`string`): 
- `value` (`unknown`): 

**Returns:** `void`

### `validateEvents(script)`

**Parameters:**

- `script` (`ScriptSection`): 

**Returns:** `void`

### `validateCondition(condition, eventName)`

**Parameters:**

- `condition` (`string`): 
- `eventName` (`string`): 

**Returns:** `void`

### `validateCommand(command, eventName)`

**Parameters:**

- `command` (`{ command: string; parameters: string[]; }`): 
- `eventName` (`string`): 

**Returns:** `void`

### `validateCommandParameters(cmdName, params, _eventName)`

**Parameters:**

- `cmdName` (`string`): 
- `params` (`string[]`): 
- `_eventName` (`string`): 

**Returns:** `void`

### `validateMathExpression(expr, eventName)`

**Parameters:**

- `expr` (`string`): 
- `eventName` (`string`): 

**Returns:** `void`

### `detectAdvancedPatterns(script)`

**Parameters:**

- `script` (`ScriptSection`): 

**Returns:** `void`

### `reconstructScriptContent(script)`

**Parameters:**

- `script` (`ScriptSection`): 

**Returns:** `string`

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

