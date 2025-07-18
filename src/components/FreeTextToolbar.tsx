import React from 'react';
import { Button } from '@/components/ui/button';
import { FontSelector } from './FontSelector';
import { ColorPicker } from './ColorPicker';
import { TextBox } from '@/types/label';

interface FreeTextToolbarProps {
  textBox: TextBox;
  position: { x: number; y: number };
  bounds: { width: number; height: number } | null;
  onFontChange: (font: string) => void;
  onColorChange: (color: string) => void;
  onFontSizeChange: (size: number) => void;
  isVisible: boolean;
  canvasWidth: number;
  canvasHeight: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const FreeTextToolbar: React.FC<FreeTextToolbarProps> = ({
  textBox,
  position,
  bounds,
  onFontChange,
  onColorChange,
  onFontSizeChange,
  isVisible,
  canvasWidth,
  canvasHeight,
  onMouseEnter,
  onMouseLeave
}) => {
  if (!isVisible || !bounds) return null;

  // Calculate toolbar position - above the text box
  const toolbarWidth = 300;
  const toolbarHeight = 80;
  
  let toolbarX = position.x - toolbarWidth / 2;
  let toolbarY = position.y - bounds.height - toolbarHeight - 10;
  
  // Keep toolbar within canvas bounds
  toolbarX = Math.max(10, Math.min(canvasWidth - toolbarWidth - 10, toolbarX));
  
  // If toolbar would go above canvas, position it below
  if (toolbarY < 10) {
    toolbarY = position.y + bounds.height + 10;
  }

  return (
    <div
      className="absolute bg-white border border-border rounded-lg shadow-lg p-3 z-50"
      style={{
        left: toolbarX,
        top: toolbarY,
        width: toolbarWidth,
        height: toolbarHeight
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="text-xs font-medium text-muted-foreground">Free Text</div>
        <FontSelector
          value={textBox.fontFamily}
          onChange={onFontChange}
        />
        <ColorPicker
          value={textBox.color}
          onChange={onColorChange}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium whitespace-nowrap">Size:</label>
        <input
          type="range"
          min="16"
          max="48"
          value={textBox.fontSize}
          onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-8">{textBox.fontSize}px</span>
      </div>
    </div>
  );
};
