# Macros

Macros are reserved variable names that provide access to game state and allow some modifications. They can be used in conditions, assignments, and expressions.

## Read-Only Macros

These macros return values but cannot be modified:

### Resource and Count Macros

| Macro | Return Type | Description |
|-------|-------------|-------------|
| `buildings` | int | Total number of buildings |
| `creatures` | int | Total number of creatures |
| `hostiles` | int | Number of hostile units |
| `miners` | int | Total number of miners |
| `monsters` | int | Number of monsters |
| `vehicles` | int | Total number of vehicles |
| `bat` / `Bat_C` | int | Number of bats |
| `slugs` | int | Number of slimy slugs |

### Time and Progress

| Macro | Return Type | Description |
|-------|-------------|-------------|
| `time` | float | Seconds elapsed since level start |
| `clock` | float | Same as `time` |

### Tile ID Macros

| Macro | Return Type | Description |
|-------|-------------|-------------|
| `building_path` | int | Tile ID of building path (14) |
| `crystal_seam` | int | Tile ID of crystal seam (42) |
| `dirt` | int | Tile ID of dirt (26) |
| `hard_rock` | int | Tile ID of hard rock (34) |
| `lava` | int | Tile ID of lava (6) |
| `loose_rock` | int | Tile ID of loose rock (30) |
| `ore_seam` | int | Tile ID of ore seam (46) |
| `progress_path` | int | Tile ID of progress path (13) |
| `slug_hole` | int | Tile ID of slug hole (12) |
| `solid_rock` | int | Tile ID of solid rock (38) |
| `water` | int | Tile ID of water (11) |

### Building Count Macros

| Macro | Return Type | Description |
|-------|-------------|-------------|
| `docks` / `Docks_C` | int | Number of Docks |
| `electricfence` / `ElectricFence_C` | int | Number of Electric Fences |
| `geologicalcenter` / `GeologicalCenter_C` | int | Number of Geological Centers |
| `mininglaser` / `MiningLaser_C` | int | Number of Mining Lasers |
| `orerefinery` / `OreRefinery_C` | int | Number of Ore Refineries |
| `powerstation` / `PowerStation_C` | int | Number of Power Stations |
| `supportstation` / `SupportStation_C` | int | Number of Support Stations |
| `teleportpad` / `TeleportPad_C` | int | Number of Teleport Pads |
| `toolstore` / `Toolstore_C` | int | Number of Tool Stores |
| `upgradestation` / `UpgradeStation` | int | Number of Upgrade Stations |

### Vehicle Count Macros

| Macro | Return Type | Description |
|-------|-------------|-------------|
| `cargocarrier` / `CargoCarrier_C` | int | Number of Cargo Carriers |
| `chromecrusher` / `ChromeCrusher_C` | int | Number of Chrome Crushers |
| `granitegrinder` / `GraniteGrinder_C` | int | Number of Granite Grinders |
| `hoverscout` / `HoverScout_C` | int | Number of Hover Scouts |
| `LMLC` / `LMLC_C` | int | Number of Large Mobile Laser Cutters |
| `loaderdozer` / `LoaderDozer_C` | int | Number of Loader Dozers |
| `rapidrider` / `RapidRider_C` | int | Number of Rapid Riders |
| `smalldigger` / `SmallDigger_C` | int | Number of Small Diggers |
| `smalltransporttruck` / `SmallTransportTruck_C` | int | Number of Small Transport Trucks |
| `SMLC` / `SMLC_C` | int | Number of Small Mobile Laser Cutters |
| `tunnelscout` / `TunnelScout_C` | int | Number of Tunnel Scouts |
| `tunneltransport` / `TunnelTransport_C` | int | Number of Tunnel Transports |

### Last Object References

| Macro | Return Type | Description |
|-------|-------------|-------------|
| `ConstructedBuilding` | building | Last constructed building |
| `lastbuilding` | building | Last building that triggered an event |
| `lastcreature` | creature | Last creature that triggered an event |
| `lastminer` | miner | Last miner that triggered an event |
| `lastvehicle` | vehicle | Last vehicle that triggered an event |

### Special Macros

| Macro | Return Type | Description |
|-------|-------------|-------------|
| `Crystal_C` | int | Number of unstored crystals |
| `true` | int | Returns 1 (for boolean use) |
| `false` | int | Returns 0 (for boolean use) |

### Parameterized Macros

| Macro | Return Type | Description |
|-------|-------------|-------------|
| `get(ROW)(COLUMN)` | int | Returns tile ID at specified coordinates |
| `random(MIN)(MAX)` | int/float | Random number between MIN and MAX (inclusive) |

## Read-Write Macros

These macros can be both read and modified:

| Macro | Type | Description |
|-------|------|-------------|
| `air` | int | Current air in miner-seconds (capped between 0 and map limit) |
| `crystals` | int | Stored crystal count |
| `erosionscale` | float | Erosion time multiplier |
| `ore` | int | Stored ore count |
| `studs` | int | Building studs count |

### Special Behaviors

#### erosionscale
- Initially set from info section
- Multiplies erosion phase durations
- Setting to 2.0 doubles erosion time
- **Setting to 0.0 permanently stops all erosions**
- Once set to 0, erosions never restart even if changed back

#### air
- Setting to 0 or below causes immediate map loss
- Automatically capped at map's maximum air limit
- See [Air/Oxygen System](../../format/air-oxygen-system.md) for details

## Important Limitations

### No Nested Parameter Macros
Parameters for `get()` and `random()` cannot contain other parameterized macros:

```
# WRONG - Not allowed
mytile=get(random(0)(31))(random(0)(31));

# CORRECT - Use intermediate variables
int myrow=0;
int mycol=0;

MyChain::
myrow=random(0)(31);
mycol=random(0)(31);
mytile=get(myrow)(mycol);
```

## Usage Examples

### Resource Management
```
# Give player resources
AddResources::
air+=100;
crystals+=20;
ore+=30;
studs+=40;
```

### Conditional Checks
```
# Check multiple resources
when(crystals>=50 and ore>=25)[ResourceGoalMet];

# Check building counts
when(buildings.BuildingToolStore_C>0 and buildings.BuildingPowerStation_C>0)[BasicBuildingsComplete];
```

### Random Events
```
int RandomTile=0
int Row=0
int Col=0

GetRandomTile::
Row=random(5)(25);
Col=random(5)(25);
RandomTile=get(Row)(Col);
```

### Dynamic Difficulty
```
# Adjust erosion based on player performance
CheckDifficulty::
if(time<300 and crystals>100)[MakeHarder];
if(time>600 and crystals<50)[MakeEasier];

MakeHarder::
erosionscale:0.5;  # Faster erosion

MakeEasier::
erosionscale:2.0;  # Slower erosion
```

## Collection Macros

All collection class names can be used as macros to return counts. See:
- [Buildings](../classes/buildings.md) - Building collections
- [Vehicles](../classes/vehicles.md) - Vehicle collections
- [Creatures](../classes/creatures.md) - Creature collections
- [Miners](../classes/miners.md) - Miner properties

## See Also
- [Variables](variables.md) - User-defined variables
- [Conditions](conditions.md) - Using macros in conditions
- [Events](events.md) - Modifying macros with events