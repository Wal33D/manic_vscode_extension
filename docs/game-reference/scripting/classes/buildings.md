# Building Class

Buildings are structures that provide essential services to your mining operation. The building class allows scripts to reference and interact with specific buildings on the map.

## Declaration

```
building name=row,col
```

- References building at specific tile coordinates
- Uses the building's "foot point" (usually bottom-left)
- Can reference pre-placed or player-built buildings

### Examples
```
building ToolStore=10,10
building PowerStation=15,15
building MainBase         # Unassigned, set later
```

## Building Types

### Essential Buildings
- `BuildingToolStore_C` - Central hub for tools and teleportation
- `BuildingPowerStation_C` - Provides power to buildings
- `BuildingOreRefinery_C` - Processes ore into usable materials
- `BuildingTeleportPad_C` - Teleports units to surface

### Support Buildings
- `BuildingSupportStation_C` - Repairs and upgrades vehicles
- `BuildingUpgradeStation_C` - Upgrades miner abilities
- `BuildingGeologicalCenter_C` - Scans for resources
- `BuildingDocks_C` - Water vehicle support
- `BuildingCanteen_C` - Provides food for miners

### Defensive Buildings
- `BuildingBarracks_C` - Trains armed miners
- `BuildingElectricFence_C` - Defensive barrier
- `BuildingSonicBlaster_C` - Scares away creatures

### Production Buildings
- `BuildingMiningLaser_C` - Automated drilling
- `BuildingWaterPump_C` - Manages water/lava
- `BuildingSuperTeleport_C` - Advanced teleportation

## Building Events

### built
Detects when building is constructed.
```
# Any tool store built
when(built:BuildingToolStore_C)[ToolStoreBuilt];

# Specific location
when(built:BuildingToolStore_C:10,10)[SpecificToolStore];
```

### lastbuilding
Captures reference to triggering building.
```
lastbuilding:BuildingVariable

# Example
when(built:BuildingPowerStation_C)[SavePowerStation];

SavePowerStation::
lastbuilding:NewPowerStation;
```

### Building Triggers
```
building Base=10,10

# Health monitoring
when(Base.hurt)[BaseUnderAttack];
when(Base.dead)[BaseDestroyed];

# Click detection
when(click:Base)[BaseClicked];

# Power state changes
when(Base.poweron)[BasePowered];
when(Base.poweroff)[BaseLostPower];

# Upgrade detection
when(Base.levelup)[BaseUpgraded];
```

## Building Properties

### Health Points (.hp/.health)
```
building MainBase=10,10

# Check health
((MainBase.hp < 50))[RepairBase];
((MainBase.health == 0))[BaseDestroyed];  # .health is alias for .hp
```

### Position Properties
```
# Basic position
int BaseRow=MainBase.row      # or .row
int BaseCol=MainBase.col      # or .column (alias)

# Fine-grained position (300 units per tile)
int PreciseX=MainBase.X
int PreciseY=MainBase.Y  
int PreciseZ=MainBase.Z

# Tile ID at building location
int TileAtBase=MainBase.tile  # or .tileid (alias)
```

### Power Status (.power/.powered/.ispowered)
```
# Check if building has power
((MainBase.power == true))[BaseOperational];
((MainBase.ispowered == false))[NeedPower];  # All three are aliases
```

### Upgrade Level (.level)
```
# Check building upgrade level
((ToolStore.level == 2))[FullyUpgraded];
((ToolStore.level < 2))[CanUpgrade];
```

## Building Management

### heal
Repair building damage.
```
heal:BuildingVariable,amount

# Example
building ToolStore=10,10
heal:ToolStore,50;
```

### kill
Teleport building away.
```
kill:BuildingVariable

# Example
kill:OldPowerStation;
```

### disable/enable
Control building availability.
```
# Disable all tool stores
disable:BuildingToolStore_C;

# Disable specific building type
disable:BuildingSonicBlaster_C;

# Re-enable
enable:BuildingToolStore_C;
```

## Collection Properties

### Building Counts
```
# Total buildings
((buildings > 10))[ManyBuildings];

# Specific types
((buildings.BuildingToolStore_C > 0))[HasToolStore];
((buildings.BuildingPowerStation_C >= 2))[EnoughPower];
```

### Power Management
```
# Check power coverage
CheckPower::
((buildings.BuildingPowerStation_C == 0))[NoPower];
((buildings.BuildingPowerStation_C < buildings//5))[LowPower];
```

## Common Patterns

### Base Defense
```
building MainBase=10,10
bool BaseWarned=false

# Monitor base health
when(MainBase.hurt and BaseWarned==false)[WarnPlayer];
when(MainBase.hp < 25)[EmergencyRepair];
when(MainBase.dead)[GameOver];

WarnPlayer::
BaseWarned:true;
msg:BaseUnderAttack;
pan:MainBase.row,MainBase.col;

EmergencyRepair::
heal:MainBase,50;
msg:EmergencyRepairs;
```

### Building Requirements
```
bool HasInfrastructure=false

# Check essential buildings
CheckInfrastructure::
((buildings.BuildingToolStore_C > 0 and 
  buildings.BuildingPowerStation_C > 0))[InfrastructureOK][InfrastructureMissing];

InfrastructureOK::
HasInfrastructure:true;
objective:BuildOreRefinery;

InfrastructureMissing::
msg:NeedBasicBuildings;
```

### Progressive Unlocking
```
int TechLevel=1

# Unlock buildings based on progress
when(crystals > 50 and TechLevel==1)[UnlockTech2];
when(ore > 100 and TechLevel==2)[UnlockTech3];

UnlockTech2::
TechLevel:2;
enable:BuildingOreRefinery_C;
enable:BuildingSupportStation_C;
msg:NewBuildingsAvailable;

UnlockTech3::
TechLevel:3;
enable:BuildingUpgradeStation_C;
enable:BuildingMiningLaser_C;
```

### Building Placement Guide
```
arrow BuildArrow=green
bool ShowingBuildSpot=false

# Guide player to build location
ShowBuildLocation::
ShowingBuildSpot:true;
highlightarrow:20,20,BuildArrow;
msg:BuildPowerStationHere;

# Detect when built
when(built:BuildingPowerStation_C:20,20 and ShowingBuildSpot==true)[BuildComplete];

BuildComplete::
ShowingBuildSpot:false;
removearrow:BuildArrow;
msg:PerfectPlacement;
```

## Advanced Techniques

### Building Network
```
# Track connected buildings
building PowerGrid1=10,10
building PowerGrid2=20,20
building PowerGrid3=30,30
int ActiveGrids=0

# Monitor power grid
UpdatePowerGrid::
ActiveGrids:0;
((PowerGrid1.hp > 0))[ActiveGrids+=1];
((PowerGrid2.hp > 0))[ActiveGrids+=1];
((PowerGrid3.hp > 0))[ActiveGrids+=1];
((ActiveGrids < 2))[msg:PowerGridCritical];
```

### Automated Repairs
```
building CriticalBuilding=10,10
bool AutoRepairActive=true

# Auto-repair system
when(CriticalBuilding.hurt and AutoRepairActive==true)[AutoRepair];

AutoRepair::
((crystals >= 5))[DoRepair][NoResources];

DoRepair::
crystals:-5;
heal:CriticalBuilding,25;
msg:AutoRepairActivated;

NoResources::
msg:InsufficientCrystalsForRepair;
```

### Building Priorities
```
# Priority build order
int BuildPhase=1

CheckBuildProgress::
((BuildPhase == 1 and buildings.BuildingToolStore_C > 0))[NextPhase];
((BuildPhase == 2 and buildings.BuildingPowerStation_C > 0))[NextPhase];
((BuildPhase == 3 and buildings.BuildingOreRefinery_C > 0))[NextPhase];

NextPhase::
BuildPhase+=1;
UpdateObjective;

UpdateObjective::
((BuildPhase == 2))[objective:BuildPowerStation];
((BuildPhase == 3))[objective:BuildOreRefinery];
((BuildPhase == 4))[objective:ExpandOperation];
```

## Best Practices

### 1. Reference Validation
```
# Check if building still exists
building Target=10,10

UseBuilding::
((Target.hp > 0))[BuildingExists][BuildingGone];
```

### 2. Coordinate Accuracy
```
# Use exact foot point coordinates
# Tool Store is 2x2, foot at bottom-left
# If placed at 10,10, foot is at 10,10
building ToolStore=10,10  # Correct
# building ToolStore=11,11  # Wrong - not foot point
```

### 3. Multiple References
```
# ERROR - Multiple variables same building
building Base1=10,10
building Base2=10,10  # ERROR if same building!

# OK - Different buildings
building ToolStore1=10,10
building ToolStore2=20,20  # Different building
```

### 4. State Tracking
```
building PowerStation=15,15
bool PowerStationActive=true

# Track building state
when(PowerStation.dead)[PowerLost];

PowerLost::
PowerStationActive:false;
msg:PowerStationDestroyed;
```

## Common Issues

### Building Not Found
```
# Building at coordinates doesn't exist
# Building was destroyed
# Wrong coordinates (not foot point)
# Building in undiscovered cavern
```

### Reference Becomes Invalid
```
# Building destroyed - reference invalid
# Building teleported - reference invalid
# Cannot reassign to new building at same spot
```

### Trigger Limitations
```
# Cannot use dynamic references in triggers
# Must use static declarations
# Cannot create triggers after lastbuilding
```

## Special Notes

### Electric Fence Limitations

Electric Fences have significant scripting limitations:
- `new` and `built` triggers do NOT fire for fences (not hooked up internally)
- Cannot retrieve fence reference via `lastbuilding` 
- No array support for tracking multiple fences
- No triggers for power state changes
- Can only read the total count via `ElectricFence_C` or `electricfence` macro

```
# This WON'T work for Electric Fences:
when(built:BuildingElectricFence_C)[FenceBuilt];  # Never triggers!

# This WILL work:
when(electricfence > 0)[AtLeastOneFence];
```

### Building Assignment

```
# Static assignment (at map load)
building Base=10,10  # Must exist in map

# Dynamic assignment (during gameplay)
when(built:BuildingToolStore_C)[SaveToolStore];

SaveToolStore::
lastbuilding:NewToolStore;  # Capture reference

# LIMITATION: Cannot dynamically assign using row,col
# building B=lastminer.row,lastminer.col  # NOT POSSIBLE
```

### Undiscovered Buildings

Undiscovered buildings and their triggers are inactive until discovered. Plan accordingly for pre-placed buildings in undiscovered caverns.

### Special Collection Notes

- `BuildingPowerPath_C` - Only counts completed paths, deleted when finished
- `building` collection can be used in triggers but NOT as a macro for counting

## Examples

### Complete Base Management
```
# Base setup
building MainToolStore=10,10
building MainPower=15,15
building BackupPower=25,25
bool EmergencyMode=false

# Monitor critical buildings
when(MainToolStore.dead)[ToolStoreLost];
when(MainPower.dead and BackupPower.dead)[TotalPowerLoss];

# Automatic switching
when(MainPower.hurt and EmergencyMode==false)[ActivateEmergency];

ActivateEmergency::
EmergencyMode:true;
msg:SwitchingToBackupPower;
# Reroute power logic
```

### Building Tutorial
```
arrow BuildGuide=green
int TutorialStep=0

# Step 1: Build Tool Store
ShowToolStoreSpot::
TutorialStep:1;
highlightarrow:10,10,BuildGuide;
objective:BuildToolStoreHere;

when(built:BuildingToolStore_C:10,10 and TutorialStep==1)[Step2];

# Step 2: Build Power Station
Step2::
TutorialStep:2;
hidearrow:BuildGuide;
highlightarrow:15,15,BuildGuide;
objective:BuildPowerStationHere;
lastbuilding:TutorialToolStore;

when(built:BuildingPowerStation_C:15,15 and TutorialStep==2)[TutorialComplete];
```

### Strategic Building Placement
```
# Analyze best building locations
int OptimalRow=0
int OptimalCol=0

FindBuildLocation::
# Complex logic to find optimal spot
OptimalRow:20;
OptimalCol:20;
ShowBuildSpot;

ShowBuildSpot::
highlightarrow:OptimalRow,OptimalCol,BuildArrow;
msg:OptimalBuildLocation;
```

## See Also
- [Variables](../syntax/variables.md) - Building variable declaration
- [Built Section](../../format/sections/buildings.md) - Pre-placed buildings
- [Building Events](../syntax/events.md#building-management) - Building control
- [Collections](../syntax/macros.md#collection-macros) - Building counts