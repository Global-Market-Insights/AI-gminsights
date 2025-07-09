'use client';

import { useEffect, useRef, ReactNode } from 'react';

interface ResizablePanelProps {
  children: ReactNode;
  panelId: string;
  width: number;
  isResizing: boolean;
  minWidth: number;
  maxWidth: number;
  onStartResize: (panelId: string) => void;
  onStopResize: () => void;
  onMouseMove: (e: MouseEvent, panelId: string, startX: number, startWidth: number) => void;
  onReset?: () => void;
  isLast?: boolean;
  className?: string;
}

export default function ResizablePanel({
  children,
  panelId,
  width,
  isResizing,
  minWidth,
  maxWidth,
  onStartResize,
  onStopResize,
  onMouseMove,
  onReset,
  isLast = false,
  className = ''
}: ResizablePanelProps) {
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        onMouseMove(e, panelId, startXRef.current, startWidthRef.current);
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        onStopResize();
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onMouseMove, onStopResize, panelId]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    onStartResize(panelId);
  };

  const handleDoubleClick = () => {
    // Auto-fit to content or reset to default
    if (onReset) {
      onReset();
    }
  };

  return (
    <div
      className={`resizable-panel ${className}`}
      style={{ width: `${width}px`, flexShrink: 0 }}
    >
      {children}
      
      {!isLast && (
        <div className="absolute top-0 right-0 bottom-0 w-2 group z-10">
          {/* Resize handle */}
          <div
            className={`resize-handle ${isResizing ? 'active' : ''}`}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            title={`Resize ${panelId} panel (${minWidth}px - ${maxWidth}px). Double-click to reset.`}
          />
          
          {/* Reset button on hover */}
          {onReset && (
            <button
              onClick={onReset}
              className="panel-reset-btn"
              title={`Reset ${panelId} width`}
            >
              ↺
            </button>
          )}
        </div>
      )}
      
      {/* Width indicator */}
      <div className="width-indicator">
        {width}px
      </div>
    </div>
  );
}
