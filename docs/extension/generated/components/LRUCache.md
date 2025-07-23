# LRUCache

## Properties

| Name | Type | Description |
|------|------|-------------|
| `cache` | `Map<string, { value: T; timestamp: number; }>` |  |
| `accessOrder` | `string[]` |  |
| `ttl` | `number` |  |
| `maxSize` | `number` |  |
| `onEvict` | `((key: string, value: T) => void) | undefined` |  |

## Methods

### `get(key)`

**Parameters:**

- `key` (`string`): 

**Returns:** `T | undefined`

### `set(key, value)`

**Parameters:**

- `key` (`string`): 
- `value` (`T`): 

**Returns:** `void`

### `has(key)`

**Parameters:**

- `key` (`string`): 

**Returns:** `boolean`

### `delete(key)`

**Parameters:**

- `key` (`string`): 

**Returns:** `boolean`

### `clear()`

**Returns:** `void`

### `updateAccessOrder(key)`

**Parameters:**

- `key` (`string`): 

**Returns:** `void`

### `keys()`

**Returns:** `string[]`

### `getStats()`

**Returns:** `{ size: number; maxSize: number; ttl: number; }`

