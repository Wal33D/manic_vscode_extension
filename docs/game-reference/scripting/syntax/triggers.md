# Triggers

Triggers are the core mechanism for detecting game events and executing actions in response. They listen for specific conditions and fire when those conditions are met.

## Trigger Syntax

```
OCCURRENCE(TRIGGER)((CONDITION))[TRUE_EVENT][FALSE_EVENT];
```

- **OCCURRENCE**: `if` or `when`
- **TRIGGER**: The event to detect
- **CONDITION**: Optional boolean test
- **TRUE_EVENT**: Action when condition is true (or no condition)
- **FALSE_EVENT**: Optional action when condition is false

## Occurrence Types

### if
Fires once then removes itself.
```
if(init)[StartGame];
if(time>10)[ShowMessage];
```

### when
Fires every time conditions are met.
```
when(enter:5,5)[PlayerEntered];
when(crystals<10)[LowResources];
```

## Trigger Types

### init
Fires once at map start.
```
if(init)[Initialize];
```
**Note**: Only use with `if`, not `when`.

### time
Fires based on game time (seconds).
```
when(time>60)[OneMinutePassed];
if(time==30)[HalfMinuteMark];
```

### enter
Fires when unit enters tile.
```
when(enter:10,10)[EnteredTile];
when(enter:5,5:miners)[MinerEntered];
when(enter:8,8:VehicleHoverScout_C)[ScoutEntered];
```

**Collections**:
- miners, vehicles, buildings
- Specific types: CreatureRockMonster_C, VehicleLoaderDozer_C, etc.

### laserdamage
Fires when tile takes laser damage.
```
when(laserdamage:10,10)[WallDamaged];
```

### change
Fires when tile changes.
```
when(change:5,5)[TileChanged];
when(change:10,10:1)[BecameGround];
when(change:10,10:1:6)[ChangedFromWallToGround];
```

### drill
Fires when wall is drilled.
```
when(drill:10,10)[WallDrilled];
```

### reinforce
Fires when wall is reinforced.
```
when(reinforce:8,8)[WallReinforced];
```

### drive
Fires when vehicle is on tile.
```
when(drive:5,5)[VehiclePresent];
when(drive:10,10:VehicleHoverScout_C)[ScoutPresent];
```

### walk
Fires when miner walks on tile.
```
when(walk:7,7)[MinerWalked];
```

### click
Fires when player clicks.
```
when(click:10,10)[TileClicked];
when(click:BuildingToolStore_C)[ToolStoreClicked];
when(click:MyBuildingVar)[SpecificBuildingClicked];
```

### hoverenter/hoverleave
Fires on mouse hover.
```
when(hoverenter:5,5)[MouseEntered];
when(hoverleave:5,5)[MouseLeft];
```

### built
Fires when building is placed.
```
when(built:BuildingToolStore_C)[ToolStoreBuilt];
when(built:BuildingPowerStation_C:10,10)[PowerStationAtLocation];
```

### new
Fires when unit is created.
```
when(new:miners)[MinerTeleported];
when(new:VehicleHoverScout_C)[ScoutCreated];
when(new:CreatureRockMonster_C)[MonsterSpawned];
```

## Resource Triggers

### crystals
Fires based on crystal count.
```
when(crystals>50)[CrystalGoalMet];
when(crystals<10)[LowCrystals];
when(crystals==100)[ExactAmount];
```

### ore
Fires based on ore count.
```
when(ore>=25)[OreCollected];
```

### studs
Fires based on stud count.
```
when(studs>100)[StudsAvailable];
```

### air
Fires based on oxygen level.
```
when(air<50)[LowOxygen];
```

## Collection Triggers

### miners/vehicles/buildings
Count-based triggers.
```
when(miners>5)[ManyMiners];
when(vehicles==0)[NoVehicles];
when(buildings.BuildingToolStore_C>0)[HasToolStore];
```

## Object Triggers

### Variable.trigger
Object-specific triggers.
```
miner Chief=0
when(Chief.hurt)[ChiefDamaged];
when(Chief.dead)[ChiefDefeated];
```

**Available triggers**:
- **.hurt**: Unit takes damage
- **.dead**: Unit is destroyed/leaves
- **.laser**: Unit fires laser
- **.drive**: Vehicle drives on tile

## Comparison Operators

```
>   Greater than
<   Less than
>=  Greater than or equal
<=  Less than or equal  
==  Equal to
!=  Not equal to
```

## Trigger Chains

### Sequential Triggers
```
if(init)[Phase1];
if(crystals>50)[Phase2];
if(ore>25)[Phase3];
```

### State-Based
```
bool Phase1Complete=false

when(crystals>50 and Phase1Complete==false)[CompletePhase1];

CompletePhase1::
Phase1Complete:true;
msg:Phase1Done;
```

## Common Patterns

### One-Time Events
```
bool RewardGiven=false

when(crystals>100 and RewardGiven==false)[GiveReward];

GiveReward::
RewardGiven:true;
ore:50;
```

### Timed Sequences
```
when(time>30 and time<35)[EarlyPhase];
when(time>60 and time<65)[MidPhase];
when(time>120)[LatePhase];
```

### Multi-Condition
```
when(crystals>50 and ore>25 and buildings.BuildingToolStore_C>0)[AllGoalsMet];
```

### Location Monitoring
```
# Create a zone
when(enter:5,5:miners)[Zone1Enter];
when(enter:5,6:miners)[Zone1Enter];
when(enter:6,5:miners)[Zone1Enter];
when(enter:6,6:miners)[Zone1Enter];
```

## Performance Considerations

### Efficient Triggers
```
# Good - specific condition
when(crystals==50)[ExactGoal];

# Bad - fires every frame when true
when(crystals>0)[HasAnyCrystals];
```

### Use State Flags
```
# Prevent repeated firing
bool MessageShown=false
when(time>60 and MessageShown==false)[ShowOnce];
```

### Minimize Active Triggers
- Remove completed `if` triggers naturally
- Use specific conditions
- Combine related checks

## Debugging Tips

1. **Test triggers individually**
   ```
   when(init)[msg:Trigger1Active];
   ```

2. **Use time delays**
   ```
   when(time>5)[DelayedStart];
   ```

3. **Track state**
   ```
   int DebugState=0
   when(crystals>10)[DebugState:1; msg:State1];
   ```

4. **Verify coordinates**
   ```
   # Show where trigger is
   when(init)[highlightarrow:10,10,TestArrow];
   ```

## Limitations

- Cannot nest conditions in trigger line
- No complex boolean logic in trigger
- Some triggers only work with specific types
- Order of trigger execution is undefined
- Cannot dynamically create/remove triggers

## Examples

### Mission Timer
```
int TimeRemaining=300

when(time>1)[UpdateTimer];

UpdateTimer::
TimeRemaining:300-time;
((TimeRemaining<=0))[lose:TimeUp];
```

### Progressive Difficulty
```
when(time>60)[Phase2];
when(time>120)[Phase3];

Phase2::
addrandomspawn:CreatureSmallSpider_C,20.0,40.0;
startrandomspawn:CreatureSmallSpider_C;

Phase3::
addrandomspawn:CreatureLavaMonster_C,30.0,60.0;
startrandomspawn:CreatureLavaMonster_C;
```

### Building Protection
```
building MainBase=10,10

when(MainBase.hurt)[BaseUnderAttack];
when(MainBase.dead)[BaseLost];

BaseUnderAttack::
msg:BaseUnderAttack;
heal:MainBase,25;

BaseLost::
lose:MainBaseDestroyed;
```

## See Also
- [Events](events.md) - Actions triggers can execute
- [Conditions](conditions.md) - Boolean logic for triggers
- [Variables](variables.md) - Data storage for triggers
- [Event Chains](event-chains.md) - Grouping trigger actions