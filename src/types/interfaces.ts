import { TAbstractFile, TFolder, WorkspaceLeaf, App } from 'obsidian';

export interface MidnightCommanderSettings {
	// View settings
	showHiddenFiles: boolean;
	openViewOnStart: boolean;

	// Panel location control settings
	defaultLocation: 'left' | 'right';
	rememberLocation: boolean;
	openOnStartup: boolean;

	// Keyboard settings
	vimBindings: boolean;

	// UI settings
	showFileIcons: boolean;
	activePane: 'left' | 'right';

	// File opening behavior
	fileOpenBehavior: 'replace' | 'new-tab' | 'adjacent-pane' | 'split-right';

	// New settings for polish phase
	showBreadcrumbs: boolean;
	previewDelay: number;
	keymapProfile: 'default' | 'vim';
	centerBreadcrumbs: boolean;

	// Enhanced keyboard shortcuts settings
	bookmarks?: BookmarkItem[];

	// Theme and appearance settings
	theme: string;
	customCssOverrides?: string;
	colorScheme?: 'auto' | 'light' | 'dark';
	fontSize?: 'small' | 'medium' | 'large';
	fontFamily?: string;
	compactMode?: boolean;

	// Layout settings
	layoutOrientation: 'vertical' | 'horizontal';
	rememberPaneSizes: boolean;

	// Pane size persistence per orientation
	verticalPaneSizes?: {
		topPaneHeight: number;
		bottomPaneHeight: number;
	};
	horizontalPaneSizes?: {
		leftPaneWidth: number;
		rightPaneWidth: number;
	};
}

export interface BookmarkItem {
	name: string;
	path: string;
}

export interface PaneState {
	id: 'left' | 'right';
	currentFolder: TFolder;
	files: TAbstractFile[];
	selectedIndex: number;
	selectedFiles: Set<string>;
	isActive: boolean;
	lastClickedIndex?: number; // Track anchor point for range selection
	filter?: FilterState; // Optional filter state
}

export interface FileClickOptions {
	newTab?: boolean;
	modifier?: 'ctrl' | 'cmd' | 'alt' | 'shift';
}

export interface ContextMenuPosition {
	x: number;
	y: number;
}

export interface MidnightCommanderViewProps {
	leaf: WorkspaceLeaf;
}

export interface DualPaneManagerProps {
	app: App;
	leftPane: PaneState;
	rightPane: PaneState;
	layoutOrientation: 'vertical' | 'horizontal';
	settings: MidnightCommanderSettings;
	onPaneStateChange: (
		paneId: 'left' | 'right',
		newState: Partial<PaneState>
	) => void;
	onFileClick: (
		file: TAbstractFile,
		paneId: 'left' | 'right',
		options?: FileClickOptions
	) => void;
	onFileContextMenu: (
		file: TAbstractFile,
		paneId: 'left' | 'right',
		position: ContextMenuPosition
	) => void;
	onNavigateToFolder: (folder: TFolder, paneId: 'left' | 'right') => void;
	onFilterChange?: (paneId: 'left' | 'right', options: FilterOptions) => void;
	onFilterToggle?: (paneId: 'left' | 'right', isActive: boolean) => void;
	onFilterClear?: (paneId: 'left' | 'right') => void;
	onPaneSizeChange?: (
		orientation: 'vertical' | 'horizontal',
		sizes: {
			topPaneHeight?: number;
			bottomPaneHeight?: number;
			leftPaneWidth?: number;
			rightPaneWidth?: number;
		}
	) => void;
}

export interface FilePaneProps {
	app: App;
	paneState: PaneState;
	onStateChange: (newState: Partial<PaneState>) => void;
	onFileClick: (file: TAbstractFile, options?: FileClickOptions) => void;
	onFileContextMenu: (
		file: TAbstractFile,
		position: ContextMenuPosition
	) => void;
	onNavigateToFolder: (folder: TFolder) => void;
	onFilterChange?: (options: FilterOptions) => void;
	onFilterToggle?: (isActive: boolean) => void;
	onFilterClear?: () => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
}

export interface FileItemProps {
	file: TAbstractFile;
	isSelected: boolean;
	isHighlighted: boolean;
	onClick: (file: TAbstractFile, event: React.MouseEvent) => void;
	onContextMenu: (file: TAbstractFile, event: React.MouseEvent) => void;
	onDoubleClick: (file: TAbstractFile, event: React.MouseEvent) => void;
}

// Theme system interfaces
export interface MCTheme {
	id: string;
	name: string;
	description: string;
	type: 'built-in' | 'custom';
	cssVariables: Record<string, string>;
	cssFile?: string;
	customCss?: string;
}

export interface ThemeSettings {
	fontSize: 'small' | 'medium' | 'large';
	fontFamily: string;
	compactMode: boolean;
	colorScheme: 'auto' | 'light' | 'dark';
	customCssOverrides: string;
}

// File filtering interfaces
export interface FilterOptions {
	query: string;
	isRegex: boolean;
	isGlob: boolean;
	caseSensitive: boolean;
	showFoldersOnly: boolean;
	showFilesOnly: boolean;
}

export interface FilterState {
	isActive: boolean;
	options: FilterOptions;
	originalFiles: TAbstractFile[];
	filteredFiles: TAbstractFile[];
}

export interface FileFilterProps {
	paneId: 'left' | 'right';
	filterState?: FilterState;
	onFilterChange: (options: FilterOptions) => void;
	onFilterToggle: (isActive: boolean) => void;
	onFilterClear: () => void;
}

// Tree view interfaces
export interface TreeNodeProps {
	folder: TFolder;
	level: number;
	isExpanded: boolean;
	isSelected: boolean;
	isFocused: boolean;
	onToggleExpand: (folder: TFolder) => void;
	onNavigate: (folder: TFolder) => void;
	onFocus: (folder: TFolder) => void;
	onContextMenu: (folder: TFolder, event: React.MouseEvent) => void;
}

export interface NestedFoldersProps {
	folders: TFolder[];
	level: number;
	expandedFolders: Set<string>;
	selectedFolder: TFolder | null;
	focusedFolder: TFolder | null;
	onToggleExpand: (folder: TFolder) => void;
	onNavigate: (folder: TFolder) => void;
	onFocus: (folder: TFolder) => void;
	onContextMenu: (folder: TFolder, event: React.MouseEvent) => void;
	maxRenderDepth?: number;
}

export interface FolderTreeProps {
	app: App;
	rootFolder: TFolder;
	paneId: 'left' | 'right';
	isActive: boolean;
	onNavigateToFolder: (folder: TFolder) => void;
	onFileClick?: (file: TAbstractFile) => void;
	onContextMenu?: (item: TAbstractFile, event: React.MouseEvent) => void;
	height: number;
	width: number;
	showFileCount?: boolean;
	sortBy?: 'name' | 'modified' | 'size';
	searchQuery?: string;
	showFilesInTree?: boolean;
	maxRenderDepth?: number;
}

export interface TreeActionsProps {
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
	isCompact?: boolean;
	isActive?: boolean;
	totalItems?: number;
	visibleItems?: number;
}
