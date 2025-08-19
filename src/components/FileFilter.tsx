import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FilterOptions, FileFilterProps } from '../types/interfaces';
import { FilterUtils } from '../utils/FilterUtils';

/**
 * FileFilter component provides a comprehensive filtering interface
 * with search input, advanced options, and keyboard shortcuts
 */
export const FileFilter: React.FC<FileFilterProps> = ({
	paneId,
	filterState,
	onFilterChange,
	onFilterToggle,
	onFilterClear,
}) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [localOptions, setLocalOptions] = useState<FilterOptions>(
		filterState?.options || FilterUtils.createDefaultFilterOptions()
	);
	const [validationError, setValidationError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Debounced filter change handler
	const debouncedFilterChange = useCallback(
		FilterUtils.debounce((options: FilterOptions) => {
			onFilterChange(options);
		}, 300),
		[onFilterChange]
	);

	// Update local options when filter state changes externally
	useEffect(() => {
		if (filterState?.options) {
			setLocalOptions(filterState.options);
		}
	}, [filterState?.options]);

	// Validate pattern and apply changes
	const handleOptionChange = useCallback(
		(newOptions: Partial<FilterOptions>) => {
			const updatedOptions = { ...localOptions, ...newOptions };
			setLocalOptions(updatedOptions);

			// Validate regex/glob patterns
			if (updatedOptions.query) {
				const validation = FilterUtils.validatePattern(
					updatedOptions.query,
					updatedOptions.isRegex,
					updatedOptions.isGlob
				);

				if (!validation.valid) {
					setValidationError(validation.error || 'Invalid pattern');
					return;
				}
			}

			setValidationError(null);
			debouncedFilterChange(updatedOptions);
		},
		[localOptions, debouncedFilterChange]
	);

	// Handle input change
	const handleQueryChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const query = event.target.value;
			handleOptionChange({ query });
		},
		[handleOptionChange]
	);

	// Handle keyboard shortcuts
	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			if (event.key === 'Escape') {
				if (localOptions.query) {
					handleOptionChange({ query: '' });
				} else {
					onFilterToggle(false);
				}
			} else if (event.key === 'Enter' && event.ctrlKey) {
				setIsExpanded(!isExpanded);
			}
		},
		[localOptions.query, handleOptionChange, onFilterToggle, isExpanded]
	);

	// Focus input when filter becomes active
	useEffect(() => {
		if (filterState?.isActive && inputRef.current) {
			inputRef.current.focus();
		}
	}, [filterState?.isActive]);

	// Calculate filter statistics
	const stats = filterState
		? FilterUtils.getFilterStats(
				filterState.originalFiles,
				filterState.filteredFiles
			)
		: null;

	const isActive = filterState?.isActive || false;
	const hasQuery = localOptions.query.trim().length > 0;
	const hasAdvancedOptions =
		localOptions.isRegex ||
		localOptions.isGlob ||
		localOptions.caseSensitive ||
		localOptions.showFoldersOnly ||
		localOptions.showFilesOnly;

	return (
		<div className="file-filter-container">
			{/* Toggle Button */}
			<button
				className={`filter-toggle-btn ${isActive ? 'active' : ''}`}
				onClick={() => onFilterToggle(!isActive)}
				title="Toggle filter (Ctrl+F)"
				aria-label={`Toggle filter for ${paneId} pane`}
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
					<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
				</svg>
				{stats && stats.hidden > 0 && (
					<span className="filter-badge">{stats.hidden}</span>
				)}
			</button>

			{/* Filter Panel */}
			{isActive && (
				<div
					className="filter-panel"
					role="region"
					aria-label={`Filter panel for ${paneId} pane`}
				>
					{/* Search Input */}
					<div className="filter-input-container">
						<input
							ref={inputRef}
							type="text"
							className={`filter-input ${validationError ? 'error' : ''}`}
							placeholder="Search files and folders..."
							value={localOptions.query}
							onChange={handleQueryChange}
							onKeyDown={handleKeyDown}
							aria-label="Filter query"
							aria-describedby={
								validationError ? `filter-error-${paneId}` : undefined
							}
						/>

						{/* Clear Button */}
						{hasQuery && (
							<button
								className="filter-clear-btn"
								onClick={() => handleOptionChange({ query: '' })}
								title="Clear search"
								aria-label="Clear search"
							>
								<svg
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
								</svg>
							</button>
						)}

						{/* Advanced Options Toggle */}
						<button
							className={`filter-advanced-btn ${isExpanded ? 'expanded' : ''} ${hasAdvancedOptions ? 'active' : ''}`}
							onClick={() => setIsExpanded(!isExpanded)}
							title="Advanced options (Ctrl+Enter)"
							aria-label="Toggle advanced filter options"
						>
							<svg
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="currentColor"
							>
								<path d="M7 14l5-5 5 5z" />
							</svg>
						</button>
					</div>

					{/* Validation Error */}
					{validationError && (
						<div
							className="filter-error"
							id={`filter-error-${paneId}`}
							role="alert"
						>
							{validationError}
						</div>
					)}

					{/* Advanced Options */}
					{isExpanded && (
						<div className="filter-advanced-panel">
							{/* Pattern Type */}
							<div className="filter-option-group">
								<label className="filter-option-label">Pattern Type:</label>
								<div className="filter-radio-group">
									<label className="filter-radio-option">
										<input
											type="radio"
											name={`pattern-type-${paneId}`}
											checked={!localOptions.isRegex && !localOptions.isGlob}
											onChange={() =>
												handleOptionChange({ isRegex: false, isGlob: false })
											}
										/>
										<span>Text</span>
									</label>
									<label className="filter-radio-option">
										<input
											type="radio"
											name={`pattern-type-${paneId}`}
											checked={localOptions.isGlob}
											onChange={() =>
												handleOptionChange({ isRegex: false, isGlob: true })
											}
										/>
										<span>Glob</span>
									</label>
									<label className="filter-radio-option">
										<input
											type="radio"
											name={`pattern-type-${paneId}`}
											checked={localOptions.isRegex}
											onChange={() =>
												handleOptionChange({ isRegex: true, isGlob: false })
											}
										/>
										<span>Regex</span>
									</label>
								</div>
							</div>

							{/* Options Checkboxes */}
							<div className="filter-option-group">
								<label className="filter-checkbox-option">
									<input
										type="checkbox"
										checked={localOptions.caseSensitive}
										onChange={e =>
											handleOptionChange({ caseSensitive: e.target.checked })
										}
									/>
									<span>Case sensitive</span>
								</label>
								<label className="filter-checkbox-option">
									<input
										type="checkbox"
										checked={localOptions.showFoldersOnly}
										onChange={e =>
											handleOptionChange({
												showFoldersOnly: e.target.checked,
												showFilesOnly: e.target.checked
													? false
													: localOptions.showFilesOnly,
											})
										}
									/>
									<span>Folders only</span>
								</label>
								<label className="filter-checkbox-option">
									<input
										type="checkbox"
										checked={localOptions.showFilesOnly}
										onChange={e =>
											handleOptionChange({
												showFilesOnly: e.target.checked,
												showFoldersOnly: e.target.checked
													? false
													: localOptions.showFoldersOnly,
											})
										}
									/>
									<span>Files only</span>
								</label>
							</div>

							{/* Quick Filters */}
							<div className="filter-option-group">
								<label className="filter-option-label">Quick Filters:</label>
								<div className="filter-quick-buttons">
									{FilterUtils.getQuickFilterPresets().map((preset, index) => (
										<button
											key={index}
											className="filter-quick-btn"
											onClick={() => handleOptionChange(preset.options)}
											title={`Apply ${preset.name} filter`}
										>
											{preset.name}
										</button>
									))}
								</div>
							</div>

							{/* Actions */}
							<div className="filter-actions">
								<button
									className="filter-action-btn secondary"
									onClick={() => {
										setLocalOptions(FilterUtils.createDefaultFilterOptions());
										onFilterClear();
									}}
									title="Reset all filters"
								>
									Reset
								</button>
								<button
									className="filter-action-btn"
									onClick={() => onFilterToggle(false)}
									title="Close filter"
								>
									Close
								</button>
							</div>
						</div>
					)}

					{/* Filter Statistics */}
					{stats && (
						<div className="filter-stats" aria-live="polite">
							Showing {stats.filtered} of {stats.total} items
							{stats.files > 0 && ` (${stats.files} files`}
							{stats.folders > 0 &&
								` ${stats.files > 0 ? ', ' : '('}${stats.folders} folders`}
							{(stats.files > 0 || stats.folders > 0) && ')'}
							{stats.hidden > 0 && ` • ${stats.hidden} hidden`}
						</div>
					)}
				</div>
			)}
		</div>
	);
};
