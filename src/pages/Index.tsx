import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coffee, Palette, Sparkles, Package, ShoppingBag } from 'lucide-react';
import { LabelDesigner } from '@/components/LabelDesigner';
import { AIAssistant } from '@/components/AIAssistant';
import coffeeHero from '@/assets/coffee-hero.jpg';

interface ProductInfo {
  name: string;
  weight: string;
  type: 'regular' | 'decaf';
  grind: 'whole-bean' | 'ground';
  price?: string;
  description?: string;
}

interface LabelData {
  coffeeName: string;
  tastingNotes: string;
  backgroundImage?: string;
}

const Index = () => {
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [labelData, setLabelData] = useState<LabelData>({
    coffeeName: '',
    tastingNotes: ''
  });

  // Extract product info from URL parameters (from Shopify)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    const weight = urlParams.get('weight');
    const type = urlParams.get('type') as 'regular' | 'decaf';
    const grind = urlParams.get('grind') as 'whole-bean' | 'ground';
    const price = urlParams.get('price');
    const description = urlParams.get('description');

    if (name && weight) {
      const product: ProductInfo = {
        name,
        weight,
        type: type || 'regular',
        grind: grind || 'whole-bean',
        price,
        description
      };
      setProductInfo(product);
      
      // Auto-set coffee name if not already set
      if (!labelData.coffeeName) {
        setLabelData(prev => ({ ...prev, coffeeName: name }));
      }
    }
  }, []);

  const handleSuggestion = (suggestion: string, type: 'name' | 'notes') => {
    // AI Assistant suggestions - users must manually copy and paste
    console.log('AI suggestion generated:', { suggestion, type });
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
                Design a beautiful 4" × 6" label for your Java Mania coffee selection
              </p>
              <Badge variant="secondary" className="text-sm">
                Professional Quality Printing • Shopify Integration • AI Assistance
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="product" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card shadow-soft">
            <TabsTrigger value="product" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Product</span>
            </TabsTrigger>
            <TabsTrigger value="label" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Label</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI Help</span>
            </TabsTrigger>
          </TabsList>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TabsContent value="product" className="mt-0">
                <Card className="bg-card border-border shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coffee className="w-5 h-5" />
                      Product Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {productInfo ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Coffee Name</label>
                            <p className="text-lg font-semibold">{productInfo.name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Weight</label>
                            <p className="text-lg">{productInfo.weight}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Type</label>
                            <Badge variant="secondary" className="capitalize">{productInfo.type}</Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Grind</label>
                            <Badge variant="secondary" className="capitalize">{productInfo.grind.replace('-', ' ')}</Badge>
                          </div>
                        </div>
                        {productInfo.description && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Description</label>
                            <p className="text-sm mt-1">{productInfo.description}</p>
                          </div>
                        )}
                        {productInfo.price && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Price</label>
                            <p className="text-lg font-semibold">${productInfo.price}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Coffee className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No product information found. This page should be accessed from your Shopify store.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="label" className="mt-0">
                <LabelDesigner
                  labelData={labelData}
                  onLabelChange={setLabelData}
                  productName={productInfo?.name}
                />
              </TabsContent>

              <TabsContent value="ai" className="mt-0">
                <AIAssistant
                  productInfo={productInfo}
                  onSuggestion={handleSuggestion}
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
                    <span className="text-sm text-muted-foreground">Product:</span>
                    <Badge variant={productInfo ? "default" : "secondary"}>
                      {productInfo ? 'Loaded' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Label Name:</span>
                    <Badge variant={labelData.coffeeName ? "default" : "secondary"}>
                      {labelData.coffeeName ? 'Set' : 'Empty'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tasting Notes:</span>
                    <Badge variant={labelData.tastingNotes ? "default" : "secondary"}>
                      {labelData.tastingNotes ? 'Added' : 'Empty'}
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
                    <p><strong>1. Product Info:</strong> Comes from your Shopify product selection</p>
                    <p><strong>2. Design Label:</strong> Add name, tasting notes, and optional background image</p>
                    <p><strong>3. Get AI Help:</strong> Use AI for creative suggestions (copy & paste manually)</p>
                    <p><strong>4. Complete Order:</strong> We'll print your custom label at professional quality</p>
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
