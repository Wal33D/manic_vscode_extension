# Resource Management Patterns

Sophisticated patterns for resource economy, collection, and management in Manic Miners maps.

## Table of Contents
1. [Economy Systems](#economy-systems)
2. [Resource Generation](#resource-generation)
3. [Scarcity Mechanics](#scarcity-mechanics)
4. [Trading Systems](#trading-systems)
5. [Resource Conversion](#resource-conversion)
6. [Emergency Reserves](#emergency-reserves)

## Economy Systems

Create balanced economic systems that drive gameplay decisions.

### Dynamic Pricing System
```
script{
    # Market values
    int CrystalValue=10
    int OreValue=5
    int StudValue=50
    float MarketMultiplier=1.0
    
    # Supply and demand
    int CrystalSupply=0
    int OreSupply=0
    int Demand=10
    
    # Update market prices
    timer MarketTimer=30,30,30,UpdateMarket
    
    when(init)[StartEconomy]
    
    StartEconomy::
    msg:MarketOpen;
    starttimer:MarketTimer;
    
    UpdateMarket::
    # Track supply
    CrystalSupply:crystals;
    OreSupply:ore;
    
    # Adjust prices based on scarcity
    if(CrystalSupply<20)[CrystalValue:15];
    else if(CrystalSupply>50)[CrystalValue:8];
    else[CrystalValue:10];
    
    if(OreSupply<30)[OreValue:8];
    else if(OreSupply>80)[OreValue:3];
    else[OreValue:5];
    
    # Show market update
    msg:MarketUpdate;
    msg:CrystalPrice+CrystalValue;
    msg:OrePrice+OreValue;
    
    # Trading opportunities
    when(crystals>=10)[CanTradeCrystals]
    when(ore>=20)[CanTradeOre]
    
    CanTradeCrystals::
    objective:Trade crystals for +CrystalValue+ ore each;
    
    CanTradeOre::
    objective:Trade ore for bonus resources;
}
```

### Resource Tax System
```
script{
    # Taxation mechanics
    int TaxRate=10  # Percent
    int TaxCollected=0
    int TaxableIncome=0
    timer TaxTimer=60
    
    # Implement taxation
    when(init)[StartTaxation]
    
    StartTaxation::
    msg:TaxSystemActive;
    starttimer:TaxTimer;
    
    when(TaxTimer.expired)[CollectTaxes]
    
    CollectTaxes::
    # Calculate tax on current resources
    TaxableIncome:crystals+ore;
    TaxCollected:(TaxableIncome*TaxRate)/100;
    
    # Deduct taxes
    if(crystals>=TaxCollected)[DeductFromCrystals];
    else[DeductFromOre];
    
    # Restart timer
    starttimer:TaxTimer;
    
    DeductFromCrystals::
    crystals:-TaxCollected;
    msg:TaxesPaid+TaxCollected;
    
    # Provide services in return
    if(TaxCollected>20)[PublicServices];
    
    DeductFromOre::
    ore:-TaxCollected;
    msg:TaxesPaidInOre;
    
    PublicServices::
    msg:PublicServicesProvided;
    # Free repairs
    heal:all;
    # Infrastructure
    allowbuilding:BuildingPowerPath_C;
}
```

## Resource Generation

Implement renewable and depleting resource systems.

### Renewable Resources
```
script{
    # Regenerating crystal seams
    timer RegenTimer=30,30,30,RegenerateResources
    int RegenLocations=3
    bool Regen1Active=false
    bool Regen2Active=false
    bool Regen3Active=false
    
    when(init)[SetupRegeneration]
    
    SetupRegeneration::
    msg:RenewableResourcesActive;
    starttimer:RegenTimer;
    
    RegenerateResources::
    # Check each location
    CheckRegenSpot1::;
    CheckRegenSpot2::;
    CheckRegenSpot3::;
    
    CheckRegenSpot1::
    # If mined out, regenerate
    if(get:10,10!=42 and Regen1Active==false)[RegenSpot1];
    
    RegenSpot1::
    Regen1Active:true;
    msg:CrystalsRegenerating;
    # Visual effect
    place:10,10,30;  # Loose rock first
    wait:2;
    place:10,10,42;  # Then crystal
    Regen1Active:false;
    
    CheckRegenSpot2::
    if(get:20,20!=46 and Regen2Active==false)[RegenSpot2];
    
    RegenSpot2::
    Regen2Active:true;
    place:20,20,30;
    wait:2;
    place:20,20,46;  # Ore seam
    Regen2Active:false;
    
    CheckRegenSpot3::
    if(get:30,30!=42 and Regen3Active==false)[RegenSpot3];
    
    RegenSpot3::
    Regen3Active:true;
    # Rare regeneration
    if(random>80)[place:30,30,45];  # Energy crystal
    else[place:30,30,42];
    Regen3Active:false;
}
```

### Mining Efficiency System
```
script{
    # Track mining efficiency
    float MiningEfficiency=1.0
    int TotalMined=0
    int MiningLevel=1
    bool EfficiencyBonus=false
    
    # Monitor mining
    when(crystals>TotalMined)[CrystalsMined]
    
    CrystalsMined::
    TotalMined:crystals+ore;
    
    # Level up mining
    when(TotalMined>50 and MiningLevel==1)[MiningLevelUp]
    when(TotalMined>150 and MiningLevel==2)[MiningLevelUp]
    when(TotalMined>300 and MiningLevel==3)[MiningLevelUp]
    
    MiningLevelUp::
    MiningLevel:MiningLevel+1;
    MiningEfficiency:MiningEfficiency+0.25;
    msg:MiningImproved;
    
    # Apply efficiency bonus
    ApplyEfficiencyBonus::
    if(MiningLevel>=2)[crystals:5];
    if(MiningLevel>=3)[ore:5];
    if(MiningLevel>=4)[studs:1];
    
    # Efficiency events
    when(drill:any)[MiningAction]
    
    MiningAction::
    if(random<(MiningEfficiency*20))[BonusYield];
    
    BonusYield::
    msg:EfficientMining;
    crystals:MiningLevel*2;
}
```

## Scarcity Mechanics

Design systems around limited resources.

### Depleting Resources
```
script{
    # Global resource depletion
    int GlobalCrystals=200
    int GlobalOre=150
    int DepletionRate=1
    timer DepletionTimer=10
    
    when(init)[StartDepletion]
    
    StartDepletion::
    msg:ResourcesLimited;
    objective:Manage +GlobalCrystals+ crystals carefully;
    starttimer:DepletionTimer;
    
    # Natural depletion
    when(DepletionTimer.expired)[DepletResources]
    
    DepletResources::
    GlobalCrystals:GlobalCrystals-DepletionRate;
    GlobalOre:GlobalOre-DepletionRate;
    
    # Check critical levels
    if(GlobalCrystals<50)[ResourceWarning];
    if(GlobalCrystals<=0)[ResourcesDepleted];
    
    starttimer:DepletionTimer;
    
    ResourceWarning::
    msg:ResourcesCritical;
    shake:1,2;
    # Unlock desperate measures
    allowbuilding:BuildingOreRefinery_C;
    
    ResourcesDepleted::
    msg:AllResourcesDepleted;
    # Final countdown
    timer FinalTimer=60
    starttimer:FinalTimer;
    
    when(FinalTimer.expired)[GameOver]
    
    GameOver::
    msg:ColonyFailed;
    lose:;
    
    # Mining reduces global pool
    when(crystals>LastCrystalCount)[ReduceGlobal]
    
    ReduceGlobal::
    GlobalCrystals:GlobalCrystals-(crystals-LastCrystalCount);
    LastCrystalCount:crystals;
}
```

### Resource Rationing
```
script{
    # Rationing system
    int DailyAllowance=10
    int DaysElapsed=0
    bool RationingActive=true
    timer DayTimer=60  # 1 minute = 1 day
    
    when(init)[StartRationing]
    
    StartRationing::
    msg:RationingInEffect;
    starttimer:DayTimer;
    
    when(DayTimer.expired)[NewDay]
    
    NewDay::
    DaysElapsed:DaysElapsed+1;
    msg:Day+DaysElapsed;
    
    # Distribute rations
    if(RationingActive==true)[DistributeRations];
    starttimer:DayTimer;
    
    DistributeRations::
    crystals:DailyAllowance;
    ore:DailyAllowance/2;
    msg:RationsDistributed;
    
    # Morale system
    if(crystals<5)[LowMorale];
    if(crystals>30)[HighMorale];
    
    LowMorale::
    msg:MoraleLow;
    # Reduced efficiency
    DailyAllowance:8;
    
    HighMorale::
    msg:MoraleHigh;
    # Bonus productivity
    DailyAllowance:12;
}
```

## Trading Systems

Create inter-faction trading and bartering systems.

### Merchant Visits
```
script{
    # Trading post system
    bool MerchantPresent=false
    int MerchantInventory=50
    int TradeCount=0
    timer MerchantTimer=120
    arrow MerchantLocation=yellow
    
    when(init)[ScheduleMerchant]
    
    ScheduleMerchant::
    msg:MerchantsWillVisit;
    starttimer:MerchantTimer;
    
    when(MerchantTimer.expired)[MerchantArrives]
    
    MerchantArrives::
    MerchantPresent:true;
    MerchantInventory:50+random;
    msg:MerchantArrived;
    
    # Show merchant location
    highlightarrow:25,25,MerchantLocation;
    
    # Available trades
    ShowTradeOptions::;
    
    ShowTradeOptions::
    msg:TradeOptions;
    objective:10 crystals for 20 ore;
    objective:20 ore for 5 studs;
    objective:50 crystals for upgrade;
    
    # Trade crystals for ore
    when(crystals>=10 and MerchantPresent==true)[TradeCrystalsForOre]
    
    TradeCrystalsForOre::
    crystals:-10;
    ore:20;
    TradeCount:TradeCount+1;
    msg:TradeComplete;
    
    # Merchant leaves after time
    timer LeaveTimer=60
    starttimer:LeaveTimer;
    
    when(LeaveTimer.expired)[MerchantLeaves]
    
    MerchantLeaves::
    MerchantPresent:false;
    removearrow:MerchantLocation;
    msg:MerchantDeparted;
    
    # Schedule next visit
    starttimer:MerchantTimer;
}
```

### Faction Trading
```
script{
    # Multiple faction system
    int RockRaiderRep=50
    int AlienRep=0
    int MerchantRep=50
    
    # Trade affects reputation
    TradeWithRaiders::
    if(RockRaiderRep>30)[RaiderTradeAccepted];
    else[RaiderTradeRejected];
    
    RaiderTradeAccepted::
    crystals:-20;
    ore:40;
    RockRaiderRep:RockRaiderRep+5;
    msg:RaidersAppreciateTrade;
    
    RaiderTradeRejected::
    msg:InsufficientReputation;
    
    # Alien trades
    TradeWithAliens::
    if(AlienRep>50)[AlienTradeAccepted];
    else[BuildRepFirst];
    
    AlienTradeAccepted::
    ore:-50;
    studs:10;
    AlienRep:AlienRep+10;
    msg:AlienTechAcquired;
    
    BuildRepFirst::
    msg:AliensDistrusful;
    objective:Improve alien reputation;
    
    # Reputation events
    when(creatures.killed<5)[PeacefulBonus]
    when(creatures.killed>20)[HostilePenalty]
    
    PeacefulBonus::
    AlienRep:AlienRep+20;
    msg:AliensTrustYou;
    
    HostilePenalty::
    AlienRep:AlienRep-30;
    msg:AliensAngry;
}
```

## Resource Conversion

Transform resources between types with various mechanisms.

### Refinery System
```
script{
    # Resource conversion mechanics
    bool RefineryBuilt=false
    int ConversionRatio=2
    int RefineryLevel=1
    timer RefineTimer=10
    
    when(buildings.BuildingOreRefinery_C>0)[RefineryOnline]
    
    RefineryOnline::
    RefineryBuilt:true;
    msg:RefineryOperational;
    starttimer:RefineTimer;
    
    # Refining options
    when(RefineTimer.expired and ore>=20)[CanRefineOre]
    when(RefineTimer.expired and crystals>=30)[CanRefineCrystals]
    
    CanRefineOre::
    objective:Convert 20 ore to 10 crystals;
    starttimer:RefineTimer;
    
    # Auto-refine when critical
    if(crystals<5 and ore>=20)[AutoRefineOre];
    
    AutoRefineOre::
    ore:-20;
    crystals:10;
    msg:OreRefined;
    
    CanRefineCrystals::
    objective:Convert 30 crystals to rare materials;
    starttimer:RefineTimer;
    
    # Upgrade refinery
    when(buildings.BuildingOreRefinery_C.level>RefineryLevel)[UpgradeRefinery]
    
    UpgradeRefinery::
    RefineryLevel:buildings.BuildingOreRefinery_C.level;
    ConversionRatio:2-RefineryLevel*0.2;  # Better ratios
    msg:RefineryUpgraded;
}
```

### Transmutation System
```
script{
    # Magical resource conversion
    bool TransmuterActive=false
    int TransmutationPower=0
    int TransmuteCount=0
    
    # Unlock transmutation
    when(crystals>=100 and ore>=100)[UnlockTransmutation]
    
    UnlockTransmutation::
    TransmuterActive:true;
    msg:TransmutationDiscovered;
    objective:Experiment with transmutation;
    
    # Build power
    when(TransmuterActive==true)[ChargeTransmuter]
    
    ChargeTransmuter::
    TransmutationPower:TransmutationPower+1;
    
    # Transmutation recipes
    when(TransmutationPower>=10)[CanTransmute]
    
    CanTransmute::
    ShowTransmuteOptions::;
    
    ShowTransmuteOptions::
    msg:TransmutationReady;
    objective:Stone to Crystal (10 power);
    objective:Crystal to Stud (50 power);
    objective:Random transmutation (20 power);
    
    # Stone to crystal
    TransmuteStone::
    if(TransmutationPower>=10)[DoTransmuteStone];
    
    DoTransmuteStone::
    TransmutationPower:TransmutationPower-10;
    # Convert nearby stone
    place:20,20,42;  # Crystal seam
    msg:StoneTransmuted;
    TransmuteCount:TransmuteCount+1;
    
    # Random transmutation
    RandomTransmute::
    if(TransmutationPower>=20)[DoRandomTransmute];
    
    DoRandomTransmute::
    TransmutationPower:TransmutationPower-20;
    if(random>50)[crystals:random];
    else if(random>25)[ore:random];
    else[studs:1];
    msg:UnpredictableResults;
}
```

## Emergency Reserves

Implement backup resource systems for crisis management.

### Strategic Reserves
```
script{
    # Emergency stockpile
    int ReserveCrystals=0
    int ReserveOre=0
    int ReserveAccessCount=0
    bool EmergencyDeclared=false
    
    # Build reserves
    when(crystals>50)[AddToReserve]
    
    AddToReserve::
    # Store 10% in reserve
    ReserveCrystals:ReserveCrystals+5;
    crystals:-5;
    msg:AddedToReserves;
    
    # Emergency conditions
    when(crystals<10 and buildings.BuildingPowerStation_C>0)[DeclareEmergency]
    when(creatures>5 and crystals<20)[DeclareEmergency]
    when(ore<5 and buildings>3)[DeclareEmergency]
    
    DeclareEmergency::
    if(EmergencyDeclared==false)[FirstEmergency];
    
    FirstEmergency::
    EmergencyDeclared:true;
    msg:EmergencyDeclared;
    shake:2,3;
    
    # Release reserves
    ReleaseReserves::;
    
    ReleaseReserves::
    crystals:ReserveCrystals;
    ore:ReserveOre;
    ReserveCrystals:0;
    ReserveOre:0;
    ReserveAccessCount:ReserveAccessCount+1;
    msg:ReservesReleased;
    
    # One-time emergency supplies
    if(ReserveAccessCount==1)[FirstAid];
    
    FirstAid::
    msg:EmergencySupplies;
    crystals:25;
    ore:25;
    heal:all;
}
```

### Hidden Caches
```
script{
    # Secret resource stashes
    int CachesFound=0
    int TotalCaches=5
    bool Cache1Found=false
    bool Cache2Found=false
    bool Cache3Found=false
    bool Cache4Found=false
    bool Cache5Found=false
    
    # Hint system for caches
    when(crystals<20 and CachesFound<TotalCaches)[HintCache]
    
    HintCache::
    msg:SearchForHiddenCaches;
    
    # Show subtle hints
    if(Cache1Found==false)[highlight:10,15,yellow];
    else if(Cache2Found==false)[highlight:25,5,yellow];
    else if(Cache3Found==false)[highlight:40,40,yellow];
    
    # Cache discoveries
    when(drill:10,15 and Cache1Found==false)[FindCache1]
    
    FindCache1::
    Cache1Found:true;
    CachesFound:CachesFound+1;
    msg:CacheDiscovered;
    
    # Basic supplies
    crystals:30;
    ore:20;
    
    when(drill:25,5 and Cache2Found==false)[FindCache2]
    
    FindCache2::
    Cache2Found:true;
    CachesFound:CachesFound+1;
    msg:LargeCacheFound;
    
    # Better rewards
    crystals:50;
    ore:40;
    studs:2;
    
    # Super cache requires all others
    when(CachesFound==4)[RevealSuperCache]
    
    RevealSuperCache::
    msg:FinalCacheLocation;
    highlightarrow:50,50,arrow=green;
    
    when(drill:50,50 and Cache5Found==false)[FindSuperCache]
    
    FindSuperCache::
    Cache5Found:true;
    CachesFound:5;
    msg:MotherLodeDiscovered;
    
    # Massive rewards
    crystals:200;
    ore:150;
    studs:10;
}
```

## Best Practices for Resource Systems

1. **Balance Risk/Reward**: Higher risk should yield better resources
2. **Create Meaningful Choices**: Force players to prioritize
3. **Avoid Hoarding**: Encourage active resource use
4. **Provide Alternatives**: Multiple paths to acquire resources
5. **Clear Feedback**: Show resource changes clearly
6. **Emergency Options**: Always have a last resort
7. **Progressive Complexity**: Start simple, add depth
8. **Prevent Exploits**: Test edge cases thoroughly
9. **Reward Efficiency**: Make good play feel rewarding
10. **Tell a Story**: Resources should support narrative

## See Also
- [Common Patterns](common-patterns.md) - General scripting patterns
- [Economy Patterns](economy-patterns.md) - Advanced economic systems
- [Tutorial Patterns](tutorial-patterns.md) - Teaching resource management
- [Map Design Guide](../../map-design-guide.md) - Resource placement strategies