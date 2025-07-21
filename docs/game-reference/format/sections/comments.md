# Comments Section

The `comments{}` section is a freeform area for storing notes, metadata, or data from external tools. The map editor preserves this section without modification.

## Purpose

- Developer notes and documentation
- Third-party tool metadata
- Map authorship information
- Custom data storage
- Level descriptions and hints

## Format

```
comments{
    Any text content here
    No specific format required
}
```

### Important Rules

1. **No format requirements** - Any text is valid
2. **Preserved as-is** - Map editor doesn't modify
3. **Line order maintained** - Original order preserved
4. **Closing brace warning** - A `}` alone on a line ends the section

### Closing Brace Handling

⚠️ **Critical**: A closing brace `}` by itself with no leading spaces terminates the section!

```
comments{
    data with embedded brace - this is WRONG:
}   # This ends the comments section!
    more data  # This is OUTSIDE the section!
}
```

Correct way to include closing braces:
```
comments{
    data with embedded brace - indent it:
    }  # Leading spaces prevent section termination
    more data still inside comments
}
```

## Common Uses

### 1. Developer Notes
```
comments{
    TODO: Add more crystals in eastern cavern
    BUG: Spider spawn rate might be too high
    NOTE: Tested with 4 players, balanced for 2-3
}
```

### 2. Map Description
```
comments{
    Map Name: Crystal Caverns Challenge
    Author: MapMaker123
    Version: 1.2
    Date: 2024-01-15
    
    Description: A challenging map focusing on 
    resource management and defensive strategies.
    
    Tips: Build power stations early!
}
```

### 3. Technical Notes
```
comments{
    Landslide timers doubled in main cavern
    Water flow rate adjusted for balance
    Script uses custom victory conditions
    Requires minimum 20 fps for proper timing
}
```

### 4. Third-Party Tool Data
```
comments{
    MMMM_Version:2.0
    MMMM_Difficulty:Hard
    MMMM_PlayTime:45-60min
    MMMM_Tags:Combat,Puzzle,Timed
}
```

## Best Practices

### For Map Developers

1. **Document unusual mechanics**
   ```
   comments{
       Special mechanics:
       - Drilling north wall triggers ambush
       - Hidden passage at coordinates [25,30]
       - Timer starts when entering eastern cave
   }
   ```

2. **Include version history**
   ```
   comments{
       Version History:
       v1.0 - Initial release
       v1.1 - Fixed spider spawn bug
       v1.2 - Balanced resource distribution
   }
   ```

3. **Credit sources**
   ```
   comments{
       Based on: Original LRR mission 15
       Script help: CommunityMember42
       Testing: MyTestingTeam
   }
   ```

### For Tool Developers

1. **Use consistent prefixes**
   ```
   comments{
       MyTool_Version:1.0
       MyTool_Data:custom_value
       MyTool_Timestamp:2024-01-15
   }
   ```

2. **Follow key:value format**
   ```
   comments{
       ToolName:MapAnalyzer
       AnalysisDate:2024-01-15
       Difficulty:8/10
       EstimatedTime:45
   }
   ```

3. **Preserve existing data**
   - Read all lines
   - Identify your tool's data
   - Preserve other lines
   - Append new data at end

## Examples from Community

### LRRC Mission Comments
```
comments{
    you love to see it
    note: landslide timers have been doubled in the cavern, 
    since you have two tiles to landslide onto the one tile
    which I think LRR worked on a ground-tile basis for 
    landslides (not wall-basis)
    so this should bring the landslides slightly closer to 
    LRR's rates... maybe
}
```

### MMMM Utility Format
```
comments{
    Author:NuvaHammer
    LevelType1:Panic
    LevelType2:Puzzle
    Length:Medium
    Asset:
    Info:Specialist this mission is critical. A volcano just 
    erupted in the cavern we were using for our vehicle depot. 
    The evacuation is in progress but we won't be able to get 
    all the vehicles out...
}
```

### Multi-Tool Example
```
comments{
    # Developer notes
    Created for tournament 2024
    Requires advanced scripting knowledge
    
    # Tool A data
    ToolA_Validated:true
    ToolA_Score:95
    
    # Tool B data  
    ToolB_Category:Expert
    ToolB_TestPassed:true
    
    # Player hints
    Hint: The southern passage is a trap!
}
```

## Parsing Recommendations

### For Reading
```typescript
function parseComments(section: string): Map<string, string> {
    const data = new Map();
    const lines = section.split('\n');
    
    for (const line of lines) {
        // Try to parse key:value format
        const match = line.match(/^(\w+):(.*)$/);
        if (match) {
            data.set(match[1], match[2].trim());
        }
    }
    
    return data;
}
```

### For Writing
```typescript
function addToolData(comments: string, toolData: object): string {
    const lines = comments.split('\n');
    const prefix = 'MyTool_';
    
    // Remove old tool data
    const filtered = lines.filter(line => 
        !line.startsWith(prefix)
    );
    
    // Add new tool data
    for (const [key, value] of Object.entries(toolData)) {
        filtered.push(`${prefix}${key}:${value}`);
    }
    
    return filtered.join('\n');
}
```

## See Also
- [Info Section](info.md) - Structured metadata
- [Script Section](script.md) - In-script comments
- [Common Patterns](../../../technical-reference/common-patterns.md)