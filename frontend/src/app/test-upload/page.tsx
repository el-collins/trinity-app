'use client';

import { useState } from 'react';

export default function TestUploadPage() {
  const [token, setToken] = useState('');
  const [documentId, setDocumentId] = useState('drivers_license_front');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Test generate token
  const handleGenerateToken = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/documents/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: 'test123',
          email: 'test@example.com',
          loanTypeId: 'sba'
        })
      });
      const data = await response.json();
      setResult(data);
      if (data.token) {
        setToken(data.token);
      }
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  // Test validate token
  const handleValidateToken = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/documents/validate-token?token=${token}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  // Test upload document
  const handleUpload = async () => {
    if (!file || !token) {
      alert('Please select a file and generate a token first');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('documentId', documentId);
      formData.append('file', file);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  // Test get required documents
  const handleGetRequired = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/documents/required?loanTypeId=sba');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Document Upload API Test Page</h1>

        {/* Test 1: Get Required Documents */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">1. Get Required Documents</h2>
          <button
            onClick={handleGetRequired}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Get Required Docs for SBA
          </button>
        </div>

        {/* Test 2: Generate Token */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">2. Generate Upload Token</h2>
          <button
            onClick={handleGenerateToken}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Generate Token
          </button>
          {token && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <p className="text-sm font-mono break-all">{token}</p>
            </div>
          )}
        </div>

        {/* Test 3: Validate Token */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">3. Validate Token</h2>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste token here"
            className="w-full px-3 py-2 border rounded mb-4"
          />
          <button
            onClick={handleValidateToken}
            disabled={loading || !token}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Validate Token
          </button>
        </div>

        {/* Test 4: Upload Document */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">4. Upload Document</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Document Type:</label>
            <select
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="drivers_license_front">Driver's License (Front)</option>
              <option value="drivers_license_back">Driver's License (Back)</option>
              <option value="bank_statement_ytd">Bank Statement YTD</option>
              <option value="tax_return_current">Tax Return (Current)</option>
              <option value="voided_check">Voided Check</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select File:</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={loading || !file || !token}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
          >
            Upload Document
          </button>
        </div>

        {/* Results */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Response:</h2>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : result ? (
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500">No results yet. Try testing an endpoint above.</p>
          )}
        </div>
      </div>
    </div>
  );
}
