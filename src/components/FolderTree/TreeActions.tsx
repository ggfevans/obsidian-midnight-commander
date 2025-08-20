import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * TreeActions Component
 *
 * Provides comprehensive tree control buttons and functionality for the Obsidian Midnight Commander plugin.
 * Offers collapse/expand/sort control buttons, tree view toggle functionality, and sorting/filtering controls.
 *
 * Features:
 * - Tree-wide operations (expand all, collapse all, refresh)
 * - View mode toggle (tree vs list view)
 * - Sorting controls with dropdown menu
 * - Search functionality with debounced input
 * - Show/hide files in tree toggle
 * - Filter controls integration
 * - Compact toolbar design for pane headers
 * - Accessibility support with ARIA labels and keyboard navigation
 * - Integration with existing Obsidian button styling
 *
 * Integration:
 * - Works with FilePane header system
 * - Compatible with existing pane controls
 * - Supports both tree and list view modes
 * - Integrates with folder focus system
 * - Consistent with Obsidian's native file explorer controls
 */

export interface TreeActionsProps {
	paneId: 'left' | 'right';
	viewMode: 'tree' | 'list';
	sortBy: 'name' | 'modified' | 'size';
	showFilesInTree: boolean;
	searchQuery: string;
	onToggleView: (mode: 'tree' | 'list') => void;
	onChangeSorting: (sortBy: 'name' | 'modified' | 'size') => void;
	onToggleFiles: (show: boolean) => void;
	onSearchChange: (query: string) => void;
	onExpandAll: () => void;
	onCollapseAll: () => void;
	onRefresh: () => void;
	isCompact?: boolean;
	isActive?: boolean;
	totalItems?: number;
	visibleItems?: number;
}

interface SortOption {
	value: 'name' | 'modified' | 'size';
	label: string;
	icon: JSX.Element;
}

/**
 * Debounce utility for search input
 */
const useDebounce = (value: string, delay: number) => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
};

/**
 * Icon components using Lucide React patterns
 */
const Icons = {
	Tree: () => (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
		</svg>
	),
	List: () => (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<line x1="3" y1="6" x2="21" y2="6" />
			<line x1="3" y1="12" x2="21" y2="12" />
			<line x1="3" y1="18" x2="21" y2="18" />
		</svg>
	),
	Search: () => (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="11" cy="11" r="8" />
			<path d="M21 21l-4.35-4.35" />
		</svg>
	),
	ExpandAll: () => (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<polyline points="7,13 12,18 17,13" />
			<polyline points="7,6 12,11 17,6" />
		</svg>
	),
	CollapseAll: () => (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<polyline points="17,11 12,6 7,11" />
			<polyline points="17,18 12,13 7,18" />
		</svg>
	),
	Refresh: () => (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<polyline points="23,4 23,10 17,10" />
			<polyline points="1,20 1,14 7,14" />
			<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
		</svg>
	),
	Sort: () => (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M3 7h18M6 12h12M10 17h4" />
		</svg>
	),
	ChevronDown: () => (
		<svg
			width="12"
			height="12"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<polyline points="6,9 12,15 18,9" />
		</svg>
	),
	Clear: () => (
		<svg
			width="12"
			height="12"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<line x1="18" y1="6" x2="6" y2="18" />
			<line x1="6" y1="6" x2="18" y2="18" />
		</svg>
	),
	Files: () => (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
			<polyline points="14,2 14,8 20,8" />
			<line x1="16" y1="13" x2="8" y2="13" />
			<line x1="16" y1="17" x2="8" y2="17" />
			<line x1="10" y1="9" x2="8" y2="9" />
		</svg>
	),
};

export const TreeActions: React.FC<TreeActionsProps> = ({
	paneId,
	viewMode,
	sortBy,
	showFilesInTree,
	searchQuery,
	onToggleView,
	onChangeSorting,
	onToggleFiles,
	onSearchChange,
	onExpandAll,
	onCollapseAll,
	onRefresh,
	isCompact = false,
	isActive = false,
	totalItems = 0,
	visibleItems = 0,
}) => {
	// Local state
	const [showSortDropdown, setShowSortDropdown] = useState(false);
	const [showSearchInput, setShowSearchInput] = useState(false);
	const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Refs
	const searchInputRef = useRef<HTMLInputElement>(null);
	const sortDropdownRef = useRef<HTMLDivElement>(null);

	// Debounce search query changes
	const debouncedSearchQuery = useDebounce(localSearchQuery, 300);

	// Sort options configuration
	const sortOptions: SortOption[] = [
		{
			value: 'name',
			label: 'Name',
			icon: (
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<path d="M4 7h16M4 12h10M4 17h7" />
				</svg>
			),
		},
		{
			value: 'modified',
			label: 'Modified',
			icon: (
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<circle cx="12" cy="12" r="10" />
					<polyline points="12,6 12,12 16,14" />
				</svg>
			),
		},
		{
			value: 'size',
			label: 'Size',
			icon: (
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
				</svg>
			),
		},
	];

	// Effect to propagate debounced search changes
	useEffect(() => {
		if (debouncedSearchQuery !== searchQuery) {
			onSearchChange(debouncedSearchQuery);
		}
	}, [debouncedSearchQuery, searchQuery, onSearchChange]);

	// Effect to sync external search query changes
	useEffect(() => {
		setLocalSearchQuery(searchQuery);
	}, [searchQuery]);

	// Effect to focus search input when shown
	useEffect(() => {
		if (showSearchInput && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [showSearchInput]);

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				sortDropdownRef.current &&
				!sortDropdownRef.current.contains(event.target as Node)
			) {
				setShowSortDropdown(false);
			}
		};

		if (showSortDropdown) {
			document.addEventListener('mousedown', handleClickOutside);
			return () =>
				document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [showSortDropdown]);

	// Handle keyboard navigation
	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			if (event.key === 'Escape') {
				if (showSearchInput) {
					setShowSearchInput(false);
					setLocalSearchQuery('');
					onSearchChange('');
				} else if (showSortDropdown) {
					setShowSortDropdown(false);
				}
			}
		},
		[showSearchInput, showSortDropdown, onSearchChange]
	);

	// Handle search input changes
	const handleSearchInputChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setLocalSearchQuery(event.target.value);
		},
		[]
	);

	// Handle search clear
	const handleSearchClear = useCallback(() => {
		setLocalSearchQuery('');
		onSearchChange('');
		setShowSearchInput(false);
	}, [onSearchChange]);

	// Handle sort selection
	const handleSortSelect = useCallback(
		(sortOption: 'name' | 'modified' | 'size') => {
			onChangeSorting(sortOption);
			setShowSortDropdown(false);
		},
		[onChangeSorting]
	);

	// Handle refresh with visual feedback
	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		try {
			await onRefresh();
		} finally {
			// Add a small delay to show the refresh animation
			setTimeout(() => setIsRefreshing(false), 300);
		}
	}, [onRefresh]);

	// Get current sort option
	const currentSortOption =
		sortOptions.find(option => option.value === sortBy) || sortOptions[0];

	// Calculate filter status
	const hasFilter = localSearchQuery.trim().length > 0;
	const filteredCount =
		visibleItems < totalItems ? totalItems - visibleItems : 0;

	return (
		<div
			className={`tree-actions ${isCompact ? 'compact' : ''} ${isActive ? 'active' : ''}`}
			onKeyDown={handleKeyDown}
			role="toolbar"
			aria-label={`Tree actions for ${paneId} pane`}
		>
			{/* Primary Action Group */}
			<div className="tree-actions-group primary">
				{/* View Mode Toggle */}
				<button
					className={`tree-action-btn view-toggle ${viewMode}`}
					onClick={() => onToggleView(viewMode === 'tree' ? 'list' : 'tree')}
					title={`Switch to ${viewMode === 'tree' ? 'list' : 'tree'} view`}
					aria-label={`Switch to ${viewMode === 'tree' ? 'list' : 'tree'} view`}
					aria-pressed={viewMode === 'tree'}
				>
					{viewMode === 'tree' ? <Icons.List /> : <Icons.Tree />}
				</button>

				{/* Search Toggle/Input */}
				{showSearchInput ? (
					<div className="tree-search-container">
						<div className="tree-search-input-wrapper">
							<Icons.Search />
							<input
								ref={searchInputRef}
								type="text"
								className="tree-search-input"
								placeholder="Search tree..."
								value={localSearchQuery}
								onChange={handleSearchInputChange}
								onBlur={() => {
									if (!localSearchQuery.trim()) {
										setShowSearchInput(false);
									}
								}}
								aria-label="Search tree"
							/>
							{localSearchQuery && (
								<button
									className="tree-search-clear"
									onClick={handleSearchClear}
									title="Clear search"
									aria-label="Clear search"
								>
									<Icons.Clear />
								</button>
							)}
						</div>
					</div>
				) : (
					<button
						className={`tree-action-btn search-toggle ${hasFilter ? 'active' : ''}`}
						onClick={() => setShowSearchInput(true)}
						title="Search tree (Ctrl+F)"
						aria-label="Search tree"
					>
						<Icons.Search />
						{filteredCount > 0 && (
							<span className="tree-action-badge">{filteredCount}</span>
						)}
					</button>
				)}

				{/* Sort Dropdown */}
				<div className="tree-sort-container" ref={sortDropdownRef}>
					<button
						className={`tree-action-btn sort-toggle ${showSortDropdown ? 'active' : ''}`}
						onClick={() => setShowSortDropdown(!showSortDropdown)}
						title={`Sort by ${currentSortOption.label}`}
						aria-label={`Sort by ${currentSortOption.label}. Click to change sorting`}
						aria-expanded={showSortDropdown}
						aria-haspopup="menu"
					>
						<Icons.Sort />
						<Icons.ChevronDown />
					</button>

					{showSortDropdown && (
						<div
							className="tree-sort-dropdown"
							role="menu"
							aria-label="Sort options"
						>
							{sortOptions.map(option => (
								<button
									key={option.value}
									className={`tree-sort-option ${sortBy === option.value ? 'selected' : ''}`}
									onClick={() => handleSortSelect(option.value)}
									role="menuitem"
									aria-current={sortBy === option.value ? 'true' : 'false'}
								>
									{option.icon}
									<span>{option.label}</span>
									{sortBy === option.value && (
										<svg
											width="12"
											height="12"
											viewBox="0 0 24 24"
											fill="currentColor"
										>
											<polyline points="20,6 9,17 4,12" />
										</svg>
									)}
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Secondary Action Group */}
			<div className="tree-actions-group secondary">
				{/* Show Files Toggle (only in tree mode) */}
				{viewMode === 'tree' && (
					<button
						className={`tree-action-btn files-toggle ${showFilesInTree ? 'active' : ''}`}
						onClick={() => onToggleFiles(!showFilesInTree)}
						title={`${showFilesInTree ? 'Hide' : 'Show'} files in tree`}
						aria-label={`${showFilesInTree ? 'Hide' : 'Show'} files in tree`}
						aria-pressed={showFilesInTree}
					>
						<Icons.Files />
					</button>
				)}

				{/* Tree Operations (only in tree mode) */}
				{viewMode === 'tree' && (
					<>
						<button
							className="tree-action-btn expand-all"
							onClick={onExpandAll}
							title="Expand all folders"
							aria-label="Expand all folders"
						>
							<Icons.ExpandAll />
						</button>

						<button
							className="tree-action-btn collapse-all"
							onClick={onCollapseAll}
							title="Collapse all folders"
							aria-label="Collapse all folders"
						>
							<Icons.CollapseAll />
						</button>
					</>
				)}

				{/* Refresh Button */}
				<button
					className={`tree-action-btn refresh ${isRefreshing ? 'refreshing' : ''}`}
					onClick={handleRefresh}
					disabled={isRefreshing}
					title="Refresh tree"
					aria-label="Refresh tree"
				>
					<Icons.Refresh />
				</button>
			</div>

			{/* Status Display (compact mode only) */}
			{isCompact && (
				<div className="tree-actions-status">
					{hasFilter && (
						<span
							className="tree-status-filter"
							title={`${filteredCount} items filtered`}
						>
							{visibleItems}/{totalItems}
						</span>
					)}
				</div>
			)}
		</div>
	);
};
