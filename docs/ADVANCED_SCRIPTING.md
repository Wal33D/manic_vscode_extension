# Advanced Scripting Guide for Manic Miners Levels

## Table of Contents
1. [Script Architecture](#script-architecture)
2. [Event System Deep Dive](#event-system-deep-dive)
3. [Variable Management](#variable-management)
4. [Advanced Triggers](#advanced-triggers)
5. [Visual Scripting Blocks](#visual-scripting-blocks)
6. [Common Patterns](#common-patterns)
7. [Performance Optimization](#performance-optimization)
8. [Debugging Scripts](#debugging-scripts)

## Script Architecture

### Script Section Structure
```
script{
    // 1. Variable declarations (must come first)
    string WelcomeMessage="Welcome to the caverns!"
    bool ObjectivesComplete=false
    int ResourceTarget=50
    arrow GuideArrow=green
    timer SpawnTimer=30,10,20,SpawnWave
    
    // 2. Initial setup events
    Init::
    msg:WelcomeMessage;
    pan:15,15;
    
    // 3. Conditional triggers
    when(crystals>=ResourceTarget)[ShowSuccess];
    
    // 4. Event handlers
    ShowSuccess::
    ObjectivesComplete:true;
    win:;
}
```

### Execution Flow
1. Variables are initialized when level loads
2. Events without triggers execute immediately
3. `when()` conditions are checked continuously
4. `if()` conditions are checked once when reached
5. Events can call other events creating chains

## Event System Deep Dive

### Event Declaration Patterns

#### Basic Event
```
EventName::
command1;
command2;
```

#### Conditional Event (One-time)
```
((condition))EventName::
commands;
```

#### Continuous Trigger
```
when(condition)[EventToCall];
```

#### Chained Events
```
StartChain::
msg:FirstMessage;
wait:2;
if(crystals>10)[ContinueChain];

ContinueChain::
msg:SecondMessage;
highlightarrow:5,5,GuideArrow;
```

### Trigger Conditions

#### Resource Checks
```
crystals>25              // Crystal count
ore>=50                  // Ore count
studs>100               // Stud count
resources>75            // Total resources
```

#### Building/Unit Counts
```
buildings>5                              // Total buildings
buildings.BuildingToolStore_C>0          // Specific building type
vehicles>3                               // Total vehicles
vehicles.VehicleHoverScout_C==1          // Specific vehicle
miners>10                                // Rock Raider count
creatures==0                             // All creatures eliminated
```

#### Time-based
```
time>60                  // Seconds elapsed
time==300               // Exactly 5 minutes
```

#### Variable Comparisons
```
MyVariable==true         // Boolean check
Counter>5               // Integer comparison
Status!="Complete"      // String comparison
```

#### Compound Conditions
```
crystals>25 and ore>50                   // Both must be true
miners<3 or time>600                     // Either can be true
buildings.BuildingToolStore_C>0 and ObjectivesShown==true
```

## Variable Management

### Variable Types and Usage

#### String Variables
```
string TutorialText="Place your Tool Store on solid ground"
string PlayerStatus="exploring"

// Usage
msg:TutorialText;
PlayerStatus:"building";  // Assignment
```

#### Boolean Flags
```
bool TutorialComplete=false
bool DangerWarned=false

// Usage in conditions
when(TutorialComplete==true)[StartMainGame];
```

#### Integer Counters
```
int WaveNumber=0
int DefeatedEnemies=0

// Increment/modify
WaveNumber:WaveNumber+1;
DefeatedEnemies:DefeatedEnemies+1;
```

#### Special Types

**Arrows**
```
arrow RedDanger=red
arrow GreenGo=green
arrow YellowCaution=yellow
arrow BlueInfo=blue

// Usage
highlightarrow:10,10,RedDanger;
removearrow:RedDanger;
```

**Timers**
```
timer SpawnTimer=30,15,25,SpawnEnemy    // initial,min,max,event
timer ReminderTimer=60,60,60,ShowHint   // Every 60 seconds

// Control
starttimer:SpawnTimer;
stoptimer:SpawnTimer;
```

## Advanced Triggers

### Discovery-Based Events
```
// When specific tile is revealed
when(discovertile[15,20])[FoundSecret];

// When building is discovered
when(foundbuilding[25,30])[RescuedStructure];

// When area is explored
when(discovered>80)[MostExplored];  // 80% of map revealed
```

### Progressive Difficulty
```
script{
    int DifficultyLevel=1
    int EnemiesDefeated=0
    
    // Increase difficulty over time
    when(time>300 and DifficultyLevel==1)[IncreaseDifficulty];
    when(time>600 and DifficultyLevel==2)[IncreaseDifficulty];
    
    IncreaseDifficulty::
    DifficultyLevel:DifficultyLevel+1;
    spawncap:CreatureRockMonster_C,DifficultyLevel,DifficultyLevel*3;
    msg:DifficultyIncreased;
}
```

### Resource Management Events
```
// Low resource warnings
when(crystals<10 and ore<10)[LowResourceWarning];
when(oxygen<100)[OxygenCritical];

// Reward systems
when(buildings>5 and RewardGiven==false)[GiveBonus];

GiveBonus::
RewardGiven:true;
crystals:25;
msg:BonusText;
```

## Visual Scripting Blocks

The `blocks{}` section enables visual scripting for non-programmers:

```
blocks{
    // ID/Type:row,col,parameters
    1/Trigger:5,5,OnStep
    2/Action:5,6,ShowMessage,"Welcome!"
    3/Condition:5,7,crystals>10
    4/Action:5,8,OpenDoor
    
    // Connections
    1-2    // Trigger connects to first action
    2-3    // Action connects to condition
    3-4    // Condition connects to final action
}
```

### Block Types
- **Trigger**: Player interaction, time, discovery
- **Action**: Messages, spawns, map changes
- **Condition**: Resource checks, variable tests
- **Flow**: Branching, loops, delays

## Common Patterns

### Tutorial Flow
```
script{
    bool Step1Done=false
    bool Step2Done=false
    arrow TutorialArrow=green
    
    // Step 1: Build Tool Store
    Start::
    msg:Step1Text;
    highlightarrow:10,10,TutorialArrow;
    objective:Build a Tool Store;
    
    when(buildings.BuildingToolStore_C>0 and Step1Done==false)[CompleteStep1];
    
    CompleteStep1::
    Step1Done:true;
    removearrow:TutorialArrow;
    msg:Step1Complete;
    wait:2;
    StartStep2::;
    
    // Step 2: Collect resources
    StartStep2::
    msg:Step2Text;
    highlightarrow:15,15,TutorialArrow;
    objective:Collect 10 Energy Crystals;
    
    when(crystals>=10 and Step2Done==false)[CompleteStep2];
    
    CompleteStep2::
    Step2Done:true;
    removearrow:TutorialArrow;
    msg:TutorialComplete;
    objective:Complete the mission;
}
```

### Wave Defense
```
script{
    int WaveNumber=0
    int EnemiesInWave=3
    bool WaveActive=false
    
    StartWave::
    WaveNumber:WaveNumber+1;
    WaveActive:true;
    msg:WaveStartText;
    spawnwave:CreatureRockMonster_C,EnemiesInWave,2;
    EnemiesInWave:EnemiesInWave+2;
    
    when(creatures==0 and WaveActive==true)[WaveComplete];
    
    WaveComplete::
    WaveActive:false;
    msg:WaveCompleteText;
    crystals:WaveNumber*10;
    wait:10;
    if(WaveNumber<5)[StartWave];
    else[Victory];
    
    Victory::
    msg:AllWavesComplete;
    win:;
}
```

### Exploration Rewards
```
script{
    bool Cave1Found=false
    bool Cave2Found=false
    bool Cave3Found=false
    int CavesFound=0
    
    when(discovertile[20,20] and Cave1Found==false)[FoundCave1];
    when(discovertile[30,30] and Cave2Found==false)[FoundCave2];
    when(discovertile[40,40] and Cave3Found==false)[FoundCave3];
    
    FoundCave1::
    Cave1Found:true;
    CavesFound:CavesFound+1;
    msg:Cave1Text;
    crystals:25;
    CheckAllCaves::;
    
    // Similar for Cave2 and Cave3...
    
    CheckAllCaves::
    if(CavesFound==3)[AllCavesBonus];
    
    AllCavesBonus::
    msg:AllCavesFoundText;
    ore:50;
    objective:All hidden caves discovered!;
}
```

## Performance Optimization

### Best Practices
1. **Limit continuous checks**: Use `when()` sparingly
2. **Combine conditions**: `when(crystals>10 and ore>5)` instead of two separate checks
3. **Use flags**: Track completed events to prevent re-execution
4. **Minimize spawns**: Large numbers of entities impact performance
5. **Optimize timers**: Longer intervals for non-critical checks

### Anti-Patterns to Avoid
```
// BAD: Too many continuous checks
when(crystals>0)[Check1];
when(crystals>1)[Check2];
when(crystals>2)[Check3];
// ... etc

// GOOD: Single check with ranges
when(crystals>25)[CrystalMilestone];

CrystalMilestone::
if(crystals>50)[HighCrystals];
else[MediumCrystals];
```

## Debugging Scripts

### Common Issues and Solutions

#### Script Not Executing
- Check variable declarations are before usage
- Verify event names match exactly (case-sensitive)
- Ensure proper syntax with :: for events
- Confirm semicolons end each command

#### Infinite Loops
```
// Problem: Event calls itself
BadEvent::
msg:Looping;
BadEvent::;  // Infinite loop!

// Solution: Use flags
GoodEvent::
if(EventRan==false)[RunOnce];

RunOnce::
EventRan:true;
msg:OnlyOnce;
```

#### Timing Issues
```
// Problem: Events fire too quickly
QuickEvent::
msg:Message1;
msg:Message2;  // Player only sees this

// Solution: Add waits
TimedEvent::
msg:Message1;
wait:3;
msg:Message2;
```

### Testing Strategies
1. **Add debug messages**: Confirm events are firing
2. **Use distinct arrow colors**: Track which code path executes
3. **Start simple**: Test core functionality before adding complexity
4. **Check edge cases**: What if player does unexpected actions?
5. **Monitor performance**: Watch for lag with many triggers

## Advanced Examples

### Dynamic Objective System
```
script{
    int ObjectivesComplete=0
    bool Obj1=false
    bool Obj2=false
    bool Obj3=false
    string CurrentObjective="Build a Tool Store"
    
    // Update objective display dynamically
    UpdateObjective::
    objective:CurrentObjective;
    
    when(buildings.BuildingToolStore_C>0 and Obj1==false)[CompleteObj1];
    when(crystals>=50 and Obj2==false)[CompleteObj2];
    when(creatures==0 and Obj3==false)[CompleteObj3];
    
    CompleteObj1::
    Obj1:true;
    ObjectivesComplete:ObjectivesComplete+1;
    CurrentObjective:"Collect 50 Energy Crystals";
    UpdateObjective::;
    
    // Similar for other objectives...
    
    when(ObjectivesComplete==3)[AllComplete];
    
    AllComplete::
    msg:VictoryText;
    win:;
}
```

This guide represents advanced techniques discovered through analysis of community and campaign levels, providing scripters with powerful tools to create engaging and dynamic gameplay experiences.