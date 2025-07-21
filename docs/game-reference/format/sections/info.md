# Info Section

The `info{}` section is required and contains key-value pairs defining map metadata and configuration. It must be present in every valid DAT file.

## Format

```
info{
    key: value;
    key: value;
}
```

- Keys are lowercase ASCII (a-z)
- No space between key and colon
- Values start immediately after colon
- Every character after the colon is considered part of the value until the end of the line
- Each entry ends with semicolon (except multiline values)
- Order doesn't matter

## Required Keys

### rowcount
- **Type**: Integer
- **Description**: Number of rows (height) in the map
- **Minimum**: 3
- **Example**: `rowcount: 25;`

### colcount
- **Type**: Integer  
- **Description**: Number of columns (width) in the map
- **Minimum**: 3
- **Example**: `colcount: 25;`

## Common Keys

### biome
- **Type**: String
- **Values**: `rock`, `lava`, `ice`
- **Default**: `rock`
- **Example**: `biome: rock;`

### levelname
- **Type**: String
- **Description**: Map display name
- **Note**: All characters after `:` until end of line
- **Important**: Do not enclose the name in double quotes
- **Unicode**: Non-ANSI characters including UTF-8/16 sequences work (causes map editor to save as UTF-16LE BOM)
- **Example**: `levelname: Crystal Challenge;`

### creator
- **Type**: String
- **Description**: Map author name
- **Note**: Set only on initial creation, does not change when saving the map
- **Important**: Do not enclose the name in double quotes
- **Unicode**: Non-ANSI characters including UTF-8/16 sequences work (causes map editor to save as UTF-16LE BOM)
- **Example**: `creator: MapMaker;`

### version
- **Type**: String
- **Format**: `yyyy-mm-dd` or `yyyy-mm-dd-n`
- **Description**: Engine version that saved the map
- **Example**: `version: 2023-08-14-1;`

## Resource Settings

### initialcrystals
- **Type**: Integer
- **Default**: 0
- **Description**: Starting crystal count
- **Example**: `initialcrystals: 10;`

### initialore
- **Type**: Integer
- **Default**: 0
- **Description**: Starting ore count
- **Example**: `initialore: 5;`

### oxygen
- **Type**: Integer pair
- **Format**: `initial/maximum`
- **Default**: Unlimited (if omitted)
- **Description**: Air supply settings in miner-seconds
- **Example**: `oxygen: 1000/1000;`
- **See Also**: [Air/Oxygen System](../air-oxygen-system.md)

## Camera Settings

### camerapos
- **Type**: Complex string
- **Format**: `Translation: X=n Y=n Z=n Rotation: P=n Y=n R=n Scale X=n Y=n Z=n`
- **Units**: 300 world units per tile
- **Description**: Camera position, rotation, and scale
- **Default**: Center of map with P=45 (45-degree angle looking down), Y=-90 (so tile 0,0 is upper left)
- **Example**: 
```
camerapos: Translation: X=1200.0 Y=1200.0 Z=0.0 Rotation: P=45.0 Y=-90.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0;
```

#### Translation Components
- **X**: East/West position (column * 300)
- **Y**: North/South position (row * 300)  
- **Z**: Height position

#### Rotation Components
- **P**: Pitch (-180 to 180 degrees)
- **Y**: Yaw (-180 to 180 degrees)
- **R**: Roll (-180 to 180 degrees)

#### Scale Components
- **X, Y, Z**: Scale factors (default 1.0)

### Legacy Camera Keys
- **cameraangle**: X,Y,Z angles (deprecated)
- **camerazoom**: Zoom level (deprecated)

## Spider Settings

### spiderrate
- **Type**: Float
- **Range**: 0.0 - 100.0
- **Default**: 0
- **Description**: Percentage chance of spider spawn on wall collapse
- **Example**: `spiderrate: 10.0;`

### spidermin
- **Type**: Integer
- **Default**: 0
- **Description**: Minimum spiders per spawn
- **Example**: `spidermin: 2;`

### spidermax
- **Type**: Integer
- **Default**: 0
- **Description**: Maximum spiders per spawn
- **Example**: `spidermax: 4;`

## Erosion Settings

### erosioninitialwaittime
- **Type**: Float
- **Unit**: Seconds
- **Default**: 0
- **Description**: Delay before erosions start
- **Example**: `erosioninitialwaittime: 30.0;`

### erosionscale
- **Type**: Float
- **Default**: 1.0
- **Description**: Global erosion time multiplier
- **Note**: 0.0 disables erosion, 2.0 doubles erosion time
- **Script**: This value is the initial value for the script erosionscale macro
- **Example**: `erosionscale: 1.5;`

## Cave Discovery

### opencaves
- **Type**: Coordinate list
- **Format**: `row,col/row,col/...`
- **Description**: Initially discovered cave areas
- **Behavior**: The engine looks at every tile starting at each location and identifies a closed region that surrounds that tile - that closed region will be visible when the map starts. If there is no closed region, the entire map is visible.
- **Legacy Maps**: Many legacy maps lack this value. The engine attempts automatic detection of the initial open location, which usually works but can be incorrect. Fix by opening in map editor and resaving.
- **Example**: `opencaves: 3,4/10,10/15,20/;`

## Coordinate System Notes

- Grid coordinates: Zero-indexed (0 to count-1)
- World coordinates: Each tile is 300 units
- Center of tile [0,0] is at world (150, 150)
- Formula: `world = (grid * 300) + 150`

## Examples

### Basic Map (8x8)
```
info{
    rowcount: 8;
    colcount: 8;
    biome: rock;
}
```

### Full Featured Map
```
info{
    rowcount: 25;
    colcount: 25;
    biome: rock;
    levelname: Crystal Caverns;
    creator: MapDesigner;
    version: 2023-08-14-1;
    initialcrystals: 10;
    initialore: 5;
    oxygen: 1000/1000;
    camerapos: Translation: X=3750.0 Y=3750.0 Z=0.0 Rotation: P=45.0 Y=-90.0 R=0.0 Scale X=1.0 Y=1.0 Z=1.0;
    spiderrate: 10.0;
    spidermin: 2;
    spidermax: 4;
    erosionscale: 1.0;
    opencaves: 12,12/;
}
```

## See Also
- [DAT Format Overview](../overview.md)
- [Tiles Section](tiles.md)
- [Height Section](height.md)
- [Common Patterns](../../../technical-reference/common-patterns.md)