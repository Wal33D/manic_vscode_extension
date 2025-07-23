# DocGenerator

## Properties

| Name | Type | Description |
|------|------|-------------|
| `program` | `Program` |  |
| `checker` | `TypeChecker` |  |
| `outputDir` | `string` |  |
| `components` | `Map<string, ComponentDoc>` |  |
| `apis` | `Map<string, APIDoc>` |  |

## Methods

### `initializeTypeScript()`

**Returns:** `void`

### `generateDocs()`

**Returns:** `Promise<void>`

### `processSourceFile(sourceFile)`

**Parameters:**

- `sourceFile` (`SourceFile`): 

**Returns:** `Promise<void>`

### `processClass(symbol, node)`

**Parameters:**

- `symbol` (`Symbol`): 
- `node` (`ClassDeclaration`): 

**Returns:** `void`

### `processMethod(symbol)`

**Parameters:**

- `symbol` (`Symbol`): 

**Returns:** `MethodDoc`

### `processProperty(symbol)`

**Parameters:**

- `symbol` (`Symbol`): 

**Returns:** `PropertyDoc`

### `getJSDocComment(symbol)`

**Parameters:**

- `symbol` (`Symbol`): 

**Returns:** `string`

### `parseJSDocComment(comment)`

**Parameters:**

- `comment` (`string`): 

**Returns:** `string`

### `extractExamples(symbol)`

**Parameters:**

- `symbol` (`Symbol`): 

**Returns:** `Example[]`

### `generateComponentDocs()`

**Returns:** `Promise<void>`

### `renderComponentDoc(doc)`

**Parameters:**

- `doc` (`ComponentDoc`): 

**Returns:** `string`

### `renderParameters(params)`

**Parameters:**

- `params` (`ParameterDoc[]`): 

**Returns:** `string`

### `generateIndex()`

**Returns:** `Promise<void>`

### `generateAPIDocs()`

**Returns:** `Promise<void>`

### `generateExamples()`

**Returns:** `Promise<void>`

### `processInterface(symbol, node)`

**Parameters:**

- `symbol` (`Symbol`): 
- `node` (`InterfaceDeclaration`): 

**Returns:** `void`

### `processFunction(symbol, node)`

**Parameters:**

- `symbol` (`Symbol`): 
- `node` (`FunctionDeclaration`): 

**Returns:** `void`

### `processExport(node)`

**Parameters:**

- `node` (`ExportDeclaration`): 

**Returns:** `void`

### `getExtends(node)`

**Parameters:**

- `node` (`ClassDeclaration`): 

**Returns:** `string | undefined`

### `getImplements(node)`

**Parameters:**

- `node` (`ClassDeclaration`): 

**Returns:** `string[]`

### `getParameters(signature)`

**Parameters:**

- `signature` (`Signature`): 

**Returns:** `ParameterDoc[]`

### `getReturnType(signature)`

**Parameters:**

- `signature` (`Signature`): 

**Returns:** `string`

### `getModifiers(symbol)`

**Parameters:**

- `symbol` (`Symbol`): 

**Returns:** `string[]`

### `getDefaultValue(symbol)`

**Parameters:**

- `symbol` (`Symbol`): 

**Returns:** `string | undefined`

### `extractEvents(doc)`

**Parameters:**

- `doc` (`ComponentDoc`): 

**Returns:** `EventDoc[]`

### `getModuleName(sourceFile)`

**Parameters:**

- `sourceFile` (`SourceFile`): 

**Returns:** `string`

### `groupAPIsByModule()`

**Returns:** `Map<string, APIDoc[]>`

### `ensureDirectory(dir)`

**Parameters:**

- `dir` (`string`): 

**Returns:** `Promise<void>`

