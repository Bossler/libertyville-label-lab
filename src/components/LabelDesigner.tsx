import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image, Plus, Trash2, Type, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { FontSelector } from './FontSelector';
import { ColorPicker } from './ColorPicker';
import { ImageAdjustModal } from './ImageAdjustModal';
import { TextBoxEditor } from './TextBoxEditor';
import { CoffeeNameToolbar } from './CoffeeNameToolbar';
import { FreeTextToolbar } from './FreeTextToolbar';
import { useIsMobile } from '@/hooks/use-mobile';
import { LabelData, ProductInfo, TextBox, ImageElement } from '@/types/label';

interface LabelDesignerProps {
  labelData: LabelData;
  onLabelChange: (data: LabelData) => void;
  productName?: string;
  productInfo?: ProductInfo | null;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;

export const LabelDesigner: React.FC<LabelDesignerProps> = ({ 
  labelData, 
  onLabelChange,
  productName,
  productInfo 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedTextBoxIndex, setSelectedTextBoxIndex] = useState<number | null>(null);
  const [showStylingPanel, setShowStylingPanel] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [isDraggingCoffeeName, setIsDraggingCoffeeName] = useState(false);
  
  // Mobile-specific state for coffee name selection
  const isMobile = useIsMobile();
  const [isCoffeeNameSelected, setIsCoffeeNameSelected] = useState(false);
  const [isHoveringCoffeeName, setIsHoveringCoffeeName] = useState(false);
  const [toolbarHoverTimeout, setToolbarHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // Initialize coffee name position from labelData or use default
  const coffeeNamePosition = labelData.coffeeNamePosition || { x: CANVAS_WIDTH / 2, y: 80 };

  // Canvas drawing function
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background image first (bottom layer)
    if (labelData.backgroundImage) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const bgImg = labelData.backgroundImage!;
        
        // Use the crop parameters from ImageAdjustModal
        ctx.drawImage(
          img,
          bgImg.x, bgImg.y, bgImg.width, bgImg.height, // Source crop rectangle
          0, 0, CANVAS_WIDTH, CANVAS_HEIGHT // Draw to fill entire canvas
        );
        
        // Draw text elements on top of image
        drawTextElements(ctx);
        if (previewMode) drawWatermark(ctx);
      };
      img.src = labelData.backgroundImage.url;
    } else {
      // No background image, just draw text
      drawTextElements(ctx);
      if (previewMode) drawWatermark(ctx);
    }
  }, [labelData, previewMode]);

  // Helper function to calculate optimal font size for coffee name
  const calculateOptimalFontSize = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, requestedFontSize: number, minFontSize: number, fontFamily: string): number => {
    let fontSize = requestedFontSize;
    
    while (fontSize >= minFontSize) {
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      const textWidth = ctx.measureText(text).width;
      
      if (textWidth <= maxWidth) {
        return fontSize;
      }
      
      fontSize -= 2; // Reduce by 2px increments
    }
    
    return minFontSize;
  };

  const drawTextElements = (ctx: CanvasRenderingContext2D) => {
    const displayProductInfo = productInfo || {
      weight: '12 oz',
      grind: 'whole-bean' as const,
      type: 'regular' as const
    };

    // Draw dynamically scaled coffee name at current position
    ctx.save();
    ctx.fillStyle = labelData.coffeeNameColor || '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    
    const coffeeName = productInfo?.name || labelData.coffeeName || 'Coffee Name';
    const fontFamily = labelData.coffeeNameFont || 'serif';
    const maxWidth = CANVAS_WIDTH - 40; // Leave 20px margin on each side
    const requestedFontSize = labelData.coffeeNameFontSize || 32;
    const minFontSize = 16;
    
    // Calculate optimal font size based on user's requested size
    const optimalFontSize = calculateOptimalFontSize(ctx, coffeeName, maxWidth, requestedFontSize, minFontSize, fontFamily);
    ctx.font = `bold ${optimalFontSize}px ${fontFamily}`;
    
    // Check if text still doesn't fit at minimum size - wrap if needed
    const textWidth = ctx.measureText(coffeeName).width;
    if (textWidth > maxWidth && optimalFontSize === minFontSize) {
      // Split text into words and wrap
      const words = coffeeName.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = ctx.measureText(testLine).width;
        
        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      
      // Draw wrapped text at current position
      const lineHeight = optimalFontSize * 1.2;
      const startY = coffeeNamePosition.y - ((lines.length - 1) * lineHeight) / 2;
      
      lines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        ctx.strokeText(line, coffeeNamePosition.x, y);
        ctx.fillText(line, coffeeNamePosition.x, y);
      });
    } else {
      // Draw single line at current position
      ctx.strokeText(coffeeName, coffeeNamePosition.x, coffeeNamePosition.y);
      ctx.fillText(coffeeName, coffeeNamePosition.x, coffeeNamePosition.y);
    }
    
    ctx.restore();

    // Draw text boxes in proper layer order with proper text wrapping
    // Free text first (behind regular text boxes)
    labelData.textBoxes
      .filter(textBox => textBox.type === 'freeText')
      .forEach(textBox => {
        ctx.save();
        ctx.fillStyle = textBox.color;
        ctx.font = `${textBox.fontSize}px ${textBox.fontFamily}`;
        
        const lines = textBox.content.split('\n');
        const maxWidth = textBox.width - 10; // Leave some padding
        const wrappedLines: string[] = [];
        
        // Wrap text to fit within textBox width
        lines.forEach(line => {
          if (ctx.measureText(line).width <= maxWidth) {
            wrappedLines.push(line);
          } else {
            // Split line into words and wrap
            const words = line.split(' ');
            let currentLine = '';
            
            for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              const testWidth = ctx.measureText(testLine).width;
              
              if (testWidth <= maxWidth) {
                currentLine = testLine;
              } else {
                if (currentLine) wrappedLines.push(currentLine);
                currentLine = word;
              }
            }
            if (currentLine) wrappedLines.push(currentLine);
          }
        });
        
        // Draw wrapped lines
        wrappedLines.forEach((line, index) => {
          ctx.fillText(
            line, 
            textBox.x + 5, // Small left padding
            textBox.y + (index + 1) * textBox.fontSize * 1.2
          );
        });
        ctx.restore();
      });

    // Regular text boxes second
    labelData.textBoxes
      .filter(textBox => textBox.type !== 'freeText')
      .forEach(textBox => {
        ctx.save();
        ctx.fillStyle = textBox.color;
        ctx.font = `${textBox.fontSize}px ${textBox.fontFamily}`;
        
        const lines = textBox.content.split('\n');
        lines.forEach((line, index) => {
          ctx.fillText(
            line, 
            textBox.x, 
            textBox.y + (index + 1) * textBox.fontSize * 1.2
          );
        });
        ctx.restore();
      });

    // Product info footer
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    
    // Calculate text positions - moved closer together
    const productInfoY = CANVAS_HEIGHT - 80;
    const today = new Date();
    const roastDate = today.toLocaleDateString();
    
    // Draw rounded rectangle background with 70% white transparency
    const padding = 10;
    const backgroundHeight = 110; // Increased height to fit all text properly
    const backgroundY = CANVAS_HEIGHT - backgroundHeight - 10;
    const backgroundWidth = 320;
    const backgroundX = (CANVAS_WIDTH - backgroundWidth) / 2;
    const cornerRadius = 8;
    
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.roundRect(backgroundX, backgroundY, backgroundWidth, backgroundHeight, cornerRadius);
    ctx.fill();
    ctx.restore();
    
    // Product details - 11pt font, top justified to box
    const productFontSize = 15; // 11pt at 96dpi = 15px
    const productFont = 'FertigoPro, serif';
    ctx.font = `${productFontSize}px ${productFont}`;
    ctx.fillStyle = '#000000';
    
    // Position product data at top of rectangle
    const productTopY = backgroundY + padding + productFontSize;
    
    // Split product info across the width of the rectangle
    const leftX = backgroundX + padding + 40;
    const centerX = CANVAS_WIDTH / 2;
    const rightX = backgroundX + backgroundWidth - padding - 40;
    
    ctx.textAlign = 'left';
    ctx.fillText(`${displayProductInfo.weight}`, leftX, productTopY);
    ctx.textAlign = 'center';
    ctx.fillText(`${displayProductInfo.grind === 'whole-bean' ? 'Whole Bean' : 'Ground'}`, centerX, productTopY);
    ctx.textAlign = 'right';
    ctx.fillText(`${displayProductInfo.type === 'regular' ? 'Regular' : 'Decaffeinated'}`, rightX, productTopY);
    
    ctx.textAlign = 'center';
    ctx.fillText(`Roast Date: ${roastDate}`, CANVAS_WIDTH / 2, productTopY + 20);

    // Company info - 8pt font, bottom justified to box
    const footerFontSize = 11; // 8pt at 96dpi = 11px
    const footerFont = 'FertigoPro, serif';
    ctx.font = `${footerFontSize}px ${footerFont}`;
    
    // Position footer data at bottom of rectangle with proper spacing
    const footerBottomY = backgroundY + backgroundHeight - padding;
    
    ctx.fillText('JavaMania Coffee Roastery | Libertyville IL', CANVAS_WIDTH / 2, footerBottomY - 24);
    ctx.fillText('www.javamania.com', CANVAS_WIDTH / 2, footerBottomY - 12);
    ctx.fillText('100% Arabica Coffee & Natural Flavors', CANVAS_WIDTH / 2, footerBottomY);
  };

  const drawWatermark = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.font = 'bold 48px serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.fillText('PREVIEW ONLY', 0, 0);
    ctx.restore();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTempImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageConfirm = (imageElement: ImageElement) => {
    onLabelChange({
      ...labelData,
      backgroundImage: imageElement
    });
    setTempImageUrl(null);
    toast.success('Image added to label');
  };

  const handleImageCancel = () => {
    setTempImageUrl(null);
  };

  // Event handlers
  const addTextBox = () => {
    const newTextBox: TextBox = {
      id: Date.now().toString(),
      content: 'New Text',
      x: 50,
      y: 200,
      fontSize: 16,
      fontFamily: 'serif',
      color: '#000000',
      width: 200,
      height: 50,
      type: 'regular'
    };

    onLabelChange({
      ...labelData,
      textBoxes: [...labelData.textBoxes, newTextBox]
    });
    setSelectedTextBoxIndex(labelData.textBoxes.length);
  };

  const addFreeText = () => {
    const newFreeText: TextBox = {
      id: Date.now().toString(),
      content: 'Free Text',
      x: 50,
      y: 150,
      fontSize: 24,
      fontFamily: 'serif',
      color: '#ffffff', // White default for visibility
      width: 300,
      height: 60,
      type: 'freeText'
    };

    onLabelChange({
      ...labelData,
      textBoxes: [...labelData.textBoxes, newFreeText]
    });
    setSelectedTextBoxIndex(labelData.textBoxes.length);
  };

  const deleteSelectedTextBox = () => {
    if (selectedTextBoxIndex !== null) {
      onLabelChange({
        ...labelData,
        textBoxes: labelData.textBoxes.filter((_, index) => index !== selectedTextBoxIndex)
      });
      setSelectedTextBoxIndex(null);
    }
  };

  const updateTextBox = (updatedTextBox: TextBox) => {
    onLabelChange({
      ...labelData,
      textBoxes: labelData.textBoxes.map(tb => 
        tb.id === updatedTextBox.id ? updatedTextBox : tb
      )
    });
  };

  const updateCoffeeNameFont = (font: string) => {
    onLabelChange({
      ...labelData,
      coffeeNameFont: font
    });
  };

  const updateCoffeeNameColor = (color: string) => {
    onLabelChange({
      ...labelData,
      coffeeNameColor: color
    });
  };

  const updateCoffeeNameFontSize = (size: number) => {
    onLabelChange({
      ...labelData,
      coffeeNameFontSize: size
    });
  };

  const updateSelectedTextBoxFont = (font: string) => {
    if (selectedTextBoxIndex !== null) {
      const textBox = labelData.textBoxes[selectedTextBoxIndex];
      if (textBox) {
        updateTextBox({ ...textBox, fontFamily: font });
      }
    }
  };

  const updateSelectedTextBoxColor = (color: string) => {
    if (selectedTextBoxIndex !== null) {
      const textBox = labelData.textBoxes[selectedTextBoxIndex];
      if (textBox) {
        updateTextBox({ ...textBox, color });
      }
    }
  };

  const updateSelectedTextBoxFontSize = (size: number) => {
    if (selectedTextBoxIndex !== null) {
      const textBox = labelData.textBoxes[selectedTextBoxIndex];
      if (textBox) {
        updateTextBox({ ...textBox, fontSize: size });
      }
    }
  };

  const downloadPreview = () => {
    setPreviewMode(true);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const coffeeName = productInfo?.name || labelData.coffeeName || 'custom-blend';
        const link = document.createElement('a');
        link.download = `${coffeeName}-label-preview.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
      setPreviewMode(false);
    }, 100);
  };

  // Helper function to get text bounds for coffee name
  const getCoffeeNameBounds = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    const coffeeName = productInfo?.name || labelData.coffeeName || 'Coffee Name';
    const fontFamily = labelData.coffeeNameFont || 'serif';
    const maxWidth = CANVAS_WIDTH - 40;
    const requestedFontSize = labelData.coffeeNameFontSize || 32;
    const minFontSize = 16;
    
    const optimalFontSize = calculateOptimalFontSize(ctx, coffeeName, maxWidth, requestedFontSize, minFontSize, fontFamily);
    ctx.font = `bold ${optimalFontSize}px ${fontFamily}`;
    
    const textWidth = ctx.measureText(coffeeName).width;
    const textHeight = optimalFontSize;
    
    return {
      width: Math.min(textWidth, maxWidth),
      height: textHeight
    };
  };

  // Handle coffee name interaction (click/tap or drag)
  const handleCoffeeNameMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // On mobile, handle tap to select
    if (isMobile) {
      setIsCoffeeNameSelected(!isCoffeeNameSelected);
      return;
    }
    
    setIsDraggingCoffeeName(true);
    
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    const startPosX = coffeeNamePosition.x;
    const startPosY = coffeeNamePosition.y;
    
    const bounds = getCoffeeNameBounds();
    if (!bounds) return;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX - rect.left;
      const currentY = moveEvent.clientY - rect.top;
      
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      
      let newX = startPosX + deltaX;
      let newY = startPosY + deltaY;
      
      // Constrain to canvas bounds - keep text fully visible
      const halfWidth = bounds.width / 2;
      const textBottom = bounds.height;
      
      newX = Math.max(halfWidth, Math.min(CANVAS_WIDTH - halfWidth, newX));
      newY = Math.max(textBottom, Math.min(CANVAS_HEIGHT - 10, newY));
      
      // Update position in labelData so it persists
      onLabelChange({
        ...labelData,
        coffeeNamePosition: { x: newX, y: newY }
      });
    };
    
    const handleMouseUp = () => {
      setIsDraggingCoffeeName(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas, labelData.coffeeNamePosition]);

  const selectedTextBoxData = selectedTextBoxIndex !== null 
    ? labelData.textBoxes[selectedTextBoxIndex] 
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Coffee Label Designer</h1>
        <p className="text-muted-foreground">Create your custom coffee label</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas */}
        <div className="lg:col-span-2">
          <div className="relative border-2 border-muted shadow-lg mx-auto" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ zIndex: 0 }}
            />
            
            {/* Interactive overlay - positioned exactly over canvas */}
            <div
              ref={overlayRef}
              className="absolute top-0 left-0 pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTextBoxIndex(null);
                setIsCoffeeNameSelected(false);
              }}
              style={{
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                zIndex: 5,
                overflow: 'hidden'
              }}
            >
              {/* Coffee Name Interactive Area */}
              <div
                className={`absolute transition-colors ${
                  isMobile 
                    ? `cursor-pointer ${isCoffeeNameSelected ? 'bg-blue-200 bg-opacity-40' : 'hover:bg-blue-100 hover:bg-opacity-20'}`
                    : `cursor-move ${isDraggingCoffeeName ? 'bg-blue-200 bg-opacity-30' : 'hover:bg-blue-100 hover:bg-opacity-20'}`
                }`}
                style={{
                  left: coffeeNamePosition.x - (getCoffeeNameBounds()?.width || 100) / 2 - 10,
                  top: coffeeNamePosition.y - (getCoffeeNameBounds()?.height || 20) - 5,
                  width: (getCoffeeNameBounds()?.width || 100) + 20,
                  height: (getCoffeeNameBounds()?.height || 20) + 10,
                  zIndex: 10
                }}
                onMouseDown={handleCoffeeNameMouseDown}
                onMouseEnter={() => {
                  if (!isMobile) {
                    if (toolbarHoverTimeout) {
                      clearTimeout(toolbarHoverTimeout);
                      setToolbarHoverTimeout(null);
                    }
                    setIsHoveringCoffeeName(true);
                  }
                }}
                onMouseLeave={() => {
                  if (!isMobile) {
                    const timeout = setTimeout(() => {
                      setIsHoveringCoffeeName(false);
                    }, 150);
                    setToolbarHoverTimeout(timeout);
                  }
                }}
                title={isMobile ? "Tap to select coffee name" : "Drag to move coffee name"}
              />
              
              {/* Desktop Floating Toolbar */}
              <CoffeeNameToolbar
                position={coffeeNamePosition}
                bounds={getCoffeeNameBounds()}
                font={labelData.coffeeNameFont || 'serif'}
                color={labelData.coffeeNameColor || '#ffffff'}
                fontSize={labelData.coffeeNameFontSize || 32}
                onFontChange={updateCoffeeNameFont}
                onColorChange={updateCoffeeNameColor}
                onFontSizeChange={updateCoffeeNameFontSize}
                isVisible={isHoveringCoffeeName && !isDraggingCoffeeName}
                canvasWidth={CANVAS_WIDTH}
                canvasHeight={CANVAS_HEIGHT}
                onMouseEnter={() => {
                  if (toolbarHoverTimeout) {
                    clearTimeout(toolbarHoverTimeout);
                    setToolbarHoverTimeout(null);
                  }
                }}
                onMouseLeave={() => {
                  const timeout = setTimeout(() => {
                    setIsHoveringCoffeeName(false);
                  }, 150);
                  setToolbarHoverTimeout(timeout);
                }}
              />
              {/* Image drag/resize handles only - no image display */}
              {labelData.backgroundImage && (
                <div
                  className="absolute border-2 border-blue-500 cursor-move bg-transparent"
                  style={{
                    left: labelData.backgroundImage.x,
                    top: labelData.backgroundImage.y,
                    width: labelData.backgroundImage.width,
                    height: labelData.backgroundImage.height,
                    transform: `rotate(${labelData.backgroundImage.rotation}deg)`,
                    zIndex: 1
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startImageX = labelData.backgroundImage!.x;
                    const startImageY = labelData.backgroundImage!.y;
                    
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const deltaX = moveEvent.clientX - startX;
                      const deltaY = moveEvent.clientY - startY;
                      
                      // Invert the delta to make drag feel intuitive
                      const newX = startImageX - deltaX;
                      const newY = startImageY - deltaY;
                      
                      onLabelChange({
                        ...labelData,
                        backgroundImage: {
                          ...labelData.backgroundImage!,
                          x: newX,
                          y: newY
                        }
                      });
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  {/* Resize handle */}
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startWidth = labelData.backgroundImage!.width;
                      const startHeight = labelData.backgroundImage!.height;
                      const aspectRatio = labelData.backgroundImage!.originalWidth / labelData.backgroundImage!.originalHeight;
                      
                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        const deltaX = moveEvent.clientX - startX;
                        
                        // Calculate new width based on drag distance
                        let newWidth = Math.max(20, Math.min(CANVAS_WIDTH - labelData.backgroundImage!.x, startWidth + deltaX));
                        
                        // Maintain aspect ratio by calculating height from width
                        let newHeight = newWidth / aspectRatio;
                        
                        // Check if calculated height is within canvas bounds
                        if (labelData.backgroundImage!.y + newHeight > CANVAS_HEIGHT) {
                          // If height exceeds canvas, recalculate based on max height
                          newHeight = CANVAS_HEIGHT - labelData.backgroundImage!.y;
                          newWidth = newHeight * aspectRatio;
                        }
                        
                        onLabelChange({
                          ...labelData,
                          backgroundImage: {
                            ...labelData.backgroundImage!,
                            width: newWidth,
                            height: newHeight
                          }
                        });
                      };
                      
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  />
                </div>
              )}
              
              {/* Text boxes - LAYER 10 (TOP) */}
              {labelData.textBoxes.map((textBox, index) => (
                <div key={`textbox-container-${textBox.id}`} className="relative">
                  <TextBoxEditor
                    textBox={textBox}
                    canvasWidth={CANVAS_WIDTH}
                    canvasHeight={CANVAS_HEIGHT}
                    isSelected={selectedTextBoxIndex === index}
                    onTextBoxChange={(updatedTextBox) => {
                      updateTextBox(updatedTextBox);
                    }}
                    onSelect={() => setSelectedTextBoxIndex(index)}
                  />
                </div>
              ))}
              
              {/* Floating toolbar for selected text box */}
              {selectedTextBoxIndex !== null && (
                <FreeTextToolbar
                  isVisible={true}
                  selectedTextBox={labelData.textBoxes[selectedTextBoxIndex]}
                  onFontChange={updateSelectedTextBoxFont}
                  onColorChange={updateSelectedTextBoxColor}
                  onFontSizeChange={updateSelectedTextBoxFontSize}
                  onDelete={deleteSelectedTextBox}
                  position={{
                    x: labelData.textBoxes[selectedTextBoxIndex].x + 350,
                    y: labelData.textBoxes[selectedTextBoxIndex].y - 60
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Coffee Name Display and Styling */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Coffee Name Style</label>
            <div className={`p-3 border border-border rounded-md transition-colors ${
              isMobile && isCoffeeNameSelected ? 'bg-blue-50 border-blue-300' : 'bg-muted/20'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">
                  {productInfo?.name || labelData.coffeeName || 'Coffee Name'}
                </div>
                {isMobile && isCoffeeNameSelected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCoffeeNameSelected(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {/* Show controls always on desktop, only when selected on mobile */}
              {(!isMobile || isCoffeeNameSelected) && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <FontSelector
                      value={labelData.coffeeNameFont || 'serif'}
                      onChange={updateCoffeeNameFont}
                    />
                    <ColorPicker
                      value={labelData.coffeeNameColor || '#ffffff'}
                      onChange={updateCoffeeNameColor}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Font Size</label>
                    <input
                      type="range"
                      min="16"
                      max="48"
                      value={labelData.coffeeNameFontSize || 32}
                      onChange={(e) => updateCoffeeNameFontSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>16px</span>
                      <span>{labelData.coffeeNameFontSize || 32}px</span>
                      <span>48px</span>
                    </div>
                  </div>
                </div>
              )}
              {/* Mobile hint when not selected */}
              {isMobile && !isCoffeeNameSelected && (
                <div className="text-xs text-muted-foreground">
                  Tap coffee name on canvas to edit style
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
            >
              <Image className="w-4 h-4 mr-2" />
              Upload Image
            </Button>
            
            <Button
              onClick={addFreeText}
              variant="outline"
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              Free Text
            </Button>
            
            <Button
              onClick={addTextBox}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Text
            </Button>
          </div>


          {/* Download */}
          <Button
            onClick={downloadPreview}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Label
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Image Adjustment Modal */}
      {tempImageUrl && (
        <ImageAdjustModal
          imageUrl={tempImageUrl}
          onConfirm={handleImageConfirm}
          onCancel={handleImageCancel}
          canvasWidth={CANVAS_WIDTH}
          canvasHeight={CANVAS_HEIGHT}
        />
      )}
    </div>
  );
};