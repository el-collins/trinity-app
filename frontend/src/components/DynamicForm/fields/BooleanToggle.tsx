'use client';

import { FormField } from '@/lib/types/schema';
import { useEffect } from 'react';

interface BooleanToggleProps {
  field: FormField;
  value: boolean | string;
  error?: string;
  onChange: (value: boolean) => void;
}

export default function BooleanToggle({ field, value, error, onChange }: BooleanToggleProps) {
  // Convert string values to boolean
  const boolValue = typeof value === 'string'
    ? value.toLowerCase() === 'true' || value.toLowerCase() === 'yes'
    : !!value;

  // Set default value on mount if undefined
  useEffect(() => {
    if (value === undefined || value === null || value === '') {
      // Default to false (No) for boolean fields
      onChange(false);
    }
  }, []); // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleChange = (newValue: boolean) => {
    onChange(newValue);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {field.helpText && (
        <p className="text-sm text-gray-500 mb-3">{field.helpText}</p>
      )}
      
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => handleChange(true)}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
            boolValue
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Yes
        </button>
        
        <button
          type="button"
          onClick={() => handleChange(false)}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
            !boolValue
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          No
        </button>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
