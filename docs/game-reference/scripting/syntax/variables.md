# Variables

Variables are containers that store data and references to game objects. They allow you to track and modify game state throughout your script. All variables have global scope and must be declared with a type and name.

**Script Parsing**: The engine uses a two-pass process:
1. First pass: Identifies all variables and event chain names
2. Second pass: Processes triggers and event chains

This means variables can be referenced before their declaration line. However, it's good practice to declare variables at the start of the script.

## Declaration Syntax

```
type name=value
```

- **type**: Variable type (required)
- **name**: Variable identifier (required)
- **value**: Initial value (optional)
- Single space required between type and name

## Primitive Types

### int
Stores whole numbers (truncates decimals).

```
int Counter=0
int Lives=3
int Score        # Defaults to 0
```

**Notes:**
- Cannot initialize with negative values
- Can be assigned negative values later
- Decimals truncated (2.9 becomes 2)

### float
Stores decimal numbers.

```
float Time=0.0
float Speed=2.5
float Distance   # Defaults to 0.0
```

**Notes:**
- Cannot initialize with negative values
- Full decimal precision maintained

### bool
Stores true/false values.

```
bool GameStarted=false
bool HasKey=true
bool IsActive    # Defaults to false
```

**Notes:**
- In math: true=1, false=0
- Any value except "=true" initializes to false

**Testing bools**:
```
# Recommended
((var==true))
((var==false))
((var!=true))
((var!=false))

# Also works but less clear
((var))
((not var))
```

### string
Stores text.

```
string Message="Hello World"
string Name="CADET"
string Empty=""
string Legacy=No quotes also works  # Until EOL or comment
```

**String Operations:**
```
# Concatenation
string Full=First;
Full+=Last;        # Appends Last to Full

# Adding numbers
string Score="Points: ";
Score+=100;        # Results in "Points: 100"

# Practical example with time
string s=""
float fNow=0.0

init::
fNow:time;
s:"The current game time: ";
s+=fNow;     # Appends float as string
msg:s;       # Shows "The current game time: 0.0"
```

**Limitations:**
- No embedded quotes support
- No string-to-number conversion
- Legacy format (no quotes) supported but discouraged
- Legacy format `Name[value]` also supported but discouraged

## Object Types

### arrow
References arrow markers for visual guidance.

```
arrow Guide=green
arrow Marker=red
arrow Default      # Defaults to green
```

**Colors:** black, blue, darkgreen, green, red, yellow, white

**Note**: Arrow variables are not real variables - they can only be used with arrow-specific events (showarrow, hidearrow, etc.).

### timer
Creates periodic or delayed events.

**Note**: Timer variables are not real variables - they can only be used with timer-specific events (starttimer, stoptimer).

```
timer MyTimer=5.0,10.0,15.0,TimerEvent
# Format: delay,min,max,eventchain
```

- **delay**: Initial delay before first trigger
- **min**: Minimum time between triggers
- **max**: Maximum time between triggers
- **eventchain**: Event chain to call

### miner
References Rock Raiders by ID.

```
miner Chief=0      # Miner with ID 0
miner Assistant    # Unassigned
```

**Important:**
- Binds to specific miner, not the ID
- If miner leaves, variable becomes invalid
- Can reassign with `lastminer` event

### vehicle
References vehicles by ID.

```
vehicle Truck=1    # Vehicle with ID 1
vehicle Digger     # Unassigned
```

**Important:**
- Binds to specific vehicle, not the ID
- Multiple variables cannot reference same vehicle
- Can reassign with `lastvehicle` event

**Error Example:**
```
vehicle myTruck1=1    # Vehicle ID 1 assigned to myTruck1
vehicle myTruck2=1    # ERROR! Vehicle ID 1 already assigned
```

### creature
References creatures by ID.

```
creature Monster=0  # Creature with ID 0
creature Boss      # Unassigned
```

**Important:**
- Binds to specific creature, not the ID
- Becomes invalid when creature is defeated
- Can reassign with `lastcreature` event

### building
References buildings by location.

```
building ToolStore=10,10  # Building at row 10, col 10
building PowerPlant       # Unassigned
```

**Important:**
- Uses row,col coordinates (not building ID)
- Multiple variables cannot reference same building
- Can reassign with `lastbuilding` event

**Error Example:**
```
building myToolStore1=3,4   # Building at 3,4 assigned
building myToolStore2=3,5   # ERROR if same building spans both tiles!
```

### intarray
Dynamic integer array for storing multiple values.

```
intarray Scores       # Declaration only
intarray Waypoints    # No initialization allowed
```

**Usage:**
```
# Set values
Scores[0]:100;
Scores[1]:200;
Scores[2]:300;

# Read values  
int CurrentScore=Scores[1];  # Gets 200

# Use variables as index
int Index=2;
int Value=Scores[Index];     # Gets 300

# Arrays auto-expand
Scores[10]:1000;  # Indexes 3-9 are automatically set to 0
```

**Important Notes:**
- Arrays start at index 0
- Cannot use negative indexes (may crash)
- Unset indexes default to 0
- Cannot read beyond highest set index
- No multi-dimensional arrays (simulate with math)
- Cannot use array values as indexes directly
- No way to clear or resize arrays

**Example - Tracking Multiple Objectives:**
```
intarray ObjectiveStatus
int TotalObjectives=3

Init::
ObjectiveStatus[0]:0;  # Not started
ObjectiveStatus[1]:0;
ObjectiveStatus[2]:0;

CompleteObjective::
int ObjNum=0;  # Set this to objective number
ObjectiveStatus[ObjNum]:1;  # Mark complete
```

## Variable Scope

All variables are **global**:
- Accessible from any event chain
- Persist for entire map session
- No local variables exist

## Naming Rules

### Valid Names
- Start with letter or underscore
- Contain letters, numbers, underscores
- Case insensitive (but use for readability)
- Technically can start with numbers followed by alpha/underscore (e.g., `123abc`) but strongly discouraged

### Examples
```
# Good names
int PlayerScore
bool _isActive
string Message_01

# Bad names (avoid)
int 123score      # Starts with number (discouraged)
bool my-flag      # Contains hyphen
string reserved   # Might be reserved word
```

**Critical Warning**: The engine won't error if a variable and event chain share the same name, but this causes undefined behavior!

### Reserved Words
Cannot use as variable names:
- Event names (msg, crystals, win, etc.)
- Trigger names (init, enter, time, etc.)
- Type names (int, bool, string, etc.)
- Macros (rowcount, colcount, etc.)

## Type Mixing

### Allowed Conversions
```
# Numeric types can mix
int i=5
float f=2.5
f:i;          # f becomes 5.0
i:f;          # i becomes 2 (truncated)

# Numbers to strings
string s="Value: ";
s+=42;        # "Value: 42"
```

### Not Allowed
```
# Cannot mix object types
miner m=0
vehicle v=m;   # ERROR

# Cannot convert string to number
string s="123"
int i=s;       # ERROR
```

## Working with Negatives

Cannot initialize with negatives, must compute:

```
int Negative
float NegSpeed

init::
Negative:0-5;      # Now -5
NegSpeed:0-2.5;    # Now -2.5
```

## Common Patterns

### State Tracking
```
bool Phase1Complete=false
bool Phase2Complete=false
int CurrentPhase=1
```

### Resource Management
```
int CrystalsNeeded=50
int OreCollected=0
float TimeRemaining=300.0
```

### Entity References
```
miner Leader=0
vehicle Transport=1
building MainBase=5,5
```

### Message Building
```
string Status="Mission Status: "
string Objective="Collect crystals"
Status+=Objective;  # "Mission Status: Collect crystals"
```

## Best Practices

1. **Initialize variables** when possible
2. **Use meaningful names** that describe purpose
3. **Group related variables** together
4. **Comment complex variables**
5. **Avoid reserved words**
6. **Don't reuse object references**

## Example: Complete Variable Set
```
script{
    # Game state
    int Phase=1
    bool MissionComplete=false
    float TimeElapsed=0.0
    
    # Resources
    int CrystalsFound=0
    int OreFound=0
    
    # Entities
    miner Chief=0
    vehicle Digger=1
    building Base=10,10
    creature Boss
    
    # UI
    string StatusMessage=""
    arrow GuideArrow=yellow
    
    # Timing
    timer WaveTimer=30.0,45.0,60.0,SpawnWave
}
```

## See Also
- [Events](events.md) - Using variables in events
- [Conditions](conditions.md) - Testing variables
- [Reserved Words](../reserved-words.md) - Names to avoid
- [Classes](../classes/) - Object type details