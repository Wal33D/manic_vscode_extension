# Script Debugging Guide

This comprehensive guide helps you identify, diagnose, and fix scripting issues in Manic Miners maps. Based on analysis of hundreds of maps and common pitfalls, this guide provides practical solutions to real-world debugging challenges.

## Common Issues and Solutions

### Script Not Executing

#### Symptoms
- Events don't fire
- Variables aren't set
- Nothing happens when conditions are met

#### Causes and Solutions

**1. Variable Declaration Order**
```
# WRONG - Using variable before declaration
Init::
MyMessage:msg;

string MyMessage="Hello"

# CORRECT - Declare first
string MyMessage="Hello"

Init::
msg:MyMessage;
```

**2. Event Name Mismatches**
```
# WRONG - Case mismatch
when(crystals>10)[startgame];

StartGame::
msg:GameStarted;

# CORRECT - Exact match
when(crystals>10)[StartGame];

StartGame::
msg:GameStarted;
```

**3. Missing Event Syntax**
```
# WRONG - Missing double colon
EventName
msg:Hello;

# CORRECT - Proper event declaration
EventName::
msg:Hello;
```

**4. Missing Semicolons**
```
# WRONG - No semicolon
msg:Hello
wait:2

# CORRECT - End each command
msg:Hello;
wait:2;
```

### Infinite Loops

#### Problem
Event calls itself directly or indirectly, causing the game to freeze.

```
# PROBLEM - Direct infinite loop
BadEvent::
msg:Looping;
BadEvent::;  # Calls itself!

# PROBLEM - Indirect infinite loop
EventA::
EventB::;

EventB::
EventA::;  # Circular reference!
```

#### Solution
Use flags to prevent re-execution:

```
script{
    bool EventRan=false
    
    GoodEvent::
    if(EventRan==false)[RunOnce];
    
    RunOnce::
    EventRan:true;
    msg:OnlyOnce;
}
```

### Timing Issues

#### Problem
Events fire too quickly, causing messages to be missed or actions to overlap.

```
# PROBLEM - Messages display too fast
QuickEvent::
msg:Message1;
msg:Message2;  # Player only sees this
msg:Message3;  # Player only sees this
```

#### Solution
Add wait commands between actions:

```
TimedEvent::
msg:Message1;
wait:3;
msg:Message2;
wait:3;
msg:Message3;
```

### Condition Never Met

#### Common Mistakes

**1. Wrong Comparison Operators**
```
# WRONG - Assignment instead of comparison
when(MyFlag=true)[DoSomething];

# CORRECT - Use == for comparison
when(MyFlag==true)[DoSomething];
```

**2. Impossible Conditions**
```
# WRONG - Can never be true
when(crystals>50 and crystals<25)[Never];

# CORRECT - Logical condition
when(crystals>25 and crystals<50)[InRange];
```

**3. Type Mismatches**
```
# WRONG - Comparing int to string
int Count=5
when(Count=="5")[Never];

# CORRECT - Compare same types
when(Count==5)[Works];
```

### Variable Issues

#### Problem
Variables not updating or holding unexpected values.

```
# PROBLEM - Variable scope
EventA::
int LocalVar=10;  # Only exists in this event

EventB::
msg:LocalVar;  # Error - undefined
```

#### Solution
Declare variables at script level:

```
script{
    int GlobalVar=10
    
    EventA::
    GlobalVar:20;  # Updates global
    
    EventB::
    msg:GlobalVar;  # Works - shows 20
}
```

## Testing Strategies

### 1. Add Debug Messages

Confirm events are firing by adding temporary messages:

```
ComplexEvent::
msg:DEBUG_EventStarted;
wait:1;
if(crystals>10)[msg:DEBUG_CrystalsOK];
wait:1;
# ... rest of event
```

### 2. Use Distinct Arrow Colors

Track code execution paths visually:

```
arrow DebugRed=red
arrow DebugGreen=green
arrow DebugBlue=blue

PathA::
highlightarrow:5,5,DebugRed;  # Shows red path taken

PathB::
highlightarrow:5,5,DebugGreen;  # Shows green path taken
```

### 3. Start Simple

Test core functionality before adding complexity:

```
# Step 1: Test basic trigger
when(crystals>5)[msg:Works];

# Step 2: Add condition
when(crystals>5 and ore>5)[msg:BothWork];

# Step 3: Add full logic
when(crystals>5 and ore>5)[ComplexEvent];
```

### 4. Check Edge Cases

Test boundary conditions and unexpected player actions:

```
# What if player has exactly the required amount?
when(crystals==10)[ExactAmount];
when(crystals>10)[MoreThan];
when(crystals<10)[LessThan];

# What if player does things out of order?
when(buildings.BuildingToolStore_C>0 and TutorialStarted==false)[SkippedTutorial];
```

### 5. Monitor Performance

Watch for lag with many triggers:

```
# BAD - Too many continuous checks
when(crystals>0)[Check1];
when(crystals>1)[Check2];
when(crystals>2)[Check3];
# ... 50 more checks

# GOOD - Consolidated checks
when(crystals>0)[CheckCrystals];

CheckCrystals::
if(crystals>50)[HighAmount];
else if(crystals>25)[MediumAmount];
else[LowAmount];
```

## Debugging Checklist

Before testing your script, verify:

- [ ] All variables declared before use
- [ ] Event names match exactly (case-sensitive)
- [ ] All events end with ::
- [ ] All commands end with ;
- [ ] No circular event calls without flags
- [ ] Wait commands between messages
- [ ] Conditions use correct operators (== not =)
- [ ] Variable types match in comparisons
- [ ] Edge cases handled

## Advanced Debugging

### Using Timer Events

Create a debug monitor that runs periodically:

```
timer DebugTimer=5,5,5,ShowDebugInfo

Init::
starttimer:DebugTimer;

ShowDebugInfo::
msg:DEBUG_Crystals_+crystals;
msg:DEBUG_Buildings_+buildings;
msg:DEBUG_Time_+time;
```

### State Machine Debugging

Track complex state transitions:

```
string GameState="Initializing"

Init::
GameState:"Starting";
msg:State_+GameState;

when(buildings.BuildingToolStore_C>0)[EnterBuildPhase];

EnterBuildPhase::
GameState:"Building";
msg:State_+GameState;
```

## Common Error Messages

### "Event not found"
- Check event name spelling and case
- Ensure event is declared with ::

### "Variable undefined"
- Variable must be declared before use
- Check variable name spelling

### "Type mismatch"
- Ensure comparing same types
- Use quotes for strings, not for numbers

### "Syntax error"
- Check for missing semicolons
- Verify bracket matching in conditions
- Look for spaces in trigger syntax

## Real-World Debugging Examples

### Example 1: Tutorial Script Not Progressing

**Problem**: Tutorial steps don't advance even when conditions are met.

```
# Original broken script
script{
    when(buildings.BuildingToolStore_C>0)[Step2]
    
    Step2::
    msg:BuildPowerStation;
    when(buildings.BuildingPowerStation_C>0)[Step3]  # WRONG!
}
```

**Issue**: `when()` triggers can't be inside event chains.

**Solution**:
```
script{
    int TutorialStep=1
    
    when(buildings.BuildingToolStore_C>0 and TutorialStep==1)[Step2]
    when(buildings.BuildingPowerStation_C>0 and TutorialStep==2)[Step3]
    
    Step2::
    TutorialStep:2;
    msg:BuildPowerStation;
    
    Step3::
    TutorialStep:3;
    msg:BuildDocks;
}
```

### Example 2: Resource Reward Exploit

**Problem**: Players can repeatedly trigger resource rewards.

```
# Exploitable script
when(drill:20,20)[GiveReward]

GiveReward::
crystals:50;
msg:FoundCache;
```

**Solution**: Use flag to prevent re-triggering.
```
script{
    bool Cache1Found=false
    
    when(drill:20,20 and Cache1Found==false)[GiveReward]
    
    GiveReward::
    Cache1Found:true;
    crystals:50;
    msg:FoundCache;
}
```

### Example 3: Race Condition in Initialization

**Problem**: Scripts fail randomly due to timing.

```
# Timing-dependent script
when(init)[SpawnCreatures]
when(init)[CheckCreatures]  # May run before spawn!

CheckCreatures::
if(creatures>0)[msg:CreaturesExist];
else[msg:NoCreatures];  # Sometimes shows this!
```

**Solution**: Use event chains for sequential execution.
```
when(init)[Initialize]

Initialize::
SpawnCreatures::;
wait:1;
CheckCreatures::;

SpawnCreatures::
emerge:10,10,CreatureRockMonster_C;

CheckCreatures::
if(creatures>0)[msg:CreaturesExist];
```

## Performance Debugging

### Identifying Performance Issues

**Symptoms**:
- Game lag during play
- Delayed script responses
- Choppy animations

**Common Causes**:
1. Too many active `when()` triggers
2. Complex conditions checked every tick
3. Excessive timer usage
4. Large event chains without breaks

### Performance Profiling

```
script{
    # Performance monitoring
    int TriggerCount=0
    timer PerformanceTimer=10,10,10,ShowPerformance
    
    # Count trigger executions
    when(crystals>=0)[CountTrigger1]  # Always true - BAD!
    when(time>0)[CountTrigger2]       # Always true - BAD!
    
    CountTrigger1::
    TriggerCount:TriggerCount+1;
    
    CountTrigger2::
    TriggerCount:TriggerCount+1;
    
    ShowPerformance::
    msg:TriggersPerSecond_+TriggerCount;
    TriggerCount:0;  # Reset counter
}
```

### Optimization Techniques

**1. Consolidate Triggers**
```
# BAD: Multiple similar triggers
when(crystals>=10)[Check1]
when(crystals>=20)[Check2]
when(crystals>=30)[Check3]

# GOOD: Single trigger with branching
when(crystals>=10)[CheckCrystals]

CheckCrystals::
if(crystals>=30)[Level3];
else if(crystals>=20)[Level2];
else[Level1];
```

**2. Use Flags to Disable Completed Checks**
```
script{
    bool Phase1Complete=false
    bool Phase2Complete=false
    
    # These stop checking once complete
    when(crystals>=10 and Phase1Complete==false)[CompletePhase1]
    when(ore>=20 and Phase1Complete==true and Phase2Complete==false)[CompletePhase2]
}
```

**3. Batch Operations**
```
# BAD: Many individual operations
place:10,10,1;
place:10,11,1;
place:10,12,1;
place:10,13,1;
place:10,14,1;

# GOOD: Use loops or patterns (if supported by game version)
# Or at least group visually for maintenance
# Bridge tiles
place:10,10,1;
place:10,11,1;
place:10,12,1;
place:10,13,1;
place:10,14,1;
```

## Advanced Debugging Tools

### Debug Mode System

Create a comprehensive debug mode:

```
script{
    # Debug configuration
    bool DebugMode=true
    bool ShowCoordinates=true
    bool ShowVariables=true
    bool ShowPerformance=true
    
    # Debug display timer
    timer DebugDisplay=2,2,2,ShowDebugInfo
    
    Init::
    if(DebugMode==true)[EnableDebug];
    
    EnableDebug::
    msg:DebugModeActive;
    starttimer:DebugDisplay;
    
    ShowDebugInfo::
    if(ShowCoordinates==true)[ShowCoords];
    if(ShowVariables==true)[ShowVars];
    if(ShowPerformance==true)[ShowPerf];
    
    ShowCoords::
    # Show important locations
    highlightarrow:10,10,arrow=green;  # Base
    highlightarrow:20,20,arrow=red;    # Objective
    
    ShowVars::
    msg:Crystals_+crystals;
    msg:Buildings_+buildings;
    msg:Time_+time;
    
    ShowPerf::
    msg:ActiveTriggers_+TriggerCount;
}
```

### Error Recovery System

Build robust error handling:

```
script{
    # Error tracking
    int ErrorCount=0
    bool CriticalError=false
    
    # Wrap risky operations
    AttemptOperation::
    if(CriticalError==true)[msg:SystemInErrorState];
    else[TryOperation];
    
    TryOperation::
    # Risky operation here
    if(OperationFailed==true)[HandleError];
    else[OperationSuccess];
    
    HandleError::
    ErrorCount:ErrorCount+1;
    msg:ErrorOccurred;
    
    if(ErrorCount>3)[CriticalFailure];
    else[RetryOperation];
    
    CriticalFailure::
    CriticalError:true;
    msg:CriticalErrorShutdown;
    
    RetryOperation::
    wait:2;
    TryOperation::;
}
```

### State Validation System

Ensure game state remains consistent:

```
script{
    # State validation
    bool StateValid=true
    string ExpectedState="Init"
    string ActualState="Init"
    
    # Validate state transitions
    ValidateState::
    if(ExpectedState!=ActualState)[StateError];
    
    StateError::
    StateValid:false;
    msg:StateError_Expected_+ExpectedState+_Got_+ActualState;
    
    # Example state transition with validation
    TransitionToBuild::
    ExpectedState:"Build";
    ActualState:"Build";
    ValidateState::;
    
    if(StateValid==true)[msg:TransitionSuccessful];
}
```

## Common Script Patterns That Cause Issues

### 1. The Forgotten Flag
```
# PROBLEM: Trigger keeps firing
when(enter:10,10)[ShowMessage]

ShowMessage::
msg:YouEnteredTheArea;
crystals:10;  # Player gets infinite crystals!

# SOLUTION: Use entry flag
bool EnteredArea=false
when(enter:10,10 and EnteredArea==false)[ShowMessage]

ShowMessage::
EnteredArea:true;
msg:YouEnteredTheArea;
crystals:10;
```

### 2. The Impossible Objective
```
# PROBLEM: Building name wrong
objectives{
    building: ToolStore 1  # WRONG CLASS NAME!
}

# SOLUTION: Use exact class name
objectives{
    building: BuildingToolStore_C 1
}
```

### 3. The Silent Failure
```
# PROBLEM: No feedback on failure
when(crystals<10 and buildings.BuildingPowerStation_C>0)[lose:]

# SOLUTION: Inform player why they lost
when(crystals<10 and buildings.BuildingPowerStation_C>0)[OutOfResources]

OutOfResources::
msg:InsufficientCrystalsToMaintainPower;
wait:3;
lose:;
```

## Testing Methodology

### 1. Unit Testing Scripts
Test each component separately:

```
script{
    # Test flags
    bool TestMode=true
    
    # Test individual systems
    if(TestMode==true and test=="movement")[TestMovement];
    if(TestMode==true and test=="combat")[TestCombat];
    if(TestMode==true and test=="resources")[TestResources];
    
    TestMovement::
    msg:TestingMovement;
    # Movement test code
    
    TestCombat::
    msg:TestingCombat;
    # Combat test code
    
    TestResources::
    msg:TestingResources;
    # Resource test code
}
```

### 2. Integration Testing
Test how systems work together:

```
script{
    # Integration test sequence
    IntegrationTest::
    msg:StartingIntegrationTest;
    wait:2;
    
    # Test resource collection
    crystals:20;
    wait:1;
    
    # Test building with resources
    if(crystals>=20)[msg:ResourcesAvailable];
    wait:1;
    
    # Test objective completion
    if(buildings.BuildingToolStore_C>0)[msg:BuildingComplete];
}
```

### 3. Stress Testing
Push scripts to their limits:

```
script{
    # Stress test creature spawning
    StressTest::
    msg:BeginningStressTest;
    
    # Spawn many creatures
    SpawnWave::;
    wait:1;
    SpawnWave::;
    wait:1;
    SpawnWave::;
    
    SpawnWave::
    emerge:10,10,CreatureRockMonster_C;
    emerge:11,11,CreatureRockMonster_C;
    emerge:12,12,CreatureRockMonster_C;
    emerge:13,13,CreatureRockMonster_C;
    emerge:14,14,CreatureRockMonster_C;
}
```

## Debug Output Reference

### Message Debugging Levels
```
script{
    # Severity levels
    int LOG_ERROR=1
    int LOG_WARN=2
    int LOG_INFO=3
    int LOG_DEBUG=4
    
    int DebugLevel=4  # Show all messages
    
    LogMessage::
    if(severity<=DebugLevel)[ShowMessage];
    
    # Usage examples
    LogError::
    severity:1;
    msg:ERROR_CriticalFailure;
    
    LogInfo::
    severity:3;
    msg:INFO_SystemNormal;
}
```

## Quick Debug Checklist

When your script isn't working, check these in order:

1. **Syntax Basics**
   - [ ] All event chains end with `::`
   - [ ] All statements end with `;`
   - [ ] No spaces in conditions: `when(x>5)` not `when(x > 5)`
   - [ ] Event names match exactly (case-sensitive)

2. **Logic Flow**
   - [ ] Variables declared before use
   - [ ] Conditions are possible to achieve
   - [ ] No circular event references
   - [ ] Flags prevent re-execution

3. **Game Integration**
   - [ ] Building class names are correct
   - [ ] Coordinates are within map bounds
   - [ ] Objectives match script variables
   - [ ] Messages have corresponding text

4. **Performance**
   - [ ] Minimal always-true triggers
   - [ ] Event chains aren't too long
   - [ ] Timers used sparingly
   - [ ] Completed checks are disabled

## See Also
- [Common Patterns](patterns/common-patterns.md) - Battle-tested script patterns
- [Event Chains](event-chains.md) - Understanding event flow  
- [Variables](variables.md) - Variable types and operations
- [Triggers](triggers.md) - Trigger conditions and syntax
- [Events](events.md) - Complete event reference
- [Performance Guide](../../technical-reference/performance.md) - Optimization techniques