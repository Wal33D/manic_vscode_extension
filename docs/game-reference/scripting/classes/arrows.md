# Arrow Class

Arrows are visual markers used to guide players and highlight important locations. They provide directional indicators and can be shown, hidden, or moved during gameplay. Arrows were primarily designed for tutorials but can be used in any map where you need to draw player attention.

## Important Notes

- **Arrow vs Highlight**: The arrow color does NOT change the arrow appearance - all arrows look identical. The color only affects the highlight patch that appears under the arrow.
- **Display Components**: Arrows have two visual elements:
  1. The bouncing arrow graphic (identical for all arrows)
  2. The blinking highlight patch (uses the arrow's assigned color)
- **Variable Limitations**: Arrow variables cannot be assigned to each other and cannot be used in expressions or conditionals - only with arrow-specific events.

## Declaration

```
arrow name=color
```

### Available Colors
- `black`
- `blue`
- `darkgreen`
- `green` (default)
- `red`
- `yellow`
- `white`

### Examples
```
arrow GuideArrow=green
arrow DangerArrow=red
arrow ObjectiveArrow=yellow
arrow DefaultArrow        # Defaults to green
```

## Arrow Events

### showarrow
Display arrow at specified location (arrow only, no highlight).
```
showarrow:row,col,ArrowVariable

# Example
arrow GuideArrow=green
showarrow:10,10,GuideArrow;
```

### hidearrow
Hide arrow (can be shown again later).
```
hidearrow:ArrowVariable

# Example
hidearrow:GuideArrow;
```

### highlight
Highlight a tile without arrow (highlight only, no arrow).
```
highlight:row,col,ArrowVariable

# Example
highlight:15,15,GuideArrow;
```

### highlightarrow
Show both arrow and tile highlight (both arrow and highlight at once).
```
highlightarrow:row,col,ArrowVariable

# Example
highlightarrow:20,20,ObjectiveArrow;
```

### removearrow
Completely remove arrow (cannot be shown again).
```
removearrow:ArrowVariable

# Example
removearrow:GuideArrow;
```

## Arrow Properties

### Color Selection
```
# Semantic color usage
arrow CrystalArrow=blue       # Resources
arrow WarningArrow=red        # Danger
arrow GoalArrow=green         # Objectives
arrow PathArrow=yellow        # Navigation
```

### Position
- Arrows use row,col coordinates
- Position is tile-based (not pixel)
- Can be moved by hiding and reshowing

### Visibility
- Multiple arrows can be visible simultaneously
- Arrows persist until explicitly hidden/removed
- Hidden arrows retain their properties

## Common Patterns

### Tutorial Guidance
```
arrow TutorialArrow=green
int TutorialStep=0

NextTutorialStep::
TutorialStep+=1;
((TutorialStep == 1))[ShowStep1];
((TutorialStep == 2))[ShowStep2];
((TutorialStep == 3))[ShowStep3];

ShowStep1::
hidearrow:TutorialArrow;
highlightarrow:10,10,TutorialArrow;
msg:BuildHere;

ShowStep2::
hidearrow:TutorialArrow;
highlightarrow:15,15,TutorialArrow;
msg:DrillThis;
```

### Multiple Objectives
```
arrow Crystal1=blue
arrow Crystal2=blue
arrow Crystal3=blue

# Show all crystal locations
ShowCrystalLocations::
showarrow:10,10,Crystal1;
showarrow:20,20,Crystal2;
showarrow:30,30,Crystal3;

# Hide as collected
when(enter:10,10:miners)[hidearrow:Crystal1; crystals:20];
when(enter:20,20:miners)[hidearrow:Crystal2; crystals:20];
when(enter:30,30:miners)[hidearrow:Crystal3; crystals:20];
```

### Dynamic Waypoints
```
arrow PathArrow=yellow
int PathStep=0

ShowNextWaypoint::
PathStep+=1;
hidearrow:PathArrow;
((PathStep == 1))[showarrow:10,10,PathArrow];
((PathStep == 2))[showarrow:15,12,PathArrow];
((PathStep == 3))[showarrow:20,15,PathArrow];
((PathStep == 4))[showarrow:25,20,PathArrow];
```

### Warning System
```
arrow DangerArrow1=red
arrow DangerArrow2=red
bool DangerActive=false

# Show danger zones
ActivateDanger::
DangerActive:true;
highlightarrow:10,10,DangerArrow1;
highlightarrow:20,20,DangerArrow2;
msg:AvoidRedZones;

# Flash warning
FlashDanger::
((DangerActive == false))[];
hidearrow:DangerArrow1;
hidearrow:DangerArrow2;
wait:0.5;
showarrow:10,10,DangerArrow1;
showarrow:20,20,DangerArrow2;
wait:0.5;
FlashDanger;
```

## Advanced Usage

### Arrow Management System
```
# Arrow pool for reuse
arrow Arrow1=green
arrow Arrow2=green
arrow Arrow3=green
bool Arrow1Used=false
bool Arrow2Used=false
bool Arrow3Used=false

GetFreeArrow::
((Arrow1Used == false))[UseArrow1];
((Arrow2Used == false))[UseArrow2];
((Arrow3Used == false))[UseArrow3];
msg:NoArrowsAvailable;

UseArrow1::
Arrow1Used:true;
# Use Arrow1

ReleaseArrow1::
Arrow1Used:false;
hidearrow:Arrow1;
```

### Breadcrumb Trail
```
arrow Trail1=darkgreen
arrow Trail2=darkgreen
arrow Trail3=darkgreen
int TrailIndex=0

# Drop breadcrumb at current miner location
DropBreadcrumb::
((TrailIndex == 0))[ShowTrail1];
((TrailIndex == 1))[ShowTrail2];
((TrailIndex == 2))[ShowTrail3];
TrailIndex+=1;
((TrailIndex > 2))[TrailIndex:0];

ShowTrail1::
lastminer:TrackedMiner;
showarrow:TrackedMiner.row,TrackedMiner.col,Trail1;
```

### Quest Markers
```
arrow QuestArrow=yellow
bool QuestActive=false
int QuestTarget=0

UpdateQuestMarker::
((QuestActive == false))[];
hidearrow:QuestArrow;
((QuestTarget == 1))[highlightarrow:10,10,QuestArrow];
((QuestTarget == 2))[highlightarrow:20,20,QuestArrow];
((QuestTarget == 3))[highlightarrow:30,30,QuestArrow];
```

## Best Practices

### 1. Semantic Naming
```
# Good - descriptive names
arrow BuildLocationArrow=green
arrow DangerZoneArrow=red
arrow CrystalDepositArrow=blue

# Bad - generic names
arrow Arrow1=green
arrow GreenArrow=green
arrow A=green
```

### 2. Color Consistency
```
# Establish color meanings
# Green = Safe/Go
# Red = Danger/Stop
# Yellow = Caution/Important
# Blue = Resources
```

### 3. State Management
```
# Track arrow states
arrow ObjectiveArrow=yellow
bool ObjectiveArrowVisible=false

ShowObjective::
((ObjectiveArrowVisible == true))[];
highlightarrow:10,10,ObjectiveArrow;
ObjectiveArrowVisible:true;

HideObjective::
((ObjectiveArrowVisible == false))[];
hidearrow:ObjectiveArrow;
ObjectiveArrowVisible:false;
```

### 4. Clean Up
```
# Remove arrows when done
MissionComplete::
removearrow:GuideArrow;
removearrow:ObjectiveArrow;
removearrow:WarningArrow;
```

## Limitations

### Cannot Modify Properties
```
# WRONG - Cannot change color
GuideArrow:red;  # ERROR!

# Must declare new arrow
arrow RedGuide=red
```

### Not True Variables
```
# WRONG - Cannot use in conditions
((GuideArrow == green))  # ERROR!

# Use state tracking instead
bool GuideVisible=false
```

### Position Only
```
# Arrows are position-only
# No rotation or scale
# No custom graphics
# No animation (except show/hide)
```

### Limited Colors
```
# Only 7 predefined colors
# No RGB or custom colors
# No transparency control
```

## Common Issues

### Arrow Not Showing
```
# Check coordinates are valid
# Ensure arrow wasn't removed
# Verify color is valid
# Check if hidden vs removed
```

### Multiple Arrows Same Spot
```
# Only one arrow visible per tile
# Last shown arrow takes precedence
# Use offset tiles for multiple markers
```

### Performance
```
# Too many arrows can impact performance
# Hide/remove unused arrows
# Reuse arrows when possible
# Limit simultaneous visible arrows
```

## Examples

### Complete Tutorial System
```
arrow TutGuide=green
arrow TutDanger=red
int TutStage=0

init::
StartTutorial;

StartTutorial::
TutStage:1;
highlightarrow:5,5,TutGuide;
msg:Welcome_BuildToolStore;

when(built:BuildingToolStore_C and TutStage==1)[TutStage2];

TutStage2::
TutStage:2;
hidearrow:TutGuide;
highlightarrow:10,10,TutGuide;
highlightarrow:15,15,TutDanger;
msg:DrillHere_AvoidRed;
```

### Dynamic Objective Tracker
```
arrow Obj1=green
arrow Obj2=yellow  
arrow Obj3=red
int CompletedObjectives=0

ShowObjectives::
highlightarrow:10,10,Obj1;
highlightarrow:20,20,Obj2;
highlightarrow:30,30,Obj3;

when(enter:10,10:miners)[CompleteObj1];
when(enter:20,20:miners)[CompleteObj2];
when(enter:30,30:miners)[CompleteObj3];

CompleteObj1::
removearrow:Obj1;
CompletedObjectives+=1;
CheckVictory;
```

## See Also
- [Variables](../syntax/variables.md) - Declaring arrows
- [Events](../syntax/events.md) - Arrow-related events
- [Coordinates](../../format/overview.md#coordinates) - Row/col system
- **Demo Scripts**: Review arrow examples in `ManicMiners\Levels\DEMO\Scripts` for practical implementations