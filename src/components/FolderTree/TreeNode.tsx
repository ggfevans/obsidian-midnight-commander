import React from 'react';
import { TFolder } from 'obsidian';
import { TreeNodeProps } from '../../types/interfaces';

/**
 * TreeNode Component
 *
 * A collapsible folder node component for building nested folder tree views.
 * Inspired by File Tree Alternative plugin architecture and designed to integrate
 * seamlessly with Obsidian's native UI patterns.
 *
 * Features:
 * - Expand/collapse functionality with chevron indicators
 * - Proper keyboard navigation (Arrow keys, Enter, Space)
 * - Focus management for File Tree Alternative pattern
 * - Context menu support
 * - Accessibility attributes (ARIA labels, roles)
 * - Consistent styling with Obsidian's navigation components
 *
 * Example Usage:
 * ```tsx
 * const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
 * const [selectedFolder, setSelectedFolder] = useState<TFolder | null>(null);
 * const [focusedFolder, setFocusedFolder] = useState<TFolder | null>(null);
 *
 * <TreeNode
 *   folder={folder}
 *   level={0}
 *   isExpanded={expandedFolders.has(folder.path)}
 *   isSelected={selectedFolder === folder}
 *   isFocused={focusedFolder === folder}
 *   onToggleExpand={(folder) => {
 *     const newExpanded = new Set(expandedFolders);
 *     if (newExpanded.has(folder.path)) {
 *       newExpanded.delete(folder.path);
 *     } else {
 *       newExpanded.add(folder.path);
 *     }
 *     setExpandedFolders(newExpanded);
 *   }}
 *   onNavigate={(folder) => {
 *     setSelectedFolder(folder);
 *     // Navigate to folder in file pane
 *   }}
 *   onFocus={(folder) => {
 *     setFocusedFolder(folder);
 *   }}
 *   onContextMenu={(folder, event) => {
 *     // Show context menu at event coordinates
 *   }}
 * />
 * ```
 */

export const TreeNode: React.FC<TreeNodeProps> = ({
	folder,
	level,
	isExpanded,
	isSelected,
	isFocused,
	onToggleExpand,
	onNavigate,
	onFocus,
	onContextMenu,
}) => {
	const handleClick = (event: React.MouseEvent) => {
		event.preventDefault();
		onFocus(folder);
		onNavigate(folder);
	};

	const handleToggleExpand = (event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		onToggleExpand(folder);
	};

	const handleContextMenu = (event: React.MouseEvent) => {
		event.preventDefault();
		onContextMenu(folder, event);
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		switch (event.key) {
			case 'Enter':
			case ' ':
				event.preventDefault();
				onNavigate(folder);
				break;
			case 'ArrowRight':
				if (!isExpanded) {
					event.preventDefault();
					onToggleExpand(folder);
				}
				break;
			case 'ArrowLeft':
				if (isExpanded) {
					event.preventDefault();
					onToggleExpand(folder);
				}
				break;
		}
	};

	// Calculate indentation based on level (16px per level)
	const indentStyle = {
		paddingLeft: `${level * 16}px`,
	};

	// Get folder icon based on expansion state
	const getFolderIcon = (): JSX.Element => {
		if (isExpanded) {
			return (
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
					className="lucide lucide-folder-open"
				>
					<path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
				</svg>
			);
		} else {
			return (
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
					className="lucide lucide-folder"
				>
					<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
				</svg>
			);
		}
	};

	// Get expand/collapse chevron
	const getExpandIcon = (): JSX.Element => {
		return (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="12"
				height="12"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className={`tree-node-chevron ${isExpanded ? 'expanded' : 'collapsed'}`}
			>
				<polyline points="9,18 15,12 9,6" />
			</svg>
		);
	};

	// Build CSS classes following Obsidian conventions
	const className = [
		'tree-node',
		'nav-file',
		isSelected ? 'is-active' : '',
		isFocused ? 'is-focused' : '',
		'folder',
	]
		.filter(Boolean)
		.join(' ');

	// Check if folder has children to show expand/collapse chevron
	const hasChildren = folder.children.some(child => child instanceof TFolder);

	return (
		<div
			className={className}
			style={indentStyle}
			onClick={handleClick}
			onContextMenu={handleContextMenu}
			onKeyDown={handleKeyDown}
			tabIndex={0}
			role="treeitem"
			aria-expanded={hasChildren ? isExpanded : undefined}
			aria-level={level + 1}
			aria-selected={isSelected}
			title={folder.path || 'Vault Root'}
		>
			<div className="tree-node-content">
				{hasChildren && (
					<button
						className="tree-node-expand-button"
						onClick={handleToggleExpand}
						aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
						tabIndex={-1}
					>
						{getExpandIcon()}
					</button>
				)}
				{!hasChildren && <div className="tree-node-spacer" />}

				<div className="tree-node-icon">{getFolderIcon()}</div>

				<div className="tree-node-name">
					{folder.name === '' ? 'Vault Root' : folder.name}
				</div>
			</div>
		</div>
	);
};
