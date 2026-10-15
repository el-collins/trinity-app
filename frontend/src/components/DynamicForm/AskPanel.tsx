'use client';

import { useState } from 'react';

interface Citation {
  id: number;
  docTitle: string;
  page: number;
}

interface AskResponse {
  answer: string;
  citations: Citation[];
  abstained: boolean;
}

export default function AskPanel({ loanTypeId, fieldId }: { loanTypeId: string; fieldId?: string }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AskResponse | null>(null);

  if (process.env.NEXT_PUBLIC_ENABLE_RAG !== 'true') return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/rag/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanTypeId, question, ...(fieldId ? { fieldId } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Could not reach the server. The form still works; please try again later.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800"
        aria-expanded={open}
      >
        Have a question about this loan?
      </button>
      {open && (
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={submit} className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={500}
              placeholder="Ask about terms, eligibility, documents..."
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
              aria-label="Your question"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {loading ? 'Thinking...' : 'Ask'}
            </button>
          </form>
          <p className="mt-2 text-xs text-gray-500">
            Please do not enter your SSN or other sensitive personal information here.
          </p>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {result && (
            <div className="mt-3 text-sm text-gray-800">
              <p className={result.abstained ? 'text-gray-600' : ''}>{result.answer}</p>
              {result.citations.length > 0 && (
                <ul className="mt-2 text-xs text-gray-500">
                  {result.citations.map((c) => (
                    <li key={c.id}>
                      [doc {c.id}] {c.docTitle}
                      {c.page > 0 ? `, page ${c.page}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
