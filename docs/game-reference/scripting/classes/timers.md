# Timer Class

Timers provide periodic event execution with randomized intervals. They are essential for creating timed events, spawning waves, and managing recurring tasks.

## Declaration

```
timer name=delay,min,max,eventchain
```

- **delay**: Initial delay before first trigger (seconds)
- **min**: Minimum time between triggers (seconds)
- **max**: Maximum time between triggers (seconds)  
- **eventchain**: Event chain to execute

### Examples
```
timer SpawnTimer=5.0,30.0,60.0,SpawnWave
timer ResourceTimer=0.0,10.0,10.0,AddResources
timer RandomEvent=60.0,120.0,300.0,RandomEncounter
```

## Timer Properties

### Timing Values
- All values are in game seconds (affected by game speed)
- Values can be integers or floats
- Random interval between min and max
- Timer starts automatically when declared

### Execution
- Calls specified event chain when triggered
- Continues indefinitely until stopped
- Each trigger calculates new random interval

## Timer Events

### starttimer
Start a stopped timer.
```
starttimer:TimerVariable

# Example
timer WaveTimer=30.0,45.0,60.0,SpawnWave
starttimer:WaveTimer;  # Restart if stopped
```

### stoptimer
Stop a running timer.
```
stoptimer:TimerVariable

# Example
stoptimer:WaveTimer;  # Pause spawning
```

## Common Patterns

### Wave Spawning
```
timer WaveTimer=30.0,45.0,90.0,NextWave
int WaveNumber=0
bool WavesActive=true

NextWave::
((WavesActive == false))[];
WaveNumber+=1;
msg:"Wave ";
msg:WaveNumber;
SpawnEnemies;

SpawnEnemies::
((WaveNumber <= 3))[emerge:10,10,A,CreatureSmallSpider_C,2];
((WaveNumber > 3))[emerge:10,10,A,CreatureRockMonster_C,2];
((WaveNumber > 6))[emerge:10,10,A,CreatureLavaMonster_C,1];

# Stop after 10 waves
((WaveNumber >= 10))[stoptimer:WaveTimer; WavesActive:false];
```

### Resource Generation
```
timer CrystalGen=0.0,20.0,20.0,GenerateCrystals
timer OreGen=0.0,30.0,30.0,GenerateOre
int GeneratorLevel=1

GenerateCrystals::
crystals:5*GeneratorLevel;

GenerateOre::
ore:3*GeneratorLevel;

# Upgrade generators
UpgradeGenerators::
GeneratorLevel+=1;
msg:GeneratorsUpgraded;
```

### Periodic Checks
```
timer StatusCheck=5.0,10.0,10.0,CheckStatus
bool CriticalStatus=false

CheckStatus::
((air < 20 or miners == 0))[SetCritical][ClearCritical];

SetCritical::
((CriticalStatus == false))[msg:CriticalWarning];
CriticalStatus:true;

ClearCritical::
CriticalStatus:false;
```

### Random Events
```
timer RandomTimer=60.0,180.0,300.0,RandomEvent

RandomEvent::
?CaveIn;
?ResourceFind;
?CreatureAwakens;
?EquipmentMalfunction;
# Only one executes randomly

CaveIn::
msg:CaveInDetected;
place:15,15,42;  # Rubble

ResourceFind::
msg:HiddenCrystalsFound;
crystals:25;
```

## Advanced Techniques

### Dynamic Timer Control
```
timer DifficultyTimer=60.0,60.0,60.0,IncreaseDifficulty
float DifficultyMultiplier=1.0

IncreaseDifficulty::
DifficultyMultiplier+=0.1;
msg:DifficultyIncreased;
# Spawn more enemies based on multiplier
```

### Synchronized Timers
```
# Multiple timers working together
timer Phase1Timer=0.0,30.0,30.0,Phase1Event
timer Phase2Timer=30.0,30.0,30.0,Phase2Event
timer Phase3Timer=60.0,30.0,30.0,Phase3Event

# Stop all when complete
StopAllPhases::
stoptimer:Phase1Timer;
stoptimer:Phase2Timer;
stoptimer:Phase3Timer;
```

### Conditional Timer
```
timer ConditionalTimer=10.0,20.0,30.0,ConditionalEvent
bool TimerEnabled=true

ConditionalEvent::
((TimerEnabled == false))[stoptimer:ConditionalTimer];
# Regular timer logic

# External control
DisableTimer::
TimerEnabled:false;
stoptimer:ConditionalTimer;
```

### Timer Cascades
```
# Timers triggering other timers
timer InitialTimer=5.0,999999.0,999999.0,StartCascade
timer CascadeTimer1=0.0,10.0,20.0,CascadeEvent1
timer CascadeTimer2=0.0,15.0,25.0,CascadeEvent2

# Initially stopped
init::
stoptimer:CascadeTimer1;
stoptimer:CascadeTimer2;

StartCascade::
stoptimer:InitialTimer;  # One-shot
starttimer:CascadeTimer1;
wait:5.0;
starttimer:CascadeTimer2;
```

## Timer Strategies

### One-Shot Timer
```
# Timer that fires once
timer OnceTimer=30.0,999999.0,999999.0,OneTimeEvent

OneTimeEvent::
stoptimer:OnceTimer;  # Stop immediately
msg:ThisOnlyHappensOnce;
```

### Accelerating Timer
```
# Timer that speeds up
timer AccelTimer=30.0,20.0,40.0,AccelEvent
int TimerSpeed=0

AccelEvent::
TimerSpeed+=1;
((TimerSpeed > 5))[FastMode];

FastMode::
# Can't modify timer intervals dynamically
# Use multiple timers instead
stoptimer:AccelTimer;
starttimer:FastTimer;  # Pre-defined faster timer
```

### Burst Timer
```
# Timer that fires in bursts
timer BurstTimer=60.0,60.0,120.0,BurstController
int BurstCount=0

BurstController::
BurstCount:3;
FireBurst;

FireBurst::
((BurstCount <= 0))[];
BurstEvent;
BurstCount-=1;
wait:2.0;
FireBurst;

BurstEvent::
emerge:10,10,A,CreatureSmallSpider_C,1;
```

## Best Practices

### 1. Meaningful Names
```
# Good timer names
timer ResourceGeneration=...
timer EnemyWaveSpawner=...
timer PeriodicSaveReminder=...

# Bad timer names  
timer Timer1=...
timer T=...
timer Thing=...
```

### 2. Appropriate Intervals
```
# Too frequent - performance impact
timer BadTimer=0.0,0.1,0.1,ExpensiveCheck

# Better - reasonable interval
timer GoodTimer=0.0,5.0,10.0,ExpensiveCheck
```

### 3. State Management
```
# Track timer state
timer ManagedTimer=10.0,20.0,30.0,ManagedEvent
bool TimerRunning=true

ManagedEvent::
((TimerRunning == false))[stoptimer:ManagedTimer];
# Event logic
```

### 4. Clean Shutdown
```
# Stop timers when done
MissionComplete::
stoptimer:WaveTimer;
stoptimer:ResourceTimer;
stoptimer:CheckTimer;
```

## Common Issues

### Timer Not Firing
```
# Timer was stopped
# Initial delay not elapsed
# Event chain name misspelled
# Timer declaration syntax error
```

### Performance Impact
```
# Too many active timers
# Very short intervals
# Heavy event chains
# No conditional stops
```

### Timing Issues
```
# Game speed affects timers
# Can't modify intervals at runtime
# Random intervals may cluster
# Wait events don't pause timers
```

## Examples

### Complete Survival Mode
```
# Escalating survival challenge
timer SurvivalTimer=30.0,30.0,45.0,SurvivalWave
int SurvivalRound=0
int MaxRound=20
bool SurvivalActive=true

init::
msg:SurvivalModeBegins;
objective:SurviveAllWaves;

SurvivalWave::
((SurvivalActive == false))[];
SurvivalRound+=1;
msg:"Round ";
msg:SurvivalRound;

# Spawn based on round
((SurvivalRound <= 5))[EasyWave];
((SurvivalRound > 5 and SurvivalRound <= 10))[MediumWave];
((SurvivalRound > 10 and SurvivalRound <= 15))[HardWave];
((SurvivalRound > 15))[InsaneWave];

# Check completion
((SurvivalRound >= MaxRound))[SurvivalVictory];

EasyWave::
emerge:15,15,A,CreatureSmallSpider_C,3;

MediumWave::
emerge:15,15,A,CreatureRockMonster_C,2;
emerge:25,25,A,CreatureSmallSpider_C,2;

HardWave::
emerge:15,15,A,CreatureLavaMonster_C,1;
emerge:25,25,A,CreatureRockMonster_C,2;

InsaneWave::
emerge:10,10,A,CreatureLavaMonster_C,1;
emerge:20,20,A,CreatureLavaMonster_C,1;
emerge:30,30,A,CreatureIceMonster_C,1;

SurvivalVictory::
SurvivalActive:false;
stoptimer:SurvivalTimer;
win:SurvivalComplete;
```

### Economy System
```
# Resource economy with timers
timer MineProduction=0.0,15.0,15.0,ProduceMinerals
timer MarketFluctuation=30.0,60.0,120.0,MarketChange
int MineLevel=1
float CrystalPrice=1.0

ProduceMinerals::
int Production=0
Production:5*MineLevel;
crystals:Production;

MarketChange::
?CrystalPrice:1.5;
?CrystalPrice:1.0;
?CrystalPrice:0.5;
msg:MarketPricesChanged;

# Upgrade system
UpgradeMine::
((crystals >= 100))[DoUpgrade][msg:NeedMoreCrystals];

DoUpgrade::
crystals:-100;
MineLevel+=1;
msg:MineUpgraded;
```

### Environmental Hazards
```
# Periodic environmental dangers
timer LavaTimer=45.0,60.0,90.0,LavaEruption
timer QuakeTimer=120.0,180.0,300.0,Earthquake
timer StormTimer=90.0,150.0,240.0,CrystalStorm

LavaEruption::
msg:LavaEruptionWarning;
wait:5.0;
# Place lava tiles
place:20,20,40;
place:20,21,40;
place:21,20,40;

Earthquake::
shake:5.0,3.0;
msg:EarthquakeHitsBase;
# Damage random building

CrystalStorm::
msg:CrystalStormApproaching;
wait:10.0;
# Random crystal deposits
place:15,15,11;
crystals:20;
```

## Timer Limitations

- Cannot modify timer intervals at runtime
- Cannot read current timer value
- Cannot detect if timer is running
- All timers start immediately when declared
- Maximum reasonable interval ~999999 seconds

## See Also
- [Variables](../syntax/variables.md) - Timer declaration
- [Events](../syntax/events.md#timer-control) - Timer control
- [Event Chains](../syntax/event-chains.md) - Timer targets
- [Performance](../../../technical-reference/performance.md) - Timer optimization