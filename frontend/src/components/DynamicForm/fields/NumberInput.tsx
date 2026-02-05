'use client';

import { useState, useEffect } from 'react';
import { FormField } from '@/lib/types/schema';

interface NumberInputProps {
  field: FormField;
  value: number | string;
  error?: string;
  onChange: (value: number) => void;
}

export default function NumberInput({ field, value, error, onChange }: NumberInputProps) {
  // Case-insensitive check for field types
  const fieldType = field.type?.toLowerCase();
  const fieldName = (field.name || field.id || '').toLowerCase();
  const fieldLabel = (field.label || '').toLowerCase();

  // Detect currency fields by type OR by common naming patterns
  const currencyKeywords = ['revenue', 'income', 'amount', 'funding', 'salary', 'price', 'cost', 'balance', 'payment', 'loan'];
  const isCurrencyByName = currencyKeywords.some(keyword =>
    fieldName.includes(keyword) || fieldLabel.includes(keyword)
  );
  const isCurrency = fieldType === 'currency' || (fieldType === 'number' && isCurrencyByName);
  const isPercentage = fieldType === 'percentage';

  // Detect ownership percentage fields (should be locked between 0-100)
  // Match any field that contains both "ownership" and any variation of "percent"/"percentage"
  // OR is a percentage type field that mentions ownership
  const isOwnershipPercentage =
    (fieldName.includes('ownership') && (fieldName.includes('percent') || fieldLabel.includes('percent'))) ||
    (isPercentage && (fieldName.includes('ownership') || fieldLabel.includes('ownership')));

  // By default, all number fields should be non-negative (min=0) unless explicitly configured otherwise
  // Only allow negative if field validation explicitly sets a negative min value
  const hasExplicitNegativeMin = field.validation &&
    Array.isArray(field.validation) &&
    field.validation.some((rule: string) => {
      if (typeof rule === 'string' && rule.startsWith('min:')) {
        const minValue = parseInt(rule.split(':')[1]);
        return minValue < 0;
      }
      return false;
    });

  const isNonNegativeField = !hasExplicitNegativeMin; // All fields are non-negative by default

  // Track the display value separately for formatted input
  const [displayValue, setDisplayValue] = useState('');

  // Format number with thousand separators
  const formatWithCommas = (num: number): string => {
    if (isNaN(num) || num === 0) return '';
    // Handle decimals for currency
    if (isCurrency) {
      const parts = num.toString().split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Parse formatted string back to number
  const parseFormattedValue = (val: string): number => {
    // Remove all non-numeric characters except decimal point and minus
    const cleanValue = val.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleanValue);
    return isNaN(num) ? 0 : num;
  };

  // Sync display value with actual value
  useEffect(() => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(numValue) && numValue !== 0) {
      setDisplayValue(formatWithCommas(numValue));
    } else if (value === '' || value === 0) {
      setDisplayValue('');
    }
  }, [value, isCurrency]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // Allow empty string for clearing
    if (val === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }

    // For currency/percentage, handle formatted input
    if (isCurrency || isPercentage) {
      // Only allow digits, commas, decimal point, and minus sign
      const sanitized = val.replace(/[^0-9,.-]/g, '');
      setDisplayValue(sanitized);

      // Parse and send the numeric value
      let numValue = parseFormattedValue(sanitized);

      // Hard lock ownership percentage between 0-100
      if (isOwnershipPercentage) {
        numValue = Math.max(0, Math.min(100, numValue));
      }
      // Prevent negative values for all fields by default (unless explicitly allowed)
      else if (isNonNegativeField && numValue < 0) {
        numValue = 0;
      }

      onChange(numValue);
    } else {
      // Standard number handling
      let numValue = parseFloat(val);
      if (!isNaN(numValue)) {
        // Hard lock ownership percentage between 0-100
        if (isOwnershipPercentage) {
          numValue = Math.max(0, Math.min(100, numValue));
        }
        // Prevent negative values for all fields by default (unless explicitly allowed)
        else if (isNonNegativeField && numValue < 0) {
          numValue = 0;
        }
        onChange(numValue);
      }
    }
  };

  // Format on blur for better UX
  const handleBlur = () => {
    if (isCurrency || isPercentage) {
      const numValue = parseFormattedValue(displayValue);
      if (numValue !== 0) {
        setDisplayValue(formatWithCommas(numValue));
      }
    }
  };

  // Get display value based on field type
  const getDisplayValue = (): string => {
    if (isCurrency || isPercentage) {
      return displayValue;
    }
    // For regular numbers
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numValue) || numValue === 0 ? '' : numValue.toString();
  };

  const getPrefix = () => {
    if (isCurrency) return '$';
    return '';
  };

  const getSuffix = () => {
    if (isPercentage) return '%';
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
            {getPrefix()}
          </span>
        )}

        <input
          id={field.id}
          name={field.name}
          type={isCurrency || isPercentage ? 'text' : 'number'}
          inputMode="decimal"
          value={getDisplayValue()}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={field.placeholder || (isCurrency ? '0' : isPercentage ? '0' : '')}
          required={field.required}
          min={isOwnershipPercentage ? 0 : isNonNegativeField ? 0 : undefined}
          max={isOwnershipPercentage ? 100 : undefined}
          step={!isCurrency && !isPercentage ? '1' : undefined}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            getPrefix() ? 'pl-8' : ''
          } ${getSuffix() ? 'pr-8' : ''} ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300'
          }`}
        />

        {getSuffix() && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
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
