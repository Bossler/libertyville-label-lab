import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { ZoomIn, ZoomOut, Check, X } from 'lucide-react';
import { ImageElement } from '@/types/label';

interface ImageAdjustModalProps {
  imageUrl: string;
  onConfirm: (imageElement: ImageElement) => void;
  onCancel: () => void;
  canvasWidth: number;
  canvasHeight: number;
}

export const ImageAdjustModal: React.FC<ImageAdjustModalProps> = ({
  imageUrl,
  onConfirm,
  onCancel,
  canvasWidth,
  canvasHeight
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number, height: number }>({ width: 0, height: 0 });

  // When image loads, set its natural size and set initial zoom to fit image
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      setImageNaturalSize({ width: img.width, height: img.height });

      // Set initial zoom to fit image within canvas while maintaining aspect ratio
      const scaleX = canvasWidth / img.width;
      const scaleY = canvasHeight / img.height;
      const initialZoom = Math.min(scaleX, scaleY);
      setZoom(initialZoom);

      // Center image both horizontally and vertically
      const displayWidth = img.width * initialZoom;
      const displayHeight = img.height * initialZoom;
      setPosition({
        x: (canvasWidth - displayWidth) / 2,
        y: (canvasHeight - displayHeight) / 2
      });
    };
    img.src = imageUrl;
  }, [imageUrl, canvasWidth, canvasHeight]);

  // Drag logic
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Allow free movement (image can exceed boundaries when zoomed in)
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // For dragging outside crop area
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Allow free movement (image can exceed boundaries when zoomed in)
      setPosition({ x: newX, y: newY });
    };
    const handleGlobalMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart]);

  // Zoom handler: maintain center point while allowing proportional scaling
  const handleZoomChange = (newZoomArr: number[]) => {
    const newZoom = newZoomArr[0];
    
    // Calculate the center point of the visible area to maintain
    const oldDisplayWidth = imageNaturalSize.width * zoom;
    const oldDisplayHeight = imageNaturalSize.height * zoom;
    const centerX = -position.x + canvasWidth / 2;
    const centerY = -position.y + canvasHeight / 2;
    const relativeCenterX = centerX / oldDisplayWidth;
    const relativeCenterY = centerY / oldDisplayHeight;

    // Calculate new dimensions and position
    const newDisplayWidth = imageNaturalSize.width * newZoom;
    const newDisplayHeight = imageNaturalSize.height * newZoom;
    const newCenterX = relativeCenterX * newDisplayWidth;
    const newCenterY = relativeCenterY * newDisplayHeight;
    
    const newX = canvasWidth / 2 - newCenterX;
    const newY = canvasHeight / 2 - newCenterY;

    setZoom(newZoom);
    setPosition({ x: newX, y: newY });
  };

  // Confirm: output crop info for rendering/export
  const handleConfirm = () => {
    // Calculate cropping rectangle in original image coordinates
    const sx = Math.round(-position.x / zoom);
    const sy = Math.round(-position.y / zoom);
    const sWidth = Math.round(canvasWidth / zoom);
    const sHeight = Math.round(canvasHeight / zoom);

    const imageElement: ImageElement = {
      url: imageUrl,
      x: sx,
      y: sy,
      width: sWidth,
      height: sHeight,
      rotation: 0,
      originalWidth: imageNaturalSize.width,
      originalHeight: imageNaturalSize.height
    };
    onConfirm(imageElement);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-4xl max-h-[95vh] overflow-auto">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Adjust Image</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Position and zoom your image to fit the label. Drag to reposition, use the slider to zoom.
          </p>
        </div>
        {/* Main content */}
        <div className="p-4 space-y-6">
          <div className="flex justify-center">
            <div
              ref={containerRef}
              className="relative border-2 border-muted overflow-hidden bg-muted/10"
              style={{
                width: canvasWidth,
                height: canvasHeight,
                cursor: isDragging ? 'grabbing' : 'grab'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {imageUrl && (
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Adjust"
                  className="absolute"
                  style={{
                    position: 'absolute',
                    width: `${imageNaturalSize.width * zoom}px`,
                    height: `${imageNaturalSize.height * zoom}px`,
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    userSelect: 'none',
                    pointerEvents: 'none'
                  }}
                  draggable={false}
                />
              )}
            </div>
          </div>
          {/* Zoom controls */}
          <div className="flex items-center space-x-4 max-w-md mx-auto">
            <ZoomOut className="w-4 h-4 flex-shrink-0" />
            <Slider
              value={[zoom]}
              min={0.25}
              max={5}
              step={0.01}
              className="flex-1"
              onValueChange={handleZoomChange}
            />
            <ZoomIn className="w-4 h-4 flex-shrink-0" />
          </div>
        </div>
        {/* Footer */}
        <div className="p-4 border-t flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            <Check className="w-4 h-4 mr-2" />
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

