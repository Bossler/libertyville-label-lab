import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Copy, RefreshCw, Coffee } from 'lucide-react';
import { toast } from 'sonner';

interface BlendComponent {
  coffee: { name: string; flavor: string; origin: string };
  percentage: number;
}

interface AIAssistantProps {
  selectedBlend: BlendComponent[];
  onSuggestion: (suggestion: string, type: 'name' | 'notes') => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ selectedBlend, onSuggestion }) => {
  const [suggestions, setSuggestions] = useState<{
    names: string[];
    notes: string[];
  }>({
    names: [],
    notes: []
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const generateSuggestions = async () => {
    if (selectedBlend.length === 0) {
      toast.error('Please select at least one coffee to generate suggestions');
      return;
    }

    setIsGenerating(true);

    // Simulate AI generation based on blend components
    await new Promise(resolve => setTimeout(resolve, 1500));

    const blendDescription = selectedBlend.map(component => 
      `${component.percentage}% ${component.coffee.name} (${component.coffee.origin})`
    ).join(', ');

    const coffeeNames = selectedBlend.map(c => c.coffee.name);
    const flavors = selectedBlend.flatMap(c => c.coffee.flavor.split(', '));
    const origins = selectedBlend.map(c => c.coffee.origin);

    // Generate coffee names
    const nameTemplates = [
      `${origins[0]} Harmony`,
      `${flavors[0]} Symphony`,
      `Artisan's Choice`,
      `Golden Hour Blend`,
      `Morning Ritual`,
      `Café Liberté`,
      `Heritage Roast`,
      `Craftsman's Pride`
    ];

    // Generate tasting notes
    const dominantFlavors = flavors.slice(0, 3);
    const noteTemplates = [
      `A harmonious blend featuring notes of ${dominantFlavors.join(', ').toLowerCase()}. This carefully crafted combination delivers a balanced cup with complexity that evolves with each sip.`,
      `Rich and full-bodied with prominent ${dominantFlavors[0].toLowerCase()} undertones. The ${origins[0]} components provide structure while complementary beans add depth and character.`,
      `An artisanal creation that celebrates the unique terroir of ${origins.join(' and ')}. Expect layers of ${dominantFlavors.join(', ').toLowerCase()} with a smooth, satisfying finish.`,
      `This signature blend combines the best of ${origins.length > 1 ? 'multiple origins' : origins[0]} to create a cup that's both approachable and sophisticated. Perfect for any time of day.`
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
          {selectedBlend.length > 0 ? (
            <>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Your Blend:</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  {selectedBlend.map((component, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{component.coffee.name}</span>
                      <Badge variant="secondary">{component.percentage}%</Badge>
                    </div>
                  ))}
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
              <p>Create a coffee blend first to get AI suggestions for names and tasting notes.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};