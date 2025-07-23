# TileAnimationManager

## Properties

| Name | Type | Description |
|------|------|-------------|
| `animations` | `Map<number, AnimationState>` |  |
| `animationFrame` | `number | null` |  |
| `lastUpdate` | `number` |  |
| `onUpdate` | `() => void` |  |
| `animate` | `() => void` |  |

## Methods

### `startAnimations(tiles)`

**Parameters:**

- `tiles` (`number[][]`): 

**Returns:** `void`

### `stopAnimations()`

**Returns:** `void`

### `getCurrentTileId(originalTileId)`

**Parameters:**

- `originalTileId` (`number`): 

**Returns:** `number`

### `findBaseAnimation(tileId)`

**Parameters:**

- `tileId` (`number`): 

**Returns:** `{ baseId: number; animation: TileAnimation; currentFrame: number; } | null`

### `isAnimating()`

**Returns:** `boolean`

