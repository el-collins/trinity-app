import { z } from 'zod';
import { FormField, FormSection, LoanTypeDefinition } from '../types/schema';

/**
 * Generate a Zod schema for a single field based on its validation rules
 */
export function generateFieldSchema(field: FormField): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  // Base schema based on field type (support both uppercase and lowercase)
  const fieldType = field.type.toLowerCase();

  switch (fieldType) {
    case 'number':
    case 'currency':
    case 'percentage':
      schema = z.coerce.number({ message: `${field.label} must be a number` });
      break;

    case 'email':
      schema = z.string().email(`Invalid email address`);
      break;

    case 'boolean':
      // Accept both string and boolean values - handle all common formats
      schema = z.union([
        z.string(),
        z.boolean(),
        z.literal(''),
        z.undefined(),
        z.null()
      ]).transform(val => {
        // Handle null, undefined, or empty string - default to false
        if (val === null || val === undefined || val === '') return false;
        // Handle boolean values directly
        if (typeof val === 'boolean') return val;
        // Handle string representations
        if (typeof val === 'string') {
          const lower = val.toLowerCase();
          return lower === 'true' || lower === 'yes';
        }
        // Default to false for any other case
        return false;
      });
      break;

    case 'checkbox':
      // Checkbox is similar to boolean but stricter for required consent fields
      schema = z.union([z.boolean(), z.literal('true'), z.literal('false')]).transform(val => {
        if (typeof val === 'boolean') return val;
        return val === 'true' || val === true;
      });
      break;

    case 'multi_select':
      schema = z.array(z.string());
      break;

    case 'date':
      schema = z.string().refine(
        (val) => !val || !isNaN(Date.parse(val)),
        { message: 'Invalid date format' }
      );
      break;

    default:
      schema = z.string();
  }

  // Apply validation rules from field.validation array
  if (Array.isArray(field.validation)) {
    field.validation.forEach((rule: string) => {
      if (rule === 'required') {
        if (fieldType === 'multi_select') {
          schema = (schema as z.ZodArray<any>).min(1, `${field.label} is required`);
        } else if (fieldType === 'boolean') {
          // Boolean fields are always "answered" since they default to false
          // No additional validation needed
        } else if (fieldType === 'checkbox') {
          // Checkbox fields need special handling - must be true for consent
          // This is handled by the 'accepted' rule below
        } else {
          schema = (schema as z.ZodString).min(1, `${field.label} is required`);
        }
      } else if (rule === 'accepted') {
        // Special validation for checkboxes that must be checked (consent fields)
        schema = z.union([z.boolean(), z.literal('true')]).refine(
          val => val === true || val === 'true',
          { message: 'You must accept to continue' }
        );
      } else if (rule === 'email') {
        schema = z.string().email(`Invalid email address`);
      } else if (rule === 'phone') {
        schema = z.string().regex(
          /^[\+]?[\d\s\-\(\)]+$/,
          'Invalid phone number format'
        );
      } else if (rule === 'ssn') {
        schema = z.string().refine(
          (val) => !val || /^\d{9}$/.test(val) || /^\d{3}-\d{2}-\d{4}$/.test(val),
          'Invalid SSN format (9 digits or XXX-XX-XXXX)'
        );
      } else if (rule === 'ein') {
        schema = z.string().refine(
          (val) => !val || /^\d{9}$/.test(val) || /^\d{2}-\d{7}$/.test(val),
          'Invalid EIN format (9 digits or XX-XXXXXXX)'
        );
      } else if (rule === 'zipcode') {
        schema = z.string().refine(
          (val) => !val || /^\d{5,6}(-\d{4})?$/.test(val),
          'Invalid ZIP code (5 or 9 digits)'
        );
      } else if (rule === 'url') {
        schema = z.string()
          .transform(val => {
            if (!val) return val;
            // Auto-add https:// if missing
            return val.match(/^https?:\/\//) ? val : `https://${val}`;
          })
          .refine(
            (val) => !val || z.string().url().safeParse(val).success,
            'Invalid URL format'
          );
      } else if (rule.startsWith('min:')) {
        const min = parseInt(rule.split(':')[1]);
        if (fieldType === 'number' || fieldType === 'currency') {
          schema = (schema as z.ZodNumber).min(min, `Must be at least ${min}`);
        } else {
          schema = (schema as z.ZodString).min(min, `Minimum ${min} characters`);
        }
      } else if (rule.startsWith('max:')) {
        const max = parseInt(rule.split(':')[1]);
        if (fieldType === 'number' || fieldType === 'currency') {
          schema = (schema as z.ZodNumber).max(max, `Must be at most ${max}`);
        } else {
          schema = (schema as z.ZodString).max(max, `Maximum ${max} characters`);
        }
      } else if (rule === 'integer') {
        schema = (schema as z.ZodNumber).int('Must be a whole number');
      } else if (rule === 'currency') {
        schema = (schema as z.ZodNumber).min(0, 'Amount must be positive');
      } else if (rule === 'date') {
        schema = z.string().refine(
          (val) => !val || !isNaN(Date.parse(val)),
          { message: 'Invalid date' }
        );
      } else if (rule === 'before:today') {
        schema = z.string().refine(
          (val) => !val || new Date(val) <= new Date(),
          { message: 'Date must be in the past' }
        );
      } else if (rule.startsWith('age:')) {
        const minAge = parseInt(rule.split(':')[1]);
        schema = z.string().refine(
          (val) => {
            if (!val) return true;
            const birthDate = new Date(val);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            return age >= minAge;
          },
          { message: `Must be at least ${minAge} years old` }
        );
      } else if (rule.startsWith('required_if:')) {
        // Handle conditional required (will be checked at form level)
        // Format: required_if:fieldName,value
      }
    });
  }

  // Make optional if not required
  if (!field.required) {
    // Use nullish to accept undefined/null and transform them to empty string
    // Then validate as optional string
    schema = z.union([
      schema,
      z.literal(''),
      z.undefined(),
      z.null()
    ]).transform(val => val === undefined || val === null ? '' : val);
  }

  return schema;
}

/**
 * Generate a Zod schema for an entire section
 */
export function generateSectionSchema(section: FormSection): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  
  section.fields.forEach((field) => {
    shape[field.id] = generateFieldSchema(field);
  });
  
  return z.object(shape);
}

/**
 * Generate a Zod schema for the entire form
 */
export function generateFormSchema(loanType: LoanTypeDefinition): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  
  loanType.sections.forEach((section) => {
    section.fields.forEach((field) => {
      shape[field.id] = generateFieldSchema(field);
    });
  });
  
  return z.object(shape);
}

/**
 * Validate a single field value
 */
export function validateField(field: FormField, value: any): string | null {
  try {
    const schema = generateFieldSchema(field);
    // Normalize undefined/null to empty string for optional fields
    const normalizedValue = (value === undefined || value === null) ? '' : value;

    // Debug logging for signature fields
    if (field.type?.toLowerCase() === 'signature') {
      console.log(`[Validation] Signature field "${field.id}":`, {
        rawValue: value,
        normalizedValue,
        valueLength: typeof normalizedValue === 'string' ? normalizedValue.length : 'N/A',
        required: field.required
      });
    }

    schema.parse(normalizedValue);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[Validation] Field "${field.id}" failed:`, error.issues[0]?.message);
      return error.issues[0]?.message || 'Invalid value';
    }
    return 'Validation error';
  }
}

/**
 * Validate an entire section
 */
export function validateSection(section: FormSection, responses: Record<string, any>): Record<string, string> {
  const errors: Record<string, string> = {};
  
  try {
    const schema = generateSectionSchema(section);
    schema.parse(responses);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach((err: z.ZodIssue) => {
        const fieldId = err.path[0] as string;
        errors[fieldId] = err.message;
      });
    }
  }
  
  return errors;
}

// Legacy export for backwards compatibility
export const generateZodSchema = (sections: FormSection[]) => {
  const shape: Record<string, z.ZodTypeAny> = {};
  
  sections.forEach((section) => {
    section.fields.forEach((field) => {
      shape[field.id] = generateFieldSchema(field);
    });
  });
  
  return z.object(shape);
};

export type DynamicFormSchema = ReturnType<typeof generateZodSchema>;
