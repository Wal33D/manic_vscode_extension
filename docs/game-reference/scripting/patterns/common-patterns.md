# Common Scripting Patterns

This guide provides production-ready script patterns for common gameplay scenarios in Manic Miners. These patterns have been tested in community and campaign levels.

## Tutorial Flow Pattern

A complete tutorial system that guides players through multiple steps with visual indicators and progress tracking.

```
script{
    bool Step1Done=false
    bool Step2Done=false
    bool Step3Done=false
    arrow TutorialArrow=green
    string CurrentInstruction="Build a Tool Store on solid ground"
    
    # Initialize tutorial
    Init::
    msg:CurrentInstruction;
    highlightarrow:10,10,TutorialArrow;
    objective:Build a Tool Store;
    
    # Step 1: Build Tool Store
    when(buildings.BuildingToolStore_C>0 and Step1Done==false)[CompleteStep1];
    
    CompleteStep1::
    Step1Done:true;
    removearrow:TutorialArrow;
    msg:"Well done! You've built your first Tool Store.";
    wait:3;
    StartStep2;
    
    # Step 2: Collect resources
    StartStep2::
    CurrentInstruction:"Collect 10 Energy Crystals to power your base";
    msg:CurrentInstruction;
    highlightarrow:15,15,TutorialArrow;
    objective:Collect 10 Energy Crystals;
    
    when(crystals>=10 and Step2Done==false)[CompleteStep2];
    
    CompleteStep2::
    Step2Done:true;
    removearrow:TutorialArrow;
    msg:"Excellent! You have enough crystals.";
    wait:2;
    StartStep3;
    
    # Step 3: Train miners
    StartStep3::
    CurrentInstruction:"Teleport 3 Rock Raiders to help with mining";
    msg:CurrentInstruction;
    objective:Teleport 3 Rock Raiders;
    
    when(miners>=3 and Step3Done==false)[CompleteStep3];
    
    CompleteStep3::
    Step3Done:true;
    msg:"Tutorial complete! You're ready for your mission.";
    objective:Complete the mission;
    # Continue to main gameplay...
}
```

### Key Features:
- Progress tracking with boolean flags
- Visual guidance with arrows
- Clear instructions at each step
- Prevents re-triggering completed steps
- Smooth transitions between steps

## Wave Defense Pattern

Implements a wave-based enemy spawning system with increasing difficulty and rewards.

```
script{
    int WaveNumber=0
    int EnemiesInWave=3
    int EnemiesKilled=0
    bool WaveActive=false
    timer WaveTimer=30,20,40,StartWave
    
    # Initialize wave system
    Init::
    msg:"Prepare your defenses! First wave in 30 seconds.";
    starttimer:WaveTimer;
    
    StartWave::
    WaveNumber:WaveNumber+1;
    WaveActive:true;
    EnemiesKilled:0;
    msg:"Wave " + WaveNumber + " incoming!";
    
    # Spawn enemies based on wave number
    if(WaveNumber==1)[SpawnEasyWave];
    if(WaveNumber==2)[SpawnMediumWave];
    if(WaveNumber>=3)[SpawnHardWave];
    
    SpawnEasyWave::
    spawnwave:CreatureSmallSpider_C,EnemiesInWave,2;
    
    SpawnMediumWave::
    EnemiesInWave:5;
    spawnwave:CreatureRockMonster_C,EnemiesInWave,3;
    
    SpawnHardWave::
    EnemiesInWave:EnemiesInWave+2;
    spawnwave:CreatureLavaMonster_C,EnemiesInWave/2,2;
    spawnwave:CreatureRockMonster_C,EnemiesInWave/2,2;
    
    # Track wave completion
    when(creatures==0 and WaveActive==true)[WaveComplete];
    
    WaveComplete::
    WaveActive:false;
    msg:"Wave " + WaveNumber + " defeated!";
    
    # Give rewards based on wave
    crystals:WaveNumber*10;
    ore:WaveNumber*5;
    
    # Check for victory
    if(WaveNumber>=5)[Victory];
    
    Victory::
    msg:"All waves defeated! You are victorious!";
    stoptimer:WaveTimer;
    win:;
}
```

### Key Features:
- Progressive difficulty scaling
- Dynamic enemy composition
- Wave-based rewards
- Automatic wave management
- Victory condition after set number of waves

## Exploration Rewards Pattern

Rewards players for discovering hidden areas of the map with bonuses and achievements.

```
script{
    # Hidden cave locations
    bool Cave1Found=false
    bool Cave2Found=false
    bool Cave3Found=false
    int CavesFound=0
    int TotalSecrets=3
    
    # Secret areas
    when(discovertile[20,20] and Cave1Found==false)[FoundCave1];
    when(discovertile[35,45] and Cave2Found==false)[FoundCave2];
    when(discovertile[50,50] and Cave3Found==false)[FoundCave3];
    
    FoundCave1::
    Cave1Found:true;
    CavesFound:CavesFound+1;
    msg:"Hidden Crystal Cave discovered!";
    crystals:25;
    UpdateExplorationProgress;
    
    FoundCave2::
    Cave2Found:true;
    CavesFound:CavesFound+1;
    msg:"Ancient Ore Deposit found!";
    ore:40;
    UpdateExplorationProgress;
    
    FoundCave3::
    Cave3Found:true;
    CavesFound:CavesFound+1;
    msg:"Secret Recharge Seam located!";
    air:100;
    UpdateExplorationProgress;
    
    UpdateExplorationProgress::
    objective:"Hidden areas found: " + CavesFound + "/" + TotalSecrets;
    
    # Bonus for finding all secrets
    if(CavesFound==TotalSecrets)[AllSecretsBonus];
    
    AllSecretsBonus::
    msg:"Master Explorer! All hidden areas discovered!";
    
    # Major reward
    crystals:100;
    ore:50;
    studs:25;
    
    # Spawn reward vehicle
    place:BuildingSmallTeleportPad_C,25,25;
    teleportobjectin:VehicleLoaderDozer_C;
}
```

### Key Features:
- Tracks multiple discovery locations
- Individual rewards for each discovery
- Progress tracking with objectives
- Completion bonus for finding all secrets
- Combines resource and equipment rewards

## Dynamic Objective System

Creates a flexible objective system that updates based on player progress.

```
script{
    int ObjectivesComplete=0
    int TotalObjectives=4
    bool Obj1_ToolStore=false
    bool Obj2_PowerStation=false
    bool Obj3_Crystals=false
    bool Obj4_Defense=false
    string CurrentObjective="Build a Tool Store"
    
    # Initialize objectives
    Init::
    UpdateObjectiveDisplay;
    
    UpdateObjectiveDisplay::
    objective:CurrentObjective + " (" + ObjectivesComplete + "/" + TotalObjectives + " complete)";
    
    # Objective 1: Build Tool Store
    when(buildings.BuildingToolStore_C>0 and Obj1_ToolStore==false)[CompleteObj1];
    
    CompleteObj1::
    Obj1_ToolStore:true;
    ObjectivesComplete:ObjectivesComplete+1;
    msg:"Tool Store complete!";
    CurrentObjective:"Build a Power Station";
    UpdateObjectiveDisplay;
    
    # Objective 2: Build Power Station
    when(buildings.BuildingPowerStation_C>0 and Obj2_PowerStation==false)[CompleteObj2];
    
    CompleteObj2::
    Obj2_PowerStation:true;
    ObjectivesComplete:ObjectivesComplete+1;
    msg:"Power Station online!";
    CurrentObjective:"Collect 50 Energy Crystals";
    UpdateObjectiveDisplay;
    
    # Objective 3: Collect Crystals
    when(crystals>=50 and Obj3_Crystals==false)[CompleteObj3];
    
    CompleteObj3::
    Obj3_Crystals:true;
    ObjectivesComplete:ObjectivesComplete+1;
    msg:"Crystal quota reached!";
    CurrentObjective:"Defeat all creatures";
    UpdateObjectiveDisplay;
    
    # Objective 4: Clear Threats
    when(creatures==0 and Obj4_Defense==false)[CompleteObj4];
    
    CompleteObj4::
    Obj4_Defense:true;
    ObjectivesComplete:ObjectivesComplete+1;
    msg:"All threats eliminated!";
    UpdateObjectiveDisplay;
    
    # Check for mission complete
    when(ObjectivesComplete==TotalObjectives)[MissionComplete];
    
    MissionComplete::
    msg:"All objectives complete! Outstanding work!";
    wait:3;
    win:;
}
```

### Key Features:
- Dynamic objective text updates
- Progress counter in objective display
- Flexible objective ordering
- Clear completion feedback
- Automatic victory detection

## Multi-Zone Control Pattern

Implements area control mechanics where players must capture and hold multiple zones.

```
script{
    # Zone states
    bool Zone1Captured=false
    bool Zone2Captured=false
    bool Zone3Captured=false
    int ZonesCaptured=0
    
    # Zone timers
    int Zone1Timer=0
    int Zone2Timer=0
    int Zone3Timer=0
    int CaptureTime=10  # Seconds to capture
    
    # Zone 1 (10,10 - 15,15)
    when(enter:12,12:miners)[Zone1Entry];
    
    Zone1Entry::
    if(Zone1Captured==false)[StartZone1Capture];
    
    StartZone1Capture::
    msg:"Capturing Zone 1...";
    Zone1Timer:0;
    when(time>Zone1Timer+CaptureTime and Zone1Captured==false)[CaptureZone1];
    
    CaptureZone1::
    Zone1Captured:true;
    ZonesCaptured:ZonesCaptured+1;
    msg:"Zone 1 captured!";
    highlightarrow:12,12,green;
    CheckVictory;
    
    # Similar patterns for Zone 2 and Zone 3...
    
    CheckVictory::
    if(ZonesCaptured==3)[AllZonesCaptured];
    
    AllZonesCaptured::
    msg:"All zones under control! Victory!";
    win:;
}
```

## Resource Management Alert System

Monitors resources and provides warnings when supplies run low.

```
script{
    # Alert thresholds
    int CrystalWarningLevel=20
    int OreWarningLevel=15
    int AirCriticalLevel=50
    
    # Alert states
    bool CrystalWarningShown=false
    bool OreWarningShown=false
    bool AirWarningShown=false
    
    # Monitor crystal levels
    when(crystals<CrystalWarningLevel and CrystalWarningShown==false)[CrystalWarning];
    when(crystals>=CrystalWarningLevel and CrystalWarningShown==true)[CrystalWarningClear];
    
    CrystalWarning::
    CrystalWarningShown:true;
    msg:"Warning: Energy Crystal reserves low!";
    sound:warning;
    
    CrystalWarningClear::
    CrystalWarningShown:false;
    msg:"Crystal levels restored.";
    
    # Monitor ore levels
    when(ore<OreWarningLevel and OreWarningShown==false)[OreWarning];
    
    OreWarning::
    OreWarningShown:true;
    msg:"Warning: Ore supplies running low!";
    
    # Critical air warning
    when(air<AirCriticalLevel and AirWarningShown==false)[AirCritical];
    
    AirCritical::
    AirWarningShown:true;
    msg:"CRITICAL: Oxygen levels dangerously low!";
    sound:alarm;
    shake:1.0,0.5;
}
```

## Best Practices for These Patterns

1. **State Management**: Always use boolean flags to track completed events
2. **Clear Feedback**: Provide messages for all major events
3. **Progressive Difficulty**: Scale challenges based on player progress
4. **Prevent Re-triggering**: Check state before executing repeatable events
5. **Modular Design**: Break complex systems into smaller event chains
6. **Resource Balance**: Test reward amounts for game balance
7. **Performance**: Limit active `when` triggers by using state checks

## Combining Patterns

These patterns can be combined for complex gameplay:

```
script{
    # Combine tutorial + wave defense
    bool TutorialComplete=false
    int WaveNumber=0
    
    # Run tutorial first
    Init::
    StartTutorial;
    
    # After tutorial, start waves
    TutorialFinished::
    TutorialComplete:true;
    msg:"Tutorial complete! Prepare for enemy waves!";
    wait:5;
    StartWaveDefense;
}
```

## See Also

- [Events](../syntax/events.md) - Complete event reference
- [Triggers](../syntax/triggers.md) - Trigger types and usage
- [Event Chains](../syntax/event-chains.md) - Event chain mechanics
- [Debugging](../debugging.md) - Debugging scripts
- [Performance](../../../technical-reference/performance.md#script-performance) - Optimization tips