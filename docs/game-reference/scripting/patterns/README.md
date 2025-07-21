# Manic Miners Scripting Patterns

A comprehensive collection of battle-tested scripting patterns for creating engaging and efficient Manic Miners maps. These patterns are derived from analysis of official maps, community creations, and extensive testing.

## Pattern Categories

### 🎯 [Common Patterns](common-patterns.md)
Essential scripting patterns that every map creator should know. Includes state management, resource rewards, wave systems, and basic gameplay mechanics.

**Key Topics:**
- State Management & Tracking
- Progressive Objectives
- Resource Rewards & Hidden Caches
- Timed Challenges & Countdowns
- Building Progression
- Environmental Effects

### 🎓 [Tutorial Patterns](tutorial-patterns.md)
Patterns for creating effective tutorials and onboarding experiences that teach players game mechanics smoothly.

**Key Topics:**
- Guided Tutorial Systems
- Interactive Teaching Methods
- Progressive Mechanic Unlocking
- Hint & Help Systems
- Skill Verification
- Adaptive Difficulty

### ⚔️ [Combat Patterns](combat-patterns.md)
Advanced combat scenarios including wave defense, boss battles, and tactical combat systems.

**Key Topics:**
- Wave Defense Systems
- Multi-Phase Boss Battles
- Ambush Mechanics
- Tower Defense Elements
- Combat Arenas
- Strategic Retreats

### 💎 [Resource Patterns](resource-patterns.md)
Sophisticated resource management systems including economy, trading, and scarcity mechanics.

**Key Topics:**
- Dynamic Economy Systems
- Resource Generation & Depletion
- Scarcity & Rationing
- Trading & Merchant Systems
- Resource Conversion
- Emergency Reserves

### 🎯 [Objective Patterns](objective-patterns.md)
Creating engaging goals and missions with dynamic objectives, branching paths, and achievement systems.

**Key Topics:**
- Dynamic & Contextual Objectives
- Multi-Stage Mission Chains
- Optional & Hidden Objectives
- Timed Challenges
- Branching Story Paths
- Achievement Systems

### 🎨 [UI/UX Patterns](ui-ux-patterns.md)
User interface and experience patterns for clear communication and intuitive gameplay.

**Key Topics:**
- Visual Feedback Systems
- HUD Information Display
- Camera Control & Cinematics
- Arrow Guidance Systems
- Message Queuing & Display
- Audio Feedback & Music

### ⚡ [Performance Patterns](performance-patterns.md)
Optimization techniques for creating efficient scripts that run smoothly even with complex logic.

**Key Topics:**
- Trigger Optimization
- Event Chain Management
- State Machine Efficiency
- Memory Management
- Batch Operations
- Lazy Evaluation

## How to Use This Guide

### For Beginners
1. Start with [Common Patterns](common-patterns.md) to learn the basics
2. Review [Tutorial Patterns](tutorial-patterns.md) to understand teaching mechanics
3. Study [UI/UX Patterns](ui-ux-patterns.md) for player communication

### For Intermediate Creators
1. Explore [Combat Patterns](combat-patterns.md) for action sequences
2. Learn [Resource Patterns](resource-patterns.md) for economy design
3. Master [Objective Patterns](objective-patterns.md) for mission structure

### For Advanced Creators
1. Optimize with [Performance Patterns](performance-patterns.md)
2. Combine patterns from multiple categories
3. Create your own pattern variations

## Best Practices

### 1. Start Simple
Begin with basic patterns and gradually add complexity. Test each addition thoroughly before moving on.

### 2. Combine Patterns
The most engaging maps combine multiple patterns. For example:
- Tutorial + Combat = Teaching combat mechanics
- Resource + Objectives = Economic victory conditions
- UI/UX + Performance = Smooth, responsive gameplay

### 3. Test Thoroughly
- Test each pattern in isolation first
- Then test pattern interactions
- Finally, test the complete experience

### 4. Consider Your Audience
- Use Tutorial patterns for maps aimed at beginners
- Add Performance optimizations for complex maps
- Include UI/UX patterns for clarity

### 5. Document Your Scripts
```
script{
    # Economic victory condition pattern
    # Combines resource management with objectives
    int TargetWealth=1000
    int CurrentWealth=0
    bool VictoryAchieved=false
    
    # Track total wealth
    when(time%10==0)[CalculateWealth]
    
    CalculateWealth::
    CurrentWealth:crystals*10+ore*5+studs*100;
    
    # Check victory condition
    when(CurrentWealth>=TargetWealth and VictoryAchieved==false)[EconomicVictory]
    
    EconomicVictory::
    VictoryAchieved:true;
    msg:WealthTargetReached;
    win:;
}
```

## Pattern Quick Reference

| Pattern Type | Best For | Complexity | Performance Impact |
|-------------|----------|------------|-------------------|
| State Management | All maps | Low | Low |
| Progressive Objectives | Story maps | Medium | Low |
| Wave Defense | Action maps | Medium | Medium |
| Boss Battles | Climax events | High | Medium |
| Resource Economy | Strategy maps | High | Low |
| Tutorial Systems | Teaching maps | Medium | Low |
| UI Feedback | All maps | Low | Low |
| Performance Optimization | Complex maps | High | Very Low |

## Common Combinations

### "Tower Defense Map"
- Wave Defense (Combat)
- Resource Management (Resource)
- Building Progression (Common)
- Visual Feedback (UI/UX)

### "Story Campaign"
- Multi-Stage Missions (Objective)
- Branching Paths (Objective)
- Cinematic Camera (UI/UX)
- Tutorial Elements (Tutorial)

### "Survival Challenge"
- Resource Scarcity (Resource)
- Escalating Difficulty (Combat)
- Emergency Systems (Resource)
- Performance Optimization (Performance)

### "Puzzle Map"
- State Machines (Performance)
- Hidden Objectives (Objective)
- Hint Systems (Tutorial)
- Visual Guidance (UI/UX)

## Contributing

If you discover new patterns or improvements:
1. Test thoroughly in multiple scenarios
2. Document with clear examples
3. Include best practices and pitfalls
4. Share with the community

## See Also
- [Scripting Overview](../overview.md) - Basic scripting concepts
- [Debugging Guide](../debugging.md) - Testing and debugging scripts
- [Variables Reference](../variables.md) - Variable types and usage
- [Events Reference](../events.md) - Complete event listing
- [Map Design Guide](../../map-design-guide.md) - Overall map design principles