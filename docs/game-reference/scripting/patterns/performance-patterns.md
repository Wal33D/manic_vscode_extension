# Performance Optimization Patterns

Advanced patterns for optimizing script performance and managing complex systems efficiently in Manic Miners maps.

## Table of Contents
1. [Trigger Optimization](#trigger-optimization)
2. [Event Management](#event-management)
3. [State Machines](#state-machines)
4. [Memory Efficiency](#memory-efficiency)
5. [Batch Operations](#batch-operations)
6. [Lazy Evaluation](#lazy-evaluation)

## Trigger Optimization

Minimize the performance impact of continuous trigger checks.

### Conditional Trigger Activation
```
script{
    # Only activate triggers when needed
    bool CombatSystemActive=false
    bool EconomySystemActive=false
    bool ExplorationSystemActive=false
    
    # Master control system
    when(init)[InitializeSystems]
    
    InitializeSystems::
    msg:SystemsInitializing;
    # Start with minimal systems
    EconomySystemActive:true;
    
    # Activate combat only when needed
    when(creatures>0 and CombatSystemActive==false)[ActivateCombat]
    
    ActivateCombat::
    CombatSystemActive:true;
    msg:CombatSystemOnline;
    
    # Combat triggers - only checked when active
    when(CombatSystemActive==true and creatures>5)[HighThreatMode]
    when(CombatSystemActive==true and buildings.damaged)[RepairMode]
    
    # Deactivate when not needed
    when(creatures==0 and CombatSystemActive==true)[DeactivateCombat]
    
    DeactivateCombat::
    CombatSystemActive:false;
    msg:CombatSystemOffline;
}
```

### Trigger Consolidation
```
script{
    # Instead of many specific triggers, use one smart trigger
    timer MasterCheckTimer=5,5,5,MasterCheck
    int CheckCounter=0
    
    when(init)[StartOptimizedSystem]
    
    StartOptimizedSystem::
    starttimer:MasterCheckTimer;
    
    MasterCheck::
    CheckCounter:CheckCounter+1;
    
    # Rotate through different checks
    if(CheckCounter%3==0)[CheckResources];
    else if(CheckCounter%3==1)[CheckThreats];
    else[CheckObjectives];
    
    CheckResources::
    if(crystals<10)[LowCrystalAlert];
    if(ore<10)[LowOreAlert];
    if(studs<2)[LowStudAlert];
    
    CheckThreats::
    if(creatures>0)[ThreatDetected];
    if(buildings.damaged>0)[DamageDetected];
    
    CheckObjectives::
    if(objective1.complete)[UpdateObjective1];
    if(objective2.complete)[UpdateObjective2];
}
```

### Flag-Based Deactivation
```
script{
    # Use flags to permanently disable completed checks
    bool TutorialComplete=false
    bool FirstWaveComplete=false
    bool SecretFound=false
    
    # Tutorial triggers - stop checking after completion
    when(init and TutorialComplete==false)[StartTutorial]
    when(buildings.BuildingToolStore_C>0 and TutorialComplete==false)[TutorialStep2]
    
    TutorialStep2::
    msg:TutorialComplete;
    TutorialComplete:true;  # Stops all tutorial triggers
    
    # Wave triggers - only active during wave
    when(time>60 and FirstWaveComplete==false)[StartFirstWave]
    
    StartFirstWave::
    emerge:10,10,CreatureRockMonster_C;
    
    when(creatures==0 and FirstWaveComplete==false)[CompleteFirstWave]
    
    CompleteFirstWave::
    FirstWaveComplete:true;  # Stops checking for first wave completion
    msg:WaveComplete;
}
```

## Event Management

Optimize event chains and reduce unnecessary processing.

### Event Batching
```
script{
    # Batch similar operations together
    bool BatchPending=false
    int BatchedCrystals=0
    int BatchedOre=0
    int BatchedMessages=0
    timer BatchTimer=2
    
    # Instead of immediate processing, queue operations
    QueueCrystalReward::
    BatchedCrystals:BatchedCrystals+10;
    if(BatchPending==false)[StartBatch];
    
    QueueOreReward::
    BatchedOre:BatchedOre+5;
    if(BatchPending==false)[StartBatch];
    
    StartBatch::
    BatchPending:true;
    starttimer:BatchTimer;
    
    # Process batch when timer expires
    when(BatchTimer.expired)[ProcessBatch]
    
    ProcessBatch::
    # Apply all changes at once
    if(BatchedCrystals>0)[crystals:BatchedCrystals];
    if(BatchedOre>0)[ore:BatchedOre];
    
    # Show summary message
    msg:RewardsEarned;
    
    # Reset batch
    BatchedCrystals:0;
    BatchedOre:0;
    BatchPending:false;
}
```

### Event Chain Optimization
```
script{
    # Minimize event chain depth
    int ProcessingStep=0
    bool Processing=false
    
    # Bad: Deep nested chains
    # DeepChain1::
    # DoSomething;
    # DeepChain2::;
    # 
    # DeepChain2::
    # DoMore;
    # DeepChain3::;
    # etc...
    
    # Good: Flat processing with state
    StartProcessing::
    Processing:true;
    ProcessingStep:1;
    ProcessNext::;
    
    ProcessNext::
    if(ProcessingStep==1)[Step1];
    else if(ProcessingStep==2)[Step2];
    else if(ProcessingStep==3)[Step3];
    else[ProcessingComplete];
    
    Step1::
    # Do step 1 work
    msg:ProcessingStep1;
    ProcessingStep:2;
    ProcessNext::;
    
    Step2::
    # Do step 2 work
    msg:ProcessingStep2;
    ProcessingStep:3;
    ProcessNext::;
    
    Step3::
    # Do step 3 work
    msg:ProcessingStep3;
    ProcessingStep:4;
    ProcessNext::;
    
    ProcessingComplete::
    Processing:false;
    ProcessingStep:0;
    msg:ProcessingFinished;
}
```

## State Machines

Implement efficient state machines for complex behaviors.

### Optimized State Machine
```
script{
    # Efficient state machine pattern
    int CurrentState=0  # 0=Idle, 1=Working, 2=Combat, 3=Fleeing
    int PreviousState=0
    bool StateChanged=false
    timer StateUpdateTimer=3,3,3,UpdateState
    
    when(init)[InitStateMachine]
    
    InitStateMachine::
    CurrentState:0;
    starttimer:StateUpdateTimer;
    
    UpdateState::
    PreviousState:CurrentState;
    
    # Determine new state
    if(creatures>5)[CurrentState:3];      # Fleeing
    else if(creatures>0)[CurrentState:2]; # Combat
    else if(work.available)[CurrentState:1]; # Working
    else[CurrentState:0];                  # Idle
    
    # Check if state changed
    if(CurrentState!=PreviousState)[StateChanged:true];
    
    # Handle state transitions
    if(StateChanged==true)[HandleStateChange];
    
    HandleStateChange::
    StateChanged:false;
    
    # Exit previous state
    if(PreviousState==0)[ExitIdle];
    else if(PreviousState==1)[ExitWorking];
    else if(PreviousState==2)[ExitCombat];
    else if(PreviousState==3)[ExitFleeing];
    
    # Enter new state
    if(CurrentState==0)[EnterIdle];
    else if(CurrentState==1)[EnterWorking];
    else if(CurrentState==2)[EnterCombat];
    else if(CurrentState==3)[EnterFleeing];
    
    EnterIdle::
    msg:SystemIdle;
    # Reduce check frequency when idle
    stoptimer:StateUpdateTimer;
    StateUpdateTimer:5,5,5,UpdateState;
    starttimer:StateUpdateTimer;
    
    EnterCombat::
    msg:CombatMode;
    # Increase check frequency in combat
    stoptimer:StateUpdateTimer;
    StateUpdateTimer:1,1,1,UpdateState;
    starttimer:StateUpdateTimer;
}
```

### Hierarchical State Machine
```
script{
    # Parent and child states
    int MainState=0     # 0=Peace, 1=War
    int SubState=0      # Varies by main state
    string StateString="Peace.Idle"
    
    # Main state controller
    UpdateMainState::
    if(creatures>0 and MainState==0)[SwitchToWar];
    else if(creatures==0 and MainState==1)[SwitchToPeace];
    
    SwitchToWar::
    MainState:1;
    SubState:0;
    msg:WarDeclared;
    InitWarStates::;
    
    SwitchToPeace::
    MainState:0;
    SubState:0;
    msg:PeaceRestored;
    InitPeaceStates::;
    
    # Peace substates
    InitPeaceStates::
    # 0=Idle, 1=Building, 2=Mining
    if(buildings.needed)[SubState:1];
    else if(resources.low)[SubState:2];
    else[SubState:0];
    
    UpdatePeaceState::;
    
    UpdatePeaceState::
    if(SubState==0)[StateString:"Peace.Idle"];
    else if(SubState==1)[StateString:"Peace.Building"];
    else if(SubState==2)[StateString:"Peace.Mining"];
    
    # War substates
    InitWarStates::
    # 0=Defending, 1=Attacking, 2=Retreating
    if(buildings.damaged)[SubState:0];
    else if(military.strong)[SubState:1];
    else[SubState:2];
    
    UpdateWarState::;
    
    UpdateWarState::
    if(SubState==0)[StateString:"War.Defending"];
    else if(SubState==1)[StateString:"War.Attacking"];
    else if(SubState==2)[StateString:"War.Retreating"];
}
```

## Memory Efficiency

Manage variables and data structures efficiently.

### Variable Pooling
```
script{
    # Reuse variables instead of creating many
    int TempValue1=0
    int TempValue2=0
    int TempValue3=0
    string TempString=""
    bool TempFlag=false
    
    # Example: Reuse temps for calculations
    CalculateResources::
    TempValue1:crystals;
    TempValue2:ore;
    TempValue3:TempValue1+TempValue2;
    
    if(TempValue3>100)[ResourcesHigh];
    
    # Reuse same temps for different purpose
    CalculateThreat::
    TempValue1:creatures;
    TempValue2:buildings;
    TempValue3:TempValue1*10/TempValue2;
    
    if(TempValue3>5)[ThreatHigh];
    
    # String reuse
    ShowMessage::
    TempString:"Status:";
    if(MainState==0)[TempString:TempString+"Peace"];
    else[TempString:TempString+"War"];
    msg:TempString;
}
```

### Bit Flags for Multiple Booleans
```
script{
    # Pack multiple flags into one integer
    int SystemFlags=0
    # Bit 0: Combat active
    # Bit 1: Economy active
    # Bit 2: Exploration active
    # Bit 3: Tutorial complete
    # Bit 4: Emergency mode
    
    # Set flags using addition
    EnableCombat::
    SystemFlags:SystemFlags+1;  # Set bit 0
    
    EnableEconomy::
    SystemFlags:SystemFlags+2;  # Set bit 1
    
    EnableExploration::
    SystemFlags:SystemFlags+4;  # Set bit 2
    
    # Check flags using comparison
    IsCombatActive::
    TempValue1:SystemFlags%2;  # Check bit 0
    if(TempValue1==1)[CombatIsActive];
    
    IsEconomyActive::
    TempValue1:(SystemFlags/2)%2;  # Check bit 1
    if(TempValue1==1)[EconomyIsActive];
}
```

## Batch Operations

Group similar operations to reduce overhead.

### Batch Spawning
```
script{
    # Spawn multiple entities efficiently
    int SpawnCount=10
    int SpawnType=1  # 1=Rock, 2=Lava, 3=Mixed
    bool SpawnPending=false
    
    # Queue spawn request
    QueueSpawn::
    SpawnPending:true;
    SpawnCount:SpawnCount+RequestedCount;
    
    # Process all spawns at once
    ProcessSpawns::
    if(SpawnPending==false)[return];
    
    SpawnPending:false;
    
    # Batch spawn by type
    if(SpawnType==1)[SpawnRockBatch];
    else if(SpawnType==2)[SpawnLavaBatch];
    else[SpawnMixedBatch];
    
    SpawnRockBatch::
    # Spawn in efficient pattern
    emerge:10,10,CreatureRockMonster_C;
    emerge:10,12,CreatureRockMonster_C;
    emerge:10,14,CreatureRockMonster_C;
    emerge:12,10,CreatureRockMonster_C;
    emerge:12,12,CreatureRockMonster_C;
    # Continue pattern...
    
    # Reset counter
    SpawnCount:0;
}
```

### Batch Tile Updates
```
script{
    # Update multiple tiles efficiently
    bool UpdatesPending=false
    int UpdateRegion=0  # Which region to update
    
    # Queue region for update
    QueueRegionUpdate::
    UpdatesPending:true;
    UpdateRegion:RequestedRegion;
    
    # Process updates in batch
    ProcessTileUpdates::
    if(UpdatesPending==false)[return];
    
    UpdatesPending:false;
    
    # Update entire region at once
    if(UpdateRegion==1)[UpdateRegion1];
    else if(UpdateRegion==2)[UpdateRegion2];
    
    UpdateRegion1::
    # Update 5x5 area efficiently
    place:10,10,1;
    place:10,11,1;
    place:10,12,1;
    place:10,13,1;
    place:10,14,1;
    place:11,10,1;
    place:11,11,1;
    place:11,12,1;
    place:11,13,1;
    place:11,14,1;
    # Continue pattern...
}
```

## Lazy Evaluation

Defer expensive operations until actually needed.

### Deferred Calculations
```
script{
    # Don't calculate until needed
    bool PathfindingNeeded=false
    bool PathCalculated=false
    int PathDistance=0
    
    # Mark that pathfinding is needed
    when(objective.changed)[MarkPathfindingNeeded]
    
    MarkPathfindingNeeded::
    PathfindingNeeded:true;
    PathCalculated:false;
    
    # Only calculate when actually used
    GetPathDistance::
    if(PathCalculated==true)[ReturnCachedPath];
    else if(PathfindingNeeded==true)[CalculatePath];
    
    CalculatePath::
    # Expensive calculation
    msg:CalculatingPath;
    # Simulate complex pathfinding
    PathDistance:25;
    PathCalculated:true;
    PathfindingNeeded:false;
    
    ReturnCachedPath::
    # Use cached value
    msg:PathDistance+PathDistance;
}
```

### On-Demand Loading
```
script{
    # Load data only when needed
    bool CombatDataLoaded=false
    bool EconomyDataLoaded=false
    bool ExplorationDataLoaded=false
    
    # Load combat data when combat starts
    when(creatures>0 and CombatDataLoaded==false)[LoadCombatData]
    
    LoadCombatData::
    CombatDataLoaded:true;
    msg:LoadingCombatSystems;
    
    # Initialize combat variables
    int CombatStrength=10;
    int DefenseRating=5;
    int DamageDealt=0;
    
    # Start combat triggers
    when(CombatDataLoaded==true and creatures>5)[HighThreatCombat];
    
    # Unload when not needed
    when(creatures==0 and CombatDataLoaded==true)[UnloadCombatData]
    
    UnloadCombatData::
    CombatDataLoaded:false;
    msg:UnloadingCombatSystems;
    # Clear combat variables to save memory
    CombatStrength:0;
    DefenseRating:0;
    DamageDealt:0;
}
```

### Cached Results
```
script{
    # Cache expensive calculations
    int CachedBuildingCount=-1
    int CachedThreatLevel=-1
    int CachedResourceTotal=-1
    timer CacheTimer=10,10,10,InvalidateCache
    
    when(init)[StartCaching]
    
    StartCaching::
    starttimer:CacheTimer;
    
    # Get building count with caching
    GetBuildingCount::
    if(CachedBuildingCount>=0)[UseCachedBuildings];
    else[CalculateBuildings];
    
    CalculateBuildings::
    CachedBuildingCount:buildings;
    msg:BuildingCount+CachedBuildingCount;
    
    UseCachedBuildings::
    msg:BuildingCountCached+CachedBuildingCount;
    
    # Invalidate cache periodically
    InvalidateCache::
    CachedBuildingCount:-1;
    CachedThreatLevel:-1;
    CachedResourceTotal:-1;
}
```

## Best Practices for Performance

1. **Profile First**: Identify actual bottlenecks before optimizing
2. **Minimize Triggers**: Use fewer, smarter triggers
3. **Batch Operations**: Group similar operations together
4. **Cache Results**: Store expensive calculations
5. **Use Timers**: Don't check everything every tick
6. **Clean Up**: Remove completed triggers and timers
7. **State Machines**: Use efficient state management
8. **Lazy Loading**: Defer work until needed
9. **Pool Resources**: Reuse variables and objects
10. **Test Impact**: Measure performance improvements

## Common Performance Pitfalls

### Avoid These Patterns
```
# BAD: Continuous expensive checks
when(crystals+ore+studs>100)[CheckResources]

# GOOD: Use timer for periodic checks
timer ResourceTimer=5,5,5,CheckResources

# BAD: Deep nested event chains
Chain1::Chain2::;
Chain2::Chain3::;
Chain3::Chain4::;

# GOOD: Flat state machine
ProcessStep::
if(Step==1)[DoStep1];
else if(Step==2)[DoStep2];

# BAD: Many similar triggers
when(crystals==10)[Do10];
when(crystals==20)[Do20];
when(crystals==30)[Do30];

# GOOD: Single smart trigger
when(crystals%10==0)[CheckCrystalMilestone]
```

## See Also
- [Common Patterns](common-patterns.md) - General scripting patterns
- [State Machine Patterns](state-machine-patterns.md) - Advanced state machines
- [Debugging Guide](../debugging.md) - Performance profiling
- [Best Practices](../best-practices.md) - General optimization tips