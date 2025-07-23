# ScopedEventBus

## Methods

### `on(event, handler, options?)`

**Parameters:**

- `event` (`string`): 
- `handler` (`EventHandler<T>`): 
- `options` (`SubscriptionOptions | undefined`): 

**Returns:** `Unsubscribe`

### `once(event, handler)`

**Parameters:**

- `event` (`string`): 
- `handler` (`(data: T) => void`): 

**Returns:** `Unsubscribe`

### `emit(event, data?, options?)`

**Parameters:**

- `event` (`string`): 
- `data` (`T | undefined`): 
- `options` (`EmitOptions | undefined`): 

**Returns:** `void`

### `off(event?)`

**Parameters:**

- `event` (`string | undefined`): 

**Returns:** `void`

