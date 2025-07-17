import React, { useState, useRef, useEffect } from 'react';

interface SimpleImageEditorProps {
  imageElement: {
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  };
  canvasWidth: number;
  canvasHeight: number;
  onImageChange: (imageElement: {
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  }) => void;
}

export const SimpleImageEditor: React.FC<SimpleImageEditorProps> = ({
  imageElement,
  canvasWidth,
  canvasHeight,
  onImageChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (action === 'drag') {
      setIsDragging(true);
      // Calculate offset from mouse to top-left of image
      setDragStart({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
    } else if (action === 'resize') {
      setIsResizing(true);
      setResizeStart({ 
        x: e.clientX, 
        y: e.clientY, 
        width: imageElement.width, 
        height: imageElement.height 
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      const newX = Math.max(0, Math.min(canvasWidth - imageElement.width, x - dragStart.x));
      const newY = Math.max(0, Math.min(canvasHeight - imageElement.height, y - dragStart.y));
      
      onImageChange({
        ...imageElement,
        x: newX,
        y: newY
      });
    } else if (isResizing) {
      const deltaX = x - resizeStart.x;
      const deltaY = y - resizeStart.y;
      const newWidth = Math.max(50, resizeStart.width + deltaX);
      const newHeight = Math.max(50, resizeStart.height + deltaY);
      
      onImageChange({
        ...imageElement,
        width: Math.min(newWidth, canvasWidth - imageElement.x),
        height: Math.min(newHeight, canvasHeight - imageElement.y)
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Add global mouse move and mouse up listeners for smoother dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      // Get the overlay container bounds
      const overlay = document.querySelector('[style*="zIndex: 5"]') as HTMLElement;
      if (!overlay) return;

      const rect = overlay.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (isDragging) {
        const newX = Math.max(0, Math.min(canvasWidth - imageElement.width, x - dragStart.x));
        const newY = Math.max(0, Math.min(canvasHeight - imageElement.height, y - dragStart.y));
        
        onImageChange({
          ...imageElement,
          x: newX,
          y: newY
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newWidth = Math.max(20, Math.min(canvasWidth - imageElement.x, resizeStart.width + deltaX));
        const newHeight = Math.max(20, Math.min(canvasHeight - imageElement.y, resizeStart.height + deltaY));
        
        onImageChange({
          ...imageElement,
          width: newWidth,
          height: newHeight
        });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, imageElement, canvasWidth, canvasHeight, onImageChange]);

  return (
    <div
      className="absolute border-2 border-blue-500 cursor-move"
      style={{
        left: imageElement.x,
        top: imageElement.y,
        width: imageElement.width,
        height: imageElement.height,
        transform: `rotate(${imageElement.rotation}deg)`,
        zIndex: 1
      }}
      onMouseDown={(e) => handleMouseDown(e, 'drag')}
    >
      <img
        src={imageElement.url}
        alt="Background"
        className="w-full h-full object-cover pointer-events-none"
        draggable={false}
      />
      
      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
        style={{ zIndex: 105 }}
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e, 'resize');
        }}
      />
    </div>
  );
};