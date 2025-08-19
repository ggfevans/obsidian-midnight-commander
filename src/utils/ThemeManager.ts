import { Component } from 'obsidian';
import { MCTheme, ThemeSettings } from '../types/interfaces';

/**
 * ThemeManager handles theme loading, application, and management
 * for the Midnight Commander plugin.
 */
export class ThemeManager extends Component {
	private containerElement: HTMLElement | null = null;
	private activeTheme: MCTheme | null = null;
	private styleElement: HTMLStyleElement | null = null;

	constructor(private containerSelector: string) {
		super();
	}

	async onload() {
		// Component lifecycle - initialization happens in initialize()
	}

	async onunload() {
		this.cleanup();
	}

	/**
	 * Initialize the theme manager with the container element
	 */
	async initialize(containerEl: HTMLElement): Promise<void> {
		this.containerElement = containerEl;

		// Create style element for theme CSS
		this.styleElement = document.createElement('style');
		this.styleElement.id = 'midnight-commander-theme-styles';
		document.head.appendChild(this.styleElement);

		// Apply default theme
		await this.applyTheme('default');
	}

	/**
	 * Apply a theme with optional settings
	 */
	async applyTheme(
		themeId: string,
		settings?: Partial<ThemeSettings>
	): Promise<void> {
		const theme = this.getThemeById(themeId);
		if (!theme || !this.containerElement) {
			console.error(`Theme not found: ${themeId}`);
			return;
		}

		// Remove previous theme classes
		if (this.activeTheme) {
			this.containerElement.classList.remove(`theme-${this.activeTheme.id}`);
		}

		// Apply new theme
		this.activeTheme = theme;
		if (theme.id !== 'default') {
			this.containerElement.classList.add(`theme-${theme.id}`);
			if (theme.cssFile) {
				await this.loadThemeCSS(theme.cssFile);
			}
		}

		// Apply CSS directly for built-in themes
		if (theme.customCss && this.styleElement) {
			this.styleElement.textContent = theme.customCss;
		}

		// Apply additional settings
		if (settings) {
			await this.applyThemeSettings(settings);
		}
	}

	/**
	 * Apply additional theme settings like font size, font family, etc.
	 */
	private async applyThemeSettings(
		settings: Partial<ThemeSettings>
	): Promise<void> {
		if (!this.containerElement) return;

		// Apply font size
		if (settings.fontSize) {
			this.containerElement.classList.remove(
				'font-small',
				'font-medium',
				'font-large'
			);
			this.containerElement.classList.add(`font-${settings.fontSize}`);
		}

		// Apply font family
		if (settings.fontFamily) {
			this.containerElement.style.setProperty(
				'--mc-font-family',
				settings.fontFamily
			);
		}

		// Apply compact mode
		if (settings.compactMode !== undefined) {
			this.containerElement.classList.toggle(
				'compact-mode',
				settings.compactMode
			);
		}

		// Apply color scheme
		if (settings.colorScheme) {
			this.containerElement.classList.remove(
				'scheme-auto',
				'scheme-light',
				'scheme-dark'
			);
			this.containerElement.classList.add(`scheme-${settings.colorScheme}`);
		}

		// Apply custom CSS overrides
		if (settings.customCssOverrides && this.styleElement) {
			const existingCss = this.styleElement.textContent || '';
			this.styleElement.textContent =
				existingCss +
				'\n\n/* Custom CSS Overrides */\n' +
				settings.customCssOverrides;
		}
	}

	/**
	 * Load theme CSS from file
	 */
	private async loadThemeCSS(cssFile: string): Promise<void> {
		// For plugin distribution, we embed CSS directly
		// This method is kept for future extensibility
		console.log(`Loading theme CSS: ${cssFile}`);
	}

	/**
	 * Get all available themes
	 */
	getAvailableThemes(): MCTheme[] {
		return [
			{
				id: 'default',
				name: 'Default',
				description: 'Clean default theme with modern styling',
				type: 'built-in',
				cssVariables: {
					'--mc-bg-primary': 'var(--background-primary)',
					'--mc-bg-secondary': 'var(--background-secondary)',
					'--mc-text-primary': 'var(--text-normal)',
					'--mc-text-secondary': 'var(--text-muted)',
					'--mc-border': 'var(--background-modifier-border)',
					'--mc-accent': 'var(--interactive-accent)',
				},
				customCss: this.getDefaultThemeCSS(),
			},
			{
				id: 'classic-mc',
				name: 'Classic MC',
				description: 'Traditional Midnight Commander blue theme',
				type: 'built-in',
				cssVariables: {
					'--mc-bg-primary': '#000080',
					'--mc-bg-secondary': '#0000FF',
					'--mc-text-primary': '#FFFFFF',
					'--mc-text-secondary': '#CCCCCC',
					'--mc-border': '#404040',
					'--mc-accent': '#FFFF00',
				},
				customCss: this.getClassicMCThemeCSS(),
			},
			{
				id: 'dark',
				name: 'Dark',
				description: 'Dark theme with high contrast',
				type: 'built-in',
				cssVariables: {
					'--mc-bg-primary': '#1a1a1a',
					'--mc-bg-secondary': '#2d2d2d',
					'--mc-text-primary': '#ffffff',
					'--mc-text-secondary': '#cccccc',
					'--mc-border': '#404040',
					'--mc-accent': '#007acc',
				},
				customCss: this.getDarkThemeCSS(),
			},
			{
				id: 'light',
				name: 'Light',
				description: 'Clean light theme',
				type: 'built-in',
				cssVariables: {
					'--mc-bg-primary': '#ffffff',
					'--mc-bg-secondary': '#f5f5f5',
					'--mc-text-primary': '#333333',
					'--mc-text-secondary': '#666666',
					'--mc-border': '#e0e0e0',
					'--mc-accent': '#0066cc',
				},
				customCss: this.getLightThemeCSS(),
			},
			{
				id: 'high-contrast',
				name: 'High Contrast',
				description: 'High contrast theme for accessibility',
				type: 'built-in',
				cssVariables: {
					'--mc-bg-primary': '#000000',
					'--mc-bg-secondary': '#ffffff',
					'--mc-text-primary': '#ffffff',
					'--mc-text-secondary': '#000000',
					'--mc-border': '#ffffff',
					'--mc-accent': '#ffff00',
				},
				customCss: this.getHighContrastThemeCSS(),
			},
		];
	}

	/**
	 * Get theme by ID
	 */
	getThemeById(id: string): MCTheme | null {
		return this.getAvailableThemes().find(theme => theme.id === id) || null;
	}

	/**
	 * Cleanup theme manager
	 */
	private cleanup(): void {
		if (this.styleElement) {
			this.styleElement.remove();
			this.styleElement = null;
		}

		if (this.containerElement && this.activeTheme) {
			this.containerElement.classList.remove(`theme-${this.activeTheme.id}`);
		}

		this.activeTheme = null;
		this.containerElement = null;
	}

	// Theme CSS implementations
	private getDefaultThemeCSS(): string {
		return `
			.midnight-commander-view {
				--mc-font-family: var(--font-interface);
				color: var(--mc-text-primary);
				background: var(--mc-bg-primary);
			}
			
			.midnight-commander-view .file-pane {
				background: var(--mc-bg-primary);
				border: 1px solid var(--mc-border);
			}
			
			.midnight-commander-view .file-item {
				color: var(--mc-text-primary);
				background: transparent;
			}
			
			.midnight-commander-view .file-item:hover {
				background: var(--background-modifier-hover);
			}
			
			.midnight-commander-view .file-item.selected {
				background: var(--mc-accent);
				color: var(--text-on-accent);
			}
			
			.midnight-commander-view.font-small {
				font-size: 0.85em;
			}
			
			.midnight-commander-view.font-large {
				font-size: 1.15em;
			}
			
			.midnight-commander-view.compact-mode .file-item {
				padding: 2px 8px;
			}
		`;
	}

	private getClassicMCThemeCSS(): string {
		return `
			.midnight-commander-view.theme-classic-mc {
				background: var(--mc-bg-primary);
				color: var(--mc-text-primary);
				font-family: 'Courier New', monospace;
			}
			
			.midnight-commander-view.theme-classic-mc .file-pane {
				background: var(--mc-bg-primary);
				border: 2px solid var(--mc-border);
			}
			
			.midnight-commander-view.theme-classic-mc .file-item {
				color: var(--mc-text-primary);
				background: transparent;
				font-weight: normal;
			}
			
			.midnight-commander-view.theme-classic-mc .file-item:hover {
				background: var(--mc-bg-secondary);
			}
			
			.midnight-commander-view.theme-classic-mc .file-item.selected {
				background: var(--mc-accent);
				color: var(--mc-bg-primary);
			}
			
			.midnight-commander-view.theme-classic-mc .breadcrumb {
				background: var(--mc-bg-secondary);
				color: var(--mc-text-primary);
				border-bottom: 1px solid var(--mc-border);
			}
		`;
	}

	private getDarkThemeCSS(): string {
		return `
			.midnight-commander-view.theme-dark {
				background: var(--mc-bg-primary);
				color: var(--mc-text-primary);
			}
			
			.midnight-commander-view.theme-dark .file-pane {
				background: var(--mc-bg-primary);
				border: 1px solid var(--mc-border);
			}
			
			.midnight-commander-view.theme-dark .file-item {
				color: var(--mc-text-primary);
				background: transparent;
			}
			
			.midnight-commander-view.theme-dark .file-item:hover {
				background: var(--mc-bg-secondary);
			}
			
			.midnight-commander-view.theme-dark .file-item.selected {
				background: var(--mc-accent);
				color: white;
			}
			
			.midnight-commander-view.theme-dark .breadcrumb {
				background: var(--mc-bg-secondary);
				color: var(--mc-text-primary);
			}
		`;
	}

	private getLightThemeCSS(): string {
		return `
			.midnight-commander-view.theme-light {
				background: var(--mc-bg-primary);
				color: var(--mc-text-primary);
			}
			
			.midnight-commander-view.theme-light .file-pane {
				background: var(--mc-bg-primary);
				border: 1px solid var(--mc-border);
			}
			
			.midnight-commander-view.theme-light .file-item {
				color: var(--mc-text-primary);
				background: transparent;
			}
			
			.midnight-commander-view.theme-light .file-item:hover {
				background: var(--mc-bg-secondary);
			}
			
			.midnight-commander-view.theme-light .file-item.selected {
				background: var(--mc-accent);
				color: white;
			}
			
			.midnight-commander-view.theme-light .breadcrumb {
				background: var(--mc-bg-secondary);
				color: var(--mc-text-primary);
			}
		`;
	}

	private getHighContrastThemeCSS(): string {
		return `
			.midnight-commander-view.theme-high-contrast {
				background: var(--mc-bg-primary);
				color: var(--mc-text-primary);
				font-weight: bold;
			}
			
			.midnight-commander-view.theme-high-contrast .file-pane {
				background: var(--mc-bg-primary);
				border: 3px solid var(--mc-border);
			}
			
			.midnight-commander-view.theme-high-contrast .file-item {
				color: var(--mc-text-primary);
				background: transparent;
				border: 1px solid transparent;
			}
			
			.midnight-commander-view.theme-high-contrast .file-item:hover {
				border: 1px solid var(--mc-border);
			}
			
			.midnight-commander-view.theme-high-contrast .file-item.selected {
				background: var(--mc-accent);
				color: var(--mc-bg-primary);
				border: 1px solid var(--mc-border);
			}
			
			.midnight-commander-view.theme-high-contrast .breadcrumb {
				background: var(--mc-bg-secondary);
				color: var(--mc-text-secondary);
				border: 2px solid var(--mc-border);
			}
		`;
	}
}
