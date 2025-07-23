# EventBus

## Properties

| Name | Type | Description |
|------|------|-------------|
| `events` | `Map<string, Set<EventHandler<any>>>` |  |
| `eventHistory` | `EventHistoryEntry[]` |  |
| `maxHistorySize` | `number` |  |
| `wildcardHandlers` | `Set<WildcardHandler>` |  |
| `middlewares` | `Middleware[]` |  |
| `eventQueue` | `QueuedEvent[]` |  |
| `isProcessingQueue` | `boolean` |  |
| `debugMode` | `boolean` |  |
| `eventMetrics` | `Map<string, EventMetrics>` |  |

## Methods

### `on(event, handler, options?)`

**Parameters:**

- `event` (`string`): 
- `handler` (`EventHandler<T>`): 
- `options` (`SubscriptionOptions | undefined`): 

**Returns:** `Unsubscribe`

### `once(event, handler, context?)`

**Parameters:**

- `event` (`string`): 
- `handler` (`((data: T) => void) | EventHandler<T>`): 
- `context` (`any`): 

**Returns:** `Unsubscribe`

### `emit(event, data?, options?)`

**Parameters:**

- `event` (`string`): 
- `data` (`T | undefined`): 
- `options` (`EmitOptions | undefined`): 

**Returns:** `void`

### `emitNow(event, data?, options?)`

**Parameters:**

- `event` (`string`): 
- `data` (`T | undefined`): 
- `options` (`EmitOptions | undefined`): 

**Returns:** `void`

### `onPattern(pattern, handler, options?)`

**Parameters:**

- `pattern` (`string | RegExp`): 
- `handler` (`EventHandler<any>`): 
- `options` (`SubscriptionOptions | undefined`): 

**Returns:** `Unsubscribe`

### `off(event?)`

**Parameters:**

- `event` (`string | undefined`): 

**Returns:** `void`

### `use(middleware)`

**Parameters:**

- `middleware` (`Middleware`): 

**Returns:** `void`

### `waitFor(event, timeout?, filter?)`

**Parameters:**

- `event` (`string`): 
- `timeout` (`number | undefined`): 
- `filter` (`((data: T) => boolean) | undefined`): 

**Returns:** `Promise<T>`

### `createTypedEmitter()`

**Returns:** `TypedEventEmitter<T>`

### `getHistory(event?, limit?)`

**Parameters:**

- `event` (`string | undefined`): 
- `limit` (`number | undefined`): 

**Returns:** `EventHistoryEntry[]`

### `getMetrics(event?)`

**Parameters:**

- `event` (`string | undefined`): 

**Returns:** `Record<string, EventMetrics>`

### `clearMetrics(event?)`

**Parameters:**

- `event` (`string | undefined`): 

**Returns:** `void`

### `setDebugMode(enabled)`

**Parameters:**

- `enabled` (`boolean`): 

**Returns:** `void`

### `enqueueEvent(event, data?, options?)`

**Parameters:**

- `event` (`string`): 
- `data` (`T | undefined`): 
- `options` (`EmitOptions | undefined`): 

**Returns:** `void`

### `processQueue()`

**Returns:** `Promise<void>`

### `sortHandlersByPriority(event)`

**Parameters:**

- `event` (`string`): 

**Returns:** `void`

### `matchesPattern(event, pattern)`

**Parameters:**

- `event` (`string`): 
- `pattern` (`string | RegExp`): 

**Returns:** `boolean`

### `addToHistory(event, data?)`

**Parameters:**

- `event` (`string`): 
- `data` (`T | undefined`): 

**Returns:** `void`

### `updateMetrics(event, duration, handlerCount, errorCount)`

**Parameters:**

- `event` (`string`): 
- `duration` (`number`): 
- `handlerCount` (`number`): 
- `errorCount` (`number`): 

**Returns:** `void`

### `createScope(prefix)`

**Parameters:**

- `prefix` (`string`): 

**Returns:** `ScopedEventBus`

