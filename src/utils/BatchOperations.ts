import { App, TFile, TAbstractFile } from 'obsidian';

/**
 * Utility for batching file operations to improve performance
 * Groups multiple create/rename/delete operations and triggers single metadata cache rescan
 */
export class BatchOperations {
    private app: App;
    private operations: Array<() => Promise<any>> = [];
    private isRunning = false;

    constructor(app: App) {
        this.app = app;
    }

    /**
     * Add a file creation operation to the batch
     */
    addCreateOperation(path: string, content: string): void {
        this.operations.push(async () => {
            return await this.app.vault.create(path, content);
        });
    }

    /**
     * Add a file rename operation to the batch
     */
    addRenameOperation(file: TAbstractFile, newPath: string): void {
        this.operations.push(async () => {
            return await this.app.fileManager.renameFile(file, newPath);
        });
    }

    /**
     * Add a file delete operation to the batch
     */
    addDeleteOperation(file: TAbstractFile): void {
        this.operations.push(async () => {
            return await this.app.vault.delete(file);
        });
    }

    /**
     * Add a custom file operation to the batch
     */
    addCustomOperation(operation: () => Promise<any>): void {
        this.operations.push(operation);
    }

    /**
     * Execute all batched operations and trigger single metadata cache rescan
     */
    async execute(): Promise<any[]> {
        if (this.isRunning) {
            throw new Error('Batch operations are already running');
        }

        if (this.operations.length === 0) {
            return [];
        }

        console.time('[BatchOperations] Execution time');
        console.log(`[BatchOperations] Executing ${this.operations.length} operations...`);

        this.isRunning = true;
        const results: any[] = [];
        const errors: Error[] = [];

        try {
            // Execute all operations
            for (let i = 0; i < this.operations.length; i++) {
                try {
                    const result = await this.operations[i]();
                    results.push(result);
                    console.log(`[BatchOperations] Operation ${i + 1}/${this.operations.length} completed`);
                } catch (error) {
                    console.error(`[BatchOperations] Operation ${i + 1} failed:`, error);
                    errors.push(error as Error);
                    results.push(null);
                }
            }

            // Trigger single metadata cache rescan
            console.log('[BatchOperations] Triggering metadata cache rescan...');
            await this.app.metadataCache.trigger('resolved');

        } finally {
            this.isRunning = false;
            this.operations = [];
            console.timeEnd('[BatchOperations] Execution time');
        }

        if (errors.length > 0) {
            console.warn(`[BatchOperations] ${errors.length} operations failed out of ${results.length} total`);
        }

        return results;
    }

    /**
     * Get the number of pending operations
     */
    getPendingCount(): number {
        return this.operations.length;
    }

    /**
     * Check if batch operations are currently running
     */
    isExecuting(): boolean {
        return this.isRunning;
    }

    /**
     * Clear all pending operations without executing them
     */
    clear(): void {
        if (this.isRunning) {
            throw new Error('Cannot clear operations while batch is executing');
        }
        this.operations = [];
    }
}

/**
 * Helper function to run file operations in batch
 * 
 * @param app - The Obsidian App instance
 * @param operations - Array of operation functions to execute
 * @returns Promise resolving to array of operation results
 */
export async function runInBatch(
    app: App,
    operations: Array<(batch: BatchOperations) => void>
): Promise<any[]> {
    const batch = new BatchOperations(app);

    // Add all operations to the batch
    operations.forEach(op => op(batch));

    // Execute the batch
    return await batch.execute();
}

/**
 * Batch file creation helper
 */
export async function createFilesInBatch(
    app: App,
    files: Array<{ path: string; content: string }>
): Promise<TFile[]> {
    return await runInBatch(app, files.map(file => 
        (batch: BatchOperations) => batch.addCreateOperation(file.path, file.content)
    ));
}

/**
 * Batch file deletion helper
 */
export async function deleteFilesInBatch(
    app: App,
    files: TAbstractFile[]
): Promise<void[]> {
    return await runInBatch(app, files.map(file => 
        (batch: BatchOperations) => batch.addDeleteOperation(file)
    ));
}

/**
 * Batch file rename helper
 */
export async function renameFilesInBatch(
    app: App,
    renames: Array<{ file: TAbstractFile; newPath: string }>
): Promise<void[]> {
    return await runInBatch(app, renames.map(rename => 
        (batch: BatchOperations) => batch.addRenameOperation(rename.file, rename.newPath)
    ));
}
