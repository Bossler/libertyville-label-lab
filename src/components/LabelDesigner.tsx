import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image, Plus, Trash2, Type } from 'lucide-react';
import { toast } from 'sonner';
import { FontSelector } from './FontSelector';
import { ColorPicker } from './ColorPicker';
import { ImageAdjustModal } from './ImageAdjustModal';
import { TextBoxEditor } from './TextBoxEditor';
import { LabelData, ProductInfo, TextBox, ImageElement } from '@/types/label';

interface LabelDesignerProps {
  labelData: LabelData;
  onLabelChange: (data: LabelData) => void;
  productName?: string;
  productInfo?: ProductInfo | null;
}

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

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 600;

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

  const drawTextElements = (ctx: CanvasRenderingContext2D) => {
    const displayProductInfo = productInfo || {
      weight: '12 oz',
      grind: 'whole-bean' as const,
      type: 'regular' as const
    };

    // Draw fixed coffee name at top center
    ctx.save();
    ctx.fillStyle = labelData.coffeeNameColor || '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.font = `bold 32px ${labelData.coffeeNameFont || 'serif'}`;
    
    const coffeeName = productInfo?.name || labelData.coffeeName || 'Coffee Name';
    ctx.strokeText(coffeeName, CANVAS_WIDTH / 2, 80);
    ctx.fillText(coffeeName, CANVAS_WIDTH / 2, 80);
    ctx.restore();

    // Draw custom text boxes
    labelData.textBoxes.forEach(textBox => {
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
    const padding = 8;
    const backgroundY = productInfoY - 16;
    const backgroundHeight = 68;
    const backgroundWidth = 320;
    const backgroundX = (CANVAS_WIDTH - backgroundWidth) / 2;
    const cornerRadius = 8;
    
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.roundRect(backgroundX, backgroundY, backgroundWidth, backgroundHeight, cornerRadius);
    ctx.fill();
    ctx.restore();
    
     // Product details - 12pt font, top justified to box
    const productFontSize = 16; // 12pt at 96dpi = 16px
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
    ctx.fillText(`Roast Date: ${roastDate}`, CANVAS_WIDTH / 2, productTopY + 18);

    // Company info - 8pt font, bottom justified to box
    const footerFontSize = 11; // 8pt at 96dpi = 11px
    const footerFont = 'FertigoPro, serif';
    ctx.font = `${footerFontSize}px ${footerFont}`;
    
    // Position footer data at bottom of rectangle
    const footerBottomY = backgroundY + backgroundHeight - padding;
    
    ctx.fillText('100% Arabica Coffee & Natural Flavors', CANVAS_WIDTH / 2, footerBottomY - 22);
    ctx.fillText('www.javamania.com', CANVAS_WIDTH / 2, footerBottomY - 11);
    ctx.fillText('JavaMania Coffee Roastery | Libertyville IL', CANVAS_WIDTH / 2, footerBottomY);
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
      height: 50
    };

    onLabelChange({
      ...labelData,
      textBoxes: [...labelData.textBoxes, newTextBox]
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

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

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
              className="absolute top-0 left-0 pointer-events-auto"
              style={{
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                zIndex: 5,
                overflow: 'hidden'
              }}
            >
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
                      
                      const newX = Math.max(0, Math.min(CANVAS_WIDTH - labelData.backgroundImage!.width, startImageX + deltaX));
                      const newY = Math.max(0, Math.min(CANVAS_HEIGHT - labelData.backgroundImage!.height, startImageY + deltaY));
                      
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
                <TextBoxEditor
                  key={`textbox-${textBox.id}`}
                  textBox={textBox}
                  canvasWidth={CANVAS_WIDTH}
                  canvasHeight={CANVAS_HEIGHT}
                  isSelected={selectedTextBoxIndex === index}
                  onTextBoxChange={(updatedTextBox) => {
                    updateTextBox(updatedTextBox);
                  }}
                  onSelect={() => setSelectedTextBoxIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Coffee Name Display and Styling */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Coffee Name Style</label>
            <div className="p-3 border border-border rounded-md bg-muted/20">
              <div className="text-sm text-muted-foreground mb-2">
                {productInfo?.name || labelData.coffeeName || 'Coffee Name'}
              </div>
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
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
            >
              <Image className="w-4 h-4 mr-2" />
              Upload Image
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

          {/* Selected Text Box Controls */}
          {selectedTextBoxData && (
            <div className="space-y-2 p-3 border border-border rounded-md">
              <h3 className="text-sm font-medium">Selected Text Box</h3>
              <div className="flex gap-2">
                <FontSelector
                  value={selectedTextBoxData.fontFamily}
                  onChange={updateSelectedTextBoxFont}
                />
                <ColorPicker
                  value={selectedTextBoxData.color}
                  onChange={updateSelectedTextBoxColor}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs">Font Size</label>
                <input
                  type="range"
                  min="8"
                  max="48"
                  value={selectedTextBoxData.fontSize}
                  onChange={(e) => updateTextBox({
                    ...selectedTextBoxData,
                    fontSize: parseInt(e.target.value)
                  })}
                  className="w-full"
                />
                <span className="text-xs text-muted-foreground">
                  {selectedTextBoxData.fontSize}px
                </span>
              </div>
              <Button
                onClick={deleteSelectedTextBox}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Text Box
              </Button>
            </div>
          )}

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