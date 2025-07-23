# PluginManager

## Properties

| Name | Type | Description |
|------|------|-------------|
| `plugins` | `Map<string, Plugin>` |  |
| `activePlugins` | `Set<string>` |  |
| `pluginAPIs` | `Map<string, PluginAPI>` |  |
| `sandboxes` | `Map<string, PluginSandbox>` |  |
| `hooks` | `Map<string, Set<HookHandler>>` |  |
| `pluginStates` | `Map<string, any>` |  |
| `permissions` | `Map<string, PluginPermissions>` |  |
| `blockedPlugins` | `Set<string>` |  |
| `builtinPluginsPath` | `string` |  |
| `userPluginsPath` | `string` |  |

## Methods

### `initializePluginSystem()`

**Returns:** `Promise<void>`

### `registerPlugin(manifest, source)`

**Parameters:**

- `manifest` (`PluginManifest`): 
- `source` (`PluginSource`): 

**Returns:** `Promise<void>`

### `activatePlugin(pluginId)`

**Parameters:**

- `pluginId` (`string`): 

**Returns:** `Promise<void>`

### `deactivatePlugin(pluginId)`

**Parameters:**

- `pluginId` (`string`): 

**Returns:** `Promise<void>`

### `getAllPlugins()`

**Returns:** `Plugin[]`

### `getActivePlugins()`

**Returns:** `Plugin[]`

### `getPlugin(pluginId)`

**Parameters:**

- `pluginId` (`string`): 

**Returns:** `Plugin | undefined`

### `installPlugin(vsixPath)`

**Parameters:**

- `vsixPath` (`string`): 

**Returns:** `Promise<string>`

### `uninstallPlugin(pluginId)`

**Parameters:**

- `pluginId` (`string`): 

**Returns:** `Promise<void>`

### `registerHook(hookName, handler)`

**Parameters:**

- `hookName` (`string`): 
- `handler` (`HookHandler`): 

**Returns:** `Unsubscribe`

### `callHook(hookName, data)`

**Parameters:**

- `hookName` (`string`): 
- `data` (`any`): 

**Returns:** `Promise<any[]>`

### `createPluginAPI(pluginId)`

**Parameters:**

- `pluginId` (`string`): 

**Returns:** `void`

### `createSandbox(plugin)`

**Parameters:**

- `plugin` (`Plugin`): 

**Returns:** `Promise<PluginSandbox>`

### `loadPluginModule(plugin)`

**Parameters:**

- `plugin` (`Plugin`): 

**Returns:** `Promise<any>`

### `validateManifest(manifest)`

**Parameters:**

- `manifest` (`PluginManifest`): 

**Returns:** `void`

### `loadBuiltinPlugins()`

**Returns:** `Promise<void>`

### `loadUserPlugins()`

**Returns:** `Promise<void>`

### `registerCoreHooks()`

**Returns:** `void`

### `ensureDirectories()`

**Returns:** `Promise<void>`

### `extractManifestFromVSIX(_vsixPath)`

**Parameters:**

- `_vsixPath` (`string`): 

**Returns:** `Promise<PluginManifest>`

### `extractVSIX(_vsixPath, _targetDir)`

**Parameters:**

- `_vsixPath` (`string`): 
- `_targetDir` (`string`): 

**Returns:** `Promise<void>`

### `setupEventListeners()`

**Returns:** `void`

### `getStorageContext()`

**Returns:** `Promise<ExtensionContext>`

