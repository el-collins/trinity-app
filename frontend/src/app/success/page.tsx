'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id');
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Get referral params from URL (passed from form submission)
  const referralCode = searchParams.get('ref');
  const agentId = searchParams.get('agent');
  const campaign = searchParams.get('campaign');

  useEffect(() => {
    if (applicationId) {
      fetch(`/api/applications?id=${applicationId}`)
        .then(res => res.json())
        .then(data => {
          setApplication(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load application:', err);
          setLoading(false);
        });
    } else {
        setLoading(false);
    }
  }, [applicationId]);

  // Helper functions
  const getFieldLabel = (fieldId: string): string => {
    if (application?.fieldLabels?.[fieldId]) {
      return application.fieldLabels[fieldId];
    }
    // Convert snake_case to Title Case
    return fieldId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      // Check if it looks like currency
      if (value >= 1000) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(value);
      }
      return value.toString();
    }
    return String(value);
  };

  const handlePrint = () => {
    window.print();
  };

  // Check if there's referral data (from URL or application)
  const hasReferralData = referralCode || agentId || campaign ||
    application?.referralTracking?.referralCode ||
    application?.referralTracking?.agentId ||
    application?.referralTracking?.utmCampaign;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const LOAN_TYPE_LABELS: Record<string, string> = {
    mca: 'Merchant Cash Advance',
    line_of_credit: 'Line of Credit',
    sba: 'SBA Loan',
    equipment_finance: 'Equipment Finance',
    invoice_factoring: 'Invoice Factoring',
    invoice_financing: 'Invoice Financing',
    general: 'General Loan',
  };

  return (
    <div className="max-w-5xl w-full bg-white rounded-lg shadow-lg p-8">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          .print-section {
            page-break-inside: avoid;
          }
          .page-break {
            page-break-after: always;
          }
        }
      `}</style>

      {/* Success Icon - Hide on Print */}
      <div className="flex justify-center mb-6 no-print">
        <div className="rounded-full bg-green-100 p-4">
          <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Success Message - Hide on Print */}
      <h1 className="text-3xl font-bold text-center text-gray-900 mb-4 no-print">
        Application Submitted Successfully!
      </h1>
      
      <p className="text-center text-gray-600 mb-8 no-print">
        Thank you for submitting your application. Below is a complete summary of your submission.
      </p>

      {/* Print Header - Show only on Print */}
      <div className="hidden print:block mb-8 text-center border-b-2 border-gray-800 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan Application</h1>
        <p className="text-gray-600">
          {application && LOAN_TYPE_LABELS[application.loanTypeId] || application?.loanTypeId || 'Application'}
        </p>
      </div>

      {/* Application Metadata */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8 print-section">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Information</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-600 text-sm">Application ID:</span>
            <p className="font-mono text-gray-900 font-medium">{applicationId || 'N/A'}</p>
          </div>
          
          {application && (
            <>
              <div>
                <span className="text-gray-600 text-sm">Loan Type:</span>
                <p className="text-gray-900 font-medium">
                  {LOAN_TYPE_LABELS[application.loanTypeId] || application.loanTypeId}
                </p>
              </div>
              
              <div>
                <span className="text-gray-600 text-sm">Submitted:</span>
                <p className="text-gray-900 font-medium">
                  {new Date(application.submittedAt).toLocaleString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div>
                <span className="text-gray-600 text-sm">Status:</span>
                <p className="text-gray-900 font-medium capitalize">
                  {(application.status || 'pending').replace('_', ' ')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Complete Application Data - Organized by Sections */}
      {application?.sections && application.responses && (
        <div className="space-y-8 mb-8">
          {application.sections.map((section: any, sectionIndex: number) => {
            // Get fields for this section that have values
            const sectionFields = section.fields.filter((field: any) => {
              const value = application.responses[field.id];
              // Skip signature images in main sections (we'll show them separately)
              if (typeof value === 'string' && value.startsWith('data:image')) return false;
              // Show fields that have values
              return value !== null && value !== undefined && value !== '';
            });

            if (sectionFields.length === 0) return null;

            return (
              <div key={sectionIndex} className="print-section">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
                    {section.title}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {sectionFields.map((field: any) => (
                      <div key={field.id} className="border-b border-gray-100 pb-3">
                        <p className="text-sm text-gray-500 mb-1">{field.label}</p>
                        <p className="text-gray-900 font-medium">
                          {formatValue(application.responses[field.id])}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Signatures Section */}
      {application?.responses && Object.entries(application.responses).some(
        ([, value]) => typeof value === 'string' && value.startsWith('data:image')
      ) && (
        <div className="print-section mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Signatures
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(application.responses)
                .filter(([, value]) => typeof value === 'string' && value.startsWith('data:image'))
                .map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm text-gray-500 mb-2">{getFieldLabel(key)}</p>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <img
                        src={value as string}
                        alt={getFieldLabel(key)}
                        className="max-h-32 mx-auto"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Referral Tracking (if applicable) */}
      {hasReferralData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 print-section">
          <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Referral Information
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {(referralCode || application?.referralTracking?.referralCode) && (
              <div>
                <span className="text-blue-700 text-sm font-medium">Referred By:</span>
                <p className="text-blue-900 font-semibold">
                  {referralCode || application?.referralTracking?.referralCode}
                </p>
              </div>
            )}

            {(agentId || application?.referralTracking?.agentId) && (
              <div>
                <span className="text-blue-700 text-sm font-medium">Agent:</span>
                <p className="text-blue-900 font-semibold">
                  {agentId || application?.referralTracking?.agentId}
                </p>
              </div>
            )}

            {(campaign || application?.referralTracking?.utmCampaign) && (
              <div>
                <span className="text-blue-700 text-sm font-medium">Campaign:</span>
                <p className="text-blue-900 font-semibold">
                  {campaign || application?.referralTracking?.utmCampaign}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Next Steps - Hide on Print */}
      <div className="border-t border-gray-200 pt-6 mb-8 no-print">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h2>
        
        <ul className="space-y-3 text-gray-600">
          <li className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Our team will review your application within 24-48 hours</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>You will receive an email confirmation at the address you provided</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>A loan specialist will contact you if additional information is needed</span>
          </li>
        </ul>
      </div>

      {/* Actions - Hide on Print */}
      <div className="flex gap-4 no-print">
        <button
          onClick={handlePrint}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Application
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Return Home
        </button>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
