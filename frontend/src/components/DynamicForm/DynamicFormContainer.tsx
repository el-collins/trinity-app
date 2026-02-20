'use client';

import { useEffect, useState, useMemo } from 'react';
import { useFormStore } from '@/lib/store/formStore';
import DynamicSection from './DynamicSection';
import ReviewPage from './ReviewPage';
import DocumentCollectionStep from './DocumentCollectionStep';
import SaveAndExitModal from '../Modals/SaveAndExitModal';
import { getResumeTokenFromURL } from '@/lib/utils/urlState';
import { applyDerivations, FieldDerivation } from '@/lib/utils/fieldDerivations';
import { validateSection } from '@/lib/validation/schemaGenerator';

// Auto-save status type
type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface DynamicFormContainerProps {
  loanTypeId: string;
  applicationId?: string; // For resuming existing applications
  savedResponses?: Record<string, any>; // Pre-populated data
  onComplete?: () => void; // Callback when form is completed (for Quick App flow)
}

export default function DynamicFormContainer({
  loanTypeId,
  applicationId,
  savedResponses,
  onComplete
}: DynamicFormContainerProps) {
  const {
    structure,
    currentSectionIndex,
    isLoading,
    responses,
    completedSections,
    setStructure,
    setLoanTypeId,
    setLoading,
    setFieldValue,
    setFieldError,
    nextSection,
    previousSection,
    goToSection,
    loadFromURL,
    resetForm,
    markSectionComplete,
    showDocumentCollection,
    submittedApplicationId,
    uploadToken,
    finishAndRedirect,
  } = useFormStore();

  const [showReview, setShowReview] = useState(false);
  const [aiPlanning, setAiPlanning] = useState(false);
  const [isFromQuickApp, setIsFromQuickApp] = useState(false);
  const [returnToReview, setReturnToReview] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // AI is always enabled based on env var (no UI toggle)
  // But disable AI when coming from Quick App to prevent skipping unfilled sections
  const aiEnabled = process.env.NEXT_PUBLIC_ENABLE_AI_PLANNING === 'true' && !isFromQuickApp;

  // Fetch form structure on mount, then load resume token
  useEffect(() => {
    const fetchFormStructure = async () => {
      // Check for mismatch and reset BEFORE anything else
      const { loanTypeId: storedLoanTypeId, resetForm } = useFormStore.getState();
      const token = getResumeTokenFromURL();

      // If switching loan types without a resume token, clear everything immediately
      // EXCEPT when coming from quick_app to a full application (data reuse flow)
      const isComingFromQuickApp = storedLoanTypeId === 'quick_app' && loanTypeId !== 'quick_app';

      if (!token && storedLoanTypeId && storedLoanTypeId !== loanTypeId && !isComingFromQuickApp) {
        console.log('Loan type mismatch detected during init, resetting form...');
        resetForm();
      } else if (isComingFromQuickApp) {
        console.log('Coming from Quick App, preserving responses for data reuse');
        setIsFromQuickApp(true);
        // Clear completed sections since this is a new application type
        useFormStore.setState({ completedSections: [] });
        // Note: We'll skip to the appropriate section after structure is loaded (below)
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/neo4j/loan-config?loanTypeId=${loanTypeId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch form configuration');
        }
        const data = await response.json();

        // Transform nested Neo4j response to flat structure
        const transformedData = {
          id: data.loanType.id,
          name: data.loanType.name,
          tier: data.loanType.tier,
          estimatedTime: data.loanType.estimatedTime,
          sections: data.sections
        };

        setStructure(transformedData);
        setLoanTypeId(loanTypeId);

        // Apply field derivations when coming from Quick App
        if (isComingFromQuickApp) {
          try {
            const { responses: quickAppResponses } = useFormStore.getState();

            const derivationsResponse = await fetch('/api/neo4j/field-derivations');
            if (derivationsResponse.ok) {
              const derivations: FieldDerivation[] = await derivationsResponse.json();

              // Apply derivations to get pre-filled values
              const derivedResults = applyDerivations(derivations, quickAppResponses);

              // Pre-fill each derived field
              const filledFields: string[] = [];
              for (const [fieldId, result] of Object.entries(derivedResults)) {
                // Only set if the field doesn't already have a value
                if (!quickAppResponses[fieldId]) {
                  setFieldValue(fieldId, result.value);
                  filledFields.push(fieldId);
                  console.log(`Auto-filled ${fieldId} = ${result.value} (from ${result.derivedFrom.join(', ')} via ${result.formula})`);
                }
              }

              setAutoFilledFields(filledFields);
              if (filledFields.length > 0) {
                console.log(`Auto-filled ${filledFields.length} fields from Quick App data`);
              }
            }
          } catch (error) {
            console.error('Failed to apply field derivations:', error);
            // Don't block form loading if derivations fail
          }

          // Skip contact section since it was already filled in Quick App
          // Find the first non-contact section and start there
          const contactSectionIds = ['contact', 'contact_info', 'quick_app_contact'];
          const firstNonContactIndex = transformedData.sections.findIndex(
            (section: { id: string }) => !contactSectionIds.includes(section.id)
          );

          if (firstNonContactIndex > 0) {
            console.log(`Skipping contact section, starting at section index: ${firstNonContactIndex}`);
            // Mark contact section as complete since data is already filled
            const contactSection = transformedData.sections[0];
            if (contactSection && contactSectionIds.includes(contactSection.id)) {
              markSectionComplete(contactSection.id);
            }
            goToSection(firstNonContactIndex);
          } else {
            // No contact section to skip, start at beginning
            goToSection(0);
          }
        } else {
          // Not coming from Quick App, start at beginning
          goToSection(0);
        }

        // AFTER structure is loaded, load resume token if present
        if (token) {
          await loadFromURL(token);
        }
      } catch (error) {
        console.error('Error fetching form structure:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFormStructure();
  }, [loanTypeId, setStructure, setLoanTypeId, setLoading, loadFromURL]);

  // URL sync is now disabled to avoid 431 errors
  // State is persisted via localStorage and database-backed resume tokens

  // Watch for additional_owners_count changes and duplicate owner sections
  
  useEffect(() => {
    if (!structure) return;

    const additionalOwnersCount = parseInt(responses['additional_owners_count'] || '0');
    
    if (additionalOwnersCount > 0) {
      // Find the owner section
      const ownerSectionIndex = structure.sections.findIndex(s => s.id === 'owner_info');
      
      if (ownerSectionIndex !== -1) {
        const ownerSection = structure.sections[ownerSectionIndex];
        const newSections = [...structure.sections];
        
        // Remove any previously added owner sections
        const filteredSections = newSections.filter(s => !s.id.startsWith('owner_info_'));
        
        // Add new owner sections
        for (let i = 1; i <= additionalOwnersCount; i++) {
          const duplicatedSection = {
            ...ownerSection,
            id: `owner_info_${i}`,
            name: `Owner ${i + 1} Information`,
            label: `Owner ${i + 1} Information`,
            description: `Details about additional owner ${i + 1}`,
            order: ownerSection.order + i,
            fields: ownerSection.fields.map(field => ({
              ...field,
              id: `${field.id}_owner_${i}`,
              // Remove the "only owner" and "additional owners count" fields from duplicates
            })).filter(f => 
              f.name !== 'onlyOwner' && 
              f.name !== 'additionalOwnersCount'
            ),
          };
          
          // Insert after the original owner section
          filteredSections.splice(ownerSectionIndex + i, 0, duplicatedSection);
        }
        
        setStructure({ ...structure, sections: filteredSections });
      }
    }
  }, [responses['additional_owners_count'], structure?.sections.length]);

  // Pre-populate form with saved responses (for resume functionality)
  useEffect(() => {
    if (savedResponses && structure) {
      Object.entries(savedResponses).forEach(([fieldId, value]) => {
        setFieldValue(fieldId, value);
      });
    }
  }, [savedResponses, structure, setFieldValue]);

  // Auto-save progress (debounced) with status indicator
  useEffect(() => {
    if (!loanTypeId || Object.keys(responses).length === 0) return;

    // Generate application ID if not provided
    const effectiveAppId = applicationId || `draft_${loanTypeId}_${Date.now()}`;

    const timeoutId = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        const response = await fetch('/api/autosave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId: effectiveAppId,
            loanTypeId,
            responses,
            currentSectionIndex,
          }),
        });

        if (response.ok) {
          setAutoSaveStatus('saved');
          setLastSavedAt(new Date());
          // Reset to idle after 3 seconds
          setTimeout(() => setAutoSaveStatus('idle'), 3000);
        } else {
          setAutoSaveStatus('error');
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
        setAutoSaveStatus('error');
      }
    }, 2000); // Debounce: save 2 seconds after last change

    return () => clearTimeout(timeoutId);
  }, [responses, applicationId, loanTypeId, currentSectionIndex]);

  // Derive currentSection early (before any returns) for use in useMemo
  const currentSection = structure?.sections?.[currentSectionIndex];

  // Check if current section has all required fields filled
  // This must be called before any early returns to maintain hook order
  const isCurrentSectionValid = useMemo(() => {
    if (!currentSection) return false;

    // Get visible fields based on conditional logic
    const visibleFields = currentSection.fields.filter(field => {
      if (field.showIf && field.showIf.field && field.showIf.value) {
        const conditionValue = responses[field.showIf.field];
        return conditionValue === field.showIf.value;
      }
      return true;
    });

    const sectionToValidate = { ...currentSection, fields: visibleFields };
    const validationErrors = validateSection(sectionToValidate, responses);

    return Object.keys(validationErrors).length === 0;
  }, [currentSection, responses]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!structure) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Failed to load form configuration</p>
        </div>
      </div>
    );
  }

  // Show document collection step after submission
  if (showDocumentCollection && submittedApplicationId) {
    const applicantEmail = responses['owner_email'] ||
                          responses['business_email'] ||
                          responses['email'] ||
                          responses['contact_email'] ||
                          '';

    return (
      <DocumentCollectionStep
        applicationId={submittedApplicationId}
        uploadToken={uploadToken || ''}
        loanTypeId={loanTypeId}
        loanTypeName={structure?.name || ''}
        applicantEmail={applicantEmail}
        onFinish={finishAndRedirect}
      />
    );
  }

  // Show review page if toggled
  if (showReview) {
    return <ReviewPage onEdit={(sectionIndex) => {
      setShowReview(false);
      setReturnToReview(true);
      // goToSection is already called by ReviewPage
    }} />;
  }

  // Safety check: ensure current section exists
  if (!currentSection) {
    console.error('[DynamicForm] currentSection is undefined:', {
      sectionsCount: structure.sections.length,
      currentSectionIndex,
      sectionIds: structure.sections.map((s: any) => s.id),
    });

    // If structure has sections but index is out of bounds, reset to first section
    if (structure.sections.length > 0) {
      goToSection(0);
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading section...</p>
          </div>
        </div>
      );
    }

    // Structure has 0 sections - show error instead of spinning forever
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-2">No form sections found for this loan type.</p>
          <p className="text-gray-500 text-sm">The loan type configuration may be incomplete.</p>
        </div>
      </div>
    );
  }

  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === structure.sections.length - 1;

  // AI-powered navigation handler
  const handleNextSection = async () => {
    // Validate required fields in current section before proceeding
    const visibleFields = currentSection.fields.filter(field => {
      // Check if field should be visible based on conditional logic
      if (field.showIf && field.showIf.field && field.showIf.value) {
        const conditionValue = responses[field.showIf.field];
        return conditionValue === field.showIf.value;
      }
      return true;
    });

    const sectionToValidate = { ...currentSection, fields: visibleFields };
    const validationErrors = validateSection(sectionToValidate, responses);

    if (Object.keys(validationErrors).length > 0) {
      // Set errors for all invalid fields
      Object.entries(validationErrors).forEach(([fieldId, errorMsg]) => {
        setFieldError(fieldId, errorMsg);
      });
      // Scroll to first error
      const firstErrorField = document.querySelector('[class*="border-red-500"]');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return; // Don't proceed to next section
    }

    // Mark current section as complete and sync to GHL if applicable
    await markSectionComplete(currentSection.id);

    if (!aiEnabled || !structure) {
      // Fallback to normal navigation
      nextSection();
      return;
    }

    setAiPlanning(true);

    try {
      // Call AI to plan next section
      const decision = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanType: loanTypeId,
          currentSection: currentSection.id,
          responses,
          entityMap: structure,
          completedSections,
        }),
      }).then(r => r.json());

      // Handle AI decision
      if (decision.action === 'skip_section') {
        // AI decided to skip to a specific section
        const nextSectionIndex = structure.sections.findIndex(
          s => s.id === decision.data.nextSectionId
        );

        if (nextSectionIndex !== -1) {
          goToSection(nextSectionIndex);
        } else {
          // Fallback if section not found
          nextSection();
        }
      } else if (decision.action === 'show_section') {
        // AI says proceed to next section
        nextSection();
      } else {
        // Unknown action, fallback
        nextSection();
      }
    } catch (error) {
      console.error('AI planning failed:', error);
      // Fallback to normal navigation on error
      nextSection();
    } finally {
      setAiPlanning(false);
    }
  };

  // Handler for "Save & Return to Review" button
  const handleReturnToReview = async () => {
    // Mark current section as complete
    await markSectionComplete(currentSection.id);
    // Return to review page
    setShowReview(true);
    setReturnToReview(false);
  };

  // Handler for Save & Exit
  const handleSaveAndExit = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          loanTypeId,
          responses,
          currentSectionIndex,
          completedSections,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Save & Exit failed:', error);
      return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Save & Exit Modal */}
      <SaveAndExitModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveAndExit}
        initialEmail={responses['business_email'] || responses['email'] || ''}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {structure.name}
            </h1>
            <p className="text-gray-600">
              Section {currentSectionIndex + 1} of {structure.sections.length}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-save Status Indicator */}
            <div className="flex items-center gap-2 text-sm">
              {autoSaveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-gray-500">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              )}
              {autoSaveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-green-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved
                </span>
              )}
              {autoSaveStatus === 'error' && (
                <span className="flex items-center gap-1 text-red-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Save failed
                </span>
              )}
              {autoSaveStatus === 'idle' && lastSavedAt && (
                <span className="text-gray-400 text-xs">
                  Last saved {lastSavedAt.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Save & Exit Button */}
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save & Exit
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentSectionIndex + 1) / structure.sections.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Current Section */}
      <DynamicSection section={currentSection} />

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={previousSection}
          disabled={isFirstSection}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isFirstSection
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          Previous
        </button>

        <button
          onClick={
            returnToReview
              ? handleReturnToReview
              : isLastSection
              ? (onComplete || (() => setShowReview(true)))
              : handleNextSection
          }
          disabled={aiPlanning || !isCurrentSectionValid}
          className="px-6 py-3 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {aiPlanning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              {returnToReview ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Save & Return to Review
                </>
              ) : (
                <>
                  {isLastSection ? (onComplete ? 'Continue' : 'Review Application') : 'Next'}
                </>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
