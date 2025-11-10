import * as React from 'react';
import { headers } from 'next/headers';

export const runtime = 'nodejs';

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // Next 16: params is a Promise

  // Build absolute URL from request headers
  const hdrs = await headers();
  const host = hdrs.get('host')!;
  const proto = hdrs.get('x-forwarded-proto') ?? 'http';
  const baseUrl = `${proto}://${host}`;

  // Use absolute URL for server fetch
  const res = await fetch(`${baseUrl}/api/documents/${id}`, {
    cache: 'no-store',
    // Forward cookies so the API sees your Clerk session (some adapters need this)
    headers: {
      cookie: hdrs.get('cookie') ?? '',
    },
  });

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold">Document not available</h1>
        <p className="mt-2 text-sm text-red-600">
          Unexpected response from API (content-type {contentType}). You may be
          signed out or middleware matched this route by mistake.
        </p>
      </section>
    );
  }

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.ok) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold">Document not found</h1>
        <p className="mt-2 text-sm text-neutral-600">ID: {id}</p>
      </section>
    );
  }

  const d = json.item as {
    id: string;
    title: string;
    slug: string;
    jurisdiction: string;
    status: string;
    locked_at: string | null;
    content: Record<string, any> | null;
    html: string | null;
  };

  return (
    <section className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold">{d.title}</h1>
      <p className="text-sm text-neutral-600 mt-1">
        ID: <span className="font-mono">{d.id}</span> · Jurisdiction:{' '}
        <span className="font-mono">{d.jurisdiction}</span> · Status:{' '}
        <span className="font-mono">{d.status}</span>
      </p>

      {d.html ? (
        <div
          className="mt-6 prose max-w-none bg-white p-4 rounded border"
          dangerouslySetInnerHTML={{ __html: d.html }}
        />
      ) : (
        <pre className="mt-6 text-xs bg-neutral-50 p-3 rounded border overflow-x-auto">
          {JSON.stringify(d.content ?? { note: 'No content' }, null, 2)}
        </pre>
      )}

      <div className="mt-4 text-sm">
        <a className="text-blue-600 underline" href={`/document/${d.id}/edit`}>
          Edit
        </a>
        <span className="mx-1">·</span>
        <a className="text-blue-600 underline" href={`/api/documents/${d.id}/export`}>
          Export
        </a>
      </div>
    </section>
  );
}
