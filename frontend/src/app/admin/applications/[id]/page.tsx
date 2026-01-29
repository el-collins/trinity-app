'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ResumeLinkModal from '@/components/Modals/ResumeLinkModal';

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

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedResponses, setEditedResponses] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Resume link modal state
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [resumeLink, setResumeLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Enter edit mode
  const handleStartEdit = () => {
    if (application) {
      setEditedResponses({ ...application.responses });
      setIsEditMode(true);
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedResponses({});
  };

  // Save edited responses
  const handleSaveEdit = async () => {
    if (!application) return;

    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: editedResponses }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      // Update local state
      setApplication({ ...application, responses: editedResponses });
      setIsEditMode(false);
      setEditedResponses({});
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle field change in edit mode
  const handleFieldChange = (fieldId: string, value: any) => {
    setEditedResponses(prev => ({ ...prev, [fieldId]: value }));
  };

  // Generate resume link
  const handleGenerateResumeLink = async () => {
    setIsGeneratingLink(true);

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/generate-resume-link`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate resume link');
      }

      const data = await response.json();
      setResumeLink(data.resumeLink);
      setIsResumeModalOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate resume link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Delete application
  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete application');
      }

      toast.success('Application deleted successfully');
      router.push('/admin/applications');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete application');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Print application
  const handlePrint = () => {
    window.print();
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

          <div className="flex items-center space-x-3 print:hidden">
            {/* Edit/Save/Cancel Buttons */}
            {isEditMode ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleStartEdit}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={handleGenerateResumeLink}
                  disabled={isGeneratingLink}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isGeneratingLink ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Resume Application
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </>
            )}

            {/* Status Update */}
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center justify-between">
              <span>Application Data</span>
              {isEditMode && (
                <span className="text-sm font-normal text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                  Edit Mode
                </span>
              )}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(isEditMode ? editedResponses : application.responses)
                .filter(([key, value]) => {
                  // In edit mode, show all fields including empty ones
                  if (isEditMode) {
                    // Still skip signature images
                    if (typeof value === 'string' && value.startsWith('data:image')) return false;
                    return true;
                  }
                  // Skip empty values and signature images in view mode
                  if (value === null || value === undefined || value === '') return false;
                  if (typeof value === 'string' && value.startsWith('data:image')) return false;
                  return true;
                })
                .map(([key, value]) => (
                  <div key={key} className="border-b border-gray-100 pb-3">
                    <p className="text-sm text-gray-500 mb-1">{getFieldLabel(key)}</p>
                    {isEditMode ? (
                      // Editable input based on value type
                      typeof value === 'boolean' ? (
                        <select
                          value={editedResponses[key]?.toString() || 'false'}
                          onChange={(e) => handleFieldChange(key, e.target.value === 'true')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      ) : typeof value === 'number' ? (
                        <input
                          type="number"
                          value={editedResponses[key] || ''}
                          onChange={(e) => handleFieldChange(key, parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <input
                          type="text"
                          value={editedResponses[key] || ''}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Enter ${getFieldLabel(key).toLowerCase()}`}
                        />
                      )
                    ) : (
                      <p className="text-gray-900 font-medium">{formatValue(value)}</p>
                    )}
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

      {/* Resume Link Modal */}
      <ResumeLinkModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        resumeLink={resumeLink}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Application</h3>
                <p className="text-gray-600 text-sm">
                  Are you sure you want to delete this application? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Application'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
