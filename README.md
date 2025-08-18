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

## Settings

Access settings through Obsidian's Settings → Community plugins → Midnight Commander:

- **Open view on startup**: Automatically open the plugin when Obsidian starts
- **Show hidden files**: Toggle visibility of dot-files and hidden directories
- **Show breadcrumbs**: Enable/disable breadcrumb navigation
- **Center-align breadcrumbs**: Choose breadcrumb alignment preference
- **Auto-preview delay**: Customize hover preview delay (default: 300ms)
- **Keymap profile**: Choose between default and vim-style keybindings

## First time developing plugins?

Quick starting guide for new plugin devs:

- Check if [someone already developed a plugin for what you want](https://obsidian.md/plugins)! There might be an existing plugin similar enough that you can partner up with.
- Make a copy of this repo as a template with the "Use this template" button (login to GitHub if you don't see it).
- Clone your repo to a local development folder. For convenience, you can place this folder in your `.obsidian/plugins/your-plugin-name` folder.
- Install NodeJS, then run `npm i` in the command line under your repo folder.
- Run `npm run dev` to compile your plugin from `main.ts` to `main.js`.
- Make changes to `main.ts` (or create new `.ts` files). Those changes should be automatically compiled into `main.js`.
- Reload Obsidian to load the new version of your plugin.
- Enable plugin in settings window.
- For updates to the Obsidian API run `npm update` in the command line under your repo folder.

## Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`

## Adding your plugin to the community plugin list

- Check the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.

## Development Setup

1. Clone this repo
2. Make sure your NodeJS is at least v16 (`node --version`)
3. `npm i` to install dependencies
4. `npm run dev` to start compilation in watch mode
5. Files will be built to `./build-output/` directory

## Build Commands

- `npm run dev` - Development build with **watch mode** and sourcemaps (stays running)
- `npm run build-dev` - Development build that **completes and exits** with sourcemaps
- `npm run build` - Production build (minified, no sourcemaps, completes and exits)

All commands will:
- Create the `./build-output/` directory
- Copy `manifest.json` and `styles.css` 
- Bundle TypeScript/React code to `main.js`
- Show helpful console output with build status

## Manually installing the plugin

1. Run `npm run build` to create the build output
2. Copy the entire `./build-output/` folder contents to your vault:
   `VaultFolder/.obsidian/plugins/obsidian-midnight-commander/`
3. Enable the plugin in Obsidian settings

Or for development:
1. Run `npm run dev` to start watch mode  
2. Create a symlink from your vault's plugins folder to `./build-output/`
3. Reload Obsidian when you make changes

## Improve code quality with eslint (optional)

- [ESLint](https://eslint.org/) is a tool that analyzes your code to quickly find problems. You can run ESLint against your plugin to find common bugs and ways to improve your code.
- To use eslint with this project, make sure to install eslint from terminal:
  - `npm install -g eslint`
- To use eslint to analyze this project use this command:
  - `eslint main.ts`
  - eslint will then create a report with suggestions for code improvement by file and line number.
- If your source code is in a folder, such as `src`, you can use eslint with this command to analyze all files in that folder:
  - `eslint .\src\`

## Credits & Acknowledgements

This plugin draws inspiration and technical insights from several outstanding projects:

- [Quick Explorer](https://github.com/pjeby/quick-explorer) by PJ Eby - An exceptional file navigation plugin that provides breadcrumb navigation and keyboard-driven menus. Our keyboard navigation and file traversal systems draw significant inspiration from Quick Explorer's excellent implementation.

- The classic [Midnight Commander](https://midnight-commander.org/) file manager - For the original dual-pane design pattern and keyboard-centric approach.

## Funding URL

You can include funding URLs where people who use your plugin can financially support it.

The simple way is to set the `fundingUrl` field to your link in your `manifest.json` file:

```json
{
	"fundingUrl": "https://buymeacoffee.com"
}
```

If you have multiple URLs, you can also do:

```json
{
	"fundingUrl": {
		"Buy Me a Coffee": "https://buymeacoffee.com",
		"GitHub Sponsor": "https://github.com/sponsors",
		"Patreon": "https://www.patreon.com/"
	}
}
```

## Design Guidelines

### Navigation Styling

This plugin follows Obsidian's navigation component styling patterns to ensure visual consistency with the native file explorer. We use Obsidian's CSS variables for navigation components as defined in the [Navigation CSS Variables Reference](https://docs.obsidian.md/Reference/CSS+variables/Components/Navigation).

Key variables we use:
- `--nav-item-background-hover` - Background on hover
- `--nav-item-background-active` - Background for active/selected items
- `--nav-item-background-selected` - Background for multi-selected items
- `--nav-item-color-hover` - Text color on hover
- `--nav-item-color-active` - Text color for active items
- `--nav-item-color-selected` - Text color for selected items
- `--nav-item-weight-hover` - Font weight on hover
- `--nav-item-weight-active` - Font weight for active items

**Usage examples:**
```css
.file-item.is-active {
  background-color: var(--nav-item-background-active);
  color: var(--nav-item-color-active);
}

.file-item:hover {
  background-color: var(--nav-item-background-hover);
  color: var(--nav-item-color-hover);
}

.file-item.is-selected {
  background-color: var(--nav-item-background-selected);
  color: var(--nav-item-color-selected);
}
```

This approach ensures the plugin automatically adapts to different themes and maintains visual consistency with Obsidian's file explorer.

## API Documentation

See https://github.com/obsidianmd/obsidian-api
