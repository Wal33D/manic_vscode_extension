# Changelog

All notable changes to the "Manic Miners DAT File" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-07-20

### Added
- CI workflow badge to README
- License badge to README
- Comprehensive project documentation
- Testing infrastructure with Jest
- Code quality tools (Prettier, ESLint)
- GitHub Actions CI/CD pipeline
- Professional project structure

### Changed
- Updated version from 0.0.1 to 0.1.0

## [0.0.1] - 2024-01-20

### Added
- Initial release of Manic Miners DAT File extension
- Syntax highlighting for all major DAT file sections:
  - `info`, `tiles`, `height`, `resources`, `objectives`
  - `buildings`, `landslidefrequency`, `lavaspread`
  - `miners`, `briefing`, `vehicles`, `creatures`, `blocks`, `script`
- IntelliSense support for `info` section fields
- Hover provider with detailed field descriptions
- Language configuration with:
  - Line comments (`//`)
  - Block comments (`/* */`)
  - Auto-closing pairs for brackets and quotes
- Basic "Hello World" command for testing
- Support for `.dat` file extension

### Known Issues
- IntelliSense only works within `info` blocks
- No validation or diagnostics yet
- Limited to basic language features

[Unreleased]: https://github.com/Wal33D/manic_vscode_extension/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Wal33D/manic_vscode_extension/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/Wal33D/manic_vscode_extension/releases/tag/v0.0.1