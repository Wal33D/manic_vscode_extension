/**
 * Accessibility utilities for the Manic Miners extension
 * Provides helpers for ARIA labels, announcements, and keyboard navigation
 */

import * as vscode from 'vscode';

export interface AriaLiveRegion {
  announce(message: string, priority?: 'polite' | 'assertive'): void;
  clear(): void;
}

/**
 * Creates a live region for screen reader announcements
 */
export function createLiveRegion(webview: vscode.Webview): AriaLiveRegion {
  // Initialize live region in webview
  webview.postMessage({
    type: 'accessibility',
    command: 'createLiveRegion',
  });

  return {
    announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
      webview.postMessage({
        type: 'accessibility',
        command: 'announce',
        message,
        priority,
      });
    },

    clear() {
      webview.postMessage({
        type: 'accessibility',
        command: 'clearAnnouncements',
      });
    },
  };
}

/**
 * Keyboard navigation context
 */
export class KeyboardNavigationContext {
  private focusableElements: string[] = [];
  private currentIndex = -1;

  constructor(
    private webview: vscode.Webview,
    private containerSelector: string
  ) {}

  /**
   * Initialize keyboard navigation for a container
   */
  initialize(focusableSelectors: string[]): void {
    this.focusableElements = focusableSelectors;

    this.webview.postMessage({
      type: 'accessibility',
      command: 'initKeyboardNav',
      containerSelector: this.containerSelector,
      focusableSelectors,
    });
  }

  /**
   * Move focus to next element
   */
  focusNext(): void {
    this.currentIndex = (this.currentIndex + 1) % this.focusableElements.length;
    this.updateFocus();
  }

  /**
   * Move focus to previous element
   */
  focusPrevious(): void {
    this.currentIndex =
      this.currentIndex <= 0 ? this.focusableElements.length - 1 : this.currentIndex - 1;
    this.updateFocus();
  }

  /**
   * Focus specific element by index
   */
  focusElement(index: number): void {
    if (index >= 0 && index < this.focusableElements.length) {
      this.currentIndex = index;
      this.updateFocus();
    }
  }

  private updateFocus(): void {
    this.webview.postMessage({
      type: 'accessibility',
      command: 'updateFocus',
      containerSelector: this.containerSelector,
      elementIndex: this.currentIndex,
    });
  }
}

/**
 * Focus trap for modal dialogs
 */
export class FocusTrap {
  constructor(
    private webview: vscode.Webview,
    private modalSelector: string
  ) {}

  /**
   * Activate focus trap
   */
  activate(): void {
    this.webview.postMessage({
      type: 'accessibility',
      command: 'activateFocusTrap',
      modalSelector: this.modalSelector,
    });
  }

  /**
   * Deactivate focus trap
   */
  deactivate(): void {
    this.webview.postMessage({
      type: 'accessibility',
      command: 'deactivateFocusTrap',
      modalSelector: this.modalSelector,
    });
  }
}

/**
 * ARIA labels for common UI elements
 */
export const ARIA_LABELS = {
  // Panels
  TOOLS_PANEL: 'Tools panel',
  PROPERTIES_PANEL: 'Properties panel',
  LAYERS_PANEL: 'Layers panel',
  TILE_PALETTE_PANEL: 'Tile palette panel',
  VALIDATION_PANEL: 'Validation panel',
  STATISTICS_PANEL: 'Statistics panel',
  HISTORY_PANEL: 'History panel',

  // Panel controls
  MINIMIZE_PANEL: 'Minimize panel',
  MAXIMIZE_PANEL: 'Maximize panel',
  CLOSE_PANEL: 'Close panel',
  DOCK_PANEL: 'Dock panel',

  // Tools
  PAINT_TOOL: 'Paint tool',
  FILL_TOOL: 'Fill tool',
  LINE_TOOL: 'Line tool',
  RECTANGLE_TOOL: 'Rectangle tool',
  CIRCLE_TOOL: 'Circle tool',
  SELECT_TOOL: 'Selection tool',
  PICKER_TOOL: 'Color picker tool',
  ERASER_TOOL: 'Eraser tool',

  // Navigation
  MAIN_CONTENT: 'Main content',
  SKIP_TO_MAIN: 'Skip to main content',
  WORKSPACE_HEADER: 'Workspace header',
  STATUS_BAR: 'Status bar',

  // Layout controls
  PRESET_MAPPING: 'Mapping layout preset',
  PRESET_SCRIPTING: 'Scripting layout preset',
  PRESET_ANALYSIS: 'Analysis layout preset',
  SAVE_LAYOUT: 'Save current layout',
  LOAD_LAYOUT: 'Load saved layout',
  RESET_LAYOUT: 'Reset to default layout',

  // Split view
  SPLIT_HORIZONTAL: 'Split view horizontally',
  SPLIT_VERTICAL: 'Split view vertically',
  UNSPLIT: 'Remove split view',

  // Properties
  TILE_TYPE_SELECT: 'Select tile type',
  HEIGHT_SLIDER: 'Adjust height level',
  BUILDING_SELECT: 'Select building type',

  // Layers
  TOGGLE_LAYER_VISIBILITY: 'Toggle layer visibility',
  LAYER_CHECKBOX: 'Layer visibility checkbox',

  // Validation
  RUN_VALIDATION: 'Run full validation',
  AUTO_FIX: 'Auto-fix issues',
  VALIDATION_RULE: 'Validation rule toggle',

  // History
  UNDO_ACTION: 'Undo last action',
  REDO_ACTION: 'Redo action',
  CLEAR_HISTORY: 'Clear history',

  // Search
  SEARCH_TILES: 'Search tiles',
  SEARCH_PATTERNS: 'Search script patterns',

  // Categories
  CATEGORY_ALL: 'Show all categories',
  CATEGORY_EVENTS: 'Show events category',
  CATEGORY_LOGIC: 'Show logic category',
  CATEGORY_ACTIONS: 'Show actions category',
};

/**
 * Generate ARIA label for dynamic content
 */
export function generateAriaLabel(type: string, context?: any): string {
  switch (type) {
    case 'tile':
      return `Tile ${context.id}${context.selected ? ', selected' : ''}`;
    case 'layer':
      return `${context.name} layer, ${context.visible ? 'visible' : 'hidden'}`;
    case 'panel':
      return `${context.title} panel${context.collapsed ? ', collapsed' : ''}${context.maximized ? ', maximized' : ''}`;
    case 'tool':
      return `${context.name} tool${context.active ? ', active' : ''}`;
    case 'validation-issue':
      return `${context.severity} validation issue: ${context.message}`;
    case 'history-item':
      return `History: ${context.action} at ${context.time}`;
    default:
      return '';
  }
}

/**
 * High contrast theme detection
 */
export function isHighContrastTheme(): boolean {
  const theme = vscode.window.activeColorTheme;
  return (
    theme.kind === vscode.ColorThemeKind.HighContrast ||
    theme.kind === vscode.ColorThemeKind.HighContrastLight
  );
}

/**
 * Skip navigation links configuration
 */
export interface SkipLink {
  id: string;
  label: string;
  target: string;
}

export const SKIP_LINKS: SkipLink[] = [
  {
    id: 'skip-to-main',
    label: 'Skip to main content',
    target: '#workspace-content',
  },
  {
    id: 'skip-to-tools',
    label: 'Skip to tools',
    target: '#panel-tools',
  },
  {
    id: 'skip-to-properties',
    label: 'Skip to properties',
    target: '#panel-properties',
  },
  {
    id: 'skip-to-status',
    label: 'Skip to status bar',
    target: '#workspace-status',
  },
];

/**
 * Accessible tooltip configuration
 */
export interface TooltipConfig {
  content: string;
  showOnFocus?: boolean;
  showDelay?: number;
  hideDelay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  role?: 'tooltip' | 'description';
}

/**
 * Create accessible tooltip
 */
export function createTooltip(
  webview: vscode.Webview,
  elementSelector: string,
  config: TooltipConfig
): void {
  webview.postMessage({
    type: 'accessibility',
    command: 'createTooltip',
    elementSelector,
    config: {
      showOnFocus: true,
      showDelay: 500,
      hideDelay: 0,
      position: 'top',
      role: 'tooltip',
      ...config,
    },
  });
}
