# CommandTipsProvider

## Properties

| Name | Type | Description |
|------|------|-------------|
| `tips` | `Map<string, CommandTip>` |  |
| `shownTips` | `Set<string>` |  |
| `context` | `ExtensionContext` |  |

## Methods

### `initializeTips()`

**Returns:** `void`

### `getContextualTip()`

**Returns:** `Promise<CommandTip | undefined>`

### `getNextUnshownTip()`

**Returns:** `CommandTip | undefined`

### `showTip(tip)`

**Parameters:**

- `tip` (`CommandTip`): 

**Returns:** `Promise<void>`

### `showTipInStatusBar(tip)`

**Parameters:**

- `tip` (`CommandTip`): 

**Returns:** `StatusBarItem`

### `getDailyTip()`

**Returns:** `CommandTip`

### `getCommandTitle(commandId)`

**Parameters:**

- `commandId` (`string`): 

**Returns:** `string`

### `loadShownTips()`

**Returns:** `void`

### `saveShownTips()`

**Returns:** `void`

