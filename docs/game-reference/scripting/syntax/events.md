# Events

Events are actions that modify game state. They execute when triggers fire or within event chains.

## Event Syntax

### In Triggers
```
when(trigger)[event:parameters];
```

### In Event Chains
```
EventChain::
event1:param1;
event2:param2,param3;
event3:;
```

## Message Events

### msg
Display message in message panel.
```
msg:StringVariable;
msg:CrystalCount;  # Numbers auto-convert
```

### qmsg
Display message and wait for acknowledgment.
```
qmsg:ImportantMessage;
```

### msgChief
Show Chief portrait with message.
```
msgChief:row,col,audiofile;
# Example: msgChief:10,10,warning;
```

## Resource Events

### crystals
Add/remove energy crystals.
```
crystals:10;    # Add 10
crystals:-5;    # Remove 5
```

### ore
Add/remove ore.
```
ore:25;         # Add 25
ore:-10;        # Remove 10
```

### studs
Add/remove building studs.
```
studs:100;      # Add 100
```

### air
Add/remove oxygen (if oxygen enabled).
```
air:50;         # Add 50 oxygen
air:-20;        # Remove 20
```

### drain
Drain crystals (like Slimy Slug).
```
drain:5;        # Drain 5 crystals
```

## Map Modification

### place
Change tile at location.
```
place:row,col,tileID;
# Example: place:10,10,1;  # Make ground
```

### drill
Drill wall at location.
```
drill:row,col;
# Example: drill:15,15;
```

### placerubble
Create rubble at location.
```
placerubble:row,col,height;
# height: 1-4 (66-63 tile IDs)
```

### heighttrigger
Make tile drillable from above.
```
heighttrigger:row,col;
```

## Entity Spawning

### emerge
Spawn creature from wall.
```
emerge:row,col,direction,CreatureType,radius;
# direction: N,S,E,W,A (auto)
# Example: emerge:10,10,A,CreatureRockMonster_C,2;
```

### miners
Teleport Rock Raiders.
```
miners:row,col,count;
# Example: miners:5,5,3;
```

### hiddencavern
Create hidden area.
```
hiddencavern:r1,c1,r2,c2;
# Rectangle from [r1,c1] to [r2,c2]
```

## Camera Control

### pan
Move camera to location.
```
pan:row,col;
```

### shake
Shake camera.
```
shake:intensity,duration;
# Example: shake:2.0,1.0;
```

### speed
Set game speed temporarily.
```
speed:2.0;      # Double speed
speed:0.5;      # Half speed
```

### resetspeed
Restore normal game speed.
```
resetspeed:;
```

## Visual Effects

### showarrow
Display arrow at location.
```
showarrow:row,col,ArrowVariable;
```

### hidearrow
Hide arrow.
```
hidearrow:ArrowVariable;
```

### highlight
Highlight tile.
```
highlight:row,col,ArrowVariable;
```

### highlightarrow
Show arrow and highlight.
```
highlightarrow:row,col,ArrowVariable;
```

### removearrow
Remove arrow completely.
```
removearrow:ArrowVariable;
```

## Game Flow

### win
Win the mission.
```
win:;           # Default message
win:VictoryMessage;
```

### lose
Lose the mission.
```
lose:;          # Default message
lose:DefeatMessage;
```

### objective
Set current objective text.
```
objective:ObjectiveText;
```

### pause
Pause the game.
```
pause:;
```

### unpause
Resume the game.
```
unpause:;
```

## Sound

### sound
Play sound file.
```
sound:MySoundFile;
# Plays from Levels/ASSETS/Sounds/
# Don't include .ogg extension
```

## Wait Events

### wait
Wait game seconds (scales with speed).
```
wait:2.0;       # Wait 2 game seconds
```

### truewait
Wait real seconds (ignores speed).
```
truewait:1.5;   # Wait 1.5 real seconds
```

**Warning**: Script continues during wait!

## Math Operations

### Assignment
```
Variable:Value;
IntVar:5;
FloatVar:3.14;
StringVar:"Hello";
```

### Addition
```
a:b+c;          # a = b + c
a+=5;           # a = a + 5
```

### Subtraction
```
a:b-c;          # a = b - c
a-=3;           # a = a - 3
```

### Multiplication
```
a:b*c;          # a = b * c
a*=2;           # a = a * 2
```

### Division
```
a:b//c;         # a = b / c (double slash!)
a/=2;           # a = a / 2
```

**Notes:**
- Only one operation per line
- No complex expressions
- String concatenation uses + and +=

## Object Management

### heal
Heal unit (not creatures).
```
heal:ObjectVariable,amount;
# Example: heal:MyMiner,50;
```

### kill
Remove unit (teleport up).
```
kill:ObjectVariable;
```

### flee
Make creature flee.
```
flee:CreatureVar,row,col;
```

## Enable/Disable

### disable
Disable player abilities.
```
disable:miners;         # No miner teleport
disable:vehicles;       # No vehicle teleport
disable:buildings;      # No building teleport
disable:BuildingToolStore_C;  # Specific type
disable:lights;         # Turn off lights
```

### enable
Re-enable abilities.
```
enable:miners;
enable:VehicleHoverScout_C;
```

## Timer Control

### starttimer
Start a timer.
```
starttimer:TimerVariable;
```

### stoptimer
Stop a timer.
```
stoptimer:TimerVariable;
```

## Random Spawning

### addrandomspawn
Configure random spawns.
```
addrandomspawn:CreatureType,minTime,maxTime;
# Example: addrandomspawn:CreatureSmallSpider_C,30.0,60.0;
```

### spawncap
Set spawn limits.
```
spawncap:CreatureType,min,max;
# Active creatures between min and max
```

### spawnwave
Set wave size.
```
spawnwave:CreatureType,min,max;
# Creatures per wave
```

### startrandomspawn
Begin spawning.
```
startrandomspawn:CreatureType;
```

### stoprandomspawn
Stop spawning.
```
stoprandomspawn:CreatureType;
```

## Save Last Events

### lastminer
Save triggering miner.
```
lastminer:MinerVariable;
```

### lastvehicle
Save triggering vehicle.
```
lastvehicle:VehicleVariable;
```

### lastbuilding
Save triggering building.
```
lastbuilding:BuildingVariable;
```

### lastcreature
Save triggering creature.
```
lastcreature:CreatureVariable;
```

## Special Modifiers

### Random Choice (?)
One random event executes:
```
EventChain::
?msg:Option1;
?msg:Option2;
?msg:Option3;
```

### Emerge Failure (~)
Execute only if emerge fails:
```
TrySpawn::
emerge:10,10,A,CreatureRockMonster_C,2;
~msg:SpawnFailed;
```

## Common Patterns

### Resource Reward
```
GiveReward::
crystals:50;
ore:25;
msg:RewardMessage;
```

### Timed Sequence
```
Sequence::
msg:Phase1;
wait:3.0;
msg:Phase2;
wait:3.0;
msg:Phase3;
```

### Spawn and Track
```
SpawnBoss::
emerge:20,20,A,CreatureLavaMonster_C,1;
lastcreature:BossMonster;
```

## Limitations

- One math operation per line
- Wait events don't pause script execution
- ~630 tile changes per trigger maximum
- Water/lava changes can't mix with other tiles
- String variables required for messages

## See Also
- [Variables](variables.md) - Data storage
- [Triggers](triggers.md) - When events execute
- [Event Chains](event-chains.md) - Grouping events
- [Conditions](conditions.md) - Conditional logic