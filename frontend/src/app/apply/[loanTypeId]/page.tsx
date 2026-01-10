import DynamicFormContainer from '@/components/DynamicForm/DynamicFormContainer';

export default async function ApplyPage({ params }: { params: Promise<{ loanTypeId: string }> }) {
  const { loanTypeId } = await params;
  return <DynamicFormContainer loanTypeId={loanTypeId} />;
}
