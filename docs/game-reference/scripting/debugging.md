# Debugging Scripts

This guide helps you identify and fix common scripting issues in Manic Miners levels.

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

## See Also
- [Common Patterns](patterns/common-patterns.md) - Tested script patterns
- [Event Chains](event-chains.md) - Understanding event flow
- [Variables](variables.md) - Variable usage and scope