# Debugging Scripts

This guide covers common issues, debugging techniques, and testing strategies for Manic Miners scripts.

## Common Issues and Solutions

### Script Not Executing

Scripts may fail to execute for several reasons. Here's how to diagnose and fix:

#### Variable Declaration Order
```
# WRONG - Using variable before declaration
Init::
msg:WelcomeText;  # Error: WelcomeText not defined yet
string WelcomeText="Welcome!"

# CORRECT - Declare variables first
string WelcomeText="Welcome!"

Init::
msg:WelcomeText;
```

#### Event Name Mismatches
```
# WRONG - Case sensitive and typos matter
when(init)[initialize];  # Won't find 'Initialize'

Initialize::  # Different case!
msg:Starting;

# CORRECT - Exact match required
when(init)[Initialize];

Initialize::
msg:Starting;
```

#### Missing Syntax Elements
```
# WRONG - Various syntax errors
Event1:      # Missing second colon
msg:Hello    # Missing semicolon
wait 2.0     # Missing colon

# CORRECT
Event1::     # Double colon
msg:Hello;   # Semicolon
wait:2.0;    # Colon for parameters
```

### Infinite Loops

Infinite loops can crash or freeze the game. Here's how to prevent them:

#### Direct Recursion
```
# WRONG - Infinite loop!
BadEvent::
msg:Looping;
BadEvent;  # Calls itself forever

# CORRECT - Use state to control
bool EventRan=false

GoodEvent::
if(EventRan==false)[RunOnce];

RunOnce::
EventRan:true;
msg:OnlyOnce;
```

#### Trigger Loops
```
# WRONG - Triggers keep firing
int Counter=0

when(Counter>=0)[Increment];  # Always true!

Increment::
Counter:Counter+1;
msg:Counter;  # Spams messages

# CORRECT - Add exit condition
when(Counter>=0 and Counter<10)[Increment];
```

#### Chain Loops
```
# WRONG - A calls B, B calls A
EventA::
msg:A;
EventB;

EventB::
msg:B;
EventA;  # Infinite loop!

# CORRECT - Add termination logic
int LoopCount=0

EventA::
LoopCount:LoopCount+1;
if(LoopCount<5)[EventB];

EventB::
msg:B;
if(LoopCount<5)[EventA];
```

### Timing Issues

Scripts execute quickly, which can cause timing problems:

#### Messages Too Fast
```
# WRONG - Player only sees last message
QuickEvent::
msg:First;
msg:Second;
msg:Third;  # Only this shows

# CORRECT - Add waits
TimedEvent::
msg:First;
wait:2;
msg:Second;
wait:2;
msg:Third;
```

#### Simultaneous Actions
```
# WRONG - Actions conflict
BadTiming::
pan:10,10;
pan:20,20;  # Overrides first pan immediately

# CORRECT - Space out actions
GoodTiming::
pan:10,10;
wait:3;
pan:20,20;
```

#### Wait Behavior
```
# IMPORTANT: Script continues during wait!
bool ProcessRunning=false

StartProcess::
ProcessRunning:true;
wait:5;
ProcessRunning:false;  # This runs 5 seconds later

# Other events can run during the wait
when(ProcessRunning==true)[ShowStatus];
```

### Condition Logic Errors

Common mistakes with conditional logic:

#### Wrong Operators
```
# WRONG - Assignment instead of comparison
when(crystals=50)[HasFifty];  # This is assignment!

# CORRECT - Use comparison
when(crystals==50)[HasFifty];  # Equality check
when(crystals>=50)[HasFiftyOrMore];
```

#### Compound Condition Mistakes
```
# WRONG - Logic error
when(crystals>50 or crystals<10)[Strange];  # Always true!

# CORRECT - Probably meant AND
when(crystals>10 and crystals<50)[InRange];
```

#### State Check Ordering
```
# WRONG - Check state after action
GiveReward::
crystals:100;
RewardGiven:true;
if(RewardGiven==true)[msg:AlreadyGiven];  # Always true!

# CORRECT - Check before action
GiveReward::
if(RewardGiven==false)[DoReward];

DoReward::
crystals:100;
RewardGiven:true;
msg:RewardGranted;
```

## Testing Strategies

### 1. Add Debug Messages

Confirm events are firing by adding temporary messages:

```
script{
    # Debug mode flag
    bool Debug=true
    
    ComplexEvent::
    if(Debug==true)[msg:"ComplexEvent started"];
    
    # Complex logic here
    DoCalculation;
    
    if(Debug==true)[msg:"Calculation complete"];
    CheckCondition;
    
    if(Debug==true)[msg:"Condition checked"];
}
```

### 2. Use Distinct Arrow Colors

Track code execution paths visually:

```
script{
    arrow RedPath=red
    arrow GreenPath=green
    arrow BluePath=blue
    
    BranchingLogic::
    if(crystals<10)[LowPath];
    if(crystals>=10 and crystals<50)[MedPath];
    if(crystals>=50)[HighPath];
    
    LowPath::
    highlightarrow:10,10,RedPath;  # Shows red arrow
    
    MedPath::
    highlightarrow:10,10,BluePath;  # Shows blue arrow
    
    HighPath::
    highlightarrow:10,10,GreenPath;  # Shows green arrow
}
```

### 3. Start Simple

Build complexity gradually:

```
# Step 1: Test basic trigger
when(init)[msg:ScriptLoaded];

# Step 2: Add simple condition
when(crystals>10)[msg:HasCrystals];

# Step 3: Add state management
bool MessageShown=false
when(crystals>10 and MessageShown==false)[ShowOnce];

ShowOnce::
MessageShown:true;
msg:CrystalGoalMet;

# Step 4: Add full logic...
```

### 4. Check Edge Cases

Test boundary conditions:

```
script{
    # Test empty/zero states
    when(miners==0)[msg:NoMiners];
    when(crystals==0)[msg:NoCrystals];
    
    # Test exact values
    when(crystals==49)[msg:AlmostFifty];
    when(crystals==50)[msg:ExactlyFifty];
    when(crystals==51)[msg:OverFifty];
    
    # Test rapid changes
    TestRapidChange::
    crystals:0;
    crystals:100;  # Does trigger fire?
}
```

### 5. Monitor Performance

Watch for lag with many triggers:

```
script{
    # Performance test
    int TriggerCount=0
    
    # Bad: Too many similar triggers
    when(enter:10,10:miners)[CountTrigger];
    when(enter:10,11:miners)[CountTrigger];
    when(enter:10,12:miners)[CountTrigger];
    # ... 100 more triggers
    
    CountTrigger::
    TriggerCount:TriggerCount+1;
    if(TriggerCount>1000)[msg:PerformanceWarning];
}
```

## Debugging Tools and Techniques

### State Dumping

Create a debug event to show current state:

```
script{
    int Phase=1
    bool ObjectiveComplete=false
    int ResourcesCollected=0
    
    # Call this to see current state
    DebugDump::
    msg:"=== DEBUG STATE ===";
    wait:1;
    msg:"Phase: " + Phase;
    wait:1;
    msg:"Objective Done: " + ObjectiveComplete;
    wait:1;
    msg:"Resources: " + ResourcesCollected;
    wait:1;
    msg:"=================";
    
    # Trigger with key combination or condition
    when(click:0,0)[DebugDump];  # Click top-left corner
}
```

### Execution Tracing

Track event chain execution:

```
script{
    string LastEvent="None"
    
    Event1::
    LastEvent:"Event1";
    msg:"Entering Event1";
    # Event 1 logic
    Event2;
    
    Event2::
    LastEvent:"Event2";
    msg:"Entering Event2 from " + LastEvent;
    # Event 2 logic
    
    # Show last event on demand
    when(click:1,1)[msg:"Last Event: " + LastEvent];
}
```

### Variable Watching

Monitor variable changes:

```
script{
    int WatchedValue=0
    int PreviousValue=0
    
    # Detect changes
    when(WatchedValue!=PreviousValue)[ValueChanged];
    
    ValueChanged::
    msg:"Value changed from " + PreviousValue + " to " + WatchedValue;
    PreviousValue:WatchedValue;
}
```

## Common Debugging Patterns

### Safe Event Execution

Prevent errors with safety checks:

```
SafeEvent::
# Check prerequisites
if(buildings.BuildingToolStore_C==0)[msg:NeedToolStore; return];
if(crystals<10)[msg:NeedCrystals; return];
if(EventActive==true)[msg:AlreadyRunning; return];

# Safe to proceed
EventActive:true;
ExecuteMainLogic;
EventActive:false;
```

### Timeout Protection

Prevent stuck states:

```
script{
    int TimeoutCounter=0
    bool ProcessActive=false
    
    StartProcess::
    ProcessActive:true;
    TimeoutCounter:0;
    
    # Timeout after 60 seconds
    when(ProcessActive==true and time>TimeoutCounter+60)[ProcessTimeout];
    
    ProcessTimeout::
    ProcessActive:false;
    msg:ProcessTimedOut;
}
```

### Error Recovery

Handle failures gracefully:

```
AttemptAction::
TrySpawn;

TrySpawn::
emerge:10,10,A,CreatureRockMonster_C,2;
~HandleSpawnFailure;  # ~ only runs if emerge fails

HandleSpawnFailure::
msg:SpawnFailedTryingAlternative;
emerge:20,20,A,CreatureSmallSpider_C,2;
~msg:BothSpawnsFailed;
```

## Script Validation Checklist

Before finalizing your script, check:

1. **Syntax Validation**
   - [ ] All variables declared before use
   - [ ] All event names match exactly (case-sensitive)
   - [ ] Double colons (::) for event declarations
   - [ ] Semicolons (;) after each command
   - [ ] Proper parentheses and brackets

2. **Logic Validation**
   - [ ] No infinite loops
   - [ ] State flags prevent re-execution
   - [ ] Conditions use correct operators (==, !=, <, >)
   - [ ] Compound conditions have correct logic (and/or)

3. **Performance Validation**
   - [ ] Minimal `when` triggers active
   - [ ] No `tick` events (or absolutely necessary)
   - [ ] Complex conditions broken into stages
   - [ ] Similar triggers consolidated

4. **User Experience**
   - [ ] Messages spaced with appropriate waits
   - [ ] Clear feedback for all actions
   - [ ] Edge cases handled
   - [ ] Error messages helpful

5. **Testing Coverage**
   - [ ] Script loads without errors
   - [ ] All paths through code tested
   - [ ] Resource edge cases (0, max values)
   - [ ] Timing sequences work correctly
   - [ ] Performance acceptable on large maps

## Advanced Debugging Example

Here's a complete debugging harness for complex scripts:

```
script{
    # Debug configuration
    bool DebugMode=true
    bool VerboseLogging=true
    int DebugLevel=3  # 1=errors, 2=warnings, 3=info
    
    # Debug utilities
    LogError::
    if(DebugMode==true and DebugLevel>=1)[msg:"ERROR: " + ErrorMessage];
    sound:error;
    
    LogWarning::
    if(DebugMode==true and DebugLevel>=2)[msg:"WARN: " + WarningMessage];
    
    LogInfo::
    if(DebugMode==true and DebugLevel>=3)[msg:"INFO: " + InfoMessage];
    
    # Example usage in main script
    ComplexOperation::
    if(VerboseLogging==true)[InfoMessage:"Starting ComplexOperation"; LogInfo];
    
    # Validate inputs
    if(crystals<10)[ErrorMessage:"Not enough crystals"; LogError; return];
    
    # Perform operation
    DoComplexStuff;
    
    if(VerboseLogging==true)[InfoMessage:"ComplexOperation complete"; LogInfo];
}
```

## See Also

- [Script Overview](overview.md) - Basic script structure
- [Common Patterns](patterns/common-patterns.md) - Working script examples
- [Events](syntax/events.md) - Event reference
- [Triggers](syntax/triggers.md) - Trigger reference
- [Performance](../../technical-reference/performance.md#script-performance) - Performance optimization