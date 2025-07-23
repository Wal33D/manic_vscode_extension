import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Documentation Viewer
 * Provides an interactive documentation browser within VS Code
 */
export class DocViewer implements vscode.WebviewViewProvider {
  public static readonly viewType = 'manicMiners.docViewer';

  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;
  private searchIndex: SearchIndex;
  private currentDoc?: string;
  private history: string[] = [];
  private historyIndex: number = -1;
  private favorites: Set<string> = new Set();

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly docRoot: string
  ) {
    this._extensionUri = extensionUri;
    this.searchIndex = new SearchIndex();
    this.loadFavorites();
    this.buildSearchIndex();
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'media'),
        vscode.Uri.file(this.docRoot),
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages
    webviewView.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'navigate':
          await this.navigateToDoc(message.path);
          break;
        case 'search':
          await this.handleSearch(message.query);
          break;
        case 'back':
          this.navigateBack();
          break;
        case 'forward':
          this.navigateForward();
          break;
        case 'toggleFavorite':
          this.toggleFavorite(message.path);
          break;
        case 'exportPDF':
          await this.exportToPDF();
          break;
        case 'copyCode':
          await this.copyCodeBlock(message.code);
          break;
        case 'runExample':
          await this.runExample(message.code);
          break;
        case 'ready':
          await this.showHome();
          break;
      }
    });

    // Update when view becomes visible
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible && this.currentDoc) {
        this.refreshCurrentDoc();
      }
    });
  }

  /**
   * Navigate to documentation
   */
  private async navigateToDoc(docPath: string): Promise<void> {
    const fullPath = path.join(this.docRoot, docPath);

    try {
      const content = await fs.promises.readFile(fullPath, 'utf-8');
      const html = await this.renderMarkdown(content);

      // Update history
      if (this.currentDoc !== docPath) {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(docPath);
        this.historyIndex = this.history.length - 1;
      }

      this.currentDoc = docPath;

      // Send to webview
      this._view?.webview.postMessage({
        type: 'showDoc',
        path: docPath,
        content: html,
        canGoBack: this.historyIndex > 0,
        canGoForward: this.historyIndex < this.history.length - 1,
        isFavorite: this.favorites.has(docPath),
      });

      // Update breadcrumbs
      this.updateBreadcrumbs(docPath);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load documentation: ${error}`);
    }
  }

  /**
   * Render markdown to HTML
   */
  private async renderMarkdown(markdown: string): Promise<string> {
    // For now, just return the markdown wrapped in pre tags
    // In a real implementation, you would use a markdown parser
    return `<div class="markdown-content"><pre>${this.escapeHtml(markdown)}</pre></div>`;
  }

  /**
   * Handle search
   */
  private async handleSearch(query: string): Promise<void> {
    const results = await this.searchIndex.search(query);

    this._view?.webview.postMessage({
      type: 'searchResults',
      query,
      results: results.map(r => ({
        path: r.path,
        title: r.title,
        preview: r.preview,
        score: r.score,
      })),
    });
  }

  /**
   * Build search index
   */
  private async buildSearchIndex(): Promise<void> {
    const indexPath = path.join(this.docRoot, '.search-index.json');

    try {
      // Try to load existing index
      const indexData = await fs.promises.readFile(indexPath, 'utf-8');
      this.searchIndex.loadIndex(JSON.parse(indexData));
      return;
    } catch {
      // Build new index
    }

    // Walk through documentation files
    await this.walkDocs(this.docRoot, async (filePath, relativePath) => {
      if (!filePath.endsWith('.md')) {
        return;
      }

      try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const title = this.extractTitle(content);
        const text = this.extractText(content);

        this.searchIndex.addDocument({
          path: relativePath,
          title,
          content: text,
        });
      } catch (error) {
        console.error(`Failed to index ${filePath}:`, error);
      }
    });

    // Save index
    await fs.promises.writeFile(indexPath, JSON.stringify(this.searchIndex.serialize()), 'utf-8');
  }

  /**
   * Walk documentation directory
   */
  private async walkDocs(
    dir: string,
    callback: (filePath: string, relativePath: string) => Promise<void>
  ): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(this.docRoot, fullPath);

      if (entry.isDirectory()) {
        await this.walkDocs(fullPath, callback);
      } else {
        await callback(fullPath, relativePath);
      }
    }
  }

  /**
   * Extract title from markdown
   */
  private extractTitle(markdown: string): string {
    const match = markdown.match(/^#\s+(.+)$/m);
    return match ? match[1] : 'Untitled';
  }

  /**
   * Extract text content
   */
  private extractText(markdown: string): string {
    // Remove code blocks
    let text = markdown.replace(/```[\s\S]*?```/g, '');

    // Remove inline code
    text = text.replace(/`[^`]+`/g, '');

    // Remove markdown syntax
    text = text.replace(/[#*_[\]()]/g, '');

    // Remove extra whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  /**
   * Show home page
   */
  private async showHome(): Promise<void> {
    const indexPath = path.join(this.docRoot, 'index.md');

    if (fs.existsSync(indexPath)) {
      await this.navigateToDoc('index.md');
    } else {
      // Show default home
      this._view?.webview.postMessage({
        type: 'showHome',
        favorites: Array.from(this.favorites),
        recent: this.history.slice(-5).reverse(),
      });
    }
  }

  /**
   * Navigate back
   */
  private navigateBack(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const path = this.history[this.historyIndex];
      this.navigateToDoc(path);
    }
  }

  /**
   * Navigate forward
   */
  private navigateForward(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const path = this.history[this.historyIndex];
      this.navigateToDoc(path);
    }
  }

  /**
   * Toggle favorite
   */
  private toggleFavorite(path: string): void {
    if (this.favorites.has(path)) {
      this.favorites.delete(path);
    } else {
      this.favorites.add(path);
    }

    this.saveFavorites();

    this._view?.webview.postMessage({
      type: 'favoriteToggled',
      path,
      isFavorite: this.favorites.has(path),
    });
  }

  /**
   * Load favorites
   */
  private loadFavorites(): void {
    const state = this.extensionUri.fsPath;
    const favoritesPath = path.join(state, '.doc-favorites.json');

    try {
      const data = fs.readFileSync(favoritesPath, 'utf-8');
      this.favorites = new Set(JSON.parse(data));
    } catch {
      // No favorites yet
    }
  }

  /**
   * Save favorites
   */
  private saveFavorites(): void {
    const state = this.extensionUri.fsPath;
    const favoritesPath = path.join(state, '.doc-favorites.json');

    fs.writeFileSync(favoritesPath, JSON.stringify(Array.from(this.favorites)), 'utf-8');
  }

  /**
   * Update breadcrumbs
   */
  private updateBreadcrumbs(docPath: string): void {
    const parts = docPath.split('/');
    const breadcrumbs = [];

    let currentPath = '';
    for (let i = 0; i < parts.length; i++) {
      currentPath += (i > 0 ? '/' : '') + parts[i];
      breadcrumbs.push({
        label: parts[i].replace('.md', ''),
        path: currentPath,
      });
    }

    this._view?.webview.postMessage({
      type: 'updateBreadcrumbs',
      breadcrumbs,
    });
  }

  /**
   * Export to PDF
   */
  private async exportToPDF(): Promise<void> {
    if (!this.currentDoc) {
      return;
    }

    vscode.window.showInformationMessage('PDF export functionality would be implemented here');
  }

  /**
   * Copy code block
   */
  private async copyCodeBlock(code: string): Promise<void> {
    await vscode.env.clipboard.writeText(code);
    vscode.window.showInformationMessage('Code copied to clipboard');
  }

  /**
   * Run example code
   */
  private async runExample(code: string): Promise<void> {
    // Create temporary file
    const tempFile = path.join(this.extensionUri.fsPath, '.temp', `example-${Date.now()}.ts`);

    await fs.promises.mkdir(path.dirname(tempFile), { recursive: true });
    await fs.promises.writeFile(tempFile, code);

    // Open in editor
    const doc = await vscode.workspace.openTextDocument(tempFile);
    await vscode.window.showTextDocument(doc);
  }

  /**
   * Refresh current documentation
   */
  private refreshCurrentDoc(): void {
    if (this.currentDoc) {
      this.navigateToDoc(this.currentDoc);
    }
  }

  /**
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };

    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Get HTML for webview
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'documentation', 'docViewer.css')
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'documentation', 'docViewer.js')
    );
    const highlightStyleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'documentation', 'highlight.css')
    );

    const nonce = this.getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:;">
      <link href="${styleUri}" rel="stylesheet">
      <link href="${highlightStyleUri}" rel="stylesheet">
      <title>Documentation Viewer</title>
    </head>
    <body>
      <div id="doc-viewer">
        <!-- Header -->
        <header class="doc-header">
          <div class="navigation">
            <button id="backBtn" class="nav-btn" title="Back" disabled>
              <span class="codicon codicon-arrow-left"></span>
            </button>
            <button id="forwardBtn" class="nav-btn" title="Forward" disabled>
              <span class="codicon codicon-arrow-right"></span>
            </button>
            <button id="homeBtn" class="nav-btn" title="Home">
              <span class="codicon codicon-home"></span>
            </button>
          </div>
          
          <div class="search-box">
            <input type="text" id="searchInput" placeholder="Search documentation..." />
            <span class="codicon codicon-search"></span>
          </div>
          
          <div class="actions">
            <button id="favoriteBtn" class="action-btn" title="Add to favorites">
              <span class="codicon codicon-star-empty"></span>
            </button>
            <button id="exportBtn" class="action-btn" title="Export as PDF">
              <span class="codicon codicon-export"></span>
            </button>
          </div>
        </header>
        
        <!-- Breadcrumbs -->
        <nav class="breadcrumbs" id="breadcrumbs"></nav>
        
        <!-- Main Content -->
        <main class="doc-content" id="docContent">
          <div class="loading">
            <div class="spinner"></div>
            <p>Loading documentation...</p>
          </div>
        </main>
        
        <!-- Search Results -->
        <div class="search-results" id="searchResults" style="display: none;">
          <h2>Search Results</h2>
          <div class="results-list" id="resultsList"></div>
        </div>
        
        <!-- Sidebar -->
        <aside class="doc-sidebar" id="docSidebar">
          <div class="sidebar-section">
            <h3>On This Page</h3>
            <nav class="toc" id="tableOfContents"></nav>
          </div>
          
          <div class="sidebar-section">
            <h3>Favorites</h3>
            <div class="favorites-list" id="favoritesList"></div>
          </div>
          
          <div class="sidebar-section">
            <h3>Recent</h3>
            <div class="recent-list" id="recentList"></div>
          </div>
        </aside>
      </div>
      
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  /**
   * Get nonce for CSP
   */
  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}

/**
 * Search Index for documentation
 */
class SearchIndex {
  private documents: Map<string, SearchDocument> = new Map();
  private index: Map<string, Set<string>> = new Map();

  /**
   * Add document to index
   */
  public addDocument(doc: SearchDocument): void {
    this.documents.set(doc.path, doc);

    // Tokenize and index
    const tokens = this.tokenize(doc.content + ' ' + doc.title);

    tokens.forEach(token => {
      if (!this.index.has(token)) {
        this.index.set(token, new Set());
      }
      this.index.get(token)!.add(doc.path);
    });
  }

  /**
   * Search documents
   */
  public async search(query: string): Promise<SearchResult[]> {
    const tokens = this.tokenize(query.toLowerCase());
    const scores = new Map<string, number>();

    // Calculate scores
    tokens.forEach(token => {
      const docs = this.index.get(token);
      if (docs) {
        docs.forEach(docPath => {
          scores.set(docPath, (scores.get(docPath) || 0) + 1);
        });
      }
    });

    // Sort by score
    const results: SearchResult[] = [];

    scores.forEach((score, path) => {
      const doc = this.documents.get(path)!;
      results.push({
        path,
        title: doc.title,
        preview: this.generatePreview(doc.content, tokens),
        score,
      });
    });

    results.sort((a, b) => b.score - a.score);

    return results.slice(0, 20); // Top 20 results
  }

  /**
   * Tokenize text
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  /**
   * Generate preview
   */
  private generatePreview(content: string, tokens: string[]): string {
    const sentences = content.split(/[.!?]\s+/);

    // Find sentence with most matches
    let bestSentence = '';
    let bestScore = 0;

    sentences.forEach(sentence => {
      let score = 0;
      tokens.forEach(token => {
        if (sentence.toLowerCase().includes(token)) {
          score++;
        }
      });

      if (score > bestScore) {
        bestScore = score;
        bestSentence = sentence;
      }
    });

    // Truncate if needed
    if (bestSentence.length > 150) {
      bestSentence = bestSentence.substring(0, 150) + '...';
    }

    return bestSentence;
  }

  /**
   * Load index from data
   */
  public loadIndex(data: any): void {
    this.documents = new Map(data.documents);
    this.index = new Map();

    data.index.forEach((docs: string[], token: string) => {
      this.index.set(token, new Set(docs));
    });
  }

  /**
   * Serialize index
   */
  public serialize(): any {
    return {
      documents: Array.from(this.documents.entries()),
      index: Array.from(this.index.entries()).map(([token, docs]) => [token, Array.from(docs)]),
    };
  }
}

// Type definitions
interface SearchDocument {
  path: string;
  title: string;
  content: string;
}

interface SearchResult {
  path: string;
  title: string;
  preview: string;
  score: number;
}

export function registerDocViewer(
  context: vscode.ExtensionContext,
  docRoot: string
): vscode.Disposable {
  const provider = new DocViewer(context.extensionUri, docRoot);

  return vscode.window.registerWebviewViewProvider(DocViewer.viewType, provider, {
    webviewOptions: {
      retainContextWhenHidden: true,
    },
  });
}
