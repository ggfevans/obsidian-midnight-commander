# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2024-12-17

### 🚀 Major Features: Quick Explorer Integration

This release represents a major milestone with the complete integration of Quick Explorer's advanced navigation system into the dual-pane interface.

#### Added

**PopupMenu System & Navigation**
- Keyboard-navigable popup menus with vim-style bindings (hjkl, gg, G)
- Incremental fuzzy search with real-time highlighting using Fuse.js
- Cascade positioning algorithm with viewport boundary detection
- F9 folder navigation menu with Quick Explorer-style browsing
- Ctrl+P command palette for quick access to common operations

**Auto-Preview & File Operations**
- Auto-preview system with configurable hover editor delays
- Integration with Obsidian's native hover link system
- Smart file navigation commands (next/previous/first/last across folders)
- Context menu system accessible via right-click and \\ keyboard shortcut
- File operations: copy path, open in new tab, rename, delete with confirmation

**Theme Compatibility & Polish**
- Comprehensive theme compatibility system with CSS variable mapping
- Support for popular themes: Minimal, Things, Catppuccin, Nord, California Coast
- High-DPI display optimizations with crisp SVG rendering
- Accessibility improvements: focus traps, reduced motion support, high contrast
- Enhanced breadcrumb navigation with configurable alignment

**Settings Integration**
- Complete settings tab with live configuration updates
- Toggles for breadcrumbs, hidden files, auto-preview, startup behavior
- Configurable preview delays and breadcrumb alignment
- Keymap profile selection (default/vim)

**Enhanced Keyboard Navigation**
- Advanced file navigation with Ctrl+↑/↓ for next/previous file
- Ctrl+Shift+↑/↓ for jumping to first/last file in folders
- Multi-select operations with Space, Ctrl+A, Ctrl+D
- Context menu access via \\ key for keyboard-only workflows
- F-key operations: F5 (copy), F6 (move), F7 (new folder), F8 (delete)

#### Technical Improvements

**Architecture Enhancements**
- Modular service-based architecture with NavigationService and AutoPreviewService
- Dependency-free PopupMenu system adapted from Quick Explorer
- Enhanced React component integration with imperative APIs
- Improved TypeScript type safety across all new components

**Performance & UX**
- Virtual scrolling optimizations for large directory handling
- Smooth transitions with prefers-reduced-motion respect
- Improved focus management across dual-pane interface
- Better error handling and edge case management

**Developer Experience**
- Comprehensive JSDoc documentation for all new APIs
- Modular component structure for maintainability
- Enhanced build system with production optimizations
- Extended test coverage for navigation and menu systems

#### Changed
- Updated dual-pane interface with enhanced visual indicators
- Improved breadcrumb styling with better theme integration
- Enhanced file item styling to match native Obsidian explorer
- Better responsive behavior for different workspace orientations

#### Infrastructure
- Added comprehensive settings system with persistence
- Enhanced CSS architecture with theme compatibility layers
- Improved error boundaries and fallback handling
- Better separation of concerns between UI and business logic

### Migration Notes

This release maintains full backward compatibility with existing configurations. New settings will use sensible defaults:

- Auto-preview enabled with 300ms delay
- Breadcrumbs enabled with left alignment
- Default keymap profile selected
- All existing keyboard shortcuts preserved

Users can access the new settings via Obsidian's Settings → Community plugins → Midnight Commander to customize the enhanced features.

## [0.1.0] - 2024-11-20

### Added
- Initial dual-pane file manager implementation
- Basic keyboard navigation (Tab, arrows, Enter)
- React 18 integration with modern hooks
- Recoil state management for pane coordination
- TypeScript implementation with full type safety
- Basic file and folder browsing
- Integration with Obsidian's workspace system
- Responsive layout with pane resizing
- Virtual scrolling for performance
- Basic breadcrumb navigation

### Technical
- Modern React architecture with functional components
- esbuild-based build system with development/production modes
- Comprehensive TypeScript configuration
- ESLint integration for code quality
- Development and production build pipelines
