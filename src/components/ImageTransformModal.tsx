import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageTransformModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  transform: {
    scale: number;
    offsetX: number;
    offsetY: number;
  };
  onTransformChange: (transform: { scale: number; offsetX: number; offsetY: number }) => void;
  onApply: () => void;
}

export const ImageTransformModal: React.FC<ImageTransformModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  transform,
  onTransformChange,
  onApply
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const previewRef = useRef<HTMLCanvasElement>(null);

  const drawPreview = () => {
    const canvas = previewRef.current;
    if (!canvas || !imageUrl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.onload = () => {
      try {
        const { scale, offsetX, offsetY } = transform;
        
        // Calculate fit-to-canvas scale (same logic as main preview)
        const fitToCanvasScale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height
        );
        
        // Apply user transform scale on top of fit-to-canvas scale
        const finalScale = fitToCanvasScale * scale;
        
        // Calculate final dimensions
        const scaledWidth = img.width * finalScale;
        const scaledHeight = img.height * finalScale;
        
        // Center the image by default, then apply user offsets
        const centeredX = (canvas.width - scaledWidth) / 2;
        const centeredY = (canvas.height - scaledHeight) / 2;
        
        // Draw the transformed image
        ctx.drawImage(
          img,
          centeredX + offsetX,
          centeredY + offsetY,
          scaledWidth,
          scaledHeight
        );
        
        // Draw border to show label boundaries
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        ctx.setLineDash([]);
      } catch (error) {
        console.error('Error drawing preview:', error);
      }
    };
    img.onerror = () => {
      console.error('Failed to load image:', imageUrl);
    };
    img.src = imageUrl;
  };

  useEffect(() => {
    if (isOpen) {
      drawPreview();
    }
  }, [isOpen, transform, imageUrl]);

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setLastMousePos({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const deltaX = event.clientX - lastMousePos.x;
    const deltaY = event.clientY - lastMousePos.y;

    onTransformChange({
      ...transform,
      offsetX: transform.offsetX + deltaX,
      offsetY: transform.offsetY + deltaY
    });

    setLastMousePos({ x: event.clientX, y: event.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomChange = (value: number[]) => {
    onTransformChange({
      ...transform,
      scale: value[0] / 100
    });
  };

  const handlePresetFit = () => {
    onTransformChange({
      scale: 1,
      offsetX: 0,
      offsetY: 0
    });
  };

  const handlePresetFill = () => {
    onTransformChange({
      scale: 1.5,
      offsetX: -96,
      offsetY: -128
    });
  };

  const handleReset = () => {
    onTransformChange({
      scale: 1,
      offsetX: 0,
      offsetY: 0
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-full overflow-auto p-3 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">Transform Background Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Preview Canvas */}
          <div className="flex justify-center">
            <div className="border-2 border-muted rounded-lg p-1 bg-muted/20 w-fit">
              <canvas
                ref={previewRef}
                width={288}
                height={384}
                className="border border-border rounded cursor-move w-[288px] h-[384px]"
                style={{ aspectRatio: '288/384' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3 px-1">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Zoom</label>
                <span className="text-xs text-muted-foreground">
                  {Math.round(transform.scale * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ZoomOut className="w-3 h-3" />
                <Slider
                  value={[transform.scale * 100]}
                  onValueChange={handleZoomChange}
                  min={50}
                  max={300}
                  step={5}
                  className="flex-1"
                />
                <ZoomIn className="w-3 h-3" />
              </div>
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              <Button
                onClick={handlePresetFit}
                variant="outline"
                size="sm"
                className="text-xs px-2 py-1 h-8"
              >
                Fit
              </Button>
              <Button
                onClick={handlePresetFill}
                variant="outline"
                size="sm"
                className="text-xs px-2 py-1 h-8"
              >
                Fill
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-xs px-2 py-1 h-8"
              >
                <RotateCcw className="w-2 h-2" />
                Reset
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center px-1">
              Drag to reposition • Slider to zoom
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button onClick={onClose} variant="outline" className="w-full sm:w-auto h-8 text-sm">
            Cancel
          </Button>
          <Button onClick={onApply} className="w-full sm:w-auto h-8 text-sm">
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};