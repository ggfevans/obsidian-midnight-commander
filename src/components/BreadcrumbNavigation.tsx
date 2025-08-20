import React from 'react';
import { TFolder } from 'obsidian';

interface BreadcrumbNavigationProps {
	currentFolder: TFolder;
	onNavigateToFolder: (folder: TFolder) => void;
	isActive: boolean;
	className?: string;
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
	currentFolder,
	onNavigateToFolder,
	isActive,
	className = '',
}) => {
	/**
	 * Get the path segments from root to current folder
	 */
	const getPathSegments = (): { folder: TFolder; name: string }[] => {
		const segments: { folder: TFolder; name: string }[] = [];
		let current: TFolder | null = currentFolder;

		while (current) {
			segments.unshift({
				folder: current,
				name: current.name === '' ? '/' : current.name,
			});
			current = current.parent;
		}

		return segments;
	};

	const pathSegments = getPathSegments();

	return (
		<div
			className={`midnight-commander-breadcrumb ${isActive ? 'is-active' : ''} ${className}`}
		>
			{pathSegments.map((segment, index) => (
				<React.Fragment key={segment.folder.path}>
					<button
						className="breadcrumb-segment"
						onClick={() => onNavigateToFolder(segment.folder)}
						title={`Navigate to ${segment.folder.path || 'Vault Root'}`}
						disabled={segment.folder === currentFolder}
					>
						<span className="breadcrumb-text">{segment.name}</span>
					</button>
					{index < pathSegments.length - 1 && (
						<span className="breadcrumb-separator">›</span>
					)}
				</React.Fragment>
			))}
		</div>
	);
};
