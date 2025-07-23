# SearchIndex

## Properties

| Name | Type | Description |
|------|------|-------------|
| `documents` | `Map<string, SearchDocument>` |  |
| `index` | `Map<string, Set<string>>` |  |

## Methods

### `addDocument(doc)`

**Parameters:**

- `doc` (`SearchDocument`): 

**Returns:** `void`

### `search(query)`

**Parameters:**

- `query` (`string`): 

**Returns:** `Promise<SearchResult[]>`

### `tokenize(text)`

**Parameters:**

- `text` (`string`): 

**Returns:** `string[]`

### `generatePreview(content, tokens)`

**Parameters:**

- `content` (`string`): 
- `tokens` (`string[]`): 

**Returns:** `string`

### `loadIndex(data)`

**Parameters:**

- `data` (`any`): 

**Returns:** `void`

### `serialize()`

**Returns:** `any`

