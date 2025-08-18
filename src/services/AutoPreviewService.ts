import { App, TFile, Component, Workspace, WorkspaceLeaf } from 'obsidian';

export interface AutoPreviewOptions {
	app: App;
	delayMs?: number;
	showPreview?: boolean;
}

export interface PreviewPosition {
	x: number;
	y: number;
	side?: 'left' | 'right' | 'top' | 'bottom';
}

/**
 * Auto-preview service for showing hover editors when hovering over files
 * Integrates with Obsidian's native hover editor system
 */
export class AutoPreviewService extends Component {
	private app: App;
	private delayMs: number;
	private showPreview: boolean;
	private currentHover: any = null;
	private hoverTimeout: number | null = null;
	private lastHoveredElement: HTMLElement | null = null;

	constructor(options: AutoPreviewOptions) {
		super();
		this.app = options.app;
		this.delayMs = options.delayMs ?? 500;
		this.showPreview = options.showPreview ?? true;
	}

	/**
	 * Enable auto-preview for a given element when hovering over files
	 */
	enableAutoPreview(element: HTMLElement, file: TFile, position?: PreviewPosition) {
		if (!this.showPreview) return;

		// Clean up previous hover state
		this.clearHover();

		const onMouseEnter = (event: MouseEvent) => {
			if (!this.showPreview) return;
			
			this.hoverTimeout = window.setTimeout(() => {
				this.showPreviewForFile(file, element, position || this.calculatePosition(event));
			}, this.delayMs);
		};

		const onMouseLeave = () => {
			this.clearHover();
		};

		// Store element for cleanup
		this.lastHoveredElement = element;

		// Add event listeners
		element.addEventListener('mouseenter', onMouseEnter);
		element.addEventListener('mouseleave', onMouseLeave);

		// Register cleanup function
		this.register(() => {
			element.removeEventListener('mouseenter', onMouseEnter);
			element.removeEventListener('mouseleave', onMouseLeave);
		});
	}

	/**
	 * Show preview for a specific file
	 */
	private showPreviewForFile(file: TFile, sourceElement: HTMLElement, position: PreviewPosition) {
		if (!(file instanceof TFile)) return;

		try {
			// Use Obsidian's hover link system
			this.app.workspace.trigger('hover-link', {
				event: null,
				source: 'auto-preview',
				hoverParent: sourceElement,
				targetEl: sourceElement,
				linktext: file.path,
				sourcePath: ''
			});

		} catch (error) {
			console.error('Failed to show auto-preview:', error);
		}
	}


	/**
	 * Calculate position from mouse event
	 */
	private calculatePosition(event: MouseEvent): PreviewPosition {
		return {
			x: event.clientX,
			y: event.clientY
		};
	}

	/**
	 * Clear current hover and timeout
	 */
	private clearHover() {
		if (this.hoverTimeout) {
			window.clearTimeout(this.hoverTimeout);
			this.hoverTimeout = null;
		}

		// Clear hover reference - let Obsidian manage the popover lifecycle
		if (this.currentHover) {
			this.currentHover = null;
		}
	}

	/**
	 * Toggle auto-preview on/off
	 */
	setPreviewEnabled(enabled: boolean) {
		this.showPreview = enabled;
		if (!enabled) {
			this.clearHover();
		}
	}

	/**
	 * Set preview delay
	 */
	setPreviewDelay(delayMs: number) {
		this.delayMs = delayMs;
	}

	/**
	 * Handle keyboard navigation events to synchronize preview
	 */
	handleKeyboardNavigation(direction: 'up' | 'down', file: TFile, element: HTMLElement) {
		if (this.currentHover && this.showPreview) {
			// Update preview to new file
			this.clearHover();
			const position = this.calculatePositionFromElement(element);
			this.showPreviewForFile(file, element, position);
		}
	}

	/**
	 * Calculate position from DOM element
	 */
	private calculatePositionFromElement(element: HTMLElement): PreviewPosition {
		const rect = element.getBoundingClientRect();
		return {
			x: rect.right,
			y: rect.top + rect.height / 2,
			side: 'right'
		};
	}

	/**
	 * Close any open previews (e.g., on menu exit or Esc)
	 */
	closePreview() {
		this.clearHover();
	}

	onunload() {
		this.clearHover();
		super.onunload();
	}
}
