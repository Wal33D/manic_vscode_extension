# Event Chains

Event chains are named sequences of events that function like subroutines or functions. They allow you to group related events together and reuse them throughout your script.

## Event Chain Syntax

### Declaration
```
ChainName::
event1:parameters;
event2:parameters;
event3:parameters;
```

- Name followed by double colon `::`
- Events listed sequentially
- Each event ends with semicolon
- Chain ends when next chain starts or script ends

### Calling Event Chains
```
# From trigger
when(enter:5,5)[MyChain];

# From another chain
Chain1::
DoSomething;
Chain2;        # Call another chain
MoreEvents;

# As event parameter
if(init)[StartupChain];
```

## Special Event Chains

### init
Executed once at map start.
```
init::
msg:WelcomeMessage;
crystals:10;
objective:FirstObjective;
```

**Note**: Don't use with triggers - it runs automatically!

### tick
Executed every frame.
```
tick::
# Use sparingly - runs 350+ times per second!
UpdateCounter;
```

**Warning**: Can severely impact performance!

## Basic Event Chains

### Simple Sequence
```
GiveReward::
crystals:50;
ore:25;
msg:RewardMessage;
```

### With Variables
```
int Score=0

AddPoints::
Score+=10;
msg:Score;
```

### Calling Other Chains
```
Phase1::
msg:StartingPhase1;
SetupPhase1;
CheckObjectives;

SetupPhase1::
# Setup code here

CheckObjectives::
# Checking code here
```

## Conditional Logic

### Branching
```
CheckResources::
((crystals >= 50))[HaveEnoughCrystals][NeedMoreCrystals];

HaveEnoughCrystals::
msg:CrystalsOK;
CheckOre;

NeedMoreCrystals::
msg:CollectMoreCrystals;
highlightarrow:10,10,CrystalArrow;
```

### Multiple Conditions
```
EvaluateStatus::
((crystals >= 100))[Victory];
((time > 600))[TimeUp];
((miners == 0))[Defeat];
ContinueGame;
```

### State Machines
```
int Phase=1

UpdatePhase::
((Phase == 1))[Phase1Logic];
((Phase == 2))[Phase2Logic];
((Phase == 3))[Phase3Logic];

Phase1Logic::
# Phase 1 code
((crystals >= 50))[Phase:2; Phase2Logic];
```

## Flow Control

### Sequential Execution
```
ComplexOperation::
Step1;
Step2;
Step3;
msg:OperationComplete;
```

### Early Exit
```
ValidateAndProcess::
((crystals < 10))[msg:NotEnoughCrystals];
((miners == 0))[msg:NoMiners];
# If we get here, validation passed
DoProcess;
```

### Loops (via triggers)
```
bool LoopActive=true
int LoopCounter=0

# Start loop
StartLoop::
LoopActive:true;
LoopCounter:0;

# Loop trigger
when(LoopActive == true)[LoopBody];

LoopBody::
LoopCounter+=1;
((LoopCounter >= 10))[StopLoop];
wait:1.0;

StopLoop::
LoopActive:false;
```

## Event Chain Patterns

### Initialization Pattern
```
script{
    if(init)[Initialize];
    
    Initialize::
    SetupVariables;
    CreateTimers;
    ShowBriefing;
    
    SetupVariables::
    # Variable initialization
    
    CreateTimers::
    # Timer setup
    
    ShowBriefing::
    # Initial messages
}
```

### Action-Response Pattern
```
# Player action
when(built:BuildingToolStore_C)[OnToolStoreBuilt];

OnToolStoreBuilt::
PlaySound;
GiveReward;
UpdateObjective;

PlaySound::
sound:building_complete;

GiveReward::
crystals:20;

UpdateObjective::
objective:BuildPowerStation;
```

### Error Handling Pattern
```
TrySpawnMonster::
CheckSpawnLocation;
((SpawnValid == true))[DoSpawn][SpawnFailed];

CheckSpawnLocation::
# Validation logic
SpawnValid:true;

DoSpawn::
emerge:10,10,A,CreatureRockMonster_C,2;
lastcreature:SpawnedMonster;

SpawnFailed::
msg:CannotSpawnHere;
```

## Math and Calculations

### Complex Calculations
```
float Rate=0.0
int Total=0

CalculateProductionRate::
# Must do one operation per line
Rate:crystals;
Rate/=time;
Total:crystals;
Total+=ore;
```

### Percentage Calculation
```
int Percent=0

CalculateCompletionPercent::
Percent:crystals;
Percent*=100;
Percent/=TargetCrystals;
```

## Wait Events

### Timed Sequences
```
Cutscene::
pan:20,20;
wait:2.0;
msg:LookAtThis;
wait:3.0;
shake:2.0,1.0;
wait:1.0;
pan:10,10;
```

**Warning**: Script continues during wait!

### Preventing Re-entry
```
bool CutscenePlaying=false

PlayCutscene::
((CutscenePlaying == true))[msg:AlreadyPlaying];
CutscenePlaying:true;
# Cutscene events...
wait:5.0;
CutscenePlaying:false;
```

## Special Modifiers

### Random Selection (?)
```
RandomMessage::
?msg:Option1;
?msg:Option2;
?msg:Option3;
# Only one executes randomly
```

### Emerge Failure (~)
```
TryEmerge::
emerge:10,10,A,CreatureRockMonster_C,2;
~msg:EmergeFailed;  # Only runs if emerge fails
```

## Best Practices

### Naming Conventions
```
# Use descriptive names
GoodNames::
CheckVictoryConditions
SpawnFirstWave
UpdateResourceDisplay

# Avoid generic names
BadNames::
DoStuff
Chain1
Event
```

### Single Responsibility
```
# Good - each chain has one purpose
AddCrystals::
crystals:10;

ShowMessage::
msg:CrystalsAdded;

# Bad - doing too much
DoEverything::
crystals:10;
msg:Added;
ore:5;
CheckWin;
SpawnMonster;
```

### State Management
```
# Track state to prevent issues
bool RewardGiven=false

GiveOneTimeReward::
((RewardGiven == true))[];
RewardGiven:true;
crystals:100;
msg:BonusReward;
```

## Common Mistakes

### Infinite Recursion
```
# WRONG - infinite loop!
BadChain::
BadChain;  # Calls itself forever

# CORRECT - use conditions
GoodChain::
((LoopCount < 10))[LoopCount+=1; GoodChain];
```

### Missing Semicolons
```
# WRONG
Chain::
event1:param
event2:param  # Missing semicolon!

# CORRECT
Chain::
event1:param;
event2:param;
```

### Wait Misunderstanding
```
# Script continues during wait!
Problematic::
StartProcess:true;
wait:5.0;
StartProcess:false;  # Might run before wait ends!
```

## Advanced Techniques

### Function-like Behavior
```
# Input/Output via variables
int Input=0
int Output=0

MultiplyByTwo::
Output:Input;
Output*=2;

# Usage
Calculate::
Input:5;
MultiplyByTwo;
msg:Output;  # Shows "10"
```

### Event Queuing
```
# Queue multiple actions
int QueuedActions=0

QueueAction::
QueuedActions+=1;

ProcessQueue::
((QueuedActions > 0))[ProcessOne];

ProcessOne::
QueuedActions-=1;
# Process action
ProcessQueue;  # Check for more
```

### Dynamic Chains
```
# Pseudo-dynamic calling
int Mode=1

ExecuteMode::
((Mode == 1))[Mode1];
((Mode == 2))[Mode2];
((Mode == 3))[Mode3];

Mode1::
# Mode 1 logic

Mode2::
# Mode 2 logic
```

## Debugging Event Chains

### Trace Execution
```
bool Debug=true

MyChain::
((Debug == true))[msg:EnteringMyChain];
# Chain logic
((Debug == true))[msg:ExitingMyChain];
```

### State Inspection
```
DebugDump::
msg:"=== State Dump ===";
msg:"Crystals: ";
msg:crystals;
msg:"Phase: ";
msg:Phase;
msg:"================";
```

## Integration Examples

### With Triggers
```
# Triggers call chains
when(enter:10,10:miners)[MinerEnteredZone];
when(crystals >= 100)[CrystalGoalMet];
if(time > 300)[TimeWarning];

MinerEnteredZone::
# Handle entry

CrystalGoalMet::
# Handle goal

TimeWarning::
# Handle warning
```

### With Visual Blocks
```
# Blocks can call script chains
BlockTriggered::
# Called from visual block system
ExecuteComplexLogic;
```

## Performance Considerations

- Avoid deep recursion
- Minimize chains called from `tick`
- Use state flags to prevent repeated execution
- Keep chains focused and small
- Batch related operations together

## See Also
- [Events](events.md) - Available events for chains
- [Triggers](triggers.md) - Calling chains from triggers
- [Conditions](conditions.md) - Branching in chains
- [Variables](variables.md) - Data for chains