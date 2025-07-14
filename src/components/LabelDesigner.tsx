import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Download, Image, Sparkles, Type } from 'lucide-react';

interface LabelData {
  coffeeName: string;
  tastingNotes: string;
  backgroundImage?: string;
  fontFamily?: string;
  textColor?: string;
}

interface LabelDesignerProps {
  labelData: LabelData;
  onLabelChange: (data: LabelData) => void;
  productName?: string;
}

export const LabelDesigner: React.FC<LabelDesignerProps> = ({ 
  labelData, 
  onLabelChange,
  productName 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const fontOptions = [
    { value: 'serif', label: 'Serif (Classic)' },
    { value: 'sans-serif', label: 'Sans-Serif (Modern)' },
    { value: 'cursive', label: 'Cursive (Elegant)' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
  ];

  const colorOptions = [
    { value: 'hsl(var(--background))', label: 'Background' },
    { value: 'hsl(var(--foreground))', label: 'Foreground' },
    { value: 'hsl(var(--primary))', label: 'Primary' },
    { value: 'hsl(var(--secondary))', label: 'Secondary' },
    { value: 'hsl(var(--accent))', label: 'Accent' },
    { value: '#ffffff', label: 'White' },
    { value: '#000000', label: 'Black' },
    { value: '#8B4513', label: 'Coffee Brown' },
    { value: '#D2B48C', label: 'Light Brown' },
    { value: '#654321', label: 'Dark Brown' },
  ];

  useEffect(() => {
    drawLabel();
  }, [labelData, previewMode]);

  const drawLabel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions (4" x 6" at 96 DPI for preview)
    canvas.width = 384; // 4 inches * 96 DPI
    canvas.height = 576; // 6 inches * 96 DPI

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (labelData.backgroundImage) {
      const img = document.createElement('img');
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
  };

  const drawTextElements = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Set text styles
    ctx.textAlign = 'center';
    const textColor = labelData.textColor || '#ffffff';
    ctx.fillStyle = textColor;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;

    const fontFamily = labelData.fontFamily || 'serif';

    // Coffee name (title)
    ctx.font = `bold 32px ${fontFamily}`;
    const coffeeName = labelData.coffeeName || productName || 'Custom Coffee';
    ctx.fillText(coffeeName, canvas.width / 2, 80);
    ctx.strokeText(coffeeName, canvas.width / 2, 80);

    // Tasting notes
    if (labelData.tastingNotes) {
      ctx.font = `16px ${fontFamily}`;
      const lines = wrapText(ctx, labelData.tastingNotes, canvas.width - 40);
      lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, 140 + (index * 24));
        ctx.strokeText(line, canvas.width / 2, 140 + (index * 24));
      });
    }

    // Placeholder for roast date (admin field)
    ctx.font = '14px serif';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('Roast Date: MM/DD/YYYY', canvas.width / 2, canvas.height - 40);

    // Libertyville Coffee Company branding
    ctx.font = '12px serif';
    ctx.fillText('Libertyville Coffee Company', canvas.width / 2, canvas.height - 20);
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

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

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

  const generateAIImage = async () => {
    // Placeholder for AI image generation
    // In a real implementation, this would call an AI service
    alert('AI image generation coming soon! For now, please upload your own image.');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-cream border-border shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5 text-primary" />
            Label Design
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Text Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="coffeeName">Coffee Name</Label>
              <Input
                id="coffeeName"
                value={labelData.coffeeName}
                onChange={(e) => onLabelChange({ ...labelData, coffeeName: e.target.value })}
                placeholder={productName || "Enter coffee name"}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="tastingNotes">Tasting Notes & Description</Label>
              <Textarea
                id="tastingNotes"
                value={labelData.tastingNotes}
                onChange={(e) => onLabelChange({ ...labelData, tastingNotes: e.target.value })}
                placeholder="Describe the flavor profile, aroma, and characteristics..."
                className="mt-1 min-h-[100px]"
              />
            </div>

            {/* Font and Color Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fontFamily">Font Style</Label>
                <Select
                  value={labelData.fontFamily || 'serif'}
                  onValueChange={(value) => onLabelChange({ ...labelData, fontFamily: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        <span style={{ fontFamily: font.value }}>{font.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="textColor">Text Color</Label>
                <Select
                  value={labelData.textColor || '#ffffff'}
                  onValueChange={(value) => onLabelChange({ ...labelData, textColor: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-border" 
                            style={{ backgroundColor: color.value.startsWith('hsl') ? `var(--${color.value.match(/--(\w+)/)?.[1]})` : color.value }}
                          />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-3">
            <Label>Background Image (Optional)</Label>
            <div className="flex gap-2">
              <Button
                variant="cream"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Image className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
              <Button
                variant="outline"
                onClick={generateAIImage}
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Generate
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Canvas Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Label Preview</Label>
              <Badge variant="secondary" className="text-xs">
                4" × 6" • 96 DPI Preview
              </Badge>
            </div>
            
            <div className="flex justify-center">
              <div className="border-2 border-border rounded-lg p-4 bg-card shadow-soft">
                <canvas
                  ref={canvasRef}
                  className="border border-border rounded max-w-full h-auto"
                  style={{ maxWidth: '300px' }}
                />
              </div>
            </div>

            {/* Overlay zones explanation */}
            <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
              <p><strong>Label Layout:</strong></p>
              <p>• Coffee name appears at the top in large text</p>
              <p>• Tasting notes in the center area</p>
              <p>• Roast date will be added at bottom right (admin only)</p>
              <p>• Company branding at bottom center</p>
            </div>

            <Button
              variant="golden"
              onClick={downloadPreview}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Preview (Watermarked)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};