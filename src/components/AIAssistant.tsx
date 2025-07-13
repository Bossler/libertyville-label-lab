import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Copy, RefreshCw, Coffee } from 'lucide-react';
import { toast } from 'sonner';

interface ProductInfo {
  name: string;
  weight: string;
  type: 'regular' | 'decaf';
  grind: 'whole-bean' | 'ground';
  price?: string;
  description?: string;
}

interface AIAssistantProps {
  productInfo: ProductInfo | null;
  onSuggestion: (suggestion: string, type: 'name' | 'notes') => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ productInfo, onSuggestion }) => {
  const [suggestions, setSuggestions] = useState<{
    names: string[];
    notes: string[];
  }>({
    names: [],
    notes: []
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const generateSuggestions = async () => {
    if (!productInfo) {
      toast.error('Product information is required to generate suggestions');
      return;
    }

    setIsGenerating(true);

    // Simulate AI generation based on product info
    await new Promise(resolve => setTimeout(resolve, 1500));

    const coffeeName = productInfo.name;
    const coffeeType = productInfo.type;
    const grindType = productInfo.grind;

    // Generate creative coffee names based on product
    const nameTemplates = [
      `Artisan ${coffeeName}`,
      `Heritage ${coffeeName}`,
      `${coffeeName} Reserve`,
      `Custom ${coffeeName}`,
      `Premium ${coffeeName}`,
      `Signature ${coffeeName}`,
      `Handcrafted ${coffeeName}`,
      `Traditional ${coffeeName}`
    ];

    // Generate tasting notes based on coffee type and characteristics
    const noteTemplates = [
      `This ${coffeeType} coffee delivers a rich, full-bodied experience with complex flavor notes and a smooth finish. Perfect for any time of day.`,
      `A carefully selected ${coffeeName.toLowerCase()} offering balanced acidity and depth. The ${grindType.replace('-', ' ')} preparation enhances its natural characteristics.`,
      `Experience the authentic taste of premium ${coffeeName.toLowerCase()}. This ${coffeeType} variety showcases traditional coffee craftsmanship with modern quality standards.`,
      `Crafted for coffee enthusiasts, this ${coffeeName.toLowerCase()} blend provides exceptional flavor complexity with notes that evolve beautifully in each cup.`,
      `A distinguished ${coffeeType} coffee that exemplifies quality and tradition. The careful roasting process brings out the unique characteristics of this exceptional bean.`
    ];

    setSuggestions({
      names: nameTemplates.slice(0, 4),
      notes: noteTemplates.slice(0, 3)
    });

    setIsGenerating(false);
    toast.success('AI suggestions generated!');
  };

  const copySuggestion = async (text: string, type: 'name' | 'notes') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type === 'name' ? 'Name' : 'Notes'} copied to clipboard! Paste it into the label designer.`);
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success(`${type === 'name' ? 'Name' : 'Notes'} copied to clipboard!`);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-cream border-border shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {productInfo ? (
            <>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Your Product:</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Coffee:</span>
                    <Badge variant="secondary">{productInfo.name}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <Badge variant="secondary" className="capitalize">{productInfo.type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Grind:</span>
                    <Badge variant="secondary" className="capitalize">{productInfo.grind.replace('-', ' ')}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Weight:</span>
                    <Badge variant="secondary">{productInfo.weight}</Badge>
                  </div>
                </div>
              </div>

              <Button
                variant="golden"
                onClick={generateSuggestions}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate AI Suggestions
                  </>
                )}
              </Button>

              {(suggestions.names.length > 0 || suggestions.notes.length > 0) && (
                <div className="space-y-4 pt-4 border-t border-border">
                  {suggestions.names.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <Coffee className="w-4 h-4" />
                        Suggested Names
                      </h4>
                      <div className="space-y-2">
                        {suggestions.names.map((name, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-card rounded border">
                            <span className="text-sm">{name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copySuggestion(name, 'name')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestions.notes.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground">Suggested Tasting Notes</h4>
                      <div className="space-y-3">
                        {suggestions.notes.map((notes, index) => (
                          <div key={index} className="p-3 bg-card rounded border space-y-2">
                            <p className="text-sm text-foreground">{notes}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copySuggestion(notes, 'notes')}
                              className="w-full"
                            >
                              <Copy className="w-3 h-3 mr-2" />
                              Copy Notes
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <p><strong>Note:</strong> These are AI-generated suggestions. Copy any text you like and paste it into the label designer. All text must be manually entered by you.</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Coffee className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Product information from Shopify is required to generate AI suggestions for names and tasting notes.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};