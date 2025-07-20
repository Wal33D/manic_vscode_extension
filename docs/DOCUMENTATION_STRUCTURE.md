# Documentation Structure

## Overview
The documentation has been reorganized for better clarity and maintainability. All redundant files have been removed, and related documents have been grouped into logical directories.

## Current Structure

```
docs/
├── README.md                    # Main documentation index
├── DAT_FILE_FORMAT_GUIDE.md    # Complete DAT format specification
├── COMPLETE_TILE_REFERENCE.md  # All tile IDs and properties
├── DEVELOPMENT_PHASES.md        # Project history and phases
├── PHASE_3_TODO_LIST.md        # Current and future tasks
├── DOCUMENTATION_STRUCTURE.md   # This file
│
├── features/                    # Feature-specific documentation
│   ├── MAP_PREVIEW.md          # Visual map preview
│   ├── MAP_TEMPLATES.md        # Template system
│   ├── MAP_VALIDATION.md       # Validation system
│   ├── OBJECTIVE_BUILDER.md    # Objective builder
│   ├── QUICK_ACTIONS.md        # Quick actions and tile operations
│   └── UNDO_REDO.md           # Undo/redo system
│
└── guides/                      # Development and planning guides
    ├── DEVELOPMENT.md          # Contributing and development setup
    ├── FUTURE_FEATURES.md      # Roadmap and planned features
    └── IMAGE_ASSET_INTEGRATION.md  # Game asset integration plan
```

## Documentation Guidelines

### For New Features
1. Create documentation in `features/` directory
2. Use FEATURE_NAME.md naming convention
3. Include: Overview, Usage, Examples, Configuration

### For Development Guides
1. Add to `guides/` directory
2. Focus on how-to and best practices
3. Keep technical but accessible

### For Core Documentation
1. Update existing files in root directory
2. Keep DAT format guide comprehensive
3. Update tile reference as new tiles are discovered

## Removed Files
The following duplicate/outdated files were removed:
- Multiple phase summary files (consolidated into DEVELOPMENT_PHASES.md)
- Original DAT_FILE_FORMAT.md (merged into comprehensive guide)
- Various analysis and context files (information preserved in appropriate sections)

## Benefits of New Structure
1. **Clarity**: Clear separation between features, guides, and reference
2. **Discoverability**: Easy to find specific documentation
3. **Maintainability**: No duplicate information
4. **Scalability**: Easy to add new documentation
5. **Navigation**: Logical hierarchy with README.md as entry point