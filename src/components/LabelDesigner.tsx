import React, { useRef, useEffect, useState } from 'react';
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
  const [isDragging, setIsDragging] = useState<'coffeeName' | 'tastingNotes' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeTextElement, setActiveTextElement] = useState<'coffeeName' | 'tastingNotes' | null>(null);

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

  useEffect(() => {
    drawLabel();
    calculateFontSize();
    calculateTastingNotesFontSize();
  }, [labelData, previewMode]);

  const calculateFontSize = () => {
    const text = labelData.coffeeName || '';
    const boxHeight = 64; // Fixed box height in pixels
    const maxLineLength = 15; // Optimal characters per line for readability
    
    if (text.length === 0) {
      setDynamicFontSize(32);
    } else if (text.length <= maxLineLength) {
      // Single line - scale up to fill box
      const scaleFactor = Math.min(2.0, Math.max(1.0, boxHeight / 32));
      setDynamicFontSize(Math.min(48, 32 * scaleFactor));
    } else if (text.length <= maxLineLength * 2) {
      // Two lines - scale to fit nicely
      const scaleFactor = Math.min(1.5, Math.max(0.8, boxHeight / 40));
      setDynamicFontSize(Math.max(16, Math.min(32, 32 * scaleFactor)));
    } else {
      // Longer text - scale down to minimum readable size
      const excess = text.length - (maxLineLength * 2);
      const scaleFactor = Math.max(0.25, 0.8 - (excess * 0.02));
      setDynamicFontSize(Math.max(8, Math.round(32 * scaleFactor)));
    }
  };

  const calculateTastingNotesFontSize = () => {
    const text = labelData.tastingNotes || '';
    const boxHeight = 72;
    const minFontSize = 8;
    const maxFontSize = 72;
    const lineHeight = 1.2;
    const maxLines = 3;
    
    if (text.length === 0) {
      // For empty field, size to fit placeholder "Edit Coffee Description" on one line
      // Estimate: 24 characters, container width ~280px, so ~11px per char max
      const placeholderFontSize = Math.min(20, Math.floor(280 / 24 * 1.2)); // Conservative sizing
      setTastingNotesFontSize(placeholderFontSize);
      return;
    }

    // Estimate actual lines based on word wrapping (more accurate)
    const wordsCount = text.split(/\s+/).length;
    const avgWordLength = text.length / Math.max(wordsCount, 1);
    const estimatedCharsPerLine = Math.floor(280 / Math.max(avgWordLength * 8, 8)); // Rough estimate based on container width
    const estimatedLines = Math.ceil(text.length / estimatedCharsPerLine);
    
    // Calculate font size to fit exactly in the box
    const targetLines = Math.min(estimatedLines, maxLines);
    const idealFontSize = (boxHeight / (targetLines * lineHeight));
    
    // Apply scaling based on content density
    let finalSize;
    if (text.length <= 20) {
      // Very short - use large font
      finalSize = Math.min(maxFontSize, idealFontSize * 1.5);
    } else if (text.length <= 60) {
      // Medium length - optimal size
      finalSize = Math.min(maxFontSize, idealFontSize);
    } else if (text.length <= 150) {
      // Long text - scale down gradually
      const scaleFactor = 1.0 - ((text.length - 60) / 180) * 0.4;
      finalSize = Math.max(minFontSize, idealFontSize * scaleFactor);
    } else {
      // Very long - minimum size with warning
      finalSize = minFontSize;
      const maxCapacity = Math.floor((boxHeight / (minFontSize * lineHeight)) * estimatedCharsPerLine);
      if (text.length > maxCapacity) {
        toast.error(`Text too long! Reduce content to fit in ${maxLines} lines.`);
      }
    }
    
    const newSize = Math.round(Math.max(minFontSize, Math.min(maxFontSize, finalSize)));
    setTastingNotesFontSize(newSize);
    
    // Debug logging
    console.log('Tasting Notes Font Calc:', {
      textLength: text.length,
      estimatedLines,
      targetLines,
      idealFontSize: Math.round(idealFontSize),
      finalSize: newSize
    });
  };

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
      // Default light gray gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#f5f5f5');
      gradient.addColorStop(1, '#e5e5e5');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawTextElements(ctx, canvas);
      if (previewMode) drawWatermark(ctx, canvas);
    }
  };

  const drawTextElements = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Skip drawing text elements since they're now overlay inputs
    // Coffee name and tasting notes are handled by overlay inputs

    // Only draw static elements like roast date and branding

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
        // Trigger font size recalculation after AI suggestion
        setTimeout(() => calculateFontSize(), 100);
        toast.success('AI Barista improved your coffee name!');
      } else if (type === 'notes') {
        onLabelChange({ ...labelData, tastingNotes: suggestion });
        // Trigger font size recalculation after AI suggestion
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

  const handleMouseDown = (e: React.MouseEvent, element: 'coffeeName' | 'tastingNotes') => {
    e.preventDefault();
    setIsDragging(element);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(e.clientX - canvasRect.left - dragOffset.x, canvasRect.width - 344));
    const newY = Math.max(0, Math.min(e.clientY - canvasRect.top - dragOffset.y, canvasRect.height - (isDragging === 'coffeeName' ? 64 : 72)));
    
    if (isDragging === 'coffeeName') {
      onLabelChange({
        ...labelData,
        coffeeNamePosition: { x: newX, y: newY }
      });
    } else if (isDragging === 'tastingNotes') {
      onLabelChange({
        ...labelData,
        tastingNotesPosition: { x: newX, y: newY }
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const resetPositions = () => {
    onLabelChange({
      ...labelData,
      coffeeNamePosition: undefined,
      tastingNotesPosition: undefined
    });
    toast.success('Text positions reset to default');
  };

  return (
    <div className="min-h-screen bg-gradient-warmth p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <Card className="bg-gradient-soft border-border shadow-soft">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-foreground flex items-center justify-center gap-2">
              <Palette className="w-6 h-6 text-primary" />
              Coffee Label Designer
            </CardTitle>
            {productName && (
              <Badge variant="secondary" className="mt-2">
                Designing for: {productName}
              </Badge>
            )}
          </CardHeader>
        </Card>

        {/* Top Section - Preview */}
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
                    <div 
                      className="relative"
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      <canvas
                        ref={canvasRef}
                        className="border border-border rounded-lg max-w-full h-auto shadow-soft"
                        style={{ maxWidth: '500px', height: 'auto' }}
                      />
                    
                      {/* Background Options Overlay */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
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
                          className="bg-background/90 hover:bg-background shadow-lg backdrop-blur"
                        >
                          <Image className="w-4 h-4 mr-1" />
                          Upload
                        </Button>
                        <Button
                          onClick={generateAIImage}
                          variant="secondary"
                          size="sm"
                          disabled={isGeneratingImage}
                          className="bg-background/90 hover:bg-background shadow-lg backdrop-blur"
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
                            className="bg-background/90 hover:bg-destructive/90 shadow-lg backdrop-blur"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      {/* Coffee Name Overlay Input */}
                      <div 
                        className="absolute cursor-move group hover:scale-105 transition-all duration-200"
                        style={{
                          top: labelData.coffeeNamePosition?.y || 20,
                          left: labelData.coffeeNamePosition?.x || 20,
                          right: labelData.coffeeNamePosition?.x ? 'auto' : 20,
                          width: labelData.coffeeNamePosition?.x ? '344px' : 'auto'
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'coffeeName')}
                      >
                        <div className="relative group-hover:ring-2 group-hover:ring-primary group-hover:shadow-lg rounded-lg transition-all duration-300 bg-gradient-to-r from-primary/5 to-primary/10 group-hover:from-primary/10 group-hover:to-primary/20 border border-primary/20 group-hover:border-primary/40">
                          {/* Drag Handle */}
                          <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-primary text-primary-foreground p-1 rounded-md shadow-lg">
                              <Move className="w-4 h-4" />
                            </div>
                          </div>
                          
                          {/* Grip Pattern */}
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
                              textAlign: 'center'
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
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
                        className="absolute cursor-move group hover:scale-105 transition-all duration-200"
                        style={{
                          top: labelData.tastingNotesPosition?.y || 'auto',
                          bottom: labelData.tastingNotesPosition?.y ? 'auto' : 80,
                          left: labelData.tastingNotesPosition?.x || 20,
                          right: labelData.tastingNotesPosition?.x ? 'auto' : 20,
                          width: labelData.tastingNotesPosition?.x ? '344px' : 'auto'
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'tastingNotes')}
                      >
                        <div className="relative group-hover:ring-2 group-hover:ring-secondary group-hover:shadow-lg rounded-lg transition-all duration-300 bg-gradient-to-r from-secondary/5 to-secondary/10 group-hover:from-secondary/10 group-hover:to-secondary/20 border border-secondary/20 group-hover:border-secondary/40">
                          {/* Drag Handle */}
                          <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-secondary text-secondary-foreground p-1 rounded-md shadow-lg">
                              <Move className="w-4 h-4" />
                            </div>
                          </div>
                          
                          {/* Grip Pattern */}
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
                              textAlign: 'center'
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
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
                  
                  {/* Position Controls */}
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

        {/* Bottom Section - Style Controls */}
        <Card className="bg-card border-border shadow-soft">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Style & Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  value={labelData.textColor || '#000000'}
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