export type QuestionType = 
  | 'TEXT' 
  | 'NUMBER' 
  | 'CURRENCY' 
  | 'DATE' 
  | 'SELECT' 
  | 'MULTI_SELECT' 
  | 'BOOLEAN' 
  | 'FILE_UPLOAD' 
  | 'SSN' 
  | 'EIN' 
  | 'PHONE' 
  | 'EMAIL' 
  | 'ADDRESS';

export interface QuestionOption {
  value: string;
  label: string;
}

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  customValidator?: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  category: string;
  informationValue: number;
  options?: QuestionOption[];
  validation?: ValidationRule;
  helpText?: string;
  complianceNotes?: string;
}

export interface ApplicationResponse {
  application: {
    id: string;
    status: string;
    currentStage: string;
    underwritingReadiness: number;
    riskScore: number;
  };
  nextQuestions: Question[];
}
