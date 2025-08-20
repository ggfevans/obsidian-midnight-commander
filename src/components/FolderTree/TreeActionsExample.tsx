import React, { useState, useCallback } from 'react';
import { TFolder, App } from 'obsidian';
import { TreeActions, TreeActionsProps } from './TreeActions';
import { FolderTree } from './FolderTree';

/**
 * TreeActionsExample Component
 *
 * Demonstrates how to integrate the TreeActions component with FolderTree
 * and pane header systems in the Obsidian Midnight Commander plugin.
 *
 * This example shows:
 * - State management for tree view controls
 * - Integration with pane headers
 * - Coordination between TreeActions and FolderTree
 * - Event handling for all tree operations
 */

interface TreeActionsExampleProps {
	app: App;
	rootFolder: TFolder;
	paneId: 'left' | 'right';
	isActive: boolean;
	onNavigateToFolder: (folder: TFolder) => void;
	height: number;
	width: number;
}

export const TreeActionsExample: React.FC<TreeActionsExampleProps> = ({
	app,
	rootFolder,
	paneId,
	isActive,
	onNavigateToFolder,
	height,
	width,
}) => {
	// Tree state management
	const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
	const [sortBy, setSortBy] = useState<'name' | 'modified' | 'size'>('name');
	const [showFilesInTree, setShowFilesInTree] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [totalItems] = useState(0);
	const [visibleItems] = useState(0);

	// Tree operations - these would typically access the FolderTree instance
	// via refs or global operations exposed by the FolderTree component
	const handleExpandAll = useCallback(() => {
		// Access tree operations from FolderTree component
		const treeOperations = (window as any)[`folderTreeOperations_${paneId}`];
		if (treeOperations?.expandAll) {
			treeOperations.expandAll();
		}
	}, [paneId]);

	const handleCollapseAll = useCallback(() => {
		const treeOperations = (window as any)[`folderTreeOperations_${paneId}`];
		if (treeOperations?.collapseAll) {
			treeOperations.collapseAll();
		}
	}, [paneId]);

	const handleRefresh = useCallback(async () => {
		// Trigger vault refresh or tree rebuild
		console.log(`Refreshing tree for pane ${paneId}`);
		// In real implementation, this would trigger a vault scan
		// and update the rootFolder or trigger a re-render
	}, [paneId]);

	// View mode toggle
	const handleToggleView = useCallback(
		(mode: 'tree' | 'list') => {
			setViewMode(mode);
			console.log(`Switched to ${mode} view for pane ${paneId}`);
		},
		[paneId]
	);

	// Sorting change
	const handleChangeSorting = useCallback(
		(newSortBy: 'name' | 'modified' | 'size') => {
			setSortBy(newSortBy);
			console.log(`Changed sorting to ${newSortBy} for pane ${paneId}`);
		},
		[paneId]
	);

	// Toggle files in tree
	const handleToggleFiles = useCallback(
		(show: boolean) => {
			setShowFilesInTree(show);
			console.log(
				`${show ? 'Showing' : 'Hiding'} files in tree for pane ${paneId}`
			);
		},
		[paneId]
	);

	// Search change
	const handleSearchChange = useCallback(
		(query: string) => {
			setSearchQuery(query);
			console.log(`Search query changed to: "${query}" for pane ${paneId}`);
		},
		[paneId]
	);

	// TreeActions props
	const treeActionsProps: TreeActionsProps = {
		paneId,
		viewMode,
		sortBy,
		showFilesInTree,
		searchQuery,
		onToggleView: handleToggleView,
		onChangeSorting: handleChangeSorting,
		onToggleFiles: handleToggleFiles,
		onSearchChange: handleSearchChange,
		onExpandAll: handleExpandAll,
		onCollapseAll: handleCollapseAll,
		onRefresh: handleRefresh,
		isCompact: width < 300, // Use compact mode for narrow panes
		isActive,
		totalItems,
		visibleItems,
	};

	return (
		<div className="tree-actions-example">
			{/* Tree Actions Toolbar */}
			<TreeActions {...treeActionsProps} />

			{/* Tree Content */}
			{viewMode === 'tree' ? (
				<FolderTree
					app={app}
					rootFolder={rootFolder}
					paneId={paneId}
					isActive={isActive}
					onNavigateToFolder={onNavigateToFolder}
					height={height - 40} // Account for toolbar height
					width={width}
					showFileCount={true}
					sortBy={sortBy}
					searchQuery={searchQuery}
					showFilesInTree={showFilesInTree}
					maxRenderDepth={50}
				/>
			) : (
				<div className="list-view-placeholder">
					<p>List view implementation would go here</p>
					<p>This would use the existing FilePane component</p>
					<p>
						Sort: {sortBy}, Search: {searchQuery || 'None'}
					</p>
				</div>
			)}
		</div>
	);
};

/**
 * Integration with FilePane Header
 *
 * Here's how you would integrate TreeActions into an existing pane header:
 *
 * ```tsx
 * // In FilePane.tsx or similar component
 * import { TreeActions } from '../components/FolderTree';
 *
 * // Add to your pane header JSX:
 * <div className="pane-header">
 *   <div className="pane-path">
 *     <BreadcrumbNavigation ... />
 *     <span className="pane-file-count">...</span>
 *   </div>
 *
 *   // Add TreeActions here
 *   <TreeActions
 *     paneId={paneState.id}
 *     viewMode={viewMode}
 *     sortBy={sortBy}
 *     showFilesInTree={showFilesInTree}
 *     searchQuery={searchQuery}
 *     onToggleView={handleToggleView}
 *     onChangeSorting={handleChangeSorting}
 *     onToggleFiles={handleToggleFiles}
 *     onSearchChange={handleSearchChange}
 *     onExpandAll={handleExpandAll}
 *     onCollapseAll={handleCollapseAll}
 *     onRefresh={handleRefresh}
 *     isCompact={true}
 *     isActive={paneState.isActive}
 *   />
 *
 *   <div className="pane-status">
 *     {paneState.isActive && <span className="pane-active-indicator">●</span>}
 *   </div>
 * </div>
 * ```
 */

/**
 * CSS Integration
 *
 * Add this to your pane header CSS to properly integrate the toolbar:
 *
 * ```css
 * .pane-header {
 *   display: flex;
 *   align-items: center;
 *   justify-content: space-between;
 *   gap: 8px;
 *   padding: 6px 8px;
 *   border-bottom: 1px solid var(--background-modifier-border);
 * }
 *
 * .pane-header .tree-actions {
 *   flex: 1;
 *   max-width: 300px;
 * }
 *
 * .pane-header .tree-actions.compact {
 *   max-width: 200px;
 * }
 * ```
 */

export default TreeActionsExample;
