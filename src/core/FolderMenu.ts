/**
 * FolderMenu - File/folder navigation menu adapted from Quick Explorer
 * 
 * Extends PopupMenu with file-specific functionality including:
 * - File/folder display with icons
 * - Auto-preview mode with hover editors
 * - File operations (rename, delete, etc.)
 * - Smart folder navigation
 */

import { TAbstractFile, TFile, TFolder, App, HoverPopover } from 'obsidian';
import { PopupMenu, PopupMenuItem } from './PopupMenu';
import { FileOperations } from '../operations/FileOperations';

export interface FolderMenuOptions {
    app: App;
    folder: TFolder;
    showHiddenFiles?: boolean;
    onFileSelect?: (file: TAbstractFile) => void;
    onFolderNavigate?: (folder: TFolder) => void;
    className?: string;
    onClose?: () => void;
}

/**
 * Specialized menu for displaying and navigating folder contents
 */
export class FolderMenu extends PopupMenu {
    protected app: App;
    protected folder: TFolder;
    protected showHiddenFiles: boolean;
    protected fileOperations: FileOperations;
    protected autoPreview = false;
    protected hoverPopover?: HoverPopover;
    protected previewDelay = 300;
    protected onFileSelect?: (file: TAbstractFile) => void;
    protected onFolderNavigate?: (folder: TFolder) => void;

    constructor(options: FolderMenuOptions) {
        super({
            className: `folder-menu ${options.className || ''}`,
            onClose: options.onClose
        });
        
        this.app = options.app;
        this.folder = options.folder;
        this.showHiddenFiles = options.showHiddenFiles || false;
        this.onFileSelect = options.onFileSelect;
        this.onFolderNavigate = options.onFolderNavigate;
        
        this.fileOperations = new FileOperations(this.app);
        
        // Load folder contents
        this.loadFolderContents();
        
        // Add file-specific keyboard handlers
        this.setupFileKeyboardHandlers();
    }

    /**
     * Load and display folder contents
     */
    public loadFolderContents() {
        const sortedFiles = this.getSortedFiles();
        
        this.items = [];
        this.filteredItems = [];
        
        // Add parent folder navigation (unless we're at root)
        if (this.folder.parent) {
            this.items.push({
                title: '..',
                icon: 'folder-up',
                className: 'is-parent-folder',
                callback: () => this.navigateToParent()
            });
        }
        
        // Add folders first
        sortedFiles.folders.forEach(folder => {
            this.items.push({
                title: folder.name,
                icon: 'folder',
                className: 'is-folder',
                callback: () => this.navigateToFolder(folder)
            });
        });
        
        // Add folder note if it exists
        if (sortedFiles.folderNote) {
            this.items.push({
                title: sortedFiles.folderNote.basename,
                icon: 'file-text',
                className: 'is-folder-note',
                callback: () => { 
                    if (sortedFiles.folderNote) {
                        this.selectFile(sortedFiles.folderNote);
                    }
                }
            });
        }
        
        // Add regular files
        sortedFiles.files.forEach(file => {
            this.items.push({
                title: file.basename,
                icon: this.getFileIcon(file),
                className: 'is-file',
                callback: () => this.selectFile(file)
            });
        });
        
        this.filteredItems = [...this.items];
        this.render();
    }

    /**
     * Get sorted files using the same logic as Quick Explorer
     */
    protected getSortedFiles() {
        const { children } = this.folder;
        const folderNote = this.getFolderNote();
        
        // Filter and sort items
        const items = children.slice()
            .filter(item => this.showHiddenFiles || !item.name.startsWith('.'))
            .sort((a, b) => this.compareFiles(a, b));
        
        const folders = items.filter(f => f instanceof TFolder) as TFolder[];
        const files = items.filter(f => f instanceof TFile && f !== folderNote) as TFile[];
        
        return { folderNote, folders, files };
    }

    /**
     * Compare files for sorting (folders first, then alphabetical)
     */
    protected compareFiles(a: TAbstractFile, b: TAbstractFile): number {
        // Use Intl.Collator for natural sorting like Quick Explorer
        const collator = new Intl.Collator(undefined, {
            usage: "sort",
            sensitivity: "base",
            numeric: true
        });
        
        // Folders before files
        if (a instanceof TFolder && !(b instanceof TFolder)) return -1;
        if (!(a instanceof TFolder) && b instanceof TFolder) return 1;
        
        // Compare names
        const aName = a instanceof TFile ? a.basename : a.name;
        const bName = b instanceof TFile ? b.basename : b.name;
        
        return collator.compare(aName, bName);
    }

    /**
     * Get folder note for current folder
     */
    protected getFolderNote(): TFile | null {
        const notePath = `${this.folder.path}/${this.folder.name}.md`;
        const note = this.app.vault.getAbstractFileByPath(notePath);
        return (note instanceof TFile) ? note : null;
    }

    /**
     * Get appropriate icon for file type
     */
    protected getFileIcon(file: TFile): string {
        const ext = file.extension.toLowerCase();
        
        switch (ext) {
            case 'md': return 'file-text';
            case 'pdf': return 'file-text';
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'svg': return 'image';
            case 'mp3':
            case 'wav':
            case 'ogg': return 'audio-file';
            case 'mp4':
            case 'avi':
            case 'mov': return 'video';
            default: return 'file';
        }
    }

    /**
     * Setup additional keyboard handlers for file operations
     */
    protected setupFileKeyboardHandlers() {
        // Toggle auto-preview mode
        this.scope.register([], "Tab", () => {
            this.togglePreviewMode();
            return false;
        });
        
        // File operations
        this.scope.register([], "F2", () => {
            this.renameSelected();
            return false;
        });
        
        this.scope.register(["Shift"], "F2", () => {
            this.moveSelected();
            return false;
        });
        
        this.scope.register([], "Delete", () => {
            this.deleteSelected();
            return false;
        });
        
        // Context menu
        this.scope.register([], "\\", () => {
            this.showContextMenuForSelected();
            return false;
        });
        
        this.scope.register([], "ContextMenu", () => {
            this.showContextMenuForSelected();
            return false;
        });
        
        this.scope.register(["Alt"], "Enter", () => {
            this.showContextMenuForSelected();
            return false;
        });
        
        // Open in new tab
        this.scope.register(["Mod"], "Enter", () => {
            this.openSelectedInNewTab();
            return false;
        });
    }

    /**
     * Override selection to trigger auto-preview
     */
    select(index: number, scroll = true) {
        const oldIndex = this.selectedIndex;
        super.select(index, scroll);
        
        if (oldIndex !== this.selectedIndex && this.autoPreview) {
            this.showPreview();
        }
    }

    /**
     * Navigate to parent folder
     */
    protected navigateToParent() {
        if (this.folder.parent) {
            this.navigateToFolder(this.folder.parent);
        }
    }

    /**
     * Navigate to a subfolder
     */
    protected navigateToFolder(folder: TFolder) {
        this.hide();
        if (this.onFolderNavigate) {
            this.onFolderNavigate(folder);
        }
    }

    /**
     * Select a file
     */
    protected selectFile(file: TFile) {
        this.hide();
        if (this.onFileSelect) {
            this.onFileSelect(file);
        } else {
            // Default: open file in active leaf
            this.app.workspace.getLeaf().openFile(file);
        }
    }

    /**
     * Toggle auto-preview mode
     */
    public togglePreviewMode() {
        this.autoPreview = !this.autoPreview;
        
        if (this.autoPreview) {
            this.showPreview();
        } else {
            this.hidePreview();
        }
    }

    /**
     * Show preview for currently selected item
     */
    protected showPreview() {
        if (!this.autoPreview) return;
        
        const selectedFile = this.getSelectedFile();
        if (!selectedFile || !(selectedFile instanceof TFile)) {
            this.hidePreview();
            return;
        }
        
        // Use Obsidian's hover system
        setTimeout(() => {
            if (this.selectedIndex >= 0 && this.autoPreview) {
                this.app.workspace.trigger(
                    'hover-link',
                    {
                        event: null,
                        source: 'folder-menu',
                        hoverParent: this.dom,
                        targetEl: this.dom.children[this.selectedIndex] as HTMLElement,
                        linktext: selectedFile.path,
                        sourcePath: ''
                    }
                );
            }
        }, this.previewDelay);
    }

    /**
     * Hide current preview
     */
    protected hidePreview() {
        // Note: HoverPopover doesn't have a hide method, it manages itself
        if (this.hoverPopover) {
            this.hoverPopover = undefined;
        }
    }

    /**
     * Get currently selected file
     */
    protected getSelectedFile(): TAbstractFile | null {
        const item = this.filteredItems[this.selectedIndex];
        if (!item) return null;
        
        // Extract file reference from the item
        if (item.className?.includes('is-parent-folder')) {
            return this.folder.parent;
        } else if (item.className?.includes('is-folder')) {
            return this.folder.children.find(f => f.name === item.title && f instanceof TFolder) || null;
        } else {
            return this.folder.children.find(f => {
                if (f instanceof TFile) {
                    return f.basename === item.title || f.name === item.title;
                }
                return false;
            }) || null;
        }
    }

    /**
     * File operation methods
     */
    protected async renameSelected() {
        const file = this.getSelectedFile();
        if (!file) return;
        
        this.hide();
        // TODO: Implement rename dialog
        console.log('Rename:', file.name);
    }

    protected async moveSelected() {
        const file = this.getSelectedFile();
        if (!file) return;
        
        this.hide();
        // TODO: Implement move dialog
        console.log('Move:', file.name);
    }

    protected async deleteSelected() {
        const file = this.getSelectedFile();
        if (!file) return;
        
        try {
            await this.fileOperations.deleteFiles([file]);
            // Refresh menu
            this.loadFolderContents();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    }

    protected openSelectedInNewTab() {
        const file = this.getSelectedFile();
        if (file instanceof TFile) {
            this.hide();
            const leaf = this.app.workspace.getLeaf('tab');
            leaf.openFile(file);
        } else if (file instanceof TFolder) {
            this.navigateToFolder(file);
        }
    }

    protected showContextMenuForSelected() {
        const file = this.getSelectedFile();
        if (!file) return;
        
        // Create context menu
        const contextMenu = new PopupMenu({
            className: 'file-context-menu'
        });
        
        if (file instanceof TFile) {
            contextMenu.addItem({
                title: 'Open',
                icon: 'file-text',
                callback: () => this.selectFile(file)
            });
            
            contextMenu.addItem({
                title: 'Open in new tab',
                icon: 'external-link',
                callback: () => {
                    const leaf = this.app.workspace.getLeaf('tab');
                    leaf.openFile(file);
                    this.hide();
                }
            });
            
            contextMenu.addItem({
                title: 'Rename',
                icon: 'pencil',
                callback: () => this.renameSelected()
            });
            
            contextMenu.addItem({
                title: 'Delete',
                icon: 'trash',
                callback: () => this.deleteSelected()
            });
        } else if (file instanceof TFolder) {
            contextMenu.addItem({
                title: 'Open folder',
                icon: 'folder-open',
                callback: () => this.navigateToFolder(file)
            });
            
            contextMenu.addItem({
                title: 'Rename',
                icon: 'pencil',
                callback: () => this.renameSelected()
            });
            
            contextMenu.addItem({
                title: 'Delete',
                icon: 'trash',
                callback: () => this.deleteSelected()
            });
        }
        
        // Position context menu next to selected item
        const selectedEl = this.dom.children[this.selectedIndex] as HTMLElement;
        if (selectedEl) {
            contextMenu.cascade({
                target: selectedEl,
                onClose: () => contextMenu.hide()
            });
        }
    }

    hide() {
        this.hidePreview();
        return super.hide();
    }
}
