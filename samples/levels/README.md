# Manic Miners Level Collection

This directory contains sample level files (.dat) for testing and development of the Manic Miners VS Code extension.

## Directory Structure

### `/community`
Contains levels created by the Manic Miners community. These levels showcase various design patterns, gameplay styles, and creative uses of the game mechanics.

**Current count**: 199 levels

### `/campaign`
Official campaign levels from different versions of the game. These represent the standard progression and can be used as reference for level design best practices.

**Subdirectories**:
- `BAZ/` - BAZ version campaign levels
- `LRR/` - Lego Rock Raiders campaign levels
- `LRRC/` - Lego Rock Raiders Chrome version campaign levels
- `LRRR/` - Lego Rock Raiders Remastered campaign levels

### `/tutorial`
Tutorial levels designed to teach game mechanics and level editing concepts. These are typically simpler and focused on specific learning objectives.

**Current count**: 0 levels (to be added)

## Usage

These levels are used for:
- Testing the extension's parsing capabilities
- Validating different map structures
- Performance testing with various map sizes
- Demonstrating extension features
- Pattern analysis for smart suggestions

## Contributing

To add new levels:
1. Place community-created levels in the `/community` directory
2. Place official campaign levels in the `/campaign` directory
3. Ensure all files have the `.dat` extension
4. Use descriptive filenames that indicate the level's content or difficulty

## File Naming Conventions

- Community levels: `[Creator]_[LevelName].dat` or `[LevelName].dat`
- Campaign levels: `[Number]_[OfficialName].dat` (e.g., `01_Rock_Bottom.dat`)

## Notes

- Large levels (>200x200) are particularly useful for performance testing
- Levels with complex objectives help test the objective validation system
- Maps with unusual tile patterns are valuable for improving pattern recognition