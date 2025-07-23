# Unified Components Tests

This directory contains unit tests for the unified components system.

## Test Status

- **eventBus.test.ts** - ✅ Active and passing
- **integration.test.ts.disabled** - ❌ Disabled - Needs refactoring to match updated APIs
- **pluginManager.test.ts.disabled** - ❌ Disabled - Needs refactoring to match updated APIs  
- **stateSync.test.ts.disabled** - ❌ Disabled - Needs refactoring to match updated APIs
- **themeManager.test.ts.disabled** - ❌ Disabled - Needs refactoring to match updated APIs

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- eventBus.test.ts

# Run with coverage
npm run test:coverage
```

## Re-enabling Disabled Tests

The disabled tests need to be updated to match the actual API implementations. Key changes needed:

1. **integration.test.ts**
   - Replace `pluginManager` singleton with `PluginManager` class instance
   - Remove calls to non-existent methods like `clearAll()`, `reset()`
   - Update to use actual API methods

2. **pluginManager.test.ts**
   - Update `PluginSource` objects to include required `type` and `path` properties
   - Remove tests for non-existent methods
   - Update to match actual plugin API

3. **stateSync.test.ts**
   - Remove `clearAll()` method calls
   - Update `lock()` method to use correct signature
   - Fix conflict resolver method names

4. **themeManager.test.ts**
   - Update theme objects to match `Theme` interface
   - Remove tests for non-existent methods
   - Update to use actual theme API

To re-enable a test, rename it back from `.ts.disabled` to `.ts` and update the implementation.