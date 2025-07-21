# Triggers

Triggers are the core mechanism for detecting game events and executing actions in response. They listen for specific conditions and fire when those conditions are met.

## Trigger Syntax

```
OCCURRENCE(TRIGGER)((CONDITION))[TRUE_EVENT][FALSE_EVENT];
```

All syntax forms:
```
if(TRIGGER)[TRUE_EVENT]
if(TRIGGER)((CONDITION))[TRUE_EVENT]
if(TRIGGER)((CONDITION))[TRUE_EVENT][FALSE_EVENT]
when(TRIGGER)[TRUE_EVENT]
when(TRIGGER)((CONDITION))[TRUE_EVENT]
when(TRIGGER)((CONDITION))[TRUE_EVENT][FALSE_EVENT]
```

- **OCCURRENCE**: `if` or `when`
- **TRIGGER**: The event to detect
- **CONDITION**: Optional boolean test
- **TRUE_EVENT**: Action when condition is true (or no condition)
- **FALSE_EVENT**: Optional action when condition is false

**Important**: All variables in triggers are converted to integers (decimals cut off, not rounded). For example, 2.2 and 2.9 both become 2.

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

**Warning**: Avoid `when` with time triggers - they evaluate every tick after the time is reached!

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

**Note**: Basic form `enter:row,col` only triggers on miners and vehicles, not creatures. Use `enter:row,col:collection` for creatures.

### laserdamage
Fires when tile takes laser damage.
```
when(laserdamage:10,10)[WallDamaged];
```

### laserhit
Fires when any laser hits tile (including floor).
```
when(laserhit:10,10)[LaserHitTile];
```

### change
Fires when tile changes.
```
when(change:5,5)[TileChanged];
when(change:10,10:1)[BecameGround];
when(change:10,10:1:6)[ChangedFromGroundToLava];
```

Forms:
- `change:row,col` - Any change
- `change:row,col:newID` - Change to specific tile ID
- `change:row,col:newID:oldID` - Specific transition

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

**Note**: Tile must be visible for click triggers to work.

### hover
Fires when player hovers mouse over tile.
```
when(hover:10,10)[TileHovered];
```

### hoverenter/hoverleave
Fires on mouse hover state change.
```
when(hoverenter:5,5)[MouseEntered];
when(hoverleave:5,5)[MouseLeft];
```

**Note**: Tiles must be visible for hover triggers to work.

### built
Fires when building is placed.
```
when(built:BuildingToolStore_C)[ToolStoreBuilt];
when(built:10,10)[BuildingAtLocation];
when(built:BuildingPowerStation_C:10,10)[PowerStationAtLocation];
```

### new
Fires when unit is created.
```
when(new:miners)[MinerTeleported];
when(new:VehicleHoverScout_C)[ScoutCreated];
when(new:CreatureRockMonster_C)[MonsterSpawned];
```

### comparison
Evaluates mathematical expressions.
```
when(crystals>50)[HaveEnoughCrystals];
when(time>=300)[FiveMinutes];
when(miners+vehicles>10)[ManyUnits];
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

### Discovery-Based Events
```
# Trigger when specific areas are revealed
when(discovertile[15,20])[FoundSecretCave];
when(discovertile[30,30])[FoundHiddenOre];

# Trigger when buildings are discovered
when(foundbuilding[25,30])[RescuedStructure];

# Trigger based on exploration percentage
when(discovered>50)[HalfMapExplored];
when(discovered>80)[MostMapExplored];
when(discovered==100)[FullyExplored];

# Combine discovery with other conditions
when(discovertile[40,40] and crystals>=25)[SecretBonusAvailable];

# Multi-area exploration tracking
bool Cave1Found=false
bool Cave2Found=false 
bool Cave3Found=false
int CavesFound=0

when(discovertile[20,20] and Cave1Found==false)[FoundCave1];
when(discovertile[30,30] and Cave2Found==false)[FoundCave2];
when(discovertile[40,40] and Cave3Found==false)[FoundCave3];

# Progressive exploration rewards
when(discovered>25 and discovered<=50)[FirstExplorationReward];
when(discovered>50 and discovered<=75)[SecondExplorationReward];
when(discovered>75)[FinalExplorationReward];

# Discovery chains
when(foundbuilding[25,30] and ore>=20)[UnlockSpecialPath];
```

### Progressive Difficulty
```
int DifficultyLevel=1
int TimeThreshold=300

# Increase difficulty at time intervals
when(time>300 and DifficultyLevel==1)[IncreaseDifficulty];
when(time>600 and DifficultyLevel==2)[IncreaseDifficulty];
when(time>900 and DifficultyLevel==3)[IncreaseDifficulty];

IncreaseDifficulty::
DifficultyLevel:DifficultyLevel+1;
spawncap:CreatureRockMonster_C,DifficultyLevel,DifficultyLevel*3;
msg:"Difficulty increased to level " + DifficultyLevel;

# Adaptive difficulty based on performance
when(crystals>100 and time<300 and DifficultyLevel==1)[RaiseDifficulty];
when(miners==0 and DifficultyLevel>1)[LowerDifficulty];
```

### Resource Management Events
```
# Low resource warnings with state tracking
bool LowCrystalWarned=false
bool LowOreWarned=false
bool CriticalOxygenWarned=false

when(crystals<10 and LowCrystalWarned==false)[WarnLowCrystals];
when(ore<10 and LowOreWarned==false)[WarnLowOre];
when(air<100 and CriticalOxygenWarned==false)[WarnCriticalOxygen];

# Reset warnings when resources recovered
when(crystals>=20 and LowCrystalWarned==true)[ClearCrystalWarning];

# Reward systems based on building count
bool FirstRewardGiven=false
bool SecondRewardGiven=false

when(buildings>5 and FirstRewardGiven==false)[GiveBuildingBonus];
when(buildings>10 and SecondRewardGiven==false)[GiveMajorBonus];
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

### Multiple Identical Triggers Warning

**Critical**: Using multiple identical triggers causes undefined behavior!

```
# WRONG - Undefined behavior!
when(enter:4,5)[foo];
when(enter:4,5)[bar];
if(enter:4,5)[singleShot];
```

Only one of these will execute, but which one is unpredictable.

**Exception**: Time triggers can be duplicated:
```
# OK - All will execute
if(time:0)[startup1];
if(time:0)[startup2];
if(time:0)[startup3];
```

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

### Scalability Example

Preventing trigger spam when many units are present:

**Problem**: 200 miners entering a tile spawn 200 monsters!
```
# BAD - Creates too many monsters
when(enter:50,50:miners)[SpawnMonster];

SpawnMonster::
emerge:50,50,A,CreatureRockMonster_C,10;
```

**Solution**: Use timing control to limit spawns
```
float LastSpawnTime=-100.0
float SpawnCooldown=5.0

when(enter:50,50:miners)[TrySpawnMonster];

TrySpawnMonster::
((time-LastSpawnTime < SpawnCooldown))return;
LastSpawnTime:time;
emerge:50,50,A,CreatureRockMonster_C,10;
```

This ensures monsters spawn at most once every 5 seconds, regardless of how many miners enter.

## See Also
- [Events](events.md) - Actions triggers can execute
- [Conditions](conditions.md) - Boolean logic for triggers
- [Variables](variables.md) - Data storage for triggers
- [Event Chains](event-chains.md) - Grouping trigger actions