'use client';

import { FormField } from '@/lib/types/schema';

interface NumberInputProps {
  field: FormField;
  value: number | string;
  error?: string;
  onChange: (value: number) => void;
}

export default function NumberInput({ field, value, error, onChange }: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Allow empty string for clearing
    if (val === '') {
      onChange(0);
      return;
    }
    
    const numValue = parseFloat(val);
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  };

  // Format currency display
  const formatDisplay = (val: number | string) => {
    if (field.type === 'CURRENCY') {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? '' : num.toString();
    }
    if (field.type === 'PERCENTAGE') {
      return val.toString();
    }
    return val.toString();
  };

  const getPrefix = () => {
    if (field.type === 'CURRENCY') return '$';
    return '';
  };

  const getSuffix = () => {
    if (field.type === 'PERCENTAGE') return '%';
    return '';
  };

  return (
    <div className="w-full">
      <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {field.helpText && (
        <p className="text-sm text-gray-500 mb-2">{field.helpText}</p>
      )}
      
      <div className="relative">
        {getPrefix() && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {getPrefix()}
          </span>
        )}
        
        <input
          id={field.id}
          name={field.name}
          type="number"
          value={formatDisplay(value)}
          onChange={handleChange}
          placeholder={field.placeholder}
          required={field.required}
          min={field.validation?.min}
          max={field.validation?.max}
          step={field.type === 'CURRENCY' ? '0.01' : '1'}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            getPrefix() ? 'pl-8' : ''
          } ${getSuffix() ? 'pr-8' : ''} ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300'
          }`}
        />
        
        {getSuffix() && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            {getSuffix()}
          </span>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
