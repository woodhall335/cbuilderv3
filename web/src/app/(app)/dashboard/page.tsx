// src/app/(app)/dashboard/page.tsx
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase';
import Link from 'next/link';

type Row = {
  id: string;
  title: string | null;
  slug: string | null;
  jurisdiction: string | null;
  status: string | null;
  locked_at: string | null;
  created_at: string | null;
  owner_id?: string | null;
};

export default async function Dashboard() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in?redirect_url=/dashboard');

  const supabase = await supabaseServer();

  // Primary: only your docs
  const { data: mine, error: mineErr } = await supabase
    .from('documents')
    .select('id, title, slug, jurisdiction, status, locked_at, created_at')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (mineErr) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-4">Your Documents</h1>
        <div className="p-3 rounded bg-red-50 text-red-700 text-sm">
          Failed to load documents: {mineErr.message}
        </div>
      </section>
    );
  }

  let items: Row[] = mine ?? [];
  let debugFallback = false;

  // Fallback (debug): if you have none, show last 3 for any owner to sanity-check rows
  if (items.length === 0) {
    const { data: any3 } = await supabase
      .from('documents')
      .select('id, title, slug, jurisdiction, status, locked_at, created_at, owner_id')
      .order('created_at', { ascending: false })
      .limit(3);

    if (any3 && any3.length > 0) {
      items = any3;
      debugFallback = true;
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold">Your Documents</h1>

      {debugFallback && (
        <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          Showing 3 most recent documents (debug view shows all owners if yours is empty).
          If you see your rows here but not in “Your Documents”, confirm each row’s <code>owner_id</code> equals your Clerk <code>userId</code>.
        </p>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Jurisdiction</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Lock</th>
              {debugFallback && <th className="py-2 pr-4">Owner (debug)</th>}
              <th className="py-2 pr-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="border-b">
                <td className="py-2 pr-4">{d.title ?? d.slug ?? d.id}</td>
                <td className="py-2 pr-4 font-mono">{d.jurisdiction ?? '—'}</td>
                <td className="py-2 pr-4">{d.status ?? '—'}</td>
                <td className="py-2 pr-4">
                  {d.locked_at ? new Date(d.locked_at).toLocaleString() : '—'}
                </td>
                {debugFallback && (
                  <td className="py-2 pr-4 font-mono">{(d as Row).owner_id ?? '—'}</td>
                )}
                <td className="py-2 pr-4">
                  <Link className="text-blue-600 underline" href={`/document/${d.id}`}>
                    View
                  </Link>
                  <span className="mx-1">·</span>
                  <a className="text-blue-600 underline" href={`/api/documents/${d.id}/export`}>
                    Export
                  </a>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="py-6 text-neutral-600" colSpan={debugFallback ? 6 : 5}>
                  No documents yet — create one via a wizard.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
