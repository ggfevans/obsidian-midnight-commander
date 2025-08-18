import { ItemView, WorkspaceLeaf, TFolder, TAbstractFile, TFile } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { RecoilRoot } from 'recoil';
import React from 'react';
import MidnightCommanderPlugin from '../../main';
import { DualPaneManager } from './DualPaneManager';
import { PaneState, MidnightCommanderSettings } from '../types/interfaces';
import { FileOperations } from '../operations/FileOperations';

export const VIEW_TYPE_MIDNIGHT_COMMANDER = 'midnight-commander-view';

export class MidnightCommanderView extends ItemView {
	plugin: MidnightCommanderPlugin;
	root: Root;
	leftPane: PaneState;
	rightPane: PaneState;
	settings: MidnightCommanderSettings;
	fileOperations: FileOperations;

	constructor(leaf: WorkspaceLeaf, plugin: MidnightCommanderPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.settings = plugin.settings;
		
		// Initialize pane states
		const rootFolder = this.app.vault.getRoot();
		this.leftPane = {
			id: 'left',
			currentFolder: rootFolder,
			files: this.getSortedFiles(rootFolder),
			selectedIndex: 0,
			selectedFiles: new Set(),
			isActive: this.settings.activePane === 'left',
		};
		
		this.rightPane = {
			id: 'right',
			currentFolder: rootFolder,
			files: this.getSortedFiles(rootFolder),
			selectedIndex: 0,
			selectedFiles: new Set(),
			isActive: this.settings.activePane === 'right',
		};
		
		// Initialize file operations
		this.fileOperations = new FileOperations(this.app);
	}

	getViewType(): string {
		return VIEW_TYPE_MIDNIGHT_COMMANDER;
	}

	getDisplayText(): string {
		return 'Midnight Commander';
	}

	getIcon(): string {
		return 'folder-open';
	}

	async onOpen(): Promise<void> {
		this.destroy();
		this.renderDualPane();
		
		// Register basic keyboard handlers - check if scope exists
		if (this.scope) {
			this.scope.register([], "Tab", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.switchActivePane();
				return false;
			});
			
			this.scope.register([], "Enter", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.handleEnterKey();
				return false;
			});
			
			this.scope.register([], "ArrowUp", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.moveSelection(-1);
				return false;
			});
			
			this.scope.register([], "ArrowDown", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.moveSelection(1);
				return false;
			});
			
			this.scope.register([], "ArrowLeft", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.navigateUp();
				return false;
			});
			
			this.scope.register([], "ArrowRight", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.navigateInto();
				return false;
			});
			
			// F-key file operations (Midnight Commander style)
			this.scope.register([], "F5", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.copySelectedFiles();
				return false;
			});
			
			this.scope.register([], "F6", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.moveSelectedFiles();
				return false;
			});
			
			this.scope.register([], "F7", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.createNewFolder();
				return false;
			});
			
			this.scope.register([], "F8", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.deleteSelectedFiles();
				return false;
			});
			
			// Multi-select operations
			this.scope.register([], " ", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.toggleFileSelection();
				return false;
			});
			
			this.scope.register(["Ctrl"], "a", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.selectAllFiles();
				return false;
			});
			
			this.scope.register(["Ctrl"], "d", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.deselectAllFiles();
				return false;
			});
			
			// Context menu shortcut
			this.scope.register([], "\\", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.showContextMenuForSelected();
				return false;
			});
		}
	}

	renderDualPane() {
		this.root = createRoot(this.contentEl);
		this.root.render(
			<div className="midnight-commander-view">
				<RecoilRoot>
					<DualPaneManager
						leftPane={this.leftPane}
						rightPane={this.rightPane}
						onPaneStateChange={this.handlePaneStateChange.bind(this)}
						onFileClick={this.handleFileClick.bind(this)}
						onFileContextMenu={this.handleFileContextMenu.bind(this)}
						onNavigateToFolder={this.handleNavigateToFolder.bind(this)}
					/>
				</RecoilRoot>
			</div>
		);
	}

	async onClose() {
		this.destroy();
	}

	destroy() {
		if (this.root) {
			this.root.unmount();
		}
	}

	// Helper methods
	private getSortedFiles(folder: TFolder): TAbstractFile[] {
		return folder.children.sort((a, b) => {
			// Folders first, then files, alphabetically
			if (a instanceof TFolder && !(b instanceof TFolder)) return -1;
			if (!(a instanceof TFolder) && b instanceof TFolder) return 1;
			return a.name.localeCompare(b.name);
		});
	}

	private getActivePane(): PaneState {
		return this.leftPane.isActive ? this.leftPane : this.rightPane;
	}

	private getInactivePane(): PaneState {
		return this.leftPane.isActive ? this.rightPane : this.leftPane;
	}

	// Keyboard navigation methods
	private switchActivePane() {
		this.leftPane.isActive = !this.leftPane.isActive;
		this.rightPane.isActive = !this.rightPane.isActive;
		this.settings.activePane = this.leftPane.isActive ? 'left' : 'right';
		this.plugin.saveSettings();
		
		// Clear multi-selections when switching panes to avoid confusion
		// Keep only the current cursor selection
		this.leftPane.selectedFiles.clear();
		this.rightPane.selectedFiles.clear();
		
		this.renderDualPane(); // Re-render to update active state
	}

	private moveSelection(direction: number) {
		const activePane = this.getActivePane();
		const newIndex = Math.max(0, Math.min(activePane.files.length - 1, activePane.selectedIndex + direction));
		activePane.selectedIndex = newIndex;
		this.renderDualPane();
	}

	private navigateUp() {
		const activePane = this.getActivePane();
		if (activePane.currentFolder.parent) {
			this.navigateToFolder(activePane, activePane.currentFolder.parent);
		}
	}

	private navigateInto() {
		const activePane = this.getActivePane();
		const selectedFile = activePane.files[activePane.selectedIndex];
		if (selectedFile instanceof TFolder) {
			this.navigateToFolder(activePane, selectedFile);
		}
	}

	private handleEnterKey() {
		const activePane = this.getActivePane();
		const selectedFile = activePane.files[activePane.selectedIndex];
		if (selectedFile instanceof TFolder) {
			this.navigateToFolder(activePane, selectedFile);
		} else if (selectedFile instanceof TFile) {
			// Open file
			this.app.workspace.getLeaf().openFile(selectedFile);
		}
	}

	private navigateToFolder(pane: PaneState, folder: TFolder) {
		pane.currentFolder = folder;
		pane.files = this.getSortedFiles(folder);
		pane.selectedIndex = 0;
		pane.selectedFiles.clear();
		this.renderDualPane();
	}

	// Event handlers for React components
	private handlePaneStateChange(paneId: 'left' | 'right', newState: Partial<PaneState>) {
		const pane = paneId === 'left' ? this.leftPane : this.rightPane;
		
		// Handle pane activation - when one pane becomes active, deactivate the other
		if (newState.isActive === true) {
			const otherPane = paneId === 'left' ? this.rightPane : this.leftPane;
			otherPane.isActive = false;
			this.settings.activePane = paneId;
			this.plugin.saveSettings();
			
			// Clear multi-selections when switching panes to avoid confusion
			this.leftPane.selectedFiles.clear();
			this.rightPane.selectedFiles.clear();
		}
		
		Object.assign(pane, newState);
		this.renderDualPane();
	}

	private handleFileClick(file: TAbstractFile, paneId: 'left' | 'right', options?: any) {
		const pane = paneId === 'left' ? this.leftPane : this.rightPane;
		
		if (file instanceof TFolder) {
			this.navigateToFolder(pane, file);
		} else if (file instanceof TFile) {
			// Open file
			const leaf = options?.newTab ? this.app.workspace.getLeaf('tab') : this.app.workspace.getLeaf();
			leaf.openFile(file);
		}
	}

	private handleFileContextMenu(file: TAbstractFile, paneId: 'left' | 'right', position: any) {
		// Context menu will be implemented in a later phase
		console.log('Context menu requested for:', file.name, 'in pane:', paneId);
	}

	private handleNavigateToFolder(folder: TFolder, paneId: 'left' | 'right') {
		const pane = paneId === 'left' ? this.leftPane : this.rightPane;
		this.navigateToFolder(pane, folder);
	}
	
	// ====================
	// FILE OPERATIONS (F-KEY FUNCTIONALITY)
	// ====================
	
	/**
	 * F5 - Copy selected files from active pane to inactive pane
	 */
	private async copySelectedFiles() {
		const activePane = this.getActivePane();
		const inactivePane = this.getInactivePane();
		const selectedFiles = this.getSelectedFiles(activePane);
		
		if (selectedFiles.length === 0) {
			// If no files are explicitly selected, use the currently highlighted file
			const currentFile = activePane.files[activePane.selectedIndex];
			if (currentFile) {
				selectedFiles.push(currentFile);
			}
		}
		
		try {
			await this.fileOperations.copyFiles(selectedFiles, inactivePane.currentFolder);
			// Refresh the inactive pane to show copied files
			this.refreshPane(inactivePane);
		} catch (error) {
			console.error('Copy operation failed:', error);
		}
	}
	
	/**
	 * F6 - Move selected files from active pane to inactive pane
	 */
	private async moveSelectedFiles() {
		const activePane = this.getActivePane();
		const inactivePane = this.getInactivePane();
		const selectedFiles = this.getSelectedFiles(activePane);
		
		if (selectedFiles.length === 0) {
			// If no files are explicitly selected, use the currently highlighted file
			const currentFile = activePane.files[activePane.selectedIndex];
			if (currentFile) {
				selectedFiles.push(currentFile);
			}
		}
		
		try {
			await this.fileOperations.moveFiles(selectedFiles, inactivePane.currentFolder);
			// Refresh both panes
			this.refreshPane(activePane);
			this.refreshPane(inactivePane);
		} catch (error) {
			console.error('Move operation failed:', error);
		}
	}
	
	/**
	 * F7 - Create new folder in active pane
	 */
	private async createNewFolder() {
		const activePane = this.getActivePane();
		
		try {
			const newFolder = await this.fileOperations.createNewFolder(activePane.currentFolder);
			if (newFolder) {
				// Refresh the active pane and select the new folder
				this.refreshPane(activePane);
				this.selectFileByName(activePane, newFolder.name);
			}
		} catch (error) {
			console.error('Create folder operation failed:', error);
		}
	}
	
	/**
	 * F8 - Delete selected files
	 */
	private async deleteSelectedFiles() {
		const activePane = this.getActivePane();
		const selectedFiles = this.getSelectedFiles(activePane);
		
		if (selectedFiles.length === 0) {
			// If no files are explicitly selected, use the currently highlighted file
			const currentFile = activePane.files[activePane.selectedIndex];
			if (currentFile) {
				selectedFiles.push(currentFile);
			}
		}
		
		try {
			await this.fileOperations.deleteFiles(selectedFiles);
			// Refresh the active pane
			this.refreshPane(activePane);
			// Clear selection
			activePane.selectedFiles.clear();
		} catch (error) {
			console.error('Delete operation failed:', error);
		}
	}
	
	// ====================
	// MULTI-SELECT FUNCTIONALITY
	// ====================
	
	/**
	 * Space - Toggle selection of current file
	 */
	private toggleFileSelection() {
		const activePane = this.getActivePane();
		const currentFile = activePane.files[activePane.selectedIndex];
		
		if (currentFile) {
			if (activePane.selectedFiles.has(currentFile.path)) {
				activePane.selectedFiles.delete(currentFile.path);
			} else {
				activePane.selectedFiles.add(currentFile.path);
			}
			
			// Move to next file after selection
			if (activePane.selectedIndex < activePane.files.length - 1) {
				activePane.selectedIndex++;
			}
			
			this.renderDualPane();
		}
	}
	
	/**
	 * Ctrl+A - Select all files in active pane
	 */
	private selectAllFiles() {
		const activePane = this.getActivePane();
		activePane.selectedFiles.clear();
		
		for (const file of activePane.files) {
			activePane.selectedFiles.add(file.path);
		}
		
		this.renderDualPane();
	}
	
	/**
	 * Ctrl+D - Deselect all files in active pane
	 */
	private deselectAllFiles() {
		const activePane = this.getActivePane();
		activePane.selectedFiles.clear();
		this.renderDualPane();
	}
	
	/**
	 * \\ - Show context menu for selected file(s)
	 */
	private showContextMenuForSelected() {
		const activePane = this.getActivePane();
		const currentFile = activePane.files[activePane.selectedIndex];
		
		if (currentFile) {
			// TODO: Implement context menu
			console.log('Show context menu for:', currentFile.name);
		}
	}
	
	// ====================
	// HELPER METHODS
	// ====================
	
	/**
	 * Get array of currently selected files in a pane
	 */
	private getSelectedFiles(pane: PaneState): TAbstractFile[] {
		const selectedFiles: TAbstractFile[] = [];
		
		for (const file of pane.files) {
			if (pane.selectedFiles.has(file.path)) {
				selectedFiles.push(file);
			}
		}
		
		return selectedFiles;
	}
	
	/**
	 * Refresh a pane by reloading its file list
	 */
	private refreshPane(pane: PaneState) {
		pane.files = this.getSortedFiles(pane.currentFolder);
		// Adjust selected index if it's out of bounds
		if (pane.selectedIndex >= pane.files.length) {
			pane.selectedIndex = Math.max(0, pane.files.length - 1);
		}
		this.renderDualPane();
	}
	
	/**
	 * Select a file by name in the given pane
	 */
	private selectFileByName(pane: PaneState, fileName: string) {
		const fileIndex = pane.files.findIndex(file => file.name === fileName);
		if (fileIndex >= 0) {
			pane.selectedIndex = fileIndex;
			this.renderDualPane();
		}
	}
}
