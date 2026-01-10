'use client';

import { FormField } from '@/lib/types/schema';
import { useState } from 'react';

interface MultiSelectProps {
  field: FormField;
  value: string | string[];
  error?: string;
  onChange: (value: string[]) => void;
}

export default function MultiSelect({ field, value, error, onChange }: MultiSelectProps) {
  // Ensure value is always an array
  const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);

  const handleToggle = (optionValue: string) => {
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter(v => v !== optionValue)
      : [...selectedValues, optionValue];
    onChange(newValues);
  };

  const handleSelectAll = () => {
    if (!field.options) return;
    const allValues = field.options.map(opt => 
      typeof opt === 'string' ? opt : opt.value
    );
    onChange(allValues);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const allSelected = field.options?.length === selectedValues.length;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {field.helpText && (
        <p className="text-sm text-gray-500 mb-2">{field.helpText}</p>
      )}

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={allSelected}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Select All
        </button>
        <button
          type="button"
          onClick={handleClearAll}
          disabled={selectedValues.length === 0}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear All
        </button>
        <span className="text-sm text-gray-600 self-center ml-auto">
          {selectedValues.length} selected
        </span>
      </div>
      
      <div className={`border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2 ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}>
        {field.options?.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          const isChecked = selectedValues.includes(optionValue);
          
          return (
            <label
              key={optionValue}
              className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => handleToggle(optionValue)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-sm text-gray-700">{optionLabel}</span>
            </label>
          );
        })}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
