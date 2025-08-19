import React, { useRef, useMemo } from 'react';
import { TAbstractFile, TFolder } from 'obsidian';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FilePaneProps } from '../types/interfaces';
import { FileItem } from './FileItem';
import { BreadcrumbNavigation } from '../components/BreadcrumbNavigation';
import { FileFilter } from '../components/FileFilter';

export const FilePane: React.FC<FilePaneProps> = ({
	paneState,
	onStateChange,
	onFileClick,
	onFileContextMenu,
	onNavigateToFolder,
	onFilterChange,
	onFilterToggle,
	onFilterClear,
}) => {
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

	// Set up virtualizer
	const virtualizer = useVirtualizer({
		count: files.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 36, // Height of each file item in pixels
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

	return (
		<div
			className={`file-pane ${paneState.isActive ? 'active' : 'inactive'}`}
			data-pane-id={paneState.id}
		>
			{/* Individual pane header */}
			<div className="pane-header">
				<div className="pane-path">
					<BreadcrumbNavigation
						currentFolder={paneState.currentFolder}
						onNavigateToFolder={onNavigateToFolder}
						isActive={paneState.isActive}
					/>
					<span className="pane-file-count">
						({files.length} item{files.length !== 1 ? 's' : ''})
					</span>
				</div>
				<div className="pane-status">
					{paneState.selectedFiles.size > 0 && (
						<span className="pane-selection-count">
							{paneState.selectedFiles.size} selected
						</span>
					)}
					{paneState.isActive && (
						<span className="pane-active-indicator" title="Active pane">
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

			{files.length === 0 ? (
				<div className="file-list-empty">
					<p>No files in this directory</p>
				</div>
			) : (
				<div
					ref={parentRef}
					className="file-list file-list-virtual"
					style={{
						height: '100%',
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
	);
};
