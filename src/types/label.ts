export interface TextBox {
  id: string;
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  width: number;
  height: number;
}

export interface ImageElement {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  originalWidth: number;
  originalHeight: number;
}

export interface LabelData {
  coffeeName: string;
  coffeeNameFont: string;
  coffeeNameColor: string;
  coffeeNameFontSize?: number;
  coffeeNamePosition?: { x: number; y: number };
  backgroundImage?: ImageElement;
  textBoxes: TextBox[];
}

export interface ProductInfo {
  name: string;
  weight: string;
  type: 'regular' | 'decaf';
  grind: 'whole-bean' | 'ground';
  price?: string;
  description?: string;
}