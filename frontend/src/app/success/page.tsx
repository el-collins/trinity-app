'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id');
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
      {/* Success Icon */}
      <div className="flex justify-center mb-6">
        <div className="rounded-full bg-green-100 p-4">
          <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Success Message */}
      <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
        Application Submitted Successfully!
      </h1>
      
      <p className="text-center text-gray-600 mb-8">
        Thank you for submitting your application. We have received your information and will review it shortly.
      </p>

      {/* Application Details */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Application ID:</span>
            <span className="font-mono text-gray-900">{applicationId || 'N/A'}</span>
          </div>
          
          {application && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Loan Type:</span>
                <span className="text-gray-900">{application.loanTypeId}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Submitted:</span>
                <span className="text-gray-900">
                  {new Date(application.submittedAt).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  {application.status}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <div className="border-t border-gray-200 pt-6">
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

      {/* Actions */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={() => window.print()}
          className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Print Confirmation
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
