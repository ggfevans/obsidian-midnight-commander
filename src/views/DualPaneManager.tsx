import React, { useState, useEffect, useRef } from 'react';
import { TAbstractFile } from 'obsidian';
import { FilePane } from './FilePane';
import { QuickSearch } from '../components/QuickSearch';
import { FilePreview } from '../components/FilePreview';
import { DualPaneManagerProps } from '../types/interfaces';

export const DualPaneManager: React.FC<DualPaneManagerProps> = ({
	app,
	leftPane,
	rightPane,
	onPaneStateChange,
	onFileClick,
	onFileContextMenu,
	onNavigateToFolder,
	onFilterChange,
	onFilterToggle,
	onFilterClear,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerHeight, setContainerHeight] = useState(400); // Default height
	const [topPaneHeight, setTopPaneHeight] = useState(200); // Default to 50%
	const [bottomPaneHeight, setBottomPaneHeight] = useState(200);

	// Quick search state
	const [showLeftSearch, setShowLeftSearch] = useState(false);
	const [showRightSearch, setShowRightSearch] = useState(false);

	// File preview state
	const [showFilePreview, setShowFilePreview] = useState(false);
	const [previewFile, setPreviewFile] = useState<TAbstractFile | null>(null);

	// Update container height when the component mounts or resizes
	useEffect(() => {
		const updateHeight = () => {
			if (containerRef.current) {
				const height = containerRef.current.clientHeight;
				if (height > 0) {
					setContainerHeight(height);
					// Initialize with 50/50 split accounting for handle height
					const handleHeight = 8; // Height of resize handle
					const availableHeight = height - handleHeight;
					const newTopHeight = Math.floor(availableHeight * 0.5);
					const newBottomHeight = availableHeight - newTopHeight; // Ensure exact fit

					setTopPaneHeight(newTopHeight);
					setBottomPaneHeight(newBottomHeight);
				}
			}
		};

		// Try to get height after a small delay to ensure DOM is ready
		const timeoutId = setTimeout(updateHeight, 100);

		// Add resize observer to track container size changes
		const resizeObserver = new ResizeObserver(() => {
			updateHeight();
		});

		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		return () => {
			clearTimeout(timeoutId);
			resizeObserver.disconnect();
		};
	}, []);

	// Event handlers
	const handleLeftPaneStateChange = (newState: any) => {
		onPaneStateChange('left', newState);
	};

	const handleRightPaneStateChange = (newState: any) => {
		onPaneStateChange('right', newState);
	};

	const handleLeftFileClick = (file: TAbstractFile, options?: any) => {
		onFileClick(file, 'left', options);
	};

	const handleRightFileClick = (file: TAbstractFile, options?: any) => {
		onFileClick(file, 'right', options);
	};

	const handleLeftFileContextMenu = (file: TAbstractFile, position: any) => {
		onFileContextMenu(file, 'left', position);
	};

	const handleRightFileContextMenu = (file: TAbstractFile, position: any) => {
		onFileContextMenu(file, 'right', position);
	};

	const handleLeftNavigateToFolder = (folder: any) => {
		onNavigateToFolder(folder, 'left');
	};

	const handleRightNavigateToFolder = (folder: any) => {
		onNavigateToFolder(folder, 'right');
	};

	// Quick search handlers
	const handleLeftSearch = (
		_query: string,
		_filteredFiles: TAbstractFile[]
	) => {
		// Search functionality handled by filter component
	};

	const handleRightSearch = (
		_query: string,
		_filteredFiles: TAbstractFile[]
	) => {
		// Search functionality handled by filter component
	};

	const handleLeftSearchClose = () => {
		setShowLeftSearch(false);
	};

	const handleRightSearchClose = () => {
		setShowRightSearch(false);
	};

	const handleLeftSearchSelect = (file: TAbstractFile) => {
		// Select the file in the left pane and close search
		const fileIndex = leftPane.files.findIndex(f => f.path === file.path);
		if (fileIndex >= 0) {
			onPaneStateChange('left', { selectedIndex: fileIndex });
		}
		handleLeftSearchClose();
	};

	const handleRightSearchSelect = (file: TAbstractFile) => {
		// Select the file in the right pane and close search
		const fileIndex = rightPane.files.findIndex(f => f.path === file.path);
		if (fileIndex >= 0) {
			onPaneStateChange('right', { selectedIndex: fileIndex });
		}
		handleRightSearchClose();
	};

	// File preview handlers
	const handleShowFilePreview = () => {
		const activePane = leftPane.isActive ? leftPane : rightPane;
		const selectedFile = activePane.files[activePane.selectedIndex];

		if (selectedFile) {
			setPreviewFile(selectedFile);
			setShowFilePreview(true);
		}
	};

	const handleCloseFilePreview = () => {
		setShowFilePreview(false);
		setPreviewFile(null);
	};

	// Expose search toggle functions and file preview function
	useEffect(() => {
		// Attach toggle functions to global window object for access from MidnightCommanderView
		(window as any).toggleLeftSearch = () => {
			if (leftPane.isActive) {
				setShowLeftSearch(!showLeftSearch);
				if (showLeftSearch) {
					handleLeftSearchClose();
				}
			}
		};

		(window as any).toggleRightSearch = () => {
			if (rightPane.isActive) {
				setShowRightSearch(!showRightSearch);
				if (showRightSearch) {
					handleRightSearchClose();
				}
			}
		};

		(window as any).toggleQuickSearch = () => {
			if (leftPane.isActive) {
				setShowLeftSearch(!showLeftSearch);
				if (showLeftSearch) {
					handleLeftSearchClose();
				}
			} else if (rightPane.isActive) {
				setShowRightSearch(!showRightSearch);
				if (showRightSearch) {
					handleRightSearchClose();
				}
			}
		};

		// Expose file preview function globally
		(window as any).showFilePreview = handleShowFilePreview;

		return () => {
			// Cleanup global functions
			delete (window as any).toggleLeftSearch;
			delete (window as any).toggleRightSearch;
			delete (window as any).toggleQuickSearch;
			delete (window as any).showFilePreview;
		};
	}, [leftPane.isActive, rightPane.isActive, showLeftSearch, showRightSearch]);

	return (
		<div ref={containerRef} className="midnight-commander-dual-pane">
			{/* Top pane (left in our context) */}
			<div
				className="pane-container pane-top"
				style={{ height: `${topPaneHeight}px` }}
			>
				<FilePane
					paneState={leftPane}
					onStateChange={handleLeftPaneStateChange}
					onFileClick={handleLeftFileClick}
					onFileContextMenu={handleLeftFileContextMenu}
					onNavigateToFolder={handleLeftNavigateToFolder}
					onFilterChange={
						onFilterChange
							? options => onFilterChange('left', options)
							: undefined
					}
					onFilterToggle={
						onFilterToggle
							? isActive => onFilterToggle('left', isActive)
							: undefined
					}
					onFilterClear={
						onFilterClear ? () => onFilterClear('left') : undefined
					}
				/>
			</div>

			{/* Resize handle */}
			<div
				className="resize-handle"
				onMouseDown={e => {
					e.preventDefault();
					const startY = e.clientY;
					const startTopHeight = topPaneHeight;

					// Add dragging class
					const handleElement = e.currentTarget as HTMLElement;
					handleElement.classList.add('dragging');

					const handleMouseMove = (e: MouseEvent) => {
						const deltaY = e.clientY - startY;
						// Account for handle height in available space
						const handleHeight = 8;
						const availableHeight = containerHeight - handleHeight;
						const newTopHeight = Math.max(
							100,
							Math.min(availableHeight - 100, startTopHeight + deltaY)
						);
						const newBottomHeight = availableHeight - newTopHeight;

						setTopPaneHeight(newTopHeight);
						setBottomPaneHeight(newBottomHeight);
					};

					const handleMouseUp = () => {
						document.removeEventListener('mousemove', handleMouseMove);
						document.removeEventListener('mouseup', handleMouseUp);
						document.body.style.cursor = '';
						handleElement.classList.remove('dragging');
					};

					document.addEventListener('mousemove', handleMouseMove);
					document.addEventListener('mouseup', handleMouseUp);
					document.body.style.cursor = 'ns-resize';
				}}
				onDoubleClick={() => {
					const handleHeight = 8;
					const availableHeight = containerHeight - handleHeight;
					const resetHeight = Math.floor(availableHeight / 2);
					setTopPaneHeight(resetHeight);
					setBottomPaneHeight(availableHeight - resetHeight);
				}}
				title="Drag to resize panes (double-click to reset)"
			>
				<div className="resize-handle-grip">
					<div className="resize-handle-line" />
					<div className="resize-handle-dots">
						<span></span>
						<span></span>
						<span></span>
					</div>
					<div className="resize-handle-line" />
				</div>
			</div>

			{/* Bottom pane (right in our context) */}
			<div
				className="pane-container pane-bottom"
				style={{ height: `${bottomPaneHeight}px` }}
			>
				<FilePane
					paneState={rightPane}
					onStateChange={handleRightPaneStateChange}
					onFileClick={handleRightFileClick}
					onFileContextMenu={handleRightFileContextMenu}
					onNavigateToFolder={handleRightNavigateToFolder}
					onFilterChange={
						onFilterChange
							? options => onFilterChange('right', options)
							: undefined
					}
					onFilterToggle={
						onFilterToggle
							? isActive => onFilterToggle('right', isActive)
							: undefined
					}
					onFilterClear={
						onFilterClear ? () => onFilterClear('right') : undefined
					}
				/>
			</div>

			{/* Quick search overlays */}
			{showLeftSearch && (
				<QuickSearch
					files={leftPane.files}
					isVisible={showLeftSearch}
					onFilter={handleLeftSearch}
					onClose={handleLeftSearchClose}
					onSelect={handleLeftSearchSelect}
					placeholder={`Search in ${leftPane.currentFolder.name}...`}
				/>
			)}

			{showRightSearch && (
				<QuickSearch
					files={rightPane.files}
					isVisible={showRightSearch}
					onFilter={handleRightSearch}
					onClose={handleRightSearchClose}
					onSelect={handleRightSearchSelect}
					placeholder={`Search in ${rightPane.currentFolder.name}...`}
				/>
			)}

			{/* File preview overlay */}
			{showFilePreview && previewFile && (
				<FilePreview
					app={app}
					file={previewFile}
					isVisible={showFilePreview}
					onClose={handleCloseFilePreview}
				/>
			)}
		</div>
	);
};
