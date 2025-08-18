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
					// Initialize with 50/50 split if not set
					if (topPaneHeight + bottomPaneHeight !== height) {
						setTopPaneHeight(height * 0.5);
						setBottomPaneHeight(height * 0.5);
					}
				}
			}
		};

		updateHeight();
		
		// Add resize observer to track container size changes
		const resizeObserver = new ResizeObserver(updateHeight);
		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		return () => {
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
			<div className="midnight-commander-panes-container">
				{/* Top pane (left in our context) */}
				<div 
					className="pane-container pane-top"
					style={{ height: topPaneHeight }}
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
				<ResizeHandle
					onResize={handleResize}
					containerHeight={containerHeight}
					initialTopHeight={topPaneHeight}
				/>

				{/* Bottom pane (right in our context) */}
				<div 
					className="pane-container pane-bottom"
					style={{ height: bottomPaneHeight }}
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
		</div>
	);
};
