# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-02-13

### Removed

- File deletion features (not supported by Foundry VTT security model)
- "Cleanup Orphans" button from settings UI
- Orphaned file deletion functionality

### Changed

- Module now focuses on core features: conversion, link repair, and file protection
- Updated documentation to reflect removal of deletion features

### Fixed

- Improved error handling for missing directories
- Enhanced compatibility with Foundry VTT v12 and v13

## [2.0.6] - 2026-02-12

### Added

- Initial standalone release
- Automatic WebP conversion on upload
- Mass conversion feature for existing images
- Link repair system for broken file references
- File protection to prevent deletion of in-use files
- World file indexing system
- Multi-language support (English and Portuguese)
- Public API for macro usage

### Features

- Automatic image optimization (up to 70% size reduction)
- Deep scan for file usage across all document types
- Progress tracking for long-running operations
- Safety dialogs for destructive operations

## [1.0.0] - Initial Development

### Added

- Basic file management functionality
- Integration with Dashboard Server (deprecated in v2.0.0)
