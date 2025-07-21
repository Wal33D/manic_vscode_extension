# UI/UX Patterns

User interface and experience patterns for creating intuitive and engaging interactions in Manic Miners maps.

## Table of Contents
1. [Visual Feedback Systems](#visual-feedback-systems)
2. [HUD Information](#hud-information)
3. [Camera Control](#camera-control)
4. [Arrow Guidance](#arrow-guidance)
5. [Message Systems](#message-systems)
6. [Audio Feedback](#audio-feedback)

## Visual Feedback Systems

Create clear visual communication with players through various feedback mechanisms.

### Status Indicators
```
script{
    # Visual status system
    arrow HealthIndicator=green
    arrow DangerIndicator=red
    arrow WarningIndicator=yellow
    arrow ObjectiveIndicator=blue
    
    # Health status visualization
    when(miners<3)[ShowDanger]
    when(miners>=3 and miners<5)[ShowWarning]
    when(miners>=5)[ShowHealthy]
    
    ShowDanger::
    removearrow:HealthIndicator;
    removearrow:WarningIndicator;
    highlightarrow:5,5,DangerIndicator;
    msg:CriticalStatus;
    shake:2,2;
    
    ShowWarning::
    removearrow:HealthIndicator;
    removearrow:DangerIndicator;
    highlightarrow:5,5,WarningIndicator;
    
    ShowHealthy::
    removearrow:DangerIndicator;
    removearrow:WarningIndicator;
    highlightarrow:5,5,HealthIndicator;
    
    # Resource status
    when(crystals<10)[LowCrystalWarning]
    when(ore<10)[LowOreWarning]
    
    LowCrystalWarning::
    highlightarrow:7,5,WarningIndicator=yellow;
    msg:CrystalsLow;
    
    LowOreWarning::
    highlightarrow:9,5,WarningIndicator=yellow;
    msg:OreLow;
}
```

### Progress Visualization
```
script{
    # Visual progress bars using tiles
    int Progress=0
    int MaxProgress=10
    
    # Update progress bar
    UpdateProgressBar::
    # Clear old bar
    place:10,5,1;
    place:10,6,1;
    place:10,7,1;
    place:10,8,1;
    place:10,9,1;
    place:10,10,1;
    place:10,11,1;
    place:10,12,1;
    place:10,13,1;
    place:10,14,1;
    
    # Draw new bar
    if(Progress>=1)[place:10,5,14];   # Building path as progress
    if(Progress>=2)[place:10,6,14];
    if(Progress>=3)[place:10,7,14];
    if(Progress>=4)[place:10,8,14];
    if(Progress>=5)[place:10,9,14];
    if(Progress>=6)[place:10,10,14];
    if(Progress>=7)[place:10,11,14];
    if(Progress>=8)[place:10,12,14];
    if(Progress>=9)[place:10,13,14];
    if(Progress>=10)[place:10,14,14];
    
    # Increment progress
    when(crystals>=10*Progress)[IncreaseProgress]
    
    IncreaseProgress::
    Progress:Progress+1;
    UpdateProgressBar::;
    msg:Progress+Progress+/+MaxProgress;
}
```

### Environmental State Changes
```
script{
    # Visual environment changes
    bool AlertMode=false
    bool SafeMode=true
    int LightingState=0  # 0=normal, 1=warning, 2=danger
    
    # Change environment based on threat
    when(creatures>5)[SetAlertMode]
    when(creatures==0)[SetSafeMode]
    
    SetAlertMode::
    AlertMode:true;
    SafeMode:false;
    LightingState:2;
    msg:AlertStatusRed;
    
    # Visual changes for alert
    shake:1,3;
    # Flash warning lights
    FlashWarnings::;
    
    FlashWarnings::
    highlightarrow:15,5,arrow=red;
    highlightarrow:15,25,arrow=red;
    highlightarrow:5,15,arrow=red;
    highlightarrow:25,15,arrow=red;
    wait:1;
    removearrow:arrow;
    wait:1;
    if(AlertMode==true)[FlashWarnings];
    
    SetSafeMode::
    AlertMode:false;
    SafeMode:true;
    LightingState:0;
    msg:AllClear;
    removearrow:arrow;
}
```

## HUD Information

Display critical information effectively without cluttering the interface.

### Dynamic Objective Display
```
script{
    # Smart objective system
    string PrimaryObjective="Establish base"
    string SecondaryObjective=""
    string UrgentObjective=""
    bool ShowingUrgent=false
    
    # Update objectives based on priority
    UpdateObjectiveDisplay::
    if(UrgentObjective!="" and ShowingUrgent==false)[ShowUrgent];
    else if(SecondaryObjective!="")[ShowSecondary];
    else[ShowPrimary];
    
    ShowUrgent::
    ShowingUrgent:true;
    objective:URGENT: +UrgentObjective;
    shake:1,1;
    
    ShowSecondary::
    objective:+SecondaryObjective;
    
    ShowPrimary::
    objective:+PrimaryObjective;
    
    # Set urgent objectives
    when(creatures>5)[SetCombatUrgent]
    when(crystals<5 and buildings.BuildingPowerStation_C>0)[SetResourceUrgent]
    
    SetCombatUrgent::
    UrgentObjective:"Defend against attack!";
    UpdateObjectiveDisplay::;
    
    SetResourceUrgent::
    UrgentObjective:"Critical resource shortage!";
    UpdateObjectiveDisplay::;
    
    # Clear urgent when resolved
    when(creatures==0 and UrgentObjective=="Defend against attack!")[ClearUrgent]
    when(crystals>20 and UrgentObjective=="Critical resource shortage!")[ClearUrgent]
    
    ClearUrgent::
    UrgentObjective:"";
    ShowingUrgent:false;
    UpdateObjectiveDisplay::;
}
```

### Information Hierarchy
```
script{
    # Layered information display
    int InfoLevel=1  # 1=basic, 2=detailed, 3=expert
    timer InfoUpdateTimer=5,5,5,UpdateInfo
    
    when(init)[StartInfoSystem]
    
    StartInfoSystem::
    starttimer:InfoUpdateTimer;
    
    UpdateInfo::
    if(InfoLevel==1)[ShowBasicInfo];
    else if(InfoLevel==2)[ShowDetailedInfo];
    else[ShowExpertInfo];
    
    ShowBasicInfo::
    msg:Crystals:+crystals;
    
    ShowDetailedInfo::
    msg:Crystals:+crystals+_Ore:+ore;
    msg:Buildings:+buildings+_Miners:+miners;
    
    ShowExpertInfo::
    msg:Resources_C:+crystals+_O:+ore+_S:+studs;
    msg:Units_M:+miners+_B:+buildings+_V:+vehicles;
    msg:Threats:+creatures+_Time:+time;
    
    # Let player toggle info level
    when(click:5,5)[CycleInfoLevel]
    
    CycleInfoLevel::
    InfoLevel:InfoLevel+1;
    if(InfoLevel>3)[InfoLevel:1];
    msg:InfoLevel+InfoLevel;
}
```

## Camera Control

Guide player attention through intelligent camera movement.

### Smart Camera System
```
script{
    # Camera management
    bool CameraLocked=false
    int LastCameraRow=15
    int LastCameraCol=15
    timer CameraReturnTimer=5
    
    # Pan to important events
    when(emerge:any)[PanToThreat]
    when(building.destroyed)[PanToDestruction]
    when(objective.complete)[PanToObjective]
    
    PanToThreat::
    if(CameraLocked==false)[DoPanToThreat];
    
    DoPanToThreat::
    # Store current position
    LastCameraRow:camera.row;
    LastCameraCol:camera.col;
    
    # Pan to threat
    pan:lastcreature.row,lastcreature.col;
    msg:ThreatDetected;
    shake:1,2;
    
    # Return after delay
    starttimer:CameraReturnTimer;
    
    when(CameraReturnTimer.expired)[ReturnCamera]
    
    ReturnCamera::
    pan:LastCameraRow,LastCameraCol;
    
    # Lock camera during critical moments
    when(boss.active)[LockCamera]
    
    LockCamera::
    CameraLocked:true;
    pan:boss.row,boss.col;
    
    when(boss.defeated)[UnlockCamera]
    
    UnlockCamera::
    CameraLocked:false;
}
```

### Cinematic Sequences
```
script{
    # Scripted camera movements
    bool CinematicActive=false
    int CinematicStep=0
    
    # Trigger cinematic
    when(crystals>=100 and CinematicActive==false)[StartCinematic]
    
    StartCinematic::
    CinematicActive:true;
    CinematicStep:1;
    msg:ImportantDiscovery;
    
    # Disable player control
    pause:;
    
    # Camera sequence
    CinematicSequence::;
    
    CinematicSequence::
    # Step 1: Pan to discovery
    pan:40,40;
    wait:2;
    
    # Step 2: Reveal secret
    place:40,40,1;  # Clear wall
    place:40,41,1;
    place:40,42,1;
    wait:1;
    
    # Step 3: Show treasure
    place:40,41,45;  # Energy crystal
    highlightarrow:40,41,arrow=green;
    msg:AncientTreasure;
    wait:3;
    
    # Step 4: Return control
    removearrow:arrow;
    pan:20,20;  # Back to base
    unpause:;
    CinematicActive:false;
}
```

## Arrow Guidance

Use arrows effectively to guide player attention and actions.

### Contextual Arrow System
```
script{
    # Arrow management
    arrow NavigationArrow=green
    arrow DangerArrow=red
    arrow ObjectiveArrow=blue
    arrow HintArrow=yellow
    int ActiveArrows=0
    
    # Navigation assistance
    when(time>60 and buildings==0)[ShowBuildHint]
    
    ShowBuildHint::
    highlightarrow:10,10,HintArrow;
    msg:GoodBuildLocation;
    ActiveArrows:ActiveArrows+1;
    
    # Remove when built
    when(buildings>0 and ActiveArrows>0)[RemoveBuildHint]
    
    RemoveBuildHint::
    removearrow:HintArrow;
    ActiveArrows:ActiveArrows-1;
    
    # Danger warnings
    when(creatures.nearby)[ShowDangerArrows]
    
    ShowDangerArrows::
    # Point to all nearby threats
    if(creature1.distance<10)[highlightarrow:creature1.row,creature1.col,DangerArrow];
    if(creature2.distance<10)[highlightarrow:creature2.row,creature2.col,DangerArrow];
    
    # Objective guidance
    when(objective.active)[ShowObjectiveArrow]
    
    ShowObjectiveArrow::
    highlightarrow:objective.row,objective.col,ObjectiveArrow;
    
    # Clean up arrows
    when(ActiveArrows>3)[CleanupArrows]
    
    CleanupArrows::
    removearrow:HintArrow;
    ActiveArrows:ActiveArrows-1;
}
```

### Arrow Animations
```
script{
    # Animated arrow effects
    arrow PulsingArrow=green
    bool PulseActive=false
    timer PulseTimer=1
    
    # Create pulsing effect
    when(important.event)[StartPulse]
    
    StartPulse::
    PulseActive:true;
    starttimer:PulseTimer;
    
    when(PulseTimer.expired and PulseActive==true)[PulseArrow]
    
    PulseArrow::
    # Toggle arrow
    if(arrow.visible)[removearrow:PulsingArrow];
    else[highlightarrow:target.row,target.col,PulsingArrow];
    
    starttimer:PulseTimer;
    
    # Rotating arrows for paths
    RotatingPathArrows::
    highlightarrow:10,10,arrow=green;
    wait:1;
    removearrow:arrow;
    highlightarrow:11,11,arrow=green;
    wait:1;
    removearrow:arrow;
    highlightarrow:12,12,arrow=green;
    wait:1;
    removearrow:arrow;
    # Loop back
    RotatingPathArrows::;
}
```

## Message Systems

Create effective communication with players through well-designed message systems.

### Message Queuing
```
script{
    # Message queue system
    string MessageQueue1=""
    string MessageQueue2=""
    string MessageQueue3=""
    int QueueLength=0
    timer MessageTimer=3
    bool ProcessingMessages=false
    
    # Add message to queue
    QueueMessage::
    if(MessageQueue1=="")[MessageQueue1:NewMessage];
    else if(MessageQueue2=="")[MessageQueue2:NewMessage];
    else if(MessageQueue3=="")[MessageQueue3:NewMessage];
    
    QueueLength:QueueLength+1;
    
    # Start processing if not already
    if(ProcessingMessages==false)[StartMessageProcessor];
    
    StartMessageProcessor::
    ProcessingMessages:true;
    starttimer:MessageTimer;
    
    # Process queue
    when(MessageTimer.expired and QueueLength>0)[ProcessNextMessage]
    
    ProcessNextMessage::
    # Show next message
    if(MessageQueue1!="")[ShowMessage1];
    else if(MessageQueue2!="")[ShowMessage2];
    else if(MessageQueue3!="")[ShowMessage3];
    
    ShowMessage1::
    msg:MessageQueue1;
    MessageQueue1:MessageQueue2;
    MessageQueue2:MessageQueue3;
    MessageQueue3:"";
    QueueLength:QueueLength-1;
    
    # Continue processing
    if(QueueLength>0)[starttimer:MessageTimer];
    else[ProcessingMessages:false];
}
```

### Contextual Messages
```
script{
    # Adaptive message system
    int PlayerSkillLevel=1
    bool VerboseMode=true
    int MessagesSeen=0
    
    # Skill-appropriate messages
    CrystalFoundMessage::
    if(PlayerSkillLevel==1)[msg:BeginnerCrystalFound];
    else if(PlayerSkillLevel==2)[msg:StandardCrystalFound];
    else[msg:ExpertCrystalFound];
    
    MessagesSeen:MessagesSeen+1;
    
    BeginnerCrystalFound::
    msg:GreatJobYouFoundCrystals;
    msg:CrystalsAreUsedForPower;
    
    StandardCrystalFound::
    msg:CrystalsCollected;
    
    ExpertCrystalFound::
    msg:+crystals;  # Just the number
    
    # Reduce verbosity over time
    when(MessagesSeen>20)[ReduceVerbosity]
    
    ReduceVerbosity::
    VerboseMode:false;
    PlayerSkillLevel:2;
    
    when(MessagesSeen>50)[MinimalMessages]
    
    MinimalMessages::
    PlayerSkillLevel:3;
}
```

## Audio Feedback

Use sound effects and audio cues to enhance the user experience.

### Audio Cue System
```
script{
    # Sound management
    bool SoundEnabled=true
    int AlertLevel=0
    timer AudioTimer=1
    
    # Different alert sounds
    when(creatures>0 and AlertLevel==0)[PlayCombatAlert]
    when(crystals<10 and AlertLevel==0)[PlayResourceAlert]
    when(building.destroyed)[PlayDestructionSound]
    
    PlayCombatAlert::
    if(SoundEnabled==true)[playsound:CombatAlert];
    AlertLevel:1;
    shake:1,1;
    
    PlayResourceAlert::
    if(SoundEnabled==true)[playsound:LowResource];
    AlertLevel:1;
    
    PlayDestructionSound::
    if(SoundEnabled==true)[playsound:Explosion];
    shake:2,2;
    
    # Ambient sounds
    when(SafeMode==true)[PlayAmbient]
    
    PlayAmbient::
    if(time%60==0)[playsound:CaveAmbient];
    
    # Victory fanfare
    when(objective.complete)[PlaySuccess]
    
    PlaySuccess::
    playsound:Success;
    wait:2;
    if(AllObjectivesComplete)[playsound:Victory];
    
    # Audio feedback for actions
    when(building.complete)[playsound:BuildComplete];
    when(crystals.collected)[playsound:CrystalCollect];
    when(upgrade.complete)[playsound:UpgradeComplete];
}
```

### Musical Cues
```
script{
    # Dynamic music system
    int MusicIntensity=1  # 1=calm, 2=tense, 3=combat
    string CurrentTrack="Exploration"
    
    # Change music based on game state
    when(creatures==0 and MusicIntensity!=1)[SetCalmMusic]
    when(creatures>0 and creatures<5 and MusicIntensity!=2)[SetTenseMusic]
    when(creatures>=5 and MusicIntensity!=3)[SetCombatMusic]
    
    SetCalmMusic::
    MusicIntensity:1;
    CurrentTrack:"Exploration";
    playsound:MusicCalm;
    
    SetTenseMusic::
    MusicIntensity:2;
    CurrentTrack:"Tension";
    playsound:MusicTense;
    
    SetCombatMusic::
    MusicIntensity:3;
    CurrentTrack:"Combat";
    playsound:MusicCombat;
    
    # Special music moments
    when(boss.appears)[PlayBossTheme]
    when(victory)[PlayVictoryTheme]
    
    PlayBossTheme::
    CurrentTrack:"BossBattle";
    playsound:MusicBoss;
    
    PlayVictoryTheme::
    CurrentTrack:"Victory";
    playsound:MusicVictory;
}
```

## Best Practices for UI/UX

1. **Consistency**: Use consistent visual language throughout
2. **Clarity**: Make information easy to understand at a glance
3. **Priority**: Show most important information prominently
4. **Feedback**: Respond to every player action
5. **Pacing**: Don't overwhelm with too much at once
6. **Accessibility**: Consider colorblind players with shapes/patterns
7. **Context**: Provide information when needed, hide when not
8. **Polish**: Small details make big differences
9. **Testing**: Watch new players to identify confusion
10. **Iteration**: Refine based on player feedback

## See Also
- [Common Patterns](common-patterns.md) - General scripting patterns
- [Tutorial Patterns](tutorial-patterns.md) - Teaching UI elements
- [Objective Patterns](objective-patterns.md) - Displaying goals effectively
- [Debugging Guide](../debugging.md) - Testing UI systems