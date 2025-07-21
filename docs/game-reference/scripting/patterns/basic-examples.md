# Basic Scripting Examples

This page provides simple, practical examples to help you get started with Manic Miners scripting.

## Simple Message Example

Show a message when a wall is drilled:
```mms
script{
    when(drill:10,10)[msg:WallDrilled];
}
```

## Time-Based Events

Place a water tile after 30 seconds:
```mms
script{
    if(time>30)[place:20,20,11];
}
```

## Display Crystal Count

Show current crystal count with a label:
```mms
script{
    string s=""
    
    if(time>5)[ShowCrystals];
    
    ShowCrystals::
    s:"Crystals collected: ";
    s+=crystals;
    msg:s;
}
```

## Click Counter

Count and display clicks on a specific tile:
```mms
script{
    int counter=0
    string counterStr=""
    
    when(click:20,20)[IncrementCounter];
    
    IncrementCounter::
    counter+=1;
    counterStr:"Number of clicks: ";
    counterStr+=counter;
    msg:counterStr;
}
```

## Conditions Inside Event Chains

Drill multiple walls when specific conditions are met:
```mms
script{
    when(drill:20,20)[ExpandPassage];
    
    ExpandPassage::
    ((crystals>30))[drill:20,21];
    ((crystals>30))[drill:21,20];
    ((crystals>30))[drill:21,21];
}
```

## Named Unit Death Detection

Track when specific named units are destroyed:

### Named Miner Example
```mms
script{
    miner Charlie=5
    
    when(Charlie.dead)[CharlieDefeated];
    
    CharlieDefeated::
    msg:CharlieHasBeenDefeated;
    # Note: The variable Charlie can no longer be used after this
}
```

### Named Vehicle Example
```mms
script{
    vehicle Sofia=3
    
    when(Sofia.dead)[SofiaDestroyed];
    
    SofiaDestroyed::
    msg:SofiaHasBeenDestroyed;
}
```

## Class vs Named Unit Events

Understanding override behavior:
```mms
script{
    miner Charlie=5
    
    # This will NEVER trigger for Charlie:
    when(dead:miners)[MinerDied];
    
    # This WILL trigger for Charlie:
    when(Charlie.dead)[CharlieDied];
    
    # The named unit trigger overrides the class trigger
}
```

## Array Value Copying

Copy values between array elements:
```mms
script{
    intarray numbers
    
    if(init)[SetupArray];
    
    SetupArray::
    numbers[0]:100;
    numbers[1]:200;
    numbers[2]:300;
    
    # Copy value from index 1 to index 3
    numbers[3]:numbers[1];  # numbers[3] now equals 200
}
```

## Progressive Difficulty Example

Increase spawn rates over time:
```mms
script{
    if(time>60)[Phase2];
    if(time>120)[Phase3];
    
    Phase2::
    addrandomspawn:CreatureSmallSpider_C,20.0,40.0;
    startrandomspawn:CreatureSmallSpider_C;
    msg:DifficultyIncreased;
    
    Phase3::
    addrandomspawn:CreatureLavaMonster_C,30.0,60.0;
    startrandomspawn:CreatureLavaMonster_C;
    msg:MaximumDifficulty;
}
```

## Resource Reward Pattern

Give rewards when entering specific tiles:
```mms
script{
    bool RewardGiven=false
    
    when(enter:25,25:miners)((RewardGiven==false))[GiveReward];
    
    GiveReward::
    RewardGiven:true;
    crystals:50;
    ore:25;
    msg:SecretRewardFound;
}
```

## Emergency Alert System

Monitor multiple critical conditions:
```mms
script{
    when(air<50)[LowAirWarning];
    when(crystals<10)[LowCrystalWarning];
    when(miners==0)[NoMinersAlert];
    
    LowAirWarning::
    msg:WarningOxygenLow;
    
    LowCrystalWarning::
    msg:WarningCrystalsLow;
    
    NoMinersAlert::
    msg:CriticalNoMinersRemaining;
    lose:AllMinersLost;
}
```

## Tips for Beginners

1. **Start simple**: Test basic triggers before building complex logic
2. **Use descriptive names**: `PlayerEnteredZone` is better than `Event1`
3. **Test incrementally**: Add one feature at a time
4. **Watch for typos**: Script errors often come from simple spelling mistakes
5. **No spaces**: Remember the no-spaces-after-semicolons rule

## Common Patterns to Remember

- **One-time events**: Use `if` triggers or boolean flags
- **Repeated events**: Use `when` triggers
- **Timed sequences**: Combine `wait` events carefully (script continues during wait!)
- **State tracking**: Use boolean or integer variables
- **Resource checks**: Test conditions before giving rewards

## See Also
- [Common Patterns](common-patterns.md) - More advanced patterns
- [Variables](../syntax/variables.md) - Data storage reference
- [Events](../syntax/events.md) - Complete event list
- [Triggers](../syntax/triggers.md) - All trigger types