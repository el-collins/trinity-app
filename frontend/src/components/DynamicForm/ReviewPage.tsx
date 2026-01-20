'use client';

import { useFormStore } from '@/lib/store/formStore';
import { useState } from 'react';

interface ReviewPageProps {
  onEdit?: (sectionIndex: number) => void;
}

export default function ReviewPage({ onEdit }: ReviewPageProps) {
  const { structure, responses, errors, goToSection, submitForm, isSubmitting } = useFormStore();
  const [showConfirm, setShowConfirm] = useState(false);

  if (!structure) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <p className="text-gray-600">Loading form structure...</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    setShowConfirm(false);
    await submitForm();
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Review Your Application
        </h1>
        <p className="text-gray-600">
          Please review all information before submitting. You can edit any section by clicking the Edit button.
        </p>
      </div>

      {/* Application Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-blue-900 mb-2">{structure.name}</h2>
        <p className="text-sm text-blue-700">
          {structure.sections.length} sections • {structure.sections.reduce((acc, s) => acc + s.fields.length, 0)} fields
        </p>
      </div>

      {/* Sections Review */}
      {structure.sections.map((section, index) => {
        // Filter out conditional fields that don't meet their showIf condition
        const visibleFields = section.fields.filter(field => {
          if (!field.showIf || !field.showIf.field || !field.showIf.value) {
            return true; // No condition, always show
          }
          const conditionValue = responses[field.showIf.field];
          return conditionValue === field.showIf.value;
        });

        const sectionResponses = visibleFields.filter(f => {
          const value = responses[f.id];
          // For boolean fields, false is a valid answer
          if (f.type.toUpperCase() === 'BOOLEAN') {
            return value !== undefined && value !== null && value !== '';
          }
          return value !== undefined && value !== null && value !== '';
        });
        
        const completionRate = visibleFields.length > 0 
          ? (sectionResponses.length / visibleFields.length) * 100 
          : 100;

        return (
          <div key={section.id} className="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
            {/* Section Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{section.label}</h2>
                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">
                    {sectionResponses.length}/{visibleFields.length} completed
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  goToSection(index);
                  onEdit?.(index);
                }}
                className="ml-4 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
              >
                Edit
              </button>
            </div>

            {/* Section Fields */}
            <div className="p-6 space-y-4">
              {visibleFields.map((field) => {
                const value = responses[field.id];
                const hasValue = field.type.toUpperCase() === 'BOOLEAN'
                  ? value !== undefined && value !== null && value !== ''
                  : value !== undefined && value !== null && value !== '';

                return (
                  <div key={field.id} className={`border-b border-gray-100 pb-3 last:border-0 ${
                    errors[field.id] ? 'bg-red-50 p-3 rounded-lg border-red-200' : ''
                  }`}>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </p>
                    {hasValue ? (
                      field.type?.toLowerCase() === 'signature' && typeof value === 'string' && value.startsWith('data:image') ? (
                        <div className="mt-2">
                          <img
                            src={value}
                            alt={field.label}
                            className="max-h-32 border border-gray-200 rounded-lg bg-white p-2"
                          />
                        </div>
                      ) : (
                        <p className="text-gray-900">
                          {field.type?.toLowerCase() === 'boolean'
                            ? (value === true || value === 'true' || value === 'yes' ? 'Yes' : 'No')
                            : Array.isArray(value)
                              ? value.join(', ')
                              : String(value)}
                        </p>
                      )
                    ) : (
                      <p className="text-gray-400 italic">Not answered</p>
                    )}
                    {errors[field.id] && (
                      <p className="mt-1 text-sm text-red-600 font-medium">
                        ⚠️ {errors[field.id]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={() => {
            const lastSectionIndex = structure.sections.length - 1;
            goToSection(lastSectionIndex);
            onEdit?.(lastSectionIndex);
          }}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          ← Back to Form
        </button>
        
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isSubmitting}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Submitting...
            </>
          ) : (
            'Submit Application'
          )}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirm Submission
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit this application? Once submitted, you will not be able to make changes.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
