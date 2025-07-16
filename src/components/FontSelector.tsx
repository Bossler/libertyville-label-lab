import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FontSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const fontOptions = [
  { value: 'serif', label: 'Serif', style: 'serif' },
  { value: 'sans-serif', label: 'Sans Serif', style: 'sans-serif' },
  { value: 'monospace', label: 'Monospace', style: 'monospace' },
  { value: 'cursive', label: 'Cursive', style: 'cursive' },
  { value: 'fantasy', label: 'Fantasy', style: 'fantasy' },
  { value: 'Arial, sans-serif', label: 'Arial', style: 'Arial, sans-serif' },
  { value: 'Times New Roman, serif', label: 'Times New Roman', style: 'Times New Roman, serif' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica', style: 'Helvetica, sans-serif' },
  { value: 'Georgia, serif', label: 'Georgia', style: 'Georgia, serif' },
  { value: 'Verdana, sans-serif', label: 'Verdana', style: 'Verdana, sans-serif' },
];

export const FontSelector: React.FC<FontSelectorProps> = ({ value, onChange, label }) => {
  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select font..." />
        </SelectTrigger>
        <SelectContent>
          {fontOptions.map((font) => (
            <SelectItem 
              key={font.value} 
              value={font.value}
              style={{ fontFamily: font.style }}
            >
              {font.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};