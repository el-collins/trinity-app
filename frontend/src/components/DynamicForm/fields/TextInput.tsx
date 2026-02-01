'use client';

import { FormField } from '@/lib/types/schema';

interface TextInputProps {
  field: FormField;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export default function TextInput({ field, value, error, onChange, onBlur }: TextInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const fieldType = field.type.toUpperCase();

    // For SSN, EIN, and PHONE, store only digits (formatting is for display only)
    if (fieldType === 'SSN' || fieldType === 'EIN' || fieldType === 'PHONE') {
      const digits = rawValue.replace(/\D/g, '');
      onChange(digits);
    } else {
      onChange(rawValue);
    }
  };

  // Determine input type based on field type
  const getInputType = () => {
    switch (field.type) {
      case 'EMAIL':
        return 'email';
      case 'PHONE':
        return 'tel';
      case 'SSN':
      case 'EIN':
        return 'text'; // We'll handle masking separately
      default:
        return 'text';
    }
  };

  // Format SSN/EIN/PHONE as user types
  const formatValue = (val: string) => {
    const fieldType = field.type.toUpperCase();

    if (fieldType === 'SSN') {
      // Format: XXX-XX-XXXX
      const digits = val.replace(/\D/g, '').slice(0, 9);
      if (digits.length <= 3) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    }

    if (fieldType === 'EIN') {
      // Format: XX-XXXXXXX
      const digits = val.replace(/\D/g, '').slice(0, 9);
      if (digits.length <= 2) return digits;
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }

    if (fieldType === 'PHONE') {
      // Format: (XXX) XXX-XXXX
      const digits = val.replace(/\D/g, '').slice(0, 10);
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    return val;
  };

  const displayValue = formatValue(value);

  return (
    <div className="w-full">
      <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {field.helpText && (
        <p className="text-sm text-gray-500 mb-2">{field.helpText}</p>
      )}
      
      <input
        id={field.id}
        name={field.name}
        type={getInputType()}
        value={displayValue}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={field.placeholder || (field.type.toUpperCase() === 'SSN' ? 'XXX-XX-XXXX' : field.type.toUpperCase() === 'EIN' ? 'XX-XXXXXXX' : field.type.toUpperCase() === 'PHONE' ? '(XXX) XXX-XXXX' : field.type.toUpperCase() === 'URL' ? 'https://example.com' : '')}
        required={field.required}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300'
        }`}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
