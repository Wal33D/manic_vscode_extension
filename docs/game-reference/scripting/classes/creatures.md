# Creature Class

Creatures are hostile entities that threaten your mining operation. The creature class allows scripts to reference and control specific creatures on the map.

## Declaration

```
creature name=id
```

- References creature with specific ID
- ID must match creature placed in map
- Can reference sleeping or active creatures

### Examples
```
creature Boss=0
creature Guard1=1
creature Guard2=2
creature TrackedMonster    # Unassigned
```

## Creature Types

### Rock Monsters
- `CreatureRockMonster_C` - Basic rock creature
- `CreatureLavaMonster_C` - Fire-breathing variant
- `CreatureIceMonster_C` - Freezing variant

### Smaller Creatures
- `CreatureSmallSpider_C` - Fast, weak spider
- `CreatureBat_C` - Flying annoyance
- `CreatureSmallWormC` - Burrowing creature

### Special Creatures
- `CreatureSlug_C` - Crystal-draining slug
- `CreatureBigSpider_C` - Large spider variant
- `CreatureWorm_C` - Large worm

## Creature Events

### emerge
Spawn creature from wall.
```
emerge:row,col,direction,CreatureType,radius

# Direction: N, S, E, W, A (auto)
# Example
emerge:10,10,A,CreatureRockMonster_C,2;
```

### lastcreature  
Capture spawned creature reference.
```
lastcreature:CreatureVariable

# Example
SpawnBoss::
emerge:20,20,A,CreatureLavaMonster_C,1;
lastcreature:BossMonster;
```

### flee
Make creature run away.
```
flee:CreatureVariable,row,col

# Example
creature Monster=0
flee:Monster,5,5;
```

### Creature Triggers
```
creature Boss=0

# Health monitoring
when(Boss.hurt)[BossHurt];
when(Boss.dead)[BossDefeated];

# Click detection
when(click:Boss)[BossClicked];
```

## Creature Properties

### Health Points (.hp)
```
creature Monster=0

# Check health
((Monster.hp < 50))[MonsterWeak];
((Monster.hp == 0))[MonsterDead];
```

### Position (.row/.col)
```
# Track creature location
int MonsterRow=0
int MonsterCol=0

GetMonsterPosition::
MonsterRow:Monster.row;
MonsterCol:Monster.col;
```

### State (.sleep)
```
# Check if sleeping (if supported)
((Monster.sleep == true))[MonsterSleeping];
```

## Creature Management

### Random Spawning
```
# Configure random spawns
addrandomspawn:CreatureType,minTime,maxTime

# Set spawn limits
spawncap:CreatureType,min,max

# Set wave size
spawnwave:CreatureType,min,max

# Start/stop spawning
startrandomspawn:CreatureType
stoprandomspawn:CreatureType

# Example wave system
SetupWaves::
addrandomspawn:CreatureSmallSpider_C,30.0,60.0;
spawncap:CreatureSmallSpider_C,2,5;
spawnwave:CreatureSmallSpider_C,1,3;
startrandomspawn:CreatureSmallSpider_C;
```

### Collection Counts
```
# Total creatures
((creatures.CreatureRockMonster_C > 0))[MonstersPresent];
((creatures.CreatureLavaMonster_C == 0))[NoLavaMonsters];

# Check all types
int TotalThreats=0
CountThreats::
TotalThreats:creatures.CreatureRockMonster_C;
TotalThreats+=creatures.CreatureLavaMonster_C;
TotalThreats+=creatures.CreatureIceMonster_C;
```

## Common Patterns

### Boss Battle
```
creature Boss
bool BossSpawned=false
int BossPhase=1

# Spawn boss
SpawnBoss::
((BossSpawned == true))[];
emerge:25,25,A,CreatureLavaMonster_C,1;
lastcreature:Boss;
BossSpawned:true;
msg:BossAppears;

# Monitor boss health
when(Boss.hp < 75 and BossPhase==1)[BossPhase2];
when(Boss.hp < 50 and BossPhase==2)[BossPhase3];
when(Boss.hp < 25 and BossPhase==3)[BossFinalPhase];
when(Boss.dead)[BossDefeated];

BossPhase2::
BossPhase:2;
msg:BossEnraged;
# Spawn adds
emerge:20,20,A,CreatureSmallSpider_C,1;
emerge:30,30,A,CreatureSmallSpider_C,1;
```

### Wave Defense
```
int WaveNumber=0
bool WaveActive=false

# Start next wave
StartWave::
WaveNumber+=1;
WaveActive:true;
((WaveNumber == 1))[Wave1];
((WaveNumber == 2))[Wave2];
((WaveNumber == 3))[Wave3];

Wave1::
addrandomspawn:CreatureSmallSpider_C,10.0,20.0;
spawnwave:CreatureSmallSpider_C,2,4;
startrandomspawn:CreatureSmallSpider_C;
wait:60.0;
stoprandomspawn:CreatureSmallSpider_C;
WaveComplete;

Wave2::
addrandomspawn:CreatureBat_C,15.0,25.0;
startrandomspawn:CreatureBat_C;
# More waves...
```

### Creature Tracking
```
# Track multiple creatures
creature Creature1=1
creature Creature2=2
creature Creature3=3
int CreaturesDefeated=0

when(Creature1.dead)[CreatureDown];
when(Creature2.dead)[CreatureDown];
when(Creature3.dead)[CreatureDown];

CreatureDown::
CreaturesDefeated+=1;
((CreaturesDefeated >= 3))[AllCreaturesDefeated];
```

### Strategic Spawning
```
# Spawn based on player actions
int MiningIntensity=0

# Increase threat with mining
when(drill:any)[MiningDetected];

MiningDetected::
MiningIntensity+=1;
((MiningIntensity > 10))[SpawnThreat];

SpawnThreat::
MiningIntensity:0;
# Find good spawn location
FindSpawnPoint;

FindSpawnPoint::
# Logic to find wall near miners
emerge:15,15,A,CreatureRockMonster_C,3;
```

## Advanced Techniques

### Creature AI Enhancement
```
creature SmartMonster
int MonsterState=0  # 0=patrol, 1=attack, 2=flee

# State machine for creature behavior
UpdateMonsterAI::
((MonsterState == 0))[PatrolBehavior];
((MonsterState == 1))[AttackBehavior];
((MonsterState == 2))[FleeBehavior];

PatrolBehavior::
# Check for nearby miners
((miners > 0 and distance < 10))[MonsterState:1];

AttackBehavior::
((SmartMonster.hp < 25))[MonsterState:2];

FleeBehavior::
flee:SmartMonster,5,5;
MonsterState:0;
```

### Emerge Failure Handling
```
# Handle failed emerge
bool EmergeSuccess=false

TrySpawnMonster::
EmergeSuccess:true;
emerge:10,10,A,CreatureRockMonster_C,2;
~EmergeSuccess:false;  # Emerge failed
((EmergeSuccess == false))[TryAlternateLocation];

TryAlternateLocation::
emerge:15,15,A,CreatureRockMonster_C,3;
~msg:NoValidSpawnLocation;
```

### Creature Formations
```
# Spawn creatures in patterns
SpawnFormation::
# Diamond formation
emerge:20,18,A,CreatureSmallSpider_C,1;
wait:0.5;
emerge:18,20,A,CreatureSmallSpider_C,1;
wait:0.5;
emerge:20,22,A,CreatureSmallSpider_C,1;
wait:0.5;
emerge:22,20,A,CreatureSmallSpider_C,1;
```

## Best Practices

### 1. Reference Management
```
# Clear references when done
creature TempMonster

SpawnTemp::
emerge:10,10,A,CreatureRockMonster_C,1;
lastcreature:TempMonster;

# When defeated
when(TempMonster.dead)[CleanupTemp];

CleanupTemp::
# Reference becomes invalid automatically
```

### 2. Spawn Control
```
# Limit active creatures
int MaxCreatures=5

CheckSpawnLimit::
((creatures.CreatureRockMonster_C >= MaxCreatures))[msg:SpawnLimitReached];
# Only spawn if under limit
```

### 3. Performance
```
# Don't spawn too many at once
StaggeredSpawn::
emerge:10,10,A,CreatureSmallSpider_C,1;
wait:1.0;
emerge:20,20,A,CreatureSmallSpider_C,1;
wait:1.0;
# Prevents lag spike
```

### 4. Emerge Validation
```
# Check if wall exists for emerge
# Use appropriate radius
# Consider discovered areas
# Handle emerge failures
```

## Common Issues

### Creature Not Found
```
# ID doesn't match any creature
# Creature was defeated
# Creature hasn't spawned yet
# Wrong creature ID
```

### Emerge Failures
```
# No valid walls in radius
# Area not discovered
# Blocked by units/buildings
# Invalid creature type
```

### Reference Issues
```
# Multiple variables same creature - ERROR
creature Monster1=0
creature Monster2=0  # ERROR!

# Reference becomes invalid when defeated
# Cannot reassign defeated creature ID
```

## Examples

### Complete Invasion Event
```
# Invasion system
int InvasionPhase=0
bool InvasionActive=false
arrow DangerZone=red

# Start invasion
when(time > 300 and InvasionActive==false)[StartInvasion];

StartInvasion::
InvasionActive:true;
InvasionPhase:1;
msg:CreatureInvasionDetected;
shake:3.0,2.0;
highlightarrow:25,25,DangerZone;
Phase1Spawn;

Phase1Spawn::
# Initial scouts
emerge:25,25,A,CreatureSmallSpider_C,3;
wait:2.0;
emerge:25,25,A,CreatureSmallSpider_C,3;
wait:30.0;
((InvasionPhase == 1))[InvasionPhase:2; Phase2Spawn];

Phase2Spawn::
# Main force
addrandomspawn:CreatureRockMonster_C,20.0,40.0;
startrandomspawn:CreatureRockMonster_C;
```

### Creature Hunt Mission
```
# Hunt specific creatures
creature Target1=1
creature Target2=2
creature Target3=3
int TargetsEliminated=0

init::
objective:EliminateThreeCreatures;
ShowTargets;

ShowTargets::
highlightarrow:Target1.row,Target1.col,TargetArrow1;
highlightarrow:Target2.row,Target2.col,TargetArrow2;
highlightarrow:Target3.row,Target3.col,TargetArrow3;

when(Target1.dead)[Target1Down];
when(Target2.dead)[Target2Down];
when(Target3.dead)[Target3Down];

Target1Down::
TargetsEliminated+=1;
removearrow:TargetArrow1;
CheckVictory;

CheckVictory::
((TargetsEliminated >= 3))[win:AllTargetsEliminated];
```

### Ecosystem Simulation
```
# Creatures interact with environment
int EcosystemBalance=50

# Creatures drain resources
when(creatures.CreatureSlug_C > 0)[SlugsDraining];

SlugsDraining::
drain:1;  # Slugs drain crystals
EcosystemBalance-=5;

# Too many creatures
when(EcosystemBalance < 25)[EnvironmentCollapse];

EnvironmentCollapse::
msg:EcosystemCollapsing;
# Spawn more aggressive creatures
addrandomspawn:CreatureLavaMonster_C,15.0,30.0;
```

## See Also
- [Variables](../syntax/variables.md) - Creature variable declaration
- [Creatures Section](../../format/sections/creatures.md) - Pre-placed creatures
- [Emerge Event](../syntax/events.md#entity-spawning) - Spawning creatures
- [Collections](../syntax/macros.md#collection-macros) - Creature counts