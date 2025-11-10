import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase';
import slugify from 'slugify';
import { renderClausesToHtml } from '@/lib/render';

type Body = {
  jurisdiction?: string;
  slug?: string;                  // blueprint slug (preferred)
  blueprint?: string;             // alias for slug
  title?: string;
  payload?: Record<string, any>;
};

// Make a nice base slug from a string
function toBaseSlug(input: string) {
  return slugify(input ?? '', { lower: true, strict: true }) || `doc-${Date.now()}`;
}

// Ensure documents.slug is unique by probing the table
async function ensureUniqueSlug(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  desired: string
): Promise<string> {
  let candidate = desired;
  for (let i = 0; i < 10000; i++) {
    const { data, error } = await supabase
      .from('documents')
      .select('id')
      .eq('slug', candidate)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return candidate; // free to use
    candidate = `${desired}-${i + 2}`;
  }
  throw new Error('Could not allocate unique slug');
}

export async function POST(req: Request) {
  try {
    // 1) Auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2) Parse body (don’t crash on bad JSON)
    let body: Body = {};
    try {
      body = await req.json();
    } catch {
      /* ignore; fallback to referer if needed */
    }

    // 3) Prefer body, but allow fallback to Referer (/preview/:jurisdiction/:slug)
    let jurisdiction = (body.jurisdiction ?? '').trim();
    let blueprintSlug = (body.slug ?? body.blueprint ?? '').trim();

    if (!jurisdiction || !blueprintSlug) {
      const referer = req.headers.get('referer') || '';
      try {
        const refUrl = new URL(referer || '', req.url); // robust even if referer missing
        const parts = refUrl.pathname.split('/').filter(Boolean);
        // expect: ["preview", "<jurisdiction>", "<slug>", ...]
        if (parts[0] === 'preview' && parts.length >= 3) {
          if (!jurisdiction) jurisdiction = parts[1];
          if (!blueprintSlug) blueprintSlug = parts[2];
        }
      } catch {
        /* ignore */
      }
    }

    if (!jurisdiction || !blueprintSlug) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing jurisdiction or slug',
          hint:
            'Send { jurisdiction, slug } in the body, or call from /preview/{jurisdiction}/{slug}.',
        },
        { status: 400 }
      );
    }

    const payload = body.payload ?? {};

    // 4) Try to load blueprint to render HTML (optional)
    const bpUrl = new URL(
      `/api/blueprints/${encodeURIComponent(jurisdiction)}/${encodeURIComponent(blueprintSlug)}`,
      req.url
    );

    let bp: { title?: string; clauses?: Array<{ id: string; title?: string; template: string }> } | null = null;
    try {
      const r = await fetch(bpUrl, { cache: 'no-store' });
      if (r.ok) bp = await r.json();
    } catch {
      /* ignore; we can still create the document without pre-rendered html */
    }

    const computedTitle = (body.title ?? bp?.title ?? blueprintSlug).trim();
    const base = toBaseSlug(computedTitle);

    // 5) DB insert with unique slug + required fields
    const supabase = await supabaseServer();
    const uniqueSlug = await ensureUniqueSlug(supabase, base);

    const now = new Date().toISOString();

    const preRenderedHtml =
      bp?.clauses?.length ? renderClausesToHtml(bp.clauses, payload) : null;

    const insertRow = {
      title: computedTitle || blueprintSlug,
      slug: uniqueSlug,            // unique per document
      jurisdiction,                // NOT NULL
      kind: 'contract',            // satisfies check constraint
      owner_id: userId,            // Clerk user id (text column)
      status: 'editable',
      locked_at: null,
      content: payload,            // wizard answers
      html: preRenderedHtml,       // optional pre-rendered HTML
      blueprint: blueprintSlug,    // which blueprint created this doc
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('documents')
      .insert([insertRow])
      .select('id, locked_at')
      .single();

    if (error) {
      // Common case: unique slug race — surface a clear message
      const isUniqueViolation =
        typeof error.message === 'string' &&
        /duplicate key value violates unique constraint|unique constraint/i.test(error.message);

      return NextResponse.json(
        {
          ok: false,
          error: isUniqueViolation
            ? 'A document with the same slug already exists. Please try again.'
            : error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: true, id: data.id, lockAt: data.locked_at },
      { status: 201 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
