/**
 * Context-menu implementation notes can be found in gVault:
 * [[01-PROJECTS/obsidian-midnight-commander/Context-Menu Implementation]]
 */
import { Plugin } from 'obsidian';

import {
	MidnightCommanderView,
	VIEW_TYPE_MIDNIGHT_COMMANDER,
} from './src/views/MidnightCommanderView';
import { MidnightCommanderSettings } from './src/types/interfaces';
import { NavigationService } from './src/services/NavigationService';
import { MidnightCommanderSettingTab } from './src/settings/SettingsTab';
import { EventManager } from './src/utils/EventManager';
import { FileCache } from './src/utils/FileCache';
import { PluginContext } from './src/utils/PluginContext';

const DEFAULT_SETTINGS: MidnightCommanderSettings = {
	showHiddenFiles: false,
	openViewOnStart: false,
	// Panel location control defaults
	defaultLocation: 'left',
	rememberLocation: true,
	openOnStartup: false,
	vimBindings: false,
	showFileIcons: true,
	activePane: 'left',
	fileOpenBehavior: 'replace',
	showBreadcrumbs: true,
	previewDelay: 300,
	keymapProfile: 'default',
	centerBreadcrumbs: false,
	// Theme settings
	theme: 'default',
	colorScheme: 'auto',
	fontSize: 'medium',
	fontFamily: '',
	compactMode: false,
	customCssOverrides: '',
	// Layout settings
	layoutOrientation: 'vertical',
	rememberPaneSizes: true,
};

export default class MidnightCommanderPlugin extends Plugin {
	settings: MidnightCommanderSettings;
	navigationService: NavigationService;
	eventManager: EventManager;
	fileCache: FileCache;
	context: PluginContext;

	async onload() {
		console.log('Loading Obsidian Midnight Commander plugin');

		// Initialize plugin context for centralized lifecycle management
		this.context = new PluginContext(this.app, this);
		this.addChild(this.context);

		// Register initialization modules
		this.registerInitModules();

		// Initialize all modules
		await this.context.initializeModules();
	}

	async onunload() {
		console.log('Unloading Obsidian Midnight Commander plugin');

		// Dispose all modules in proper order
		if (this.context) {
			await this.context.disposeModules();
		}

		// Detach any view leaves
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_MIDNIGHT_COMMANDER);

		// Call parent cleanup
		super.onunload();
	}

	/**
	 * Register all initialization modules in the correct order
	 */
	private registerInitModules() {
		// Module 1: Core utilities and managers
		this.context.addInitModule(async () => {
			console.log('[Init] Setting up core utilities...');

			// Initialize event manager for centralized event handling
			this.eventManager = new EventManager(this.app, this);

			// Initialize file cache for performance optimization
			this.fileCache = new FileCache(this.app, 500);
			this.addChild(this.fileCache);
		});

		// Module 2: Settings and configuration
		this.context.addInitModule(async () => {
			console.log('[Init] Loading settings and configuration...');
			await this.loadSettings();
		});

		// Module 3: Services
		this.context.addInitModule(async () => {
			console.log('[Init] Initializing services...');
			this.navigationService = new NavigationService(this.app);
		});

		// Module 4: UI Components
		this.context.addInitModule(async () => {
			console.log('[Init] Setting up UI components...');

			// Add settings tab
			this.addSettingTab(new MidnightCommanderSettingTab(this.app, this));

			// Register the custom view
			this.registerView(
				VIEW_TYPE_MIDNIGHT_COMMANDER,
				leaf => new MidnightCommanderView(leaf, this)
			);

			// Add ribbon icon to open the view
			this.addRibbonIcon('folder-open', 'Open Midnight Commander', () =>
				this.activateView()
			);
		});

		// Module 5: Commands
		this.context.addInitModule(async () => {
			console.log('[Init] Registering commands...');
			this.setupCommands();
		});

		// Module 6: Event handlers
		this.context.addInitModule(async () => {
			console.log('[Init] Setting up event handlers...');
			this.setupEventHandlers();
		});

		// Register cleanup modules (in reverse order)
		this.context.addDisposeModule(async () => {
			console.log('[Dispose] Cleaning up event handlers...');
			if (this.eventManager) {
				this.eventManager.cleanup();
			}
		});

		this.context.addDisposeModule(async () => {
			console.log('[Dispose] Cleaning up services...');
			// Navigation service cleanup (if needed in future)
		});

		this.context.addDisposeModule(async () => {
			console.log('[Dispose] Saving final state...');
			// Save any pending settings or state
			await this.saveSettings();
		});
	}

	/**
	 * Setup all plugin commands
	 */
	private setupCommands() {
		// Add command to open the view
		this.addCommand({
			id: 'open-midnight-commander',
			name: 'Open Midnight Commander',
			callback: () => this.activateView(),
		});

		// Add commands for specific locations
		this.addCommand({
			id: 'open-left',
			name: 'Open in left sidebar',
			callback: () => this.activateView('left'),
		});

		this.addCommand({
			id: 'open-right',
			name: 'Open in right sidebar',
			callback: () => this.activateView('right'),
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
	}

	/**
	 * Setup event handlers
	 */
	private setupEventHandlers() {
		// Open view on startup if enabled
		this.eventManager.registerAppEvent('workspace', 'layout-ready', () => {
			if (this.settings.openViewOnStart || this.settings.openOnStartup) {
				this.activateView();
			}
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView(location?: 'left' | 'right') {
		const targetLocation = location || this.settings.defaultLocation;
		const { workspace } = this.app;

		// Check for existing leaf location if remembering
		if (this.settings.rememberLocation) {
			const existingLeaves = workspace.getLeavesOfType(
				VIEW_TYPE_MIDNIGHT_COMMANDER
			);
			if (existingLeaves.length > 0) {
				workspace.revealLeaf(existingLeaves[0]);
				return;
			}
		}

		// Detach existing instances
		workspace.detachLeavesOfType(VIEW_TYPE_MIDNIGHT_COMMANDER);

		// Get appropriate leaf based on location
		const leaf =
			targetLocation === 'left'
				? workspace.getLeftLeaf(false)
				: workspace.getRightLeaf(false);

		if (leaf) {
			await leaf.setViewState({
				type: VIEW_TYPE_MIDNIGHT_COMMANDER,
				active: true,
			});

			// "Reveal" the leaf in case it is in a collapsed sidebar
			workspace.revealLeaf(leaf);
		}
	}

	/**
	 * Navigate to next/previous/first/last file using NavigationService
	 */
	private navigateToFile(direction: number, relative: boolean) {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) return;

		const targetFile = this.navigationService.navigateFile(
			activeFile,
			direction,
			relative
		);
		if (targetFile) {
			this.app.workspace.getLeaf().openFile(targetFile);
		}
	}
}
