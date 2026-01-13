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


interface DynamicFieldProps {
  field: FormField;
}

export default function DynamicField({ field }: DynamicFieldProps) {
  const { responses, errors, setFieldValue, setFieldError } = useFormStore();

  const value = responses[field.id] ?? '';
  const error = errors[field.id];

  const handleChange = (newValue: any) => {
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
  const fieldType = field.type?.toUpperCase();
  
  switch (fieldType) {
    case 'TEXT':
    case 'EMAIL':
    // case 'PHONE': // Moved below
    // case 'TEL':   // Moved below
    case 'SSN':
    case 'EIN':
    case 'ADDRESS':
    case 'URL':
    case 'TEXTAREA':
    case 'SIGNATURE':   // Temporary: render as text input until SignaturePad is built
      return (
        <TextInput
          field={field}
          value={value}
          error={error}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      );

    case 'PHONE':
    case 'TEL':
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

    case 'DATE':
      return (
        <DatePicker
          field={field}
          value={value}
          error={error}
          onChange={handleChange}
        />
      );

    case 'NUMBER':
    case 'CURRENCY':
    case 'PERCENTAGE':
      return (
        <NumberInput
          field={field}
          value={value}
          error={error}
          onChange={handleChange}
        />
      );

    case 'SELECT':
      return (
        <SelectDropdown
          field={field}
          value={value}
          error={error}
          onChange={handleChange}
        />
      );

    case 'MULTI_SELECT':
      return (
        <MultiSelect
          field={field}
          value={value}
          error={error}
          onChange={handleChange}
        />
      );

    case 'BOOLEAN':
      return (
        <BooleanToggle
          field={field}
          value={value}
          error={error}
          onChange={handleChange}
        />
      );

    case 'FILE_UPLOAD':
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
