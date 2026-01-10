'use client';

import { FormSection } from '@/lib/types/schema';
import DynamicField from './DynamicField';

interface DynamicSectionProps {
  section: FormSection;
}

export default function DynamicSection({ section }: DynamicSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {section.label || section.name}
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
            <DynamicField key={field.id} field={field} />
          ))}
      </div>
    </div>
  );
}
