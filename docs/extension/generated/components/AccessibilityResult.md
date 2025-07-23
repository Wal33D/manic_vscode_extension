# AccessibilityResult

## Properties

| Name | Type | Description |
|------|------|-------------|
| `isValid` | `boolean` |  |
| `errors` | `ValidationError[]` |  |
| `warnings` | `ValidationError[]` |  |
| `reachabilityMap` | `number[][] | undefined` |  |
| `unreachableAreas` | `{ row: number; col: number; }[] | undefined` |  |
| `analysis` | `{ totalAccessibleTiles: number; totalGroundTiles: number; accessibilityPercentage: number; isolatedAreas: number; criticalPaths: { from: string; to: string; path: any[]; }[]; } | undefined` |  |

