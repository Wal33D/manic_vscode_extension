# Briefing Section

The `briefing{}` section contains the mission introduction text displayed to players before starting the map. This sets the scene and provides context for the mission.

## Format

```
briefing{
First paragraph of briefing text goes here.

Second paragraph with more details.

Final instructions for the player.
}
```

## Text Formatting

### Paragraphs
- Each line becomes a separate paragraph
- Text auto-wraps within the dialog box
- Empty lines create spacing between paragraphs
- No line length limit (auto-wrapped)

### Player Name Substitution
The keyword `CADET` (must be uppercase) is replaced with the player's name:

```
briefing{
Welcome CADET! Your skills are needed for this mission.

Good luck, CADET. We're counting on you!
}
```

Displays as:
```
Welcome PlayerName! Your skills are needed for this mission.

Good luck, PlayerName. We're counting on you!
```

## Content Guidelines

### Essential Information
1. **Mission objectives** - What needs to be accomplished
2. **Special conditions** - Time limits, restrictions
3. **Threats** - Monsters, hazards, environmental dangers
4. **Resources** - What's available or limited
5. **Story context** - Why this mission matters

### Writing Style
- **Clear and concise** - Players want to start playing
- **Atmospheric** - Set the mood and urgency
- **Informative** - Include gameplay hints when appropriate
- **Consistent** - Match the game's tone

## Examples

### Basic Mission Briefing
```
briefing{
CADET, we need you to establish a mining operation in this cavern.

Collect 50 Energy Crystals and return them to the LMS Explorer.

Be careful - our scanners show Rock Monster activity in the area.
}
```

### Story-Driven Briefing
```
briefing{
Emergency transmission received, CADET!

Our research station in Sector 7 has gone silent. Last reports indicated they discovered something important in the ice caverns before we lost contact.

Your mission: Locate the research station, restore power, and find out what happened to the crew. Time is critical - the cavern's structural integrity is failing.

Equipment has been limited due to the emergency nature of this mission. Make do with what you have.

The fate of the research team rests in your hands, CADET.
}
```

### Tutorial Briefing
```
briefing{
Welcome to your first mission, CADET!

This training exercise will teach you the basics of Rock Raider operations.

Start by building a Tool Store - this is your base of operations. Then construct a Power Station to provide energy for your buildings.

Remember: Solid Rock takes longer to drill than Dirt or Loose Rock. Plan your excavations carefully!

Complete all objectives to finish your training. Good luck!
}
```

### Challenge Map Briefing
```
briefing{
Attention CADET - this is not a drill!

Volcanic activity has destabilized the entire region. Lava is rising at an alarming rate and will reach your position in exactly 15 minutes.

Mission parameters:
- Rescue all 10 trapped miners
- Collect emergency supplies (minimum 30 crystals)
- Evacuate before lava floods the cavern

No time for elaborate base construction. Work fast and smart.

Every second counts, CADET. Move!
}
```

### Multi-Objective Briefing
```
briefing{
CADET, this mission has multiple critical objectives.

Primary: An essential vehicle carrying rare ore samples is trapped in the eastern cavern. It must be recovered intact.

Secondary: The area contains valuable crystal formations. Collect at least 100 for our research department.

Complication: Slimy Slugs have infested the caverns. They've damaged our equipment and will slow your progress.

Optional: If possible, clear all Slug nests to make future operations safer.

Use the Chrome Crusher we're providing - it's been upgraded to handle the difficult terrain.

May the rocks be with you, CADET!
}
```

## Special Considerations

### Character Encoding
- Supports non-ASCII characters (UTF-8)
- Map saves as UTF16LE BOM if special characters used
- Emoji and Unicode symbols work but may not display correctly

### Display Limitations
- Shown in scrollable dialog box
- No formatting (bold, italic, colors)
- No inline images or icons
- Fixed-width font typically used

### Length Guidelines
- **No hard limit** on section size
- **2-5 paragraphs** optimal for most missions
- **Tutorial maps** may need more detail
- **Speed runs** benefit from brevity

## Integration with Other Sections

### With Objectives
Briefing should hint at objectives without listing them exactly:
```
briefing{
Build up our mining capabilities in this region, CADET.
# Actual objective: building: BuildingToolStore_C 2
}
```

### With Script Events
Can reference scripted events narratively:
```
briefing{
Intel suggests enemy reinforcements will arrive after 10 minutes.
# Script has: when(time>600)[emerge:10,10,CreatureRockMonster_C]
}
```

### With Success/Failure Messages
Create narrative continuity:
```
briefing{
If you succeed, we can establish a permanent base here.
}

briefingsuccess{
Excellent work! The cavern is now secure for colonization.
}

briefingfailure{
The mission has failed. We'll need to find another site.
}
```

## Common Patterns

### The Emergency
```
briefing{
Emergency, CADET! [Describe crisis]

[Explain immediate danger]

[State mission objectives]

Time is running out!
}
```

### The Mystery
```
briefing{
Something strange is happening in [location], CADET.

[Describe mysterious events]

Investigate and report back your findings.

Be prepared for anything.
}
```

### The Tutorial
```
briefing{
Welcome to [situation], CADET.

In this mission, you'll learn to [skill/technique].

[Step-by-step guidance]

Take your time and experiment!
}
```

## See Also
- [Briefing Success Section](briefingsuccess.md) - Victory message
- [Briefing Failure Section](briefingfailure.md) - Defeat message
- [Objectives Section](objectives.md) - Actual mission goals
- [Script Section](script.md) - Mission events