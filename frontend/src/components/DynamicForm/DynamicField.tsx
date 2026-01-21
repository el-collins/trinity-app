'use client';

import { FormField } from '@/lib/types/schema';
import { useFormStore } from '@/lib/store/formStore';
import TextInput from './fields/TextInput';
import NumberInput from './fields/NumberInput';
import SelectDropdown from './fields/SelectDropdown';
import BooleanToggle from './fields/BooleanToggle';
import DatePicker from './fields/DatePicker';
import MultiSelect from './fields/MultiSelect';
import { validateField } from '@/lib/validation/schemaGenerator';
import FileUpload from './fields/FileUpload';
import { PhoneNumberInput } from '../ui/phone-input';
import SignaturePad from './fields/SignaturePad';


interface DynamicFieldProps {
  field: FormField;
}

export default function DynamicField({ field }: DynamicFieldProps) {
  const { responses, errors, setFieldValue, setFieldError } = useFormStore();

  // Default value based on field type - boolean fields default to false, others to empty string
  const defaultValue = field.type?.toLowerCase() === 'boolean' ? false : '';
  const value = responses[field.id] ?? defaultValue;
  const error = errors[field.id];

  const handleChange = (newValue: any) => {
    // Debug logging for signature fields
    if (field.type?.toLowerCase() === 'signature') {
      console.log(`[DynamicField] handleChange called for signature "${field.id}":`, {
        newValue,
        valueLength: typeof newValue === 'string' ? newValue.length : 'N/A'
      });
    }
    setFieldValue(field.id, newValue);
    // Clear error on change
    setFieldError(field.id, null);
  };

  const handleBlur = () => {
    // Run full validation on blur
    const validationError = validateField(field, responses[field.id]);
    if (validationError) {
      setFieldError(field.id, validationError);
    }
  };

  // Check conditional visibility
  if (field.showIf && field.showIf.field && field.showIf.value) {
    const conditionValue = responses[field.showIf.field];
    const shouldShow = conditionValue === field.showIf.value;
    if (!shouldShow) return null;
  }

  // Render appropriate field component based on type
  // Support both uppercase (legacy) and lowercase (new convention) field types
  const fieldType = field.type?.toLowerCase();

  switch (fieldType) {
    case 'text':
    case 'email':
    case 'ssn':
    case 'ein':
    case 'address':
    case 'url':
    case 'textarea':
      return (
        <TextInput
          field={field}
          value={value}
          error={error}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      );

    case 'signature':
      return (
        <SignaturePad
          field={field}
          value={value}
          error={error}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      );

    case 'phone':
    case 'tel':
      return (
         <div className="w-full">
            <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.helpText && (
                <p className="text-sm text-gray-500 mb-2">{field.helpText}</p>
            )}
            <PhoneNumberInput
                value={value}
                onChange={handleChange}
                placeholder={field.placeholder}
                error={!!error}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
         </div>
      );

    case 'date':
      return (
        <DatePicker
          field={field}
          value={value}
          error={error}
          onChange={handleChange}
        />
      );

    case 'number':
    case 'currency':
    case 'percentage':
      return (
        <NumberInput
          field={field}
          value={value}
          error={error}
          onChange={handleChange}
        />
      );

    case 'select':
      return (
        <SelectDropdown
          field={field}
          value={value}
          error={error}
          onChange={handleChange}
        />
      );

    case 'multi_select':
      return (
        <MultiSelect
          field={field}
          value={value}
          error={error}
          onChange={handleChange}
        />
      );

    case 'boolean':
      return (
        <BooleanToggle
          field={field}
          value={value}
          error={error}
          onChange={handleChange}
        />
      );

    case 'checkbox':
      // Render checkbox field (for consent fields)
      return (
        <div className="w-full">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              id={field.id}
              checked={value === true || value === 'true'}
              onChange={(e) => handleChange(e.target.checked)}
              onBlur={handleBlur}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </span>
              {field.helpText && (
                <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>
              )}
            </div>
          </label>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
      );

    case 'radio':
      // Render radio button group
      return (
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.helpText && (
            <p className="text-sm text-gray-500 mb-3">{field.helpText}</p>
          )}
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label
                key={option}
                className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleChange(e.target.value)}
                  onBlur={handleBlur}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
      );

    case 'file_upload':
      return (
        <FileUpload
          field={field}
          value={value}
          error={error}
          onChange={handleChange}
        />
      );

    default:
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            Unsupported field type: <strong>{field.type}</strong>
          </p>
          <p className="text-sm text-yellow-600 mt-1">
            Field: {field.label} ({field.id})
          </p>
        </div>
      );
  }
}
