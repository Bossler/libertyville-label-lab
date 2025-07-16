import React, { memo, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface OptimizedTextElementProps {
  id: string;
  content: string;
  position: { x: number; y: number };
  fontSize: number;
  fontFamily: string;
  color: string;
  isDragging: boolean;
  maxWidth?: number;
  maxHeight?: number;
  onPointerDown: (event: React.PointerEvent, id: string, container: HTMLElement) => void;
  containerRef: React.RefObject<HTMLElement>;
}

export const OptimizedTextElement = memo<OptimizedTextElementProps>(({
  id,
  content,
  position,
  fontSize,
  fontFamily,
  color,
  isDragging,
  maxWidth = 280,
  maxHeight = 80,
  onPointerDown,
  containerRef
}) => {
  const elementRef = useRef<HTMLDivElement>(null);

  // Apply position updates without re-rendering
  useEffect(() => {
    if (elementRef.current && !isDragging) {
      const element = elementRef.current;
      element.style.left = `${position.x - element.offsetWidth / 2}px`;
      element.style.top = `${position.y - element.offsetHeight / 2}px`;
    }
  }, [position, isDragging]);

  const handlePointerDown = (event: React.PointerEvent) => {
    if (containerRef.current) {
      onPointerDown(event, id, containerRef.current);
    }
  };

  const textStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${maxWidth}px`,
    height: `${maxHeight}px`,
    fontSize: `${fontSize}px`,
    fontFamily,
    color,
    fontWeight: id === 'coffeeName' ? 'bold' : 'normal',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab',
    userSelect: 'none',
    pointerEvents: 'auto',
    background: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    border: isDragging ? '2px dashed rgba(59, 130, 246, 0.5)' : '2px solid transparent',
    borderRadius: '4px',
    transition: isDragging ? 'none' : 'all 0.2s ease',
    willChange: isDragging ? 'transform' : 'auto',
    zIndex: isDragging ? 1000 : 10,
    overflow: 'hidden',
    wordWrap: 'break-word',
    lineHeight: id === 'coffeeName' ? '1.1' : '1.2',
    textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8)',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale'
  };

  const gripStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    background: 'rgba(59, 130, 246, 0.9)',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isDragging ? 1 : 0,
    transition: 'opacity 0.2s ease',
    pointerEvents: 'none',
    color: 'white'
  };

  return (
    <div
      ref={elementRef}
      style={textStyle}
      onPointerDown={handlePointerDown}
      className="hover:shadow-lg"
    >
      <div style={gripStyle}>
        <GripVertical size={12} />
      </div>
      {content || (id === 'coffeeName' ? 'Coffee Name' : 'Tasting Notes')}
    </div>
  );
});

OptimizedTextElement.displayName = 'OptimizedTextElement';