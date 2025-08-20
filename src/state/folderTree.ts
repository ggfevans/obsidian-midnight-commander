import { TFolder, TAbstractFile } from 'obsidian';
import { PaneState } from '../types/interfaces';

/**
 * Folder Tree Data Structures and Interfaces
 *
 * Provides comprehensive data structures and interfaces to support the tree view
 * architecture for the Obsidian Midnight Commander plugin. This module defines
 * all foundational types and data models for tree components, state management,
 * and tree operations.
 *
 * Features:
 * - Hierarchical folder representation with efficient operations
 * - Tree node data structures with metadata
 * - Virtual scrolling support interfaces
 * - Search and filtering data structures
 * - Performance optimization types
 * - Tree operation result types
 * - Integration with existing PaneState interface
 *
 * Architecture:
 * - Compatible with Recoil state management
 * - Extends existing interfaces without breaking changes
 * - Supports dual-pane tree coordination
 * - Integrates with Obsidian's TFolder and TAbstractFile types
 * - Optimized for large folder structures (1000+ folders)
 */

// ============================================================================
// Core Tree Data Structures
// ============================================================================

/**
 * Enhanced tree-specific pane state interface
 * Extends the base PaneState to include tree-specific functionality
 */
export interface TreePaneState extends Omit<PaneState, 'files'> {
	/** Current view mode */
	viewMode: 'tree' | 'list';
	/** Set of expanded folder paths */
	expandedFolders: Set<string>;
	/** Currently focused folder for File Tree Alternative pattern */
	focusedFolder: TFolder | null;
	/** Root folder for this tree view */
	rootFolder: TFolder;
	/** Tree-specific file list (flattened for virtual scrolling) */
	treeItems: TreeNodeData[];
	/** Current sort method */
	sortBy: 'name' | 'modified' | 'size';
	/** Whether to show files in tree view */
	showFilesInTree: boolean;
	/** Search query for filtering */
	searchQuery: string;
	/** Maximum render depth for performance */
	maxRenderDepth: number;
	/** Folder file count cache */
	folderCounts: FolderFileCountMap;
	/** Virtual scrolling state */
	virtualScrollState: VirtualScrollState;
}

/**
 * Individual tree node data structure
 * Represents a single node in the tree hierarchy with metadata
 */
export interface TreeNodeData {
	/** The folder or file this node represents */
	item: TAbstractFile;
	/** Full path of the item */
	path: string;
	/** Nesting level in the tree (0 = root level) */
	level: number;
	/** Whether this node has child nodes */
	hasChildren: boolean;
	/** Whether this node is currently expanded */
	isExpanded: boolean;
	/** Whether this node is visible in current view */
	isVisible: boolean;
	/** Whether this node is currently selected */
	isSelected: boolean;
	/** Whether this node is currently focused */
	isFocused: boolean;
	/** Child nodes (empty array if not loaded or no children) */
	children: TreeNodeData[];
	/** Reference to parent node (null for root level) */
	parent: TreeNodeData | null;
	/** Node type for discrimination */
	type: 'folder' | 'file';
	/** File count for folders (cached for performance) */
	fileCount: number;
	/** Last modified timestamp */
	lastModified: number;
	/** File size (for files only) */
	size: number;
	/** Virtual scrolling index */
	virtualIndex: number;
	/** Whether this node matches current search */
	matchesSearch: boolean;
	/** Search relevance score (0-1) */
	searchScore: number;
}

/**
 * Folder file count mapping with metadata
 * Provides cached file counts for performance optimization
 */
export interface FolderFileCountMap {
	[folderPath: string]: {
		/** Number of files in this folder */
		fileCount: number;
		/** Number of subfolders in this folder */
		folderCount: number;
		/** Total items (files + folders) */
		totalItems: number;
		/** Recursive file count including subfolders */
		recursiveFileCount: number;
		/** Recursive folder count including subfolders */
		recursiveFolderCount: number;
		/** Last time this count was updated */
		lastUpdated: number;
		/** Whether this folder has been fully scanned */
		isComplete: boolean;
	};
}

/**
 * Virtual scrolling state management
 * Optimizes rendering performance for large trees
 */
export interface VirtualScrollState {
	/** Total number of visible items */
	totalItems: number;
	/** Height of the scroll container */
	containerHeight: number;
	/** Current scroll position */
	scrollTop: number;
	/** Index of first visible item */
	startIndex: number;
	/** Index of last visible item */
	endIndex: number;
	/** Height of each item (can be dynamic) */
	itemHeight: number | ((index: number) => number);
	/** Buffer size for smooth scrolling */
	overscan: number;
	/** Whether virtual scrolling is enabled */
	enabled: boolean;
	/** Estimated total content height */
	estimatedTotalHeight: number;
}

// ============================================================================
// Tree Operation Interfaces
// ============================================================================

/**
 * Tree operation result types
 * Standardizes return values from tree operations
 */
export interface TreeOperationResult<T = void> {
	/** Whether the operation was successful */
	success: boolean;
	/** Result data (if applicable) */
	data?: T;
	/** Error message (if operation failed) */
	error?: string;
	/** Number of items affected */
	affectedItems?: number;
	/** Performance metrics */
	metrics?: TreeOperationMetrics;
}

/**
 * Performance metrics for tree operations
 */
export interface TreeOperationMetrics {
	/** Operation execution time in milliseconds */
	executionTime: number;
	/** Number of nodes processed */
	nodesProcessed: number;
	/** Memory usage delta (if available) */
	memoryDelta?: number;
	/** Cache hit ratio */
	cacheHitRatio?: number;
}

/**
 * Tree expansion operation parameters
 */
export interface TreeExpansionOperation {
	/** Target folder to expand/collapse */
	targetFolder: TFolder;
	/** Whether to expand (true) or collapse (false) */
	expand: boolean;
	/** Whether to expand recursively */
	recursive?: boolean;
	/** Maximum depth for recursive operations */
	maxDepth?: number;
	/** Whether to animate the operation */
	animated?: boolean;
}

/**
 * Tree search operation parameters
 */
export interface TreeSearchOperation {
	/** Search query string */
	query: string;
	/** Search scope */
	scope: 'names' | 'paths' | 'content' | 'all';
	/** Whether to use case-sensitive search */
	caseSensitive: boolean;
	/** Whether to use regex matching */
	useRegex: boolean;
	/** Whether to search in file contents */
	searchContent: boolean;
	/** Maximum number of results */
	maxResults?: number;
	/** Search filters */
	filters?: TreeSearchFilters;
}

/**
 * Tree search filters
 */
export interface TreeSearchFilters {
	/** Include only specific file types */
	fileTypes?: string[];
	/** Exclude specific file types */
	excludeFileTypes?: string[];
	/** Include only folders */
	foldersOnly?: boolean;
	/** Include only files */
	filesOnly?: boolean;
	/** Date range filter */
	dateRange?: {
		start: Date;
		end: Date;
	};
	/** Size range filter (in bytes) */
	sizeRange?: {
		min: number;
		max: number;
	};
}

/**
 * Tree search result
 */
export interface TreeSearchResult {
	/** Matching tree node */
	node: TreeNodeData;
	/** Relevance score (0-1) */
	score: number;
	/** Matched text snippets */
	matches: TreeSearchMatch[];
	/** Path to the result from root */
	breadcrumb: string[];
}

/**
 * Tree search match details
 */
export interface TreeSearchMatch {
	/** Type of match */
	type: 'name' | 'path' | 'content';
	/** Matched text */
	text: string;
	/** Start position of match */
	start: number;
	/** End position of match */
	end: number;
	/** Context around the match */
	context?: string;
}

/**
 * Tree sort operation parameters
 */
export interface TreeSortOperation {
	/** Sort criteria */
	criteria: 'name' | 'modified' | 'size' | 'type' | 'custom';
	/** Sort direction */
	direction: 'asc' | 'desc';
	/** Whether to sort folders separately */
	foldersFirst: boolean;
	/** Custom sort function (for 'custom' criteria) */
	customSortFn?: (a: TreeNodeData, b: TreeNodeData) => number;
	/** Whether to sort recursively */
	recursive: boolean;
}

// ============================================================================
// Tree Navigation and Focus Interfaces
// ============================================================================

/**
 * Tree navigation operation
 */
export interface TreeNavigationOperation {
	/** Navigation direction */
	direction:
		| 'up'
		| 'down'
		| 'left'
		| 'right'
		| 'home'
		| 'end'
		| 'pageUp'
		| 'pageDown';
	/** Current focused node */
	currentNode: TreeNodeData | null;
	/** Target node (for direct navigation) */
	targetNode?: TreeNodeData;
	/** Whether to select the node after navigation */
	selectAfterNavigate: boolean;
	/** Whether to expand folders during navigation */
	autoExpand: boolean;
}

/**
 * Tree focus system state (File Tree Alternative pattern)
 */
export interface TreeFocusState {
	/** Currently focused folder (acts as tree root) */
	focusedFolder: TFolder | null;
	/** Path to focused folder */
	focusedPath: string | null;
	/** Breadcrumb trail to focused folder */
	breadcrumb: FocusBreadcrumb[];
	/** Whether focus mode is active */
	isFocusMode: boolean;
	/** Stack of previous focus states for navigation */
	focusHistory: TreeFocusHistoryItem[];
}

/**
 * Breadcrumb item for focus navigation
 */
export interface FocusBreadcrumb {
	/** Folder name */
	name: string;
	/** Full path */
	path: string;
	/** Folder reference */
	folder: TFolder;
	/** Whether this breadcrumb is clickable */
	isClickable: boolean;
}

/**
 * Focus history item for back/forward navigation
 */
export interface TreeFocusHistoryItem {
	/** Focused folder */
	folder: TFolder;
	/** Timestamp of focus */
	timestamp: number;
	/** Expanded folders at time of focus */
	expandedFolders: Set<string>;
	/** Selected node at time of focus */
	selectedNode: TreeNodeData | null;
}

// ============================================================================
// Tree State Persistence and Serialization
// ============================================================================

/**
 * Serializable tree state for persistence
 */
export interface SerializableTreeState {
	/** Pane ID */
	paneId: 'left' | 'right';
	/** View mode */
	viewMode: 'tree' | 'list';
	/** Expanded folder paths */
	expandedFolders: string[];
	/** Focused folder path */
	focusedFolderPath: string | null;
	/** Selected folder path */
	selectedFolderPath: string | null;
	/** Sort configuration */
	sortBy: 'name' | 'modified' | 'size';
	/** Whether to show files in tree */
	showFilesInTree: boolean;
	/** Maximum render depth */
	maxRenderDepth: number;
	/** Focus history */
	focusHistory: SerializableFocusHistoryItem[];
	/** Last update timestamp */
	lastUpdated: number;
	/** Schema version for migration */
	schemaVersion: number;
}

/**
 * Serializable focus history item
 */
export interface SerializableFocusHistoryItem {
	/** Folder path */
	folderPath: string;
	/** Timestamp */
	timestamp: number;
	/** Expanded folder paths */
	expandedFolders: string[];
	/** Selected node path */
	selectedNodePath: string | null;
}

/**
 * Tree state configuration
 */
export interface TreeStateConfig {
	/** Plugin ID for localStorage keys */
	pluginId: string;
	/** Whether to persist state */
	enablePersistence: boolean;
	/** Whether to persist search queries */
	persistSearchQueries: boolean;
	/** Whether to persist focus history */
	persistFocusHistory: boolean;
	/** Maximum focus history items */
	maxFocusHistoryItems: number;
	/** Cache expiry time in milliseconds */
	cacheExpiryTime: number;
	/** Default tree state values */
	defaults: Partial<TreePaneState>;
}

// ============================================================================
// Performance and Optimization Interfaces
// ============================================================================

/**
 * Tree performance monitoring
 */
export interface TreePerformanceMetrics {
	/** Render time for last update */
	lastRenderTime: number;
	/** Average render time over last 10 updates */
	averageRenderTime: number;
	/** Number of nodes currently rendered */
	renderedNodeCount: number;
	/** Number of nodes in virtual viewport */
	virtualNodeCount: number;
	/** Memory usage estimate */
	memoryUsage: number;
	/** Cache statistics */
	cacheStats: TreeCacheStats;
	/** Virtual scrolling performance */
	virtualScrollMetrics: VirtualScrollMetrics;
}

/**
 * Tree cache statistics
 */
export interface TreeCacheStats {
	/** Total cache entries */
	totalEntries: number;
	/** Cache hit count */
	hitCount: number;
	/** Cache miss count */
	missCount: number;
	/** Cache hit ratio */
	hitRatio: number;
	/** Memory used by cache */
	cacheMemory: number;
	/** Last cache cleanup timestamp */
	lastCleanup: number;
}

/**
 * Virtual scroll performance metrics
 */
export interface VirtualScrollMetrics {
	/** Scroll events per second */
	scrollEventsPerSecond: number;
	/** Render calls per second */
	renderCallsPerSecond: number;
	/** Average item render time */
	averageItemRenderTime: number;
	/** Frame drops in last second */
	frameDrops: number;
	/** Smooth scrolling enabled */
	smoothScrolling: boolean;
}

/**
 * Tree optimization hints
 */
export interface TreeOptimizationHints {
	/** Suggest enabling virtual scrolling */
	enableVirtualScrolling: boolean;
	/** Suggest reducing max render depth */
	reduceRenderDepth: boolean;
	/** Suggest lazy loading */
	enableLazyLoading: boolean;
	/** Suggest caching improvements */
	improveCaching: boolean;
	/** Performance warning level */
	warningLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
	/** Specific recommendations */
	recommendations: string[];
}

// ============================================================================
// Tree Event and Callback Interfaces
// ============================================================================

/**
 * Tree event types
 */
export type TreeEventType =
	| 'nodeExpand'
	| 'nodeCollapse'
	| 'nodeSelect'
	| 'nodeFocus'
	| 'nodeContextMenu'
	| 'searchStart'
	| 'searchComplete'
	| 'sortChange'
	| 'viewModeChange'
	| 'focusChange'
	| 'refresh'
	| 'error';

/**
 * Tree event data
 */
export interface TreeEventData {
	/** Event type */
	type: TreeEventType;
	/** Target node (if applicable) */
	node?: TreeNodeData;
	/** Additional event data */
	data?: any;
	/** Timestamp */
	timestamp: number;
	/** Pane ID */
	paneId: 'left' | 'right';
	/** Whether event was cancelled */
	cancelled: boolean;
}

/**
 * Tree event callback function
 */
export type TreeEventCallback = (event: TreeEventData) => void | boolean;

/**
 * Tree event handler registration
 */
export interface TreeEventHandler {
	/** Event type to listen for */
	eventType: TreeEventType | TreeEventType[];
	/** Callback function */
	callback: TreeEventCallback;
	/** Handler priority (higher = called first) */
	priority?: number;
	/** Whether to run only once */
	once?: boolean;
	/** Context for the handler */
	context?: any;
}

// ============================================================================
// Tree Component Integration Interfaces
// ============================================================================

/**
 * Tree component context
 * Provides tree-wide state and operations to child components
 */
export interface TreeComponentContext {
	/** Current tree state */
	treeState: TreePaneState;
	/** Tree operations */
	operations: TreeOperations;
	/** Event emitter */
	eventEmitter: TreeEventEmitter;
	/** Performance monitor */
	performanceMonitor: TreePerformanceMonitor;
	/** Configuration */
	config: TreeStateConfig;
}

/**
 * Tree operations interface
 * Provides standardized operations for tree manipulation
 */
export interface TreeOperations {
	/** Expand/collapse operations */
	expand: (
		folder: TFolder,
		recursive?: boolean
	) => Promise<TreeOperationResult>;
	collapse: (
		folder: TFolder,
		recursive?: boolean
	) => Promise<TreeOperationResult>;
	expandAll: () => Promise<TreeOperationResult>;
	collapseAll: () => Promise<TreeOperationResult>;

	/** Navigation operations */
	navigateTo: (node: TreeNodeData) => Promise<TreeOperationResult>;
	navigateUp: () => Promise<TreeOperationResult>;
	navigateDown: () => Promise<TreeOperationResult>;
	navigateToParent: () => Promise<TreeOperationResult>;

	/** Search operations */
	search: (
		params: TreeSearchOperation
	) => Promise<TreeOperationResult<TreeSearchResult[]>>;
	clearSearch: () => Promise<TreeOperationResult>;

	/** Sort operations */
	sort: (params: TreeSortOperation) => Promise<TreeOperationResult>;

	/** Focus operations */
	setFocus: (folder: TFolder) => Promise<TreeOperationResult>;
	clearFocus: () => Promise<TreeOperationResult>;
	goBack: () => Promise<TreeOperationResult>;
	goForward: () => Promise<TreeOperationResult>;

	/** Refresh operations */
	refresh: (force?: boolean) => Promise<TreeOperationResult>;
	refreshNode: (node: TreeNodeData) => Promise<TreeOperationResult>;

	/** Selection operations */
	select: (node: TreeNodeData, multi?: boolean) => Promise<TreeOperationResult>;
	selectAll: () => Promise<TreeOperationResult>;
	clearSelection: () => Promise<TreeOperationResult>;
}

/**
 * Tree event emitter interface
 */
export interface TreeEventEmitter {
	/** Emit an event */
	emit: (event: TreeEventData) => void;
	/** Register event handler */
	on: (handler: TreeEventHandler) => () => void;
	/** Remove event handler */
	off: (callback: TreeEventCallback) => void;
	/** Remove all handlers for event type */
	removeAllListeners: (eventType?: TreeEventType) => void;
}

/**
 * Tree performance monitor interface
 */
export interface TreePerformanceMonitor {
	/** Start performance measurement */
	startMeasurement: (operation: string) => string;
	/** End performance measurement */
	endMeasurement: (measurementId: string) => TreeOperationMetrics;
	/** Get current metrics */
	getMetrics: () => TreePerformanceMetrics;
	/** Get optimization hints */
	getOptimizationHints: () => TreeOptimizationHints;
	/** Reset metrics */
	reset: () => void;
}

// ============================================================================
// Tree Builder and Factory Interfaces
// ============================================================================

/**
 * Tree builder configuration
 */
export interface TreeBuilderConfig {
	/** Root folder to build from */
	rootFolder: TFolder;
	/** Maximum depth to traverse */
	maxDepth: number;
	/** Whether to include files in tree */
	includeFiles: boolean;
	/** File type filters */
	fileTypeFilters?: string[];
	/** Folder filters */
	folderFilters?: string[];
	/** Sort configuration */
	sortConfig?: TreeSortOperation;
	/** Whether to build asynchronously */
	async: boolean;
	/** Batch size for async building */
	batchSize?: number;
	/** Progress callback for async building */
	onProgress?: (progress: TreeBuildProgress) => void;
}

/**
 * Tree build progress
 */
export interface TreeBuildProgress {
	/** Current progress (0-1) */
	progress: number;
	/** Number of nodes processed */
	nodesProcessed: number;
	/** Total estimated nodes */
	totalNodes: number;
	/** Current folder being processed */
	currentFolder: TFolder;
	/** Build phase */
	phase: 'scanning' | 'building' | 'sorting' | 'indexing' | 'complete';
}

/**
 * Tree factory interface
 * Provides methods for creating different types of trees
 */
export interface TreeFactory {
	/** Create a standard folder tree */
	createFolderTree: (config: TreeBuilderConfig) => Promise<TreeNodeData>;
	/** Create a filtered tree */
	createFilteredTree: (
		config: TreeBuilderConfig,
		filters: TreeSearchFilters
	) => Promise<TreeNodeData>;
	/** Create a focused tree (File Tree Alternative pattern) */
	createFocusedTree: (
		focusFolder: TFolder,
		config: TreeBuilderConfig
	) => Promise<TreeNodeData>;
	/** Create a search result tree */
	createSearchTree: (
		searchResults: TreeSearchResult[],
		config: TreeBuilderConfig
	) => Promise<TreeNodeData>;
}

// ============================================================================
// Exports are handled in their respective sections above
// ============================================================================

// ============================================================================
// Utility Functions and Constants
// ============================================================================

/**
 * Default tree state configuration
 */
export const DEFAULT_TREE_CONFIG: TreeStateConfig = {
	pluginId: 'obsidian-midnight-commander',
	enablePersistence: true,
	persistSearchQueries: false,
	persistFocusHistory: true,
	maxFocusHistoryItems: 50,
	cacheExpiryTime: 300000, // 5 minutes
	defaults: {
		viewMode: 'tree',
		expandedFolders: new Set(),
		focusedFolder: null,
		sortBy: 'name',
		showFilesInTree: false,
		searchQuery: '',
		maxRenderDepth: 50,
		folderCounts: {},
		virtualScrollState: {
			totalItems: 0,
			containerHeight: 600,
			scrollTop: 0,
			startIndex: 0,
			endIndex: 0,
			itemHeight: 32,
			overscan: 5,
			enabled: true,
			estimatedTotalHeight: 0,
		},
	} as Partial<TreePaneState>,
};

/**
 * Tree operation performance thresholds
 */
export const TREE_PERFORMANCE_THRESHOLDS = {
	RENDER_TIME_WARNING: 16, // 60fps = 16ms per frame
	RENDER_TIME_CRITICAL: 33, // 30fps = 33ms per frame
	MEMORY_WARNING_MB: 50,
	MEMORY_CRITICAL_MB: 100,
	VIRTUAL_SCROLL_THRESHOLD: 100, // Enable virtual scroll above this many items
	LARGE_TREE_THRESHOLD: 1000, // Consider tree "large" above this many nodes
	CACHE_SIZE_WARNING: 1000,
	CACHE_SIZE_CRITICAL: 5000,
} as const;

/**
 * Tree state schema version for migrations
 */
export const TREE_STATE_SCHEMA_VERSION = 1;

/**
 * Default virtual scroll configuration
 */
export const DEFAULT_VIRTUAL_SCROLL_CONFIG = {
	itemHeight: 32,
	overscan: 5,
	enabled: true,
	threshold: TREE_PERFORMANCE_THRESHOLDS.VIRTUAL_SCROLL_THRESHOLD,
} as const;
