# EnhancedDashboardProvider

## Inheritance

- Implements: `vscode.WebviewViewProvider`

## Properties

| Name | Type | Description |
|------|------|-------------|
| `_view` | `WebviewView | undefined` |  |
| `_extensionUri` | `Uri` |  |
| `layoutManager` | `LayoutManager` |  |
| `state` | `CommandCenterState` |  |
| `workspacePresets` | `WorkspacePreset[]` |  |

## Methods

### `resolveWebviewView(webviewView, _context, _token)`

**Parameters:**

- `webviewView` (`WebviewView`): 
- `_context` (`WebviewViewResolveContext<unknown>`): 
- `_token` (`CancellationToken`): 

**Returns:** `void`

### `applyWorkspacePreset(presetId)`

**Parameters:**

- `presetId` (`string`): 

**Returns:** `Promise<void>`

### `executeCommand(commandId, args?)`

**Parameters:**

- `commandId` (`string`): 
- `args` (`any`): 

**Returns:** `Promise<void>`

### `createCustomPreset()`

**Returns:** `Promise<void>`

### `openMap(mapPath)`

**Parameters:**

- `mapPath` (`string`): 

**Returns:** `Promise<void>`

### `togglePinnedTool(toolId)`

**Parameters:**

- `toolId` (`string`): 

**Returns:** `void`

### `startWorkflow(workflowId)`

**Parameters:**

- `workflowId` (`string`): 

**Returns:** `Promise<void>`

### `executeWorkflowStep(stepIndex)`

**Parameters:**

- `stepIndex` (`number`): 

**Returns:** `Promise<void>`

### `updateProjectOverview()`

**Returns:** `void`

### `updateContextualSuggestions(document)`

**Parameters:**

- `document` (`TextDocument`): 

**Returns:** `void`

### `setupCommandTracking()`

**Returns:** `void`

### `trackCommandUsage(commandId)`

**Parameters:**

- `commandId` (`string`): 

**Returns:** `void`

### `updateRecentCommands(commandId)`

**Parameters:**

- `commandId` (`string`): 

**Returns:** `void`

### `getCommandLabel(commandId)`

**Parameters:**

- `commandId` (`string`): 

**Returns:** `string`

### `getCommandIcon(commandId)`

**Parameters:**

- `commandId` (`string`): 

**Returns:** `string`

### `getCommandCategory(commandId)`

**Parameters:**

- `commandId` (`string`): 

**Returns:** `string`

### `addActivity(type, mapName, mapPath, details?)`

**Parameters:**

- `type` (`"created" | "edited" | "validated" | "exported" | "analyzed"`): 
- `mapName` (`string`): 
- `mapPath` (`string`): 
- `details` (`string | undefined`): 

**Returns:** `void`

### `updateView()`

**Returns:** `void`

### `loadState()`

**Returns:** `CommandCenterState`

### `saveState()`

**Returns:** `void`

### `_getHtmlForWebview(webview)`

**Parameters:**

- `webview` (`Webview`): 

**Returns:** `string`

### `getNonce()`

**Returns:** `string`

