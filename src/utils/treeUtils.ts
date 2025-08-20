import { App, TFolder, TAbstractFile, TFile } from 'obsidian';
import React from 'react';
import {
	TreeNodeData,
	FolderFileCountMap,
	TreeSearchResult,
	TreeSearchMatch,
	DEFAULT_TREE_CONFIG,
	TREE_PERFORMANCE_THRESHOLDS,
} from '../state/folderTree';
import { SortBy } from '../state/treeState';

/**
 * Comprehensive Tree Utility Functions
 *
 * Provides a complete set of utility functions for tree operations and management
 * in the Obsidian Midnight Commander plugin. This module implements efficient
 * algorithms for tree building, manipulation, search, navigation, and focus management.
 *
 * Features:
 * - Tree building and structure creation
 * - Efficient tree manipulation operations
 * - Advanced search and filtering capabilities
 * - Smart sorting with multiple criteria
 * - Navigation and keyboard support
 * - File Tree Alternative focus system
 * - Virtual scrolling optimization
 * - Performance monitoring and optimization
 * - Memory-efficient implementations
 *
 * Architecture:
 * - Integrates with Recoil state management
 * - Compatible with existing tree components
 * - Supports dual-pane operations
 * - Optimized for large folder structures (1000+ folders)
 * - Lazy evaluation and memoization
 * - Error handling and edge cases
 */

// ============================================================================
// Core Tree Building Functions
// ============================================================================

/**
 * Build a complete folder tree structure from a root folder
 * Creates a hierarchical tree with metadata for efficient rendering
 */
export function createFolderTree(
	app: App,
	rootFolder: TFolder,
	options: {
		includeFiles?: boolean;
		maxDepth?: number;
		sortBy?: SortBy;
		expandedFolders?: Set<string>;
		searchQuery?: string;
	} = {}
): TreeNodeData {
	const {
		includeFiles = false,
		maxDepth = DEFAULT_TREE_CONFIG.defaults.maxRenderDepth || 50,
		sortBy = 'name',
		expandedFolders = new Set(),
		searchQuery = '',
	} = options;

	const buildNode = (
		item: TAbstractFile,
		level: number,
		parent: TreeNodeData | null,
		virtualIndex: number
	): { node: TreeNodeData; nextIndex: number } => {
		const isFolder = item instanceof TFolder;
		const path = item.path;
		const isExpanded = expandedFolders.has(path);
		const matchesSearch = searchQuery
			? item.name.toLowerCase().includes(searchQuery.toLowerCase())
			: true;

		const node: TreeNodeData = {
			item,
			path,
			level,
			hasChildren: isFolder && (item as TFolder).children.length > 0,
			isExpanded,
			isVisible: true,
			isSelected: false,
			isFocused: false,
			children: [],
			parent,
			type: isFolder ? 'folder' : 'file',
			fileCount: 0,
			lastModified: item instanceof TFile ? item.stat?.mtime || 0 : 0,
			size: item instanceof TFile ? item.stat?.size || 0 : 0,
			virtualIndex,
			matchesSearch,
			searchScore: matchesSearch
				? calculateSearchScore(item.name, searchQuery)
				: 0,
		};

		let currentIndex = virtualIndex + 1;

		// Build children if this is a folder and we haven't exceeded max depth
		if (isFolder && level < maxDepth) {
			const folder = item as TFolder;
			let children = [...folder.children];

			// Filter children based on options
			if (!includeFiles) {
				children = children.filter(child => child instanceof TFolder);
			}

			// Sort children
			children = sortItems(children, sortBy);

			// Calculate file count for this folder
			node.fileCount = countFilesInFolder(folder, includeFiles);

			// Build child nodes if expanded or if search is active
			if (isExpanded || searchQuery) {
				for (const child of children) {
					const { node: childNode, nextIndex } = buildNode(
						child,
						level + 1,
						node,
						currentIndex
					);
					node.children.push(childNode);
					currentIndex = nextIndex;
				}
			}
		}

		return { node, nextIndex: currentIndex };
	};

	const { node } = buildNode(rootFolder, 0, null, 0);
	return node;
}

/**
 * Calculate folder file count mapping for performance optimization
 * Creates a cached mapping of folder paths to file counts
 */
export function getFolderNoteCountMap(
	app: App,
	rootFolder?: TFolder
): FolderFileCountMap {
	const countMap: FolderFileCountMap = {};

	const processFolder = (folder: TFolder): void => {
		const folderPath = folder.path;
		let fileCount = 0;
		let folderCount = 0;
		let recursiveFileCount = 0;
		let recursiveFolderCount = 0;

		for (const child of folder.children) {
			if (child instanceof TFile) {
				fileCount++;
				recursiveFileCount++;
			} else if (child instanceof TFolder) {
				folderCount++;
				recursiveFolderCount++;

				// Process subfolder recursively
				processFolder(child);

				// Add recursive counts from subfolder
				const childCounts = countMap[child.path];
				if (childCounts) {
					recursiveFileCount += childCounts.recursiveFileCount;
					recursiveFolderCount += childCounts.recursiveFolderCount;
				}
			}
		}

		countMap[folderPath] = {
			fileCount,
			folderCount,
			totalItems: fileCount + folderCount,
			recursiveFileCount,
			recursiveFolderCount,
			lastUpdated: Date.now(),
			isComplete: true,
		};
	};

	// Start processing from root folder or vault root
	const startFolder = rootFolder || app.vault.getRoot();
	processFolder(startFolder);

	return countMap;
}

/**
 * Build virtual scroll items from tree structure
 * Creates a flattened list optimized for virtual scrolling
 */
export function buildVirtualScrollItems(
	tree: TreeNodeData,
	expandedFolders: Set<string>
): TreeNodeData[] {
	const items: TreeNodeData[] = [];

	const traverse = (node: TreeNodeData): void => {
		// Add current node to virtual list
		items.push(node);

		// Add children if expanded
		if (node.isExpanded && expandedFolders.has(node.path)) {
			for (const child of node.children) {
				traverse(child);
			}
		}
	};

	traverse(tree);

	// Update virtual indices
	items.forEach((item, index) => {
		item.virtualIndex = index;
	});

	return items;
}

// ============================================================================
// Tree Manipulation Functions
// ============================================================================

/**
 * Expand path to folder by expanding all parent folders
 * Returns array of folder paths that were expanded
 */
export function expandToFolder(
	folderPath: string,
	tree: TreeNodeData
): string[] {
	const expandedPaths: string[] = [];
	const pathParts = folderPath.split('/').filter(Boolean);

	let currentPath = '';
	for (let i = 0; i < pathParts.length; i++) {
		if (i === 0) {
			currentPath = pathParts[i];
		} else {
			currentPath += '/' + pathParts[i];
		}

		if (currentPath && currentPath !== folderPath) {
			expandedPaths.push(currentPath);
		}
	}

	return expandedPaths;
}

/**
 * Collapse all folders in tree recursively
 */
export function collapseAllFolders(tree: TreeNodeData): void {
	const traverse = (node: TreeNodeData): void => {
		node.isExpanded = false;
		for (const child of node.children) {
			traverse(child);
		}
	};

	traverse(tree);
}

/**
 * Expand all folders in tree up to maximum depth
 */
export function expandAllFolders(tree: TreeNodeData, maxDepth?: number): void {
	const maxLevel = maxDepth || TREE_PERFORMANCE_THRESHOLDS.LARGE_TREE_THRESHOLD;

	const traverse = (node: TreeNodeData): void => {
		if (node.level < maxLevel && node.type === 'folder') {
			node.isExpanded = true;
		}
		for (const child of node.children) {
			traverse(child);
		}
	};

	traverse(tree);
}

/**
 * Find tree node by path
 */
export function findNodeByPath(
	tree: TreeNodeData,
	path: string
): TreeNodeData | null {
	if (tree.path === path) {
		return tree;
	}

	for (const child of tree.children) {
		const result = findNodeByPath(child, path);
		if (result) {
			return result;
		}
	}

	return null;
}

/**
 * Update tree node expanded state and propagate changes
 */
export function updateNodeExpansion(
	tree: TreeNodeData,
	nodePath: string,
	isExpanded: boolean
): boolean {
	const node = findNodeByPath(tree, nodePath);
	if (node) {
		node.isExpanded = isExpanded;
		return true;
	}
	return false;
}

/**
 * Clone tree structure for immutable updates
 */
export function cloneTreeNode(node: TreeNodeData): TreeNodeData {
	return {
		...node,
		children: node.children.map(child => cloneTreeNode(child)),
	};
}

// ============================================================================
// Search and Filtering Functions
// ============================================================================

/**
 * Filter tree by search query with advanced options
 */
export function filterTreeByQuery(
	tree: TreeNodeData,
	query: string,
	options: {
		caseSensitive?: boolean;
		useRegex?: boolean;
		searchContent?: boolean;
		scope?: 'names' | 'paths' | 'all';
	} = {}
): TreeNodeData {
	const {
		caseSensitive = false,
		useRegex = false,
		searchContent = false,
		scope = 'names',
	} = options;

	if (!query.trim()) {
		return tree;
	}

	const searchPattern = useRegex
		? new RegExp(query, caseSensitive ? 'g' : 'gi')
		: null;

	const matches = (text: string): boolean => {
		if (useRegex && searchPattern) {
			return searchPattern.test(text);
		}

		const searchText = caseSensitive ? text : text.toLowerCase();
		const searchQuery = caseSensitive ? query : query.toLowerCase();
		return searchText.includes(searchQuery);
	};

	const filterNode = (node: TreeNodeData): TreeNodeData | null => {
		const item = node.item;
		let nodeMatches = false;

		// Check if node matches search criteria
		switch (scope) {
			case 'names':
				nodeMatches = matches(item.name);
				break;
			case 'paths':
				nodeMatches = matches(item.path);
				break;
			case 'all':
				nodeMatches = matches(item.name) || matches(item.path);
				break;
		}

		// Search in file content if enabled (for files only)
		if (searchContent && item instanceof TFile && !nodeMatches) {
			// Note: Content search would require reading file content
			// This is a placeholder for content search implementation
			nodeMatches = false;
		}

		// Filter children recursively
		const filteredChildren: TreeNodeData[] = [];
		for (const child of node.children) {
			const filteredChild = filterNode(child);
			if (filteredChild) {
				filteredChildren.push(filteredChild);
			}
		}

		// Include node if it matches or has matching children
		if (nodeMatches || filteredChildren.length > 0) {
			const filteredNode: TreeNodeData = {
				...node,
				children: filteredChildren,
				matchesSearch: nodeMatches,
				searchScore: nodeMatches ? calculateSearchScore(item.name, query) : 0,
				isExpanded: filteredChildren.length > 0 ? true : node.isExpanded,
			};
			return filteredNode;
		}

		return null;
	};

	const filtered = filterNode(tree);
	return filtered || tree;
}

/**
 * Search tree nodes and return ranked results
 */
export function searchTreeNodes(
	tree: TreeNodeData,
	query: string,
	options: {
		maxResults?: number;
		caseSensitive?: boolean;
		useRegex?: boolean;
	} = {}
): TreeSearchResult[] {
	const { maxResults = 100, caseSensitive = false, useRegex = false } = options;

	if (!query.trim()) {
		return [];
	}

	const results: TreeSearchResult[] = [];
	const searchPattern = useRegex
		? new RegExp(query, caseSensitive ? 'g' : 'gi')
		: null;

	const searchInNode = (
		node: TreeNodeData,
		breadcrumb: string[] = []
	): void => {
		if (results.length >= maxResults) {
			return;
		}

		const item = node.item;
		const currentBreadcrumb = [...breadcrumb, item.name];

		// Check for matches
		const nameMatches = findMatches(
			item.name,
			query,
			searchPattern,
			caseSensitive
		);
		const pathMatches = findMatches(
			item.path,
			query,
			searchPattern,
			caseSensitive
		);

		if (nameMatches.length > 0 || pathMatches.length > 0) {
			const score = calculateSearchScore(item.name, query);
			results.push({
				node,
				score,
				matches: [
					...nameMatches.map(match => ({ ...match, type: 'name' as const })),
					...pathMatches.map(match => ({ ...match, type: 'path' as const })),
				],
				breadcrumb: currentBreadcrumb,
			});
		}

		// Search children
		for (const child of node.children) {
			searchInNode(child, currentBreadcrumb);
		}
	};

	searchInNode(tree);

	// Sort results by score (descending)
	results.sort((a, b) => b.score - a.score);

	return results.slice(0, maxResults);
}

/**
 * Highlight search matches in text for React rendering
 */
export function highlightSearchMatches(
	text: string,
	query: string
): React.ReactNode {
	if (!query.trim()) {
		return text;
	}

	const queryLower = query.toLowerCase();
	const textLower = text.toLowerCase();
	const parts: React.ReactNode[] = [];
	let lastIndex = 0;
	let matchIndex = textLower.indexOf(queryLower);

	while (matchIndex !== -1) {
		// Add text before match
		if (matchIndex > lastIndex) {
			parts.push(text.slice(lastIndex, matchIndex));
		}

		// Add highlighted match
		const matchText = text.slice(matchIndex, matchIndex + query.length);
		parts.push(
			React.createElement(
				'mark',
				{ key: `match-${matchIndex}`, className: 'tree-search-highlight' },
				matchText
			)
		);

		lastIndex = matchIndex + query.length;
		matchIndex = textLower.indexOf(queryLower, lastIndex);
	}

	// Add remaining text
	if (lastIndex < text.length) {
		parts.push(text.slice(lastIndex));
	}

	return parts.length > 1 ? React.createElement('span', null, ...parts) : text;
}

// ============================================================================
// Sorting Functions
// ============================================================================

/**
 * Sort tree nodes by specified criteria
 */
export function sortTreeNodes(
	nodes: TreeNodeData[],
	sortBy: SortBy
): TreeNodeData[] {
	return [...nodes].sort((a, b) => compareFolders(a.item, b.item, sortBy));
}

/**
 * Compare two folders/files for sorting
 */
export function compareFolders(
	a: TAbstractFile,
	b: TAbstractFile,
	sortBy: SortBy
): number {
	// Always sort folders before files
	const aIsFolder = a instanceof TFolder;
	const bIsFolder = b instanceof TFolder;

	if (aIsFolder && !bIsFolder) return -1;
	if (!aIsFolder && bIsFolder) return 1;

	// Both are same type, sort by criteria
	switch (sortBy) {
		case 'name':
			return a.name.localeCompare(b.name, undefined, { numeric: true });

		case 'modified': {
			const aTime = a instanceof TFile ? a.stat?.mtime || 0 : 0;
			const bTime = b instanceof TFile ? b.stat?.mtime || 0 : 0;
			return bTime - aTime; // Most recent first
		}

		case 'size':
			if (a instanceof TFile && b instanceof TFile) {
				const aSize = a.stat?.size || 0;
				const bSize = b.stat?.size || 0;
				return bSize - aSize; // Largest first
			}
			return a.name.localeCompare(b.name);

		default:
			return 0;
	}
}

/**
 * Apply sorting to entire tree recursively
 */
export function applySortToTree(
	tree: TreeNodeData,
	sortBy: SortBy
): TreeNodeData {
	const sortedNode: TreeNodeData = {
		...tree,
		children: sortTreeNodes(tree.children, sortBy).map(child =>
			applySortToTree(child, sortBy)
		),
	};

	return sortedNode;
}

// ============================================================================
// Navigation Utilities
// ============================================================================

/**
 * Get next visible node in tree for keyboard navigation
 */
export function getNextVisibleNode(
	tree: TreeNodeData,
	currentPath: string,
	virtualItems: TreeNodeData[]
): TreeNodeData | null {
	const currentIndex = virtualItems.findIndex(
		item => item.path === currentPath
	);
	if (currentIndex === -1 || currentIndex >= virtualItems.length - 1) {
		return null;
	}

	return virtualItems[currentIndex + 1];
}

/**
 * Get previous visible node in tree for keyboard navigation
 */
export function getPreviousVisibleNode(
	tree: TreeNodeData,
	currentPath: string,
	virtualItems: TreeNodeData[]
): TreeNodeData | null {
	const currentIndex = virtualItems.findIndex(
		item => item.path === currentPath
	);
	if (currentIndex <= 0) {
		return null;
	}

	return virtualItems[currentIndex - 1];
}

/**
 * Get first visible node in tree
 */
export function getFirstVisibleNode(
	virtualItems: TreeNodeData[]
): TreeNodeData | null {
	return virtualItems.length > 0 ? virtualItems[0] : null;
}

/**
 * Get last visible node in tree
 */
export function getLastVisibleNode(
	virtualItems: TreeNodeData[]
): TreeNodeData | null {
	return virtualItems.length > 0 ? virtualItems[virtualItems.length - 1] : null;
}

/**
 * Get parent folder of current node
 */
export function getParentNode(
	tree: TreeNodeData,
	currentPath: string
): TreeNodeData | null {
	const node = findNodeByPath(tree, currentPath);
	return node?.parent || null;
}

/**
 * Get children of current node (if expanded)
 */
export function getChildNodes(
	tree: TreeNodeData,
	currentPath: string
): TreeNodeData[] {
	const node = findNodeByPath(tree, currentPath);
	if (!node || !node.isExpanded) {
		return [];
	}

	return node.children;
}

// ============================================================================
// Focus System (File Tree Alternative Pattern)
// ============================================================================

/**
 * Focus on folder by making it the effective tree root
 */
export function focusOnFolder(
	folderPath: string,
	tree: TreeNodeData,
	app: App
): { success: boolean; focusedTree?: TreeNodeData; error?: string } {
	const targetFolder = app.vault.getAbstractFileByPath(folderPath);

	if (!(targetFolder instanceof TFolder)) {
		return { success: false, error: 'Target is not a folder' };
	}

	try {
		const focusedTree = createFolderTree(app, targetFolder, {
			includeFiles: false,
			maxDepth: 20,
		});

		return { success: true, focusedTree };
	} catch (error) {
		return {
			success: false,
			error: `Failed to focus on folder: ${error.message}`,
		};
	}
}

/**
 * Remove focus and return to full tree view
 */
export function unfocusFolder(app: App, rootFolder: TFolder): TreeNodeData {
	return createFolderTree(app, rootFolder, {
		includeFiles: false,
		maxDepth: 50,
	});
}

/**
 * Get focused subtree for rendering
 */
export function getFocusedSubtree(
	tree: TreeNodeData,
	focusPath: string
): TreeNodeData | null {
	return findNodeByPath(tree, focusPath);
}

/**
 * Build breadcrumb trail for focused folder
 */
export function buildFocusBreadcrumb(
	folderPath: string,
	app: App
): Array<{ name: string; path: string; folder: TFolder }> {
	const breadcrumb: Array<{ name: string; path: string; folder: TFolder }> = [];

	if (!folderPath) {
		return breadcrumb;
	}

	const pathParts = folderPath.split('/').filter(Boolean);
	let currentPath = '';

	for (const part of pathParts) {
		if (currentPath) {
			currentPath += '/' + part;
		} else {
			currentPath = part;
		}

		const folder = app.vault.getAbstractFileByPath(currentPath);
		if (folder instanceof TFolder) {
			breadcrumb.push({
				name: folder.name,
				path: currentPath,
				folder,
			});
		}
	}

	return breadcrumb;
}

// ============================================================================
// Performance and Optimization Utilities
// ============================================================================

/**
 * Calculate performance metrics for tree operations
 */
export function measureTreeOperation<T>(
	operation: () => T,
	operationName: string
): { result: T; metrics: { executionTime: number; operationName: string } } {
	const startTime = performance.now();
	const result = operation();
	const endTime = performance.now();

	return {
		result,
		metrics: {
			executionTime: endTime - startTime,
			operationName,
		},
	};
}

/**
 * Check if virtual scrolling should be enabled based on tree size
 */
export function shouldEnableVirtualScrolling(
	itemCount: number,
	threshold: number = TREE_PERFORMANCE_THRESHOLDS.VIRTUAL_SCROLL_THRESHOLD
): boolean {
	return itemCount > threshold;
}

/**
 * Estimate tree complexity for performance optimization
 */
export function estimateTreeComplexity(tree: TreeNodeData): {
	totalNodes: number;
	maxDepth: number;
	avgBranchingFactor: number;
} {
	let totalNodes = 0;
	let maxDepth = 0;
	let totalBranching = 0;
	let folderCount = 0;

	const traverse = (node: TreeNodeData, depth: number): void => {
		totalNodes++;
		maxDepth = Math.max(maxDepth, depth);

		if (node.type === 'folder' && node.children.length > 0) {
			folderCount++;
			totalBranching += node.children.length;
		}

		for (const child of node.children) {
			traverse(child, depth + 1);
		}
	};

	traverse(tree, 0);

	return {
		totalNodes,
		maxDepth,
		avgBranchingFactor: folderCount > 0 ? totalBranching / folderCount : 0,
	};
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate search relevance score for ranking
 */
function calculateSearchScore(text: string, query: string): number {
	if (!query) return 0;

	const textLower = text.toLowerCase();
	const queryLower = query.toLowerCase();

	// Exact match gets highest score
	if (textLower === queryLower) return 1.0;

	// Starts with query gets high score
	if (textLower.startsWith(queryLower)) return 0.8;

	// Contains query gets medium score
	if (textLower.includes(queryLower)) return 0.5;

	// Calculate fuzzy match score
	let score = 0;
	let queryIndex = 0;

	for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
		if (textLower[i] === queryLower[queryIndex]) {
			score += 1;
			queryIndex++;
		}
	}

	return (score / queryLower.length) * 0.3;
}

/**
 * Find text matches for search highlighting
 */
function findMatches(
	text: string,
	query: string,
	searchPattern: RegExp | null,
	caseSensitive: boolean
): TreeSearchMatch[] {
	const matches: TreeSearchMatch[] = [];

	if (searchPattern) {
		let match;
		while ((match = searchPattern.exec(text)) !== null) {
			matches.push({
				type: 'name', // Will be overridden by caller
				text: match[0],
				start: match.index,
				end: match.index + match[0].length,
				context: getMatchContext(text, match.index, match[0].length),
			});
		}
	} else {
		const searchText = caseSensitive ? text : text.toLowerCase();
		const searchQuery = caseSensitive ? query : query.toLowerCase();
		let index = searchText.indexOf(searchQuery);

		while (index !== -1) {
			matches.push({
				type: 'name', // Will be overridden by caller
				text: text.slice(index, index + query.length),
				start: index,
				end: index + query.length,
				context: getMatchContext(text, index, query.length),
			});
			index = searchText.indexOf(searchQuery, index + 1);
		}
	}

	return matches;
}

/**
 * Get context around search match for display
 */
function getMatchContext(text: string, start: number, length: number): string {
	const contextLength = 20;
	const contextStart = Math.max(0, start - contextLength);
	const contextEnd = Math.min(text.length, start + length + contextLength);

	let context = text.slice(contextStart, contextEnd);

	if (contextStart > 0) {
		context = '...' + context;
	}
	if (contextEnd < text.length) {
		context = context + '...';
	}

	return context;
}

/**
 * Count files in folder with options
 */
function countFilesInFolder(
	folder: TFolder,
	includeSubfolders = false
): number {
	let count = 0;

	for (const child of folder.children) {
		if (child instanceof TFile) {
			count++;
		} else if (includeSubfolders && child instanceof TFolder) {
			count += countFilesInFolder(child, includeSubfolders);
		}
	}

	return count;
}

/**
 * Sort items by criteria
 */
function sortItems(items: TAbstractFile[], sortBy: SortBy): TAbstractFile[] {
	return [...items].sort((a, b) => compareFolders(a, b, sortBy));
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout;

	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle: boolean;

	return (...args: Parameters<T>) => {
		if (!inThrottle) {
			func(...args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}

// ============================================================================
// Exported Utilities Object
// ============================================================================

/**
 * Tree utilities object with all functions organized by category
 */
export const TreeUtils = {
	// Tree building
	createFolderTree,
	getFolderNoteCountMap,
	buildVirtualScrollItems,

	// Tree manipulation
	expandToFolder,
	collapseAllFolders,
	expandAllFolders,
	findNodeByPath,
	updateNodeExpansion,
	cloneTreeNode,

	// Search and filtering
	filterTreeByQuery,
	searchTreeNodes,
	highlightSearchMatches,

	// Sorting
	sortTreeNodes,
	compareFolders,
	applySortToTree,

	// Navigation
	getNextVisibleNode,
	getPreviousVisibleNode,
	getFirstVisibleNode,
	getLastVisibleNode,
	getParentNode,
	getChildNodes,

	// Focus system
	focusOnFolder,
	unfocusFolder,
	getFocusedSubtree,
	buildFocusBreadcrumb,

	// Performance
	measureTreeOperation,
	shouldEnableVirtualScrolling,
	estimateTreeComplexity,
	debounce,
	throttle,
};

export default TreeUtils;
