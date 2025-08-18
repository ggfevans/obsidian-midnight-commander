import React from 'react';
import { TAbstractFile, TFolder, TFile } from 'obsidian';
import { FileItemProps } from '../types/interfaces';

export const FileItem: React.FC<FileItemProps> = ({
	file,
	isSelected,
	isHighlighted,
	onClick,
	onContextMenu,
	onDoubleClick,
}) => {
	const handleClick = (event: React.MouseEvent) => {
		onClick(file, event);
	};

	const handleContextMenu = (event: React.MouseEvent) => {
		onContextMenu(file, event);
	};

	const handleDoubleClick = (event: React.MouseEvent) => {
		onDoubleClick(file, event);
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
				case 'mp3':
				case 'wav':
				case 'ogg':
				case 'm4a':
					return 'audio-file';
				case 'mp4':
				case 'avi':
				case 'mov':
				case 'mkv':
					return 'video';
				default:
					return 'file';
			}
		}
		return 'file';
	};

	const getFileName = (file: TAbstractFile): string => {
		return file.name;
	};

	const getFileSize = (file: TAbstractFile): string => {
		if (file instanceof TFile) {
			const size = file.stat.size;
			if (size < 1024) {
				return `${size} B`;
			} else if (size < 1024 * 1024) {
				return `${Math.round(size / 1024)} KB`;
			} else {
				return `${Math.round(size / (1024 * 1024))} MB`;
			}
		} else if (file instanceof TFolder) {
			const count = file.children.length;
			return `${count} item${count !== 1 ? 's' : ''}`;
		}
		return '';
	};

	// Use semantic classes following Obsidian's navigation patterns
	const className = [
		'file-item',
		'nav-file', // Use nav-file class for consistency with Obsidian
		isSelected ? 'is-active' : '', // Cursor position (only show on active pane)
		isHighlighted ? 'is-selected' : '', // Multi-selection state
		file instanceof TFolder ? 'folder' : 'file',
	]
		.filter(Boolean)
		.join(' ');

	return (
		<div
			className={className}
			onClick={handleClick}
			onContextMenu={handleContextMenu}
			onDoubleClick={handleDoubleClick}
			title={file.path}
		>
			<div className="file-item-icon">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className={`lucide lucide-${getFileIcon(file)}`}
				>
					{getFileIcon(file) === 'folder' && (
						<>
							<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
						</>
					)}
					{getFileIcon(file) === 'document' && (
						<>
							<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
							<polyline points="14,2 14,8 20,8" />
						</>
					)}
					{getFileIcon(file) === 'file' && (
						<>
							<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
							<polyline points="14,2 14,8 20,8" />
						</>
					)}
					{getFileIcon(file) === 'image' && (
						<>
							<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
							<circle cx="9" cy="9" r="2" />
							<path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
						</>
					)}
					{getFileIcon(file) === 'file-text' && (
						<>
							<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
							<polyline points="14,2 14,8 20,8" />
							<line x1="16" y1="13" x2="8" y2="13" />
							<line x1="16" y1="17" x2="8" y2="17" />
							<polyline points="10,9 9,9 8,9" />
						</>
					)}
				</svg>
			</div>
			<div className="file-item-content">
				<div className="file-item-name">{getFileName(file)}</div>
				<div className="file-item-size">{getFileSize(file)}</div>
			</div>
		</div>
	);
};
