// src/app/(app)/document/[id]/edit/page.tsx
'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { renderClausesToHtml } from '@/lib/render';
import dynamic from 'next/dynamic';

const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false });

type Clause = { id: string; title?: string; template: string };

type Blueprint = {
  title: string;
  jurisdiction: 'uk-ew' | 'uk-sc' | 'uk-ni' | string;
  slug: string;
  fields?: Array<
    | { id: string; label: string; type: 'text' | 'textarea' | 'date'; required?: boolean; placeholder?: string; help?: string }
    | { id: string; label: string; type: 'select'; required?: boolean; options: string[]; help?: string }
    | { id: string; label: string; type: 'checkbox'; required?: boolean; help?: string }
  >;
  clauses?: Clause[];
};

type Doc = {
  id: string;
  title: string;
  slug: string;
  jurisdiction: 'uk-ew' | 'uk-sc' | 'uk-ni' | string;
  status: string;
  locked_at: string | null;
  content: Record<string, any> | null;
  html: string | null;
};

export default function EditDocumentPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [doc, setDoc] = useState<Doc | null>(null);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Working copies
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [jsonText, setJsonText] = useState<string>('{}');
  const [editorHtml, setEditorHtml] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Mode: 'form' | 'json' | 'rich'
  const modeParam = sp.get('mode');
  const mode: 'form' | 'json' | 'rich' =
    modeParam === 'json' ? 'json' : modeParam === 'rich' ? 'rich' : 'form';

  // Load document, then blueprint
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        if (!id) return;
        setLoading(true);
        setErr(null);

        // 1) Fetch document (raw doc JSON)
        const docRes = await fetch(`/api/documents/${id}`, { cache: 'no-store', credentials: 'include' });
        if (docRes.status === 401) {
          // bounce to sign-in preserving return
          window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          return;
        }
        if (!docRes.ok) {
          const j = await docRes.json().catch(() => ({}));
          throw new Error(j?.error ?? `Failed to load document (${docRes.status})`);
        }
        const d: Doc = await docRes.json();

        // 2) Fetch blueprint for this doc
        const bpRes = await fetch(`/api/blueprints/${d.jurisdiction}/${d.slug}`, {
          cache: 'no-store',
          credentials: 'include',
        });
        if (!bpRes.ok) {
          const j = await bpRes.json().catch(() => ({}));
          throw new Error(j?.error ?? `Blueprint ${d.jurisdiction}/${d.slug} not found`);
        }
        const bp: Blueprint = await bpRes.json();

        if (!on) return;

        setDoc(d);
        setBlueprint(bp);

        const initialAnswers = (d.content ?? {}) as Record<string, any>;
        setAnswers(initialAnswers);
        setJsonText(JSON.stringify(initialAnswers, null, 2));
        setEditorHtml(d.html ?? '');
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

  // Live preview (for Form/JSON modes) via blueprint clauses
  const liveHtml = useMemo(() => {
    const clauses = blueprint?.clauses ?? [];
    return renderClausesToHtml(clauses, answers);
  }, [blueprint?.clauses, answers]);

  const onSave = async () => {
    try {
      if (!id || !doc) return;
      setSaving(true);

      // Decide the payload + html based on mode
      let contentToSave: Record<string, any> = answers;
      let htmlToSave: string | null = null;

      if (mode === 'json') {
        try {
          contentToSave = JSON.parse(jsonText || '{}');
        } catch {
          alert('Invalid JSON');
          return;
        }
        htmlToSave = blueprint?.clauses ? renderClausesToHtml(blueprint.clauses, contentToSave) : null;
      } else if (mode === 'form') {
        htmlToSave = blueprint?.clauses ? renderClausesToHtml(blueprint.clauses, contentToSave) : null;
      } else {
        htmlToSave = editorHtml ?? '';
      }

      const res = await fetch(`/api/documents/${id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: contentToSave, html: htmlToSave }),
      });

      const j = await res.json().catch(() => ({} as any));
      if (res.status === 401) {
        window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
      if (!res.ok || j?.error) {
        throw new Error(j?.error ?? res.statusText);
      }

      // Keep local state in sync
      setAnswers(contentToSave);
      setJsonText(JSON.stringify(contentToSave, null, 2));
      if (mode !== 'rich' && htmlToSave != null) setEditorHtml(htmlToSave);

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
    const res = await fetch(`/api/documents/${id}/lock`, { method: 'POST', credentials: 'include' });
    const json = await res.json().catch(() => ({} as any));
    if (res.status === 401) {
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }
    if (json.ok) {
      alert(`Locked at ${new Date(json.locked_at).toLocaleString()}`);
      router.refresh();
    } else {
      alert(json.error ?? 'Lock failed');
    }
  };

  const renderForm = () => {
    const fields = blueprint?.fields ?? [];
    if (!fields.length) {
      return <p className="text-sm text-neutral-600">No form schema in blueprint — try JSON or Rich modes.</p>;
    }
    return (
      <div className="space-y-5">
        {fields.map((f: any) => {
          const val = answers?.[f.id];
          const help: string | undefined = f.help;

          if (f.type === 'text') {
            return (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-sm font-medium">
                  {f.label} {f.required && <span className="text-red-600">*</span>}
                </label>
                <input
                  id={f.id}
                  type="text"
                  placeholder={f.placeholder}
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={val ?? ''}
                  onChange={(e) => setAnswers((p) => ({ ...p, [f.id]: e.target.value }))}
                />
                {help && <p className="mt-1 text-xs text-neutral-500">{help}</p>}
              </div>
            );
          }

          if (f.type === 'textarea') {
            return (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-sm font-medium">
                  {f.label} {f.required && <span className="text-red-600">*</span>}
                </label>
                <textarea
                  id={f.id}
                  placeholder={f.placeholder}
                  rows={5}
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={val ?? ''}
                  onChange={(e) => setAnswers((p) => ({ ...p, [f.id]: e.target.value }))}
                />
                {help && <p className="mt-1 text-xs text-neutral-500">{help}</p>}
              </div>
            );
          }

          if (f.type === 'date') {
            return (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-sm font-medium">
                  {f.label} {f.required && <span className="text-red-600">*</span>}
                </label>
                <input
                  id={f.id}
                  type="date"
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={val ?? ''}
                  onChange={(e) => setAnswers((p) => ({ ...p, [f.id]: e.target.value }))}
                />
                {help && <p className="mt-1 text-xs text-neutral-500">{help}</p>}
              </div>
            );
          }

          if (f.type === 'select') {
            return (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-sm font-medium">
                  {f.label} {f.required && <span className="text-red-600">*</span>}
                </label>
                <select
                  id={f.id}
                  className="mt-1 w-full rounded border px-3 py-2 bg-white"
                  value={(val ?? '') as string}
                  onChange={(e) => setAnswers((p) => ({ ...p, [f.id]: e.target.value }))}
                >
                  <option value="" disabled>
                    {f.required ? 'Select…' : 'Optional'}
                  </option>
                  {f.options.map((opt: string) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {help && <p className="mt-1 text-xs text-neutral-500">{help}</p>}
              </div>
            );
          }

          if (f.type === 'checkbox') {
            return (
              <label key={f.id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={!!val}
                  onChange={(e) => setAnswers((p) => ({ ...p, [f.id]: e.target.checked }))}
                />
                <span className="text-sm">
                  {f.label} {f.required && <span className="text-red-600">*</span>}
                  {help && <p className="mt-1 text-xs text-neutral-500">{help}</p>}
                </span>
              </label>
            );
          }

          return (
            <div key={f.id} className="text-xs text-neutral-500">
              Unsupported field type: <code>{String((f as any).type)}</code>
            </div>
          );
        })}
      </div>
    );
  };

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
          <a className="text-blue-600 underline" href={`/document/${doc.id}`}>
            Back to view
          </a>
        </p>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Edit: {doc.title}</h1>
        <a className="ml-auto text-blue-600 underline" href={`/document/${doc.id}`}>
          View
        </a>
      </div>

      {/* Mode switch */}
      <div className="mt-4 flex gap-4 text-sm">
        <a href={`?mode=form`} className={`underline ${mode === 'form' ? 'font-semibold' : ''}`}>
          Form
        </a>
        <a href={`?mode=json`} className={`underline ${mode === 'json' ? 'font-semibold' : ''}`}>
          JSON
        </a>
        <a href={`?mode=rich`} className={`underline ${mode === 'rich' ? 'font-semibold' : ''}`}>
          Rich
        </a>
      </div>

      {/* Editors */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {mode === 'json' && (
            <>
              <label className="block text-sm font-medium">Payload JSON</label>
              <textarea
                className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs"
                rows={18}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
              />
            </>
          )}

          {mode === 'form' && renderForm()}

          {mode === 'rich' && (
            <>
              <p className="text-xs text-neutral-500 mb-2">
                This edits the final HTML directly (not the answers JSON).
              </p>
              <RichEditor value={editorHtml} onChange={setEditorHtml} placeholder="Start writing…" />
            </>
          )}

          <div className="mt-4 flex items-center gap-2">
            <button
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
              onClick={onSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {!locked && (
              <button className="rounded bg-red-600 px-4 py-2 text-white" onClick={onLock}>
                Lock
              </button>
            )}
          </div>
        </div>

        {/* Live preview (for form/json). For rich mode, the editor itself is WYSIWYG */}
        <div>
          <h2 className="text-lg font-semibold">Preview</h2>
          {mode === 'rich' ? (
            <div
              className="mt-2 prose max-w-none bg-white p-4 rounded border"
              dangerouslySetInnerHTML={{ __html: editorHtml }}
            />
          ) : (
            <div
              className="mt-2 prose max-w-none bg-white p-4 rounded border"
              dangerouslySetInnerHTML={{ __html: liveHtml }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
