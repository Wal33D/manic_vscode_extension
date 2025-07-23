# MapAccessibilityValidator

## Properties

| Name | Type | Description |
|------|------|-------------|
| `tiles` | `number[][]` |  |
| `buildings` | `Entity[]` |  |
| `objectives` | `Objective[]` |  |
| `rowCount` | `number` |  |
| `colCount` | `number` |  |

## Methods

### `validate(datFile)`

**Parameters:**

- `datFile` (`DatFile`): 

**Returns:** `AccessibilityResult`

### `findToolStore()`

**Returns:** `{ row: number; col: number; } | null`

### `findObjectiveLocations()`

**Returns:** `ObjectiveLocation[]`

### `findSpawnPoints()`

**Returns:** `{ row: number; col: number; }[]`

### `findCrystalLocations()`

**Returns:** `{ row: number; col: number; }[]`

### `findBuildingSites()`

**Returns:** `{ row: number; col: number; }[]`

### `generateReachabilityMap(start)`

**Parameters:**

- `start` (`{ row: number; col: number; }`): 

**Returns:** `number[][]`

### `findUnreachableAreas(reachabilityMap)`

**Parameters:**

- `reachabilityMap` (`number[][]`): 

**Returns:** `{ row: number; col: number; }[]`

### `isLocationReachable(location, reachabilityMap)`

**Parameters:**

- `location` (`{ row: number; col: number; }`): 
- `reachabilityMap` (`number[][]`): 

**Returns:** `boolean`

### `findIsolatedAreas()`

**Returns:** `{ center: { row: number; col: number; }; size: number; hasResources: boolean; }[]`

### `exploreArea(startRow, startCol, visited)`

**Parameters:**

- `startRow` (`number`): 
- `startCol` (`number`): 
- `visited` (`Set<string>`): 

**Returns:** `{ center: { row: number; col: number; }; size: number; hasResources: boolean; }`

### `analyzeCriticalPaths(toolStore, objectives)`

**Parameters:**

- `toolStore` (`{ row: number; col: number; }`): 
- `objectives` (`ObjectiveLocation[]`): 

**Returns:** `{ from: string; to: string; path: any[]; chokepoints: { row: number; col: number; }[]; }[]`

### `identifyChokepoints(path)`

**Parameters:**

- `path` (`{ row: number; col: number; }[]`): 

**Returns:** `{ row: number; col: number; }[]`

### `isChokepoint(row, col)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 

**Returns:** `boolean`

### `detectImpossibleScenarios()`

**Returns:** `ValidationError[]`

### `hasAdequateSpace(location)`

**Parameters:**

- `location` (`{ row: number; col: number; }`): 

**Returns:** `boolean`

### `calculateAccessibilityMetrics(reachabilityMap, criticalPaths)`

**Parameters:**

- `reachabilityMap` (`number[][]`): 
- `criticalPaths` (`any[]`): 

**Returns:** `any`

### `isPassable(row, col)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 

**Returns:** `boolean`

### `getPassableNeighbors(row, col)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 

**Returns:** `{ row: number; col: number; }[]`

### `getAllNeighbors(row, col)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 

**Returns:** `{ row: number; col: number; }[]`

### `isResourceTile(tileId)`

**Parameters:**

- `tileId` (`number`): 

**Returns:** `boolean`

### `isMissionCriticalBuilding(type)`

**Parameters:**

- `type` (`string`): 

**Returns:** `boolean`

### `isValidSpawnPoint(row, col)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 

**Returns:** `boolean`

### `isSuitableBuildingSite(row, col, size)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 
- `size` (`number`): 

**Returns:** `boolean`

### `getRequiredBuildings(objective)`

**Parameters:**

- `objective` (`Objective`): 

**Returns:** `string[]`

### `findPath(start, end)`

**Parameters:**

- `start` (`{ row: number; col: number; }`): 
- `end` (`{ row: number; col: number; }`): 

**Returns:** `{ path: any[]; cost: number; } | null`

### `heuristic(a, b)`

**Parameters:**

- `a` (`{ row: number; col: number; }`): 
- `b` (`{ row: number; col: number; }`): 

**Returns:** `number`

### `findSlugHoles()`

**Returns:** `{ row: number; col: number; }[]`

### `generateReachabilityMapAvoidingTiles(start, avoidTiles)`

**Parameters:**

- `start` (`{ row: number; col: number; }`): 
- `avoidTiles` (`{ row: number; col: number; }[]`): 

**Returns:** `number[][]`

### `identifyErosionRisks()`

**Returns:** `{ location: { row: number; col: number; }; severity: "medium" | "low" | "critical"; }[]`

### `isAdjacentToHazard(row, col)`

**Parameters:**

- `row` (`number`): 
- `col` (`number`): 

**Returns:** `boolean`

### `analyzeResourceAvailability()`

**Returns:** `{ sufficient: boolean; message: string; }`

