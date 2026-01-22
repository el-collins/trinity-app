'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ApplicationDetails {
  id: string;
  loanTypeId: string;
  status: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  applicantEmail: string;
  version: number;
  previousApplicationIds: string[];
  initialInteraction: {
    firstContactDate: string;
    totalApplications: number;
    loanTypesApplied: string[];
  };
  responses: Record<string, any>;
  fieldLabels: Record<string, string>;
  documents: Array<{
    id: string;
    documentId: string;
    name: string;
    url: string;
    uploadedAt: string;
  }>;
}

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
  { value: 'under_review', label: 'Under Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'declined', label: 'Declined', color: 'bg-red-100 text-red-800' },
  { value: 'funded', label: 'Funded', color: 'bg-purple-100 text-purple-800' },
];

const LOAN_TYPE_LABELS: Record<string, string> = {
  mca: 'Merchant Cash Advance',
  line_of_credit: 'Line of Credit',
  sba: 'SBA Loan',
  equipment_finance: 'Equipment Finance',
  invoice_factoring: 'Invoice Factoring',
  invoice_financing: 'Invoice Financing',
  general: 'General Loan',
};

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<ApplicationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchApplication();
  }, [applicationId]);

  const fetchApplication = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch application');
      }

      setApplication(data);
      setSelectedStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!application || selectedStatus === application.status) return;

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setApplication({ ...application, status: selectedStatus });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
    if (typeof value === 'string' && value.startsWith('data:image')) {
      return '[Signature Image]';
    }
    return String(value);
  };

  const getFieldLabel = (fieldId: string): string => {
    if (application?.fieldLabels[fieldId]) {
      return application.fieldLabels[fieldId];
    }
    // Convert snake_case to Title Case
    return fieldId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || 'Application not found'}</p>
          <Link
            href="/admin/applications"
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = STATUS_OPTIONS.find(s => s.value === application.status);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/applications"
          className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Applications
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {application.responses.business_name || application.responses.company_name || 'Application Details'}
            </h1>
            <p className="text-gray-500 mt-1 font-mono">{application.id}</p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleStatusUpdate}
              disabled={isUpdating || selectedStatus === application.status}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUpdating ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Status</p>
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${currentStatus?.color}`}>
            {currentStatus?.label}
          </span>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Loan Type</p>
          <p className="text-lg font-semibold text-gray-900">
            {LOAN_TYPE_LABELS[application.loanTypeId] || application.loanTypeId}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Submitted</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatDate(application.submittedAt)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Version</p>
          <p className="text-lg font-semibold text-gray-900">
            #{application.version}
            {application.previousApplicationIds.length > 0 && (
              <span className="text-sm text-gray-500 ml-2">
                ({application.previousApplicationIds.length} previous)
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Application Data */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Application Data
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(application.responses)
                .filter(([key, value]) => {
                  // Skip empty values and signature images in the main list
                  if (value === null || value === undefined || value === '') return false;
                  if (typeof value === 'string' && value.startsWith('data:image')) return false;
                  return true;
                })
                .map(([key, value]) => (
                  <div key={key} className="border-b border-gray-100 pb-3">
                    <p className="text-sm text-gray-500">{getFieldLabel(key)}</p>
                    <p className="text-gray-900 font-medium">{formatValue(value)}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Signatures Section */}
          {Object.entries(application.responses).some(
            ([, value]) => typeof value === 'string' && value.startsWith('data:image')
          ) && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
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
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contact Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <a
                  href={`mailto:${application.applicantEmail}`}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {application.applicantEmail}
                </a>
              </div>
              {application.responses.business_phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a
                    href={`tel:${application.responses.business_phone}`}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {application.responses.business_phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Documents
            </h3>
            {application.documents.length > 0 ? (
              <ul className="space-y-3">
                {application.documents.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-700"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {doc.name || doc.documentId}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No documents uploaded</p>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Timeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-600 rounded-full"></div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Submitted</p>
                  <p className="text-sm text-gray-500">{formatDate(application.submittedAt)}</p>
                </div>
              </div>
              {application.initialInteraction?.firstContactDate && (
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-gray-400 rounded-full"></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">First Contact</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(application.initialInteraction.firstContactDate)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
