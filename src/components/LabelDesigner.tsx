import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image, Plus, Trash2, Type } from 'lucide-react';
import { toast } from 'sonner';
import { FontSelector } from './FontSelector';
import { ColorPicker } from './ColorPicker';
import { SimpleImageEditor } from './SimpleImageEditor';
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

  const CANVAS_WIDTH = 384;
  const CANVAS_HEIGHT = 512;

  // Canvas drawing function
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw default gradient background (no image on canvas)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#8B4513');
    gradient.addColorStop(1, '#D2B48C');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawTextElements(ctx);
    if (previewMode) drawWatermark(ctx);
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
    const productInfoY = CANVAS_HEIGHT - 156;
    const today = new Date();
    const roastDate = today.toLocaleDateString();
    
    ctx.font = '12px serif';
    ctx.fillText(`${displayProductInfo.weight} • ${displayProductInfo.grind === 'whole-bean' ? 'Whole Bean' : 'Ground'}`, CANVAS_WIDTH / 2, productInfoY);
    ctx.fillText(`${displayProductInfo.type === 'regular' ? 'Regular' : 'Decaffeinated'}`, CANVAS_WIDTH / 2, productInfoY + 15);
    ctx.fillText(`Roast Date: ${roastDate}`, CANVAS_WIDTH / 2, productInfoY + 30);

    ctx.font = 'bold 14px serif';
    ctx.fillText('Custom Roasted By JavaMania Coffee Roastery', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
    ctx.font = '12px serif';
    ctx.fillText('Libertyville IL', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 45);
    ctx.fillText('www.javamania.com', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    ctx.font = '10px serif';
    ctx.fillText('100% Arabica Coffee & Natural Flavors', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
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
        const img = new window.Image();
        img.onload = () => {
          // Calculate scale to fit image in canvas
          const scale = Math.min(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height) * 0.8;
          const width = img.width * scale;
          const height = img.height * scale;
          
          onLabelChange({
            ...labelData,
            backgroundImage: {
              url: e.target?.result as string,
              x: (CANVAS_WIDTH - width) / 2,
              y: (CANVAS_HEIGHT - height) / 2,
              width,
              height,
              rotation: 0
            }
          });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
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
              {/* Background image editor - LAYER 1 (BOTTOM) */}
              {labelData.backgroundImage && (
                <SimpleImageEditor
                  imageElement={labelData.backgroundImage}
                  canvasWidth={CANVAS_WIDTH}
                  canvasHeight={CANVAS_HEIGHT}
                  onImageChange={(updatedImage) => {
                    onLabelChange({ ...labelData, backgroundImage: updatedImage });
                  }}
                />
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
    </div>
  );
};