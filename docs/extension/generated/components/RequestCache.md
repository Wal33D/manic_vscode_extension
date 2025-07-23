# RequestCache

## Properties

| Name | Type | Description |
|------|------|-------------|
| `pending` | `Map<string, Promise<T>>` |  |
| `cache` | `LRUCache<T>` |  |

## Methods

### `get(key, fetcher)`

**Parameters:**

- `key` (`string`): 
- `fetcher` (`() => Promise<T>`): 

**Returns:** `Promise<T>`

### `invalidate(key)`

**Parameters:**

- `key` (`string`): 

**Returns:** `void`

### `clear()`

**Returns:** `void`

