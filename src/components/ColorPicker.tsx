import React from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const colorPresets = [
  '#ffffff', // White
  '#000000', // Black
  '#8B4513', // Coffee Brown
  '#D2B48C', // Tan
  '#CD853F', // Peru
  '#F5DEB3', // Wheat
  '#DEB887', // Burlywood
  '#BC8F8F', // Rosy Brown
  '#696969', // Dim Gray
  '#FFA500', // Orange
  '#FFD700', // Gold
  '#228B22', // Forest Green
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label }) => {
  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <div className="space-y-2">
        {/* Color Input */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded border border-border cursor-pointer"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-2 py-1 text-sm border border-border rounded bg-background"
            placeholder="#000000"
          />
        </div>
        
        {/* Color Presets */}
        <div className="grid grid-cols-6 gap-1">
          {colorPresets.map((color) => (
            <button
              key={color}
              onClick={() => onChange(color)}
              className={`w-6 h-6 rounded border-2 transition-all ${
                value === color ? 'border-primary scale-110' : 'border-border hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};