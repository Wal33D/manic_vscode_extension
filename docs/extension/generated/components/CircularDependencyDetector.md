# CircularDependencyDetector

## Properties

| Name | Type | Description |
|------|------|-------------|
| `eventGraph` | `Map<string, Set<string>>` |  |
| `circularDeps` | `CircularDependency[]` |  |

## Methods

### `detectCircularDependencies(scriptContent)`

**Parameters:**

- `scriptContent` (`string`): 

**Returns:** `CircularDependency[]`

### `buildEventGraph(scriptContent)`

**Parameters:**

- `scriptContent` (`string`): 

**Returns:** `void`

### `dfs(event, visited, path)`

**Parameters:**

- `event` (`string`): 
- `visited` (`Set<string>`): 
- `path` (`string[]`): 

**Returns:** `void`

