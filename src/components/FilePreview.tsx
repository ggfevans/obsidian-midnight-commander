import React, { useState, useEffect } from 'react';
import { TFile, TAbstractFile, App } from 'obsidian';

interface FilePreviewProps {
    app: App;
    file: TAbstractFile | null;
    isVisible: boolean;
    onClose: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ app, file, isVisible, onClose }) => {
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state when file changes
    useEffect(() => {
        setContent('');
        setError(null);
        setIsLoading(false);
    }, [file]);

    // Load file content when file changes and preview is visible
    useEffect(() => {
        if (!file || !isVisible || !(file instanceof TFile)) {
            return;
        }

        const loadFileContent = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Check if it's a supported file type
                const extension = file.extension.toLowerCase();
                
                if (isTextFile(extension)) {
                    const fileContent = await app.vault.read(file);
                    setContent(fileContent);
                } else if (isImageFile(extension)) {
                    // For images, we'll show a placeholder or the image path
                    setContent(`Image file: ${file.name}\nPath: ${file.path}\nSize: ${file.stat.size} bytes`);
                } else {
                    setContent(`File type not supported for preview: ${extension.toUpperCase()}\nPath: ${file.path}\nSize: ${file.stat.size} bytes`);
                }
            } catch (err) {
                setError(`Failed to load file: ${err.message || 'Unknown error'}`);
            } finally {
                setIsLoading(false);
            }
        };

        loadFileContent();
    }, [file, isVisible, app]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isVisible) return;
            
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, onClose]);

    const isTextFile = (extension: string): boolean => {
        const textExtensions = [
            'md', 'txt', 'json', 'js', 'ts', 'tsx', 'jsx', 'css', 'scss', 'sass',
            'html', 'xml', 'yml', 'yaml', 'toml', 'ini', 'conf', 'log', 'csv',
            'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'rb', 'go', 'rs', 'sh'
        ];
        return textExtensions.includes(extension);
    };

    const isImageFile = (extension: string): boolean => {
        const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'bmp', 'webp'];
        return imageExtensions.includes(extension);
    };

    const renderPreviewContent = () => {
        if (isLoading) {
            return (
                <div className="file-preview-loading">
                    <div className="loading-spinner"></div>
                    <span>Loading preview...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="file-preview-error">
                    <div className="error-icon">⚠️</div>
                    <div className="error-message">{error}</div>
                </div>
            );
        }

        if (!file) {
            return (
                <div className="file-preview-empty">
                    <div className="empty-icon">📄</div>
                    <div className="empty-message">Select a file to preview</div>
                </div>
            );
        }

        if (!(file instanceof TFile)) {
            return (
                <div className="file-preview-folder">
                    <div className="folder-icon">📁</div>
                    <div className="folder-message">
                        <strong>{file.name}</strong>
                        <br />
                        Folder preview not available
                    </div>
                </div>
            );
        }

        const extension = file.extension.toLowerCase();
        
        if (isImageFile(extension)) {
            const imageUrl = app.vault.adapter.getResourcePath(file.path);
            return (
                <div className="file-preview-image">
                    <img 
                        src={imageUrl} 
                        alt={file.name}
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            setError('Failed to load image');
                        }}
                    />
                    <div className="image-info">
                        <strong>{file.name}</strong>
                        <br />
                        <span className="file-size">{formatFileSize(file.stat.size)}</span>
                    </div>
                </div>
            );
        }

        if (isTextFile(extension)) {
            return (
                <div className="file-preview-text">
                    <div className="file-preview-header">
                        <strong>{file.name}</strong>
                        <span className="file-size">{formatFileSize(file.stat.size)}</span>
                    </div>
                    <div className="file-preview-content">
                        {extension === 'md' ? (
                            <div className="markdown-preview">
                                {/* We'll render markdown content as plain text for now */}
                                <pre>{content}</pre>
                            </div>
                        ) : (
                            <pre><code>{content}</code></pre>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="file-preview-unsupported">
                <div className="file-icon">📄</div>
                <div className="file-info">
                    <strong>{file.name}</strong>
                    <br />
                    <span className="file-extension">{extension.toUpperCase()}</span>
                    <br />
                    <span className="file-size">{formatFileSize(file.stat.size)}</span>
                    <br />
                    <em>Preview not available for this file type</em>
                </div>
            </div>
        );
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    if (!isVisible) return null;

    return (
        <div className="file-preview-overlay">
            <div className="file-preview-container">
                <div className="file-preview-header-bar">
                    <h3>File Preview</h3>
                    <button 
                        className="file-preview-close"
                        onClick={onClose}
                        aria-label="Close preview"
                    >
                        ✕
                    </button>
                </div>
                <div className="file-preview-body">
                    {renderPreviewContent()}
                </div>
                <div className="file-preview-footer">
                    <span className="preview-hint">Press ESC to close</span>
                </div>
            </div>
        </div>
    );
};
