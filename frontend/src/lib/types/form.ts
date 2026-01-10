import { LoanTypeDefinition } from './schema';

export interface FormState {
  currentSectionId: string;
  completedSections: string[];
  responses: Record<string, any>; // Field ID -> Value
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface FormContextType {
  state: FormState;
  structure: LoanTypeDefinition | null;
  setFieldValue: (fieldId: string, value: any) => void;
  setFieldError: (fieldId: string, error: string | null) => void;
  markSectionComplete: (sectionId: string) => void;
  submitForm: () => Promise<void>;
}

export interface DeploymentConfig {
    environment: 'development' | 'production';
    apiUrl: string;
    neo4jConfig: {
        uri: string;
        user: string;
    }
}
