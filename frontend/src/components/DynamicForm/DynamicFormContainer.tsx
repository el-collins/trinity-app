'use client';

import { useEffect, useState } from 'react';
import { useFormStore } from '@/lib/store/formStore';
import DynamicSection from './DynamicSection';
import ReviewPage from './ReviewPage';
import { getResumeTokenFromURL } from '@/lib/utils/urlState';

interface DynamicFormContainerProps {
  loanTypeId: string;
  applicationId?: string; // For resuming existing applications
  savedResponses?: Record<string, any>; // Pre-populated data
}

export default function DynamicFormContainer({ 
  loanTypeId, 
  applicationId, 
  savedResponses 
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
    nextSection,
    previousSection,
    goToSection,
    loadFromURL,
    syncToURL,
    resetForm, // Added resetForm
  } = useFormStore();

  const [showReview, setShowReview] = useState(false);
  const [aiPlanning, setAiPlanning] = useState(false);
  
  // AI is always enabled based on env var (no UI toggle)
  const aiEnabled = process.env.NEXT_PUBLIC_ENABLE_AI_PLANNING === 'true';

  // Fetch form structure on mount
  useEffect(() => {
    const fetchFormStructure = async () => {
      // Check for mismatch and reset BEFORE anything else
      const { loanTypeId: storedLoanTypeId, resetForm } = useFormStore.getState();
      const token = getResumeTokenFromURL();

      // If switching loan types without a resume token, clear everything immediately
      if (!token && storedLoanTypeId && storedLoanTypeId !== loanTypeId) {
        console.log('Loan type mismatch detected during init, resetting form...');
        resetForm();
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
      } catch (error) {
        console.error('Error fetching form structure:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFormStructure();
  }, [loanTypeId, setStructure, setLoanTypeId, setLoading]);

  // Load from URL token on mount
  useEffect(() => {
    const token = getResumeTokenFromURL();
    if (token) {
      loadFromURL(token);
    }
  }, [loadFromURL]);

  // Debounced URL sync on state changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      syncToURL();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [responses, currentSectionIndex, completedSections, syncToURL]);

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

  // Auto-save progress (debounced)
  useEffect(() => {
    if (!applicationId || !loanTypeId || Object.keys(responses).length === 0) return;

    const timeoutId = setTimeout(async () => {
      try {
        await fetch('/api/autosave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId,
            loanTypeId,
            responses,
            currentSectionIndex,
          }),
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 2000); // Debounce: save 2 seconds after last change

    return () => clearTimeout(timeoutId);
  }, [responses, applicationId, loanTypeId, currentSectionIndex]);

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

  // Show review page if toggled
  if (showReview) {
    return <ReviewPage onEdit={() => setShowReview(false)} />;
  }

  const currentSection = structure.sections[currentSectionIndex];
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === structure.sections.length - 1;

  // AI-powered navigation handler
  const handleNextSection = async () => {
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

      console.log('AI Decision:', decision);

      // Handle AI decision
      if (decision.action === 'skip_section') {
        // AI decided to skip to a specific section
        const nextSectionIndex = structure.sections.findIndex(
          s => s.id === decision.data.nextSectionId
        );
        
        if (nextSectionIndex !== -1) {
          console.log(`AI skipping to section: ${decision.data.nextSectionId}`);
          console.log(`Reasoning: ${decision.reasoning}`);
          goToSection(nextSectionIndex);
        } else {
          // Fallback if section not found
          nextSection();
        }
      } else if (decision.action === 'show_section') {
        // AI says proceed to next section
        console.log(`AI proceeding to next section`);
        console.log(`Reasoning: ${decision.reasoning}`);
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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
          
          {/* AI Toggle Removed - Always Active via Env Var */}
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
          onClick={isLastSection ? () => setShowReview(true) : handleNextSection}
          disabled={aiPlanning}
          className="px-6 py-3 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {aiPlanning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              AI Planning...
            </>
          ) : (
            <>
              {isLastSection ? 'Review Application' : 'Next'}
              {aiEnabled && !isLastSection && (
                <span className="text-xs opacity-75">✨ AI</span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
