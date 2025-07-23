// @ts-check
// Reusable UI Components for Manic Miners Workspace

/**
 * Component styles to be injected
 */
const componentStyles = `
  /* Tools Grid */
  .tools-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .tool-btn {
    background: var(--vscode-button-secondaryBackground);
    border: 1px solid var(--vscode-button-border);
    color: var(--text-primary);
    padding: 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 12px;
  }
  
  .tool-btn:hover {
    background: var(--vscode-button-secondaryHoverBackground);
    transform: translateY(-1px);
  }
  
  .tool-btn.active {
    background: var(--accent);
    color: white;
  }
  
  .tool-btn .icon {
    font-size: 20px;
  }
  
  /* Properties */
  .properties-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .property-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .property-group label {
    font-size: 11px;
    text-transform: uppercase;
    color: var(--text-secondary);
    font-weight: 600;
  }
  
  .property-select,
  .property-input {
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border);
    color: var(--vscode-input-foreground);
    padding: 6px 8px;
    border-radius: 3px;
    font-size: 13px;
  }
  
  .property-range {
    width: 100%;
  }
  
  /* Layers */
  .layers-container {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .layer-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: var(--vscode-list-inactiveSelectionBackground);
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .layer-item:hover {
    background: var(--vscode-list-hoverBackground);
  }
  
  .layer-item.active {
    background: var(--vscode-list-activeSelectionBackground);
  }
  
  .layer-visibility {
    margin-left: auto;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 14px;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  
  .layer-visibility:hover {
    opacity: 1;
  }
  
  /* Tile Palette */
  .tile-palette-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .palette-search {
    position: sticky;
    top: 0;
    background: var(--panel-bg);
    z-index: 10;
  }
  
  .search-input {
    width: 100%;
    padding: 8px 12px;
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border);
    color: var(--vscode-input-foreground);
    border-radius: 4px;
    font-size: 13px;
  }
  
  .tile-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 4px;
  }
  
  .tile-item {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;
  }
  
  .tile-item:hover {
    transform: scale(1.1);
    border-color: var(--focus-border);
    z-index: 10;
  }
  
  .tile-item.selected {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent);
  }
  
  .tile-id {
    font-size: 10px;
    font-weight: bold;
    color: white;
    text-shadow: 0 0 2px black;
  }
  
  /* Script Patterns */
  .script-patterns-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .pattern-category {
    margin-bottom: 12px;
  }
  
  .pattern-category-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }
  
  .pattern-item {
    padding: 8px 12px;
    background: var(--vscode-editor-background);
    border: 1px solid var(--panel-border);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 12px;
  }
  
  .pattern-item:hover {
    background: var(--vscode-list-hoverBackground);
    transform: translateX(4px);
  }
  
  .pattern-name {
    font-weight: 500;
    margin-bottom: 2px;
  }
  
  .pattern-description {
    font-size: 11px;
    color: var(--text-secondary);
  }
  
  /* Validation */
  .validation-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .validation-item {
    display: flex;
    align-items: start;
    gap: 8px;
    padding: 8px;
    background: var(--vscode-editor-background);
    border-radius: 4px;
    font-size: 12px;
  }
  
  .validation-item.error {
    border-left: 3px solid var(--vscode-editorError-foreground);
  }
  
  .validation-item.warning {
    border-left: 3px solid var(--vscode-editorWarning-foreground);
  }
  
  .validation-item.info {
    border-left: 3px solid var(--vscode-editorInfo-foreground);
  }
  
  .validation-icon {
    font-size: 14px;
  }
  
  .validation-message {
    flex: 1;
  }
  
  .validation-line {
    font-size: 11px;
    color: var(--text-secondary);
  }
  
  /* Statistics */
  .statistics-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .stat-group {
    background: var(--vscode-editor-background);
    padding: 12px;
    border-radius: 4px;
  }
  
  .stat-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }
  
  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    font-size: 12px;
  }
  
  .stat-label {
    color: var(--text-secondary);
  }
  
  .stat-value {
    font-weight: 600;
    color: var(--accent);
  }
  
  /* History */
  .history-container {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .history-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: var(--vscode-list-inactiveSelectionBackground);
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.2s;
  }
  
  .history-item:hover {
    background: var(--vscode-list-hoverBackground);
  }
  
  .history-item.active {
    background: var(--vscode-list-activeSelectionBackground);
    font-weight: 600;
  }
  
  .history-icon {
    font-size: 14px;
  }
  
  .history-action {
    flex: 1;
  }
  
  .history-time {
    font-size: 11px;
    color: var(--text-secondary);
  }
`;

// Inject component styles
function injectComponentStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = componentStyles;
  document.head.appendChild(styleElement);
}

// Component functions
function getScriptPatternsContent() {
  return `
    <div class="script-patterns-container">
      <div class="pattern-category">
        <div class="pattern-category-title">Flow Control</div>
        <div class="pattern-item" data-pattern="timer">
          <div class="pattern-name">Timer Loop</div>
          <div class="pattern-description">Repeating timer pattern</div>
        </div>
        <div class="pattern-item" data-pattern="conditional">
          <div class="pattern-name">Conditional</div>
          <div class="pattern-description">If-then logic</div>
        </div>
      </div>
      <div class="pattern-category">
        <div class="pattern-category-title">Events</div>
        <div class="pattern-item" data-pattern="onBuild">
          <div class="pattern-name">On Building</div>
          <div class="pattern-description">Trigger on building placement</div>
        </div>
        <div class="pattern-item" data-pattern="onResource">
          <div class="pattern-name">On Resource</div>
          <div class="pattern-description">Trigger on resource collection</div>
        </div>
      </div>
    </div>
  `;
}

function getValidationContent() {
  return `
    <div class="validation-container">
      <div class="validation-item info">
        <span class="validation-icon">ℹ️</span>
        <div>
          <div class="validation-message">Map validation ready</div>
          <div class="validation-line">Click validate to check for issues</div>
        </div>
      </div>
    </div>
  `;
}

function getStatisticsContent() {
  return `
    <div class="statistics-container">
      <div class="stat-group">
        <div class="stat-title">Map Overview</div>
        <div class="stat-item">
          <span class="stat-label">Dimensions</span>
          <span class="stat-value">--</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Tiles</span>
          <span class="stat-value">--</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Resources</span>
          <span class="stat-value">--</span>
        </div>
      </div>
      <div class="stat-group">
        <div class="stat-title">Difficulty</div>
        <div class="stat-item">
          <span class="stat-label">Overall</span>
          <span class="stat-value">--</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Path Score</span>
          <span class="stat-value">--</span>
        </div>
      </div>
    </div>
  `;
}

function getHistoryContent() {
  return `
    <div class="history-container">
      <div class="history-item active">
        <span class="history-icon">📝</span>
        <span class="history-action">Initial state</span>
        <span class="history-time">Now</span>
      </div>
    </div>
  `;
}

// Export functions to global scope
window.getScriptPatternsContent = getScriptPatternsContent;
window.getValidationContent = getValidationContent;
window.getStatisticsContent = getStatisticsContent;
window.getHistoryContent = getHistoryContent;

// Initialize component styles when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectComponentStyles);
} else {
  injectComponentStyles();
}