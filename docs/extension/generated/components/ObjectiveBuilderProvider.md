# ObjectiveBuilderProvider

## Inheritance

- Implements: `vscode.WebviewViewProvider`

## Properties

| Name | Type | Description |
|------|------|-------------|
| `_view` | `WebviewView | undefined` |  |
| `_extensionUri` | `Uri` |  |

## Methods

### `resolveWebviewView(webviewView, _context, _token)`

**Parameters:**

- `webviewView` (`WebviewView`): 
- `_context` (`WebviewViewResolveContext<unknown>`): 
- `_token` (`CancellationToken`): 

**Returns:** `void`

### `getObjectiveDefinitions()`

**Returns:** `ObjectiveDefinition[]`

### `sendObjectiveTypes()`

**Returns:** `void`

### `updateEditorState()`

**Returns:** `void`

### `hasObjectivesSection(document)`

**Parameters:**

- `document` (`TextDocument`): 

**Returns:** `boolean`

### `insertObjective(objective)`

**Parameters:**

- `objective` (`string`): 

**Returns:** `Promise<void>`

### `findBestInsertPosition(lines)`

**Parameters:**

- `lines` (`string[]`): 

**Returns:** `number`

### `getIndentFromLine(line)`

**Parameters:**

- `line` (`string`): 

**Returns:** `string`

### `validateObjective(objective)`

**Parameters:**

- `objective` (`string`): 

**Returns:** `void`

### `_getHtmlForWebview(webview)`

**Parameters:**

- `webview` (`Webview`): 

**Returns:** `string`

