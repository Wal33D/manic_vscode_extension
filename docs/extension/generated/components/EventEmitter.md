# EventEmitter

## Properties

| Name | Type | Description |
|------|------|-------------|
| `listeners` | `((e: T) => void)[]` |  |
| `event` | `(listener: (e: T) => void) => { dispose: () => void; }` |  |

## Methods

### `fire(event)`

**Parameters:**

- `event` (`T`): 

**Returns:** `void`

### `dispose()`

**Returns:** `void`

