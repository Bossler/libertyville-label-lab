import React, { useState, useEffect } from 'react';
import { LabelDesigner } from '@/components/LabelDesigner';

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
  fontFamily?: string;
  textColor?: string;
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
      <div className="container mx-auto px-4 py-8">
        <LabelDesigner
          labelData={labelData}
          onLabelChange={setLabelData}
          productName={productInfo?.name}
          productInfo={productInfo}
        />
      </div>
    </div>
  );
};

export default Index;
