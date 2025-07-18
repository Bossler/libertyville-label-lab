import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CoffeeNameToolbarProps {
  position: { x: number; y: number };
  bounds: { width: number; height: number } | null;
  font: string;
  color: string;
  onFontChange: (font: string) => void;
  onColorChange: (color: string) => void;
  isVisible: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

export const CoffeeNameToolbar: React.FC<CoffeeNameToolbarProps> = ({
  position,
  bounds,
  font,
  color,
  onFontChange,
  onColorChange,
  isVisible,
  canvasWidth,
  canvasHeight
}) => {
  const isMobile = useIsMobile();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isVisible || !bounds || isMobile) return;

    const toolbarHeight = 50; // Estimated toolbar height
    const toolbarWidth = 200; // Estimated toolbar width
    const margin = 10;

    // Calculate optimal position (prefer above, fallback to below)
    let x = position.x - toolbarWidth / 2;
    let y = position.y - bounds.height - toolbarHeight - margin;

    // Constrain horizontally to canvas bounds
    x = Math.max(margin, Math.min(canvasWidth - toolbarWidth - margin, x));

    // If toolbar would go above canvas, place it below instead
    if (y < margin) {
      y = position.y + margin;
    }

    setToolbarPosition({ x, y });
  }, [position, bounds, isVisible, canvasWidth, canvasHeight, isMobile]);

  // Don't render on mobile - mobile uses the sidebar panel instead
  if (isMobile || !isVisible || !bounds) {
    return null;
  }

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 bg-background border border-border rounded-lg shadow-lg p-2 flex gap-2 items-center animate-fade-in"
      style={{
        left: toolbarPosition.x,
        top: toolbarPosition.y,
        transform: 'translateZ(0)', // Force GPU acceleration for smooth positioning
      }}
      // Prevent toolbar from interfering with drag operations
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Compact font selector - no label, minimal spacing */}
      <div className="flex items-center">
        <div className="space-y-0">
          <select
            value={font}
            onChange={(e) => onFontChange(e.target.value)}
            className="px-2 py-1 text-xs border border-border rounded bg-background min-w-24"
          >
            <option value="serif">Serif</option>
            <option value="sans-serif">Sans</option>
            <option value="monospace">Mono</option>
            <option value="cursive">Cursive</option>
            <option value="FertigoPro, serif">Fertigo</option>
            <option value="AgencyFB, sans-serif">Agency</option>
            <option value="Arial, sans-serif">Arial</option>
          </select>
        </div>
      </div>
      
      <div className="w-px h-6 bg-border" />
      
      {/* Compact color picker - just the color input */}
      <div className="flex items-center">
        <input
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-6 h-6 rounded border border-border cursor-pointer"
          title={`Color: ${color}`}
        />
      </div>
    </div>
  );
};