import { App, TFile, CachedMetadata, EventRef, Component } from 'obsidian';

interface FileCacheEntry {
    filePath: string;
    lastModified: number;
    size: number;
    metadata: CachedMetadata | null;
    content?: string;
    accessed: number;
}

/**
 * LRU file metadata cache to minimize vault I/O operations
 * Automatically invalidates entries when files are modified
 */
export class FileCache extends Component {
    private cache = new Map<string, FileCacheEntry>();
    private maxSize: number;
    private app: App;
    private metadataEventRef?: EventRef;
    private vaultEventRefs: EventRef[] = [];

    constructor(app: App, maxSize: number = 500) {
        super();
        this.app = app;
        this.maxSize = maxSize;
        
        this.setupEventListeners();
    }

    /**
     * Get cached metadata for a file
     */
    getCachedMetadata(file: TFile): CachedMetadata | null {
        const entry = this.getCacheEntry(file);
        return entry?.metadata || null;
    }

    /**
     * Get cached content for a file if available
     */
    getCachedContent(file: TFile): string | undefined {
        const entry = this.getCacheEntry(file);
        return entry?.content;
    }

    /**
     * Get or create cache entry for a file
     */
    private getCacheEntry(file: TFile): FileCacheEntry | null {
        const now = Date.now();
        const existing = this.cache.get(file.path);

        // Check if cache entry is valid (file hasn't been modified)
        if (existing && existing.lastModified >= file.stat.mtime && existing.size === file.stat.size) {
            // Update access time
            existing.accessed = now;
            // Move to end (most recently used)
            this.cache.delete(file.path);
            this.cache.set(file.path, existing);
            return existing;
        }

        // Create new cache entry
        const metadata = this.app.metadataCache.getFileCache(file);
        const entry: FileCacheEntry = {
            filePath: file.path,
            lastModified: file.stat.mtime,
            size: file.stat.size,
            metadata,
            accessed: now
        };

        this.setCacheEntry(file.path, entry);
        return entry;
    }

    /**
     * Cache file content along with metadata
     */
    cacheContent(file: TFile, content: string): void {
        const entry = this.getCacheEntry(file);
        if (entry) {
            entry.content = content;
            entry.accessed = Date.now();
        } else {
            // Create new entry with content
            const metadata = this.app.metadataCache.getFileCache(file);
            const newEntry: FileCacheEntry = {
                filePath: file.path,
                lastModified: file.stat.mtime,
                size: file.stat.size,
                metadata,
                content,
                accessed: Date.now()
            };
            this.setCacheEntry(file.path, newEntry);
        }
    }

    /**
     * Set cache entry and enforce LRU eviction
     */
    private setCacheEntry(filePath: string, entry: FileCacheEntry): void {
        // Remove existing entry if it exists
        this.cache.delete(filePath);
        
        // Add new entry
        this.cache.set(filePath, entry);
        
        // Enforce size limit using LRU eviction
        if (this.cache.size > this.maxSize) {
            // Remove least recently used entries
            const iterator = this.cache.keys();
            let entriesToRemove = this.cache.size - this.maxSize;
            
            while (entriesToRemove > 0) {
                const oldestKey = iterator.next().value;
                if (oldestKey) {
                    this.cache.delete(oldestKey);
                    entriesToRemove--;
                }
            }
        }
    }

    /**
     * Invalidate cache entry for a specific file
     */
    invalidate(filePath: string): void {
        this.cache.delete(filePath);
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
        hitRate?: number;
        memoryUsageEstimate: number;
    } {
        let memoryEstimate = 0;
        
        // Rough estimate of memory usage
        for (const [key, entry] of this.cache) {
            memoryEstimate += key.length * 2; // UTF-16 string
            memoryEstimate += entry.content ? entry.content.length * 2 : 0;
            memoryEstimate += 200; // Approximate overhead for metadata and entry structure
        }

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            memoryUsageEstimate: memoryEstimate
        };
    }

    /**
     * Setup event listeners for cache invalidation
     */
    private setupEventListeners(): void {
        // Listen for metadata cache changes
        this.metadataEventRef = this.app.metadataCache.on('resolved', () => {
            // For now, we'll do a full cache clear when metadata is resolved
            // This ensures consistency but could be optimized to only clear affected files
            this.clear();
        });
        
        if (this.metadataEventRef) {
            this.register(() => this.app.metadataCache.offref(this.metadataEventRef!));
        }

        // Listen for vault file events
        const vaultModifyRef = this.app.vault.on('modify', (file) => {
            if (file instanceof TFile) {
                this.invalidate(file.path);
            }
        });

        const vaultDeleteRef = this.app.vault.on('delete', (file) => {
            this.invalidate(file.path);
        });

        const vaultRenameRef = this.app.vault.on('rename', (file, oldPath) => {
            if (file instanceof TFile) {
                this.invalidate(oldPath);
                this.invalidate(file.path);
            }
        });

        this.vaultEventRefs = [vaultModifyRef, vaultDeleteRef, vaultRenameRef];
        
        // Register cleanup
        this.register(() => {
            this.vaultEventRefs.forEach(ref => {
                this.app.vault.offref(ref);
            });
            this.vaultEventRefs = [];
        });
    }

    /**
     * Get files in cache that match a path prefix (for folder operations)
     */
    getCachedFilesInFolder(folderPath: string): FileCacheEntry[] {
        const entries: FileCacheEntry[] = [];
        const normalizedPath = folderPath.endsWith('/') ? folderPath : folderPath + '/';
        
        for (const entry of this.cache.values()) {
            if (entry.filePath.startsWith(normalizedPath)) {
                entries.push(entry);
            }
        }
        
        return entries;
    }

    /**
     * Prefetch metadata for files in a folder
     */
    async prefetchFolder(folderPath: string): Promise<void> {
        const folder = this.app.vault.getAbstractFileByPath(folderPath);
        if (!folder || !(folder.children)) {
            return;
        }

        const filesToPrefetch = folder.children
            .filter(child => child instanceof TFile)
            .slice(0, 50); // Limit prefetch to avoid overwhelming the system

        for (const file of filesToPrefetch) {
            if (file instanceof TFile && !this.cache.has(file.path)) {
                // Get cache entry, which will populate it if not already cached
                this.getCacheEntry(file);
            }
        }
    }

    onunload(): void {
        this.clear();
        super.onunload();
    }
}

/**
 * Create a global file cache instance
 */
export function createFileCache(app: App, maxSize: number = 500): FileCache {
    return new FileCache(app, maxSize);
}
