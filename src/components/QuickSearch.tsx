import React, { useState, useEffect, useRef } from 'react';
import { TAbstractFile, TFile, TFolder } from 'obsidian';

interface QuickSearchProps {
    files: TAbstractFile[];
    isVisible: boolean;
    onFilter: (query: string, filteredFiles: TAbstractFile[]) => void;
    onClose: () => void;
    onSelect: (file: TAbstractFile) => void;
    placeholder?: string;
}

export const QuickSearch: React.FC<QuickSearchProps> = ({
    files,
    isVisible,
    onFilter,
    onClose,
    onSelect,
    placeholder = 'Search files...'
}) => {
    const [query, setQuery] = useState('');
    const [filteredFiles, setFilteredFiles] = useState<TAbstractFile[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isVisible && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isVisible]);

    useEffect(() => {
        if (!query.trim()) {
            setFilteredFiles([]);
            onFilter('', []);
            return;
        }

        const filtered = files.filter(file => 
            file.name.toLowerCase().includes(query.toLowerCase())
        );
        
        setFilteredFiles(filtered);
        setSelectedIndex(0);
        onFilter(query, filtered);
    }, [query, files, onFilter]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => 
                    Math.min(prev + 1, filteredFiles.length - 1)
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredFiles[selectedIndex]) {
                    onSelect(filteredFiles[selectedIndex]);
                }
                break;
        }
    };

    const handleFileClick = (file: TAbstractFile, index: number) => {
        setSelectedIndex(index);
        onSelect(file);
    };

    if (!isVisible) return null;

    return (
        <div className="quick-search-overlay">
            <div className="quick-search-container">
                <div className="quick-search-input-container">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="quick-search-input"
                    />
                    <button 
                        className="quick-search-close" 
                        onClick={onClose}
                        aria-label="Close search"
                    >
                        ×
                    </button>
                </div>
                
                {filteredFiles.length > 0 && (
                    <div className="quick-search-results">
                        {filteredFiles.slice(0, 10).map((file, index) => (
                            <div
                                key={file.path}
                                className={`quick-search-item ${
                                    index === selectedIndex ? 'selected' : ''
                                }`}
                                onClick={() => handleFileClick(file, index)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <span className={`file-icon ${
                                    file instanceof TFolder ? 'folder-icon' : 'file-icon'
                                }`}>
                                    {file instanceof TFolder ? '📁' : '📄'}
                                </span>
                                <span className="file-name">{file.name}</span>
                                {file instanceof TFile && (
                                    <span className="file-extension">
                                        {file.extension}
                                    </span>
                                )}
                            </div>
                        ))}
                        
                        {filteredFiles.length > 10 && (
                            <div className="quick-search-more">
                                +{filteredFiles.length - 10} more results
                            </div>
                        )}
                    </div>
                )}
                
                {query && filteredFiles.length === 0 && (
                    <div className="quick-search-no-results">
                        No files found matching "{query}"
                    </div>
                )}
            </div>
        </div>
    );
};
