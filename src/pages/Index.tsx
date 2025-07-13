import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coffee, Palette, Sparkles, Package } from 'lucide-react';
import { BlendCreator } from '@/components/BlendCreator';
import { LabelDesigner } from '@/components/LabelDesigner';
import { AIAssistant } from '@/components/AIAssistant';
import { OrderSummary } from '@/components/OrderSummary';
import coffeeHero from '@/assets/coffee-hero.jpg';

interface BlendComponent {
  coffee: { id: string; name: string; flavor: string; origin: string; roast: string };
  percentage: number;
}

interface LabelData {
  coffeeName: string;
  tastingNotes: string;
  backgroundImage?: string;
}

const Index = () => {
  const [selectedBlend, setSelectedBlend] = useState<BlendComponent[]>([]);
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [labelData, setLabelData] = useState<LabelData>({
    coffeeName: '',
    tastingNotes: ''
  });

  const handleBlendChange = (blend: BlendComponent[], total: number) => {
    setSelectedBlend(blend);
    setTotalPercentage(total);
    
    // Auto-generate blend name if coffee name is empty
    if (!labelData.coffeeName && blend.length > 0) {
      const blendName = blend.length === 1 
        ? blend[0].coffee.name
        : `Custom ${blend.length}-Bean Blend`;
      setLabelData(prev => ({ ...prev, coffeeName: blendName }));
    }
  };

  const handleSuggestion = (suggestion: string, type: 'name' | 'notes') => {
    // This is called from AI Assistant but doesn't auto-fill
    // Users must manually copy and paste suggestions
  };

  return (
    <div className="min-h-screen bg-gradient-warmth">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="h-64 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${coffeeHero})` }}
        >
          <div className="absolute inset-0 bg-gradient-coffee/70" />
          <div className="relative z-10 flex items-center justify-center h-full text-center">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground">
                Custom Coffee Label Designer
              </h1>
              <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto px-4">
                Create your perfect blend and design a beautiful 4" × 6" label for Libertyville Coffee Company
              </p>
              <Badge variant="secondary" className="text-sm">
                Professional Quality Printing • Custom Blends • AI Assistance
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="blend" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card shadow-soft">
            <TabsTrigger value="blend" className="flex items-center gap-2">
              <Coffee className="w-4 h-4" />
              <span className="hidden sm:inline">Blend</span>
            </TabsTrigger>
            <TabsTrigger value="label" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Label</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI Help</span>
            </TabsTrigger>
            <TabsTrigger value="order" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Order</span>
            </TabsTrigger>
          </TabsList>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TabsContent value="blend" className="mt-0">
                <BlendCreator 
                  selectedBlend={selectedBlend}
                  onBlendChange={handleBlendChange}
                />
              </TabsContent>

              <TabsContent value="label" className="mt-0">
                <LabelDesigner
                  labelData={labelData}
                  onLabelChange={setLabelData}
                  blendName={selectedBlend.length > 0 ? 
                    selectedBlend.length === 1 
                      ? selectedBlend[0].coffee.name
                      : `Custom ${selectedBlend.length}-Bean Blend`
                    : undefined
                  }
                />
              </TabsContent>

              <TabsContent value="ai" className="mt-0">
                <AIAssistant
                  selectedBlend={selectedBlend}
                  onSuggestion={handleSuggestion}
                />
              </TabsContent>

              <TabsContent value="order" className="mt-0">
                <OrderSummary
                  selectedBlend={selectedBlend}
                  labelData={labelData}
                  totalPercentage={totalPercentage}
                />
              </TabsContent>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card className="bg-card border-border shadow-soft">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Your Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Blend Total:</span>
                    <Badge variant={totalPercentage === 100 ? "default" : "secondary"}>
                      {totalPercentage}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Coffee Count:</span>
                    <Badge variant="secondary">{selectedBlend.length}/4</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Label Name:</span>
                    <Badge variant={labelData.coffeeName ? "default" : "secondary"}>
                      {labelData.coffeeName ? 'Set' : 'Empty'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card className="bg-card border-border shadow-soft">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="space-y-2">
                    <p><strong>1. Create Blend:</strong> Choose 1-4 coffees, assign percentages (must total 100%)</p>
                    <p><strong>2. Design Label:</strong> Add name, tasting notes, and optional background image</p>
                    <p><strong>3. Get AI Help:</strong> Use AI for creative suggestions (copy & paste manually)</p>
                    <p><strong>4. Submit Order:</strong> We'll print your custom label at professional quality</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
