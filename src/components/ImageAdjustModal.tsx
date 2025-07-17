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
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // State
  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
  const [originalSize, setOriginalSize] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
  
  // Load image and set initial position
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      const originalWidth = img.width;
      const originalHeight = img.height;
      setOriginalSize({ width: originalWidth, height: originalHeight });
      
      const cropAspect = canvasWidth / canvasHeight; // should be 2/3 for 4"x6"
      const imgAspect = originalWidth / originalHeight;

      let displayWidth, displayHeight;

      if (imgAspect > cropAspect) {
        // Image is wider than the crop frame. Fit by height.
        displayHeight = canvasHeight * zoom;
        displayWidth = displayHeight * imgAspect;
      } else {
        // Image is taller (or equal) than the crop frame. Fit by width.
        displayWidth = canvasWidth * zoom;
        displayHeight = displayWidth / imgAspect;
      }

      // Center the image in the frame
      const offsetX = (canvasWidth - displayWidth) / 2;
      const offsetY = (canvasHeight - displayHeight) / 2;

      setImageSize({ width: displayWidth, height: displayHeight });
      setPosition({ x: offsetX, y: offsetY });
    };
    
    img.src = imageUrl;
  }, [imageUrl, canvasWidth, canvasHeight]);
  
  // Handle zoom change
  const handleZoomChange = (newZoom: number[]) => {
    const zoomValue = newZoom[0];
    if (originalSize.width && originalSize.height) {
      const cropAspect = canvasWidth / canvasHeight;
      const imgAspect = originalSize.width / originalSize.height;

      let displayWidth, displayHeight;

      if (imgAspect > cropAspect) {
        // Image is wider than the crop frame. Fit by height.
        displayHeight = canvasHeight * zoomValue;
        displayWidth = displayHeight * imgAspect;
      } else {
        // Image is taller (or equal) than the crop frame. Fit by width.
        displayWidth = canvasWidth * zoomValue;
        displayHeight = displayWidth / imgAspect;
      }

      // Adjust position to keep the center point stable during zoom
      const centerX = position.x + (imageSize.width / 2);
      const centerY = position.y + (imageSize.height / 2);
      
      const newX = centerX - (displayWidth / 2);
      const newY = centerY - (displayHeight / 2);

      setImageSize({ width: displayWidth, height: displayHeight });
      setPosition({ x: newX, y: newY });
      setZoom(zoomValue);
    }
  };
  
  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  
  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    // Calculate new position based on mouse movement
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;
    
    // Limit position to ensure image always covers the frame
    const zoomedWidth = imageSize.width;
    const zoomedHeight = imageSize.height;
    
    // Set bounds to ensure image covers the entire frame
    const minX = canvasWidth - zoomedWidth;
    const minY = canvasHeight - zoomedHeight;
    
    newX = Math.min(0, Math.max(minX, newX));
    newY = Math.min(0, Math.max(minY, newY));
    
    setPosition({ x: newX, y: newY });
  };
  
  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handle confirm button click
  const handleConfirm = () => {
    // Scale factor between original image and displayed size
    const scaleX = originalSize.width / imageSize.width;
    const scaleY = originalSize.height / imageSize.height;
    
    // Create the final image element with adjusted values
    const imageElement: ImageElement = {
      url: imageUrl,
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      rotation: 0,
      originalWidth: originalSize.width,
      originalHeight: originalSize.height
    };
    
    onConfirm(imageElement);
  };

  // Add event listeners for mouse events outside of the component
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // Calculate new position based on mouse movement
      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;
      
      // Limit position to ensure image always covers the frame
      const zoomedWidth = imageSize.width;
      const zoomedHeight = imageSize.height;
      
      // Set bounds to ensure image covers the entire frame
      const minX = canvasWidth - zoomedWidth;
      const minY = canvasHeight - zoomedHeight;
      
      newX = Math.min(0, Math.max(minX, newX));
      newY = Math.min(0, Math.max(minY, newY));
      
      setPosition({ x: newX, y: newY });
    };
    
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, imageSize.width, imageSize.height, canvasWidth, canvasHeight]);
  
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
          {/* Image adjustment area */}
          <div className="flex justify-center">
            <div 
              ref={containerRef}
              className="relative border-2 border-muted overflow-hidden bg-muted/10"
              style={{
                width: Math.min(canvasWidth, window.innerWidth - 120),
                height: Math.min(canvasHeight, (window.innerWidth - 120) * 1.5),
                maxWidth: canvasWidth,
                maxHeight: canvasHeight,
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
                    width: `${imageSize.width}px`,
                    height: `${imageSize.height}px`,
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
              min={1}
              max={3}
              step={0.1}
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
