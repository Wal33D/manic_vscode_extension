# ThemeManager

## Properties

| Name | Type | Description |
|------|------|-------------|
| `themes` | `Map<string, Theme>` |  |
| `activeTheme` | `string` |  |
| `customProperties` | `Map<string, string>` |  |
| `themeObservers` | `Set<ThemeObserver>` |  |
| `cssVariables` | `Map<string, string>` |  |
| `transitionDuration` | `number` |  |
| `isTransitioning` | `boolean` |  |
| `colorCache` | `Map<string, ColorInfo>` |  |

## Methods

### `registerTheme(theme)`

**Parameters:**

- `theme` (`Theme`): 

**Returns:** `void`

### `applyTheme(themeId, options?)`

**Parameters:**

- `themeId` (`string`): 
- `options` (`ApplyThemeOptions | undefined`): 

**Returns:** `Promise<void>`

### `getCurrentTheme()`

**Returns:** `Theme | undefined`

### `getTheme(themeId)`

**Parameters:**

- `themeId` (`string`): 

**Returns:** `Theme | undefined`

### `getAllThemes()`

**Returns:** `Theme[]`

### `createCustomTheme(config)`

**Parameters:**

- `config` (`CustomThemeConfig`): 

**Returns:** `Theme`

### `updateThemeProperty(property, value)`

**Parameters:**

- `property` (`string`): 
- `value` (`string`): 

**Returns:** `void`

### `getColor(colorKey)`

**Parameters:**

- `colorKey` (`string`): 

**Returns:** `string | undefined`

### `getComputedColor(color)`

**Parameters:**

- `color` (`string`): 

**Returns:** `ColorInfo`

### `observe(observer)`

**Parameters:**

- `observer` (`ThemeObserver`): 

**Returns:** `Unsubscribe`

### `generateCSS()`

**Returns:** `string`

### `exportTheme(themeId)`

**Parameters:**

- `themeId` (`string`): 

**Returns:** `string`

### `importTheme(themeData)`

**Parameters:**

- `themeData` (`string`): 

**Returns:** `Theme`

### `initializeDefaultThemes()`

**Returns:** `void`

### `applyThemeColors(theme)`

**Parameters:**

- `theme` (`Theme`): 

**Returns:** `void`

### `applyCustomProperties(theme)`

**Parameters:**

- `theme` (`Theme`): 

**Returns:** `void`

### `applyCSSVariable(name, value)`

**Parameters:**

- `name` (`string`): 
- `value` (`string`): 

**Returns:** `void`

### `applyVSCodeTheme(themeName)`

**Parameters:**

- `themeName` (`string`): 

**Returns:** `Promise<void>`

### `setupStateSync()`

**Returns:** `void`

### `setupEventListeners()`

**Returns:** `void`

### `detectSystemTheme()`

**Returns:** `void`

### `handleVSCodeThemeChange()`

**Returns:** `void`

### `validateTheme(theme)`

**Parameters:**

- `theme` (`Theme`): 

**Returns:** `void`

### `generateComputedProperties(theme)`

**Parameters:**

- `theme` (`Theme`): 

**Returns:** `string`

### `computeColorInfo(color)`

**Parameters:**

- `color` (`string`): 

**Returns:** `ColorInfo`

### `parseColor(color)`

**Parameters:**

- `color` (`string`): 

**Returns:** `RGB`

### `rgbToHex(rgb)`

**Parameters:**

- `rgb` (`RGB`): 

**Returns:** `string`

### `adjustBrightness(rgb, factor)`

**Parameters:**

- `rgb` (`RGB`): 
- `factor` (`number`): 

**Returns:** `string`

### `getContrastColor(rgb)`

**Parameters:**

- `rgb` (`RGB`): 

**Returns:** `string`

### `getCurrentColors()`

**Returns:** `Record<string, string>`

### `startTransition()`

**Returns:** `void`

### `endTransition()`

**Returns:** `void`

### `notifyObservers(theme, previousTheme)`

**Parameters:**

- `theme` (`Theme`): 
- `previousTheme` (`string`): 

**Returns:** `void`

### `saveCustomTheme(theme)`

**Parameters:**

- `theme` (`Theme`): 

**Returns:** `Promise<void>`

