import React from 'react';

export interface ResizeHandleProps {
	orientation: 'vertical' | 'horizontal';
	onResize: (delta: number) => void;
	onReset?: () => void;
	className?: string;
	style?: React.CSSProperties;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
	orientation,
	onResize,
	onReset,
	className = '',
	style = {},
}) => {
	const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
		e.preventDefault();

		const startX = e.clientX;
		const startY = e.clientY;

		// Add dragging class
		const handleElement = e.currentTarget as HTMLElement;
		handleElement.classList.add('dragging');

		const handleMouseMove = (e: MouseEvent) => {
			if (orientation === 'vertical') {
				const deltaY = e.clientY - startY;
				onResize(deltaY);
			} else {
				const deltaX = e.clientX - startX;
				onResize(deltaX);
			}
		};

		const handleMouseUp = () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
			document.body.style.cursor = '';
			handleElement.classList.remove('dragging');
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);

		// Set appropriate cursor based on orientation
		document.body.style.cursor =
			orientation === 'vertical' ? 'ns-resize' : 'ew-resize';
	};

	const handleDoubleClick = () => {
		if (onReset) {
			onReset();
		}
	};

	const baseClassName = `resize-handle ${orientation === 'horizontal' ? 'horizontal' : ''}`;
	const combinedClassName = `${baseClassName} ${className}`.trim();

	return (
		<div
			className={combinedClassName}
			style={style}
			onMouseDown={handleMouseDown}
			onDoubleClick={handleDoubleClick}
			title="Drag to resize panes (double-click to reset)"
			tabIndex={0}
			role="separator"
			aria-orientation={orientation}
			aria-label={`Resize ${orientation === 'vertical' ? 'top and bottom' : 'left and right'} panes`}
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
	);
};
