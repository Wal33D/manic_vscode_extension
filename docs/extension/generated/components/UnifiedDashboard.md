# UnifiedDashboard

## Properties

| Name | Type | Description |
|------|------|-------------|
| `webview` | `Webview | undefined` |  |
| `lazyLoader` | `LazyLoader | undefined` |  |
| `workspaceStats` | `WorkspaceStats` |  |
| `recentActions` | `RecentAction[]` |  |
| `maxRecentActions` | `number` |  |
| `workspacePresets` | `WorkspacePreset[]` |  |
| `performanceMetrics` | `PerformanceMetrics` |  |
| `quickActions` | `QuickAction[]` |  |
| `notifications` | `Notification[]` |  |
| `maxNotifications` | `number` |  |
| `searchHistory` | `string[]` |  |
| `searchResults` | `SearchResult[]` |  |
| `dashboardLayout` | `DashboardLayout` |  |
| `updateStatsDebounced` | `() => void` |  |
| `updateMetricsDebounced` | `() => void` |  |

## Methods

### `initialize(webview)`

**Parameters:**

- `webview` (`Webview`): 

**Returns:** `Promise<void>`

### `setupMessageHandling()`

**Returns:** `void`

### `loadDashboardUI()`

**Returns:** `Promise<void>`

### `loadDashboardWidgets()`

**Returns:** `Promise<void>`

### `initializeDefaultPresets()`

**Returns:** `void`

### `initializeQuickActions()`

**Returns:** `void`

### `startMonitoring()`

**Returns:** `void`

### `updateStats()`

**Returns:** `Promise<void>`

### `updateMetrics()`

**Returns:** `void`

### `executeQuickAction(actionId)`

**Parameters:**

- `actionId` (`string`): 

**Returns:** `Promise<void>`

### `applyWorkspacePreset(presetId)`

**Parameters:**

- `presetId` (`string`): 

**Returns:** `Promise<void>`

### `performSearch(query)`

**Parameters:**

- `query` (`string`): 

**Returns:** `Promise<void>`

### `trackAction(action)`

**Parameters:**

- `action` (`RecentAction`): 

**Returns:** `void`

### `addNotification(notification)`

**Parameters:**

- `notification` (`Notification`): 

**Returns:** `void`

### `getStatsWidgetContent()`

**Returns:** `Promise<string>`

### `getQuickActionsContent()`

**Returns:** `Promise<string>`

### `getRecentActivityContent()`

**Returns:** `Promise<string>`

### `getPerformanceContent()`

**Returns:** `Promise<string>`

### `getNotificationsContent()`

**Returns:** `Promise<string>`

### `getSearchWidgetContent()`

**Returns:** `Promise<string>`

### `getTimeAgo(timestamp)`

**Parameters:**

- `timestamp` (`number`): 

**Returns:** `string`

### `getActivityIcon(type)`

**Parameters:**

- `type` (`string`): 

**Returns:** `string`

### `getNotificationIcon(type)`

**Parameters:**

- `type` (`string`): 

**Returns:** `string`

### `cleanOldNotifications()`

**Returns:** `void`

### `openRecentItem(itemId)`

**Parameters:**

- `itemId` (`string`): 

**Returns:** `Promise<void>`

### `customizeWidget(widgetId, config)`

**Parameters:**

- `widgetId` (`string`): 
- `config` (`any`): 

**Returns:** `Promise<void>`

### `toggleWidget(widgetId)`

**Parameters:**

- `widgetId` (`string`): 

**Returns:** `void`

### `reloadWidget(_widgetId)`

**Parameters:**

- `_widgetId` (`string`): 

**Returns:** `Promise<void>`

### `exportDashboardConfig()`

**Returns:** `Promise<void>`

### `importDashboardConfig(config)`

**Parameters:**

- `config` (`any`): 

**Returns:** `Promise<void>`

### `refreshAllStats()`

**Returns:** `Promise<void>`

### `createWorkspacePreset(name, config)`

**Parameters:**

- `name` (`string`): 
- `config` (`any`): 

**Returns:** `Promise<void>`

### `deleteWorkspacePreset(presetId)`

**Parameters:**

- `presetId` (`string`): 

**Returns:** `void`

### `pinQuickAction(actionId)`

**Parameters:**

- `actionId` (`string`): 

**Returns:** `void`

### `unpinQuickAction(actionId)`

**Parameters:**

- `actionId` (`string`): 

**Returns:** `void`

### `showAnalytics(timeRange)`

**Parameters:**

- `timeRange` (`string`): 

**Returns:** `Promise<void>`

### `generateAnalytics(timeRange)`

**Parameters:**

- `timeRange` (`string`): 

**Returns:** `Promise<any>`

### `getMostUsedAction()`

**Returns:** `string`

### `getActivityOverTime()`

**Returns:** `any[]`

### `getActionsByCategory()`

**Returns:** `any[]`

### `dismissNotification(notificationId)`

**Parameters:**

- `notificationId` (`string`): 

**Returns:** `void`

### `dispose()`

**Returns:** `void`

