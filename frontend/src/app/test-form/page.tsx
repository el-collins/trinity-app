import DynamicFormContainer from '@/components/DynamicForm/DynamicFormContainer';

export default function TestFormPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DynamicFormContainer loanTypeId="mca" />
    </div>
  );
}
