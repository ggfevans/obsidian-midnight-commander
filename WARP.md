# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**obsidian-midnight-commander** is an Obsidian plugin that brings advanced file management capabilities to your vault, inspired by the classic Midnight Commander file manager. This plugin provides a dual-pane interface for efficient file operations, batch processing, and navigation within your Obsidian vault.

### Core Features
- Dual-pane file browser interface
- Advanced file operations (copy, move, rename, batch operations)
- Quick navigation and search across vault content
- File preview and metadata display
- Integration with Obsidian's built-in file operations
- Keyboard shortcuts for power users
- Command palette integration

### Non-Goals
- Full system file access (limited to vault only)
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

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development with hot reload |
| `npm run build` | Production build with version sync |
| `npm run build:clean` | Clean build (removes dist/ first) |
| `npm run test` | Run Jest unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Check code style with ESLint |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run version` | Bump version and sync manifest |
| `npm run spellcheck` | Check spelling in docs |

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
  hotkeys: [{ modifiers: ['Ctrl'], key: 'Alt+F' }]
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
      .addDropdown(cb => cb
        .addOption('vertical', 'Vertical')
        .addOption('horizontal', 'Horizontal')
        .setValue(this.plugin.settings.paneLayout)
        .onChange(async (value) => {
          this.plugin.settings.paneLayout = value as 'vertical' | 'horizontal';
          await this.plugin.saveSettings();
        }));
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
  (leaf) => new MidnightCommanderView(leaf)
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

## Architecture Decisions

### Technology Stack
- **TypeScript**: Type safety and IDE support
- **esbuild**: Fast compilation and bundling
- **Jest**: Unit testing framework
- **ESLint + Prettier**: Code quality and formatting
- **Obsidian API**: Native plugin integration

### Design Principles
1. **Vault-first**: Respect Obsidian's file organization
2. **Non-destructive**: Always confirm potentially destructive operations
3. **Keyboard-friendly**: Support power users with shortcuts
4. **Performance**: Smooth interaction even with large vaults
5. **Extensible**: Plugin architecture allows feature additions

## Contributing

### Pull Request Checklist
- [ ] Code formatted (`npm run format`)
- [ ] Linting passes (`npm run lint`)
- [ ] Tests pass (`npm run test`)
- [ ] TypeScript compiles (`npm run build`)
- [ ] Manual testing in Obsidian
- [ ] Update WARP.md if changing architecture
- [ ] Add/update unit tests for new features

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
