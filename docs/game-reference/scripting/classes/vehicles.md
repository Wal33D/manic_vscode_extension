# Vehicle Class

Vehicles are mobile units that provide enhanced capabilities for mining operations. The vehicle class allows scripts to reference and control specific vehicles on the map.

## Declaration

```
vehicle name=id
```

- References vehicle with specific ID
- ID must match vehicle placed in map editor or teleported
- Vehicle must exist when script loads
- Cannot dynamically assign at runtime using ID
- Undiscovered vehicles are inactive until discovered

### Examples
```
vehicle Truck=0
vehicle Scout=1
vehicle Digger=2
vehicle TrackedVehicle    # Unassigned
```

## Vehicle Types

### Ground Vehicles
- `VehicleSmallDigger_C` / `SmallDigger_C` / `smalldigger` - Basic drilling
- `VehicleLoaderDozer_C` / `LoaderDozer_C` / `loaderdozer` - Clear rubble
- `VehicleSmallTransportTruck_C` / `SmallTransportTruck_C` / `smalltransporttruck` - Carry resources
- `VehicleSMLC_C` / `SMLC_C` / `SMLC` - Small Mobile Laser Cutter
- `VehicleLMLC_C` / `LMLC_C` / `LMLC` - Large Mobile Laser Cutter
- `VehicleChromeCrusher_C` / `ChromeCrusher_C` / `chromecrusher` - Chrome Crusher
- `VehicleGraniteGrinder_C` / `GraniteGrinder_C` / `granitegrinder` - Granite Grinder

### Fast Vehicles
- `VehicleHoverScout_C` / `HoverScout_C` / `hoverscout` - Fast reconnaissance
- `VehicleRapidRider_C` / `RapidRider_C` / `rapidrider` - Fast water vehicle

### Water Vehicles
- `VehicleCargoCarrier_C` / `CargoCarrier_C` / `cargocarrier` - Water transport

### Air Vehicles
- `VehicleTunnelScout_C` / `TunnelScout_C` / `tunnelscout` - Flying scout
- `VehicleTunnelTransport_C` / `TunnelTransport_C` / `tunneltransport` - Air transport

**Note**: Multiple names exist for legacy compatibility. Use the full `Vehicle*_C` names for clarity.

## Vehicle Events

### lastvehicle / savevehicle
Capture reference to triggering vehicle.
```
lastvehicle:VehicleVariable
savevehicle:VehicleVariable  # Alternative syntax

# Example
when(drive:10,10)[SaveVehicle];

SaveVehicle::
lastvehicle:ActiveVehicle;
# or
savevehicle:ActiveVehicle;
```

### heal
Repair vehicle damage.
```
heal:VehicleVariable,amount

# Example
vehicle Truck=0
heal:Truck,50;
```

### kill
Teleport vehicle away.
```
kill:VehicleVariable

# Example
kill:DamagedVehicle;
```

### Vehicle Triggers
```
vehicle Scout=0

# Health monitoring
when(Scout.hurt)[ScoutDamaged];
when(Scout.dead)[ScoutLost];

# Movement tracking
when(Scout.drive:10,10)[ScoutAtLocation];

# Action detection
when(Scout.laser)[ScoutFiring];
when(Scout.drill)[ScoutDrilling];

# Click detection
when(click:Scout)[ScoutClicked];

# Upgrade detection
when(Scout.upgrade)[ScoutUpgraded];

# New vehicle detection (collection only)
when(vehicle.new)[NewVehicleCreated];
```

## Vehicle Properties

### Health Points (.hp/.health)
```
vehicle Digger=0

# Check health (both are aliases)
((Digger.hp < 50))[DiggerDamaged];
((Digger.health == 100))[DiggerRepaired];
```

### Position Properties
```
# Basic position
int VehicleRow=Scout.row
int VehicleCol=Scout.col      # or .column (alias)

# Fine-grained position (300 units per tile)
int PreciseX=Scout.X
int PreciseY=Scout.Y
int PreciseZ=Scout.Z

# Tile under vehicle
int TileAtVehicle=Scout.tile  # or .tileid (alias)
```

### Driver Properties
```
# Get driver miner ID
int DriverID=Scout.driver    # or .driverid (alias)

# Check if occupied
((Scout.driver >= 0))[VehicleOccupied];
((Scout.driver < 0))[VehicleEmpty];
```

### Other Properties
```
# Vehicle ID
int VehicleID=Scout.id

# Note: There's no .level property to query upgrade status
# Use .upgrades or .upgrade trigger instead
```

## Vehicle Macros

### Count Macros
```
# Total vehicle count
int TotalVehicles=vehicles

# Specific type counts (multiple aliases)
int ScoutCount=hoverscout           # or HoverScout_C
int DiggerCount=smalldigger         # or SmallDigger_C
int TruckCount=smalltransporttruck  # or SmallTransportTruck_C
int DozerCount=loaderdozer          # or LoaderDozer_C
int CarrierCount=cargocarrier       # or CargoCarrier_C
int RiderCount=rapidrider           # or RapidRider_C
int ChromeCount=chromecrusher       # or ChromeCrusher_C
int GraniteCount=granitegrinder     # or GraniteGrinder_C
int LMLCCount=LMLC                  # or LMLC_C
int SMLCCount=SMLC                  # or SMLC_C
int TunnelScoutCount=tunnelscout    # or TunnelScout_C
int TunnelTransCount=tunneltransport # or TunnelTransport_C
```

## Vehicle Management

### Collection Count
```
# Total vehicles
((vehicles > 3))[EnoughVehicles];
((vehicles == 0))[NoVehicles];

# Specific types
((hoverscout > 0))[HasScout];
((loaderdozer >= 2))[EnoughDozers];
```

### Movement Triggers
```
# Any vehicle movement
when(drive:10,10)[VehicleHere];

# Specific vehicle type
when(drive:15,15:VehicleHoverScout_C)[ScoutHere];

# Individual vehicle
vehicle MyTruck=1
when(MyTruck.drive:20,20)[TruckArrived];
```

### Enable/Disable
```
# Control vehicle types
disable:vehicles;              # No vehicles
disable:VehicleHoverScout_C;   # No scouts
enable:vehicles;               # Allow all
enable:VehicleLargeDigger_C;   # Allow specific
```

## Common Patterns

### Vehicle Escort
```
vehicle Transport=0
vehicle Guard1=1
vehicle Guard2=2
bool EscortActive=true

# Monitor escort formation
CheckEscort::
((EscortActive == false))[];
((abs(Transport.row - Guard1.row) > 5))[Guard1Far];
((abs(Transport.row - Guard2.row) > 5))[Guard2Far];

Guard1Far::
msg:Guard1TooFarFromTransport;
highlightarrow:Transport.row,Transport.col,EscortArrow;
```

### Mining Operations
```
vehicle Digger=0
vehicle Truck=1
int OreLoads=0

# Coordinate mining
when(Digger.drill)[DiggerWorking];
when(drive:10,10:VehicleSmallTransportTruck_C)[TruckDelivery];

DiggerWorking::
msg:DiggerDrillingOre;

TruckDelivery::
OreLoads+=1;
((OreLoads >= 10))[MiningComplete];
```

### Vehicle Deployment
```
arrow DeployZone=green
int VehiclesDeployed=0

# Guide vehicle placement
ShowDeploymentZone::
highlightarrow:25,25,DeployZone;
objective:DeployThreeVehicles;

when(new:vehicles)[VehicleDeployed];

VehicleDeployed::
VehiclesDeployed+=1;
((VehiclesDeployed >= 3))[DeploymentComplete];

DeploymentComplete::
removearrow:DeployZone;
objective:BeginMiningOperations;
```

### Vehicle Patrol
```
vehicle PatrolScout=0
int PatrolPoint=1

# Waypoint patrol
UpdatePatrol::
((PatrolPoint == 1))[GoToPoint2];
((PatrolPoint == 2))[GoToPoint3];
((PatrolPoint == 3))[GoToPoint4];
((PatrolPoint == 4))[GoToPoint1];

GoToPoint1::
highlightarrow:10,10,PatrolArrow;
PatrolPoint:1;

when(PatrolScout.drive:10,10 and PatrolPoint==1)[UpdatePatrol];
# Continue for other points...
```

## Advanced Techniques

### Vehicle Fleet Management
```
# Track vehicle fleet
vehicle Fleet1=1
vehicle Fleet2=2
vehicle Fleet3=3
int FleetHealth=300

# Monitor fleet status
UpdateFleetHealth::
FleetHealth:0;
FleetHealth+=Fleet1.hp;
FleetHealth+=Fleet2.hp;
FleetHealth+=Fleet3.hp;
((FleetHealth < 150))[FleetCritical];
```

### Automated Mining
```
vehicle AutoDigger=0
bool MiningActive=true
int MiningCycle=0

# Automated mining loop
when(MiningActive==true and MiningCycle==0)[StartMining];

StartMining::
MiningCycle:1;
# Move to ore location
highlightarrow:30,30,MineArrow;

when(AutoDigger.drive:30,30 and MiningCycle==1)[BeginDrilling];

BeginDrilling::
MiningCycle:2;
# Trigger drilling

when(AutoDigger.drill and MiningCycle==2)[ReturnToBase];

ReturnToBase::
MiningCycle:3;
highlightarrow:10,10,BaseArrow;

when(AutoDigger.drive:10,10 and MiningCycle==3)[CompleteCycle];

CompleteCycle::
MiningCycle:0;  # Restart
```

### Vehicle Upgrades
```
vehicle UpgradableDigger=0
int DiggerLevel=1

# Upgrade system
UpgradeDigger::
((buildings.BuildingUpgradeStation_C > 0))[PerformUpgrade][NoUpgradeStation];

PerformUpgrade::
((crystals >= 50*DiggerLevel))[DoUpgrade][InsufficientCrystals];

DoUpgrade::
crystals:0-50*DiggerLevel;
DiggerLevel+=1;
heal:UpgradableDigger,100;
msg:DiggerUpgraded;
```

### Emergency Response
```
# Emergency vehicle dispatch
vehicle EmergencyScout=0
bool EmergencyActive=false

when(buildings.hurt)[BuildingEmergency];

BuildingEmergency::
((EmergencyActive == true))[];
EmergencyActive:true;
lastbuilding:DamagedBuilding;
# Send scout to location
highlightarrow:DamagedBuilding.row,DamagedBuilding.col,EmergencyArrow;
```

## Best Practices

### 1. ID Management
```
# Use meaningful ID assignments
vehicle PrimaryDigger=0
vehicle SecondaryDigger=1
vehicle TransportAlpha=2
vehicle TransportBeta=3
```

### 2. Reference Validation
```
# Check vehicle exists
vehicle Target=0

UseVehicle::
((Target.hp > 0))[VehicleExists][VehicleLost];
```

### 3. Type Checking
```
# Ensure correct vehicle type
when(new:VehicleHoverScout_C)[ScoutDeployed];
when(new:VehicleLoaderDozer_C)[DozerDeployed];
```

### 4. Performance
```
# Limit active vehicle triggers
# Track critical vehicles only
# Use collection triggers when possible
```

## Special Notes

### Collection Behavior

The `vehicle` keyword can be used as a special collection in triggers:
```
# Detect ANY new vehicle
when(vehicle.new)[AnyNewVehicle];

# Specific trigger overrides general
vehicle Sofia=0
when(Sofia.dead)[SofiaDestroyed];    # This fires
when(vehicle.dead)[SomeVehicleDied]; # This doesn't fire for Sofia
```

### Assignment Rules

```
# Valid assignments
vehicle V1=0       # Static ID assignment
vehicle V2         # Unassigned

# Dynamic assignment
lastvehicle:V2     # After trigger
savevehicle:V2     # Alternative syntax

# Vehicles can be assigned to each other
V1:V2              # Valid

# Cannot dynamically assign by ID at runtime
# V1=5              # NOT POSSIBLE after declaration
```

### Undiscovered Vehicles

- Vehicles in undiscovered areas are inactive
- They don't receive triggers until discovered
- Plan accordingly for pre-placed vehicles

## Common Issues

### Vehicle Not Found
```
# ID doesn't match any vehicle
# Vehicle was destroyed
# Vehicle not yet teleported
# Wrong vehicle ID
```

### Reference Issues
```
# Multiple variables same vehicle - ERROR
vehicle Vehicle1=0
vehicle Vehicle2=0  # ERROR!

# Reference invalid after destruction
# Driver affects some properties
```

### Movement Tracking
```
# Drive triggers fire frequently
# Path finding affects triggers
# Terrain affects movement
```

## Examples

### Complete Transport Mission
```
# Transport valuable cargo
vehicle Transport=0
arrow StartPoint=green
arrow EndPoint=red
bool CargoLoaded=false

init::
objective:TransportCargoSafely;
highlightarrow:10,10,StartPoint;

# Load cargo
when(Transport.drive:10,10 and CargoLoaded==false)[LoadCargo];

LoadCargo::
CargoLoaded:true;
msg:CargoLoaded;
removearrow:StartPoint;
highlightarrow:40,40,EndPoint;
objective:DeliverToDestination;

# Monitor transport health
when(Transport.hp < 50 and CargoLoaded==true)[TransportDanger];

TransportDanger::
msg:TransportUnderAttack;
pan:Transport.row,Transport.col;

# Delivery
when(Transport.drive:40,40 and CargoLoaded==true)[DeliveryComplete];

DeliveryComplete::
removearrow:EndPoint;
win:CargoDelivered;
```

### Racing Challenge
```
# Vehicle racing minigame
vehicle Racer1=1
vehicle Racer2=2
float RaceStartTime=0.0
int Winner=0

init::
RaceStartTime:time;
msg:RaceBegins;
highlightarrow:50,50,FinishLine;

# Detect winner
when(Racer1.drive:50,50 and Winner==0)[Racer1Wins];
when(Racer2.drive:50,50 and Winner==0)[Racer2Wins];

Racer1Wins::
Winner:1;
float RaceTime=0.0
RaceTime:time-RaceStartTime;
msg:Racer1Wins;
msg:RaceTime;

Racer2Wins::
Winner:2;
float RaceTime=0.0
RaceTime:time-RaceStartTime;
msg:Racer2Wins;
msg:RaceTime;
```

### Vehicle Combat
```
# Combat vehicles vs creatures
vehicle CombatScout=0
int EnemiesDestroyed=0

# Track combat
when(CombatScout.laser)[ScoutEngaged];
when(creatures.CreatureRockMonster_C == 0)[WaveCleared];

ScoutEngaged::
msg:ScoutEngagingEnemy;

WaveCleared::
EnemiesDestroyed+=creatures.CreatureRockMonster_C;
msg:WaveCleared;
wait:10.0;
NextWave;
```

## See Also
- [Variables](../syntax/variables.md) - Vehicle variable declaration
- [Vehicles Section](../../format/sections/vehicles.md) - Pre-placed vehicles
- [Vehicle Events](../syntax/events.md#object-management) - Vehicle control
- [Collections](../syntax/macros.md#collection-macros) - Vehicle counts