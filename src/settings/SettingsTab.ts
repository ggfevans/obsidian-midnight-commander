import { App, PluginSettingTab, Setting } from 'obsidian';
import MidnightCommanderPlugin from '../../main';
import { BookmarkItem } from '../types/interfaces';

export class MidnightCommanderSettingTab extends PluginSettingTab {
	plugin: MidnightCommanderPlugin;

	constructor(app: App, plugin: MidnightCommanderPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Midnight Commander Settings' });

		new Setting(containerEl)
			.setName('Open view on startup')
			.setDesc('Automatically open the Midnight Commander view when Obsidian starts.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.openViewOnStart)
				.onChange(async (value) => {
					this.plugin.settings.openViewOnStart = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show hidden files')
			.setDesc('Display files and folders that start with a dot (.).')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showHiddenFiles)
				.onChange(async (value) => {
					this.plugin.settings.showHiddenFiles = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show breadcrumbs')
			.setDesc('Display breadcrumb navigation at the top of each pane.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showBreadcrumbs)
				.onChange(async (value) => {
					this.plugin.settings.showBreadcrumbs = value;
					await this.plugin.saveSettings();
				}));
		
		new Setting(containerEl)
			.setName('Center-align breadcrumbs')
			.setDesc('Center-align the breadcrumb path within the header.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.centerBreadcrumbs)
				.onChange(async (value) => {
					this.plugin.settings.centerBreadcrumbs = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auto-preview delay (ms)')
			.setDesc('The delay in milliseconds before the auto-preview appears.')
			.addText(text => text
				.setPlaceholder('300')
				.setValue(String(this.plugin.settings.previewDelay))
				.onChange(async (value) => {
					this.plugin.settings.previewDelay = Number(value);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Keymap profile')
			.setDesc('Choose between default and Vim-style keybindings.')
			.addDropdown(dropdown => dropdown
				.addOption('default', 'Default')
				.addOption('vim', 'Vim')
				.setValue(this.plugin.settings.keymapProfile)
				.onChange(async (value) => {
					this.plugin.settings.keymapProfile = value as 'default' | 'vim';
					await this.plugin.saveSettings();
				}));

		// === APPEARANCE & UI ===
		containerEl.createEl('h3', { text: 'Appearance & UI' });

		new Setting(containerEl)
			.setName('Show file icons')
			.setDesc('Display file type icons next to file names.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showFileIcons)
				.onChange(async (value) => {
					this.plugin.settings.showFileIcons = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Default active pane')
			.setDesc('Which pane should be active when opening the view.')
			.addDropdown(dropdown => dropdown
				.addOption('left', 'Left Pane')
				.addOption('right', 'Right Pane')
				.setValue(this.plugin.settings.activePane)
				.onChange(async (value) => {
					this.plugin.settings.activePane = value as 'left' | 'right';
					await this.plugin.saveSettings();
				}));

		// === KEYBOARD SHORTCUTS ===
		containerEl.createEl('h3', { text: 'Keyboard Shortcuts' });
		
		const shortcutsDesc = containerEl.createDiv();
		shortcutsDesc.innerHTML = `
			<p><strong>Navigation:</strong></p>
			<ul>
				<li><kbd>Tab</kbd> - Switch between panes</li>
				<li><kbd>Arrow Keys</kbd> - Navigate files and folders</li>
				<li><kbd>Enter</kbd> - Open file/enter folder</li>
				<li><kbd>Ctrl+Home</kbd> - Go to vault root</li>
				<li><kbd>Alt+←/→</kbd> - Navigation history</li>
			</ul>
			<p><strong>File Operations:</strong></p>
			<ul>
				<li><kbd>F2</kbd> - Rename file</li>
				<li><kbd>F3</kbd> - Preview file</li>
				<li><kbd>F4</kbd> - Show file properties</li>
				<li><kbd>F5</kbd> - Copy files</li>
				<li><kbd>F6</kbd> - Move files</li>
				<li><kbd>F7</kbd> - Create new folder</li>
				<li><kbd>F8</kbd> - Delete files</li>
			</ul>
			<p><strong>Selection:</strong></p>
			<ul>
				<li><kbd>Space</kbd> - Toggle file selection</li>
				<li><kbd>Ctrl+A</kbd> - Select all</li>
				<li><kbd>Ctrl+D</kbd> - Deselect all</li>
				<li><kbd>Ctrl+Shift+I</kbd> - Invert selection</li>
			</ul>
			<p><strong>Advanced:</strong></p>
			<ul>
				<li><kbd>Ctrl+F</kbd> or <kbd>/</kbd> - Quick search</li>
				<li><kbd>Ctrl+B</kbd> - Bookmark folder</li>
				<li><kbd>Ctrl+Shift+B</kbd> - Show bookmarks</li>
				<li><kbd>Ctrl+H</kbd> - Recent folders</li>
				<li><kbd>Ctrl+L</kbd> - Go to folder dialog</li>
				<li><kbd>Ctrl+S</kbd> - Sort menu</li>
				<li><kbd>Ctrl+Shift+S</kbd> - Sync panes</li>
			</ul>
		`;

		// === BOOKMARKS MANAGEMENT ===
		containerEl.createEl('h3', { text: 'Bookmarks' });
		
		new Setting(containerEl)
			.setName('Manage bookmarks')
			.setDesc('Add, edit, or remove folder bookmarks.')
			.addButton(button => button
				.setButtonText('Open Bookmark Manager')
				.onClick(() => {
					this.showBookmarkManager();
				}));

		this.displayBookmarksList(containerEl);

		// === ADVANCED SETTINGS ===
		containerEl.createEl('h3', { text: 'Advanced Settings' });

		new Setting(containerEl)
			.setName('Enable Vim bindings')
			.setDesc('Use Vim-style navigation keys (h,j,k,l) for file navigation.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.vimBindings)
				.onChange(async (value) => {
					this.plugin.settings.vimBindings = value;
					await this.plugin.saveSettings();
				}));

		// === HELP & DOCUMENTATION ===
		containerEl.createEl('h3', { text: 'Help & Documentation' });
		
		const helpDesc = containerEl.createDiv();
		helpDesc.innerHTML = `
			<p>For more information and advanced usage tips, visit the plugin documentation.</p>
			<p><strong>Tips:</strong></p>
			<ul>
				<li>Use <kbd>Ctrl+P</kbd> to open the command palette with available actions</li>
				<li>Double-click the resize handle to reset pane sizes to 50/50</li>
				<li>Right-click files and folders for context menus</li>
				<li>Use <kbd>Ctrl+.</kbd> to toggle hidden files visibility</li>
			</ul>
		`;
	}

	/**
	 * Display the list of current bookmarks
	 */
	private displayBookmarksList(containerEl: HTMLElement) {
		const bookmarksContainer = containerEl.createDiv({ cls: 'bookmarks-container' });
		
		if (!this.plugin.settings.bookmarks || this.plugin.settings.bookmarks.length === 0) {
			bookmarksContainer.createEl('p', { text: 'No bookmarks saved yet. Use Ctrl+B in the file manager to bookmark folders.' });
			return;
		}

		bookmarksContainer.createEl('h4', { text: 'Current Bookmarks:' });
		
		this.plugin.settings.bookmarks.forEach((bookmark, index) => {
			const bookmarkEl = bookmarksContainer.createDiv({ cls: 'bookmark-item' });
			bookmarkEl.style.cssText = 'display: flex; align-items: center; margin: 5px 0; padding: 5px; border: 1px solid var(--background-modifier-border); border-radius: 3px;';
			
			const nameEl = bookmarkEl.createSpan({ text: bookmark.name });
			nameEl.style.cssText = 'flex-grow: 1; margin-right: 10px; font-weight: bold;';
			
			const pathEl = bookmarkEl.createSpan({ text: bookmark.path });
			pathEl.style.cssText = 'color: var(--text-muted); margin-right: 10px; font-size: 0.9em;';
			
			const deleteBtn = bookmarkEl.createEl('button', { text: '×' });
			deleteBtn.style.cssText = 'background: none; border: none; color: var(--text-error); cursor: pointer; font-size: 16px; width: 24px; height: 24px;';
			deleteBtn.title = 'Remove bookmark';
			deleteBtn.onclick = async () => {
				this.plugin.settings.bookmarks!.splice(index, 1);
				await this.plugin.saveSettings();
				this.display(); // Refresh the settings display
			};
		});
	}

	/**
	 * Show the bookmark manager dialog
	 */
	private showBookmarkManager() {
		const modal = document.createElement('div');
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.5);
			z-index: 1000;
			display: flex;
			align-items: center;
			justify-content: center;
		`;
		
		const dialog = modal.createDiv();
		dialog.style.cssText = `
			background: var(--background-primary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 8px;
			padding: 20px;
			width: 500px;
			max-height: 80vh;
			overflow-y: auto;
		`;
		
		dialog.createEl('h3', { text: 'Bookmark Manager' });
		
		// Add new bookmark section
		const addSection = dialog.createDiv();
		addSection.createEl('h4', { text: 'Add New Bookmark' });
		
		const nameInput = addSection.createEl('input', { type: 'text', placeholder: 'Bookmark name' });
		nameInput.style.cssText = 'width: 100%; margin: 5px 0; padding: 8px; border: 1px solid var(--background-modifier-border); border-radius: 3px;';
		
		const pathInput = addSection.createEl('input', { type: 'text', placeholder: 'Folder path' });
		pathInput.style.cssText = 'width: 100%; margin: 5px 0; padding: 8px; border: 1px solid var(--background-modifier-border); border-radius: 3px;';
		
		const addBtn = addSection.createEl('button', { text: 'Add Bookmark' });
		addBtn.style.cssText = 'margin: 10px 5px 10px 0; padding: 8px 16px; background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: 3px; cursor: pointer;';
		
		addBtn.onclick = async () => {
			const name = nameInput.value.trim();
			const path = pathInput.value.trim();
			
			if (name && path) {
				if (!this.plugin.settings.bookmarks) {
					this.plugin.settings.bookmarks = [];
				}
				
				this.plugin.settings.bookmarks.push({ name, path });
				await this.plugin.saveSettings();
				
				nameInput.value = '';
				pathInput.value = '';
				
				// Refresh the dialog
				document.body.removeChild(modal);
				this.showBookmarkManager();
			}
		};
		
		// Current bookmarks section
		if (this.plugin.settings.bookmarks && this.plugin.settings.bookmarks.length > 0) {
			dialog.createEl('h4', { text: 'Current Bookmarks' });
			
			this.plugin.settings.bookmarks.forEach((bookmark, index) => {
				const bookmarkEl = dialog.createDiv();
				bookmarkEl.style.cssText = 'display: flex; align-items: center; margin: 5px 0; padding: 10px; border: 1px solid var(--background-modifier-border); border-radius: 3px;';
				
				const infoDiv = bookmarkEl.createDiv();
				infoDiv.style.cssText = 'flex-grow: 1;';
				
				infoDiv.createEl('div', { text: bookmark.name }).style.cssText = 'font-weight: bold; margin-bottom: 2px;';
				infoDiv.createEl('div', { text: bookmark.path }).style.cssText = 'color: var(--text-muted); font-size: 0.9em;';
				
				const deleteBtn = bookmarkEl.createEl('button', { text: 'Remove' });
				deleteBtn.style.cssText = 'margin-left: 10px; padding: 5px 10px; background: var(--text-error); color: white; border: none; border-radius: 3px; cursor: pointer;';
				deleteBtn.onclick = async () => {
					this.plugin.settings.bookmarks!.splice(index, 1);
					await this.plugin.saveSettings();
					
					// Refresh the dialog
					document.body.removeChild(modal);
					this.showBookmarkManager();
				};
			});
		}
		
		// Close button
		const closeBtn = dialog.createEl('button', { text: 'Close' });
		closeBtn.style.cssText = 'margin-top: 20px; padding: 8px 16px; background: var(--background-modifier-border); border: none; border-radius: 3px; cursor: pointer;';
		closeBtn.onclick = () => {
			document.body.removeChild(modal);
			this.display(); // Refresh the main settings display
		};
		
		// Close on background click
		modal.onclick = (e) => {
			if (e.target === modal) {
				document.body.removeChild(modal);
				this.display();
			}
		};
		
		document.body.appendChild(modal);
		nameInput.focus();
	}
}
