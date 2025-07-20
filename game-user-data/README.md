# Game User Data Directory

This directory mirrors the structure of files that Manic Miners creates in the user's Documents folder.

## Directory Structure

### `/SaveData`
Game save files and player progress. Typically includes:
- Save game files (.sav)
- Player profiles
- Settings/preferences
- Achievement data

### `/Levels`
User-created and downloaded levels for the in-game level editor:
- Downloaded community levels (.dat)
- Work-in-progress levels
- Level backups
- Custom campaigns

### `/Screenshots`
In-game screenshots and captures:
- Screenshot images (.png, .jpg)
- Level previews
- Achievement screenshots

## Purpose

This directory serves multiple purposes:
1. **Testing**: Test how the extension handles user-created content
2. **Analysis**: Understand save file formats and user data structure
3. **Development**: Reference for features that interact with user data
4. **Compatibility**: Ensure extension works with game's expected file locations

## Important Notes

- This directory is **excluded from git** (see .gitignore)
- Do not commit personal save files or user data
- Use for local testing and development only

## Typical File Locations

On different platforms, the game typically stores user data in:
- **Windows**: `%USERPROFILE%\Documents\Manic Miners\`
- **macOS**: `~/Documents/Manic Miners/`
- **Linux**: `~/Documents/Manic Miners/`

## File Types

Common file types found in user data:
- `.sav` - Save game files
- `.dat` - Level files (user-created or downloaded)
- `.cfg` - Configuration files
- `.png` - Screenshots
- `.txt` - Log files or notes