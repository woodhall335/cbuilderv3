// src/app/(app)/dashboard/page.tsx
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase';
import { LocalDrafts, LocalDraftsCta } from '@/components/LocalDrafts';

const tableCell = 'py-2 pr-4';

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
      <main className="mx-auto max-w-7xl px-4 py-10">
        <header className="mb-6 space-y-2">
          <h1 className="text-3xl font-semibold text-neutral-900">Your documents</h1>
          <p className="text-sm text-neutral-600">
            Supabase keeps the definitive record of every document you generate while signed in.
          </p>
        </header>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load documents: {mineErr.message}
        </div>
        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Local drafts</h2>
          <p className="text-sm text-neutral-600">
            Drafts that you save from the wizard in this browser show here alongside your Supabase history.
          </p>
          <LocalDraftsCta />
          <LocalDrafts />
        </section>
      </main>
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
    <main className="mx-auto max-w-7xl space-y-12 px-4 py-10">
      <section className="space-y-3">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-neutral-900">Your documents</h1>
          <p className="text-sm text-neutral-600">
            Supabase keeps the definitive record of every document you generate while signed in.
          </p>
        </header>
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className={tableCell}>Title</th>
                <th className={tableCell}>Jurisdiction</th>
                <th className={tableCell}>Status</th>
                <th className={tableCell}>Lock</th>
                {debugFallback && <th className={tableCell}>Owner (debug)</th>}
                <th className={tableCell}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} className="border-b last:border-b-0">
                  <td className={tableCell}>{d.title ?? d.slug ?? d.id}</td>
                  <td className={`${tableCell} font-mono`}>{d.jurisdiction ?? '—'}</td>
                  <td className={tableCell}>{d.status ?? '—'}</td>
                  <td className={tableCell}>{d.locked_at ? new Date(d.locked_at).toLocaleString() : '—'}</td>
                  {debugFallback && (
                    <td className={`${tableCell} font-mono`}>{(d as Row).owner_id ?? '—'}</td>
                  )}
                  <td className={tableCell}>
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
        {debugFallback && (
          <p className="text-xs text-amber-700">
            Showing 3 most recent documents (debug view shows all owners if yours is empty). If you see your rows here but not
            in “Your Documents”, confirm each row’s <code>owner_id</code> equals your Clerk <code>userId</code>.
          </p>
        )}
      </section>

      <section className="space-y-4">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold text-neutral-900">Local drafts</h2>
          <p className="text-sm text-neutral-600">
            Drafts that you save from the wizard in this browser show here alongside your Supabase history.
          </p>
        </header>
        <LocalDraftsCta />
        <LocalDrafts />
      </section>
    </main>
  );
}
