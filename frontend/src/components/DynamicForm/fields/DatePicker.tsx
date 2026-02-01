'use client';

import { FormField } from '@/lib/types/schema';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useState, useEffect } from 'react';

interface DatePickerProps {
  field: FormField;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export default function DatePicker({ field, value, error, onChange }: DatePickerProps) {
  // Parse the string value to Date object
  const parseDate = (dateString: string): Date | null => {
    if (!dateString || dateString === '') return null;
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return null;
      }
      return date;
    } catch {
      return null;
    }
  };

  // Detect signature date fields that should auto-fill with today's date
  const fieldName = (field.name || field.id || '').toLowerCase();
  const fieldLabel = (field.label || '').toLowerCase();
  const isSignatureDate = fieldName.includes('signature') && fieldName.includes('date') ||
    fieldLabel.includes('signature') && fieldLabel.includes('date') ||
    fieldName === 'date_signed' || fieldName === 'signing_date' ||
    fieldName.includes('authorization') && fieldName.includes('date');

  // Auto-fill signature date with today's date if empty
  const getInitialDate = (): Date | null => {
    if (value) return parseDate(value);
    if (isSignatureDate) return new Date();
    return null;
  };

  const [selectedDate, setSelectedDate] = useState<Date | null>(getInitialDate());

  // Auto-fill signature date on mount if empty
  useEffect(() => {
    if (isSignatureDate && !value) {
      const today = new Date();
      const formatted = today.toLocaleDateString('en-US');
      onChange(formatted);
    }
  }, [isSignatureDate, value, onChange]);

  const handleChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      // Format as MM/DD/YYYY
      const formatted = date.toLocaleDateString('en-US');
      onChange(formatted);
    } else {
      onChange('');
    }
  };

  // Check if field should have max date (e.g., DOB, established date)
  const hasMaxDateToday = Array.isArray(field.validation) && field.validation.some(
    (rule: string) => rule === 'before:today' || rule.includes('age:')
  );

  return (
    <div className="w-full">
      <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {field.helpText && (
        <p className="text-sm text-gray-500 mb-2">{field.helpText}</p>
      )}
      
      <ReactDatePicker
        id={field.id}
        selected={selectedDate}
        onChange={handleChange}
        dateFormat="MM/dd/yyyy"
        placeholderText={field.placeholder || 'MM/DD/YYYY'}
        maxDate={hasMaxDateToday ? new Date() : undefined}
        showYearDropdown
        scrollableYearDropdown
        yearDropdownItemNumber={100}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300'
        }`}
        wrapperClassName="w-full"
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
