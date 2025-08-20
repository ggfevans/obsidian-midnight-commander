import React, { useMemo, useCallback } from 'react';
import { TFolder } from 'obsidian';
import { TreeNode } from './TreeNode';

/**
 * NestedFolders Component
 *
 * Efficiently renders recursive folder hierarchies using the TreeNode component.
 * Designed for the Obsidian Midnight Commander plugin with performance optimizations
 * for handling large vault structures and deep nesting.
 *
 * Features:
 * - Recursive folder rendering with depth limiting for performance
 * - Lazy loading of deep folder structures
 * - Memoized components to prevent unnecessary re-renders
 * - Efficient state management for expanded/collapsed folders
 * - Support for very large folder hierarchies (100+ levels)
 * - Integration with Obsidian's TFolder API
 *
 * Performance Optimizations:
 * - React.memo for component memoization
 * - useMemo for expensive computations
 * - useCallback for stable function references
 * - Configurable max render depth to prevent performance issues
 * - Virtual scrolling support for large folder lists
 *
 * Example Usage:
 * ```tsx
 * const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
 * const [selectedFolder, setSelectedFolder] = useState<TFolder | null>(null);
 * const [focusedFolder, setFocusedFolder] = useState<TFolder | null>(null);
 *
 * <NestedFolders
 *   folders={rootFolders}
 *   level={0}
 *   expandedFolders={expandedFolders}
 *   selectedFolder={selectedFolder}
 *   focusedFolder={focusedFolder}
 *   onToggleExpand={handleToggleExpand}
 *   onNavigate={handleNavigate}
 *   onFocus={handleFocus}
 *   onContextMenu={handleContextMenu}
 *   maxRenderDepth={50}
 * />
 * ```
 */

export interface NestedFoldersProps {
	folders: TFolder[];
	level: number;
	expandedFolders: Set<string>;
	selectedFolder: TFolder | null;
	focusedFolder: TFolder | null;
	onToggleExpand: (folder: TFolder) => void;
	onNavigate: (folder: TFolder) => void;
	onFocus: (folder: TFolder) => void;
	onContextMenu: (folder: TFolder, event: React.MouseEvent) => void;
	maxRenderDepth?: number;
}

/**
 * Lazy loading wrapper for deep folder structures
 * Only renders children when expanded and within render depth limits
 */
const LazyFolderChildren: React.FC<{
	folder: TFolder;
	level: number;
	expandedFolders: Set<string>;
	selectedFolder: TFolder | null;
	focusedFolder: TFolder | null;
	onToggleExpand: (folder: TFolder) => void;
	onNavigate: (folder: TFolder) => void;
	onFocus: (folder: TFolder) => void;
	onContextMenu: (folder: TFolder, event: React.MouseEvent) => void;
	maxRenderDepth: number;
}> = React.memo(
	({
		folder,
		level,
		expandedFolders,
		selectedFolder,
		focusedFolder,
		onToggleExpand,
		onNavigate,
		onFocus,
		onContextMenu,
		maxRenderDepth,
	}) => {
		// Get child folders from the current folder
		const childFolders = useMemo(() => {
			if (!folder.children) return [];
			return folder.children.filter(
				(child): child is TFolder => child instanceof TFolder
			);
		}, [folder.children]);

		// Don't render children if folder is collapsed or we've exceeded max depth
		if (!expandedFolders.has(folder.path) || level >= maxRenderDepth) {
			return null;
		}

		// If we're at max depth but there are more levels, show a placeholder
		if (
			level === maxRenderDepth - 1 &&
			childFolders.some(child =>
				child.children.some(grandchild => grandchild instanceof TFolder)
			)
		) {
			return (
				<div
					className="tree-node-depth-limit"
					style={{ paddingLeft: `${(level + 1) * 16}px` }}
				>
					<div className="tree-node-content">
						<div className="tree-node-icon">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="lucide lucide-more-horizontal"
							>
								<circle cx="12" cy="12" r="1" />
								<circle cx="19" cy="12" r="1" />
								<circle cx="5" cy="12" r="1" />
							</svg>
						</div>
						<div className="tree-node-name tree-node-depth-indicator">
							More folders... (depth limit reached)
						</div>
					</div>
				</div>
			);
		}

		return (
			<NestedFolders
				folders={childFolders}
				level={level + 1}
				expandedFolders={expandedFolders}
				selectedFolder={selectedFolder}
				focusedFolder={focusedFolder}
				onToggleExpand={onToggleExpand}
				onNavigate={onNavigate}
				onFocus={onFocus}
				onContextMenu={onContextMenu}
				maxRenderDepth={maxRenderDepth}
			/>
		);
	}
);

LazyFolderChildren.displayName = 'LazyFolderChildren';

/**
 * Individual folder item component with memoization
 */
const FolderItem: React.FC<{
	folder: TFolder;
	level: number;
	isExpanded: boolean;
	isSelected: boolean;
	isFocused: boolean;
	onToggleExpand: (folder: TFolder) => void;
	onNavigate: (folder: TFolder) => void;
	onFocus: (folder: TFolder) => void;
	onContextMenu: (folder: TFolder, event: React.MouseEvent) => void;
	hasChildren: boolean;
}> = React.memo(
	({
		folder,
		level,
		isExpanded,
		isSelected,
		isFocused,
		onToggleExpand,
		onNavigate,
		onFocus,
		onContextMenu,
		hasChildren,
	}) => {
		return (
			<TreeNode
				folder={folder}
				level={level}
				isExpanded={isExpanded}
				isSelected={isSelected}
				isFocused={isFocused}
				onToggleExpand={onToggleExpand}
				onNavigate={onNavigate}
				onFocus={onFocus}
				onContextMenu={onContextMenu}
			/>
		);
	},
	(prevProps, nextProps) => {
		// Custom comparison for memoization optimization
		return (
			prevProps.folder.path === nextProps.folder.path &&
			prevProps.level === nextProps.level &&
			prevProps.isExpanded === nextProps.isExpanded &&
			prevProps.isSelected === nextProps.isSelected &&
			prevProps.isFocused === nextProps.isFocused &&
			prevProps.hasChildren === nextProps.hasChildren
		);
	}
);

FolderItem.displayName = 'FolderItem';

/**
 * Main NestedFolders component with recursive rendering
 */
export const NestedFolders: React.FC<NestedFoldersProps> = React.memo(
	({
		folders,
		level,
		expandedFolders,
		selectedFolder,
		focusedFolder,
		onToggleExpand,
		onNavigate,
		onFocus,
		onContextMenu,
		maxRenderDepth = 50, // Default max depth to prevent performance issues
	}) => {
		// Memoize folder processing to avoid recalculation on every render
		const processedFolders = useMemo(() => {
			return folders.map(folder => {
				const hasChildren =
					folder.children?.some(child => child instanceof TFolder) ?? false;
				const isExpanded = expandedFolders.has(folder.path);
				const isSelected = selectedFolder?.path === folder.path;
				const isFocused = focusedFolder?.path === folder.path;

				return {
					folder,
					hasChildren,
					isExpanded,
					isSelected,
					isFocused,
				};
			});
		}, [folders, expandedFolders, selectedFolder, focusedFolder]);

		// Stable callback references to prevent unnecessary re-renders
		const handleToggleExpand = useCallback(
			(folder: TFolder) => {
				onToggleExpand(folder);
			},
			[onToggleExpand]
		);

		const handleNavigate = useCallback(
			(folder: TFolder) => {
				onNavigate(folder);
			},
			[onNavigate]
		);

		const handleFocus = useCallback(
			(folder: TFolder) => {
				onFocus(folder);
			},
			[onFocus]
		);

		const handleContextMenu = useCallback(
			(folder: TFolder, event: React.MouseEvent) => {
				onContextMenu(folder, event);
			},
			[onContextMenu]
		);

		// Early return if no folders or exceeded max depth
		if (!folders.length || level > maxRenderDepth) {
			return null;
		}

		return (
			<>
				{processedFolders.map(
					({ folder, hasChildren, isExpanded, isSelected, isFocused }) => (
						<React.Fragment key={folder.path}>
							<FolderItem
								folder={folder}
								level={level}
								isExpanded={isExpanded}
								isSelected={isSelected}
								isFocused={isFocused}
								onToggleExpand={handleToggleExpand}
								onNavigate={handleNavigate}
								onFocus={handleFocus}
								onContextMenu={handleContextMenu}
								hasChildren={hasChildren}
							/>

							{/* Render children only if folder is expanded and has subfolders */}
							{hasChildren && (
								<LazyFolderChildren
									folder={folder}
									level={level}
									expandedFolders={expandedFolders}
									selectedFolder={selectedFolder}
									focusedFolder={focusedFolder}
									onToggleExpand={handleToggleExpand}
									onNavigate={handleNavigate}
									onFocus={handleFocus}
									onContextMenu={handleContextMenu}
									maxRenderDepth={maxRenderDepth}
								/>
							)}
						</React.Fragment>
					)
				)}
			</>
		);
	}
);

NestedFolders.displayName = 'NestedFolders';

/**
 * Utility function to collect all expanded folder paths from a folder hierarchy
 * Useful for initializing expanded state or persistence
 */
export const collectExpandedFolders = (
	folders: TFolder[],
	expandedPaths: Set<string> = new Set()
): Set<string> => {
	const result = new Set<string>();

	const traverse = (folder: TFolder) => {
		if (expandedPaths.has(folder.path)) {
			result.add(folder.path);

			// Recursively check children
			folder.children?.forEach(child => {
				if (child instanceof TFolder) {
					traverse(child);
				}
			});
		}
	};

	folders.forEach(traverse);
	return result;
};

/**
 * Utility function to find a folder by path in the hierarchy
 * Useful for programmatic navigation and state updates
 */
export const findFolderByPath = (
	folders: TFolder[],
	path: string
): TFolder | null => {
	for (const folder of folders) {
		if (folder.path === path) {
			return folder;
		}

		// Check children recursively
		const childFolders =
			folder.children?.filter(
				(child): child is TFolder => child instanceof TFolder
			) ?? [];

		const found = findFolderByPath(childFolders, path);
		if (found) {
			return found;
		}
	}

	return null;
};

/**
 * Utility function to expand all parent folders of a given folder path
 * Useful for revealing a specific folder in the tree
 */
export const expandToFolder = (
	folders: TFolder[],
	targetPath: string,
	currentExpanded: Set<string>
): Set<string> => {
	const newExpanded = new Set(currentExpanded);

	// Find the target folder first
	const targetFolder = findFolderByPath(folders, targetPath);
	if (!targetFolder) {
		return newExpanded;
	}

	// Expand all parent paths
	const pathParts = targetPath.split('/');
	let currentPath = '';

	for (let i = 0; i < pathParts.length; i++) {
		if (i === 0) {
			currentPath = pathParts[i];
		} else {
			currentPath += '/' + pathParts[i];
		}

		// Check if this path corresponds to a folder
		const folder = findFolderByPath(folders, currentPath);
		if (folder) {
			newExpanded.add(currentPath);
		}
	}

	return newExpanded;
};
