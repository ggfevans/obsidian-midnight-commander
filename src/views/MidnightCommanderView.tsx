import { ItemView, WorkspaceLeaf, TFolder, TAbstractFile, TFile } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { RecoilRoot } from 'recoil';
import React from 'react';
import MidnightCommanderPlugin from '../../main';
import { DualPaneManager } from './DualPaneManager';
import { PaneState, MidnightCommanderSettings } from '../types/interfaces';

export const VIEW_TYPE_MIDNIGHT_COMMANDER = 'midnight-commander-view';

export class MidnightCommanderView extends ItemView {
	plugin: MidnightCommanderPlugin;
	root: Root;
	leftPane: PaneState;
	rightPane: PaneState;
	settings: MidnightCommanderSettings;

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
}
