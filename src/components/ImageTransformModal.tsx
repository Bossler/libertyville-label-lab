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
      const { scale, offsetX, offsetY } = transform;
      
      // Calculate scaled dimensions
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      // Draw the transformed image
      ctx.drawImage(
        img,
        offsetX,
        offsetY,
        scaledWidth,
        scaledHeight
      );
      
      // Draw border to show label boundaries
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      ctx.setLineDash([]);
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
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full overflow-auto">
        <DialogHeader>
          <DialogTitle>Transform Background Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Preview Canvas */}
          <div className="flex justify-center">
            <div className="border-2 border-muted rounded-lg p-2 bg-muted/20 w-fit">
              <canvas
                ref={previewRef}
                width={384}
                height={512}
                className="border border-border rounded cursor-move max-w-[min(60vw,300px)] max-h-[min(80vh,400px)] w-auto h-auto"
                style={{ aspectRatio: '384/512' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4 px-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Zoom</label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(transform.scale * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ZoomOut className="w-4 h-4" />
                <Slider
                  value={[transform.scale * 100]}
                  onValueChange={handleZoomChange}
                  min={50}
                  max={300}
                  step={5}
                  className="flex-1"
                />
                <ZoomIn className="w-4 h-4" />
              </div>
            </div>

            {/* Preset Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handlePresetFit}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Fit to Label
              </Button>
              <Button
                onClick={handlePresetFill}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Fill Label
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center px-2">
              Drag the image to reposition • Use slider to zoom
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button onClick={onClose} variant="outline" className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={onApply} className="w-full sm:w-auto">
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};