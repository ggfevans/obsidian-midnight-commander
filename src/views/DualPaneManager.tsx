import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TAbstractFile } from 'obsidian';
import { FilePane } from './FilePane';
import { QuickSearch } from '../components/QuickSearch';
import { FilePreview } from '../components/FilePreview';
import { ResizeHandle } from '../components/ResizeHandle';
import { DualPaneManagerProps } from '../types/interfaces';

export const DualPaneManager: React.FC<DualPaneManagerProps> = ({
	app,
	leftPane,
	rightPane,
	layoutOrientation,
	settings,
	onPaneStateChange,
	onFileClick,
	onFileContextMenu,
	onNavigateToFolder,
	onFilterChange,
	onFilterToggle,
	onFilterClear,
	onPaneSizeChange,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	// Container dimensions
	const [containerHeight, setContainerHeight] = useState(400);
	const [containerWidth, setContainerWidth] = useState(800);

	// Vertical layout dimensions (current implementation)
	const [topPaneHeight, setTopPaneHeight] = useState(200);
	const [bottomPaneHeight, setBottomPaneHeight] = useState(200);

	// Horizontal layout dimensions
	const [leftPaneWidth, setLeftPaneWidth] = useState(400);
	const [rightPaneWidth, setRightPaneWidth] = useState(400);

	// Quick search state
	const [showLeftSearch, setShowLeftSearch] = useState(false);
	const [showRightSearch, setShowRightSearch] = useState(false);

	// File preview state
	const [showFilePreview, setShowFilePreview] = useState(false);
	const [previewFile, setPreviewFile] = useState<TAbstractFile | null>(null);

	// Debounced save function to prevent excessive settings saves during resize
	const debouncedSave = useCallback(
		(() => {
			let timeoutId: NodeJS.Timeout;
			return (
				orientation: 'vertical' | 'horizontal',
				sizes: {
					topPaneHeight?: number;
					bottomPaneHeight?: number;
					leftPaneWidth?: number;
					rightPaneWidth?: number;
				}
			) => {
				clearTimeout(timeoutId);
				timeoutId = setTimeout(() => {
					if (settings.rememberPaneSizes && onPaneSizeChange) {
						onPaneSizeChange(orientation, sizes);
					}
				}, 100); // 100ms debounce
			};
		})(),
		[settings.rememberPaneSizes, onPaneSizeChange]
	);

	// Load saved pane sizes from settings on mount and orientation change
	useEffect(() => {
		if (settings.rememberPaneSizes) {
			if (layoutOrientation === 'vertical' && settings.verticalPaneSizes) {
				// Validate saved sizes are reasonable (not zero or negative)
				const topHeight = settings.verticalPaneSizes.topPaneHeight;
				const bottomHeight = settings.verticalPaneSizes.bottomPaneHeight;
				if (topHeight > 50 && bottomHeight > 50) {
					setTopPaneHeight(topHeight);
					setBottomPaneHeight(bottomHeight);
				}
			} else if (
				layoutOrientation === 'horizontal' &&
				settings.horizontalPaneSizes
			) {
				// Validate saved sizes are reasonable (not zero or negative)
				const leftWidth = settings.horizontalPaneSizes.leftPaneWidth;
				const rightWidth = settings.horizontalPaneSizes.rightPaneWidth;
				if (leftWidth > 50 && rightWidth > 50) {
					setLeftPaneWidth(leftWidth);
					setRightPaneWidth(rightWidth);
				}
			}
		}
	}, [
		layoutOrientation,
		settings.rememberPaneSizes,
		settings.verticalPaneSizes,
		settings.horizontalPaneSizes,
	]);

	// Update container dimensions when the component mounts or resizes
	useEffect(() => {
		const updateDimensions = () => {
			if (containerRef.current) {
				const height = containerRef.current.clientHeight;
				const width = containerRef.current.clientWidth;

				if (height > 0 && width > 0) {
					setContainerHeight(height);
					setContainerWidth(width);

					const handleSize = 8; // Size of resize handle

					// Only initialize with 50/50 split if no saved sizes
					if (layoutOrientation === 'vertical') {
						if (!settings.rememberPaneSizes || !settings.verticalPaneSizes) {
							// Initialize vertical layout with 50/50 split
							const availableHeight = height - handleSize;
							const newTopHeight = Math.floor(availableHeight * 0.5);
							const newBottomHeight = availableHeight - newTopHeight;

							setTopPaneHeight(newTopHeight);
							setBottomPaneHeight(newBottomHeight);
						}
					} else {
						if (!settings.rememberPaneSizes || !settings.horizontalPaneSizes) {
							// Initialize horizontal layout with 50/50 split
							const availableWidth = width - handleSize;
							const newLeftWidth = Math.floor(availableWidth * 0.5);
							const newRightWidth = availableWidth - newLeftWidth;

							setLeftPaneWidth(newLeftWidth);
							setRightPaneWidth(newRightWidth);
						}
					}
				}
			}
		};

		// Try to get dimensions after a small delay to ensure DOM is ready
		const timeoutId = setTimeout(updateDimensions, 100);

		// Add resize observer to track container size changes
		const resizeObserver = new ResizeObserver(() => {
			updateDimensions();
		});

		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		return () => {
			clearTimeout(timeoutId);
			resizeObserver.disconnect();
		};
	}, [
		layoutOrientation,
		settings.rememberPaneSizes,
		settings.verticalPaneSizes,
		settings.horizontalPaneSizes,
	]);

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

	// Vertical resize handlers
	const handleVerticalResize = (delta: number) => {
		const handleHeight = 8;
		const availableHeight = containerHeight - handleHeight;
		const newTopHeight = Math.max(
			100,
			Math.min(availableHeight - 100, topPaneHeight + delta)
		);
		const newBottomHeight = availableHeight - newTopHeight;

		setTopPaneHeight(newTopHeight);
		setBottomPaneHeight(newBottomHeight);

		// Use debounced save to prevent excessive settings saves
		debouncedSave('vertical', {
			topPaneHeight: newTopHeight,
			bottomPaneHeight: newBottomHeight,
		});
	};

	const handleVerticalReset = () => {
		const handleHeight = 8;
		const availableHeight = containerHeight - handleHeight;
		const resetHeight = Math.floor(availableHeight / 2);
		setTopPaneHeight(resetHeight);
		setBottomPaneHeight(availableHeight - resetHeight);
	};

	// Horizontal resize handlers
	const handleHorizontalResize = (delta: number) => {
		const handleWidth = 8;
		const availableWidth = containerWidth - handleWidth;
		const newLeftWidth = Math.max(
			100,
			Math.min(availableWidth - 100, leftPaneWidth + delta)
		);
		const newRightWidth = availableWidth - newLeftWidth;

		setLeftPaneWidth(newLeftWidth);
		setRightPaneWidth(newRightWidth);

		// Use debounced save to prevent excessive settings saves
		debouncedSave('horizontal', {
			leftPaneWidth: newLeftWidth,
			rightPaneWidth: newRightWidth,
		});
	};

	const handleHorizontalReset = () => {
		const handleWidth = 8;
		const availableWidth = containerWidth - handleWidth;
		const resetWidth = Math.floor(availableWidth / 2);
		setLeftPaneWidth(resetWidth);
		setRightPaneWidth(availableWidth - resetWidth);
	};

	const renderVerticalLayout = () => (
		<>
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

			{/* Vertical resize handle */}
			<ResizeHandle
				orientation="vertical"
				onResize={handleVerticalResize}
				onReset={handleVerticalReset}
			/>

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
		</>
	);

	const renderHorizontalLayout = () => (
		<>
			{/* Left pane */}
			<div
				className="pane-container pane-left"
				style={{ width: `${leftPaneWidth}px` }}
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

			{/* Horizontal resize handle */}
			<ResizeHandle
				orientation="horizontal"
				onResize={handleHorizontalResize}
				onReset={handleHorizontalReset}
			/>

			{/* Right pane */}
			<div
				className="pane-container pane-right"
				style={{ width: `${rightPaneWidth}px` }}
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
		</>
	);

	return (
		<div
			ref={containerRef}
			className={`midnight-commander-dual-pane ${layoutOrientation}`}
		>
			{layoutOrientation === 'vertical'
				? renderVerticalLayout()
				: renderHorizontalLayout()}

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
