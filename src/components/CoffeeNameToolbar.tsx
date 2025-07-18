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
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
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
  canvasHeight,
  onMouseEnter,
  onMouseLeave
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
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Compact font selector - no label, minimal spacing */}
      <div className="flex items-center">
        <div className="space-y-0">
          <select
            value={font}
            onChange={(e) => onFontChange(e.target.value)}
            className="px-2 py-1 text-xs border border-border rounded bg-background min-w-32 z-50"
            style={{ zIndex: 9999 }}
          >
            <option value="serif" style={{ fontFamily: 'serif' }}>Serif</option>
            <option value="sans-serif" style={{ fontFamily: 'sans-serif' }}>Sans Serif</option>
            <option value="monospace" style={{ fontFamily: 'monospace' }}>Monospace</option>
            <option value="cursive" style={{ fontFamily: 'cursive' }}>Cursive</option>
            <option value="AgencyFB, sans-serif" style={{ fontFamily: 'AgencyFB, sans-serif' }}>Agency FB</option>
            <option value="Alger, serif" style={{ fontFamily: 'Alger, serif' }}>Alger</option>
            <option value="Antique, serif" style={{ fontFamily: 'Antique, serif' }}>Antique</option>
            <option value="ArialCustom, sans-serif" style={{ fontFamily: 'ArialCustom, sans-serif' }}>Arial</option>
            <option value="Bahnschrift, sans-serif" style={{ fontFamily: 'Bahnschrift, sans-serif' }}>Bahnschrift</option>
            <option value="Bell, serif" style={{ fontFamily: 'Bell, serif' }}>Bell</option>
            <option value="Cambria, serif" style={{ fontFamily: 'Cambria, serif' }}>Cambria</option>
            <option value="Dubai, sans-serif" style={{ fontFamily: 'Dubai, sans-serif' }}>Dubai</option>
            <option value="FertigoPro, serif" style={{ fontFamily: 'FertigoPro, serif' }}>Fertigo Pro</option>
            <option value="FreeScript, cursive" style={{ fontFamily: 'FreeScript, cursive' }}>Free Script</option>
            <option value="FuturaBlack, sans-serif" style={{ fontFamily: 'FuturaBlack, sans-serif' }}>Futura Black</option>
            <option value="IntensaBlack, sans-serif" style={{ fontFamily: 'IntensaBlack, sans-serif' }}>Intensa Black</option>
            <option value="InterstateBlack, sans-serif" style={{ fontFamily: 'InterstateBlack, sans-serif' }}>Interstate Black</option>
            <option value="InterstateMono, monospace" style={{ fontFamily: 'InterstateMono, monospace' }}>Interstate Mono</option>
            <option value="Jokerman, fantasy" style={{ fontFamily: 'Jokerman, fantasy' }}>Jokerman</option>
            <option value="LithosPro, serif" style={{ fontFamily: 'LithosPro, serif' }}>Lithos Pro</option>
            <option value="Mistral, cursive" style={{ fontFamily: 'Mistral, cursive' }}>Mistral</option>
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