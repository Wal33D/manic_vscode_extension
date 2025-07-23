# MapVersionControl

## Properties

| Name | Type | Description |
|------|------|-------------|
| `versions` | `Map<string, MapVersion>` |  |
| `currentVersion` | `string | undefined` |  |

## Methods

### `createVersion(document, message)`

**Parameters:**

- `document` (`TextDocument`): 
- `message` (`string`): 

**Returns:** `Promise<string>`

### `getDiff(fromHash, toHash)`

**Parameters:**

- `fromHash` (`string`): 
- `toHash` (`string`): 

**Returns:** `MapDiff | null`

### `getVersions()`

**Returns:** `MapVersion[]`

### `getVersion(hash)`

**Parameters:**

- `hash` (`string`): 

**Returns:** `MapVersion | undefined`

### `restoreVersion(document, hash)`

**Parameters:**

- `document` (`TextDocument`): 
- `hash` (`string`): 

**Returns:** `Promise<boolean>`

### `getCurrentVersion()`

**Returns:** `string | undefined`

### `parseTiles(content)`

**Parameters:**

- `content` (`string`): 

**Returns:** `number[][]`

### `tilesToString(tiles)`

**Parameters:**

- `tiles` (`number[][]`): 

**Returns:** `string`

### `generateHash(tiles)`

**Parameters:**

- `tiles` (`number[][]`): 

**Returns:** `string`

### `getGitAuthor()`

**Returns:** `Promise<string | undefined>`

### `loadVersionHistory()`

**Returns:** `Promise<void>`

### `saveVersionHistory()`

**Returns:** `Promise<void>`

