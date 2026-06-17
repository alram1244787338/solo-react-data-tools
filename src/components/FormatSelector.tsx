import React from 'react';
import type { DataFormat } from '../types';

interface FormatSelectorProps {
  value: DataFormat;
  onChange: (format: DataFormat) => void;
  label: string;
  excludeFormat?: DataFormat;
}

const formats: { value: DataFormat; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
];

export const FormatSelector: React.FC<FormatSelectorProps> = ({ value, onChange, label, excludeFormat }) => {
  const availableFormats = excludeFormat ? formats.filter((f) => f.value !== excludeFormat) : formats;

  return (
    <div className="format-selector">
      <span className="format-label">{label}</span>
      <div className="format-buttons">
        {availableFormats.map((format) => (
          <button
            key={format.value}
            className={`format-btn ${value === format.value ? 'active' : ''}`}
            onClick={() => onChange(format.value)}
          >
            {format.label}
          </button>
        ))}
      </div>
    </div>
  );
};
