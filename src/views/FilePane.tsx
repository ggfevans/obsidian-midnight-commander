import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import { TAbstractFile, TFolder, TFile, setIcon } from 'obsidian';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRecoilState } from 'recoil';
import { FilePaneProps } from '../types/interfaces';
import { FileItem } from './FileItem';
import { BreadcrumbNavigation } from '../components/BreadcrumbNavigation';
import { FileFilter } from '../components/FileFilter';
import { FolderTree } from '../components/FolderTree/FolderTree';
import {
	viewModeState,
	sortByState,
	showFilesInTreeState,
	searchQueryState,
	PaneId,
} from '../state/treeState';

export const FilePane: React.FC<FilePaneProps> = ({
	app,
	paneState,
	onStateChange,
	onFileClick,
	onFileContextMenu,
	onNavigateToFolder,
	onFilterChange,
	onFilterToggle,
	onFilterClear,
	onMouseEnter,
	onMouseLeave,
}) => {
	// Determine pane ID from paneState.id
	const paneId: PaneId = paneState.id;

	// Refs for icon buttons
	const searchBtnRef = useRef<HTMLButtonElement>(null);
	const filterBtnRef = useRef<HTMLButtonElement>(null);

	// Tree state management with Recoil
	const [viewMode] = useRecoilState(viewModeState(paneId));
	const [sortBy] = useRecoilState(sortByState(paneId));
	const [showFilesInTree] = useRecoilState(showFilesInTreeState(paneId));
	const [searchQuery] = useRecoilState(searchQueryState(paneId));

	// Tree operation handlers (for future use)

	// Header button handlers - integrate with existing FileFilter functionality
	const handleSearchToggle = useCallback(() => {
		// Toggle the existing FileFilter component
		if (onFilterToggle) {
			onFilterToggle(!paneState.filter?.isActive);
		}
	}, [onFilterToggle, paneState.filter?.isActive]);

	const handleFilterToggle = useCallback(() => {
		// Toggle the existing FileFilter component
		if (onFilterToggle) {
			onFilterToggle(!paneState.filter?.isActive);
		}
	}, [onFilterToggle, paneState.filter?.isActive]);

	// Helper function to select a range of files
	const selectFileRange = (
		startIndex: number,
		endIndex: number
	): Set<string> => {
		const newSelection = new Set<string>();
		const start = Math.min(startIndex, endIndex);
		const end = Math.max(startIndex, endIndex);

		for (let i = start; i <= end; i++) {
			if (i >= 0 && i < paneState.files.length) {
				newSelection.add(paneState.files[i].path);
			}
		}

		return newSelection;
	};
	const handleFileItemClick = (
		file: TAbstractFile,
		event: React.MouseEvent
	) => {
		// Activate this pane when clicked (if not already active)
		if (!paneState.isActive) {
			onStateChange({ isActive: true });
		}

		const fileIndex = paneState.files.indexOf(file);
		if (fileIndex < 0) return;

		// Handle Shift+click for range selection
		if (event.shiftKey && paneState.lastClickedIndex !== undefined) {
			// Select range from lastClickedIndex to current index
			const rangeSelection = selectFileRange(
				paneState.lastClickedIndex,
				fileIndex
			);
			onStateChange({
				selectedIndex: fileIndex,
				selectedFiles: rangeSelection,
			});
		} else if (event.ctrlKey || event.metaKey) {
			// Ctrl+click for individual toggle selection
			const newSelection = new Set(paneState.selectedFiles);
			if (newSelection.has(file.path)) {
				newSelection.delete(file.path);
			} else {
				newSelection.add(file.path);
			}
			onStateChange({
				selectedIndex: fileIndex,
				selectedFiles: newSelection,
				lastClickedIndex: fileIndex,
			});
		} else {
			// Regular click - clear multi-selection and select single file
			onStateChange({
				selectedIndex: fileIndex,
				selectedFiles: new Set(),
				lastClickedIndex: fileIndex,
			});
		}

		// Handle file click
		onFileClick(file);
	};

	const handleFileItemDoubleClick = (
		file: TAbstractFile,
		event: React.MouseEvent
	) => {
		if (file instanceof TFolder) {
			onNavigateToFolder(file);
		} else {
			// Open file in new tab on double-click
			onFileClick(file, { newTab: true });
		}
	};

	const handleFileItemContextMenu = (
		file: TAbstractFile,
		event: React.MouseEvent
	) => {
		event.preventDefault();
		onFileContextMenu(file, { x: event.clientX, y: event.clientY });
	};

	// Virtual scrolling setup
	const parentRef = useRef<HTMLDivElement>(null);

	// Memoize files to avoid unnecessary re-renders
	const files = useMemo(() => {
		if (paneState.filter?.isActive && paneState.filter.filteredFiles) {
			return paneState.filter.filteredFiles;
		}
		return paneState.files;
	}, [paneState.files, paneState.filter]);

	// Calculate file and folder counts with sizes (UX audit requirement)
	const counts = useMemo(() => {
		const folders = files.filter(f => f instanceof TFolder);
		const filesOnly = files.filter(f => f instanceof TFile);

		// Calculate total size of files
		const totalSize = filesOnly.reduce((sum, file) => {
			return sum + (file as TFile).stat.size;
		}, 0);

		// Format size function
		const formatSize = (bytes: number): string => {
			if (bytes < 1024) return `${bytes} B`;
			if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
			if (bytes < 1024 * 1024 * 1024)
				return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
			return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
		};

		return {
			total: files.length,
			folders: folders.length,
			files: filesOnly.length,
			totalSize,
			totalSizeFormatted: formatSize(totalSize),
		};
	}, [files]);

	// Set up virtualizer
	const virtualizer = useVirtualizer({
		count: files.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 24, // Height of each file item - UX audit requirement (24px)
		overscan: 5, // Render 5 extra items outside viewport
	});

	// Ensure selected item is visible when it changes, but only scroll if it's not already visible
	React.useEffect(() => {
		if (
			paneState.selectedIndex >= 0 &&
			paneState.selectedIndex < files.length
		) {
			// Only scroll if the selected item is not currently visible
			const virtualItems = virtualizer.getVirtualItems();
			const isVisible = virtualItems.some(
				item => item.index === paneState.selectedIndex
			);

			if (!isVisible) {
				virtualizer.scrollToIndex(paneState.selectedIndex, { align: 'center' });
			}
		}
	}, [paneState.selectedIndex, virtualizer, files.length]);

	// Set icons for header buttons
	useEffect(() => {
		if (searchBtnRef.current) {
			setIcon(searchBtnRef.current, 'search');
		}
		if (filterBtnRef.current) {
			setIcon(filterBtnRef.current, 'filter');
		}
	}, []);

	return (
		<div
			className={`file-pane ${paneState.isActive ? 'active' : 'inactive'}`}
			data-pane-id={paneState.id}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			{/* Updated pane header with new layout */}
			<div className="mc-pane-header">
				{/* Left side: breadcrumb */}
				<div className="mc-breadcrumb">
					<BreadcrumbNavigation
						currentFolder={paneState.currentFolder}
						onNavigateToFolder={onNavigateToFolder}
						isActive={paneState.isActive}
					/>
				</div>

				{/* Right side: controls */}
				<div className="mc-pane-controls">
					{/* Search button */}
					<button
						ref={searchBtnRef}
						className={`mc-control-btn ${paneState.filter?.isActive ? 'active' : ''}`}
						aria-label="Search"
						title="Search files"
						onClick={handleSearchToggle}
					></button>

					{/* Filter button */}
					<button
						ref={filterBtnRef}
						className={`mc-control-btn ${paneState.filter?.isActive ? 'active' : ''}`}
						aria-label="Filter"
						title="Filter options"
						onClick={handleFilterToggle}
					></button>

					{/* Selection count when items selected */}
					{paneState.selectedFiles.size > 0 && (
						<span className="mc-selection-indicator">
							{paneState.selectedFiles.size}
						</span>
					)}

					{/* Active pane indicator */}
					{paneState.isActive && (
						<span className="mc-active-indicator" title="Active pane">
							●
						</span>
					)}
				</div>
			</div>

			{/* File Filter */}
			{onFilterChange && onFilterToggle && onFilterClear && (
				<FileFilter
					paneId={paneState.id}
					filterState={paneState.filter}
					onFilterChange={onFilterChange}
					onFilterToggle={onFilterToggle}
					onFilterClear={onFilterClear}
				/>
			)}

			{/* Content area - flex container for remaining space */}
			<div
				className="file-pane-content"
				style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
			>
				{/* Conditional rendering based on view mode */}
				{viewMode === 'tree' ? (
					/* Tree View */
					<FolderTree
						app={app}
						rootFolder={paneState.currentFolder}
						paneId={paneId}
						isActive={paneState.isActive}
						onNavigateToFolder={onNavigateToFolder}
						onFileClick={onFileClick}
						onContextMenu={(item, event) =>
							onFileContextMenu(item, { x: event.clientX, y: event.clientY })
						}
						height={window.innerHeight - 200} // Adjust based on header/filter heights
						width={300} // Will be styled with CSS
						showFileCount={true}
						sortBy={sortBy}
						searchQuery={searchQuery}
						showFilesInTree={showFilesInTree}
						maxRenderDepth={50}
					/>
				) : /* List View (original virtual scrolling) */
				files.length === 0 ? (
					<div className="file-list-empty">
						<p>This folder is empty</p>
						<span
							style={{
								fontSize: 'var(--font-ui-small)',
								opacity: 0.6,
								marginTop: 'var(--size-2-2)',
							}}
						>
							{paneState.filter?.isActive
								? 'Try adjusting your search filters'
								: 'No files or folders to display'}
						</span>
					</div>
				) : (
					<div
						ref={parentRef}
						className="file-list file-list-virtual"
						style={{
							overflowY: 'auto',
							overflowX: 'hidden',
						}}
					>
						<div
							style={{
								height: `${virtualizer.getTotalSize()}px`,
								width: '100%',
								position: 'relative',
							}}
						>
							{virtualizer.getVirtualItems().map(virtualItem => {
								const file = files[virtualItem.index];
								if (!file) return null;

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
										{/* Only show cursor selection on active pane */}
										{/* Multi-selection can show on any pane, but only when files are actually selected */}
										<FileItem
											file={file}
											isSelected={
												paneState.isActive &&
												virtualItem.index === paneState.selectedIndex
											}
											isHighlighted={paneState.selectedFiles.has(file.path)}
											onClick={handleFileItemClick}
											onContextMenu={handleFileItemContextMenu}
											onDoubleClick={handleFileItemDoubleClick}
										/>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>

			{/* Status Bar - UX audit requirement */}
			<div className="pane-status-bar">
				<div className="pane-status-info">
					{counts.total} item{counts.total !== 1 ? 's' : ''}
					{counts.totalSize > 0 && ` • ${counts.totalSizeFormatted}`}
					{paneState.selectedFiles.size > 0 &&
						` • ${paneState.selectedFiles.size} selected`}
				</div>
			</div>
		</div>
	);
};
