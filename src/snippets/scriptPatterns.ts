/**
 * Script pattern snippets based on documentation
 */

export interface ScriptPattern {
  name: string;
  description: string;
  category: 'state' | 'objectives' | 'resources' | 'timing' | 'tutorial' | 'combat' | 'exploration';
  snippet: string;
}

export const SCRIPT_PATTERNS: ScriptPattern[] = [
  // State Management Patterns
  {
    name: 'Basic State Tracking',
    category: 'state',
    description: 'Track game progress with boolean flags',
    snippet: `script{
  bool IntroShown=false
  bool FirstObjectiveComplete=false
  bool BossDefeated=false
  
  # Show intro only once
  when(init and IntroShown==false)[ShowIntro]
  
  ShowIntro::
  IntroShown:true;
  msg:WelcomeMessage;
  objective:FirstObjective;
}`,
  },

  {
    name: 'Multi-Stage Progression',
    category: 'state',
    description: 'Use integers for complex state machines',
    snippet: `script{
  int QuestStage=0
  
  # Stage 0: Initial setup
  when(buildings.BuildingToolStore_C>0 and QuestStage==0)[Stage1]
  
  # Stage 1: Resource collection
  when(crystals>=\${1:20} and QuestStage==1)[Stage2]
  
  # Stage 2: Final objective
  when(buildings.BuildingPowerStation_C>0 and QuestStage==2)[Victory]
  
  Stage1::
  QuestStage:1;
  msg:Stage1Message;
  objective:Collect\${1:20}Crystals;
  
  Stage2::
  QuestStage:2;
  msg:Stage2Message;
  objective:BuildPowerStation;
  
  Victory::
  QuestStage:3;
  msg:VictoryMessage;
  win:;
}`,
  },

  // Objective Patterns
  {
    name: 'Sequential Objectives',
    category: 'objectives',
    description: 'Each objective unlocks the next',
    snippet: `script{
  # Objective flags
  bool Obj1Complete=false
  bool Obj2Complete=false
  bool Obj3Complete=false
  
  # Objective 1: Basic collection
  when(crystals>=\${1:10} and Obj1Complete==false)[CompleteObj1]
  
  CompleteObj1::
  Obj1Complete:true;
  msg:FirstObjectiveComplete;
  objective:BuildToolStore;
  
  # Objective 2: Building
  when(buildings.BuildingToolStore_C>0 and Obj1Complete==true and Obj2Complete==false)[CompleteObj2]
  
  CompleteObj2::
  Obj2Complete:true;
  msg:SecondObjectiveComplete;
  objective:DefendBase;
  emerge:15,15,A,CreatureRockMonster_C,5;
  
  # Objective 3: Combat
  when(creatures.CreatureRockMonster_C==0 and Obj2Complete==true and Obj3Complete==false)[CompleteObj3]
  
  CompleteObj3::
  Obj3Complete:true;
  msg:AllObjectivesComplete;
  win:;
}`,
  },

  // Resource Patterns
  {
    name: 'Hidden Resource Caches',
    category: 'resources',
    description: 'Reward exploration with resources',
    snippet: `script{
  # Track found caches
  bool Cache1Found=false
  bool Cache2Found=false
  bool Cache3Found=false
  int TotalCachesFound=0
  
  # Hidden cache locations
  when(drill:\${1:25},\${2:10} and Cache1Found==false)[FindCache1]
  when(drill:\${3:5},\${4:30} and Cache2Found==false)[FindCache2]
  when(drill:\${5:40},\${6:40} and Cache3Found==false)[FindCache3]
  
  FindCache1::
  Cache1Found:true;
  TotalCachesFound:TotalCachesFound+1;
  crystals:25;
  msg:FoundHiddenCrystals;
  
  FindCache2::
  Cache2Found:true;
  TotalCachesFound:TotalCachesFound+1;
  ore:30;
  msg:FoundHiddenOre;
  
  FindCache3::
  Cache3Found:true;
  TotalCachesFound:TotalCachesFound+1;
  crystals:15;
  ore:15;
  msg:FoundMixedCache;
  
  # Bonus for finding all
  when(TotalCachesFound==3)[AllCachesBonus]
  
  AllCachesBonus::
  msg:MasterExplorer;
  crystals:50;
}`,
  },

  // Timing Patterns
  {
    name: 'Basic Timer Challenge',
    category: 'timing',
    description: 'Simple countdown challenge',
    snippet: `script{
  timer MissionTimer=\${1:300}  # \${1:300} seconds
  bool TimerStarted=false
  
  when(init)[StartTimer]
  
  StartTimer::
  TimerStarted:true;
  starttimer:MissionTimer;
  msg:TimerStarted;
  objective:CompleteBeforeTimeout;
  
  # Warning messages
  when(MissionTimer.remaining==60)[OneMinuteWarning]
  when(MissionTimer.remaining==30)[ThirtySecondWarning]
  when(MissionTimer.expired)[TimeUp]
  
  OneMinuteWarning::
  msg:OneMinuteRemaining;
  
  ThirtySecondWarning::
  msg:ThirtySecondsLeft;
  
  TimeUp::
  msg:TimeExpired;
  lose:;
  
  # Victory condition
  when(\${2:crystals>=50})[Victory]
  
  Victory::
  stoptimer:MissionTimer;
  msg:CompletedInTime;
  win:;
}`,
  },

  {
    name: 'Escalating Difficulty',
    category: 'timing',
    description: 'Increasing difficulty over time',
    snippet: `script{
  # Difficulty increases over time
  when(time>120)[Difficulty1]
  when(time>240)[Difficulty2]
  when(time>360)[Difficulty3]
  
  Difficulty1::
  msg:DifficultyIncreasing;
  erosion:2.0;
  
  Difficulty2::
  msg:MonstersAwakening;
  emerge:\${1:10},\${2:10},A,CreatureRockMonster_C,5;
  emerge:\${3:20},\${4:20},A,CreatureRockMonster_C,5;
  
  Difficulty3::
  msg:FinalChallenge;
  generatelandslide:\${5:15},\${6:15},10;
  emerge:\${5:15},\${6:15},A,CreatureLavaMonster_C,5;
}`,
  },

  // Tutorial Patterns
  {
    name: 'Step-by-Step Tutorial',
    category: 'tutorial',
    description: 'Guide players through game mechanics',
    snippet: `script{
  bool Step1Done=false
  bool Step2Done=false
  arrow TutorialArrow=green
  
  when(init)[Start]
  
  # Step 1: Build Tool Store
  Start::
  msg:Step1Text;
  highlightarrow:\${1:10},\${2:10},TutorialArrow;
  objective:BuildToolStore;
  
  when(buildings.BuildingToolStore_C>0 and Step1Done==false)[CompleteStep1]
  
  CompleteStep1::
  Step1Done:true;
  removearrow:TutorialArrow;
  msg:Step1Complete;
  wait:2;
  StartStep2::;
  
  # Step 2: Collect resources
  StartStep2::
  msg:Step2Text;
  highlightarrow:\${3:15},\${4:15},TutorialArrow;
  objective:Collect10Crystals;
  
  when(crystals>=10 and Step2Done==false)[CompleteStep2]
  
  CompleteStep2::
  Step2Done:true;
  removearrow:TutorialArrow;
  msg:TutorialComplete;
  objective:CompleteTheMission;
}`,
  },

  // Combat Patterns
  {
    name: 'Wave Defense',
    category: 'combat',
    description: 'Create escalating enemy waves',
    snippet: `script{
  int WaveNumber=0
  int EnemiesInWave=3
  bool WaveActive=false
  
  when(init)[StartFirstWave]
  
  StartFirstWave::
  wait:30;
  StartWave::;
  
  StartWave::
  WaveNumber:WaveNumber+1;
  WaveActive:true;
  msg:WaveIncoming;
  spawncap:CreatureRockMonster_C,EnemiesInWave,EnemiesInWave+2;
  addrandomspawn:CreatureRockMonster_C,5,10;
  startrandomspawn:CreatureRockMonster_C;
  EnemiesInWave:EnemiesInWave+2;
  
  when(creatures.CreatureRockMonster_C==0 and WaveActive==true)[WaveComplete]
  
  WaveComplete::
  WaveActive:false;
  stoprandomspawn:CreatureRockMonster_C;
  msg:WaveDefeated;
  crystals:WaveNumber*10;
  wait:10;
  if(WaveNumber<5)[StartWave];
  if(WaveNumber==5)[Victory];
  
  Victory::
  msg:AllWavesComplete;
  win:;
}`,
  },

  {
    name: 'Boss Fight',
    category: 'combat',
    description: 'Multi-phase boss encounter',
    snippet: `script{
  # Boss fight system
  int BossPhase=0
  bool BossActive=false
  bool BossDefeated=false
  
  # Trigger boss fight
  when(drill:\${1:25},\${2:25} and BossActive==false)[StartBoss]
  
  StartBoss::
  BossActive:true;
  BossPhase:1;
  msg:BossAwakens;
  emerge:\${1:25},\${2:25},A,CreatureLavaMonster_C,5;
  objective:DefeatTheLavaMonster;
  
  # Phase transitions
  when(creatures.CreatureLavaMonster_C==0 and BossPhase==1)[Phase2]
  when(creatures.CreatureLavaMonster_C==0 and BossPhase==2)[Phase3]
  when(creatures.CreatureLavaMonster_C==0 and BossPhase==3)[BossVictory]
  
  Phase2::
  BossPhase:2;
  msg:BossEnraged;
  emerge:\${3:24},\${4:24},A,CreatureLavaMonster_C,5;
  emerge:\${5:26},\${6:26},A,CreatureRockMonster_C,5;
  
  Phase3::
  BossPhase:3;
  msg:BossFinalForm;
  emerge:\${1:25},\${2:25},A,CreatureLavaMonster_C,5;
  erosion:3.0;
  
  BossVictory::
  BossDefeated:true;
  msg:BossDefeatedMessage;
  crystals:100;
  objective:Victory;
  win:;
}`,
  },

  // Exploration Patterns
  {
    name: 'Discovery Rewards',
    category: 'exploration',
    description: 'Reward players for exploring',
    snippet: `script{
  bool Cave1Found=false
  bool Cave2Found=false
  bool Cave3Found=false
  int CavesFound=0
  
  when(discovertile[\${1:20},\${2:20}] and Cave1Found==false)[FoundCave1]
  when(discovertile[\${3:30},\${4:30}] and Cave2Found==false)[FoundCave2]
  when(discovertile[\${5:40},\${6:40}] and Cave3Found==false)[FoundCave3]
  
  FoundCave1::
  Cave1Found:true;
  CavesFound:CavesFound+1;
  msg:DiscoveredCave1;
  crystals:25;
  CheckAllCaves::;
  
  FoundCave2::
  Cave2Found:true;
  CavesFound:CavesFound+1;
  msg:DiscoveredCave2;
  ore:25;
  CheckAllCaves::;
  
  FoundCave3::
  Cave3Found:true;
  CavesFound:CavesFound+1;
  msg:DiscoveredCave3;
  studs:25;
  CheckAllCaves::;
  
  CheckAllCaves::
  if(CavesFound==3)[AllCavesBonus];
  
  AllCavesBonus::
  msg:AllCavesFound;
  ore:50;
  objective:MasterExplorer;
}`,
  },

  {
    name: 'Dynamic Map Changes',
    category: 'exploration',
    description: 'Modify the map based on player actions',
    snippet: `script{
  # Bridge building system
  bool BridgeBuilt=false
  
  when(drill:\${1:10},\${2:10} and BridgeBuilt==false)[BuildBridge]
  
  BuildBridge::
  BridgeBuilt:true;
  msg:BridgeConstructed;
  
  # Create bridge across water
  place:\${1:10},\${3:11},1;
  place:\${1:10},\${4:12},1;
  place:\${1:10},\${5:13},1;
  place:\${1:10},\${6:14},1;
  place:\${1:10},\${7:15},1;
  
  # Open new area
  place:\${8:10},\${9:16},1;
  drill:\${10:11},\${9:16};
  drill:\${11:12},\${9:16};
  
  # Reveal bonus
  place:\${10:11},\${12:17},42;  # Crystal seam
  msg:SecretAreaRevealed;
}`,
  },
];

/**
 * Get patterns by category
 */
export function getPatternsByCategory(category: ScriptPattern['category']): ScriptPattern[] {
  return SCRIPT_PATTERNS.filter(p => p.category === category);
}

/**
 * Search patterns by name or description
 */
export function searchPatterns(query: string): ScriptPattern[] {
  const lowerQuery = query.toLowerCase();
  return SCRIPT_PATTERNS.filter(
    p =>
      p.name.toLowerCase().includes(lowerQuery) || p.description.toLowerCase().includes(lowerQuery)
  );
}
