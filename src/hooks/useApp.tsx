/**
 * useApp Hook - Provides access to the Obsidian App instance within React components
 */

import React, { createContext, useContext } from 'react';
import { App } from 'obsidian';

// Context for providing the App instance
const AppContext = createContext<App | null>(null);

/**
 * Provider component to make the App instance available to child components
 */
export const AppProvider: React.FC<{ app: App; children: React.ReactNode }> = ({ 
    app, 
    children 
}) => {
    return (
        <AppContext.Provider value={app}>
            {children}
        </AppContext.Provider>
    );
};

/**
 * Hook to access the Obsidian App instance
 */
export const useApp = (): App | null => {
    const app = useContext(AppContext);
    
    if (!app) {
        console.warn('useApp hook called outside of AppProvider context');
    }
    
    return app;
};

/**
 * Hook to access the Obsidian App instance with error handling
 */
export const useAppRequired = (): App => {
    const app = useApp();
    
    if (!app) {
        throw new Error('useAppRequired hook called outside of AppProvider context or app is null');
    }
    
    return app;
};
