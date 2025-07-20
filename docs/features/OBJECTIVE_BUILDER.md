# Objective Builder

A visual interface for creating and managing level objectives in Manic Miners DAT files.

## Features

### Visual Objective Creation
- **GUI Interface**: Build objectives using a form-based interface
- **Real-time Preview**: See your objective syntax as you build it
- **Parameter Validation**: Ensures correct format and values
- **Quick Insert**: Add objectives directly to your DAT file

### Supported Objective Types

#### 1. Resource Collection
Collect specific amounts of resources:
```
resources: crystals,ore,studs
```
Example: `resources: 20,10,5` (collect 20 crystals, 10 ore, 5 studs)

#### 2. Building Construction
Require construction of specific buildings:
```
building:BuildingType
```
Example: `building:BuildingPowerStation_C`

#### 3. Location Discovery
Discover specific tile coordinates:
```
discovertile:x,y/description
```
Example: `discovertile:25,30/Find the hidden cache`

#### 4. Variable Conditions
Complete when script variables meet conditions:
```
variable:condition/description
```
Example: `variable:monsters_defeated>=5/Defeat all monsters`

#### 5. Find Miner
Rescue lost Rock Raiders:
```
findminer:minerID
```
Example: `findminer:lost_miner_1`

#### 6. Find Building
Discover hidden buildings at coordinates:
```
findbuilding:x,y
```
Example: `findbuilding:15,20`

## How to Use

### Opening the Objective Builder
1. Open a Manic Miners DAT file
2. Click the Objective Builder icon in the sidebar
3. Or use Command Palette: `Manic Miners: Open Objective Builder`

### Creating an Objective
1. Select the objective type from the dropdown
2. Fill in the required parameters
3. Preview your objective in real-time
4. Click "Insert Objective" to add to your file

### Quick Examples
The builder includes common objective examples:
- Collect 20 crystals
- Collect 10 crystals and 10 ore
- Build a Power Station
- Discover location

Click any example to quickly insert it.

## Additional Commands

### Analyze Objectives
Command: `Manic Miners: Analyze Objectives`
- Counts objective types
- Calculates total resource requirements
- Lists all building requirements
- Shows all discovery locations

### Generate Objective Report
Command: `Manic Miners: Generate Objective Report`
- Creates a visual report of all objectives
- Shows statistics and requirements
- Useful for level balancing

### Convert Objective Format
Command: `Manic Miners: Convert Objective Format`
- Select text and convert to objective format
- Helps migrate from old formats
- Interactive parameter input

## Tips

### Best Practices
1. **Balance Resources**: Ensure enough resources exist on the map
2. **Progressive Difficulty**: Start with simple objectives
3. **Clear Descriptions**: Use descriptive text for discovery objectives
4. **Test Objectives**: Validate they're achievable in-game

### Common Patterns
```
// Tutorial level
resources: 5,0,0  // Just collect 5 crystals

// Standard level
resources: 20,10,0  // Crystals and ore
building:BuildingPowerStation_C

// Advanced level
resources: 30,20,10
building:BuildingUpgradeStation_C
discovertile:50,50/Find the ancient artifact
variable:monsters_defeated>=10/Clear all threats
```

### Validation
The builder validates:
- Numeric values are positive integers
- Building types are valid
- Coordinates are within reasonable bounds
- Syntax follows correct format

## Integration with Other Features

### Map Preview
- Click coordinates in Map Preview to use in objectives
- Visual reference for discovery locations

### Map Validation
- Checks if objectives are achievable
- Warns about resource mismatches
- Validates building placement feasibility

### IntelliSense
- Get objective suggestions while typing
- Auto-complete building names
- Format hints and documentation

## Keyboard Shortcuts

No default shortcuts assigned. Set custom shortcuts for:
- `manicMiners.openObjectiveBuilder`
- `manicMiners.analyzeObjectives`
- `manicMiners.generateObjectiveReport`

## Troubleshooting

### Builder Not Showing
- Ensure you have a DAT file open
- Check the Explorer sidebar for the panel
- Try Command Palette: "Open Objective Builder"

### Objectives Not Inserting
- Verify file has proper DAT structure
- Check if objectives section exists
- Ensure file is not read-only

### Invalid Format Warnings
- Use the preview to verify syntax
- Check parameter types match expected format
- Refer to examples for correct patterns