# StateSync

## Properties

| Name | Type | Description |
|------|------|-------------|
| `syncedState` | `Map<string, SyncedStateEntry>` |  |
| `stateSubscribers` | `Map<string, Set<StateSubscriber>>` |  |
| `pendingUpdates` | `Map<string, any>` |  |
| `conflictResolvers` | `Map<string, ConflictResolver>` |  |
| `stateHistory` | `StateHistoryEntry[]` |  |
| `maxHistorySize` | `number` |  |
| `batchUpdates` | `() => void` |  |
| `syncDebounced` | `Map<string, () => void>` |  |
| `stateVersions` | `Map<string, number>` |  |

## Methods

### `registerState(key, initialValue, options?)`

**Parameters:**

- `key` (`string`): 
- `initialValue` (`T`): 
- `options` (`StateOptions | undefined`): 

**Returns:** `void`

### `getState(key)`

**Parameters:**

- `key` (`string`): 

**Returns:** `T | undefined`

### `setState(key, value, source)`

**Parameters:**

- `key` (`string`): 
- `value` (`T | ((prev: T) => T)`): 
- `source` (`string`): 

**Returns:** `boolean`

### `subscribe(key, callback, options?)`

**Parameters:**

- `key` (`string`): 
- `callback` (`StateCallback<T>`): 
- `options` (`SubscribeOptions | undefined`): 

**Returns:** `Unsubscribe`

### `createComputed(key, dependencies, compute)`

**Parameters:**

- `key` (`string`): 
- `dependencies` (`string[]`): 
- `compute` (`ComputeFunction<T>`): 

**Returns:** `void`

### `lockState(key, owner)`

**Parameters:**

- `key` (`string`): 
- `owner` (`string`): 

**Returns:** `boolean`

### `unlockState(key, owner)`

**Parameters:**

- `key` (`string`): 
- `owner` (`string`): 

**Returns:** `boolean`

### `registerConflictResolver(key, resolver)`

**Parameters:**

- `key` (`string`): 
- `resolver` (`ConflictResolver`): 

**Returns:** `void`

### `createProxy()`

**Returns:** `T`

### `getHistory(key?)`

**Parameters:**

- `key` (`string | undefined`): 

**Returns:** `StateHistoryEntry[]`

### `clearState(key?)`

**Parameters:**

- `key` (`string | undefined`): 

**Returns:** `void`

### `exportState()`

**Returns:** `Record<string, any>`

### `setupEventListeners()`

**Returns:** `void`

### `processPendingUpdates()`

**Returns:** `void`

### `broadcastStateChange(key)`

**Parameters:**

- `key` (`string`): 

**Returns:** `void`

### `notifySubscribers(key, newValue, oldValue)`

**Parameters:**

- `key` (`string`): 
- `newValue` (`T`): 
- `oldValue` (`T`): 

**Returns:** `void`

### `addToHistory(key, oldValue, newValue, source)`

**Parameters:**

- `key` (`string`): 
- `oldValue` (`any`): 
- `newValue` (`any`): 
- `source` (`string`): 

**Returns:** `void`

### `registerDefaultResolvers()`

**Returns:** `void`

### `deepEqual(a, b)`

**Parameters:**

- `a` (`any`): 
- `b` (`any`): 

**Returns:** `boolean`

### `persistState(key, value)`

**Parameters:**

- `key` (`string`): 
- `value` (`any`): 

**Returns:** `Promise<void>`

### `loadPersistedState(key)`

**Parameters:**

- `key` (`string`): 

**Returns:** `Promise<void>`

