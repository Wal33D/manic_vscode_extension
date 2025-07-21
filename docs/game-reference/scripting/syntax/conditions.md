# Conditions

Conditions are boolean expressions that control trigger execution and branching logic. They determine whether events execute based on game state.

## Condition Syntax

### In Triggers
```
when(trigger)((condition))[true_event][false_event];
```

### In Event Chains
```
((condition))[true_event][false_event];
```

**Important**: Double parentheses `(( ))` are required!

## Comparison Operators

```
==  Equal to
!=  Not equal to
>   Greater than
<   Less than
>=  Greater than or equal to
<=  Less than or equal to
```

## Boolean Operators

### and
Both conditions must be true.
```
((crystals > 50 and ore > 25))
((Phase1 == true and TimeRemaining > 0))
```

### or
Either condition must be true.
```
((air < 20 or miners == 0))
((HasToolStore == true or crystals > 100))
```

### not
Inverts the condition.
```
((not GameOver))
((not (crystals > 50)))
```

## Variable Comparisons

### Numeric Variables
```
int Score=0
float TimeLimit=300.0

((Score >= 100))
((TimeLimit > 0.0))
((crystals == ore))
```

### Boolean Variables
```
bool HasKey=false

((HasKey == true))
((HasKey == false))
((HasKey))         # Shorthand for == true
((not HasKey))     # Shorthand for == false
```

### String Variables
```
string Status="ready"

((Status == "ready"))
((Status != "complete"))
```

**Note**: String comparisons are exact matches only.

## Resource Conditions

### crystals
```
((crystals > 50))
((crystals == 100))
((crystals <= ore))
```

### ore
```
((ore >= 25))
((ore < crystals))
```

### studs
```
((studs > 100))
((studs == 0))
```

### air
```
((air < 50))
((air <= 20))  # Critical!
```

## Game State Conditions

### time
Game time in seconds.
```
((time > 60))
((time >= 300))  # 5 minutes
((time < TimeLimit))
```

### rowcount/colcount
Map dimensions.
```
((rowcount > 50))
((colcount == 100))
```

### Collections
```
((miners > 5))
((vehicles == 0))
((buildings.BuildingToolStore_C > 0))
((creatures.CreatureRockMonster_C < 3))
```

## Object Properties

### Health Points
```
miner Chief=0
vehicle Truck=1

((Chief.hp < 50))
((Truck.hp == 100))
```

### Position
```
((Chief.row == 10))
((Chief.col == 15))
((Truck.row > 20))
```

## Complex Conditions

### Multiple AND
```
((crystals > 50 and ore > 25 and miners > 3))
((HasToolStore == true and HasPowerStation == true and crystals > 0))
```

### Multiple OR
```
((time > 600 or crystals > 200 or AllObjectivesComplete == true))
((air < 20 or miners == 0 or GameOver == true))
```

### Mixed Logic
```
((crystals > 50 and (ore > 25 or studs > 100)))
(((miners > 5 or vehicles > 2) and crystals > 0))
```

### Nested Conditions
```
((Phase1 == true and (crystals > 50 or time > 300)))
((not (miners == 0 and vehicles == 0)))
```

### Real-World Compound Conditions

#### Building Requirements Met
```
# Check if player can build advanced structures
((buildings.BuildingToolStore_C > 0 and buildings.BuildingPowerStation_C > 0 and crystals >= 20))
```

#### Resource Threshold Combinations
```
# Different reward tiers based on multiple resources
((crystals >= 100 and ore >= 50))  # Gold tier
((crystals >= 50 and ore >= 25))   # Silver tier
((crystals >= 25 or ore >= 15))    # Bronze tier
```

#### Time-Based Progression
```
# Events that depend on both time and achievements
((time > 300 and buildings > 5 and ObjectivesShown == true))
((time < 600 and miners < 3))  # Early game with few miners
```

#### Emergency Conditions
```
# Multiple failure states
((air < 50 and buildings.BuildingSupportStation_C == 0))  # No air support
((miners == 0 or (vehicles == 0 and buildings.BuildingToolStore_C == 0)))
```

#### Discovery-Based Progression
```
# Combine exploration with resource gathering
((discovered > 80 and crystals >= 50))  # Most map explored + resources
((foundbuilding[25,30] and ore >= 20))  # Found specific building + ore
```

## Condition Patterns

### State Checks
```
bool Phase1Complete=false
bool Phase2Complete=false

# Sequential phases
((Phase1Complete == true and Phase2Complete == false))
```

### Range Checks
```
# Value within range
((time > 60 and time < 120))
((crystals >= 50 and crystals <= 100))
```

### Threshold Monitoring
```
# Multiple thresholds
((crystals >= 25 and crystals < 50))  # Bronze
((crystals >= 50 and crystals < 100)) # Silver
((crystals >= 100))                    # Gold
```

### Combination Requirements
```
# All resources adequate
((crystals >= 20 and ore >= 10 and studs >= 50))

# Any critical resource low
((crystals < 10 or ore < 5 or air < 30))
```

## Conditional Execution

### In Triggers
```
# Execute only if condition met
when(enter:10,10)((HasKey == true))[OpenDoor];

# Different actions based on condition
when(time>60)((crystals >= 50))[WinGame][ShowHint];
```

### In Event Chains
```
CheckStatus::
((crystals >= 100))[Victory][CheckOtherWin];

CheckOtherWin::
((ore >= 50))[Victory][ContinueGame];
```

### Branching Logic
```
ProcessResource::
((crystals < 50))[NeedMoreCrystals];
((ore < 25))[NeedMoreOre];
((studs < 100))[NeedMoreStuds];
AllResourcesGood;
```

## Common Mistakes

### Missing Double Parentheses
```
# WRONG
when(enter:5,5)(HasKey == true)[Open];

# CORRECT
when(enter:5,5)((HasKey == true))[Open];
```

### Space in Operators
```
# WRONG
when(crystals > = 50)[Event];

# CORRECT  
when(crystals >= 50)[Event];
```

### Assignment vs Comparison
```
# WRONG - This is assignment!
((Score = 100))

# CORRECT - This is comparison
((Score == 100))
```

### String Comparison Quotes
```
# WRONG
((Status == ready))

# CORRECT
((Status == "ready"))
```

## Performance Tips

### Order Matters
Put most likely false conditions first with AND:
```
# Better - fails fast if no key
((HasKey == true and crystals > 50))

# Worse - always checks crystals
((crystals > 50 and HasKey == true))
```

### Simplify When Possible
```
# Complex
((not (crystals < 50)))

# Simple
((crystals >= 50))
```

### Cache Complex Results
```
bool ResourcesReady=false

# Update periodically
UpdateStatus::
((crystals >= 50 and ore >= 25 and studs >= 100))[SetReady][SetNotReady];

SetReady::
ResourcesReady:true;

SetNotReady::
ResourcesReady:false;

# Use cached result
when(enter:10,10)((ResourcesReady == true))[AllowEntry];
```

## Debugging Conditions

### Test Components
```
# Break complex conditions into parts
DebugCheck::
((crystals > 50))[msg:CrystalsOK];
((ore > 25))[msg:OreOK];
((miners > 3))[msg:MinersOK];
```

### Show Values
```
ShowStatus::
msg:crystals;  # Shows crystal count
msg:time;      # Shows current time
```

### Trace Execution
```
bool DebugMode=true

CheckCondition::
((DebugMode == true))[msg:CheckingCondition];
((crystals > 50))[ConditionTrue][ConditionFalse];

ConditionTrue::
((DebugMode == true))[msg:ConditionWasTrue];
# ... rest of logic
```

## Limitations

- No assignment in conditions
- No function calls in conditions
- No complex math in conditions
- String comparisons are exact only
- Cannot compare different object types

## Examples

### Progressive Difficulty
```
int Difficulty=1

# Increase difficulty over time
when(time>120 and Difficulty==1)((crystals>50))[IncreaseDifficulty];
when(time>240 and Difficulty==2)((crystals>100))[IncreaseDifficulty];

IncreaseDifficulty::
Difficulty+=1;
```

### Multi-Objective Checking
```
bool Obj1Complete=false
bool Obj2Complete=false  
bool Obj3Complete=false

# Check individual objectives
when(crystals>=50 and Obj1Complete==false)[CompleteObj1];
when(buildings.BuildingToolStore_C>0 and Obj2Complete==false)[CompleteObj2];
when(ore>=25 and Obj3Complete==false)[CompleteObj3];

# Check for victory
when(Obj1Complete==true and Obj2Complete==true and Obj3Complete==true)[Victory];
```

### Emergency Response
```
# Multiple emergency conditions
when(air<20 or miners==0 or buildings.BuildingToolStore_C==0)[EmergencyAlert];

EmergencyAlert::
((air < 20))[msg:OxygenCritical];
((miners == 0))[msg:NoMinersLeft];
((buildings.BuildingToolStore_C == 0))[msg:NoToolStore];
```

## See Also
- [Triggers](triggers.md) - Using conditions in triggers
- [Variables](variables.md) - Values to test in conditions
- [Events](events.md) - Actions based on conditions
- [Event Chains](event-chains.md) - Conditional branching