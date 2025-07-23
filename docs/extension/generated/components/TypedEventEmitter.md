# TypedEventEmitter

## Methods

### `on(event, handler, options?)`

**Parameters:**

- `event` (`K`): 
- `handler` (`(data: T[K]) => void`): 
- `options` (`SubscriptionOptions | undefined`): 

**Returns:** `Unsubscribe`

### `once(event, handler)`

**Parameters:**

- `event` (`K`): 
- `handler` (`(data: T[K]) => void`): 

**Returns:** `Unsubscribe`

### `emit(event, data, options?)`

**Parameters:**

- `event` (`K`): 
- `data` (`T[K]`): 
- `options` (`EmitOptions | undefined`): 

**Returns:** `void`

### `off(event?)`

**Parameters:**

- `event` (`keyof T | undefined`): 

**Returns:** `void`

