/**
 * Types for the smart tile suggestion system
 */

/**
 * A suggested tile with reasoning and confidence
 */
export interface TileSuggestion {
  tileId: number;
  reason: string;
  confidence: number; // 0-1, higher is more confident
  category?: string; // Optional category like 'wall', 'resource', 'hazard'
}

/**
 * Pattern matching result
 */
export interface PatternMatch {
  confidence: number;
  data: Record<string, unknown>;
}

/**
 * A tile pattern that can be matched and generate suggestions
 */
export interface TilePattern {
  name: string;
  description: string;
  matcher: (surrounding: (number | null)[][]) => PatternMatch;
  suggester: (match: PatternMatch, surrounding: (number | null)[][]) => TileSuggestion[];
}

/**
 * Options for suggestion generation
 */
export interface SuggestionOptions {
  includeReinforced?: boolean;
  preferSafe?: boolean;
  considerResources?: boolean;
  maxSuggestions?: number;
}

/**
 * Tile context information
 */
export interface TileContext {
  position: { row: number; col: number };
  surrounding: (number | null)[][];
  nearbyBuildings?: string[];
  mapMetadata?: {
    biome?: string;
    difficulty?: string;
    theme?: string;
  };
}

/**
 * Suggestion provider configuration
 */
export interface SuggestionProviderConfig {
  enablePatternMatching: boolean;
  enableContextAnalysis: boolean;
  enableMachineLearning: boolean; // Future feature
  customPatterns?: TilePattern[];
}
