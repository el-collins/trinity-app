'use client';

import { FormSection } from '@/lib/types/schema';
import DynamicField from './DynamicField';
import AskPanel from './AskPanel';
import { useFormStore } from '@/lib/store/formStore';

interface DynamicSectionProps {
  section: FormSection;
}

// Convert snake_case or camelCase to Title Case
const formatSectionTitle = (text: string): string => {
  if (!text) return '';

  // Replace underscores and split on capital letters
  return text
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function DynamicSection({ section }: DynamicSectionProps) {
  // Get the display title - use label if available, otherwise format the name
  const displayTitle = section.label || formatSectionTitle(section.name);
  const loanTypeId = useFormStore((state) => state.loanTypeId);

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {displayTitle}
        </h2>
        {section.description && (
          <p className="text-gray-600">{section.description}</p>
        )}
      </div>

      {/* Fields Grid */}
      <div className="space-y-6">
        {section.fields
          .sort((a, b) => a.order - b.order)
          .map((field) => (
            <div key={field.id}>
              <DynamicField field={field} />
              {/* Field-scoped Q&A; self-gated by NEXT_PUBLIC_ENABLE_RAG */}
              {field.helpText && loanTypeId && (
                <AskPanel loanTypeId={loanTypeId} fieldId={field.id} label={`Ask about "${field.label}"`} />
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
