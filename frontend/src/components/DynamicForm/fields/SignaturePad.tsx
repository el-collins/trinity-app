'use client';

import { useState, useRef } from 'react';
import { FormField } from '@/lib/types/schema';

interface SignaturePadProps {
  field: FormField;
  value: string;
  error?: string | null;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export default function SignaturePad({ field, value, error, onChange, onBlur }: SignaturePadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>(value || '');
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        console.log('[SignaturePad] Setting signature value, length:', base64String?.length);
        setPreview(base64String);
        onChange(base64String);
        setUploading(false);

        // Don't call onBlur here - it triggers validation before state updates
        // Validation will run when user clicks Next button
      };
      reader.onerror = () => {
        alert('Failed to read file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading signature:', err);
      alert('Failed to upload signature');
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {field.helpText && (
        <p className="text-sm text-gray-500 mb-3">{field.helpText}</p>
      )}

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
        {preview ? (
          /* Preview uploaded signature */
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <img
                src={preview}
                alt="Signature"
                className="max-h-32 mx-auto"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-600 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Signature uploaded
              </p>
              <button
                type="button"
                onClick={handleRemove}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          /* Upload button */
          <div className="text-center">
            <input
              ref={fileInputRef}
              type="file"
              id={field.id}
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor={field.id}
              className={`cursor-pointer inline-flex flex-col items-center ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg
                className="w-12 h-12 text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              {uploading ? (
                <p className="text-sm text-gray-600">Uploading...</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="text-blue-600 font-medium">Click to upload</span> your signature
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, or GIF (max 5MB)
                  </p>
                </>
              )}
            </label>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      <p className="mt-2 text-xs text-gray-500">
        💡 Tip: Take a photo of your signature on paper, or use a digital signature you've created
      </p>
    </div>
  );
}
