import React, { useRef, useMemo } from 'react';
import { TAbstractFile, TFolder, TFile } from 'obsidian';
import { useVirtualizer } from '@tanstack/react-virtual';
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
		// Activate this pane when clicked (if not already active)
		if (!paneState.isActive) {
			onStateChange({ isActive: true });
		}
		
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

	// Virtual scrolling setup
	const parentRef = useRef<HTMLDivElement>(null);
	
	// Memoize files to avoid unnecessary re-renders
	const files = useMemo(() => paneState.files, [paneState.files]);
	
	// Set up virtualizer
	const virtualizer = useVirtualizer({
		count: files.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 36, // Height of each file item in pixels
		overscan: 5, // Render 5 extra items outside viewport
	});
	
	// Ensure selected item is visible when it changes
	React.useEffect(() => {
		if (paneState.selectedIndex >= 0 && paneState.selectedIndex < files.length) {
			virtualizer.scrollToIndex(paneState.selectedIndex, { align: 'auto' });
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
					<span className="pane-title">
						{paneState.currentFolder.path || '/'}
					</span>
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
						{virtualizer.getVirtualItems().map((virtualItem) => {
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
										isSelected={paneState.isActive && virtualItem.index === paneState.selectedIndex}
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
