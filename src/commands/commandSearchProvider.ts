import { CommandPaletteProvider, CommandDefinition } from './commandPaletteProvider';

export class CommandSearchProvider {
  private searchHistory: string[] = [];
  private commandPalette: CommandPaletteProvider;

  constructor(commandPalette: CommandPaletteProvider) {
    this.commandPalette = commandPalette;
  }

  /**
   * Enhanced search that supports:
   * - Fuzzy matching
   * - Tag-based search
   * - Category filtering
   * - Keyboard shortcut search
   */
  public searchCommands(query: string): CommandSearchResult[] {
    const normalizedQuery = query.toLowerCase().trim();

    // Check if it's a category search (starts with @)
    if (normalizedQuery.startsWith('@')) {
      return this.searchByCategory(normalizedQuery.substring(1));
    }

    // Check if it's a tag search (starts with #)
    if (normalizedQuery.startsWith('#')) {
      return this.searchByTag(normalizedQuery.substring(1));
    }

    // Check if it's a keyboard shortcut search (contains key modifiers)
    if (this.isKeyboardShortcutQuery(normalizedQuery)) {
      return this.searchByKeyboardShortcut(normalizedQuery);
    }

    // Regular fuzzy search
    return this.fuzzySearch(normalizedQuery);
  }

  private searchByCategory(category: string): CommandSearchResult[] {
    // Implementation would access commands from CommandPaletteProvider
    // and filter by category
    // Placeholder to use commandPalette
    void this.commandPalette;
    void category;
    return [];
  }

  private searchByTag(_tag: string): CommandSearchResult[] {
    // Implementation would search commands by their tags
    return [];
  }

  private searchByKeyboardShortcut(_shortcut: string): CommandSearchResult[] {
    // Implementation would search commands by keyboard shortcuts
    return [];
  }

  private fuzzySearch(_query: string): CommandSearchResult[] {
    // Implementation would perform fuzzy matching on command titles and descriptions
    return [];
  }

  private isKeyboardShortcutQuery(query: string): boolean {
    const modifierKeys = ['ctrl', 'cmd', 'alt', 'shift', 'meta'];
    return modifierKeys.some(key => query.includes(key));
  }

  /**
   * Get search suggestions based on partial input
   */
  public getSuggestions(partial: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];

    // Add category suggestions
    if (partial.startsWith('@')) {
      suggestions.push({
        type: 'category',
        label: '@file-management',
        description: 'Search in File Management commands',
        icon: '$(files)',
      });
      suggestions.push({
        type: 'category',
        label: '@editing',
        description: 'Search in Editing commands',
        icon: '$(edit)',
      });
      suggestions.push({
        type: 'category',
        label: '@validation',
        description: 'Search in Validation commands',
        icon: '$(check)',
      });
    }

    // Add tag suggestions
    if (partial.startsWith('#')) {
      suggestions.push({
        type: 'tag',
        label: '#new',
        description: 'Commands for creating new items',
        icon: '$(add)',
      });
      suggestions.push({
        type: 'tag',
        label: '#fix',
        description: 'Commands for fixing issues',
        icon: '$(wrench)',
      });
      suggestions.push({
        type: 'tag',
        label: '#analyze',
        description: 'Analysis commands',
        icon: '$(graph)',
      });
    }

    // Add recent searches
    if (!partial.startsWith('@') && !partial.startsWith('#')) {
      this.searchHistory.slice(0, 3).forEach(recent => {
        suggestions.push({
          type: 'history',
          label: recent,
          description: 'Recent search',
          icon: '$(history)',
        });
      });
    }

    return suggestions;
  }

  /**
   * Add a search to history
   */
  public addToHistory(search: string) {
    if (!this.searchHistory.includes(search)) {
      this.searchHistory.unshift(search);
      if (this.searchHistory.length > 10) {
        this.searchHistory = this.searchHistory.slice(0, 10);
      }
    }
  }
}

export interface CommandSearchResult {
  command: CommandDefinition;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'tag' | 'category' | 'shortcut';
  highlights?: HighlightRange[];
}

export interface HighlightRange {
  start: number;
  end: number;
  field: 'title' | 'description' | 'tag';
}

export interface SearchSuggestion {
  type: 'category' | 'tag' | 'history' | 'command';
  label: string;
  description: string;
  icon: string;
}
