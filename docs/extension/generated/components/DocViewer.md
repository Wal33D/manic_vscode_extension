# DocViewer

## Inheritance

- Implements: `vscode.WebviewViewProvider`

## Properties

| Name | Type | Description |
|------|------|-------------|
| `_view` | `WebviewView | undefined` |  |
| `_extensionUri` | `Uri` |  |
| `searchIndex` | `SearchIndex` |  |
| `currentDoc` | `string | undefined` |  |
| `history` | `string[]` |  |
| `historyIndex` | `number` |  |
| `favorites` | `Set<string>` |  |

## Methods

### `resolveWebviewView(webviewView, _context, _token)`

**Parameters:**

- `webviewView` (`WebviewView`): 
- `_context` (`WebviewViewResolveContext<unknown>`): 
- `_token` (`CancellationToken`): 

**Returns:** `void`

### `navigateToDoc(docPath)`

**Parameters:**

- `docPath` (`string`): 

**Returns:** `Promise<void>`

### `renderMarkdown(markdown)`

**Parameters:**

- `markdown` (`string`): 

**Returns:** `Promise<string>`

### `handleSearch(query)`

**Parameters:**

- `query` (`string`): 

**Returns:** `Promise<void>`

### `buildSearchIndex()`

**Returns:** `Promise<void>`

### `walkDocs(dir, callback)`

**Parameters:**

- `dir` (`string`): 
- `callback` (`(filePath: string, relativePath: string) => Promise<void>`): 

**Returns:** `Promise<void>`

### `extractTitle(markdown)`

**Parameters:**

- `markdown` (`string`): 

**Returns:** `string`

### `extractText(markdown)`

**Parameters:**

- `markdown` (`string`): 

**Returns:** `string`

### `showHome()`

**Returns:** `Promise<void>`

### `navigateBack()`

**Returns:** `void`

### `navigateForward()`

**Returns:** `void`

### `toggleFavorite(path)`

**Parameters:**

- `path` (`string`): 

**Returns:** `void`

### `loadFavorites()`

**Returns:** `void`

### `saveFavorites()`

**Returns:** `void`

### `updateBreadcrumbs(docPath)`

**Parameters:**

- `docPath` (`string`): 

**Returns:** `void`

### `exportToPDF()`

**Returns:** `Promise<void>`

### `copyCodeBlock(code)`

**Parameters:**

- `code` (`string`): 

**Returns:** `Promise<void>`

### `runExample(code)`

**Parameters:**

- `code` (`string`): 

**Returns:** `Promise<void>`

### `refreshCurrentDoc()`

**Returns:** `void`

### `escapeHtml(text)`

**Parameters:**

- `text` (`string`): 

**Returns:** `string`

### `_getHtmlForWebview(webview)`

**Parameters:**

- `webview` (`Webview`): 

**Returns:** `string`

### `getNonce()`

**Returns:** `string`

