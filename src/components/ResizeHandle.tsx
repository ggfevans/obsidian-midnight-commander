import React, { useState, useCallback, useRef, useEffect } from 'react';

interface ResizeHandleProps {
    onResize: (topHeight: number, bottomHeight: number) => void;
    containerHeight: number;
    initialTopHeight?: number;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
    onResize,
    containerHeight,
    initialTopHeight = containerHeight * 0.5, // 50% by default
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [topHeight, setTopHeight] = useState(initialTopHeight);
    const handleRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate bottom height
    const bottomHeight = containerHeight - topHeight;

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        
        // Add global mouse event listeners
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            
            const containerRect = containerRef.current.getBoundingClientRect();
            const relativeY = e.clientY - containerRect.top;
            
            // Constrain to reasonable bounds (minimum 100px for each pane)
            const minPaneHeight = 100;
            const maxTopHeight = containerHeight - minPaneHeight;
            const newTopHeight = Math.max(minPaneHeight, Math.min(maxTopHeight, relativeY));
            
            setTopHeight(newTopHeight);
            onResize(newTopHeight, containerHeight - newTopHeight);
        };
        
        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [containerHeight, onResize]);

    // Handle double-click to reset to 50/50
    const handleDoubleClick = useCallback(() => {
        const resetHeight = containerHeight * 0.5;
        setTopHeight(resetHeight);
        onResize(resetHeight, containerHeight - resetHeight);
    }, [containerHeight, onResize]);

    // Update top height when container height changes
    useEffect(() => {
        if (containerHeight > 0) {
            // Maintain the same proportion when container resizes
            const proportion = topHeight / (topHeight + bottomHeight);
            const newTopHeight = containerHeight * proportion;
            setTopHeight(newTopHeight);
            onResize(newTopHeight, containerHeight - newTopHeight);
        }
    }, [containerHeight]);

    return (
        <div
            ref={containerRef}
            className="resize-container"
            style={{ height: containerHeight }}
        >
            {/* Top pane spacer */}
            <div style={{ height: topHeight, pointerEvents: 'none' }} />
            
            {/* Resize handle */}
            <div
                ref={handleRef}
                className={`resize-handle ${isDragging ? 'dragging' : ''}`}
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick}
                title="Drag to resize panes (double-click to reset)"
            >
                <div className="resize-handle-grip">
                    <div className="resize-handle-line" />
                    <div className="resize-handle-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <div className="resize-handle-line" />
                </div>
            </div>
            
            {/* Bottom pane spacer */}
            <div style={{ height: bottomHeight, pointerEvents: 'none' }} />
        </div>
    );
};
