import { App, Plugin, Component } from 'obsidian';

/**
 * PluginContext provides centralized state management and lifecycle utilities
 * for the Midnight Commander plugin. It handles session storage, temporary files,
 * and modular initialization/cleanup.
 */
export class PluginContext extends Component {
	private app: App;
	private plugin: Plugin;
	private sessionStorage: Map<string, any> = new Map();
	private temporaryFiles: Set<string> = new Set();
	private initModules: (() => Promise<void>)[] = [];
	private disposeHandlers: (() => Promise<void>)[] = [];

	constructor(app: App, plugin: Plugin) {
		super();
		this.app = app;
		this.plugin = plugin;
	}

	/**
	 * Get a value from the plugin's persistent state (data.json)
	 */
	getState<T>(key: string): T | undefined {
		// Use plugin's loadData to access data indirectly
		const plugin = this.plugin as any;
		if (plugin._loaded && plugin._loaded.settings) {
			return plugin._loaded.settings[key];
		}
		return undefined;
	}

	/**
	 * Set a value in the plugin's persistent state (data.json)
	 */
	async setState<T>(key: string, value: T): Promise<void> {
		// For now, we'll use session storage as a fallback
		// Real persistent state should be handled by the plugin's own settings
		this.sessionStorage.set(`persistent_${key}`, value);
		console.warn('[PluginContext] setState is using session storage as fallback. Consider using plugin.settings instead.');
	}

	/**
	 * Get a value from temporary session storage (lost on plugin reload)
	 */
	getSessionValue<T>(key: string): T | undefined {
		return this.sessionStorage.get(key);
	}

	/**
	 * Set a value in temporary session storage (lost on plugin reload)
	 */
	setSessionValue<T>(key: string, value: T): void {
		this.sessionStorage.set(key, value);
	}

	/**
	 * Remove a value from session storage
	 */
	clearSessionValue(key: string): void {
		this.sessionStorage.delete(key);
	}

	/**
	 * Clear all session storage
	 */
	clearAllSessionValues(): void {
		this.sessionStorage.clear();
	}

	/**
	 * Register a temporary file path for cleanup on plugin unload
	 */
	registerTemporaryFile(filePath: string): void {
		this.temporaryFiles.add(filePath);
	}

	/**
	 * Unregister a temporary file (e.g., when manually cleaned up)
	 */
	unregisterTemporaryFile(filePath: string): void {
		this.temporaryFiles.delete(filePath);
	}

	/**
	 * Get all registered temporary files
	 */
	getTemporaryFiles(): string[] {
		return Array.from(this.temporaryFiles);
	}

	/**
	 * Add an async initialization module to be called during plugin startup
	 */
	addInitModule(initFn: () => Promise<void>): void {
		this.initModules.push(initFn);
	}

	/**
	 * Add an async disposal module to be called during plugin cleanup
	 */
	addDisposeModule(disposeFn: () => Promise<void>): void {
		this.disposeHandlers.push(disposeFn);
	}

	/**
	 * Initialize all registered modules in order
	 */
	async initializeModules(): Promise<void> {
		console.log(`[PluginContext] Initializing ${this.initModules.length} modules...`);
		
		for (let i = 0; i < this.initModules.length; i++) {
			try {
				await this.initModules[i]();
				console.log(`[PluginContext] Module ${i + 1} initialized successfully`);
			} catch (error) {
				console.error(`[PluginContext] Failed to initialize module ${i + 1}:`, error);
				throw error; // Re-throw to halt initialization on critical errors
			}
		}
		
		console.log('[PluginContext] All modules initialized successfully');
	}

	/**
	 * Dispose all registered modules in reverse order
	 */
	async disposeModules(): Promise<void> {
		console.log(`[PluginContext] Disposing ${this.disposeHandlers.length} modules...`);
		
		// Dispose in reverse order
		for (let i = this.disposeHandlers.length - 1; i >= 0; i--) {
			try {
				await this.disposeHandlers[i]();
				console.log(`[PluginContext] Module ${i + 1} disposed successfully`);
			} catch (error) {
				console.error(`[PluginContext] Failed to dispose module ${i + 1}:`, error);
				// Continue disposing other modules even if one fails
			}
		}
		
		console.log('[PluginContext] All modules disposed');
	}

	/**
	 * Clean up temporary files registered with this context
	 */
	private async cleanupTemporaryFiles(): Promise<void> {
		if (this.temporaryFiles.size === 0) {
			return;
		}

		console.log(`[PluginContext] Cleaning up ${this.temporaryFiles.size} temporary files...`);
		
		for (const filePath of this.temporaryFiles) {
			try {
				const file = this.app.vault.getAbstractFileByPath(filePath);
				if (file) {
					await this.app.vault.delete(file);
					console.log(`[PluginContext] Deleted temporary file: ${filePath}`);
				}
			} catch (error) {
				console.error(`[PluginContext] Failed to delete temporary file ${filePath}:`, error);
			}
		}
		
		this.temporaryFiles.clear();
	}

	/**
	 * Component lifecycle - cleanup when component is unloaded
	 */
	onunload(): void {
		this.cleanupTemporaryFiles().catch(error => {
			console.error('[PluginContext] Error during temporary file cleanup:', error);
		});
		
		this.clearAllSessionValues();
		
		// Call parent cleanup
		super.onunload();
	}

	/**
	 * Get the Obsidian App instance
	 */
	getApp(): App {
		return this.app;
	}

	/**
	 * Get the Plugin instance
	 */
	getPlugin(): Plugin {
		return this.plugin;
	}

	/**
	 * Utility method to check if the plugin is currently loaded
	 */
	isPluginLoaded(): boolean {
		// Simple check - if we can access the plugin instance, it's loaded
		return !!this.plugin && !!this.app;
	}

	/**
	 * Get debug information about the context state
	 */
	getDebugInfo(): {
		sessionStorageSize: number;
		temporaryFilesCount: number;
		initModulesCount: number;
		disposeModulesCount: number;
		isLoaded: boolean;
	} {
		return {
			sessionStorageSize: this.sessionStorage.size,
			temporaryFilesCount: this.temporaryFiles.size,
			initModulesCount: this.initModules.length,
			disposeModulesCount: this.disposeHandlers.length,
			isLoaded: this.isPluginLoaded(),
		};
	}
}
