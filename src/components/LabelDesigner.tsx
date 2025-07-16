import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Palette, Download, Image, Sparkles, Bot, Move, GripVertical, Type, Paintbrush } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDragOptimized } from '@/hooks/useDragOptimized';
import { useCanvasOptimized } from '@/hooks/useCanvasOptimized';
import { OptimizedTextElement } from '@/components/OptimizedTextElement';

interface LabelData {
  coffeeName: string;
  tastingNotes: string;
  backgroundImage?: string;
  fontFamily?: string;
  textColor?: string;
  coffeeNamePosition?: { x: number; y: number };
  tastingNotesPosition?: { x: number; y: number };
  productInfoFontFamily?: string;
  productInfoTextColor?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tastingNotesRef = useRef<HTMLTextAreaElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  const [previewMode, setPreviewMode] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState<{[key: string]: boolean}>({});
  const [aiDialogOpen, setAiDialogOpen] = useState<string | null>(null);
  const [userRequest, setUserRequest] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [dynamicFontSize, setDynamicFontSize] = useState(32);
  const [tastingNotesFontSize, setTastingNotesFontSize] = useState(16);
  const [activeTextElement, setActiveTextElement] = useState<'coffeeName' | 'tastingNotes' | null>(null);

  // Initialize optimized hooks
  const { canvasRef, scheduleCanvasUpdate, drawOptimized, cleanup: cleanupCanvas } = useCanvasOptimized();
  
  const handleDragEnd = useCallback((element: string, position: { x: number; y: number }) => {
    if (element === 'coffeeName') {
      onLabelChange({
        ...labelData,
        coffeeNamePosition: position
      });
    } else if (element === 'tastingNotes') {
      onLabelChange({
        ...labelData,
        tastingNotesPosition: position
      });
    }
    // Schedule canvas update after position change
    setTimeout(() => scheduleCanvasUpdate(true), 10);
  }, [labelData, onLabelChange, scheduleCanvasUpdate]);

  const { dragState, handlePointerDown, cleanup: cleanupDrag } = useDragOptimized(handleDragEnd);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCanvas();
      cleanupDrag();
    };
  }, [cleanupCanvas, cleanupDrag]);

  // Canvas update effect - use optimized hook
  useEffect(() => {
    // Only update canvas when not actively dragging
    if (!dragState.isDragging) {
      drawOptimized(labelData, previewMode, drawTextElements, drawWatermark);
    }
  }, [labelData, previewMode, dragState.isDragging, drawOptimized]);

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
    { value: '#000000', label: 'Black' },
    { value: '#ffffff', label: 'White' },
    { value: 'hsl(var(--foreground))', label: 'Foreground' },
    { value: 'hsl(var(--primary))', label: 'Primary' },
    { value: 'hsl(var(--secondary))', label: 'Secondary' },
    { value: 'hsl(var(--accent))', label: 'Accent' },
    { value: '#8B4513', label: 'Coffee Brown' },
    { value: '#D2B48C', label: 'Light Brown' },
    { value: '#654321', label: 'Dark Brown' },
  ];

  const calculateFontSize = useCallback(() => {
    const text = labelData.coffeeName || '';
    const boxHeight = 64;
    const maxLineLength = 15;
    
    if (text.length === 0) {
      setDynamicFontSize(32);
    } else if (text.length <= maxLineLength) {
      const scaleFactor = Math.min(2.0, Math.max(1.0, boxHeight / 32));
      setDynamicFontSize(Math.min(48, 32 * scaleFactor));
    } else if (text.length <= maxLineLength * 2) {
      const scaleFactor = Math.min(1.5, Math.max(0.8, boxHeight / 40));
      setDynamicFontSize(Math.max(16, Math.min(32, 32 * scaleFactor)));
    } else {
      const excess = text.length - (maxLineLength * 2);
      const scaleFactor = Math.max(0.25, 0.8 - (excess * 0.02));
      setDynamicFontSize(Math.max(8, Math.round(32 * scaleFactor)));
    }
  }, [labelData.coffeeName]);

  const calculateTastingNotesFontSize = useCallback(() => {
    const text = labelData.tastingNotes || '';
    const boxHeight = 72;
    const minFontSize = 8;
    const maxFontSize = 72;
    const lineHeight = 1.2;
    const maxLines = 3;
    
    if (text.length === 0) {
      const placeholderFontSize = Math.min(20, Math.floor(280 / 24 * 1.2));
      setTastingNotesFontSize(placeholderFontSize);
      return;
    }

    const wordsCount = text.split(/\s+/).length;
    const avgWordLength = text.length / Math.max(wordsCount, 1);
    const estimatedCharsPerLine = Math.floor(280 / Math.max(avgWordLength * 8, 8));
    const estimatedLines = Math.ceil(text.length / estimatedCharsPerLine);
    
    const targetLines = Math.min(estimatedLines, maxLines);
    const idealFontSize = (boxHeight / (targetLines * lineHeight));
    
    let finalSize;
    if (text.length <= 20) {
      finalSize = Math.min(maxFontSize, idealFontSize * 1.5);
    } else if (text.length <= 60) {
      finalSize = Math.min(maxFontSize, idealFontSize);
    } else if (text.length <= 150) {
      const scaleFactor = 1.0 - ((text.length - 60) / 180) * 0.4;
      finalSize = Math.max(minFontSize, idealFontSize * scaleFactor);
    } else {
      finalSize = minFontSize;
      const maxCapacity = Math.floor((boxHeight / (minFontSize * lineHeight)) * estimatedCharsPerLine);
      if (text.length > maxCapacity) {
        toast.error(`Text too long! Reduce content to fit in ${maxLines} lines.`);
      }
    }
    
    const newSize = Math.round(Math.max(minFontSize, Math.min(maxFontSize, finalSize)));
    setTastingNotesFontSize(newSize);
  }, [labelData.tastingNotes]);

  const drawTextElements = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const displayProductInfo = productInfo || {
      weight: '12 oz',
      grind: 'whole-bean' as const,
      type: 'regular' as const
    };

    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 2;
    ctx.fillStyle = labelData.productInfoTextColor || '#000000';
    
    const productInfoY = canvas.height - 156;
    const today = new Date();
    const roastDate = today.toLocaleDateString();
    
    ctx.font = `12px ${labelData.productInfoFontFamily || 'serif'}`;
    ctx.fillText(`${displayProductInfo.weight} • ${displayProductInfo.grind === 'whole-bean' ? 'Whole Bean' : 'Ground'}`, canvas.width / 2, productInfoY);
    ctx.fillText(`${displayProductInfo.type === 'regular' ? 'Regular' : 'Decaffeinated'}`, canvas.width / 2, productInfoY + 15);
    ctx.fillText(`Roast Date: ${roastDate}`, canvas.width / 2, productInfoY + 30);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px serif';
    ctx.fillText('Custom Roasted By JavaMania Coffee Roastery', canvas.width / 2, canvas.height - 60);
    ctx.font = '12px serif';
    ctx.fillText('Libertyville IL', canvas.width / 2, canvas.height - 45);
    ctx.fillText('www.javamania.com', canvas.width / 2, canvas.height - 30);
    ctx.font = '10px serif';
    ctx.fillText('100% Arabica Coffee & Natural Flavors', canvas.width / 2, canvas.height - 15);
    
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
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

  // Position helpers - center position for 384px wide canvas
  const coffeeNamePosition = labelData.coffeeNamePosition || { x: 192 - 150, y: 80 - 32 };
  const tastingNotesPosition = labelData.tastingNotesPosition || { x: 192 - 140, y: 200 - 36 };

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
        setTimeout(() => calculateFontSize(), 100);
        toast.success('AI Barista improved your coffee name!');
      } else if (type === 'notes') {
        onLabelChange({ ...labelData, tastingNotes: suggestion });
        setTimeout(() => calculateTastingNotesFontSize(), 100);
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

  const generateAIImage = () => {
    setAiDialogOpen('image');
    setImagePrompt('');
    setImageStyle('');
  };

  const handleImageGeneration = async () => {
    if (!imagePrompt.trim()) {
      toast.error('Please enter a prompt for the image');
      return;
    }

    setIsGeneratingImage(true);
    setAiDialogOpen(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-image-generator', {
        body: {
          prompt: imagePrompt,
          style: imageStyle,
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate image');
      }

      if (data.imageUrl) {
        onLabelChange({
          ...labelData,
          backgroundImage: data.imageUrl
        });
        toast.success('AI Background generated successfully!');
      }

    } catch (error) {
      console.error('AI Image generation error:', error);
      toast.error('Failed to generate AI background. Please try again.');
    }

    setIsGeneratingImage(false);
    setImagePrompt('');
    setImageStyle('');
  };

  const resetPositions = () => {
    onLabelChange({
      ...labelData,
      coffeeNamePosition: { x: 192 - 150, y: 80 - 32 },
      tastingNotesPosition: { x: 192 - 140, y: 200 - 36 }
    });
  };

  const isAnyAILoading = Object.values(isGeneratingAI).some(loading => loading) || isGeneratingImage;

  // Use effect for font calculations
  useEffect(() => {
    calculateFontSize();
  }, [calculateFontSize]);

  useEffect(() => {
    calculateTastingNotesFontSize();
  }, [calculateTastingNotesFontSize]);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 bg-gradient-warmth min-h-screen">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Coffee Label Designer</h1>
        <p className="text-muted-foreground text-lg">Create beautiful labels for your custom coffee blends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls Section */}
        <div className="space-y-6">
          <Card className="bg-card/80 backdrop-blur border-primary/20 shadow-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Coffee Label Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="coffeeName">Coffee Name</Label>
                <div className="relative">
                  <Input
                    id="coffeeName"
                    value={labelData.coffeeName}
                    onChange={(e) => onLabelChange({ ...labelData, coffeeName: e.target.value })}
                    placeholder="Enter your coffee name..."
                    className="pr-10"
                  />
                  <Button
                    onClick={() => handleAIButtonClick('name')}
                    variant="ghost"
                    size="sm"
                    disabled={isAnyAILoading}
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                  >
                    {isGeneratingAI.name ? (
                      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tastingNotes">Tasting Notes</Label>
                <div className="relative">
                  <Textarea
                    id="tastingNotes"
                    value={labelData.tastingNotes}
                    onChange={(e) => onLabelChange({ ...labelData, tastingNotes: e.target.value })}
                    placeholder="Describe the flavor profile..."
                    className="min-h-20 pr-10"
                  />
                  <Button
                    onClick={() => handleAIButtonClick('notes')}
                    variant="ghost"
                    size="sm"
                    disabled={isAnyAILoading}
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                  >
                    {isGeneratingAI.notes ? (
                      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select 
                    value={labelData.fontFamily || 'serif'} 
                    onValueChange={(value) => onLabelChange({ ...labelData, fontFamily: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map(font => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <Select 
                    value={labelData.textColor || '#000000'} 
                    onValueChange={(value) => onLabelChange({ ...labelData, textColor: value })}
                  >
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: labelData.textColor || '#000000' }}></div>
                        <span>Color</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map(color => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: color.value }}></div>
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Button onClick={resetPositions} variant="outline" className="w-full">
                  Reset Text Positions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <Card className="bg-card/80 backdrop-blur border-primary/20 shadow-glow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Label Preview</h2>
                </div>
                <Button onClick={downloadPreview} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="border-4 border-primary/20 rounded-xl p-6 bg-background/50 backdrop-blur shadow-glow">
                    <div 
                      ref={canvasContainerRef}
                      className="relative"
                      style={{ touchAction: 'none' }}
                    >
                      <canvas
                        ref={canvasRef}
                        className="border border-border rounded-lg max-w-full h-auto shadow-soft"
                        style={{ maxWidth: '500px', height: 'auto' }}
                      />
                    
                      {/* Background Options Overlay */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-row gap-2 z-50">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="secondary"
                          size="sm"
                          className="bg-background/95 hover:bg-background shadow-lg backdrop-blur border border-border/50"
                        >
                          <Image className="w-4 h-4 mr-1" />
                          Upload
                        </Button>
                        <Button
                          onClick={generateAIImage}
                          variant="secondary"
                          size="sm"
                          disabled={isGeneratingImage}
                          className="bg-background/95 hover:bg-background shadow-lg backdrop-blur border border-border/50"
                        >
                          {isGeneratingImage ? (
                            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-1" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-1" />
                          )}
                          AI Gen
                        </Button>
                        {labelData.backgroundImage && (
                          <Button
                            onClick={() => onLabelChange({ ...labelData, backgroundImage: undefined })}
                            variant="destructive"
                            size="sm"
                            className="bg-background/95 hover:bg-destructive/90 shadow-lg backdrop-blur border border-border/50"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      {/* Optimized Text Elements */}
                      <OptimizedTextElement
                        id="coffeeName"
                        content={labelData.coffeeName}
                        position={coffeeNamePosition}
                        fontSize={dynamicFontSize}
                        fontFamily={labelData.fontFamily || 'serif'}
                        color={labelData.textColor || '#000000'}
                        isDragging={dragState.isDragging && dragState.element === 'coffeeName'}
                        maxWidth={300}
                        maxHeight={64}
                        onPointerDown={handlePointerDown}
                        containerRef={canvasContainerRef}
                      />
                      
                      <OptimizedTextElement
                        id="tastingNotes"
                        content={labelData.tastingNotes}
                        position={tastingNotesPosition}
                        fontSize={tastingNotesFontSize}
                        fontFamily={labelData.fontFamily || 'serif'}
                        color={labelData.textColor || '#000000'}
                        isDragging={dragState.isDragging && dragState.element === 'tastingNotes'}
                        maxWidth={280}
                        maxHeight={72}
                        onPointerDown={handlePointerDown}
                        containerRef={canvasContainerRef}
                      />

                      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium shadow-soft">
                        Live Preview
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Dialogs */}
      <Dialog open={aiDialogOpen === 'name'} onOpenChange={() => setAiDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Barista - Coffee Name Assistant</DialogTitle>
            <DialogDescription>
              Tell the AI Barista how you'd like to improve your coffee name. Be specific about style, tone, or inspiration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nameRequest">Your Request</Label>
              <Textarea
                id="nameRequest"
                value={userRequest}
                onChange={(e) => setUserRequest(e.target.value)}
                placeholder="e.g., 'Make it sound more premium and exotic' or 'Add a seasonal twist'"
                className="min-h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(null)}>
              Cancel
            </Button>
            <Button onClick={handleAISubmit} disabled={!userRequest.trim()}>
              Generate Suggestion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={aiDialogOpen === 'notes'} onOpenChange={() => setAiDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Barista - Tasting Notes Assistant</DialogTitle>
            <DialogDescription>
              Describe what kind of tasting notes you want, and the AI Barista will craft perfect descriptions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notesRequest">Your Request</Label>
              <Textarea
                id="notesRequest"
                value={userRequest}
                onChange={(e) => setUserRequest(e.target.value)}
                placeholder="e.g., 'Make it sound more sophisticated' or 'Focus on chocolate and berry notes'"
                className="min-h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(null)}>
              Cancel
            </Button>
            <Button onClick={handleAISubmit} disabled={!userRequest.trim()}>
              Generate Suggestion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={aiDialogOpen === 'image'} onOpenChange={() => setAiDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Background Generator</DialogTitle>
            <DialogDescription>
              Describe the background image you want for your coffee label.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imagePrompt">Image Description</Label>
              <Textarea
                id="imagePrompt"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="e.g., 'A cozy coffee shop interior with warm lighting' or 'Coffee beans on a rustic wooden table'"
                className="min-h-20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageStyle">Style (Optional)</Label>
              <Select value={imageStyle} onValueChange={setImageStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a style..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realistic">Realistic</SelectItem>
                  <SelectItem value="artistic">Artistic</SelectItem>
                  <SelectItem value="vintage">Vintage</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                  <SelectItem value="rustic">Rustic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(null)}>
              Cancel
            </Button>
            <Button onClick={handleImageGeneration} disabled={!imagePrompt.trim()}>
              Generate Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};