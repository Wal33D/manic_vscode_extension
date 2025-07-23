# AccessibilityManager

## Properties

| Name | Type | Description |
|------|------|-------------|
| `options` | `AccessibilityOptions` |  |
| `optionsKey` | `"manicMiners.accessibility"` |  |

## Methods

### `getOptions()`

**Returns:** `AccessibilityOptions`

### `updateOptions(updates)`

**Parameters:**

- `updates` (`Partial<AccessibilityOptions>`): 

**Returns:** `Promise<void>`

### `isHighContrastEnabled()`

**Returns:** `boolean`

### `isScreenReaderEnabled()`

**Returns:** `boolean`

### `getAriaAttributes()`

**Returns:** `Record<string, string>`

### `getCssClasses()`

**Returns:** `string[]`

### `generateHtmlAttributes()`

**Returns:** `string`

### `getColorScheme()`

**Returns:** `Record<string, string>`

### `announce(message, priority)`

**Parameters:**

- `message` (`string`): 
- `priority` (`"polite" | "assertive"`): 

**Returns:** `void`

### `loadOptions()`

**Returns:** `AccessibilityOptions`

### `saveOptions()`

**Returns:** `Promise<void>`

### `watchVSCodeSettings()`

**Returns:** `void`

### `notifyOptionsChanged()`

**Returns:** `void`

