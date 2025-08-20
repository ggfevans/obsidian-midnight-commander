import React, { useState, useCallback } from 'react';
import { TFolder } from 'obsidian';
import {
	NestedFolders,
	findFolderByPath,
	expandToFolder,
} from './NestedFolders';

/**
 * Example usage of the NestedFolders component
 *
 * This demonstrates how to integrate the NestedFolders component with proper
 * state management for a complete folder tree view experience.
 *
 * Features demonstrated:
 * - State management for expanded folders
 * - Selected and focused folder tracking
 * - Event handlers for user interactions
 * - Performance optimizations with useCallback
 * - Integration with Obsidian's TFolder API
 */

interface FolderTreeExampleProps {
	rootFolders: TFolder[];
	onFolderSelect?: (folder: TFolder) => void;
	maxDepth?: number;
}

export const FolderTreeExample: React.FC<FolderTreeExampleProps> = ({
	rootFolders,
	onFolderSelect,
	maxDepth = 50,
}) => {
	// State management for folder tree
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
		new Set()
	);
	const [selectedFolder, setSelectedFolder] = useState<TFolder | null>(null);
	const [focusedFolder, setFocusedFolder] = useState<TFolder | null>(null);

	// Handle folder expansion/collapse
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

	// Handle folder navigation (double-click or Enter)
	const handleNavigate = useCallback(
		(folder: TFolder) => {
			setSelectedFolder(folder);

			// Expand the folder if it has children
			if (folder.children?.some(child => child instanceof TFolder)) {
				setExpandedFolders(prev => {
					const newExpanded = new Set(prev);
					newExpanded.add(folder.path);
					return newExpanded;
				});
			}

			// Call external handler if provided
			onFolderSelect?.(folder);
		},
		[onFolderSelect]
	);

	// Handle folder focus (single-click or arrow navigation)
	const handleFocus = useCallback((folder: TFolder) => {
		setFocusedFolder(folder);
	}, []);

	// Handle context menu
	const handleContextMenu = useCallback(
		(folder: TFolder, event: React.MouseEvent) => {
			event.preventDefault();

			// Here you would typically show a context menu
			// For example, using Obsidian's Menu API:
			console.log(
				'Context menu for folder:',
				folder.path,
				'at position:',
				event.clientX,
				event.clientY
			);

			// Example of what you might implement:
			// const menu = new Menu();
			// menu.addItem(item => item.setTitle('Open in new pane').onClick(() => { /* ... */ }));
			// menu.addItem(item => item.setTitle('Reveal in file explorer').onClick(() => { /* ... */ }));
			// menu.showAtMouseEvent(event.nativeEvent);
		},
		[]
	);

	// Utility function to expand all folders to reveal a specific path

	// Utility function to collapse all folders
	const collapseAll = useCallback(() => {
		setExpandedFolders(new Set());
	}, []);

	// Utility function to expand all folders (use with caution for large vaults)
	const expandAll = useCallback(() => {
		const allFolders = new Set<string>();

		const collectAllFolders = (folders: TFolder[]) => {
			folders.forEach(folder => {
				allFolders.add(folder.path);
				const childFolders =
					folder.children?.filter(
						(child): child is TFolder => child instanceof TFolder
					) ?? [];
				collectAllFolders(childFolders);
			});
		};

		collectAllFolders(rootFolders);
		setExpandedFolders(allFolders);
	}, [rootFolders]);

	return (
		<div className="folder-tree-example">
			{/* Optional toolbar for demonstration */}
			<div
				className="folder-tree-toolbar"
				style={{
					padding: '8px',
					borderBottom: '1px solid var(--background-modifier-border)',
					display: 'flex',
					gap: '8px',
					fontSize: 'var(--font-ui-small)',
				}}
			>
				<button onClick={expandAll} style={{ fontSize: 'inherit' }}>
					Expand All
				</button>
				<button onClick={collapseAll} style={{ fontSize: 'inherit' }}>
					Collapse All
				</button>
				{selectedFolder && (
					<span style={{ color: 'var(--text-muted)' }}>
						Selected: {selectedFolder.name || 'Vault Root'}
					</span>
				)}
			</div>

			{/* Folder tree container */}
			<div
				className="folder-tree-container"
				style={{
					flex: 1,
					overflow: 'auto',
					padding: '4px 0',
				}}
			>
				<NestedFolders
					folders={rootFolders}
					level={0}
					expandedFolders={expandedFolders}
					selectedFolder={selectedFolder}
					focusedFolder={focusedFolder}
					onToggleExpand={handleToggleExpand}
					onNavigate={handleNavigate}
					onFocus={handleFocus}
					onContextMenu={handleContextMenu}
					maxRenderDepth={maxDepth}
				/>
			</div>
		</div>
	);
};

/**
 * Hook for managing folder tree state
 *
 * This custom hook encapsulates all the state management logic
 * for a folder tree, making it easy to reuse across components.
 */
export const useFolderTree = (rootFolders: TFolder[]) => {
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
		new Set()
	);
	const [selectedFolder, setSelectedFolder] = useState<TFolder | null>(null);
	const [focusedFolder, setFocusedFolder] = useState<TFolder | null>(null);

	const toggleExpand = useCallback((folder: TFolder) => {
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

	const selectFolder = useCallback((folder: TFolder) => {
		setSelectedFolder(folder);
	}, []);

	const focusFolder = useCallback((folder: TFolder) => {
		setFocusedFolder(folder);
	}, []);

	const revealFolder = useCallback(
		(folderPath: string) => {
			const newExpanded = expandToFolder(
				rootFolders,
				folderPath,
				expandedFolders
			);
			setExpandedFolders(newExpanded);

			const targetFolder = findFolderByPath(rootFolders, folderPath);
			if (targetFolder) {
				setSelectedFolder(targetFolder);
				setFocusedFolder(targetFolder);
			}
		},
		[rootFolders, expandedFolders]
	);

	const collapseAll = useCallback(() => {
		setExpandedFolders(new Set());
	}, []);

	const expandAll = useCallback(() => {
		const allFolders = new Set<string>();

		const collectAllFolders = (folders: TFolder[]) => {
			folders.forEach(folder => {
				allFolders.add(folder.path);
				const childFolders =
					folder.children?.filter(
						(child): child is TFolder => child instanceof TFolder
					) ?? [];
				collectAllFolders(childFolders);
			});
		};

		collectAllFolders(rootFolders);
		setExpandedFolders(allFolders);
	}, [rootFolders]);

	return {
		// State
		expandedFolders,
		selectedFolder,
		focusedFolder,

		// Actions
		toggleExpand,
		selectFolder,
		focusFolder,
		revealFolder,
		collapseAll,
		expandAll,

		// Setters (for direct state manipulation if needed)
		setExpandedFolders,
		setSelectedFolder,
		setFocusedFolder,
	};
};
