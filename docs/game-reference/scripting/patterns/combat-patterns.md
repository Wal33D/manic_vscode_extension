# Combat and Defense Patterns

Advanced patterns for creating engaging combat scenarios and defense mechanics in Manic Miners maps.

## Table of Contents
1. [Wave Defense Systems](#wave-defense-systems)
2. [Boss Battles](#boss-battles)
3. [Ambush Mechanics](#ambush-mechanics)
4. [Tower Defense](#tower-defense)
5. [Combat Arenas](#combat-arenas)
6. [Strategic Retreats](#strategic-retreats)

## Wave Defense Systems

Create escalating waves of enemies with increasing difficulty.

### Basic Wave System
```
script{
    # Wave configuration
    int CurrentWave=0
    int EnemiesPerWave=3
    int EnemiesAlive=0
    int WaveDelay=30
    timer WaveTimer=30
    bool WaveActive=false
    
    # Start waves
    when(init)[StartWaveSystem]
    
    StartWaveSystem::
    msg:PrepareForWaves;
    wait:5;
    starttimer:WaveTimer;
    
    # Spawn next wave
    when(WaveTimer.expired and WaveActive==false)[SpawnWave]
    
    SpawnWave::
    CurrentWave:CurrentWave+1;
    WaveActive:true;
    msg:Wave+CurrentWave+Incoming;
    
    # Calculate enemies for this wave
    EnemiesPerWave:3+CurrentWave*2;
    EnemiesAlive:EnemiesPerWave;
    
    # Spawn enemies at different locations
    SpawnEnemies::;
    
    SpawnEnemies::
    if(CurrentWave<=3)[SpawnBasicWave];
    else if(CurrentWave<=6)[SpawnMediumWave];
    else[SpawnHardWave];
    
    SpawnBasicWave::
    # Spawn rock monsters in a line
    emerge:10,10,CreatureRockMonster_C;
    wait:1;
    emerge:12,10,CreatureRockMonster_C;
    wait:1;
    emerge:14,10,CreatureRockMonster_C;
    
    SpawnMediumWave::
    # Mix of enemies
    emerge:10,10,CreatureRockMonster_C;
    emerge:20,20,CreatureRockMonster_C;
    emerge:15,15,CreatureLavaMonster_C;
    emerge:25,25,CreatureSlug_C;
    emerge:30,30,CreatureSlug_C;
    
    SpawnHardWave::
    # Surround the player
    emerge:5,15,CreatureLavaMonster_C;
    emerge:25,15,CreatureLavaMonster_C;
    emerge:15,5,CreatureLavaMonster_C;
    emerge:15,25,CreatureLavaMonster_C;
    # Add support enemies
    emerge:10,10,CreatureRockMonster_C;
    emerge:20,20,CreatureRockMonster_C;
    
    # Track kills
    when(creatures<EnemiesAlive)[EnemyKilled]
    
    EnemyKilled::
    EnemiesAlive:creatures;
    
    # Wave complete when all dead
    when(creatures==0 and WaveActive==true)[WaveComplete]
    
    WaveComplete::
    WaveActive:false;
    msg:WaveDefeated;
    
    # Rewards scale with wave
    crystals:CurrentWave*10;
    ore:CurrentWave*5;
    
    # Prepare next wave
    if(CurrentWave<10)[starttimer:WaveTimer];
    else[VictoryAchieved];
    
    VictoryAchieved::
    msg:AllWavesDefeated;
    crystals:100;
    win:;
}
```

### Dynamic Wave Spawning
```
script{
    # Spawn points management
    int SpawnPointCount=4
    bool SpawnNorth=true
    bool SpawnSouth=true
    bool SpawnEast=true
    bool SpawnWest=true
    
    # Randomize spawn locations
    DynamicSpawn::
    # Clear previous settings
    SpawnNorth:false;
    SpawnSouth:false;
    SpawnEast:false;
    SpawnWest:false;
    
    # Randomly enable spawn points
    if(random>50)[SpawnNorth:true];
    if(random>50)[SpawnSouth:true];
    if(random>50)[SpawnEast:true];
    if(random>50)[SpawnWest:true];
    
    # Ensure at least one spawn point
    if(SpawnNorth==false and SpawnSouth==false and SpawnEast==false and SpawnWest==false)[SpawnNorth:true];
    
    # Spawn based on active points
    if(SpawnNorth==true)[emerge:15,5,CreatureRockMonster_C];
    if(SpawnSouth==true)[emerge:15,25,CreatureRockMonster_C];
    if(SpawnEast==true)[emerge:25,15,CreatureRockMonster_C];
    if(SpawnWest==true)[emerge:5,15,CreatureRockMonster_C];
}
```

## Boss Battles

Create memorable multi-phase boss encounters.

### Multi-Phase Boss
```
script{
    # Boss configuration
    int BossPhase=0
    int BossHealth=100
    bool BossActive=false
    bool BossDefeated=false
    timer BossActionTimer=5
    arrow BossLocation=red
    
    # Trigger boss fight
    when(crystals>=50 and BossActive==false)[AwakeBoss]
    
    AwakeBoss::
    BossActive:true;
    BossPhase:1;
    msg:BossAwakens;
    shake:2,3;
    
    # Dramatic entrance
    generatelandslide:20,20,3;
    wait:2;
    emerge:20,20,CreatureLavaMonster_C;
    highlightarrow:20,20,BossLocation;
    
    # Start boss AI
    starttimer:BossActionTimer;
    
    # Boss actions based on phase
    when(BossActionTimer.expired and BossActive==true)[BossAction]
    
    BossAction::
    if(BossPhase==1)[Phase1Action];
    else if(BossPhase==2)[Phase2Action];
    else if(BossPhase==3)[Phase3Action];
    starttimer:BossActionTimer;
    
    Phase1Action::
    # Basic attacks
    msg:BossRoars;
    shake:1,2;
    # Spawn minions
    emerge:18,18,CreatureRockMonster_C;
    emerge:22,22,CreatureRockMonster_C;
    
    Phase2Action::
    # More aggressive
    msg:BossEnraged;
    shake:2,2;
    # Area attack
    generatelandslide:20,20,5;
    # More minions
    emerge:15,20,CreatureRockMonster_C;
    emerge:25,20,CreatureRockMonster_C;
    emerge:20,15,CreatureSlug_C;
    emerge:20,25,CreatureSlug_C;
    
    Phase3Action::
    # Desperate attacks
    msg:BossFinalForm;
    shake:3,3;
    # Environmental hazards
    erosion:3.0;
    # Spawn lava
    place:19,19,6;
    place:21,21,6;
    place:19,21,6;
    place:21,19,6;
    # Elite minions
    emerge:15,15,CreatureLavaMonster_C;
    emerge:25,25,CreatureLavaMonster_C;
    
    # Phase transitions
    when(creatures.CreatureLavaMonster_C==0 and BossPhase==1)[EnterPhase2]
    when(creatures.CreatureLavaMonster_C==0 and BossPhase==2)[EnterPhase3]
    when(creatures.CreatureLavaMonster_C==0 and BossPhase==3)[BossDefeatedEvent]
    
    EnterPhase2::
    BossPhase:2;
    msg:BossWeakened;
    wait:2;
    # Respawn boss with new behavior
    emerge:20,20,CreatureLavaMonster_C;
    # Heal player
    heal:all;
    crystals:25;
    
    EnterPhase3::
    BossPhase:3;
    msg:BossCritical;
    wait:2;
    # Final form
    emerge:20,20,CreatureLavaMonster_C;
    # Grant power-up
    crystals:50;
    ore:50;
    
    BossDefeatedEvent::
    BossActive:false;
    BossDefeated:true;
    removearrow:BossLocation;
    msg:BossDefeated;
    
    # Epic rewards
    crystals:200;
    ore:100;
    studs:20;
    
    # Victory sequence
    wait:3;
    msg:VictoryAchieved;
    win:;
}
```

### Boss Weak Points
```
script{
    # Boss with specific weak points
    bool WeakPointExposed=false
    timer WeakPointTimer=10
    arrow WeakPointArrow=yellow
    
    # Expose weak point periodically
    when(BossPhase>0)[StartWeakPointCycle]
    
    StartWeakPointCycle::
    starttimer:WeakPointTimer;
    
    when(WeakPointTimer.expired and WeakPointExposed==false)[ExposeWeakPoint]
    
    ExposeWeakPoint::
    WeakPointExposed:true;
    msg:WeakPointExposed;
    # Show vulnerable spot
    place:22,20,42;  # Crystal seam as weak point
    highlightarrow:22,20,WeakPointArrow;
    
    # Limited time window
    wait:5;
    if(WeakPointExposed==true)[HideWeakPoint];
    
    HideWeakPoint::
    WeakPointExposed:false;
    place:22,20,38;  # Back to solid rock
    removearrow:WeakPointArrow;
    starttimer:WeakPointTimer;
    
    # Hitting weak point
    when(drill:22,20 and WeakPointExposed==true)[WeakPointHit]
    
    WeakPointHit::
    msg:CriticalHit;
    shake:3,2;
    # Deal massive damage
    BossHealth:BossHealth-25;
    
    # Force hide weak point
    HideWeakPoint::;
}
```

## Ambush Mechanics

Create surprise encounters and tactical ambushes.

### Triggered Ambushes
```
script{
    # Ambush zones
    bool Ambush1Triggered=false
    bool Ambush2Triggered=false
    bool Ambush3Triggered=false
    
    # Narrow pass ambush
    when(enter:15,10 and Ambush1Triggered==false)[TriggerAmbush1]
    
    TriggerAmbush1::
    Ambush1Triggered:true;
    msg:Ambush;
    shake:1,1;
    
    # Enemies appear from sides
    emerge:13,10,CreatureRockMonster_C;
    emerge:17,10,CreatureRockMonster_C;
    
    # Block retreat
    place:15,9,38;   # Wall behind
    place:15,11,38;  # Wall ahead
    
    # Hidden room ambush
    when(drill:25,25 and Ambush2Triggered==false)[TriggerAmbush2]
    
    TriggerAmbush2::
    Ambush2Triggered:true;
    msg:TrapActivated;
    
    # Room fills with enemies
    emerge:24,24,CreatureSlug_C;
    emerge:26,24,CreatureSlug_C;
    emerge:24,26,CreatureSlug_C;
    emerge:26,26,CreatureSlug_C;
    emerge:25,25,CreatureLavaMonster_C;
    
    # Resource bait ambush
    when(crystals>=30 and Ambush3Triggered==false)[TriggerAmbush3]
    
    TriggerAmbush3::
    Ambush3Triggered:true;
    msg:TheyWereWaiting;
    
    # Surround the base
    emerge:5,5,CreatureRockMonster_C;
    emerge:5,25,CreatureRockMonster_C;
    emerge:25,5,CreatureRockMonster_C;
    emerge:25,25,CreatureRockMonster_C;
}
```

### Burrowing Enemies
```
script{
    # Enemies that appear from underground
    timer BurrowTimer=20,20,20,BurrowAttack
    int BurrowAttackCount=0
    
    when(init)[StartBurrowAttacks]
    
    StartBurrowAttacks::
    wait:30;  # Grace period
    starttimer:BurrowTimer;
    
    BurrowAttack::
    BurrowAttackCount:BurrowAttackCount+1;
    msg:GroundTrembles;
    shake:1,2;
    
    # Warning phase
    ShowBurrowWarning::;
    wait:3;
    
    # Emerge near player structures
    if(buildings.BuildingToolStore_C>0)[emerge:buildings.BuildingToolStore_C.row+2,buildings.BuildingToolStore_C.col+2,CreatureRockMonster_C];
    if(buildings.BuildingPowerStation_C>0)[emerge:buildings.BuildingPowerStation_C.row-2,buildings.BuildingPowerStation_C.col-2,CreatureRockMonster_C];
    
    ShowBurrowWarning::
    # Visual warnings where enemies will emerge
    place:buildings.BuildingToolStore_C.row+2,buildings.BuildingToolStore_C.col+2,30;  # Loose rock
    place:buildings.BuildingPowerStation_C.row-2,buildings.BuildingPowerStation_C.col-2,30;
}
```

## Tower Defense

Implement tower defense mechanics using buildings.

### Defense Network
```
script{
    # Track defense buildings
    int DefenseTowers=0
    int DefenseLevel=1
    bool DefenseActive=false
    timer DefenseTimer=5
    
    # Count defense structures
    when(buildings.BuildingMiningLaser_C>0)[UpdateDefenses]
    
    UpdateDefenses::
    DefenseTowers:buildings.BuildingMiningLaser_C;
    
    # Activate automated defense
    when(creatures>0 and DefenseActive==false)[ActivateDefenses]
    
    ActivateDefenses::
    DefenseActive:true;
    msg:DefensesOnline;
    starttimer:DefenseTimer;
    
    # Periodic defense actions
    when(DefenseTimer.expired and creatures>0)[DefenseAction]
    
    DefenseAction::
    # Damage nearest enemies
    if(DefenseTowers>=1)[DamageWave1];
    if(DefenseTowers>=2)[DamageWave2];
    if(DefenseTowers>=3)[DamageWave3];
    starttimer:DefenseTimer;
    
    DamageWave1::
    msg:LasersFiring;
    # Simulate laser damage
    shake:1,1;
    
    DamageWave2::
    # Enhanced damage
    shake:1,1;
    
    DamageWave3::
    # Maximum firepower
    shake:2,1;
    msg:MaximumFirepower;
    
    # Deactivate when clear
    when(creatures==0 and DefenseActive==true)[DeactivateDefenses]
    
    DeactivateDefenses::
    DefenseActive:false;
    stoptimer:DefenseTimer;
    msg:DefensesStandingDown;
}
```

### Upgrade System
```
script{
    # Defense upgrades
    int TowerLevel=1
    int UpgradeCost=50
    bool CanUpgrade=false
    
    # Check upgrade availability
    when(crystals>=UpgradeCost and TowerLevel<3)[ShowUpgrade]
    
    ShowUpgrade::
    CanUpgrade:true;
    msg:DefenseUpgradeAvailable;
    objective:Collect crystals to upgrade defenses;
    
    # Manual upgrade trigger
    when(crystals>=100 and TowerLevel==1 and CanUpgrade==true)[UpgradeToLevel2]
    
    UpgradeToLevel2::
    crystals:-100;
    TowerLevel:2;
    DefenseLevel:2;
    msg:DefensesUpgraded;
    UpgradeCost:200;
    
    # Visual feedback
    shake:1,2;
    highlightarrow:buildings.BuildingMiningLaser_C.row,buildings.BuildingMiningLaser_C.col,arrow=green;
    wait:2;
    removearrow:arrow;
    
    when(crystals>=200 and TowerLevel==2 and CanUpgrade==true)[UpgradeToLevel3]
    
    UpgradeToLevel3::
    crystals:-200;
    TowerLevel:3;
    DefenseLevel:3;
    msg:MaxDefenseLevel;
    
    # Super weapon unlocked
    allowbuilding:BuildingSuperTeleport_C;
}
```

## Combat Arenas

Create controlled combat environments.

### Arena Challenges
```
script{
    # Arena configuration
    bool ArenaActive=false
    int ArenaRound=0
    int ArenaKills=0
    timer ArenaTimer=60
    
    # Enter arena
    when(enter:20,20 and ArenaActive==false)[EnterArena]
    
    EnterArena::
    ArenaActive:true;
    ArenaRound:1;
    msg:ArenaChallenge;
    
    # Seal the arena
    place:18,18,38;
    place:18,22,38;
    place:22,18,38;
    place:22,22,38;
    
    # Start first round
    wait:3;
    StartArenaRound::;
    
    StartArenaRound::
    msg:Round+ArenaRound;
    starttimer:ArenaTimer;
    
    # Spawn enemies based on round
    if(ArenaRound==1)[SpawnRound1];
    else if(ArenaRound==2)[SpawnRound2];
    else if(ArenaRound==3)[SpawnRound3];
    else[SpawnBonusRound];
    
    SpawnRound1::
    emerge:19,19,CreatureRockMonster_C;
    emerge:21,21,CreatureRockMonster_C;
    
    SpawnRound2::
    emerge:19,19,CreatureRockMonster_C;
    emerge:21,21,CreatureRockMonster_C;
    emerge:20,20,CreatureLavaMonster_C;
    
    SpawnRound3::
    emerge:19,19,CreatureLavaMonster_C;
    emerge:21,21,CreatureLavaMonster_C;
    emerge:19,21,CreatureRockMonster_C;
    emerge:21,19,CreatureRockMonster_C;
    
    # Track kills
    when(creatures==0 and ArenaActive==true)[RoundComplete]
    
    RoundComplete::
    stoptimer:ArenaTimer;
    ArenaRound:ArenaRound+1;
    msg:RoundComplete;
    
    # Rewards
    crystals:ArenaRound*20;
    ore:ArenaRound*10;
    
    # Continue or complete
    if(ArenaRound<=5)[NextRound];
    else[ArenaComplete];
    
    NextRound::
    wait:5;
    StartArenaRound::;
    
    ArenaComplete::
    ArenaActive:false;
    msg:ArenaChampion;
    
    # Open arena
    place:18,18,1;
    place:18,22,1;
    place:22,18,1;
    place:22,22,1;
    
    # Grand prize
    crystals:200;
    studs:10;
}
```

## Strategic Retreats

Implement tactical retreat and regroup mechanics.

### Fallback Positions
```
script{
    # Retreat zones
    bool Retreating=false
    bool Position1Lost=false
    bool Position2Lost=false
    arrow RetreatArrow=yellow
    
    # Monitor defensive positions
    when(buildings.destroyed>2 and Position1Lost==false)[LosePosition1]
    
    LosePosition1::
    Position1Lost:true;
    Retreating:true;
    msg:FallBack;
    
    # Mark retreat path
    highlightarrow:15,15,RetreatArrow;
    highlightarrow:16,16,RetreatArrow;
    highlightarrow:17,17,RetreatArrow;
    
    # Spawn covering fire
    if(buildings.BuildingMiningLaser_C>0)[CoveringFire];
    
    # Second position
    when(enter:20,20 and Retreating==true)[ReachPosition2]
    
    ReachPosition2::
    Retreating:false;
    removearrow:RetreatArrow;
    msg:DefensivePositionEstablished;
    
    # Fortify new position
    place:19,19,38;  # Walls
    place:21,21,38;
    crystals:30;     # Emergency supplies
    
    CoveringFire::
    msg:CoveringFire;
    # Slow enemies
    emerge:10,10,CreatureSlug_C;  # Blocking creatures
    emerge:12,12,CreatureSlug_C;
}
```

### Guerrilla Tactics
```
script{
    # Hit and run tactics
    bool GuerrillaMode=false
    int AmbushCount=0
    timer HitTimer=15
    
    # Enable when outnumbered
    when(creatures>5 and miners<3)[EnableGuerrilla]
    
    EnableGuerrilla::
    GuerrillaMode:true;
    msg:GuerrillaTactics;
    
    # Quick strikes
    starttimer:HitTimer;
    
    when(HitTimer.expired and GuerrillaMode==true)[HitAndRun]
    
    HitAndRun::
    AmbushCount:AmbushCount+1;
    msg:Strike;
    
    # Brief attack window
    crystals:10;  # Quick resource grab
    
    # Trigger retreat
    wait:5;
    msg:Vanish;
    
    # Hide evidence
    undiscover:lastminer.row,lastminer.col;
    
    # Reposition
    starttimer:HitTimer;
}
```

## Best Practices for Combat

1. **Balance Challenge**: Scale difficulty with player progress
2. **Provide Warnings**: Telegraph attacks before they happen
3. **Reward Strategy**: Make tactical play more rewarding than brute force
4. **Vary Enemy Types**: Use different creatures for different roles
5. **Environmental Integration**: Use terrain in combat
6. **Recovery Options**: Allow players to heal/regroup between waves
7. **Clear Objectives**: Make combat goals obvious
8. **Epic Moments**: Create memorable set pieces
9. **Fair Difficulty**: Challenge without frustration
10. **Progressive Complexity**: Introduce mechanics gradually

## See Also
- [Common Patterns](common-patterns.md) - General scripting patterns
- [Defense Patterns](defense-patterns.md) - Base defense strategies
- [Boss Patterns](boss-patterns.md) - Advanced boss mechanics
- [Map Design Guide](../../map-design-guide.md) - Combat arena design