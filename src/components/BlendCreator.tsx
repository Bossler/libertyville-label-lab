import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Coffee, Plus, Minus, Sparkles } from 'lucide-react';

interface Coffee {
  id: string;
  name: string;
  origin: string;
  flavor: string;
  roast: string;
}

interface BlendComponent {
  coffee: Coffee;
  percentage: number;
}

interface BlendCreatorProps {
  onBlendChange: (blend: BlendComponent[], totalPercentage: number) => void;
  selectedBlend: BlendComponent[];
}

const availableCoffees: Coffee[] = [
  { id: '1', name: 'Colombian Supremo', origin: 'Colombia', flavor: 'Chocolate, Caramel, Citrus', roast: 'Medium' },
  { id: '2', name: 'Ethiopian Yirgacheffe', origin: 'Ethiopia', flavor: 'Floral, Wine, Berry', roast: 'Light' },
  { id: '3', name: 'Guatemalan Antigua', origin: 'Guatemala', flavor: 'Spicy, Smoky, Full-bodied', roast: 'Dark' },
  { id: '4', name: 'Brazilian Santos', origin: 'Brazil', flavor: 'Nutty, Sweet, Balanced', roast: 'Medium' },
  { id: '5', name: 'Costa Rican Tarrazú', origin: 'Costa Rica', flavor: 'Bright, Clean, Citrusy', roast: 'Medium-Light' },
  { id: '6', name: 'Jamaica Blue Mountain', origin: 'Jamaica', flavor: 'Mild, Sweet, Complex', roast: 'Medium' },
];

const percentageOptions = [25, 33, 50, 66, 75];

export const BlendCreator: React.FC<BlendCreatorProps> = ({ onBlendChange, selectedBlend }) => {
  const totalPercentage = selectedBlend.reduce((sum, component) => sum + component.percentage, 0);

  const addCoffee = (coffee: Coffee) => {
    if (selectedBlend.length >= 4) return;
    
    const remainingPercentage = 100 - totalPercentage;
    const suggestedPercentage = Math.min(33, remainingPercentage);
    
    const newBlend = [...selectedBlend, { coffee, percentage: suggestedPercentage }];
    onBlendChange(newBlend, totalPercentage + suggestedPercentage);
  };

  const removeCoffee = (coffeeId: string) => {
    const newBlend = selectedBlend.filter(component => component.coffee.id !== coffeeId);
    const newTotal = newBlend.reduce((sum, component) => sum + component.percentage, 0);
    onBlendChange(newBlend, newTotal);
  };

  const updatePercentage = (coffeeId: string, percentage: number) => {
    const newBlend = selectedBlend.map(component =>
      component.coffee.id === coffeeId ? { ...component, percentage } : component
    );
    const newTotal = newBlend.reduce((sum, component) => sum + component.percentage, 0);
    onBlendChange(newBlend, newTotal);
  };

  const availableToAdd = availableCoffees.filter(
    coffee => !selectedBlend.some(component => component.coffee.id === coffee.id)
  );

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-cream border-border shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-primary" />
            Create Your Blend
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedBlend.map((component) => (
            <div key={component.coffee.id} className="space-y-3 p-4 bg-card rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{component.coffee.name}</h4>
                  <p className="text-sm text-muted-foreground">{component.coffee.origin} • {component.coffee.roast} Roast</p>
                  <p className="text-xs text-muted-foreground">{component.coffee.flavor}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCoffee(component.coffee.id)}
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Percentage:</span>
                  <Badge variant="secondary">{component.percentage}%</Badge>
                </div>
                <div className="flex gap-2">
                  {percentageOptions.map((option) => (
                    <Button
                      key={option}
                      variant={component.percentage === option ? "coffee" : "outline"}
                      size="sm"
                      onClick={() => updatePercentage(component.coffee.id, option)}
                      disabled={option > (100 - totalPercentage + component.percentage)}
                    >
                      {option}%
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div className="text-center py-4">
            <Badge 
              variant={totalPercentage === 100 ? "default" : "secondary"}
              className="text-lg px-4 py-2"
            >
              Total: {totalPercentage}%
            </Badge>
            {totalPercentage !== 100 && (
              <p className="text-sm text-muted-foreground mt-2">
                {totalPercentage < 100 ? `Add ${100 - totalPercentage}% more` : `Reduce by ${totalPercentage - 100}%`}
              </p>
            )}
          </div>

          {selectedBlend.length < 4 && availableToAdd.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Coffee
              </h4>
              <div className="grid gap-2">
                {availableToAdd.map((coffee) => (
                  <Button
                    key={coffee.id}
                    variant="cream"
                    className="justify-start h-auto p-3"
                    onClick={() => addCoffee(coffee)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{coffee.name}</div>
                      <div className="text-xs opacity-75">{coffee.origin} • {coffee.flavor}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};