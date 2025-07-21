# Events

Events are actions that modify game state. They execute when triggers fire or within event chains.

## Predefined Event Chains

There are two special event chains that are automatically called:

### init
Called at the start of the map before any other trigger.
```
init::
disable:lights;
msg:WelcomeToTheCaverns;
```

### tick
Called on every frame update (up to 350 times per second).
```
tick::
# WARNING: Not recommended! Severe performance impact
# Use timers instead
```

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
Show Chief portrait with message and pan camera.
```
msgChief:row,col,audiofile;
# Example: msgChief:10,10,warning;
```
**Note**: Also pans camera to specified row,col location.

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

**Warning**: Placing a wall on top of a miner or vehicle will phase them through the ground. This behavior will be updated in the future to bury them until dug out.

### drill
Drill wall at location.
```
drill:row,col;
# Example: drill:15,15;
```

**Note**: All wall tiles can be drilled with this event, including those not normally drillable. Drilling may cause other tiles to automatically collapse and fire drill triggers.

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

**Parameters**:
- `row,col`: Desired spawn location
- `direction`: N/S/E/W for specific direction, A for automatic
- `CreatureType`: Collection name (e.g., CreatureRockMonster_C)
- `radius`: Search distance for emergeable wall

**Failure Handling**: Use `~` modifier in event chains to handle emerge failures (see Special Modifiers section)

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

### reset
Reset player's selection (equivalent to right-click).
```
reset:;
```

### resume
Same as unpause.
```
resume:;
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
disable:Dynamite_C;     # Disable explosives
```

### enable
Re-enable abilities.
```
enable:miners;
enable:VehicleHoverScout_C;
```

**Collection Types**:
- `miners` - All Rock Raider teleportation
- `vehicles` - All vehicle teleportation
- `buildings` - All building teleportation
- `[ClassName]_C` - Specific vehicle/building class
- `lights`/`light` - Ambient cavern lighting
- `Dynamite_C` - Explosive placement

**Note**: Players cannot override light settings. Vehicle floodlights and some miner helmets still provide light when ambient is disabled.

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
Alternative syntax: `save:MinerVariable`

### lastvehicle  
Save triggering vehicle.
```
lastvehicle:VehicleVariable;
```
Alternative syntax: `savevehicle:VehicleVariable`

### lastbuilding
Save triggering building.
```
lastbuilding:BuildingVariable;
```
Alternative syntax: `savebuilding:BuildingVariable`

### lastcreature
Save triggering creature.
```
lastcreature:CreatureVariable;
```
Alternative syntax: `savecreature:CreatureVariable`

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

**Important**: Successful emerge exits the event chain at the `~` line!

**Correct Pattern**:
```
bool bEmergeGood

MyEvent::
DoEmerge;
((bEmergeGood==true))[EmergeOk][EmergeBad];

DoEmerge::
bEmergeGood:true;
emerge:2,3,A,CreatureIceMonster_C,0;
~bEmergeGood:false;  # Only runs if emerge failed
```

**Incorrect Pattern**:
```
MyEvent::
emerge:2,3,A,CreatureIceMonster_C,0;
~msg:"Monster failed";
MoreStuff;  # NEVER RUNS if emerge succeeded!
```

**Key Rule**: Place `~` events last in the event chain to avoid unexpected exits.

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

### Tile Modification Details

The engine collects all place and drill events and processes them after the trigger returns. This enables:
- Creating new walls
- Destroying walls  
- Changing ground types
- Adding/removing lava and water

**Critical Limits**:
- Maximum ~630 tiles per trigger (non-deterministic beyond this)
- Water/lava tiles cannot mix with other tile changes in same trigger
- Cannot create new undiscovered caverns via script
- Wait events process queued place events

**Water/Lava Restrictions**:
In one trigger context, you can only place:
- Only water tiles
- Only lava tiles
- Only non-water/lava tiles

Mixing these causes non-deterministic results. Use wait events between different types.

### Collapsing Walls

Walls generally need to be two tiles thick. Drilling one side collapses the other, except for hidden areas which require drilling both sides.

**Making Single-Drillable Hidden Walls**:

1. **Visual Block System**: 
   - Add change trigger on drillable wall
   - Connect wire to drill event for opposite wall
   - Can connect multiple wires for larger collapses

2. **Script Method**:
   ```
   if(drill:row,col)[drill:row2,col2];
   ```

3. **Editor Method**:
   - Use flat mode to draw single-width walls
   - Only works properly enclosing undiscovered areas
   - Single walls between discovered areas collapse at runtime

**Wall Rules**:
- Two tiles thick prevents collapsing (except hidden areas)
- Single tile walls collapse if both sides discovered
- Cliff tiles (experimental) have special collapse behavior

## Unknown Events

These events are recognized by the engine but have unknown syntax/behavior:

### landslide
```
# landslide is a reserved word
# Syntax unknown
```

## See Also
- [Variables](variables.md) - Data storage
- [Triggers](triggers.md) - When events execute
- [Event Chains](event-chains.md) - Grouping events
- [Conditions](conditions.md) - Conditional logic