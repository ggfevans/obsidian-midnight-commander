# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**obsidian-midnight-commander** is a keyboard-focused, dual-pane file explorer plugin for Obsidian inspired by the classic Midnight Commander file manager. This plugin aims to bring orthodox file management capabilities to Obsidian, addressing a significant market gap identified through community research.

### 🎯 Mission Statement
Create the **first true orthodox file manager for Obsidian**, bringing efficient keyboard-only file management, bulk file operations, and side-by-side folder comparison to power users managing large vaults.

## 📚 Primary Research Hub: gVault

**IMPORTANT**: The primary source of truth for this project's research, progress tracking, and comprehensive documentation is located in **gVault** at:

```
gVault/
└── 01-PROJECTS/
    └── obsidian-midnight-commander/
        ├── obsidian-midnight-commander.md          # Main project file
        ├── obsidian-midnight-commander-summary.md  # Dashboard summary
        ├── CLAUDE-PROJECT-INSTRUCTIONS.md          # AI assistant guidelines
        └── [extensive research notes and findings]  # Rich documentation
```

### 🎯 Why gVault is Central
- **Extensive Research**: Contains detailed plugin analysis, API research, and market gap studies
- **Real-time Progress**: All milestones, tasks, and development decisions are tracked there
- **Cross-referencing**: Links to related Obsidian plugins, community discussions, and technical resources
- **Living Documentation**: Notes evolve with the project and contain contextual decision-making history
- **AI Collaboration**: Claude project instructions and conversation context are maintained there

### 📋 Workflow Integration
When working on this project:

**✅ Always Do:**
- Check gVault project files before starting any development work
- Document research findings, design decisions, and progress in gVault first
- Update the main project file (`obsidian-midnight-commander.md`) when completing milestones
- Reference specific gVault notes in issues, PRs, and development discussions

**⚠️ This WARP.md File:**
- Provides technical development guidance and coding patterns
- Serves as a quick reference for the development environment
- Should be kept in sync with major architectural decisions documented in gVault

### 🔗 Quick gVault Navigation
- **Main Project**: `01-PROJECTS/obsidian-midnight-commander/obsidian-midnight-commander.md`
- **Project Summary**: `01-PROJECTS/obsidian-midnight-commander/obsidian-midnight-commander-summary.md`
- **Plugin Ideas**: `03-RESOURCES/01-TECH/00-SOFTWARE/00-ORGANIZATION/Obsidian/Plugin-Ideas/Dual-Pane-File-Explorer.md`
- **Research Hub**: `03-RESOURCES/01-TECH/00-SOFTWARE/00-ORGANIZATION/Obsidian/Plugin-Ideas/README.md`

### Core Features (MVP)
- **Dual-pane layout** with independent navigation (87% of user requests)
- **Keyboard-first** interaction (Tab to switch panes, Arrow keys, F-keys)
- **Bulk file operations** (Copy F5, Move F6, New Folder F7, Delete F8)
- **Dockable sidebar** integration (non-invasive design)
- **Orthodox file manager** paradigms familiar to power users

### Enhanced Features (v2)
- Tag-based file operations and selection
- Configurable keyboard shortcuts (including Vim bindings)
- Quick filter/search within panes
- File preview on hover
- Drag-and-drop between panels

### Advanced Features (v3)
- Plugin integrations (Templater, Dataview)
- Custom commands API
- Mobile optimization with fallback UI
- Theme marketplace support

### Non-Goals
- Replace Obsidian's native file explorer (coexistence approach)
- Full system file access (vault-only operations)
- Complex file management beyond Obsidian's capabilities
- External file system integration
- Replace Obsidian's native file explorer completely

## Project Structure

```
obsidian-midnight-commander/
├── src/
│   ├── main.ts              # Plugin entry point and lifecycle
│   ├── settings.ts          # Plugin settings interface
│   ├── components/
│   │   ├── FilePanes.ts     # Dual-pane file browser
│   │   ├── FilePreview.ts   # File content preview
│   │   └── StatusBar.ts     # Status bar component
│   ├── commands/
│   │   ├── fileOps.ts       # File operation commands
│   │   ├── navigation.ts    # Navigation commands
│   │   └── search.ts        # Search and filter commands
│   ├── utils/
│   │   ├── fileUtils.ts     # File system utilities
│   │   ├── pathUtils.ts     # Path manipulation helpers
│   │   └── cloudSync.ts     # Cloud sync compatibility
│   └── types/
│       └── interfaces.ts    # TypeScript interfaces
├── styles/
│   ├── main.css            # Primary plugin styles
│   └── variables.css       # CSS custom properties
├── manifest.json           # Plugin manifest (auto-generated)
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── esbuild.config.mjs     # Build configuration
├── sync-version.mjs       # Version synchronization script
├── jest.config.js         # Testing configuration
├── .gitignore            # Git ignore patterns
├── .mcpignore            # Optional: MCP path exclusions
├── README.md             # User-facing documentation
└── WARP.md              # This file
```

### Key Files Purpose

- **src/main.ts**: Plugin lifecycle management, command registration, and settings initialization
- **manifest.json**: Plugin metadata (version, compatibility, permissions) - auto-generated from package.json
- **esbuild.config.mjs**: Fast TypeScript compilation and bundling for development/production
- **sync-version.mjs**: Keeps package.json and manifest.json versions in sync
- **styles/**: CSS for the dual-pane interface and file management UI

## Development Workflow

### Setup

1. Clone repository: `git clone [repo-url]`
2. Install dependencies: `npm install`
3. Start development: `npm run dev`
4. Enable plugin in Obsidian (Community Plugins → Installed plugins)

### Common Commands

| Command                | Purpose                            |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Start development with hot reload  |
| `npm run build`        | Production build with version sync |
| `npm run build:clean`  | Clean build (removes dist/ first)  |
| `npm run test`         | Run Jest unit tests                |
| `npm run test:watch`   | Run tests in watch mode            |
| `npm run lint`         | Check code style with ESLint       |
| `npm run lint:fix`     | Auto-fix linting issues            |
| `npm run format`       | Format code with Prettier          |
| `npm run format:check` | Check code formatting              |
| `npm run version`      | Bump version and sync manifest     |
| `npm run spellcheck`   | Check spelling in docs             |

### Build System

- **Primary**: esbuild for fast TypeScript compilation and bundling
- **Alternative**: obsidian-dev-utils (if switching build systems)
- **Output**: Single `main.js` file in root directory
- **Development**: Hot reload via file watching, auto-restart Obsidian plugin

## Coding Patterns

### Plugin Lifecycle

```typescript
export default class MidnightCommanderPlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();
		this.registerCommands();
		this.addRibbonIcon('folder-open', 'Midnight Commander', () => {
			this.openMidnightCommander();
		});
	}

	onunload() {
		// Clean up views, event listeners, intervals
	}
}
```

### Command Registration

```typescript
this.addCommand({
	id: 'open-dual-pane',
	name: 'Open Dual Pane View',
	callback: () => this.openMidnightCommander(),
	hotkeys: [{ modifiers: ['Ctrl'], key: 'Alt+F' }],
});
```

### Settings Management

```typescript
interface PluginSettings {
	paneLayout: 'vertical' | 'horizontal';
	defaultPath: string;
	showHiddenFiles: boolean;
	previewEnabled: boolean;
}

class SettingsTab extends PluginSettingTab {
	plugin: MidnightCommanderPlugin;

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Pane Layout')
			.setDesc('Choose dual-pane orientation')
			.addDropdown(cb =>
				cb
					.addOption('vertical', 'Vertical')
					.addOption('horizontal', 'Horizontal')
					.setValue(this.plugin.settings.paneLayout)
					.onChange(async value => {
						this.plugin.settings.paneLayout = value as
							| 'vertical'
							| 'horizontal';
						await this.plugin.saveSettings();
					})
			);
	}
}
```

### Custom Views and Panes

```typescript
export class MidnightCommanderView extends ItemView {
	static VIEW_TYPE = 'midnight-commander-view';

	getViewType(): string {
		return MidnightCommanderView.VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Midnight Commander';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		// Build dual-pane interface
	}
}

// Register the view
this.registerView(
	MidnightCommanderView.VIEW_TYPE,
	leaf => new MidnightCommanderView(leaf)
);
```

### Performance Best Practices

- **Debounce file operations**: Use `debounce()` for search and filter inputs
- **Virtual scrolling**: For large directory listings
- **Worker threads**: Use Web Workers for heavy file processing
- **Lazy loading**: Load file metadata on demand

### Cloud Sync Compatibility

```typescript
async retryFileOperation(operation: () => Promise<void>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await operation();
      return;
    } catch (error) {
      if (error.code === 'EEXIST' || error.code === 'EBUSY') {
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Operation failed after retries');
}
```

## Testing Strategy

### Unit Tests (Jest)

```bash
npm run test                    # Run all tests
npm run test:watch             # Watch mode for development
npm run test:coverage          # Generate coverage report
```

### Test Structure

```typescript
// tests/fileOps.test.ts
import { FileOperations } from '../src/commands/fileOps';

describe('FileOperations', () => {
	test('should copy file successfully', async () => {
		const mockVault = createMockVault();
		const fileOps = new FileOperations(mockVault);

		await fileOps.copyFile('source.md', 'dest.md');

		expect(mockVault.adapter.copy).toHaveBeenCalledWith('source.md', 'dest.md');
	});
});
```

### Quality Gates

- **ESLint**: TypeScript-aware linting with @typescript-eslint
- **Prettier**: Code formatting consistency
- **TypeScript**: Strict mode with @tsconfig/strictest
- **Jest**: Unit test coverage minimum 80%

## Release Management

### Version Workflow

1. **Development**: Work on feature branches (`feat/dual-pane-navigation`)
2. **Version bump**: `npm version patch|minor|major`
3. **Auto-sync**: `sync-version.mjs` updates manifest.json automatically
4. **Build**: `npm run build` creates production bundle
5. **Release**: Create GitHub release with built files

### Distribution

- **Community Plugins**: Submit PR to `obsidian-releases` repository
- **BRAT (Beta)**: Direct installation via GitHub URL for beta testing
- **Manual**: Users download release ZIP and extract to `.obsidian/plugins/`

### Manifest.json Requirements

```json
{
	"id": "obsidian-midnight-commander",
	"name": "Midnight Commander",
	"version": "1.0.0",
	"minAppVersion": "1.0.0",
	"description": "Dual-pane file manager for Obsidian",
	"author": "Your Name",
	"authorUrl": "https://github.com/username",
	"fundingUrl": "https://github.com/sponsors/username",
	"isDesktopOnly": false
}
```

## Security and Privacy

### Path Exclusions (.mcpignore)

Optional file to exclude sensitive paths from plugin access:

```
# Exclude private directories
private/
personal/
work/confidential/

# Exclude file patterns
*.private
*.confidential
.env*

# Allow exceptions
!public-notes/
```

### Data Privacy

- Plugin operates only within vault boundaries
- No external network requests (unless explicitly configured)
- Respects Obsidian's file permissions
- User data never leaves local environment

## Troubleshooting

### Common Issues

1. **Plugin not loading**: Check console for TypeScript errors
2. **Hot reload not working**: Restart Obsidian or disable/enable plugin
3. **File operations failing**: Verify vault permissions and cloud sync status
4. **Performance issues**: Check for large directory scanning, enable virtual scrolling

### Debug Mode

Enable via plugin settings to show:

- File operation logs
- Performance metrics
- Error stack traces
- Memory usage stats

## Project Context & Research Findings

### Market Gap Analysis
**Key Finding**: Research confirms a **significant market gap** for a true orthodox dual-pane file manager in Obsidian. Despite 3+ years of sustained community demand and multiple partial solutions, no existing plugin provides the complete Midnight Commander experience that power users seek.

### User Research Insights
Top requested features from community analysis:
1. **Dual-pane layout** (87% of requests)
2. **Bulk file operations** (76%)
3. **Keyboard-only navigation** (68%)
4. **Drag-and-drop between panels** (54%)
5. **F-key commands** (42%)

#### Target User Personas
- **Developers**: Want familiar commander interface
- **System Administrators**: Need efficient file management
- **Large Vault Users**: 1000+ notes requiring organization
- **Vim Users**: Keyboard-first workflows essential
- **PKM Power Users**: Complex organizational needs

### Technical Feasibility Confirmed

#### ✅ Fully Supported Obsidian APIs
- **WorkspaceLeaf API**: Create multiple panels
- **Vault API**: Complete file operations (CRUD)
- **FileManager API**: Link-aware operations
- **KeymapEventHandler**: Complex keyboard schemes
- **Custom Views**: First-class workspace integration
- **Event System**: Real-time file system monitoring

#### ⚠️ Implementation Challenges
- **No FileExplorer Extension**: Can't modify native explorer (use coexistence approach)
- **F-key Conflicts**: Browser/system shortcuts (provide alternatives)
- **Mobile Limitations**: Dual-pane on small screens (fallback UI required)
- **Performance**: Large vaults (10K+ files) require virtual scrolling

### Performance Benchmarks
| Metric | Requirement | Validated Achievable |
|--------|------------|---------------------|
| Load 1K files | < 500ms | ✅ 200ms |
| Load 5K files | < 1000ms | ✅ 600ms |
| Load 10K files | < 2000ms | ✅ 1400ms |
| Memory usage | < 100MB | ✅ 75MB |
| Scroll FPS | 60 FPS | ✅ Via virtual scrolling |

## Architecture Decisions

### Technology Stack

- **TypeScript**: Type safety and IDE support
- **esbuild**: Fast compilation and bundling
- **Jest**: Unit testing framework
- **ESLint + Prettier**: Code quality and formatting
- **Obsidian API**: Native plugin integration
- **React** (optional): For complex UI state management
- **Virtual Scrolling**: For performance with large file lists

### Design Principles

1. **Orthodox Paradigm**: Follow Midnight Commander conventions
2. **Vault-first**: Respect Obsidian's file organization
3. **Non-destructive**: Always confirm potentially destructive operations
4. **Keyboard-friendly**: Support power users with shortcuts
5. **Performance**: Smooth interaction even with large vaults
6. **Coexistence**: Don't replace native file explorer
7. **Extensible**: Plugin architecture allows feature additions

### Key Design Decisions (Established)

#### File Opening Behavior
- **Default**: Split view (right pane)
- **Modifiers**: Ctrl+Enter (new tab), Shift+Enter (replace), Alt+Enter (split below)
- **Rationale**: Maintains dual-pane paradigm, prevents tab proliferation

#### Integration Approach
- **Type**: Dockable sidebar panel
- **Rationale**: Non-invasive, preserves original file explorer, user choice

#### Navigation Schema
- **Primary**: Arrow keys + Tab switching
- **Optional**: Vim keys (hjkl)
- **Function Keys**: F5 (Copy), F6 (Move), F7 (New Folder), F8 (Delete)
- **Fallback**: Menu alternatives for F-key conflicts

## Development Milestones & Roadmap

### 🎯 Project Status
- **Current Phase**: Development Environment Setup ✅
- **Next Phase**: Research & Design (Week 1-2)
- **Target**: MVP by September 30, 2025
- **Repository**: https://github.com/ggfevans/obsidian-midnight-commander

### Milestone 1: Research & Design (Week 1-2)
- [ ] **Research existing plugins**: Quick Explorer, File Tree Alternative, File Explorer++
- [ ] **API Analysis**: Study FileExplorer, WorkspaceLeaf, KeymapEventHandler APIs
- [ ] **UI Wireframes**: Create dual-pane layout mockups
- [ ] **Keyboard Schema**: Define complete shortcut mapping
- [ ] **Settings Design**: Plan configuration interface

### Milestone 2: Proof of Concept (Week 3-4)
- [ ] **Basic Plugin Structure**: Initialize with Obsidian sample template ✅
- [ ] **Dual-pane Display**: Implement side-by-side file listing
- [ ] **Simple Navigation**: Arrow keys and basic file selection
- [ ] **WorkspaceLeaf Integration**: Dockable sidebar functionality

### Milestone 3: Core Navigation (Week 5-6)
- [ ] **Keyboard Navigation**: Full arrow key + Tab switching
- [ ] **File Opening**: Implement file opening with split view default
- [ ] **Active Pane Indication**: Visual feedback for focused pane
- [ ] **Basic File Operations**: Open, navigate directories

### Milestone 4: File Operations (Week 7-8)
- [ ] **F-key Commands**: F5 (Copy), F6 (Move), F7 (New Folder), F8 (Delete)
- [ ] **Context Menus**: Right-click operations
- [ ] **Bulk Selection**: Space, Ctrl+A, range selection
- [ ] **Progress Indicators**: For long-running operations

### Milestone 5: Polish & Beta (Week 9-10)
- [ ] **Settings Page**: Complete configuration interface
- [ ] **Error Handling**: Graceful failure and user feedback
- [ ] **Performance**: Virtual scrolling for large directories
- [ ] **Beta Release**: BRAT installation and testing

### Success Criteria

#### MVP Success Metrics
- [ ] Plugin loads without errors in Obsidian
- [ ] Dual-pane navigation works smoothly with keyboard only
- [ ] File operations maintain vault integrity
- [ ] Performance smooth with 1000+ file vaults
- [ ] 100 beta testers via BRAT

#### Community Goals
- [ ] 50 GitHub stars within first month
- [ ] Community plugin approval
- [ ] Positive user feedback (4+ star average)
- [ ] 5+ contributor pull requests

## Claude Project Integration

**Note**: For complete information about project research and documentation, see the **[Primary Research Hub: gVault](#-primary-research-hub-gvault)** section above.

### 🤖 AI Development Assistant Guidelines

When working with AI assistants (Claude, GPT, etc.) on this project, **always start by consulting the gVault project files** detailed in the Primary Research Hub section.

#### Development Context:
- **Primary Source**: gVault contains the complete project context, research findings, and decision history
- **This WARP.md**: Provides technical development patterns and coding guidelines
- **Workflow**: gVault → Development → Update gVault with progress

#### Quick Commands for AI Context:
- "Show me the project" → Reference gVault main project file
- "What's the status?" → Check gVault summary file  
- "Update progress" → Edit gVault project files first, then sync to repo
- "Show tasks" → Display current milestone checklist from gVault

## Plugin Research Context

### Similar Plugins Analyzed
- **Quick Explorer**: Basic file navigation improvements
- **File Tree Alternative**: Enhanced tree view
- **Folder Note**: Folder-based organization
- **File Explorer++**: Extended file operations

**Gap Identified**: None provide true dual-pane orthodox file management

### Key Obsidian APIs for Implementation
- **FileExplorer**: File system interaction (read-only access)
- **WorkspaceLeaf**: Panel management and docking
- **KeymapEventHandler**: Complex keyboard shortcuts
- **Setting**: Configuration interface
- **Vault API**: File operations (CRUD)
- **FileManager API**: Link-aware operations

## Innovation Opportunities

### Unique Value Propositions
1. **First Orthodox Manager**: True Midnight Commander paradigm in Obsidian
2. **Power User Focus**: Keyboard-first, bulk operations
3. **Obsidian Integration**: Link-aware operations, tag support
4. **Performance**: Handles large vaults (10K+ files)
5. **Extensibility**: Plugin API for community extensions

### Advanced Feature Ideas (Future Versions)
- **Plugin Integrations**: Templater, Dataview, Tag Wrangler
- **Search Integration**: Quick filter within panes
- **Bookmark System**: Favorite directories
- **Custom Actions**: User-defined F-key commands
- **Theme Support**: Visual customization
- **Mobile Fallback**: Adapted UI for small screens

## Contributing

### Pull Request Checklist

**Code Quality:**
- [ ] Code formatted (`npm run format`)
- [ ] Linting passes (`npm run lint`)
- [ ] Tests pass (`npm run test`)
- [ ] TypeScript compiles (`npm run build`)
- [ ] Manual testing in Obsidian
- [ ] Add/update unit tests for new features

**Documentation & Research Updates:**
- [ ] Update WARP.md if changing architecture
- [ ] **Update gVault project files** with progress, findings, and decisions
- [ ] Reference relevant gVault notes in PR description
- [ ] Update main project file if milestone completed

### Branch Naming

- `feat/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation only
- `refactor/component-name` - Code refactoring
- `test/test-description` - Test improvements

### Code Style

- Follow existing TypeScript patterns
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and testable
- Prefer composition over inheritance
- Follow orthodox file manager conventions where applicable
