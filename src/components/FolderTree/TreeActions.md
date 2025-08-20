# TreeActions Component

The `TreeActions` component provides comprehensive tree control functionality for the Obsidian Midnight Commander plugin, offering a compact toolbar with tree-wide operations, view toggles, and filtering controls.

## Features

### Core Operations

- **View Mode Toggle**: Switch between tree and list view
- **Tree Operations**: Expand all, collapse all, refresh
- **Sorting Controls**: Sort by name, modified date, or size
- **Search Functionality**: Debounced search with clear button
- **File Visibility**: Toggle files display in tree view

### UI/UX Features

- **Compact Design**: Fits seamlessly in pane headers
- **Responsive Layout**: Adapts to narrow panes
- **Accessibility**: Full ARIA support and keyboard navigation
- **Visual Feedback**: Active states, badges, and loading indicators
- **Obsidian Integration**: Consistent with native styling

## Props Interface

```typescript
interface TreeActionsProps {
	paneId: 'left' | 'right';
	viewMode: 'tree' | 'list';
	sortBy: 'name' | 'modified' | 'size';
	showFilesInTree: boolean;
	searchQuery: string;
	onToggleView: (mode: 'tree' | 'list') => void;
	onChangeSorting: (sortBy: 'name' | 'modified' | 'size') => void;
	onToggleFiles: (show: boolean) => void;
	onSearchChange: (query: string) => void;
	onExpandAll: () => void;
	onCollapseAll: () => void;
	onRefresh: () => void;
	isCompact?: boolean; // Optional: Use compact mode
	isActive?: boolean; // Optional: Pane active state
	totalItems?: number; // Optional: Total item count
	visibleItems?: number; // Optional: Visible after filtering
}
```

## Basic Usage

```tsx
import { TreeActions } from './components/FolderTree';

<TreeActions
	paneId="left"
	viewMode="tree"
	sortBy="name"
	showFilesInTree={false}
	searchQuery=""
	onToggleView={mode => setViewMode(mode)}
	onChangeSorting={sort => setSortBy(sort)}
	onToggleFiles={show => setShowFilesInTree(show)}
	onSearchChange={query => setSearchQuery(query)}
	onExpandAll={() => expandAllFolders()}
	onCollapseAll={() => collapseAllFolders()}
	onRefresh={() => refreshTree()}
	isCompact={true}
	isActive={true}
/>;
```

## Integration with FilePane Header

```tsx
// In your FilePane component
<div className="pane-header">
	<div className="pane-path">
		<BreadcrumbNavigation
			currentFolder={paneState.currentFolder}
			onNavigateToFolder={onNavigateToFolder}
			isActive={paneState.isActive}
		/>
		<span className="pane-file-count">({files.length} items)</span>
	</div>

	<TreeActions
		paneId={paneState.id}
		viewMode={viewMode}
		sortBy={sortBy}
		showFilesInTree={showFilesInTree}
		searchQuery={searchQuery}
		onToggleView={handleToggleView}
		onChangeSorting={handleChangeSorting}
		onToggleFiles={handleToggleFiles}
		onSearchChange={handleSearchChange}
		onExpandAll={handleExpandAll}
		onCollapseAll={handleCollapseAll}
		onRefresh={handleRefresh}
		isCompact={true}
		isActive={paneState.isActive}
		totalItems={totalItems}
		visibleItems={visibleItems}
	/>

	<div className="pane-status">
		{paneState.isActive && <span className="pane-active-indicator">●</span>}
	</div>
</div>
```

## Integration with FolderTree

The TreeActions component works with the FolderTree component through a global operations interface:

```tsx
// FolderTree exposes operations via window object
const treeOperations = window[`folderTreeOperations_${paneId}`];

const handleExpandAll = () => {
	treeOperations?.expandAll();
};

const handleCollapseAll = () => {
	treeOperations?.collapseAll();
};
```

## State Management Example

```tsx
const [treeState, setTreeState] = useState({
	viewMode: 'tree' as 'tree' | 'list',
	sortBy: 'name' as 'name' | 'modified' | 'size',
	showFilesInTree: false,
	searchQuery: '',
});

const handleToggleView = useCallback((mode: 'tree' | 'list') => {
	setTreeState(prev => ({ ...prev, viewMode: mode }));
}, []);

const handleChangeSorting = useCallback(
	(sortBy: 'name' | 'modified' | 'size') => {
		setTreeState(prev => ({ ...prev, sortBy }));
	},
	[]
);

const handleToggleFiles = useCallback((show: boolean) => {
	setTreeState(prev => ({ ...prev, showFilesInTree: show }));
}, []);

const handleSearchChange = useCallback((query: string) => {
	setTreeState(prev => ({ ...prev, searchQuery: query }));
}, []);
```

## CSS Integration

The component uses the existing tree-components.css styles. To integrate in pane headers:

```css
.pane-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: 6px 8px;
}

.pane-header .tree-actions {
	flex: 1;
	max-width: 300px;
	border-bottom: none;
	background: transparent;
}

.pane-header .tree-actions.compact {
	max-width: 200px;
}
```

## Button Layout

### Primary Group (Left)

- **View Toggle**: Tree ↔ List mode
- **Search**: Expandable search input with clear button
- **Sort**: Dropdown with name/modified/size options

### Secondary Group (Right)

- **Files Toggle**: Show/hide files in tree (tree mode only)
- **Expand All**: Expand all folders (tree mode only)
- **Collapse All**: Collapse all folders (tree mode only)
- **Refresh**: Refresh tree data

## Keyboard Shortcuts

- **Escape**: Close search input or dropdowns
- **Ctrl+F**: Focus search (when search button is clicked)
- **Ctrl+Enter**: Toggle advanced options (in search mode)
- **Tab/Shift+Tab**: Navigate between buttons
- **Enter/Space**: Activate focused button
- **Arrow Keys**: Navigate dropdown options

## Accessibility Features

- Full ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- High contrast mode support
- Reduced motion support

## Responsive Behavior

### Standard Mode (width > 300px)

- Full button set with text labels
- Expanded dropdown menus
- Search input expands to 200px max

### Compact Mode (width ≤ 300px)

- Smaller buttons and spacing
- Icon-only buttons
- Condensed dropdown menus
- Search input limited to 120px

### Narrow Pane Mode (width < 200px)

- Ultra-compact buttons
- Essential controls only
- Minimal padding and gaps

## Integration with Existing Components

### FileFilter Integration

The TreeActions search functionality can work alongside the existing FileFilter component:

```tsx
// Coordinate search between TreeActions and FileFilter
const handleSearchChange = (query: string) => {
	setSearchQuery(query);

	// Also update FileFilter if needed
	if (onFilterChange) {
		onFilterChange({
			...filterOptions,
			query,
		});
	}
};
```

### Navigation Service Integration

```tsx
import { NavigationService } from '../services/NavigationService';

const handleRefresh = async () => {
	await NavigationService.refreshFolder(currentFolder);
	// Update tree state
};
```

## Performance Considerations

- Search input is debounced (300ms) to prevent excessive filtering
- Tree operations use efficient state updates
- Component uses React.memo for render optimization
- CSS animations respect `prefers-reduced-motion`

## Error Handling

The component gracefully handles:

- Missing tree operations (logs warnings)
- Invalid search queries (shows validation)
- Failed refresh operations (shows error states)
- Disabled buttons during operations

## Customization

### Theme Integration

The component automatically adapts to:

- Obsidian's light/dark themes
- Custom theme variables
- High contrast modes
- Font size preferences

### Plugin Settings

Integrate with plugin settings:

```tsx
const treeActionsProps = {
	...baseProps,
	isCompact: settings.compactMode,
	// Other setting-based props
};
```

## Testing

The component includes comprehensive test coverage for:

- User interactions
- Keyboard navigation
- State management
- Integration points
- Accessibility features

See `TreeActionsExample.tsx` for a complete implementation example.
