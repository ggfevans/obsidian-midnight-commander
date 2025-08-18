import {
	Plugin,
	WorkspaceLeaf,
} from 'obsidian';

import { MidnightCommanderView, VIEW_TYPE_MIDNIGHT_COMMANDER } from './src/views/MidnightCommanderView';
import { MidnightCommanderSettings } from './src/types/interfaces';

const DEFAULT_SETTINGS: MidnightCommanderSettings = {
	showHiddenFiles: false,
	openViewOnStart: false,
	vimBindings: false,
	showFileIcons: true,
	activePane: 'left',
};

export default class MidnightCommanderPlugin extends Plugin {
	settings: MidnightCommanderSettings;

	async onload() {
		console.log('Loading Obsidian Midnight Commander plugin');
		
		await this.loadSettings();

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

		// Open view on startup if enabled
		this.app.workspace.onLayoutReady(() => {
			if (this.settings.openViewOnStart) {
				this.activateView();
			}
		});
	}

	onunload() {
		console.log('Unloading Obsidian Midnight Commander plugin');
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_MIDNIGHT_COMMANDER);
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
}
