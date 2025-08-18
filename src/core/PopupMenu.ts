/**
 * PopupMenu - Keyboard-navigable menu system adapted from Quick Explorer
 * 
 * This is a dependency-free adaptation of Quick Explorer's PopupMenu class,
 * designed to work with React and vanilla TypeScript instead of @ophidian/core and redom.
 */

import { Keymap, Scope } from 'obsidian';
import Fuse from 'fuse.js';

export interface PopupMenuItem {
    title: string;
    icon?: string;
    disabled?: boolean;
    className?: string;
    callback?: () => void;
    submenu?: PopupMenuItem[];
}

export interface CascadeOptions {
    target: HTMLElement;
    event?: MouseEvent;
    onClose?: () => void;
    hOverlap?: number;
    vOverlap?: number;
}

export interface PopupMenuOptions {
    items?: PopupMenuItem[];
    className?: string;
    onClose?: () => void;
}

/**
 * Base PopupMenu class with keyboard navigation and incremental search
 */
export class PopupMenu {
    public dom: HTMLElement;
    public scope: Scope;
    public items: PopupMenuItem[] = [];
    public selectedIndex = 0;
    public searchTerm = '';
    public searchTimeout?: number;
    public childMenu?: PopupMenu;
    public parentMenu?: PopupMenu;
    public filteredItems: PopupMenuItem[] = [];
    public onCloseCallback?: () => void;
    private isVisible = false;
    private keyHandlers: { [key: string]: () => boolean } = {};
    private fuse?: Fuse<PopupMenuItem>;
    private searchHighlightClass = 'search-highlight';
    private lastKey?: string;
    private lastKeyTime?: number;
    private searchMatches: Array<{ item: PopupMenuItem; matches?: any }> = [];

    constructor(options: PopupMenuOptions = {}) {
        // Create DOM element
        this.dom = document.createElement('div');
        this.dom.className = 'menu popup-menu qe-popup-menu';
        
        // Create keyboard scope
        this.scope = new Scope();
        
        if (options.items) {
            this.items = options.items;
            this.filteredItems = [...this.items];
        }
        
        if (options.className) {
            this.dom.classList.add(options.className);
        }
        
        this.onCloseCallback = options.onClose;
        
        // Initialize fuzzy search
        this.initializeFuse();
        
        this.setupKeyboardHandlers();
        this.setupMouseHandlers();
        this.render();
    }

    /**
     * Initialize Fuse.js for fuzzy searching
     */
    private initializeFuse() {
        this.fuse = new Fuse(this.items, {
            keys: ['title'],
            includeScore: true,
            includeMatches: true,
            threshold: 0.4, // More permissive matching
            ignoreLocation: true,
            minMatchCharLength: 1
        });
    }

    /**
     * Update fuse index when items change
     */
    private updateFuseIndex() {
        if (this.fuse) {
            this.fuse.setCollection(this.items);
        } else {
            this.initializeFuse();
        }
    }

    /**
     * Setup keyboard navigation handlers
     */
    protected setupKeyboardHandlers() {
        // Store key handlers for mapping
        this.keyHandlers = {
            'ArrowUp': this.onArrowUp.bind(this),
            'ArrowDown': this.onArrowDown.bind(this),
            'ArrowLeft': this.onArrowLeft.bind(this),
            'ArrowRight': this.onArrowRight.bind(this),
            'Enter': this.onEnter.bind(this),
            'Escape': this.onEscape.bind(this),
            'Home': this.onHome.bind(this),
            'End': this.onEnd.bind(this),
            'PageUp': () => { this.moveSelection(-10); return false; },
            'PageDown': () => { this.moveSelection(10); return false; },
            '/': this.onStartSearch.bind(this)
        };
        
        // Setup single keydown handler
        this.dom.addEventListener('keydown', (e) => {
            const handler = this.keyHandlers[e.key];
            if (handler) {
                const result = handler();
                if (result === false) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                return;
            }
            
            // Handle vim-style bindings with modifier keys
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'k':
                        this.onArrowUp();
                        e.preventDefault();
                        return;
                    case 'j':
                        this.onArrowDown();
                        e.preventDefault();
                        return;
                    case 'h':
                        this.onArrowLeft();
                        e.preventDefault();
                        return;
                    case 'l':
                        this.onArrowRight();
                        e.preventDefault();
                        return;
                }
            }
            
            // Handle vim-style gg and G navigation
            if (e.key === 'g') {
                // Check for double 'g' within a short timeframe
                if (this.lastKeyTime && Date.now() - this.lastKeyTime < 500 && this.lastKey === 'g') {
                    this.select(0, true); // Go to first item
                    e.preventDefault();
                    return;
                }
                this.lastKey = 'g';
                this.lastKeyTime = Date.now();
                return;
            } else if (e.key === 'G') {
                this.select(this.filteredItems.length - 1, true); // Go to last item
                e.preventDefault();
                return;
            }
            
            // Handle search
            this.onKeyDown(e);
        });
    }

    /**
     * Setup mouse interaction handlers
     */
    protected setupMouseHandlers() {
        this.dom.addEventListener('mouseleave', () => {
            this.selectedIndex = -1;
            this.updateSelection();
        });
    }

    /**
     * Add item to the menu
     */
    addItem(item: PopupMenuItem | ((item: any) => void)) {
        if (typeof item === 'function') {
            // Support Quick Explorer's callback style
            const menuItem = this.addMenuItem('');
            item(menuItem);
            return menuItem;
        } else {
            this.items.push(item);
            this.filteredItems = [...this.items];
            this.updateFuseIndex();
            this.render();
            return null;
        }
    }

    /**
     * Add a standard menu item (Obsidian Menu compatibility)
     */
    addMenuItem(title: string): any {
        const item: PopupMenuItem = { title };
        this.items.push(item);
        this.filteredItems = [...this.items];
        this.updateFuseIndex();
        
        // Return a mock menu item object that can be configured
        const menuItem = {
            dom: document.createElement('div'),
            setTitle: (newTitle: string) => {
                item.title = newTitle;
                this.render();
                return menuItem;
            },
            setIcon: (icon: string) => {
                item.icon = icon;
                this.render();
                return menuItem;
            },
            setDisabled: (disabled: boolean) => {
                item.disabled = disabled;
                this.render();
                return menuItem;
            },
            onClick: (callback: () => void) => {
                item.callback = callback;
                return menuItem;
            }
        };
        
        this.render();
        return menuItem;
    }

    /**
     * Show at specific position (for cascade positioning)
     */
    showAtPosition(pos: { x: number; y: number }) {
        this.dom.style.left = `${pos.x}px`;
        this.dom.style.top = `${pos.y}px`;
        this.show();
    }

    /**
     * Render the menu items
     */
    public render() {
        // Clear existing items
        this.dom.innerHTML = '';
        
        this.filteredItems.forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = [
                'menu-item',
                ...(item.className ? [item.className] : []),
                ...(item.disabled ? ['is-disabled'] : []),
                ...(index === this.selectedIndex ? ['selected'] : [])
            ].join(' ');
            
            if (item.icon) {
                const iconEl = document.createElement('span');
                iconEl.className = 'menu-item-icon';
                iconEl.setAttribute('data-icon', item.icon);
                itemEl.appendChild(iconEl);
            }
            
            const titleEl = document.createElement('span');
            titleEl.className = 'menu-item-title';
            
            // Apply search highlighting if we have matches
            const matchData = this.searchMatches.find(m => m.item === item);
            if (matchData && matchData.matches) {
                titleEl.innerHTML = this.highlightSearchMatches(item.title, matchData.matches);
            } else {
                titleEl.textContent = item.title;
            }
            
            itemEl.appendChild(titleEl);
            
            if (item.submenu) {
                const indicatorEl = document.createElement('span');
                indicatorEl.className = 'menu-item-submenu-indicator';
                indicatorEl.textContent = '▶';
                itemEl.appendChild(indicatorEl);
            }
            
            // Mouse interaction
            itemEl.addEventListener('mouseenter', () => {
                this.select(index);
            });
            
            itemEl.addEventListener('click', (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                this.activateItem(index);
            });
            
            // Store reference to the item data
            (itemEl as any).menuItem = item;
            this.dom.appendChild(itemEl);
        });
        
        this.updateSelection();
    }

    /**
     * Update visual selection state
     */
    protected updateSelection() {
        const items = this.dom.querySelectorAll('.menu-item');
        items.forEach((item: Element, index: number) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    /**
     * Select item by index
     */
    select(index: number, scroll = true) {
        if (index < 0 || index >= this.filteredItems.length) return;
        
        const oldIndex = this.selectedIndex;
        this.selectedIndex = index;
        
        if (oldIndex !== this.selectedIndex) {
            this.updateSelection();
            
            if (scroll) {
                this.scrollToSelected();
            }
        }
    }

    /**
     * Scroll selected item into view
     */
    protected scrollToSelected() {
        const selectedEl = this.dom.querySelector('.menu-item.selected') as HTMLElement;
        if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'nearest' });
        }
    }

    /**
     * Move selection by offset
     */
    moveSelection(offset: number) {
        const newIndex = Math.max(0, Math.min(this.filteredItems.length - 1, this.selectedIndex + offset));
        this.select(newIndex);
    }

    /**
     * Activate the currently selected item
     */
    activateItem(index = this.selectedIndex) {
        const item = this.filteredItems[index];
        if (!item || item.disabled) return;
        
        if (item.submenu) {
            this.openSubmenu(item, index);
        } else if (item.callback) {
            this.hide();
            item.callback();
        }
    }

    /**
     * Open submenu for an item
     */
    protected openSubmenu(item: PopupMenuItem, index: number) {
        this.setChildMenu(new PopupMenu({ 
            items: item.submenu,
            className: 'popup-submenu'
        }));
        
        // Position submenu next to the item
        const itemEl = this.dom.children[index] as HTMLElement;
        if (itemEl && this.childMenu) {
            this.childMenu.cascade({
                target: itemEl,
                onClose: () => this.setChildMenu(undefined)
            });
        }
    }

    /**
     * Set child menu and manage parent-child relationships
     */
    setChildMenu(menu?: PopupMenu) {
        if (this.childMenu) {
            this.childMenu.hide();
            this.childMenu.parentMenu = undefined;
        }
        
        this.childMenu = menu;
        
        if (this.childMenu) {
            this.childMenu.parentMenu = this;
        }
    }

    /**
     * Cascade position the menu relative to a target element
     */
    cascade(options: CascadeOptions) {
        const { target, event, onClose, hOverlap = 15, vOverlap = 5 } = options;
        
        if (onClose) {
            this.onCloseCallback = onClose;
        }
        
        const rect = target.getBoundingClientRect();
        const win = window.activeWindow ?? window;
        const { innerHeight, innerWidth } = win;
        
        // Calculate ideal position
        const centerX = Math.max(0, rect.left + (target.closest('.menu') ? Math.min(150, rect.width / 3) : 0));
        const point = {
            x: event ? event.clientX - hOverlap : centerX,
            y: rect.bottom - vOverlap
        };
        
        // Add to DOM to measure
        document.body.appendChild(this.dom);
        const { offsetWidth, offsetHeight } = this.dom;
        
        // Check if it fits in various positions
        const fitsBelow = point.y + offsetHeight < innerHeight;
        const fitsAbove = rect.top - vOverlap - offsetHeight > 0;
        const fitsRight = point.x + offsetWidth <= innerWidth;
        
        // Adjust position based on available space
        let finalX = point.x;
        let finalY = point.y;
        
        if (!fitsRight) {
            finalX = Math.max(0, innerWidth - offsetWidth);
        }
        
        if (!fitsBelow && fitsAbove) {
            finalY = rect.top - vOverlap - offsetHeight;
        } else if (!fitsBelow) {
            finalY = Math.max(0, innerHeight - offsetHeight);
        }
        
        // Apply position
        this.dom.style.position = 'fixed';
        this.dom.style.left = `${finalX}px`;
        this.dom.style.top = `${finalY}px`;
        this.dom.style.zIndex = '1000';
        
        this.show();
        
        return this;
    }

    /**
     * Perform enhanced fuzzy search using Fuse.js
     */
    search(query: string): boolean {
        if (!query) {
            this.filteredItems = [...this.items];
            this.searchMatches = [];
            this.selectedIndex = 0;
            this.render();
            return true;
        }
        
        // Use Fuse.js for better fuzzy matching
        if (this.fuse) {
            const results = this.fuse.search(query);
            if (results.length > 0) {
                this.filteredItems = results.map(r => r.item);
                this.searchMatches = results.map(r => ({ item: r.item, matches: r.matches }));
                this.selectedIndex = 0;
                this.render();
                return true;
            }
        }
        
        // Fallback to regex search if Fuse.js fails
        const searchRegex = this.buildSearchRegex(query);
        const matches: { item: PopupMenuItem; score: number }[] = [];
        
        this.items.forEach(item => {
            const match = item.title.match(searchRegex);
            if (match) {
                const score = 1 / (match.index! + 1);
                matches.push({ item, score });
            }
        });
        
        if (matches.length > 0) {
            matches.sort((a, b) => b.score - a.score);
            this.filteredItems = matches.map(m => m.item);
            this.searchMatches = [];
            this.selectedIndex = 0;
            this.render();
            return true;
        }
        
        return false;
    }

    /**
     * Build search regex with fallback strategies like Quick Explorer
     */
    protected buildSearchRegex(query: string): RegExp {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = escaped.split('').map(c => c);
        
        try {
            // Try exact prefix first
            return new RegExp(`^${parts.join('')}`, 'ui');
        } catch {
            try {
                // Then prefix fuzzy
                return new RegExp(`^${parts.join('.*')}`, 'ui');
            } catch {
                // Finally anywhere fuzzy
                return new RegExp(parts.join('.*'), 'ui');
            }
        }
    }

    /**
     * Reset search after timeout
     */
    protected resetSearchOnTimeout() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        this.searchTimeout = window.setTimeout(() => {
            this.searchTerm = '';
            this.search(''); // Reset to show all items
        }, 1500);
    }

    // Keyboard event handlers
    protected onArrowUp() {
        this.moveSelection(-1);
        return false;
    }

    protected onArrowDown() {
        this.moveSelection(1);
        return false;
    }

    protected onArrowLeft() {
        if (this.parentMenu) {
            this.hide();
            // Focus parent menu by selecting it
            this.parentMenu.select(this.parentMenu.selectedIndex);
        }
        return false;
    }

    protected onArrowRight() {
        const item = this.filteredItems[this.selectedIndex];
        if (item?.submenu) {
            this.activateItem();
        }
        return false;
    }

    protected onEnter() {
        this.activateItem();
        return false;
    }

    protected onEscape() {
        if (this.childMenu) {
            this.setChildMenu(undefined);
        } else {
            this.hide();
        }
        return false;
    }

    protected onHome() {
        this.select(0);
        return false;
    }

    protected onEnd() {
        this.select(this.filteredItems.length - 1);
        return false;
    }

    protected onKeyDown(event: KeyboardEvent) {
        // Check for modifier keys manually
        const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
        
        // Handle printable characters for search
        if (event.key.length === 1 && !event.isComposing && (!hasModifier || event.shiftKey)) {
            let match = this.searchTerm + event.key;
            
            // Throw away pieces of the match until something matches or nothing's left
            while (match && !this.search(match)) {
                match = match.slice(1);
            }
            
            this.searchTerm = match;
            this.resetSearchOnTimeout();
            return false; // Prevent default
        }
        
        return true; // Allow other keys to bubble
    }

    show() {
        if (!this.isVisible) {
            document.body.appendChild(this.dom);
            this.dom.setAttribute('tabindex', '0');
            this.dom.focus();
            this.isVisible = true;
        }
    }

    hide() {
        this.setChildMenu(undefined);
        
        if (this.isVisible) {
            if (this.dom.parentNode) {
                this.dom.parentNode.removeChild(this.dom);
            }
            this.isVisible = false;
        }
        
        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
        
        return this;
    }

    /**
     * Highlight search matches in text
     */
    protected highlightSearchMatches(text: string, matches: any[]): string {
        if (!matches || matches.length === 0) {
            return text;
        }

        let highlightedText = text;
        const match = matches[0]; // Use first match for title field
        
        if (match && match.indices) {
            // Sort indices in reverse order to avoid offset issues
            const sortedIndices = match.indices.sort((a: number[], b: number[]) => b[0] - a[0]);
            
            for (const [start, end] of sortedIndices) {
                const before = highlightedText.substring(0, start);
                const highlighted = highlightedText.substring(start, end + 1);
                const after = highlightedText.substring(end + 1);
                
                highlightedText = before + 
                    `<span class="${this.searchHighlightClass}">${highlighted}</span>` + 
                    after;
            }
        }
        
        return highlightedText;
    }

    /**
     * Start search mode (triggered by '/' key)
     */
    protected onStartSearch(): boolean {
        // For now, just clear current search and prepare for new input
        this.searchTerm = '';
        this.search('');
        
        // TODO: Could show a search input box or visual indicator
        console.log('Search mode activated - type to search');
        
        return false; // Don't prevent default to allow typing
    }
}
