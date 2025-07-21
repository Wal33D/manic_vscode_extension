# Tutorial and Onboarding Patterns

This guide provides battle-tested patterns for creating effective tutorial and onboarding experiences in Manic Miners maps.

## Table of Contents
1. [Guided Tutorial Pattern](#guided-tutorial-pattern)
2. [Interactive Teaching](#interactive-teaching)
3. [Progressive Unlocking](#progressive-unlocking)
4. [Hint System](#hint-system)
5. [Skill Verification](#skill-verification)
6. [Adaptive Tutorials](#adaptive-tutorials)

## Guided Tutorial Pattern

Create step-by-step tutorials that guide players through game mechanics.

### Basic Step System
```
script{
    # Tutorial state tracking
    int TutorialStep=0
    bool StepActive=false
    arrow GuideArrow=green
    arrow WarningArrow=yellow
    
    # Initialize tutorial
    when(init)[StartTutorial]
    
    StartTutorial::
    TutorialStep:1;
    StepActive:true;
    msg:Welcome_Tutorial_Starting;
    wait:3;
    ShowStep1::;
    
    # Step 1: Basic movement
    ShowStep1::
    msg:Step1_MoveYourMiners;
    highlightarrow:10,10,GuideArrow;
    objective:Move a miner to the green arrow;
    
    when(enter:10,10 and TutorialStep==1)[CompleteStep1]
    
    CompleteStep1::
    removearrow:GuideArrow;
    msg:Step1_Complete;
    crystals:5;  # Small reward
    TutorialStep:2;
    wait:2;
    ShowStep2::;
    
    # Step 2: Drilling
    ShowStep2::
    msg:Step2_DrillWalls;
    highlightarrow:12,10,GuideArrow;
    objective:Drill the wall at the arrow;
    
    when(drill:12,10 and TutorialStep==2)[CompleteStep2]
    
    CompleteStep2::
    removearrow:GuideArrow;
    msg:Step2_Complete;
    TutorialStep:3;
    wait:2;
    ShowStep3::;
    
    # Step 3: Collecting resources
    ShowStep3::
    msg:Step3_CollectCrystals;
    place:14,10,42;  # Place crystal seam
    highlightarrow:14,10,GuideArrow;
    objective:Collect the energy crystal;
    
    when(crystals>=5 and TutorialStep==3)[CompleteStep3]
    
    CompleteStep3::
    removearrow:GuideArrow;
    msg:Step3_Complete;
    TutorialStep:4;
    ShowStep4::;
    
    # Continue with more steps...
}
```

### Visual Guidance System
```
script{
    # Enhanced visual feedback
    arrow MoveArrow=green
    arrow BuildArrow=blue
    arrow DangerArrow=red
    arrow OptionalArrow=yellow
    
    # Highlight different action types
    ShowMovementPath::
    highlightarrow:5,5,MoveArrow;
    highlightarrow:6,5,MoveArrow;
    highlightarrow:7,5,MoveArrow;
    highlightarrow:8,5,MoveArrow;
    msg:FollowGreenArrows;
    
    ShowBuildLocation::
    highlightarrow:10,10,BuildArrow;
    msg:BuildHere;
    
    ShowDanger::
    highlightarrow:15,15,DangerArrow;
    msg:AvoidRedAreas;
    
    ShowOptional::
    highlightarrow:20,20,OptionalArrow;
    msg:OptionalObjective;
}
```

## Interactive Teaching

Teach through doing rather than just explaining.

### Learn by Doing
```
script{
    # Building tutorial
    bool HasBuiltToolStore=false
    bool HasBuiltPowerStation=false
    bool HasConnectedPower=false
    
    # Step 1: Build Tool Store
    when(init)[TeachToolStore]
    
    TeachToolStore::
    msg:BuildToolStoreFirst;
    objective:Build a Tool Store;
    # Give exact resources needed
    crystals:8;
    ore:10;
    
    when(buildings.BuildingToolStore_C>0 and HasBuiltToolStore==false)[ToolStoreBuilt]
    
    ToolStoreBuilt::
    HasBuiltToolStore:true;
    msg:GoodJobToolStore;
    wait:2;
    TeachPowerStation::;
    
    # Step 2: Build Power Station
    TeachPowerStation::
    msg:NowBuildPower;
    objective:Build a Power Station;
    crystals:12;
    ore:15;
    
    when(buildings.BuildingPowerStation_C>0 and HasBuiltPowerStation==false)[PowerBuilt]
    
    PowerBuilt::
    HasBuiltPowerStation:true;
    msg:PowerStationComplete;
    wait:2;
    TeachConnection::;
    
    # Step 3: Connect buildings
    TeachConnection::
    msg:ConnectBuildingsWithPowerPaths;
    objective:Connect Tool Store to Power Station;
    
    when(buildings.BuildingToolStore_C.ispowered==true)[ConnectionComplete]
    
    ConnectionComplete::
    HasConnectedPower:true;
    msg:ExcellentPowerConnected;
    crystals:25;  # Reward for completion
}
```

### Mistake Correction
```
script{
    # Help players learn from mistakes
    int MistakeCount=0
    bool ShowedHint=false
    
    # Monitor common mistakes
    when(buildings.BuildingToolStore_C==0 and crystals<8 and ore<10)[NotEnoughResources]
    when(buildings.BuildingPowerStation_C>0 and buildings.BuildingToolStore_C==0)[WrongOrder]
    
    NotEnoughResources::
    MistakeCount:MistakeCount+1;
    msg:NeedMoreResources;
    wait:2;
    if(MistakeCount>2 and ShowedHint==false)[ShowResourceHint];
    
    ShowResourceHint::
    ShowedHint:true;
    msg:HintDrillCrystalSeams;
    highlightarrow:10,10,arrow=yellow;  # Show nearest crystals
    
    WrongOrder::
    msg:BuildToolStoreFirst;
    shake:1,2;  # Gentle reminder
}
```

## Progressive Unlocking

Gradually introduce complexity as players demonstrate mastery.

### Mechanic Unlocking
```
script{
    # Track what player has learned
    bool KnowsMovement=false
    bool KnowsDrilling=false
    bool KnowsBuilding=false
    bool KnowsCombat=false
    bool KnowsVehicles=false
    
    # Unlock mechanics progressively
    when(miners.moved>5)[UnlockDrilling]
    
    UnlockDrilling::
    KnowsMovement:true;
    KnowsDrilling:true;
    msg:DrillUnlocked;
    objective:Practice drilling walls;
    
    when(drill.count>10 and KnowsDrilling==true)[UnlockBuilding]
    
    UnlockBuilding::
    KnowsBuilding:true;
    msg:BuildingUnlocked;
    allowbuilding:BuildingToolStore_C;
    crystals:10;
    ore:15;
    
    when(buildings>2 and KnowsBuilding==true)[UnlockCombat]
    
    UnlockCombat::
    KnowsCombat:true;
    msg:CombatUnlocked;
    wait:3;
    emerge:20,20,CreatureRockMonster_C;
    objective:Defend your base!;
    
    when(creatures==0 and KnowsCombat==true)[UnlockVehicles]
    
    UnlockVehicles::
    KnowsVehicles:true;
    msg:VehiclesUnlocked;
    allowbuilding:BuildingDocks_C;
    crystals:20;
}
```

### Complexity Scaling
```
script{
    # Gradually increase challenge
    int SkillLevel=1
    int TasksCompleted=0
    
    # Simple tasks first
    when(TasksCompleted==0)[SimpleTask]
    
    SimpleTask::
    msg:CollectCrystalsSimple;
    objective:Collect 5 crystals;
    
    when(crystals>=5 and TasksCompleted==0)[SimpleComplete]
    
    SimpleComplete::
    TasksCompleted:1;
    msg:WellDone;
    CheckSkillProgress::;
    
    # Medium complexity
    when(TasksCompleted==3 and SkillLevel==2)[MediumTask]
    
    MediumTask::
    msg:BuildAndDefend;
    objective:Build Tool Store and defeat 2 creatures;
    emerge:15,15,CreatureRockMonster_C;
    wait:10;
    emerge:20,20,CreatureRockMonster_C;
    
    # Complex challenges
    when(TasksCompleted==6 and SkillLevel==3)[ComplexTask]
    
    ComplexTask::
    msg:MultiObjectiveChallenge;
    objective:Build base, collect 50 crystals, survive 5 minutes;
    starttimer:SurvivalTimer;
    
    CheckSkillProgress::
    if(TasksCompleted>=3)[SkillLevel:2];
    if(TasksCompleted>=6)[SkillLevel:3];
}
```

## Hint System

Provide contextual hints without breaking immersion.

### Progressive Hint System
```
script{
    # Hint configuration
    int HintLevel=0  # 0=none, 1=subtle, 2=direct, 3=solution
    timer HintTimer=30
    bool TaskStuck=false
    
    # Monitor progress
    when(TutorialStep==2 and time>60)[CheckStuck]
    
    CheckStuck::
    if(buildings.BuildingToolStore_C==0)[TaskStuck:true];
    
    when(TaskStuck==true)[StartHintTimer]
    
    StartHintTimer::
    starttimer:HintTimer;
    
    when(HintTimer.expired and HintLevel<3)[NextHint]
    
    NextHint::
    HintLevel:HintLevel+1;
    if(HintLevel==1)[SubtleHint];
    if(HintLevel==2)[DirectHint];
    if(HintLevel==3)[ShowSolution];
    starttimer:HintTimer;  # Restart for next level
    
    SubtleHint::
    msg:HintCheckResources;
    
    DirectHint::
    msg:HintNeedToolStore;
    highlightarrow:10,10,arrow=yellow;
    
    ShowSolution::
    msg:SolutionBuildHere;
    highlightarrow:10,10,arrow=green;
    pan:10,10;
}
```

### Context-Sensitive Help
```
script{
    # Different hints based on situation
    bool LowOnCrystals=false
    bool LowOnOre=false
    bool UnderAttack=false
    
    # Monitor game state
    when(crystals<5 and buildings.BuildingToolStore_C>0)[CheckCrystals]
    when(ore<5 and buildings.BuildingToolStore_C>0)[CheckOre]
    when(creatures>2)[CheckDefense]
    
    CheckCrystals::
    LowOnCrystals:true;
    msg:HintFindCrystalSeams;
    # Highlight nearest crystal
    highlightarrow:15,15,arrow=blue;
    
    CheckOre::
    LowOnOre:true;
    msg:HintFindOreSeams;
    # Highlight nearest ore
    highlightarrow:20,20,arrow=yellow;
    
    CheckDefense::
    UnderAttack:true;
    msg:HintBuildDefenses;
    if(buildings.BuildingMiningLaser_C==0)[msg:HintMiningLaser];
}
```

## Skill Verification

Ensure players have mastered concepts before progressing.

### Skill Check Gates
```
script{
    # Verify each skill before continuing
    bool PassedMovementTest=false
    bool PassedDrillingTest=false
    bool PassedBuildingTest=false
    
    # Movement test
    MovementTest::
    msg:TestYourMovement;
    objective:Move all 3 miners to the green area;
    place:10,10,1;  # Clear ground
    place:10,11,1;
    place:10,12,1;
    highlightarrow:10,11,arrow=green;
    
    when(enter:10,10 and enter:10,11 and enter:10,12)[PassMovement]
    
    PassMovement::
    PassedMovementTest:true;
    msg:MovementTestPassed;
    removearrow:arrow;
    wait:2;
    DrillingTest::;
    
    # Drilling test
    DrillingTest::
    msg:TestYourDrilling;
    objective:Create a path through the wall;
    # Create wall pattern
    place:15,10,38;
    place:15,11,38;
    place:15,12,38;
    
    when(drill:15,11)[PassDrilling]
    
    PassDrilling::
    PassedDrillingTest:true;
    msg:DrillingTestPassed;
    wait:2;
    BuildingTest::;
    
    # Building test
    BuildingTest::
    msg:TestYourBuilding;
    objective:Build and power a Tool Store;
    crystals:20;
    ore:25;
    
    when(buildings.BuildingToolStore_C>0 and buildings.BuildingToolStore_C.ispowered)[PassBuilding]
    
    PassBuilding::
    PassedBuildingTest:true;
    msg:AllTestsPassed;
    win:;
}
```

### Mastery Tracking
```
script{
    # Track skill mastery levels
    int MovementMastery=0  # 0-100
    int DrillingMastery=0
    int BuildingMastery=0
    int CombatMastery=0
    
    # Award mastery points
    when(miners.moved>10)[AddMovementPoints]
    when(drill.count>20)[AddDrillingPoints]
    when(buildings>5)[AddBuildingPoints]
    when(creatures.killed>10)[AddCombatPoints]
    
    AddMovementPoints::
    MovementMastery:MovementMastery+10;
    if(MovementMastery>100)[MovementMastery:100];
    msg:MovementSkillIncreased;
    
    AddDrillingPoints::
    DrillingMastery:DrillingMastery+10;
    if(DrillingMastery>100)[DrillingMastery:100];
    msg:DrillingSkillIncreased;
    
    # Unlock advanced features based on mastery
    when(MovementMastery>=50 and DrillingMastery>=50)[UnlockAdvanced]
    
    UnlockAdvanced::
    msg:AdvancedFeaturesUnlocked;
    allowbuilding:BuildingUpgradeStation_C;
}
```

## Adaptive Tutorials

Adjust tutorial difficulty based on player performance.

### Performance Monitoring
```
script{
    # Track player performance
    int MistakesMade=0
    int TimeToComplete=0
    int HintsUsed=0
    string PlayerSkill="Beginner"
    
    # Adjust based on performance
    when(MistakesMade>5)[SetBeginner]
    when(MistakesMade<2 and TimeToComplete<120)[SetExpert]
    when(HintsUsed>3)[SetNeedsHelp]
    
    SetBeginner::
    PlayerSkill:"Beginner";
    msg:TakingItSlow;
    # Provide more resources
    crystals:20;
    ore:20;
    
    SetExpert::
    PlayerSkill:"Expert";
    msg:ExpertDetected;
    # Skip basic tutorials
    TutorialStep:5;
    
    SetNeedsHelp::
    PlayerSkill:"NeedsGuidance";
    msg:ExtraHelpAvailable;
    # Enable auto-hints
    HintLevel:1;
}
```

### Dynamic Difficulty
```
script{
    # Adjust challenge in real-time
    float DifficultyMultiplier=1.0
    int PlayerDeaths=0
    int PlayerSuccesses=0
    
    # Monitor performance
    when(pilot.death)[PlayerDied]
    when(objective.complete)[PlayerSucceeded]
    
    PlayerDied::
    PlayerDeaths:PlayerDeaths+1;
    if(PlayerDeaths>3)[ReduceDifficulty];
    
    PlayerSucceeded::
    PlayerSuccesses:PlayerSuccesses+1;
    if(PlayerSuccesses>3)[IncreaseDifficulty];
    
    ReduceDifficulty::
    DifficultyMultiplier:DifficultyMultiplier*0.8;
    msg:DifficultyReduced;
    # Give bonus resources
    crystals:10;
    ore:10;
    
    IncreaseDifficulty::
    DifficultyMultiplier:DifficultyMultiplier*1.2;
    msg:DifficultyIncreased;
    # Spawn extra challenge
    emerge:25,25,CreatureRockMonster_C;
}
```

## Best Practices for Tutorials

1. **Start Simple**: Begin with one mechanic at a time
2. **Show, Don't Tell**: Use visual indicators and hands-on practice
3. **Reward Progress**: Give small rewards for each step completed
4. **Allow Mistakes**: Let players fail safely and learn
5. **Provide Options**: Offer ways to skip or replay sections
6. **Test Thoroughly**: Ensure all paths through tutorial work
7. **Be Patient**: Don't rush players through concepts
8. **Stay Positive**: Encourage rather than criticize
9. **Track Everything**: Monitor what works and what doesn't
10. **Iterate**: Refine based on player behavior

## See Also
- [Common Patterns](common-patterns.md) - General scripting patterns
- [Objective Patterns](objective-patterns.md) - Goal and objective design
- [UI/UX Patterns](ui-ux-patterns.md) - User interface patterns
- [Debugging Guide](../debugging.md) - Testing your tutorials