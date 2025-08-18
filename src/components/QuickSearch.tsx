import React, { useState, useRef, useEffect } from 'react';
import { TAbstractFile } from 'obsidian';

interface QuickSearchProps {
	files: TAbstractFile[];
	onFilter: (filteredFiles: TAbstractFile[], searchTerm: string) => void;
	onClose: () => void;
	isVisible: boolean;
	placeholder?: string;
}

export const QuickSearch: React.FC<QuickSearchProps> = ({
	files,
	onFilter,
	onClose,
	isVisible,
	placeholder = "Search files..."
}) => {
	const [searchTerm, setSearchTerm] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);

	// Focus input when component becomes visible
	useEffect(() => {
		if (isVisible && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isVisible]);

	// Filter files as user types
	useEffect(() => {
		if (!searchTerm.trim()) {
			onFilter(files, '');
			return;
		}

		const filtered = files.filter(file => {
			const fileName = file.name.toLowerCase();
			const search = searchTerm.toLowerCase();
			
			// Support fuzzy search - check if characters appear in sequence
			let searchIndex = 0;
			for (let i = 0; i < fileName.length && searchIndex < search.length; i++) {
				if (fileName[i] === search[searchIndex]) {
					searchIndex++;
				}
			}
			
			// Also support simple substring matching
			const fuzzyMatch = searchIndex === search.length;
			const substringMatch = fileName.includes(search);
			
			return fuzzyMatch || substringMatch;
		});

		onFilter(filtered, searchTerm);
	}, [searchTerm, files, onFilter]);

	// Handle keyboard shortcuts
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		switch (e.key) {
			case 'Escape':
				e.preventDefault();
				setSearchTerm('');
				onClose();
				break;
			case 'Enter':
				e.preventDefault();
				// Close search if we have a single result or no search term
				if (!searchTerm.trim() || files.length <= 1) {
					onClose();
				}
				break;
		}
	};

	// Clear search and close
	const handleClear = () => {
		setSearchTerm('');
		onClose();
	};

	if (!isVisible) {
		return null;
	}

	return (
		<div className="quick-search-overlay">
			<div className="quick-search-container">
				<div className="quick-search-input-wrapper">
					<div className="quick-search-icon">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<circle cx="11" cy="11" r="8" />
							<path d="m21 21-4.35-4.35" />
						</svg>
					</div>
					<input
						ref={inputRef}
						type="text"
						className="quick-search-input"
						placeholder={placeholder}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						onKeyDown={handleKeyDown}
						autoComplete="off"
						spellCheck={false}
					/>
					{searchTerm && (
						<button
							className="quick-search-clear"
							onClick={handleClear}
							type="button"
							aria-label="Clear search"
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					)}
				</div>
				<div className="quick-search-info">
					{searchTerm ? (
						<span className="quick-search-results">
							{files.length} {files.length === 1 ? 'match' : 'matches'}
						</span>
					) : (
						<span className="quick-search-hint">
							Type to search • ESC to close
						</span>
					)}
				</div>
			</div>
		</div>
	);
};
