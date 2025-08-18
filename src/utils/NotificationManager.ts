import { Notice } from 'obsidian';

export enum NotificationType {
	SUCCESS = 'success',
	ERROR = 'error',
	WARNING = 'warning',
	INFO = 'info'
}

export interface NotificationOptions {
	duration?: number;
	type?: NotificationType;
	title?: string;
}

/**
 * Notification manager for consistent user feedback across the plugin
 */
export class NotificationManager {
	/**
	 * Show a success notification
	 */
	static success(message: string, options: NotificationOptions = {}): void {
		this.showNotification(message, { ...options, type: NotificationType.SUCCESS });
	}

	/**
	 * Show an error notification
	 */
	static error(message: string, options: NotificationOptions = {}): void {
		this.showNotification(message, { ...options, type: NotificationType.ERROR, duration: 8000 });
	}

	/**
	 * Show a warning notification
	 */
	static warning(message: string, options: NotificationOptions = {}): void {
		this.showNotification(message, { ...options, type: NotificationType.WARNING, duration: 6000 });
	}

	/**
	 * Show an info notification
	 */
	static info(message: string, options: NotificationOptions = {}): void {
		this.showNotification(message, { ...options, type: NotificationType.INFO });
	}

	/**
	 * Show a progress notification for long-running operations
	 */
	static progress(message: string, progress?: number): NotificationProgress {
		const notice = new Notice('', 0); // Persistent notice
		
		const updateProgress = (newMessage: string, newProgress?: number) => {
			let displayMessage = newMessage;
			if (newProgress !== undefined) {
				const progressBar = this.createProgressBar(newProgress);
				displayMessage = `${newMessage}\n${progressBar} ${Math.round(newProgress)}%`;
			}
			notice.setMessage(displayMessage);
		};

		updateProgress(message, progress);

		return {
			update: updateProgress,
			hide: () => notice.hide(),
			setMessage: (msg: string) => notice.setMessage(msg)
		};
	}

	/**
	 * Show confirmation dialog with custom actions
	 */
	static async confirm(
		message: string, 
		title: string = 'Confirm',
		confirmText: string = 'Confirm',
		cancelText: string = 'Cancel'
	): Promise<boolean> {
		return new Promise((resolve) => {
			const modal = document.createElement('div');
			modal.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: rgba(0, 0, 0, 0.5);
				z-index: 1000;
				display: flex;
				align-items: center;
				justify-content: center;
			`;
			
			const dialog = modal.createDiv();
			dialog.style.cssText = `
				background: var(--background-primary);
				border: 1px solid var(--background-modifier-border);
				border-radius: 8px;
				padding: 20px;
				max-width: 400px;
				min-width: 300px;
			`;
			
			dialog.createEl('h3', { text: title });
			dialog.createEl('p', { text: message });
			
			const buttonContainer = dialog.createDiv();
			buttonContainer.style.cssText = 'display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;';
			
			const cancelBtn = buttonContainer.createEl('button', { text: cancelText });
			cancelBtn.style.cssText = 'padding: 8px 16px; background: var(--background-modifier-border); border: none; border-radius: 3px; cursor: pointer;';
			cancelBtn.onclick = () => {
				document.body.removeChild(modal);
				resolve(false);
			};
			
			const confirmBtn = buttonContainer.createEl('button', { text: confirmText });
			confirmBtn.style.cssText = 'padding: 8px 16px; background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: 3px; cursor: pointer;';
			confirmBtn.onclick = () => {
				document.body.removeChild(modal);
				resolve(true);
			};
			
			// Close on background click
			modal.onclick = (e) => {
				if (e.target === modal) {
					document.body.removeChild(modal);
					resolve(false);
				}
			};
			
			// Handle Escape key
			const keyHandler = (e: KeyboardEvent) => {
				if (e.key === 'Escape') {
					document.body.removeChild(modal);
					document.removeEventListener('keydown', keyHandler);
					resolve(false);
				} else if (e.key === 'Enter') {
					document.body.removeChild(modal);
					document.removeEventListener('keydown', keyHandler);
					resolve(true);
				}
			};
			document.addEventListener('keydown', keyHandler);
			
			document.body.appendChild(modal);
			confirmBtn.focus();
		});
	}

	/**
	 * Show status message in a persistent status bar
	 */
	static showStatus(message: string, duration: number = 3000): void {
		const statusBar = document.querySelector('.status-bar') as HTMLElement;
		if (!statusBar) return;

		const statusItem = statusBar.createEl('div', { 
			text: message,
			cls: 'mc-status-item'
		});
		statusItem.style.cssText = `
			background: var(--background-modifier-success);
			color: var(--text-on-accent);
			padding: 2px 8px;
			border-radius: 3px;
			margin-left: 5px;
			font-size: 12px;
		`;

		setTimeout(() => {
			if (statusItem.parentNode) {
				statusItem.parentNode.removeChild(statusItem);
			}
		}, duration);
	}

	/**
	 * Private method to show a notification with consistent styling
	 */
	private static showNotification(message: string, options: NotificationOptions): void {
		const { duration = 4000, type = NotificationType.INFO, title } = options;
		
		let displayMessage = message;
		if (title) {
			displayMessage = `${title}: ${message}`;
		}

		const notice = new Notice(displayMessage, duration);
		
		// Add custom styling based on type
		if (notice.noticeEl) {
			notice.noticeEl.addClass(`mc-notification-${type}`);
			
			// Add custom CSS if needed
			switch (type) {
				case NotificationType.SUCCESS:
					notice.noticeEl.style.borderLeft = '4px solid var(--color-green)';
					break;
				case NotificationType.ERROR:
					notice.noticeEl.style.borderLeft = '4px solid var(--color-red)';
					break;
				case NotificationType.WARNING:
					notice.noticeEl.style.borderLeft = '4px solid var(--color-orange)';
					break;
				case NotificationType.INFO:
					notice.noticeEl.style.borderLeft = '4px solid var(--color-blue)';
					break;
			}
		}
	}

	/**
	 * Create a simple progress bar visualization
	 */
	private static createProgressBar(progress: number): string {
		const totalWidth = 20;
		const filledWidth = Math.round((progress / 100) * totalWidth);
		const emptyWidth = totalWidth - filledWidth;
		
		return `[${'█'.repeat(filledWidth)}${'░'.repeat(emptyWidth)}]`;
	}
}

export interface NotificationProgress {
	update(message: string, progress?: number): void;
	hide(): void;
	setMessage(message: string): void;
}

/**
 * Decorator for automatic error handling
 */
export function withErrorHandling(
	errorMessage: string = 'An error occurred',
	showSuccess: boolean = false,
	successMessage?: string
) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value;

		descriptor.value = async function (...args: any[]) {
			try {
				const result = await originalMethod.apply(this, args);
				
				if (showSuccess && successMessage) {
					NotificationManager.success(successMessage);
				}
				
				return result;
			} catch (error) {
				console.error(`Error in ${propertyKey}:`, error);
				NotificationManager.error(`${errorMessage}: ${error.message || 'Unknown error'}`);
				throw error;
			}
		};

		return descriptor;
	};
}

/**
 * Utility function to wrap promises with error handling
 */
export async function withNotification<T>(
	promise: Promise<T>,
	options: {
		errorMessage?: string;
		successMessage?: string;
		showProgress?: boolean;
		progressMessage?: string;
	} = {}
): Promise<T> {
	const {
		errorMessage = 'Operation failed',
		successMessage,
		showProgress = false,
		progressMessage = 'Processing...'
	} = options;

	let progressNotification: NotificationProgress | null = null;

	try {
		if (showProgress) {
			progressNotification = NotificationManager.progress(progressMessage);
		}

		const result = await promise;

		if (progressNotification) {
			progressNotification.hide();
		}

		if (successMessage) {
			NotificationManager.success(successMessage);
		}

		return result;
	} catch (error) {
		if (progressNotification) {
			progressNotification.hide();
		}

		console.error('Operation failed:', error);
		NotificationManager.error(`${errorMessage}: ${error.message || 'Unknown error'}`);
		throw error;
	}
}
