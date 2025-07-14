import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Palette, Download, Image, Sparkles, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LabelData {
  coffeeName: string;
  tastingNotes: string;
  backgroundImage?: string;
  fontFamily?: string;
  textColor?: string;
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
  const [isGeneratingAI, setIsGeneratingAI] = useState<{[key: string]: boolean}>({});
  const [aiDialogOpen, setAiDialogOpen] = useState<string | null>(null);
  const [userRequest, setUserRequest] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

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

    // Skip drawing coffee name on canvas since it's now an overlay input
    // Coffee name is handled by the input overlay

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

  const generateAISuggestion = async (type: 'name' | 'notes' | 'preview', request: string) => {
    setIsGeneratingAI(prev => ({ ...prev, [type]: true }));
    setAiDialogOpen(null);

    try {
      let currentContent = '';
      
      if (type === 'name') {
        currentContent = labelData.coffeeName || '';
      } else if (type === 'notes') {
        currentContent = labelData.tastingNotes || '';
      } else if (type === 'preview') {
        currentContent = `Font: ${labelData.fontFamily || 'serif'}, Color: ${labelData.textColor || '#ffffff'}`;
      }

      const { data, error } = await supabase.functions.invoke('ai-barista', {
        body: {
          type,
          request,
          currentContent,
          productInfo,
          labelData
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate AI suggestion');
      }

      const suggestion = data.suggestion;

      if (type === 'name') {
        onLabelChange({ ...labelData, coffeeName: suggestion });
        toast.success('AI Barista improved your coffee name!');
      } else if (type === 'notes') {
        onLabelChange({ ...labelData, tastingNotes: suggestion });
        toast.success('AI Barista improved your tasting notes!');
      } else if (type === 'preview') {
        try {
          const styleData = JSON.parse(suggestion);
          onLabelChange({ 
            ...labelData, 
            fontFamily: styleData.fontFamily,
            textColor: styleData.textColor 
          });
          toast.success('AI Barista improved your label style!');
        } catch {
          toast.error('Failed to parse style suggestions');
        }
      }

    } catch (error) {
      console.error('AI Barista error:', error);
      toast.error('Failed to generate AI suggestion. Please try again.');
    }

    setIsGeneratingAI(prev => ({ ...prev, [type]: false }));
    setUserRequest('');
  };

  const handleAIButtonClick = (type: 'name' | 'notes') => {
    setAiDialogOpen(type);
    setUserRequest('');
  };

  const handleAISubmit = () => {
    if (!userRequest.trim()) {
      toast.error('Please describe how you\'d like to improve this field');
      return;
    }
    
    if (aiDialogOpen) {
      generateAISuggestion(aiDialogOpen as 'name' | 'notes', userRequest);
    }
  };

  const generateAIImage = async () => {
    setAiDialogOpen('image');
    setImagePrompt('');
    setImageStyle('');
  };

  const handleImageGeneration = async () => {
    if (!imagePrompt.trim()) {
      toast.error('Please describe the background image you want');
      return;
    }

    setIsGeneratingImage(true);
    setAiDialogOpen(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-image-generator', {
        body: {
          prompt: imagePrompt,
          style: imageStyle
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate image');
      }

      if (data.error) {
        // Handle specific OpenAI API errors
        const errorMessage = data.details || data.error;
        if (errorMessage.includes('content policy') || errorMessage.includes('policy')) {
          toast.error('Content not allowed. Please try coffee-related imagery like beans, cups, roasting, or coffee shops.');
        } else {
          toast.error(`Image generation failed: ${errorMessage}`);
        }
        return;
      }

      onLabelChange({
        ...labelData,
        backgroundImage: data.image
      });

      toast.success('AI generated your background image!');
      setImagePrompt('');
      setImageStyle('');

    } catch (error) {
      console.error('AI Image generation error:', error);
      toast.error('Failed to generate image. Please try again.');
    }

    setIsGeneratingImage(false);
  };

  const isAnyAILoading = Object.values(isGeneratingAI).some(Boolean) || isGeneratingImage;

  return (
    <div className="min-h-screen bg-gradient-warmth p-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Side - Large Preview Panel */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Card className="bg-gradient-cream border-border shadow-elegant">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">Label Preview</h2>
                    <p className="text-muted-foreground">4" × 6" • Professional Quality</p>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="border-4 border-primary/20 rounded-xl p-6 bg-background/50 backdrop-blur shadow-glow">
                        <canvas
                          ref={canvasRef}
                          className="border border-border rounded-lg max-w-full h-auto shadow-soft"
                          style={{ maxWidth: '500px', height: 'auto' }}
                        />
                        
                        {/* Editable Coffee Name Overlay */}
                        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-4/5 max-w-md">
                          <div className="relative flex items-center">
                            <Input
                              value={labelData.coffeeName}
                              onChange={(e) => onLabelChange({ ...labelData, coffeeName: e.target.value })}
                              placeholder="Edit Coffee Name"
                              className="bg-transparent border-transparent text-center font-bold shadow-none hover:bg-transparent focus:bg-transparent focus:border-transparent focus:ring-0 pr-10"
                              style={{
                                fontSize: '2rem',
                                fontFamily: labelData.fontFamily || 'serif',
                                color: labelData.textColor || '#ffffff',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                              }}
                              maxLength={45}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAIButtonClick('name')}
                              disabled={isGeneratingAI.name}
                              className="absolute right-0 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-background/80 hover:bg-background/90 rounded-full shadow-lg"
                            >
                              {isGeneratingAI.name ? (
                                <Sparkles className="w-4 h-4 animate-pulse text-primary" />
                              ) : (
                                <Bot className="w-4 h-4 text-primary" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium shadow-soft">
                        Live Preview
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="golden"
                    onClick={downloadPreview}
                    className="w-full max-w-sm hover-scale transition-all duration-300"
                    size="lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Controls Panel */}
          <div className="order-1 lg:order-2 space-y-6">
            {/* Tasting Notes Section */}
            <Card className="bg-card border-border shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  Tasting Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="tastingNotes" className="flex-1 font-medium">Description</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAIButtonClick('notes')}
                      disabled={isGeneratingAI.notes}
                      className="hover-scale"
                    >
                      {isGeneratingAI.notes ? (
                        <Sparkles className="w-3 h-3 animate-pulse" />
                      ) : (
                        <Bot className="w-3 h-3" />
                      )}
                      AI Enhance
                    </Button>
                  </div>
                  <Textarea
                    id="tastingNotes"
                    value={labelData.tastingNotes}
                    onChange={(e) => onLabelChange({ ...labelData, tastingNotes: e.target.value })}
                    placeholder="Rich chocolate notes with hints of caramel and a smooth finish..."
                    className="min-h-[120px] resize-none"
                    maxLength={200}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Style & Appearance Section */}
            <Card className="bg-card border-border shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  Style & Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="fontFamily" className="font-medium mb-2 block">Font Style</Label>
                    <Select
                      value={labelData.fontFamily || 'serif'}
                      onValueChange={(value) => onLabelChange({ ...labelData, fontFamily: value })}
                    >
                      <SelectTrigger className="hover:border-primary/50 transition-colors">
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
                    <Label htmlFor="textColor" className="font-medium mb-2 block">Text Color</Label>
                    <Select
                      value={labelData.textColor || '#ffffff'}
                      onValueChange={(value) => onLabelChange({ ...labelData, textColor: value })}
                    >
                      <SelectTrigger className="hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full border-2 border-border shadow-sm" 
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
              </CardContent>
            </Card>

            {/* Background Image Section */}
            <Card className="bg-card border-border shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Image className="w-5 h-5 text-primary" />
                  Background Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Add a custom background image to make your label unique
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      variant="cream"
                      onClick={() => fileInputRef.current?.click()}
                      className="hover-scale transition-all duration-300"
                      size="lg"
                    >
                      <Image className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                    <Button
                      variant="outline"
                      onClick={generateAIImage}
                      className="hover-scale transition-all duration-300"
                      size="lg"
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
                  {labelData.backgroundImage && (
                    <div className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        ✓ Background image applied
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Barista Dialog */}
      <Dialog open={!!aiDialogOpen} onOpenChange={(open) => !open && setAiDialogOpen(null)}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              AI Barista Assistance
            </DialogTitle>
            <DialogDescription>
              How would you like to improve this {aiDialogOpen === 'name' ? 'coffee name' : aiDialogOpen === 'notes' ? 'tasting notes' : 'label style'}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userRequest">Your Request</Label>
              <Textarea
                id="userRequest"
                value={userRequest}
                onChange={(e) => setUserRequest(e.target.value)}
                placeholder={
                  aiDialogOpen === 'name' 
                    ? "e.g., Make it sound more premium and artisanal"
                    : aiDialogOpen === 'notes'
                    ? "e.g., Add more detail about chocolate and caramel notes"
                    : "e.g., Make it more elegant and readable"
                }
                className="min-h-[80px]"
              />
            </div>
            
            {aiDialogOpen && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                <strong>Current {aiDialogOpen === 'name' ? 'name' : 'notes'}:</strong>
                <p className="mt-1">
                  {aiDialogOpen === 'name' && (labelData.coffeeName || 'Empty')}
                  {aiDialogOpen === 'notes' && (labelData.tastingNotes || 'Empty')}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAISubmit}
              disabled={!userRequest.trim()}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Improve with AI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Image Generation Dialog */}
      <Dialog open={aiDialogOpen === 'image'} onOpenChange={(open) => !open && setAiDialogOpen(null)}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Background Image Generator
            </DialogTitle>
            <DialogDescription>
              Describe the background image you'd like for your coffee label. The AI will generate an image without any text.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imagePrompt">Image Description</Label>
              <Textarea
                id="imagePrompt"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="e.g., Coffee beans scattered on rustic wood, warm lighting, cozy coffee shop atmosphere, vintage coffee plantation"
                className="min-h-[80px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imageStyle">Style (Optional)</Label>
              <Input
                id="imageStyle"
                value={imageStyle}
                onChange={(e) => setImageStyle(e.target.value)}
                placeholder="e.g., watercolor, vintage, minimalist, photographic, artistic"
              />
            </div>
            
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded space-y-2">
              <div>
                <strong>✅ Good prompts:</strong> Coffee beans, cups, roasted coffee, brewing equipment, coffee shop interiors, steam, warm colors, wooden textures
              </div>
              <div>
                <strong>❌ Avoid:</strong> People, medical imagery, violent content, copyrighted characters
              </div>
              <div>
                <strong>Note:</strong> The AI will automatically ensure no text or letters appear in the generated image.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImageGeneration}
              disabled={!imagePrompt.trim() || isGeneratingImage}
            >
              {isGeneratingImage ? (
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {isGeneratingImage ? 'Generating...' : 'Generate Image'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Loading Overlay */}
      {isAnyAILoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 shadow-lg max-w-sm mx-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-foreground mb-1">AI Barista at Work</h3>
                <p className="text-sm text-muted-foreground">Please wait, we're brewing something up!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};