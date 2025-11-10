'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false });

type Clause = { id: string; title?: string; template: string };

type Doc = {
  id: string;
  title: string;
  slug: string;
  jurisdiction: 'uk-ew' | 'uk-sc' | 'uk-ni' | string;
  status: string;
  locked_at: string | null;
  content: Record<string, any> | null;
  html: string | null;
  blueprint?: {
    fields?: Array<any>;
    clauses?: Clause[];
  } | null;
};

export default function EditDocumentPage() {
  const params = useParams<{ id: string }>();
  const id = useMemo(() => {
    const v = (params as any)?.id;
    return typeof v === 'string' ? v : Array.isArray(v) ? v[0] : '';
  }, [params]);

  const router = useRouter();
  const sp = useSearchParams();

  // If someone hits /edit without mode, normalize the URL to ?mode=rich (no flicker)
  useEffect(() => {
    if (!sp) return;
    const mode = sp.get('mode');
    if (mode !== 'rich') {
      const q = new URLSearchParams(sp.toString());
      q.set('mode', 'rich');
      router.replace(`?${q.toString()}`, { scroll: false });
    }
  }, [sp, router]);

  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Rich-only state
  const [editorHtml, setEditorHtml] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Load document (+ blueprint) then seed the rich editor
  useEffect(() => {
    if (!id) return;
    let on = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`/api/documents/${id}`, { cache: 'no-store' });
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error ?? 'Failed to load document');
        const d: Doc = json.item;

        if (on) {
          setDoc(d);
          // Prefer saved HTML; if absent and there are clauses + content, you could render them here.
          setEditorHtml(d.html ?? '');
        }
      } catch (e: any) {
        if (on) setErr(e?.message ?? 'Failed to load');
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => {
      on = false;
    };
  }, [id]);

  const locked = !!doc?.locked_at;

  const onSave = async () => {
    if (!id) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/documents/${id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // Rich-only: persist just the final HTML; keep content JSON as-is (or null)
        body: JSON.stringify({ html: editorHtml }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? res.statusText);
      alert('Saved!');
      router.refresh();
    } catch (e: any) {
      alert(`Save failed: ${e?.message ?? 'unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const onLock = async () => {
    if (!id) return;
    if (!confirm('Lock this document? You will not be able to edit after locking.')) return;
    const res = await fetch(`/api/documents/${id}/lock`, { method: 'POST' });
    const json = await res.json();
    if (json.ok) {
      alert(`Locked at ${new Date(json.locked_at).toLocaleString()}`);
      router.refresh();
    } else {
      alert(json.error ?? 'Lock failed');
    }
  };

  if (!id) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold">Invalid route</h1>
        <p className="mt-2 text-red-600">Missing document id in URL.</p>
      </section>
    );
  }

  if (loading) {
    return <section className="max-w-6xl mx-auto px-4 py-10">Loading…</section>;
  }
  if (err || !doc) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold">Unable to open document</h1>
        <p className="mt-2 text-red-600">{err ?? 'Unknown error'}</p>
      </section>
    );
  }
  if (locked) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">{doc.title}</h1>
        <p className="mt-2 text-sm text-neutral-600">
          This document is locked and cannot be edited.{' '}
          <a className="text-blue-600 underline" href={`/document/${doc.id}`}>Back to view</a>
        </p>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Edit: {doc.title}</h1>
        <a className="ml-auto text-blue-600 underline" href={`/document/${doc.id}`}>View</a>
      </div>

      {/* Rich-only editor */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p className="text-xs text-neutral-500 mb-2">
            You are editing the final HTML of this document.
          </p>
          <RichEditor value={editorHtml} onChange={setEditorHtml} placeholder="Start writing…" />

          <div className="mt-4 flex items-center gap-2">
            <button
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
              onClick={onSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button className="rounded bg-red-600 px-4 py-2 text-white" onClick={onLock}>
              Lock
            </button>
          </div>
        </div>

        {/* Live preview mirrors the HTML */}
        <div>
          <h2 className="text-lg font-semibold">Preview</h2>
          <div
            className="mt-2 prose max-w-none bg-white p-4 rounded border"
            dangerouslySetInnerHTML={{ __html: editorHtml }}
          />
        </div>
      </div>
    </section>
  );
}
