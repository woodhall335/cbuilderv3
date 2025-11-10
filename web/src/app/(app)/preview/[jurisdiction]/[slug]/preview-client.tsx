'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { renderClausesToHtml } from '@/lib/render';

type Blueprint = {
  title: string;
  jurisdiction: 'uk-ew' | 'uk-sc' | 'uk-ni';
  slug: string;
  clauses?: Array<{ id: string; title?: string; template: string }>;
};

export default function PreviewClient({
  jurisdiction,
  slug,
}: {
  jurisdiction: string;
  slug: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const payloadParam = sp.get('payload');

  // Fallback: derive from /preview/<jurisdiction>/<slug>
  const [routeJurisdiction, routeSlug] = React.useMemo(() => {
    const parts = (pathname || '').split('/').filter(Boolean); // ["preview","uk-ew","ast-tenancy"]
    if (parts[0] === 'preview' && parts.length >= 3) return [parts[1], parts[2]];
    return [undefined, undefined];
  }, [pathname]);

  const J = jurisdiction || routeJurisdiction || '';
  const S = slug || routeSlug || '';

  const payload = useMemo(() => {
    try {
      if (!payloadParam) return null;
      const maybeDecoded =
        payloadParam.includes('%7B') || payloadParam.includes('%22')
          ? decodeURIComponent(payloadParam)
          : payloadParam;
      return JSON.parse(maybeDecoded);
    } catch {
      return null;
    }
  }, [payloadParam]);

  const [bp, setBp] = useState<Blueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      if (!J || !S) {
        setErr('Missing jurisdiction or slug in route.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`/api/blueprints/${J}/${S}`, {
          cache: 'no-store',
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`Blueprint ${J}/${S} not found`);
        const json: Blueprint = await res.json();
        if (on) setBp(json);
      } catch (e: any) {
        if (on) setErr(e?.message ?? 'Failed to load blueprint');
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => {
      on = false;
    };
  }, [J, S]);

  if (loading) return <p className="mt-4 text-sm text-neutral-600">Loading preview…</p>;
  if (err) return <p className="mt-4 text-sm text-red-600">{err}</p>;

  const hasClauses = (bp?.clauses?.length ?? 0) > 0;
  const html = hasClauses ? renderClausesToHtml(bp!.clauses!, payload ?? {}) : '';

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);

      const body = {
        jurisdiction: J,
        slug: S,
        blueprint: S,       // extra alias to be safe
        title: bp?.title ?? S,
        payload: payload ?? {},
      };

      // Optional one-time debug
      // console.log('init body =>', body);

      const res = await fetch('/api/documents/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        const back =
          typeof window !== 'undefined' ? window.location.href : `/preview/${J}/${S}`;
        window.location.href = `/sign-in?redirect_url=${encodeURIComponent(back)}`;
        return;
      }

      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || !json?.ok) {
        const msg = json?.error ?? res.statusText ?? 'unknown';
        alert(`Failed to create draft: ${msg}`);
        return;
      }

      const newId: string | undefined = json.id;
      if (newId) {
        router.push(`/document/${newId}`);
        return;
      }

      const lockStr = json.lockAt ? ` (locks ${new Date(json.lockAt).toUTCString()})` : '';
      alert(`Draft created!${lockStr}`);
    } catch (e: any) {
      alert(`Failed: ${e?.message ?? 'unexpected error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {bp?.title ? (
        <p className="mt-2 text-sm text-neutral-700">
          Blueprint: <strong>{bp.title}</strong>
        </p>
      ) : null}

      <h2 className="font-semibold mt-6">First 2 pages (mocked renderer)</h2>

      {hasClauses ? (
        <div
          className="mt-3 prose max-w-none bg-white p-4 rounded border"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className="mt-3 text-sm text-neutral-600">This blueprint has no sample clauses to render yet.</p>
      )}

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer">Payload</summary>
        <pre className="mt-2 whitespace-pre-wrap text-xs">
{JSON.stringify(payload ?? { note: 'No payload supplied' }, null, 2)}
        </pre>
      </details>

      <form className="mt-6" onSubmit={onSave}>
        <button
          type="submit"
          className="mt-2 rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          disabled={isSaving || !J || !S}
          title={!J || !S ? 'Missing jurisdiction/slug in route' : undefined}
        >
          {isSaving ? 'Saving…' : 'Save & Start Lock (7 days)'}
        </button>
      </form>
    </>
  );
}
