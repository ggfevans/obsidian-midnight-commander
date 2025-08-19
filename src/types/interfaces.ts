import { TAbstractFile, TFolder, WorkspaceLeaf, App } from 'obsidian';

export interface MidnightCommanderSettings {
	// View settings
	showHiddenFiles: boolean;
	openViewOnStart: boolean;
	
	// Keyboard settings
	vimBindings: boolean;
	
	// UI settings
	showFileIcons: boolean;
	activePane: 'left' | 'right';
	// New settings for polish phase
	showBreadcrumbs: boolean;
	previewDelay: number;
	keymapProfile: 'default' | 'vim';
	centerBreadcrumbs: boolean;
	
	// Enhanced keyboard shortcuts settings
	bookmarks?: BookmarkItem[];
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
	onPaneStateChange: (paneId: 'left' | 'right', newState: Partial<PaneState>) => void;
	onFileClick: (file: TAbstractFile, paneId: 'left' | 'right', options?: any) => void;
	onFileContextMenu: (file: TAbstractFile, paneId: 'left' | 'right', position: any) => void;
	onNavigateToFolder: (folder: TFolder, paneId: 'left' | 'right') => void;
}

export interface FilePaneProps {
	paneState: PaneState;
	onStateChange: (newState: Partial<PaneState>) => void;
	onFileClick: (file: TAbstractFile, options?: FileClickOptions) => void;
	onFileContextMenu: (file: TAbstractFile, position: ContextMenuPosition) => void;
	onNavigateToFolder: (folder: TFolder) => void;
}

export interface FileItemProps {
	file: TAbstractFile;
	isSelected: boolean;
	isHighlighted: boolean;
	onClick: (file: TAbstractFile, event: React.MouseEvent) => void;
	onContextMenu: (file: TAbstractFile, event: React.MouseEvent) => void;
	onDoubleClick: (file: TAbstractFile, event: React.MouseEvent) => void;
}
