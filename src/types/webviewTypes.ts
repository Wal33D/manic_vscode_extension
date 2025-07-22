/**
 * Shared webview message types for VS Code extension
 */

// Base message interface
export interface WebviewMessage {
  command: string;
  [key: string]: unknown;
}

// Accessibility webview messages
export interface AccessibilityWebviewMessage extends WebviewMessage {
  command: 'analyzeMap' | 'exportReport' | 'fixIssue' | 'refresh';
  uri?: string;
  issueId?: string;
  fixType?: string;
}

// Map Editor webview messages
export interface MapEditorMessage extends WebviewMessage {
  command:
    | 'paint'
    | 'copy'
    | 'paste'
    | 'validateMap'
    | 'getTemplates'
    | 'applyTemplate'
    | 'undo'
    | 'redo'
    | 'exportMap'
    | 'importMap'
    | 'getStatistics'
    | 'fixValidationIssue';

  // Paint command
  tiles?: Array<{ row: number; col: number; tileId: number }>;
  description?: string;

  // Copy/paste
  selection?: { startRow: number; startCol: number; endRow: number; endCol: number };
  clipboardData?: {
    tiles: number[][];
    heights: number[][];
    width: number;
    height: number;
  };

  // Template
  templateId?: string;

  // Validation
  issue?: unknown;
  fix?: string;

  // Import/export
  format?: 'json' | 'text';
  data?: string;
}

// Chart.js configuration interface
export interface ChartConfiguration {
  type: 'bar' | 'pie' | 'line' | 'doughnut' | 'radar';
  data: {
    labels: string[];
    datasets: Array<{
      label?: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }>;
  };
  options?: {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    plugins?: {
      legend?: {
        display?: boolean;
        position?: 'top' | 'bottom' | 'left' | 'right';
      };
      title?: {
        display?: boolean;
        text?: string;
      };
    };
    scales?: {
      y?: {
        beginAtZero?: boolean;
      };
    };
  };
}

// Performance API extension
export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface PerformanceWithMemory {
  memory?: MemoryInfo;
}

// Path finding types
export interface PathNode {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic cost to end
  f: number; // Total cost (g + h)
  parent?: PathNode;
}

// Advanced selection parameters
export interface SelectionParams {
  // Magic wand
  row?: number;
  col?: number;
  tolerance?: number;

  // Lasso
  path?: Array<{ row: number; col: number }>;

  // Ellipse
  centerRow?: number;
  centerCol?: number;
  radiusX?: number;
  radiusY?: number;
  radiusRows?: number;
  radiusCols?: number;

  // Polygon
  vertices?: Array<{ row: number; col: number }>;

  // Conditional
  condition?: string;
  value?: number;
}

// Test logger interface
export interface TestLogger {
  log: (message: string) => void;
  error: (message: string) => void;
  warn: (message: string) => void;
  info: (message: string) => void;
}
