import React, { useRef, useEffect } from 'react';
import { TAbstractFile, TFolder, TFile, setIcon } from 'obsidian';
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

	// Icon ref to use with Obsidian's setIcon function
	const iconRef = useRef<HTMLSpanElement>(null);

	const getFileIcon = (file: TAbstractFile): string => {
		if (file instanceof TFolder) {
			return 'folder';
		} else if (file instanceof TFile) {
			const extension = file.extension.toLowerCase();
			switch (extension) {
				case 'md':
					return 'lucide-file-text';
				case 'pdf':
					return 'lucide-file-type-pdf';
				case 'png':
				case 'jpg':
				case 'jpeg':
				case 'gif':
				case 'svg':
				case 'webp':
					return 'lucide-image';
				case 'mp3':
				case 'wav':
				case 'ogg':
				case 'm4a':
				case 'flac':
					return 'lucide-audio-lines';
				case 'mp4':
				case 'avi':
				case 'mov':
				case 'mkv':
				case 'webm':
					return 'lucide-video';
				case 'zip':
				case 'rar':
				case '7z':
				case 'tar':
				case 'gz':
					return 'lucide-archive';
				case 'json':
					return 'lucide-braces';
				case 'csv':
					return 'lucide-table';
				default:
					return 'lucide-file';
			}
		}
		return 'lucide-file';
	};

	// Set Obsidian icon when component mounts or file changes
	useEffect(() => {
		if (iconRef.current) {
			const iconName = getFileIcon(file);
			setIcon(iconRef.current, iconName);
		}
	}, [file]);

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
			{/* Left side: icon and name */}
			<div className="file-item-left">
				<div className="file-item-icon">
					<span ref={iconRef} className="file-icon"></span>
				</div>
				<div className="file-item-name">{getFileName(file)}</div>
			</div>

			{/* Right side: metadata */}
			<div className="file-item-meta">
				{file instanceof TFolder ? (
					<span className="file-item-count">
						{file.children.length} item{file.children.length !== 1 ? 's' : ''}
					</span>
				) : (
					<span className="file-item-size">{getFileSize(file)}</span>
				)}
			</div>
		</div>
	);
};
