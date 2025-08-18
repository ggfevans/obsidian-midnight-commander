/**
 * Context-menu implementation notes can be found in gVault:
 * [[01-PROJECTS/obsidian-midnight-commander/Context-Menu Implementation]]
 */
import {
	Plugin,
	WorkspaceLeaf,
} from 'obsidian';

import { MidnightCommanderView, VIEW_TYPE_MIDNIGHT_COMMANDER } from './src/views/MidnightCommanderView';
import { MidnightCommanderSettings } from './src/types/interfaces';
import { NavigationService } from './src/services/NavigationService';
import { MidnightCommanderSettingTab } from './src/settings/SettingsTab';
import { EventManager } from './src/utils/EventManager';
import { FileCache } from './src/utils/FileCache';

const DEFAULT_SETTINGS: MidnightCommanderSettings = {
	showHiddenFiles: false,
	openViewOnStart: false,
	vimBindings: false,
	showFileIcons: true,
	activePane: 'left',
	showBreadcrumbs: true,
	previewDelay: 300,
	keymapProfile: 'default',
	centerBreadcrumbs: false,
};

export default class MidnightCommanderPlugin extends Plugin {
	settings: MidnightCommanderSettings;
	navigationService: NavigationService;
	eventManager: EventManager;
	fileCache: FileCache;

	async onload() {
		console.log('Loading Obsidian Midnight Commander plugin');
		
		// Initialize event manager for centralized event handling
		this.eventManager = new EventManager(this.app, this);
		
		// Initialize file cache for performance optimization
		this.fileCache = new FileCache(this.app, 500);
		this.addChild(this.fileCache);
		
		await this.loadSettings();

		// Initialize services
		this.navigationService = new NavigationService(this.app);

		// Add settings tab
		this.addSettingTab(new MidnightCommanderSettingTab(this.app, this));

		// Register the custom view
		this.registerView(
			VIEW_TYPE_MIDNIGHT_COMMANDER,
			(leaf) => new MidnightCommanderView(leaf, this)
		);

		// Add ribbon icon to open the view
		this.addRibbonIcon(
			'folder-open',
			'Open Midnight Commander',
			() => this.activateView()
		);

		// Add command to open the view
		this.addCommand({
			id: 'open-midnight-commander',
			name: 'Open Midnight Commander',
			callback: () => this.activateView(),
		});

		// File navigation commands
		this.addCommand({
			id: 'navigate-to-next-file',
			name: 'Navigate to next file',
			callback: () => this.navigateToFile(1, true),
		});

		this.addCommand({
			id: 'navigate-to-previous-file',
			name: 'Navigate to previous file',
			callback: () => this.navigateToFile(-1, true),
		});

		this.addCommand({
			id: 'navigate-to-first-file',
			name: 'Navigate to first file in folder',
			callback: () => this.navigateToFile(-1, false),
		});

		this.addCommand({
			id: 'navigate-to-last-file',
			name: 'Navigate to last file in folder',
			callback: () => this.navigateToFile(1, false),
		});

	// Open view on startup if enabled
	this.eventManager.registerAppEvent('workspace', 'layout-ready', () => {
		if (this.settings.openViewOnStart) {
			this.activateView();
		}
	});
	}

onunload() {
	console.log('Unloading Obsidian Midnight Commander plugin');
	
	// Clean up all registered events
	if (this.eventManager) {
		this.eventManager.cleanup();
	}
	
	// Detach any view leaves
	this.app.workspace.detachLeavesOfType(VIEW_TYPE_MIDNIGHT_COMMANDER);
	
	// Call parent cleanup
	super.onunload();
}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_MIDNIGHT_COMMANDER);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: VIEW_TYPE_MIDNIGHT_COMMANDER, active: true });
			}
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	/**
	 * Navigate to next/previous/first/last file using NavigationService
	 */
	private navigateToFile(direction: number, relative: boolean) {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) return;

		const targetFile = this.navigationService.navigateFile(activeFile, direction, relative);
		if (targetFile) {
			this.app.workspace.getLeaf().openFile(targetFile);
		}
	}
}
