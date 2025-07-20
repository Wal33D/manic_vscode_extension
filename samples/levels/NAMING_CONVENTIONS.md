# Level File Naming Conventions

This guide helps maintain consistent naming for level files across the project.

## Recommended Formats

### Campaign Levels
```
[Number]_[LevelName].dat
```
Examples:
- `01_Rock_Bottom.dat`
- `02_Driller_Night.dat`
- `25_Final_Countdown.dat`

### Community Levels
```
[Creator]_[LevelName]_[Version].dat
```
Examples:
- `FN4_Crystal_Cave_v2.dat`
- `Community_Ice_Challenge_Final.dat`

### Tutorial Levels
```
Tutorial_[Number]_[Topic].dat
```
Examples:
- `Tutorial_01_Basic_Movement.dat`
- `Tutorial_02_Mining_Basics.dat`

## General Rules

### DO:
- ✅ Use underscores (_) or hyphens (-) instead of spaces
- ✅ Keep names descriptive but concise
- ✅ Use consistent separators throughout the filename
- ✅ Include version numbers for iterations (v1, v2, Final)
- ✅ Use Title_Case or lowercase consistently

### DON'T:
- ❌ Use spaces in filenames
- ❌ Use special characters: `< > : " / \ | ? *`
- ❌ Mix separator styles (pick _ OR - not both)
- ❌ Use overly long names (keep under 50 characters)
- ❌ Use non-ASCII characters

## Special Cases

### Series Levels
For multi-part campaigns:
```
[Series]_[Episode]_[Number]_[Name].dat
```
Example: `IceCaves_EP1_03_Frozen_Lake.dat`

### Challenge/Contest Levels
```
[Event]_[Year]_[Creator]_[Name].dat
```
Example: `MinerJam_2023_Bob_Crystal_Rush.dat`

### Test/Development Levels
```
TEST_[Feature]_[Description].dat
DEV_[Purpose]_[Version].dat
```

## File Organization Tips

1. **Alphabetical vs Numerical**
   - Prefix with numbers for sequential play
   - Use alphabetical for standalone levels

2. **Grouping**
   - Keep related levels together with common prefixes
   - Use subdirectories for large collections

3. **Metadata**
   - Consider companion .txt or .md files for level descriptions
   - Document creator, date, and gameplay notes

## Migration Guide

To rename existing files to follow conventions:
1. List all files that need renaming
2. Create a mapping of old → new names
3. Test the extension with new names
4. Update any references in documentation

## Examples of Good Names
- `01_Training_Grounds.dat` ✅
- `Community_Lava_Challenge_v3.dat` ✅
- `Tutorial_Mining_Basics.dat` ✅
- `BAZ_Mission_12_Deep_Freeze.dat` ✅

## Examples of Poor Names
- `my level (2).dat` ❌ (spaces, parentheses)
- `!!!AWESOME+++LEVEL!!!.dat` ❌ (special characters)
- `level.dat` ❌ (not descriptive)
- `This_Is_A_Really_Long_Level_Name_That_Goes_On_Forever_And_Ever.dat` ❌ (too long)