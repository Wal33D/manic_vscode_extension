# API Reference

## data/tileDefinitions

### getTileInfo



```typescript
(tileId: number): TileDefinition | undefined
```

## quickActions/quickActionsEnhanced

### getTileName



```typescript
(tileId: number): string
```

### registerEnhancedQuickActionsCommands



```typescript
(context: ExtensionContext, tileSetsManager: CustomTileSetsManager, undoRedoProvider: UndoRedoProvider): void
```

## accessibility/accessibilityCommands

### getTileDescription



```typescript
(tileId: number): string
```

### navigateSection



```typescript
(forward: boolean): void
```

## data/enhancedTileDefinitions

### isReinforcedTile



```typescript
(tileId: number): boolean
```

### getReinforcedTileId



```typescript
(tileId: number): number | null
```

### getEnhancedTileInfo



```typescript
(tileId: number): TileDefinition | undefined
```

### getEnhancedTileName



```typescript
(tileId: number): string
```

### getEnhancedTileDescription



```typescript
(tileId: number): string
```

## mapEditor/autoTiling

### getBaseTileId



```typescript
(tileType: AutoTileType): number
```

### supportsAutoTiling



```typescript
(tileId: number): boolean
```

## workspace/lazyLoader

### getTileColor



```typescript
(tileId: number): string
```

## data/extendedTileDefinitions

### createPlaceholderTile



```typescript
(id: number, category: "ground" | "wall" | "resource" | "hazard" | "special" | "rubble", description?: string | undefined): TileDefinition
```

### getExtendedTileInfo



```typescript
(tileId: number): TileDefinition | undefined
```

## data/advancedTileDefinitions

### getAdvancedTileInfo



```typescript
(tileId: number): AdvancedTileDefinition | undefined
```

### getHardnessName



```typescript
(hardness: Hardness): string
```

### getDrillTimeEstimate



```typescript
(hardness: Hardness): string
```

### getTilesWithResource



```typescript
(resource: "crystal" | "ore" | "studs"): number[]
```

### getTilesByHardness



```typescript
(hardness: Hardness): number[]
```

### getTilesWithTriggers



```typescript
(): Map<TileTrigger, number[]>
```

### canBuildAtSlope



```typescript
(tileId: number, currentSlope: number): boolean
```

### isWallTile



```typescript
(tileId: number): boolean
```

### isFloorTile



```typescript
(tileId: number): boolean
```

### isFluidTile



```typescript
(tileId: number): boolean
```

### isResourceTile



```typescript
(tileId: number): boolean
```

### isHazardTile



```typescript
(tileId: number): boolean
```

### getTileResourceYield



```typescript
(tileId: number): { crystals: number; ore: number; studs: number; }
```

## mapPreview/colorMap

### getColorMap



```typescript
(): ColorMap
```

### getRgbaString



```typescript
(color: Color): string
```

### getBiomeColors



```typescript
(): BiomeColorMap
```

### getBiomeColor



```typescript
(biome: string): Color
```

## quickActions/quickActionsProvider

### registerQuickActionsCommands



```typescript
(context: ExtensionContext, tileSetsManager: CustomTileSetsManager): void
```

## mapTemplates/mapTemplatesProvider

### registerMapTemplateCommands



```typescript
(context: ExtensionContext): void
```

## validation/validationCommands

### registerValidationCommands



```typescript
(context: ExtensionContext): void
```

### runFullValidation



```typescript
(document: TextDocument): Promise<void>
```

### fixCommonIssues



```typescript
(editor: TextEditor): Promise<void>
```

### fixInvalidTiles



```typescript
(editor: TextEditor, errors: ValidationError[]): Promise<void>
```

### addToolStore



```typescript
(editor: TextEditor): Promise<void>
```

### addGroundTiles



```typescript
(editor: TextEditor): Promise<void>
```

### adjustObjectives



```typescript
(editor: TextEditor, errors: ValidationError[]): Promise<void>
```

### fixNegativeValues



```typescript
(editor: TextEditor, errors: ValidationError[]): Promise<void>
```

### fixGridDimensions



```typescript
(editor: TextEditor, errors: ValidationError[]): Promise<void>
```

### showValidationReport



```typescript
(document: TextDocument, context: ExtensionContext): Promise<void>
```

### generateValidationReportHtml



```typescript
(results: ValidationResult, webview: Webview, context: ExtensionContext): string
```

## objectiveBuilder/objectiveBuilderProvider

### getNonce



```typescript
(): string
```

## objectiveBuilder/objectiveCommands

### registerObjectiveCommands



```typescript
(context: ExtensionContext): void
```

### analyzeObjectives



```typescript
(document: TextDocument): Promise<void>
```

### generateObjectiveReport



```typescript
(document: TextDocument, _context: ExtensionContext): Promise<void>
```

### convertObjectiveFormat



```typescript
(editor: TextEditor): Promise<void>
```

### parseObjectives



```typescript
(content: string): Objective[]
```

### analyzeObjectiveList



```typescript
(objectives: Objective[]): ObjectiveAnalysis
```

### formatBuildingName



```typescript
(building: string): string
```

### generateReportHtml



```typescript
(objectives: Objective[], analysis: ObjectiveAnalysis): string
```

## smartSuggestions/smartSuggestionProvider

### registerSmartSuggestionCommands



```typescript
(context: ExtensionContext): void
```

### parseTilesGrid



```typescript
(content: string): number[][]
```

### applyTileSuggestion



```typescript
(document: TextDocument, range: Range, gridPosition: { row: number; col: number; }, tileId: number): Promise<void>
```

### analyzeTilePatterns



```typescript
(tiles: number[][]): TilePatternAnalysis
```

### generateAnalysisHtml



```typescript
(analysis: TilePatternAnalysis): string
```

## versionControl/versionControlCommands

### registerVersionControlCommands



```typescript
(context: ExtensionContext, versionControl: MapVersionControl, diffProvider: MapDiffProvider): void
```

### restoreVersion



```typescript
(hash: string): Promise<void>
```

### compareWithCurrent



```typescript
(hash: string): Promise<void>
```

### viewVersion



```typescript
(version: MapVersion): Promise<void>
```

### generateMapPreview



```typescript
(tiles: number[][]): string
```

## commands/accessibilityCommands

### registerAccessibilityCommands



```typescript
(context: ExtensionContext): void
```

### showAccessibilityReport



```typescript
(result: any, uri: Uri): void
```

### showHeatmapVisualization



```typescript
(reachabilityMap: number[][], rows: number, cols: number): void
```

### getAccessibilityReportHtml



```typescript
(result: any, filePath: string): string
```

### getHeatmapHtml



```typescript
(reachabilityMap: number[][], rows: number, cols: number): string
```

## levelGenerators/levelGeneratorProvider

### registerLevelGeneratorCommands



```typescript
(context: ExtensionContext): void
```

## snippets/scriptPatterns

### getPatternsByCategory



```typescript
(category: "resources" | "tutorial" | "combat" | "state" | "objectives" | "timing" | "exploration"): ScriptPattern[]
```

### searchPatterns



```typescript
(query: string): ScriptPattern[]
```

## commands/scriptPatternCommands

### registerScriptPatternCommands



```typescript
(context: ExtensionContext): void
```

### getPatternDocsHtml



```typescript
(): string
```

### formatCategoryName



```typescript
(category: string): string
```

### highlightScriptCode



```typescript
(code: string): string
```

## mapEditor/mapEditorCommands

### registerMapEditorCommands



```typescript
(context: ExtensionContext): void
```

## mapEditor/tileAnimation

### requestAnimationFrame



```typescript
(callback: (time: number) => void): number
```

### cancelAnimationFrame



```typescript
(handle: number): void
```

## keyboard/keyboardShortcuts

### generateKeybindingsForPackageJson



```typescript
(shortcuts: KeyboardShortcut[]): PackageJsonKeybinding[]
```

## contextMenus/contextMenuCommands

### registerContextMenuCommands



```typescript
(context: ExtensionContext): void
```

### getCurrentSection



```typescript
(document: TextDocument, position: Position): string
```

## documentation/docViewer

### registerDocViewer



```typescript
(context: ExtensionContext, docRoot: string): Disposable
```

## documentation/docCommands

### registerDocumentationCommands



```typescript
(context: ExtensionContext): void
```

### exportDocumentation



```typescript
(format: string): Promise<void>
```

### exportAsPDF



```typescript
(_docRoot: string, progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>): Promise<void>
```

### exportAsHTML



```typescript
(_docRoot: string, progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>): Promise<void>
```

### exportAsMarkdownBundle



```typescript
(_docRoot: string, progress: Progress<{ message?: string | undefined; increment?: number | undefined; }>): Promise<void>
```

## utils/debounce

### debounce



```typescript
<T extends (...args: any[]) => any>(func: T, wait: number, options?: DebounceOptions): (...args: Parameters<T>) => void
```

### throttle



```typescript
<T extends (...args: any[]) => any>(func: T, wait: number, options?: { leading?: boolean | undefined; trailing?: boolean | undefined; }): (...args: Parameters<T>) => void
```

### debounceResize



```typescript
(callback: (event: Event) => void, delay?: number): (event: Event) => void
```

### debounceScroll



```typescript
(callback: (event: Event) => void, delay?: number): (event: Event) => void
```

## utils/cache

### memoize



```typescript
(options?: CacheOptions): (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor
```

### memoizeAsync



```typescript
(options?: CacheOptions): (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor
```

## utils/accessibility

### createLiveRegion



```typescript
(webview: Webview): AriaLiveRegion
```

### generateAriaLabel



```typescript
(type: string, context?: any): string
```

### isHighContrastTheme



```typescript
(): boolean
```

### createTooltip



```typescript
(webview: Webview, elementSelector: string, config: TooltipConfig): void
```

## extension

### activate



```typescript
(context: ExtensionContext): Promise<void>
```

### deactivate



```typescript
(): void
```

## builder/examples/scriptBuilderExamples

### createBasicLevel



```typescript
(): string
```

### createWaveSpawner



```typescript
(): string
```

### createBossFight



```typescript
(): string
```

### createResourcePuzzle



```typescript
(): string
```

### createConditionalChains



```typescript
(): string
```

### createTimedMission



```typescript
(): string
```

## commands/mapStatisticsCommands

### registerMapStatisticsCommands



```typescript
(context: ExtensionContext): void
```

### showMapStatistics



```typescript
(_context: ExtensionContext): Promise<void>
```

### showStatisticsHeatmap



```typescript
(context: ExtensionContext): Promise<void>
```

### generateStatisticsReport



```typescript
(): Promise<void>
```

### generateDetailedReport



```typescript
(stats: any, datFile: any): string
```

## commands/performanceCommands

### registerPerformanceCommands



```typescript
(context: ExtensionContext): void
```

### getPerformanceStatsHtml



```typescript
(stats: PerformanceStats): string
```

## test/utils/testHelpers

### createMockDocument



```typescript
(content: string): TextDocument
```

### createMockContext



```typescript
(): ExtensionContext
```

### createMockWebview



```typescript
(): Webview
```

### createMockWebviewView



```typescript
(): WebviewView
```

### waitFor



```typescript
(condition: () => boolean, timeout?: number, interval?: number): Promise<void>
```

### createSampleMapData



```typescript
(): { info: { name: string; author: string; version: string; size: { width: number; height: number; }; }; tiles: { id: number; type: number; height: number; }[]; buildings: { x: number; y: number; type: string; }[]; resources: { ...; }; }
```

## test/mapRendering.test

### generateTestTiles



```typescript
(rows: number, cols: number): number[][]
```

### calculateCanvasDimensions



```typescript
(tiles: number[][], tileSize: number): { width: number; height: number; }
```

### verifyAspectRatio



```typescript
(actual: { width: number; height: number; }, expected: { cols: number; rows: number; }): boolean
```

## test/golden/runGoldenTests

### runTests



```typescript
(): Promise<void>
```

## unified/stateSync

### initializeCommonStates



```typescript
(): void
```

## unified/themeManager

### createThemeCSS



```typescript
(_theme: Theme): string
```

### getThemeColor



```typescript
(colorPath: string): string | undefined
```

### applyThemeToWebview



```typescript
(webview: Webview): void
```

## unified/pluginManager

### getPluginManager



```typescript
(context?: ExtensionContext | undefined): PluginManager | undefined
```

