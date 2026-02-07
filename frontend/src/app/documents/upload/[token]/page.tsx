'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface TokenData {
  valid: boolean;
  applicationId: string;
  email: string;
  loanTypeId: string;
}

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

export default function DocumentUploadPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [workbooks, setWorkbooks] = useState<WorkbookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);

  useEffect(() => {
    validateTokenAndFetchDocuments();
  }, [token]);

  const validateTokenAndFetchDocuments = async () => {
    try {
      // Validate token
      const tokenResponse = await fetch(`/api/documents/validate-token?token=${token}`);
      const tokenResult = await tokenResponse.json();

      if (!tokenResult.valid) {
        setError('Invalid or expired upload link. Please contact support.');
        setLoading(false);
        return;
      }

      setTokenData(tokenResult);

      // Only fetch documents and workbooks if loanTypeId is available
      if (tokenResult.loanTypeId) {
        // Fetch required documents and workbook templates in parallel
        const [docsResponse, workbooksResponse] = await Promise.all([
          fetch(`/api/documents/required?loanTypeId=${tokenResult.loanTypeId}`),
          fetch(`/api/documents/workbooks?loanTypeId=${tokenResult.loanTypeId}`),
        ]);

        const docsResult = await docsResponse.json();
        if (docsResult.documents && Array.isArray(docsResult.documents)) {
          // Ensure each document has required properties with defaults
          const sanitizedDocs = docsResult.documents.map((doc: Document) => ({
            ...doc,
            acceptedFormats: doc.acceptedFormats || ['PDF', 'JPG', 'JPEG', 'PNG'],
            maxFileSizeMB: doc.maxFileSizeMB || 10,
            required: doc.required ?? true,
          }));
          setDocuments(sanitizedDocs);
        }

        // Fetch workbook templates
        if (workbooksResponse.ok) {
          const workbooksResult = await workbooksResponse.json();
          setWorkbooks(workbooksResult);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading document upload page:', err);
      setError('Failed to load upload page. Please try again.');
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentId: string, file: File) => {
    setUploadingDocId(documentId);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('documentId', documentId);
      formData.append('file', file);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Update document status
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
    if (!tokenData?.email) {
      setError('Unable to send reminder - email not found');
      return;
    }

    setSendingReminder(true);
    setError(null);

    try {
      const response = await fetch('/api/documents/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email: tokenData.email,
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !tokenData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Link</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  const requiredDocs = documents.filter((d) => d.required);
  const optionalDocs = documents.filter((d) => !d.required);
  const uploadedRequired = requiredDocs.filter((d) => d.uploaded).length;
  const progress = requiredDocs.length > 0 ? (uploadedRequired / requiredDocs.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Your Documents
          </h1>
          <p className="text-gray-600">
            Application ID: <span className="font-mono">{tokenData?.applicationId}</span>
          </p>
          <p className="text-gray-600">
            Loan Type: <span className="font-semibold">{workbooks?.displayName || tokenData?.loanTypeId?.toUpperCase() || 'N/A'}</span>
          </p>
        </div>

        {/* Workbook Templates Section */}
        {workbooks && workbooks.workbooks.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 mb-6 border border-blue-200">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">📋</span>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Step 1: Complete Your Workbook{workbooks.workbooks.length > 1 ? 's' : ''}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Before uploading documents, please fill out the following template{workbooks.workbooks.length > 1 ? 's' : ''}.
                  Click each link to make a copy, then complete and share it with us.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="text-sm text-blue-800 font-medium mb-3">
                💡 <strong>Tip:</strong> When you open each Google Sheet link, click &quot;Make a Copy&quot; and make sure your copy is set to Shareable so we can view it.
              </p>

              <div className="space-y-3">
                {workbooks.workbooks.map((workbook, index) => (
                  <a
                    key={index}
                    href={workbook.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                  >
                    <span className="text-xl">📊</span>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-900 group-hover:text-blue-700">
                        {workbook.name}
                      </p>
                      <p className="text-sm text-gray-600">{workbook.description}</p>
                    </div>
                    <span className="text-blue-600 group-hover:text-blue-800 font-medium text-sm whitespace-nowrap">
                      Open Template →
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-500 mt-4 text-center">
              Once you&apos;ve completed your workbook{workbooks.workbooks.length > 1 ? 's' : ''}, paste the shareable link in the upload section below or download as PDF and upload.
            </p>
          </div>
        )}

        {/* Step 2 Header for Documents */}
        {workbooks && workbooks.workbooks.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📤</span>
            <h2 className="text-xl font-bold text-gray-900">Step 2: Upload Your Documents</h2>
          </div>
        )}

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress: {uploadedRequired} of {requiredDocs.length} required documents
            </span>
            <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Continue Later Option */}
          {progress < 100 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              {reminderSent ? (
                <div className="flex items-center gap-2 text-green-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">
                    Reminder sent to {tokenData?.email}! Check your inbox to continue later.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="text-sm text-gray-600">
                    Need to finish later? We&apos;ll email you a link to continue where you left off.
                  </p>
                  <button
                    onClick={handleSendReminder}
                    disabled={sendingReminder}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors"
                  >
                    {sendingReminder ? 'Sending...' : 'Email me a reminder'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Required Documents */}
        {requiredDocs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Required Documents
            </h2>
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
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Optional Documents (Recommended)
            </h2>
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

        {/* Success Message */}
        {progress === 100 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
            <div className="flex items-center">
              <span className="text-green-600 text-3xl mr-4">✓</span>
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  All Required Documents Uploaded!
                </h3>
                <p className="text-green-700">
                  Thank you! We'll review your documents and contact you soon.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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

    // Validate file size
    const maxFileSizeMB = document.maxFileSizeMB || 10;
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      setValidationError(`File too large. Maximum size: ${maxFileSizeMB}MB`);
      return;
    }

    // Validate file type (if acceptedFormats is defined)
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{document.name}</h3>
            {document.required && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                Required
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{document.description}</p>
          <p className="text-xs text-gray-500">
            Accepted: {(document.acceptedFormats || ['PDF', 'JPG', 'JPEG', 'PNG']).join(', ')} • Max: {document.maxFileSizeMB || 10}MB
          </p>
        </div>

        {document.uploaded && (
          <div className="ml-4">
            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              ✓ Uploaded
            </span>
          </div>
        )}
      </div>

      {!document.uploaded && (
        <div className="space-y-3">
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
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
              </span>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          View uploaded file →
        </a>
      )}
    </div>
  );
}
