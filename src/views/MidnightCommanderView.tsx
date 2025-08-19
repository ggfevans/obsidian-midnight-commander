import {
	ItemView,
	WorkspaceLeaf,
	TFolder,
	TAbstractFile,
	TFile,
	Menu,
} from 'obsidian';
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
import { ThemeManager } from '../utils/ThemeManager';
import { FilterOptions, FilterState } from '../types/interfaces';
import * as path from 'path';
import { exec } from 'child_process';

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
	themeManager: ThemeManager;

	// State persistence
	private viewState: {
		leftPath: string;
		rightPath: string;
		activePane: 'left' | 'right';
		leftSelectedIndex: number;
		rightSelectedIndex: number;
	};

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

		// Initialize file operations with cache support
		this.fileOperations = new FileOperations(this.app, plugin.fileCache);
		this.navigationService = new NavigationService(this.app);

		// Initialize default view state
		this.viewState = {
			leftPath: rootFolder.path,
			rightPath: rootFolder.path,
			activePane: this.settings.activePane,
			leftSelectedIndex: 0,
			rightSelectedIndex: 0,
		};
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

		// Restore view state if available
		this.restoreViewState();

		// Initialize theme system
		await this.initializeTheme();

		this.renderDualPane();

		// Register view-specific events for file/workspace changes
		this.setupWorkspaceEvents();

		// Register basic keyboard handlers - check if scope exists
		if (this.scope) {
			// Register the scope with our event manager for cleanup
			this.eventManager.registerScope(this.scope);
			this.scope.register([], 'Tab', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.switchActivePane();
				return false;
			});

			this.scope.register([], 'Enter', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.handleEnterKey();
				return false;
			});

			this.scope.register([], 'ArrowUp', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.moveSelection(-1);
				return false;
			});

			this.scope.register([], 'ArrowDown', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.moveSelection(1);
				return false;
			});

			// Shift+Arrow keys for range selection
			this.scope.register(['Shift'], 'ArrowUp', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.extendSelection(-1);
				return false;
			});

			this.scope.register(['Shift'], 'ArrowDown', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.extendSelection(1);
				return false;
			});

			this.scope.register([], 'ArrowLeft', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.navigateUp();
				return false;
			});

			this.scope.register([], 'ArrowRight', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.navigateInto();
				return false;
			});

			// F-key file operations (Midnight Commander style)
			this.scope.register([], 'F5', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.copySelectedFiles();
				return false;
			});

			this.scope.register([], 'F6', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.moveSelectedFiles();
				return false;
			});

			this.scope.register([], 'F7', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.createNewFolder();
				return false;
			});

			this.scope.register([], 'F8', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.deleteSelectedFiles();
				return false;
			});

			// Multi-select operations
			this.scope.register([], ' ', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.toggleFileSelection();
				return false;
			});

			this.scope.register(['Ctrl'], 'a', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.selectAllFiles();
				return false;
			});

			this.scope.register(['Ctrl'], 'd', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.deselectAllFiles();
				return false;
			});

			// Context menu shortcut
			this.scope.register([], '\\', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.showContextMenuForSelected();
				return false;
			});

			// Quick Explorer style folder navigation (F9)
			this.scope.register([], 'F9', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.showFolderMenu();
				return false;
			});

			// Command palette (Ctrl+P)
			this.scope.register(['Mod'], 'p', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.showCommandPalette();
				return false;
			});

			// Quick search (Ctrl+F)
			this.scope.register(['Mod'], 'f', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.toggleQuickSearch();
				return false;
			});

			// Alternative quick search shortcut (/)
			this.scope.register([], '/', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.toggleQuickSearch();
				return false;
			});

			// File preview shortcut (Space)
			this.scope.register(['Shift'], ' ', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.showFilePreview();
				return false;
			});

			// Alternative file preview shortcut (F3)
			this.scope.register([], 'F3', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.showFilePreview();
				return false;
			});
			// File navigation commands (Ctrl+Shift combinations)
			this.scope.register(['Mod', 'Shift'], 'ArrowUp', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.navigateToFirstFile();
				return false;
			});

			this.scope.register(
				['Mod', 'Shift'],
				'ArrowDown',
				(evt: KeyboardEvent) => {
					evt.preventDefault();
					this.navigateToLastFile();
					return false;
				}
			);

			this.scope.register(['Mod'], 'ArrowUp', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.navigateToPreviousFile();
				return false;
			});

			this.scope.register(['Mod'], 'ArrowDown', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.navigateToNextFile();
				return false;
			});

			// Enhanced keyboard shortcuts for better navigation

			// Bookmark management (Ctrl+B to bookmark, Ctrl+Shift+B to view bookmarks)
			this.scope.register(['Mod'], 'b', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.bookmarkCurrentFolder();
				return false;
			});

			this.scope.register(['Mod', 'Shift'], 'b', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.showBookmarkMenu();
				return false;
			});

			// Folder history navigation (Alt+Left/Right)
			this.scope.register(['Alt'], 'ArrowLeft', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.goBackInHistory();
				return false;
			});

			this.scope.register(['Alt'], 'ArrowRight', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.goForwardInHistory();
				return false;
			});

			// Recent folders (Ctrl+H)
			this.scope.register(['Mod'], 'h', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.showRecentFoldersMenu();
				return false;
			});

			// Quick navigation to root (Ctrl+Home)
			this.scope.register(['Mod'], 'Home', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.navigateToRoot();
				return false;
			});

			// Duplicate file/folder (Ctrl+Shift+D)
			this.scope.register(['Mod', 'Shift'], 'd', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.duplicateSelectedFiles();
				return false;
			});

			// Rename file/folder (F2)
			this.scope.register([], 'F2', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.renameSelectedFile();
				return false;
			});

			// Properties/Info (F4)
			this.scope.register([], 'F4', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.showFileProperties();
				return false;
			});

			// Refresh current pane (F5 when not copying)
			this.scope.register(['Ctrl'], 'F5', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.refreshCurrentPane();
				return false;
			});

			// Focus address bar / Go to folder (Ctrl+L)
			this.scope.register(['Mod'], 'l', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.showGoToFolderDialog();
				return false;
			});

			// Toggle hidden files (Ctrl+.)
			this.scope.register(['Mod'], '.', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.toggleHiddenFiles();
				return false;
			});

			// Sort menu (Ctrl+S)
			this.scope.register(['Mod'], 's', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.showSortMenu();
				return false;
			});

			// Advanced selection shortcuts

			// Select files by pattern (Ctrl+Shift+A)
			this.scope.register(['Mod', 'Shift'], 'a', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.selectFilesByPattern();
				return false;
			});

			// Invert selection (Ctrl+Shift+I)
			this.scope.register(['Mod', 'Shift'], 'i', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.invertSelection();
				return false;
			});

			// Select all files (not folders) (Ctrl+Shift+F)
			this.scope.register(['Mod', 'Shift'], 'f', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.selectAllFiles();
				return false;
			});

			// Select all folders (Ctrl+Shift+D)
			this.scope.register(['Mod', 'Shift'], 'o', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.selectAllFolders();
				return false;
			});

			// Sync panes (Ctrl+Shift+S) - make both panes show same folder
			this.scope.register(['Mod', 'Shift'], 's', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.syncPanes();
				return false;
			});

			// Open in new tab (Ctrl+Enter)
			this.scope.register(['Mod'], 'Enter', (evt: KeyboardEvent) => {
				evt.preventDefault();
				this.openSelectedInNewTab();
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
						app={this.app}
						leftPane={this.leftPane}
						rightPane={this.rightPane}
						onPaneStateChange={this.handlePaneStateChange.bind(this)}
						onFileClick={this.handleFileClick.bind(this)}
						onFileContextMenu={this.handleFileContextMenu.bind(this)}
						onNavigateToFolder={this.handleNavigateToFolder.bind(this)}
						onFilterChange={this.handleFilterChange.bind(this)}
						onFilterToggle={this.handleFilterToggle.bind(this)}
						onFilterClear={this.handleFilterClear.bind(this)}
					/>
				</RecoilRoot>
			</div>
		);
	}

	/**
	 * Initialize theme system
	 */
	async initializeTheme(): Promise<void> {
		this.themeManager = new ThemeManager('.midnight-commander-view');
		this.addChild(this.themeManager);
		await this.themeManager.initialize(this.containerEl);
		await this.applyTheme();
	}

	/**
	 * Apply current theme settings
	 */
	async applyTheme(): Promise<void> {
		if (!this.themeManager) return;

		const settings = this.plugin.settings;
		await this.themeManager.applyTheme(settings.theme, {
			fontSize: settings.fontSize,
			fontFamily: settings.fontFamily,
			compactMode: settings.compactMode,
			colorScheme: settings.colorScheme,
			customCssOverrides: settings.customCssOverrides || '',
		});
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
		this.eventManager.registerAppEvent(
			'vault',
			'create',
			(file: TAbstractFile) => {
				this.onVaultFileChange('create', file);
			}
		);

		this.eventManager.registerAppEvent(
			'vault',
			'delete',
			(file: TAbstractFile) => {
				this.onVaultFileChange('delete', file);
			}
		);

		this.eventManager.registerAppEvent(
			'vault',
			'rename',
			(file: TAbstractFile, oldPath: string) => {
				this.onVaultFileChange('rename', file, oldPath);
			}
		);

		// Listen for workspace layout changes
		this.eventManager.registerAppEvent('workspace', 'layout-change', () => {
			// Re-render to handle any layout changes
			this.renderDualPane();
		});

		// Listen for active leaf changes to update context
		this.eventManager.registerAppEvent(
			'workspace',
			'active-leaf-change',
			(leaf: WorkspaceLeaf) => {
				// Could be used to synchronize with active file in the future
				console.debug('Active leaf changed:', leaf);
			}
		);
	}

	/**
	 * Handle vault file changes by refreshing affected panes
	 */
	private onVaultFileChange(
		eventType: 'create' | 'delete' | 'rename',
		file: TAbstractFile,
		oldPath?: string
	) {
		// Check if the file change affects either pane
		const leftNeedsRefresh = this.fileChangeAffectsPane(
			this.leftPane,
			file,
			oldPath
		);
		const rightNeedsRefresh = this.fileChangeAffectsPane(
			this.rightPane,
			file,
			oldPath
		);

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
	private fileChangeAffectsPane(
		pane: PaneState,
		file: TAbstractFile,
		oldPath?: string
	): boolean {
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
		const newIndex = Math.max(
			0,
			Math.min(
				activePane.files.length - 1,
				activePane.selectedIndex + direction
			)
		);
		activePane.selectedIndex = newIndex;
		// Clear multi-selection on regular arrow navigation
		activePane.selectedFiles.clear();
		// Update last clicked index for future range selections
		activePane.lastClickedIndex = newIndex;
		this.renderDualPane();
	}

	private extendSelection(direction: number) {
		const activePane = this.getActivePane();
		const newIndex = Math.max(
			0,
			Math.min(
				activePane.files.length - 1,
				activePane.selectedIndex + direction
			)
		);

		// Initialize lastClickedIndex if not set
		if (activePane.lastClickedIndex === undefined) {
			activePane.lastClickedIndex = activePane.selectedIndex;
		}

		// Create range selection from lastClickedIndex to new index
		const start = Math.min(activePane.lastClickedIndex, newIndex);
		const end = Math.max(activePane.lastClickedIndex, newIndex);

		const newSelection = new Set<string>();
		for (let i = start; i <= end; i++) {
			if (i >= 0 && i < activePane.files.length) {
				newSelection.add(activePane.files[i].path);
			}
		}

		activePane.selectedIndex = newIndex;
		activePane.selectedFiles = newSelection;
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

		// Prefetch metadata for files in this folder for better performance
		if (this.plugin.fileCache) {
			this.plugin.fileCache.prefetchFolder(folder.path);
		}

		// Update filter state if filter is active
		if (pane.filter?.isActive) {
			this.refreshFiles(pane);
		}

		this.renderDualPane();
	}

	/**
	 * Refresh files for a pane, applying current filter if active
	 */
	private refreshFiles(pane: PaneState) {
		const allFiles = this.getSortedFiles(pane.currentFolder);

		// Update filter state if filter is active
		if (pane.filter?.isActive) {
			const filteredFiles = this.filterFiles(allFiles, pane.filter.options);
			pane.filter = {
				...pane.filter,
				filteredFiles,
				originalFiles: allFiles,
			};
			pane.files = filteredFiles;
		} else {
			pane.files = allFiles;
		}

		// Ensure selected index is still valid
		if (pane.selectedIndex >= pane.files.length) {
			pane.selectedIndex = Math.max(0, pane.files.length - 1);
		}
	}

	/**
	 * Handle filter changes from the filter component
	 */
	private handleFilterChange(paneId: 'left' | 'right', options: FilterOptions) {
		const pane = paneId === 'left' ? this.leftPane : this.rightPane;
		const originalFiles = pane.filter?.originalFiles || pane.files;

		// Apply filtering
		const filteredFiles = this.filterFiles(originalFiles, options);

		// Update filter state
		const filterState: FilterState = {
			isActive: true,
			options,
			filteredFiles,
			originalFiles,
		};

		pane.filter = filterState;
		pane.files = filteredFiles;

		// Reset selection if current selection is out of bounds
		if (pane.selectedIndex >= filteredFiles.length) {
			pane.selectedIndex = Math.max(0, filteredFiles.length - 1);
		}

		this.renderDualPane();
	}

	/**
	 * Handle filter toggle (enable/disable)
	 */
	private handleFilterToggle(paneId: 'left' | 'right', isActive: boolean) {
		const pane = paneId === 'left' ? this.leftPane : this.rightPane;

		if (!isActive) {
			// Disable filtering - restore original files
			if (pane.filter?.originalFiles) {
				pane.files = pane.filter.originalFiles;
			}
			pane.filter = undefined;
		} else if (!pane.filter) {
			// Enable filtering with default options
			const defaultOptions: FilterOptions = {
				query: '',
				isRegex: false,
				isGlob: false,
				caseSensitive: false,
				showFoldersOnly: false,
				showFilesOnly: false,
			};
			this.handleFilterChange(paneId, defaultOptions);
			return; // handleFilterChange will call renderDualPane
		} else {
			// Toggle existing filter state
			pane.filter.isActive = isActive;
			if (isActive) {
				// Re-apply current filter
				this.handleFilterChange(paneId, pane.filter.options);
				return; // handleFilterChange will call renderDualPane
			} else {
				// Restore original files
				if (pane.filter.originalFiles) {
					pane.files = pane.filter.originalFiles;
				}
			}
		}

		this.renderDualPane();
	}

	/**
	 * Handle filter clear
	 */
	private handleFilterClear(paneId: 'left' | 'right') {
		const pane = paneId === 'left' ? this.leftPane : this.rightPane;

		if (pane.filter) {
			// Reset to original files
			if (pane.filter.originalFiles) {
				pane.files = pane.filter.originalFiles;
			}
			pane.filter = undefined;
		}

		this.renderDualPane();
	}

	// Event handlers for React components
	private handlePaneStateChange(
		paneId: 'left' | 'right',
		newState: Partial<PaneState>
	) {
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

	private handleFileClick(
		file: TAbstractFile,
		paneId: 'left' | 'right',
		options?: any
	) {
		const pane = paneId === 'left' ? this.leftPane : this.rightPane;

		if (file instanceof TFolder) {
			this.navigateToFolder(pane, file);
		} else if (file instanceof TFile) {
			// Open file
			const leaf = options?.newTab
				? this.app.workspace.getLeaf('tab')
				: this.app.workspace.getLeaf();
			leaf.openFile(file);
		}
	}

	private handleFileContextMenu(
		file: TAbstractFile,
		paneId: 'left' | 'right',
		position: any
	) {
		// Use Obsidian's native Menu class with comprehensive menu items
		const activePane = this.getActivePane();
		const menu = new Menu();

		// Let Obsidian populate the menu with standard operations first
		this.app.workspace.trigger('file-menu', menu, file, 'file-explorer');

		// Add missing items that should be in folder context menus
		if (file instanceof TFolder) {
			// Add "New" items for folders at the top
			menu.addItem(item => {
				item
					.setTitle('New note')
					.setIcon('edit')
					.onClick(async () => {
						// Create new note in this folder using FileOperations
						try {
							const newFile = await this.fileOperations.createNewFile(
								file,
								'Untitled.md',
								''
							);
							if (newFile) {
								this.app.workspace.getLeaf().openFile(newFile);
								this.refreshPane(activePane);
							}
						} catch (error) {
							console.error('Failed to create new note:', error);
						}
					});
			});

			menu.addItem(item => {
				item
					.setTitle('New folder')
					.setIcon('folder-plus')
					.onClick(async () => {
						// Create new folder
						await this.fileOperations.createNewFolder(file);
						this.refreshPane(activePane);
					});
			});

			menu.addSeparator();

			// Add "Open in other pane" for folders
			menu.addItem(item => {
				item
					.setTitle('Open in other pane')
					.setIcon('arrow-right-left')
					.onClick(() => {
						// Navigate the inactive pane to this folder
						const inactivePane = this.getInactivePane();
						this.navigateToFolder(inactivePane, file);
					});
			});

			// Add "Reveal in file explorer" for folders
			menu.addItem(item => {
				item
					.setTitle('Reveal in file explorer')
					.setIcon('external-link')
					.onClick(() => {
						// Show folder in system file explorer
						this.revealInFileExplorer(file.path);
					});
			});

			menu.addSeparator();

			// Add "Make a copy" for folders
			menu.addItem(item => {
				item
					.setTitle('Make a copy')
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
			menu.addItem(item => {
				item
					.setTitle('Search in folder')
					.setIcon('search')
					.onClick(() => {
						// Open search with folder constraint
						(this.app as any).internalPlugins.plugins[
							'global-search'
						].instance.openGlobalSearch(`path:${file.path}`);
					});
			});

			menu.addSeparator();
		} else {
			// For files, add "Open to side" and related options
			if (file instanceof TFile) {
				menu.addItem(item => {
					item
						.setTitle('Open to side')
						.setIcon('split-square-horizontal')
						.onClick(() => {
							// Open file in new pane to the side
							const newLeaf = this.app.workspace.getLeaf('split', 'horizontal');
							newLeaf.openFile(file);
						});
				});

				menu.addItem(item => {
					item
						.setTitle('Open in new tab')
						.setIcon('plus-square')
						.onClick(() => {
							// Open file in new tab
							const newLeaf = this.app.workspace.getLeaf('tab');
							newLeaf.openFile(file);
						});
				});

				menu.addSeparator();
			}

			// Add "Open in other pane" for files
			if (file instanceof TFile) {
				menu.addItem(item => {
					item
						.setTitle('Open in other pane')
						.setIcon('arrow-right-left')
						.onClick(() => {
							// Navigate the inactive pane to this file's folder and select it
							const inactivePane = this.getInactivePane();
							if (file.parent && file.parent !== inactivePane.currentFolder) {
								this.navigateToFolder(inactivePane, file.parent);
								// Wait for next tick to ensure folder is loaded
								setTimeout(() => {
									this.selectFileByName(inactivePane, file.name);
								}, 0);
							} else {
								// File is already in current folder of inactive pane
								this.selectFileByName(inactivePane, file.name);
							}
						});
				});
			}

			// Add "Reveal in file explorer" for files
			menu.addItem(item => {
				item
					.setTitle('Reveal in file explorer')
					.setIcon('external-link')
					.onClick(() => {
						// Show file in system file explorer
						this.revealInFileExplorer(file.path);
					});
			});

			menu.addSeparator();

			// Add "Make a copy" for files
			menu.addItem(item => {
				item
					.setTitle('Make a copy')
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

			// Add "Copy Link" for files
			if (file instanceof TFile) {
				menu.addItem(item => {
					item
						.setTitle('Copy Link')
						.setIcon('link')
						.onClick(async () => {
							try {
								await this.fileOperations.copyMarkdownLink(file);
							} catch (error) {
								console.error('Failed to copy link:', error);
							}
						});
				});
			}

			menu.addSeparator();
		}

		// Add Rename and Delete for both files and folders
		// Note: We'll add these items regardless since we can't easily check existing items

		menu.addItem(item => {
			item
				.setTitle('Rename...')
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

		menu.addItem(item => {
			item
				.setTitle('Delete')
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
			await this.fileOperations.copyFiles(
				selectedFiles,
				inactivePane.currentFolder
			);
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
			await this.fileOperations.moveFiles(
				selectedFiles,
				inactivePane.currentFolder
			);
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
			const newFolder = await this.fileOperations.createNewFolder(
				activePane.currentFolder
			);
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
				activePane.id === 'left'
					? '.file-pane:first-child'
					: '.file-pane:last-child'
			) as HTMLElement;

			if (paneElement) {
				const rect = paneElement.getBoundingClientRect();
				const position = {
					x: rect.left + rect.width / 2,
					y: rect.top + activePane.selectedIndex * 36, // Approximate position
				};
				this.handleFileContextMenu(currentFile, activePane.id, position);
			}
		}
	}

	// ====================
	// FILTER METHODS
	// ====================

	/**
	 * Simple filter implementation for files
	 */
	private filterFiles(
		files: TAbstractFile[],
		options: FilterOptions
	): TAbstractFile[] {
		if (
			!options.query.trim() &&
			!options.showFoldersOnly &&
			!options.showFilesOnly
		) {
			return files;
		}

		return files.filter(file => {
			// Apply file type filters first
			if (options.showFoldersOnly && !(file instanceof TFolder)) {
				return false;
			}
			if (options.showFilesOnly && !(file instanceof TFile)) {
				return false;
			}

			// If no query, just apply type filters
			if (!options.query.trim()) {
				return true;
			}

			// Apply query-based filtering
			return this.matchesQuery(file, options);
		});
	}

	/**
	 * Check if a file matches the search query
	 */
	private matchesQuery(file: TAbstractFile, options: FilterOptions): boolean {
		const fileName = file.name;
		const query = options.query;

		try {
			if (options.isRegex) {
				const flags = options.caseSensitive ? 'g' : 'gi';
				const regex = new RegExp(query, flags);
				return regex.test(fileName);
			} else if (options.isGlob) {
				const regex = this.globToRegex(query);
				const flags = options.caseSensitive ? 'g' : 'gi';
				const globRegex = new RegExp(regex, flags);
				return globRegex.test(fileName);
			} else {
				// Simple text search
				const searchText = options.caseSensitive
					? fileName
					: fileName.toLowerCase();
				const searchQuery = options.caseSensitive ? query : query.toLowerCase();
				return searchText.includes(searchQuery);
			}
		} catch (error) {
			// Invalid regex/glob pattern, fall back to text search
			const searchText = options.caseSensitive
				? fileName
				: fileName.toLowerCase();
			const searchQuery = options.caseSensitive ? query : query.toLowerCase();
			return searchText.includes(searchQuery);
		}
	}

	/**
	 * Convert glob pattern to regex
	 */
	private globToRegex(glob: string): string {
		// Escape special regex characters except for glob wildcards
		let regex = glob
			.replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
			.replace(/\*/g, '.*') // Convert * to .*
			.replace(/\?/g, '.'); // Convert ? to .

		// Handle character classes [abc] and ranges [a-z]
		regex = regex.replace(/\\\[([^\]]*)\\\]/g, '[$1]');

		return `^${regex}$`;
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
			onFileSelect: file => {
				if (file instanceof TFile) {
					// Open the file
					this.app.workspace.getLeaf().openFile(file);
				}
			},
			onFolderNavigate: folder => {
				// Navigate to the folder in active pane
				this.navigateToFolder(activePane, folder);
			},
			enableAutoPreview: true,
			previewDelay: 300,
		});

		// Position menu next to the active pane
		const paneElement = this.contentEl.querySelector(
			activePane.id === 'left'
				? '.file-pane:first-child'
				: '.file-pane:last-child'
		) as HTMLElement;

		if (paneElement) {
			folderMenu.cascade({
				target: paneElement,
				event: undefined,
				onClose: () => folderMenu.hide(),
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
					},
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
					},
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
					},
				},
				{
					title: 'Refresh current pane',
					icon: 'refresh-cw',
					callback: () => {
						this.refreshPane(this.getActivePane());
					},
				},
				{
					title: 'Go to vault root',
					icon: 'home',
					callback: () => {
						const activePane = this.getActivePane();
						const rootFolder = this.app.vault.getRoot();
						this.navigateToFolder(activePane, rootFolder);
					},
				},
				{
					title: 'Create new folder...',
					icon: 'folder-plus',
					callback: () => {
						this.createNewFolder();
					},
				},
				{
					title: 'Navigate to next file',
					icon: 'arrow-down-circle',
					callback: () => {
						this.navigateToNextFile();
					},
				},
				{
					title: 'Navigate to previous file',
					icon: 'arrow-up-circle',
					callback: () => {
						this.navigateToPreviousFile();
					},
				},
				{
					title: 'Go to first file',
					icon: 'chevrons-up',
					callback: () => {
						this.navigateToFirstFile();
					},
				},
				{
					title: 'Go to last file',
					icon: 'chevrons-down',
					callback: () => {
						this.navigateToLastFile();
					},
				},
			],
		});

		// Position command palette in center of view
		const rect = this.contentEl.getBoundingClientRect();
		commandMenu.showAtPosition({
			x: rect.left + rect.width / 2 - 200, // Center horizontally
			y: rect.top + 100, // A bit down from top
		});
	}

	/**
	 * Toggle quick search overlay for current pane
	 */
	private toggleQuickSearch() {
		// Toggle filter for the active pane
		const activePaneId = this.leftPane.isActive ? 'left' : 'right';
		const activePane = this.getActivePane();

		// If filter is not active, enable it with default options
		if (!activePane.filter?.isActive) {
			this.handleFilterToggle(activePaneId, true);
		} else {
			// If filter is active, toggle it off
			this.handleFilterToggle(activePaneId, false);
		}
	}

	/**
	 * Show file preview for currently selected file
	 */
	private showFilePreview() {
		// Call the global function exposed by DualPaneManager
		if ((window as any).showFilePreview) {
			(window as any).showFilePreview();
		} else {
			console.warn('File preview function not available');
		}
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
			const nextFile = this.navigationService.navigateFile(
				currentFile,
				1,
				true
			);
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
			const prevFile = this.navigationService.navigateFile(
				currentFile,
				-1,
				true
			);
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
			const firstFile = this.navigationService.navigateFile(
				currentFile,
				-1,
				false
			);
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
			const lastFile = this.navigationService.navigateFile(
				currentFile,
				1,
				false
			);
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

	// ====================
	// STATE PERSISTENCE
	// ====================

	/**
	 * Get view data for session persistence
	 */
	getViewData(): any {
		// Update view state before returning
		this.updateViewState();

		return {
			leftPath: this.viewState.leftPath,
			rightPath: this.viewState.rightPath,
			activePane: this.viewState.activePane,
			leftSelectedIndex: this.viewState.leftSelectedIndex,
			rightSelectedIndex: this.viewState.rightSelectedIndex,
		};
	}

	/**
	 * Set view data for session restoration
	 */
	setViewData(data: any): void {
		if (data && typeof data === 'object') {
			this.viewState = {
				leftPath: data.leftPath || this.app.vault.getRoot().path,
				rightPath: data.rightPath || this.app.vault.getRoot().path,
				activePane: data.activePane || 'left',
				leftSelectedIndex: data.leftSelectedIndex || 0,
				rightSelectedIndex: data.rightSelectedIndex || 0,
			};
		}
	}

	/**
	 * Restore view state from saved data (called during onOpen)
	 */
	private restoreViewState() {
		try {
			// Attempt to get folder for left pane
			const leftFolder = this.app.vault.getAbstractFileByPath(
				this.viewState.leftPath
			);
			if (leftFolder instanceof TFolder) {
				this.leftPane.currentFolder = leftFolder;
				this.leftPane.files = this.getSortedFiles(leftFolder);

				// Restore selected index, ensuring it's within bounds
				this.leftPane.selectedIndex = Math.min(
					this.viewState.leftSelectedIndex,
					Math.max(0, this.leftPane.files.length - 1)
				);
			}

			// Attempt to get folder for right pane
			const rightFolder = this.app.vault.getAbstractFileByPath(
				this.viewState.rightPath
			);
			if (rightFolder instanceof TFolder) {
				this.rightPane.currentFolder = rightFolder;
				this.rightPane.files = this.getSortedFiles(rightFolder);

				// Restore selected index, ensuring it's within bounds
				this.rightPane.selectedIndex = Math.min(
					this.viewState.rightSelectedIndex,
					Math.max(0, this.rightPane.files.length - 1)
				);
			}

			// Restore active pane
			this.leftPane.isActive = this.viewState.activePane === 'left';
			this.rightPane.isActive = this.viewState.activePane === 'right';

			// Update settings to match restored state
			this.settings.activePane = this.viewState.activePane;
		} catch (error) {
			console.warn('Failed to restore view state:', error);
			// Fall back to defaults if restoration fails
			const rootFolder = this.app.vault.getRoot();
			this.leftPane.currentFolder = rootFolder;
			this.rightPane.currentFolder = rootFolder;
			this.leftPane.files = this.getSortedFiles(rootFolder);
			this.rightPane.files = this.getSortedFiles(rootFolder);
		}
	}

	/**
	 * Update view state with current pane states
	 */
	private updateViewState() {
		this.viewState = {
			leftPath: this.leftPane.currentFolder.path,
			rightPath: this.rightPane.currentFolder.path,
			activePane: this.leftPane.isActive ? 'left' : 'right',
			leftSelectedIndex: this.leftPane.selectedIndex,
			rightSelectedIndex: this.rightPane.selectedIndex,
		};
	}

	// ====================
	// ENHANCED KEYBOARD SHORTCUTS IMPLEMENTATION
	// ====================

	/**
	 * Bookmark current folder (Ctrl+B)
	 */
	private bookmarkCurrentFolder() {
		const activePane = this.getActivePane();
		const currentFolder = activePane.currentFolder;

		// Add to bookmarks in settings
		if (!this.settings.bookmarks) {
			this.settings.bookmarks = [];
		}

		// Check if already bookmarked
		const existingBookmark = this.settings.bookmarks.find(
			b => b.path === currentFolder.path
		);
		if (!existingBookmark) {
			this.settings.bookmarks.push({
				name: currentFolder.name,
				path: currentFolder.path,
			});
			this.plugin.saveSettings();
			console.log(`Bookmarked: ${currentFolder.name}`);
		} else {
			console.log(`Already bookmarked: ${currentFolder.name}`);
		}
	}

	/**
	 * Show bookmark menu (Ctrl+Shift+B)
	 */
	private showBookmarkMenu() {
		if (!this.settings.bookmarks || this.settings.bookmarks.length === 0) {
			console.log('No bookmarks available');
			return;
		}

		const bookmarkMenu = new PopupMenu({
			className: 'bookmark-menu',
			items: this.settings.bookmarks.map(bookmark => ({
				title: bookmark.name,
				icon: 'bookmark',
				callback: () => {
					const folder = this.app.vault.getAbstractFileByPath(bookmark.path);
					if (folder instanceof TFolder) {
						const activePane = this.getActivePane();
						this.navigateToFolder(activePane, folder);
					}
				},
			})),
		});

		// Position menu in center
		const rect = this.contentEl.getBoundingClientRect();
		bookmarkMenu.showAtPosition({
			x: rect.left + rect.width / 2 - 150,
			y: rect.top + 100,
		});
	}

	/**
	 * Go back in folder history (Alt+Left)
	 */
	private goBackInHistory() {
		// This would require implementing a history stack
		// For now, just go up one level
		const activePane = this.getActivePane();
		if (activePane.currentFolder.parent) {
			this.navigateToFolder(activePane, activePane.currentFolder.parent);
		}
	}

	/**
	 * Go forward in folder history (Alt+Right)
	 */
	private goForwardInHistory() {
		// This would require implementing a history stack
		// For now, just show a message
		console.log('Forward navigation not yet implemented');
	}

	/**
	 * Show recent folders menu (Ctrl+H)
	 */
	private showRecentFoldersMenu() {
		// For now, show commonly accessed folders
		const recentFolders = [
			this.app.vault.getRoot(),
			...this.app.vault
				.getRoot()
				.children.filter(f => f instanceof TFolder)
				.slice(0, 5),
		] as TFolder[];

		const recentMenu = new PopupMenu({
			className: 'recent-folders-menu',
			items: recentFolders.map(folder => ({
				title: folder.path === '/' ? 'Vault Root' : folder.name,
				icon: 'folder',
				callback: () => {
					const activePane = this.getActivePane();
					this.navigateToFolder(activePane, folder);
				},
			})),
		});

		// Position menu in center
		const rect = this.contentEl.getBoundingClientRect();
		recentMenu.showAtPosition({
			x: rect.left + rect.width / 2 - 150,
			y: rect.top + 100,
		});
	}

	/**
	 * Navigate to vault root (Ctrl+Home)
	 */
	private navigateToRoot() {
		const activePane = this.getActivePane();
		const rootFolder = this.app.vault.getRoot();
		this.navigateToFolder(activePane, rootFolder);
	}

	/**
	 * Duplicate selected files (Ctrl+Shift+D)
	 */
	private async duplicateSelectedFiles() {
		const activePane = this.getActivePane();
		const selectedFiles = this.getSelectedFiles(activePane);

		if (selectedFiles.length === 0) {
			const currentFile = activePane.files[activePane.selectedIndex];
			if (currentFile) {
				selectedFiles.push(currentFile);
			}
		}

		try {
			for (const file of selectedFiles) {
				await this.fileOperations.copyFileInPlace(file);
			}
			this.refreshPane(activePane);
		} catch (error) {
			console.error('Duplicate operation failed:', error);
		}
	}

	/**
	 * Rename selected file (F2)
	 */
	private async renameSelectedFile() {
		const activePane = this.getActivePane();
		const currentFile = activePane.files[activePane.selectedIndex];

		if (currentFile) {
			try {
				await this.fileOperations.renameFile(currentFile);
				this.refreshPane(activePane);
			} catch (error) {
				console.error('Rename operation failed:', error);
			}
		}
	}

	/**
	 * Show file properties (F4)
	 */
	private showFileProperties() {
		const activePane = this.getActivePane();
		const currentFile = activePane.files[activePane.selectedIndex];

		if (currentFile) {
			// Show file info in a popup
			const stats = this.app.vault.adapter.stat(currentFile.path);
			stats
				.then(stat => {
					const infoMenu = new PopupMenu({
						className: 'file-properties-menu',
						items: [
							{
								title: `Name: ${currentFile.name}`,
								icon: 'file',
								callback: () => {},
							},
							{
								title: `Path: ${currentFile.path}`,
								icon: 'folder',
								callback: () => {},
							},
							{
								title: `Size: ${stat?.size || 'Unknown'} bytes`,
								icon: 'info',
								callback: () => {},
							},
							{
								title: `Modified: ${stat?.mtime ? new Date(stat.mtime).toLocaleString() : 'Unknown'}`,
								icon: 'calendar',
								callback: () => {},
							},
						],
					});

					const rect = this.contentEl.getBoundingClientRect();
					infoMenu.showAtPosition({
						x: rect.left + rect.width / 2 - 200,
						y: rect.top + 100,
					});
				})
				.catch(error => {
					console.error('Failed to get file properties:', error);
				});
		}
	}

	/**
	 * Refresh current pane (Ctrl+F5)
	 */
	private refreshCurrentPane() {
		const activePane = this.getActivePane();
		this.refreshPane(activePane);
		console.log('Pane refreshed');
	}

	/**
	 * Show go to folder dialog (Ctrl+L)
	 */
	private showGoToFolderDialog() {
		// Create a simple input dialog
		const input = document.createElement('input');
		input.type = 'text';
		input.placeholder = 'Enter folder path...';
		input.style.cssText = `
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			z-index: 1000;
			padding: 10px;
			border: 1px solid var(--background-modifier-border);
			background: var(--background-primary);
			color: var(--text-normal);
			border-radius: 4px;
			width: 300px;
		`;

		input.addEventListener('keydown', e => {
			if (e.key === 'Enter') {
				const path = input.value.trim();
				const folder = this.app.vault.getAbstractFileByPath(path);
				if (folder instanceof TFolder) {
					const activePane = this.getActivePane();
					this.navigateToFolder(activePane, folder);
				}
				document.body.removeChild(input);
			} else if (e.key === 'Escape') {
				document.body.removeChild(input);
			}
		});

		document.body.appendChild(input);
		input.focus();
	}

	/**
	 * Toggle hidden files (Ctrl+.)
	 */
	private toggleHiddenFiles() {
		this.settings.showHiddenFiles = !this.settings.showHiddenFiles;
		this.plugin.saveSettings();
		this.refreshPane(this.leftPane);
		this.refreshPane(this.rightPane);
		console.log(
			`Hidden files ${this.settings.showHiddenFiles ? 'shown' : 'hidden'}`
		);
	}

	/**
	 * Show sort menu (Ctrl+S)
	 */
	private showSortMenu() {
		const sortMenu = new PopupMenu({
			className: 'sort-menu',
			items: [
				{
					title: 'Sort by Name',
					icon: 'type',
					callback: () => this.setSortOrder('name'),
				},
				{
					title: 'Sort by Date Modified',
					icon: 'calendar',
					callback: () => this.setSortOrder('modified'),
				},
				{
					title: 'Sort by Size',
					icon: 'ruler',
					callback: () => this.setSortOrder('size'),
				},
				{
					title: 'Sort by Type',
					icon: 'file-type',
					callback: () => this.setSortOrder('type'),
				},
			],
		});

		const rect = this.contentEl.getBoundingClientRect();
		sortMenu.showAtPosition({
			x: rect.left + rect.width / 2 - 100,
			y: rect.top + 100,
		});
	}

	/**
	 * Set sort order
	 */
	private setSortOrder(sortBy: string) {
		// This would require implementing different sort functions
		console.log(`Sort order set to: ${sortBy}`);
		// For now, just refresh with default sort
		this.refreshPane(this.getActivePane());
	}

	/**
	 * Select files by pattern (Ctrl+Shift+A)
	 */
	private selectFilesByPattern() {
		// Simple pattern selection - for now just select all .md files
		const activePane = this.getActivePane();
		activePane.selectedFiles.clear();

		for (const file of activePane.files) {
			if (file.name.endsWith('.md')) {
				activePane.selectedFiles.add(file.path);
			}
		}

		this.renderDualPane();
		console.log('Selected all .md files');
	}

	/**
	 * Invert selection (Ctrl+Shift+I)
	 */
	private invertSelection() {
		const activePane = this.getActivePane();
		const newSelection = new Set<string>();

		for (const file of activePane.files) {
			if (!activePane.selectedFiles.has(file.path)) {
				newSelection.add(file.path);
			}
		}

		activePane.selectedFiles = newSelection;
		this.renderDualPane();
		console.log('Selection inverted');
	}

	/**
	 * Select all folders (Ctrl+Shift+O)
	 */
	private selectAllFolders() {
		const activePane = this.getActivePane();
		activePane.selectedFiles.clear();

		for (const file of activePane.files) {
			if (file instanceof TFolder) {
				activePane.selectedFiles.add(file.path);
			}
		}

		this.renderDualPane();
		console.log('Selected all folders');
	}

	/**
	 * Sync panes - make both show same folder (Ctrl+Shift+S)
	 */
	private syncPanes() {
		const activePane = this.getActivePane();
		const inactivePane = this.getInactivePane();

		this.navigateToFolder(inactivePane, activePane.currentFolder);
		console.log('Panes synchronized');
	}

	/**
	 * Open selected file in new tab (Ctrl+Enter)
	 */
	private openSelectedInNewTab() {
		const activePane = this.getActivePane();
		const currentFile = activePane.files[activePane.selectedIndex];

		if (currentFile instanceof TFile) {
			const newLeaf = this.app.workspace.getLeaf('tab');
			newLeaf.openFile(currentFile);
		}
	}

	/**
	 * Reveal file or folder in system file explorer using platform-specific commands
	 */
	private async revealInFileExplorer(filePath: string) {
		try {
			// Get the full absolute path
			// Use path property which exists on FileSystemAdapter in Obsidian
			const vaultPath = (this.app.vault.adapter as any).path || '';
			const fullPath = path.resolve(vaultPath, filePath);

			// Detect platform and use appropriate command
			let command: string;

			if (process.platform === 'win32') {
				// Windows: Use explorer.exe with /select flag to highlight the file
				command = `explorer.exe /select,"${fullPath}"`;
			} else if (process.platform === 'darwin') {
				// macOS: Use open with -R flag to reveal in Finder
				command = `open -R "${fullPath}"`;
			} else {
				// Linux: Try common file managers
				// First try nautilus (GNOME), then dolphin (KDE), then thunar (XFCE)
				const fileManagers = [
					`nautilus --select "${fullPath}"`,
					`dolphin --select "${fullPath}"`,
					`thunar "${path.dirname(fullPath)}"`,
					`xdg-open "${path.dirname(fullPath)}"`,
				];

				// Try each file manager until one succeeds
				for (const fm of fileManagers) {
					try {
						await new Promise<void>((resolve, reject) => {
							exec(fm, (error: any) => {
								if (error) reject(error);
								else resolve();
							});
						});
						return; // Success, exit the function
					} catch (e) {
						// Try next file manager
						continue;
					}
				}

				// If no file manager worked, fall back to xdg-open with directory
				command = `xdg-open "${path.dirname(fullPath)}"`;
			}

			// Execute the command
			if (command) {
				exec(command, (error: any) => {
					if (error) {
						console.error('Failed to reveal file in explorer:', error);
						// Fall back to opening the parent directory
						this.revealParentDirectory(fullPath);
					}
				});
			}
		} catch (error) {
			console.error('Error revealing file in explorer:', error);
		}
	}

	/**
	 * Fall back method to open parent directory when reveal fails
	 */
	private revealParentDirectory(fullPath: string) {
		try {
			const parentDir = path.dirname(fullPath);
			let command: string;

			if (process.platform === 'win32') {
				command = `explorer.exe "${parentDir}"`;
			} else if (process.platform === 'darwin') {
				command = `open "${parentDir}"`;
			} else {
				command = `xdg-open "${parentDir}"`;
			}

			exec(command, (error: any) => {
				if (error) {
					console.error('Failed to open parent directory:', error);
				}
			});
		} catch (error) {
			console.error('Error opening parent directory:', error);
		}
	}
}
