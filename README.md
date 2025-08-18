# Obsidian Midnight Commander

A powerful dual-pane file manager for Obsidian inspired by the classic Midnight Commander, built with React and TypeScript. This plugin integrates Quick Explorer's advanced navigation system to provide a modern, keyboard-driven file management experience.

## Features

### Core Dual-Pane Interface
- **Dual-pane interface**: Navigate files with two independent panes
- **Smart pane management**: Visual indicators for active pane with accent colors
- **Responsive layouts**: Automatically adapts to different workspace orientations
- **Virtual scrolling**: Efficient handling of large directories

### Advanced Navigation (Quick Explorer Integration)
- **PopupMenu system**: Keyboard-navigable menus with vim-style bindings (hjkl, gg, G)
- **Incremental fuzzy search**: Real-time search with highlighting using Fuse.js
- **Folder navigation menu (F9)**: Quick Explorer-style folder browsing with auto-preview
- **Command palette (Ctrl+P)**: Quick access to common file operations
- **File navigation commands**: Jump to next/previous/first/last files across folders

### Auto-Preview & Context Menus
- **Auto-preview with hover editors**: File content preview on navigation with configurable delays
- **Comprehensive context menus**: Right-click and keyboard (\\) context menus
- **Cascade positioning**: Smart menu placement that respects viewport boundaries
- **File operations**: Copy, move, rename, delete with confirmation dialogs

### Breadcrumb Navigation
- **Interactive breadcrumbs**: Click to navigate to parent directories
- **Path visualization**: Clear visual hierarchy of current location
- **Configurable alignment**: Center or left-align breadcrumbs per preference

### Theme Integration & Polish
- **Native Obsidian styling**: Seamless integration with all themes
- **CSS variable mapping**: Automatic adaptation to theme color schemes
- **High-DPI optimizations**: Crisp rendering on retina displays
- **Accessibility support**: Focus traps, reduced motion, high contrast modes
- **Popular theme compatibility**: Tested with Minimal, Things, Catppuccin, Nord themes

### Keyboard-Centric Design
- **F-key operations**: F5 (copy), F6 (move), F7 (new folder), F8 (delete)
- **Multi-select support**: Space to toggle, Ctrl+A/D for select/deselect all
- **Navigation shortcuts**: Ctrl+↑/↓ for file navigation, Ctrl+Shift+↑/↓ for first/last
- **Context menus**: \\ key for keyboard-accessible context operations

### Modern Architecture
- **React 18**: Modern, responsive interface with hooks and concurrent features
- **TypeScript**: Full type safety and excellent developer experience
- **Component-based**: Modular, testable, and maintainable codebase
- **State management**: Uses Recoil for efficient state management across panes

## Usage

Once installed, access Midnight Commander through:
- **Command palette**: Press `Ctrl+P` (or `Cmd+P` on Mac) and search for "Midnight Commander"
- **Ribbon icon**: Click the dual-pane icon in the left sidebar
- **View menu**: Open from the View menu under "Midnight Commander"

### Keyboard Shortcuts

- **F5**: Copy selected files
- **F6**: Move selected files
- **F7**: Create new folder
- **F8**: Delete selected files
- **F9**: Open folder navigation menu
- **Space**: Toggle file selection
- **Ctrl+A**: Select all files
- **Ctrl+D**: Deselect all files
- **\\**: Open context menu
- **Ctrl+P**: Open command palette

## Settings

Access settings through Obsidian's Settings → Community plugins → Midnight Commander:

- **Open view on startup**: Automatically open the plugin when Obsidian starts
- **Show hidden files**: Toggle visibility of dot-files and hidden directories
- **Show breadcrumbs**: Enable/disable breadcrumb navigation
- **Center-align breadcrumbs**: Choose breadcrumb alignment preference
- **Auto-preview delay**: Customize hover preview delay (default: 300ms)
- **Keymap profile**: Choose between default and vim-style keybindings

## Installation

1. Open Obsidian Settings
2. Navigate to Community plugins and disable Safe mode
3. Click Browse community plugins
4. Search for "Midnight Commander"
5. Install and enable the plugin

### Manual Installation

1. Download the latest release from GitHub
2. Extract the files to your vault's plugins folder: `VaultFolder/.obsidian/plugins/obsidian-midnight-commander/`
3. Reload Obsidian and enable the plugin in Settings

## Credits & Acknowledgements

This plugin draws inspiration and technical insights from several outstanding projects:

- [Quick Explorer](https://github.com/pjeby/quick-explorer) by PJ Eby - An exceptional file navigation plugin that provides breadcrumb navigation and keyboard-driven menus. Our keyboard navigation and file traversal systems draw significant inspiration from Quick Explorer's excellent implementation.

- The classic [Midnight Commander](https://midnight-commander.org/) file manager - For the original dual-pane design pattern and keyboard-centric approach.

