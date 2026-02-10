'use client';

import { useState, useEffect } from 'react';

interface Document {
  id: string;
  name: string;
  description: string;
  required: boolean;
  acceptedFormats: string[];
  maxFileSizeMB: number;
  order: number;
  uploaded?: boolean;
  fileUrl?: string;
}

interface WorkbookTemplate {
  name: string;
  url: string;
  description: string;
}

interface WorkbookData {
  loanTypeId: string;
  displayName: string;
  workbooks: WorkbookTemplate[];
}

interface DocumentCollectionStepProps {
  applicationId: string;
  uploadToken: string;
  loanTypeId: string;
  loanTypeName: string;
  applicantEmail: string;
  onFinish: () => void;
}

export default function DocumentCollectionStep({
  applicationId,
  uploadToken,
  loanTypeId,
  loanTypeName,
  applicantEmail,
  onFinish,
}: DocumentCollectionStepProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [workbooks, setWorkbooks] = useState<WorkbookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [workbookUrls, setWorkbookUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchDocumentsAndWorkbooks();
  }, [loanTypeId]);

  const fetchDocumentsAndWorkbooks = async () => {
    try {
      const [docsResponse, workbooksResponse] = await Promise.all([
        fetch(`/api/documents/required?loanTypeId=${loanTypeId}`),
        fetch(`/api/documents/workbooks?loanTypeId=${loanTypeId}`),
      ]);

      const docsResult = await docsResponse.json();
      if (docsResult.documents && Array.isArray(docsResult.documents)) {
        const sanitizedDocs = docsResult.documents.map((doc: Document) => ({
          ...doc,
          acceptedFormats: doc.acceptedFormats || ['PDF', 'JPG', 'JPEG', 'PNG'],
          maxFileSizeMB: doc.maxFileSizeMB || 10,
          required: doc.required ?? true,
        }));
        setDocuments(sanitizedDocs);
      }

      if (workbooksResponse.ok) {
        const workbooksResult = await workbooksResponse.json();
        setWorkbooks(workbooksResult);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load document requirements.');
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentId: string, file: File) => {
    setUploadingDocId(documentId);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('token', uploadToken);
      formData.append('documentId', documentId);
      formData.append('file', file);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === documentId
              ? { ...doc, uploaded: true, fileUrl: result.url }
              : doc
          )
        );
      } else {
        setError(result.error || 'Upload failed. Please try again.');
      }
    } catch (err) {
      setError('Upload failed. Please check your connection and try again.');
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleSendReminder = async () => {
    setSendingReminder(true);
    setError(null);

    try {
      const response = await fetch('/api/documents/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: uploadToken,
          email: applicantEmail,
        }),
      });

      if (response.ok) {
        setReminderSent(true);
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to send reminder');
      }
    } catch (err) {
      setError('Failed to send reminder. Please try again.');
    } finally {
      setSendingReminder(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document requirements...</p>
        </div>
      </div>
    );
  }

  const requiredDocs = documents.filter((d) => d.required);
  const optionalDocs = documents.filter((d) => !d.required);
  const uploadedRequired = requiredDocs.filter((d) => d.uploaded).length;
  const totalItems = requiredDocs.length + (workbooks?.workbooks.length || 0);
  const completedItems = uploadedRequired + Object.keys(workbookUrls).filter(k => workbookUrls[k].trim()).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Success Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="bg-green-100 rounded-full p-3">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-green-900 mb-1">
              Application Submitted Successfully!
            </h1>
            <p className="text-green-700">
              Your {loanTypeName} application has been received. Now let&apos;s gather the supporting documents needed to process your application.
            </p>
          </div>
        </div>
      </div>

      {/* Document Collection Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Supporting Documents
        </h2>
        <p className="text-gray-600">
          The following documents are needed to complete your application. You can upload them now or receive an email to continue later.
        </p>
      </div>

      {/* Workbook Templates Section */}
      {workbooks && workbooks.workbooks.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 mb-6 border border-blue-200">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Workbook Template{workbooks.workbooks.length > 1 ? 's' : ''}
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Click each link to make a copy of the template. Fill it out, then paste your shareable link below.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-100 mb-3">
            <p className="text-sm text-blue-800 font-medium mb-4">
              💡 <strong>Tip:</strong> When you open each Google Sheet link, click &quot;Make a Copy&quot; and make sure your copy is set to Shareable so we can view it.
            </p>

            <div className="space-y-4">
              {workbooks.workbooks.map((workbook, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📊</span>
                      <div>
                        <p className="font-semibold text-gray-900">{workbook.name}</p>
                        <p className="text-sm text-gray-500">{workbook.description}</p>
                      </div>
                    </div>
                    <a
                      href={workbook.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium whitespace-nowrap transition-colors"
                    >
                      Open Template →
                    </a>
                  </div>

                  {/* URL Paste Field */}
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="Paste your completed workbook link here..."
                      value={workbookUrls[workbook.name] || ''}
                      onChange={(e) => setWorkbookUrls(prev => ({ ...prev, [workbook.name]: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                    />
                    {workbookUrls[workbook.name]?.trim() && (
                      <span className="text-green-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Section */}
      {requiredDocs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📤</span> Required Documents
          </h3>
          <div className="space-y-4">
            {requiredDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onUpload={handleFileUpload}
                uploading={uploadingDocId === doc.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Optional Documents */}
      {optionalDocs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📎</span> Optional Documents (Recommended)
          </h3>
          <div className="space-y-4">
            {optionalDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onUpload={handleFileUpload}
                uploading={uploadingDocId === doc.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="border-t border-gray-200 pt-6 mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Continue Later */}
          <div className="flex items-center gap-3">
            {reminderSent ? (
              <div className="flex items-center gap-2 text-green-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">
                  Reminder sent to {applicantEmail}!
                </span>
              </div>
            ) : (
              <button
                onClick={handleSendReminder}
                disabled={sendingReminder}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {sendingReminder ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Continue Later via Email
                  </>
                )}
              </button>
            )}
          </div>

          {/* Finish Button */}
          <button
            onClick={onFinish}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            {requiredDocs.length > 0 && uploadedRequired < requiredDocs.length ? (
              'Skip for Now & Finish'
            ) : (
              "I'm Done"
            )}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Don&apos;t worry - you can always upload documents later using the link in your confirmation email.
        </p>
      </div>
    </div>
  );
}

// Reusable DocumentCard component
interface DocumentCardProps {
  document: Document;
  onUpload: (documentId: string, file: File) => void;
  uploading: boolean;
}

function DocumentCard({ document, onUpload, uploading }: DocumentCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError(null);

    const maxFileSizeMB = document.maxFileSizeMB || 10;
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      setValidationError(`File too large. Maximum size: ${maxFileSizeMB}MB`);
      return;
    }

    const ext = file.name.split('.').pop()?.toUpperCase();
    const acceptedFormats = document.acceptedFormats || ['PDF', 'JPG', 'JPEG', 'PNG'];
    if (!ext || !acceptedFormats.includes(ext)) {
      setValidationError(
        `Invalid file type. Accepted formats: ${acceptedFormats.join(', ')}`
      );
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile && !validationError) {
      onUpload(document.id, selectedFile);
      setSelectedFile(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">{document.name}</h4>
            {document.required && (
              <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded">
                Required
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{document.description}</p>
          <p className="text-xs text-gray-400 mt-1">
            Accepted: {(document.acceptedFormats || ['PDF', 'JPG', 'JPEG', 'PNG']).join(', ')} | Max: {document.maxFileSizeMB || 10}MB
          </p>
        </div>

        {document.uploaded && (
          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full ml-3">
            Uploaded
          </span>
        )}
      </div>

      {!document.uploaded && (
        <div className="space-y-2">
          <input
            type="file"
            accept={(document.acceptedFormats || ['PDF', 'JPG', 'JPEG', 'PNG']).map((f) => `.${f.toLowerCase()}`).join(',')}
            onChange={handleFileSelect}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />

          {validationError && (
            <p className="text-sm text-red-600">{validationError}</p>
          )}

          {selectedFile && !validationError && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
              </span>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          )}
        </div>
      )}

      {document.uploaded && document.fileUrl && (
        <a
          href={document.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mt-1"
        >
          View uploaded file →
        </a>
      )}
    </div>
  );
}
