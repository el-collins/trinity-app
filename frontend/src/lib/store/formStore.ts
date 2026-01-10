import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoanTypeDefinition, FormSection } from '../types/schema';
import { validateSection, validateField } from '../validation/schemaGenerator';
import toast from 'react-hot-toast';
import { encodeFormState, decodeFormState, updateURLWithToken, ShareableFormState } from '../utils/urlState';

export interface FormState {
  // Form Structure
  loanTypeId: string | null;
  structure: LoanTypeDefinition | null;
  applicationId: string | null; // For resume functionality
  
  // Navigation
  currentSectionIndex: number;
  completedSections: string[];
  
  // Form Data
  responses: Record<string, any>; // fieldId -> value
  errors: Record<string, string>; // fieldId -> error message
  
  // UI State
  isLoading: boolean;
  isSubmitting: boolean;
  isValid: boolean;
}

interface FormActions {
  // Structure Management
  setStructure: (structure: LoanTypeDefinition) => void;
  setLoanTypeId: (id: string) => void;
  setApplicationId: (id: string) => void;
  
  // Navigation
  goToSection: (index: number) => void;
  nextSection: () => void;
  previousSection: () => void;
  markSectionComplete: (sectionId: string) => void;
  
  // Field Management
  setFieldValue: (fieldId: string, value: any) => void;
  setFieldError: (fieldId: string, error: string | null) => void;
  clearErrors: () => void;
  
  // Form Actions
  validateCurrentSection: () => boolean;
  submitForm: () => Promise<void>;
  resetForm: () => void;
  
  // URL State Management
  syncToURL: () => void;
  loadFromURL: (token: string) => boolean;
  
  // UI State
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
}

type FormStore = FormState & FormActions;

const initialState: FormState = {
  loanTypeId: null,
  structure: null,
  applicationId: null,
  currentSectionIndex: 0,
  completedSections: [],
  responses: {},
  errors: {},
  isLoading: false,
  isSubmitting: false,
  isValid: false,
};

export const useFormStore = create<FormStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Structure Management
      setStructure: (structure) => set({ structure }),
      setLoanTypeId: (id) => set({ loanTypeId: id }),
      setApplicationId: (id) => set({ applicationId: id }),
      
      // Navigation
      goToSection: (index) => {
        const { structure } = get();
        if (structure && index >= 0 && index < structure.sections.length) {
          set({ currentSectionIndex: index });
        }
      },
      
      nextSection: () => {
        const { currentSectionIndex, structure } = get();
        if (structure && currentSectionIndex < structure.sections.length - 1) {
          set({ currentSectionIndex: currentSectionIndex + 1 });
        }
      },
      
      previousSection: () => {
        const { currentSectionIndex } = get();
        if (currentSectionIndex > 0) {
          set({ currentSectionIndex: currentSectionIndex - 1 });
        }
      },
      
      markSectionComplete: async (sectionId) => {
        const { completedSections, responses, loanTypeId, applicationId } = get();
        
        if (!completedSections.includes(sectionId)) {
          set({ completedSections: [...completedSections, sectionId] });
          
          // Sync contact to GHL when contact_info section is completed
          if (sectionId === 'contact_info') {
            try {
              await fetch('/api/ghl/sync-contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  firstName: responses['first_name'] || responses['contact_first_name'] || '',
                  lastName: responses['last_name'] || responses['contact_last_name'] || '',
                  email: responses['email'] || responses['contact_email'] || responses['business_email'] || '',
                  phone: responses['phone'] || responses['contact_phone'] || '',
                  applicationId,
                  loanType: loanTypeId,
                }),
              });
              toast.success('Contact synced to GHL');
            } catch (error) {
              console.error('GHL sync failed:', error);
              // Don't block form progress if GHL sync fails
            }
          }
        }
      },
      
      // Field Management
      setFieldValue: (fieldId, value) => {
        set((state) => ({
          responses: { ...state.responses, [fieldId]: value },
          errors: { ...state.errors, [fieldId]: '' }, // Clear error on change
        }));
      },
      
      setFieldError: (fieldId, error) => {
        if (error === null) {
          set((state) => {
            const newErrors = { ...state.errors };
            delete newErrors[fieldId];
            return { errors: newErrors };
          });
        } else {
          set((state) => ({
            errors: { ...state.errors, [fieldId]: error },
          }));
        }
      },
      
      clearErrors: () => set({ errors: {} }),
      
      // Form Actions
      validateCurrentSection: () => {
        const { structure, currentSectionIndex, responses } = get();
        if (!structure) return false;
        
        const currentSection = structure.sections[currentSectionIndex];
        
        // Use Zod validation
        const errors = validateSection(currentSection, responses);
        const isValid = Object.keys(errors).length === 0;
        
        set({ errors, isValid });
        return isValid;
      },
      
      submitForm: async () => {
        set({ isSubmitting: true });
        try {
          const { responses, loanTypeId, structure } = get();
          
          if (!structure || !loanTypeId) {
            throw new Error('Form structure not loaded');
          }
          
          // Validate entire form before submission
          let allErrors: Record<string, string> = {};
          structure.sections.forEach((section) => {
            const sectionErrors = validateSection(section, responses);
            allErrors = { ...allErrors, ...sectionErrors };
          });
          
          if (Object.keys(allErrors).length > 0) {
            set({ errors: allErrors, isSubmitting: false });
            console.error('Validation errors:', allErrors);
            
            // Get field labels for better error messages
            const errorFields = Object.keys(allErrors).slice(0, 3).map(fieldId => {
              const field = structure.sections
                .flatMap(s => s.fields)
                .find(f => f.id === fieldId);
              return field?.label || fieldId;
            });
            
            const errorCount = Object.keys(allErrors).length;
            const errorList = errorFields.join(', ');
            const moreErrors = errorCount > 3 ? ` and ${errorCount - 3} more` : '';
            
            toast.error(
              `Validation errors in: ${errorList}${moreErrors}. Please check the review page.`,
              { duration: 6000 }
            );
            return;
          }
          
          // Submit to API
          const response = await fetch('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              loanTypeId,
              responses,
              submittedAt: new Date().toISOString(),
            }),
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Submission failed');
          }
          
          const { applicationId } = await response.json();

    // Notify GHL that application is submitted
    if (process.env.NEXT_PUBLIC_GHL_WEBHOOK_URL) {
      try {
        await fetch(process.env.NEXT_PUBLIC_GHL_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Event info
            event: 'application_submitted',
            applicationId,
            loanTypeId,
            submittedAt: new Date().toISOString(),
            
            // Contact fields for GHL
            firstName: responses['contact_first_name'] || responses['first_name'] || '',
            lastName: responses['contact_last_name'] || responses['last_name'] || '',
            email: responses['contact_email'] || responses['email'] || '',
            phone: responses['contact_phone'] || responses['phone'] || '',
            dateOfBirth: responses['date_of_birth'] || responses['dob'] || '',
            contactSource: 'Trinity Finance Application',
            contactType: 'Lead',
          }),
        });
      } catch (webhookError) {
        console.error('GHL notification failed:', webhookError);
        // Don't fail submission if webhook fails
      }
    }
    
    // Clear localStorage
    localStorage.removeItem('trinity-form-storage');
    
    // Redirect to success page
    window.location.href = `/success?id=${applicationId}`;
        } catch (error) {
          console.error('Form submission error:', error);
          alert(error instanceof Error ? error.message : 'Failed to submit application. Please try again.');
        } finally {
          set({ isSubmitting: false });
        }
      },
      
      // URL State Management
      syncToURL: () => {
        const { loanTypeId, responses, currentSectionIndex, completedSections } = get();
        
        if (!loanTypeId) return;
        
        try {
          const state: ShareableFormState = {
            loanTypeId,
            responses,
            currentSectionIndex,
            completedSections,
          };
          
          const token = encodeFormState(state);
          updateURLWithToken(token, loanTypeId);
        } catch (error) {
          console.error('Failed to sync to URL:', error);
        }
      },
      
      loadFromURL: (token: string) => {
        try {
          const state = decodeFormState(token);
          
          if (!state) {
            toast.error('Invalid or expired resume link');
            return false;
          }
          
          set({
            loanTypeId: state.loanTypeId,
            responses: state.responses,
            currentSectionIndex: state.currentSectionIndex,
            completedSections: state.completedSections,
          });
          
          toast.success('Application resumed successfully');
          return true;
        } catch (error) {
          console.error('Failed to load from URL:', error);
          toast.error('Failed to resume application');
          return false;
        }
      },
      
      resetForm: () => set(initialState),
      
      // UI State
      setLoading: (loading) => set({ isLoading: loading }),
      setSubmitting: (submitting) => set({ isSubmitting: submitting }),
    }),
    {
      name: 'trinity-form-storage', // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        loanTypeId: state.loanTypeId,
        responses: state.responses,
        currentSectionIndex: state.currentSectionIndex,
        completedSections: state.completedSections,
      }),
    }
  )
);
