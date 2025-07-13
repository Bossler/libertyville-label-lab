import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Package, Check } from 'lucide-react';
import { toast } from 'sonner';

interface BlendComponent {
  coffee: { name: string; flavor: string; origin: string };
  percentage: number;
}

interface LabelData {
  coffeeName: string;
  tastingNotes: string;
  backgroundImage?: string;
}

interface OrderSummaryProps {
  selectedBlend: BlendComponent[];
  labelData: LabelData;
  totalPercentage: number;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  selectedBlend,
  labelData,
  totalPercentage
}) => {
  const isComplete = totalPercentage === 100 && labelData.coffeeName.trim() !== '';

  const handleSubmitOrder = () => {
    if (!isComplete) {
      toast.error('Please complete your blend and label before submitting');
      return;
    }

    // Generate order data structure
    const orderData = {
      order_id: `LC${Date.now()}`,
      coffee_name: labelData.coffeeName,
      tasting_notes: labelData.tastingNotes,
      blend_components: selectedBlend.map(component => ({
        coffee_name: component.coffee.name,
        origin: component.coffee.origin,
        percentage: component.percentage
      })),
      image_url: labelData.backgroundImage || null,
      roast_date: new Date().toISOString().split('T')[0], // Today's date
      created_at: new Date().toISOString()
    };

    // In a real implementation, this would submit to the backend
    console.log('Order Data:', orderData);
    
    toast.success('Order submitted successfully! We\'ll take it from here.');
    
    // Show completion message
    setTimeout(() => {
      alert('Once you\'re happy with your label, place your order! We\'ll take it from there—your custom design will be printed at full quality and shipped with your coffee.');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-cream border-border shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Blend Summary */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Your Custom Blend</h4>
            {selectedBlend.length > 0 ? (
              <div className="space-y-2">
                {selectedBlend.map((component, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-3 bg-card rounded border">
                    <div>
                      <span className="font-medium text-sm">{component.coffee.name}</span>
                      <p className="text-xs text-muted-foreground">{component.coffee.origin}</p>
                    </div>
                    <Badge variant="secondary">{component.percentage}%</Badge>
                  </div>
                ))}
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total:</span>
                    <Badge variant={totalPercentage === 100 ? "default" : "secondary"}>
                      {totalPercentage}%
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No blend selected</p>
            )}
          </div>

          <Separator />

          {/* Label Summary */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Label Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Coffee Name:</span>
                <span className="text-sm font-medium">
                  {labelData.coffeeName || 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tasting Notes:</span>
                <span className="text-sm font-medium">
                  {labelData.tastingNotes ? 'Added' : 'Not added'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Background Image:</span>
                <span className="text-sm font-medium">
                  {labelData.backgroundImage ? 'Uploaded' : 'Default'}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Completion Status */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Ready to Order?</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {totalPercentage === 100 ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 border-2 border-muted rounded-full" />
                )}
                <span className="text-sm">Blend totals 100%</span>
              </div>
              <div className="flex items-center gap-2">
                {labelData.coffeeName.trim() !== '' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 border-2 border-muted rounded-full" />
                )}
                <span className="text-sm">Coffee name added</span>
              </div>
            </div>
          </div>

          <Button
            variant={isComplete ? "coffee" : "secondary"}
            onClick={handleSubmitOrder}
            disabled={!isComplete}
            className="w-full"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isComplete ? 'Submit Custom Order' : 'Complete Required Fields'}
          </Button>

          {isComplete && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p><strong>What happens next:</strong></p>
              <p>• Your order will be processed by our team</p>
              <p>• Label will be printed at 300 DPI professional quality</p>
              <p>• Fresh coffee roasted and labeled with your design</p>
              <p>• Shipped directly to you</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};