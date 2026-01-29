'use client';

import { useState } from 'react';
import DynamicFormContainer from '@/components/DynamicForm/DynamicFormContainer';
import LoanTypeSelection from '@/components/LoanTypeSelection';
import { useRouter } from 'next/navigation';
import { useFormStore } from '@/lib/store/formStore';
import { useReferralTracking } from '@/hooks/useReferralTracking';

export default function QuickAppPage() {
  const router = useRouter();
  const { responses } = useFormStore();
  const [quickAppCompleted, setQuickAppCompleted] = useState(false);

  // Capture referral tracking params from URL on page load
  const { referralData, hasReferral } = useReferralTracking();

  // Log referral data for debugging
  if (hasReferral && referralData) {
    console.log('[QuickApp] Referral tracking active:', {
      referralCode: referralData.referralCode,
      agentId: referralData.agentId,
      utmCampaign: referralData.utmCampaign,
    });
  }

  // Check if user completed Quick App by checking for the know_loan_type response
  const handleQuickAppComplete = () => {
    // Get the user's answer to "Do you know what loan type you're looking for?"
    const knowsType = responses['know_loan_type'];
    setQuickAppCompleted(true);
  };

  const handleLoanTypeSelected = (loanTypeId: string) => {
    // Navigate to the full application for the selected loan type
    // The responses from Quick App are already stored and will be reused
    router.push(`/apply/${loanTypeId}`);
  };

  if (quickAppCompleted) {
    // Show loan type selection after Quick App completion
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <LoanTypeSelection onSelectLoanType={handleLoanTypeSelected} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Quick Application
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get started with your business financing. Takes about 10 minutes.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Progress automatically saved
            </span>
            <span className="mx-2">•</span>
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-1 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Can resume anytime
            </span>
          </div>
        </div>

        {/* Form */}
        <DynamicFormContainer
          loanTypeId="quick_app"
          onComplete={handleQuickAppComplete}
        />

        {/* Benefits Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Why Choose Trinity Finance?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Fast Approval</h4>
              <p className="text-sm text-gray-600">Get a decision in 24-48 hours</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Competitive Rates</h4>
              <p className="text-sm text-gray-600">Rates tailored to your business</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Dedicated Support</h4>
              <p className="text-sm text-gray-600">Personal loan specialist assigned</p>
            </div>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Want to learn more first?{' '}
            <a href="/" className="text-blue-600 hover:underline font-medium">
              Back to homepage
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
