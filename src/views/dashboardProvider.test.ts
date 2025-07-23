import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import * as vscode from 'vscode';
import { DashboardProvider } from './dashboardProvider';

describe('DashboardProvider', () => {
  let provider: DashboardProvider;
  let mockContext: vscode.ExtensionContext;
  let mockWebviewView: vscode.WebviewView;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock extension context
    mockContext = {
      subscriptions: [],
      extensionUri: vscode.Uri.file('/test/extension'),
      globalState: {
        get: jest.fn(),
        update: jest.fn(),
      },
    } as any;

    // Mock webview view
    mockWebviewView = {
      webview: {
        html: '',
        options: {},
        asWebviewUri: jest.fn(uri => uri),
        onDidReceiveMessage: jest.fn(() => ({ dispose: jest.fn() })),
        postMessage: jest.fn(),
      },
      visible: true,
      show: jest.fn(),
      title: '',
      description: '',
      onDidChangeVisibility: jest.fn(() => ({ dispose: jest.fn() })),
      onDidDispose: jest.fn(() => ({ dispose: jest.fn() })),
    } as any;
  });

  describe('register', () => {
    it('should register the provider and return a disposable', () => {
      const result = DashboardProvider.register(mockContext);

      expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalledWith(
        'manicMiners.dashboard',
        expect.objectContaining({
          context: mockContext,
        }),
        expect.objectContaining({
          webviewOptions: expect.objectContaining({
            retainContextWhenHidden: true,
          }),
        })
      );
      expect(result).toBeDefined();
    });
  });

  describe('resolveWebviewView', () => {
    beforeEach(() => {
      DashboardProvider.register(mockContext);
      provider = (vscode.window.registerWebviewViewProvider as jest.Mock).mock
        .calls[0][1] as DashboardProvider;
    });

    it('should set webview options correctly', () => {
      provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

      expect(mockWebviewView.webview.options).toEqual({
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(mockContext.extensionUri, 'media')],
      });
    });

    it('should set initial HTML content', () => {
      provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

      expect(mockWebviewView.webview.html).toBeTruthy();
      expect(mockWebviewView.webview.html).toContain('Manic Miners Dashboard');
      expect(mockWebviewView.webview.html).toContain('Current Map');
    });

    it('should handle runCommand message', async () => {
      provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

      // Get the message handler
      const messageHandler = (mockWebviewView.webview.onDidReceiveMessage as jest.Mock).mock
        .calls[0][0] as (message: any) => Promise<void>;

      // Simulate runCommand message
      await messageHandler({ command: 'runCommand', commandId: 'manicMiners.newMap' });

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('manicMiners.newMap', undefined);
    });

    it('should handle refreshStats message', async () => {
      provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

      const messageHandler = (mockWebviewView.webview.onDidReceiveMessage as jest.Mock).mock
        .calls[0][0] as (message: any) => Promise<void>;

      // Mock the updateStats method
      const updateStatsSpy = jest.spyOn(provider as any, 'updateStats');

      // Simulate refreshStats message
      await messageHandler({ command: 'refreshStats' });

      expect(updateStatsSpy).toHaveBeenCalled();
    });

    it('should handle openInMapEditor message with current map', async () => {
      provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

      // Set a current map URI
      (provider as any).currentMapUri = vscode.Uri.file('/test/map.dat');

      const messageHandler = (mockWebviewView.webview.onDidReceiveMessage as jest.Mock).mock
        .calls[0][0] as (message: any) => Promise<void>;

      // Simulate openInMapEditor message
      await messageHandler({ command: 'openInMapEditor' });

      // Check that map editor command is executed
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('manicMiners.openMapEditor');
    });
  });

  describe('HTML generation', () => {
    beforeEach(() => {
      DashboardProvider.register(mockContext);
      provider = (vscode.window.registerWebviewViewProvider as jest.Mock).mock
        .calls[0][1] as DashboardProvider;
    });

    it('should include required scripts and styles', () => {
      provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

      const html = mockWebviewView.webview.html;

      // Check for style sheet (the actual URI will contain more path info)
      expect(html).toMatch(/href="[^"]*dashboard\.css"/);

      // Check for script (the actual URI will contain more path info)
      expect(html).toMatch(/src="[^"]*dashboard\.js"/);

      // Check for main sections
      expect(html).toContain('Current Map');
      expect(html).toContain('Quick Actions');
      expect(html).toContain('Recent Maps');
      expect(html).toContain('Extension Statistics');
    });

    it('should include quick action buttons', () => {
      provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

      const html = mockWebviewView.webview.html;

      // Check for quick action buttons
      expect(html).toContain('New Map');
      expect(html).toContain('Edit Map');
      expect(html).toContain('Validate');
      expect(html).toContain('Analyze');
    });
  });
});
