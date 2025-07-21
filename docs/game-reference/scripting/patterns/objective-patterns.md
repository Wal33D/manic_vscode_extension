# Objective and Goal Patterns

Advanced patterns for creating engaging objectives, multi-stage goals, and dynamic mission structures in Manic Miners maps.

## Table of Contents
1. [Dynamic Objectives](#dynamic-objectives)
2. [Multi-Stage Missions](#multi-stage-missions)
3. [Optional Objectives](#optional-objectives)
4. [Timed Challenges](#timed-challenges)
5. [Branching Paths](#branching-paths)
6. [Achievement Systems](#achievement-systems)

## Dynamic Objectives

Create objectives that adapt based on player actions and game state.

### Adaptive Goal System
```
script{
    # Dynamic objective tracking
    string CurrentObjective="Establish Base"
    int ObjectiveStage=0
    int PlayerPerformance=50  # 0-100 scale
    
    # Monitor player progress
    when(buildings.BuildingToolStore_C>0 and ObjectiveStage==0)[BaseEstablished]
    
    BaseEstablished::
    ObjectiveStage:1;
    PlayerPerformance:PlayerPerformance+10;
    
    # Adapt next objective based on performance
    if(PlayerPerformance>70)[SetAdvancedObjective];
    else if(PlayerPerformance>40)[SetNormalObjective];
    else[SetEasyObjective];
    
    SetAdvancedObjective::
    CurrentObjective:"Build advanced base with 3 power stations";
    objective:Build 3 Power Stations;
    msg:ImpressiveStart;
    
    SetNormalObjective::
    CurrentObjective:"Expand your base";
    objective:Build Power Station and Docks;
    msg:GoodProgress;
    
    SetEasyObjective::
    CurrentObjective:"Collect more resources";
    objective:Collect 20 crystals;
    msg:TakeYourTime;
    # Help struggling players
    crystals:10;
}
```

### Contextual Objectives
```
script{
    # Objectives based on current situation
    bool UnderAttack=false
    bool LowResources=false
    bool ExplorationNeeded=false
    string PriorityObjective=""
    
    # Continuous monitoring
    when(creatures>3)[SetDefenseObjective]
    when(crystals<10 and ore<10)[SetResourceObjective]
    when(discovered<50)[SetExploreObjective]
    
    SetDefenseObjective::
    UnderAttack:true;
    PriorityObjective:"Defend your base!";
    objective:Eliminate all creatures;
    msg:DefendYourBase;
    
    # Override other objectives
    LowResources:false;
    ExplorationNeeded:false;
    
    SetResourceObjective::
    if(UnderAttack==false)[ApplyResourceObjective];
    
    ApplyResourceObjective::
    LowResources:true;
    PriorityObjective:"Gather emergency resources";
    objective:Collect 20 crystals or 30 ore;
    msg:ResourcesCritical;
    
    SetExploreObjective::
    if(UnderAttack==false and LowResources==false)[ApplyExploreObjective];
    
    ApplyExploreObjective::
    ExplorationNeeded:true;
    PriorityObjective:"Explore new areas";
    objective:Discover 75% of the map;
    msg:ExplorationRequired;
}
```

## Multi-Stage Missions

Design complex missions with multiple interconnected stages.

### Sequential Mission Chain
```
script{
    # Mission stages
    int MissionStage=0
    bool Stage1Complete=false
    bool Stage2Complete=false
    bool Stage3Complete=false
    bool Stage4Complete=false
    
    # Mission briefing
    when(init)[MissionBriefing]
    
    MissionBriefing::
    msg:MissionBriefing;
    wait:3;
    msg:Stage1Objectives;
    StartStage1::;
    
    # Stage 1: Reconnaissance
    StartStage1::
    MissionStage:1;
    objective:Scout the eastern caves;
    highlightarrow:40,20,arrow=green;
    
    when(discovertile:40,20 and Stage1Complete==false)[CompleteStage1]
    
    CompleteStage1::
    Stage1Complete:true;
    removearrow:arrow;
    msg:ReconComplete;
    crystals:25;
    wait:2;
    StartStage2::;
    
    # Stage 2: Establish Outpost
    StartStage2::
    MissionStage:2;
    objective:Build outpost in eastern sector;
    msg:EstablishOutpost;
    
    # Check for building in correct area
    when(buildings.BuildingToolStore_C>0 and buildings.BuildingToolStore_C.col>35 and Stage2Complete==false)[CompleteStage2]
    
    CompleteStage2::
    Stage2Complete:true;
    msg:OutpostEstablished;
    ore:40;
    wait:2;
    StartStage3::;
    
    # Stage 3: Defend Position
    StartStage3::
    MissionStage:3;
    objective:Defend outpost from attack;
    msg:PrepareDefenses;
    
    # Spawn attack wave
    wait:10;
    emerge:38,20,CreatureRockMonster_C;
    emerge:42,20,CreatureRockMonster_C;
    emerge:40,18,CreatureLavaMonster_C;
    
    when(creatures==0 and Stage3Complete==false)[CompleteStage3]
    
    CompleteStage3::
    Stage3Complete:true;
    msg:DefenseSuccessful;
    studs:5;
    wait:2;
    StartStage4::;
    
    # Stage 4: Final Objective
    StartStage4::
    MissionStage:4;
    objective:Connect main base to outpost;
    msg:FinalStage;
    
    # Check for power connection
    when(buildings.BuildingToolStore_C.ispowered==true and Stage4Complete==false)[CompleteStage4]
    
    CompleteStage4::
    Stage4Complete:true;
    msg:MissionAccomplished;
    wait:3;
    win:;
}
```

### Parallel Mission Tracks
```
script{
    # Multiple objectives running simultaneously
    bool TrackAComplete=false
    bool TrackBComplete=false
    bool TrackCComplete=false
    int TracksCompleted=0
    
    when(init)[StartAllTracks]
    
    StartAllTracks::
    msg:ThreeObjectivesAvailable;
    StartTrackA::;
    StartTrackB::;
    StartTrackC::;
    
    # Track A: Economic
    StartTrackA::
    objective:A: Accumulate 100 crystals;
    
    when(crystals>=100 and TrackAComplete==false)[CompleteTrackA]
    
    CompleteTrackA::
    TrackAComplete:true;
    TracksCompleted:TracksCompleted+1;
    msg:EconomicObjectiveComplete;
    CheckAllTracks::;
    
    # Track B: Military
    StartTrackB::
    objective:B: Build 3 Mining Lasers;
    
    when(buildings.BuildingMiningLaser_C>=3 and TrackBComplete==false)[CompleteTrackB]
    
    CompleteTrackB::
    TrackBComplete:true;
    TracksCompleted:TracksCompleted+1;
    msg:MilitaryObjectiveComplete;
    CheckAllTracks::;
    
    # Track C: Exploration
    StartTrackC::
    objective:C: Discover all crystal seams;
    
    when(discovered>80 and TrackCComplete==false)[CompleteTrackC]
    
    CompleteTrackC::
    TrackCComplete:true;
    TracksCompleted:TracksCompleted+1;
    msg:ExplorationObjectiveComplete;
    CheckAllTracks::;
    
    # Check completion
    CheckAllTracks::
    if(TracksCompleted==1)[FirstTrackBonus];
    else if(TracksCompleted==2)[SecondTrackBonus];
    else if(TracksCompleted==3)[AllTracksComplete];
    
    FirstTrackBonus::
    msg:FirstObjectiveBonus;
    crystals:30;
    
    SecondTrackBonus::
    msg:SecondObjectiveBonus;
    ore:50;
    
    AllTracksComplete::
    msg:AllObjectivesComplete;
    studs:10;
    win:;
}
```

## Optional Objectives

Implement bonus objectives that reward skilled players.

### Hidden Objectives
```
script{
    # Secret objectives
    bool SecretObjectiveRevealed=false
    bool SecretObjectiveComplete=false
    int SecretsFound=0
    
    # Reveal secret objective under certain conditions
    when(buildings>5 and crystals>50)[RevealSecret]
    
    RevealSecret::
    if(SecretObjectiveRevealed==false)[ShowSecretObjective];
    
    ShowSecretObjective::
    SecretObjectiveRevealed:true;
    msg:SecretObjectiveUnlocked;
    objective:BONUS: Find the ancient artifact;
    
    # Place artifact
    place:45,45,45;  # Energy crystal (as artifact)
    highlightarrow:45,45,arrow=yellow;
    
    # Complete secret objective
    when(drill:45,45 and SecretObjectiveComplete==false)[CompleteSecret]
    
    CompleteSecret::
    SecretObjectiveComplete:true;
    removearrow:arrow;
    msg:ArtifactRecovered;
    
    # Bonus rewards
    crystals:100;
    studs:5;
    
    # Unlock special ending
    allowbuilding:BuildingSuperTeleport_C;
}
```

### Challenge Objectives
```
script{
    # Optional challenges for experienced players
    bool PerfectRun=true
    bool SpeedChallenge=false
    bool PacifistChallenge=true
    bool MinimalistChallenge=true
    timer SpeedTimer=300  # 5 minutes
    
    when(init)[SetupChallenges]
    
    SetupChallenges::
    msg:OptionalChallengesAvailable;
    starttimer:SpeedTimer;
    
    # Monitor challenges
    when(pilot.death)[PerfectRunFailed]
    when(creatures.killed>0)[PacifistFailed]
    when(buildings>3)[MinimalistFailed]
    when(SpeedTimer.expired)[SpeedChallengeFailed]
    
    PerfectRunFailed::
    if(PerfectRun==true)[LosePerfectRun];
    
    LosePerfectRun::
    PerfectRun:false;
    msg:PerfectRunFailed;
    
    PacifistFailed::
    if(PacifistChallenge==true)[LosePacifist];
    
    LosePacifist::
    PacifistChallenge:false;
    msg:PacifistChallengeFailed;
    
    MinimalistFailed::
    if(MinimalistChallenge==true)[LoseMinimalist];
    
    LoseMinimalist::
    MinimalistChallenge:false;
    msg:MinimalistChallengeFailed;
    
    SpeedChallengeFailed::
    SpeedChallenge:false;
    msg:SpeedChallengeFailed;
    
    # Check challenges on victory
    when(win)[CheckChallenges]
    
    CheckChallenges::
    if(PerfectRun==true)[msg:PerfectRunComplete;crystals:100];
    if(SpeedChallenge==true)[msg:SpeedChallengeComplete;studs:10];
    if(PacifistChallenge==true)[msg:PacifistComplete;ore:100];
    if(MinimalistChallenge==true)[msg:MinimalistComplete;crystals:150];
}
```

## Timed Challenges

Create time-pressure scenarios with countdown mechanics.

### Countdown Missions
```
script{
    # Main countdown timer
    timer MissionTimer=600  # 10 minutes
    bool TimerStarted=false
    int TimeWarnings=0
    
    when(init)[StartCountdown]
    
    StartCountdown::
    TimerStarted:true;
    msg:YouHave10Minutes;
    objective:Complete all objectives before time runs out;
    starttimer:MissionTimer;
    
    # Time warnings
    when(MissionTimer.remaining==300)[FiveMinuteWarning]
    when(MissionTimer.remaining==120)[TwoMinuteWarning]
    when(MissionTimer.remaining==60)[OneMinuteWarning]
    when(MissionTimer.remaining==30)[ThirtySecondWarning]
    
    FiveMinuteWarning::
    TimeWarnings:TimeWarnings+1;
    msg:FiveMinutesRemaining;
    shake:1,2;
    
    TwoMinuteWarning::
    TimeWarnings:TimeWarnings+1;
    msg:TwoMinutesRemaining;
    shake:2,2;
    # Increase tension
    playsound:Alarm;
    
    OneMinuteWarning::
    TimeWarnings:TimeWarnings+1;
    msg:OneMinuteRemaining;
    shake:2,3;
    # Emergency assistance
    crystals:20;
    msg:EmergencySupplies;
    
    ThirtySecondWarning::
    msg:ThirtySeconds;
    shake:3,3;
    # Last chance
    objective:HURRY!;
    
    # Timer expired
    when(MissionTimer.expired)[TimerExpired]
    
    TimerExpired::
    msg:TimeUp;
    wait:2;
    lose:;
    
    # Stop timer on victory
    when(AllObjectivesComplete==true)[VictoryAchieved]
    
    VictoryAchieved::
    stoptimer:MissionTimer;
    msg:MissionCompleteWithTime+MissionTimer.remaining;
    
    # Time bonus
    if(MissionTimer.remaining>300)[crystals:100;msg:TimeBonus];
}
```

### Race Against Time
```
script{
    # Escalating time pressure
    timer PhaseTimer=120
    int CurrentPhase=1
    bool RaceActive=true
    
    when(init)[StartRace]
    
    StartRace::
    msg:RaceAgainstTime;
    starttimer:PhaseTimer;
    SetPhase1Objective::;
    
    SetPhase1Objective::
    objective:Phase 1: Collect 20 crystals;
    
    # Phase completion
    when(crystals>=20 and CurrentPhase==1)[CompletePhase1]
    
    CompletePhase1::
    CurrentPhase:2;
    msg:Phase1Complete;
    
    # Reset timer with less time
    stoptimer:PhaseTimer;
    PhaseTimer:90;  # Less time for phase 2
    starttimer:PhaseTimer;
    SetPhase2Objective::;
    
    SetPhase2Objective::
    objective:Phase 2: Build Tool Store;
    
    when(buildings.BuildingToolStore_C>0 and CurrentPhase==2)[CompletePhase2]
    
    CompletePhase2::
    CurrentPhase:3;
    msg:Phase2Complete;
    
    # Even less time
    stoptimer:PhaseTimer;
    PhaseTimer:60;
    starttimer:PhaseTimer;
    SetPhase3Objective::;
    
    SetPhase3Objective::
    objective:Phase 3: Defeat 5 creatures;
    
    # Spawn creatures
    emerge:10,10,CreatureRockMonster_C;
    emerge:20,20,CreatureRockMonster_C;
    emerge:30,30,CreatureRockMonster_C;
    emerge:15,25,CreatureRockMonster_C;
    emerge:25,15,CreatureRockMonster_C;
    
    # Phase timer expires
    when(PhaseTimer.expired and RaceActive==true)[PhaseTimedOut]
    
    PhaseTimedOut::
    RaceActive:false;
    msg:PhaseFailedTimeOut;
    lose:;
}
```

## Branching Paths

Create missions where player choices affect the outcome.

### Choice-Based Objectives
```
script{
    # Decision points
    int PathChosen=0  # 0=undecided, 1=peaceful, 2=aggressive
    bool DecisionMade=false
    bool Path1Available=true
    bool Path2Available=true
    
    # Present choice
    when(crystals>=50 and DecisionMade==false)[PresentChoice]
    
    PresentChoice::
    msg:CriticalDecision;
    wait:2;
    msg:Path1Peaceful;
    msg:Path2Aggressive;
    objective:Choose your path;
    
    # Path indicators
    highlightarrow:10,10,arrow=green;  # Peaceful
    highlightarrow:30,30,arrow=red;    # Aggressive
    
    # Player chooses peaceful
    when(enter:10,10 and DecisionMade==false)[ChoosePeaceful]
    
    ChoosePeaceful::
    PathChosen:1;
    DecisionMade:true;
    removearrow:arrow;
    msg:PeacefulPathChosen;
    
    # Peaceful objectives
    PeacefulObjectives::;
    
    PeacefulObjectives::
    objective:Establish diplomatic relations;
    # No hostile creatures
    destroyall:creatures;
    # Trade opportunities
    crystals:30;
    ore:40;
    
    # Player chooses aggressive  
    when(enter:30,30 and DecisionMade==false)[ChooseAggressive]
    
    ChooseAggressive::
    PathChosen:2;
    DecisionMade:true;
    removearrow:arrow;
    msg:AggressivePathChosen;
    
    # Aggressive objectives
    AggressiveObjectives::;
    
    AggressiveObjectives::
    objective:Eliminate all opposition;
    # Spawn enemies
    emerge:15,15,CreatureLavaMonster_C;
    emerge:25,25,CreatureLavaMonster_C;
    # Combat rewards
    allowbuilding:BuildingMiningLaser_C;
    
    # Different endings based on path
    when(PathChosen==1 and PeacefulComplete==true)[PeacefulEnding]
    when(PathChosen==2 and AggressiveComplete==true)[AggressiveEnding]
    
    PeacefulEnding::
    msg:PeacefulVictory;
    studs:20;
    win:;
    
    AggressiveEnding::
    msg:ConquerorVictory;
    crystals:200;
    win:;
}
```

### Moral Choices
```
script{
    # Ethical decision system
    int MoralityScore=50  # 0=evil, 100=good
    int DecisionCount=0
    bool Dilemma1Active=false
    
    # First moral dilemma
    when(creatures>0 and Dilemma1Active==false)[PresentDilemma1]
    
    PresentDilemma1::
    Dilemma1Active:true;
    msg:CreaturesArePeaceful;
    objective:Spare or eliminate creatures?;
    
    # Track player choice
    when(creatures.killed>0 and Dilemma1Active==true)[ChoseViolence]
    when(time>120 and creatures>0 and Dilemma1Active==true)[ChoseMercy]
    
    ChoseViolence::
    MoralityScore:MoralityScore-20;
    DecisionCount:DecisionCount+1;
    msg:ViolentChoice;
    # Consequences
    emerge:20,20,CreatureLavaMonster_C;  # Revenge
    
    ChoseMercy::
    MoralityScore:MoralityScore+20;
    DecisionCount:DecisionCount+1;
    msg:MercifulChoice;
    # Rewards
    crystals:50;  # Creatures share resources
    
    # Ending based on morality
    when(win)[DetermineEnding]
    
    DetermineEnding::
    if(MoralityScore>=70)[GoodEnding];
    else if(MoralityScore<=30)[EvilEnding];
    else[NeutralEnding];
    
    GoodEnding::
    msg:HeroicEnding;
    studs:25;
    
    EvilEnding::
    msg:DarkEnding;
    crystals:300;
    
    NeutralEnding::
    msg:BalancedEnding;
    ore:200;
}
```

## Achievement Systems

Implement meta-objectives that span multiple playthroughs.

### Achievement Tracking
```
script{
    # Achievement flags
    bool FirstBlood=false
    bool Economist=false
    bool SpeedRunner=false
    bool Perfectionist=false
    bool Explorer=false
    int AchievementsEarned=0
    
    # Achievement triggers
    when(creatures.killed==1 and FirstBlood==false)[EarnFirstBlood]
    when(crystals>=200 and Economist==false)[EarnEconomist]
    when(time<300 and win and SpeedRunner==false)[EarnSpeedRunner]
    when(pilot.death==0 and win and Perfectionist==false)[EarnPerfectionist]
    when(discovered>95 and Explorer==false)[EarnExplorer]
    
    EarnFirstBlood::
    FirstBlood:true;
    AchievementsEarned:AchievementsEarned+1;
    msg:AchievementFirstBlood;
    crystals:10;
    
    EarnEconomist::
    Economist:true;
    AchievementsEarned:AchievementsEarned+1;
    msg:AchievementEconomist;
    ore:50;
    
    EarnSpeedRunner::
    SpeedRunner:true;
    AchievementsEarned:AchievementsEarned+1;
    msg:AchievementSpeedRunner;
    studs:5;
    
    EarnPerfectionist::
    Perfectionist:true;
    AchievementsEarned:AchievementsEarned+1;
    msg:AchievementPerfectionist;
    crystals:100;
    
    EarnExplorer::
    Explorer:true;
    AchievementsEarned:AchievementsEarned+1;
    msg:AchievementExplorer;
    ore:100;
    
    # Meta achievement
    when(AchievementsEarned>=5)[AllAchievements]
    
    AllAchievements::
    msg:MasterAchiever;
    studs:20;
}
```

### Progressive Challenges
```
script{
    # Escalating achievement tiers
    int CrystalCollectorTier=0
    int BuilderTier=0
    int WarriorTier=0
    
    # Crystal collection tiers
    when(crystals>=50 and CrystalCollectorTier==0)[CrystalTier1]
    when(crystals>=150 and CrystalCollectorTier==1)[CrystalTier2]
    when(crystals>=300 and CrystalCollectorTier==2)[CrystalTier3]
    
    CrystalTier1::
    CrystalCollectorTier:1;
    msg:CrystalCollectorBronze;
    ore:20;
    
    CrystalTier2::
    CrystalCollectorTier:2;
    msg:CrystalCollectorSilver;
    ore:50;
    
    CrystalTier3::
    CrystalCollectorTier:3;
    msg:CrystalCollectorGold;
    studs:3;
    
    # Building tiers
    when(buildings>=3 and BuilderTier==0)[BuilderTier1]
    when(buildings>=6 and BuilderTier==1)[BuilderTier2]
    when(buildings>=10 and BuilderTier==2)[BuilderTier3]
    
    BuilderTier1::
    BuilderTier:1;
    msg:BuilderBronze;
    crystals:25;
    
    BuilderTier2::
    BuilderTier:2;
    msg:BuilderSilver;
    crystals:50;
    
    BuilderTier3::
    BuilderTier:3;
    msg:BuilderGold;
    studs:5;
    
    # Show progress
    when(time%60==0)[ShowProgress]
    
    ShowProgress::
    msg:AchievementProgress;
    msg:CrystalTier+CrystalCollectorTier;
    msg:BuilderTier+BuilderTier;
    msg:WarriorTier+WarriorTier;
}
```

## Best Practices for Objectives

1. **Clear Communication**: Make objectives unambiguous
2. **Progress Indicators**: Show how close players are to completion
3. **Meaningful Rewards**: Make completing objectives worthwhile
4. **Variety**: Mix different objective types
5. **Player Agency**: Allow multiple ways to complete goals
6. **Pacing**: Balance urgent and long-term objectives
7. **Narrative Integration**: Connect objectives to story
8. **Accessibility**: Provide easier alternatives for stuck players
9. **Celebration**: Make completing objectives feel satisfying
10. **Replayability**: Include optional objectives for repeat plays

## See Also
- [Common Patterns](common-patterns.md) - General scripting patterns
- [Tutorial Patterns](tutorial-patterns.md) - Teaching through objectives
- [UI/UX Patterns](ui-ux-patterns.md) - Displaying objectives effectively
- [Map Design Guide](../../map-design-guide.md) - Objective placement in maps