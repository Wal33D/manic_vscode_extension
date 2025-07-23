# PluginAPI

## Properties

| Name | Type | Description |
|------|------|-------------|
| `events` | `{ on: (event: string, handler: (data: any) => void) => () => void; emit: (event: string, data?: any) => void; once: (event: string, handler: (data: any) => void) => () => void; }` |  |
| `state` | `{ get: <T>(key: string) => T | undefined; set: <T>(key: string, value: T) => boolean; subscribe: <T>(key: string, callback: (value: T) => void) => () => void; }` |  |
| `theme` | `{ getCurrent: () => any; getColor: (path: string) => string | undefined; onChange: (callback: (theme: any) => void) => () => void; } | undefined` |  |
| `workspace` | `{ getConfiguration: (section?: string | undefined) => WorkspaceConfiguration; onDidChangeConfiguration: (handler: (e: ConfigurationChangeEvent) => void) => Disposable; } | undefined` |  |
| `commands` | `{ register: (command: string, callback: (...args: any[]) => any) => Disposable; execute: (command: string, ...args: any[]) => Thenable<any>; }` |  |
| `ui` | `{ showMessage: (message: string, type?: "error" | "warning" | "info" | undefined) => Thenable<string | undefined>; showQuickPick: (items: string[], options?: any) => Thenable<string | undefined>; showInputBox: (options?: any) => Thenable<...>; createStatusBarItem: (alignment?: any, priority?: number | undefined) => ...` |  |
| `hooks` | `{ register: (hookName: string, handler: HookHandler) => () => void; }` |  |
| `storage` | `{ get: <T>(key: string) => Promise<T | undefined>; set: <T>(key: string, value: T) => Promise<void>; }` |  |

