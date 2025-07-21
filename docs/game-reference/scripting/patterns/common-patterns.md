# Common Scripting Patterns

This guide provides production-ready patterns for common gameplay scenarios in Manic Miners scripting.

## Table of Contents
- [Tutorial Flow](#tutorial-flow)
- [Wave Defense](#wave-defense)
- [Exploration Rewards](#exploration-rewards)
- [Dynamic Objective System](#dynamic-objective-system)
- [Progressive Difficulty](#progressive-difficulty)

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

## Best Practices

1. **Use Flags**: Always track completed events to prevent re-execution
2. **Clear States**: Maintain clear game state with boolean flags
3. **Provide Feedback**: Use messages to inform players of progress
4. **Test Edge Cases**: Consider what happens if players do things out of order
5. **Performance**: Limit continuous `when()` checks to essential conditions

## See Also
- [Event Chains](../event-chains.md) - Understanding event sequencing
- [Triggers](../triggers.md) - Available trigger types
- [Debugging](../debugging.md) - Troubleshooting scripts