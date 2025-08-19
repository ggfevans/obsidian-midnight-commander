import { TFile, TFolder, TAbstractFile, App } from 'obsidian';

/**
 * Service for providing advanced file navigation commands
 * Inspired by Quick Explorer's file navigation utilities
 */
export class NavigationService {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * Navigate to next/previous/first/last file in folder
	 */
	public navigateFile(
		file: TAbstractFile,
		direction: number,
		relative: boolean
	): TFile | null {
		const seen = new Set<TAbstractFile>();
		let currentFile: TAbstractFile = file;
		let parentFolder = file.parent;

		while (parentFolder && !seen.has(currentFile)) {
			seen.add(currentFile);
			const allFiles = this.getSortedFiles(parentFolder, false);
			let pos = allFiles.indexOf(currentFile);

			if (pos === -1) return null; // Should not happen

			if (relative) {
				pos += direction;
			} else {
				pos = direction < 0 ? 0 : allFiles.length - 1;
			}

			while (pos >= 0 && pos < allFiles.length) {
				const nextFile = allFiles[pos];

				if (nextFile instanceof TFile) {
					return nextFile;
				} else if (nextFile instanceof TFolder) {
					const subFiles = this.getSortedFiles(nextFile, false);
					const subFile =
						direction > 0 ? subFiles[0] : subFiles[subFiles.length - 1];
					if (subFile instanceof TFile) {
						return subFile;
					}
				}
				pos += direction;
			}

			currentFile = parentFolder;
			parentFolder = currentFile.parent;
		}

		return null;
	}

	/**
	 * Get sorted files in a folder, similar to Quick Explorer
	 */
	private getSortedFiles(folder: TFolder, allFiles: boolean): TAbstractFile[] {
		const { children } = folder;
		const collator = new Intl.Collator(undefined, {
			usage: 'sort',
			sensitivity: 'base',
			numeric: true,
		});

		const items = children
			.slice()
			.sort((a, b) => collator.compare(a.name, b.name));
		const folders = items.filter(f => f instanceof TFolder) as TFolder[];
		const files = items.filter(f => f instanceof TFile) as TFile[];

		folders.sort((a, b) => collator.compare(a.name, b.name));
		files.sort((a, b) => collator.compare(a.basename, b.basename));

		return [...folders, ...files];
	}
}
