import { atom, atomFamily, selector, selectorFamily } from 'recoil';

/**
 * Recoil State Management for Tree View Components
 *
 * Provides centralized state coordination for the Obsidian Midnight Commander
 * plugin's tree view functionality with support for dual-pane independent states.
 *
 * Architecture:
 * - Per-pane state management using atomFamily for independent left/right panes
 * - Persistent state using localStorage integration
 * - Computed selectors for derived state and filtering
 * - Type-safe state management with full TypeScript support
 * - Integration with existing plugin settings and Obsidian API
 *
 * Features:
 * - Expanded folder tracking with persistence
 * - Folder focus system (File Tree Alternative pattern)
 * - View mode switching (tree/list)
 * - Tree display options and sorting
 * - Search and filtering state
 * - Dual-pane coordination
 */

// ============================================================================
// Core Types and Interfaces
// ============================================================================

export type PaneId = 'left' | 'right';
export type ViewMode = 'tree' | 'list';
export type SortBy = 'name' | 'modified' | 'size';

/**
 * Individual pane tree state structure
 */
export interface TreePaneState {
	/** Set of expanded folder paths */
	expandedFolders: Set<string>;
	/** Currently focused folder path (for File Tree Alternative pattern) */
	focusedFolder: string | null;
	/** Current view mode */
	viewMode: ViewMode;
	/** Current sorting method */
	sortBy: SortBy;
	/** Whether to show files in tree view */
	showFilesInTree: boolean;
	/** Current search/filter query */
	searchQuery: string;
	/** Selected folder path for navigation */
	selectedFolder: string | null;
	/** Maximum render depth for performance */
	maxRenderDepth: number;
}

/**
 * Global tree state coordination
 */
export interface TreeGlobalState {
	/** File count cache for folder badges */
	folderCounts: Record<string, number>;
	/** Last refresh timestamp */
	lastRefresh: number;
	/** Whether tree operations are in progress */
	operationsInProgress: boolean;
}

/**
 * Tree state persistence configuration
 */
export interface TreeStateConfig {
	/** Plugin ID for localStorage keys */
	pluginId: string;
	/** Whether to persist state */
	enablePersistence: boolean;
	/** Default state values */
	defaults: Partial<TreePaneState>;
}

// ============================================================================
// State Persistence Utilities
// ============================================================================

/**
 * Generate localStorage key for tree state
 */
const getStorageKey = (paneId: PaneId, key: string): string => {
	return `midnight-commander-tree-${paneId}-${key}`;
};

/**
 * Load persisted Set from localStorage
 */
const loadPersistedSet = (
	key: string,
	defaultValue: Set<string> = new Set()
): Set<string> => {
	try {
		const stored = localStorage.getItem(key);
		if (stored) {
			const array = JSON.parse(stored);
			return new Set(Array.isArray(array) ? array : []);
		}
	} catch (error) {
		console.warn(`Failed to load persisted set from ${key}:`, error);
	}
	return defaultValue;
};

/**
 * Save Set to localStorage
 */
const savePersistedSet = (key: string, value: Set<string>): void => {
	try {
		localStorage.setItem(key, JSON.stringify(Array.from(value)));
	} catch (error) {
		console.warn(`Failed to save set to ${key}:`, error);
	}
};

/**
 * Load persisted value from localStorage with type safety
 */
const loadPersistedValue = <T>(key: string, defaultValue: T): T => {
	try {
		const stored = localStorage.getItem(key);
		if (stored !== null) {
			return JSON.parse(stored);
		}
	} catch (error) {
		console.warn(`Failed to load persisted value from ${key}:`, error);
	}
	return defaultValue;
};

/**
 * Save value to localStorage
 */
const savePersistedValue = <T>(key: string, value: T): void => {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		console.warn(`Failed to save value to ${key}:`, error);
	}
};

// ============================================================================
// Default State Values
// ============================================================================

const DEFAULT_TREE_PANE_STATE: TreePaneState = {
	expandedFolders: new Set<string>(),
	focusedFolder: null,
	viewMode: 'list', // Default to Classic Dual-Pane mode as per UX audit
	sortBy: 'name',
	showFilesInTree: false,
	searchQuery: '',
	selectedFolder: null,
	maxRenderDepth: 50,
};

const DEFAULT_GLOBAL_STATE: TreeGlobalState = {
	folderCounts: {},
	lastRefresh: Date.now(),
	operationsInProgress: false,
};

// ============================================================================
// Per-Pane Tree State Atoms
// ============================================================================

/**
 * Expanded folders state for each pane
 * Tracks which folders are expanded in the tree view
 */
export const expandedFoldersState = atomFamily<Set<string>, PaneId>({
	key: 'tree-expandedFolders',
	default: paneId => {
		const key = getStorageKey(paneId, 'expandedFolders');
		return loadPersistedSet(key, new Set());
	},
	effects: paneId => [
		({ onSet }) => {
			onSet((newValue, _, isReset) => {
				if (!isReset) {
					const key = getStorageKey(paneId, 'expandedFolders');
					savePersistedSet(key, newValue);
				}
			});
		},
	],
});

/**
 * Focused folder state for each pane
 * Implements File Tree Alternative pattern - any folder can become tree root
 */
export const focusedFolderState = atomFamily<string | null, PaneId>({
	key: 'tree-focusedFolder',
	default: paneId => {
		const key = getStorageKey(paneId, 'focusedFolder');
		return loadPersistedValue(key, null);
	},
	effects: paneId => [
		({ onSet }) => {
			onSet((newValue, _, isReset) => {
				if (!isReset) {
					const key = getStorageKey(paneId, 'focusedFolder');
					savePersistedValue(key, newValue);
				}
			});
		},
	],
});

/**
 * View mode state for each pane
 * Controls whether pane shows tree or list view
 */
export const viewModeState = atomFamily<ViewMode, PaneId>({
	key: 'tree-viewMode',
	default: paneId => {
		const key = getStorageKey(paneId, 'viewMode');
		return loadPersistedValue(key, DEFAULT_TREE_PANE_STATE.viewMode);
	},
	effects: paneId => [
		({ onSet }) => {
			onSet((newValue, _, isReset) => {
				if (!isReset) {
					const key = getStorageKey(paneId, 'viewMode');
					savePersistedValue(key, newValue);
				}
			});
		},
	],
});

/**
 * Sort method state for each pane
 */
export const sortByState = atomFamily<SortBy, PaneId>({
	key: 'tree-sortBy',
	default: paneId => {
		const key = getStorageKey(paneId, 'sortBy');
		return loadPersistedValue(key, DEFAULT_TREE_PANE_STATE.sortBy);
	},
	effects: paneId => [
		({ onSet }) => {
			onSet((newValue, _, isReset) => {
				if (!isReset) {
					const key = getStorageKey(paneId, 'sortBy');
					savePersistedValue(key, newValue);
				}
			});
		},
	],
});

/**
 * Show files in tree toggle for each pane
 */
export const showFilesInTreeState = atomFamily<boolean, PaneId>({
	key: 'tree-showFilesInTree',
	default: paneId => {
		const key = getStorageKey(paneId, 'showFilesInTree');
		return loadPersistedValue(key, DEFAULT_TREE_PANE_STATE.showFilesInTree);
	},
	effects: paneId => [
		({ onSet }) => {
			onSet((newValue, _, isReset) => {
				if (!isReset) {
					const key = getStorageKey(paneId, 'showFilesInTree');
					savePersistedValue(key, newValue);
				}
			});
		},
	],
});

/**
 * Search query state for each pane
 */
export const searchQueryState = atomFamily<string, PaneId>({
	key: 'tree-searchQuery',
	default: DEFAULT_TREE_PANE_STATE.searchQuery,
	// Note: Search queries are intentionally not persisted
});

/**
 * Selected folder state for each pane
 */
export const selectedFolderState = atomFamily<string | null, PaneId>({
	key: 'tree-selectedFolder',
	default: DEFAULT_TREE_PANE_STATE.selectedFolder,
	// Note: Selected folder is intentionally not persisted
});

/**
 * Max render depth for each pane
 */
export const maxRenderDepthState = atomFamily<number, PaneId>({
	key: 'tree-maxRenderDepth',
	default: paneId => {
		const key = getStorageKey(paneId, 'maxRenderDepth');
		return loadPersistedValue(key, DEFAULT_TREE_PANE_STATE.maxRenderDepth);
	},
	effects: paneId => [
		({ onSet }) => {
			onSet((newValue, _, isReset) => {
				if (!isReset) {
					const key = getStorageKey(paneId, 'maxRenderDepth');
					savePersistedValue(key, newValue);
				}
			});
		},
	],
});

// ============================================================================
// Global Tree State Atoms
// ============================================================================

/**
 * Folder file counts for badge display
 * Shared across both panes for consistency
 */
export const folderCountsState = atom<Record<string, number>>({
	key: 'tree-folderCounts',
	default: DEFAULT_GLOBAL_STATE.folderCounts,
});

/**
 * Last refresh timestamp
 */
export const lastRefreshState = atom<number>({
	key: 'tree-lastRefresh',
	default: DEFAULT_GLOBAL_STATE.lastRefresh,
});

/**
 * Operations in progress state
 */
export const operationsInProgressState = atom<boolean>({
	key: 'tree-operationsInProgress',
	default: DEFAULT_GLOBAL_STATE.operationsInProgress,
});

// ============================================================================
// Computed Selectors
// ============================================================================

/**
 * Complete pane state selector
 * Combines all pane-specific atoms into a single state object
 */
export const treePaneStateSelector = selectorFamily<TreePaneState, PaneId>({
	key: 'tree-paneState',
	get:
		paneId =>
		({ get }) => ({
			expandedFolders: get(expandedFoldersState(paneId)),
			focusedFolder: get(focusedFolderState(paneId)),
			viewMode: get(viewModeState(paneId)),
			sortBy: get(sortByState(paneId)),
			showFilesInTree: get(showFilesInTreeState(paneId)),
			searchQuery: get(searchQueryState(paneId)),
			selectedFolder: get(selectedFolderState(paneId)),
			maxRenderDepth: get(maxRenderDepthState(paneId)),
		}),
	set:
		paneId =>
		({ set }, newValue) => {
			if (typeof newValue === 'object' && newValue !== null) {
				const state = newValue as TreePaneState;
				set(expandedFoldersState(paneId), state.expandedFolders);
				set(focusedFolderState(paneId), state.focusedFolder);
				set(viewModeState(paneId), state.viewMode);
				set(sortByState(paneId), state.sortBy);
				set(showFilesInTreeState(paneId), state.showFilesInTree);
				set(searchQueryState(paneId), state.searchQuery);
				set(selectedFolderState(paneId), state.selectedFolder);
				set(maxRenderDepthState(paneId), state.maxRenderDepth);
			}
		},
});

/**
 * Global tree state selector
 */
export const treeGlobalStateSelector = selector<TreeGlobalState>({
	key: 'tree-globalState',
	get: ({ get }) => ({
		folderCounts: get(folderCountsState),
		lastRefresh: get(lastRefreshState),
		operationsInProgress: get(operationsInProgressState),
	}),
	set: ({ set }, newValue) => {
		if (typeof newValue === 'object' && newValue !== null) {
			const state = newValue as TreeGlobalState;
			set(folderCountsState, state.folderCounts);
			set(lastRefreshState, state.lastRefresh);
			set(operationsInProgressState, state.operationsInProgress);
		}
	},
});

/**
 * Active pane selector based on view mode
 * Determines which pane is currently showing tree view
 */
export const activeTreePaneSelector = selector<PaneId | null>({
	key: 'tree-activePane',
	get: ({ get }) => {
		const leftViewMode = get(viewModeState('left'));
		const rightViewMode = get(viewModeState('right'));

		// Return the first pane in tree mode, or null if both are in list mode
		if (leftViewMode === 'tree') return 'left';
		if (rightViewMode === 'tree') return 'right';
		return null;
	},
});

/**
 * Tree view count selector
 * Returns how many panes are currently in tree view
 */
export const treeViewCountSelector = selector<number>({
	key: 'tree-viewCount',
	get: ({ get }) => {
		const leftViewMode = get(viewModeState('left'));
		const rightViewMode = get(viewModeState('right'));

		let count = 0;
		if (leftViewMode === 'tree') count++;
		if (rightViewMode === 'tree') count++;
		return count;
	},
});

/**
 * Search active selector for each pane
 * Determines if search is currently active
 */
export const searchActiveSelector = selectorFamily<boolean, PaneId>({
	key: 'tree-searchActive',
	get:
		paneId =>
		({ get }) => {
			const query = get(searchQueryState(paneId));
			return query.trim().length > 0;
		},
});

/**
 * Folder count selector for specific folder
 */
export const folderCountSelector = selectorFamily<number, string>({
	key: 'tree-folderCount',
	get:
		folderPath =>
		({ get }) => {
			const counts = get(folderCountsState);
			return counts[folderPath] || 0;
		},
});

// ============================================================================
// Tree Operation Selectors
// ============================================================================

/**
 * Expanded folders list selector for serialization
 */
export const expandedFoldersListSelector = selectorFamily<string[], PaneId>({
	key: 'tree-expandedFoldersList',
	get:
		paneId =>
		({ get }) => {
			const expandedSet = get(expandedFoldersState(paneId));
			return Array.from(expandedSet).sort();
		},
});

/**
 * Tree state summary selector for debugging
 */
export const treeStateSummarySelector = selectorFamily<
	{
		expandedCount: number;
		hasSearch: boolean;
		hasFocus: boolean;
		viewMode: ViewMode;
		sortBy: SortBy;
	},
	PaneId
>({
	key: 'tree-stateSummary',
	get:
		paneId =>
		({ get }) => {
			const expandedFolders = get(expandedFoldersState(paneId));
			const searchQuery = get(searchQueryState(paneId));
			const focusedFolder = get(focusedFolderState(paneId));
			const viewMode = get(viewModeState(paneId));
			const sortBy = get(sortByState(paneId));

			return {
				expandedCount: expandedFolders.size,
				hasSearch: searchQuery.trim().length > 0,
				hasFocus: focusedFolder !== null,
				viewMode,
				sortBy,
			};
		},
});

// ============================================================================
// Utility Functions and Hooks
// ============================================================================

/**
 * Tree state utilities for common operations
 */
export const TreeStateUtils = {
	/**
	 * Clear all expanded folders for a pane
	 */
	clearExpandedFolders: (paneId: PaneId) => ({
		set: ({ set }: any) => {
			set(expandedFoldersState(paneId), new Set<string>());
		},
	}),

	/**
	 * Toggle folder expansion
	 */
	toggleFolderExpansion: (paneId: PaneId, folderPath: string) => ({
		set: ({ set, get }: any) => {
			const current = get(expandedFoldersState(paneId));
			const newSet = new Set(current);
			if (newSet.has(folderPath)) {
				newSet.delete(folderPath);
			} else {
				newSet.add(folderPath);
			}
			set(expandedFoldersState(paneId), newSet);
		},
	}),

	/**
	 * Expand path to folder (expand all parent folders)
	 */
	expandPathToFolder: (paneId: PaneId, folderPath: string) => ({
		set: ({ set, get }: any) => {
			const current = get(expandedFoldersState(paneId));
			const newSet = new Set(current);

			// Add all parent paths
			const pathParts = folderPath.split('/');
			let currentPath = '';
			for (let i = 0; i < pathParts.length; i++) {
				if (i === 0) {
					currentPath = pathParts[i];
				} else {
					currentPath += '/' + pathParts[i];
				}
				if (currentPath) {
					newSet.add(currentPath);
				}
			}

			set(expandedFoldersState(paneId), newSet);
		},
	}),

	/**
	 * Reset pane to default state
	 */
	resetPaneState: (paneId: PaneId) => ({
		set: ({ set }: any) => {
			set(expandedFoldersState(paneId), new Set<string>());
			set(focusedFolderState(paneId), null);
			set(viewModeState(paneId), DEFAULT_TREE_PANE_STATE.viewMode);
			set(sortByState(paneId), DEFAULT_TREE_PANE_STATE.sortBy);
			set(
				showFilesInTreeState(paneId),
				DEFAULT_TREE_PANE_STATE.showFilesInTree
			);
			set(searchQueryState(paneId), '');
			set(selectedFolderState(paneId), null);
		},
	}),

	/**
	 * Update folder counts
	 */
	updateFolderCounts: (counts: Record<string, number>) => ({
		set: ({ set }: any) => {
			set(folderCountsState, counts);
			set(lastRefreshState, Date.now());
		},
	}),
};

// ============================================================================
// Types are exported above in their respective sections
// ============================================================================

/**
 * Tree state atom references for external use
 */
export const TreeStateAtoms = {
	expandedFolders: expandedFoldersState,
	focusedFolder: focusedFolderState,
	viewMode: viewModeState,
	sortBy: sortByState,
	showFilesInTree: showFilesInTreeState,
	searchQuery: searchQueryState,
	selectedFolder: selectedFolderState,
	maxRenderDepth: maxRenderDepthState,
	folderCounts: folderCountsState,
	lastRefresh: lastRefreshState,
	operationsInProgress: operationsInProgressState,
};

/**
 * Tree state selector references for external use
 */
export const TreeStateSelectors = {
	paneState: treePaneStateSelector,
	globalState: treeGlobalStateSelector,
	activeTreePane: activeTreePaneSelector,
	treeViewCount: treeViewCountSelector,
	searchActive: searchActiveSelector,
	folderCount: folderCountSelector,
	expandedFoldersList: expandedFoldersListSelector,
	stateSummary: treeStateSummarySelector,
};
