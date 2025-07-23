# MapStatisticsAnalyzer

## Properties

| Name | Type | Description |
|------|------|-------------|
| `datFile` | `DatFile` |  |
| `width` | `number` |  |
| `height` | `number` |  |

## Methods

### `analyzeMap()`

**Returns:** `MapStatistics`

### `calculateTileDistribution()`

**Returns:** `TileDistribution[]`

### `analyzeResourceDistribution()`

**Returns:** `Map<string, ResourceDistribution>`

### `findResourceClusters(resourceType)`

**Parameters:**

- `resourceType` (`"ore" | "crystals"`): 

**Returns:** `ResourceCluster[]`

### `floodFillCluster(startX, startY, resourceGrid, visited)`

**Parameters:**

- `startX` (`number`): 
- `startY` (`number`): 
- `resourceGrid` (`number[][]`): 
- `visited` (`Set<string>`): 

**Returns:** `ResourceCluster`

### `calculateAccessibility()`

**Returns:** `AccessibilityScore`

### `floodFillAccessible(startX, startY, visited)`

**Parameters:**

- `startX` (`number`): 
- `startY` (`number`): 
- `visited` (`Set<string>`): 

**Returns:** `Set<string>`

### `countFloorTiles()`

**Returns:** `number`

### `findChokepoints(accessible)`

**Parameters:**

- `accessible` (`Set<string>`): 

**Returns:** `number`

### `calculateAveragePathWidth(accessible)`

**Parameters:**

- `accessible` (`Set<string>`): 

**Returns:** `number`

### `estimateDifficulty()`

**Returns:** `DifficultyEstimate`

### `calculateResourceAvailability()`

**Returns:** `number`

### `calculateAccessibleAreaScore()`

**Returns:** `number`

### `calculateDrillDifficulty()`

**Returns:** `number`

### `calculateHazardDensity()`

**Returns:** `number`

### `calculateObjectiveComplexity()`

**Returns:** `number`

### `analyzeBalance()`

**Returns:** `MapBalance`

### `countResourceTiles()`

**Returns:** `number`

### `countHazardTiles()`

**Returns:** `number`

### `countWallTiles()`

**Returns:** `number`

### `calculatePathComplexity()`

**Returns:** `number`

### `generateHeatmaps()`

**Returns:** `{ resource: number[][]; difficulty: number[][]; accessibility: number[][]; }`

### `generateResourceHeatmap()`

**Returns:** `number[][]`

### `generateDifficultyHeatmap()`

**Returns:** `number[][]`

### `generateAccessibilityHeatmap()`

**Returns:** `number[][]`

### `applyHeat(heatmap, cx, cy, intensity, radius)`

**Parameters:**

- `heatmap` (`number[][]`): 
- `cx` (`number`): 
- `cy` (`number`): 
- `intensity` (`number`): 
- `radius` (`number`): 

**Returns:** `void`

### `normalizeHeatmap(heatmap)`

**Parameters:**

- `heatmap` (`number[][]`): 

**Returns:** `number[][]`

### `generateReport(stats)`

**Parameters:**

- `stats` (`MapStatistics`): 

**Returns:** `string`

