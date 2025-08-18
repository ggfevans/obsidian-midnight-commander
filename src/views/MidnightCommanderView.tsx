import { ItemView, WorkspaceLeaf, TFolder, TAbstractFile, TFile, Menu } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { RecoilRoot } from 'recoil';
import React from 'react';
import MidnightCommanderPlugin from '../../main';
import { DualPaneManager } from './DualPaneManager';
import { PaneState, MidnightCommanderSettings } from '../types/interfaces';
import { FileOperations } from '../operations/FileOperations';
import { FolderMenu } from '../core/FolderMenu';
import { PopupMenu } from '../core/PopupMenu';
import { NavigationService } from '../services/NavigationService';
import { EventManager } from '../utils/EventManager';

export const VIEW_TYPE_MIDNIGHT_COMMANDER = 'midnight-commander-view';

export class MidnightCommanderView extends ItemView {
	plugin: MidnightCommanderPlugin;
	root: Root;
	leftPane: PaneState;
	rightPane: PaneState;
	settings: MidnightCommanderSettings;
	fileOperations: FileOperations;
	navigationService: NavigationService;
	eventManager: EventManager;

	constructor(leaf: WorkspaceLeaf, plugin: MidnightCommanderPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.settings = plugin.settings;
		
		// Initialize event manager for this view
		this.eventManager = new EventManager(this.app, this);
		
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
		this.navigationService = new NavigationService(this.app);
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
		
		// Register view-specific events for file/workspace changes
		this.setupWorkspaceEvents();
		
		// Register basic keyboard handlers - check if scope exists
		if (this.scope) {
			// Register the scope with our event manager for cleanup
			this.eventManager.registerScope(this.scope);
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

			// Quick Explorer style folder navigation (F9)
			this.scope.register([], "F9", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.showFolderMenu();
				return false;
			});

			// Command palette (Ctrl+P)
			this.scope.register(["Mod"], "p", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.showCommandPalette();
				return false;
			});

			// File navigation commands (Ctrl+Shift combinations)
			this.scope.register(["Mod", "Shift"], "ArrowUp", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.navigateToFirstFile();
				return false;
			});

			this.scope.register(["Mod", "Shift"], "ArrowDown", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.navigateToLastFile();
				return false;
			});

			this.scope.register(["Mod"], "ArrowUp", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.navigateToPreviousFile();
				return false;
			});

			this.scope.register(["Mod"], "ArrowDown", (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.navigateToNextFile();
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
		// Cleanup event manager first
		if (this.eventManager) {
			this.eventManager.cleanup();
		}
		
		this.destroy();
	}

	destroy() {
		if (this.root) {
			this.root.unmount();
		}
		
		// Call parent cleanup to ensure proper cleanup
		if (this.eventManager) {
			this.eventManager.cleanup();
		}
	}

	/**
	 * Setup workspace events for file/folder changes
	 */
	private setupWorkspaceEvents() {
		// Listen for file creation, deletion, and rename events
		this.eventManager.registerAppEvent('vault', 'create', (file: TAbstractFile) => {
			this.onVaultFileChange('create', file);
		});

		this.eventManager.registerAppEvent('vault', 'delete', (file: TAbstractFile) => {
			this.onVaultFileChange('delete', file);
		});

		this.eventManager.registerAppEvent('vault', 'rename', (file: TAbstractFile, oldPath: string) => {
			this.onVaultFileChange('rename', file, oldPath);
		});

		// Listen for workspace layout changes
		this.eventManager.registerAppEvent('workspace', 'layout-change', () => {
			// Re-render to handle any layout changes
			this.renderDualPane();
		});

		// Listen for active leaf changes to update context
		this.eventManager.registerAppEvent('workspace', 'active-leaf-change', (leaf: WorkspaceLeaf) => {
			// Could be used to synchronize with active file in the future
			console.debug('Active leaf changed:', leaf);
		});
	}

	/**
	 * Handle vault file changes by refreshing affected panes
	 */
	private onVaultFileChange(eventType: 'create' | 'delete' | 'rename', file: TAbstractFile, oldPath?: string) {
		// Check if the file change affects either pane
		const leftNeedsRefresh = this.fileChangeAffectsPane(this.leftPane, file, oldPath);
		const rightNeedsRefresh = this.fileChangeAffectsPane(this.rightPane, file, oldPath);

		if (leftNeedsRefresh) {
			this.refreshPane(this.leftPane);
		}

		if (rightNeedsRefresh) {
			this.refreshPane(this.rightPane);
		}
	}

	/**
	 * Check if a file change affects a specific pane
	 */
	private fileChangeAffectsPane(pane: PaneState, file: TAbstractFile, oldPath?: string): boolean {
		// Check if the file is in the current folder of the pane
		if (file.parent === pane.currentFolder) {
			return true;
		}

		// For rename events, also check if the old path was in this folder
		if (oldPath) {
			const oldParentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
			if (oldParentPath === pane.currentFolder.path) {
				return true;
			}
		}

		return false;
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
		// Use Obsidian's native Menu class with comprehensive menu items
		const activePane = this.getActivePane();
		const menu = new Menu();

		// Let Obsidian populate the menu with standard operations first
		this.app.workspace.trigger('file-menu', menu, file, 'file-explorer');

		// Add missing items that should be in folder context menus
		if (file instanceof TFolder) {
			// Add "New" items for folders at the top
			menu.addItem((item) => {
				item.setTitle('New note')
					.setIcon('edit')
					.onClick(async () => {
						// Create new note in this folder
						try {
							const newFile = await this.app.vault.create(
								`${file.path}/Untitled.md`,
								''
							);
							this.app.workspace.getLeaf().openFile(newFile);
							this.refreshPane(activePane);
						} catch (error) {
							console.error('Failed to create new note:', error);
						}
					});
			});

			menu.addItem((item) => {
				item.setTitle('New folder')
					.setIcon('folder-plus')
					.onClick(async () => {
						// Create new folder
						await this.fileOperations.createNewFolder(file);
						this.refreshPane(activePane);
					});
			});

			menu.addSeparator();

			// Add "Make a copy" for folders
			menu.addItem((item) => {
				item.setTitle('Make a copy')
					.setIcon('copy')
					.onClick(async () => {
						try {
							await this.fileOperations.copyFileInPlace(file);
							this.refreshPane(activePane);
						} catch (error) {
							console.error('Failed to copy folder:', error);
						}
					});
			});

			// Add "Search in folder"
			menu.addItem((item) => {
				item.setTitle('Search in folder')
					.setIcon('search')
					.onClick(() => {
						// Open search with folder constraint
						(this.app as any).internalPlugins.plugins['global-search'].instance.openGlobalSearch(`path:${file.path}`);
					});
			});

			menu.addSeparator();
		} else {
			// Add "Make a copy" for files
			menu.addItem((item) => {
				item.setTitle('Make a copy')
					.setIcon('copy')
					.onClick(async () => {
						try {
							await this.fileOperations.copyFileInPlace(file);
							this.refreshPane(activePane);
						} catch (error) {
							console.error('Failed to copy file:', error);
						}
					});
			});

			menu.addSeparator();
		}

		// Add Rename and Delete for both files and folders
		// Note: We'll add these items regardless since we can't easily check existing items

		menu.addItem((item) => {
			item.setTitle('Rename...')
				.setIcon('pencil')
				.onClick(async () => {
					try {
						await this.fileOperations.renameFile(file);
						this.refreshPane(activePane);
					} catch (error) {
						console.error('Failed to rename file:', error);
					}
				});
		});

		menu.addItem((item) => {
			item.setTitle('Delete')
				.setIcon('trash')
				.onClick(async () => {
					await this.fileOperations.deleteFiles([file]);
					this.refreshPane(activePane);
				});
			// Add the warning class to make it red like the native delete button
			(item as any).dom.addClass('is-warning');
		});

		// Show the menu at the mouse position
		menu.showAtPosition(position);
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
			// Calculate position from the selected element
			const paneElement = this.contentEl.querySelector(
				activePane.id === 'left' ? '.file-pane:first-child' : '.file-pane:last-child'
			) as HTMLElement;
			
			if (paneElement) {
				const rect = paneElement.getBoundingClientRect();
				const position = {
					x: rect.left + rect.width / 2,
					y: rect.top + activePane.selectedIndex * 36 // Approximate position
				};
				this.handleFileContextMenu(currentFile, activePane.id, position);
			}
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

	// ====================
	// POPUP MENU INTEGRATION
	// ====================

	/**
	 * Show folder menu for active pane (F9 shortcut)
	 */
	private showFolderMenu() {
		const activePane = this.getActivePane();
		const folderMenu = new FolderMenu({
			app: this.app,
			folder: activePane.currentFolder,
			showHiddenFiles: this.settings.showHiddenFiles,
			onFileSelect: (file) => {
				if (file instanceof TFile) {
					// Open the file
					this.app.workspace.getLeaf().openFile(file);
				}
			},
			onFolderNavigate: (folder) => {
				// Navigate to the folder in active pane
				this.navigateToFolder(activePane, folder);
			},
			enableAutoPreview: true,
			previewDelay: 300
		});

		// Position menu next to the active pane
		const paneElement = this.contentEl.querySelector(
			activePane.id === 'left' ? '.file-pane:first-child' : '.file-pane:last-child'
		) as HTMLElement;

		if (paneElement) {
			folderMenu.cascade({
				target: paneElement,
				event: undefined,
				onClose: () => folderMenu.hide()
			});
		}
	}

	/**
	 * Show command palette (Ctrl+P shortcut)
	 */
	private showCommandPalette() {
		const commandMenu = new PopupMenu({
			className: 'command-palette',
			items: [
				{
					title: 'Toggle hidden files',
					icon: 'eye',
					callback: () => {
						this.settings.showHiddenFiles = !this.settings.showHiddenFiles;
						this.plugin.saveSettings();
						// Refresh both panes
						this.refreshPane(this.leftPane);
						this.refreshPane(this.rightPane);
					}
				},
				{
					title: 'Switch to left pane',
					icon: 'arrow-left',
					callback: () => {
						this.leftPane.isActive = true;
						this.rightPane.isActive = false;
						this.settings.activePane = 'left';
						this.plugin.saveSettings();
						this.renderDualPane();
					}
				},
				{
					title: 'Switch to right pane',
					icon: 'arrow-right',
					callback: () => {
						this.leftPane.isActive = false;
						this.rightPane.isActive = true;
						this.settings.activePane = 'right';
						this.plugin.saveSettings();
						this.renderDualPane();
					}
				},
				{
					title: 'Refresh current pane',
					icon: 'refresh-cw',
					callback: () => {
						this.refreshPane(this.getActivePane());
					}
				},
				{
					title: 'Go to vault root',
					icon: 'home',
					callback: () => {
						const activePane = this.getActivePane();
						const rootFolder = this.app.vault.getRoot();
						this.navigateToFolder(activePane, rootFolder);
					}
				},
				{
					title: 'Create new folder...',
					icon: 'folder-plus',
					callback: () => {
						this.createNewFolder();
					}
				},
				{
					title: 'Navigate to next file',
					icon: 'arrow-down-circle',
					callback: () => {
						this.navigateToNextFile();
					}
				},
				{
					title: 'Navigate to previous file',
					icon: 'arrow-up-circle',
					callback: () => {
						this.navigateToPreviousFile();
					}
				},
				{
					title: 'Go to first file',
					icon: 'chevrons-up',
					callback: () => {
						this.navigateToFirstFile();
					}
				},
				{
					title: 'Go to last file',
					icon: 'chevrons-down',
					callback: () => {
						this.navigateToLastFile();
					}
				}
			]
		});

		// Position command palette in center of view
		const rect = this.contentEl.getBoundingClientRect();
		commandMenu.showAtPosition({
			x: rect.left + rect.width / 2 - 200, // Center horizontally
			y: rect.top + 100 // A bit down from top
		});
	}

	// ====================
	// ADVANCED NAVIGATION
	// ====================

	/**
	 * Navigate to next file in active pane using NavigationService
	 */
	private navigateToNextFile() {
		const activePane = this.getActivePane();
		const currentFile = activePane.files[activePane.selectedIndex];
		
		if (currentFile instanceof TFile) {
			const nextFile = this.navigationService.navigateFile(currentFile, 1, true);
			if (nextFile) {
				this.selectAndNavigateToFile(nextFile);
			}
		}
	}

	/**
	 * Navigate to previous file in active pane using NavigationService
	 */
	private navigateToPreviousFile() {
		const activePane = this.getActivePane();
		const currentFile = activePane.files[activePane.selectedIndex];
		
		if (currentFile instanceof TFile) {
			const prevFile = this.navigationService.navigateFile(currentFile, -1, true);
			if (prevFile) {
				this.selectAndNavigateToFile(prevFile);
			}
		}
	}

	/**
	 * Navigate to first file in current folder
	 */
	private navigateToFirstFile() {
		const activePane = this.getActivePane();
		const currentFile = activePane.files[activePane.selectedIndex];
		
		if (currentFile instanceof TFile) {
			const firstFile = this.navigationService.navigateFile(currentFile, -1, false);
			if (firstFile) {
				this.selectAndNavigateToFile(firstFile);
			}
		}
	}

	/**
	 * Navigate to last file in current folder
	 */
	private navigateToLastFile() {
		const activePane = this.getActivePane();
		const currentFile = activePane.files[activePane.selectedIndex];
		
		if (currentFile instanceof TFile) {
			const lastFile = this.navigationService.navigateFile(currentFile, 1, false);
			if (lastFile) {
				this.selectAndNavigateToFile(lastFile);
			}
		}
	}

	/**
	 * Select a file in the active pane and navigate folder if needed
	 */
	private selectAndNavigateToFile(file: TFile) {
		const activePane = this.getActivePane();
		
		// Check if file is in current folder
		if (file.parent === activePane.currentFolder) {
			// File is in current folder, just select it
			this.selectFileByName(activePane, file.name);
		} else {
			// Navigate to parent folder and select file
			if (file.parent) {
				this.navigateToFolder(activePane, file.parent);
				// Wait for next tick to ensure folder is loaded
				setTimeout(() => {
					this.selectFileByName(activePane, file.name);
				}, 0);
			}
		}
	}
}
