# MockFileSystem

## Properties

| Name | Type | Description |
|------|------|-------------|
| `files` | `Map<string, Buffer>` |  |

## Methods

### `writeFile(uri, content)`

**Parameters:**

- `uri` (`Uri`): 
- `content` (`Uint8Array`): 

**Returns:** `Promise<void>`

### `readFile(uri)`

**Parameters:**

- `uri` (`Uri`): 

**Returns:** `Promise<Uint8Array>`

### `stat(uri)`

**Parameters:**

- `uri` (`Uri`): 

**Returns:** `Promise<FileStat>`

### `readDirectory(uri)`

**Parameters:**

- `uri` (`Uri`): 

**Returns:** `Promise<[string, FileType][]>`

### `createDirectory(uri)`

**Parameters:**

- `uri` (`Uri`): 

**Returns:** `Promise<void>`

### `delete(uri, options?)`

**Parameters:**

- `uri` (`Uri`): 
- `options` (`{ recursive?: boolean | undefined; } | undefined`): 

**Returns:** `Promise<void>`

### `rename(oldUri, newUri, _options?)`

**Parameters:**

- `oldUri` (`Uri`): 
- `newUri` (`Uri`): 
- `_options` (`{ overwrite?: boolean | undefined; } | undefined`): 

**Returns:** `Promise<void>`

### `copy(source, destination)`

**Parameters:**

- `source` (`Uri`): 
- `destination` (`Uri`): 

**Returns:** `Promise<void>`

### `addFile(path, content)`

**Parameters:**

- `path` (`string`): 
- `content` (`string`): 

**Returns:** `void`

### `getFile(path)`

**Parameters:**

- `path` (`string`): 

**Returns:** `string | undefined`

### `clear()`

**Returns:** `void`

