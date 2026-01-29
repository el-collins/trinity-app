'use client';

import { use } from 'react';
import DynamicFormContainer from '@/components/DynamicForm/DynamicFormContainer';
import { useReferralTracking } from '@/hooks/useReferralTracking';

export default function ApplyPage({ params }: { params: Promise<{ loanTypeId: string }> }) {
  const { loanTypeId } = use(params);

  // Capture referral tracking params from URL on page load
  const { referralData, hasReferral } = useReferralTracking();

  // Log referral data for debugging
  if (hasReferral && referralData) {
    console.log('[Apply] Referral tracking active:', {
      referralCode: referralData.referralCode,
      agentId: referralData.agentId,
      utmCampaign: referralData.utmCampaign,
    });
  }

  return <DynamicFormContainer loanTypeId={loanTypeId} />;
}
