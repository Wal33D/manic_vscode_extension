# Air/Oxygen System

The air/oxygen system in Manic Miners provides an additional challenge layer by requiring players to manage oxygen levels for their miners.

## Map Types

There are two types of maps regarding air requirements:

### 1. Maps Without Air Requirement
- Miners do not consume air
- No oxygen management needed
- Map acts as if it has `oxygen:6000/6000` but consumption is disabled
- Air can still be modified via script

### 2. Maps With Air Requirement
- Activated by including `oxygen:` in the info section
- Miners consume air over time
- Air reaching 0 causes immediate game loss
- Requires active management through Support Stations

## Oxygen Configuration

Set in the info section:
```
info{
    oxygen:1000/1000;  # current/maximum
}
```

## Air Mechanics

### Consumption
- **Miners**: Consume 1 air per second each
- **Example**: 100 air supports:
  - 1 miner for 100 seconds
  - 10 miners for 10 seconds

### Generation
1. **Support Stations**: Generate 10 air per second each
   - One Support Station can sustain 10 miners indefinitely
   
2. **Cavern Discovery**: Returns 10 air per floor tile discovered
   - Air is returned over time (max 100 air/second)
   - Provides temporary relief while exploring

### Limits
- Air cannot exceed the maximum set in `oxygen:`
- Air cannot go below 0
- Reaching 0 air causes immediate map failure

## Scripting with Air

The `air` macro allows direct manipulation:

### Reading Air
```
when(air<200)[LowAirWarning];
((air<100))[CriticalAir];
```

### Modifying Air
```
# Add air
air:air+100;    # Add 100 air
air+=100;       # Shorthand addition

# Set specific value
air:2000;       # Set to exact amount

# Conditional air management
EventChainAddAirIfLow::
((air<200))air+=20;
```

### Important Notes
- Changes are instant (not gradual)
- Automatically capped at maximum
- Setting to 0 causes game loss (except in no-requirement maps)
- Negative values automatically become 0

## Strategy Tips

### For Map Creators
1. **Balance air consumption**: Consider number of expected miners
2. **Place Support Stations strategically**: Near main base and expansion areas
3. **Use cavern discovery**: Large hidden areas provide air boosts
4. **Script emergency air**: Add failsafes for critical situations

### For Players
1. **Priority build**: Support Stations before expanding miner count
2. **Explore actively**: Discovering caverns provides air
3. **Monitor consumption**: Each miner costs 1 air/second
4. **Emergency response**: Have a plan for low air situations

## Example Scenarios

### Basic Air Management
```
script{
    # Warning system
    bool LowAirWarned=false
    bool CriticalAirWarned=false
    
    when(air<500 and LowAirWarned==false)[WarnLowAir];
    when(air<200 and CriticalAirWarned==false)[WarnCriticalAir];
    
    WarnLowAir::
    LowAirWarned:true;
    msg:AirSupplyLow;
    
    WarnCriticalAir::
    CriticalAirWarned:true;
    msg:CriticalAirBuildSupport;
    # Emergency aid
    air+=100;
}
```

### Rewarding Efficient Players
```
script{
    # Bonus for maintaining high air
    when(time>300 and air>800)[EfficiencyBonus];
    
    EfficiencyBonus::
    msg:ExcellentAirManagement;
    crystals:50;
}
```

## See Also
- [Info Section](sections/info.md) - Setting oxygen levels
- [Buildings](sections/buildings.md) - Support Station placement
- [Objectives](sections/objectives.md) - Implicit air objective