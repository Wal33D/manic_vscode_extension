# Script Commands Quick Reference

This comprehensive quick reference covers all scripting commands, patterns, and best practices for Manic Miners maps.

## Message & UI Commands

| Command | Syntax | Description | Example |
|---------|--------|-------------|---------|
| `msg` | `msg:stringvar;` | Display message to player | `msg:WelcomeMessage;` |
| `wait` | `wait:seconds;` | Pause script execution | `wait:3;` |
| `pan` | `pan:row,col;` | Move camera to tile position | `pan:25,30;` |
| `shake` | `shake:intensity,duration;` | Screen shake effect | `shake:2,5;` |
| `playsound` | `playsound:soundname;` | Play sound effect | `playsound:Alarm;` |

## Arrow & Highlighting

| Command | Syntax | Description | Example |
|---------|--------|-------------|---------|
| arrow declaration | `arrow ArrowName=color` | Declare arrow (red/green/blue/yellow) | `arrow GuideArrow=green` |
| `highlightarrow` | `highlightarrow:row,col,arrowname;` | Show arrow at location | `highlightarrow:10,15,GuideArrow;` |
| `removearrow` | `removearrow:arrowname;` | Remove specific arrow | `removearrow:GuideArrow;` |
| `highlight` | `highlight:row,col,color;` | Highlight tile | `highlight:5,5,yellow;` |

## Resource Commands

| Command | Syntax | Description | Example |
|---------|--------|-------------|---------|
| `crystals` | `crystals:amount;` | Add/subtract crystals | `crystals:50;` or `crystals:-10;` |
| `ore` | `ore:amount;` | Add/subtract ore | `ore:25;` |
| `studs` | `studs:amount;` | Add/subtract studs | `studs:5;` |
| `air` | `air:amount;` | Modify air supply | `air:100;` |
| `maxminers` | `maxminers:amount;` | Set miner limit | `maxminers:8;` |

## Spawning Commands

| Command | Syntax | Description | Example |
|---------|--------|-------------|---------|
| `emerge` | `emerge:row,col,type;` | Spawn single creature | `emerge:20,20,CreatureRockMonster_C;` |
| `spawncap` | `spawncap:type,min,max;` | Set spawn limits | `spawncap:CreatureRockMonster_C,2,5;` |
| `spawnwave` | `spawnwave:type,count,interval;` | Wave spawning | `spawnwave:CreatureSlug_C,10,2;` |
| `addrandomspawn` | `addrandomspawn:type,min,max;` | Random spawn points | `addrandomspawn:CreatureLavaMonster_C,1,3;` |

## Map Manipulation

| Command | Syntax | Description | Example |
|---------|--------|-------------|---------|
| `drill` | `drill:row,col;` | Force drill tile | `drill:15,20;` |
| `place` | `place:row,col,tileID;` | Change tile type | `place:10,10,42;` |
| `reinforce` | `reinforce:row,col;` | Make wall reinforced | `reinforce:5,5;` |
| `undiscover` | `undiscover:row,col;` | Hide discovered tile | `undiscover:12,8;` |
| `generatelandslide` | `generatelandslide:row,col,radius;` | Create landslide | `generatelandslide:25,25,5;` |
| `erosion` | `erosion:rate;` | Set erosion speed | `erosion:2.0;` |

## Game Flow

| Command | Syntax | Description | Example |
|---------|--------|-------------|---------|
| `win` | `win:;` | Player wins level | `win:;` |
| `lose` | `lose:;` | Player loses level | `lose:;` |
| `objective` | `objective:text;` | Update objective display | `objective:Build 2 Power Stations;` |
| `allowbuilding` | `allowbuilding:type;` | Enable building type | `allowbuilding:BuildingPowerStation_C;` |
| `disallowbuilding` | `disallowbuilding:type;` | Disable building type | `disallowbuilding:BuildingDocks_C;` |

## Conditionals

| Syntax | Description | Example |
|--------|-------------|---------|
| `if(condition)[Event]` | One-time check | `if(crystals>25)[ShowSuccess];` |
| `when(condition)[Event]` | Continuous check | `when(time>60)[TimeWarning];` |

## Common Conditions

| Condition | Description |
|-----------|-------------|
| `crystals>X` | Crystal count check |
| `ore>X` | Ore count check |
| `time>X` | Time elapsed (seconds) |
| `buildings.Type>X` | Building count |
| `vehicles.Type>X` | Vehicle count |
| `miners>X` | Miner count |
| `creatures==X` | Creature count |
| `Variable==value` | Variable comparison |

## Operators

| Operator | Description |
|----------|-------------|
| `>` | Greater than |
| `<` | Less than |
| `>=` | Greater or equal |
| `<=` | Less or equal |
| `==` | Equal to |
| `!=` | Not equal to |
| `and` | Logical AND |
| `or` | Logical OR |
| `not` | Logical NOT |

## Event Declaration

```
EventName::
command1;
command2;
command3;
```

## Conditional Event

```
((condition))EventName::
command1;
command2;
```

## Variable Declaration

```
string MessageText="Hello"
bool IsComplete=false
int Counter=0
float Progress=0.0
arrow GuideArrow=green
timer SpawnTimer=10,5,3,SpawnEvent
```

## Timer Commands

| Command | Syntax | Description | Example |
|---------|--------|-------------|---------|
| timer declaration | `timer Name=duration` | Simple timer | `timer Countdown=60` |
| timer with repeat | `timer Name=dur,rep,int,event` | Complex timer | `timer Spawner=10,5,10,SpawnWave` |
| `starttimer` | `starttimer:timername;` | Start timer | `starttimer:Countdown;` |
| `stoptimer` | `stoptimer:timername;` | Stop timer | `stoptimer:Countdown;` |

## Timer Conditions

| Condition | Description | Example |
|-----------|-------------|---------|
| `timername.expired` | Timer has finished | `when(Countdown.expired)[TimeUp]` |
| `timername.remaining` | Time left (seconds) | `when(Countdown.remaining<10)[Warning]` |
| `timername.elapsed` | Time passed | `when(Countdown.elapsed>30)[Halfway]` |

## Building & Vehicle Types

### Buildings
- `BuildingToolStore_C` - Tool Store
- `BuildingTeleportPad_C` - Teleport Pad  
- `BuildingPowerStation_C` - Power Station
- `BuildingDocks_C` - Docks
- `BuildingCanteen_C` - Canteen
- `BuildingGeoSurvey_C` - Geological Survey
- `BuildingOreRefinery_C` - Ore Refinery
- `BuildingMiningLaser_C` - Mining Laser
- `BuildingUpgradeStation_C` - Upgrade Station
- `BuildingSupportStation_C` - Support Station
- `BuildingSuperTeleport_C` - Super Teleport

### Vehicles
- `VehicleHoverScout_C` - Hover Scout
- `VehicleSmallDigger_C` - Small Digger
- `VehicleSmallTransportTruck_C` - Small Transport
- `VehicleRapidRider_C` - Rapid Rider
- `VehicleLargeMobileBase_C` - Large Mobile Base
- `VehicleCargoCarrier_C` - Cargo Carrier
- `VehicleLoaderDozer_C` - Loader Dozer
- `VehicleChromeCrusher_C` - Chrome Crusher
- `VehicleLargeDigger_C` - Large Digger

### Creatures
- `CreatureRockMonster_C` - Rock Monster
- `CreatureLavaMonster_C` - Lava Monster
- `CreatureSlug_C` - Slimy Slug
- `CreatureSpider_C` - Small Spider
- `CreatureBat_C` - Bat

## Common Script Patterns

### Basic Tutorial Pattern
```
script{
    # Variables
    string WelcomeMsg="Welcome to the caverns!"
    bool Step1Complete=false
    arrow GuideArrow=green
    
    # Initial setup
    when(init)[Welcome]
    
    Welcome::
    msg:WelcomeMsg;
    wait:3;
    objective:Collect 10 Energy Crystals;
    
    # Progress tracking
    when(crystals>=10 and Step1Complete==false)[CompleteStep1]
    
    CompleteStep1::
    Step1Complete:true;
    msg:WellDone;
    objective:Build a Tool Store;
}
```

### Resource Management Pattern
```
script{
    # Resource thresholds
    int LowCrystalWarning=10
    int CriticalOreLevel=5
    bool WarningShown=false
    
    # Monitor resources
    when(crystals<LowCrystalWarning and WarningShown==false)[LowCrystalAlert]
    when(ore<CriticalOreLevel)[CriticalOreAlert]
    
    LowCrystalAlert::
    WarningShown:true;
    msg:CrystalsRunningLow;
    highlightarrow:10,10,arrow=yellow;
    
    CriticalOreAlert::
    msg:OreDepletedFindMore;
    shake:1,3;
}
```

### Wave Defense Pattern
```
script{
    # Wave system
    int WaveNumber=0
    int EnemiesPerWave=3
    timer WaveTimer=30
    
    when(init)[StartWaves]
    
    StartWaves::
    starttimer:WaveTimer;
    
    when(WaveTimer.expired)[NextWave]
    when(creatures==0 and WaveNumber>0)[WaveCleared]
    
    NextWave::
    WaveNumber:WaveNumber+1;
    msg:Wave+WaveNumber;
    SpawnEnemies::;
    
    SpawnEnemies::
    emerge:10,10,CreatureRockMonster_C;
    emerge:20,20,CreatureRockMonster_C;
    emerge:30,30,CreatureRockMonster_C;
    
    WaveCleared::
    crystals:WaveNumber*10;
    msg:WaveComplete;
    starttimer:WaveTimer;
}
```

### Exploration Reward Pattern
```
script{
    # Hidden areas
    bool SecretCave1=false
    bool SecretCave2=false
    int SecretsFound=0
    
    # Discover secrets
    when(drill:25,10 and SecretCave1==false)[FindSecret1]
    when(drill:40,40 and SecretCave2==false)[FindSecret2]
    
    FindSecret1::
    SecretCave1:true;
    SecretsFound:SecretsFound+1;
    crystals:50;
    msg:FoundHiddenCrystals;
    
    FindSecret2::
    SecretCave2:true;
    SecretsFound:SecretsFound+1;
    ore:75;
    msg:FoundOreDeposit;
    
    # Bonus for finding all
    when(SecretsFound==2)[AllSecretsFound]
    
    AllSecretsFound::
    msg:MasterExplorer;
    studs:10;
}
```

## Debugging Tips

### Add Debug Messages
```
DebugEvent::
msg:DEBUG_Crystals=+crystals;
msg:DEBUG_Time=+time;
msg:DEBUG_Stage=+CurrentStage;
```

### Visual Debug Indicators
```
# Show different states with arrows
when(State==1)[highlightarrow:5,5,arrow=green];
when(State==2)[highlightarrow:5,5,arrow=yellow];
when(State==3)[highlightarrow:5,5,arrow=red];
```

### Safe Testing
```
# Use flags to prevent crashes
bool TestRan=false
when(test==true and TestRan==false)[RunTest]

RunTest::
TestRan:true;
# Test code here
```

## Performance Best Practices

1. **Limit Active Triggers**: Use flags to disable completed checks
2. **Batch Operations**: Group similar commands in event chains
3. **Avoid Always-True Conditions**: Don't use `when(crystals>=0)`
4. **Use Timer Intervals**: Space out repeated checks
5. **Clean Up Objects**: Remove arrows/highlights when done

## Common Mistakes to Avoid

1. Missing semicolons (`;`) at end of commands
2. Missing double colons (`::`) for event definitions  
3. Spaces in syntax (`when (x > 5)` should be `when(x>5)`)
4. Wrong coordinate order (it's `row,col` not `x,y`)
5. Incorrect building/creature class names
6. Infinite loops without exit conditions
7. Forgetting to initialize variables
8. Not using flags to prevent re-triggering

## See Also
- [Complete Scripting Guide](../game-reference/scripting/overview.md)
- [Common Patterns](../game-reference/scripting/patterns/common-patterns.md)
- [Debugging Guide](../game-reference/scripting/debugging.md)
- [Building Reference](../game-reference/format/buildings.md)
- [Creature Reference](../game-reference/format/creatures.md)