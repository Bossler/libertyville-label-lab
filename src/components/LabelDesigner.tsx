import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image, Sparkles, Settings, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FontSelector } from './FontSelector';
import { ColorPicker } from './ColorPicker';
import { ImageTransformModal } from './ImageTransformModal';

interface LabelData {
  coffeeName: string;
  tastingNotes: string;
  backgroundImage?: string;
  coffeeNamePosition?: { x: number; y: number };
  tastingNotesPosition?: { x: number; y: number };
  coffeeNameFont?: string;
  coffeeNameColor?: string;
  tastingNotesFont?: string;
  tastingNotesColor?: string;
  footerFont?: string;
  footerColor?: string;
  backgroundImageTransform?: {
    scale: number;
    offsetX: number;
    offsetY: number;
  };
}

interface ProductInfo {
  name: string;
  weight: string;
  type: 'regular' | 'decaf';
  grind: 'whole-bean' | 'ground';
  price?: string;
  description?: string;
}

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
  
  const [previewMode, setPreviewMode] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [editingElement, setEditingElement] = useState<'coffeeName' | 'tastingNotes' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragElement, setDragElement] = useState<'coffeeName' | 'tastingNotes' | null>(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [showStylingPanel, setShowStylingPanel] = useState(false);
  const [showImageTransform, setShowImageTransform] = useState(false);
  const [tempTransform, setTempTransform] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0
  });

  // Default positions for text elements
  const coffeeNamePosition = labelData.coffeeNamePosition || { x: 192, y: 80 };
  const tastingNotesPosition = labelData.tastingNotesPosition || { x: 192, y: 200 };

  // Canvas drawing functions
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (labelData.backgroundImage) {
      const img = new window.Image();
      img.onload = () => {
        const transform = labelData.backgroundImageTransform || { scale: 1, offsetX: 0, offsetY: 0 };
        
        // Save context for transformation
        ctx.save();
        
        // Apply clipping to canvas bounds
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.clip();
        
        // Calculate fit-to-canvas scale (to ensure entire image can be visible)
        const fitToCanvasScale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height
        );
        
        // Apply user transform scale on top of fit-to-canvas scale
        const finalScale = fitToCanvasScale * transform.scale;
        
        // Calculate final dimensions
        const scaledWidth = img.width * finalScale;
        const scaledHeight = img.height * finalScale;
        
        // Center the image by default, then apply user offsets
        const centeredX = (canvas.width - scaledWidth) / 2;
        const centeredY = (canvas.height - scaledHeight) / 2;
        
        // Draw the transformed image
        ctx.drawImage(
          img,
          centeredX + transform.offsetX,
          centeredY + transform.offsetY,
          scaledWidth,
          scaledHeight
        );
        
        ctx.restore();
        
        drawTextElements(ctx, canvas);
        if (previewMode) drawWatermark(ctx, canvas);
      };
      img.src = labelData.backgroundImage;
    } else {
      // Default gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#8B4513');
      gradient.addColorStop(1, '#D2B48C');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      drawTextElements(ctx, canvas);
      if (previewMode) drawWatermark(ctx, canvas);
    }
  }, [labelData, previewMode, coffeeNamePosition, tastingNotesPosition]);

  // Helper function to calculate optimal font size for single line text
  const calculateOptimalFontSize = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxFontSize: number,
    minFontSize: number,
    fontFamily: string,
    fontWeight: string = 'normal'
  ): number => {
    let fontSize = maxFontSize;
    
    while (fontSize >= minFontSize) {
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      const metrics = ctx.measureText(text);
      
      if (metrics.width <= maxWidth) {
        return fontSize;
      }
      fontSize -= 1;
    }
    
    return minFontSize;
  };

  // Helper function to calculate optimal font size for multi-line text
  const calculateOptimalMultiLineFontSize = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxHeight: number,
    maxFontSize: number,
    minFontSize: number,
    fontFamily: string
  ): { fontSize: number; lineHeight: number } => {
    let fontSize = maxFontSize;
    
    while (fontSize >= minFontSize) {
      const lineHeight = fontSize * 1.2; // 20% line spacing
      ctx.font = `${fontSize}px ${fontFamily}`;
      
      const words = text.split(' ');
      let lines = 1;
      let line = '';
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && n > 0) {
          lines++;
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      
      const totalHeight = lines * lineHeight;
      
      if (totalHeight <= maxHeight) {
        return { fontSize, lineHeight };
      }
      fontSize -= 1;
    }
    
    return { fontSize: minFontSize, lineHeight: minFontSize * 1.2 };
  };

  const drawTextElements = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const displayProductInfo = productInfo || {
      weight: '12 oz',
      grind: 'whole-bean' as const,
      type: 'regular' as const
    };

    // Coffee name with dynamic scaling and line wrapping
    ctx.save();
    ctx.fillStyle = labelData.coffeeNameColor || '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    
    const coffeeName = labelData.coffeeName || 'Click to edit name';
    
    // Try single line first with scaling
    const singleLineFontSize = calculateOptimalFontSize(
      ctx,
      coffeeName,
      320, // max width
      42,  // max font size
      18,  // min font size
      labelData.coffeeNameFont || 'serif',
      'bold'
    );
    
    // If even at minimum font size it doesn't fit, use multi-line
    ctx.font = `bold ${singleLineFontSize}px ${labelData.coffeeNameFont || 'serif'}`;
    const singleLineWidth = ctx.measureText(coffeeName).width;
    
    if (singleLineWidth <= 320) {
      // Single line fits
      ctx.strokeText(coffeeName, coffeeNamePosition.x, coffeeNamePosition.y);
      ctx.fillText(coffeeName, coffeeNamePosition.x, coffeeNamePosition.y);
    } else {
      // Use multi-line with optimal sizing
      const { fontSize: multiLineFontSize, lineHeight } = calculateOptimalMultiLineFontSize(
        ctx,
        coffeeName,
        320, // max width
        80,  // max height for coffee name
        32,  // max font size for multi-line
        16,  // min font size
        labelData.coffeeNameFont || 'serif'
      );
      
      ctx.font = `bold ${multiLineFontSize}px ${labelData.coffeeNameFont || 'serif'}`;
      
      const words = coffeeName.split(' ');
      const maxWidth = 320;
      let line = '';
      let y = coffeeNamePosition.y - (lineHeight / 2); // Center multi-line text
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && n > 0) {
          ctx.strokeText(line.trim(), coffeeNamePosition.x, y);
          ctx.fillText(line.trim(), coffeeNamePosition.x, y);
          line = words[n] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.strokeText(line.trim(), coffeeNamePosition.x, y);
      ctx.fillText(line.trim(), coffeeNamePosition.x, y);
    }
    ctx.restore();

    // Tasting notes with dynamic scaling
    ctx.save();
    ctx.fillStyle = labelData.tastingNotesColor || '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.textAlign = 'center';
    
    const notes = labelData.tastingNotes || 'Click to edit tasting notes';
    const { fontSize: notesFontSize, lineHeight } = calculateOptimalMultiLineFontSize(
      ctx,
      notes,
      280, // max width
      120, // max height
      20,  // max font size
      12,  // min font size
      labelData.tastingNotesFont || 'serif'
    );
    
    ctx.font = `${notesFontSize}px ${labelData.tastingNotesFont || 'serif'}`;
    
    const words = notes.split(' ');
    const maxWidth = 280;
    let line = '';
    let y = tastingNotesPosition.y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        ctx.strokeText(line, tastingNotesPosition.x, y);
        ctx.fillText(line, tastingNotesPosition.x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.strokeText(line, tastingNotesPosition.x, y);
    ctx.fillText(line, tastingNotesPosition.x, y);
    ctx.restore();

    // Product info
    ctx.fillStyle = labelData.footerColor || '#000000';
    ctx.textAlign = 'center';
    const productInfoY = canvas.height - 156;
    const today = new Date();
    const roastDate = today.toLocaleDateString();
    
    ctx.font = `12px ${labelData.footerFont || 'serif'}`;
    ctx.fillText(`${displayProductInfo.weight} • ${displayProductInfo.grind === 'whole-bean' ? 'Whole Bean' : 'Ground'}`, canvas.width / 2, productInfoY);
    ctx.fillText(`${displayProductInfo.type === 'regular' ? 'Regular' : 'Decaffeinated'}`, canvas.width / 2, productInfoY + 15);
    ctx.fillText(`Roast Date: ${roastDate}`, canvas.width / 2, productInfoY + 30);

    ctx.font = `bold 14px ${labelData.footerFont || 'serif'}`;
    ctx.fillText('Custom Roasted By JavaMania Coffee Roastery', canvas.width / 2, canvas.height - 60);
    ctx.font = `12px ${labelData.footerFont || 'serif'}`;
    ctx.fillText('Libertyville IL', canvas.width / 2, canvas.height - 45);
    ctx.fillText('www.javamania.com', canvas.width / 2, canvas.height - 30);
    ctx.font = `10px ${labelData.footerFont || 'serif'}`;
    ctx.fillText('100% Arabica Coffee & Natural Flavors', canvas.width / 2, canvas.height - 15);
  };

  const drawWatermark = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.font = 'bold 48px serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.fillText('PREVIEW ONLY', 0, 0);
    ctx.restore();
  };

  // Mouse/touch event handlers for canvas interaction
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if click is near coffee name
    if (Math.abs(x - coffeeNamePosition.x) < 150 && Math.abs(y - coffeeNamePosition.y) < 40) {
      setEditingElement('coffeeName');
      setEditValue(labelData.coffeeName);
    }
    // Check if click is near tasting notes
    else if (Math.abs(x - tastingNotesPosition.x) < 140 && Math.abs(y - tastingNotesPosition.y) < 60) {
      setEditingElement('tastingNotes');
      setEditValue(labelData.tastingNotes);
    }
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if mouse is near draggable elements
    if (Math.abs(x - coffeeNamePosition.x) < 150 && Math.abs(y - coffeeNamePosition.y) < 40) {
      setIsDragging(true);
      setDragElement('coffeeName');
      setLastMousePos({ x, y });
    } else if (Math.abs(x - tastingNotesPosition.x) < 140 && Math.abs(y - tastingNotesPosition.y) < 60) {
      setIsDragging(true);
      setDragElement('tastingNotes');
      setLastMousePos({ x, y });
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragElement) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const deltaX = x - lastMousePos.x;
    const deltaY = y - lastMousePos.y;

    if (dragElement === 'coffeeName') {
      const newPosition = {
        x: coffeeNamePosition.x + deltaX,
        y: coffeeNamePosition.y + deltaY
      };
      onLabelChange({
        ...labelData,
        coffeeNamePosition: newPosition
      });
    } else if (dragElement === 'tastingNotes') {
      const newPosition = {
        x: tastingNotesPosition.x + deltaX,
        y: tastingNotesPosition.y + deltaY
      };
      onLabelChange({
        ...labelData,
        tastingNotesPosition: newPosition
      });
    }

    setLastMousePos({ x, y });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDragElement(null);
  };

  // Handle text editing
  const handleEditSubmit = () => {
    if (editingElement === 'coffeeName') {
      onLabelChange({ ...labelData, coffeeName: editValue });
    } else if (editingElement === 'tastingNotes') {
      onLabelChange({ ...labelData, tastingNotes: editValue });
    }
    setEditingElement(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setEditingElement(null);
    setEditValue('');
  };

  // File upload handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onLabelChange({
          ...labelData,
          backgroundImage: e.target?.result as string,
          backgroundImageTransform: { scale: 1, offsetX: 0, offsetY: 0 }
        });
        // Auto-open transform modal for new uploads
        setTempTransform({ scale: 1, offsetX: 0, offsetY: 0 });
        setShowImageTransform(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Image transform handlers
  const handleOpenImageTransform = () => {
    if (labelData.backgroundImage) {
      setTempTransform(labelData.backgroundImageTransform || { scale: 1, offsetX: 0, offsetY: 0 });
      setShowImageTransform(true);
    }
  };

  const handleApplyTransform = () => {
    onLabelChange({
      ...labelData,
      backgroundImageTransform: tempTransform
    });
    setShowImageTransform(false);
  };

  // Download function
  const downloadPreview = () => {
    setPreviewMode(true);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const link = document.createElement('a');
        link.download = `${labelData.coffeeName || 'custom-blend'}-label-preview.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
      setPreviewMode(false);
    }, 100);
  };

  // AI image generation
  const generateAIImage = async () => {
    // Show prompt dialog to get user's description
    const userDescription = prompt(
      "Describe what you'd like to see in your coffee label background:",
      "elegant coffee beans with warm lighting"
    );
    
    // If user cancels, don't proceed
    if (!userDescription) return;
    
    // Combine user prompt with our guidelines and color encouragement
    const fullPrompt = `A 4 inch wide by 6 inch high coffee label background featuring: ${userDescription}. Use bright, vibrant colors unless specifically requested otherwise. IMPORTANT: This image must contain absolutely NO TEXT, NO LETTERS, NO WORDS, NO TYPOGRAPHY of any kind. Pure visual imagery only for a coffee label background. Vintage coffee aesthetic style.`;
    
    setIsGeneratingImage(true);
    toast.loading("Something's brewing! Generating your AI background...", {
      id: 'ai-generation'
    });
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-image-generator', {
        body: { prompt: fullPrompt, style: 'vintage coffee aesthetic' }
      });

      if (error) throw new Error(error.message);

      if (data.image) {
        // Set image with default transform (entire image will be visible due to fit-to-canvas logic)
        onLabelChange({ 
          ...labelData, 
          backgroundImage: data.image,
          backgroundImageTransform: { 
            scale: 1.0, // Default scale - entire image will be visible due to fit-to-canvas calculation
            offsetX: 0, 
            offsetY: 0 
          }
        });
        toast.success('AI Background generated!', { id: 'ai-generation' });
      }
    } catch (error) {
      console.error('AI Image generation error:', error);
      toast.error('Failed to generate AI background', { id: 'ai-generation' });
    }
    setIsGeneratingImage(false);
  };

  // Update canvas when data changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  return (
    <div className="min-h-screen bg-gradient-warmth flex items-center justify-center p-4">
      <div className="w-full max-w-7xl flex gap-6 items-start">
        {/* Main Label Designer */}
        <div className="flex-1 max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Coffee Label Designer</h1>
          <p className="text-muted-foreground">Click on text to edit • Drag to reposition</p>
        </div>

        {/* Canvas Container */}
        <div className="relative mx-auto w-fit bg-white rounded-lg shadow-2xl p-4">
          <canvas
            ref={canvasRef}
            width={384}
            height={512}
            className="border border-gray-300 rounded cursor-pointer"
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
          
          {/* Text Editing Overlay */}
          {editingElement && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
              <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm w-full mx-4">
                <h3 className="font-semibold mb-2">
                  Edit {editingElement === 'coffeeName' ? 'Coffee Name' : 'Tasting Notes'}
                </h3>
                {editingElement === 'coffeeName' ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full p-2 border rounded mb-3"
                    placeholder="Enter coffee name..."
                    autoFocus
                  />
                ) : (
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full p-2 border rounded mb-3 h-20"
                    placeholder="Enter tasting notes..."
                    autoFocus
                  />
                )}
                <div className="flex gap-2">
                  <Button onClick={handleEditSubmit} className="flex-1">Save</Button>
                  <Button onClick={handleEditCancel} variant="outline" className="flex-1">Cancel</Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Image className="w-4 h-4" />
            Upload Background
          </Button>

          {labelData.backgroundImage && (
            <Button
              onClick={handleOpenImageTransform}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Background
            </Button>
          )}
          
          <Button
            onClick={generateAIImage}
            disabled={isGeneratingImage}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isGeneratingImage ? (
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            AI Background
          </Button>

          <Button
            onClick={() => setShowStylingPanel(!showStylingPanel)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Text Styling
          </Button>
          
          <Button
            onClick={downloadPreview}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Label
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        </div>

        {/* Image Transform Modal */}
        {labelData.backgroundImage && (
          <ImageTransformModal
            isOpen={showImageTransform}
            onClose={() => setShowImageTransform(false)}
            imageUrl={labelData.backgroundImage}
            transform={tempTransform}
            onTransformChange={setTempTransform}
            onApply={handleApplyTransform}
          />
        )}

        {/* Styling Panel */}
        {showStylingPanel && (
          <div className="w-80 bg-card rounded-lg shadow-warm p-6 space-y-6 border border-border">
            <h3 className="text-lg font-semibold text-foreground">Text Styling</h3>
            
            {/* Coffee Name Styling */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Coffee Name</h4>
              <FontSelector
                value={labelData.coffeeNameFont || 'serif'}
                onChange={(font) => onLabelChange({ ...labelData, coffeeNameFont: font })}
                label="Font"
              />
              <ColorPicker
                value={labelData.coffeeNameColor || '#ffffff'}
                onChange={(color) => onLabelChange({ ...labelData, coffeeNameColor: color })}
                label="Color"
              />
            </div>

            {/* Tasting Notes Styling */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Tasting Notes</h4>
              <FontSelector
                value={labelData.tastingNotesFont || 'serif'}
                onChange={(font) => onLabelChange({ ...labelData, tastingNotesFont: font })}
                label="Font"
              />
              <ColorPicker
                value={labelData.tastingNotesColor || '#ffffff'}
                onChange={(color) => onLabelChange({ ...labelData, tastingNotesColor: color })}
                label="Color"
              />
            </div>

            {/* Footer Styling */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Footer Info</h4>
              <FontSelector
                value={labelData.footerFont || 'serif'}
                onChange={(font) => onLabelChange({ ...labelData, footerFont: font })}
                label="Font"
              />
              <ColorPicker
                value={labelData.footerColor || '#000000'}
                onChange={(color) => onLabelChange({ ...labelData, footerColor: color })}
                label="Color"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};