# GoldenTestFramework

## Properties

| Name | Type | Description |
|------|------|-------------|
| `goldenDir` | `string` |  |
| `testMapsDir` | `string` |  |
| `outputDir` | `string` |  |
| `options` | `GoldenTestOptions` |  |

## Methods

### `runAllTests()`

**Returns:** `Promise<GoldenTestResult[]>`

### `runTest(testFileName)`

**Parameters:**

- `testFileName` (`string`): 

**Returns:** `Promise<GoldenTestResult>`

### `generateTestOutput(datFile, validationErrors, scriptValidationErrors)`

**Parameters:**

- `datFile` (`any`): 
- `validationErrors` (`any[]`): 
- `scriptValidationErrors` (`any[]`): 

**Returns:** `string`

### `compareOutputs(actual, expected)`

**Parameters:**

- `actual` (`string`): 
- `expected` (`string`): 

**Returns:** `string[]`

### `getTestFiles()`

**Returns:** `string[]`

### `ensureDirectoryExists(dir)`

**Parameters:**

- `dir` (`string`): 

**Returns:** `void`

### `generateSummary(results)`

**Parameters:**

- `results` (`GoldenTestResult[]`): 

**Returns:** `string`

