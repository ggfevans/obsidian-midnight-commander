import React from 'react';
import { TAbstractFile, TFolder, TFile } from 'obsidian';
import { FilePaneProps } from '../types/interfaces';
import { FileItem } from './FileItem';

export const FilePane: React.FC<FilePaneProps> = ({
	paneState,
	onStateChange,
	onFileClick,
	onFileContextMenu,
	onNavigateToFolder,
}) => {
	const handleFileItemClick = (file: TAbstractFile, event: React.MouseEvent) => {
		// Update selection in pane state
		const fileIndex = paneState.files.indexOf(file);
		if (fileIndex >= 0) {
			onStateChange({ selectedIndex: fileIndex });
		}
		
		// Handle file click
		onFileClick(file);
	};

	const handleFileItemDoubleClick = (file: TAbstractFile, event: React.MouseEvent) => {
		if (file instanceof TFolder) {
			onNavigateToFolder(file);
		} else {
			// Open file in new tab on double-click
			onFileClick(file, { newTab: true });
		}
	};

	const handleFileItemContextMenu = (file: TAbstractFile, event: React.MouseEvent) => {
		event.preventDefault();
		onFileContextMenu(file, { x: event.clientX, y: event.clientY });
	};

	const getFileIcon = (file: TAbstractFile): string => {
		if (file instanceof TFolder) {
			return 'folder';
		} else if (file instanceof TFile) {
			const extension = file.extension.toLowerCase();
			switch (extension) {
				case 'md':
					return 'document';
				case 'pdf':
					return 'file-text';
				case 'png':
				case 'jpg':
				case 'jpeg':
				case 'gif':
				case 'svg':
					return 'image';
				default:
					return 'file';
			}
		}
		return 'file';
	};

	return (
		<div 
			className={`file-pane ${paneState.isActive ? 'active' : 'inactive'}`}
			data-pane-id={paneState.id}
		>
			<div className="file-list">
				{paneState.files.map((file, index) => (
					<FileItem
						key={file.path}
						file={file}
						isSelected={index === paneState.selectedIndex}
						isHighlighted={paneState.selectedFiles.has(file.path)}
						onClick={handleFileItemClick}
						onContextMenu={handleFileItemContextMenu}
						onDoubleClick={handleFileItemDoubleClick}
					/>
				))}
			</div>
		</div>
	);
};
