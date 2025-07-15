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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tastingNotesRef = useRef<HTMLTextAreaElement>(null);
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

  // Optimized drag state - separate from main state for performance
  const [dragState, setDragState] = useState<{
    element: 'coffeeName' | 'tastingNotes' | null;
    isDragging: boolean;
    startX: number;
    startY: number;
    startElementX: number;
    startElementY: number;
  }>({
    element: null,
    isDragging: false,
    startX: 0,
    startY: 0,
    startElementX: 0,
    startElementY: 0
  });

  // Performance optimization refs
  const animationFrameRef = useRef<number | null>(null);
  const canvasUpdateRef = useRef<number | null>(null);
  const lastCanvasUpdateRef = useRef<number>(0);

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

  // Optimized canvas updates - throttled and only when not dragging
  const scheduleCanvasUpdate = useCallback(() => {
    if (canvasUpdateRef.current) {
      cancelAnimationFrame(canvasUpdateRef.current);
    }
    
    canvasUpdateRef.current = requestAnimationFrame(() => {
      const now = Date.now();
      if (now - lastCanvasUpdateRef.current > 16) { // 60 FPS max
        drawLabel();
        calculateFontSize();
        calculateTastingNotesFontSize();
        lastCanvasUpdateRef.current = now;
      }
    });
  }, []);

  useEffect(() => {
    // Only update canvas when not actively dragging
    if (!dragState.isDragging) {
      scheduleCanvasUpdate();
    }
    
    return () => {
      if (canvasUpdateRef.current) {
        cancelAnimationFrame(canvasUpdateRef.current);
      }
    };
  }, [labelData, previewMode, dragState.isDragging, scheduleCanvasUpdate]);

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

  const drawLabel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 384;
    canvas.height = 576;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (labelData.backgroundImage) {
      const img = document.createElement('img');
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawTextElements(ctx, canvas);
        if (previewMode) drawWatermark(ctx, canvas);
      };
      img.src = labelData.backgroundImage;
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#f5f5f5');
      gradient.addColorStop(1, '#e5e5e5');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawTextElements(ctx, canvas);
      if (previewMode) drawWatermark(ctx, canvas);
    }
  }, [labelData.backgroundImage, previewMode]);

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

  // Optimized drag handlers
  const handlePointerDown = useCallback((event: React.PointerEvent, element: 'coffeeName' | 'tastingNotes') => {
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);
    
    const rect = target.getBoundingClientRect();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    
    const canvasX = rect.left - canvasRect.left + rect.width / 2;
    const canvasY = rect.top - canvasRect.top + rect.height / 2;
    
    setDragState({
      element,
      isDragging: true,
      startX: event.clientX,
      startY: event.clientY,
      startElementX: canvasX,
      startElementY: canvasY
    });

    // Visual feedback
    target.style.cursor = 'grabbing';
    target.style.transform = 'scale(1.05)';
    target.style.zIndex = '1000';
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!dragState.isDragging || !dragState.element) return;
    
    event.preventDefault();
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;
      
      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;
      
      const newX = dragState.startElementX + deltaX;
      const newY = dragState.startElementY + deltaY;
      
      const clampedX = Math.max(50, Math.min(canvasRect.width - 50, newX));
      const clampedY = Math.max(30, Math.min(canvasRect.height - 30, newY));
      
      // Visual-only update during drag
      const target = event.currentTarget as HTMLElement;
      if (target) {
        target.style.left = `${clampedX - target.offsetWidth / 2}px`;
        target.style.top = `${clampedY - target.offsetHeight / 2}px`;
      }
    });
  }, [dragState]);

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    if (!dragState.isDragging || !dragState.element) return;
    
    const target = event.currentTarget as HTMLElement;
    target.releasePointerCapture(event.pointerId);
    
    // Clean up visual feedback
    target.style.cursor = '';
    target.style.transform = '';
    target.style.zIndex = '';
    
    // Calculate final position
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (canvasRect) {
      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;
      
      const newX = dragState.startElementX + deltaX;
      const newY = dragState.startElementY + deltaY;
      
      const clampedX = Math.max(50, Math.min(canvasRect.width - 50, newX));
      const clampedY = Math.max(30, Math.min(canvasRect.height - 30, newY));
      
      // Commit final position to state
      if (dragState.element === 'coffeeName') {
        onLabelChange({
          ...labelData,
          coffeeNamePosition: { x: clampedX, y: clampedY }
        });
      } else if (dragState.element === 'tastingNotes') {
        onLabelChange({
          ...labelData,
          tastingNotesPosition: { x: clampedX, y: clampedY }
        });
      }
    }
    
    setDragState({
      element: null,
      isDragging: false,
      startX: 0,
      startY: 0,
      startElementX: 0,
      startElementY: 0
    });
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Schedule canvas update after drag ends
    setTimeout(() => scheduleCanvasUpdate(), 0);
  }, [dragState, labelData, onLabelChange, scheduleCanvasUpdate]);

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

  const resetPositions = () => {
    onLabelChange({
      ...labelData,
      coffeeNamePosition: { x: 192, y: 100 },
      tastingNotesPosition: { x: 192, y: 350 }
    });
    toast.success('Text positions reset to default');
  };

  // Calculate positions
  const coffeeNamePosition = labelData.coffeeNamePosition || { x: 192, y: 100 };
  const tastingNotesPosition = labelData.tastingNotesPosition || { x: 192, y: 350 };

  return (
    <div className="min-h-screen bg-gradient-warmth p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <Card className="bg-gradient-cream border-border shadow-elegant">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Label Preview</h2>
              </div>
              
              <div className="flex justify-center">
                <div className="relative">
                  <div className="border-4 border-primary/20 rounded-xl p-6 bg-background/50 backdrop-blur shadow-glow">
                    <div 
                      className="relative"
                      style={{ touchAction: 'none' }}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
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
                      
                      {/* Coffee Name Overlay Input */}
                      <div 
                        className={`absolute cursor-move group transition-all duration-200 ${
                          dragState.isDragging && dragState.element === 'coffeeName' ? 'scale-105 opacity-75 z-30' : 'hover:scale-105 opacity-100 z-20'
                        }`}
                        style={{
                          position: 'absolute',
                          left: coffeeNamePosition.x - 150,
                          top: coffeeNamePosition.y - 32,
                          willChange: 'transform',
                        }}
                        onPointerDown={(e) => handlePointerDown(e, 'coffeeName')}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                      >
                        <div className="relative group-hover:ring-2 group-hover:ring-primary group-hover:shadow-lg rounded-lg transition-all duration-300 bg-gradient-to-r from-primary/5 to-primary/10 group-hover:from-primary/10 group-hover:to-primary/20 border border-primary/20 group-hover:border-primary/40">
                          <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-primary text-primary-foreground p-1 rounded-md shadow-lg">
                              <Move className="w-4 h-4" />
                            </div>
                          </div>
                          
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity duration-200">
                            <GripVertical className="w-3 h-3 text-primary" />
                          </div>
                          
                          <Textarea
                            ref={textareaRef}
                            value={labelData.coffeeName}
                            onChange={(e) => onLabelChange({ ...labelData, coffeeName: e.target.value })}
                            onBlur={calculateFontSize}
                            onFocus={() => setActiveTextElement('coffeeName')}
                            placeholder="Edit Coffee Name • Drag to Move"
                            className="resize-none overflow-hidden border-0 bg-transparent backdrop-blur text-center font-bold shadow-none pointer-events-auto pl-8"
                            style={{
                              fontSize: `${dynamicFontSize}px`,
                              fontFamily: labelData.fontFamily || 'serif',
                              color: labelData.textColor || '#000000',
                              height: '64px',
                              lineHeight: '1.2',
                              textAlign: 'center',
                              width: '300px'
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                          />
                          
                          {/* Floating Toolbar for Coffee Name */}
                          {activeTextElement === 'coffeeName' && (
                            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-popover border border-border rounded-lg shadow-lg p-2 flex items-center gap-2 z-50 animate-scale-in">
                              <div className="flex items-center gap-1 border-r border-border pr-2">
                                <Type className="w-4 h-4 text-muted-foreground" />
                                <Select 
                                  value={labelData.fontFamily || 'serif'} 
                                  onValueChange={(value) => onLabelChange({ ...labelData, fontFamily: value })}
                                >
                                  <SelectTrigger className="w-24 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fontOptions.map(font => (
                                      <SelectItem key={font.value} value={font.value} className="text-xs">
                                        <span style={{ fontFamily: font.value }}>{font.label}</span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Paintbrush className="w-4 h-4 text-muted-foreground" />
                                <Select 
                                  value={labelData.textColor || '#000000'} 
                                  onValueChange={(value) => onLabelChange({ ...labelData, textColor: value })}
                                >
                                  <SelectTrigger className="w-20 h-8 text-xs">
                                    <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: labelData.textColor || '#000000' }}></div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {colorOptions.map(color => (
                                      <SelectItem key={color.value} value={color.value} className="text-xs">
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
                          )}
                          <Button
                            onClick={() => handleAIButtonClick('name')}
                            variant="ghost"
                            size="sm"
                            disabled={isAnyAILoading}
                            className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-primary text-primary-foreground hover:bg-primary/80 rounded-full shadow-sm"
                          >
                            <Bot className="w-3 h-3" />
                          </Button>
                          
                          {/* Drag Indicator Label */}
                          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full whitespace-nowrap">
                              Drag to reposition
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tasting Notes Overlay Input */}
                      <div 
                        className={`absolute cursor-move group transition-all duration-200 ${
                          dragState.isDragging && dragState.element === 'tastingNotes' ? 'scale-105 opacity-75 z-30' : 'hover:scale-105 opacity-100 z-20'
                        }`}
                        style={{
                          position: 'absolute',
                          left: tastingNotesPosition.x - 140,
                          top: tastingNotesPosition.y - 36,
                          willChange: 'transform',
                        }}
                        onPointerDown={(e) => handlePointerDown(e, 'tastingNotes')}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                      >
                        <div className="relative group-hover:ring-2 group-hover:ring-secondary group-hover:shadow-lg rounded-lg transition-all duration-300 bg-gradient-to-r from-secondary/5 to-secondary/10 group-hover:from-secondary/10 group-hover:to-secondary/20 border border-secondary/20 group-hover:border-secondary/40">
                          <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-secondary text-secondary-foreground p-1 rounded-md shadow-lg">
                              <Move className="w-4 h-4" />
                            </div>
                          </div>
                          
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity duration-200">
                            <GripVertical className="w-3 h-3 text-secondary" />
                          </div>
                          
                          <Textarea
                            ref={tastingNotesRef}
                            value={labelData.tastingNotes}
                            onChange={(e) => onLabelChange({ ...labelData, tastingNotes: e.target.value })}
                            onBlur={calculateTastingNotesFontSize}
                            onFocus={() => setActiveTextElement('tastingNotes')}
                            placeholder="Edit Coffee Description • Drag to Move"
                            className="resize-none overflow-hidden border-0 bg-transparent backdrop-blur text-center shadow-none pointer-events-auto pl-8"
                            style={{
                              fontSize: `${tastingNotesFontSize}px`,
                              fontFamily: labelData.fontFamily || 'serif',
                              color: labelData.textColor || '#000000',
                              height: '72px',
                              lineHeight: '1.3',
                              textAlign: 'center',
                              width: '280px'
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                          />
                          
                          {/* Floating Toolbar for Tasting Notes */}
                          {activeTextElement === 'tastingNotes' && (
                            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-popover border border-border rounded-lg shadow-lg p-2 flex items-center gap-2 z-50 animate-scale-in">
                              <div className="flex items-center gap-1 border-r border-border pr-2">
                                <Type className="w-4 h-4 text-muted-foreground" />
                                <Select 
                                  value={labelData.fontFamily || 'serif'} 
                                  onValueChange={(value) => onLabelChange({ ...labelData, fontFamily: value })}
                                >
                                  <SelectTrigger className="w-24 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fontOptions.map(font => (
                                      <SelectItem key={font.value} value={font.value} className="text-xs">
                                        <span style={{ fontFamily: font.value }}>{font.label}</span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Paintbrush className="w-4 h-4 text-muted-foreground" />
                                <Select 
                                  value={labelData.textColor || '#000000'} 
                                  onValueChange={(value) => onLabelChange({ ...labelData, textColor: value })}
                                >
                                  <SelectTrigger className="w-20 h-8 text-xs">
                                    <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: labelData.textColor || '#000000' }}></div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {colorOptions.map(color => (
                                      <SelectItem key={color.value} value={color.value} className="text-xs">
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
                          )}
                          <Button
                            onClick={() => handleAIButtonClick('notes')}
                            variant="ghost"
                            size="sm"
                            disabled={isAnyAILoading}
                            className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full shadow-sm"
                          >
                            <Bot className="w-3 h-3" />
                          </Button>
                          
                          {/* Drag Indicator Label */}
                          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full whitespace-nowrap">
                              Drag to reposition
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium shadow-soft">
                        Live Preview
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center mt-4">
                    <Button
                      onClick={resetPositions}
                      variant="outline"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Reset Text Positions
                    </Button>
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

      {/* AI Dialogs */}
      <Dialog open={!!aiDialogOpen && aiDialogOpen !== 'image'} onOpenChange={(open) => !open && setAiDialogOpen(null)}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              AI Barista Assistance
            </DialogTitle>
            <DialogDescription>
              How would you like to improve this {aiDialogOpen === 'name' ? 'coffee name' : 'tasting notes'}?
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
                    : "e.g., Add more detail about chocolate and caramel notes"
                }
                className="min-h-[80px]"
              />
            </div>
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

      <Dialog open={aiDialogOpen === 'image'} onOpenChange={(open) => !open && setAiDialogOpen(null)}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Background Image Generator
            </DialogTitle>
            <DialogDescription>
              Describe the background image you'd like for your coffee label.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imagePrompt">Image Description</Label>
              <Textarea
                id="imagePrompt"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="e.g., Coffee beans scattered on rustic wood, warm lighting"
                className="min-h-[80px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imageStyle">Style (Optional)</Label>
              <Input
                id="imageStyle"
                value={imageStyle}
                onChange={(e) => setImageStyle(e.target.value)}
                placeholder="e.g., watercolor, vintage, minimalist"
              />
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
                <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generate Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
