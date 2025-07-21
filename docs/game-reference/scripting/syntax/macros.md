# Macros

Macros are built-in constants and dynamic values provided by the game engine. They cannot be modified but can be used in conditions, assignments, and events.

## Resource Macros

### crystals
Current energy crystal count.
```
# In conditions
((crystals > 50))
((crystals == targetCrystals))

# In assignments
int SavedCrystals=0
SavedCrystals:crystals;

# In events
msg:crystals;  # Display count
```

### ore
Current ore count.
```
((ore >= 25))
int CurrentOre=0
CurrentOre:ore;
```

### studs
Current building stud count.
```
((studs > 100))
int AvailableStuds=0
AvailableStuds:studs;
```

### air
Current oxygen level (if enabled).
```
((air < 50))
float OxygenLevel=0.0
OxygenLevel:air;
```

## Time Macros

### time
Game time elapsed in seconds.
```
((time > 300))  # After 5 minutes
float ElapsedTime=0.0
ElapsedTime:time;
```

**Notes:**
- Affected by game speed
- Starts at 0
- Float value with decimals

### truetime
Real time elapsed (not documented, possibly exists).
```
# Use with caution - undocumented
float RealTime=0.0
RealTime:truetime;
```

## Map Dimension Macros

### rowcount
Total rows in the map.
```
((rowcount > 50))
int MapHeight=0
MapHeight:rowcount;
```

### colcount  
Total columns in the map.
```
((colcount > 50))
int MapWidth=0
MapWidth:colcount;
```

**Usage Example:**
```
# Check if near map edge
CheckBoundary::
((Chief.row < 5))[msg:NearTopEdge];
((Chief.row > rowcount-5))[msg:NearBottomEdge];
((Chief.col < 5))[msg:NearLeftEdge];
((Chief.col > colcount-5))[msg:NearRightEdge];
```

## Collection Macros

### miners
Total Rock Raiders on map.
```
((miners > 5))
int TotalMiners=0
TotalMiners:miners;
```

### vehicles
Total vehicles on map.
```
((vehicles == 0))
int VehicleCount=0
VehicleCount:vehicles;
```

### buildings
Total buildings on map.
```
((buildings > 10))
int BuildingCount=0
BuildingCount:buildings;
```

### Specific Collections
Count of specific types.
```
# Buildings
((buildings.BuildingToolStore_C > 0))
((buildings.BuildingPowerStation_C >= 2))

# Vehicles
((vehicles.VehicleHoverScout_C > 0))
((vehicles.VehicleSmallDigger_C == 1))

# Creatures
((creatures.CreatureRockMonster_C < 3))
((creatures.CreatureLavaMonster_C == 0))
```

## Object Property Macros

### .hp
Health points of units.
```
miner Chief=0
vehicle Truck=1
building Base=10,10

((Chief.hp < 50))
((Truck.hp == 100))
((Base.hp > 0))
```

### .row/.col
Position of units.
```
((Chief.row == 10))
((Chief.col == 15))
((Truck.row > targetRow))
```

### .id
Unit ID (less commonly used).
```
int ChiefID=0
ChiefID:Chief.id;
```

## Using Macros

### In Conditions
```
# Simple comparison
((crystals > 50))

# Complex conditions
((crystals > 50 and ore > 25 and time < 300))

# With variables
int TargetCrystals=100
((crystals >= TargetCrystals))
```

### In Assignments
```
# Save current values
int SavedCrystals=0
int SavedOre=0
float SavedTime=0.0

SaveState::
SavedCrystals:crystals;
SavedOre:ore;
SavedTime:time;
```

### In Messages
```
# Display values
ShowStatus::
msg:crystals;    # "50"
msg:time;        # "125.5"
msg:miners;      # "3"
```

### In Math
```
# Calculate differences
int CrystalsNeeded=0
int TargetCrystals=100

CalculateNeeded::
CrystalsNeeded:TargetCrystals-crystals;
```

## Common Patterns

### Resource Monitoring
```
string Status=""

UpdateStatus::
((crystals < 10))[SetCritical];
((crystals < 50))[SetLow];
((crystals >= 50))[SetGood];

SetCritical::
Status:"Critical: ";
Status+=crystals;
msg:Status;
```

### Time-Based Events
```
float LastCheck=0.0
float CheckInterval=30.0

# Check every 30 seconds
when(time > LastCheck + CheckInterval)[PeriodicCheck];

PeriodicCheck::
LastCheck:time;
# Do periodic tasks
```

### Map Exploration
```
int ExploredTiles=0
int TotalTiles=0

init::
TotalTiles:rowcount*colcount;

# Update exploration percentage
UpdateExploration::
string ExploreMsg="Explored: ";
ExploreMsg+=ExploredTiles;
ExploreMsg+=" / ";
ExploreMsg+=TotalTiles;
objective:ExploreMsg;
```

### Dynamic Difficulty
```
# Scale difficulty with time
int SpawnRate=60

UpdateDifficulty::
((time > 300))[SpawnRate:45];  # 5 min
((time > 600))[SpawnRate:30];  # 10 min
((time > 900))[SpawnRate:20];  # 15 min
```

## Macro Limitations

### Read-Only
```
# WRONG - Cannot modify macros!
crystals:100;
time:0;

# CORRECT - Use events
crystals:100;  # This is the crystals event!
```

### No Custom Macros
```
# Cannot create your own macros
# Use variables instead
int MY_CONSTANT=42
```

### Type Constraints
```
# Macros have fixed types
crystals → int
time → float
rowcount → int

# Type conversions happen automatically
float f=0.0
f:crystals;  # int to float
```

## Advanced Usage

### Percentage Calculations
```
int CrystalPercent=0
int TargetCrystals=100

CalculatePercent::
CrystalPercent:crystals*100//TargetCrystals;
```

### Rate Calculations
```
float CrystalRate=0.0
float StartTime=0.0
int StartCrystals=0

init::
StartTime:time;
StartCrystals:crystals;

CalculateRate::
CrystalRate:crystals-StartCrystals;
CrystalRate/=time-StartTime;
```

### Bounds Checking
```
# Ensure position is valid
ValidatePosition::
((targetRow < 0))[targetRow:0];
((targetRow >= rowcount))[targetRow:rowcount-1];
((targetCol < 0))[targetCol:0];
((targetCol >= colcount))[targetCol:colcount-1];
```

## Debugging with Macros

### Status Display
```
ShowDebugInfo::
msg:"=== Debug Info ===";
msg:"Crystals: ";
msg:crystals;
msg:"Time: ";
msg:time;
msg:"Miners: ";
msg:miners;
```

### Conditional Debug
```
bool DebugMode=true

DebugCheck::
((DebugMode == true and crystals != LastCrystals))[CrystalChange];

CrystalChange::
msg:"Crystal change detected";
LastCrystals:crystals;
```

## Common Macro Combinations

### Victory Conditions
```
# Multiple requirements
((crystals >= 100 and ore >= 50 and time < 600))[win:AllObjectivesMet];
```

### Emergency Triggers
```
# Any critical condition
((air < 20 or miners == 0 or time > 1200))[EmergencyProtocol];
```

### Progress Tracking
```
float Progress=0.0

CalculateProgress::
Progress:0.0;
((crystals >= 50))[Progress+=33.3];
((ore >= 25))[Progress+=33.3];
((buildings.BuildingToolStore_C > 0))[Progress+=33.4];
```

## See Also
- [Variables](variables.md) - Storing macro values
- [Conditions](conditions.md) - Using macros in tests
- [Events](events.md) - Macro-related events
- [Reserved Words](../reserved-words.md) - Complete macro list