import React, { useState, useEffect, useRef } from 'react';
import { TAbstractFile } from 'obsidian';
import { FilePane } from './FilePane';
import { ResizeHandle } from '../components/ResizeHandle';
import { DualPaneManagerProps } from '../types/interfaces';

export const DualPaneManager: React.FC<DualPaneManagerProps> = ({
	leftPane,
	rightPane,
	onPaneStateChange,
	onFileClick,
	onFileContextMenu,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerHeight, setContainerHeight] = useState(400); // Default height
	const [topPaneHeight, setTopPaneHeight] = useState(200); // Default to 50%
	const [bottomPaneHeight, setBottomPaneHeight] = useState(200);

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
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				updateHeight();
			}
		});
		
		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		return () => {
			clearTimeout(timeoutId);
			resizeObserver.disconnect();
		};
	}, []);

	const handleResize = (newTopHeight: number, newBottomHeight: number) => {
		setTopPaneHeight(newTopHeight);
		setBottomPaneHeight(newBottomHeight);
	};

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
		// Navigation is handled by the parent view for now
		console.log('Navigate to folder in left pane:', folder.name);
	};

	const handleRightNavigateToFolder = (folder: any) => {
		// Navigation is handled by the parent view for now
		console.log('Navigate to folder in right pane:', folder.name);
	};

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
				/>
			</div>

			{/* Resize handle */}
			<div
				className="resize-handle"
				onMouseDown={(e) => {
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
						const newTopHeight = Math.max(100, Math.min(availableHeight - 100, startTopHeight + deltaY));
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
				/>
			</div>
		</div>
	);
};
