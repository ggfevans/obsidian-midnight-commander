import { TAbstractFile, TFile, TFolder } from 'obsidian';
import { FilterOptions } from '../types/interfaces';

/**
 * Comprehensive filtering utilities for file management
 * Supports text, regex, and glob pattern matching
 */
export class FilterUtils {
	/**
	 * Filter files based on the provided options
	 */
	static filterFiles(
		files: TAbstractFile[],
		options: FilterOptions
	): TAbstractFile[] {
		if (
			!options.query.trim() &&
			!options.showFoldersOnly &&
			!options.showFilesOnly
		) {
			return files;
		}

		return files.filter(file => {
			// Apply file type filters first
			if (options.showFoldersOnly && !(file instanceof TFolder)) {
				return false;
			}
			if (options.showFilesOnly && !(file instanceof TFile)) {
				return false;
			}

			// If no query, just apply type filters
			if (!options.query.trim()) {
				return true;
			}

			// Apply query-based filtering
			return this.matchesQuery(file, options);
		});
	}

	/**
	 * Check if a file matches the search query
	 */
	static matchesQuery(file: TAbstractFile, options: FilterOptions): boolean {
		const fileName = file.name;
		const query = options.query;

		try {
			if (options.isRegex) {
				const flags = options.caseSensitive ? 'g' : 'gi';
				const regex = new RegExp(query, flags);
				return regex.test(fileName);
			} else if (options.isGlob) {
				const regex = this.globToRegex(query);
				const flags = options.caseSensitive ? 'g' : 'gi';
				const globRegex = new RegExp(regex, flags);
				return globRegex.test(fileName);
			} else {
				// Simple text search
				const searchText = options.caseSensitive
					? fileName
					: fileName.toLowerCase();
				const searchQuery = options.caseSensitive ? query : query.toLowerCase();
				return searchText.includes(searchQuery);
			}
		} catch (error) {
			// Invalid regex/glob pattern, fall back to text search
			const searchText = options.caseSensitive
				? fileName
				: fileName.toLowerCase();
			const searchQuery = options.caseSensitive ? query : query.toLowerCase();
			return searchText.includes(searchQuery);
		}
	}

	/**
	 * Convert glob pattern to regex
	 */
	static globToRegex(glob: string): string {
		// Escape special regex characters except for glob wildcards
		let regex = glob
			.replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
			.replace(/\*/g, '.*') // Convert * to .*
			.replace(/\?/g, '.'); // Convert ? to .

		// Handle character classes [abc] and ranges [a-z]
		regex = regex.replace(/\\\[([^\]]*)\\\]/g, '[$1]');

		return `^${regex}$`;
	}

	/**
	 * Validate a regex or glob pattern
	 */
	static validatePattern(
		pattern: string,
		isRegex: boolean,
		isGlob: boolean
	): { valid: boolean; error?: string } {
		if (!pattern.trim()) {
			return { valid: true };
		}

		try {
			if (isRegex) {
				new RegExp(pattern);
			} else if (isGlob) {
				const regex = this.globToRegex(pattern);
				new RegExp(regex);
			}
			return { valid: true };
		} catch (error) {
			return {
				valid: false,
				error: `Invalid ${isRegex ? 'regex' : 'glob'} pattern: ${error.message}`,
			};
		}
	}

	/**
	 * Create default filter options
	 */
	static createDefaultFilterOptions(): FilterOptions {
		return {
			query: '',
			isRegex: false,
			isGlob: false,
			caseSensitive: false,
			showFoldersOnly: false,
			showFilesOnly: false,
		};
	}

	/**
	 * Get filter statistics
	 */
	static getFilterStats(
		originalFiles: TAbstractFile[],
		filteredFiles: TAbstractFile[]
	): {
		total: number;
		filtered: number;
		hidden: number;
		files: number;
		folders: number;
	} {
		const filteredFilesCount = filteredFiles.filter(
			f => f instanceof TFile
		).length;
		const filteredFoldersCount = filteredFiles.filter(
			f => f instanceof TFolder
		).length;

		return {
			total: originalFiles.length,
			filtered: filteredFiles.length,
			hidden: originalFiles.length - filteredFiles.length,
			files: filteredFilesCount,
			folders: filteredFoldersCount,
		};
	}

	/**
	 * Debounce utility for filter input
	 */
	static debounce<T extends (...args: any[]) => any>(
		func: T,
		wait: number
	): (...args: Parameters<T>) => void {
		let timeout: NodeJS.Timeout;
		return (...args: Parameters<T>) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => func(...args), wait);
		};
	}

	/**
	 * Highlight matching text in file name for UI display
	 */
	static highlightMatches(
		fileName: string,
		query: string,
		options: FilterOptions
	): string {
		if (!query.trim()) return fileName;

		try {
			let regex: RegExp;

			if (options.isRegex) {
				const flags = options.caseSensitive ? 'g' : 'gi';
				regex = new RegExp(`(${query})`, flags);
			} else if (options.isGlob) {
				// For glob patterns, convert to regex for highlighting
				const globRegex = this.globToRegex(query);
				const flags = options.caseSensitive ? 'g' : 'gi';
				regex = new RegExp(`(${globRegex})`, flags);
			} else {
				// Simple text search with word boundaries
				const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				const flags = options.caseSensitive ? 'g' : 'gi';
				regex = new RegExp(`(${escapedQuery})`, flags);
			}

			return fileName.replace(regex, '<mark>$1</mark>');
		} catch (error) {
			// If regex fails, just return original name
			return fileName;
		}
	}

	/**
	 * Get quick filter presets
	 */
	static getQuickFilterPresets(): Array<{
		name: string;
		options: Partial<FilterOptions>;
	}> {
		return [
			{
				name: 'Images',
				options: {
					isGlob: true,
					query: '*.{jpg,jpeg,png,gif,bmp,svg,webp}',
					showFilesOnly: true,
				},
			},
			{
				name: 'Documents',
				options: {
					isGlob: true,
					query: '*.{md,txt,doc,docx,pdf,rtf}',
					showFilesOnly: true,
				},
			},
			{
				name: 'Code Files',
				options: {
					isGlob: true,
					query: '*.{js,ts,jsx,tsx,py,java,cpp,c,h,css,html,json}',
					showFilesOnly: true,
				},
			},
			{
				name: 'Folders Only',
				options: {
					showFoldersOnly: true,
				},
			},
			{
				name: 'Hidden Files',
				options: {
					isGlob: true,
					query: '.*',
					showFilesOnly: true,
				},
			},
			{
				name: "Today's Files",
				options: {
					// This would need additional date logic in the filter
					showFilesOnly: true,
				},
			},
		];
	}
}
