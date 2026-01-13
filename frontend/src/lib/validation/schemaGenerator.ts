import { z } from 'zod';
import { FormField, FormSection, LoanTypeDefinition } from '../types/schema';

/**
 * Generate a Zod schema for a single field based on its validation rules
 */
export function generateFieldSchema(field: FormField): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  // Base schema based on field type
  switch (field.type.toUpperCase()) {
    case 'NUMBER':
    case 'CURRENCY':
    case 'PERCENTAGE':
      schema = z.coerce.number({ message: `${field.label} must be a number` });
      break;
    
    case 'EMAIL':
      schema = z.string().email(`Invalid email address`);
      break;
    
    case 'BOOLEAN':
      // Accept both string and boolean values
      schema = z.union([z.string(), z.boolean()]).transform(val => {
        if (typeof val === 'boolean') return val;
        return val.toLowerCase() === 'true' || val.toLowerCase() === 'yes';
      });
      break;
    
    case 'MULTI_SELECT':
      schema = z.array(z.string());
      break;
    
    case 'DATE':
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
        if (field.type.toUpperCase() === 'MULTI_SELECT') {
          schema = (schema as z.ZodArray<any>).min(1, `${field.label} is required`);
        } else if (field.type.toUpperCase() === 'BOOLEAN') {
          // Boolean fields are always "answered" since they default to false
          // No additional validation needed
        } else {
          schema = (schema as z.ZodString).min(1, `${field.label} is required`);
        }
      } else if (rule === 'email') {
        schema = z.string().email(`Invalid email address`);
      } else if (rule === 'phone') {
        schema = z.string().regex(
          /^[\d\s\-\(\)]+$/,
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
        if (field.type.toUpperCase() === 'NUMBER' || field.type.toUpperCase() === 'CURRENCY') {
          schema = (schema as z.ZodNumber).min(min, `Must be at least ${min}`);
        } else {
          schema = (schema as z.ZodString).min(min, `Minimum ${min} characters`);
        }
      } else if (rule.startsWith('max:')) {
        const max = parseInt(rule.split(':')[1]);
        if (field.type.toUpperCase() === 'NUMBER' || field.type.toUpperCase() === 'CURRENCY') {
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
    schema.parse(normalizedValue);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
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
