# Map Templates Feature

Map Templates provide pre-built patterns and structures that can be quickly inserted into your Manic Miners levels.

## Recent Improvements

### Version 0.3.0
- **Custom Templates**: Save your own templates from selected areas
- **Template Management**: Organize and delete custom templates
- **Enhanced Categories**: Added 'Custom' category for user templates
- **Better Organization**: Templates now separated by type

## How to Use

1. **Access Templates**:
   - Use Command Palette: `Manic Miners: Insert Map Template`
   - Or click the template icon in the editor title bar (when editing .dat files)

2. **Select Template**:
   - Choose a category: All, Room, Corridor, Pattern, or Structure
   - Select the specific template you want to insert

3. **Insert Template**:
   - Position your cursor in the tiles section where you want the template
   - The template will be inserted at the cursor position

## Available Templates

### Room Templates

#### Small Room (5x5)
A basic room with solid rock walls:
```
40,40,40,40,40,
40, 1, 1, 1,40,
40, 1, 1, 1,40,
40, 1, 1, 1,40,
40,40,40,40,40,
```

#### Medium Room (7x7)
A larger room with solid rock walls:
```
40,40,40,40,40,40,40,
40, 1, 1, 1, 1, 1,40,
40, 1, 1, 1, 1, 1,40,
40, 1, 1, 1, 1, 1,40,
40, 1, 1, 1, 1, 1,40,
40, 1, 1, 1, 1, 1,40,
40,40,40,40,40,40,40,
```

#### Large Room (9x9)
A spacious room with reinforced walls:
```
90,90,90,90,90,90,90,90,90,
90, 1, 1, 1, 1, 1, 1, 1,90,
90, 1, 1, 1, 1, 1, 1, 1,90,
90, 1, 1, 1, 1, 1, 1, 1,90,
90, 1, 1, 1, 1, 1, 1, 1,90,
90, 1, 1, 1, 1, 1, 1, 1,90,
90, 1, 1, 1, 1, 1, 1, 1,90,
90, 1, 1, 1, 1, 1, 1, 1,90,
90,90,90,90,90,90,90,90,90,
```

### Corridor Templates

#### Horizontal Corridor (7x3)
A simple horizontal passage:
```
40,40,40,40,40,40,40,
 1, 1, 1, 1, 1, 1, 1,
40,40,40,40,40,40,40,
```

#### Vertical Corridor (3x7)
A simple vertical passage:
```
40, 1,40,
40, 1,40,
40, 1,40,
40, 1,40,
40, 1,40,
40, 1,40,
40, 1,40,
```

#### T-Junction (5x5)
A T-shaped intersection:
```
40,40,40,40,40,
 1, 1, 1, 1, 1,
40,40, 1,40,40,
40,40, 1,40,40,
40,40, 1,40,40,
```

#### Cross Junction (5x5)
A four-way intersection:
```
40,40, 1,40,40,
40,40, 1,40,40,
 1, 1, 1, 1, 1,
40,40, 1,40,40,
40,40, 1,40,40,
```

### Pattern Templates

#### Crystal Cluster (3x3)
A cluster of energy crystals:
```
26,26,26,
26,27,26,
26,26,26,
```

#### Ore Deposit (4x4)
A rich ore seam:
```
40,34,34,40,
34,35,35,34,
34,35,35,34,
40,34,34,40,
```

#### Lava Pool (4x4)
A dangerous lava hazard:
```
40,40,40,40,
40, 6, 6,40,
40, 6, 6,40,
40,40,40,40,
```

#### Water Pool (5x5)
A water hazard:
```
40,40,40,40,40,
40,11,11,11,40,
40,11,11,11,40,
40,11,11,11,40,
40,40,40,40,40,
```

### Structure Templates

#### Power Station Area (6x6)
Space for a power station with reinforced walls:
```
90,90,90,90,90,90,
90, 1, 1, 1, 1,90,
90, 1, 1, 1, 1,90,
90, 1, 1, 1, 1,90,
90, 1, 1, 1, 1,90,
90,90,90,90,90,90,
```

#### Tool Store Area (5x5)
Space for a tool store with entrance:
```
40,40,40,40,40,
40, 1, 1, 1,40,
40, 1, 1, 1, 1,  <- entrance
40, 1, 1, 1,40,
40,40,40,40,40,
```

## Custom Templates

### Creating Custom Templates

1. **Select Area in Map Preview**:
   - Open the Map Preview
   - Hold Shift and drag to select an area
   - A command will appear to save as template

2. **From Command Palette**:
   - Select tiles in your .dat file
   - Run `Manic Miners: Create Template from Selection`

3. **Template Details**:
   - Give your template a meaningful name
   - Add a description (optional)
   - Choose an appropriate category

### Managing Custom Templates

- Run `Manic Miners: Manage Custom Templates`
- View all your saved templates
- Delete templates you no longer need
- Templates are saved globally across all projects

## Tips

- Templates preserve existing tile data outside their boundaries
- Use templates as starting points and modify them as needed
- Combine multiple templates to create complex layouts
- Templates work best when inserted into open areas
- Use the map preview to see your changes in real-time
- Save frequently used patterns as custom templates
- Share templates by exporting/importing settings

## Keyboard Shortcuts

- No default keyboard shortcuts are assigned
- You can assign shortcuts via File → Preferences → Keyboard Shortcuts
- Useful commands to assign:
  - `manicMiners.insertTemplate`
  - `manicMiners.createTemplateFromSelection`
  - `manicMiners.manageTemplates`