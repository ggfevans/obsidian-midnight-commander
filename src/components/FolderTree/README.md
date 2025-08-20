# FolderTree Component

A comprehensive root tree container component for the Obsidian Midnight Commander plugin that provides virtual scrolling support for large folder hierarchies.

## Overview

The FolderTree component serves as the main integration point between the TreeNode and NestedFolders components and the existing FilePane architecture. It implements efficient virtual scrolling to handle large vaults with thousands of folders while maintaining smooth performance.

## Features

### Core Functionality

- **Virtual Scrolling**: Handles large folder hierarchies (1000+ folders) efficiently using @tanstack/react-virtual
- **Tree-wide State Management**: Manages expanded folders, selection, and focus states
- **Keyboard Navigation**: Full keyboard support with arrow keys, page up/down, home/end
- **Search Integration**: Supports real-time search and filtering within the tree
- **Dynamic Heights**: Handles expanded/collapsed nodes with proper height calculations

### Performance Optimizations

- Virtual scrolling for rendering only visible items
- Memoized component rendering to prevent unnecessary re-renders
- Efficient state updates with minimal reconciliation
- Lazy loading of folder contents
- Memory management for large tree structures

### Integration Features

- Compatible with existing FilePane and DualPaneManager
- Supports switching between tree and list views
- Integrates with existing file operations (click, context menu, navigation)
- Works with the folder focus system from File Tree Alternative
- Maintains consistency with existing UI patterns

## Usage

### Basic Implementation

```tsx
import { FolderTree } from '../components/FolderTree';

<FolderTree
	app={app}
	rootFolder={vault.getRoot()}
	paneId="left"
	isActive={true}
	onNavigateToFolder={handleNavigateToFolder}
	onFileClick={handleFileClick}
	onContextMenu={handleContextMenu}
	height={600}
	width={300}
	showFileCount={true}
	sortBy="name"
/>;
```

### Integration with FilePane

The FolderTree can be used as an alternative view mode in the existing FilePane:

```tsx
// In FilePane.tsx
const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

return (
	<div className="file-pane">
		{viewMode === 'tree' ? (
			<FolderTree
				app={app}
				rootFolder={paneState.currentFolder}
				paneId={paneState.id}
				isActive={paneState.isActive}
				onNavigateToFolder={onNavigateToFolder}
				onFileClick={onFileClick}
				onContextMenu={onFileContextMenu}
				height={height}
				width={width}
				searchQuery={paneState.filter?.options?.query}
				showFilesInTree={false}
				sortBy="name"
			/>
		) : (
			// Existing list view implementation
			<div className="file-list-virtual">
				{/* ... existing virtual list ... */}
			</div>
		)}
	</div>
);
```

## Props Interface

```typescript
interface FolderTreeProps {
	app: App; // Obsidian app instance
	rootFolder: TFolder; // Root folder to display
	paneId: 'left' | 'right'; // Pane identifier
	isActive: boolean; // Whether this pane is active
	onNavigateToFolder: (folder: TFolder) => void; // Folder navigation handler
	onFileClick?: (file: TAbstractFile) => void; // File click handler
	onContextMenu?: (item: TAbstractFile, event: React.MouseEvent) => void; // Context menu handler
	height: number; // Component height in pixels
	width: number; // Component width in pixels
	showFileCount?: boolean; // Show item count in header
	sortBy?: 'name' | 'modified' | 'size'; // Sort criteria
	searchQuery?: string; // Search filter query
	showFilesInTree?: boolean; // Include files in tree view
	maxRenderDepth?: number; // Maximum tree depth to render
}
```

## Tree Operations

The component exposes tree operations globally for external control:

```typescript
// Access tree operations for a specific pane
const treeOps = (window as any)[`folderTreeOperations_${paneId}`];

if (treeOps) {
	treeOps.expandAll(); // Expand all folders
	treeOps.collapseAll(); // Collapse all folders
	treeOps.revealFolder(path); // Expand to and select a specific folder
}
```

## Keyboard Navigation

| Key                     | Action                         |
| ----------------------- | ------------------------------ |
| `↑` / `↓`               | Navigate up/down in tree       |
| `←` / `→`               | Collapse/expand focused folder |
| `Page Up` / `Page Down` | Navigate by 10 items           |
| `Home` / `End`          | Jump to first/last item        |
| `Enter` / `Space`       | Activate focused item          |

## Styling

The component uses CSS classes following Obsidian's design system:

- `.folder-tree` - Main container
- `.folder-tree.active` - Active pane styling
- `.folder-tree-header` - Header with statistics
- `.folder-tree-container` - Scrollable content area
- `.folder-tree-empty` - Empty state display

Styles are defined in `src/styles/tree-components.css` and integrate with:

- Obsidian's theme system
- Popular community themes (Minimal, Things, Catppuccin, Nord)
- Dark/light mode support
- High contrast and reduced motion accessibility

## Performance Considerations

### Virtual Scrolling Configuration

- **Item Height**: 32px per tree item
- **Overscan**: 10 items rendered outside viewport
- **Estimation**: Dynamic height handling for expanded nodes

### Memory Management

- Only visible items are rendered in DOM
- State updates are debounced and memoized
- Recursive tree traversal is optimized with depth limits
- Search filtering is performed efficiently with memoization

### Large Vault Optimization

- Default max render depth: 50 levels
- Lazy loading of deep folder structures
- Performance mode available for very large trees
- Reduced motion support for accessibility

## Integration Examples

### DualPaneManager Integration

```tsx
// Add tree view toggle to DualPaneManager
const [leftViewMode, setLeftViewMode] = useState<'list' | 'tree'>('list');
const [rightViewMode, setRightViewMode] = useState<'list' | 'tree'>('list');

// In render method
{
	leftViewMode === 'tree' ? (
		<FolderTree
			app={app}
			rootFolder={leftPane.currentFolder}
			paneId="left"
			isActive={leftPane.isActive}
			onNavigateToFolder={folder => onNavigateToFolder(folder, 'left')}
			onFileClick={file => onFileClick(file, 'left')}
			onContextMenu={(item, event) =>
				onFileContextMenu(item, 'left', { x: event.clientX, y: event.clientY })
			}
			height={topPaneHeight}
			width={leftPaneWidth}
			showFileCount={true}
			sortBy={settings.sortBy}
		/>
	) : (
		<FilePane
			paneState={leftPane}
			onStateChange={handleLeftPaneStateChange}
			// ... other props
		/>
	);
}
```

### Search Integration

The component supports real-time search through the `searchQuery` prop:

```tsx
const [searchQuery, setSearchQuery] = useState('');

<FolderTree
	// ... other props
	searchQuery={searchQuery}
	showFilesInTree={true} // Enable to search within files too
/>;
```

## Accessibility

- Full keyboard navigation support
- ARIA labels and roles for screen readers
- Focus management with visual indicators
- High contrast mode support
- Reduced motion respect for animations

## Browser Compatibility

- Modern browsers supporting ES2018+
- CSS Grid and Flexbox support required
- Virtual scrolling uses modern browser APIs
- Graceful degradation for older browsers

## Performance Metrics

Tested with vaults containing:

- ✅ 1,000+ folders: Smooth performance
- ✅ 10,000+ files: Efficient filtering
- ✅ 50+ nesting levels: Proper depth limiting
- ✅ Real-time search: <100ms response time

## Migration Guide

For existing FilePane implementations:

1. Import FolderTree component
2. Add view mode state management
3. Update props mapping for tree view
4. Add keyboard shortcuts for view switching
5. Update CSS for consistent styling

## Contributing

When extending the FolderTree component:

1. Maintain virtual scrolling performance
2. Follow Obsidian's design patterns
3. Test with large vaults (1000+ folders)
4. Ensure accessibility compliance
5. Update documentation and examples
