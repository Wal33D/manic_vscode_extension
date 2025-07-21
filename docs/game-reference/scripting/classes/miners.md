# Miner Class

Miners (Rock Raiders) are the primary units under your command. The miner class allows scripts to reference and interact with specific miners on the map.

## Declaration

```
miner name=id
```

- References miner with specific ID
- ID must match miner placed in map or teleported
- ID 0 is typically the Chief

### Examples
```
miner Chief=0
miner Engineer=1
miner Geologist=2
miner TrackedMiner      # Unassigned
```

## Miner Types

### Roles
- **Standard Miner** - Basic Rock Raider
- **Chief** - Usually ID 0, mission critical
- **Engineer** - Specialized for repairs
- **Geologist** - Specialized for surveying
- **Pilot** - Vehicle operator

### Abilities
Miners can:
- Walk and climb
- Drill walls
- Collect resources
- Operate vehicles
- Construct buildings
- Fight creatures (if armed)

## Miner Events

### miners (teleport)
Teleport new miners to location.
```
miners:row,col,count

# Example
miners:10,10,3;  # Teleport 3 miners
```

### lastminer
Capture reference to triggering miner.
```
lastminer:MinerVariable

# Example
when(enter:10,10:miners)[SaveMiner];

SaveMiner::
lastminer:ActiveMiner;
```

### heal
Restore miner health.
```
heal:MinerVariable,amount

# Example
miner Chief=0
heal:Chief,50;
```

### kill
Teleport miner away.
```
kill:MinerVariable

# Example
kill:InjuredMiner;
```

### Miner Triggers
```
miner Chief=0

# Health monitoring
when(Chief.hurt)[ChiefHurt];
when(Chief.dead)[ChiefLost];

# Movement tracking  
when(Chief.walk:10,10)[ChiefAtLocation];
when(Chief.drive:15,15)[ChiefDriving];

# Action detection
when(Chief.laser)[ChiefShooting];
when(Chief.drill)[ChiefDrilling];
```

## Miner Properties

### Health Points (.hp)
```
miner Chief=0

# Check health
((Chief.hp < 50))[ChiefInjured];
((Chief.hp == 100))[ChiefHealthy];
```

### Position (.row/.col)
```
# Track miner location
int ChiefRow=0
int ChiefCol=0

GetChiefPosition::
ChiefRow:Chief.row;
ChiefCol:Chief.col;
```

### State Properties
```
# Check miner state (if supported)
((Chief.inVehicle == true))[ChiefDriving];
((Chief.carrying == true))[ChiefCarrying];
```

## Miner Management

### Collection Count
```
# Total miners
((miners > 5))[EnoughMiners];
((miners == 0))[NoMiners];
((miners < 3))[NeedMoreMiners];
```

### Movement Triggers
```
# Track miner movement
when(walk:10,10)[MinerWalkedHere];
when(enter:10,10:miners)[MinerEnteredTile];

# Specific miner movement
miner Scout=1
when(Scout.walk:15,15)[ScoutAtTarget];
```

### Enable/Disable
```
# Control miner teleportation
disable:miners;   # No miner teleport
enable:miners;    # Allow teleport again
```

## Common Patterns

### Chief Protection
```
miner Chief=0
bool ChiefWarned=false
int ChiefHeals=3

# Monitor Chief health
when(Chief.hp < 75 and ChiefWarned==false)[WarnChief];
when(Chief.hp < 25 and ChiefHeals > 0)[EmergencyHeal];
when(Chief.dead)[MissionFailed];

WarnChief::
ChiefWarned:true;
msg:ChiefInDanger;
pan:Chief.row,Chief.col;

EmergencyHeal::
ChiefHeals-=1;
heal:Chief,50;
msg:ChiefHealed;

MissionFailed::
lose:ChiefWasLost;
```

### Squad Management
```
# Track squad of miners
miner Squad1=1
miner Squad2=2
miner Squad3=3
int SquadSize=3

# Monitor squad
when(Squad1.dead)[SquadMemberLost];
when(Squad2.dead)[SquadMemberLost];
when(Squad3.dead)[SquadMemberLost];

SquadMemberLost::
SquadSize-=1;
((SquadSize == 0))[SquadEliminated];
msg:SquadMemberLost;
```

### Miner Waypoints
```
arrow WayPoint1=green
arrow WayPoint2=yellow
arrow WayPoint3=red
miner Scout=1
int WayPointReached=0

# Guide miner through waypoints
ShowWayPoint1::
highlightarrow:10,10,WayPoint1;
objective:ReachGreenMarker;

when(Scout.walk:10,10 and WayPointReached==0)[ReachedWP1];

ReachedWP1::
WayPointReached:1;
removearrow:WayPoint1;
highlightarrow:20,20,WayPoint2;
objective:ReachYellowMarker;
```

### Resource Collection
```
# Track miner resource gathering
int CrystalsDelivered=0

# Detect when miner delivers crystals
when(enter:10,10:miners and crystals > LastCrystals)[CrystalDelivered];

CrystalDelivered::
CrystalsDelivered+=1;
LastCrystals:crystals;
((CrystalsDelivered >= 10))[CollectionGoalMet];
```

## Advanced Techniques

### Miner Roles
```
# Assign specific roles
miner Driller=1
miner Builder=2
miner Guard=3
bool RolesAssigned=false

AssignRoles::
RolesAssigned:true;
msg:DrillersToWalls;
# Direct different miners to tasks
```

### Dynamic Miner Tracking
```
# Track last active miner
miner LastActiveMiner
string LastAction=""

when(drill:any)[RecordDrill];
when(walk:any)[RecordWalk];

RecordDrill::
lastminer:LastActiveMiner;
LastAction:"Drilling";

RecordWalk::
lastminer:LastActiveMiner;
LastAction:"Walking";
```

### Miner Escort Mission
```
# Escort VIP miner
miner VIP=0
miner Guard1=1
miner Guard2=2

# Check guards stay close
CheckGuardProximity::
((abs(VIP.row - Guard1.row) > 3 or 
  abs(VIP.col - Guard1.col) > 3))[Guard1TooFar];

Guard1TooFar::
msg:Guard1ReturnToVIP;
highlightarrow:VIP.row,VIP.col,GuardArrow;
```

### Miner Abilities
```
# Track miner equipment/training
miner Specialist=1
bool HasDrill=true
bool HasLaser=false
bool IsTrained=false

# Upgrade miner
UpgradeSpecialist::
((buildings.BuildingUpgradeStation_C > 0))[DoUpgrade][NoUpgradeStation];

DoUpgrade::
HasLaser:true;
IsTrained:true;
msg:SpecialistUpgraded;
```

## Best Practices

### 1. ID Management
```
# Reserve ID 0 for Chief
miner Chief=0

# Use sequential IDs
miner Worker1=1
miner Worker2=2

# Document special IDs
miner VIPGeologist=10  # Special mission miner
```

### 2. Reference Validation
```
# Check if miner still exists
miner Target=1

UseMiner::
((Target.hp > 0))[MinerExists][MinerGone];
```

### 3. State Tracking
```
miner TrackedMiner=1
bool MinerBusy=false

# Track miner state
when(TrackedMiner.drill)[SetBusy];
when(TrackedMiner.walk)[SetFree];

SetBusy::
MinerBusy:true;

SetFree::
MinerBusy:false;
```

### 4. Performance
```
# Avoid too many per-miner triggers
# Use collection triggers when possible
# Track critical miners only
```

## Common Issues

### Miner Not Found
```
# ID doesn't match any miner
# Miner was teleported away
# Miner is in vehicle (some triggers)
# Wrong miner ID
```

### Reference Issues
```
# Multiple variables same miner - ERROR
miner Miner1=0
miner Miner2=0  # ERROR!

# Reference invalid after teleport up
# Cannot track miners in vehicles for some events
```

### Movement Tracking
```
# Walk triggers fire frequently
# Enter triggers more reliable
# Position updates may lag
```

## Examples

### Complete Miner Tutorial
```
# Teach player miner control
miner Student=0
arrow GuideArrow=green
int LessonNumber=0

init::
StartTutorial;

StartTutorial::
LessonNumber:1;
msg:Lesson1_MoveMiner;
highlightarrow:10,10,GuideArrow;

when(Student.walk:10,10 and LessonNumber==1)[Lesson2];

Lesson2::
LessonNumber:2;
removearrow:GuideArrow;
msg:Lesson2_DrillWall;
highlightarrow:10,11,GuideArrow;

when(drill:10,11 and LessonNumber==2)[Lesson3];

Lesson3::
LessonNumber:3;
msg:WellDone_TutorialComplete;
removearrow:GuideArrow;
```

### Miner Rescue Mission
```
# Rescue trapped miners
miner Trapped1=10
miner Trapped2=11
miner Trapped3=12
int MinersRescued=0

init::
objective:RescueThreeMiners;
ShowTrappedMiners;

ShowTrappedMiners::
highlightarrow:30,30,TrapArrow1;
highlightarrow:40,40,TrapArrow2;
highlightarrow:50,50,TrapArrow3;

# Detect rescue
when(Trapped1.walk:10,10)[Rescued1];
when(Trapped2.walk:10,10)[Rescued2];
when(Trapped3.walk:10,10)[Rescued3];

Rescued1::
MinersRescued+=1;
removearrow:TrapArrow1;
msg:MinerRescued;
CheckVictory;

CheckVictory::
((MinersRescued >= 3))[win:AllMinersRescued];
```

### Miner Defense System
```
# Coordinate miner defense
int DefenseAlert=0
miner Guard1=1
miner Guard2=2

# Alert system
when(creatures.CreatureRockMonster_C > 0)[RaiseAlert];

RaiseAlert::
DefenseAlert:1;
msg:DefenseStations;
# Position guards

# Guard responses
when(Guard1.laser)[GuardEngaged];
when(Guard2.laser)[GuardEngaged];

GuardEngaged::
msg:GuardsFighting;
```

## See Also
- [Variables](../syntax/variables.md) - Miner variable declaration
- [Miners Section](../../format/sections/miners.md) - Pre-placed miners
- [Miner Events](../syntax/events.md#entity-spawning) - Miner control
- [Collections](../syntax/macros.md#collection-macros) - Miner counts