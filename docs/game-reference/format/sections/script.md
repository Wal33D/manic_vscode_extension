# Script Section

The `script{}` section contains level scripting that responds to game events and controls dynamic behavior. Scripts enable interactive gameplay beyond static objectives.

## Basic Structure

```
script{
    # Variable declarations
    int Counter=0
    string Message="Welcome!"
    bool FirstTime=true
    
    # Event chains (functions)
    ShowWelcome::
    msg:Message;
    Counter:Counter+1;
    
    # Triggers
    if(init)[ShowWelcome];
    when(enter:10,10)[msg:EnteredTile];
}
```

## Script Components

### 1. Variables
Store values and objects for logic.

```
# Types
int MyNumber=42
float MyDecimal=3.14
bool MyFlag=false
string MyText="Hello"
arrow MyArrow=green
miner MyMiner=""
```

### 2. Event Chains
Named sequences of events (like functions).

```
ChainName::
event1:parameters;
event2:parameters;
wait:2;
event3:parameters;
```

### 3. Triggers
Respond to game events.

```
# One-time trigger
if(condition)[event]

# Repeating trigger
when(condition)[event]

# With conditional
when(condition)((test))[true_event][false_event]
```

### 4. Events
Actions the script can perform.

```
msg:ShowMessage;
crystals:10;
shake:2,1;
win:;
```

## Trigger Types

### Game Flow
- `init` - Called once at map start
- `tick` - Called every frame (use sparingly!)
- `time>N` - After N seconds

### Unit Movement
- `enter:row,col` - Unit enters tile
- `walk:row,col` - Rock Raider walks on tile
- `drive:row,col` - Vehicle drives on tile
- `drill:row,col` - Wall at location drilled

### Resource Events
- `crystals>N` - Crystal count exceeds N
- `ore>N` - Ore count exceeds N
- `air<N` - Oxygen below N

### Building Events
- `buildings.BuildingType>N` - Building count
- `place:BuildingType` - Building placed

### Entity Events
- `CreatureType.dead` - Creature defeated
- `VehicleType.new` - Vehicle created

## Common Events

### Messages & UI
```
msg:TextString;              # Show message
msgChief:row,col,audio;      # Chief message with position
shake:duration,intensity;     # Screen shake
pause:;                      # Pause game
unpause:;                    # Resume game
```

### Resources
```
crystals:amount;             # Add/remove crystals
ore:amount;                  # Add/remove ore
air:amount;                  # Add/remove oxygen
studs:amount;                # Add/remove studs
```

### Map Control
```
win:;                        # Win immediately
lose:;                       # Lose immediately
tiles:row,col,tileID;        # Change tile
heighttrigger:row,col;       # Make tile drillable
drill:row,col;               # Force drill wall
placerubble:row,col,height;  # Create rubble
```

### Spawning
```
miners:row,col,count;        # Spawn Rock Raiders
emerge:row,col,type;         # Spawn creature
hiddencavern:r1,c1,r2,c2;    # Create hidden area
```

## Conditionals

### Operators
- `==` Equal
- `!=` Not equal
- `>` Greater than
- `<` Less than
- `>=` Greater or equal
- `<=` Less or equal

### Logic
- `and` Logical AND
- `or` Logical OR
- `true` / `false` Boolean values

### Examples
```
((crystals >= 50))
((time < 300 and ore > 20))
((buildings.BuildingToolStore_C > 0))
((MyVariable == true))
```

## Special Event Chains

### Init Chain
Runs once at start:
```
Init::
msg:Welcome;
objective:Build a Tool Store;
crystals:10;
```

### Tick Chain
Runs every frame (use carefully!):
```
Tick::
((air < 100))[msg:LowOxygenWarning];
```

## Coordinate System

⚠️ **Important**: Always use row,col order (Y,X)!
- Row = Y coordinate
- Col = X coordinate
- Zero-indexed from top-left

## Script Guidelines

### Performance
1. Avoid `tick` triggers when possible
2. Use specific tiles for `enter` triggers
3. Combine related events in chains
4. Limit active `when` triggers

### Organization
1. Declare all variables first
2. Define event chains before triggers
3. Use meaningful names
4. Comment complex logic

### Common Patterns

#### Tutorial Sequence
```
script{
    int Step=0
    
    Init::
    msg:TutorialStart;
    objective:Build Tool Store;
    
    when(buildings.BuildingToolStore_C>0 and Step==0)[NextStep];
    
    NextStep::
    Step:1;
    msg:GoodJob;
    crystals:20;
    objective:Build Power Station;
}
```

#### Timed Challenge
```
script{
    int TimeLimit=300
    
    when(time>TimeLimit)[TimeUp];
    when(time>240)[msg:OneMinuteWarning];
    
    TimeUp::
    msg:TimeExpired;
    lose:;
}
```

#### Resource Rewards
```
script{
    bool Reward1=false
    bool Reward2=false
    
    when(drill:10,10 and Reward1==false)[GiveReward1];
    when(drill:20,20 and Reward2==false)[GiveReward2];
    
    GiveReward1::
    Reward1:true;
    crystals:50;
    msg:FoundCrystalCache;
    
    GiveReward2::
    Reward2:true;
    ore:25;
    msg:FoundOreDeposit;
}
```

## Common Errors

1. **Spaces**: No spaces except in strings
2. **Coordinates**: Always row,col (not x,y)
3. **Semicolons**: Required after each event
4. **Parentheses**: Single for triggers, double for conditions
5. **Variables**: Must declare before use

## See Also
- [Scripting Overview](../../scripting/overview.md)
- [Variables](../../scripting/syntax/variables.md)
- [Events](../../scripting/syntax/events.md)
- [Triggers](../../scripting/syntax/triggers.md)
- [Advanced Scripting Guide](../../../ADVANCED_SCRIPTING.md)