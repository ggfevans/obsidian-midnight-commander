import { App, PluginSettingTab, Setting } from 'obsidian';
import MidnightCommanderPlugin from '../../main';

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
	}
}
