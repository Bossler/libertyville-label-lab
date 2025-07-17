import React, { useState, useEffect, useCallback } from 'react';
import { TextBox } from '@/types/label';

interface TextBoxEditorProps {
  textBox: TextBox;
  canvasWidth: number;
  canvasHeight: number;
  isSelected: boolean;
  onTextBoxChange: (textBox: TextBox) => void;
  onSelect: () => void;
}

export const TextBoxEditor: React.FC<TextBoxEditorProps> = ({
  textBox,
  canvasWidth,
  canvasHeight,
  isSelected,
  onTextBoxChange,
  onSelect
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(textBox.content);

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    // Get the overlay container to calculate relative coordinates
    const overlay = document.querySelector('[style*="zIndex: 5"]') as HTMLElement;
    if (!overlay) return;
    
    const rect = overlay.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newX = Math.max(0, Math.min(canvasWidth - textBox.width, x - dragStart.x));
    const newY = Math.max(0, Math.min(canvasHeight - textBox.height, y - dragStart.y));
    
    onTextBoxChange({
      ...textBox,
      x: newX,
      y: newY
    });
  }, [isDragging, dragStart, textBox, canvasWidth, canvasHeight, onTextBoxChange]);

  const handleGlobalMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect();
    
    setIsDragging(true);
    // Calculate offset from mouse to top-left of text box
    setDragStart({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  };

  // Global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, handleGlobalMouseMove, handleGlobalMouseUp]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(textBox.content);
  };

  const handleEditSubmit = () => {
    onTextBoxChange({
      ...textBox,
      content: editValue
    });
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditValue(textBox.content);
    setIsEditing(false);
  };

  return (
    <div
      className={`absolute cursor-move ${isSelected ? 'border-2 border-blue-500' : 'border border-transparent'}`}
      style={{
        left: textBox.x,
        top: textBox.y,
        width: textBox.width,
        height: textBox.height,
        zIndex: 100
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEditSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              handleEditSubmit();
            } else if (e.key === 'Escape') {
              handleEditCancel();
            }
          }}
          className="w-full h-full bg-transparent border-none outline-none resize-none"
          style={{
            fontSize: textBox.fontSize,
            fontFamily: textBox.fontFamily,
            color: textBox.color
          }}
          autoFocus
        />
      ) : (
        <div
          className="w-full h-full"
          style={{
            fontSize: textBox.fontSize,
            fontFamily: textBox.fontFamily,
            color: textBox.color,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}
        >
          {textBox.content || 'Double-click to edit'}
        </div>
      )}
    </div>
  );
};