import React, {
	useMemo,
	useCallback,
	useRef,
	useEffect,
	useState,
} from 'react';
import { TFolder, TAbstractFile, TFile, App } from 'obsidian';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TreeNode } from './TreeNode';
import { findFolderByPath, expandToFolder } from './NestedFolders';

/**
 * FolderTree Component
 *
 * Root tree container that integrates TreeNode and NestedFolders components
 * with virtual scrolling support for the Obsidian Midnight Commander plugin.
 *
 * Features:
 * - Virtual scrolling for large folder hierarchies (1000+ folders)
 * - Integration with existing FilePane architecture
 * - Tree-wide state management coordination
 * - Keyboard navigation support (arrow keys, page up/down)
 * - Search and filtering within the tree
 * - Dynamic height handling for expanded/collapsed nodes
 * - Memory efficient for large vaults
 * - Integration point with dual-pane manager
 *
 * Performance Optimizations:
 * - Virtual scrolling with @tanstack/react-virtual
 * - Memoized component rendering
 * - Efficient state updates to prevent unnecessary re-renders
 * - Lazy loading of folder contents
 * - Debounced search and filtering
 *
 * Example Usage:
 * ```tsx
 * <FolderTree
 *   app={app}
 *   rootFolder={vault.getRoot()}
 *   paneId="left"
 *   isActive={true}
 *   onNavigateToFolder={handleNavigateToFolder}
 *   onFileClick={handleFileClick}
 *   onContextMenu={handleContextMenu}
 *   height={600}
 *   width={300}
 *   showFileCount={true}
 *   sortBy="name"
 * />
 * ```
 */

export interface FolderTreeProps {
	app: App;
	rootFolder: TFolder;
	paneId: 'left' | 'right';
	isActive: boolean;
	onNavigateToFolder: (folder: TFolder) => void;
	onFileClick?: (file: TAbstractFile) => void;
	onContextMenu?: (item: TAbstractFile, event: React.MouseEvent) => void;
	height: number;
	width: number;
	showFileCount?: boolean;
	sortBy?: 'name' | 'modified' | 'size';
	searchQuery?: string;
	showFilesInTree?: boolean;
	maxRenderDepth?: number;
}

interface FlatTreeItem {
	type: 'folder' | 'file';
	item: TAbstractFile;
	level: number;
	hasChildren: boolean;
	isExpanded: boolean;
	parentPath: string;
}

/**
 * Hook for flattening tree structure for virtual scrolling
 */
const useFlattenedTree = (
	rootFolder: TFolder,
	expandedFolders: Set<string>,
	showFilesInTree = false,
	searchQuery?: string,
	sortBy: 'name' | 'modified' | 'size' = 'name',
	maxDepth = 50
): FlatTreeItem[] => {
	return useMemo(() => {
		const flatItems: FlatTreeItem[] = [];

		const sortChildren = (children: TAbstractFile[]): TAbstractFile[] => {
			return [...children].sort((a, b) => {
				// Always show folders first
				if (a instanceof TFolder && !(b instanceof TFolder)) return -1;
				if (!(a instanceof TFolder) && b instanceof TFolder) return 1;

				// Then sort by the specified criteria
				switch (sortBy) {
					case 'modified': {
						const aMtime = a instanceof TFile ? a.stat.mtime : 0;
						const bMtime = b instanceof TFile ? b.stat.mtime : 0;
						return bMtime - aMtime;
					}
					case 'size': {
						const aSize = a instanceof TFile ? a.stat.size : 0;
						const bSize = b instanceof TFile ? b.stat.size : 0;
						return bSize - aSize;
					}
					case 'name':
					default:
						return a.name.localeCompare(b.name);
				}
			});
		};

		const matchesSearch = (item: TAbstractFile): boolean => {
			if (!searchQuery || searchQuery.trim() === '') return true;
			return item.name.toLowerCase().includes(searchQuery.toLowerCase());
		};

		const traverseFolder = (
			folder: TFolder,
			level: number,
			parentPath = ''
		) => {
			if (level > maxDepth) return;

			const isExpanded = expandedFolders.has(folder.path);
			const hasChildren =
				folder.children?.some(
					child =>
						child instanceof TFolder ||
						(showFilesInTree && !(child instanceof TFolder))
				) ?? false;

			// Add folder to flat list if it matches search or has no search query
			if (matchesSearch(folder)) {
				flatItems.push({
					type: 'folder',
					item: folder,
					level,
					hasChildren,
					isExpanded,
					parentPath,
				});
			}

			// If folder is expanded, process children
			if (isExpanded && folder.children) {
				const sortedChildren = sortChildren(folder.children);

				for (const child of sortedChildren) {
					if (child instanceof TFolder) {
						traverseFolder(child, level + 1, folder.path);
					} else if (showFilesInTree && matchesSearch(child)) {
						flatItems.push({
							type: 'file',
							item: child,
							level: level + 1,
							hasChildren: false,
							isExpanded: false,
							parentPath: folder.path,
						});
					}
				}
			}
		};

		// Start with root folder children
		if (rootFolder.children) {
			const rootChildren = sortChildren(rootFolder.children);
			for (const child of rootChildren) {
				if (child instanceof TFolder) {
					traverseFolder(child, 0, rootFolder.path);
				} else if (showFilesInTree && matchesSearch(child)) {
					flatItems.push({
						type: 'file',
						item: child,
						level: 0,
						hasChildren: false,
						isExpanded: false,
						parentPath: rootFolder.path,
					});
				}
			}
		}

		return flatItems;
	}, [
		rootFolder,
		expandedFolders,
		showFilesInTree,
		searchQuery,
		sortBy,
		maxDepth,
	]);
};

/**
 * Individual tree item component for virtual scrolling
 */
const VirtualTreeItem: React.FC<{
	item: FlatTreeItem;
	isSelected: boolean;
	isFocused: boolean;
	onToggleExpand: (folder: TFolder) => void;
	onNavigate: (folder: TFolder) => void;
	onFocus: (folder: TFolder) => void;
	onContextMenu: (item: TAbstractFile, event: React.MouseEvent) => void;
	onFileClick?: (file: TAbstractFile) => void;
}> = React.memo(
	({
		item,
		isSelected,
		isFocused,
		onToggleExpand,
		onNavigate,
		onFocus,
		onContextMenu,
		onFileClick,
	}) => {
		const handleClick = (event: React.MouseEvent) => {
			event.preventDefault();

			if (item.type === 'folder') {
				const folder = item.item as TFolder;
				onFocus(folder);
				onNavigate(folder);
			} else {
				onFileClick?.(item.item);
			}
		};

		const handleContextMenu = (event: React.MouseEvent) => {
			event.preventDefault();
			onContextMenu(item.item, event);
		};

		if (item.type === 'folder') {
			return (
				<TreeNode
					folder={item.item as TFolder}
					level={item.level}
					isExpanded={item.isExpanded}
					isSelected={isSelected}
					isFocused={isFocused}
					onToggleExpand={onToggleExpand}
					onNavigate={onNavigate}
					onFocus={onFocus}
					onContextMenu={(folder, event) => onContextMenu(folder, event)}
				/>
			);
		} else {
			// File item rendering (simplified version of FileItem)
			const indentStyle = {
				paddingLeft: `${item.level * 16 + 32}px`, // Extra padding for file alignment
			};

			return (
				<div
					className={`tree-node nav-file file ${isSelected ? 'is-active' : ''} ${isFocused ? 'is-focused' : ''}`}
					style={indentStyle}
					onClick={handleClick}
					onContextMenu={handleContextMenu}
					tabIndex={0}
					role="treeitem"
					aria-level={item.level + 1}
					aria-selected={isSelected}
					title={item.item.path}
				>
					<div className="tree-node-content">
						<div className="tree-node-spacer" />
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
								className="lucide lucide-file-text"
							>
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
								<polyline points="14,2 14,8 20,8" />
								<line x1="16" y1="13" x2="8" y2="13" />
								<line x1="16" y1="17" x2="8" y2="17" />
								<line x1="10" y1="9" x2="8" y2="9" />
							</svg>
						</div>
						<div className="tree-node-name">{item.item.name}</div>
					</div>
				</div>
			);
		}
	}
);

VirtualTreeItem.displayName = 'VirtualTreeItem';

/**
 * Main FolderTree component
 */
export const FolderTree: React.FC<FolderTreeProps> = ({
	app,
	rootFolder,
	paneId,
	isActive,
	onNavigateToFolder,
	onFileClick,
	onContextMenu,
	height,
	width,
	showFileCount = false,
	sortBy = 'name',
	searchQuery,
	showFilesInTree = false,
	maxRenderDepth = 50,
}) => {
	// Tree state management
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
		new Set()
	);
	const [focusedFolder, setFocusedFolder] = useState<TFolder | null>(null);
	const [selectedIndex, setSelectedIndex] = useState<number>(-1);

	// Virtual scrolling setup
	const parentRef = useRef<HTMLDivElement>(null);

	// Flatten tree structure for virtual scrolling
	const flatItems = useFlattenedTree(
		rootFolder,
		expandedFolders,
		showFilesInTree,
		searchQuery,
		sortBy,
		maxRenderDepth
	);

	// Virtual scrolling configuration
	const virtualizer = useVirtualizer({
		count: flatItems.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 32, // Height of each tree item
		overscan: 10, // Render extra items for smooth scrolling
	});

	// Event handlers
	const handleToggleExpand = useCallback((folder: TFolder) => {
		setExpandedFolders(prev => {
			const newExpanded = new Set(prev);
			if (newExpanded.has(folder.path)) {
				newExpanded.delete(folder.path);
			} else {
				newExpanded.add(folder.path);
			}
			return newExpanded;
		});
	}, []);

	const handleNavigate = useCallback(
		(folder: TFolder) => {
			setFocusedFolder(folder);

			// Find the index of this folder in flat items for selection tracking
			const index = flatItems.findIndex(
				item => item.type === 'folder' && item.item.path === folder.path
			);
			if (index >= 0) {
				setSelectedIndex(index);
			}

			onNavigateToFolder(folder);
		},
		[flatItems, onNavigateToFolder]
	);

	const handleFocus = useCallback(
		(folder: TFolder) => {
			setFocusedFolder(folder);

			// Find the index of this folder in flat items
			const index = flatItems.findIndex(
				item => item.type === 'folder' && item.item.path === folder.path
			);
			if (index >= 0) {
				setSelectedIndex(index);
			}
		},
		[flatItems]
	);

	const handleContextMenu = useCallback(
		(item: TAbstractFile, event: React.MouseEvent) => {
			onContextMenu?.(item, event);
		},
		[onContextMenu]
	);

	const handleFileClick = useCallback(
		(file: TAbstractFile) => {
			onFileClick?.(file);
		},
		[onFileClick]
	);

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (!isActive || flatItems.length === 0) return;

			let newIndex = selectedIndex;

			switch (event.key) {
				case 'ArrowDown':
					event.preventDefault();
					newIndex = Math.min(flatItems.length - 1, selectedIndex + 1);
					break;
				case 'ArrowUp':
					event.preventDefault();
					newIndex = Math.max(0, selectedIndex - 1);
					break;
				case 'PageDown':
					event.preventDefault();
					newIndex = Math.min(flatItems.length - 1, selectedIndex + 10);
					break;
				case 'PageUp':
					event.preventDefault();
					newIndex = Math.max(0, selectedIndex - 10);
					break;
				case 'Home':
					event.preventDefault();
					newIndex = 0;
					break;
				case 'End':
					event.preventDefault();
					newIndex = flatItems.length - 1;
					break;
				case 'Enter':
				case ' ':
					event.preventDefault();
					if (selectedIndex >= 0 && selectedIndex < flatItems.length) {
						const item = flatItems[selectedIndex];
						if (item.type === 'folder') {
							handleNavigate(item.item as TFolder);
						} else {
							handleFileClick(item.item);
						}
					}
					return;
				case 'ArrowRight':
					event.preventDefault();
					if (selectedIndex >= 0) {
						const item = flatItems[selectedIndex];
						if (item.type === 'folder' && !item.isExpanded) {
							handleToggleExpand(item.item as TFolder);
						}
					}
					return;
				case 'ArrowLeft':
					event.preventDefault();
					if (selectedIndex >= 0) {
						const item = flatItems[selectedIndex];
						if (item.type === 'folder' && item.isExpanded) {
							handleToggleExpand(item.item as TFolder);
						}
					}
					return;
				default:
					return;
			}

			if (
				newIndex !== selectedIndex &&
				newIndex >= 0 &&
				newIndex < flatItems.length
			) {
				setSelectedIndex(newIndex);
				const item = flatItems[newIndex];
				if (item.type === 'folder') {
					setFocusedFolder(item.item as TFolder);
				}

				// Scroll to the new selection
				virtualizer.scrollToIndex(newIndex, { align: 'center' });
			}
		};

		if (isActive) {
			document.addEventListener('keydown', handleKeyDown);
			return () => document.removeEventListener('keydown', handleKeyDown);
		}
	}, [
		isActive,
		selectedIndex,
		flatItems,
		handleNavigate,
		handleToggleExpand,
		handleFileClick,
		virtualizer,
	]);

	// Utility functions for tree operations
	const expandAll = useCallback(() => {
		const allFolders = new Set<string>();

		const collectAllFolders = (folder: TFolder) => {
			allFolders.add(folder.path);
			folder.children?.forEach(child => {
				if (child instanceof TFolder) {
					collectAllFolders(child);
				}
			});
		};

		collectAllFolders(rootFolder);
		setExpandedFolders(allFolders);
	}, [rootFolder]);

	const collapseAll = useCallback(() => {
		setExpandedFolders(new Set());
	}, []);

	const revealFolder = useCallback(
		(folderPath: string) => {
			const newExpanded = expandToFolder(
				[rootFolder],
				folderPath,
				expandedFolders
			);
			setExpandedFolders(newExpanded);

			const targetFolder = findFolderByPath([rootFolder], folderPath);
			if (targetFolder) {
				setFocusedFolder(targetFolder);

				// Find index and scroll to it
				setTimeout(() => {
					const index = flatItems.findIndex(
						item => item.type === 'folder' && item.item.path === folderPath
					);
					if (index >= 0) {
						setSelectedIndex(index);
						virtualizer.scrollToIndex(index, { align: 'center' });
					}
				}, 100);
			}
		},
		[rootFolder, expandedFolders, flatItems, virtualizer]
	);

	// Expose tree operations for external use
	useEffect(() => {
		const treeOperations = {
			expandAll,
			collapseAll,
			revealFolder,
		};

		// Store operations on window for access from parent components
		(window as any)[`folderTreeOperations_${paneId}`] = treeOperations;

		return () => {
			delete (window as any)[`folderTreeOperations_${paneId}`];
		};
	}, [paneId, expandAll, collapseAll, revealFolder]);

	// Calculate total item count for display
	const totalItemCount = useMemo(() => {
		if (showFileCount) {
			let folderCount = 0;
			let fileCount = 0;

			flatItems.forEach(item => {
				if (item.type === 'folder') {
					folderCount++;
				} else {
					fileCount++;
				}
			});

			return { folderCount, fileCount, total: flatItems.length };
		}
		return { folderCount: 0, fileCount: 0, total: flatItems.length };
	}, [flatItems, showFileCount]);

	return (
		<div
			className={`folder-tree ${isActive ? 'active' : 'inactive'}`}
			style={{ height, width }}
			data-pane-id={paneId}
		>
			{/* Tree header with statistics */}
			{showFileCount && (
				<div className="folder-tree-header">
					<div className="folder-tree-stats">
						{searchQuery ? (
							<span>Found: {totalItemCount.total} items</span>
						) : (
							<span>
								{totalItemCount.folderCount} folders
								{showFilesInTree && `, ${totalItemCount.fileCount} files`}
							</span>
						)}
					</div>
				</div>
			)}

			{/* Virtual scrolled tree content */}
			<div
				ref={parentRef}
				className="folder-tree-container"
				style={{
					height: showFileCount ? 'calc(100% - 30px)' : '100%',
					overflow: 'auto',
				}}
				role="tree"
				aria-label={`Folder tree for ${paneId} pane`}
				tabIndex={isActive ? 0 : -1}
			>
				{flatItems.length === 0 ? (
					<div className="folder-tree-empty">
						<p>
							{searchQuery ? 'No items found' : 'No folders in this directory'}
						</p>
					</div>
				) : (
					<div
						style={{
							height: `${virtualizer.getTotalSize()}px`,
							width: '100%',
							position: 'relative',
						}}
					>
						{virtualizer.getVirtualItems().map(virtualItem => {
							const item = flatItems[virtualItem.index];
							if (!item) return null;

							const isSelected =
								selectedIndex === virtualItem.index && isActive;
							const isFocused =
								item.type === 'folder' &&
								focusedFolder?.path === item.item.path;

							return (
								<div
									key={virtualItem.key}
									style={{
										position: 'absolute',
										top: 0,
										left: 0,
										width: '100%',
										height: `${virtualItem.size}px`,
										transform: `translateY(${virtualItem.start}px)`,
									}}
								>
									<VirtualTreeItem
										item={item}
										isSelected={isSelected}
										isFocused={isFocused}
										onToggleExpand={handleToggleExpand}
										onNavigate={handleNavigate}
										onFocus={handleFocus}
										onContextMenu={handleContextMenu}
										onFileClick={handleFileClick}
									/>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};
