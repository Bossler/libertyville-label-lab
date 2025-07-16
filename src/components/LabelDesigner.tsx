import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LabelData {
  coffeeName: string;
  tastingNotes: string;
  backgroundImage?: string;
  coffeeNamePosition?: { x: number; y: number };
  tastingNotesPosition?: { x: number; y: number };
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
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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

  const drawTextElements = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const displayProductInfo = productInfo || {
      weight: '12 oz',
      grind: 'whole-bean' as const,
      type: 'regular' as const
    };

    // Coffee name
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px serif';
    ctx.strokeText(labelData.coffeeName || 'Click to edit name', coffeeNamePosition.x, coffeeNamePosition.y);
    ctx.fillText(labelData.coffeeName || 'Click to edit name', coffeeNamePosition.x, coffeeNamePosition.y);
    ctx.restore();

    // Tasting notes
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.textAlign = 'center';
    ctx.font = '16px serif';
    
    const notes = labelData.tastingNotes || 'Click to edit tasting notes';
    const words = notes.split(' ');
    const lineHeight = 20;
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
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    const productInfoY = canvas.height - 156;
    const today = new Date();
    const roastDate = today.toLocaleDateString();
    
    ctx.font = '12px serif';
    ctx.fillText(`${displayProductInfo.weight} • ${displayProductInfo.grind === 'whole-bean' ? 'Whole Bean' : 'Ground'}`, canvas.width / 2, productInfoY);
    ctx.fillText(`${displayProductInfo.type === 'regular' ? 'Regular' : 'Decaffeinated'}`, canvas.width / 2, productInfoY + 15);
    ctx.fillText(`Roast Date: ${roastDate}`, canvas.width / 2, productInfoY + 30);

    ctx.font = 'bold 14px serif';
    ctx.fillText('Custom Roasted By JavaMania Coffee Roastery', canvas.width / 2, canvas.height - 60);
    ctx.font = '12px serif';
    ctx.fillText('Libertyville IL', canvas.width / 2, canvas.height - 45);
    ctx.fillText('www.javamania.com', canvas.width / 2, canvas.height - 30);
    ctx.font = '10px serif';
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
          backgroundImage: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
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
    const prompt = `Coffee label background for ${labelData.coffeeName || 'custom coffee'}, elegant and warm, coffee beans, vintage style`;
    
    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-image-generator', {
        body: { prompt, style: 'vintage coffee aesthetic' }
      });

      if (error) throw new Error(error.message);

      if (data.imageUrl) {
        onLabelChange({ ...labelData, backgroundImage: data.imageUrl });
        toast.success('AI Background generated!');
      }
    } catch (error) {
      console.error('AI Image generation error:', error);
      toast.error('Failed to generate AI background');
    }
    setIsGeneratingImage(false);
  };

  // Update canvas when data changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  return (
    <div className="min-h-screen bg-gradient-warmth flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
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
    </div>
  );
};