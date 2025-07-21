# Reserved Words Reference

This is the comprehensive guide to all 251+ reserved words in the Manic Miners scripting language. These words cannot be used as variable names, event chain names, or other identifiers.

## Overview

Reserved words are special keywords in the Manic Miners scripting language that have predefined meanings. Using these words as identifiers will cause script parsing errors or unexpected behavior.

## Quick Reference

### Core Language Keywords
- **Variable Types**: `int`, `float`, `bool`, `string`, `intarray`
- **Object Types**: `arrow`, `timer`, `miner`, `vehicle`, `creature`, `building`
- **Control Flow**: `if`, `when`, `true`, `false`
- **Directions**: `N`, `S`, `E`, `W`, `A`

### Common Reserved Words to Avoid
```
# DON'T use these as variable names:
int crystals=0        # Reserved - built-in variable
bool true=false       # Reserved - keyword
string msg="test"     # Reserved - event name
timer timer=MyTimer   # Reserved - type name
arrow arrow=red       # Reserved - type name
```

### Good Variable Names
```
# DO use descriptive names with prefixes:
int playerScore=0
bool hasFoundSecret=false
string welcomeMessage="Hello"
timer countdownTimer=60
arrow guideArrow=green
```

## Complete Reserved Words by Category

### Variable Types
- `bool` - Boolean variable declaration
- `float` - Floating-point variable declaration  
- `int` - Integer variable declaration
- `intarray` - Integer array declaration
- `string` - String variable declaration

### Object Types
- `arrow` - Arrow object declaration
- `building` - Building object/trigger
- `creature` - Creature object declaration
- `miner` - Miner object declaration
- `timer` - Timer object declaration
- `vehicle` - Vehicle object declaration

### Control Keywords
- `if` - One-time trigger
- `when` - Repeating trigger
- `true` - Boolean true value (1)
- `false` - Boolean false value (0)

### Direction Constants
- `N` - North
- `S` - South  
- `E` - East
- `W` - West
- `A` - Automatic

### Colors (Arrow)
- `black`
- `blue`
- `darkgreen`
- `green`
- `red`
- `white`
- `yellow`

### Events (Alphabetical)
- `addrandomspawn` - Configure random spawn
- `callfunction` - Call an event chain
- `change` - Trigger when tile changes
- `destroyall` - Destroy all objects
- `disable` - Disable object
- `discovertile` - Objective keyword
- `drill` - Drill/destroy tile
- `drive` - Trigger when vehicle drives over
- `emerge` - Spawn creature
- `emergebl` - Emerge with blocking
- `enable` - Enable object
- `enter` - Trigger when entering tile
- `findbuilding` - Objective keyword
- `generatelandslide` - Create landslide
- `heal` - Heal object
- `hidearrow` - Hide arrow object
- `highlight` - Highlight tile
- `highlightarrow` - Show and highlight arrow
- `hover` - Trigger on mouse hover
- `kill` - Kill object
- `landslide` - Landslide event
- `laser` - Trigger when wall destroyed by laser
- `laserhit` - Trigger when wall hit by laser
- `lose` - Lose the map
- `msg` - Display message
- `pan` - Pan camera
- `pause` - Pause game
- `place` - Change tile
- `qmsg` - Quick message
- `quitloop` - Exit event loop
- `reinforce` - Trigger on wall reinforce
- `removearrow` - Remove arrow
- `reset` - Reset player selection
- `resetspeed` - Reset game speed
- `resources` - Objective keyword
- `resume` - Resume game (same as unpause)
- `save` - Save last miner
- `savebuilding` - Save last building
- `savecreature` - Save last creature
- `savevehicle` - Save last vehicle
- `shake` - Shake camera
- `showarrow` - Show arrow object
- `sound` - Play sound file
- `spawncap` - Configure spawn cap
- `spawnwave` - Configure spawn wave
- `speed` - Set game speed
- `startrandomspawn` - Start random spawning
- `starttimer` - Start timer
- `stoprandomspawn` - Stop random spawning
- `stoptimer` - Stop timer
- `truewait` - Wait real time
- `trulyplace` - Place tile (different from place)
- `undiscover` - Undiscover tile
- `unpause` - Unpause game
- `variable` - Objective keyword
- `wait` - Wait game time
- `walk` - Trigger when miner walks
- `win` - Win the map

### Triggers
- `built` - Building constructed
- `click` - Object clicked
- `dead` - Object destroyed
- `driven` - Vehicle entered
- `hurt` - Object damaged
- `init` - Map initialization
- `levelup` - Upgrade completed
- `new` - Object created
- `poweroff` - Building loses power
- `poweron` - Building gains power
- `tick` - Per-frame update
- `time` - Time-based trigger
- `upgrade` - Upgrade trigger
- `upgraded` - Deprecated upgrade trigger

### Macros - Resources
- `air` - Air supply (miner-seconds)
- `crystals` - Stored crystals
- `ore` - Stored ore
- `studs` - Building studs

### Macros - Counts
- `buildings` - Total buildings
- `creatures` - Total creatures
- `hostiles` - Hostile creatures
- `miners` - Total miners
- `monsters` - Monster count
- `vehicles` - Total vehicles

### Macros - Time
- `time` / `clock` - Elapsed seconds

### Macros - Tile IDs
- `building_path` - ID 14
- `crystal_seam` - ID 42
- `dirt` - ID 26
- `hard_rock` - ID 34
- `lava` - ID 6
- `loose_rock` - ID 30
- `ore_seam` - ID 46
- `progress_path` - ID 13
- `slug_hole` - ID 12
- `solid_rock` - ID 38
- `water` - ID 11

### Macros - Special
- `erosionscale` - Erosion speed multiplier
- `get` - Get tile at coordinates
- `random` - Random number generator
- `lastbuilding` - Last building in trigger
- `lastcreature` - Last creature in trigger
- `lastminer` - Last miner in trigger
- `lastvehicle` - Last vehicle in trigger
- `ConstructedBuilding` - Last built building

### Data Fields
- `col` / `column` - Object column
- `driver` / `driverid` - Vehicle driver
- `eaten` - Crystals absorbed
- `health` / `hp` / `stamina` - Hit points
- `id` - Object ID
- `ispowered` / `power` / `powered` - Power status
- `level` - Upgrade level
- `row` - Object row
- `tile` / `tileid` - Tile ID
- `X` - X coordinate (300/cell)
- `Y` - Y coordinate (300/cell)
- `Z` - Z coordinate (300/cell)

### Building Collections
- `Barrier_C` - Construction barriers
- `BuildingCanteen_C` / `Canteen_C` / `canteen`
- `BuildingDocks_C` / `Docks_C` / `docks`
- `BuildingElectricFence_C` / `ElectricFence_C` / `electricfence`
- `BuildingGeologicalCenter_C` / `GeologicalCenter_C` / `geologicalcenter`
- `BuildingMiningLaser_C` / `MiningLaser_C` / `mininglaser`
- `BuildingOreRefinery_C` / `OreRefinery_C` / `orerefinery`
- `BuildingPowerPath_C` - Power paths in progress
- `BuildingPowerStation_C` / `PowerStation_C` / `powerstation`
- `BuildingSuperTeleport_C` / `SuperTeleport_C` / `superteleport`
- `BuildingSupportStation_C` / `SupportStation_C` / `supportstation`
- `BuildingTeleportPad_C` / `TeleportPad_C` / `teleportpad`
- `BuildingToolStore_C` / `Toolstore_C` / `toolstore`
- `BuildingUpgradeStation_C` / `UpgradeStation_C` / `upgradestation`

### Vehicle Collections
- `VehicleCargoCarrier_C` / `CargoCarrier_C` / `cargocarrier`
- `VehicleChromeCrusher_C` / `ChromeCrusher_C` / `chromecrusher`
- `VehicleGraniteGrinder_C` / `GraniteGrinder_C` / `granitegrinder`
- `VehicleHoverScout_C` / `HoverScout_C` / `hoverscout`
- `VehicleLMLC_C` / `LMLC_C` / `LMLC` - Large Mobile Laser Cutter
- `VehicleLoaderDozer_C` / `LoaderDozer_C` / `loaderdozer`
- `VehicleRapidRider_C` / `RapidRider_C` / `rapidrider`
- `VehicleSmallDigger_C` / `SmallDigger_C` / `smalldigger`
- `VehicleSmallTransportTruck_C` / `SmallTransportTruck_C` / `smalltransporttruck`
- `VehicleSMLC_C` / `SMLC_C` / `SMLC` - Small Mobile Laser Cutter
- `VehicleTunnelScout_C` / `TunnelScout_C` / `tunnelscout`
- `VehicleTunnelTransport_C` / `TunnelTransport_C` / `tunneltransport`

### Creature Collections
- `CreatureBat_C` / `Bat_C` / `Bat` / `bat`
- `CreatureIceMonster_C` / `IceMonster_C` / `IceMonster`
- `CreatureLavaMonster_C` / `LavaMonster_C` / `LavaMonster`
- `CreatureRockMonster_C` / `RockMonster_C` / `RockMonster`
- `CreatureSlimySlug_C` / `SlimySlug_C` / `SlimySlug` / `slugs`
- `CreatureSmallSpider_C` / `SmallSpider_C` / `SmallSpider`

### Environmental Collections
- `Crystal_C` - Unstored crystals
- `Dynamite_C` - Dynamite outside toolstore
- `EventErosion_C` - Active erosions
- `EventLandslide_C` - Active landslides
- `NavModifierLava_C` - Lava tiles
- `NavModifierPowerPath_C` - Power path tiles
- `NavModifierRubble_C` - Rubble tiles
- `NavModifierWater_C` - Water tiles
- `Ore_C` - All ore
- `RechargeSeamGoal_C` - Visible recharge seams
- `Stud_C` - Building studs

### Special Parameters
- `light` / `lights` - Enable/disable parameter

## Block System Reserved Prefixes

The visual block system generates internal names. Never use variable or event chain names beginning with:

- `CreatureEmergeEvent`
- `FleeTo`
- `PlaceEvent`
- `RandomSpawnSetup`
- `ScriptBlockTimerTrigger`
- `StartRandomSpawn`
- `StopRandomSpawn`
- `TimerTrigger`

## Best Practices

1. **Use descriptive names** that clearly indicate purpose
2. **Add prefixes** to avoid conflicts (e.g., `myTimer` instead of `timer`)
3. **Check this list** before naming new variables or chains
4. **Use camelCase** for multi-word identifiers
5. **Avoid abbreviations** that might conflict with reserved words
6. **Be aware of aliases** - many items have multiple names (e.g., `hp`/`health`/`stamina`)

## Important Notes

1. **Case Insensitive**: All reserved words are case-insensitive
2. **Undefined Behavior**: Using reserved words as identifiers causes undefined behavior
3. **Collections**: Collection names return counts when used as macros
4. **Aliases**: Many items have multiple names (use the full class name for clarity)

## Examples

### What NOT to Do
```
# These will cause errors or unexpected behavior:
int buildings=5         # Conflicts with buildings collection
bool win=true          # Conflicts with win event
string vehicle="car"   # Conflicts with vehicle type
timer time=60          # Conflicts with time macro
arrow red=green        # Conflicts with color constant
```

### What TO Do Instead
```
# Use descriptive names with prefixes:
int totalBuildings=5
bool hasWon=true
string vehicleName="car"  
timer gameTimer=60
arrow redArrow=green
```

### Checking for Conflicts
Before naming a variable, ask yourself:
1. Is it a type name? (int, bool, string, etc.)
2. Is it an event name? (msg, drill, place, etc.)
3. Is it a macro or collection? (crystals, buildings, etc.)
4. Is it a trigger? (init, tick, built, etc.)
5. Does it start with a block system prefix?

If yes to any of these, choose a different name!

## See Also
- [Variables](variables.md) - Variable declaration syntax and rules
- [Events](events.md) - Complete event command reference
- [Triggers](triggers.md) - Trigger types and usage
- [Macros](macros.md) - Using built-in macros
- [Classes](../classes.md) - Object collections and properties