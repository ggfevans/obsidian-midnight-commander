import React from 'react';
import { TFolder } from 'obsidian';

export interface BreadcrumbProps {
	currentFolder: TFolder;
	onNavigate: (folder: TFolder) => void;
	className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
	currentFolder,
	onNavigate,
	className = '',
}) => {
	// Build the breadcrumb path from current folder to root
	const buildBreadcrumbPath = (folder: TFolder): TFolder[] => {
		const path: TFolder[] = [];
		let current: TFolder | null = folder;
		
		while (current) {
			path.unshift(current); // Add to beginning to get root->current order
			current = current.parent;
		}
		
		return path;
	};

	const breadcrumbPath = buildBreadcrumbPath(currentFolder);

	const handleBreadcrumbClick = (folder: TFolder, event: React.MouseEvent) => {
		event.preventDefault();
		// Navigate first
		onNavigate(folder);
		// Remove focus from button after a short delay to prevent persistent highlight
		setTimeout(() => {
			(event.currentTarget as HTMLButtonElement).blur();
		}, 50);
	};

	return (
		<div className={`breadcrumb ${className}`}>
			{breadcrumbPath.map((folder, index) => (
				<React.Fragment key={folder.path}>
					{/* Separator (except for first item) */}
					{index > 0 && (
						<span className="breadcrumb-separator">
							<svg 
								width="12" 
								height="12" 
								viewBox="0 0 24 24" 
								fill="none" 
								stroke="currentColor" 
								strokeWidth="2" 
								strokeLinecap="round" 
								strokeLinejoin="round"
							>
								<polyline points="9,18 15,12 9,6"></polyline>
							</svg>
						</span>
					)}
					
					{/* Breadcrumb segment */}
					<button
						className={`breadcrumb-segment ${
							index === breadcrumbPath.length - 1 ? 'current' : ''
						}`}
						onClick={(e) => handleBreadcrumbClick(folder, e)}
						title={folder.path || 'Root'}
						type="button"
					>
						{folder.name || 'Root'}
					</button>
				</React.Fragment>
			))}
		</div>
	);
};
