/**
 * PopupMenu React Component
 * 
 * React wrapper for the PopupMenu and FolderMenu classes to integrate
 * with the existing React-based architecture.
 */

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { TFolder, TAbstractFile } from 'obsidian';
import { PopupMenu as BasePopupMenu, PopupMenuItem, CascadeOptions } from '../core/PopupMenu';
import { FolderMenu } from '../core/FolderMenu';
import { useApp } from '../hooks/useApp';

export interface PopupMenuProps {
    items?: PopupMenuItem[];
    className?: string;
    onClose?: () => void;
    children?: React.ReactNode;
}

export interface FolderMenuProps {
    folder: TFolder;
    showHiddenFiles?: boolean;
    onFileSelect?: (file: TAbstractFile) => void;
    onFolderNavigate?: (folder: TFolder) => void;
    className?: string;
    onClose?: () => void;
}

export interface PopupMenuHandle {
    show: (options: CascadeOptions) => void;
    hide: () => void;
    addItem: (item: PopupMenuItem) => void;
    search: (query: string) => boolean;
}

export interface FolderMenuHandle extends PopupMenuHandle {
    refresh: () => void;
    togglePreview: () => void;
}

/**
 * Generic PopupMenu React component
 */
export const PopupMenuComponent = forwardRef<PopupMenuHandle, PopupMenuProps>(
    ({ items = [], className, onClose, children }, ref) => {
        const menuRef = useRef<BasePopupMenu | null>(null);
        const isVisible = useRef(false);

        useEffect(() => {
            // Create the popup menu instance
            menuRef.current = new BasePopupMenu({
                items,
                className,
                onClose: () => {
                    isVisible.current = false;
                    onClose?.();
                }
            });

            // Cleanup on unmount
            return () => {
                if (menuRef.current) {
                    menuRef.current.hide();
                    menuRef.current = null;
                }
            };
        }, []);

        // Update items when props change
        useEffect(() => {
            if (menuRef.current && items.length > 0) {
                menuRef.current.items = items;
                menuRef.current.filteredItems = [...items];
                menuRef.current.render();
            }
        }, [items]);

        useImperativeHandle(ref, () => ({
            show: (options: CascadeOptions) => {
                if (menuRef.current) {
                    menuRef.current.cascade(options);
                    isVisible.current = true;
                }
            },
            hide: () => {
                if (menuRef.current) {
                    menuRef.current.hide();
                    isVisible.current = false;
                }
            },
            addItem: (item: PopupMenuItem) => {
                if (menuRef.current) {
                    menuRef.current.addItem(item);
                }
            },
            search: (query: string) => {
                return menuRef.current?.search(query) || false;
            }
        }), []);

        // Render children if provided (for custom menu items)
        return children ? <>{children}</> : null;
    }
);

PopupMenuComponent.displayName = 'PopupMenu';

/**
 * Folder-specific menu React component
 */
export const FolderMenuComponent = forwardRef<FolderMenuHandle, FolderMenuProps>(
    ({ folder, showHiddenFiles, onFileSelect, onFolderNavigate, className, onClose }, ref) => {
        const app = useApp();
        const menuRef = useRef<FolderMenu | null>(null);
        const isVisible = useRef(false);

        useEffect(() => {
            if (!app) return;

            // Create the folder menu instance
            menuRef.current = new FolderMenu({
                app,
                folder,
                showHiddenFiles,
                onFileSelect,
                onFolderNavigate,
                className,
                onClose: () => {
                    isVisible.current = false;
                    onClose?.();
                }
            });

            // Cleanup on unmount
            return () => {
                if (menuRef.current) {
                    menuRef.current.hide();
                    menuRef.current = null;
                }
            };
        }, [app, folder.path]); // Re-create when folder changes

        // Update props when they change
        useEffect(() => {
            if (menuRef.current) {
                // Refresh folder contents if showHiddenFiles changed
                menuRef.current.loadFolderContents();
            }
        }, [showHiddenFiles]);

        useImperativeHandle(ref, () => ({
            show: (options: CascadeOptions) => {
                if (menuRef.current) {
                    menuRef.current.cascade(options);
                    isVisible.current = true;
                }
            },
            hide: () => {
                if (menuRef.current) {
                    menuRef.current.hide();
                    isVisible.current = false;
                }
            },
            addItem: (item: PopupMenuItem) => {
                if (menuRef.current) {
                    menuRef.current.addItem(item);
                }
            },
            search: (query: string) => {
                return menuRef.current?.search(query) || false;
            },
            refresh: () => {
                if (menuRef.current) {
                    menuRef.current.loadFolderContents();
                }
            },
            togglePreview: () => {
                if (menuRef.current) {
                    menuRef.current.togglePreviewMode();
                }
            }
        }), []);

        return null; // No JSX needed, menu is rendered directly to DOM
    }
);

FolderMenuComponent.displayName = 'FolderMenu';

/**
 * Hook for managing PopupMenu state
 */
export function usePopupMenu(initialItems: PopupMenuItem[] = []) {
    const menuRef = useRef<PopupMenuHandle>(null);
    const [items, setItems] = React.useState<PopupMenuItem[]>(initialItems);
    const [isVisible, setIsVisible] = React.useState(false);

    const show = React.useCallback((options: CascadeOptions) => {
        if (menuRef.current) {
            menuRef.current.show(options);
            setIsVisible(true);
        }
    }, []);

    const hide = React.useCallback(() => {
        if (menuRef.current) {
            menuRef.current.hide();
            setIsVisible(false);
        }
    }, []);

    const addItem = React.useCallback((item: PopupMenuItem) => {
        setItems(prev => [...prev, item]);
        menuRef.current?.addItem(item);
    }, []);

    const search = React.useCallback((query: string) => {
        return menuRef.current?.search(query) || false;
    }, []);

    const MenuComponent = React.useCallback(
        (props: Omit<PopupMenuProps, 'items'>) => (
            <PopupMenuComponent
                ref={menuRef}
                items={items}
                onClose={() => {
                    setIsVisible(false);
                    props.onClose?.();
                }}
                {...props}
            />
        ),
        [items]
    );

    return {
        MenuComponent,
        items,
        setItems,
        isVisible,
        show,
        hide,
        addItem,
        search
    };
}

/**
 * Hook for managing FolderMenu state
 */
export function useFolderMenu(folder: TFolder, options: Partial<FolderMenuProps> = {}) {
    const menuRef = useRef<FolderMenuHandle>(null);
    const [isVisible, setIsVisible] = React.useState(false);

    const show = React.useCallback((cascadeOptions: CascadeOptions) => {
        if (menuRef.current) {
            menuRef.current.show(cascadeOptions);
            setIsVisible(true);
        }
    }, []);

    const hide = React.useCallback(() => {
        if (menuRef.current) {
            menuRef.current.hide();
            setIsVisible(false);
        }
    }, []);

    const refresh = React.useCallback(() => {
        menuRef.current?.refresh();
    }, []);

    const togglePreview = React.useCallback(() => {
        menuRef.current?.togglePreview();
    }, []);

    const search = React.useCallback((query: string) => {
        return menuRef.current?.search(query) || false;
    }, []);

    const MenuComponent = React.useCallback(
        (props: Omit<FolderMenuProps, 'folder'>) => (
            <FolderMenuComponent
                ref={menuRef}
                folder={folder}
                onClose={() => {
                    setIsVisible(false);
                    props.onClose?.();
                }}
                {...options}
                {...props}
            />
        ),
        [folder, options]
    );

    return {
        MenuComponent,
        isVisible,
        show,
        hide,
        refresh,
        togglePreview,
        search
    };
}
