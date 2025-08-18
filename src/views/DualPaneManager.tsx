import React from 'react';
import { TAbstractFile } from 'obsidian';
import { FilePane } from './FilePane';
import { DualPaneManagerProps } from '../types/interfaces';

export const DualPaneManager: React.FC<DualPaneManagerProps> = ({
	leftPane,
	rightPane,
	onPaneStateChange,
	onFileClick,
	onFileContextMenu,
}) => {
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
		<div className="midnight-commander-dual-pane">
			<div className="midnight-commander-panes">
				<FilePane
					paneState={leftPane}
					onStateChange={handleLeftPaneStateChange}
					onFileClick={handleLeftFileClick}
					onFileContextMenu={handleLeftFileContextMenu}
					onNavigateToFolder={handleLeftNavigateToFolder}
				/>
				
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
