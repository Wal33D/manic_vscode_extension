# DatFileParser

## Properties

| Name | Type | Description |
|------|------|-------------|
| `lines` | `string[]` |  |
| `sections` | `Map<string, SectionInfo>` |  |

## Methods

### `parseSections()`

**Returns:** `void`

### `parse()`

**Returns:** `DatFile`

### `parseComments(section)`

**Parameters:**

- `section` (`SectionInfo`): 

**Returns:** `string[]`

### `parseInfo(section)`

**Parameters:**

- `section` (`SectionInfo`): 

**Returns:** `InfoSection`

### `parseGrid(section)`

**Parameters:**

- `section` (`SectionInfo`): 

**Returns:** `number[][]`

### `parseResources(section)`

**Parameters:**

- `section` (`SectionInfo`): 

**Returns:** `{ crystals?: number[][] | undefined; ore?: number[][] | undefined; }`

### `parseObjectives(section)`

**Parameters:**

- `section` (`SectionInfo`): 

**Returns:** `Objective[]`

### `parseEntities(section)`

**Parameters:**

- `section` (`SectionInfo`): 

**Returns:** `Entity[]`

### `parseScript(section)`

**Parameters:**

- `section` (`SectionInfo`): 

**Returns:** `ScriptSection`

### `parseCoordinates(str)`

**Parameters:**

- `str` (`string`): 

**Returns:** `Coordinates`

### `smartSplit(str, delimiter)`

**Parameters:**

- `str` (`string`): 
- `delimiter` (`string`): 

**Returns:** `string[]`

### `parsePropertyValue(value)`

**Parameters:**

- `value` (`string`): 

**Returns:** `EntityPropertyValue`

### `parseScriptValue(value, type)`

**Parameters:**

- `value` (`string`): 
- `type` (`string`): 

**Returns:** `ScriptVariableValue`

### `parseScriptParameters(params)`

**Parameters:**

- `params` (`string`): 

**Returns:** `string[]`

### `getSections()`

**Returns:** `Map<string, SectionInfo>`

### `getSectionAtPosition(line)`

**Parameters:**

- `line` (`number`): 

**Returns:** `SectionInfo | undefined`

### `getSection(name)`

**Parameters:**

- `name` (`string`): 

**Returns:** `SectionInfo | undefined`

### `getTileArray()`

**Returns:** `number[][] | null`

