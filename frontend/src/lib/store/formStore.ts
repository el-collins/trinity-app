import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoanTypeDefinition, FormSection } from '../types/schema';
import { validateSection, validateField } from '../validation/schemaGenerator';
import toast from 'react-hot-toast';
import { encodeFormState, decodeFormState, updateURLWithToken, ShareableFormState } from '../utils/urlState';
import { getReferralDataFromStorage } from '@/hooks/useReferralTracking';

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

  // Post-submission document collection state
  submittedApplicationId: string | null;
  uploadToken: string | null;
  showDocumentCollection: boolean;
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
  finishAndRedirect: () => void;
  resetForm: () => void;
  
  // URL State Management
  syncToURL: () => void;
  loadFromURL: (token: string) => Promise<boolean>;
  
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
  submittedApplicationId: null,
  uploadToken: null,
  showDocumentCollection: false,
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

          // Sync contact to GHL when any contact section is completed
          const isContactSection = ['quick_app_contact', 'contact_info', 'daily_contact', 'owner_info', 'business_info'].includes(sectionId);

          if (isContactSection) {
            // Get contact data from responses - use comprehensive field name lookups
            const email = responses['business_email'] || responses['owner_email'] || responses['email'] || responses['contact_email'] || '';
            const phone = responses['mobile_phone'] || responses['business_phone'] || responses['phone'] || responses['owner_phone'] || '';
            const firstName = responses['contact_first_name'] || responses['first_name'] || responses['owner_first_name'] || '';
            const lastName = responses['contact_last_name'] || responses['last_name'] || responses['owner_last_name'] || '';

            // Only sync if we have a name AND at least email or phone
            if ((email || phone) && firstName) {
              try {
                const response = await fetch('/api/ghl/sync-contact', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    phone,
                    applicationId,
                    loanType: loanTypeId,
                  }),
                });

                if (response.ok) {
                  console.log('Contact synced to GHL:', { firstName, lastName, email, phone });
                }
              } catch (error) {
                console.error('GHL sync failed:', error);
                // Don't block form progress if GHL sync fails
              }
            } else {
              console.log('Skipping GHL sync - no email or phone provided yet');
            }
          }
        }
      },
      
      // Field Management
      setFieldValue: (fieldId, value) => {
        // Debug logging for signature fields
        if (fieldId.includes('signature')) {
          console.log(`[FormStore] setFieldValue called:`, {
            fieldId,
            value,
            valueLength: typeof value === 'string' ? value.length : 'N/A'
          });
        }
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

        // Debug logging for signature fields in current section
        const signatureFields = currentSection.fields.filter(f => f.type?.toLowerCase() === 'signature');
        if (signatureFields.length > 0) {
          console.log('[FormStore] Validating section, signature field values:',
            signatureFields.map(f => ({
              id: f.id,
              valueInStore: responses[f.id],
              valueLength: typeof responses[f.id] === 'string' ? responses[f.id].length : 'N/A'
            }))
          );
        }

        // Use Zod validation
        const errors = validateSection(currentSection, responses);
        const isValid = Object.keys(errors).length === 0;

        set({ errors, isValid });
        return isValid;
      },
      
      submitForm: async () => {
        set({ isSubmitting: true });
        try {
          const { responses, loanTypeId, structure, applicationId } = get();

          console.log('Application response:', responses);
          
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
          
          // Get referral data from storage
          const referralData = getReferralDataFromStorage();

          // Submit to API (will UPDATE if applicationId exists, CREATE if not)
          const response = await fetch('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              loanTypeId,
              responses,
              submittedAt: new Date().toISOString(),
              applicationId, // Include applicationId if resuming
              // Include referral tracking data
              referralData: referralData ? {
                referralCode: referralData.referralCode,
                agentId: referralData.agentId,
                affiliateId: referralData.affiliateId,
                utmSource: referralData.utmSource,
                utmMedium: referralData.utmMedium,
                utmCampaign: referralData.utmCampaign,
                utmTerm: referralData.utmTerm,
                utmContent: referralData.utmContent,
                landingUrl: referralData.landingUrl,
                capturedAt: referralData.capturedAt,
              } : null,
            }),
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Submission failed');
          }
          
          const { applicationId: submittedApplicationId } = await response.json();

    // Notify GHL that application is submitted
    try {
      await fetch('/api/ghl/application-submitted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Event info
          event: 'application_submitted',
          applicationId: submittedApplicationId,
          loanTypeId,
          submittedAt: new Date().toISOString(),

          // Contact fields for GHL
          firstName: responses['contact_first_name'] || responses['first_name'] || '',
          lastName: responses['contact_last_name'] || responses['last_name'] || '',
          email: responses['business_email'] || responses['owner_email'] || '',
          phone: responses['mobile_phone'] || responses['phone'] || '',
          dateOfBirth: responses['owner_dob'] || responses['dob'] || '',
          website: responses['website'] || responses['owner_website'] || '',
          city: responses['city'] || responses['owner_city'] || '',
          state: responses['state'] || responses['owner_state'] || '',
          postalCode: responses['postal_code'] || responses['owner_postal_code'] || '',
          contactSource: 'Trinity Finance Application',

          // Referral tracking data for GHL
          referralCode: referralData?.referralCode || '',
          agentId: referralData?.agentId || '',
          affiliateId: referralData?.affiliateId || '',
          utmSource: referralData?.utmSource || '',
          utmMedium: referralData?.utmMedium || '',
          utmCampaign: referralData?.utmCampaign || '',
          utmTerm: referralData?.utmTerm || '',
          utmContent: referralData?.utmContent || '',
        }),
      });
    } catch (webhookError) {
      console.error('GHL notification failed:', webhookError);
      // Don't fail submission if GHL sync fails
    }

    // Trigger document collection - generate token and send email
    // but stay on the page to show the embedded document collection step
    let generatedToken: string | null = null;
    try {
      const applicantEmail = responses['owner_email'] ||
                            responses['business_email'] ||
                            responses['email'] ||
                            responses['contact_email'] ||
                            '';

      console.log('Document collection trigger - Email found:', applicantEmail ? applicantEmail : 'NONE');

      if (!applicantEmail) {
        console.error('No email found in responses. Available keys:', Object.keys(responses));
        throw new Error('No applicant email found for document collection');
      }

      // Generate upload token
      const tokenResponse = await fetch('/api/documents/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: submittedApplicationId,
          email: applicantEmail,
          loanTypeId,
        }),
      });

      if (tokenResponse.ok) {
        const { token } = await tokenResponse.json();
        generatedToken = token;
        const uploadLink = `${window.location.origin}/documents/upload/${token}`;

        console.log('Generated upload token:', token);
        console.log('Upload link:', uploadLink);

        // Send the document request email as a backup (so they can continue later)
        const emailResponse = await fetch('/api/documents/request-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: applicantEmail,
            firstName: responses['contact_first_name'] || responses['first_name'] || 'Applicant',
            loanType: structure.name,
            loanTypeId,
            uploadLink,
          }),
        });

        if (emailResponse.ok) {
          console.log('Document collection email sent successfully');
        } else {
          console.error('Failed to send document email. Status:', emailResponse.status);
        }
      } else {
        console.error('Failed to generate token. Status:', tokenResponse.status);
      }
    } catch (docError) {
      console.error('Document collection setup failed:', docError);
      // Don't fail submission if document collection fails
    }

    // Show document collection step instead of redirecting
    set({
      submittedApplicationId,
      uploadToken: generatedToken,
      showDocumentCollection: true,
    });
        } catch (error) {
          console.error('Form submission error:', error);
          alert(error instanceof Error ? error.message : 'Failed to submit application. Please try again.');
        } finally {
          set({ isSubmitting: false });
        }
      },
      
      // Finish document collection and redirect to success page
      finishAndRedirect: () => {
        const { submittedApplicationId } = get();
        const referralData = getReferralDataFromStorage();

        // Clear localStorage AND reset store state
        localStorage.removeItem('trinity-form-storage');
        localStorage.removeItem('trinityiq_referral_data');
        set(initialState);

        // Redirect to success page
        const successParams = new URLSearchParams({ id: submittedApplicationId || '' });
        if (referralData?.referralCode) successParams.set('ref', referralData.referralCode);
        if (referralData?.agentId) successParams.set('agent', referralData.agentId);
        if (referralData?.utmCampaign) successParams.set('campaign', referralData.utmCampaign);

        window.location.href = `/success?${successParams.toString()}`;
      },

      // URL State Management
      syncToURL: () => {
        // DISABLED: We no longer sync state to URL to avoid 431 errors
        // State is persisted via localStorage and database-backed resume tokens
        // Users can use "Save & Exit" to get a secure resume link
        return;
      },

      loadFromURL: async (token: string) => {
        try {
          // Load state from database-backed token
          const response = await fetch(`/api/resume-application?token=${encodeURIComponent(token)}`);

          if (!response.ok) {
            const error = await response.json();
            toast.error(error.error || 'Invalid or expired resume link');
            return false;
          }

          const state = await response.json();

          if (!state || !state.loanTypeId) {
            toast.error('Invalid resume link data');
            return false;
          }

          // Validate section index to prevent out-of-bounds errors
          const { structure } = get();
          const maxSectionIndex = structure ? structure.sections.length - 1 : 0;
          const validSectionIndex = Math.min(
            Math.max(0, state.currentSectionIndex || 0),
            maxSectionIndex
          );

          set({
            loanTypeId: state.loanTypeId,
            applicationId: state.applicationId, // Set applicationId for resume tracking
            responses: state.responses || {},
            currentSectionIndex: validSectionIndex,
            completedSections: state.completedSections || [],
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
