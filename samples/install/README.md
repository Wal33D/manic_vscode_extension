# Game Installation Directory

This directory contains the structure of a typical Manic Miners game installation.

## Directory Structure

### `/Engine`
Game engine files and dependencies:
- Binaries/ThirdParty/ - Third-party DLLs and libraries
- Extras/Redist/ - Redistributable packages

### `/ManicMiners`
Main game directory:
- Binaries/ - Game executables
- Content/ - Game assets (movies, paks)
- Levels/ - Level files organized by campaign
- Plugins/ - Game plugins (Discord RPC, etc.)

### `/Saved`
User data and saves:
- Config/ - Game configuration files
- Crashes/ - Crash reports and dumps
- SaveGames/ - Save game files organized by type

### `/TextureModding`
Texture modding resources:
- Textures/ - Custom texture files
- UVs/ - UV mapping templates

## Purpose

This directory structure serves as a reference for:
1. Understanding game file organization
2. Testing extension features with real game paths
3. Developing features that interact with game files
4. Validating file paths and structures

## Important Notes

- Actual game files are excluded from git (see .gitignore)
- Only directory structure and documentation are tracked
- Use this for local testing with your own game files