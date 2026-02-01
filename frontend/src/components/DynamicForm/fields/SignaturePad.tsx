'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { FormField } from '@/lib/types/schema';

interface SignaturePadProps {
  field: FormField;
  value: string; // Base64 data URL
  error?: string | null;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export default function SignaturePad({ field, value, error, onChange, onBlur }: SignaturePadProps) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 200 });

  // Resize canvas to fit container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth - 4; // Account for border
        setCanvasSize({ width: Math.max(width, 300), height: 200 });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Load existing signature if value exists
  useEffect(() => {
    if (value && signatureRef.current && isEmpty) {
      // Create an image and draw it on the canvas
      const img = new Image();
      img.onload = () => {
        const canvas = signatureRef.current?.getCanvas();
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Clear canvas first
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Draw the loaded image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setIsEmpty(false);
          }
        }
      };
      img.src = value;
    }
  }, [value, isEmpty]);

  const handleEnd = useCallback(() => {
    if (signatureRef.current) {
      const isCanvasEmpty = signatureRef.current.isEmpty();
      setIsEmpty(isCanvasEmpty);

      if (!isCanvasEmpty) {
        const dataUrl = signatureRef.current.toDataURL('image/png');
        console.log('[SignaturePad] Signature captured, length:', dataUrl.length);
        onChange(dataUrl);
      }
    }
  }, [onChange]);

  const handleClear = useCallback(() => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setIsEmpty(true);
      onChange('');
      console.log('[SignaturePad] Signature cleared');
    }
  }, [onChange]);

  return (
    <div className="w-full">
      <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {field.helpText && (
        <p className="text-sm text-gray-500 mb-3">{field.helpText}</p>
      )}

      {/* Authorization Consent Agreement */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Authorization & Consent Agreement</h4>
        <div className="text-xs text-gray-600 space-y-2">
          <p>
            By signing below, I certify that all information provided in this application is true and complete to the best of my knowledge. I understand that any false statements or omissions may result in denial of the application or termination of any resulting agreement.
          </p>
          <p>
            <strong>Credit Authorization:</strong> I authorize Trinity Finance and its designated agents to obtain my credit report and verify all information provided in this application, including but not limited to employment, bank accounts, and business records. This authorization extends to obtaining credit reports at any time during the application process and the term of any resulting agreement.
          </p>
          <p>
            <strong>Communication Consent:</strong> I consent to be contacted by Trinity Finance, its affiliates, and partners via telephone, email, SMS/text message, and mail at the contact information provided, including for marketing purposes. I understand I may opt out of marketing communications at any time.
          </p>
          <p>
            <strong>Electronic Signature Consent:</strong> I agree that my electronic signature below has the same legal effect as a handwritten signature. I consent to conduct this transaction electronically and to receive disclosures and notices electronically.
          </p>
          <p>
            <strong>Information Sharing:</strong> I authorize Trinity Finance to share my application information with potential lenders, funding partners, and service providers as necessary to process my application and provide financing options.
          </p>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`relative border-2 rounded-lg bg-white overflow-hidden ${
          error ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'
        } transition-colors`}
      >
        {/* Signature Canvas */}
        <SignatureCanvas
          ref={signatureRef}
          canvasProps={{
            width: canvasSize.width,
            height: canvasSize.height,
            className: 'touch-none',
            style: {
              width: '100%',
              height: '200px',
              display: 'block',
              cursor: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'%3E%3Cline x1=\'12\' y1=\'0\' x2=\'12\' y2=\'24\' stroke=\'%23000\' stroke-width=\'1.5\'/%3E%3Cline x1=\'0\' y1=\'12\' x2=\'24\' y2=\'12\' stroke=\'%23000\' stroke-width=\'1.5\'/%3E%3C/svg%3E") 12 12, crosshair',
            },
          }}
          penColor="#000000"
          backgroundColor="rgb(255, 255, 255)"
          onEnd={handleEnd}
          dotSize={1}
          minWidth={1.5}
          maxWidth={3}
          velocityFilterWeight={0.7}
        />

        {/* Placeholder text when empty */}
        {isEmpty && !value && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <svg
                className="w-8 h-8 text-gray-300 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              <span className="text-gray-400 text-sm">Draw your signature here</span>
            </div>
          </div>
        )}

        {/* Signature line */}
        <div className="absolute bottom-10 left-6 right-6 border-b border-gray-300"></div>
        <div className="absolute bottom-4 left-6 text-xs text-gray-400 font-medium">
          Sign above the line
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-3">
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        >
          <svg
            className="w-4 h-4 mr-1.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Clear
        </button>

        {!isEmpty && (
          <span className="text-xs text-green-600 flex items-center gap-1.5 font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Signature captured
          </span>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <p className="mt-2 text-xs text-gray-500">
        Use your mouse or finger to sign in the box above
      </p>
    </div>
  );
}
