# Script Commands Quick Reference

## Message & UI Commands

| Command | Syntax | Description |
|---------|--------|-------------|
| `msg` | `msg:stringvar;` | Display message to player |
| `wait` | `wait:seconds;` | Pause script execution |
| `pan` | `pan:row,col;` | Move camera to tile position |
| `shake` | `shake:intensity,duration;` | Screen shake effect |

## Arrow & Highlighting

| Command | Syntax | Description |
|---------|--------|-------------|
| arrow declaration | `arrow ArrowName=color` | Declare arrow (red/green/blue/yellow) |
| `highlightarrow` | `highlightarrow:row,col,arrowname;` | Show arrow at location |
| `removearrow` | `removearrow:arrowname;` | Remove specific arrow |

## Resource Commands

| Command | Syntax | Description |
|---------|--------|-------------|
| `crystals` | `crystals:amount;` | Add/subtract crystals |
| `ore` | `ore:amount;` | Add/subtract ore |
| `studs` | `studs:amount;` | Add/subtract studs |

## Spawning Commands

| Command | Syntax | Description |
|---------|--------|-------------|
| `spawn` | `spawn:type,row,col;` | Spawn single entity |
| `spawncap` | `spawncap:type,min,max;` | Set spawn limits |
| `spawnwave` | `spawnwave:type,count,interval;` | Wave spawning |
| `addrandomspawn` | `addrandomspawn:type,min,max;` | Random spawn points |

## Map Manipulation

| Command | Syntax | Description |
|---------|--------|-------------|
| `drill` | `drill:row,col;` | Force drill tile |
| `place` | `place:row,col,tileID;` | Change tile type |
| `reinforce` | `reinforce:row,col;` | Make wall reinforced |
| `teleport` | `teleport:unitID,row,col;` | Move unit |
| `destroy` | `destroy:row,col;` | Destroy tile/entity |

## Game Flow

| Command | Syntax | Description |
|---------|--------|-------------|
| `win` | `win:;` | Player wins level |
| `lose` | `lose:;` | Player loses level |
| `objective` | `objective:text;` | Update objective display |
| `timer` | `timer:name,start/stop;` | Control timers |

## Conditionals

| Syntax | Description | Example |
|--------|-------------|---------|
| `if(condition)[Event]` | One-time check | `if(crystals>25)[ShowSuccess];` |
| `when(condition)[Event]` | Continuous check | `when(time>60)[TimeWarning];` |

## Common Conditions

| Condition | Description |
|-----------|-------------|
| `crystals>X` | Crystal count check |
| `ore>X` | Ore count check |
| `time>X` | Time elapsed (seconds) |
| `buildings.Type>X` | Building count |
| `vehicles.Type>X` | Vehicle count |
| `miners>X` | Miner count |
| `creatures==X` | Creature count |
| `Variable==value` | Variable comparison |

## Operators

| Operator | Description |
|----------|-------------|
| `>` | Greater than |
| `<` | Less than |
| `>=` | Greater or equal |
| `<=` | Less or equal |
| `==` | Equal to |
| `!=` | Not equal to |
| `and` | Logical AND |
| `or` | Logical OR |
| `not` | Logical NOT |

## Event Declaration

```
EventName::
command1;
command2;
command3;
```

## Conditional Event

```
((condition))EventName::
command1;
command2;
```

## Variable Declaration

```
string MessageText="Hello"
bool IsComplete=false
int Counter=0
float Progress=0.0
arrow GuideArrow=green
timer SpawnTimer=10,5,3,SpawnEvent
```

## Common Script Pattern

```
script{
    // Variables
    string WelcomeMsg="Welcome to the caverns!"
    bool ObjectiveShown=false
    arrow HintArrow=yellow
    
    // Initial setup
    Init::
    msg:WelcomeMsg;
    wait:2;
    pan:15,15;
    
    // Continuous checks
    when(crystals>=25)[CheckProgress];
    when(miners==0)[GameOver];
    
    // Event handlers
    CheckProgress::
    if(ObjectiveShown==false)[ShowObjective];
    
    ShowObjective::
    ObjectiveShown:true;
    objective:Build a Power Station;
    highlightarrow:20,20,HintArrow;
    
    GameOver::
    msg:GameOverText;
    lose:;
}
```