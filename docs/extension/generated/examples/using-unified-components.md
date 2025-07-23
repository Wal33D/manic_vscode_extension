# Using Unified Components

This guide demonstrates how to use the unified components in the Manic Miners VS Code extension.

## Event Bus

The Event Bus provides a central communication system for all components.

### Basic Usage

```typescript
import { eventBus } from './unified/eventBus';

// Subscribe to an event
const unsubscribe = eventBus.on('workspace:mapLoaded', (data) => {
  console.log('Map loaded:', data.path);
});

// Emit an event
eventBus.emit('workspace:toolChanged', {
  tool: 'brush',
  previousTool: 'pencil'
});

// Unsubscribe when done
unsubscribe();
```

### Advanced Features

```typescript
// Use wildcards
eventBus.on('workspace:*', (event, data) => {
  console.log(`Workspace event: ${event}`, data);
});

// Add middleware
eventBus.use((event, data, next) => {
  console.log(`Event: ${event}`, data);
  next(); // Continue to handlers
});

// Create typed event emitter
interface MyEvents {
  'user:login': { userId: string; timestamp: number };
  'user:logout': { userId: string };
}

const typedEmitter = eventBus.createTypedEmitter<MyEvents>();
typedEmitter.on('user:login', (data) => {
  // data is fully typed!
  console.log(data.userId, data.timestamp);
});
```

## State Synchronization

Keep state synchronized across components with automatic conflict resolution.

### Basic State Management

```typescript
import { stateSync } from './unified/stateSync';

// Set state
stateSync.setState('selectedTile', 42, 'mapEditor');

// Get state
const selectedTile = stateSync.getState<number>('selectedTile');

// Subscribe to changes
const unsubscribe = stateSync.subscribe('selectedTile', (value) => {
  console.log('Selected tile changed:', value);
});
```

### Advanced Features

```typescript
// Batch updates
stateSync.batch(() => {
  stateSync.setState('tool', 'brush', 'toolbar');
  stateSync.setState('brushSize', 5, 'toolbar');
  stateSync.setState('opacity', 0.8, 'toolbar');
});

// Lock state during critical operations
const unlock = await stateSync.lock('mapData');
try {
  // Perform operations
  stateSync.setState('mapData', newData, 'mapEditor');
} finally {
  unlock();
}

// Custom conflict resolution
stateSync.registerConflictResolver('score', (current, incoming, context) => {
  // Keep the highest score
  return Math.max(current, incoming);
});

// Computed states
stateSync.computed('tileCount', ['tiles'], (tiles: number[][]) => {
  return tiles.flat().filter(t => t > 0).length;
});
```

## Theme Manager

Create and manage themes dynamically with CSS generation.

### Basic Theme Usage

```typescript
import { themeManager } from './unified/themeManager';

// Apply a theme
themeManager.applyTheme('dark');

// Get current theme
const currentTheme = themeManager.getCurrentTheme();
```

### Creating Custom Themes

```typescript
// Register a custom theme
themeManager.registerTheme({
  id: 'ocean',
  name: 'Ocean Theme',
  parent: 'dark', // Inherit from dark theme
  colors: {
    primary: '#006994',
    secondary: '#004d6f',
    background: '#001f3f',
    foreground: '#e0f2ff',
    accent: '#00a8cc',
    error: '#ff6b6b',
    warning: '#ffd93d',
    success: '#6bcf7f',
    info: '#4ecdc4'
  },
  rules: [
    {
      selector: '.panel',
      styles: {
        backgroundColor: 'var(--background)',
        borderColor: 'var(--primary)',
        color: 'var(--foreground)'
      }
    },
    {
      selector: '.button:hover',
      styles: {
        backgroundColor: 'var(--accent)',
        transform: 'scale(1.05)'
      }
    }
  ]
});

// Generate CSS
const css = themeManager.generateCSS();
```

### Responsive Themes

```typescript
themeManager.registerTheme({
  id: 'adaptive',
  name: 'Adaptive Theme',
  colors: { /* ... */ },
  rules: [ /* ... */ ],
  responsive: {
    dark: {
      // Override colors for dark mode
      colors: {
        background: '#1a1a1a',
        foreground: '#ffffff'
      }
    },
    highContrast: {
      // High contrast overrides
      colors: {
        primary: '#ffffff',
        background: '#000000'
      }
    }
  }
});
```

## Plugin Architecture

Extend functionality with plugins that have controlled permissions.

### Creating a Plugin

```typescript
// Plugin manifest
const pluginManifest = {
  id: 'my-plugin',
  name: 'My Custom Plugin',
  version: '1.0.0',
  author: 'Your Name',
  description: 'Adds custom functionality',
  main: './dist/plugin.js',
  permissions: ['filesystem', 'ui', 'state'],
  activationEvents: ['onStartup'],
  contributes: {
    commands: [
      {
        id: 'myPlugin.doSomething',
        title: 'Do Something Cool',
        icon: '✨',
        handler: 'handleCommand'
      }
    ],
    tools: [
      {
        id: 'customBrush',
        name: 'Custom Brush',
        icon: '🖌️',
        handler: 'activateTool'
      }
    ]
  }
};

// Plugin implementation
export class MyPlugin {
  private api: PluginAPI;
  
  activate(api: PluginAPI): void {
    this.api = api;
    
    // Register hooks
    api.hooks.on('beforeSave', this.beforeSave.bind(this));
    api.hooks.on('afterLoad', this.afterLoad.bind(this));
  }
  
  handleCommand(args: any): void {
    // Use the API to interact with the extension
    this.api.ui.showMessage('Hello from plugin!');
    
    // Access state
    const currentTile = this.api.state.get('selectedTile');
    
    // Emit events
    this.api.events.emit('plugin:action', { 
      plugin: this.manifest.id,
      action: 'command' 
    });
  }
  
  private beforeSave(data: any): any {
    // Modify data before save
    return { ...data, pluginData: 'added by plugin' };
  }
  
  private afterLoad(data: any): void {
    // Process loaded data
    console.log('Map loaded:', data);
  }
}
```

### Registering and Using Plugins

```typescript
import { pluginManager } from './unified/pluginManager';

// Register a plugin from file
await pluginManager.registerPlugin(pluginManifest, {
  type: 'file',
  path: './plugins/my-plugin.js'
});

// Activate the plugin
await pluginManager.activatePlugin('my-plugin');

// Execute plugin command
await pluginManager.executeCommand('myPlugin.doSomething', { /* args */ });

// Check plugin permissions
if (pluginManager.hasPermission('my-plugin', 'filesystem')) {
  // Plugin can access filesystem
}
```

## Integration Example

Here's how all the components work together:

```typescript
import { eventBus } from './unified/eventBus';
import { stateSync } from './unified/stateSync';
import { themeManager } from './unified/themeManager';
import { pluginManager } from './unified/pluginManager';

// Initialize the application
async function initializeApp() {
  // Set up event listeners
  eventBus.on('app:themeChanged', ({ theme }) => {
    themeManager.applyTheme(theme);
  });
  
  eventBus.on('map:tileSelected', ({ tileId }) => {
    stateSync.setState('selectedTile', tileId, 'mapEditor');
  });
  
  // Subscribe to state changes
  stateSync.subscribe('selectedTile', (tileId) => {
    eventBus.emit('ui:updateToolbar', { selectedTile: tileId });
  });
  
  // Load user theme preference
  const savedTheme = await getUserPreference('theme');
  if (savedTheme) {
    themeManager.applyTheme(savedTheme);
  }
  
  // Load plugins
  const plugins = await getInstalledPlugins();
  for (const plugin of plugins) {
    await pluginManager.registerPlugin(plugin.manifest, plugin.source);
  }
  
  // Activate plugins based on activation events
  await pluginManager.activateByEvent('onStartup');
  
  // Notify that app is ready
  eventBus.emit('app:ready', {
    theme: themeManager.getCurrentTheme(),
    plugins: pluginManager.getActivePlugins(),
    state: stateSync.getSnapshot()
  });
}

// Handle user actions
function handleToolChange(tool: string) {
  // Update state
  stateSync.setState('currentTool', tool, 'toolbar');
  
  // Emit event
  eventBus.emit('workspace:toolChanged', {
    tool,
    previousTool: stateSync.getState('currentTool')
  });
  
  // Let plugins know
  pluginManager.executeHook('onToolChange', { tool });
}

// Clean shutdown
async function shutdown() {
  // Save state
  const snapshot = stateSync.getSnapshot();
  await saveState(snapshot);
  
  // Deactivate plugins
  await pluginManager.deactivateAll();
  
  // Clear event listeners
  eventBus.removeAllListeners();
  
  // Emit shutdown event
  eventBus.emit('app:shutdown', { timestamp: Date.now() });
}
```

## Best Practices

### 1. Event Naming Convention

Use a consistent naming pattern for events:
- `component:action` - e.g., `workspace:mapLoaded`
- `component:state:changed` - e.g., `editor:tool:changed`
- `component:error` - e.g., `plugin:error`

### 2. State Keys

Use descriptive, namespaced keys for state:
- `editor.selectedTile`
- `ui.theme`
- `workspace.layout`

### 3. Plugin Security

Always validate plugin permissions:
```typescript
if (!pluginManager.hasPermission(pluginId, 'state')) {
  throw new Error('Plugin does not have state access permission');
}
```

### 4. Memory Management

Clean up subscriptions and listeners:
```typescript
const subscriptions: Array<() => void> = [];

// Track subscriptions
subscriptions.push(
  eventBus.on('event', handler),
  stateSync.subscribe('key', handler)
);

// Clean up
function cleanup() {
  subscriptions.forEach(unsub => unsub());
  subscriptions.length = 0;
}
```

### 5. Error Handling

Always handle errors in event handlers and state updates:
```typescript
eventBus.on('risky:operation', async (data) => {
  try {
    await performOperation(data);
  } catch (error) {
    eventBus.emit('error:operation', { error, data });
  }
});
```

## Testing

Test your integrations using the provided test utilities:

```typescript
import { createTestEventBus } from '../test/utils/testHelpers';
import { TestDataFactory } from '../test/utils/testDataFactory';

describe('My Component', () => {
  let eventBus: EventBus;
  let testData: TestDataFactory;
  
  beforeEach(() => {
    eventBus = createTestEventBus();
    testData = new TestDataFactory();
  });
  
  it('should handle events', () => {
    const handler = jest.fn();
    eventBus.on('test:event', handler);
    
    eventBus.emit('test:event', { data: 'test' });
    
    expect(handler).toHaveBeenCalledWith({ data: 'test' });
  });
  
  it('should sync state', () => {
    const mockState = testData.createMockState();
    // Test state synchronization
  });
});
```

## Conclusion

The unified components provide a robust foundation for building extensible, maintainable features in the Manic Miners extension. By leveraging the Event Bus for communication, State Sync for data management, Theme Manager for UI customization, and Plugin Manager for extensibility, you can create powerful features that integrate seamlessly with the rest of the extension.