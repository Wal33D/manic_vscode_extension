# Manic Miners Map Analysis Report

This report analyzes map structure, patterns, and design principles across tutorial, campaign, and community maps.

## Table of Contents

1. [Individual Map Analyses](#individual-map-analyses)
2. [Category Comparisons](#category-comparisons)
3. [Design Principles](#design-principles)
4. [Key Insights](#key-insights)

## Individual Map Analyses

## TUTORIAL: buildings.dat

### Basic Information
- **Level Name**: Tutorial: Buildings
- **Creator**: Baraklava
- **Biome**: rock
- **Dimensions**: 32x32 (1024 tiles)
- **Complexity**: Medium (25x25 - 40x40)

### Objectives
- Construct all the buildings! (condition: AllBuilt==true)

### Resources
- **Initial Crystals**: 8
- **Initial Ore**: 57
- **Crystal Seams**: 53 (5.18% density)
- **Ore Seams**: 34 (3.32% density)
- **Distribution**: balanced

### Script Complexity
- **Overall**: Very Complex
- **Variables**: 38
- **Events**: 0

### Terrain Features
- Lava hazards
- Water
- Erosion
- Slug holes
- Landslides

### Map Characteristics
- **Open Space**: 12.1%
- **Edge Type**: sealed
- **Difficulty**: medium
- **Accessibility**: 3.4% connected
- **Choke Points**: 124
- **Strategic Depth**: 96%

### Notable Design Elements
- 24 isolated regions requiring strategic planning
- Multiple resource clusters encouraging expansion
- Fast erosion creating time pressure
- Multiple strategic choke points

## TUTORIAL: vehicles.dat

### Basic Information
- **Level Name**: Tutorial: Vehicles
- **Creator**: Zeldrake
- **Biome**: lava
- **Dimensions**: 40x48 (1920 tiles)
- **Complexity**: Large (40x40 - 64x64)

### Objectives
- Follow Chief's instructions and drill all four Energy Crystal Seams (condition: FinalWinVariable>0)

### Resources
- **Initial Crystals**: 50
- **Initial Ore**: 80
- **Crystal Seams**: 53 (2.76% density)
- **Ore Seams**: 64 (3.33% density)
- **Distribution**: balanced

### Script Complexity
- **Overall**: Very Complex
- **Variables**: 346
- **Events**: 163
- **Features**: Arrows/Guidance, Conditional events

### Terrain Features
- Lava hazards
- Landslides

### Buildings
- **Pre-placed**: BuildingToolStore_C, BuildingPowerStation_C, BuildingUpgradeStation_C, BuildingTeleportPad_C, BuildingSupportStation_C, BuildingDocks_C, BuildingMiningLaser_C
- **Count**: 9

### Map Characteristics
- **Open Space**: 10.3%
- **Edge Type**: sealed
- **Difficulty**: medium
- **Accessibility**: 3.0% connected
- **Choke Points**: 198
- **Strategic Depth**: 97%

### Notable Design Elements
- 25 isolated regions requiring strategic planning
- Multiple resource clusters encouraging expansion
- Complex scripting with multiple event chains
- Fast erosion creating time pressure
- Multiple strategic choke points

## TUTORIAL: miners.dat

### Basic Information
- **Level Name**: Tutorial: Miners
- **Creator**: Baraklava
- **Biome**: rock
- **Dimensions**: 32x32 (1024 tiles)
- **Complexity**: Medium (25x25 - 40x40)

### Objectives
- Find your way back to the base (condition: FoundBase==true)

### Resources
- **Initial Crystals**: 0
- **Initial Ore**: 0
- **Crystal Seams**: 52 (5.08% density)
- **Ore Seams**: 34 (3.32% density)
- **Distribution**: balanced

### Script Complexity
- **Overall**: Very Complex
- **Variables**: 32
- **Events**: 14
- **Features**: Conditional events

### Terrain Features
- Lava hazards
- Water
- Landslides

### Buildings
- **Pre-placed**: BuildingCanteen_C, BuildingDocks_C, BuildingMiningLaser_C, BuildingPowerStation_C, BuildingSuperTeleport_C, BuildingToolStore_C, BuildingUpgradeStation_C
- **Count**: 9

### Map Characteristics
- **Open Space**: 4.3%
- **Edge Type**: sealed
- **Difficulty**: medium
- **Accessibility**: 1.9% connected
- **Choke Points**: 44
- **Strategic Depth**: 99%

### Notable Design Elements
- 20 isolated regions requiring strategic planning
- Multiple resource clusters encouraging expansion
- Fast erosion creating time pressure
- Multiple strategic choke points

## CAMPAIGN: drillernight.dat

### Basic Information
- **Level Name**: Driller Night!
- **Creator**: Baraklava
- **Biome**: rock
- **Dimensions**: 32x32 (1024 tiles)
- **Complexity**: Medium (25x25 - 40x40)

### Objectives
- Collect 5 crystals, 0 ore, 0 studs

### Resources
- **Initial Crystals**: 0
- **Initial Ore**: 0
- **Crystal Seams**: 32 (3.13% density)
- **Ore Seams**: 32 (3.13% density)
- **Distribution**: sparse

### Script Complexity
- **Overall**: Simple
- **Variables**: 5
- **Events**: 0

### Terrain Features
- Lava hazards
- Water

### Buildings
- **Pre-placed**: BuildingToolStore_C
- **Count**: 1

### Map Characteristics
- **Open Space**: 4.9%
- **Edge Type**: sealed
- **Difficulty**: medium
- **Accessibility**: 6.6% connected
- **Choke Points**: 50
- **Strategic Depth**: 82%

### Notable Design Elements
- 5 isolated regions requiring strategic planning
- Fast erosion creating time pressure
- Multiple strategic choke points

## CAMPAIGN: fireandwater.dat

### Basic Information
- **Level Name**: Fire 'n' Water
- **Creator**: Baraklava
- **Biome**: rock
- **Dimensions**: 56x56 (3136 tiles)
- **Complexity**: Large (40x40 - 64x64)

### Objectives
- Collect 35 crystals, 0 ore, 0 studs

### Resources
- **Initial Crystals**: 0
- **Initial Ore**: 0
- **Crystal Seams**: 65 (2.07% density)
- **Ore Seams**: 56 (1.79% density)
- **Distribution**: balanced

### Script Complexity
- **Overall**: Simple
- **Variables**: 0
- **Events**: 0

### Terrain Features
- Lava hazards

### Buildings
- **Pre-placed**: BuildingToolStore_C
- **Count**: 1

### Map Characteristics
- **Open Space**: 12.1%
- **Edge Type**: sealed
- **Difficulty**: medium
- **Accessibility**: 19.2% connected
- **Choke Points**: 379
- **Strategic Depth**: 96%

### Notable Design Elements
- 1 isolated regions requiring strategic planning
- Multiple resource clusters encouraging expansion
- High hazard density creating environmental challenge
- Multiple strategic choke points

## CAMPAIGN: lavalaughter.dat

### Basic Information
- **Level Name**: Lava Laughter
- **Creator**: Baraklava
- **Biome**: lava
- **Dimensions**: 40x40 (1600 tiles)
- **Complexity**: Large (40x40 - 64x64)

### Objectives
- Collect 30 crystals, 0 ore, 0 studs

### Resources
- **Initial Crystals**: 0
- **Initial Ore**: 0
- **Crystal Seams**: 46 (2.88% density)
- **Ore Seams**: 50 (3.13% density)
- **Distribution**: balanced

### Script Complexity
- **Overall**: Simple
- **Variables**: 0
- **Events**: 0

### Terrain Features
- Landslides

### Buildings
- **Pre-placed**: BuildingToolStore_C
- **Count**: 1

### Map Characteristics
- **Open Space**: 2.9%
- **Edge Type**: sealed
- **Difficulty**: medium
- **Accessibility**: 1.9% connected
- **Choke Points**: 46
- **Strategic Depth**: 99%

### Notable Design Elements
- 20 isolated regions requiring strategic planning
- Multiple resource clusters encouraging expansion
- Multiple strategic choke points

## COMMUNITY: 01-Lost-Leader.dat

### Basic Information
- **Level Name**: Lost Leader
- **Creator**: Gemstaaar
- **Biome**: rock
- **Dimensions**: 14x14 (196 tiles)
- **Complexity**: Small (<25x25)

### Objectives
- Collect 10 crystals, 0 ore, 0 studs

### Resources
- **Initial Crystals**: 0
- **Initial Ore**: 0
- **Crystal Seams**: 15 (7.65% density)
- **Ore Seams**: 15 (7.65% density)
- **Distribution**: sparse

### Script Complexity
- **Overall**: Simple
- **Variables**: 1
- **Events**: 2

### Terrain Features
- Water
- Ice terrain

### Buildings
- **Pre-placed**: BuildingToolStore_C
- **Count**: 1

### Map Characteristics
- **Open Space**: 15.8%
- **Edge Type**: sealed
- **Difficulty**: medium
- **Accessibility**: 9.0% connected
- **Choke Points**: 31
- **Strategic Depth**: 78%

### Notable Design Elements
- 4 isolated regions requiring strategic planning
- Multiple strategic choke points

## COMMUNITY: CS001_RapidRecon_14.dat

### Basic Information
- **Level Name**: CS01_Rapid_Recon
- **Creator**: Cera
- **Biome**: rock
- **Dimensions**: 62x32 (1984 tiles)
- **Complexity**: Large (40x40 - 64x64)

### Objectives
- Collect 22 crystals, 0 ore, 0 studs

### Resources
- **Initial Crystals**: 0
- **Initial Ore**: 0
- **Crystal Seams**: 34 (1.71% density)
- **Ore Seams**: 32 (1.61% density)
- **Distribution**: balanced

### Script Complexity
- **Overall**: Moderate
- **Variables**: 6
- **Events**: 4
- **Features**: Messages

### Terrain Features
- Lava hazards
- Water

### Buildings
- **Pre-placed**: BuildingToolStore_C
- **Count**: 1

### Map Characteristics
- **Open Space**: 13.5%
- **Edge Type**: sealed
- **Difficulty**: medium
- **Accessibility**: 2.3% connected
- **Choke Points**: 267
- **Strategic Depth**: 96%

### Notable Design Elements
- 29 isolated regions requiring strategic planning
- High hazard density creating environmental challenge
- Multiple strategic choke points

## COMMUNITY: FN4-005-Withering-Waves.dat

### Basic Information
- **Level Name**: Withering Waves
- **Creator**: Fox
- **Biome**: lava
- **Dimensions**: 34x50 (1700 tiles)
- **Complexity**: Large (40x40 - 64x64)

### Objectives
- Collect 250 crystals, 0 ore, 0 studs

### Resources
- **Initial Crystals**: 0
- **Initial Ore**: 0
- **Crystal Seams**: 90 (5.29% density)
- **Ore Seams**: 50 (2.94% density)
- **Distribution**: balanced

### Script Complexity
- **Overall**: Moderate
- **Variables**: 7
- **Events**: 9

### Terrain Features
- Lava hazards
- Water

### Buildings
- **Pre-placed**: BuildingToolStore_C, BuildingDocks_C
- **Count**: 2

### Map Characteristics
- **Open Space**: 12.1%
- **Edge Type**: sealed
- **Difficulty**: medium
- **Accessibility**: 3.7% connected
- **Choke Points**: 205
- **Strategic Depth**: 96%

### Notable Design Elements
- 21 isolated regions requiring strategic planning
- Multiple resource clusters encouraging expansion
- High hazard density creating environmental challenge
- Multiple strategic choke points

## BAZ: coldcomfort.dat

### Basic Information
- **Level Name**: Cold Comfort
- **Creator**: Batman
- **Biome**: ice
- **Dimensions**: 42x42 (1764 tiles)
- **Complexity**: Large (40x40 - 64x64)

### Objectives
- Collect 60 crystals, 0 ore, 0 studs

### Resources
- **Initial Crystals**: 0
- **Initial Ore**: 0
- **Crystal Seams**: 56 (3.17% density)
- **Ore Seams**: 49 (2.78% density)
- **Distribution**: balanced

### Script Complexity
- **Overall**: Simple
- **Variables**: 0
- **Events**: 0

### Terrain Features
- Water

### Map Characteristics
- **Open Space**: 6.6%
- **Edge Type**: sealed
- **Difficulty**: medium
- **Accessibility**: 1.1% connected
- **Choke Points**: 116
- **Strategic Depth**: 98%

### Notable Design Elements
- 45 isolated regions requiring strategic planning
- Multiple resource clusters encouraging expansion
- Fast erosion creating time pressure
- Multiple strategic choke points

## BAZ: mineovermanner.dat

### Basic Information
- **Level Name**: Mine Over Manner
- **Creator**: Batman
- **Biome**: rock
- **Dimensions**: 39x41 (1599 tiles)
- **Complexity**: Medium (25x25 - 40x40)

### Objectives
- Collect 40 crystals, 0 ore, 0 studs

### Resources
- **Initial Crystals**: 0
- **Initial Ore**: 0
- **Crystal Seams**: 49 (3.06% density)
- **Ore Seams**: 51 (3.19% density)
- **Distribution**: balanced

### Script Complexity
- **Overall**: Simple
- **Variables**: 0
- **Events**: 0

### Terrain Features
- Lava hazards
- Water

### Map Characteristics
- **Open Space**: 8.2%
- **Edge Type**: sealed
- **Difficulty**: medium
- **Accessibility**: 1.1% connected
- **Choke Points**: 131
- **Strategic Depth**: 97%

### Notable Design Elements
- 44 isolated regions requiring strategic planning
- Multiple resource clusters encouraging expansion
- Fast erosion creating time pressure
- Multiple strategic choke points

## BAZ: moltenmeltdown.dat

### Basic Information
- **Level Name**: Molten Meltdown
- **Creator**: Batman
- **Biome**: lava
- **Dimensions**: 38x39 (1482 tiles)
- **Complexity**: Medium (25x25 - 40x40)

### Objectives
- Collect 54 crystals, 0 ore, 0 studs

### Resources
- **Initial Crystals**: 0
- **Initial Ore**: 0
- **Crystal Seams**: 44 (2.97% density)
- **Ore Seams**: 45 (3.04% density)
- **Distribution**: balanced

### Script Complexity
- **Overall**: Simple
- **Variables**: 0
- **Events**: 0

### Terrain Features
- Lava hazards
- Water

### Map Characteristics
- **Open Space**: 11.5%
- **Edge Type**: sealed
- **Difficulty**: medium
- **Accessibility**: 3.2% connected
- **Choke Points**: 170
- **Strategic Depth**: 96%

### Notable Design Elements
- 19 isolated regions requiring strategic planning
- Multiple resource clusters encouraging expansion
- High hazard density creating environmental challenge
- Multiple strategic choke points

## Category Comparisons

### TUTORIAL Maps

**Patterns:**
- Average map size: 1323 tiles
- Primary difficulty: medium (3/3 maps)
- Average crystal density: 4.34%

**Insights:**
- Tutorial maps focus on teaching individual mechanics in isolation
- Resource abundance allows for experimentation without failure
- Simple objectives guide player learning

### CAMPAIGN Maps

**Patterns:**
- Average map size: 1920 tiles
- Primary difficulty: medium (3/3 maps)
- Average crystal density: 2.69%

**Insights:**
- Campaign maps progressively increase in complexity
- Resource scarcity creates strategic decision-making
- Environmental hazards add time pressure

### COMMUNITY Maps

**Patterns:**
- Average map size: 1293 tiles
- Primary difficulty: medium (3/3 maps)
- Average crystal density: 4.89%

**Insights:**
- Community maps showcase creative use of game mechanics
- Advanced scripting creates unique gameplay experiences
- Non-standard layouts challenge experienced players

### BAZ Maps

**Patterns:**
- Average map size: 1615 tiles
- Primary difficulty: medium (3/3 maps)
- Average crystal density: 3.07%

**Insights:**
- BAZ maps feature extreme challenges and unique mechanics
- Complex multi-stage objectives test all player skills
- Environmental storytelling through map design

## Design Principles

### 1. Progressive Complexity
Maps follow a clear progression from simple to complex:
- **Tutorial maps**: Single mechanic focus, abundant resources, clear objectives
- **Early campaign**: Multiple mechanics, balanced resources, environmental challenges
- **Late campaign**: Complex interactions, resource scarcity, time pressure
- **Community maps**: Creative combinations, unexpected challenges, mastery required

### 2. Resource Economy
Resource distribution follows deliberate patterns:
- **Clustered resources**: Encourage expansion and territory control
- **Sparse resources**: Force efficiency and planning
- **Hidden resources**: Reward exploration and risk-taking

### 3. Spatial Design
Map layouts create strategic depth:
- **Choke points**: Create defensible positions and routing decisions
- **Open areas**: Allow flexible base building
- **Isolated regions**: Require planning to access

### 4. Environmental Storytelling
Maps tell stories through their design:
- Pre-placed buildings suggest previous inhabitants
- Terrain features create narrative context
- Scripted events reveal plot elements

### 5. Challenge Scaling
Difficulty increases through multiple vectors:
- Hazard density and type
- Resource availability
- Time constraints (erosion, oxygen)
- Monster spawning rates
- Objective complexity

## Key Insights

### Tutorial Design Excellence
Tutorial maps demonstrate exceptional instructional design:
- Each map focuses on a single concept (buildings, vehicles, miners)
- Generous resources eliminate failure frustration
- Scripts provide guidance without hand-holding
- Map size is constrained to maintain focus

### Campaign Difficulty Curve
Campaign maps show careful difficulty calibration:
- Early maps (e.g., Driller Night) introduce hazards gradually
- Mid-game maps (e.g., Fire and Water) combine multiple challenges
- Late maps (e.g., Lava Laughter) require mastery of all mechanics
- Resource scarcity increases proportionally with player skill

### Community Creativity
Community maps push boundaries in several ways:
- Non-standard objectives using variable conditions
- Complex scripting creating puzzle-like scenarios
- Extreme terrain layouts testing pathfinding skills
- Creative use of tile combinations for visual effects

### BAZ Campaign Innovation
BAZ maps introduce advanced concepts:
- Multi-stage objectives requiring long-term planning
- Environmental hazards as core mechanics
- Narrative integration through scripted events
- Resource management as primary challenge

### Universal Design Patterns
Successful maps share common elements:
- Clear initial safe zone for base establishment
- Resource rewards for exploration
- Multiple viable strategies
- Visual landmarks for navigation
- Balanced risk/reward for hazardous areas

