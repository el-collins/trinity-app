'use client';

import { use } from 'react';
import DynamicFormContainer from '@/components/DynamicForm/DynamicFormContainer';
import { useReferralTracking } from '@/hooks/useReferralTracking';

export default function ApplyPage({ params }: { params: Promise<{ loanTypeId: string }> }) {
  const { loanTypeId } = use(params);

  // Capture referral tracking params from URL on page load
  const { referralData, hasReferral } = useReferralTracking();

  return <DynamicFormContainer loanTypeId={loanTypeId} />;
}
