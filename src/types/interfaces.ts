import { TAbstractFile, TFolder, WorkspaceLeaf } from 'obsidian';

export interface MidnightCommanderSettings {
	// View settings
	showHiddenFiles: boolean;
	openViewOnStart: boolean;
	
	// Keyboard settings
	vimBindings: boolean;
	
	// UI settings
	showFileIcons: boolean;
	activePane: 'left' | 'right';
}

export interface PaneState {
	id: 'left' | 'right';
	currentFolder: TFolder;
	files: TAbstractFile[];
	selectedIndex: number;
	selectedFiles: Set<string>;
	isActive: boolean;
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
	leftPane: PaneState;
	rightPane: PaneState;
	onPaneStateChange: (pane: 'left' | 'right', newState: Partial<PaneState>) => void;
	onFileClick: (file: TAbstractFile, pane: 'left' | 'right', options?: FileClickOptions) => void;
	onFileContextMenu: (file: TAbstractFile, pane: 'left' | 'right', position: ContextMenuPosition) => void;
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
