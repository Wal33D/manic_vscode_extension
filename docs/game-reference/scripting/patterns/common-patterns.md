# Common Scripting Patterns

This guide provides battle-tested scripting patterns from official and community maps. Each pattern includes explanation, code, and real-world usage examples.

## Table of Contents
1. [State Management](#state-management)
2. [Progressive Objectives](#progressive-objectives)
3. [Resource Rewards](#resource-rewards)
4. [Timed Challenges](#timed-challenges)
5. [Dynamic Difficulty](#dynamic-difficulty)
6. [Exploration Rewards](#exploration-rewards)
7. [Building Progression](#building-progression)
8. [Combat Encounters](#combat-encounters)
9. [Environmental Effects](#environmental-effects)
10. [Advanced Techniques](#advanced-techniques)
11. [Tutorial Flow](#tutorial-flow)
12. [Wave Defense](#wave-defense)

## State Management

### Basic State Tracking
Track game progress with boolean flags:

```
script{
  bool IntroShown=false
  bool FirstCrystalFound=false
  bool BossDefeated=false
  
  # Show intro only once
  when(init and IntroShown==false)[ShowIntro]
  
  ShowIntro::
  IntroShown:true;
  msg:WelcomeToLevel;
}
```

### Multi-Stage Progression
Use integers for complex state machines:

```
script{
  int QuestStage=0
  
  # Stage 0: Find tool store
  when(buildings.BuildingToolStore_C>0 and QuestStage==0)[Stage1]
  
  # Stage 1: Collect crystals
  when(crystals>=20 and QuestStage==1)[Stage2]
  
  # Stage 2: Build power station
  when(buildings.BuildingPowerStation_C>0 and QuestStage==2)[Victory]
  
  Stage1::
  QuestStage:1;
  msg:NowCollectCrystals;
  objective:Collect20Crystals;
  
  Stage2::
  QuestStage:2;
  msg:BuildPowerStation;
  objective:ConstructPower;
  
  Victory::
  QuestStage:3;
  msg:MissionComplete;
  win:;
}
```

## Progressive Objectives

### Sequential Objectives
Each objective unlocks the next:

```
script{
  # Objective flags
  bool Obj1Complete=false
  bool Obj2Complete=false
  bool Obj3Complete=false
  
  # Objective 1: Basic collection
  when(crystals>=10 and Obj1Complete==false)[CompleteObj1]
  
  CompleteObj1::
  Obj1Complete:true;
  msg:FirstObjectiveComplete;
  objective:BuildToolStore;
  
  # Objective 2: Building
  when(buildings.BuildingToolStore_C>0 and Obj1Complete==true and Obj2Complete==false)[CompleteObj2]
  
  CompleteObj2::
  Obj2Complete:true;
  msg:SecondObjectiveComplete;
  objective:DefendBase;
  emerge:15,15,CreatureRockMonster_C;
  
  # Objective 3: Combat
  when(creatures.CreatureRockMonster_C==0 and Obj2Complete==true and Obj3Complete==false)[CompleteObj3]
  
  CompleteObj3::
  Obj3Complete:true;
  msg:AllObjectivesComplete;
  win:;
}
```

## Resource Rewards

### Hidden Caches
Reward exploration with resources:

```
script{
  # Track found caches
  bool Cache1Found=false
  bool Cache2Found=false
  bool Cache3Found=false
  int TotalCachesFound=0
  
  # Hidden cache locations
  when(drill:25,10 and Cache1Found==false)[FindCache1]
  when(drill:5,30 and Cache2Found==false)[FindCache2]
  when(drill:40,40 and Cache3Found==false)[FindCache3]
  
  FindCache1::
  Cache1Found:true;
  TotalCachesFound:TotalCachesFound+1;
  crystals:25;
  msg:FoundHiddenCrystals;
  
  FindCache2::
  Cache2Found:true;
  TotalCachesFound:TotalCachesFound+1;
  ore:30;
  msg:FoundHiddenOre;
  
  FindCache3::
  Cache3Found:true;
  TotalCachesFound:TotalCachesFound+1;
  crystals:15;
  ore:15;
  msg:FoundMixedCache;
  
  # Bonus for finding all
  when(TotalCachesFound==3)[AllCachesBonus]
  
  AllCachesBonus::
  msg:MasterExplorer;
  crystals:50;
}
```

## Timed Challenges

### Basic Timer
Simple countdown challenge:

```
script{
  timer MissionTimer=300  # 5 minutes
  bool TimerStarted=false
  
  when(init)[StartTimer]
  
  StartTimer::
  TimerStarted:true;
  starttimer:MissionTimer;
  msg:YouHave5Minutes;
  
  # Warning messages
  when(MissionTimer.remaining==60)[OneMinuteWarning]
  when(MissionTimer.remaining==30)[ThirtySecondWarning]
  when(MissionTimer.expired)[TimeUp]
  
  OneMinuteWarning::
  msg:OneMinuteRemaining;
  
  ThirtySecondWarning::
  msg:ThirtySecondsLeft;
  
  TimeUp::
  msg:TimeExpired;
  lose:;
  
  # Victory stops timer
  when(crystals>=50)[Victory]
  
  Victory::
  stoptimer:MissionTimer;
  msg:CompletedInTime;
  win:;
}
```

### Escalating Pressure
Increasing difficulty over time:

```
script{
  # Difficulty increases every 2 minutes
  when(time>120)[Difficulty1]
  when(time>240)[Difficulty2]
  when(time>360)[Difficulty3]
  
  Difficulty1::
  msg:ErosionIncreasing;
  erosion:2.0;
  
  Difficulty2::
  msg:MonstersAwakening;
  emerge:10,10,CreatureRockMonster_C;
  emerge:20,20,CreatureRockMonster_C;
  
  Difficulty3::
  msg:FinalChallenge;
  generatelandslide:15,15,10;
  emerge:15,15,CreatureLavaMonster_C;
}
```

## Tutorial Flow

A step-by-step tutorial system that guides players through game mechanics.

```
script{
    bool Step1Done=false
    bool Step2Done=false
    arrow TutorialArrow=green
    
    # Step 1: Build Tool Store
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
    
    # Step 2: Collect resources
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

### Key Features:
- Uses flags to prevent re-triggering completed steps
- Visual guidance with arrows
- Clear objective updates
- Smooth transitions between steps

## Wave Defense

Create escalating enemy waves with rewards between rounds.

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

### Key Features:
- Progressive difficulty (more enemies each wave)
- Scaling rewards based on wave number
- Clean state management with WaveActive flag
- Automatic progression to next wave

## Exploration Rewards

Reward players for discovering hidden areas or secrets.

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
    
    FoundCave2::
    Cave2Found:true;
    CavesFound:CavesFound+1;
    msg:Cave2Text;
    ore:25;
    CheckAllCaves::;
    
    FoundCave3::
    Cave3Found:true;
    CavesFound:CavesFound+1;
    msg:Cave3Text;
    studs:25;
    CheckAllCaves::;
    
    CheckAllCaves::
    if(CavesFound==3)[AllCavesBonus];
    
    AllCavesBonus::
    msg:AllCavesFoundText;
    ore:50;
    objective:All hidden caves discovered!;
}
```

### Key Features:
- Tracks individual discoveries
- Provides immediate rewards
- Bonus for finding all secrets
- Prevents duplicate rewards with flags

## Dynamic Objective System

Create objectives that update based on player progress.

```
script{
    int ObjectivesComplete=0
    bool Obj1=false
    bool Obj2=false
    bool Obj3=false
    string CurrentObjective="Build a Tool Store"
    
    # Update objective display dynamically
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
    
    CompleteObj2::
    Obj2:true;
    ObjectivesComplete:ObjectivesComplete+1;
    CurrentObjective:"Eliminate all creatures";
    UpdateObjective::;
    
    CompleteObj3::
    Obj3:true;
    ObjectivesComplete:ObjectivesComplete+1;
    CurrentObjective:"Mission Complete!";
    UpdateObjective::;
    
    when(ObjectivesComplete==3)[AllComplete];
    
    AllComplete::
    msg:VictoryText;
    win:;
}
```

### Key Features:
- Dynamic objective text updates
- Progress tracking
- Clear completion states
- Flexible objective ordering

## Progressive Difficulty

Automatically increase challenge over time.

```
script{
    int DifficultyLevel=1
    int EnemiesDefeated=0
    
    # Increase difficulty over time
    when(time>300 and DifficultyLevel==1)[IncreaseDifficulty];
    when(time>600 and DifficultyLevel==2)[IncreaseDifficulty];
    
    IncreaseDifficulty::
    DifficultyLevel:DifficultyLevel+1;
    spawncap:CreatureRockMonster_C,DifficultyLevel,DifficultyLevel*3;
    msg:DifficultyIncreased;
    
    # Alternatively, base on player performance
    when(EnemiesDefeated>10 and DifficultyLevel==1)[PerformanceIncrease];
    
    PerformanceIncrease::
    DifficultyLevel:2;
    spawncap:CreatureRockMonster_C,2,6;
    msg:DifficultyAdjusted;
}
```

### Key Features:
- Time-based or performance-based scaling
- Adjusts spawn caps dynamically
- Clear player feedback
- Prevents difficulty jumps with level checks

## Building Progression

Control when players can build specific structures.

```
script{
    # Building unlock system
    bool CanBuildPower=false
    bool CanBuildRadar=false
    bool CanBuildLaser=false
    
    # Unlock based on resources
    when(crystals>=20 and CanBuildPower==false)[UnlockPower]
    when(buildings.BuildingPowerStation_C>0 and CanBuildRadar==false)[UnlockRadar]
    when(buildings.BuildingGeoSurvey_C>0 and CanBuildLaser==false)[UnlockLaser]
    
    UnlockPower::
    CanBuildPower:true;
    allowbuilding:BuildingPowerStation_C;
    msg:PowerUnlocked;
    
    UnlockRadar::
    CanBuildRadar:true;
    allowbuilding:BuildingGeoSurvey_C;
    msg:RadarUnlocked;
    
    UnlockLaser::
    CanBuildLaser:true;
    allowbuilding:BuildingMiningLaser_C;
    msg:LaserUnlocked;
}
```

### Key Features:
- Progressive building unlocks
- Clear prerequisites
- Player notification
- Prevents early game rushing

## Combat Encounters

Create engaging combat scenarios with creature spawning.

```
script{
    # Boss fight system
    int BossPhase=0
    bool BossActive=false
    bool BossDefeated=false
    
    # Trigger boss fight
    when(drill:25,25 and BossActive==false)[StartBoss]
    
    StartBoss::
    BossActive:true;
    BossPhase:1;
    msg:BossAwakens;
    emerge:25,25,CreatureLavaMonster_C;
    objective:Defeat the Lava Monster!;
    
    # Phase transitions based on boss health
    when(creatures.CreatureLavaMonster_C==0 and BossPhase==1)[Phase2]
    when(creatures.CreatureLavaMonster_C==0 and BossPhase==2)[Phase3]
    when(creatures.CreatureLavaMonster_C==0 and BossPhase==3)[BossVictory]
    
    Phase2::
    BossPhase:2;
    msg:BossEnraged;
    emerge:24,24,CreatureLavaMonster_C;
    emerge:26,26,CreatureRockMonster_C;
    emerge:24,26,CreatureRockMonster_C;
    
    Phase3::
    BossPhase:3;
    msg:BossFinalForm;
    emerge:25,25,CreatureLavaMonster_C;
    erosion:3.0;
    
    BossVictory::
    BossDefeated:true;
    msg:BossDefeated;
    crystals:100;
    objective:Victory!;
}
```

### Key Features:
- Multi-phase boss fight
- Escalating difficulty
- Environmental changes during combat
- Epic reward for victory

## Environmental Effects

Dynamic environmental changes that affect gameplay.

```
script{
    # Flooding system
    int FloodLevel=0
    timer FloodTimer=60
    
    when(init)[StartFloodTimer]
    
    StartFloodTimer::
    starttimer:FloodTimer;
    
    when(FloodTimer.expired and FloodLevel<5)[NextFlood]
    
    NextFlood::
    FloodLevel:FloodLevel+1;
    if(FloodLevel==1)[FloodLevel1];
    if(FloodLevel==2)[FloodLevel2];
    if(FloodLevel==3)[FloodLevel3];
    if(FloodLevel==4)[FloodLevel4];
    if(FloodLevel==5)[FloodLevel5];
    starttimer:FloodTimer;
    
    FloodLevel1::
    msg:WaterRising;
    # Convert lowest areas to water
    place:5,5,11;
    place:5,6,11;
    place:6,5,11;
    place:6,6,11;
    
    FloodLevel2::
    msg:FloodSpreading;
    # Expand water area
    place:4,4,11;
    place:4,5,11;
    place:4,6,11;
    place:4,7,11;
    # Continue pattern...
    
    FloodLevel3::
    msg:DangerousWaters;
    # Even more water
    
    FloodLevel4::
    msg:CriticalFloodLevel;
    # Major flooding
    
    FloodLevel5::
    msg:MaximumFlood;
    # Final flood state
}
```

### Key Features:
- Progressive environmental change
- Creates urgency
- Forces adaptation
- Visual drama

## Advanced Techniques

### Conditional Rewards
Reward players based on performance metrics.

```
script{
    # Performance tracking
    int DeathCount=0
    timer CompletionTimer=0
    bool PerfectRun=true
    
    when(init)[StartTracking]
    when(pilot.death)[TrackDeath]
    when(win)[CalculateRewards]
    
    StartTracking::
    starttimer:CompletionTimer;
    
    TrackDeath::
    DeathCount:DeathCount+1;
    PerfectRun:false;
    
    CalculateRewards::
    stoptimer:CompletionTimer;
    
    # Base reward
    crystals:50;
    
    # Perfect run bonus
    if(PerfectRun==true)[crystals:100];
    
    # Speed bonus
    if(CompletionTimer<300)[SpeedBonus];
    
    # Survival bonus
    if(DeathCount==0)[SurvivalBonus];
    
    SpeedBonus::
    crystals:50;
    msg:SpeedBonusEarned;
    
    SurvivalBonus::
    crystals:25;
    msg:FlawlessVictory;
}
```

### Dynamic Map Modification
Change the map based on player actions.

```
script{
    # Bridge building system
    bool BridgeBuilt=false
    
    when(drill:10,10 and BridgeBuilt==false)[BuildBridge]
    
    BuildBridge::
    BridgeBuilt:true;
    msg:BridgeConstructed;
    
    # Create bridge across water
    place:10,11,1;
    place:10,12,1;
    place:10,13,1;
    place:10,14,1;
    place:10,15,1;
    
    # Open new area
    place:10,16,1;
    place:11,16,1;
    place:12,16,1;
}
```

### Chain Reaction Events
Create cascading effects from single actions.

```
script{
    # Demolition chain reaction
    bool Detonated=false
    
    when(drill:20,20 and Detonated==false)[Detonate]
    
    Detonate::
    Detonated:true;
    msg:DetonationTriggered;
    wait:1;
    Explosion1::;
    
    Explosion1::
    place:20,20,6;  # Lava
    generatelandslide:20,20,3;
    wait:1;
    Explosion2::;
    
    Explosion2::
    place:19,20,6;
    place:21,20,6;
    place:20,19,6;
    place:20,21,6;
    wait:1;
    Explosion3::;
    
    Explosion3::
    # Continue chain...
    msg:ChainReactionComplete;
    # Reveal hidden area
    place:20,25,1;
    place:20,26,1;
    place:20,27,1;
}
```

## Best Practices

1. **Use Flags**: Always track completed events to prevent re-execution
2. **Clear States**: Maintain clear game state with boolean flags
3. **Provide Feedback**: Use messages to inform players of progress
4. **Test Edge Cases**: Consider what happens if players do things out of order
5. **Performance**: Limit continuous `when()` checks to essential conditions
6. **Readability**: Use descriptive variable and event names
7. **Modularity**: Break complex logic into smaller event chains
8. **Balance**: Test difficulty with different play styles
9. **Documentation**: Comment complex script sections
10. **Error Handling**: Plan for unexpected player behavior

## Common Mistakes to Avoid

1. **Infinite Loops**: Always use flags to prevent re-triggering
2. **Missing Semicolons**: Every statement needs proper termination
3. **Space in Syntax**: No spaces in conditions or event calls
4. **Wrong Coordinates**: Remember row,col not X,Y
5. **Uninitialized Variables**: Declare before use
6. **Resource Overflow**: Don't give more than max (999)
7. **Missing Objectives**: Update objectives when tasks change
8. **No Win Condition**: Always have a clear path to victory
9. **Overwhelming Complexity**: Start simple, build up
10. **Untested Scripts**: Always playtest thoroughly

## See Also
- [Event Chains](../event-chains.md) - Understanding event sequencing
- [Triggers](../triggers.md) - Available trigger types
- [Variables](../variables.md) - Variable types and usage
- [Events](../events.md) - Complete event reference
- [Debugging](../debugging.md) - Troubleshooting scripts
- [Script Commands](../../quick-reference/script-commands.md) - Quick command reference