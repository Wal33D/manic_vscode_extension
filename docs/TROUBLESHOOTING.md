# Manic Miners VSCode Extension Troubleshooting Guide

## Table of Contents
1. [Common Issues](#common-issues)
2. [Script Debugging](#script-debugging)
3. [Map Validation Errors](#map-validation-errors)
4. [Performance Issues](#performance-issues)
5. [Extension Problems](#extension-problems)
6. [FAQ](#faq)

## Common Issues

### Map Won't Load in Game

**Symptoms:** Map appears valid in VSCode but crashes or fails to load in Manic Miners.

**Common Causes & Solutions:**

1. **Missing Required Sections**
   ```
   ❌ Missing height section
   ✅ Ensure all three required sections exist:
   info{
     rowcount:20
     colcount:20
     biome:rock
   }
   tiles{
     // tile data
   }
   height{
     // height data
   }
   ```

2. **Dimension Mismatch**
   ```
   ❌ info says 20x20 but tiles has 19x20
   ✅ Ensure dimensions match exactly:
   - tiles: rowcount × colcount values
   - height: (rowcount+1) × (colcount+1) values
   ```

3. **Invalid Tile IDs**
   ```
   ❌ Using tile ID 200 (doesn't exist)
   ✅ Valid tile IDs: 1-165 (with gaps)
   ```

### Script Not Working

**Symptoms:** Scripts compile but don't execute as expected in game.

**Common Causes & Solutions:**

1. **Space in Script Syntax**
   ```
   ❌ when (crystals >= 50) [win:]
   ✅ when(crystals>=50)[win:]
   ```

2. **Wrong Coordinate Order**
   ```
   ❌ emerge:X,Y,CreatureType (wrong!)
   ✅ emerge:row,col,CreatureType (correct!)
   ```

3. **Uninitialized Variables**
   ```
   ❌ when(Counter>10)[win:] // Counter not declared
   ✅ int Counter=0
      when(Counter>10)[win:]
   ```

### Objectives Not Completing

**Symptoms:** Player meets requirements but objective doesn't complete.

**Common Causes & Solutions:**

1. **Variable Condition Syntax**
   ```
   ❌ variable: crystals>50/Collect crystals
   ✅ variable: crystals>=50/Collect 50 crystals
   ```

2. **Building Class Names**
   ```
   ❌ building: ToolStore 1
   ✅ building: BuildingToolStore_C 1
   ```

3. **Coordinate Mismatch**
   ```
   ❌ discovertile: 20,20/Find cave (but tile is at row 20, col 20)
   ✅ Verify exact coordinates match intended location
   ```

## Script Debugging

### Debug Techniques

#### 1. Message Debugging
Add messages to track script execution:
```
script{
  int Stage=0
  
  when(crystals>=10)[CheckStage]
  
  CheckStage::
  msg:DebugStageValue;  # Shows current stage
  Stage:Stage+1;
  msg:DebugStageAfter;  # Shows new stage
}
```

#### 2. Variable Visualization
Use arrows to show variable states:
```
script{
  bool DoorOpen=false
  arrow Indicator=red
  
  when(DoorOpen==true)[ShowGreen]
  when(DoorOpen==false)[ShowRed]
  
  ShowGreen::
  highlightarrow:10,10,Indicator=green;
  
  ShowRed::
  highlightarrow:10,10,Indicator=red;
}
```

#### 3. Incremental Testing
Test scripts incrementally:
```
# Step 1: Test trigger
when(init)[msg:ScriptLoaded]

# Step 2: Test variable
int TestVar=5
when(init)[msg:VarIs5]

# Step 3: Test condition
when(TestVar==5)[msg:ConditionWorks]
```

### Common Script Errors

#### Infinite Loops
```
❌ Bad: Creates infinite message spam
when(crystals>=10)[GiveCrystals]
GiveCrystals::
crystals:5;

✅ Good: Uses flag to prevent re-triggering
bool Rewarded=false
when(crystals>=10 and Rewarded==false)[GiveCrystals]
GiveCrystals::
Rewarded:true;
crystals:5;
```

#### Event Chain Recursion
```
❌ Bad: Infinite recursion
Chain1::
Chain2;

Chain2::
Chain1;

✅ Good: Controlled flow
Chain1::
msg:Step1;
Chain2;

Chain2::
msg:Step2;
# Ends here
```

## Map Validation Errors

### Error Messages and Solutions

#### "Invalid section format"
**Cause:** Section not properly closed or formatted
```
❌ tiles{1,2,3
✅ tiles{1,2,3}
```

#### "Tile ID out of range"
**Cause:** Using non-existent tile IDs
```
❌ Using tile 166+ (max is 165)
✅ Check tile reference for valid IDs
```

#### "Dimension mismatch"
**Cause:** Grid doesn't match declared size
```
❌ info says 5x5 but only 4 rows in tiles
✅ Count rows and columns carefully
```

#### "Missing comma after tile value"
**Cause:** Tiles must be comma-separated
```
❌ 1 2 3 4 5
✅ 1,2,3,4,5,
```

#### "Resource grid size mismatch"
**Cause:** Resource grids must match tile dimensions
```
❌ 5x5 tiles but 4x4 resource grid
✅ Ensure all grids match map size
```

## Performance Issues

### Large Map Optimization

#### Problem: Map preview/validation slow
**Solutions:**
1. Reduce map size if possible
2. Disable real-time validation for large maps
3. Use stream parsing for very large files

#### Problem: Script lag in game
**Solutions:**
1. Reduce `when` triggers (use `if` where possible)
2. Avoid complex calculations in triggers
3. Minimize `tick` event usage

### Memory Issues

#### Symptoms: Extension crashes or becomes unresponsive
**Solutions:**
1. Close other large files
2. Increase VSCode memory limit
3. Split very large maps into smaller sections

## Extension Problems

### IntelliSense Not Working

**Solutions:**
1. Ensure file has `.dat` extension
2. Reload VSCode window (`Ctrl+Shift+P` → "Reload Window")
3. Check extension is enabled
4. Verify no syntax errors above cursor position

### Map Preview Not Showing

**Solutions:**
1. Check for parsing errors in file
2. Ensure valid map structure
3. Try command palette: "Manic Miners: Preview Map"
4. Check VSCode developer console for errors

### Hover Information Missing

**Solutions:**
1. Ensure cursor is over valid game element
2. Wait 1-2 seconds for hover to appear
3. Check file has no parsing errors
4. Reload extension

### Commands Not Available

**Solutions:**
1. Ensure a `.dat` file is open
2. Check extension is activated
3. Reload VSCode
4. Reinstall extension if needed

## FAQ

### Q: Why do my coordinates seem wrong?
**A:** Manic Miners uses row,col (Y,X) format, not X,Y:
- First number is row (vertical)
- Second number is column (horizontal)
- Top-left is 0,0

### Q: Can I use spaces in script strings?
**A:** Yes, but be careful with syntax:
```
✅ string Message="Hello World"
✅ msg:Message;
❌ when (condition) [event]  # No spaces in syntax!
```

### Q: Why doesn't my building objective complete?
**A:** Check exact building class name:
```
❌ building: ToolStore 1
❌ building: Tool_Store 1
✅ building: BuildingToolStore_C 1
```

### Q: How do I debug complex scripts?
**A:** Use progressive debugging:
1. Add messages at each step
2. Test one trigger at a time
3. Use variables to track state
4. Check game's debug output

### Q: What's the maximum map size?
**A:** Theoretical max is 255x255, but practical limits:
- Small maps: 20x20 to 40x40 (best performance)
- Medium maps: 40x40 to 80x80 (good performance)
- Large maps: 80x80 to 120x120 (may lag)
- Very large: 120x120+ (expect performance issues)

### Q: Can I use decimal numbers in scripts?
**A:** Yes, with float variables:
```
float Speed=1.5
float:Speed*2.0;  # Result: 3.0
```

### Q: How do I test if a building exists?
**A:** Use the buildings collection:
```
when(buildings.BuildingToolStore_C>0)[ToolStoreExists]
```

### Q: Why does my map look different in game?
**A:** Common reasons:
1. Undiscovered walls (+100 to tile ID)
2. Different biome affects appearance
3. Game rendering differs from preview
4. Reinforced walls (+50 to tile ID)

### Q: How do I fix "script too complex" errors?
**A:** Simplify your script:
1. Reduce number of active triggers
2. Combine similar conditions
3. Use event chains to organize code
4. Remove unused variables

## Getting Help

If you can't resolve an issue:

1. **Check Documentation**
   - [DAT Format Guide](game-reference/format/overview.md)
   - [Scripting Reference](game-reference/scripting/overview.md)
   - [Map Design Guide](game-reference/map-design-guide.md)

2. **Community Resources**
   - Manic Miners Discord
   - Community Forums
   - GitHub Issues

3. **Report Bugs**
   - Include minimal reproduction case
   - Provide error messages
   - Specify VSCode and extension versions

Remember: Most issues have been encountered before - check existing resources first!