'use client';

import { FormField } from '@/lib/types/schema';
import { useDropzone, FileRejection } from 'react-dropzone';
import { useState } from 'react';

interface WorkbookUploadProps {
  field: FormField;
  value: string;
  error?: string | null;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

/**
 * WorkbookUpload component for collecting workbook documents during the application
 * Supports both:
 * 1. Pasting a Google Sheets URL (for completed workbook)
 * 2. Uploading a file (PDF, Excel, etc.)
 *
 * Also displays a template link if provided in field metadata
 */
export default function WorkbookUpload({ field, value, error, onChange, onBlur }: WorkbookUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'url' | 'file'>('url');

  // Extract template URL from field metadata if available
  const templateUrl = (field as any).templateUrl || (field as any).metadata?.templateUrl;
  const templateName = (field as any).templateName || field.label;

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    onChange(url);
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldId', field.id);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();
      onChange(url);
    } catch (err) {
      setUploadError('Failed to upload file. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'image/*': ['.jpg', '.jpeg', '.png'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    noClick: inputMode === 'url',
    noDrag: inputMode === 'url',
  });

  const hasValue = value && value.trim() !== '';
  const isUploadedFile = hasValue && !value.startsWith('http://') && !value.startsWith('https://');
  const isPastedUrl = hasValue && (value.startsWith('http://') || value.startsWith('https://'));

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {field.helpText && (
        <p className="text-sm text-gray-500 mb-3">{field.helpText}</p>
      )}

      {/* Template Link */}
      {templateUrl && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">📊</span>
            <div className="flex-1">
              <p className="text-sm text-blue-800">
                <strong>Need the template?</strong>
                <a
                  href={templateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800 underline"
                >
                  Open {templateName} Template →
                </a>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Click &quot;Make a Copy&quot; to create your own version, then share the link below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Input Mode Toggle */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setInputMode('url')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            inputMode === 'url'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Paste Link
        </button>
        <button
          type="button"
          onClick={() => setInputMode('file')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            inputMode === 'file'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Upload File
        </button>
      </div>

      {/* URL Input Mode */}
      {inputMode === 'url' && (
        <div>
          <input
            type="url"
            id={field.id}
            value={value || ''}
            onChange={handleUrlChange}
            onBlur={onBlur}
            placeholder="Paste your Google Sheets or document link here..."
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              error ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
          />
          {isPastedUrl && isValidUrl(value) && (
            <div className="mt-2 flex items-center gap-2 text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">Link saved</span>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline ml-2"
              >
                Preview →
              </a>
            </div>
          )}
        </div>
      )}

      {/* File Upload Mode */}
      {inputMode === 'file' && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : error
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />

          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : isUploadedFile ? (
            <div className="flex flex-col items-center">
              <svg className="w-10 h-10 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-600 font-medium mb-1">File uploaded</p>
              <p className="text-xs text-gray-500 break-all max-w-full">{value.split('/').pop()}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="mt-2 text-sm text-red-600 hover:underline"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div>
              <svg className="mx-auto h-10 w-10 text-gray-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {isDragActive ? (
                <p className="text-sm text-blue-600">Drop the file here...</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-1">
                    Drag & drop or click to upload
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, Excel, CSV, or images (max 10MB)
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {(error || uploadError) && (
        <p className="mt-2 text-sm text-red-600">{error || uploadError}</p>
      )}
    </div>
  );
}
