import * as vscode from 'vscode';
import { eventBus } from './eventBus.js';
import { stateSync } from './stateSync.js';
import { themeManager } from './themeManager.js';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Plugin Manager for extensibility
 * Allows third-party developers to extend functionality
 */
export class PluginManager {
  private static instance: PluginManager;
  private plugins: Map<string, Plugin> = new Map();
  private activePlugins: Set<string> = new Set();
  private pluginAPIs: Map<string, PluginAPI> = new Map();
  private sandboxes: Map<string, PluginSandbox> = new Map();
  private hooks: Map<string, Set<HookHandler>> = new Map();
  private pluginStates: Map<string, any> = new Map();

  // Security
  private permissions: Map<string, PluginPermissions> = new Map();
  private blockedPlugins: Set<string> = new Set();

  // Plugin directories
  private builtinPluginsPath: string;
  private userPluginsPath: string;

  private constructor(context: vscode.ExtensionContext) {
    this.builtinPluginsPath = path.join(context.extensionPath, 'plugins');
    this.userPluginsPath = path.join(context.globalStorageUri.fsPath, 'plugins');

    this.initializePluginSystem();
    this.setupEventListeners();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(context?: vscode.ExtensionContext): PluginManager {
    if (!PluginManager.instance && context) {
      PluginManager.instance = new PluginManager(context);
    }
    return PluginManager.instance;
  }

  /**
   * Initialize plugin system
   */
  private async initializePluginSystem(): Promise<void> {
    // Ensure plugin directories exist
    await this.ensureDirectories();

    // Load built-in plugins
    await this.loadBuiltinPlugins();

    // Load user plugins
    await this.loadUserPlugins();

    // Register core hooks
    this.registerCoreHooks();
  }

  /**
   * Register a plugin
   */
  public async registerPlugin(manifest: PluginManifest, source: PluginSource): Promise<void> {
    // Validate manifest
    this.validateManifest(manifest);

    // Check if already registered
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin '${manifest.id}' is already registered`);
    }

    // Create plugin instance
    const plugin: Plugin = {
      manifest,
      source,
      status: 'inactive',
      loadTime: 0,
      errors: [],
    };

    // Register plugin
    this.plugins.set(manifest.id, plugin);

    // Set default permissions
    this.permissions.set(
      manifest.id,
      manifest.permissions || {
        filesystem: false,
        network: false,
        workspace: true,
        theme: false,
        commands: [],
      }
    );

    // Initialize plugin API
    this.createPluginAPI(manifest.id);

    // Emit registration event
    eventBus.emit('plugin:registered', { pluginId: manifest.id });
  }

  /**
   * Activate a plugin
   */
  public async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found`);
    }

    // Check if blocked
    if (this.blockedPlugins.has(pluginId)) {
      throw new Error(`Plugin '${pluginId}' is blocked`);
    }

    // Check if already active
    if (this.activePlugins.has(pluginId)) {
      return;
    }

    const startTime = performance.now();

    try {
      // Create sandbox
      const sandbox = await this.createSandbox(plugin);
      this.sandboxes.set(pluginId, sandbox);

      // Load plugin code
      const pluginModule = await this.loadPluginModule(plugin);

      // Get plugin API
      const api = this.pluginAPIs.get(pluginId)!;

      // Activate plugin
      if (pluginModule.activate) {
        const state = this.pluginStates.get(pluginId);
        await pluginModule.activate(api, state);
      }

      // Mark as active
      this.activePlugins.add(pluginId);
      plugin.status = 'active';
      plugin.loadTime = performance.now() - startTime;

      // Call activation hooks
      await this.callHook('plugin:activated', { pluginId, plugin });

      // Emit activation event
      eventBus.emit('plugin:activated', { pluginId });

      // Show notification
      if (plugin.manifest.displayName) {
        vscode.window.setStatusBarMessage(
          `Plugin '${plugin.manifest.displayName}' activated`,
          3000
        );
      }
    } catch (error) {
      plugin.status = 'error';
      plugin.errors.push({
        message: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });

      // Clean up
      this.sandboxes.delete(pluginId);

      throw error;
    }
  }

  /**
   * Deactivate a plugin
   */
  public async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !this.activePlugins.has(pluginId)) {
      return;
    }

    try {
      // Get plugin module from sandbox
      const sandbox = this.sandboxes.get(pluginId);
      if (sandbox && sandbox.module?.deactivate) {
        await sandbox.module.deactivate();
      }

      // Save plugin state
      if (sandbox && sandbox.module?.getState) {
        const state = await sandbox.module.getState();
        this.pluginStates.set(pluginId, state);
      }

      // Clean up sandbox
      this.sandboxes.delete(pluginId);

      // Mark as inactive
      this.activePlugins.delete(pluginId);
      plugin.status = 'inactive';

      // Call deactivation hooks
      await this.callHook('plugin:deactivated', { pluginId });

      // Emit deactivation event
      eventBus.emit('plugin:deactivated', { pluginId });
    } catch (error) {
      plugin.errors.push({
        message: `Deactivation error: ${error}`,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Get all plugins
   */
  public getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get active plugins
   */
  public getActivePlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(p => this.activePlugins.has(p.manifest.id));
  }

  /**
   * Get plugin by ID
   */
  public getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Install plugin from VSIX
   */
  public async installPlugin(vsixPath: string): Promise<string> {
    // Extract plugin manifest
    const manifest = await this.extractManifestFromVSIX(vsixPath);

    // Validate manifest
    this.validateManifest(manifest);

    // Check if already installed
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin '${manifest.id}' is already installed`);
    }

    // Extract plugin to user plugins directory
    const pluginDir = path.join(this.userPluginsPath, manifest.id);
    await this.extractVSIX(vsixPath, pluginDir);

    // Register plugin
    await this.registerPlugin(manifest, {
      type: 'user',
      path: pluginDir,
    });

    // Auto-activate if specified
    if (manifest.activationEvents?.includes('*')) {
      await this.activatePlugin(manifest.id);
    }

    return manifest.id;
  }

  /**
   * Uninstall plugin
   */
  public async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found`);
    }

    // Deactivate if active
    if (this.activePlugins.has(pluginId)) {
      await this.deactivatePlugin(pluginId);
    }

    // Remove from registry
    this.plugins.delete(pluginId);
    this.permissions.delete(pluginId);
    this.pluginAPIs.delete(pluginId);
    this.pluginStates.delete(pluginId);

    // Remove files if user plugin
    if (plugin.source.type === 'user') {
      await fs.promises.rmdir(plugin.source.path, { recursive: true });
    }

    // Emit uninstall event
    eventBus.emit('plugin:uninstalled', { pluginId });
  }

  /**
   * Register a hook
   */
  public registerHook(hookName: string, handler: HookHandler): Unsubscribe {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, new Set());
    }

    this.hooks.get(hookName)!.add(handler);

    return () => {
      const handlers = this.hooks.get(hookName);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.hooks.delete(hookName);
        }
      }
    };
  }

  /**
   * Call hook handlers
   */
  private async callHook(hookName: string, data: any): Promise<any[]> {
    const handlers = this.hooks.get(hookName);
    if (!handlers) {
      return [];
    }

    const results: any[] = [];

    for (const handler of handlers) {
      try {
        const result = await handler(data);
        results.push(result);
      } catch (error) {
        console.error(`Hook handler error for '${hookName}':`, error);
      }
    }

    return results;
  }

  /**
   * Create plugin API
   */
  private createPluginAPI(pluginId: string): void {
    const permissions = this.permissions.get(pluginId)!;

    const api: PluginAPI = {
      // Event system access
      events: {
        on: (event, handler) => {
          return eventBus.on(`plugin:${pluginId}:${event}`, {
            callback: handler,
          });
        },
        emit: (event, data) => {
          eventBus.emit(`plugin:${pluginId}:${event}`, data);
        },
        once: (event, handler) => {
          return eventBus.once(`plugin:${pluginId}:${event}`, {
            callback: handler,
          });
        },
      },

      // State management access
      state: {
        get: key => stateSync.getState(`plugin:${pluginId}:${key}`),
        set: (key, value) => stateSync.setState(`plugin:${pluginId}:${key}`, value, pluginId),
        subscribe: (key, callback) => {
          return stateSync.subscribe(`plugin:${pluginId}:${key}`, callback);
        },
      },

      // Theme access (if permitted)
      theme: permissions.theme
        ? {
            getCurrent: () => themeManager.getCurrentTheme(),
            getColor: path => themeManager.getColor(path),
            onChange: callback => themeManager.observe(callback),
          }
        : undefined,

      // Workspace access (if permitted)
      workspace: permissions.workspace
        ? {
            getConfiguration: (section?: string) => {
              return vscode.workspace.getConfiguration(section);
            },
            onDidChangeConfiguration: handler => {
              return vscode.workspace.onDidChangeConfiguration(handler);
            },
          }
        : undefined,

      // Commands (filtered by permissions)
      commands: {
        register: (command, callback) => {
          if (!permissions.commands.includes(command)) {
            throw new Error(`Plugin does not have permission for command: ${command}`);
          }
          return vscode.commands.registerCommand(`${pluginId}.${command}`, callback);
        },
        execute: async (command, ...args) => {
          if (!permissions.commands.includes('*') && !permissions.commands.includes(command)) {
            throw new Error(`Plugin does not have permission to execute: ${command}`);
          }
          return vscode.commands.executeCommand(command, ...args);
        },
      },

      // UI capabilities
      ui: {
        showMessage: (message, type = 'info') => {
          switch (type) {
            case 'error':
              return vscode.window.showErrorMessage(message);
            case 'warning':
              return vscode.window.showWarningMessage(message);
            default:
              return vscode.window.showInformationMessage(message);
          }
        },
        showQuickPick: (items: string[], options?: any) => {
          return vscode.window.showQuickPick(items, options) as any;
        },
        showInputBox: options => {
          return vscode.window.showInputBox(options);
        },
        createStatusBarItem: (alignment, priority) => {
          return vscode.window.createStatusBarItem(alignment, priority);
        },
      },

      // Hook system
      hooks: {
        register: (hookName, handler) => {
          return this.registerHook(`${pluginId}:${hookName}`, handler);
        },
      },

      // Storage
      storage: {
        get: async key => {
          const context = await this.getStorageContext();
          return context.globalState.get(`${pluginId}:${key}`);
        },
        set: async (key, value) => {
          const context = await this.getStorageContext();
          return context.globalState.update(`${pluginId}:${key}`, value);
        },
      },
    };

    this.pluginAPIs.set(pluginId, api);
  }

  /**
   * Create plugin sandbox
   */
  private async createSandbox(plugin: Plugin): Promise<PluginSandbox> {
    // Create isolated context
    const sandbox: PluginSandbox = {
      pluginId: plugin.manifest.id,
      permissions: this.permissions.get(plugin.manifest.id)!,
      context: {
        extensionPath: plugin.source.path,
        globalState: new Map(),
        workspaceState: new Map(),
      },
    };

    return sandbox;
  }

  /**
   * Load plugin module
   */
  private async loadPluginModule(plugin: Plugin): Promise<any> {
    const mainPath = path.join(plugin.source.path, plugin.manifest.main || 'index.js');

    try {
      // Load module
      const module = await import(mainPath);

      // Store in sandbox
      const sandbox = this.sandboxes.get(plugin.manifest.id);
      if (sandbox) {
        sandbox.module = module;
      }

      return module;
    } catch (error) {
      throw new Error(`Failed to load plugin module: ${error}`);
    }
  }

  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: PluginManifest): void {
    // Required fields
    if (!manifest.id) {
      throw new Error('Plugin manifest missing required field: id');
    }

    if (!manifest.name) {
      throw new Error('Plugin manifest missing required field: name');
    }

    if (!manifest.version) {
      throw new Error('Plugin manifest missing required field: version');
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      throw new Error('Invalid plugin version format. Use semver (e.g., 1.0.0)');
    }

    // Validate ID format
    if (!/^[a-z0-9-]+$/.test(manifest.id)) {
      throw new Error('Plugin ID must contain only lowercase letters, numbers, and hyphens');
    }
  }

  /**
   * Load built-in plugins
   */
  private async loadBuiltinPlugins(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.builtinPluginsPath);

      for (const file of files) {
        const pluginPath = path.join(this.builtinPluginsPath, file);
        const stats = await fs.promises.stat(pluginPath);

        if (stats.isDirectory()) {
          const manifestPath = path.join(pluginPath, 'package.json');

          if (fs.existsSync(manifestPath)) {
            const manifest = JSON.parse(
              await fs.promises.readFile(manifestPath, 'utf-8')
            ) as PluginManifest;

            await this.registerPlugin(manifest, {
              type: 'builtin',
              path: pluginPath,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load built-in plugins:', error);
    }
  }

  /**
   * Load user plugins
   */
  private async loadUserPlugins(): Promise<void> {
    try {
      if (!fs.existsSync(this.userPluginsPath)) {
        return;
      }

      const files = await fs.promises.readdir(this.userPluginsPath);

      for (const file of files) {
        const pluginPath = path.join(this.userPluginsPath, file);
        const stats = await fs.promises.stat(pluginPath);

        if (stats.isDirectory()) {
          const manifestPath = path.join(pluginPath, 'package.json');

          if (fs.existsSync(manifestPath)) {
            try {
              const manifest = JSON.parse(
                await fs.promises.readFile(manifestPath, 'utf-8')
              ) as PluginManifest;

              await this.registerPlugin(manifest, {
                type: 'user',
                path: pluginPath,
              });
            } catch (error) {
              console.error(`Failed to load user plugin from ${pluginPath}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load user plugins:', error);
    }
  }

  /**
   * Register core hooks
   */
  private registerCoreHooks(): void {
    // Map editor hooks
    this.registerHook('editor:beforeSave', async data => {
      const results = await this.callHook('beforeSave', data);
      return results.every(r => r !== false);
    });

    this.registerHook('editor:afterSave', async data => {
      await this.callHook('afterSave', data);
    });

    // Tool hooks
    this.registerHook('tool:beforeChange', async data => {
      const results = await this.callHook('beforeToolChange', data);
      return results.every(r => r !== false);
    });

    // Theme hooks
    this.registerHook('theme:beforeChange', async data => {
      const results = await this.callHook('beforeThemeChange', data);
      return results.every(r => r !== false);
    });
  }

  /**
   * Ensure plugin directories exist
   */
  private async ensureDirectories(): Promise<void> {
    // Create user plugins directory if it doesn't exist
    if (!fs.existsSync(this.userPluginsPath)) {
      await fs.promises.mkdir(this.userPluginsPath, { recursive: true });
    }
  }

  /**
   * Extract manifest from VSIX
   */
  private async extractManifestFromVSIX(_vsixPath: string): Promise<PluginManifest> {
    // This would use a zip library to extract package.json from VSIX
    // For now, return a mock implementation
    throw new Error('VSIX extraction not implemented');
  }

  /**
   * Extract VSIX to directory
   */
  private async extractVSIX(_vsixPath: string, _targetDir: string): Promise<void> {
    // This would use a zip library to extract VSIX contents
    // For now, return a mock implementation
    throw new Error('VSIX extraction not implemented');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for activation events
    eventBus.on('workspace:ready', {
      callback: () => {
        // Auto-activate plugins with * activation
        for (const plugin of this.plugins.values()) {
          if (plugin.manifest.activationEvents?.includes('*')) {
            this.activatePlugin(plugin.manifest.id).catch(console.error);
          }
        }
      },
    });

    // Listen for command activation
    eventBus.on('command:executed', {
      callback: (data: any) => {
        // Check if any plugins should activate on this command
        for (const plugin of this.plugins.values()) {
          if (plugin.manifest.activationEvents?.includes(`onCommand:${data.command}`)) {
            this.activatePlugin(plugin.manifest.id).catch(console.error);
          }
        }
      },
    });
  }

  /**
   * Get storage context
   */
  private async getStorageContext(): Promise<vscode.ExtensionContext> {
    // This would return the actual extension context
    // For now, throw an error
    throw new Error('Storage context not available');
  }
}

// Type definitions
export interface Plugin {
  manifest: PluginManifest;
  source: PluginSource;
  status: 'active' | 'inactive' | 'error';
  loadTime: number;
  errors: PluginError[];
}

export interface PluginManifest {
  id: string;
  name: string;
  displayName?: string;
  version: string;
  description?: string;
  author?: string;
  main?: string;
  activationEvents?: string[];
  contributes?: PluginContributions;
  permissions?: PluginPermissions;
  dependencies?: Record<string, string>;
}

export interface PluginSource {
  type: 'builtin' | 'user' | 'dev';
  path: string;
}

export interface PluginPermissions {
  filesystem?: boolean;
  network?: boolean;
  workspace?: boolean;
  theme?: boolean;
  commands: string[];
}

export interface PluginContributions {
  commands?: PluginCommand[];
  menus?: Record<string, PluginMenuItem[]>;
  keybindings?: PluginKeybinding[];
  themes?: PluginTheme[];
  tools?: PluginTool[];
}

export interface PluginCommand {
  command: string;
  title: string;
  category?: string;
  icon?: string;
}

export interface PluginMenuItem {
  command: string;
  when?: string;
  group?: string;
}

export interface PluginKeybinding {
  command: string;
  key: string;
  mac?: string;
  when?: string;
}

export interface PluginTheme {
  id: string;
  label: string;
  path: string;
}

export interface PluginTool {
  id: string;
  name: string;
  icon: string;
  handler: string;
}

export interface PluginError {
  message: string;
  timestamp: number;
  stack?: string;
}

export interface PluginSandbox {
  pluginId: string;
  permissions: PluginPermissions;
  context: any;
  module?: any;
}

export interface PluginAPI {
  events: {
    on: (event: string, handler: (data: any) => void) => () => void;
    emit: (event: string, data?: any) => void;
    once: (event: string, handler: (data: any) => void) => () => void;
  };
  state: {
    get: <T>(key: string) => T | undefined;
    set: <T>(key: string, value: T) => boolean;
    subscribe: <T>(key: string, callback: (value: T) => void) => () => void;
  };
  theme?: {
    getCurrent: () => any;
    getColor: (path: string) => string | undefined;
    onChange: (callback: (theme: any) => void) => () => void;
  };
  workspace?: {
    getConfiguration: (section?: string) => vscode.WorkspaceConfiguration;
    onDidChangeConfiguration: (
      handler: (e: vscode.ConfigurationChangeEvent) => void
    ) => vscode.Disposable;
  };
  commands: {
    register: (command: string, callback: (...args: any[]) => any) => vscode.Disposable;
    execute: (command: string, ...args: any[]) => Thenable<any>;
  };
  ui: {
    showMessage: (
      message: string,
      type?: 'info' | 'warning' | 'error'
    ) => Thenable<string | undefined>;
    showQuickPick: (items: string[], options?: any) => Thenable<string | undefined>;
    showInputBox: (options?: any) => Thenable<string | undefined>;
    createStatusBarItem: (alignment?: any, priority?: number) => vscode.StatusBarItem;
  };
  hooks: {
    register: (hookName: string, handler: HookHandler) => () => void;
  };
  storage: {
    get: <T>(key: string) => Promise<T | undefined>;
    set: <T>(key: string, value: T) => Promise<void>;
  };
}

export type HookHandler = (data: any) => any | Promise<any>;
export type Unsubscribe = () => void;

// Export function to get instance
export function getPluginManager(context?: vscode.ExtensionContext): PluginManager | undefined {
  return context ? PluginManager.getInstance(context) : undefined;
}
