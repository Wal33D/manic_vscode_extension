# Manic Miners Map Design Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Core Design Principles](#core-design-principles)
3. [Map Structure Fundamentals](#map-structure-fundamentals)
4. [Resource Distribution](#resource-distribution)
5. [Difficulty Progression](#difficulty-progression)
6. [Scripting for Gameplay](#scripting-for-gameplay)
7. [Environmental Hazards](#environmental-hazards)
8. [Testing and Balancing](#testing-and-balancing)
9. [Common Patterns](#common-patterns)
10. [Examples from Official Maps](#examples-from-official-maps)

## Introduction

This guide provides comprehensive insights into designing engaging and balanced Manic Miners maps, based on analysis of tutorial, campaign, and community maps. Whether you're creating a simple tutorial or a complex challenge map, these principles will help you craft memorable experiences.

## Core Design Principles

### 1. Purpose-Driven Design
Every map should have a clear purpose:
- **Tutorial Maps**: Teach a single mechanic thoroughly
- **Campaign Maps**: Combine mechanics with increasing complexity
- **Challenge Maps**: Test mastery of specific skills
- **Puzzle Maps**: Present unique problems requiring creative solutions

### 2. Progressive Complexity
Maps should introduce challenges gradually:
```
Simple → Compound → Complex → Mastery
```

**Example Progression:**
1. Collect crystals (simple)
2. Collect crystals while avoiding lava (compound)
3. Collect crystals, avoid lava, manage oxygen (complex)
4. All above with time pressure and strategic routing (mastery)

### 3. Multiple Valid Strategies
Good maps offer multiple paths to victory:
- **Aggressive**: Rush objectives with minimal infrastructure
- **Defensive**: Build strong base before expanding
- **Exploratory**: Find hidden resources and shortcuts
- **Efficient**: Optimize resource usage and routing

## Map Structure Fundamentals

### Map Sizes and Complexity

| Size Category | Dimensions | Total Tiles | Best For |
|--------------|------------|-------------|----------|
| Small | 20x20 to 25x25 | 400-625 | Tutorials, focused challenges |
| Medium | 32x32 to 40x40 | 1024-1600 | Standard gameplay |
| Large | 40x48 to 64x64 | 1920-4096 | Epic adventures |
| Very Large | 80x80+ | 6400+ | Sandbox experiences |

### Starting Area Design

Every map needs a well-designed starting area:

```
Best Practice Starting Area (10x10):
38,38,38,38,38,38,38,38,38,38,
38,1,1,1,1,1,1,1,1,38,
38,1,1,1,1,1,1,1,1,38,
38,1,1,1,1,1,1,1,1,38,
38,1,1,1,1,1,1,1,1,38,
38,1,1,1,1,1,1,1,1,38,
38,1,1,1,1,1,1,1,1,38,
38,1,1,1,1,1,1,1,1,38,
38,1,1,1,1,1,1,1,1,38,
38,38,38,38,38,38,38,38,38,38,
```

**Key Elements:**
- 8x8 minimum buildable space
- Protected from hazards
- Access to initial resources
- Clear expansion paths

### Spatial Composition

Effective maps balance different area types:
- **Open Space**: 10-20% for building and maneuvering
- **Walls**: 70-80% to create structure
- **Resources**: 3-5% for balanced economy
- **Hazards**: 5-10% for challenge

## Resource Distribution

### Crystal and Ore Placement

**Resource Density Guidelines:**
- **Tutorial**: 5-8% combined resource tiles
- **Easy**: 4-6% combined resource tiles
- **Medium**: 3-4% combined resource tiles
- **Hard**: 2-3% combined resource tiles
- **Expert**: <2% combined resource tiles

### Distribution Patterns

#### 1. Clustered Resources
Encourages territorial expansion:
```
34,42,43,42,34,
42,43,44,43,42,
43,44,45,44,43,
42,43,44,43,42,
34,42,43,42,34,
```

#### 2. Linear Resources
Creates pathways and routes:
```
38,42,38,38,38,
38,42,38,38,38,
38,42,38,38,38,
38,42,38,38,38,
38,42,38,38,38,
```

#### 3. Scattered Resources
Forces exploration:
```
38,38,42,38,38,
38,38,38,38,46,
42,38,38,38,38,
38,38,46,38,38,
38,38,38,38,42,
```

### Initial Resources

**Recommended Starting Resources:**
- **Tutorial**: 50+ crystals, 50+ ore
- **Easy**: 20-30 crystals, 30-40 ore
- **Medium**: 10-20 crystals, 20-30 ore
- **Hard**: 5-10 crystals, 10-20 ore
- **Expert**: 0-5 crystals, 5-10 ore

## Difficulty Progression

### Difficulty Factors

1. **Resource Scarcity**
   - Starting resources
   - Resource density
   - Resource accessibility

2. **Environmental Hazards**
   - Lava (instant death)
   - Water (impassable)
   - Erosion (expanding lava)
   - Landslides (falling rocks)

3. **Time Pressure**
   - Erosion rate
   - Oxygen depletion
   - Scripted timers

4. **Objective Complexity**
   - Simple: Collect X resources
   - Medium: Build specific buildings
   - Complex: Multi-stage objectives
   - Expert: Variable-based conditions

### Difficulty Curve Example

**Early Game (0-25% completion):**
- Abundant resources
- Minimal hazards
- Simple objectives

**Mid Game (25-75% completion):**
- Balanced resources
- Introduced hazards
- Compound objectives

**Late Game (75-100% completion):**
- Scarce resources
- Multiple hazards
- Complex objectives

## Scripting for Gameplay

### Essential Script Patterns

#### 1. Welcome Message
```
script{
  if(init)[Welcome]
  
  Welcome::
  msg:WelcomeMessage;
}
```

#### 2. Progressive Objectives
```
script{
  int Stage=0
  
  when(crystals>=10 and Stage==0)[Stage1Complete]
  when(buildings.BuildingPowerStation_C>0 and Stage==1)[Stage2Complete]
  
  Stage1Complete::
  Stage:1;
  msg:Stage1Done;
  objective:BuildPowerStation;
  
  Stage2Complete::
  Stage:2;
  msg:Stage2Done;
  win:;
}
```

#### 3. Hidden Rewards
```
script{
  bool SecretFound=false
  
  when(drill:20,20 and SecretFound==false)[FindSecret]
  
  FindSecret::
  SecretFound:true;
  crystals:50;
  msg:SecretCrystalCache;
}
```

#### 4. Dynamic Hazards
```
script{
  when(time>300)[IncreaseChallenge]
  
  IncreaseChallenge::
  emerge:15,15,CreatureRockMonster_C;
  generatelandslide:10,10,5;
  msg:DangerIncreasing;
}
```

### Script Complexity Guidelines

| Map Type | Variables | Event Chains | Triggers |
|----------|-----------|--------------|----------|
| Basic | 0-5 | 0-3 | 0-5 |
| Standard | 5-15 | 3-10 | 5-15 |
| Advanced | 15-50 | 10-30 | 15-40 |
| Expert | 50+ | 30+ | 40+ |

## Environmental Hazards

### Hazard Types and Usage

#### 1. Lava (Tiles 6, 7)
- **Purpose**: Area denial, routing challenges
- **Usage**: 5-10% of map for medium difficulty
- **Patterns**: Rivers, lakes, scattered pools

#### 2. Water (Tile 11)
- **Purpose**: Impassable barriers, routing puzzles
- **Usage**: 3-8% of map
- **Patterns**: Rivers, moats, lakes

#### 3. Erosion (Tile 10)
- **Purpose**: Time pressure, dynamic challenge
- **Usage**: Sparingly, near lava
- **Erosion rates**:
  - Slow: `erosionscale:0.5`
  - Normal: `erosionscale:1.0`
  - Fast: `erosionscale:2.0`

#### 4. Landslides
- **Purpose**: Dynamic hazards, area denial
- **Configuration**:
  ```
  landslidefrequency{
    10,10,5,30
  }
  ```

### Hazard Placement Principles

1. **Never block all paths** - Always leave alternate routes
2. **Telegraph danger** - Use visual cues before hazards
3. **Reward risk** - Place resources near hazards
4. **Progressive introduction** - Start safe, add danger

## Testing and Balancing

### Playtesting Checklist

- [ ] **Completable**: Can objectives be achieved?
- [ ] **Multiple strategies**: Are different approaches viable?
- [ ] **Resource balance**: Sufficient but not excessive?
- [ ] **Pacing**: Does difficulty increase appropriately?
- [ ] **Clarity**: Are objectives and hazards clear?
- [ ] **Fun factor**: Is it engaging throughout?

### Balance Metrics

1. **Time to Complete**
   - Tutorial: 5-15 minutes
   - Standard: 15-30 minutes
   - Epic: 30-60 minutes

2. **Resource Efficiency**
   - Should require 70-90% of available resources
   - Leave room for error but require planning

3. **Failure Points**
   - Identify where players might fail
   - Ensure failure teaches lessons
   - Provide recovery opportunities

## Common Patterns

### The Expansion Pattern
Start small, grow outward:
```
Phase 1: Secure starting area
Phase 2: Establish resource flow
Phase 3: Expand to new regions
Phase 4: Complete objectives
```

### The Gauntlet Pattern
Linear progression through challenges:
```
Safe → Challenge 1 → Reward → Challenge 2 → Reward → Boss Challenge → Victory
```

### The Hub Pattern
Central base with radiating challenges:
```
       Goal 1
         |
Goal 2--Base--Goal 3
         |
       Goal 4
```

### The Puzzle Pattern
Specific sequence required:
```
1. Find key resource
2. Build specific building
3. Access new area
4. Complete objective
```

## Examples from Official Maps

### Tutorial Excellence: "Tutorial: Buildings"
- **Focus**: Single mechanic (building construction)
- **Resources**: Abundant (8 crystals, 57 ore start)
- **Scripting**: Complex guidance system
- **Lesson**: Clear focus with generous resources

### Campaign Classic: "Driller Night"
- **Size**: 32x32 (medium)
- **Objectives**: Find building, collect 5 crystals
- **Challenge**: Introduction to hazards
- **Lesson**: Gradual complexity increase

### Community Creativity: "Lost Leader"
- **Scripting**: Progressive building unlocks
- **Design**: Non-linear exploration
- **Challenge**: Resource management
- **Lesson**: Creative use of game mechanics

## Best Practices Summary

1. **Start with purpose** - Know what experience you want to create
2. **Respect the learning curve** - Build complexity gradually
3. **Reward exploration** - Hide secrets and bonuses
4. **Test thoroughly** - Play your map multiple ways
5. **Consider accessibility** - Not everyone is an expert
6. **Tell a story** - Use environment and scripts for narrative
7. **Balance challenge and fun** - Difficulty should enhance, not frustrate
8. **Provide feedback** - Use messages to guide and congratulate
9. **Polish the details** - Small touches make big differences
10. **Have fun creating** - Your enthusiasm will show in the design

## Conclusion

Great map design in Manic Miners combines technical understanding with creative vision. Use these principles as guidelines, but don't be afraid to experiment and create unique experiences. The best maps are those that surprise and delight players while providing fair, engaging challenges.

Remember: Every great map started with someone asking "What if...?"