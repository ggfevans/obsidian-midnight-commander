import { App, TAbstractFile, TFolder, TFile, Notice, Modal } from 'obsidian';
import { FileCache } from '../utils/FileCache';
import { BatchOperations, runInBatch } from '../utils/BatchOperations';
import { NotificationManager, withNotification, withErrorHandling } from '../utils/NotificationManager';

export class FileOperations {
    constructor(private app: App, private fileCache?: FileCache) {}

    /**
     * Copy files to target folder with progress tracking
     */
    async copyFiles(files: TAbstractFile[], targetFolder: TFolder): Promise<void> {
        if (files.length === 0) {
            NotificationManager.warning('No files selected for copying');
            return;
        }

        return await withNotification(
            this.executeCopyOperation(files, targetFolder),
            {
                errorMessage: 'Failed to copy files',
                successMessage: `Successfully copied ${files.length} item(s) to ${targetFolder.name}`,
                showProgress: files.length > 5,
                progressMessage: `Copying ${files.length} files...`
            }
        );
    }

    private async executeCopyOperation(files: TAbstractFile[], targetFolder: TFolder): Promise<void> {
        const progressNotification = files.length > 3 ? 
            NotificationManager.progress(`Copying files...`) : null;

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                if (progressNotification) {
                    const progress = ((i + 1) / files.length) * 100;
                    progressNotification.update(`Copying ${file.name}...`, progress);
                }
                
                await this.copyFile(file, targetFolder);
            }
        } finally {
            if (progressNotification) {
                progressNotification.hide();
            }
        }
    }

    /**
     * Move files to target folder using batch operations with progress tracking
     */
    async moveFiles(files: TAbstractFile[], targetFolder: TFolder): Promise<void> {
        if (files.length === 0) {
            NotificationManager.warning('No files selected for moving');
            return;
        }

        return await withNotification(
            this.executeMoveOperation(files, targetFolder),
            {
                errorMessage: 'Failed to move files',
                successMessage: `Successfully moved ${files.length} item(s) to ${targetFolder.name}`,
                showProgress: files.length > 5,
                progressMessage: `Moving ${files.length} files...`
            }
        );
    }

    private async executeMoveOperation(files: TAbstractFile[], targetFolder: TFolder): Promise<void> {
        console.time(`[FileOperations] Move ${files.length} files`);
        console.log(`[FileOperations] Starting batch move of ${files.length} files to ${targetFolder.path}`);

        try {
            // Use batch operations for better performance with metadata cache optimization
            await runInBatch(this.app, files.map(file => 
                (batch: BatchOperations) => {
                    const targetPath = this.generateUniqueTargetPath(file, targetFolder);
                    batch.addRenameOperation(file, targetPath);
                }
            ));
        } finally {
            console.timeEnd(`[FileOperations] Move ${files.length} files`);
        }
    }

    /**
     * Delete files with confirmation using batch operations
     */
    async deleteFiles(files: TAbstractFile[]): Promise<void> {
        if (files.length === 0) {
            NotificationManager.warning('No files selected for deletion');
            return;
        }

        // Show enhanced confirmation dialog
        const fileList = files.map(f => f.name).join(', ');
        const message = files.length === 1 ? 
            `Are you sure you want to delete "${files[0].name}"?` :
            `Are you sure you want to delete ${files.length} items?\n\n${fileList.length > 100 ? fileList.substring(0, 100) + '...' : fileList}`;
        
        const confirmed = await NotificationManager.confirm(
            message,
            'Confirm Deletion',
            'Delete',
            'Cancel'
        );
        
        if (!confirmed) {
            NotificationManager.info('Deletion cancelled');
            return;
        }

        return await withNotification(
            this.executeDeleteOperation(files),
            {
                errorMessage: 'Failed to delete files',
                successMessage: `Successfully deleted ${files.length} item(s)`,
                showProgress: files.length > 5,
                progressMessage: `Deleting ${files.length} files...`
            }
        );
    }

    private async executeDeleteOperation(files: TAbstractFile[]): Promise<void> {
        console.time(`[FileOperations] Delete ${files.length} files`);
        console.log(`[FileOperations] Starting batch deletion of ${files.length} files`);

        try {
            // Use batch operations for better performance with metadata cache optimization
            await runInBatch(this.app, files.map(file => 
                (batch: BatchOperations) => {
                    // Note: FileManager.trashFile is safer for TFiles, but we need custom operations for folders
                    if (file instanceof TFile) {
                        batch.addCustomOperation(() => this.app.fileManager.trashFile(file));
                    } else if (file instanceof TFolder) {
                        batch.addDeleteOperation(file);
                    }
                }
            ));
        } finally {
            console.timeEnd(`[FileOperations] Delete ${files.length} files`);
        }
    }

    /**
     * Create a new folder
     */
    async createNewFolder(parentFolder: TFolder, name?: string): Promise<TFolder | null> {
        const folderName = name || await this.promptForName('New folder name:', 'New Folder');
        if (!folderName) return null;

        const folderPath = `${parentFolder.path}/${folderName}`;

        try {
            // Check if folder already exists
            if (this.app.vault.getAbstractFileByPath(folderPath)) {
                new Notice(`Folder "${folderName}" already exists`);
                return null;
            }

            // For now, vault.createFolder is still the recommended way to create folders
            // FileManager doesn't have a createFolder method
            await this.app.vault.createFolder(folderPath);
            new Notice(`Created folder: ${folderName}`);
            return this.app.vault.getAbstractFileByPath(folderPath) as TFolder;
        } catch (error) {
            console.error('Error creating folder:', error);
            new Notice(`Error creating folder: ${error.message}`, 3000);
            return null;
        }
    }

    /**
     * Rename a file or folder
     */
    async renameFile(file: TAbstractFile): Promise<void> {
        const currentName = file.name;
        const newName = await this.promptForName('Rename to:', currentName);
        if (!newName || newName === currentName) return;

        try {
            const newPath = `${file.parent?.path}/${newName}`;
            await this.app.fileManager.renameFile(file, newPath);
            new Notice(`Renamed "${currentName}" to "${newName}"`);
        } catch (error) {
            console.error('Error renaming file:', error);
            new Notice(`Error renaming file: ${error.message}`, 3000);
            throw error;
        }
    }

    /**
     * Make a copy of a file or folder in the same directory
     */
    async copyFileInPlace(file: TAbstractFile): Promise<void> {
        if (!file.parent) {
            new Notice('Cannot copy root directory');
            return;
        }

        try {
            const targetPath = this.generateCopyName(file);
            
            if (file instanceof TFile) {
                // Use cachedRead for better performance, fallback to read
                const content = await this.safeReadFile(file);
                await this.safeCreateFile(targetPath, content);
            } else if (file instanceof TFolder) {
                // Create the folder first
                await this.app.vault.createFolder(targetPath);
                
                // Recursively copy folder contents
                const targetFolderObj = this.app.vault.getAbstractFileByPath(targetPath) as TFolder;
                const children = file.children;
                for (const child of children) {
                    await this.copyFile(child, targetFolderObj);
                }
            }
            
            new Notice(`Created copy: ${targetPath.split('/').pop()}`);
        } catch (error) {
            console.error('Error copying file:', error);
            new Notice(`Error copying file: ${error.message}`, 3000);
            throw error;
        }
    }

    private async copyFile(file: TAbstractFile, targetFolder: TFolder): Promise<void> {
        const targetPath = this.generateUniqueTargetPath(file, targetFolder);

        if (file instanceof TFile) {
            const content = await this.safeReadFile(file);
            await this.safeCreateFile(targetPath, content);
        } else if (file instanceof TFolder) {
            // Create the folder first
            await this.app.vault.createFolder(targetPath);
            
            // Recursively copy folder contents
            const targetFolderObj = this.app.vault.getAbstractFileByPath(targetPath) as TFolder;
            const children = file.children;
            for (const child of children) {
                await this.copyFile(child, targetFolderObj);
            }
        }
    }

    private async moveFile(file: TAbstractFile, targetFolder: TFolder): Promise<void> {
        const targetPath = this.generateUniqueTargetPath(file, targetFolder);
        
        // Use FileManager for link-aware operations
        await this.app.fileManager.renameFile(file, targetPath);
    }

    private generateUniqueTargetPath(file: TAbstractFile, targetFolder: TFolder): string {
        let targetPath = `${targetFolder.path}/${file.name}`;
        
        // Handle naming conflicts by adding a number suffix
        if (this.app.vault.getAbstractFileByPath(targetPath)) {
            const extension = file instanceof TFile ? file.extension : '';
            const basename = extension ? 
                file.name.replace(new RegExp(`\\.${extension}$`), '') : 
                file.name;
            
            let counter = 1;
            do {
                const newName = extension ? 
                    `${basename} ${counter}.${extension}` : 
                    `${basename} ${counter}`;
                targetPath = `${targetFolder.path}/${newName}`;
                counter++;
            } while (this.app.vault.getAbstractFileByPath(targetPath));
        }
        
        return targetPath;
    }

    /**
     * Generate a copy name for a file/folder in the same directory
     */
    private generateCopyName(file: TAbstractFile): string {
        const parentPath = file.parent?.path || '';
        const extension = file instanceof TFile ? file.extension : '';
        const basename = extension ? 
            file.name.replace(new RegExp(`\\.${extension}$`), '') : 
            file.name;
        
        // Try "Copy of [name]" first
        let copyName = extension ? 
            `Copy of ${basename}.${extension}` : 
            `Copy of ${basename}`;
        let targetPath = parentPath ? `${parentPath}/${copyName}` : copyName;
        
        // If that exists, try "Copy of [name] 2", "Copy of [name] 3", etc.
        let counter = 2;
        while (this.app.vault.getAbstractFileByPath(targetPath)) {
            copyName = extension ? 
                `Copy of ${basename} ${counter}.${extension}` : 
                `Copy of ${basename} ${counter}`;
            targetPath = parentPath ? `${parentPath}/${copyName}` : copyName;
            counter++;
        }
        
        return targetPath;
    }

    private async confirmDeletion(files: TAbstractFile[]): Promise<boolean> {
        return new Promise((resolve) => {
            const modal = new ConfirmationModal(
                this.app,
                'Confirm Deletion',
                `Are you sure you want to delete ${files.length} item(s)?`,
                'Delete',
                'Cancel',
                (result) => resolve(result)
            );
            modal.open();
        });
    }

    private async promptForName(message: string, defaultValue: string = ''): Promise<string | null> {
        return new Promise((resolve) => {
            const modal = new TextInputModal(
                this.app,
                message,
                defaultValue,
                (result) => resolve(result)
            );
            modal.open();
        });
    }

    /**
     * Safe file reading with cache awareness and cachedRead fallback
     */
    private async safeReadFile(file: TFile): Promise<string> {
        // Check file cache first if available
        if (this.fileCache) {
            const cachedContent = this.fileCache.getCachedContent(file);
            if (cachedContent !== undefined) {
                return cachedContent;
            }
        }

        try {
            // Try cachedRead first for better performance
            const content = await this.app.vault.cachedRead(file);
            
            // Cache the content for future use
            if (this.fileCache) {
                this.fileCache.cacheContent(file, content);
            }
            
            return content;
        } catch (error) {
            console.warn('cachedRead failed, falling back to regular read:', error);
            const content = await this.app.vault.read(file);
            
            // Cache the content from regular read too
            if (this.fileCache) {
                this.fileCache.cacheContent(file, content);
            }
            
            return content;
        }
    }

    /**
     * Safe file creation with collision handling
     */
    private async safeCreateFile(path: string, content: string): Promise<TFile> {
        // Check if file already exists and generate unique name if needed
        let finalPath = path;
        let counter = 1;
        
        while (this.app.vault.getAbstractFileByPath(finalPath)) {
            const extension = path.includes('.') ? path.substring(path.lastIndexOf('.')) : '';
            const baseName = extension ? path.replace(extension, '') : path;
            finalPath = `${baseName} ${counter}${extension}`;
            counter++;
        }
        
        return await this.app.vault.create(finalPath, content);
    }

    /**
     * Create a new file with FileManager awareness
     */
    async createNewFile(parentFolder: TFolder, fileName: string, content: string = ''): Promise<TFile | null> {
        try {
            const filePath = `${parentFolder.path}/${fileName}`;
            
            // Check if file already exists
            if (this.app.vault.getAbstractFileByPath(filePath)) {
                new Notice(`File "${fileName}" already exists`);
                return null;
            }
            
            const newFile = await this.safeCreateFile(filePath, content);
            new Notice(`Created file: ${fileName}`);
            return newFile;
        } catch (error) {
            console.error('Error creating file:', error);
            new Notice(`Error creating file: ${error.message}`, 3000);
            return null;
        }
    }
}

class TextInputModal extends Modal {
    private result: string = '';
    private callback: (result: string | null) => void;

    constructor(
        app: App,
        private title: string,
        private defaultValue: string,
        callback: (result: string | null) => void
    ) {
        super(app);
        this.callback = callback;
        this.result = defaultValue;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: this.title });

        const inputEl = contentEl.createEl('input', {
            type: 'text',
            value: this.defaultValue
        });
        inputEl.focus();
        inputEl.select();

        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.result = inputEl.value.trim();
                this.close();
                this.callback(this.result || null);
            } else if (e.key === 'Escape') {
                this.close();
                this.callback(null);
            }
        });

        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
        
        const okButton = buttonContainer.createEl('button', { text: 'OK' });
        okButton.addEventListener('click', () => {
            this.result = inputEl.value.trim();
            this.close();
            this.callback(this.result || null);
        });

        const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelButton.addEventListener('click', () => {
            this.close();
            this.callback(null);
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class ConfirmationModal extends Modal {
    constructor(
        app: App,
        private title: string,
        private message: string,
        private confirmText: string,
        private cancelText: string,
        private callback: (result: boolean) => void
    ) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: this.title });
        contentEl.createEl('p', { text: this.message });

        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
        
        const confirmButton = buttonContainer.createEl('button', { 
            text: this.confirmText,
            cls: 'mod-warning'
        });
        confirmButton.addEventListener('click', () => {
            this.close();
            this.callback(true);
        });

        const cancelButton = buttonContainer.createEl('button', { text: this.cancelText });
        cancelButton.addEventListener('click', () => {
            this.close();
            this.callback(false);
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
