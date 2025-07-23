/**
 * State Manager for efficient workspace state management
 * Implements immutable updates, state diffing, and undo/redo
 */
class StateManager {
  constructor() {
    this.state = {};
    this.listeners = new Map();
    this.history = [];
    this.historyIndex = -1;
    this.maxHistorySize = 50;
    this.pendingUpdates = [];
    this.updateScheduled = false;
    this.stateCache = new WeakMap();
    
    this.initializeStateManager();
  }

  /**
   * Initialize state management
   */
  initializeStateManager() {
    // Set up default state
    this.state = this.createInitialState();
    
    // Add to history
    this.addToHistory(this.state);
    
    // Set up keyboard shortcuts for undo/redo
    this.setupKeyboardShortcuts();
    
    // Monitor state size
    this.monitorStateSize();
  }

  /**
   * Create initial state
   */
  createInitialState() {
    return {
      panels: {},
      layout: {
        dockLeft: [],
        dockRight: [],
        dockTop: [],
        dockBottom: [],
        floating: []
      },
      tools: {
        selected: null,
        recent: []
      },
      map: {
        zoom: 1,
        offset: { x: 0, y: 0 },
        selectedTiles: []
      },
      preferences: {
        theme: 'dark',
        autoSave: true,
        showGrid: true,
        snapToGrid: true
      },
      ui: {
        notifications: [],
        modals: [],
        contextMenus: []
      }
    };
  }

  /**
   * Get current state
   */
  getState() {
    return this.state;
  }

  /**
   * Get state slice
   */
  getStateSlice(path) {
    const keys = path.split('.');
    let current = this.state;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Update state with automatic batching
   */
  setState(updates, options = {}) {
    const update = {
      updates,
      options,
      timestamp: Date.now()
    };
    
    this.pendingUpdates.push(update);
    
    if (!this.updateScheduled) {
      this.updateScheduled = true;
      requestAnimationFrame(() => this.processPendingUpdates());
    }
  }

  /**
   * Process pending updates
   */
  processPendingUpdates() {
    if (this.pendingUpdates.length === 0) {
      this.updateScheduled = false;
      return;
    }
    
    // Batch updates
    const batchedUpdates = this.pendingUpdates.reduce((acc, update) => {
      return this.mergeUpdates(acc, update.updates);
    }, {});
    
    // Apply updates
    const oldState = this.state;
    const newState = this.applyUpdates(this.state, batchedUpdates);
    
    if (newState !== oldState) {
      this.state = newState;
      
      // Add to history if not a transient update
      const hasTransient = this.pendingUpdates.some(u => u.options.transient);
      if (!hasTransient) {
        this.addToHistory(newState);
      }
      
      // Calculate diff
      const diff = this.calculateDiff(oldState, newState);
      
      // Notify listeners
      this.notifyListeners(diff, oldState, newState);
    }
    
    // Clear pending updates
    this.pendingUpdates = [];
    this.updateScheduled = false;
  }

  /**
   * Apply updates immutably
   */
  applyUpdates(state, updates) {
    // Check cache
    const cached = this.stateCache.get(updates);
    if (cached && cached.base === state) {
      return cached.result;
    }
    
    const newState = this.deepUpdate(state, updates);
    
    // Cache result
    this.stateCache.set(updates, { base: state, result: newState });
    
    return newState;
  }

  /**
   * Deep update helper
   */
  deepUpdate(obj, updates) {
    if (!updates || typeof updates !== 'object') {
      return updates;
    }
    
    if (Array.isArray(updates)) {
      return updates;
    }
    
    const newObj = { ...obj };
    let changed = false;
    
    for (const key in updates) {
      const value = updates[key];
      
      if (value === undefined) {
        // Delete key
        if (key in newObj) {
          delete newObj[key];
          changed = true;
        }
      } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Nested update
        const nested = this.deepUpdate(newObj[key] || {}, value);
        if (nested !== newObj[key]) {
          newObj[key] = nested;
          changed = true;
        }
      } else {
        // Direct update
        if (newObj[key] !== value) {
          newObj[key] = value;
          changed = true;
        }
      }
    }
    
    return changed ? newObj : obj;
  }

  /**
   * Merge multiple updates
   */
  mergeUpdates(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeUpdates(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Calculate diff between states
   */
  calculateDiff(oldState, newState) {
    const diff = {
      added: {},
      removed: {},
      changed: {}
    };
    
    const compareObjects = (old, new_, path = '') => {
      // Check for additions and changes
      for (const key in new_) {
        const newPath = path ? `${path}.${key}` : key;
        
        if (!(key in old)) {
          diff.added[newPath] = new_[key];
        } else if (old[key] !== new_[key]) {
          if (typeof new_[key] === 'object' && typeof old[key] === 'object') {
            compareObjects(old[key], new_[key], newPath);
          } else {
            diff.changed[newPath] = { old: old[key], new: new_[key] };
          }
        }
      }
      
      // Check for removals
      for (const key in old) {
        if (!(key in new_)) {
          const newPath = path ? `${path}.${key}` : key;
          diff.removed[newPath] = old[key];
        }
      }
    };
    
    compareObjects(oldState, newState);
    return diff;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(path, callback) {
    const id = Symbol('listener');
    
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Map());
    }
    
    this.listeners.get(path).set(id, callback);
    
    // Return unsubscribe function
    return () => {
      const pathListeners = this.listeners.get(path);
      if (pathListeners) {
        pathListeners.delete(id);
        if (pathListeners.size === 0) {
          this.listeners.delete(path);
        }
      }
    };
  }

  /**
   * Notify listeners of changes
   */
  notifyListeners(diff, oldState, newState) {
    const notified = new Set();
    
    // Helper to get value at path
    const getValueAtPath = (obj, path) => {
      const keys = path.split('.');
      let current = obj;
      
      for (const key of keys) {
        if (current && key in current) {
          current = current[key];
        } else {
          return undefined;
        }
      }
      
      return current;
    };
    
    // Notify based on changes
    const checkAndNotify = (changedPath) => {
      for (const [listenPath, listeners] of this.listeners) {
        // Check if the changed path affects this listener
        if (changedPath.startsWith(listenPath) || listenPath.startsWith(changedPath)) {
          const oldValue = getValueAtPath(oldState, listenPath);
          const newValue = getValueAtPath(newState, listenPath);
          
          if (oldValue !== newValue) {
            for (const [id, callback] of listeners) {
              if (!notified.has(id)) {
                notified.add(id);
                callback(newValue, oldValue, diff);
              }
            }
          }
        }
      }
    };
    
    // Check all changed paths
    Object.keys(diff.added).forEach(checkAndNotify);
    Object.keys(diff.removed).forEach(checkAndNotify);
    Object.keys(diff.changed).forEach(checkAndNotify);
  }

  /**
   * Add state to history
   */
  addToHistory(state) {
    // Remove any forward history
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // Add new state
    this.history.push({
      state,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
    
    this.historyIndex = this.history.length - 1;
  }

  /**
   * Undo state change
   */
  undo() {
    if (this.canUndo()) {
      this.historyIndex--;
      this.state = this.history[this.historyIndex].state;
      
      // Notify listeners
      const oldState = this.history[this.historyIndex + 1].state;
      const diff = this.calculateDiff(oldState, this.state);
      this.notifyListeners(diff, oldState, this.state);
      
      // Announce to accessibility
      if (window.accessibilityManager) {
        window.accessibilityManager.announce('Action undone');
      }
      
      return true;
    }
    return false;
  }

  /**
   * Redo state change
   */
  redo() {
    if (this.canRedo()) {
      this.historyIndex++;
      this.state = this.history[this.historyIndex].state;
      
      // Notify listeners
      const oldState = this.history[this.historyIndex - 1].state;
      const diff = this.calculateDiff(oldState, this.state);
      this.notifyListeners(diff, oldState, this.state);
      
      // Announce to accessibility
      if (window.accessibilityManager) {
        window.accessibilityManager.announce('Action redone');
      }
      
      return true;
    }
    return false;
  }

  /**
   * Check if can undo
   */
  canUndo() {
    return this.historyIndex > 0;
  }

  /**
   * Check if can redo
   */
  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      }
      
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        this.redo();
      }
    });
  }

  /**
   * Monitor state size
   */
  monitorStateSize() {
    setInterval(() => {
      const size = this.estimateStateSize();
      
      if (size > 1024 * 1024) { // 1MB
        console.warn('State size is large:', (size / 1024 / 1024).toFixed(2) + 'MB');
        
        // Trim history if needed
        if (this.history.length > 10) {
          const trimCount = Math.floor(this.history.length / 2);
          this.history = this.history.slice(trimCount);
          this.historyIndex = Math.max(0, this.historyIndex - trimCount);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Estimate state size
   */
  estimateStateSize() {
    const jsonString = JSON.stringify(this.state);
    return jsonString.length * 2; // Approximate UTF-16 size
  }

  /**
   * Create selector for derived state
   */
  createSelector(dependencies, compute) {
    let lastDeps = [];
    let lastResult = null;
    
    return () => {
      const currentDeps = dependencies.map(dep => 
        typeof dep === 'function' ? dep() : this.getStateSlice(dep)
      );
      
      // Check if dependencies changed
      const changed = currentDeps.some((dep, i) => dep !== lastDeps[i]);
      
      if (changed || lastResult === null) {
        lastDeps = currentDeps;
        lastResult = compute(...currentDeps);
      }
      
      return lastResult;
    };
  }

  /**
   * Persist state to storage
   */
  async persistState() {
    try {
      const serialized = JSON.stringify({
        state: this.state,
        timestamp: Date.now()
      });
      
      // Send to extension for storage
      if (window.vscode) {
        window.vscode.postMessage({
          type: 'persistState',
          data: serialized
        });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to persist state:', error);
      return false;
    }
  }

  /**
   * Load persisted state
   */
  async loadPersistedState() {
    try {
      // Request state from extension
      if (window.vscode) {
        window.vscode.postMessage({
          type: 'loadPersistedState'
        });
        
        // Wait for response
        return new Promise((resolve) => {
          const handler = (event) => {
            if (event.data.type === 'persistedState') {
              window.removeEventListener('message', handler);
              
              if (event.data.data) {
                const { state } = JSON.parse(event.data.data);
                this.state = state;
                this.addToHistory(state);
                resolve(true);
              } else {
                resolve(false);
              }
            }
          };
          
          window.addEventListener('message', handler);
          
          // Timeout after 2 seconds
          setTimeout(() => {
            window.removeEventListener('message', handler);
            resolve(false);
          }, 2000);
        });
      }
      
      return false;
    } catch (error) {
      console.error('Failed to load persisted state:', error);
      return false;
    }
  }

  /**
   * Reset state
   */
  resetState() {
    this.state = this.createInitialState();
    this.history = [];
    this.historyIndex = -1;
    this.addToHistory(this.state);
    
    // Notify all listeners
    const diff = {
      added: {},
      removed: {},
      changed: { '': { old: null, new: this.state } }
    };
    
    this.notifyListeners(diff, null, this.state);
  }

  /**
   * Export state
   */
  exportState() {
    return {
      state: this.state,
      history: this.history,
      historyIndex: this.historyIndex,
      timestamp: Date.now()
    };
  }

  /**
   * Import state
   */
  importState(data) {
    if (data && data.state) {
      this.state = data.state;
      this.history = data.history || [{ state: data.state, timestamp: Date.now() }];
      this.historyIndex = data.historyIndex || this.history.length - 1;
      
      // Notify listeners
      const diff = {
        added: {},
        removed: {},
        changed: { '': { old: null, new: this.state } }
      };
      
      this.notifyListeners(diff, null, this.state);
      
      return true;
    }
    
    return false;
  }
}

// Create global instance
window.stateManager = new StateManager();

// Export for use in other modules
window.StateManager = StateManager;