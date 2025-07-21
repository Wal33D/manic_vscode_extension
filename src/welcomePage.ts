import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class WelcomePageProvider {
  private static readonly viewType = 'manicMinersWelcome';
  private panel: vscode.WebviewPanel | undefined;

  constructor(private readonly context: vscode.ExtensionContext) {}

  public async show(): Promise<void> {
    // If panel already exists, reveal it
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    // Create new panel
    this.panel = vscode.window.createWebviewPanel(
      WelcomePageProvider.viewType,
      'Welcome to Manic Miners',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(this.context.extensionPath, 'media')),
          vscode.Uri.file(path.join(this.context.extensionPath, 'images')),
          vscode.Uri.file(path.join(this.context.extensionPath, 'sample')),
        ],
      }
    );

    this.panel.webview.html = this.getWebviewContent(this.panel.webview);

    // Send initial data
    this.panel.webview.postMessage({
      type: 'init',
      version: '0.3.0', // Get from package.json
      recentMaps: this.getRecentMaps(),
      stats: this.getExtensionStats(),
    });

    // Handle panel disposal
    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
      },
      null,
      this.context.subscriptions
    );

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.command) {
          case 'openDoc':
            await this.openDocument(message.url);
            break;
          case 'openSettings':
            await vscode.commands.executeCommand('workbench.action.openSettings', 'manicMiners');
            break;
          case 'openSample':
            await this.openSampleFile(message.sampleName);
            break;
          case 'runCommand':
            await vscode.commands.executeCommand(message.commandId);
            break;
          case 'openRecent':
            await this.openRecentMap(message.path);
            break;
          case 'clearRecent':
            await this.clearRecentMaps();
            break;
          case 'openFolder':
            await vscode.commands.executeCommand('vscode.openFolder');
            break;
          case 'openExternal':
            await vscode.env.openExternal(vscode.Uri.parse(message.url));
            break;
          case 'showNotification':
            vscode.window.showInformationMessage(message.text);
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  private getWebviewContent(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'welcome.css'))
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'welcome.js'))
    );

    const iconUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.context.extensionPath, 'images', 'icon.png'))
    );

    // Get building images
    const buildingImages = {
      toolStore: webview.asWebviewUri(
        vscode.Uri.file(
          path.join(this.context.extensionPath, 'images', 'buildings', 'tool_store.png')
        )
      ),
      powerStation: webview.asWebviewUri(
        vscode.Uri.file(
          path.join(this.context.extensionPath, 'images', 'buildings', 'power_station.png')
        )
      ),
      teleportPad: webview.asWebviewUri(
        vscode.Uri.file(
          path.join(this.context.extensionPath, 'images', 'buildings', 'teleport_pad.png')
        )
      ),
      docks: webview.asWebviewUri(
        vscode.Uri.file(path.join(this.context.extensionPath, 'images', 'buildings', 'docks.png'))
      ),
    };

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Manic Miners</title>
            <link href="${styleUri}" rel="stylesheet">
        </head>
        <body>
            <div class="loading-overlay active" id="loadingOverlay">
                <div class="loader"></div>
            </div>
            
            <div class="container">
                <header class="animated-header">
                    <div class="header-background"></div>
                    <img src="${iconUri}" alt="Manic Miners" class="logo animated">
                    <h1 class="animated-title">Welcome to Manic Miners DAT File Support</h1>
                    <p class="subtitle animated-subtitle">The complete toolkit for creating and editing Manic Miners maps</p>
                    <div class="version-badge">v<span id="versionNumber">0.3.0</span></div>
                </header>

                <!-- Stats Dashboard -->
                <section class="stats-dashboard" id="statsDashboard">
                    <div class="stat-card">
                        <span class="stat-icon">📊</span>
                        <div class="stat-content">
                            <h4>Maps Created</h4>
                            <p class="stat-value" id="mapsCreated">0</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-icon">⏱️</span>
                        <div class="stat-content">
                            <h4>Time Saved</h4>
                            <p class="stat-value" id="timeSaved">0h</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-icon">🔧</span>
                        <div class="stat-content">
                            <h4>Quick Actions</h4>
                            <p class="stat-value" id="quickActions">0</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-icon">🎯</span>
                        <div class="stat-content">
                            <h4>Objectives Built</h4>
                            <p class="stat-value" id="objectivesBuilt">0</p>
                        </div>
                    </div>
                </section>

                <!-- Recent Files -->
                <section class="recent-files" id="recentSection" style="display: none;">
                    <div class="section-header">
                        <h2>📂 Recent Maps</h2>
                        <button class="clear-button" onclick="clearRecent()">Clear All</button>
                    </div>
                    <div class="recent-grid" id="recentGrid">
                        <!-- Recent files will be populated here -->
                    </div>
                </section>

                <!-- Interactive Tutorial -->
                <section class="interactive-tutorial">
                    <h2>🎓 Interactive Tutorial</h2>
                    <div class="tutorial-container">
                        <div class="tutorial-steps">
                            <div class="tutorial-step active" data-step="1">
                                <div class="step-number">1</div>
                                <div class="step-content">
                                    <h4>Create Your First Map</h4>
                                    <p>Start with a blank canvas or use a template</p>
                                    <button class="mini-button" onclick="startTutorial('create')">Start</button>
                                </div>
                            </div>
                            <div class="tutorial-step" data-step="2">
                                <div class="step-number">2</div>
                                <div class="step-content">
                                    <h4>Add Tiles & Terrain</h4>
                                    <p>Design your cave layout with smart tools</p>
                                    <button class="mini-button" onclick="startTutorial('tiles')">Learn</button>
                                </div>
                            </div>
                            <div class="tutorial-step" data-step="3">
                                <div class="step-number">3</div>
                                <div class="step-content">
                                    <h4>Script Your Logic</h4>
                                    <p>Add objectives and dynamic events</p>
                                    <button class="mini-button" onclick="startTutorial('script')">Explore</button>
                                </div>
                            </div>
                            <div class="tutorial-step" data-step="4">
                                <div class="step-number">4</div>
                                <div class="step-content">
                                    <h4>Test & Share</h4>
                                    <p>Validate and export your creation</p>
                                    <button class="mini-button" onclick="startTutorial('test')">Finish</button>
                                </div>
                            </div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 25%;"></div>
                        </div>
                    </div>
                </section>

                <!-- Enhanced Features -->
                <section class="features enhanced">
                    <h2>🚀 Powerful Features</h2>
                    <div class="feature-tabs">
                        <button class="tab-button active" onclick="showFeatureTab('editing')">Editing</button>
                        <button class="tab-button" onclick="showFeatureTab('analysis')">Analysis</button>
                        <button class="tab-button" onclick="showFeatureTab('automation')">Automation</button>
                        <button class="tab-button" onclick="showFeatureTab('visualization')">Visualization</button>
                    </div>
                    <div class="feature-content">
                        <div class="feature-tab active" id="editing-tab">
                            <div class="feature-grid">
                                <div class="feature-card interactive" onclick="runCommand('manicMiners.fillArea')">
                                    <span class="icon">🎨</span>
                                    <h3>Smart Fill Tool</h3>
                                    <p>Fill areas with intelligent pattern recognition</p>
                                    <span class="try-it">Try it →</span>
                                </div>
                                <div class="feature-card interactive" onclick="runCommand('manicMiners.showObjectiveBuilder')">
                                    <span class="icon">🎯</span>
                                    <h3>Objective Builder</h3>
                                    <p>Visual objective creation with validation</p>
                                    <span class="try-it">Try it →</span>
                                </div>
                                <div class="feature-card interactive" onclick="runCommand('manicMiners.replaceAll')">
                                    <span class="icon">🔄</span>
                                    <h3>Replace All</h3>
                                    <p>Batch replace tiles across your map</p>
                                    <span class="try-it">Try it →</span>
                                </div>
                                <div class="feature-card interactive" onclick="runCommand('manicMiners.showUndoRedoHistory')">
                                    <span class="icon">↩️</span>
                                    <h3>Visual History</h3>
                                    <p>See and navigate your edit history</p>
                                    <span class="try-it">Try it →</span>
                                </div>
                            </div>
                        </div>
                        <div class="feature-tab" id="analysis-tab">
                            <div class="feature-grid">
                                <div class="feature-card interactive" onclick="runCommand('manicMiners.showHeatMap')">
                                    <span class="icon">🔥</span>
                                    <h3>Heat Map Analysis</h3>
                                    <p>Visualize pathfinding and accessibility</p>
                                    <span class="try-it">Try it →</span>
                                </div>
                                <div class="feature-card interactive" onclick="runCommand('manicMiners.validateMap')">
                                    <span class="icon">✅</span>
                                    <h3>Map Validator</h3>
                                    <p>Check for errors and balance issues</p>
                                    <span class="try-it">Try it →</span>
                                </div>
                                <div class="feature-card interactive" onclick="runCommand('manicMiners.analyzeTilePatterns')">
                                    <span class="icon">📊</span>
                                    <h3>Pattern Analysis</h3>
                                    <p>Discover tile usage patterns</p>
                                    <span class="try-it">Try it →</span>
                                </div>
                                <div class="feature-card interactive" onclick="runCommand('manicMiners.showMapDiff')">
                                    <span class="icon">🔍</span>
                                    <h3>Map Comparison</h3>
                                    <p>Compare versions side by side</p>
                                    <span class="try-it">Try it →</span>
                                </div>
                            </div>
                        </div>
                        <div class="feature-tab" id="automation-tab">
                            <div class="feature-grid">
                                <div class="feature-card interactive" onclick="runCommand('manicMiners.generateCave')">
                                    <span class="icon">🏔️</span>
                                    <h3>Cave Generator</h3>
                                    <p>Generate realistic cave systems</p>
                                    <span class="try-it">Try it →</span>
                                </div>
                                <div class="feature-card interactive" onclick="runCommand('manicMiners.showSmartSuggestions')">
                                    <span class="icon">💡</span>
                                    <h3>Smart Suggestions</h3>
                                    <p>AI-powered tile recommendations</p>
                                    <span class="try-it">Try it →</span>
                                </div>
                                <div class="feature-card interactive" onclick="runCommand('manicMiners.createVersion')">
                                    <span class="icon">📸</span>
                                    <h3>Version Control</h3>
                                    <p>Save and manage map versions</p>
                                    <span class="try-it">Try it →</span>
                                </div>
                                <div class="feature-card interactive" onclick="runCommand('manicMiners.batchValidate')">
                                    <span class="icon">🔄</span>
                                    <h3>Batch Operations</h3>
                                    <p>Process multiple maps at once</p>
                                    <span class="try-it">Try it →</span>
                                </div>
                            </div>
                        </div>
                        <div class="feature-tab" id="visualization-tab">
                            <div class="feature-grid">
                                <div class="feature-card interactive" onclick="runCommand('manicMiners.show3DTerrain')">
                                    <span class="icon">🌄</span>
                                    <h3>3D Terrain View</h3>
                                    <p>Visualize height maps in 3D</p>
                                    <span class="try-it">Try it →</span>
                                </div>
                                <div class="feature-card interactive" onclick="runCommand('manicMiners.showMapPreview')">
                                    <span class="icon">🗺️</span>
                                    <h3>Live Preview</h3>
                                    <p>Real-time map visualization</p>
                                    <span class="try-it">Try it →</span>
                                </div>
                                <div class="feature-card interactive" onclick="runCommand('manicMiners.exportPNG')">
                                    <span class="icon">🖼️</span>
                                    <h3>Export to Image</h3>
                                    <p>Create high-quality map images</p>
                                    <span class="try-it">Try it →</span>
                                </div>
                                <div class="feature-card interactive" onclick="runCommand('manicMiners.showAccessiblePreview')">
                                    <span class="icon">♿</span>
                                    <h3>Accessible View</h3>
                                    <p>Screen reader friendly preview</p>
                                    <span class="try-it">Try it →</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Sample Maps Gallery -->
                <section class="sample-gallery">
                    <h2>🎮 Sample Maps</h2>
                    <div class="gallery-grid">
                        <div class="gallery-item" onclick="openSample('Tutorial01')">
                            <div class="gallery-preview tutorial">
                                <span class="map-icon">🎓</span>
                            </div>
                            <h4>Tutorial 01</h4>
                            <p>Learn the basics</p>
                        </div>
                        <div class="gallery-item" onclick="openSample('CrystalHunt')">
                            <div class="gallery-preview campaign">
                                <span class="map-icon">💎</span>
                            </div>
                            <h4>Crystal Hunt</h4>
                            <p>Resource collection</p>
                        </div>
                        <div class="gallery-item" onclick="openSample('DefensePoint')">
                            <div class="gallery-preview community">
                                <span class="map-icon">🛡️</span>
                            </div>
                            <h4>Defense Point</h4>
                            <p>Defend your base</p>
                        </div>
                        <div class="gallery-item" onclick="openFolder()">
                            <div class="gallery-preview browse">
                                <span class="map-icon">📁</span>
                            </div>
                            <h4>Browse More</h4>
                            <p>Open sample folder</p>
                        </div>
                    </div>
                </section>

                <!-- Building Reference -->
                <section class="building-reference">
                    <h2>🏗️ Building Reference</h2>
                    <div class="building-grid">
                        <div class="building-card">
                            <img src="${buildingImages.toolStore}" alt="Tool Store">
                            <h4>Tool Store</h4>
                            <code>ToolStore</code>
                        </div>
                        <div class="building-card">
                            <img src="${buildingImages.powerStation}" alt="Power Station">
                            <h4>Power Station</h4>
                            <code>PowerStation</code>
                        </div>
                        <div class="building-card">
                            <img src="${buildingImages.teleportPad}" alt="Teleport Pad">
                            <h4>Teleport Pad</h4>
                            <code>TeleportPad</code>
                        </div>
                        <div class="building-card">
                            <img src="${buildingImages.docks}" alt="Docks">
                            <h4>Docks</h4>
                            <code>Docks</code>
                        </div>
                    </div>
                    <button class="action-button secondary" onclick="openDoc('game-reference/format/sections/buildings.md')">
                        View All Buildings →
                    </button>
                </section>

                <!-- Quick Actions -->
                <section class="quick-start enhanced">
                    <h2>⚡ Quick Actions</h2>
                    <div class="quick-action-grid">
                        <button class="quick-action-card" onclick="runCommand('manicMiners.newFile')">
                            <span class="icon">📄</span>
                            <h4>New Map</h4>
                            <p>Start fresh</p>
                        </button>
                        <button class="quick-action-card" onclick="runCommand('manicMiners.showMapPreview')">
                            <span class="icon">👁️</span>
                            <h4>Preview</h4>
                            <p>Live preview</p>
                        </button>
                        <button class="quick-action-card" onclick="runCommand('manicMiners.validateMap')">
                            <span class="icon">✅</span>
                            <h4>Validate</h4>
                            <p>Check errors</p>
                        </button>
                        <button class="quick-action-card" onclick="runCommand('manicMiners.showHeatMap')">
                            <span class="icon">🔥</span>
                            <h4>Heat Map</h4>
                            <p>Analyze paths</p>
                        </button>
                        <button class="quick-action-card" onclick="runCommand('manicMiners.fillArea')">
                            <span class="icon">🎨</span>
                            <h4>Fill Area</h4>
                            <p>Smart fill</p>
                        </button>
                        <button class="quick-action-card" onclick="runCommand('manicMiners.showObjectiveBuilder')">
                            <span class="icon">🎯</span>
                            <h4>Objectives</h4>
                            <p>Build goals</p>
                        </button>
                        <button class="quick-action-card" onclick="runCommand('manicMiners.show3DTerrain')">
                            <span class="icon">🌄</span>
                            <h4>3D View</h4>
                            <p>Terrain viz</p>
                        </button>
                        <button class="quick-action-card" onclick="runCommand('manicMiners.generateCave')">
                            <span class="icon">🏔️</span>
                            <h4>Generate</h4>
                            <p>Auto cave</p>
                        </button>
                    </div>
                </section>

                <!-- Learning Resources -->
                <section class="resources enhanced">
                    <h2>📚 Learning Resources</h2>
                    <div class="resource-categories">
                        <div class="resource-category">
                            <h3>📖 Documentation</h3>
                            <ul class="resource-list">
                                <li><a href="#" onclick="openDoc('extension/USER_GUIDE.md')">Complete User Guide</a></li>
                                <li><a href="#" onclick="openDoc('game-reference/DAT_FORMAT.md')">DAT Format Reference</a></li>
                                <li><a href="#" onclick="openDoc('game-reference/scripting/overview.md')">Scripting Language</a></li>
                                <li><a href="#" onclick="openDoc('game-reference/map-design-guide.md')">Map Design Best Practices</a></li>
                            </ul>
                        </div>
                        <div class="resource-category">
                            <h3>⚡ Quick References</h3>
                            <ul class="resource-list">
                                <li><a href="#" onclick="openDoc('quick-reference/cheat-sheet.md')">Cheat Sheet</a></li>
                                <li><a href="#" onclick="openDoc('quick-reference/tile-ids.md')">Tile ID Reference</a></li>
                                <li><a href="#" onclick="openDoc('quick-reference/script-commands.md')">Script Commands</a></li>
                                <li><a href="#" onclick="openDoc('quick-reference/common-recipes.md')">Common Recipes</a></li>
                            </ul>
                        </div>
                        <div class="resource-category">
                            <h3>🎓 Tutorials</h3>
                            <ul class="resource-list">
                                <li><a href="#" onclick="openDoc('game-reference/scripting/patterns/tutorial-patterns.md')">Tutorial Patterns</a></li>
                                <li><a href="#" onclick="openDoc('game-reference/scripting/patterns/combat-patterns.md')">Combat Patterns</a></li>
                                <li><a href="#" onclick="openDoc('game-reference/scripting/patterns/resource-patterns.md')">Resource Management</a></li>
                                <li><a href="#" onclick="openDoc('technical-reference/algorithms/cave-generation.md')">Cave Generation</a></li>
                            </ul>
                        </div>
                        <div class="resource-category">
                            <h3>🔧 Advanced</h3>
                            <ul class="resource-list">
                                <li><a href="#" onclick="openDoc('game-reference/scripting/debugging.md')">Debugging Scripts</a></li>
                                <li><a href="#" onclick="openDoc('game-reference/scripting/patterns/performance-patterns.md')">Performance Tips</a></li>
                                <li><a href="#" onclick="openDoc('technical-reference/parsing-patterns.md')">Parsing Patterns</a></li>
                                <li><a href="#" onclick="openDoc('extension/DEVELOPER_GUIDE.md')">Developer Guide</a></li>
                            </ul>
                        </div>
                    </div>
                </section>

                <!-- Keyboard Shortcuts -->
                <section class="keyboard-shortcuts">
                    <h2>⌨️ Keyboard Shortcuts</h2>
                    <div class="shortcuts-grid">
                        <div class="shortcut-group">
                            <h3>Essential</h3>
                            <div class="shortcut"><kbd>Ctrl+Space</kbd><span>IntelliSense</span></div>
                            <div class="shortcut"><kbd>F12</kbd><span>Go to Definition</span></div>
                            <div class="shortcut"><kbd>Shift+F12</kbd><span>Find References</span></div>
                            <div class="shortcut"><kbd>Ctrl+.</kbd><span>Quick Actions</span></div>
                        </div>
                        <div class="shortcut-group">
                            <h3>Editing</h3>
                            <div class="shortcut"><kbd>Ctrl+Z</kbd><span>Undo</span></div>
                            <div class="shortcut"><kbd>Ctrl+Y</kbd><span>Redo</span></div>
                            <div class="shortcut"><kbd>Alt+Click</kbd><span>Multi-cursor</span></div>
                            <div class="shortcut"><kbd>Ctrl+D</kbd><span>Select Next</span></div>
                        </div>
                        <div class="shortcut-group">
                            <h3>Manic Miners</h3>
                            <div class="shortcut"><kbd>Ctrl+Shift+P</kbd><span>Commands</span></div>
                            <div class="shortcut"><kbd>!</kbd><span>Script Commands</span></div>
                            <div class="shortcut"><kbd>tile:</kbd><span>Tile Completions</span></div>
                            <div class="shortcut"><kbd>obj:</kbd><span>Objectives</span></div>
                        </div>
                    </div>
                </section>

                <!-- Community -->
                <section class="community">
                    <h2>🌐 Community</h2>
                    <div class="community-cards">
                        <div class="community-card" onclick="openExternal('https://github.com/Wal33D/manic_vscode_extension')">
                            <span class="icon">📦</span>
                            <h3>GitHub Repository</h3>
                            <p>Star us on GitHub!</p>
                        </div>
                        <div class="community-card" onclick="openExternal('https://github.com/Wal33D/manic_vscode_extension/issues')">
                            <span class="icon">🐛</span>
                            <h3>Report Issues</h3>
                            <p>Help us improve</p>
                        </div>
                        <div class="community-card" onclick="openExternal('https://manicminers.fandom.com/')">
                            <span class="icon">📚</span>
                            <h3>Game Wiki</h3>
                            <p>Learn about the game</p>
                        </div>
                        <div class="community-card" onclick="showNotification('Discord community coming soon!')">
                            <span class="icon">💬</span>
                            <h3>Discord</h3>
                            <p>Coming soon!</p>
                        </div>
                    </div>
                </section>

                <footer class="enhanced-footer">
                    <div class="footer-content">
                        <div class="footer-section">
                            <h4>Quick Links</h4>
                            <div class="footer-links">
                                <button class="link-button" onclick="openSettings()">⚙️ Settings</button>
                                <button class="link-button" onclick="openDoc('extension/TROUBLESHOOTING.md')">🔧 Troubleshooting</button>
                                <button class="link-button" onclick="runCommand('manicMiners.showCommands')">📋 All Commands</button>
                                <button class="link-button" onclick="runCommand('manicMiners.showWelcome')">🏠 Welcome</button>
                            </div>
                        </div>
                        <div class="footer-section">
                            <h4>About</h4>
                            <p class="footer-text">
                                Manic Miners DAT File Support<br>
                                Version <span id="footerVersion">0.3.0</span><br>
                                Created with ❤️ by Wal33D
                            </p>
                        </div>
                        <div class="footer-section">
                            <h4>Stay Updated</h4>
                            <p class="footer-text">
                                Check for updates regularly<br>
                                <button class="link-button" onclick="runCommand('workbench.extensions.action.checkForUpdates')">
                                    🔄 Check Updates
                                </button>
                            </p>
                        </div>
                    </div>
                </footer>
            </div>

            <script src="${scriptUri}"></script>
        </body>
        </html>`;
  }

  private async openDocument(relativePath: string): Promise<void> {
    const docPath = path.join(this.context.extensionPath, 'docs', relativePath);
    const doc = await vscode.workspace.openTextDocument(docPath);
    await vscode.window.showTextDocument(doc);
  }

  private async openSampleFile(sampleName?: string): Promise<void> {
    let samplePath: string;

    if (sampleName) {
      // Try different locations for the sample
      const possiblePaths = [
        path.join(this.context.extensionPath, 'sample', 'levels', 'Tutorial', `${sampleName}.dat`),
        path.join(this.context.extensionPath, 'sample', 'levels', 'Campaign', `${sampleName}.dat`),
        path.join(this.context.extensionPath, 'sample', 'levels', 'Community', `${sampleName}.dat`),
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          samplePath = p;
          break;
        }
      }
      samplePath = samplePath! || possiblePaths[0];
    } else {
      samplePath = path.join(
        this.context.extensionPath,
        'sample',
        'levels',
        'Tutorial',
        'Tutorial01.dat'
      );
    }

    try {
      const doc = await vscode.workspace.openTextDocument(samplePath);
      await vscode.window.showTextDocument(doc);
    } catch (error) {
      // If sample doesn't exist, create a new file with sample content
      const content = this.getSampleContent(sampleName);
      const newDoc = await vscode.workspace.openTextDocument({
        content,
        language: 'manicminers',
      });
      await vscode.window.showTextDocument(newDoc);
    }
  }

  private getSampleContent(sampleName?: string): string {
    if (sampleName === 'CrystalHunt') {
      return `info{
Title=Crystal Hunt
Author=Sample Map
Description=Collect all the crystals to win!
}

tiles{
4 4 4 4 4 4 4 4 4 4 4 4 4 4 4
4 1 1 1 1 1 1 1 1 1 1 1 1 1 4
4 1 0 0 0 0 0 0 0 0 0 0 0 1 4
4 1 0 2 2 2 0 3 0 2 2 2 0 1 4
4 1 0 2 11 2 0 0 0 2 11 2 0 1 4
4 1 0 2 2 2 0 0 0 2 2 2 0 1 4
4 1 0 0 0 0 0 0 0 0 0 0 0 1 4
4 1 0 0 0 2 2 2 2 2 0 0 0 1 4
4 1 0 0 0 2 11 11 11 2 0 0 0 1 4
4 1 0 0 0 2 2 2 2 2 0 0 0 1 4
4 1 0 0 0 0 0 0 0 0 0 0 0 1 4
4 1 0 0 0 0 0 0 0 0 0 0 0 1 4
4 1 1 1 1 1 1 1 1 1 1 1 1 1 4
4 4 4 4 4 4 4 4 4 4 4 4 4 4 4
}

height{
5 5 5 5 5 5 5 5 5 5 5 5 5 5 5
5 3 3 3 3 3 3 3 3 3 3 3 3 3 5
5 3 0 0 0 0 0 0 0 0 0 0 0 3 5
5 3 0 1 1 1 0 0 0 1 1 1 0 3 5
5 3 0 1 2 1 0 0 0 1 2 1 0 3 5
5 3 0 1 1 1 0 0 0 1 1 1 0 3 5
5 3 0 0 0 0 0 0 0 0 0 0 0 3 5
5 3 0 0 0 1 1 1 1 1 0 0 0 3 5
5 3 0 0 0 1 2 2 2 1 0 0 0 3 5
5 3 0 0 0 1 1 1 1 1 0 0 0 3 5
5 3 0 0 0 0 0 0 0 0 0 0 0 3 5
5 3 0 0 0 0 0 0 0 0 0 0 0 3 5
5 3 3 3 3 3 3 3 3 3 3 3 3 3 5
5 5 5 5 5 5 5 5 5 5 5 5 5 5 5
}

resources{
crystals: 4,4,25
crystals: 10,4,25
crystals: 7,8,50
}

buildings{
ToolStore: 7,2,1,1,1
}

objectives{
resources: crystals,100
}

script{
; Crystal collection challenge
}`;
    } else if (sampleName === 'DefensePoint') {
      return `info{
Title=Defense Point
Author=Sample Map
Description=Defend your base from monster attacks!
}

tiles{
4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4
4 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 4
4 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 4
4 1 0 2 2 2 2 2 0 0 0 0 2 2 2 2 2 0 1 4
4 1 0 2 3 3 3 2 0 0 0 0 2 3 3 3 2 0 1 4
4 1 0 2 3 0 3 2 0 0 0 0 2 3 0 3 2 0 1 4
4 1 0 2 3 3 3 2 0 0 0 0 2 3 3 3 2 0 1 4
4 1 0 2 2 2 2 2 0 0 0 0 2 2 2 2 2 0 1 4
4 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 4
4 1 1 1 1 1 0 0 0 0 0 0 0 0 1 1 1 1 1 4
4 4 4 4 4 1 0 0 0 0 0 0 0 0 1 4 4 4 4 4
4 6 6 6 4 1 0 0 0 0 0 0 0 0 1 4 6 6 6 4
4 6 6 6 4 1 0 0 0 0 0 0 0 0 1 4 6 6 6 4
4 6 6 6 4 1 1 1 1 1 1 1 1 1 1 4 6 6 6 4
4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4 4
}

script{
int MonsterWave=0
timer MonsterTimer=10,5,30,SpawnMonsters
message:DEFEND YOUR BASE!

trigger:drill:SpawnMonsters
if(MonsterWave=0)[MonsterWave=1]
if(MonsterWave=1)[emerge:1,10,slug]
if(MonsterWave=1)[emerge:18,10,slug]
wait:5
if(MonsterWave=1)[emerge:1,11,slug]
if(MonsterWave=1)[emerge:18,11,slug]
}`;
    } else {
      // Default tutorial map
      return `info{
Title=My First Map
Author=Your Name
Description=A simple tutorial map
}

tiles{
4 4 4 4 4 4 4 4 4 4
4 1 1 1 1 1 1 1 1 4
4 1 0 0 0 0 0 0 1 4
4 1 0 0 0 0 0 0 1 4
4 1 0 0 0 0 0 0 1 4
4 1 0 0 0 0 0 0 1 4
4 1 0 0 0 0 0 0 1 4
4 1 0 0 0 0 0 0 1 4
4 1 1 1 1 1 1 1 1 4
4 4 4 4 4 4 4 4 4 4
}

height{
5 5 5 5 5 5 5 5 5 5
5 3 3 3 3 3 3 3 3 5
5 3 0 0 0 0 0 0 3 5
5 3 0 0 0 0 0 0 3 5
5 3 0 0 0 0 0 0 3 5
5 3 0 0 0 0 0 0 3 5
5 3 0 0 0 0 0 0 3 5
5 3 0 0 0 0 0 0 3 5
5 3 3 3 3 3 3 3 3 5
5 5 5 5 5 5 5 5 5 5
}

resources{
crystals: 5,5,10
}

buildings{
ToolStore: 5,4,1,1,1
}

objectives{
resources: crystals,5
}

script{
; Welcome to Manic Miners scripting!
; This is a simple example map
}`;
    }
  }

  private getRecentMaps(): string[] {
    return this.context.globalState.get<string[]>('recentMaps', []);
  }

  private async openRecentMap(mapPath: string): Promise<void> {
    try {
      const doc = await vscode.workspace.openTextDocument(mapPath);
      await vscode.window.showTextDocument(doc);
    } catch (error) {
      vscode.window.showErrorMessage(`Could not open map: ${mapPath}`);
    }
  }

  private async clearRecentMaps(): Promise<void> {
    await this.context.globalState.update('recentMaps', []);
    if (this.panel) {
      this.panel.webview.postMessage({
        type: 'recentMapsCleared',
      });
    }
  }

  private getExtensionStats(): {
    mapsCreated: number;
    timeSaved: number;
    quickActions: number;
    objectivesBuilt: number;
  } {
    return {
      mapsCreated: this.context.globalState.get<number>('mapsCreated', 0),
      timeSaved: this.context.globalState.get<number>('timeSaved', 0),
      quickActions: this.context.globalState.get<number>('quickActions', 0),
      objectivesBuilt: this.context.globalState.get<number>('objectivesBuilt', 0),
    };
  }
}
