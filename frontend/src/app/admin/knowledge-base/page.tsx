'use client';

import { useEffect, useState } from 'react';

interface Doc {
  id: string;
  title: string;
  filename: string;
  status: 'processing' | 'ready' | 'failed';
  error?: string;
  loanTypeIds: string[];
  chunkCount: number;
}

const LOAN_TYPES = ['sba', 'mca', 'line_of_credit', 'equipment_finance', 'invoice_factoring', 'invoice_financing', 'debt_relief', 'general'];

export default function KnowledgeBasePage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [title, setTitle] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/rag/documents')
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) setDocs((await res.json()).documents);
        else setMessage(res.status === 401 ? 'Please sign in as an admin.' : 'Could not load documents.');
      })
      .catch(() => {
        if (!cancelled) setMessage('Could not load documents.');
      });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim() || types.length === 0) return;
    setBusy(true);
    setMessage(null);
    const form = new FormData();
    form.append('file', file);
    form.append('title', title.trim());
    types.forEach((t) => form.append('loanTypeIds', t));
    const res = await fetch('/api/admin/rag/documents', { method: 'POST', body: form });
    const data = await res.json();
    setMessage(res.ok ? `Indexed ${data.chunks} chunks.` : data.error ?? 'Upload failed.');
    setBusy(false);
    if (res.ok) {
      setTitle('');
      setFile(null);
    }
    setRefresh((n) => n + 1);
  }

  async function remove(id: string) {
    if (!confirm('Delete this document and its indexed content?')) return;
    await fetch(`/api/admin/rag/documents/${id}`, { method: 'DELETE' });
    setRefresh((n) => n + 1);
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold">Knowledge base</h1>
      <form onSubmit={upload} className="mt-4 space-y-3 rounded border border-gray-200 p-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" className="w-full rounded border px-3 py-2 text-sm" />
        <input type="file" accept=".pdf,.docx,.txt,.md" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
        <fieldset className="flex flex-wrap gap-3 text-sm">
          {LOAN_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-1">
              <input type="checkbox" checked={types.includes(t)} onChange={(e) => setTypes(e.target.checked ? [...types, t] : types.filter((x) => x !== t))} />
              {t}
            </label>
          ))}
        </fieldset>
        <button disabled={busy || !file || !title.trim() || types.length === 0} className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">
          {busy ? 'Indexing...' : 'Upload and index'}
        </button>
        {message && <p className="text-sm text-gray-700">{message}</p>}
      </form>
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500"><th>Title</th><th>Loan types</th><th>Status</th><th>Chunks</th><th /></tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id} className="border-t">
              <td className="py-2">{d.title}<div className="text-xs text-gray-500">{d.filename}</div></td>
              <td>{d.loanTypeIds.join(', ')}</td>
              <td>{d.status}{d.error ? ` (${d.error})` : ''}</td>
              <td>{d.chunkCount}</td>
              <td><button onClick={() => remove(d.id)} className="text-red-600">Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
