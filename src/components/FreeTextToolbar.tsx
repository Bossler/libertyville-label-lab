import React from 'react';
import { Button } from '@/components/ui/button';
import { FontSelector } from './FontSelector';
import { ColorPicker } from './ColorPicker';
import { TextBox } from '@/types/label';

interface FreeTextToolbarProps {
  selectedTextBox: TextBox;
  position?: { x: number; y: number };
  onFontChange: (font: string) => void;
  onColorChange: (color: string) => void;
  onFontSizeChange: (size: number) => void;
  onDelete: () => void;
  isVisible: boolean;
}

export const FreeTextToolbar: React.FC<FreeTextToolbarProps> = ({
  selectedTextBox,
  position = { x: 0, y: 0 },
  onFontChange,
  onColorChange,
  onFontSizeChange,
  onDelete,
  isVisible
}) => {
  if (!isVisible) return null;

  // Calculate toolbar position - above the text box
  const toolbarWidth = 320;
  const toolbarHeight = 120;
  
  let toolbarX = position.x;
  let toolbarY = position.y;
  
  // Keep toolbar within viewport bounds
  const maxX = window.innerWidth - toolbarWidth - 20;
  const maxY = window.innerHeight - toolbarHeight - 20;
  
  toolbarX = Math.max(20, Math.min(maxX, toolbarX));
  toolbarY = Math.max(20, Math.min(maxY, toolbarY));

  return (
    <div
      className="absolute bg-white border border-border rounded-lg shadow-lg p-3 z-50"
      style={{
        left: toolbarX,
        top: toolbarY,
        width: toolbarWidth
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-muted-foreground">
          {selectedTextBox.type === 'freeText' ? 'Free Text' : 'Text Box'}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
        >
          ×
        </Button>
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <FontSelector
          value={selectedTextBox.fontFamily}
          onChange={onFontChange}
        />
        <ColorPicker
          value={selectedTextBox.color}
          onChange={onColorChange}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium whitespace-nowrap">Size:</label>
        <input
          type="range"
          min="8"
          max="48"
          value={selectedTextBox.fontSize}
          onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-10">{selectedTextBox.fontSize}px</span>
      </div>
    </div>
  );
};
