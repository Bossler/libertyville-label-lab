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
  // Custom fonts
  { value: 'AgencyFB, sans-serif', label: 'Agency FB Bold', style: 'AgencyFB, sans-serif' },
  { value: 'Algerian, serif', label: 'Algerian', style: 'Algerian, serif' },
  { value: 'Antique, serif', label: 'Antique', style: 'Antique, serif' },
  { value: 'BellMT, serif', label: 'Bell MT', style: 'BellMT, serif' },
  { value: 'DubaiRegular, sans-serif', label: 'Dubai Regular', style: 'DubaiRegular, sans-serif' },
  { value: 'FreestyleScript, cursive', label: 'Freestyle Script', style: 'FreestyleScript, cursive' },
  { value: 'FertigoPro, serif', label: 'Fertigo Pro', style: 'FertigoPro, serif' },
  { value: 'FuturaBlack, sans-serif', label: 'Futura Black', style: 'FuturaBlack, sans-serif' },
  { value: 'IntensaBlack, sans-serif', label: 'Intensa Black', style: 'IntensaBlack, sans-serif' },
  { value: 'InterstateCondMono, monospace', label: 'Interstate Mono', style: 'InterstateCondMono, monospace' },
  { value: 'InterstateBlack, sans-serif', label: 'Interstate Black', style: 'InterstateBlack, sans-serif' },
  { value: 'Jokerman, fantasy', label: 'Jokerman', style: 'Jokerman, fantasy' },
  { value: 'LithosPro, serif', label: 'Lithos Pro Bold', style: 'LithosPro, serif' },
  { value: 'Mistral, cursive', label: 'Mistral', style: 'Mistral, cursive' },
  { value: 'ArialCustom, sans-serif', label: 'Arial Custom', style: 'ArialCustom, sans-serif' },
  { value: 'Bahnschrift, sans-serif', label: 'Bahnschrift', style: 'Bahnschrift, sans-serif' },
  { value: 'CambriaCustom, serif', label: 'Cambria Custom', style: 'CambriaCustom, serif' },
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