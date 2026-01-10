/**
 * Core Schema Definitions needed for the Knowledge Graph-driven Form
 */

export type FieldType = 
  | 'TEXT' | 'NUMBER' | 'CURRENCY' | 'DATE' | 'SELECT' 
  | 'MULTI_SELECT' | 'BOOLEAN' | 'FILE_UPLOAD' | 'SSN' 
  | 'EIN' | 'PHONE' | 'EMAIL' | 'ADDRESS' | 'PERCENTAGE';

export interface ValidationRules {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customValidator?: string; // Reference to a named validator function
}

export interface ConditionalLogic {
  field: string; // The ID of the field to watch
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN';
  value: any;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string; // The specific Neo4j Node ID (e.g., 'f_business_name')
  name: string;
  label: string;
  type: FieldType;
  order: number;
  placeholder?: string;
  helpText?: string;
  
  // Validation & Logic
  required: boolean;
  validation?: ValidationRules;
  showIf?: ConditionalLogic; // Mapped from CONDITIONALLY_SHOWS relationship
  
  // For Select/MultiSelect
  options?: (string | SelectOption)[];
  
  // UI Grouping
  width?: 'FULL' | 'HALF' | 'THIRD'; // For grid layout
  sectionId?: string;
}

export interface FormSection {
  id: string;
  name: string;
  label: string; // Display name
  order: number;
  description?: string;
  fields: FormField[];
}

export interface LoanTypeDefinition {
  id: string; // e.g., 'mca'
  name: string; // e.g., 'Merchant Cash Advance'
  tier: number; // 1, 2, or 3
  description?: string;
  estimatedTime?: number;
  sections: FormSection[]; // The full recursive structure
}

// API Response from Neo4j (nested structure)
export interface Neo4jLoanConfigResponse {
  loanType: {
    id: string;
    name: string;
    tier: number;
    estimatedTime?: number;
    ownershipThreshold?: number;
  };
  sections: FormSection[];
}
