import { EventRef, Component, App, Scope } from 'obsidian';

/**
 * Central event manager for handling plugin lifecycle and cleanup
 * Ensures all events, intervals, and DOM listeners are properly disposed
 */
export class EventManager {
    private eventRefs: EventRef[] = [];
    private intervals: number[] = [];
    private domCleanupCallbacks: Array<() => void> = [];
    private scopes: Scope[] = [];
    private cleanupFunctions: Array<() => void> = [];

    constructor(
        private app: App,
        private parentComponent?: Component
    ) {
        // No need to extend Component - we'll manage our own cleanup
    }

    /**
     * Register a workspace/vault event with automatic cleanup
     */
    registerAppEvent<T extends keyof WindowEventMap>(
        target: 'workspace' | 'vault' | 'metadataCache',
        eventName: string,
        handler: (...args: any[]) => void,
        context?: any
    ): void {
        let eventRef: EventRef;
        
        switch (target) {
            case 'workspace':
                eventRef = this.app.workspace.on(eventName as any, handler, context);
                break;
            case 'vault':
                eventRef = this.app.vault.on(eventName as any, handler, context);
                break;
            case 'metadataCache':
                eventRef = this.app.metadataCache.on(eventName as any, handler, context);
                break;
            default:
                throw new Error(`Unknown event target: ${target}`);
        }
        
        this.eventRefs.push(eventRef);
        this.cleanupFunctions.push(() => this.app.workspace.offref(eventRef));
    }

    /**
     * Register a DOM event listener with automatic cleanup
     */
    registerDomEvent<T extends keyof HTMLElementEventMap>(
        element: HTMLElement,
        eventType: T,
        handler: (event: HTMLElementEventMap[T]) => void,
        options?: boolean | AddEventListenerOptions
    ): void {
        element.addEventListener(eventType, handler, options);
        
        const cleanup = () => {
            element.removeEventListener(eventType, handler, options);
        };
        
        this.domCleanupCallbacks.push(cleanup);
        this.cleanupFunctions.push(cleanup);
    }

    /**
     * Register a window/document event listener with automatic cleanup
     */
    registerGlobalDomEvent<T extends keyof WindowEventMap>(
        target: Window | Document,
        eventType: T,
        handler: (event: WindowEventMap[T]) => void,
        options?: boolean | AddEventListenerOptions
    ): void {
        target.addEventListener(eventType, handler as any, options);
        
        const cleanup = () => {
            target.removeEventListener(eventType, handler as any, options);
        };
        
        this.domCleanupCallbacks.push(cleanup);
        this.cleanupFunctions.push(cleanup);
    }

    /**
     * Register an interval with automatic cleanup
     */
    registerInterval(callback: () => void, intervalMs: number): number {
        const intervalId = window.setInterval(callback, intervalMs);
        this.intervals.push(intervalId);
        
        this.cleanupFunctions.push(() => {
            window.clearInterval(intervalId);
            const index = this.intervals.indexOf(intervalId);
            if (index > -1) {
                this.intervals.splice(index, 1);
            }
        });
        
        return intervalId;
    }

    /**
     * Register a timeout with automatic cleanup
     */
    registerTimeout(callback: () => void, delayMs: number): number {
        const timeoutId = window.setTimeout(callback, delayMs);
        
        this.cleanupFunctions.push(() => {
            window.clearTimeout(timeoutId);
        });
        
        return timeoutId;
    }

    /**
     * Register a keyboard scope with automatic cleanup
     */
    registerScope(scope: Scope): void {
        this.scopes.push(scope);
        this.cleanupFunctions.push(() => {
            const index = this.scopes.indexOf(scope);
            if (index > -1) {
                this.scopes.splice(index, 1);
            }
        });
    }

    /**
     * Register a custom cleanup callback
     */
    registerCleanup(cleanup: () => void): void {
        this.cleanupFunctions.push(cleanup);
    }

    /**
     * Get statistics about registered events (for debugging)
     */
    getStats(): {
        eventRefs: number;
        intervals: number;
        domCleanups: number;
        scopes: number;
        totalRegistrations: number;
    } {
        return {
            eventRefs: this.eventRefs.length,
            intervals: this.intervals.length,
            domCleanups: this.domCleanupCallbacks.length,
            scopes: this.scopes.length,
            totalRegistrations: this.cleanupFunctions.length
        };
    }

    /**
     * Force cleanup all registered events and listeners
     */
    cleanup(): void {
        this.onunload();
    }

    onunload(): void {
        console.log('EventManager cleanup - stats:', this.getStats());
        
        // Run all cleanup functions
        this.cleanupFunctions.forEach(cleanup => {
            try {
                cleanup();
            } catch (error) {
                console.error('Error during EventManager cleanup:', error);
            }
        });
        
        // Clear all arrays
        this.eventRefs = [];
        this.intervals = [];
        this.domCleanupCallbacks = [];
        this.scopes = [];
        this.cleanupFunctions = [];
    }
}

/**
 * Creates a scoped event manager that automatically cleans up when the component is unloaded
 */
export function createEventManager(app: App, parentComponent?: Component): EventManager {
    return new EventManager(app, parentComponent);
}
