// src/app/api/documents/[id]/update/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

type PatchBody = {
  content?: Record<string, any> | null;
  html?: string | null;
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Require auth (optional but recommended)
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Parse body safely
  let body: PatchBody = {};
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    // allow empty body -> will fail validation below
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.content !== undefined) updates.content = body.content;
  if (body.html !== undefined) updates.html = body.html;

  if (!('content' in updates) && !('html' in updates)) {
    return NextResponse.json({ ok: false, error: 'Nothing to update' }, { status: 400 });
  }

  const supabase = await supabaseServer(); // <-- IMPORTANT: await

  // Optional: ensure the doc exists (and belongs to this user)
  const { data: doc, error: readErr } = await supabase
    .from('documents')
    .select('id, owner_id')
    .eq('id', id)
    .maybeSingle();

  if (readErr) {
    return NextResponse.json({ ok: false, error: readErr.message }, { status: 500 });
  }
  if (!doc) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  if (doc.owner_id && doc.owner_id !== userId) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: `Update failed: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data!.id });
}
