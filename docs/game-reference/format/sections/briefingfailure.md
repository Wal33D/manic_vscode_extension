# Briefing Failure Section

The `briefingfailure{}` section contains the defeat message displayed when the player fails the mission. This explains what went wrong and often encourages retry.

## Format

```
briefingfailure{
Mission failed, CADET.

The lava has overrun our position. All personnel have been evacuated.

We'll need to find another approach. Return for debriefing.
}
```

## Purpose

- **Confirm failure** - Clear mission has ended
- **Explain why** - What caused the failure
- **Soften defeat** - Reduce frustration
- **Encourage retry** - Hint at different strategies

## Content Guidelines

### Essential Elements
1. **Clear failure statement** - No ambiguity
2. **Reason for failure** - What went wrong
3. **Consequences** - Impact of failure (softened)
4. **Next steps** - Usually "try again"

### Tone
- **Understanding** - Missions are hard
- **Constructive** - Learn from failure
- **Encouraging** - You can do better
- **Not punishing** - Keep it light

## Failure Triggers

Common causes of mission failure:
- Running out of air
- Essential building destroyed
- Essential vehicle lost
- Essential miner teleported
- Script `lose:` event
- Time limit exceeded

## Examples

### Basic Failure
```
briefingfailure{
Mission failed, CADET.

Return to base for debriefing and try again.
}
```

### Timeout Failure
```
briefingfailure{
Time's up, CADET!

The evacuation deadline has passed. Corporate won't be happy about the lost equipment, but at least everyone made it out alive.

Study the cavern layout and try for a faster route next time.
}
```

### Resource Failure
```
briefingfailure{
Mission terminated, CADET.

Without enough crystals to power our teleporters, we can't extract the mining equipment. We'll have to abandon this site.

Perhaps a different drilling strategy would uncover more resources?
}
```

### Combat Failure
```
briefingfailure{
Overwhelming monster activity has forced evacuation, CADET!

The Rock Monsters proved too numerous. All personnel have been emergency teleported to safety.

Consider building defensive structures earlier next time. Those Sonic Blasters aren't just for show!
}
```

### Tutorial Failure
```
briefingfailure{
Don't worry, CADET - everyone struggles at first!

Let's review what happened and try again. Remember:
- Build Tool Stores near your starting position
- Power Stations need to be connected to buildings
- Keep your Rock Raiders fed and rested

You'll get it next time!
}
```

### Humorous Failure
```
briefingfailure{
Well CADET, that didn't go as planned...

On the bright side, you've discovered exactly how NOT to build a base next to an active lava flow.

The good news: Everyone survived (barely).
The bad news: Chief is NOT happy about his melted bulldozer.

Ready to try again?
}
```

## Softening Techniques

### Shared Responsibility
```
briefingfailure{
Mission failed, CADET. 

Our intelligence was incomplete - those caverns were far more dangerous than anticipated. 

Don't blame yourself. Regroup and try again.
}
```

### Learning Opportunity
```
briefingfailure{
Mission unsuccessful, CADET.

You've gathered valuable data about the cavern layout. Use this knowledge for your next attempt.

Every great Rock Raider fails before they succeed!
}
```

### Near Success
```
briefingfailure{
So close, CADET! Mission failed.

You collected 47 of the 50 required crystals - just three more and you would have succeeded!

You know what to do. Get back in there!
}
```

## Integration Tips

### Match Failure Type
Air ran out:
```
briefingfailure{
Emergency evacuation initiated - oxygen depleted!

We need to manage air supply more carefully, CADET.
}
```

Essential building lost:
```
briefingfailure{
Mission failed - Tool Store destroyed!

Without our headquarters, operations cannot continue.

Defend essential structures at all costs!
}
```

### Reference Objectives
Without stating them explicitly:
```
# Objective was 100 crystals
briefingfailure{
Insufficient resources collected, CADET.

We needed more to justify the operation costs.
}
```

### Hint at Solutions
```
briefingfailure{
The monsters overwhelmed our defenses, CADET.

Perhaps exploring the western caverns first would give us more time to prepare?
}
```

## Message Patterns

### The Evacuation
```
briefingfailure{
Emergency evacuation complete!

[What forced evacuation]

All personnel accounted for. Prepare for another attempt.
}
```

### The Analysis
```
briefingfailure{
Mission failed, CADET. Analysis:

[What went wrong]
[Why it matters]
[Suggestion for improvement]

Ready for another attempt?
}
```

### The Cliffhanger
```
briefingfailure{
Mission aborted, CADET!

[Dramatic failure reason]

But wait... sensors are picking up something. Report back immediately!
}
```

## Length Guidelines

- **Keep it brief** - Players want to retry
- **1-2 paragraphs** optimal
- **Failure reason first** - What went wrong
- **Encouragement last** - End positively

## Common Mistakes to Avoid

### Too Harsh
❌ "You failed miserably. You're a terrible CADET."

✅ "Mission failed, CADET. These caverns are challenging - try a different approach."

### Too Vague
❌ "You lost."

✅ "Mission failed - the Tool Store was destroyed by lava. Build further from lava flows next time!"

### No Guidance
❌ "Mission failed. Try again."

✅ "Mission failed - monsters overwhelmed the base. Consider building Electric Fences for defense."

### Spoiling Solutions
❌ "You failed. Build exactly 2 Tool Stores at coordinates [10,10] and [20,20]."

✅ "Mission failed. Multiple Tool Stores might help manage the large cavern area."

## See Also
- [Briefing Section](briefing.md) - Mission introduction
- [Briefing Success Section](briefingsuccess.md) - Victory message
- [Objectives Section](objectives.md) - What triggers failure
- [Script Section](script.md) - Custom failure conditions