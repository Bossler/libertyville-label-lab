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
    const img = new Image();
    img.onload = () => {
      const originalWidth = img.width;
      const originalHeight = img.height;
      setOriginalSize({ width: originalWidth, height: originalHeight });
      
      // Calculate scale to fit the image in the frame
      const containerAspect = canvasWidth / canvasHeight;
      const imgAspect = originalWidth / originalHeight;
      
      let width, height;
      if (imgAspect > containerAspect) {
        // Image is wider than container (relative to aspect ratio)
        height = canvasHeight;
        width = height * imgAspect;
      } else {
        // Image is taller than container (relative to aspect ratio)
        width = canvasWidth;
        height = width / imgAspect;
      }
      
      setImageSize({ width, height });
      
      // Center image initially
      setPosition({
        x: (canvasWidth - width) / 2,
        y: (canvasHeight - height) / 2
      });
    };
    
    img.src = imageUrl;
  }, [imageUrl, canvasWidth, canvasHeight]);
  
  // Handle zoom change
  const handleZoomChange = (newZoom: number[]) => {
    const zoomValue = newZoom[0];
    if (imageRef.current && containerRef.current) {
      // Calculate the center of the visible frame
      const frameCenter = {
        x: canvasWidth / 2,
        y: canvasHeight / 2
      };
      
      // Calculate how much the image dimensions will change
      const prevWidth = imageSize.width * zoom;
      const prevHeight = imageSize.height * zoom;
      const newWidth = imageSize.width * zoomValue;
      const newHeight = imageSize.height * zoomValue;
      const diffWidth = newWidth - prevWidth;
      const diffHeight = newHeight - prevHeight;
      
      // Adjust position to keep the center point fixed
      const newX = position.x - (diffWidth / 2);
      const newY = position.y - (diffHeight / 2);
      
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
    const zoomedWidth = imageSize.width * zoom;
    const zoomedHeight = imageSize.height * zoom;
    
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
    // Calculate the crop coordinates in terms of the original image
    const zoomedWidth = imageSize.width * zoom;
    const zoomedHeight = imageSize.height * zoom;
    
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
      const zoomedWidth = imageSize.width * zoom;
      const zoomedHeight = imageSize.height * zoom;
      
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
  }, [isDragging, dragStart, imageSize.width, imageSize.height, zoom, canvasWidth, canvasHeight]);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-3xl w-full">
        <h2 className="text-xl font-bold mb-4">Adjust Image</h2>
        
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Position and zoom your image to fit the label. Drag to reposition, use the slider to zoom.
          </p>
        </div>
        
        {/* Image adjustment area */}
        <div 
          ref={containerRef}
          className="relative mb-6 mx-auto border-2 border-muted overflow-hidden"
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
                width: `${imageSize.width * zoom}px`,
                height: `${imageSize.height * zoom}px`,
                left: `${position.x}px`,
                top: `${position.y}px`,
                userSelect: 'none',
                pointerEvents: 'none'
              }}
              draggable={false}
            />
          )}
        </div>
        
        {/* Zoom controls */}
        <div className="flex items-center space-x-4 mb-6">
          <ZoomOut className="w-4 h-4" />
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.1}
            className="flex-1"
            onValueChange={handleZoomChange}
          />
          <ZoomIn className="w-4 h-4" />
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-2">
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
